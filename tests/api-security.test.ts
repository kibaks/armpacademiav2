import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { services } from '../backend/admin';
import { app } from '../server';
import bank from '../backend/courseBank.json';

const { auth, db } = services();
mock.method(auth, 'verifyIdToken', async (token: string) => ({ uid: token, role: 'particulier' }));
const buckets = new Map();
let unavailable = false;
const attempts: any[] = [];
const learning = new Map();
mock.method(db, 'collection', (name: string) => ({
  doc: (id: string) => ({ name, id, get: async () => ({ exists: false }), set: async () => {} }),
  add: async (value: any) => { attempts.push(value); },
}));
mock.method(db, 'runTransaction', async (fn: any) => {
  if (unavailable) throw new Error('database-unavailable');
  return fn({ get: async (ref: any) => ({ data: () => ref.name === 'apiQuotas' ? buckets.get(ref.id) : learning.get(ref.id) }), set: (ref: any, value: any) => ref.name === 'apiQuotas' ? buckets.set(ref.id, value) : ref.name === 'learningRecords' ? learning.set(ref.id, value) : attempts.push(value) });
});
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(() => { server.close(); mock.restoreAll(); });
const request = (path: string, body: unknown = {}, token?: string) => fetch(`http://127.0.0.1:${(server.address() as any).port}/api/ai${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
});
test('costly endpoints require authentication before touching quotas or providers', async () => {
  for (const path of ['/tts', '/tutor', '/transcribe', '/flow-video/start', '/placement-quiz']) assert.equal((await request(path)).status, 401);
  assert.equal(buckets.size, 0);
});
test('learners cannot generate administrative reports or course modules', async () => {
  for (const path of ['/generate-report', '/generate-animated-module']) assert.equal((await request(path, {}, 'learner')).status, 403);
});
test('malformed tutor payloads return JSON errors and the next valid request still works', async () => {
  for (const body of [{ message: {} }, { history: {} }, { history: [{ sender: 'user', text: {} }] }]) assert.equal((await request('/tutor', body, 'learner')).status, 400);
  const valid = await request('/tutor', { message: 'Bonjour', history: [{ sender: 'user', text: 'Bonjour' }] }, 'learner');
  assert.equal(valid.status, 200);
  assert.equal(typeof (await valid.json()).reply, 'string');
});
test('placement omits answer keys and stores a server-computed zero with verified identity', async () => {
  const { questions } = await (await request('/placement-quiz', {}, 'learner')).json();
  assert.ok(questions.every((q: any) => !('correctIndex' in q)));
  const response = await request('/placement-quiz', { answers: questions.map((q: any) => ({ questionId: q.id, pickedIndex: 0, isCorrect: true })), profileId: 'admin', score: 100 }, 'learner');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).score, 0);
  assert.equal(attempts.at(-1).profileId, 'learner');
});
test('quotas survive application requests and database failures fail closed', async () => {
  buckets.set('limited', { bucket: Math.floor(Date.now() / 60000), count: 30 });
  assert.equal((await request('/tutor', { message: 'Bonjour' }, 'limited')).status, 429);
  unavailable = true;
  try { assert.equal((await request('/tutor', { message: 'Bonjour' }, 'learner')).status, 503); }
  finally { unavailable = false; }
});
test('course attempts persist canonical scores and stable certificates; repeated successes do not duplicate them', async () => {
  const course = bank[0];
  const attempt = (answers: number[]) => fetch(`http://127.0.0.1:${(server.address() as any).port}/api/courses/${course.id}/attempt`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer candidate' }, body: JSON.stringify({ answers, score: 100, certificates: [{ id: 'forged' }] }) });
  const failed = await attempt(course.quiz.map(q => (q.correctIndex + 1) % q.options.length));
  assert.equal(failed.status, 200);
  assert.equal((await failed.json()).score, 0);
  assert.equal(learning.get('candidate').certificates.length, 0);
  for (let index = 0; index < 2; index++) assert.equal((await attempt(course.quiz.map(q => q.correctIndex))).status, 200);
  const record = learning.get('candidate');
  assert.equal(record.certificates.length, 1);
  assert.equal(record.completedModulesCount, 1);
  assert.ok(record.certificates[0].id.startsWith('CERT-'));
  assert.equal(record.certificates[0].score, 100);
});
