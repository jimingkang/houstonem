import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { openDatabase, addCustomer } from './db.mjs';
import { updateOrderStatus } from './shop.mjs';
const db=openDatabase();
const [command,...args]=process.argv.slice(2);
try {
  if(command==='orders') {
    const orders=db.prepare('SELECT o.*,c.company FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY created_at DESC').all();
    for(const order of orders) console.log(JSON.stringify({...order,items:db.prepare('SELECT name,sku,quantity,price_cents,demo FROM order_items WHERE order_id=?').all(order.id)}));
  } else if(command==='order-status') {
    if(args.length!==2) throw Error('Usage: order-status HEM-order-id "Confirmed - awaiting payment|Cancelled|Fulfilled"');
    updateOrderStatus(db,args[0],args[1]);console.log('Order status updated.');
  } else if(command==='customer') {
    if (!process.env.CUSTOMER_PASSWORD || process.env.CUSTOMER_PASSWORD.length<12 || args.length!==3) throw Error('Usage: CUSTOMER_PASSWORD=<12+ characters> npm run portal:manage -- customer email "Name" "Company"');
    console.log('Customer created:',addCustomer(db,args[0],process.env.CUSTOMER_PASSWORD,args[1],args[2]));
  } else if(command==='subscribe') {
    const [email,service,plan,renewal]=args;
    const customer=db.prepare('SELECT id FROM customers WHERE email=?').get(email);
    if(!customer || !service || !plan) throw Error('Usage: subscribe email "Service" "Plan" [YYYY-MM-DD]');
    db.prepare('INSERT INTO subscriptions(customer_id,service,plan,status,renewal_date) VALUES(?,?,?,?,?)').run(customer.id,service,plan,'Active',renewal || null);
    console.log('Subscription added.');
  } else if(command==='report') {
    const [email,title,sample,analysis,file]=args;
    const customer=db.prepare('SELECT id FROM customers WHERE email=?').get(email);
    if(!customer || !title || !sample || !analysis || !file) throw Error('Usage: report email "Title" "Sample ID" "Analysis" /path/report.pdf');
    const content=readFileSync(file);
    if(content.length>25*1024*1024 || content.subarray(0,5).toString()!=='%PDF-') throw Error('Provide a PDF file up to 25 MB.');
    db.prepare('INSERT INTO reports(customer_id,title,sample_id,analysis,status,issued_at,filename,mime,content) VALUES(?,?,?,?,?,?,?,?,?)').run(customer.id,title,sample,analysis,'Ready',new Date().toISOString().slice(0,10),basename(file),'application/pdf',content);
    console.log('Report uploaded.');
  } else throw Error('Commands: customer, subscribe, report, orders, order-status. See README.md.');
} catch(e) { console.error(e.message); process.exitCode=1; } finally { db.close(); }
