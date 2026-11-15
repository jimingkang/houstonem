import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, addCustomer } from './db.mjs';
import { updateOrderStatus } from './orders.mjs';
import { createPayPalProvider } from './payments.mjs';
import { createPortalServer } from './index.mjs';

// A stand-in for api-m.sandbox.paypal.com that keeps orders in memory.
function fakePayPal() {
  const orders = new Map();
  const calls = [];
  let captures = 0;
  const signatures = new Set(['good-signature']);
  const view = order => ({ ...order, purchase_units: [{ ...order.unit, payments: order.capture ? { captures: [order.capture] } : undefined }] });
  const fetchImpl = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, init });
    if (path === '/v1/oauth2/token') {
      assert.equal(init.headers.Authorization, 'Basic ' + Buffer.from('client:secret').toString('base64'));
      return Response.json({ access_token: 'token-1', expires_in: 32400 });
    }
    assert.equal(init.headers.Authorization, 'Bearer token-1');
    if (init.method === 'POST' && path === '/v2/checkout/orders') {
      const body = JSON.parse(init.body);
      const id = 'PP' + (orders.size + 1);
      orders.set(id, { id, status: 'PAYER_ACTION_REQUIRED', unit: body.purchase_units[0], body, links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.test/checkoutnow?token=' + id }] });
      return Response.json(view(orders.get(id)));
    }
    if (path === '/v1/notifications/verify-webhook-signature') {
      return Response.json({ verification_status: signatures.has(JSON.parse(init.body).transmission_sig) ? 'SUCCESS' : 'FAILURE' });
    }
    const capture = /^\/v2\/checkout\/orders\/([^/]+)\/capture$/.exec(path);
    if (capture && orders.has(capture[1])) {
      const order = orders.get(capture[1]);
      if (order.status === 'COMPLETED') return Response.json({ name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] }, { status: 422 });
      if (order.status !== 'APPROVED') return Response.json({ details: [{ issue: 'ORDER_NOT_APPROVED' }] }, { status: 422 });
      captures++;
      Object.assign(order, { status: 'COMPLETED', capture: { id: 'CAP-' + order.id, status: 'COMPLETED', amount: order.unit.amount } });
      return Response.json(view(order), { status: 201 });
    }
    const get = /^\/v2\/checkout\/orders\/([^/]+)$/.exec(path);
    if (init.method === 'GET' && get && orders.has(get[1])) return Response.json(view(orders.get(get[1])));
    return Response.json({ name: 'RESOURCE_NOT_FOUND' }, { status: 404 });
  };
  return {
    orders, calls, captures: () => captures,
    approve: id => { orders.get(id).status = 'APPROVED'; },
    provider: createPayPalProvider({ clientId: 'client', clientSecret: 'secret', webhookId: 'WH-1', fetchImpl }),
  };
}

