import { createHash, randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { SERVICES } from '../src/app/data/site.data.ts';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from '../src/app/data/service-pricing.ts';
import { transaction } from './transactions.mjs';
import { customerOrders } from './orders.mjs';

const derive = promisify(scrypt);
const EMAIL_TAKEN = 'An account already uses this email. Sign in to the Client Portal to request a quote.';

/**
 * Quote requests. A visitor without an account can tick "create an account" and
 * choose a password: that creates their Client Portal account and signs them in.
 * Otherwise the request is filed under a contact record that cannot sign in (its
 * email is a placeholder; the real one stays on the request), so nobody can later
 * claim those requests by typing the same email. Ordering a quoted service always
 * happens from a signed-in Client Portal account.
 */
export const INQUIRY_EMAIL = /^inquiry-[a-f0-9]{32}@inquiry\.invalid$/;
export async function submitServiceOrder(req, json, db, user, { allowSignup = () => true, startSession = async () => {}, clearSession = () => {} } = {}) {
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
  let account = null;
  if (!user) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const createAccount = body.createAccount === true;
    const password = typeof body.password === 'string' ? body.password : '';
    if (name.length < 1 || name.length > 120) return json(400, { error: 'Enter your name.' });
    if (company.length > 160) return json(400, { error: 'Company name is too long.' });
    if (createAccount && (password.length < 8 || password.length > 256)) return json(400, { error: 'Choose a password of at least 8 characters.' });
    if (!allowSignup()) return json(429, { error: 'Too many requests from this network. Please try again later or sign in.' });
    const salt = randomBytes(16).toString('hex');
    account = {
      createAccount,
      email: createAccount ? email.toLowerCase() : `inquiry-${randomBytes(16).toString('hex')}@inquiry.invalid`,
      name, company, salt,
      passwordHash: (await derive(createAccount ? password : randomBytes(32).toString('hex'), salt, 64)).toString('hex'),
    };
  }
  const requestHash = createHash('sha256').update(JSON.stringify({ service: service.slug, quantity, email, notes })).digest('hex');
  const cents = price.startingUsd * 100;
  let result;
  try {
    result = await transaction(db, async tx => {
      let customerId = user?.id;
      if (account && !account.createAccount) {
        // A retried request without an account reuses the contact record it created.
        const earlier = await tx.prepare(`SELECT o.id,o.customer_id FROM orders o JOIN customers c ON c.id=o.customer_id
          WHERE o.request_id=? AND o.request_hash=? AND c.email LIKE 'inquiry-%@inquiry.invalid'`).get(requestId, requestHash);
        if (earlier) return { id: earlier.id, customerId: earlier.customer_id, status: 200 };
      }
      if (account) {
        if (account.createAccount && await tx.prepare('SELECT id FROM customers WHERE email=?').get(account.email)) return { status: 'email-taken' };
        const created = await tx.prepare('INSERT INTO customers(email,name,company,salt,password_hash) VALUES(?,?,?,?,?) RETURNING id')
          .get(account.email, account.name, account.company, account.salt, account.passwordHash);
        customerId = Number(created.id);
        if (account.createAccount) await startSession(customerId, tx);
      }
      const proposedId = 'HEM-' + randomUUID();
      const inserted = await tx.prepare(`INSERT INTO orders(id,customer_id,request_id,request_hash,subtotal_cents,shipping_name,shipping_email,shipping_address,notes,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(customer_id,request_id) DO NOTHING RETURNING id`)
        .get(proposedId,customerId,requestId,requestHash,cents*quantity,account ? account.name : user.name,email,'',notes,new Date().toISOString());
      if (!inserted) {
        const existing = await tx.prepare('SELECT id,request_hash FROM orders WHERE customer_id=? AND request_id=?').get(customerId,requestId);
        return existing?.request_hash === requestHash ? { id: existing.id, customerId, status: 200 } : { status: 409 };
      }
      await tx.prepare('INSERT INTO service_order_items(order_id,service_slug,name,quantity,unit,price_cents) VALUES(?,?,?,?,?,?)')
        .run(proposedId,service.slug,service.title,quantity,price.unit,cents);
      return { id: proposedId, customerId, status: 201 };
    });
  } catch (error) {
    if (account?.createAccount) clearSession();
    // Two requests racing for the same email: the UNIQUE constraint decides.
    if (account?.createAccount && /unique|23505/i.test(`${error?.code} ${error?.message}`)) return json(409, { error: EMAIL_TAKEN });
    throw error;
  }
  if (result.status === 'email-taken') return json(409, { error: EMAIL_TAKEN });
  if (result.status === 409) return json(409,{error:'This order reference has already been used.'});
  const order = (await customerOrders(db,result.customerId,result.id))[0];
  return json(result.status, account?.createAccount ? { order, account: { email: account.email, name: account.name, company: account.company } } : { order });
}
