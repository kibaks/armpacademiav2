import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createMuseTalkTutorVideoRouter } from '../backend/musetalkTutorVideo';
async function harness() {
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
  app.use('/video', createMuseTalkTutorVideoRouter({ db: () => db, env: { MUSETALK_API_KEY: 'private-key', MUSETALK_API_URL: 'https://worker.example/musetalk', MUSETALK_VIDEO_DAILY_LIMIT: '1', TUTOR_VIDEO_ENABLED: 'true' },
    authenticate: (req: any, res, next) => { if (!req.headers.authorization) return void res.sendStatus(401); req.identity = { uid: req.headers.authorization }; next(); },
    synthesize: async () => ({ audioBuffer: Buffer.alloc(100, 1), mimeType: 'audio/wav' }),
    fetcher: (async (url: any, options: any) => {
      assert.equal(options.headers.authorization, 'Bearer private-key');
      if (options.method === 'POST') { submissions++; return Response.json({ id: JSON.parse(options.body).id }); }
      if (String(url).endsWith('/media')) return new Response('mp4-data');
      polls++; return Response.json({ status: 'COMPLETED' });
    }) as typeof fetch,
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/video`;
  const post = (text = 'Bonjour. Comparons les offres.') => fetch(base, { method: 'POST', headers: { authorization: 'owner', 'content-type': 'application/json' }, body: JSON.stringify({ text, persona: 'vivienne' }) });
  return { base, post, counts: () => ({ submissions, polls }), close: () => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }) };
}
test('MuseTalk submits once, protects generated media and never exposes the worker credential', async () => {
  const h = await harness();
  try {
    const [a,b] = await Promise.all([h.post(), h.post()]);
    assert.equal(a.status, 202); const { id } = await a.json(); assert.deepEqual(await b.json(), { id });
    assert.equal((await fetch(`${h.base}/${id}`, { headers: { authorization: 'other' } })).status, 404);
    const ready = await (await fetch(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json();
    assert.equal(ready.status, 'COMPLETED'); assert.ok(!JSON.stringify(ready).includes('private-key'));
    assert.equal((await fetch(`${h.base}/${id}/media`)).status, 401);
    assert.equal((await fetch(`${h.base}/${id}/media`, { headers: { authorization: 'other' } })).status, 404);
    assert.equal(await (await fetch(`${h.base}/${id}/media`, { headers: { authorization: 'owner' } })).text(), 'mp4-data');
    assert.equal((await h.post('Une nouvelle phrase.')).status, 429);
    assert.deepEqual(h.counts(), { submissions: 1, polls: 1 });
  } finally { await h.close(); }
});
test('excessive answers cannot overload the GPU', async () => {
  const h = await harness();
  try { assert.equal((await h.post('mot '.repeat(500))).status, 400); assert.equal(h.counts().submissions, 0); }
  finally { await h.close(); }
});
