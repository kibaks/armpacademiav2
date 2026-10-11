import { Router } from 'express';
import { authenticate, services } from './admin';
import { safeAsync } from './http';

// Only this endpoint can accept the recent token obtained during enrollment.
// It cannot change factors or roles; Firebase Auth remains authoritative.
export const accountSecurityRouter = Router();
accountSecurityRouter.post('/mfa/disable', authenticate, safeAsync(async (req: any, res) => {
  const identity = req.identity;
  if (!identity.firebase?.sign_in_second_factor || !identity.auth_time || Math.abs(Date.now() / 1000 - identity.auth_time) > 300) return res.status(403).json({ error: 'Vérifiez récemment votre second facteur.' });
  const { auth, db } = services();
  await auth.updateUser(identity.uid, { multiFactor: { enrolledFactors: [] } });
  await db.collection('accountSecurity').doc(identity.uid).set({ mfaRequired: false, updatedAt: new Date().toISOString() });
  await auth.revokeRefreshTokens(identity.uid);
  res.json({ mfaRequired: false, reconnect: true });
}));
accountSecurityRouter.post('/mfa/sync', safeAsync(async (req, res) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Connexion requise.' });
  const { auth, db } = services();
  let identity;
  try { identity = await auth.verifyIdToken(token, true); }
  catch { return res.status(401).json({ error: 'Session expirée ou invalide.' }); }
  if (!identity.auth_time || Math.abs(Date.now() / 1000 - identity.auth_time) > 300) return res.status(403).json({ error: 'Une authentification récente est requise.' });
  const account = await auth.getUser(identity.uid);
  const ref = db.collection('accountSecurity').doc(identity.uid);
  const previous = await ref.get();
  const mfaRequired = !!account.multiFactor?.enrolledFactors?.length;
  if (!mfaRequired && previous.data()?.mfaRequired && !identity.firebase?.sign_in_second_factor) return res.status(403).json({ error: 'Vérifiez le second facteur avant de désactiver sa protection.' });
  await ref.set({ mfaRequired, updatedAt: new Date().toISOString() });
  // Revoking sessions also invalidates ID tokens on authenticated server routes.
  await auth.revokeRefreshTokens(identity.uid);
  res.json({ mfaRequired, reconnect: true });
}));
