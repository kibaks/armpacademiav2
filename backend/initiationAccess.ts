import { authEmailConfigured } from './authEmail.js';
import { services } from './services.js';
import { validatedStage } from '../shared/learnerProgression.js';
import { INITIATION_WINDOW_MS, initiationWindowExpired } from '../shared/initiationAccess.js';
type LearnerIdentity = { uid: string; role?: string };
export async function readInitiationAccess(identity: LearnerIdentity) {
  if (['super_admin', 'dfat_admin', 'formateur'].includes(identity.role || '')) return { required: false, expired: false, expiresAt: null, stage: undefined };
  const db = services().db;
  const profile = await db.collection('users').doc(identity.uid).get();
  if (!profile.exists) return { required: false, expired: false, expiresAt: null, stage: undefined };
  const attempts = await db.collection('levelTestAttempts').where('profileId', '==', identity.uid).get();
  const stage = validatedStage(attempts.docs.map(d => d.data()));
  const completed = stage !== 'Initiation';
  const ref = db.collection('authAccounts').doc(identity.uid);
  const existing = (await ref.get()).data();
  // Legacy accounts use the identity provider’s server-owned creation date.
  // Editable profile dates never control access.
  const registeredAt = Number.isFinite(existing?.registeredAt) ? existing!.registeredAt as number : Date.parse((await services().auth.getUser(identity.uid)).metadata.creationTime);
  if (!Number.isFinite(registeredAt) || registeredAt > Date.now()) throw new Error('registration-date-unavailable');
  return db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (completed) {
      if (!current?.initiationComplete) tx.set(ref, { initiationComplete: true, version: current?.version || 0 }, { merge: true });
      return { required: false, expired: false, expiresAt: null, stage };
    }
    const now = Date.now();
    const enforced = process.env.INITIATION_ENFORCE_DEADLINE === 'true' && authEmailConfigured();
    const renewalEnd = current?.initiationRenewalExpiresAt || current?.initiationExpiresAt;
    const renewed = enforced && Number.isFinite(current?.initiationRenewedAt) && Number.isFinite(renewalEnd);
    const expiresAt = renewed ? renewalEnd as number : registeredAt + INITIATION_WINDOW_MS;
    if (current?.initiationScheduledExpiresAt !== expiresAt || current?.initiationClockVersion !== 3 || current?.initiationComplete === true || (enforced ? current?.initiationExpiresAt !== expiresAt : Number.isFinite(current?.initiationExpiresAt))) {
      const next: Record<string, unknown> = { ...current, registeredAt, initiationScheduledExpiresAt: expiresAt, initiationStartedAt: registeredAt, initiationClockVersion: 3, initiationComplete: false, version: current?.version || 0 };
      if (Number.isFinite(current?.initiationRenewedAt) && Number.isFinite(renewalEnd)) next.initiationRenewalExpiresAt = renewalEnd;
      if (enforced) next.initiationExpiresAt = expiresAt;
      else delete next.initiationExpiresAt;
      // The transaction preserves credentials while removing a legacy enforcement
      // deadline in countdown-only mode. Firestore then follows the same policy.
      tx.set(ref, next);
    }
    return { required: true, expired: enforced && initiationWindowExpired(expiresAt, now), expiresAt, enforced, stage };
  });
}
