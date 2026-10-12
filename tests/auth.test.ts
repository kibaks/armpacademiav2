process.env.APP_ORIGIN = 'https://academia.example.com';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { services, authenticate } from '../backend/admin';
import { authRouter } from '../backend/auth';

const { auth, db } = services();
const records = new Map<string, any>();
const ref = (key: string): any => ({ key,
  get: async () => ({ exists: records.has(key), data: () => structuredClone(records.get(key)) }),
  set: async (value: any) => { records.set(key, structuredClone(value)); },
  update: async (value: any) => { records.set(key, { ...records.get(key), ...value }); },
  delete: async () => { records.delete(key); },
});
mock.method(db, 'collection', (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }));
mock.method(db, 'runTransaction', async (callback: any) => {
  const writes: any[] = [];
  const result = await callback({ get: (r: any) => r.get(), set: (r: any, value: any) => writes.push(() => r.set(value)), update: (r: any, value: any) => writes.push(() => r.update(value)), delete: (r: any) => writes.push(() => r.delete()) });
  for (const write of writes) await write();
  return result;
});
let signInTime = Math.floor(Date.now() / 1000);
mock.method(auth, 'verifyIdToken', async (token: string, checkRevoked: boolean) => {
  assert.equal(checkRevoked, true);
  if (token === 'expired') throw Object.assign(new Error(), { code: 'auth/id-token-expired' });
  if (token === 'revoked') throw Object.assign(new Error(), { code: 'auth/id-token-revoked' });
  if (token === 'configuration') throw Object.assign(new Error(), { code: 'app/invalid-credential' });
  return { firebase: { sign_in_provider: 'google.com' }, uid: token, appSessionId: token, email: `${token}@example.com`, auth_time: signInTime };
});
const originalFetch = globalThis.fetch;
let sentCode = '';
let deliveryOk = true;
let recipient: any;
mock.method(globalThis, 'fetch', async (url: any, options: any) => {
  if (String(url).startsWith('https://api.resend.com/')) {
    const body = JSON.parse(options.body);
    recipient = body.to;
    sentCode = body.text.match(/\d{6}/)?.[0] || '';
    return new Response('{}', { status: deliveryOk ? 200 : 503 });
  }
  return originalFetch(url, options);
});
process.env.RESEND_API_KEY = 'test-key-never-sent';
const app = express(); app.use(express.json()); app.use('/api', authRouter);
app.get('/api/private', authenticate, (_req, res) => res.json({ ok: true }));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
const request = (path: string, token?: string, body?: any) => {
  if (token) records.set(`authSessions/${token}`, { uid: token, authTime: signInTime, expiresAt: Date.now() + 60000, version: 0 });
  return originalFetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
};
after(() => { server.close(); mock.restoreAll(); delete process.env.RESEND_API_KEY; });

test('expired and revoked JWTs produce 401; configuration failures produce 503', async () => {
  assert.equal((await request('/private')).status, 401);
  assert.equal((await request('/private', 'expired')).status, 401);
  assert.equal((await request('/private', 'revoked')).status, 401);
  const failure = await request('/private', 'configuration');
  assert.equal(failure.status, 503);
  assert.equal((await failure.json()).code, 'AUTH_UNAVAILABLE');
});
test('MFA is enforced before private access, including restoration of a Firebase session', async () => {
  records.set('users/alice', { twoFactorEnabled: true });
  assert.equal((await request('/auth/session', 'alice')).status, 403);
  assert.equal((await request('/private', 'alice')).status, 403);
  assert.equal((await request('/2fa/send', undefined, {})).status, 401);
});
test('challenge uses JWT email, hides the code, limits resend, verifies once and binds to sign-in', async () => {
  const send = await request('/2fa/send', 'alice', { email: 'attacker@example.com' });
  assert.equal(send.status, 200);
  assert.deepEqual(recipient, ['alice@example.com']);
  assert.deepEqual(await send.json(), { ok: true });
  assert.equal('code' in records.get('mfaChallenges/alice'), false);
  assert.equal((await request('/2fa/send', 'alice', {})).status, 429);
  const wrong = sentCode === '000000' ? '111111' : '000000';
  assert.equal((await request('/2fa/verify', 'alice', { code: wrong })).status, 400);
  assert.equal((await request('/2fa/verify', 'bob', { code: sentCode })).status, 400);
  assert.equal((await request('/2fa/verify', 'alice', { code: sentCode })).status, 200);
  assert.equal((await request('/private', 'alice')).status, 200);
  assert.equal((await request('/2fa/verify', 'alice', { code: sentCode })).status, 400);
  signInTime++;
  assert.equal((await request('/private', 'alice')).status, 403);
});
test('five failed attempts and expired challenges cannot be verified', async () => {
  records.set('users/carol', { twoFactorEnabled: true });
  await request('/2fa/send', 'carol', {});
  const code = sentCode;
  for (let n = 0; n < 5; n++) assert.equal((await request('/2fa/verify', 'carol', { code: '000000' })).status, 400);
  assert.equal((await request('/2fa/verify', 'carol', { code })).status, 400);
  const challenge = records.get('mfaChallenges/carol');
  records.set('mfaChallenges/carol', { ...challenge, attempts: 0, expiresAt: Date.now() - 1 });
  assert.equal((await request('/2fa/verify', 'carol', { code })).status, 400);
});
test('delivery failures cannot activate MFA or leave a usable challenge', async () => {
  records.set('users/dan', { twoFactorEnabled: false });
  deliveryOk = false;
  assert.equal((await request('/2fa/send', 'dan', { enroll: true })).status, 503);
  assert.equal(records.has('mfaChallenges/dan'), false);
  assert.equal(records.get('users/dan').twoFactorEnabled, false);
  deliveryOk = true;
});
test('MFA enrollment only activates after a delivered code is confirmed; disabling requires verified session', async () => {
  records.set('users/eve', { twoFactorEnabled: false });
  assert.equal((await request('/2fa/send', 'eve', { enroll: true })).status, 200);
  assert.equal(records.get('users/eve').twoFactorEnabled, false);
  assert.equal((await request('/2fa/verify', 'eve', { code: sentCode })).status, 200);
  assert.equal(records.get('users/eve').twoFactorEnabled, true);
  records.delete('mfaSessions/eve');
  assert.equal((await request('/auth/mfa', 'eve', { enabled: false })).status, 403);
  records.set('mfaSessions/eve', { authTime: signInTime, expiresAt: Date.now() + 10000 });
  assert.equal((await request('/auth/mfa', 'eve', { enabled: false })).status, 200);
  assert.equal(records.get('users/eve').twoFactorEnabled, false);
});
test('enrollment requires recent sign-in; MFA proof expires independently of the JWT', async () => {
  records.set('users/frank', { twoFactorEnabled: false });
  const recent = signInTime; signInTime -= 600;
  assert.equal((await request('/2fa/send', 'frank', { enroll: true })).status, 401);
  signInTime = recent;
  records.set('users/frank', { twoFactorEnabled: true });
  records.set('mfaSessions/frank', { authTime: signInTime, expiresAt: Date.now() - 1 });
  assert.equal((await request('/private', 'frank')).status, 403);
});
