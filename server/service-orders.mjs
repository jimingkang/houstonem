import { createHash, randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { SERVICES } from '../src/app/data/site.data.ts';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from '../src/app/data/service-pricing.ts';
import { transaction } from './transactions.mjs';
import { customerOrders } from './orders.mjs';

const derive = promisify(scrypt);
const EMAIL_TAKEN = 'An account already uses this email. Sign in to the Client Portal to request a quote.';

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
  // A guest's quote request turns their temporary guest login into a real Client
  // Portal account under the contact email, so they can sign in later to follow it.
  let account = null;
  if (user.guest) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (name.length < 1 || name.length > 120) return json(400, { error: 'Enter your name.' });
    if (company.length > 160) return json(400, { error: 'Company name is too long.' });
    if (password.length < 8 || password.length > 256) return json(400, { error: 'Choose a password of at least 8 characters.' });
    const salt = randomBytes(16).toString('hex');
    account = { email: email.toLowerCase(), name, company, salt, passwordHash: (await derive(password, salt, 64)).toString('hex') };
  }
  const requestHash = createHash('sha256').update(JSON.stringify({ service: service.slug, quantity, email, notes })).digest('hex');
  const cents = price.startingUsd * 100;
  let result;
  try {
    result = await transaction(db, async tx => {
      if (account) {
        if (await tx.prepare('SELECT id FROM customers WHERE email=? AND id<>?').get(account.email, user.id)) return { status: 'email-taken' };
        await tx.prepare('UPDATE customers SET email=?,name=?,company=?,salt=?,password_hash=? WHERE id=?')
          .run(account.email, account.name, account.company, account.salt, account.passwordHash, user.id);
      }
      const proposedId = 'HEM-' + randomUUID();
      const inserted = await tx.prepare(`INSERT INTO orders(id,customer_id,request_id,request_hash,subtotal_cents,shipping_name,shipping_email,shipping_address,notes,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(customer_id,request_id) DO NOTHING RETURNING id`)
        .get(proposedId,user.id,requestId,requestHash,cents*quantity,account ? account.name : user.name,email,'',notes,new Date().toISOString());
      if (!inserted) {
        const existing = await tx.prepare('SELECT id,request_hash FROM orders WHERE customer_id=? AND request_id=?').get(user.id,requestId);
        return existing?.request_hash === requestHash ? { id: existing.id, status: 200 } : { status: 409 };
      }
      await tx.prepare('INSERT INTO service_order_items(order_id,service_slug,name,quantity,unit,price_cents) VALUES(?,?,?,?,?,?)')
        .run(proposedId,service.slug,service.title,quantity,price.unit,cents);
      return { id: proposedId, status: 201 };
    });
  } catch (error) {
    // Two requests racing for the same email: the UNIQUE constraint decides.
    if (account && /unique|23505/i.test(`${error?.code} ${error?.message}`)) return json(409, { error: EMAIL_TAKEN });
    throw error;
  }
  if (result.status === 'email-taken') return json(409, { error: EMAIL_TAKEN });
  if (result.status === 409) return json(409,{error:'This order reference has already been used.'});
  const order = (await customerOrders(db,user.id,result.id))[0];
  return json(result.status, account ? { order, account: { email: account.email, name: account.name, company: account.company } } : { order });
}
