import http from 'node:http';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';
const { default: handler } = await import('../api/index.js');
const server = http.createServer(handler).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
  for (const [path, method] of [['/api/admin/health', 'GET'], ['/api/storage/images', 'POST'], ['/api/auth/session', 'GET'], ['/api/2fa/send', 'POST'], ['/api/2fa/verify', 'POST'], ['/api/cgpmp/send-credentials-email', 'POST']]) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method });
    assert.equal(response.status, 401, `${path}: compiled API must start and reject unauthenticated access`);
    assert.equal((await response.json()).error, 'Connexion requise.');
  }
  for (const path of ['/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/password/confirm']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST' });
    assert.equal(response.status, 400, `${path}: account route must exist and validate its inputs`);
  }
  console.log('Compiled API startup verified without CommonJS-to-ESM require support.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
