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

export function seedLocalAdministrator(db) {
  const existing = db.prepare('SELECT id FROM customers WHERE email=?').get('admin');
  if (existing) return false;
  db.exec('BEGIN IMMEDIATE');
  try {
    const id = addCustomer(db, 'admin', 'admin', 'Local Administrator', 'Houston Electron Microscopy');
    db.prepare('INSERT INTO administrators(customer_id) VALUES(?)').run(id);
    db.exec('COMMIT');
    return true;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
