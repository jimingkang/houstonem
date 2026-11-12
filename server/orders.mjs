export function initializeOrders(db) {
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
    CREATE TABLE IF NOT EXISTS service_order_items(
    order_id TEXT PRIMARY KEY REFERENCES orders(id),service_slug TEXT NOT NULL,name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity>0),unit TEXT NOT NULL CHECK(unit IN ('sample','project')),price_cents INTEGER NOT NULL CHECK(price_cents>=0));
    CREATE INDEX IF NOT EXISTS orders_customer ON orders(customer_id,created_at);`);
}
export function customerOrders(db, customerId, orderId = null) {
  const select = 'SELECT id,status,subtotal_cents,currency,created_at FROM orders WHERE customer_id=?';
  const orders = orderId === null ? db.prepare(select + ' ORDER BY created_at DESC').all(customerId) : db.prepare(select + ' AND id=?').all(customerId, orderId);
  return orders.map(order => ({ ...order, items: orderItems(db, order.id) }));
}

export function orderItems(db, id) {
  return db.prepare(`SELECT name,sku,quantity,price_cents,demo,NULL AS unit FROM order_items WHERE order_id=?
    UNION ALL SELECT name,service_slug,quantity,price_cents,0,unit FROM service_order_items WHERE order_id=?`).all(id,id);
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
