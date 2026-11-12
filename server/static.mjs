import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml',
};

// Serves the built Angular site; unknown paths fall back to index.html so client-side routes work on reload.
export function createStaticHandler(directory = resolve('dist/houston-em')) {
  const root = resolve(directory);
  const index = join(root, 'index.html');
  return (req, res, pathname) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    if (!existsSync(index)) { res.writeHead(503, { 'Content-Type': 'text/plain' }); return res.end('Site not built. Run npm run build.'); }
    let file;
    try { file = resolve(root, '.' + decodeURIComponent(pathname)); } catch { res.writeHead(400); return res.end(); }
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(404); return res.end(); }
    let stat = existsSync(file) && statSync(file);
    if (stat && stat.isDirectory()) { file = join(file, 'index.html'); stat = existsSync(file) && statSync(file); }
    const isAsset = !!stat && stat.isFile();
    if (!isAsset) {
      // A missing file with an extension is a real 404; anything else is an app route.
      if (extname(pathname)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found.'); }
      file = index; stat = statSync(index);
    }
    const hashed = /-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': file === index ? 'no-cache' : hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  };
}
