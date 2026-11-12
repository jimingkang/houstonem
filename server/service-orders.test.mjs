import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, addCustomer } from './db.mjs';
import { updateOrderStatus } from './orders.mjs';
import { createPortalServer } from './index.mjs';

test('service orders use catalog pricing, preserve old orders and stay private', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-service-orders-'));
  const db = openDatabase(dir);
  const buyer = addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  addCustomer(db, 'other@example.com', 'other-password-123', 'Other', 'Other Inc');
  db.prepare("INSERT INTO products VALUES ('legacy','SKU-1','Accessory','Storage','Historical product','box',2000,3,'box',1,1)").run();
  db.prepare("INSERT INTO orders VALUES ('legacy-order',?,'legacy-key','legacy-hash','Awaiting lab confirmation',2000,'USD','Buyer','buyer@example.com','Historical address','','2026-01-01')").run(buyer);
  db.prepare("INSERT INTO order_items VALUES ('legacy-order','legacy','Accessory','SKU-1',1,2000,1)").run();
  const staff = addCustomer(db, 'admin@example.com', 'admin-password-123', 'Lab Administrator', 'HEM');
  db.prepare('INSERT INTO administrators VALUES (?)').run(staff);
  const server = createPortalServer(db);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie, extra = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...extra }, body: JSON.stringify(body) });
  const order = () => ({ requestId: randomUUID(), service: 'eds', quantity: 3, email: 'buyer@example.com', notes: 'Three mounted metal samples for elemental analysis.', price_cents: 1 });
  const signIn = async (email, password) => {
    const response = await post('/api/login', { email, password });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const portal = async cookie => (await fetch(base + '/api/portal', { headers: { Cookie: cookie } })).json();
  try {
    assert.equal((await post('/api/service-orders', order())).status, 401);
    const cookie = await signIn('buyer@example.com', 'buyer-password-123');
    assert.equal((await post('/api/shop/orders', {}, cookie)).status, 404);
    assert.equal((await post('/api/service-orders', order(), cookie, { Origin: 'https://elsewhere.example' })).status, 403);
    for (const invalid of [{service:'unknown'}, {service:'gold-sputtering'}, {service:'failure-analysis',quantity:2}, {quantity:0}, {quantity:101}, {quantity:1.5}, {email:'bad'}, {notes:'   '}, {requestId:'bad'}]) {
      assert.equal((await post('/api/service-orders', {...order(),...invalid}, cookie)).status, 400);
    }
    const body = order();
    const responses = await Promise.all([post('/api/service-orders', body, cookie),post('/api/service-orders', body, cookie)]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200,201]);
    const [{ order: saved }, { order: retried }] = await Promise.all(responses.map(r => r.json()));
    assert.equal(saved.id, retried.id);
    assert.equal(saved.status, 'Awaiting lab confirmation');
    assert.equal(saved.subtotal_cents, 75000);
    assert.equal(saved.items[0].unit, 'sample');
    assert.equal(saved.items[0].quantity, 3);
    assert.equal(saved.items[0].price_cents, 25000);
    assert.equal((await post('/api/service-orders', {...body, quantity: 4}, cookie)).status, 409);
    const history = await portal(cookie);
    assert.equal(history.orders.length, 2);
    assert.equal(history.orders.find(o => o.id === 'legacy-order').items[0].name, 'Accessory');
    assert.equal(history.orders.find(o => o.id === saved.id).shipping_email, undefined);
    const other = await signIn('other@example.com', 'other-password-123');
    assert.deepEqual((await portal(other)).orders, []);
    const kept = await post('/api/guest-session', {}, cookie);
    assert.equal(kept.status, 200);
    assert.equal(kept.headers.get('set-cookie'), null);
    assert.equal((await kept.json()).customer.id, buyer);
    assert.equal((await post('/api/guest-session', {}, null, { Origin: 'https://elsewhere.example' })).status, 403);
    const guest = await post('/api/guest-session', { email: 'buyer@example.com' });
    assert.equal(guest.status, 201);
    assert.match(guest.headers.get('set-cookie'), /HttpOnly; SameSite=Strict; Path=\/api; Max-Age=2592000/);
    const guestCookie = guest.headers.get('set-cookie').split(';')[0];
    const { customer: guestCustomer } = await guest.json();
    assert.equal(guestCustomer.guest, true);
    assert.match(guestCustomer.name, /^Guest-[0-9A-F]{8}$/);
    assert.equal(db.prepare('SELECT name FROM customers WHERE id=?').get(guestCustomer.id).name, guestCustomer.name);
    assert.notEqual(guestCustomer.id, buyer);
    assert.match(guestCustomer.email, /^guest-[a-f0-9]{32}@guest\.invalid$/);
    const reused = await post('/api/guest-session', {}, guestCookie);
    assert.equal(reused.status, 200);
    const reusedCustomer = (await reused.json()).customer;
    assert.equal(reusedCustomer.id, guestCustomer.id);
    assert.equal(reusedCustomer.name, guestCustomer.name);
    db.prepare('UPDATE customers SET name=? WHERE id=?').run('Guest customer', guestCustomer.id);
    assert.equal((await portal(guestCookie)).customer.name, guestCustomer.name);
    assert.deepEqual((await portal(guestCookie)).orders, []);
    const guestOrder = await post('/api/service-orders', order(), guestCookie);
    assert.equal(guestOrder.status, 201);
    const guestOrderId = (await guestOrder.json()).order.id;
    assert.deepEqual((await portal(guestCookie)).orders.map(o => o.id), [guestOrderId]);
    assert.ok(!(await portal(cookie)).orders.some(o => o.id === guestOrderId));

    const adminGet = (resource, auth) => fetch(base + '/api/admin/' + resource, { headers: auth ? { Cookie: auth } : {} });
    for (const resource of ['customers', 'orders']) {
      assert.equal((await adminGet(resource)).status, 401);
      for (const auth of [cookie, other, guestCookie]) assert.equal((await adminGet(resource, auth)).status, 403);
    }
    const admin = await signIn('admin@example.com', 'admin-password-123');
    assert.equal((await portal(admin)).customer.isAdmin, true);
    const customers = await (await adminGet('customers', admin)).json();
    assert.equal(customers.total, 4);
    assert.equal(customers.customers.find(c => c.id === guestCustomer.id).name, guestCustomer.name);
    assert.equal(customers.customers.find(c => c.id === buyer).order_count, 2);
    assert.ok(customers.customers.every(c => !('password_hash' in c) && !('salt' in c)));
    assert.equal((await (await adminGet('customers?q=buyer%40example.com', admin)).json()).total, 1);
    const orders = await (await adminGet('orders', admin)).json();
    assert.equal(orders.total, 3);
    const guestRow = orders.orders.find(o => o.id === guestOrderId);
    assert.equal(guestRow.customer_name, guestCustomer.name);
    assert.equal(guestRow.shipping_email, 'buyer@example.com');
    assert.match(guestRow.notes, /mounted metal samples/);
    assert.equal(guestRow.items[0].quantity, 3);
    assert.ok(!('request_hash' in guestRow));
    assert.equal((await (await adminGet('orders?customerId=' + buyer, admin)).json()).total, 2);
    assert.equal((await adminGet('orders?customerId=invalid', admin)).status, 400);
    assert.equal((await post('/api/admin/orders', {}, admin)).status, 405);
    db.prepare('DELETE FROM administrators WHERE customer_id=?').run(staff);
    assert.equal((await adminGet('orders', admin)).status, 403);

    updateOrderStatus(db, saved.id, 'Confirmed - awaiting payment');
    assert.equal((await portal(cookie)).orders.find(o => o.id === saved.id).status, 'Confirmed - awaiting payment');
    updateOrderStatus(db, 'legacy-order', 'Cancelled');
    updateOrderStatus(db, 'legacy-order', 'Cancelled');
    assert.equal(db.prepare("SELECT stock FROM products WHERE id='legacy'").get().stock, 4);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true });
  }
});
