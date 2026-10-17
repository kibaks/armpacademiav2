import { Router } from 'express';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { authenticate, authenticateIdentity, services } from './admin.js';
import { readInitiationAccess } from './initiationAccess.js';
import { INITIATION_WINDOW_MS } from '../shared/initiationAccess.js';

import { passwordRouter } from './passwordAuth.js';
export const authRouter = Router();
authRouter.use(passwordRouter);
authRouter.use(['/auth', '/2fa'], (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const digest = (salt: string, code: string) => createHash('sha256').update(`${salt}:${code}`).digest('hex');
const wrap = (fn: (req: any, res: any) => Promise<any>) => (req: any, res: any, next: any) => { fn(req, res).catch(next); };
authRouter.get('/auth/session', authenticate, wrap(async (req, res) => {
  const profile = await services().db.collection('users').doc(req.identity.uid).get();
  if (!profile.exists) return res.status(409).json({ code: 'PROFILE_REQUIRED', error: 'Complétez votre inscription.' });
  const initiation = await readInitiationAccess(req.identity);
  return res.json({ uid: req.identity.uid, role: req.identity.role || null, initiation });
}));
authRouter.post('/2fa/send', authenticateIdentity, wrap(async (req, res) => {
  const identity = req.identity;
  if (!identity.email || !identity.auth_time) return res.status(400).json({ error: 'Une session avec une adresse email est requise.' });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Le code ne peut pas être envoyé pour le moment. Réessayez plus tard.' });
  const db = services().db;
  const ref = db.collection('mfaChallenges').doc(String(identity.appSessionId || identity.uid));
  const code = String(randomInt(100000, 1000000));
  const salt = randomBytes(32).toString('hex');
  const now = Date.now();
  const profile = (await db.collection('users').doc(identity.uid).get()).data();
  const access = await readInitiationAccess(identity);
  const renewal = access.required && access.expired;
  if (!profile?.twoFactorEnabled && !renewal && req.body?.enroll !== true) return res.status(400).json({ error: 'Demande d’activation de la double authentification requise.' });
  if (req.body?.enroll === true && now / 1000 - identity.auth_time > 300) return res.status(401).json({ code: 'REAUTH_REQUIRED', error: 'Reconnectez-vous avant d’activer la double authentification.' });
  const accepted = await db.runTransaction(async tx => {
    const previous = (await tx.get(ref)).data();
    if (previous && now - previous.sentAt < 60000) return false;
    tx.set(ref, { salt, hash: digest(salt, code), authTime: identity.auth_time, email: identity.email, expiresAt: now + 600000, sentAt: now, attempts: 0, delivered: false, enroll: !profile?.twoFactorEnabled && !renewal, purpose: renewal ? 'initiation' : 'mfa', renewalFrom: renewal ? access.expiresAt : null });
    return true;
  });
  if (!accepted) return res.status(429).json({ error: 'Attendez une minute avant de demander un nouveau code.' });
  try {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM || 'ARMP RDC Academia <no-reply@armp-rdc.org>', to: [identity.email], subject: 'Votre code de vérification ACADEMIA', text: `Votre code : ${code}. Valable 10 minutes. Ne le partagez avec personne.` }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('delivery-failed');
    await db.runTransaction(async tx => { const current = (await tx.get(ref)).data(); if (current?.salt === salt) tx.update(ref, { delivered: true }); });
    return res.json({ ok: true });
  } catch {
    // A failed delivery never leaves a usable challenge.
    await db.runTransaction(async tx => { const current = (await tx.get(ref)).data(); if (current?.salt === salt) tx.delete(ref); });
    return res.status(503).json({ error: 'Envoi du code indisponible. Réessayez.' });
  }
}));
authRouter.post('/2fa/verify', authenticateIdentity, wrap(async (req, res) => {
  const code = String(req.body?.code || '');
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Code à six chiffres requis.' });
  const identity = req.identity;
  const db = services().db;
  const ref = db.collection('mfaChallenges').doc(String(identity.appSessionId || identity.uid));
  const ok = await db.runTransaction(async tx => {
    const challenge = (await tx.get(ref)).data();
    if (!challenge || !challenge.delivered || challenge.authTime !== identity.auth_time || challenge.email !== identity.email || challenge.expiresAt <= Date.now() || challenge.attempts >= 5) return false;
    const accountRef = db.collection('authAccounts').doc(identity.uid);
    const account = challenge.purpose === 'initiation' ? (await tx.get(accountRef)).data() : null;
    if (challenge.purpose === 'initiation' && (account?.initiationExpiresAt !== challenge.renewalFrom || account?.initiationExpiresAt > Date.now())) return false;
    const actual = Buffer.from(digest(challenge.salt, code), 'hex');
    const expected = Buffer.from(challenge.hash, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) { tx.update(ref, { attempts: challenge.attempts + 1 }); return false; }
    // Native proofs are scoped to the application session ID and sign-in timestamp.
    tx.set(db.collection('mfaSessions').doc(String(identity.appSessionId || identity.uid)), { authTime: identity.auth_time, expiresAt: Date.now() + 12 * 3600000 });
    if (challenge.purpose === 'initiation') tx.set(accountRef, { initiationExpiresAt: Date.now() + INITIATION_WINDOW_MS, initiationRenewedAt: Date.now() }, { merge: true });
    if (challenge.enroll) tx.update(db.collection('users').doc(identity.uid), { twoFactorEnabled: true });
    tx.delete(ref);
    return true;
  });
  return res.status(ok ? 200 : 400).json(ok ? { ok: true } : { error: 'Code incorrect, expiré ou déjà utilisé.' });
}));
authRouter.post('/auth/mfa', authenticate, wrap(async (req, res) => {
  if (req.body?.enabled !== false) return res.status(400).json({ error: 'Activez la protection en confirmant un code.' });
  if (Date.now() / 1000 - req.identity.auth_time > 300) return res.status(401).json({ code: 'REAUTH_REQUIRED', error: 'Reconnectez-vous avant de modifier votre sécurité.' });
  await services().db.collection('users').doc(req.identity.uid).update({ twoFactorEnabled: false });
  await services().db.collection('mfaSessions').doc(String(req.identity.appSessionId || req.identity.uid)).delete();
  return res.json({ ok: true });
}));
authRouter.use((error: any, _req: any, res: any, _next: any) => {
  console.error('[Authentication API]', error?.code || 'service-unavailable');
  res.status(503).json({ code: 'AUTH_UNAVAILABLE', error: 'Service d’authentification indisponible.' });
});
