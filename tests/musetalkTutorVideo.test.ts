import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'node:events';
import { createHmac } from 'node:crypto';
import { createMuseTalkTutorVideoRouter } from '../backend/musetalkTutorVideo';
async function harness(workerStatus = 'COMPLETED', progressive = false, consistent = false) {
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
  const env = { TUTOR_CONSISTENT_VOICE: consistent ? 'true' : 'false', MUSETALK_API_KEY: 'private-key', MUSETALK_API_URL: 'https://worker.example/musetalk', MUSETALK_VIDEO_DAILY_LIMIT: '1', TUTOR_VIDEO_ENABLED: 'true', MUSETALK_PROGRESSIVE: progressive ? 'true' : 'false' };
  const router = createMuseTalkTutorVideoRouter({ db: () => db, env,
    authenticate: (req: any, res, next) => { if (!req.headers.authorization) return void res.sendStatus(401); req.identity = { uid: req.headers.authorization }; next(); },
    synthesize: async () => ({ audioBuffer: Buffer.alloc(100, 1), mimeType: 'audio/wav' }),
    fetcher: (async (url: any, options: any) => {
      records.set('last-worker-url', String(url));
      if(options.body && String(url).endsWith('/jobs'))records.set('last-worker-submission',JSON.parse(options.body));
      assert.equal(options.headers.authorization, 'Bearer private-key');
      if (String(url).endsWith('/national/speech')) {
        const body=JSON.parse(options.body);
        records.set('national-request',body);
        const audio=Buffer.alloc(100);audio.write('ID3');
        return Response.json({language:body.language,voiceId: body.voiceMode === 'consistent' ? `academia-${body.voice}-v1` : undefined, provider:!consistent && body.language === 'sw' ? 'national-vits' : 'national-omnivoice',mimeType:'audio/mpeg',audioData:audio.toString('base64')});
      }
      if (options.method === 'POST') { submissions++; return Response.json({ id: JSON.parse(options.body).id }); }
      if (String(url).endsWith('/media')) {
        if (options.headers.range === 'bytes=0-2') return new Response('mp4', { status: 206, headers: { 'content-range': 'bytes 0-2/8', 'content-length': '3', 'accept-ranges': 'bytes' } });
        return new Response('mp4-data');
      }
      polls++; return Response.json({ status: workerStatus, durationSeconds: 12.5 });
    }) as typeof fetch,
  });
  // Drive Express middleware directly; these tests need no listening socket.
  const request = (url: string, init: RequestInit = {}) => new Promise<Response>((resolve, reject) => {
    const req = { query: Object.fromEntries(new URL(url).searchParams), url: new URL(url).pathname.replace(/^\/video/, '') || '/', method: init.method || 'GET',
      headers: Object.fromEntries(new Headers(init.headers).entries()), body: init.body ? JSON.parse(String(init.body)) : undefined };
    const res: any = new EventEmitter();
    const headers = new Headers();
    const chunks: Buffer[] = [];
    res.statusCode = 200;
    res.set = (name: string, value: string) => { headers.set(name, value); return res; };
    res.status = (value: number) => { res.statusCode = value; return res; };
    res.type = (value: string) => res.set('content-type', value);
    res.flushHeaders = () => { res.headersSent = true; };
    res.write = (value: Uint8Array) => { chunks.push(Buffer.from(value)); return true; };
    res.end = () => { resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers })); return res; };
    res.json = (value: unknown) => { res.type('application/json'); chunks.push(Buffer.from(JSON.stringify(value))); return res.end(); };
    res.sendStatus = (status: number) => { res.status(status); return res.end(); };
    res.destroy = () => reject(new Error('Response destroyed'));
    (router as any).handle(req, res, (error?: unknown) => reject(error || new Error('Unhandled route')));
  });
  const base = 'https://local.test/video';
  const post = (text = 'Bonjour. Comparons les offres.', language = 'fr', lesson?: unknown) => request(base, { method: 'POST', headers: { authorization: 'owner', 'content-type': 'application/json' }, body: JSON.stringify({ text, persona: 'vivienne', language, ...(lesson ? {lesson} : {}) }) });
  return { base, post, request, records, env, counts: () => ({ submissions, polls }), close: async () => undefined };

}
test('MuseTalk submits once, protects generated media and never exposes the worker credential', async () => {
  const h = await harness();
  try {
    const [a,b] = await Promise.all([h.post(), h.post()]);
    assert.equal(a.status, 202); const { id } = await a.json(); assert.deepEqual(await b.json(), { id });
    assert.equal((await h.request(`${h.base}/${id}`, { headers: { authorization: 'other' } })).status, 404);
    const ready = await (await h.request(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json();
    assert.equal(ready.status, 'COMPLETED'); assert.ok(!JSON.stringify(ready).includes('private-key'));
    const playback = new URL(ready.videoUrl);
    assert.equal(playback.origin, 'https://worker.example');
    assert.equal(playback.pathname, `/musetalk/jobs/${id}/play`);
    assert.equal(playback.searchParams.get('token'), createHmac('sha256', 'private-key').update(`${id}:${playback.searchParams.get('expires')}`).digest('hex'));
    const cached = await (await h.request(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json();
    assert.equal(cached.status, 'COMPLETED');
    assert.equal(h.counts().polls, 1, 'completed playback must not poll the worker again');
    const reused = await h.post();
    assert.equal(reused.status, 200);
    assert.equal((await reused.json()).status, 'COMPLETED');
    assert.equal(h.counts().submissions, 1, 'cached playback must not submit another generation');
    h.records.get(`musetalkTutorJobs/${id}`).status = 'FAILED';
    const recovered = await (await h.request(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json();
    assert.equal(recovered.status, 'COMPLETED');
    assert.equal((await h.request(`${h.base}/${id}/media`)).status, 401);
    assert.equal((await h.request(`${h.base}/${id}/media`, { headers: { authorization: 'other' } })).status, 404);
    assert.equal(await (await h.request(`${h.base}/${id}/media`, { headers: { authorization: 'owner' } })).text(), 'mp4-data');
    const partial = await h.request(`${h.base}/${id}/media`, { headers: { authorization: 'owner', range: 'bytes=0-2' } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('content-range'), 'bytes 0-2/8');
    assert.equal(partial.headers.get('accept-ranges'), 'bytes');
    assert.equal(await partial.text(), 'mp4');
    assert.equal((await h.post('Une nouvelle phrase.')).status, 202);
    assert.deepEqual(h.counts(), { submissions: 2, polls: 2 });
  } finally { await h.close(); }
});
test('invalid speech input is rejected without submitting GPU work', async () => {
  const h = await harness();
  try { assert.equal((await h.post('mot '.repeat(800))).status, 400); assert.equal(h.counts().submissions, 0); }
  finally { await h.close(); }
});
test('self-hosted video ignores the old daily limit and never creates quota records', async () => {
  const h = await harness();
  for (let index = 0; index < 8; index++) assert.equal((await h.post(`Réponse numéro ${index}.`)).status, 202);
  assert.equal(h.counts().submissions, 8);
  assert.ok(![...h.records.keys()].some(key => key.startsWith('musetalkTutorQuotas/')));
  const config = await (await h.request(`${h.base}/config`, { headers: { authorization: 'owner' } })).json();
  assert.equal(config.dailyLimit, null);
  assert.equal(config.maxDurationSeconds, null);
});
test('a growing MP4 is not exposed as playable before finalization', async () => {
  const h = await harness('STREAMING');
  const { id } = await (await h.post()).json();
  const result = await (await h.request(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json();
  assert.equal(result.status, 'PENDING');
  assert.equal(result.videoUrl, undefined);
  assert.notEqual(h.records.get(`musetalkTutorJobs/${id}`).status, 'COMPLETED');
  assert.equal((await h.request(`${h.base}/${id}`, { headers: { authorization: 'other' } })).status, 404);
  assert.equal(h.counts().submissions, 1);
});

test('only opted-in MSE clients receive a signed progressive stream, still bound to their owner', async () => {
  const h = await harness('STREAMING', true);
  const { id } = await (await h.post()).json();
  const config = await (await h.request(`${h.base}/config`, { headers: { authorization: 'owner' } })).json();
  assert.equal(config.progressiveStreaming, true);
  assert.equal((await (await h.request(`${h.base}/${id}`, { headers: { authorization: 'owner' } })).json()).status, 'PENDING');
  const ready = await (await h.request(`${h.base}/${id}?progressive=1`, { headers: { authorization: 'owner' } })).json();
  assert.equal(ready.status, 'STREAMING');
  assert.equal(ready.audioUrl.replace('/audio?','/play?'),ready.videoUrl);
  assert.ok(!ready.audioUrl.includes('private-key'));
  assert.equal(ready.durationSeconds,12.5);
  assert.ok(ready.videoUrl.startsWith('https://worker.example/musetalk/jobs/'));
  assert.ok(!ready.videoUrl.includes('private-key'));
  assert.notEqual(h.records.get(`musetalkTutorJobs/${id}`).status, 'COMPLETED');
  assert.equal((await h.request(`${h.base}/${id}?progressive=1`, { headers: { authorization: 'other' } })).status, 404);
});

test('national video uses its own voice and distinct language cache without French pronunciation',async()=>{
 const h=await harness();
 const ln=await h.post('Mbote.','ln'); assert.equal(ln.status,202);
 assert.deepEqual(h.records.get('national-request'),{text:'Mbote.',language:'ln'});
 const lnId=(await ln.json()).id;
 const sw=await h.post('Mbote.','sw'); assert.equal(sw.status,202);
 assert.notEqual((await sw.json()).id,lnId);
 assert.equal(h.records.get('national-request').language,'sw');
 const calls=h.counts().submissions;
 assert.equal((await h.post('Mbɔ́tɛ.','ln')).status,202);
 assert.equal(h.counts().submissions,calls+1);
});

test('a warm video router uses the rotated gateway for submission and signed playback', async()=>{
 const h=await harness(); h.env.MUSETALK_API_URL='https://replacement.trycloudflare.com/musetalk';
 const response=await h.post(); assert.equal(response.status,202);
 assert.equal(h.records.get('last-worker-url'),'https://replacement.trycloudflare.com/musetalk/jobs');
 const {id}=await response.json();
 const result=await (await h.request(`${h.base}/${id}`,{headers:{authorization:'owner'}})).json();
 assert.equal(new URL(result.videoUrl).origin,'https://replacement.trycloudflare.com');
 assert.equal(new URL(result.audioUrl).origin,'https://replacement.trycloudflare.com');
});

test('video uses the same speaker conditioning as audio in every language', async () => {
 const h = await harness('COMPLETED', false, true);
 for (const language of ['fr', 'ln', 'sw', 'kg', 'lua']) {
  assert.equal((await h.post('Formation Mbote Moyo', language)).status, 202);
  const body = h.records.get('national-request');
  assert.equal(body.voice, 'female');
  assert.equal(body.voiceMode, 'consistent');
  assert.equal(body.language, language);
 }
});

const motionStory={title:'Le besoin',chapter:'Préparer un achat utile',sceneIndex:0,sceneCount:2,terms:['Besoin','Usage'],cues:[{text:'Définir le besoin avant de chercher un fournisseur.',start:0,phase:'explanation'}],legalRef:'Extrait du cours',music:false};
test('lesson scenes use the deployed worker and have a content-sensitive private cache',async()=>{
 const h=await harness();
 const a=await h.post('Définir le besoin.','fr',motionStory);assert.equal(a.status,202);const {id}=await a.json();
 assert.deepEqual(h.records.get('last-worker-submission').lesson,motionStory);
 assert.equal(h.records.get(`musetalkTutorJobs/${id}`).kind,'motion-scene');
 const b=await h.post('Définir le besoin.','fr',{...motionStory,music:true});assert.notEqual((await b.json()).id,id);
 assert.equal((await h.post('Texte.','fr',{...motionStory,cues:[{text:'Texte',start:2,phase:'rule'}]})).status,400);
});
test('a chapter film can assemble only completed motion scenes owned by its learner',async()=>{
 const h=await harness();
 const first=(await(await h.post('Premier.','fr',motionStory)).json()).id;
 const second=(await(await h.post('Second.','fr',{...motionStory,sceneIndex:1})).json()).id;
 for(const id of [first,second])await h.request(`${h.base}/${id}`,{headers:{authorization:'owner'}});
 const film=()=>h.request(h.base+'/film',{method:'POST',headers:{authorization:'owner','content-type':'application/json'},body:JSON.stringify({parts:[first,second]})});
 const created=await film();assert.equal(created.status,202);const {id}=await created.json();
 const ready=await(await h.request(`${h.base}/${id}`,{headers:{authorization:'owner'}})).json();assert.equal(ready.status,'COMPLETED');assert.ok(ready.videoUrl.startsWith('https://worker.example/'));
 assert.equal((await h.request(`${h.base}/${id}`,{headers:{authorization:'other'}})).status,404);
 h.records.get(`musetalkTutorJobs/${first}`).uid='other';assert.equal((await film()).status,404);
});
