import { services } from './services.js';
import { validatedStage } from '../shared/learnerProgression.js';
import { INITIATION_WINDOW_MS, initiationWindowExpired } from '../shared/initiationAccess.js';
type LearnerIdentity = { uid: string; role?: string };
export async function readInitiationAccess(identity: LearnerIdentity) {
  if (['super_admin', 'dfat_admin', 'formateur'].includes(identity.role || '')) return { required: false, expired: false, expiresAt: null };
  const db = services().db;
  const profile = await db.collection('users').doc(identity.uid).get();
  if (!profile.exists) return { required: false, expired: false, expiresAt: null };
  const attempts = await db.collection('levelTestAttempts').where('profileId', '==', identity.uid).get();
  const completed = validatedStage(attempts.docs.map(d => d.data())) !== 'Initiation';
  const ref = db.collection('authAccounts').doc(identity.uid);
  return db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (completed) {
      if (!current?.initiationComplete) tx.set(ref, { initiationComplete: true, version: current?.version || 0 }, { merge: true });
      return { required: false, expired: false, expiresAt: null };
    }
    // Do not start an irreversible countdown before recovery email is configured.
    // An already-issued deadline remains enforced if delivery later becomes unavailable.
    if (!Number.isFinite(current?.initiationExpiresAt) && (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)) return { required: true, expired: false, expiresAt: null };
    const now = Date.now();
    const expiresAt = Number.isFinite(current?.initiationExpiresAt) ? current!.initiationExpiresAt as number : now + INITIATION_WINDOW_MS;
    if (!Number.isFinite(current?.initiationExpiresAt) || current?.initiationComplete === true) tx.set(ref, { initiationExpiresAt: expiresAt, initiationStartedAt: current?.initiationStartedAt || now, initiationComplete: false, version: current?.version || 0 }, { merge: true });
    return { required: true, expired: initiationWindowExpired(expiresAt, now), expiresAt };
  });
}
