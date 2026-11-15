import { randomUUID } from 'node:crypto';
import { SERVICES } from '../src/app/data/site.data.ts';
import { SERVICE_PRICING, MAX_QUOTE_SAMPLES } from '../src/app/data/service-pricing.ts';
import { transaction } from './transactions.mjs';
import { MAX_ORDER_CENTS, orderItems } from './orders.mjs';

// Every order status, in lifecycle order. Transitions between them live in updateOrderStatus (orders.mjs).
export const ORDER_STATUSES = ['Awaiting lab confirmation', 'Confirmed - awaiting payment', 'Paid', 'Fulfilled', 'Cancelled'];
export const EDITABLE_ITEMS_STATUS = 'Awaiting lab confirmation';

export const adminOrderPath = /^\/api\/admin\/orders\/([a-zA-Z0-9_-]{1,100})$/;
export const adminOrderDeletePath = /^\/api\/admin\/orders\/([a-zA-Z0-9_-]{1,100})\/delete$/;

export class OrderInputError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function text(value, label, max, { required = true, min = required ? 1 : 0 } = {}) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length < min || normalized.length > max) {
    throw new OrderInputError(400, required ? `Enter ${label} (${min}–${max} characters).` : `${label} must be at most ${max} characters.`);
  }
  return normalized;
}

function email(value) {
  const normalized = text(value, 'a contact email', 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new OrderInputError(400, 'Enter a valid contact email.');
  return normalized;
}

function cents(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_ORDER_CENTS) throw new OrderInputError(400, `Enter ${label} between $0 and $1,000,000.`);
  return value;
}

function quantityFor(unit, value) {
  const max = unit === 'sample' ? MAX_QUOTE_SAMPLES : 1;
  if (!Number.isInteger(value) || value < 1 || value > max) throw new OrderInputError(400, `Enter a quantity from 1 to ${max}.`);
  return value;
}

export async function adminOrder(db, id) {
  const order = await db.prepare(`SELECT o.id,o.customer_id,o.status,o.created_at,o.subtotal_cents,o.currency,
    o.shipping_name,o.shipping_email,o.shipping_address,o.notes,
    p.amount_cents AS amount_due_cents,p.status AS payment_status,p.provider AS payment_provider,p.payment_reference,p.paid_at,
    c.name AS customer_name,c.email AS customer_email
    FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN order_payments p ON p.order_id=o.id WHERE o.id=?`).get(id);
  if (!order) return null;
  const services = await db.prepare('SELECT service_slug,name,quantity,unit,price_cents FROM service_order_items WHERE order_id=? ORDER BY name').all(id);
  return { ...order, services, items: await orderItems(db, id) };
}

const MAX_LINES = 20;

// Validates service lines: [{ service, quantity, unitPriceCents? }]. Omitted prices use the catalog starting rate.
function serviceLines(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_LINES) throw new OrderInputError(400, `Add 1–${MAX_LINES} laboratory services.`);
  const seen = new Set();
  return items.map(item => {
    const service = SERVICES.find(entry => entry.slug === item?.service);
    const pricing = service && SERVICE_PRICING[service.slug];
    if (!pricing) throw new OrderInputError(400, 'Choose a laboratory service for every line.');
    if (seen.has(service.slug)) throw new OrderInputError(400, `${service.title} is listed twice; combine it into one line.`);
    seen.add(service.slug);
    const quantity = quantityFor(pricing.unit, item.quantity);
    const priceCents = item.unitPriceCents === undefined || item.unitPriceCents === null
      ? (pricing.startingUsd ?? 0) * 100 : cents(item.unitPriceCents, 'a unit price');
    return { slug: service.slug, name: service.title, unit: pricing.unit, quantity, priceCents };
  });
}

async function writeServiceLines(tx, id, lines) {
  await tx.prepare('DELETE FROM service_order_items WHERE order_id=?').run(id);
  for (const line of lines) {
    await tx.prepare('INSERT INTO service_order_items(order_id,service_slug,name,quantity,unit,price_cents) VALUES(?,?,?,?,?,?)')
      .run(id, line.slug, line.name, line.quantity, line.unit, line.priceCents);
  }
  const products = await tx.prepare('SELECT CAST(COALESCE(sum(quantity*price_cents),0) AS INTEGER) AS total FROM order_items WHERE order_id=?').get(id);
  const subtotal = Number(products.total) + lines.reduce((sum, line) => sum + line.quantity * line.priceCents, 0);
  if (subtotal > MAX_ORDER_CENTS) throw new OrderInputError(400, 'The order total must be at most $1,000,000.');
  return subtotal;
}

