import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import { createProfileMediaRouter } from '../backend/profileMedia';

const records = new Map<string, any>([['owner', { name: 'Test', role: 'independant', avatarUrl: 'https://images.example/old.jpg', coverUrl: '/assets/cover.webp' }], ['other', { avatarUrl: 'https://images.example/other.jpg' }]]);
let unavailable = false;
const db = {
 collection: () => ({ doc: (id: string) => ({ id, get: async () => ({ exists: records.has(id), data: () => structuredClone(records.get(id)) }) }) }),
 runTransaction: async (callback: any) => {
   if (unavailable) throw new Error('Unavailable');
   const writes: (() => void)[] = [];
   const result = await callback({
     get: async (ref: any) => ({ exists: records.has(ref.id), data: () => structuredClone(records.get(ref.id)) }),
     update: (ref: any, patch: any) => writes.push(() => records.set(ref.id, { ...records.get(ref.id), ...patch })),
   });
   writes.forEach(write => write()); return result;
 },
};
const app = express();
app.use(express.json());
app.use('/api/profile', createProfileMediaRouter({ db: () => db, authenticate: (req: any, res, next) => {
 if (req.headers.authorization !== 'Bearer valid') return void res.status(401).json({ error: 'Connexion requise.' });
 req.identity = { uid: 'owner' }; next();
} }));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(() => server.close());
const url = `http://127.0.0.1:${(server.address() as any).port}/api/profile/media`;
const request = (body: any, token = 'valid') => fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('only the authenticated owner’s media is saved and the response confirms both images', async () => {
 const response = await request({ avatarUrl: 'https://images.example/new.jpg' });
 assert.equal(response.status, 200);
 assert.equal(response.headers.get('Cache-Control'), 'no-store');
 const saved = (await response.json()).media;
 assert.equal(saved.avatarUrl, records.get('owner').avatarUrl);
 assert.equal(saved.coverUrl, '/assets/cover.webp');
 assert.equal(saved.mediaRevision, 1);
 assert.equal(records.get('other').avatarUrl, 'https://images.example/other.jpg');
 const cover = await request({ coverUrl: '/assets/new-cover.webp' });
 assert.equal((await cover.json()).media.mediaRevision, 2);
 assert.equal(records.get('owner').avatarUrl, 'https://images.example/new.jpg');
 const restored = await fetch(url, { headers: { Authorization: 'Bearer valid' } });
 assert.deepEqual((await restored.json()).media, { avatarUrl: 'https://images.example/new.jpg', coverUrl: '/assets/new-cover.webp', mediaRevision: 2 });
});
test('unauthenticated requests, identity overrides and unsafe image URLs cannot be written', async () => {
 const before = structuredClone(records.get('owner'));
 assert.equal((await request({ avatarUrl: 'https://images.example/new.jpg' }, 'invalid')).status, 401);
 for (const body of [{ uid: 'other', avatarUrl: 'https://images.example/new.jpg' }, { role: 'super_admin' }, { avatarUrl: 'javascript:alert(1)' }, { coverUrl: '//evil.example/image' }, { avatarUrl: 'data:image/png;base64,abc' }, {}]) assert.equal((await request(body)).status, 400);
 assert.deepEqual(records.get('owner'), before);
});
test('a failed database transaction cannot return success or change the saved image', async () => {
 const before = structuredClone(records.get('owner'));
 unavailable = true;
 assert.equal((await request({ avatarUrl: 'https://images.example/failed.jpg' })).status, 503);
 assert.deepEqual(records.get('owner'), before);
 unavailable = false;
});
