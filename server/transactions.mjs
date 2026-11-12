// PostgreSQL transactions pin one pool client; SQLite retains its synchronous
// driver and serializes write transactions on each connection.
const pending = new WeakMap();
export async function transaction(db, work) {
  if (db.transaction) return db.transaction(work);
  const previous = pending.get(db) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  pending.set(db,current);
  await previous;
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = await work(db);
      db.exec('COMMIT');
      return result;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  } finally {
    if (pending.get(db) === current) pending.delete(db);
    release();
  }
}
