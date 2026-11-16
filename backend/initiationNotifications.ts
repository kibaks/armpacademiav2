import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { FieldPath } from 'firebase-admin/firestore';
import { services } from './services.js';
import { readInitiationAccess } from './initiationAccess.js';
import { authEmailConfigured, sendAppEmail } from './authEmail.js';
import { initiationExpiredEmail } from './emailTemplates.js';

// One notification per deadline, with a delivery lease shared by all workers.
export async function notifyInitiationExpiry(uid: string, role?: string) {
  const { db, auth } = services();
  const access = await readInitiationAccess({ uid, role });
  if (!access.expired || !access.expiresAt) return false;
  const user = await auth.getUser(uid);
  if (user.disabled || !user.email) return false;
  const ref = db.collection('authAccounts').doc(uid);
  const deadline = access.expiresAt;
  const lease = Date.now();
  const claimed = await db.runTransaction(async tx => {
    const account = (await tx.get(ref)).data();
    if (account?.initiationExpiresAt !== deadline || account.initiationComplete || account.initiationNotifiedExpiresAt === deadline
      || Number(account.initiationNotificationLeaseUntil || 0) > lease) return false;
    tx.set(ref, { initiationNotificationLeaseUntil: lease + 120000, initiationNotificationClaim: lease }, { merge: true });
    return true;
  });
  if (!claimed) return false;
  try {
    const profile = (await db.collection('users').doc(uid).get()).data();
    await sendAppEmail(user.email, initiationExpiredEmail(profile?.name || user.displayName));
    await db.runTransaction(async tx => {
      const current = (await tx.get(ref)).data();
      if (current?.initiationNotificationClaim === lease) tx.set(ref, {
        initiationNotifiedExpiresAt: deadline, initiationNotificationSentAt: Date.now(), initiationNotificationLeaseUntil: 0
      }, { merge: true });
    });
    return true;
  } catch (error) {
    // Keep the short lease on failure; the next scan retries without a mail storm.
    throw error;
  }
}

export const initiationNotificationsRouter = Router();
initiationNotificationsRouter.post('/internal/initiation-expiry', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const secret = process.env.INITIATION_SCHEDULER_SECRET;
  const actual = Buffer.from(req.get('Authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (process.env.INITIATION_ENFORCE_DEADLINE !== 'true' || !authEmailConfigured()) return res.status(503).json({ error: 'Policy or email unavailable' });
  try {
    const { db } = services();
    const stateRef = db.collection('privateInitiationJobs').doc('scan');
    const now = Date.now();
    const cursor = await db.runTransaction(async tx => {
      const state = (await tx.get(stateRef)).data();
      if (Number(state?.leaseUntil || 0) > now) return null;
      tx.set(stateRef, { leaseUntil: now + 240000 }, { merge: true });
      return String(state?.cursor || '');
    });
    if (cursor === null) return res.status(202).json({ busy: true });
    let query = db.collection('users').orderBy(FieldPath.documentId()).limit(10);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    let sent = 0, failed = 0;
    for (const doc of page.docs) {
      try { if (await notifyInitiationExpiry(doc.id, doc.data().role)) sent++; }
      catch { failed++; console.error('[Initiation notification] Delivery pending'); }
    }
    await stateRef.set({ cursor: page.size === 10 ? page.docs[page.size - 1].id : '', leaseUntil: 0, lastScanAt: Date.now() }, { merge: true });
    return res.json({ scanned: page.size, sent, failed });
  } catch {
    console.error('[Initiation notification] Scan pending');
    return res.status(503).json({ error: 'Retry later' });
  }
});
