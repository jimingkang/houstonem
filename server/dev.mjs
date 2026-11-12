// Development: Angular dev server (live reload, proxies /api) and the API in one command.
import { spawn } from 'node:child_process';
const run = (cmd, args, env = {}) => spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
const api = run(process.execPath, ['server/index.mjs'], { NODE_ENV: 'development', PORT: '3001', HOST: '127.0.0.1', STATIC_DIR: '' });
const web = run('npx', ['ng', 'serve', '--host', '127.0.0.1']);
const stop = () => { api.kill(); web.kill(); };
for (const child of [api, web]) child.on('exit', code => { stop(); process.exitCode = code ?? 0; });
process.on('SIGINT', stop); process.on('SIGTERM', stop);
