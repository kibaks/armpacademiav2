import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { services } from './services.js';
import { clearSession, emailKey, hashToken, issueSession, nativeIdentity, passwordHash, passwordMatches, resetLink } from './nativeSession.js';

export const passwordRouter = Router();
export function allowedOrigin(req: any) {
  if (!req.headers.origin) return req.headers['sec-fetch-site'] !== 'cross-site';
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== 'production' ? `http://${req.headers.host}` : '');
  return expected && req.headers.origin === new URL(expected).origin;
}
passwordRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'GET' && !allowedOrigin(req)) return res.status(403).json({ error: 'Origine de la requête refusée.' });
  next();
});
const wrap = (fn: (req: any, res: any) => Promise<any>) => (req: any, res: any, next: any) => { fn(req, res).catch(next); };
const email = (value: unknown) => typeof value === 'string' && value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.trim().toLowerCase() : null;
const validPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value) <= 1024;
// Persistent limits work across Vercel instances. Increment before expensive password verification.
async function limit(req: any, action: string, address: string) {
  const db = services().db;
  const keys = [`${action}:ip:${req.ip}`, `${action}:email:${address}`];
  return db.runTransaction(async tx => {
    const refs = keys.map(key => db.collection('authRateLimits').doc(emailKey(key)));
    const snapshots = await Promise.all(refs.map(ref => tx.get(ref)));
    const now = Date.now();
    if (snapshots.some((s, i) => s.data()?.expiresAt > now && s.data()?.count >= (i === 0 ? 100 : 10))) return false;
    snapshots.forEach((s, i) => tx.set(refs[i], { count: s.data()?.expiresAt > now ? s.data()!.count + 1 : 1, expiresAt: s.data()?.expiresAt > now ? s.data()!.expiresAt : now + 15 * 60000 }));
    return true;
  });
}
function profileDetails(details: any = {}) {
  const safe: Record<string, string> = {};
  for (const key of ['phone', 'institution', 'roleTitle', 'matricule', 'province', 'location', 'bio', 'nom', 'postnom', 'prenom', 'sexe', 'civilite', 'dateNaissance', 'lieuNaissance', 'nationalite', 'etatCivil', 'pieceIdentite', 'adressePhysique', 'whatsapp', 'subCategory', 'specialty', 'legalForm', 'secondaryIdNumber']) if (typeof details[key] === 'string') safe[key] = details[key].slice(0, 2000);
  return safe;
}
passwordRouter.post('/auth/profile', wrap(async (req, res) => {
  const identity = await nativeIdentity(req);
  const role = req.body?.role;
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 120 || !['ac_agent', 'pme', 'grande_entreprise', 'societe_civile', 'independant', 'particulier'].includes(role)) return res.status(400).json({ error: 'Nom et rôle public valides requis.' });
  const { auth, db } = services();
  const ref = db.collection('users').doc(identity.uid);
  const created = await db.runTransaction(async tx => {
    if ((await tx.get(ref)).exists) return false;
    tx.set(ref, { ...profileDetails(req.body.details), id: identity.uid, email: identity.email, name, role, twoFactorEnabled: false, level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [], joinDate: new Date().toISOString() });
    return true;
  });
  if (!created) return res.status(409).json({ error: 'Le profil existe déjà.' });
  await auth.setCustomUserClaims(identity.uid, { ...(await auth.getUser(identity.uid)).customClaims, role });
  res.json(await issueSession(identity.uid, 'google', res));
}));
passwordRouter.post('/auth/login', wrap(async (req, res) => {
  const address = email(req.body?.email);
  const password = req.body?.password;
  if (!address || typeof password !== 'string' || !password || Buffer.byteLength(password) > 1024) return res.status(400).json({ error: 'Email et mot de passe requis.' });
  if (!(await limit(req, 'login', address))) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quinze minutes.' });
  const { auth, db } = services();
  let user;
  try { user = await auth.getUserByEmail(address); } catch (error: any) { if (error.code !== 'auth/user-not-found') throw error; }
  const account = user ? (await db.collection('authAccounts').doc(user.uid).get()).data() : null;
  // Identical expensive work for unknown accounts limits timing-based enumeration.
  const dummy = `${'0'.repeat(64)}:${'0'.repeat(128)}`;
  const matches = await passwordMatches(password, account?.passwordHash || dummy);
  if (!user || user.disabled || !account?.passwordHash || (account?.demoExpiresAt && account.demoExpiresAt <= Date.now()) || !matches) return res.status(401).json({ code: 'LOGIN_INVALID', error: 'Votre email ou votre mot de passe est incorrect. Vérifiez-les ou choisissez « Mot de passe oublié ».' });
  res.json(await issueSession(user.uid, 'password', res));
}));
passwordRouter.post('/auth/register', wrap(async (req, res) => {
  const address = email(req.body?.email);
  const name = String(req.body?.name || '').trim();
  const role = req.body?.role;
  if (!address || !validPassword(req.body?.password) || !name || name.length > 120 || !['ac_agent', 'pme', 'grande_entreprise', 'societe_civile', 'independant', 'particulier'].includes(role)) return res.status(400).json({ error: 'Nom, email, rôle public et mot de passe de douze caractères minimum requis.' });
  if (!(await limit(req, 'register', address))) return res.status(429).json({ error: 'Trop de demandes. Réessayez plus tard.' });
  const { auth, db } = services();
  const password = await passwordHash(req.body.password);
  const user = await auth.createUser({ email: address, displayName: name });
  try {
    await auth.setCustomUserClaims(user.uid, { role });
    const safe = profileDetails(req.body.details);
    await db.runTransaction(async tx => {
      tx.set(db.collection('authAccounts').doc(user.uid), { passwordHash: password, version: 1 });
      tx.set(db.collection('users').doc(user.uid), { ...safe, id: user.uid, email: address, name, role, twoFactorEnabled: false, level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [], joinDate: new Date().toISOString() });
    });
  } catch (error) { await auth.deleteUser(user.uid); throw error; }
  res.status(201).json(await issueSession(user.uid, 'password', res));
}));
passwordRouter.post('/auth/google', wrap(async (req, res) => {
  if (typeof req.body?.idToken !== 'string') return res.status(400).json({ error: 'Identité Google requise.' });
  let identity;
  try { identity = await services().auth.verifyIdToken(req.body.idToken, true); }
  catch (error: any) {
    if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error'].includes(error.code)) return res.status(401).json({ error: 'Connexion Google invalide.' });
    throw error;
  }
  if (identity.firebase?.sign_in_provider !== 'google.com' || !identity.email_verified || Math.abs(Date.now() / 1000 - identity.auth_time) > 300) return res.status(401).json({ error: 'Une connexion Google récente et vérifiée est requise.' });
  res.json(await issueSession(identity.uid, 'google', res));
}));
passwordRouter.post('/auth/bridge', wrap(async (req, res) => {
  let identity;
  try { identity = await nativeIdentity(req); } catch (error: any) { if (error.code?.startsWith('auth/')) return res.status(401).json({ code: 'SESSION_INVALID', error: 'Reconnectez-vous.' }); throw error; }
  const bridgeToken = await services().auth.createCustomToken(identity.uid, { role: identity.role, appSessionId: identity.appSessionId, appAuthTime: identity.auth_time });
  res.json({ uid: identity.uid, bridgeToken, appSessionId: identity.appSessionId, role: identity.role });
}));
passwordRouter.post('/auth/logout', wrap(async (req, res) => {
  try {
    const identity = await nativeIdentity(req);
    await services().db.collection('authSessions').doc(identity.appSessionId).delete();
  } catch (error: any) { if (!error.code?.startsWith('auth/')) throw error; }
  clearSession(res); res.json({ ok: true });
}));
passwordRouter.post('/auth/password/request', wrap(async (req, res) => {
  const address = email(req.body?.email);
  if (!address) return res.status(400).json({ error: 'Email valide requis.' });
  if (!(await limit(req, 'reset', address))) return res.status(429).json({ error: 'Trop de demandes. Réessayez plus tard.' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Le lien ne peut pas être envoyé pour le moment. Réessayez plus tard.' });
  let user;
  try { user = await services().auth.getUserByEmail(address); } catch (error: any) { if (error.code !== 'auth/user-not-found') throw error; }
  if (user && !user.disabled) {
    const link = await resetLink(user.uid);
    const result = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM || 'ARMP RDC Academia <no-reply@armp-rdc.org>', to: [address], subject: 'Définissez votre mot de passe ACADEMIA', text: `Définissez votre mot de passe avec ce lien personnel, valable trente minutes : ${link}` }), signal: AbortSignal.timeout(15000) });
    if (!result.ok) throw new Error('password-email-unavailable');
  }
  res.json({ ok: true });
}));
passwordRouter.post('/auth/password/confirm', wrap(async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !validPassword(req.body?.password)) return res.status(400).json({ error: 'Lien valide et mot de passe de douze caractères minimum requis.' });
  if (!(await limit(req, 'confirm', hashToken(token)))) return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
  const db = services().db;
  const ref = db.collection('passwordResets').doc(hashToken(token));
  const preliminary = (await ref.get()).data();
  if (!preliminary || preliminary.expiresAt <= Date.now()) return res.status(400).json({ error: 'Lien expiré ou déjà utilisé.' });
  const password = await passwordHash(req.body.password);
  const ok = await db.runTransaction(async tx => {
    const reset = (await tx.get(ref)).data();
    if (!reset || reset.expiresAt <= Date.now()) return false;
    const account = db.collection('authAccounts').doc(reset.uid);
    const existing = (await tx.get(account)).data();
    if ((existing?.version || 0) !== reset.version) { tx.delete(ref); return false; }
    tx.set(account, { ...existing, passwordHash: password, version: (existing?.version || 0) + 1 });
    tx.delete(ref);
    return true;
  });
  res.status(ok ? 200 : 400).json(ok ? { ok: true } : { error: 'Lien expiré ou déjà utilisé.' });
}));
passwordRouter.use((error: any, _req: any, res: any, _next: any) => {
  console.error('[Account API]', error?.code || 'unavailable');
  const exists = error.code === 'auth/email-already-exists';
  res.status(exists ? 409 : ['auth/invalid-id-token', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled', 'auth/user-not-found'].includes(error.code) ? 401 : 503).json({ error: exists ? 'Cette adresse possède déjà un compte. Utilisez la connexion ou « Mot de passe oublié ».' : 'La connexion est momentanément indisponible. Réessayez plus tard.' });
});
