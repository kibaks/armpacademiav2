import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { authenticate, services } from '../backend/admin';
import { accountSecurityRouter } from '../backend/accountSecurity';
import { errorHandler } from '../backend/http';

const { auth, db } = services();
let enrolled = true;
let required = false;
let unavailable = false;
const revoked: string[] = [];
mock.method(auth, 'verifyIdToken', async (token: string) => {
  if (token === 'invalid') throw new Error('invalid');
  return { uid: 'owner', auth_time: Math.floor(Date.now() / 1000) - (token === 'stale' ? 600 : 0), firebase: token === 'mfa' ? { sign_in_second_factor: 'totp' } : {} };
});
mock.method(auth, 'getUser', async () => { if (unavailable) throw new Error('unavailable'); return { multiFactor: { enrolledFactors: enrolled ? [{ uid: 'factor' }] : [] } }; });
mock.method(auth, 'updateUser', async (_uid: string, patch: any) => { assert.deepEqual(patch.multiFactor.enrolledFactors, []); enrolled = false; });
mock.method(auth, 'revokeRefreshTokens', async (uid: string) => { revoked.push(uid); });
mock.method(db, 'collection', () => ({ doc: () => ({ get: async () => ({ data: () => ({ mfaRequired: required }) }), set: async (value: any) => { required = value.mfaRequired; } }) }));
const app = express();
app.use('/account', accountSecurityRouter);
app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(() => { server.close(); mock.restoreAll(); });
const request = (path = '/protected', token = 'password') => fetch(`http://127.0.0.1:${(server.address() as any).port}${path}`, { method: path === '/protected' ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}` } });
test('enrolled native factors reject password-only API sessions, including pre-enrollment tokens', async () => {
  assert.equal((await request()).status, 403);
  assert.equal((await request('/protected', 'mfa')).status, 200);
  assert.equal((await request('/protected', 'invalid')).status, 401);
});
test('MFA policy synchronization requires recent authentication and revokes old sessions', async () => {
  assert.equal((await request('/account/mfa/sync', 'stale')).status, 403);
  assert.equal((await request('/account/mfa/sync')).status, 200);
  assert.equal(required, true);
  assert.deepEqual(revoked, ['owner']);
});
test('only a recent second-factor session can disable MFA on the server', async () => {
  assert.equal((await request('/account/mfa/disable')).status, 403);
  assert.equal(enrolled, true);
  assert.equal((await request('/account/mfa/disable', 'mfa')).status, 200);
  assert.equal(enrolled, false); assert.equal(required, false);
  assert.equal((await request()).status, 200);
});
test('a required security policy cannot be cleared by an old password token', async () => {
  required = true;
  assert.equal((await request()).status, 403);
  assert.equal((await request('/account/mfa/sync')).status, 403);
  assert.equal(required, true);
  unavailable = true;
  assert.equal((await request()).status, 503);
});
