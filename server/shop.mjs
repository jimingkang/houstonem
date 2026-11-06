import { randomUUID, createHash } from 'node:crypto';
export function initializeShop(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS products(
    id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
    unit TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK(price_cents>=0), stock INTEGER NOT NULL CHECK(stock>=0),
    illustration TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS orders(
    id TEXT PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),request_id TEXT NOT NULL,request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Awaiting lab confirmation', subtotal_cents INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'USD',
    shipping_name TEXT NOT NULL,shipping_email TEXT NOT NULL,shipping_address TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL,
    UNIQUE(customer_id,request_id));
    CREATE TABLE IF NOT EXISTS order_items(
    order_id TEXT NOT NULL REFERENCES orders(id),product_id TEXT NOT NULL REFERENCES products(id),name TEXT NOT NULL,sku TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity>0),price_cents INTEGER NOT NULL,demo INTEGER NOT NULL,PRIMARY KEY(order_id,product_id));
    CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id,created_at);`);
}
export function seedDemoProducts(db) {
  const rows=[
    ['sem-stubs','HEM-001','Aluminum SEM Stubs','Sample mounting','Standard pin-style mounting stubs for routine SEM sample preparation. Confirm diameter and instrument compatibility with the lab.','Pack of 10',2400,40,'stubs'],
    ['carbon-tabs','HEM-002','Conductive Carbon Tabs','Sample mounting','Double-sided conductive adhesive tabs for securing suitable samples to SEM stubs.','Pack of 100',3200,30,'tabs'],
    ['sample-vials','HEM-003','Sample Collection Vials','Sample collection','Clear screw-cap vials for organizing suitable dry samples. Ask the lab about material and transport requirements.','Pack of 20',1800,50,'vials'],
    ['precision-tweezers','HEM-004','Precision Tweezers','Lab tools','Fine-tip stainless steel tweezers for careful handling of small components and specimens.','1 pair',2200,25,'tweezers'],
    ['stub-box','HEM-005','SEM Stub Storage Box','Storage & handling','A compartmented holder for keeping prepared stubs organized between analysis sessions.','1 box',4500,15,'box'],
    ['sample-containers','HEM-006','Sample Transport Containers','Sample collection','Lidded sample containers for organizing non-hazardous specimens. Laboratory confirmation is required before shipping.','Pack of 5',2800,20,'containers'],
  ];
  const insert=db.prepare('INSERT OR IGNORE INTO products(id,sku,name,category,description,unit,price_cents,stock,illustration) VALUES(?,?,?,?,?,?,?,?,?)');
  for(const row of rows)insert.run(...row);
}
export function customerOrders(db, customerId) {
  const orders=db.prepare('SELECT id,status,subtotal_cents,currency,created_at FROM orders WHERE customer_id=? ORDER BY created_at DESC').all(customerId);
  const items=db.prepare('SELECT product_id,name,sku,quantity,price_cents,demo FROM order_items WHERE order_id=?');
  return orders.map(order=>({...order,items:items.all(order.id)}));
}
export async function handleShop(req,json,db,user,path) {
  if(path==='/api/shop/products'&&req.method==='GET') {json(200,{products:db.prepare('SELECT id,sku,name,category,description,unit,price_cents,stock,illustration,demo FROM products WHERE active=1 ORDER BY rowid').all()});return true;}
  if(path!=='/api/shop/orders')return false;
  if(!user){json(401,{error:'Please sign in to submit or view your orders.'});return true;}
  if(req.method==='GET'){json(200,{orders:customerOrders(db,user.id)});return true;}
  if(req.method!=='POST'){json(405,{error:'Method not allowed.'});return true;}
  let body;
  try{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000){json(413,{error:'Order request is too large.'});return true;}}body=JSON.parse(raw);}catch{json(400,{error:'Invalid order request.'});return true;}
  const fail=message=>{json(400,{error:message});return true;};
  if(!body||!Array.isArray(body.items)||!body.items.length||body.items.length>30)return fail('Add at least one item to your cart.');
  if(typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(body.requestId))return fail('Invalid order reference. Refresh and try again.');
  const fields={};for(const [key,max] of [['name',120],['email',254],['address',1000],['notes',1500]]){
    const value=body.shipping?.[key];if(typeof value!=='string'||value.trim().length>max|| (key!=='notes'&&!value.trim()))return fail('Complete your contact and shipping details.');fields[key]=value.trim();
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))return fail('Enter a valid contact email.');
  const seen=new Set();for(const item of body.items){if(!item||typeof item.productId!=='string'||seen.has(item.productId)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>99)return fail('Each product must have a quantity between 1 and 99.');seen.add(item.productId);}
  const normalized=[...body.items].sort((a,b)=>a.productId.localeCompare(b.productId)).map(i=>({productId:i.productId,quantity:i.quantity}));
  const requestHash=createHash('sha256').update(JSON.stringify({items:normalized,shipping:fields})).digest('hex');
  const previous=db.prepare('SELECT id,request_hash FROM orders WHERE customer_id=? AND request_id=?').get(user.id,body.requestId);
  if(previous){if(previous.request_hash!==requestHash){json(409,{error:'This order reference has already been used. Start a new order.'});return true;}json(200,{order:customerOrders(db,user.id).find(o=>o.id===previous.id)});return true;}
  db.exec('BEGIN IMMEDIATE');
  try {
    const lines=[];let subtotal=0;
    for(const item of normalized){
      const product=db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(item.productId);
      if(!product||product.stock<item.quantity){db.exec('ROLLBACK');json(409,{error:product?`Not enough availability for ${product.name}. Update your cart.`:'A product is no longer available. Update your cart.'});return true;}
      subtotal+=product.price_cents*item.quantity;lines.push({...product,quantity:item.quantity});
    }
    const id='HEM-'+randomUUID();
    db.prepare('INSERT INTO orders(id,customer_id,request_id,request_hash,subtotal_cents,shipping_name,shipping_email,shipping_address,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,user.id,body.requestId,requestHash,subtotal,fields.name,fields.email,fields.address,fields.notes,new Date().toISOString());
    const insert=db.prepare('INSERT INTO order_items VALUES(?,?,?,?,?,?,?)');
    for(const line of lines){insert.run(id,line.id,line.name,line.sku,line.quantity,line.price_cents,line.demo);db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(line.quantity,line.id);}
    db.exec('COMMIT');json(201,{order:customerOrders(db,user.id).find(o=>o.id===id)});return true;
  } catch(error){db.exec('ROLLBACK');throw error;}
}

export function updateOrderStatus(db,id,next) {
  const transitions={
    'Awaiting lab confirmation':['Confirmed - awaiting payment','Cancelled'],
    'Confirmed - awaiting payment':['Fulfilled','Cancelled'],
    'Cancelled':[], 'Fulfilled':[],
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    const order=db.prepare('SELECT status FROM orders WHERE id=?').get(id);
    if(!order)throw Error('Order not found.');
    if(order.status===next){db.exec('COMMIT');return;}
    if(!transitions[order.status]?.includes(next))throw Error('Invalid order status transition.');
    if(next==='Cancelled')for(const item of db.prepare('SELECT product_id,quantity FROM order_items WHERE order_id=?').all(id))db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(item.quantity,item.product_id);
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(next,id);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
}
