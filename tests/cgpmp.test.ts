process.env.APP_ORIGIN = 'https://academia.example.com';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { cgpmpRouter } from '../backend/cgpmp';
import { services } from '../backend/admin';

const { auth, db } = services();
const records = new Map<string, any>();
const users = new Map<string, any>();
const doc = (key: string): any => ({ key, get: async () => ({ exists: records.has(key), data: () => structuredClone(records.get(key)) }), set: async (data: any) => records.set(key, structuredClone(data)), delete: async () => records.delete(key) });
mock.method(db, 'collection', (name: string) => ({ doc: (id: string) => name === 'authSessions' ? { get: async () => ({ data: () => ({ uid: id, authTime: 1, expiresAt: Date.now() + 60000, version: 0 }) }) } : doc(`${name}/${id}`), add: async () => {} }));
mock.method(db, 'runTransaction', async (fn: any) => fn({ get: (ref: any) => ref.get(), set: (ref: any, value: any) => ref.set(value), delete: (ref: any) => ref.delete() }));
mock.method(auth, 'verifyIdToken', async (token: string) => ({ firebase: { sign_in_provider: 'google.com' }, uid: token, appSessionId: token, auth_time: 1, email: `${token}@example.com`, role: token === 'admin' ? 'super_admin' : 'particulier' }));
mock.method(auth, 'getUserByEmail', async (email: string) => { if (!users.has(email)) throw Object.assign(new Error(), { code: 'auth/user-not-found' }); return users.get(email); });
mock.method(auth, 'createUser', async (data: any) => { const user = { ...data, uid: `firebase-${users.size}` }; users.set(data.email, user); return user; });
mock.method(auth, 'setCustomUserClaims', async (id: string, claims: any) => { const user = [...users.values()].find(u => u.uid === id); user.customClaims = claims; });
mock.method(auth, 'deleteUser', async () => {});
mock.method(auth, 'generatePasswordResetLink', async (email: string) => `https://academia.example.com/#reset=/${email}`);
const originalFetch = globalThis.fetch;
let failDelivery = false;
let failRecipient: string | undefined;
const sent: any[] = [];
mock.method(globalThis, 'fetch', async (url: any, options: any) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return new Response('{}', { status: failDelivery || sent.at(-1).to.includes(failRecipient) ? 503 : 200 });
});
process.env.RESEND_API_KEY = 'test';
const app = express(); app.use(express.json()); app.use('/api/cgpmp', cgpmpRouter);
const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
const url = `http://127.0.0.1:${(server.address() as any).port}/api/cgpmp/send-credentials-email`;
const request = (id: string, token = 'admin') => originalFetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, permanentSecretary: { email: 'forged@example.com' }, validatedBy: 'forged' }) });
const seed = (id: string, email: string) => records.set(`cgpmpAccountRequests/${id}`, { id, permanentSecretaryName: 'Secretary', permanentSecretaryEmail: email, institution: 'Institution', members: [] });
after(() => { server.close(); mock.restoreAll(); delete process.env.RESEND_API_KEY; });

test('CGPMP provisioning requires an administrator and an existing persisted request', async () => {
  assert.equal((await request('missing', 'learner')).status, 403);
  assert.equal((await request('missing')).status, 404);
  assert.equal(users.size, 0);
});
test('real Firebase users are provisioned from stored recipients, with activation links and no persisted passwords', async () => {
  seed('request-1', 'secretary@example.com');
  const response = await request('request-1');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(sent.at(-1).to, ['secretary@example.com']);
  const user = users.get('secretary@example.com');
  assert.equal(user.customClaims.role, 'cgpmp_member');
  assert.equal(records.get(`users/${user.uid}`).id, user.uid);
  assert.equal(data.dispatchedEmails[0].tempPassword, '');
  assert.equal(JSON.stringify(data).includes('https://academia.example.com/#reset='), false);
  assert.equal(data.request.validatedBy, 'admin@example.com');
  const count = sent.length;
  assert.equal((await request('request-1')).status, 200);
  assert.equal(sent.length, count, 'completed request retries do not resend email');
});
test('existing unrelated identities are never overwritten', async () => {
  seed('request-2', 'existing@example.com');
  users.set('existing@example.com', { uid: 'existing', customClaims: { role: 'super_admin' } });
  assert.equal((await request('request-2')).status, 409);
  assert.equal(users.get('existing@example.com').customClaims.role, 'super_admin');
});
test('failed delivery does not validate a request and retry reuses the real Firebase UID', async () => {
  seed('request-3', 'retry@example.com'); failDelivery = true;
  assert.equal((await request('request-3')).status, 503);
  const uid = users.get('retry@example.com').uid;
  assert.equal(records.get('cgpmpAccountRequests/request-3').status, undefined);
  failDelivery = false;
  assert.equal((await request('request-3')).status, 200);
  assert.equal(users.get('retry@example.com').uid, uid);
});
test('a concurrent provisioning lease prevents duplicate processing', async () => {
  seed('request-4', 'locked@example.com');
  records.set('cgpmpProvisioning/request-4', { leaseId: 'other-worker', expiresAt: Date.now() + 10000 });
  assert.equal((await request('request-4')).status, 409);
  assert.equal(users.has('locked@example.com'), false);
  assert.equal(records.get('cgpmpProvisioning/request-4').leaseId, 'other-worker');
});

test('partial batch retry does not resend activation links to successful recipients', async () => {
  seed('request-partial', 'first@example.com');
  records.get('cgpmpAccountRequests/request-partial').members = [{ fullName: 'Second', email: 'second@example.com' }];
  failRecipient = 'second@example.com';
  assert.equal((await request('request-partial')).status, 503);
  assert.equal(records.get('cgpmpAccountRequests/request-partial').status, undefined);
  const firstUid = users.get('first@example.com').uid;
  assert.ok(records.has(`cgpmpDeliveries/request-partial-${firstUid}`));
  const count = sent.filter(mail => mail.to.includes('first@example.com')).length;
  failRecipient = undefined;
  assert.equal((await request('request-partial')).status, 200);
  assert.equal(sent.filter(mail => mail.to.includes('first@example.com')).length, count);
  assert.equal(users.get('first@example.com').uid, firstUid);
});
