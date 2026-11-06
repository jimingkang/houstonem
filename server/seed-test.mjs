import { openDatabase, addCustomer } from './db.mjs';
import { pathToFileURL } from 'node:url';
export function seedTestCustomer(db) {
  if (db.prepare('SELECT id FROM customers WHERE email=?').get('test')) return;
  addCustomer(db, 'test', 'test', 'Test Customer', 'Test Company');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase();
  try { seedTestCustomer(db); console.log('Test customer available: test / test'); }
  finally { db.close(); }
}