test('customers pay confirmed orders with PayPal; capture and webhooks mark them paid once', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-payments-'));
  const db = openDatabase(dir);
  addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  addCustomer(db, 'other@example.com', 'other-password-123', 'Other', 'Other Inc');
  const paypal = fakePayPal();
  const server = createPortalServer(db, { payments: paypal.provider });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  const signIn = async (email, password) => (await post('/api/login', { email, password })).headers.get('set-cookie').split(';')[0];
  const portal = async cookie => (await fetch(base + '/api/portal', { headers: { Cookie: cookie } })).json();
  const placeOrder = async cookie => (await (await post('/api/service-orders', { requestId: randomUUID(), service: 'eds', quantity: 2, email: 'buyer@example.com', notes: 'Two polished samples for EDS mapping.' }, cookie)).json()).order;
  const webhook = (event, sig = 'good-signature') => post('/api/payments/paypal/webhook', event, null, {
    'PayPal-Auth-Algo': 'SHA256withRSA', 'PayPal-Cert-Url': 'https://api.sandbox.paypal.com/cert', 'PayPal-Transmission-Id': 't1', 'PayPal-Transmission-Sig': sig, 'PayPal-Transmission-Time': new Date().toISOString(),
  });
  try {
    const buyer = await signIn('buyer@example.com', 'buyer-password-123');
    const other = await signIn('other@example.com', 'other-password-123');
    assert.equal((await portal(buyer)).onlinePayment, true);
    const order = await placeOrder(buyer);
    const checkout = `/api/orders/${order.id}/checkout`;

    assert.equal((await post(checkout, {})).status, 401);
    assert.equal((await post(checkout, {}, buyer)).status, 409, 'unconfirmed orders cannot be paid');
    await assert.rejects(updateOrderStatus(db, order.id, 'Confirmed - awaiting payment', { amountCents: 0 }));
    await updateOrderStatus(db, order.id, 'Confirmed - awaiting payment', { amountCents: 61234 });
    const confirmed = (await portal(buyer)).orders.find(o => o.id === order.id);
    assert.equal(confirmed.amount_due_cents, 61234);
    assert.equal(confirmed.payment_status, 'due');

    assert.equal((await post(checkout, {}, other)).status, 404, 'another customer cannot pay this order');
    assert.equal((await post(checkout, {}, buyer, { Origin: 'https://elsewhere.example' })).status, 403);
    const started = await post(checkout, {}, buyer, { Origin: base });
    assert.equal(started.status, 200);
    const { url } = await started.json();
    assert.equal(url, 'https://www.sandbox.paypal.test/checkoutnow?token=PP1');
    const sent = paypal.orders.get('PP1').body;
    assert.deepEqual(sent.purchase_units[0].amount, { currency_code: 'USD', value: '612.34' });
    assert.equal(sent.purchase_units[0].custom_id, order.id);
    assert.equal(sent.payment_source.paypal.experience_context.return_url, `${base}/portal?payment=success&order=${order.id}`);
    assert.equal((await (await post(checkout, {}, buyer)).json()).url, url, 'an open checkout is reused');
    assert.equal(paypal.orders.size, 1);
    assert.equal(paypal.calls.filter(c => c.path === '/v1/oauth2/token').length, 1, 'the access token is cached');

    // Returning before approval changes nothing; after approval the server captures exactly once.
    assert.equal((await (await post(`/api/orders/${order.id}/payment/refresh`, {}, buyer)).json()).order.status, 'Confirmed - awaiting payment');
    paypal.approve('PP1');
    assert.equal((await post(`/api/orders/${order.id}/payment/refresh`, {}, other)).status, 404);
    const [a, b] = await Promise.all([1, 2].map(() => post(`/api/orders/${order.id}/payment/refresh`, {}, buyer).then(r => r.json())));
    assert.equal(a.order.status, 'Paid');
    assert.equal(b.order.status, 'Paid');
    assert.equal(paypal.captures(), 1);
    const settled = (await portal(buyer)).orders.find(o => o.id === order.id);
    assert.equal(settled.payment_status, 'paid');
    assert.ok(settled.paid_at);
    assert.equal(db.prepare('SELECT payment_reference FROM order_payments WHERE order_id=?').get(order.id).payment_reference, 'CAP-PP1');
    assert.equal((await post(checkout, {}, buyer)).status, 409);
    await updateOrderStatus(db, order.id, 'Fulfilled');
    await assert.rejects(updateOrderStatus(db, order.id, 'Cancelled'));

    // If the buyer never returns, the verified webhook captures and records the payment.
    const second = await placeOrder(buyer);
    await updateOrderStatus(db, second.id, 'Confirmed - awaiting payment');
    await post(`/api/orders/${second.id}/checkout`, {}, buyer);
    paypal.approve('PP2');
    const approved = { id: 'WH-EVT', event_type: 'CHECKOUT.ORDER.APPROVED', resource: { id: 'PP2' } };
    assert.equal((await webhook(approved, 'forged')).status, 400);
    assert.equal((await webhook({ ...approved, resource: { id: 'PP-unknown' } })).status, 502, 'PayPal retries when the order cannot be read');
    assert.equal((await portal(buyer)).orders.find(o => o.id === second.id).status, 'Confirmed - awaiting payment');
    assert.equal((await webhook(approved)).status, 200);
    assert.equal((await webhook({ event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAP-PP2', supplementary_data: { related_ids: { order_id: 'PP2' } } } })).status, 200, 'duplicate notifications are harmless');
    const viaWebhook = (await portal(buyer)).orders.find(o => o.id === second.id);
    assert.equal(viaWebhook.status, 'Paid');
    assert.equal(viaWebhook.amount_due_cents, 50000, 'the estimate is due when the lab confirms without a new total');
    assert.equal(paypal.captures(), 2);

    // A payment whose amount differs from the confirmed total is not accepted.
    const third = await placeOrder(buyer);
    await updateOrderStatus(db, third.id, 'Confirmed - awaiting payment');
    await post(`/api/orders/${third.id}/checkout`, {}, buyer);
    paypal.orders.get('PP3').unit.amount.value = '1.00';
    paypal.approve('PP3');
    assert.equal((await (await post(`/api/orders/${third.id}/payment/refresh`, {}, buyer)).json()).order.status, 'Confirmed - awaiting payment');

    // Payments received offline can be recorded by staff.
    const fourth = await placeOrder(buyer);
    await updateOrderStatus(db, fourth.id, 'Confirmed - awaiting payment');
    await updateOrderStatus(db, fourth.id, 'Paid');
    assert.deepEqual({ ...db.prepare('SELECT status,provider FROM order_payments WHERE order_id=?').get(fourth.id) }, { status: 'paid', provider: 'manual' });
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true });
  }
});

test('checkout explains when online payment is not configured', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-payments-off-'));
  const db = openDatabase(dir);
  addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  const server = createPortalServer(db, { payments: null });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    const cookie = (await post('/api/login', { email: 'buyer@example.com', password: 'buyer-password-123' })).headers.get('set-cookie').split(';')[0];
    assert.equal((await (await fetch(base + '/api/portal', { headers: { Cookie: cookie } })).json()).onlinePayment, false);
    const order = (await (await post('/api/service-orders', { requestId: randomUUID(), service: 'eds', quantity: 1, email: 'buyer@example.com', notes: 'One sample for elemental analysis.' }, cookie)).json()).order;
    await updateOrderStatus(db, order.id, 'Confirmed - awaiting payment');
    assert.equal((await post(`/api/orders/${order.id}/checkout`, {}, cookie)).status, 503);
    assert.equal((await post('/api/payments/paypal/webhook', {})).status, 503);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true });
  }
});

