import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { authRouter } from '../backend/auth';
import { authenticate, services, adminRouter } from '../backend/admin';
import { hashToken, resetLink, issueSession, nativeIdentity } from '../backend/nativeSession';

process.env.JWT_SECRET = 'test-secret-32-bytes-minimum-do-not-use-in-production';
process.env.APP_ORIGIN = 'https://academia.example.com';
process.env.RESEND_API_KEY = 'test-never-sent';
const { auth, db } = services();
const records = new Map<string, any>();
const users = new Map<string, any>();
const ref = (key: string): any => ({ key, get: async () => ({ exists: records.has(key), data: () => structuredClone(records.get(key)) }), set: async (value: any, options?: any) => records.set(key, structuredClone(options?.merge ? { ...records.get(key), ...value } : value)), update: async (value: any) => records.set(key, { ...records.get(key), ...value }), delete: async () => records.delete(key) });
mock.method(db, 'collection', (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`), where: (field: string, _op: string, value: any) => ({ get: async () => ({ docs: [...records.entries()].filter(([key,r]) => key.startsWith(name + '/') && r[field] === value).map(([,r]) => ({ data: () => r })) }) }) }));
mock.method(db, 'runTransaction', async (fn: any) => {
  const writes: any[] = [];
  const result = await fn({ get: (r: any) => r.get(), set: (r: any, data: any, options?: any) => writes.push(() => r.set(data, options)), update: (r: any, data: any) => writes.push(() => r.update(data)), delete: (r: any) => writes.push(() => r.delete()) });
  for (const write of writes) await write();
  return result;
});
mock.method(auth, 'createUser', async (data: any) => {
  assert.equal('password' in data, false, 'Firebase never receives the password');
  if ([...users.values()].some(u => u.email === data.email)) throw Object.assign(new Error(), { code: 'auth/email-already-exists' });
  const user = { metadata: { creationTime: new Date().toISOString() }, ...data, uid: `uid-${users.size}` }; users.set(user.uid, user); return user;
});
mock.method(auth, 'getUser', async (id: string) => { if (!users.has(id)) throw Object.assign(new Error(), { code: 'auth/user-not-found' }); return { metadata: { creationTime: new Date().toISOString() }, ...users.get(id) }; });
mock.method(auth, 'getUserByEmail', async (email: string) => { const user = [...users.values()].find(u => u.email === email); if (!user) throw Object.assign(new Error(), { code: 'auth/user-not-found' }); return user; });
mock.method(auth, 'setCustomUserClaims', async (uid: string, claims: any) => { users.get(uid).customClaims = claims; });
mock.method(auth, 'deleteUser', async (uid: string) => users.delete(uid));
const bridges: any[] = [];
let signingDenied = false;
mock.method(auth, 'createCustomToken', async (uid: string, claims: any) => { if (signingDenied) throw Object.assign(new Error(), { code: 'auth/insufficient-permission' }); bridges.push({ uid, claims }); return `bridge-${uid}`; });
let googleProvider = 'google.com';
mock.method(auth, 'verifyIdToken', async () => ({ uid: 'google-user', email: 'google@example.com', email_verified: true, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: googleProvider } }));
const actualFetch = globalThis.fetch;
let otp = '';
let activation = '';
mock.method(globalThis, 'fetch', async (_url: any, options: any) => {
  const text = JSON.parse(options.body).text;
  otp = text.match(/Votre code : (\d{6})/)?.[1] || otp;
  activation = text.match(/#reset=([A-Za-z0-9_-]+)/)?.[1] || activation;
  return new Response('{}', { status: 200 });
});
const app = express(); app.use(express.json()); app.use('/api', authRouter);
app.get('/api/private', authenticate, (req: any, res) => res.json({ uid: req.identity.uid }));
app.use('/api/admin', adminRouter);
const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
const request = (path: string, body?: any, cookie?: string, origin?: string) => actualFetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const cookieOf = (response: Response) => response.headers.get('set-cookie')!.split(';')[0];
let cookie = '';
let uid = '';
const password = 'my secure password 123';
test('Google profile identity obtains its email from the verified Firebase user, not the session record', async () => {
  const id = 'google-email-regression';
  users.set(id, { uid: id, email: 'verified@example.com', displayName: 'Verified User', customClaims: { role: 'particulier' } });
  let sessionCookie = '';
  const session = await issueSession(id, 'google', { cookie: (name: string, value: string) => { sessionCookie = `${name}=${value}`; } } as any);
  const record = records.get(`authSessions/${session.appSessionId}`);
  assert.equal(record.email, undefined);
  const identity = await nativeIdentity({ headers: { cookie: sessionCookie } } as any);
  assert.equal(identity.email, 'verified@example.com');
  assert.equal(identity.name, 'Verified User');
  records.set(`authSessions/${session.appSessionId}`, { ...record, email: 'stale@example.com' });
  assert.equal((await nativeIdentity({ headers: { cookie: sessionCookie } } as any)).email, 'verified@example.com');
  users.delete(id);
  records.delete(`authSessions/${session.appSessionId}`);
});
after(() => { server.close(); mock.restoreAll(); delete process.env.JWT_SECRET; delete process.env.RESEND_API_KEY; });

test('registration issues a signed HttpOnly application JWT and stores only a salted password hash', async () => {
  const response = await request('/auth/register', { email: 'user@example.com', password, name: 'User', role: 'pme', details: { twoFactorEnabled: true, disabled: false, role: 'super_admin', institution: 'Company' } });
  assert.equal(response.status, 201);
  const body = await response.json(); uid = body.uid; cookie = cookieOf(response);
  assert.equal(body.bridgeToken, `bridge-${uid}`);
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
  assert.match(response.headers.get('set-cookie')!, /SameSite=Lax/);
  const jwt = cookie.slice(cookie.indexOf('=') + 1);
  const { payload } = await jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET), { issuer: 'academia', audience: 'academia-web', algorithms: ['HS256'] });
  assert.equal(payload.sub, uid); assert.equal(typeof payload.sid, 'string');
  assert.equal(records.get(`users/${uid}`).role, 'pme'); assert.equal(records.get(`users/${uid}`).twoFactorEnabled, false);
  assert.equal(records.get(`users/${uid}`).institution, 'Company');
  assert.equal(records.get(`authAccounts/${uid}`).registeredAt, Date.parse(records.get(`users/${uid}`).joinDate));
  assert.equal(JSON.stringify([...records.values()]).includes(password), false);
  assert.equal((await request('/private', undefined, cookie)).status, 200);
});
test('email login checks the backend hash and rejects wrong, unknown or disabled accounts', async () => {
  assert.equal((await request('/auth/login', { email: 'user@example.com', password: 'wrong' })).status, 401);
  assert.equal((await request('/auth/login', { email: 'unknown@example.com', password })).status, 401);
  const response = await request('/auth/login', { email: 'USER@example.com', password });
  assert.equal(response.status, 200); cookie = cookieOf(response);
  users.get(uid).disabled = true;
  assert.equal((await request('/private', undefined, cookie)).status, 401);
  users.get(uid).disabled = false;
});
test('expired and tampered application JWTs are rejected, as are revoked server sessions', async () => {
  const bad = cookie.slice(0, -10) + 'AAAAAAAAAA';
  assert.equal((await request('/private', undefined, bad)).status, 401);
  const expired = await new SignJWT({ sid: 'a'.repeat(64) }).setProtectedHeader({ alg: 'HS256' }).setSubject(uid).setIssuer('academia').setAudience('academia-web').setExpirationTime(1).sign(new TextEncoder().encode(process.env.JWT_SECRET));
  assert.equal((await request('/private', undefined, `academia_session=${expired}`)).status, 401);
  const payload = (await jwtVerify(cookie.split('=')[1], new TextEncoder().encode(process.env.JWT_SECRET))).payload;
  records.get(`authSessions/${payload.sid}`).expiresAt = Date.now() - 1;
  assert.equal((await request('/private', undefined, cookie)).status, 401);
  cookie = cookieOf(await request('/auth/login', { email: 'user@example.com', password }));
});
test('MFA proofs are isolated between two backend sessions of the same user', async () => {
  records.get(`users/${uid}`).twoFactorEnabled = true;
  const other = cookieOf(await request('/auth/login', { email: 'user@example.com', password }));
  assert.equal((await request('/private', undefined, cookie)).status, 403);
  assert.equal((await request('/2fa/send', {}, cookie)).status, 200);
  assert.equal((await request('/2fa/verify', { code: otp }, cookie)).status, 200);
  assert.equal((await request('/private', undefined, cookie)).status, 200);
  assert.equal((await request('/private', undefined, other)).status, 403);
  records.get(`users/${uid}`).twoFactorEnabled = false;
});
test('password reset preserves the old Firebase UID, invalidates old sessions and consumes the link once', async () => {
  assert.equal((await request('/auth/password/request', { email: 'user@example.com' })).status, 200);
  assert.equal(activation.length, 43);
  const oldLink = new URL(await resetLink(uid)).hash.slice(7);
  assert.equal((await request('/auth/password/confirm', { token: activation, password: 'new password secure 987' })).status, 200);
  assert.equal(records.has(`passwordResets/${hashToken(activation)}`), false);
  assert.equal((await request('/auth/password/confirm', { token: activation, password })).status, 400);
  assert.equal((await request('/auth/password/confirm', { token: oldLink, password })).status, 400);
  assert.equal((await request('/private', undefined, cookie)).status, 401);
  const response = await request('/auth/login', { email: 'user@example.com', password: 'new password secure 987' });
  assert.equal(response.status, 200); assert.equal((await response.clone().json()).uid, uid); cookie = cookieOf(response);
});
test('logout revokes the session and blocks the Firestore bridge from being renewed', async () => {
  assert.equal((await request('/auth/logout', {}, cookie)).status, 200);
  assert.equal((await request('/private', undefined, cookie)).status, 401);
  assert.equal((await request('/auth/bridge', {}, cookie)).status, 401);
});
test('Google exchange accepts only a recent verified Google identity and issues the same application session', async () => {
  users.set('google-user', { uid: 'google-user', email: 'google@example.com', customClaims: { role: 'particulier' } });
  googleProvider = 'password';
  assert.equal((await request('/auth/google', { idToken: 'firebase-password' })).status, 401);
  googleProvider = 'google.com';
  const response = await request('/auth/google', { idToken: 'google-token' });
  assert.equal(response.status, 200);
  const googleCookie = cookieOf(response);
  assert.equal((await request('/auth/profile', { name: 'Google User', role: 'pme', details: { role: 'super_admin', twoFactorEnabled: true } }, googleCookie)).status, 200);
  assert.equal(users.get('google-user').customClaims.role, 'pme');
  assert.equal(records.get('users/google-user').twoFactorEnabled, false);
});
test('public registration rejects privileged roles and cross-origin login attempts', async () => {
  assert.equal((await request('/auth/register', { email: 'admin@example.com', password, name: 'Admin', role: 'super_admin' })).status, 400);
  assert.equal((await request('/auth/login', { email: 'user@example.com', password }, undefined, 'https://attacker.example.com')).status, 403);
});
test('persistent rate limits reject a brute-force burst before password verification', async () => {
  records.set(`authRateLimits/${(await import('../backend/nativeSession')).emailKey('login:email:blocked@example.com')}`, { count: 10, expiresAt: Date.now() + 60000 });
  assert.equal((await request('/auth/login', { email: 'blocked@example.com', password })).status, 429);
});
test('missing JWT configuration fails closed rather than falling back to Firebase password authentication', async () => {
  const secret = process.env.JWT_SECRET; delete process.env.JWT_SECRET;
  assert.equal((await request('/auth/login', { email: 'user@example.com', password: 'new password secure 987' })).status, 503);
  process.env.JWT_SECRET = secret;
});

test('legacy accounts activate a backend password by email without changing their UID or role', async () => {
  users.set('legacy-admin', { uid: 'legacy-admin', email: 'legacy@example.com', customClaims: { role: 'dfat_admin' } });
  records.set('users/legacy-admin', { id: 'legacy-admin', email: 'legacy@example.com', name: 'Legacy', role: 'dfat_admin' });
  assert.equal((await request('/auth/login', { email: 'legacy@example.com', password })).status, 401);
  assert.equal((await request('/auth/password/request', { email: 'legacy@example.com' })).status, 200);
  assert.equal((await request('/auth/password/confirm', { token: activation, password })).status, 200);
  const response = await request('/auth/login', { email: 'legacy@example.com', password });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.uid, 'legacy-admin'); assert.equal(body.role, 'dfat_admin');
  assert.equal(users.size, 3, 'no replacement account was created');
});
test('production JWT cookies are Secure and sessions enforce issuer, audience and algorithm', async () => {
  process.env.NODE_ENV = 'production';
  const response = await request('/auth/login', { email: 'legacy@example.com', password });
  delete process.env.NODE_ENV;
  assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie')!, /Secure/);
  const active = cookieOf(response).split('=')[1];
  const { payload } = await jwtVerify(active, new TextEncoder().encode(process.env.JWT_SECRET));
  for (const [issuer, audience, algorithm] of [['wrong', 'academia-web', 'HS256'], ['academia', 'wrong', 'HS256'], ['academia', 'academia-web', 'HS384']]) {
    const jwt = await new SignJWT({ sid: payload.sid }).setProtectedHeader({ alg: algorithm }).setSubject('legacy-admin').setIssuer(issuer).setAudience(audience).setExpirationTime('1h').sign(new TextEncoder().encode(process.env.JWT_SECRET));
    assert.equal((await request('/private', undefined, `academia_session=${jwt}`)).status, 401);
  }
});

test('an initial Google credential cannot bypass the backend session or logout revocation', async () => {
  const response = await actualFetch(base + '/private', { headers: { Authorization: 'Bearer google-token' } });
  assert.equal(response.status, 401);
});


test('all twelve demo roles have verified identities and exactly the intended administrative access', async () => {
  const { demoRoles } = await import('../shared/demoRoles');
  for (const role of demoRoles) {
    const id = 'matrix-' + role;
    users.set(id, { uid: id, email: 'demo.' + role + '@academia.example.test', customClaims: { role } });
    records.set('users/' + id, { id, role, twoFactorEnabled: false });
    let sessionCookie = '';
    await issueSession(id, 'password', { cookie: (_name: string, jwt: string) => { sessionCookie = 'academia_session=' + jwt; } } as any);
    assert.equal((await request('/private', undefined, sessionCookie)).status, 200, role + ': normal session');
    assert.equal((await request('/admin/health', undefined, sessionCookie)).status, ['super_admin','dfat_admin'].includes(role) ? 200 : 403, role + ': admin access');
    assert.equal((await request('/admin/users', {}, sessionCookie)).status, role === 'super_admin' ? 400 : 403, role + ': creation restricted to superadmin');
  }
});
test('expired demo credentials cannot sign in or keep an existing session', async () => {
  const id = 'legacy-admin';
  const response = await request('/auth/login', { email: 'legacy@example.com', password });
  const active = cookieOf(response);
  records.get('authAccounts/' + id).demoExpiresAt = Date.now() - 1;
  assert.equal((await request('/private', undefined, active)).status, 401);
  assert.equal((await request('/auth/login', { email: 'legacy@example.com', password })).status, 401);
  const token = new URL(await resetLink(id)).hash.slice(7);
  assert.equal((await request('/auth/password/confirm', { token, password })).status, 200);
  assert.ok(records.get('authAccounts/' + id).demoExpiresAt < Date.now(), 'reset cannot remove demo expiry');
  assert.equal((await request('/auth/login', { email: 'legacy@example.com', password })).status, 401);
});


test('a denied Firebase signer is reported as server unavailability, not incorrect credentials', async () => {
  const email = 'signer-test@example.com';
  assert.equal((await request('/auth/register', { email, password, name: 'Signer test', role: 'particulier' })).status, 201);
  signingDenied = true;
  try { assert.equal((await request('/auth/login', { email, password })).status, 503); }
  finally { signingDenied = false; }
  assert.equal((await request('/auth/login', { email, password })).status, 200);
});
