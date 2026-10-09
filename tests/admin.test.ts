import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { adminRouter, learningRouter, services } from '../backend/admin';

const { auth, db } = services();
mock.method(auth, 'verifyIdToken', async (token: string) => {
  if (token === 'invalid') throw new Error('invalid-token');
  return { uid: token, role: token === 'admin' ? 'super_admin' : token === 'dfat' ? 'dfat_admin' : 'particulier', email: 'learner@example.com' };
});
mock.method(auth, 'createUser', async (data: any) => ({ uid: 'new-user', email: data.email, displayName: data.displayName }));
mock.method(auth, 'getUser', async (id: string) => ({ uid: id, email: 'user@example.com', customClaims: { role: id === 'protected' ? 'super_admin' : 'particulier' } }));
const claimChanges: any[] = [];
mock.method(auth, 'setCustomUserClaims', async (id: string, claims: any) => { claimChanges.push({ id, claims }); });
mock.method(auth, 'updateUser', async () => ({}));
mock.method(auth, 'revokeRefreshTokens', async () => {});
mock.method(auth, 'deleteUser', async () => {});
mock.method(auth, 'generatePasswordResetLink', async () => 'https://example.com/reset');
const fixture = { tests: [{ id: 'test-1', title: 'Test', level: 'Initiation', passPct: 60, active: true, questions: [{ id: 'q1', question: 'Question', options: ['A','B','C','D'], answer: 2 }] }] };
const writes: any[] = [];
mock.method(db, 'collection', (name: string) => ({
  doc: (id?: string) => ({ id: id || 'attempt-1', get: async () => ({ exists: true, data: () => fixture }), set: async (data: any) => { writes.push(data); }, update: async (data: any) => { writes.push(data); }, delete: async () => {} }),
  add: async (data: any) => { writes.push(data); },
  orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
}));
mock.method(db, 'runTransaction', async (fn: any) => fn({ get: async () => ({ data: () => fixture }), set: (_ref: any, data: any) => { writes.push(data); } }));
const app = express();
app.use(express.json()); app.use('/api/admin', adminRouter); app.use('/api', learningRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const port = (server.address() as any).port;
after(() => { server.close(); mock.restoreAll(); });
const request = (path: string, token?: string, body?: any) => fetch(`http://127.0.0.1:${port}/api${path}`, {
  method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
test('administrative endpoints require a verified privileged identity', async () => {
  assert.equal((await request('/admin/users')).status, 401);
  assert.equal((await request('/admin/users', 'invalid')).status, 401);
  assert.equal((await request('/admin/users', 'learner')).status, 403);
});
test('learners cannot write tests or configuration', async () => {
  assert.equal((await request('/level-tests', 'learner', { tests: [] })).status, 403);
  assert.equal((await request('/level-settings', 'learner', {})).status, 403);
});
test('learner reads omit answer keys and private attempts', async () => {
  const response = await request('/level-tests', 'learner');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal('answer' in data.tests[0].questions[0], false);
  assert.deepEqual(data.attempts, []);
  assert.equal((await (await request('/level-tests', 'admin')).json()).tests[0].questions[0].answer, 2);
});
test('score and identity are computed on the server, ignoring forged fields', async () => {
  const response = await request('/level-tests/attempt', 'learner', { testId: 'test-1', answers: [0], score: 100, passed: true, profileId: 'admin' });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.attempt.score, 0); assert.equal(data.attempt.passed, false);
  assert.equal(data.attempt.profileId, 'learner');
  const passed = await (await request('/level-tests/attempt', 'learner', { testId: 'test-1', answers: [2] })).json();
  assert.equal(passed.attempt.score, 100); assert.equal(passed.attempt.passed, true);
});
test('invalid answers, unknown tests and invalid thresholds are rejected', async () => {
  assert.equal((await request('/level-tests/attempt', 'learner', { testId: 'test-1', answers: [4] })).status, 400);
  assert.equal((await request('/level-tests/attempt', 'learner', { testId: 'missing', answers: [2] })).status, 400);
  assert.equal((await request('/level-settings', 'admin', { intermediaire: 100, avance: 101, expert: 102 })).status, 400);
});
test('saving tests never overwrites learner attempts', async () => {
  const response = await request('/level-tests', 'admin', { ...fixture, attempts: [{ score: 100, profileId: 'forged' }] });
  assert.equal(response.status, 200);
  assert.equal(writes.some(w => Array.isArray(w.attempts)), false);
});
test('only superadministrators can create users, with real Firebase UIDs and reset links', async () => {
  const body = { name: 'Test Account', email: 'test@example.com', role: 'formateur' };
  assert.equal((await request('/admin/users', 'dfat', body)).status, 403);
  const response = await request('/admin/users', 'admin', body);
  const data = await response.json();
  assert.equal(response.status, 201); assert.equal(data.profile.id, 'new-user');
  assert.equal(data.resetLink, 'https://example.com/reset');
  assert.equal('password' in data, false);
  assert.equal(claimChanges.at(-1).claims.role, 'formateur');
});
test('protected administrators and the current account cannot be removed or demoted', async () => {
  const mutate = (id: string, method: string) => fetch(`http://127.0.0.1:${port}/api/admin/users/${id}`, { method, headers: { Authorization: 'Bearer admin', 'Content-Type': 'application/json' }, ...(method === 'PATCH' ? { body: JSON.stringify({ role: 'particulier' }) } : {}) });
  assert.equal((await mutate('admin', 'DELETE')).status, 400);
  assert.equal((await mutate('protected', 'DELETE')).status, 400);
  assert.equal((await mutate('admin', 'PATCH')).status, 400);
  assert.equal((await mutate('protected', 'PATCH')).status, 400);
});
