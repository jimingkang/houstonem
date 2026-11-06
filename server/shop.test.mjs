import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {openDatabase,addCustomer} from './db.mjs';
import {seedDemoProducts,updateOrderStatus} from './shop.mjs';
import {createPortalServer} from './index.mjs';
test('shop calculates totals, saves private orders, reserves stock and deduplicates retries',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'hem-shop-'));const db=openDatabase(dir);seedDemoProducts(db);seedDemoProducts(db);
  addCustomer(db,'buyer@example.com','buyer-password-123','Buyer','Buyer Inc');addCustomer(db,'other@example.com','other-password-123','Other','Other Inc');
  const server=createPortalServer(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  const post=(path,body,cookie)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  const order=()=>({requestId:randomUUID(),items:[{productId:'sem-stubs',quantity:2,price_cents:1}],shipping:{name:'Buyer',email:'buyer@example.com',address:'123 Test St, Houston TX 77001, USA',notes:'Test only'}});
  try {
    const products=await (await fetch(base+'/api/shop/products')).json();assert.equal(products.products.length,6);assert.ok(products.products.every(p=>p.demo===1));
    assert.equal((await post('/api/shop/orders',order())).status,401);assert.equal((await fetch(base+'/api/shop/orders')).status,401);
    const login=await post('/api/login',{email:'buyer@example.com',password:'buyer-password-123'});const cookie=login.headers.get('set-cookie').split(';')[0];
    const body=order();const created=await post('/api/shop/orders',body,cookie);assert.equal(created.status,201);const {order:saved}=await created.json();assert.equal(saved.subtotal_cents,4800);assert.equal(saved.status,'Awaiting lab confirmation');assert.equal(saved.items[0].price_cents,2400);assert.equal(db.prepare("SELECT stock FROM products WHERE id='sem-stubs'").get().stock,38);
    const repeated=await post('/api/shop/orders',body,cookie);assert.equal(repeated.status,200);assert.equal((await repeated.json()).order.id,saved.id);assert.equal(db.prepare("SELECT stock FROM products WHERE id='sem-stubs'").get().stock,38);
    assert.equal((await post('/api/shop/orders',{...body,items:[{productId:'sem-stubs',quantity:3}]},cookie)).status,409);
    const otherLogin=await post('/api/login',{email:'other@example.com',password:'other-password-123'});const otherCookie=otherLogin.headers.get('set-cookie').split(';')[0];
    const otherOrders=await (await fetch(base+'/api/shop/orders',{headers:{Cookie:otherCookie}})).json();assert.equal(otherOrders.orders.length,0);
    const portal=await (await fetch(base+'/api/portal',{headers:{Cookie:cookie}})).json();assert.equal(portal.orders.length,1);assert.equal(portal.orders[0].id,saved.id);
    for(const qty of [0,-1,1.5,100,'2'])assert.equal((await post('/api/shop/orders',{...order(),items:[{productId:'sem-stubs',quantity:qty}]},cookie)).status,400);
    assert.equal((await post('/api/shop/orders',{...order(),items:[{productId:'sem-stubs',quantity:1},{productId:'sem-stubs',quantity:1}]},cookie)).status,400);
    assert.equal((await post('/api/shop/orders',{...order(),shipping:{name:'Buyer',email:'invalid',address:'test',notes:''}},cookie)).status,400);
    assert.equal((await post('/api/shop/orders',{...order(),items:[{productId:'missing',quantity:1}]},cookie)).status,409);
    assert.equal((await post('/api/shop/orders',{...order(),items:[{productId:'sem-stubs',quantity:39}]},cookie)).status,409);
    // Failure after an earlier valid line leaves the whole order and inventory unchanged.
    const before=db.prepare("SELECT stock FROM products WHERE id='carbon-tabs'").get().stock;
    assert.equal((await post('/api/shop/orders',{...order(),items:[{productId:'carbon-tabs',quantity:1},{productId:'sem-stubs',quantity:99}]},cookie)).status,409);
    assert.equal(db.prepare("SELECT stock FROM products WHERE id='carbon-tabs'").get().stock,before);
    db.prepare("UPDATE products SET stock=1 WHERE id='stub-box'").run();
    const results=await Promise.all([1,2].map(()=>post('/api/shop/orders',{...order(),items:[{productId:'stub-box',quantity:1}]},cookie)));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal(db.prepare("SELECT stock FROM products WHERE id='stub-box'").get().stock,0);
    assert.equal(db.prepare('SELECT count(*) AS count FROM orders').get().count,2);
    updateOrderStatus(db,saved.id,'Cancelled');assert.equal(db.prepare("SELECT stock FROM products WHERE id='sem-stubs'").get().stock,40);
    updateOrderStatus(db,saved.id,'Cancelled');assert.equal(db.prepare("SELECT stock FROM products WHERE id='sem-stubs'").get().stock,40);
    assert.throws(()=>updateOrderStatus(db,saved.id,'Fulfilled'),/Invalid order status/);

    const badOrigin=await fetch(base+'/api/shop/orders',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example',Cookie:cookie},body:JSON.stringify(order())});assert.equal(badOrigin.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));db.close();}
  const reopened=openDatabase(dir);assert.equal(reopened.prepare('SELECT count(*) AS count FROM orders').get().count,2);reopened.close();rmSync(dir,{recursive:true});
});
