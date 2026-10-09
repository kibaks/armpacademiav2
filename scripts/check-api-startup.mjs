import http from 'node:http';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';
const { default: handler } = await import('../api/index.js');
const server = http.createServer(handler).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
  for (const [path, method] of [['/api/admin/health', 'GET'], ['/api/storage/images', 'POST']]) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method });
    assert.equal(response.status, 401, `${path}: compiled API must start and reject unauthenticated access`);
    assert.equal((await response.json()).error, 'Connexion Firebase requise.');
  }
  console.log('Compiled API startup verified without CommonJS-to-ESM require support.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
