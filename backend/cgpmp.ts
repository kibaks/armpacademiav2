import { resetLink } from './nativeSession.js';
import type { DocumentReference } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { authenticate, requireAdmin, services } from './admin.js';

export const cgpmpRouter = Router();
cgpmpRouter.post('/send-credentials-email', authenticate, requireAdmin, async (req: any, res) => {
  res.set('Cache-Control', 'no-store');
  let leaseRef: DocumentReference | undefined;
  const leaseId = randomUUID();
  try {
    const requestId = String(req.body?.requestId || '');
    if (!/^[\w-]{1,128}$/.test(requestId)) return res.status(400).json({ error: 'Identifiant de demande invalide.' });
    if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Service de messagerie non configuré.' });
    const { auth, db } = services();
    const ref = db.collection('cgpmpAccountRequests').doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Demande introuvable.' });
    const request = snap.data()!;
    if (request.dispatchedEmails?.length && request.dispatchedEmails.every((mail: any) => mail.uid && !mail.tempPassword) && request.status === 'Validé par ARMP — Coordonnées envoyées') return res.json({ request, dispatchedEmails: request.dispatchedEmails });
    // Recipients come from the stored request, never from an arbitrary email body.
    const recipients = [{ fullName: request.permanentSecretaryName, email: request.permanentSecretaryEmail, matricule: request.permanentSecretaryMatricule, functionInCell: 'Secrétaire Permanent de la CGPMP' }, ...(request.members || [])];
    if (recipients.length > 100 || recipients.some((m: any) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email || '') || !String(m.fullName || '').trim())) return res.status(400).json({ error: 'Destinataires invalides.' });
    leaseRef = db.collection('cgpmpProvisioning').doc(requestId);
    const locked = await db.runTransaction(async tx => {
      const lease = (await tx.get(leaseRef!)).data();
      if (lease && lease.expiresAt > Date.now()) return false;
      tx.set(leaseRef!, { leaseId, expiresAt: Date.now() + 1800000 });
      return true;
    });
    if (!locked) return res.status(409).json({ error: 'Cette demande est déjà en cours de traitement.' });
    const dispatchedEmails: any[] = [];

    for (const [index, recipient] of recipients.entries()) {
      const email = recipient.email.trim().toLowerCase();
      let user;
      try { user = await auth.getUserByEmail(email); }
      catch (error: any) { if (error.code !== 'auth/user-not-found') throw error; }
      if (user && user.customClaims?.cgpmpRequestId !== requestId) return res.status(409).json({ error: 'Une adresse possède déjà un compte. Aucun accès existant ne sera remplacé.' });
      if (!user) {
        user = await auth.createUser({ email, displayName: recipient.fullName });
        try { await auth.setCustomUserClaims(user.uid, { role: 'cgpmp_member', cgpmpRequestId: requestId }); }
        catch (error) { await auth.deleteUser(user.uid); throw error; }
      }
      const profileRef = db.collection('users').doc(user.uid);
      if (!(await profileRef.get()).exists) await profileRef.set({ id: user.uid, email, name: recipient.fullName, role: 'cgpmp_member', roleTitle: recipient.functionInCell || 'Membre CGPMP', institution: request.institution, phone: '', level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [], joinDate: new Date().toISOString(), cgpmpRequestId: requestId });
      const deliveryRef = db.collection('cgpmpDeliveries').doc(`${requestId}-${user.uid}`);
      if (!(await deliveryRef.get()).exists) {
        const link = await resetLink(user.uid);
        const sent = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM || 'ARMP RDC Academia <no-reply@armp-rdc.org>', to: [email], subject: 'Activation de votre compte ACADEMIA', text: `Bonjour ${recipient.fullName}, votre compte est créé. Définissez votre mot de passe avec ce lien personnel : ${link}` }), signal: AbortSignal.timeout(15000) });
        if (!sent.ok) throw new Error('email-delivery-failed');
        await deliveryRef.set({ uid: user.uid, sentAt: new Date().toISOString() });
      }
      dispatchedEmails.push({ id: `MAIL-${user.uid}`, uid: user.uid, recipientName: recipient.fullName, recipientEmail: email, recipientRoleInCell: recipient.functionInCell || 'Membre CGPMP', loginEmail: email, tempPassword: '', matricule: recipient.matricule || `CGPMP-${index + 1}`, subject: 'Activation de votre compte ACADEMIA', bodyPreview: 'Lien personnel de définition du mot de passe envoyé par email.', sentAt: new Date().toISOString(), validatedByAdmin: req.identity.email || req.identity.uid });
    }
    const members = (request.members || []).map((member: any) => {
      const mail = dispatchedEmails.find(m => m.recipientEmail === member.email.trim().toLowerCase());
      const { generatedPassword, ...safe } = member;
      return { ...safe, firebaseUid: mail.uid, matricule: mail.matricule, accountActivated: true, credentialsSentAt: mail.sentAt };
    });
    const updated = { ...request, members, dispatchedEmails, status: 'Validé par ARMP — Coordonnées envoyées', validatedBy: req.identity.email || req.identity.uid, decidedAt: new Date().toISOString() };
    await ref.set(updated);
    await db.collection('adminAudit').add({ actor: req.identity.uid, action: 'cgpmp.provision', target: requestId, date: new Date().toISOString() });
    return res.json({ request: updated, dispatchedEmails });
  } catch (error: any) {
    console.error('[CGPMP provisioning]', error.code || 'unavailable');
    return res.status(503).json({ error: 'Création ou envoi incomplet. Réessayez : les comptes déjà créés seront conservés.' });
  } finally {
    if (leaseRef) {
      try { await services().db.runTransaction(async tx => {
        const lease = (await tx.get(leaseRef!)).data();
        if (lease?.leaseId === leaseId) tx.delete(leaseRef!);
      }); } catch { console.error('[CGPMP provisioning] lease-cleanup-unavailable'); }
    }
  }
});