// Staff-created orders hold one or more laboratory service lines, with optional negotiated unit prices.
// They start awaiting lab confirmation, like customer orders.
export async function createAdminOrder(db, body) {
  const customerId = Number(body?.customerId);
  if (!Number.isSafeInteger(customerId) || customerId < 1) throw new OrderInputError(400, 'Choose a customer.');
  const lines = serviceLines(body.items);
  const contactEmail = email(body.shipping_email);
  const address = text(body.shipping_address, 'Shipping address', 500, { required: false });
  const notes = text(body.notes, 'Order notes', 1500, { required: false });
  return transaction(db, async tx => {
    const customer = await tx.prepare('SELECT id,name FROM customers WHERE id=?').get(customerId);
    if (!customer) throw new OrderInputError(404, 'Customer not found.');
    const name = body.shipping_name === undefined || body.shipping_name === '' ? customer.name : text(body.shipping_name, 'a contact name', 150);
    const id = 'HEM-' + randomUUID();
    await tx.prepare(`INSERT INTO orders(id,customer_id,request_id,request_hash,subtotal_cents,shipping_name,shipping_email,shipping_address,notes,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run(id, customerId, 'admin-' + randomUUID(), 'admin-created', 0, name, contactEmail, address, notes, new Date().toISOString());
    const subtotal = await writeServiceLines(tx, id, lines);
    await tx.prepare('UPDATE orders SET subtotal_cents=? WHERE id=?').run(subtotal, id);
    return id;
  });
}

// Contact details and notes can change at any time. Service lines can change only before the lab
// confirms the order, because confirmation fixes the amount due. items replaces all service lines.
export async function updateAdminOrder(db, id, body) {
  const changes = {};
  if (body?.shipping_name !== undefined) changes.shipping_name = text(body.shipping_name, 'a contact name', 150);
  if (body?.shipping_email !== undefined) changes.shipping_email = email(body.shipping_email);
  if (body?.shipping_address !== undefined) changes.shipping_address = text(body.shipping_address, 'Shipping address', 500, { required: false });
  if (body?.notes !== undefined) changes.notes = text(body.notes, 'Order notes', 1500, { required: false });
  const lines = body?.items === undefined ? null : serviceLines(body.items);
  return transaction(db, async tx => {
    const lock = tx.dialect === 'postgres' ? ' FOR UPDATE' : '';
    const order = await tx.prepare('SELECT status FROM orders WHERE id=?' + lock).get(id);
    if (!order) throw new OrderInputError(404, 'Order not found.');
    if (lines) {
      if (order.status !== EDITABLE_ITEMS_STATUS) throw new OrderInputError(409, 'Services and prices can change only while the order awaits lab confirmation.');
      changes.subtotal_cents = await writeServiceLines(tx, id, lines);
    }
    const columns = Object.keys(changes);
    if (columns.length) await tx.prepare(`UPDATE orders SET ${columns.map(column => column + '=?').join(',')} WHERE id=?`).run(...Object.values(changes), id);
  });
}

// Removes an order and its lines. Paid orders are kept as financial records: cancel or fulfil them instead.
// Stock reserved by catalog items returns to inventory unless the order was already cancelled (which restocked it)
// or fulfilled (the goods left the lab).
export async function deleteAdminOrder(db, id) {
  return transaction(db, async tx => {
    const lock = tx.dialect === 'postgres' ? ' FOR UPDATE' : '';
    const order = await tx.prepare('SELECT status FROM orders WHERE id=?' + lock).get(id);
    if (!order) throw new OrderInputError(404, 'Order not found.');
    const payment = await tx.prepare('SELECT status FROM order_payments WHERE order_id=?').get(id);
    if (order.status === 'Paid' || payment?.status === 'paid') throw new OrderInputError(409, 'Paid orders cannot be deleted. Mark the order Fulfilled instead.');
    if (!['Cancelled', 'Fulfilled'].includes(order.status)) {
      const items = await tx.prepare('SELECT product_id,quantity FROM order_items WHERE order_id=?').all(id);
      for (const item of items) await tx.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(item.quantity, item.product_id);
    }
    await tx.prepare('DELETE FROM order_payments WHERE order_id=?').run(id);
    await tx.prepare('DELETE FROM order_items WHERE order_id=?').run(id);
    await tx.prepare('DELETE FROM service_order_items WHERE order_id=?').run(id);
    await tx.prepare('DELETE FROM orders WHERE id=?').run(id);
  });
}
