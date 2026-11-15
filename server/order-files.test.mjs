import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openDatabase, addCustomer } from './db.mjs';
import { createPortalServer } from './index.mjs';

test('clients attach files to their own orders and the lab can read them', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hem-order-files-'));
  const db = openDatabase(dir);
  addCustomer(db, 'buyer@example.com', 'buyer-password-123', 'Buyer', 'Buyer Inc');
  addCustomer(db, 'other@example.com', 'other-password-123', 'Other', 'Other Inc');
  const staff = addCustomer(db, 'admin@example.com', 'admin-password-123', 'Lab', 'HEM');
  db.prepare('INSERT INTO administrators VALUES (?)').run(staff);
  const server = createPortalServer(db);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const signIn = async (email, password) => {
    const response = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  const upload = (orderId, cookie, files) => {
    const body = new FormData();
    for (const [name, content] of files) body.append('files', new Blob([content]), name);
    return fetch(`${base}/api/orders/${orderId}/files`, { method: 'POST', headers: { Cookie: cookie }, body });
  };
  try {
    const buyer = await signIn('buyer@example.com', 'buyer-password-123');
    const created = await fetch(base + '/api/service-orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: buyer },
      body: JSON.stringify({ requestId: randomUUID(), service: 'coatings', quantity: 1, email: 'buyer@example.com', notes: 'Coated steel coupon.' }) });
    assert.equal(created.status, 201);
    const { order } = await created.json();

    assert.equal((await upload(order.id, buyer, [['coupon.png', 'png-bytes'], ['spec.pdf', '%PDF-1.4 spec']])).status, 201);
    assert.equal((await upload(order.id, buyer, [['script.exe', 'MZ']])).status, 400);
    assert.equal((await upload(order.id, buyer, [['empty.pdf', '']])).status, 400);
    assert.equal((await fetch(`${base}/api/orders/${order.id}/files`, { method: 'POST', headers: { Cookie: buyer, 'Content-Type': 'application/json' }, body: '{}' })).status, 415);

    const portal = await (await fetch(base + '/api/portal', { headers: { Cookie: buyer } })).json();
    const mine = portal.orders.find(entry => entry.id === order.id);
    assert.equal(mine.notes, 'Coated steel coupon.');
    assert.deepEqual(mine.files.map(file => [file.filename, file.uploaded_by, file.size]), [['coupon.png', 'customer', 9], ['spec.pdf', 'customer', 13]]);
    assert.equal(mine.items[0].price_cents, undefined);

    const download = await fetch(`${base}/api/orders/${order.id}/files/${mine.files[1].id}`, { headers: { Cookie: buyer } });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'application/pdf');
    assert.match(download.headers.get('content-disposition'), /^attachment; filename="spec.pdf"$/);
    assert.equal(await download.text(), '%PDF-1.4 spec');

    const other = await signIn('other@example.com', 'other-password-123');
    assert.equal((await upload(order.id, other, [['x.png', 'x']])).status, 404);
    assert.equal((await fetch(`${base}/api/orders/${order.id}/files/${mine.files[1].id}`, { headers: { Cookie: other } })).status, 404);
    assert.equal((await upload(order.id, '', [['x.png', 'x']])).status, 401);

    const admin = await signIn('admin@example.com', 'admin-password-123');
    const listed = await (await fetch(base + '/api/admin/orders', { headers: { Cookie: admin } })).json();
    assert.equal(listed.orders.find(entry => entry.id === order.id).files.length, 2);
    const labCopy = await fetch(`${base}/api/admin/orders/${order.id}/files/${mine.files[0].id}`, { headers: { Cookie: admin } });
    assert.equal(labCopy.status, 200);
    assert.equal(await labCopy.text(), 'png-bytes');
    assert.equal((await fetch(`${base}/api/admin/orders/${order.id}/files/${mine.files[0].id}`, { headers: { Cookie: buyer } })).status, 403);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
