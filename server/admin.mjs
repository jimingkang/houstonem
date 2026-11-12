import { orderItems } from './orders.mjs';

const PAGE_SIZE = 25;

export function serveAdmin(req, json, db, user, url, asCustomer) {
  if (!user) return json(401, { error: 'Sign in to access administration.' });
  if (!user.isAdmin) return json(403, { error: 'Administrator access is required.' });
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed.' });

  const params = url.searchParams;
  const requested = Number(params.get('page') || '1');
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 1_000_000) : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const search = (params.get('q') || '').trim().slice(0, 120).toLowerCase();

  if (url.pathname === '/api/admin/customers') {
    const where = "WHERE instr(lower(c.name || ' ' || c.email || ' ' || c.company || ' ' || c.id), ?) > 0";
    const { total } = db.prepare('SELECT count(*) AS total FROM customers c ' + where).get(search);
    const customers = db.prepare(`SELECT c.id,c.name,c.email,c.company,
      EXISTS(SELECT 1 FROM administrators a WHERE a.customer_id=c.id) AS isAdmin,
      (SELECT count(*) FROM orders o WHERE o.customer_id=c.id) AS order_count
      FROM customers c ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`).all(search, PAGE_SIZE, offset);
    return json(200, { customers: customers.map(asCustomer), total, page, pageSize: PAGE_SIZE });
  }

  if (url.pathname === '/api/admin/orders') {
    const filter = params.get('customerId');
    const customerId = filter === null ? null : Number(filter);
    if (customerId !== null && (!Number.isSafeInteger(customerId) || customerId < 1)) return json(400, { error: 'Invalid customer ID.' });
    const from = `FROM orders o JOIN customers c ON c.id=o.customer_id
      WHERE (? IS NULL OR o.customer_id=?) AND
      instr(lower(o.id || ' ' || o.shipping_email || ' ' || c.name || ' ' || c.email || ' ' || o.status), ?) > 0`;
    const bindings = [customerId, customerId, search];
    const { total } = db.prepare('SELECT count(*) AS total ' + from).get(...bindings);
    const orders = db.prepare(`SELECT o.id,o.customer_id,o.status,o.created_at,o.subtotal_cents,o.currency,
      o.shipping_name,o.shipping_email,o.shipping_address,o.notes,
      c.name AS customer_name,c.email AS customer_email ${from}
      ORDER BY o.created_at DESC,o.id DESC LIMIT ? OFFSET ?`).all(...bindings, PAGE_SIZE, offset);
    return json(200, { orders: orders.map(order => {
      const { customer_name, customer_email, ...details } = order;
      return { ...details, customer_name: asCustomer({ name: customer_name, email: customer_email }).name, items: orderItems(db, order.id) };
    }), total, page, pageSize: PAGE_SIZE });
  }

  return json(404, { error: 'Not found.' });
}
