import { createServer } from 'node:http';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify, parseEnv } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { openDatabase } from './db.mjs';
import { seedTestCustomer } from './seed-test.mjs';
import { createChatHandler } from './chat.mjs';
import { customerOrders } from './orders.mjs';
import { submitServiceOrder } from './service-orders.mjs';
import { createStaticHandler } from './static.mjs';
const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
export function createPortalServer(db = openDatabase(), options = {}) {
  const chat = createChatHandler(options.chat);
  const site = options.staticDir ? createStaticHandler(options.staticDir) : null;
  const attempts = new Map();
  const dummySalt = randomBytes(16).toString('hex');
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const json = (status, body) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(body)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (site && path !== '/api' && !path.startsWith('/api/')) return site(req,res,path);
      if (req.method === 'POST') {
        const origin = req.headers.origin;
        // Behind an HTTPS proxy the browser origin is https:// while the request reaches Node as http://.
        const allowed = process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : [`http://${req.headers.host}`,`https://${req.headers.host}`];
        if (origin && !allowed.includes(origin)) return json(403,{error:'Invalid request origin.'});
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415,{error:'JSON required.'});
      }
      const token = /(?:^|;\s*)hem_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
      const user = token && db.prepare('SELECT c.id,c.email,c.name,c.company FROM sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND s.expires>?').get(hash(token),Date.now());
      if (path === '/api/service-orders' && req.method === 'POST') return await submitServiceOrder(req,json,db,user);
      if (path === '/api/chat' && req.method === 'POST') return await chat(req,json,db,user);
      if (path === '/api/login' && req.method === 'POST') {
        const ip = req.socket.remoteAddress;
        const recent = (attempts.get(ip) || []).filter(t => t > Date.now()-900000);
        if (recent.length >= 10) return json(429,{error:'Too many attempts. Please try again in 15 minutes.'});
        attempts.set(ip,[...recent,Date.now()]);
        let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 4096) return json(413,{error:'Request too large.'}); }
        let body; try { body=JSON.parse(raw); } catch { return json(400,{error:'Invalid request.'}); }
        if (typeof body?.email !== 'string' || typeof body.password !== 'string' || body.password.length>256) return json(400,{error:'Email and password required.'});
        const customer = db.prepare('SELECT * FROM customers WHERE email=?').get(body.email.trim().toLowerCase());
        const candidate = await derive(body.password,customer?.salt || dummySalt,64);
        if (!customer || !timingSafeEqual(candidate,Buffer.from(customer.password_hash,'hex'))) return json(401,{error:'Email or password is incorrect.'});
        attempts.delete(ip);
        const session = randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(session),customer.id,Date.now()+28800000);
        res.setHeader('Set-Cookie',`hem_session=${session}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);
        return json(200,{ok:true});
      }
      if (!user) return json(401,{error:'Please sign in to your client account.'});
      if (path === '/api/logout' && req.method === 'POST') {
        db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
        res.setHeader('Set-Cookie',`hem_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`);
        return json(200,{ok:true});
      }
      if (path === '/api/portal' && req.method === 'GET') return json(200,{customer:user,orders:customerOrders(db,user.id),subscriptions:db.prepare('SELECT id,service,plan,status,renewal_date FROM subscriptions WHERE customer_id=?').all(user.id),reports:db.prepare('SELECT id,title,sample_id,analysis,status,issued_at,filename FROM reports WHERE customer_id=? ORDER BY id DESC').all(user.id)});
      const match = /^\/api\/reports\/(\d+)\/download$/.exec(path);
      if (match && req.method === 'GET') {
        const report = db.prepare("SELECT * FROM reports WHERE id=? AND customer_id=? AND status='Ready' AND content IS NOT NULL").get(Number(match[1]),user.id);
        if (!report) return json(404,{error:'Report not available.'});
        res.writeHead(200,{'Content-Type':report.mime || 'application/octet-stream','Content-Disposition':`attachment; filename="${report.filename.replace(/[^a-zA-Z0-9._-]/g,'_')}"`});
        return res.end(Buffer.from(report.content));
      }
      return json(404,{error:'Not found.'});
    } catch (error) { console.error(error); if (!res.headersSent) json(500,{error:'Unable to complete request. Please try again.'}); else res.end(); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Node's --env-file preserves inherited empty variables; use local values for those.
  if (existsSync('.env.local')) {
    for (const [key,value] of Object.entries(parseEnv(readFileSync('.env.local','utf8')))) {
      if (!process.env[key]?.trim()) process.env[key]=value;
    }
  }
  const db = openDatabase();
  if (process.env.NODE_ENV !== 'production') seedTestCustomer(db);
  // One process serves both the built site and /api. Hosts such as PocketBay set PORT and need 0.0.0.0.
  const port = Number(process.env.PORT || 3001), host = process.env.HOST || '0.0.0.0';
  const server=createPortalServer(db,{staticDir:process.env.STATIC_DIR ?? 'dist/houston-em'});
  server.listen(port,host,()=>console.log(`Houston EM site and API listening on http://${host}:${port}`));
}
