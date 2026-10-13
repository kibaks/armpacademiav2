import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import express from 'express';
import { jwtVerify, type JWTVerifyResult } from 'jose';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { demoRoles } from '../shared/demoRoles';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { passwordMatches } from '../backend/nativeSession';

const input = process.argv[2], output = process.argv[3];
if (!input || !output) throw new Error('Usage : test-demo-accounts-live.ts <identifiants privés.json> <rapport.json>');
const manifest = JSON.parse(await readFile(input, 'utf8'));
assert.equal(manifest.project, config.projectId);
assert.ok(manifest.accounts.length >= 12);
assert.equal(new Set(manifest.accounts.map((account: any) => account.email)).size, manifest.accounts.length);
for (const role of demoRoles) assert.ok(manifest.accounts.some((account: any) => account.role === role));
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.FIREBASE_SERVICE_ACCOUNT_ID ||= 'firebase-adminsdk-fbsvc@gen-lang-client-0775786837.iam.gserviceaccount.com';
const { authRouter } = await import('../backend/auth');
const { services, adminRouter } = await import('../backend/admin');
const { auth, db } = services();
const app = express(); app.use(express.json()); app.use('/api', authRouter); app.use('/api/admin', adminRouter);
const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
process.env.APP_ORIGIN = base;
const results: any[] = [];
let failed = false;
try {
  for (const account of manifest.accounts) {
    const role = account.role;
    let cookie = '', clientApp: any;
    try {
      const user = await auth.getUser(account.uid);
      assert.equal(user.email, account.email); assert.equal(user.displayName, account.name); assert.equal(user.customClaims?.role, role); assert.equal(user.customClaims?.demoFixture, true);
      const [profile, credentials] = await Promise.all([db.collection('users').doc(user.uid).get(), db.collection('authAccounts').doc(user.uid).get()]);
      assert.equal(profile.data()?.role, role); assert.equal(profile.data()?.name, account.name); assert.ok(credentials.data()?.demoExpiresAt > Date.now());
      assert.equal(await passwordMatches(account.password, credentials.data()!.passwordHash), true);
      if (process.argv.includes('--credentials-only')) {
        results.push({ role, uid: user.uid, email: user.email, status: 'réussi', checks: ['compte enregistré', 'rôle Firebase', 'profil Firestore', 'mot de passe haché', 'expiration enregistrée'], expiresAt: new Date(credentials.data()!.demoExpiresAt).toISOString() });
        continue;
      }
      const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password: account.password }), signal: AbortSignal.timeout(30000) });
      const session = await response.json();
      assert.equal(response.status, 200, `Connexion ${role}: ${session.error || response.status}`);
      cookie = response.headers.get('set-cookie')!.split(';')[0];
      const jwt = cookie.slice(cookie.indexOf('=') + 1);
      const verified: JWTVerifyResult = await jwtVerify(jwt, new TextEncoder().encode(process.env.JWT_SECRET), { algorithms: ['HS256'], issuer: 'academia', audience: 'academia-web' });
      assert.equal(verified.payload.sub, account.uid);
      clientApp = initializeApp(config, 'demo-test-' + role);
      const clientAuth = getAuth(clientApp);
      const signed = await signInWithCustomToken(clientAuth, session.bridgeToken);
      assert.equal(signed.user.uid, account.uid);
      assert.equal((await signed.user.getIdTokenResult()).claims.role, role);
      const authenticated = await fetch(base + '/api/auth/session', { headers: { Cookie: cookie } });
      assert.equal(authenticated.status, 200);
      const admin = await fetch(base + '/api/admin/health', { headers: { Cookie: cookie } });
      assert.equal(admin.status, ['super_admin','dfat_admin'].includes(role) ? 200 : 403);
      const loggedOut = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
      assert.equal(loggedOut.status, 200);
      assert.equal((await fetch(base + '/api/auth/session', { headers: { Cookie: cookie } })).status, 401);
      cookie = '';
      await signOut(clientAuth);
      await auth.revokeRefreshTokens(user.uid);
      results.push({ role, uid: user.uid, email: account.email, status: 'réussi', checks: ['compte enregistré','rôle serveur','mot de passe haché','JWT signé','connexion Firebase personnalisée','permissions administratives','déconnexion révoquée'] });
    } catch (error) {
      failed = true; results.push({ role, uid: account.uid, email: account.email, status: 'échec', error: error instanceof Error ? error.message : 'Erreur inconnue' });
    } finally {
      if (cookie) await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } }).catch(() => {});
      if (clientApp) await deleteApp(clientApp);
      await writeFile(output, JSON.stringify({ project: config.projectId, checkedAt: new Date().toISOString(), mode: process.argv.includes('--credentials-only') ? 'vérification des comptes, sans test JWT' : 'connexion complète', results }, null, 2), { mode: 0o600 });
    }
    console.log(`${account.name} (${role}): ${results.at(-1).status}`);
    // Stop on infrastructure failures; never repeat twelve identical failing signers.
    if (failed) break;
  }
} finally { await new Promise<void>(resolve => server.close(() => resolve())); }
if (failed) process.exitCode = 1;
