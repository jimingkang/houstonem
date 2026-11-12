import { createHash, randomUUID } from 'node:crypto';
import { SERVICES } from '../src/app/data/site.data.ts';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from '../src/app/data/service-pricing.ts';
import { transaction } from './transactions.mjs';
import { customerOrders } from './orders.mjs';

export async function submitServiceOrder(req, json, db, user) {
  if (!user) return json(401, { error: 'Please sign in to order a laboratory service.' });
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 12000) return json(413, { error: 'Order request is too large.' });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'Invalid order request.' }); }
  const service = SERVICES.find(entry => entry.slug === body?.service);
  const price = service && SERVICE_PRICING[service.slug];
  if (!price || price.startingUsd === null) return json(400, { error: 'This service is not available as a standalone order.' });
  const { requestId, quantity } = body;
  if (typeof requestId !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(requestId)) return json(400, { error: 'Invalid order reference.' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > (price.unit === 'sample' ? MAX_QUOTE_SAMPLES : 1)) return json(400, { error: 'Invalid service quantity.' });
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Enter a valid contact email.' });
  if (notes.length < 10 || notes.length > 1500) return json(400, { error: 'Describe your samples and testing needs in 10–1,500 characters.' });
  const requestHash = createHash('sha256').update(JSON.stringify({ service: service.slug, quantity, email, notes })).digest('hex');
  const cents = price.startingUsd * 100;
  const result = await transaction(db, async tx => {
    const proposedId = 'HEM-' + randomUUID();
    const inserted = await tx.prepare(`INSERT INTO orders(id,customer_id,request_id,request_hash,subtotal_cents,shipping_name,shipping_email,shipping_address,notes,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(customer_id,request_id) DO NOTHING RETURNING id`)
      .get(proposedId,user.id,requestId,requestHash,cents*quantity,user.name,email,'',notes,new Date().toISOString());
    if (!inserted) {
      const existing = await tx.prepare('SELECT id,request_hash FROM orders WHERE customer_id=? AND request_id=?').get(user.id,requestId);
      return existing?.request_hash === requestHash ? { id: existing.id, status: 200 } : { status: 409 };
    }
    await tx.prepare('INSERT INTO service_order_items(order_id,service_slug,name,quantity,unit,price_cents) VALUES(?,?,?,?,?,?)')
      .run(proposedId,service.slug,service.title,quantity,price.unit,cents);
    return { id: proposedId, status: 201 };
  });
  if (result.status === 409) return json(409,{error:'This order reference has already been used.'});
  return json(result.status,{order:(await customerOrders(db,user.id,result.id))[0]});
}
