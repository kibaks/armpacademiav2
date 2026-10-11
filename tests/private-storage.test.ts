import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createPrivateStorageRouter, MAX_FILE_BYTES } from '../backend/privateStorage';
import { errorHandler } from '../backend/http';
const records = new Map<string, any>();
const bytes = new Map<string, Buffer>();
let downloads = 0;
let failWrite = false;
let failDelete = false;
const identity = (token: string) => { if (!['owner', 'other', 'mfa-owner'].includes(token)) throw new Error('invalid'); return { uid: token === 'mfa-owner' ? 'owner' : token, firebase: token === 'mfa-owner' ? { sign_in_second_factor: 'totp' } : {} }; };
let enrolled = false;
const deps = {
  auth: { createSessionCookie: async () => 'opaque-session', verifyIdToken: async (token: string) => identity(token), verifySessionCookie: async (token: string, checkRevoked: boolean) => { assert.equal(checkRevoked, true); return identity(token); }, getUser: async () => ({ multiFactor: { enrolledFactors: enrolled ? [{}] : [] } }) },
  db: { collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ data: () => name === 'privateFiles' ? records.get(id) : undefined }),
      set: async (value: any) => { if (failWrite) throw new Error('unavailable'); records.set(id, value); },
      delete: async () => { records.delete(id); },
    }),
    where: (_field: string, _op: string, owner: string) => ({
      orderBy: () => {
        const query = (cursor = '') => ({
          startAfter: (next: string) => query(next),
          limit: (limit: number) => ({ get: async () => {
            const docs = [...records.values()].filter(file => file.uploadedBy === owner && file.id > cursor).sort((a, b) => a.id.localeCompare(b.id)).slice(0, limit).map(file => ({ id: file.id, data: () => file }));
            return { docs, size: docs.length };
          } }),
        });
        return query();
      },
    }),
  }) },
  bucket: { file: (path: string) => ({ save: async (buffer: Buffer) => { bytes.set(path, buffer); }, delete: async () => { if (failDelete) throw new Error('unavailable'); bytes.delete(path); }, download: async () => { downloads++; return [bytes.get(path)]; } }) },
};
const app = express();
app.use('/api/storage', createPrivateStorageRouter({ services: () => deps, guard: (_req: any, _res: any, next: any) => next(), authenticate: (req: any, res: any, next: any) => { try { req.identity = identity(req.get('Authorization')?.slice(7)); next(); } catch { res.status(401).end(); } } }));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(() => server.close());
const request = (path = '/files', token = 'owner', options: any = {}) => fetch(`http://127.0.0.1:${(server.address() as any).port}/api/storage${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
const upload = (visibility = 'private', body = Buffer.from('%PDF-1.7\nexample'), name = 'document.pdf', token = 'owner') => request('/files', token, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Upload-Filename': encodeURIComponent(name), 'X-Upload-Visibility': visibility, 'X-Upload-Entity': 'other' }, body });
let file: any;
test('private uploads use verified ownership and never disclose bucket paths or download tokens', async () => {
  assert.equal((await upload('private', undefined, undefined, 'invalid')).status, 401);
  const response = await upload(); assert.equal(response.status, 201);
  file = (await response.json()).data;
  assert.equal(file.uploadedBy, 'owner'); assert.equal(file.entityId, 'owner'); assert.equal(file.path, '');
  assert.equal(file.url, `/api/storage/files/${file.id}/content`); assert.equal(file.url.includes('token='), false);
});
test('other users and anonymous callers cannot read, enumerate or delete private files', async () => {
  const before = downloads;
  assert.equal((await request(`/files/${file.id}/content`, 'invalid')).status, 401);
  assert.equal((await request(`/files/${file.id}/content`, 'other')).status, 404);
  assert.equal((await request(`/files/${file.id}`, 'other')).status, 404);
  assert.equal((await request(`/files/${file.id}`, 'other', { method: 'DELETE' })).status, 404);
  assert.deepEqual((await (await request('/files', 'other')).json()).data, []);
  assert.equal(downloads, before);
  const response = await request(`/files/${file.id}/content`);
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
test('native media cookies are HttpOnly and expired cookies cannot download a private object', async () => {
  const session = await request('/session', 'owner', { method: 'POST' });
  assert.equal(session.status, 200);
  assert.match(session.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(session.headers.get('set-cookie')!, /SameSite=Strict/);
  assert.match(session.headers.get('set-cookie')!, /Path=\/api\/storage/);
  const url = `http://127.0.0.1:${(server.address() as any).port}/api/storage/files/${file.id}/content`;
  assert.equal((await fetch(url, { headers: { Cookie: 'academia_media=owner' } })).status, 200);
  assert.equal((await fetch(url, { headers: { Cookie: 'academia_media=expired' } })).status, 401);
});
test('private content requires native MFA after enrollment even with an older cookie', async () => {
  enrolled = true;
  const before = downloads;
  assert.equal((await request(`/files/${file.id}/content`)).status, 403);
  assert.equal(downloads, before);
  assert.equal((await request(`/files/${file.id}/content`, 'mfa-owner')).status, 200);
  enrolled = false;
});
test('public documents, oversized files and failed metadata writes cannot become successful uploads', async () => {
  assert.equal((await upload('public')).status, 400);
  assert.equal((await upload('public', Buffer.from('<html><script>bad()</script></html>'), 'video.webm')).status, 400);
  assert.equal((await upload('private', Buffer.alloc(MAX_FILE_BYTES + 1))).status, 413);
  const before = bytes.size; failWrite = true;
  assert.equal((await upload()).status, 503);
  assert.equal(bytes.size, before); failWrite = false;
});
test('only an explicit public media upload is readable without authentication', async () => {
  const response = await upload('public', Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0]), 'video.webm');
  assert.equal(response.status, 201);
  const media = (await response.json()).data;
  assert.equal((await request(`/files/${media.id}/content`, 'invalid')).status, 200);
});
test('file enumeration paginates only the authenticated owner’s objects and rejects malformed cursors', async () => {
  const first = await (await request('/files?limit=1')).json();
  assert.equal(first.data.length, 1); assert.ok(first.nextCursor);
  const second = await (await request('/files?limit=1&cursor=' + first.nextCursor)).json();
  assert.equal(second.data.length, 1); assert.notEqual(first.data[0].id, second.data[0].id);
  assert.equal((await request('/files?limit=101')).status, 400);
  assert.equal((await request('/files?cursor=bad!')).status, 400);
});
test('failed object deletion preserves the registry and logout expires the media cookie', async () => {
  failDelete = true;
  assert.equal((await request(`/files/${file.id}`, 'owner', { method: 'DELETE' })).status, 503);
  assert.equal(records.has(file.id), true); failDelete = false;
  assert.equal((await request(`/files/${file.id}`, 'owner', { method: 'DELETE' })).status, 200);
  const response = await request('/session', 'invalid', { method: 'DELETE' });
  assert.match(response.headers.get('set-cookie')!, /academia_media=;/);
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
});
