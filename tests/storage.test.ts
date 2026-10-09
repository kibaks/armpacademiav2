import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createStorageRouter } from '../backend/storage';
import { MAX_IMAGE_BYTES } from '../shared/imageUpload';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYBsAAAAASUVORK5CYII=', 'base64');
let upstreamCalls = 0;
let upstreamStatus = 201;
let upstreamPayload: any = { data: { id: 'file-1', url: '/storage/academia/avatars/photo.png', visibility: 'public' } };
let uploadedForm: FormData;
let uploadedHeaders: any;
const app = express();
app.use(express.json());
app.use('/api/storage', createStorageRouter({
  authenticate: (req: any, res, next) => {
    if (req.headers.authorization !== 'Bearer valid') { res.status(401).json({ error: 'Connexion requise.' }); return; }
    req.identity = { uid: 'owner-123' }; next();
  },
  fetch: (async (url: any, options: any) => {
    assert.equal(url, 'https://academia.137.184.59.184.nip.io/api/files');
    upstreamCalls++; uploadedForm = options.body; uploadedHeaders = options.headers;
    return new Response(JSON.stringify(upstreamPayload), { status: upstreamStatus });
  }) as typeof fetch,
}));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const port = (server.address() as any).port;
after(() => server.close());
const request = (name = 'photo.png', body = png, token = 'valid', extra = {}) => fetch(`http://127.0.0.1:${port}/api/storage/images`, {
  method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream', 'X-Upload-Filename': encodeURIComponent(name), 'X-Upload-Category': 'avatars', ...extra }, body,
});
test('unauthenticated uploads never reach the storage provider', async () => {
  const before = upstreamCalls;
  assert.equal((await request('photo.png', png, 'invalid')).status, 401);
  assert.equal(upstreamCalls, before);
});
test('image upload uses server-derived ownership and normalizes relative URLs', async () => {
  const response = await request();
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.url, 'https://academia.137.184.59.184.nip.io/storage/academia/avatars/photo.png');
  assert.equal(uploadedForm.get('uploaded_by'), 'owner-123');
  assert.equal(uploadedForm.get('entity_id'), 'owner-123');
  assert.equal((uploadedForm.get('file') as File).type, 'image/png');
  assert.equal('Authorization' in uploadedHeaders, false);
});
test('unsupported extensions, forged images and malformed filenames are rejected', async () => {
  const before = upstreamCalls;
  assert.equal((await request('photo.bmp')).status, 400);
  assert.equal((await request('photo.jpg', Buffer.from('<script>bad</script>'))).status, 400);
  assert.equal((await request('../photo.png')).status, 400);
  assert.equal((await request('empty.png', Buffer.alloc(0))).status, 400);
  assert.equal(upstreamCalls, before);
});
test('oversized images are rejected before forwarding', async () => {
  const before = upstreamCalls;
  assert.equal((await request('photo.png', Buffer.alloc(MAX_IMAGE_BYTES + 1))).status, 413);
  assert.equal(upstreamCalls, before);
});
test('upstream failures and malformed success responses cannot become upload successes', async () => {
  upstreamStatus = 500;
  assert.equal((await request()).status, 502);
  upstreamStatus = 201; upstreamPayload = { success: true };
  assert.equal((await request()).status, 502);
  upstreamPayload = { data: { url: 'https://unexpected.example/image.png' } };
  assert.equal((await request()).status, 502);
});
