import { mutateAdmin } from './admin-actions.mjs';
import { customerOrders, orderItems } from './orders.mjs';

const PAGE_SIZE = 25;

export async function serveAdmin(req, res, json, db, user, url, asCustomer) {
  if (!user) return json(401, { error: 'Sign in to access administration.' });
  if (!user.isAdmin) return json(403, { error: 'Administrator access is required.' });
  if (req.method === 'POST') return mutateAdmin(req, json, db, url.pathname);
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed.' });

  const detail = /^\/api\/admin\/customers\/(\d+)$/.exec(url.pathname);
  if (detail) {
    const id = Number(detail[1]);
    if (!Number.isSafeInteger(id)) return json(404, { error: 'Customer not found.' });
    const customer = await db.prepare(`SELECT c.id,c.name,c.email,c.company,
      EXISTS(SELECT 1 FROM administrators a WHERE a.customer_id=c.id) AS "isAdmin"
      FROM customers c WHERE c.id=?`).get(id);
    if (!customer) return json(404, { error: 'Customer not found.' });
    return json(200, {
      customer: asCustomer(customer),
      subscriptions: await db.prepare('SELECT id,service,plan,status,renewal_date FROM subscriptions WHERE customer_id=? ORDER BY id DESC').all(id),
      reports: await db.prepare('SELECT id,title,sample_id,analysis,status,issued_at,filename,content IS NOT NULL AS has_file FROM reports WHERE customer_id=? ORDER BY id DESC').all(id),
      orders: await customerOrders(db, id),
    });
  }
  const download = /^\/api\/admin\/reports\/(\d+)\/download$/.exec(url.pathname);
  if (download) {
    const id = Number(download[1]);
    const report = Number.isSafeInteger(id) && await db.prepare('SELECT filename,content FROM reports WHERE id=? AND content IS NOT NULL').get(id);
    if (!report) return json(404, { error: 'Report file not found.' });
    const filename = (report.filename || 'report.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filename}"` });
    return res.end(Buffer.from(report.content));
  }

  const params = url.searchParams;
  const requested = Number(params.get('page') || '1');
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 1_000_000) : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const search = '%' + (params.get('q') || '').trim().slice(0,120).toLowerCase().replace(/[!%_]/g, ch => '!' + ch) + '%';

  if (url.pathname === '/api/admin/customers') {
    const where = "WHERE lower(c.name || ' ' || c.email || ' ' || c.company || ' ' || c.id) LIKE ? ESCAPE '!'";
    const { total } = await db.prepare('SELECT CAST(count(*) AS INTEGER) AS total FROM customers c ' + where).get(search);
    const customers = await db.prepare(`SELECT c.id,c.name,c.email,c.company,
      EXISTS(SELECT 1 FROM administrators a WHERE a.customer_id=c.id) AS "isAdmin",
      (SELECT CAST(count(*) AS INTEGER) FROM orders o WHERE o.customer_id=c.id) AS order_count
      FROM customers c ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`).all(search, PAGE_SIZE, offset);
    return json(200, { customers: customers.map(asCustomer), total, page, pageSize: PAGE_SIZE });
  }

  if (url.pathname === '/api/admin/orders') {
    const filter = params.get('customerId');
    const customerId = filter === null ? null : Number(filter);
    if (customerId !== null && (!Number.isSafeInteger(customerId) || customerId < 1)) return json(400, { error: 'Invalid customer ID.' });
    const from = `FROM orders o JOIN customers c ON c.id=o.customer_id
      WHERE (CAST(? AS INTEGER) IS NULL OR o.customer_id=?) AND
      lower(o.id || ' ' || o.shipping_email || ' ' || c.name || ' ' || c.email || ' ' || o.status) LIKE ? ESCAPE '!'`;
    const bindings = [customerId, customerId, search];
    const { total } = await db.prepare('SELECT CAST(count(*) AS INTEGER) AS total ' + from).get(...bindings);
    const orders = await db.prepare(`SELECT o.id,o.customer_id,o.status,o.created_at,o.subtotal_cents,o.currency,
      o.shipping_name,o.shipping_email,o.shipping_address,o.notes,
      c.name AS customer_name,c.email AS customer_email ${from}
      ORDER BY o.created_at DESC,o.id DESC LIMIT ? OFFSET ?`).all(...bindings, PAGE_SIZE, offset);
    return json(200, { orders: await Promise.all(orders.map(async order => {
      const { customer_name, customer_email, ...details } = order;
      return { ...details, customer_name: asCustomer({ name: customer_name, email: customer_email }).name, items: await orderItems(db, order.id) };
    })), total, page, pageSize: PAGE_SIZE });
  }

  return json(404, { error: 'Not found.' });
}
