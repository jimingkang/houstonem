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
