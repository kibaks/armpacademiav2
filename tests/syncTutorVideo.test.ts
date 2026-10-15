import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createSyncTutorVideoRouter, normalizeVideoText, syncVideoConfiguration } from '../backend/syncTutorVideo';

async function harness(options: { limit?: string; disabled?: boolean; fail?: boolean; portrait?: boolean } = {}) {
  const records = new Map<string, any>();
  let submissions = 0, polls = 0;
  let tail = Promise.resolve();
  const snapshot = (ref: any) => ({ exists: records.has(ref.id), data: () => structuredClone(records.get(ref.id)) });
  const db = {
    collection: (collection: string) => ({ doc: (id: string) => {
      const ref = { id: `${collection}/${id}`, get: async () => snapshot(ref), update: async (patch: any) => { records.set(ref.id, { ...records.get(ref.id), ...patch }); } };
      return ref;
    } }),
    runTransaction: (callback: any) => {
      const task = tail.then(() => callback({ get: async (ref: any) => snapshot(ref), set: (ref: any, value: any) => records.set(ref.id, structuredClone(value)) }));
      tail = task.then(() => undefined, () => undefined); return task;
    },
  };
  const app = express(); app.use(express.json());
  app.use('/video', createSyncTutorVideoRouter({ db: () => db,
    env: { SYNC_API_KEY: 'test-private-key', SYNC_TUTOR_VIDEO_URL: options.portrait ? undefined : 'https://media.example/clean-master.mp4', SYNC_TUTOR_IMAGE_URL: options.portrait ? 'https://media.example/portrait.jpg' : undefined, SYNC_VIDEO_MODEL: options.portrait ? 'sync-3' : 'lipsync-2-pro', TUTOR_VIDEO_ENABLED: options.disabled ? 'false' : 'true', SYNC_VIDEO_DAILY_LIMIT: options.limit || '6' },
    authenticate: (req: any, res, next) => { const uid = req.headers.authorization; if (!uid) return void res.sendStatus(401); req.identity = { uid }; next(); },
    synthesize: async () => ({ audioBuffer: Buffer.alloc(100, 1), mimeType: 'audio/mpeg' }),
    fetcher: (async (url: any, init: any) => {
      assert.equal(init.headers['x-api-key'], 'test-private-key');
      if (init.method === 'POST') {
        submissions++;
        assert.match(init.headers['Idempotency-Key'], /^[a-f0-9]{64}$/);
        assert.ok(init.body instanceof FormData);
        assert.equal(init.body.get('model'), options.portrait ? 'sync-3' : 'lipsync-2-pro');
        assert.deepEqual(JSON.parse(init.body.get('input'))[0], options.portrait ? { type: 'image', url: 'https://media.example/portrait.jpg' } : { type: 'video', url: 'https://media.example/clean-master.mp4' });
        assert.equal(JSON.parse(init.body.get('options')).sync_mode, 'loop');
        assert.equal(init.body.get('audio').type, 'audio/mpeg');
        return Response.json(options.fail ? { error: 'secret upstream internals' } : { id: 'provider-job-1', status: 'PENDING' }, { status: options.fail ? 429 : 201 });
      }
      polls++; assert.ok(String(url).endsWith('/provider-job-1'));
      return Response.json({ status: 'COMPLETED', outputUrl: 'https://media.example/result.mp4' });
    }) as typeof fetch,
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/video`;
  const post = (text = 'Bonjour. Comparons les offres.', owner = 'owner', extra = {}) => fetch(base, { method: 'POST', headers: { authorization: owner, 'content-type': 'application/json' }, body: JSON.stringify({ text, persona: 'vivienne', ...extra }) });
  return { base, post, records, counts: () => ({ submissions, polls }), close: () => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }) };
}

test('video stays disabled until key, clean source and explicit activation are configured', () => {
  assert.equal(syncVideoConfiguration({ SYNC_API_KEY: 'key', SYNC_TUTOR_VIDEO_URL: 'https://media.example/source.mp4' }).enabled, false);
  assert.equal(syncVideoConfiguration({ SYNC_API_KEY: 'key', SYNC_TUTOR_VIDEO_URL: 'http://media.example/source.mp4', TUTOR_VIDEO_ENABLED: 'true' }).enabled, false);
  assert.equal(normalizeVideoText('**Bonjour** [le cours](https://example.org) `ici`'), 'Bonjour le cours ici');
});
test('one full audio is submitted once for concurrent identical requests, then the owner receives a cached video', async () => {
  const h = await harness();
  try {
    const [a, b] = await Promise.all([h.post(), h.post()]);
    assert.equal(a.status, 202); assert.equal(b.status, 202);
    const result = await a.json(); assert.deepEqual(await b.json(), result);
    const video = await fetch(`${h.base}/${result.id}`, { headers: { authorization: 'owner' } });
    assert.deepEqual(await video.json(), { status: 'COMPLETED', videoUrl: 'https://media.example/result.mp4' });
    await fetch(`${h.base}/${result.id}`, { headers: { authorization: 'owner' } });
    assert.deepEqual(h.counts(), { submissions: 1, polls: 1 });
    assert.equal((await h.post()).status, 202); assert.equal(h.counts().submissions, 1);
  } finally { await h.close(); }
});
test('authentication and job ownership prevent another user from retrieving video or spending against the owner', async () => {
  const h = await harness();
  try {
    assert.equal((await fetch(`${h.base}/config`)).status, 401);
    const { id } = await (await h.post(undefined, 'owner', { uid: 'other' })).json();
    assert.equal((await fetch(`${h.base}/${id}`, { headers: { authorization: 'other' } })).status, 404);
    assert.equal(h.counts().polls, 0);
    assert.equal((await fetch(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).status, 200);
  } finally { await h.close(); }
});
test('daily reservation blocks a different video while a duplicate does not consume another slot', async () => {
  const h = await harness({ limit: '1' });
  try {
    assert.equal((await h.post()).status, 202);
    assert.equal((await h.post()).status, 202);
    assert.equal((await h.post('Une autre réponse.')).status, 429);
    assert.equal(h.counts().submissions, 1);
  } finally { await h.close(); }
});
test('unsupported personas, excessive text and disabled configuration never call the paid API', async () => {
  const h = await harness(); const disabled = await harness({ disabled: true });
  try {
    assert.equal((await h.post('Bonjour', 'owner', { persona: 'henri' })).status, 400);
    assert.equal((await h.post('a'.repeat(1801))).status, 400);
    assert.equal((await disabled.post()).status, 503);
    assert.equal(h.counts().submissions + disabled.counts().submissions, 0);
  } finally { await h.close(); await disabled.close(); }
});
test('provider rejection hides internals and is not automatically submitted again', async () => {
  const h = await harness({ fail: true });
  try {
    const failed = await h.post(); assert.equal(failed.status, 503);
    assert.ok(!JSON.stringify(await failed.json()).includes('secret'));
    const { id } = await (await h.post()).json();
    assert.equal((await (await fetch(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json()).status, 'FAILED');
    assert.equal(h.counts().submissions, 1);
  } finally { await h.close(); }
});
test('Sync-3 receives the clean portrait and the full narration as distinct inputs', async () => {
  const h = await harness({ portrait: true });
  try { assert.equal((await h.post()).status, 202); assert.equal(h.counts().submissions, 1); }
  finally { await h.close(); }
});
