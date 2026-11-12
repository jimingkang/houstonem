import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseEnv } from 'node:util';
import { transaction } from './transactions.mjs';
import { openPostgres } from './postgres.mjs';
import { openDatabase, addCustomer } from './db.mjs';
import { orderItems, updateOrderStatus } from './orders.mjs';
if (existsSync('.env.local')) {
  for (const [key,value] of Object.entries(parseEnv(readFileSync('.env.local','utf8')))) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}
let db;
try { db = process.env.DATABASE_URL ? await openPostgres(process.env.DATABASE_URL, process.env.DATABASE_SCHEMA) : openDatabase(); }
catch (error) { console.error('Database initialization failed:',error.code || error.name); process.exit(1); }
const [command,...args]=process.argv.slice(2);
try {
  if(command==='admin-create') {
    const [email,name,company=''] = args;
    const password = process.env.CUSTOMER_PASSWORD || '';
    if (args.length<2 || args.length>3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || /@guest\.invalid$/i.test(email) || !name?.trim() || password.length<12 || password.length>256) {
      throw Error('Usage: with CUSTOMER_PASSWORD set (12–256 characters), run npm run portal:manage -- admin-create email "Name" ["Company"]');
    }
    const id = await transaction(db, async tx => {
      const id = await addCustomer(tx,email,password,name,company);
      await tx.prepare('INSERT INTO administrators(customer_id) VALUES(?)').run(id);
      return id;
    });
    console.log('Administrator created:', id);
  } else if(command==='orders') {
    const orders=await db.prepare('SELECT o.*,c.company FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY created_at DESC').all();
    for(const order of orders) console.log(JSON.stringify({...order,items:await orderItems(db,order.id)}));
  } else if(command==='order-status') {
    if(args.length!==2) throw Error('Usage: order-status HEM-order-id "Confirmed - awaiting payment|Cancelled|Fulfilled"');
    await updateOrderStatus(db,args[0],args[1]);console.log('Order status updated.');
  } else if(command==='customer') {
    if (!process.env.CUSTOMER_PASSWORD || process.env.CUSTOMER_PASSWORD.length<12 || args.length!==3) throw Error('Usage: CUSTOMER_PASSWORD=<12+ characters> npm run portal:manage -- customer email "Name" "Company"');
    console.log('Customer created:',await addCustomer(db,args[0],process.env.CUSTOMER_PASSWORD,args[1],args[2]));
  } else if(command==='subscribe') {
    const [email,service,plan,renewal]=args;
    const customer=await db.prepare('SELECT id FROM customers WHERE email=?').get(email);
    if(!customer || !service || !plan) throw Error('Usage: subscribe email "Service" "Plan" [YYYY-MM-DD]');
    await db.prepare('INSERT INTO subscriptions(customer_id,service,plan,status,renewal_date) VALUES(?,?,?,?,?)').run(customer.id,service,plan,'Active',renewal || null);
    console.log('Subscription added.');
  } else if(command==='report') {
    const [email,title,sample,analysis,file]=args;
    const customer=await db.prepare('SELECT id FROM customers WHERE email=?').get(email);
    if(!customer || !title || !sample || !analysis || !file) throw Error('Usage: report email "Title" "Sample ID" "Analysis" /path/report.pdf');
    const content=readFileSync(file);
    if(content.length>25*1024*1024 || content.subarray(0,5).toString()!=='%PDF-') throw Error('Provide a PDF file up to 25 MB.');
    await db.prepare('INSERT INTO reports(customer_id,title,sample_id,analysis,status,issued_at,filename,mime,content) VALUES(?,?,?,?,?,?,?,?,?)').run(customer.id,title,sample,analysis,'Ready',new Date().toISOString().slice(0,10),basename(file),'application/pdf',content);
    console.log('Report uploaded.');
  } else throw Error('Commands: admin-create, customer, subscribe, report, orders, order-status. See README.md.');
} catch(e) { console.error(e.message); process.exitCode=1; } finally { await db.close(); }
