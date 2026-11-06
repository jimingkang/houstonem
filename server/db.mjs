import { initializeShop } from './shop.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
export function openDatabase(directory = process.env.DATA_DIR || resolve('server/data')) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(resolve(directory, 'portal.sqlite'));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, company TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS subscriptions(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), service TEXT NOT NULL, plan TEXT NOT NULL, status TEXT NOT NULL, renewal_date TEXT);
    CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), title TEXT NOT NULL, sample_id TEXT NOT NULL, analysis TEXT NOT NULL, status TEXT NOT NULL, issued_at TEXT, filename TEXT, mime TEXT, content BLOB);
    CREATE INDEX IF NOT EXISTS reports_customer ON reports(customer_id);
    CREATE INDEX IF NOT EXISTS subscriptions_customer ON subscriptions(customer_id);`);
  initializeShop(db);
  return db;
}
export function addCustomer(db, email, password, name, company) {
  const salt = randomBytes(16).toString('hex');
  return db.prepare('INSERT INTO customers(email,name,company,salt,password_hash) VALUES(?,?,?,?,?)').run(email.toLowerCase(), name, company, salt, scryptSync(password,salt,64).toString('hex')).lastInsertRowid;
}
