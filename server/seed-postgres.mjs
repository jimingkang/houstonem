import { addCustomer } from './db.mjs';
import { transaction } from './transactions.mjs';

export async function seedPostgresDemo(db, schema) {
  if (schema !== 'houstonem_demo') throw new Error('Demo accounts require the houstonem_demo schema.');
  await transaction(db, async tx => {
    await tx.prepare('SELECT pg_advisory_xact_lock(hashtext(?))').get('houstonem-demo-users');
    if (!await tx.prepare('SELECT 1 FROM customers WHERE email=?').get('test')) {
      await addCustomer(tx,'test','test','Test Customer','Test Company');
    }
    if (!await tx.prepare('SELECT 1 FROM customers WHERE email=?').get('admin')) {
      const id = await addCustomer(tx,'admin','admin','Demo Administrator','Houston Electron Microscopy');
      await tx.prepare('INSERT INTO administrators(customer_id) VALUES(?)').run(id);
    }
  });
}
