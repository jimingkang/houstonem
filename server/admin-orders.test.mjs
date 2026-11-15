import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, addCustomer } from './db.mjs';
import { createPortalServer } from './index.mjs';

test('administrators create, read, update, filter and delete orders', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-admin-orders-'));
  const db = openDatabase(dir);
  const buyer = addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  const staff = addCustomer(db, 'admin@example.com', 'admin-password-123', 'Lab Administrator', 'HEM');
  db.prepare('INSERT INTO administrators VALUES (?)').run(staff);
  db.prepare("INSERT INTO products VALUES ('kit','SKU-1','Kit','Storage','Product','box',2000,5,'box',1,1)").run();
  db.prepare("INSERT INTO orders VALUES ('product-order',?,'key','hash','Awaiting lab confirmation',4000,'USD','Buyer','buyer@example.com','','','2026-01-01')").run(buyer);
  db.prepare("INSERT INTO order_items VALUES ('product-order','kit','Kit','SKU-1',2,2000,1)").run();
  const server = createPortalServer(db, { payments: null });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, cookie) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  const signIn = async (email, password) => (await post('/api/login', { email, password })).headers.get('set-cookie').split(';')[0];
  const get = (path, cookie) => fetch(base + path, { headers: { Cookie: cookie } });
  try {
    const admin = await signIn('admin@example.com', 'admin-password-123');
    const customer = await signIn('buyer@example.com', 'buyer-password-123');
    const draft = { customerId: buyer, items: [{ service: 'eds', quantity: 2 }, { service: 'failure-analysis', quantity: 1, unitPriceCents: 60000 }], shipping_email: 'lab-contact@example.com', notes: 'Phoned-in order' };

    assert.equal((await post('/api/admin/orders', draft, customer)).status, 403);
    assert.equal((await post('/api/admin/orders', { ...draft, items: [{ service: 'nope', quantity: 1 }] }, admin)).status, 400);
    assert.equal((await post('/api/admin/orders', { ...draft, customerId: 9999 }, admin)).status, 404);
    const created = await post('/api/admin/orders', draft, admin);
    assert.equal(created.status, 201);
    const { id } = await created.json();

    let order = (await (await get('/api/admin/orders/' + encodeURIComponent(id), admin)).json()).order;
    assert.equal(order.status, 'Awaiting lab confirmation');
    assert.equal(order.subtotal_cents, 110000);
    assert.equal(order.items.length, 2);
    assert.equal(order.shipping_name, 'Buyer');
    assert.equal(order.services.find(line => line.service_slug === 'eds').quantity, 2);
    assert.equal((await post('/api/admin/orders', { ...draft, items: [{ service: 'eds', quantity: 1 }, { service: 'eds', quantity: 2 }] }, admin)).status, 400);
    assert.equal((await get('/api/admin/orders/' + id, customer)).status, 403);
    const portal = await (await get('/api/portal', customer)).json();
    assert.ok(portal.orders.some(entry => entry.id === id));

    assert.equal((await post('/api/admin/orders/' + id, { items: [{ service: 'sem', quantity: 3, unitPriceCents: 20000 }], shipping_address: '1 Lab Way' }, admin)).status, 200);
    order = (await (await get('/api/admin/orders/' + id, admin)).json()).order;
    assert.equal(order.subtotal_cents, 60000);
    assert.equal(order.shipping_address, '1 Lab Way');
    assert.deepEqual(order.services.map(line => line.service_slug), ['sem']);
    assert.equal((await post('/api/admin/orders/' + id, { shipping_email: 'bad' }, admin)).status, 400);

    const list = await (await get('/api/admin/orders?status=' + encodeURIComponent('Awaiting lab confirmation'), admin)).json();
    assert.equal(list.total, 2);
    assert.ok(list.statuses.includes('Paid'));
    assert.equal((await (await get('/api/admin/orders?status=Fulfilled', admin)).json()).total, 0);
    assert.equal((await get('/api/admin/orders?status=Bogus', admin)).status, 400);

    assert.equal((await post('/api/admin/orders/' + id + '/status', { status: 'Confirmed - awaiting payment' }, admin)).status, 200);
    assert.equal((await post('/api/admin/orders/' + id, { items: [{ service: 'sem', quantity: 1 }] }, admin)).status, 409);
    assert.equal((await post('/api/admin/orders/' + id, { notes: 'Confirmed by phone' }, admin)).status, 200);
    assert.equal((await post('/api/admin/orders/' + id + '/status', { status: 'Paid' }, admin)).status, 200);
    assert.equal((await post('/api/admin/orders/' + id + '/delete', {}, admin)).status, 409);

    assert.equal((await post('/api/admin/orders/product-order/delete', {}, customer)).status, 403);
    assert.equal((await post('/api/admin/orders/product-order/delete', {}, admin)).status, 200);
    assert.equal(db.prepare("SELECT stock FROM products WHERE id='kit'").get().stock, 7);
    assert.equal((await get('/api/admin/orders/product-order', admin)).status, 404);
    assert.equal((await post('/api/admin/orders/product-order/delete', {}, admin)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); rmSync(dir, { recursive: true }); }
});
