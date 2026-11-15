// Files a client attaches to a quote request or order: sample photos, drawings,
// data sheets, previous results. Stored in the database next to the order.
export const orderFilesPath = /^\/api\/orders\/([a-zA-Z0-9_-]{1,100})\/files$/;
const orderFilePath = /^\/api\/(?:admin\/)?orders\/([a-zA-Z0-9_-]{1,100})\/files\/(\d+)$/;
export const MAX_FILE = 20 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 5;
const MAX_FILES_PER_ORDER = 30;

// The stored type comes from the extension, never from what the browser claims.
const TYPES = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  tif: 'image/tiff', tiff: 'image/tiff', bmp: 'image/bmp', txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};
export const ACCEPTED_EXTENSIONS = Object.keys(TYPES);

const safeName = name => {
  const cleaned = name.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/^[.\s]+/, '').trim();
  const dot = cleaned.lastIndexOf('.');
  return cleaned.slice(0, dot).slice(0, 140) + cleaned.slice(dot).toLowerCase();
};

async function readBody(req, limit) {
  if (Number(req.headers['content-length']) > limit) return null;
  const chunks = []; let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

/** POST /api/orders/:id/files — the signed-in client adds files to one of their own orders. */
export async function uploadOrderFiles(req, json, db, user, path) {
  const orderId = orderFilesPath.exec(path)[1];
  const order = await db.prepare('SELECT status FROM orders WHERE id=? AND customer_id=?').get(orderId, user.id);
  if (!order) return json(404, { error: 'Order not found.' });
  if (order.status === 'Cancelled') return json(409, { error: 'Files cannot be added to a cancelled order.' });
  const bytes = await readBody(req, MAX_FILES_PER_UPLOAD * MAX_FILE + 256 * 1024);
  if (!bytes) return json(413, { error: 'The upload is too large. Each file can be up to 20 MB.' });
  let data;
  try { data = await new Response(bytes, { headers: { 'Content-Type': req.headers['content-type'] } }).formData(); }
  catch { return json(400, { error: 'Invalid upload.' }); }
  const files = data.getAll('files').filter(file => file instanceof File);
  if (!files.length) return json(400, { error: 'Choose at least one file.' });
  if (files.length > MAX_FILES_PER_UPLOAD) return json(400, { error: `Upload up to ${MAX_FILES_PER_UPLOAD} files at a time.` });
  for (const file of files) {
    const extension = /\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1].toLowerCase();
    if (!extension || !TYPES[extension]) return json(400, { error: `${file.name}: this file type is not accepted.` });
    if (file.size < 1) return json(400, { error: `${file.name} is empty.` });
    if (file.size > MAX_FILE) return json(413, { error: `${file.name} is larger than 20 MB.` });
  }
  const { count } = await db.prepare('SELECT CAST(count(*) AS INTEGER) AS count FROM order_files WHERE order_id=?').get(orderId);
  if (Number(count) + files.length > MAX_FILES_PER_ORDER) return json(400, { error: `An order can hold up to ${MAX_FILES_PER_ORDER} files.` });
  const now = new Date().toISOString();
  for (const file of files) {
    const extension = /\.([a-z0-9]{1,5})$/i.exec(file.name)[1].toLowerCase();
    await db.prepare('INSERT INTO order_files(order_id,uploaded_by,filename,mime,size,content,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(orderId, 'customer', safeName(file.name), TYPES[extension], file.size, Buffer.from(await file.arrayBuffer()), now);
  }
  return json(201, { uploaded: files.length });
}

/** GET a stored file. customerId limits it to that client's orders; null is the lab's own access. */
export async function sendOrderFile(res, json, db, path, customerId) {
  const match = orderFilePath.exec(path);
  if (!match) return false;
  const file = await db.prepare(`SELECT f.filename,f.mime,f.content FROM order_files f JOIN orders o ON o.id=f.order_id
    WHERE f.id=? AND f.order_id=? AND (CAST(? AS INTEGER) IS NULL OR o.customer_id=?)`).get(Number(match[2]), match[1], customerId, customerId);
  if (!file) { json(404, { error: 'File not found.' }); return true; }
  res.writeHead(200, { 'Content-Type': file.mime, 'Content-Disposition': `attachment; filename="${file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"` });
  res.end(Buffer.from(file.content));
  return true;
}