test('one order holds several services, priced from the catalog, and old single-service tables migrate', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-multi-'));
  const { DatabaseSync } = await import('node:sqlite');
  const legacy = new DatabaseSync(join(dir, 'portal.sqlite'));
  legacy.exec(`CREATE TABLE customers(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, company TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
    CREATE TABLE orders(id TEXT PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),request_id TEXT NOT NULL,request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Awaiting lab confirmation', subtotal_cents INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'USD',
    shipping_name TEXT NOT NULL,shipping_email TEXT NOT NULL,shipping_address TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL, UNIQUE(customer_id,request_id));
    CREATE TABLE service_order_items(order_id TEXT PRIMARY KEY REFERENCES orders(id),service_slug TEXT NOT NULL,name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity>0),unit TEXT NOT NULL CHECK(unit IN ('sample','project')),price_cents INTEGER NOT NULL CHECK(price_cents>=0));
    INSERT INTO customers VALUES(1,'old@example.com','Old','','s','h');
    INSERT INTO orders VALUES('HEM-old',1,'r','h','Awaiting lab confirmation',25000,'USD','Old','old@example.com','','notes','2026-01-01');
    INSERT INTO service_order_items VALUES('HEM-old','eds','EDS',1,'sample',25000);`);
  legacy.close();
  const db = openDatabase(dir);
  assert.deepEqual(db.prepare('PRAGMA table_info(service_order_items)').all().filter(c => c.pk).map(c => c.name), ['order_id', 'service_slug']);
  assert.equal(db.prepare("SELECT service_slug FROM service_order_items WHERE order_id='HEM-old'").get().service_slug, 'eds');
  addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  const server = createPortalServer(db, { payments: null });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  try {
    const cookie = (await post('/api/login', { email: 'buyer@example.com', password: 'buyer-password-123' })).headers.get('set-cookie').split(';')[0];
    const body = { requestId: randomUUID(), email: 'buyer@example.com', notes: 'Coupons for imaging, EDS and failure review.', items: [{ service: 'sem', quantity: 2 }, { service: 'eds', quantity: 1 }, { service: 'failure-analysis', quantity: 1, price_cents: 1 }] };
    for (const items of [[], [{ service: 'sem', quantity: 1 }, { service: 'sem', quantity: 2 }], [{ service: 'sem', quantity: 1 }, { service: 'gold-sputtering', quantity: 1 }], [{ service: 'failure-analysis', quantity: 2 }], Array.from({ length: 11 }, () => ({ service: 'sem', quantity: 1 }))]) {
      assert.equal((await post('/api/service-orders', { ...body, requestId: randomUUID(), items }, cookie)).status, 400);
    }
    const created = await post('/api/service-orders', body, cookie);
    assert.equal(created.status, 201);
    const { order } = await created.json();
    assert.equal(order.subtotal_cents, 2 * 17500 + 25000 + 75000);
    assert.deepEqual(order.items.map(item => [item.sku, item.quantity, item.price_cents]).sort(), [['eds', 1, 25000], ['failure-analysis', 1, 75000], ['sem', 2, 17500]]);
    assert.equal((await post('/api/service-orders', body, cookie)).status, 200, 'an identical retry returns the same order');
    assert.equal((await post('/api/service-orders', { ...body, items: body.items.slice(0, 2) }, cookie)).status, 409);
    await updateOrderStatus(db, order.id, 'Confirmed - awaiting payment');
    assert.equal(db.prepare('SELECT amount_cents FROM order_payments WHERE order_id=?').get(order.id).amount_cents, 135000, 'payment covers every service in the order');
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true });
  }
});
