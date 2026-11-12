import { updateOrderStatus } from './orders.mjs';

export const reportUploadPath = /^\/api\/admin\/customers\/(\d+)\/reports$/;
const subscriptionPath = /^\/api\/admin\/customers\/(\d+)\/subscriptions$/;
const orderStatusPath = /^\/api\/admin\/orders\/([a-zA-Z0-9_-]{1,100})\/status$/;
const MAX_PDF = 25 * 1024 * 1024;

class InputError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function readBody(req, limit) {
  if (Number(req.headers['content-length']) > limit) throw new InputError(413, 'Request is too large.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) throw new InputError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

async function readJson(req) {
  const bytes = await readBody(req, 8192);
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw new InputError(400, 'Invalid JSON.'); }
}

function field(value, label, max) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > max) throw new InputError(400, `Enter ${label} (1–${max} characters).`);
  return normalized;
}

function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = new Date(value + 'T00:00:00Z');
  return Number.isFinite(time.valueOf()) && time.toISOString().slice(0, 10) === value;
}

export async function mutateAdmin(req, json, db, path) {
  const report = reportUploadPath.exec(path);
  const subscription = subscriptionPath.exec(path);
  const order = orderStatusPath.exec(path);

  try {
    if (report || subscription) {
      const customerId = Number((report || subscription)[1]);
      if (!Number.isSafeInteger(customerId) || !await db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) {
        return json(404, { error: 'Customer not found.' });
      }
      if (subscription) {
        const body = await readJson(req);
        const service = field(body?.service, 'a service', 120);
        const plan = field(body?.plan, 'a plan', 120);
        const renewal = body?.renewal_date || null;
        if (renewal !== null && !date(renewal)) return json(400, { error: 'Enter a valid renewal date.' });
        const { id } = await db.prepare('INSERT INTO subscriptions(customer_id,service,plan,status,renewal_date) VALUES(?,?,?,?,?) RETURNING id').get(customerId,service,plan,'Active',renewal);
        return json(201, { id: Number(id) });
      }

      const bytes = await readBody(req, MAX_PDF + 64 * 1024);
      let data;
      try { data = await new Response(bytes, { headers: { 'Content-Type': req.headers['content-type'] } }).formData(); }
      catch { return json(400, { error: 'Invalid report upload.' }); }
      const title = field(data.get('title'), 'a report title', 150);
      const sample = field(data.get('sample_id'), 'a sample ID', 100);
      const analysis = field(data.get('analysis'), 'an analysis type', 120);
      const file = data.get('file');
      if (!(file instanceof File) || !/\.pdf$/i.test(file.name) || file.size < 5) return json(400, { error: 'Choose a PDF report.' });
      if (file.size > MAX_PDF) return json(413, { error: 'The PDF must be no larger than 25 MB.' });
      const content = Buffer.from(await file.arrayBuffer());
      if (content.subarray(0,5).toString() !== '%PDF-') return json(400, { error: 'The file is not a PDF.' });
      const filename = file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,-4).slice(0,145) + '.pdf';
      const { id } = await db.prepare('INSERT INTO reports(customer_id,title,sample_id,analysis,status,issued_at,filename,mime,content) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id')
        .get(customerId,title,sample,analysis,'Ready',new Date().toISOString().slice(0,10),filename,'application/pdf',content);
      return json(201, { id: Number(id) });
    }

    if (order) {
      const body = await readJson(req);
      if (!['Confirmed - awaiting payment','Fulfilled','Cancelled'].includes(body?.status)) {
        return json(400, { error: 'Choose a supported order status.' });
      }
      try { await updateOrderStatus(db,order[1],body.status); }
      catch (error) {
        if (error.message === 'Order not found.') return json(404,{error:error.message});
        if (error.message === 'Invalid order status transition.') return json(409,{error:'This order status has changed or cannot be set.'});
        throw error;
      }
      return json(200,{status:body.status});
    }

    return json(405, { error: 'Method not allowed.' });
  } catch (error) {
    if (error instanceof InputError) return json(error.status, { error: error.message });
    throw error;
  }
}
