import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuthenticatedFetch } from '../shared/authenticatedRequest';
import { createSessionRevision } from '../shared/sessionRevision';
import { services } from '../backend/admin';

const origin = 'https://academia.example';
const user = { uid: 'owner', getIdToken: async () => 'firebase-id-jwt' };
test('API requests use the Firebase ID JWT and never trust a caller-supplied Authorization header', async () => {
  let captured: any;
  const request = createAuthenticatedFetch({ currentUser: () => user, origin: () => origin, fetch: (async (url, options) => { captured = { url, options }; return new Response('{}'); }) as typeof fetch });
  await request('/api/admin/health', { headers: { Authorization: 'Bearer forged', 'X-Test': 'kept' }, redirect: 'follow' });
  assert.equal(captured.url, origin + '/api/admin/health');
  assert.equal(captured.options.headers.get('Authorization'), 'Bearer firebase-id-jwt');
  assert.equal(captured.options.headers.get('X-Test'), 'kept');
  assert.equal(captured.options.redirect, 'error');
});
test('external origins, URL credentials and non-API paths never receive a session token', async () => {
  let tokenReads = 0; let calls = 0;
  const request = createAuthenticatedFetch({ currentUser: () => ({ uid: 'owner', getIdToken: async () => { tokenReads++; return 'secret'; } }), origin: () => origin, fetch: (async () => { calls++; return new Response('{}'); }) as typeof fetch });
  for (const url of ['https://attacker.example/api/collect', '//attacker.example/api/collect', '/api/../login', 'https://name:password@academia.example/api/collect']) await assert.rejects(request(url));
  assert.equal(tokenReads, 0); assert.equal(calls, 0);
});
test('logout or an account switch while Firebase refreshes the JWT cancels the API request', async () => {
  let resolveToken: (token: string) => void;
  let active: any = { uid: 'owner', getIdToken: () => new Promise<string>(resolve => { resolveToken = resolve; }) };
  let calls = 0;
  const request = createAuthenticatedFetch({ currentUser: () => active, origin: () => origin, fetch: (async () => { calls++; return new Response('{}'); }) as typeof fetch });
  const pending = request('/api/courses/course/attempt', { method: 'POST' });
  active = { uid: 'other', getIdToken: async () => 'other-jwt' };
  resolveToken!('owner-jwt');
  await assert.rejects(pending, /session a changé/); assert.equal(calls, 0);
  active = null; await assert.rejects(request('/api/admin/health'), /Connectez-vous/);
});
test('a new JWT synchronization supersedes previous results, including for the same UID', () => {
  let uid: string | null = 'owner';
  const session = createSessionRevision(() => uid);
  const first = session.begin(uid); assert.equal(first(), true);
  const refresh = session.begin(uid); assert.equal(first(), false); assert.equal(refresh(), true);
  uid = 'other'; assert.equal(refresh(), false);
  const other = session.begin(uid); assert.equal(other(), true);
  uid = null; assert.equal(other(), false);
  const logout = session.begin(null); assert.equal(logout(), true);
  session.invalidate(); assert.equal(logout(), false);
});
test('the real Firebase Admin verifier rejects a forged unsigned JWT with administrator claims', async () => {
  const encode = (value: any) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const forged = `${encode({ alg: 'none', kid: 'attacker', typ: 'JWT' })}.${encode({ sub: 'attacker', role: 'super_admin', aud: 'gen-lang-client-0775786837', iss: 'https://securetoken.google.com/gen-lang-client-0775786837', iat: now, exp: now + 3600 })}.`;
  await assert.rejects(services().auth.verifyIdToken(forged), (error: any) => error.code === 'auth/argument-error' && /incorrect algorithm/.test(error.message));
});
