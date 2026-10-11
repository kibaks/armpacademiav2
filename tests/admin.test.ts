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
const fixture = { revision: 'initial-revision', tests: [{ id: 'test-1', title: 'Test', level: 'Initiation', passPct: 60, active: true, questions: [{ id: 'q1', question: 'Question', options: ['A','B','C','D'], answer: 2 }] }] };
const writes: any[] = [];
const users = Array.from({ length: 501 }, (_, i) => ({ id: 'u' + String(i).padStart(4, '0'), data: () => ({ id: 'forged-id', name: 'Compte ' + i, role: 'particulier', level: 'Expert', certificationsCount: 99 }) }));
mock.method(db, 'getAll', async (...refs: any[]) => refs.map(ref => ({ id: ref.id, exists: ref.id === 'u0000', data: () => ({ level: 'Débutant', certificationsCount: 1 }) })));
mock.method(db, 'collection', (name: string) => ({
  doc: (id?: string) => ({ name, id: id || 'attempt-1', get: async () => ({ exists: true, data: () => fixture }), set: async (data: any) => { writes.push(data); if (name === 'settings' && id === 'levelTests') Object.assign(fixture, data); }, update: async (data: any) => { writes.push(data); }, delete: async () => {} }),
  add: async (data: any) => { writes.push(data); },
  orderBy: () => {
    const query = (cursor = '') => ({ startAfter: (value: string) => query(value), limit: (limit: number) => ({ get: async () => ({ docs: name === 'users' ? users.filter(user => user.id > cursor).slice(0, limit) : [] }) }) });
    return query();
  },
}));
mock.method(db, 'runTransaction', async (fn: any) => fn({ get: async () => ({ data: () => fixture }), set: (ref: any, data: any) => { writes.push(data); if (ref.name === 'settings' && ref.id === 'levelTests') Object.assign(fixture, data); } }));
const app = express();
app.use(express.json()); app.use('/api/admin', adminRouter); app.use('/api', learningRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const port = (server.address() as any).port;
after(() => { server.close(); mock.restoreAll(); });
const request = (path: string, token?: string, body?: any) => fetch(`http://127.0.0.1:${port}/api${path}`, {
  method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(path === '/level-tests/attempt' ? { version: fixture.revision, ...body } : body) }),
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


test('administrators can enumerate users beyond the first 500 with stable canonical IDs', async () => {
  const first = await (await request('/admin/users', 'admin')).json();
  assert.equal(first.users.length, 500); assert.equal(first.nextCursor, 'u0499');
  assert.equal(first.users[0].id, 'u0000');
  assert.equal(first.users[0].level, 'Débutant'); assert.equal(first.users[0].certificationsCount, 1);
  assert.equal(first.users[1].level, 'Non évalué'); assert.equal(first.users[1].certificationsCount, 0);
  const next = await (await request('/admin/users?cursor=' + first.nextCursor, 'admin')).json();
  assert.equal(next.users.length, 1); assert.equal(next.users[0].id, 'u0500'); assert.equal(next.nextCursor, null);
  assert.equal((await request('/admin/users?limit=501', 'admin')).status, 400);
  assert.equal((await request('/admin/users?cursor=a/b', 'admin')).status, 400);
  assert.equal((await request('/admin/users?cursor=u0499', 'learner')).status, 403);
});
test('answer-only edits invalidate an open test and obsolete submissions write no results', async () => {
  const original = (await (await request('/level-tests', 'learner')).json()).tests[0];
  assert.equal('answer' in original.questions[0], false);
  const revised = { ...fixture.tests[0], questions: fixture.tests[0].questions.map(question => ({ ...question, answer: 1 })) };
  const saved = await (await request('/level-tests', 'admin', { tests: [revised] })).json();
  assert.notEqual(saved.tests[0].version, original.version);
  const before = writes.length;
  const obsolete = await request('/level-tests/attempt', 'learner', { testId: original.id, version: original.version, answers: [2] });
  assert.equal(obsolete.status, 409); assert.equal((await obsolete.json()).code, 'TEST_OBSOLETE'); assert.equal(writes.length, before);
  assert.equal((await request('/level-tests/attempt', 'learner', { testId: original.id, version: undefined, answers: [1] })).status, 409);
  const valid = await (await request('/level-tests/attempt', 'learner', { testId: original.id, version: saved.tests[0].version, answers: [1] })).json();
  assert.equal(valid.attempt.score, 100); assert.equal(valid.attempt.version, saved.tests[0].version);
});
test('legacy test banks acquire a stable random revision without losing questions', async () => {
  delete (fixture as any).revision;
  const before = JSON.stringify(fixture.tests);
  const first = (await (await request('/level-tests', 'learner')).json()).tests[0].version;
  const second = (await (await request('/level-tests', 'learner')).json()).tests[0].version;
  assert.equal(first, second); assert.match(first, /^[0-9a-f-]{36}$/);
  assert.equal(JSON.stringify(fixture.tests), before);
});
