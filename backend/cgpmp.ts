import crypto from 'node:crypto';
import { services } from './admin';
import { HttpError } from './http';

// Provision from the persisted application, never from client-provided recipients/passwords.
export async function activateCgpmp(req: any, res: any) {
  const requestId = req.body?.requestId;
  if (typeof requestId !== 'string' || !/^[\w-]{1,128}$/.test(requestId)) throw new HttpError(400, 'Demande invalide.');
  if (!process.env.RESEND_API_KEY) throw new HttpError(503, 'Service email non configuré. Aucun compte annoncé comme activé.');
  const { auth, db } = services();
  const ref = db.collection('cgpmpAccountRequests').doc(requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpError(404, 'Demande introuvable.');
  const application = snapshot.data()!;
  if (application.status === 'Rejeté par ARMP') throw new HttpError(409, 'Cette demande est rejetée.');
  if (!application.creationDocument?.fileDataUrl) throw new HttpError(409, 'Pièce de création absente : une nouvelle soumission est nécessaire.');
  const recipients = [{ email: application.permanentSecretaryEmail, fullName: application.permanentSecretaryName, functionInCell: 'Secrétaire Permanent', matricule: application.permanentSecretaryMatricule }, ...(application.members || [])];
  if (recipients.length > 50 || !recipients.every(person => typeof person.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))) throw new HttpError(400, 'Liste de destinataires invalide (50 maximum).');
  const mails: any[] = [];
  for (const person of recipients) {
    const email = person.email.trim().toLowerCase();
    let account;
    try { account = await auth.getUserByEmail(email); }
    catch (error: any) {
      if (error.code !== 'auth/user-not-found') throw error;
      const uid = 'cgpmp-' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 40);
      try { account = await auth.createUser({ uid, email, displayName: String(person.fullName || 'Membre CGPMP').slice(0, 120) }); }
      catch (createError: any) {
        if (!['auth/uid-already-exists', 'auth/email-already-exists'].includes(createError.code)) throw createError;
        account = await auth.getUserByEmail(email);
      }
    }
    // Existing roles and personal information remain authoritative.
    const profile = db.collection('users').doc(account.uid);
    const existing = await profile.get();
    if (!existing.exists) await profile.set({ id: account.uid, email, name: account.displayName || person.fullName || 'Membre CGPMP', role: 'cgpmp_member', roleTitle: person.functionInCell || 'Membre CGPMP', institution: application.institution, avatarUrl: '/armp-logo.png', joinDate: new Date().toISOString(), level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [] });
    const dispatch = db.collection('cgpmpDispatches').doc(`${requestId}-${account.uid}`);
    const previous = await dispatch.get();
    let mail = previous.data();
    if (!mail?.acceptedAt) {
      const link = await auth.generatePasswordResetLink(email);
      const proposed = { from: process.env.RESEND_FROM || 'ARMP RDC Academia <no-reply@armp-rdc.org>', to: [email], subject: '[ARMP RDC] Activation de votre accès Academia', text: `Bonjour ${person.fullName || ''}, votre demande CGPMP a été validée. Définissez votre mot de passe avec ce lien personnel : ${link}. Aucun mot de passe temporaire ne vous sera envoyé.` };
      const pending = await db.runTransaction(async tx => {
        const data = (await tx.get(dispatch)).data();
        if (data?.acceptedAt) return data;
        const fresh = data?.payload && Date.now() - Date.parse(data.createdAt) < 30 * 60000;
        const value = fresh ? data : { payload: proposed, createdAt: new Date().toISOString(), deliveryId: crypto.randomUUID() };
        tx.set(dispatch, value);
        return value;
      });
      if (pending.acceptedAt) { mails.push(pending); continue; }
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Idempotency-Key': crypto.createHash('sha256').update(`${requestId}:${account.uid}:${pending.deliveryId}`).digest('hex') },
        body: JSON.stringify(pending.payload),
      });
      if (!response.ok) throw new HttpError(503, 'Envoi refusé par le service email. La validation reste incomplète ; réessayez.');
      mail = { id: `${requestId}-${account.uid}`, uid: account.uid, recipientEmail: email, recipientName: person.fullName || '', recipientRoleInCell: person.functionInCell || 'Membre CGPMP', loginEmail: email, tempPassword: '', matricule: person.matricule || '', subject: 'Activation Academia', bodyPreview: 'Lien personnel de définition du mot de passe accepté par le service email.', acceptedAt: new Date().toISOString(), sentAt: new Date().toISOString(), validatedByAdmin: req.identity.uid };
      await dispatch.set(mail);
    }
    mails.push(mail);
  }
  const updated = { ...application, status: 'Validé par ARMP — Coordonnées envoyées', validatedBy: req.identity.uid, decidedAt: new Date().toISOString(), dispatchedEmails: mails, members: (application.members || []).map(({ generatedPassword, ...person }: any) => ({ ...person, accountActivated: false, credentialsSentAt: new Date().toISOString() })) };
  await ref.set(updated);
  res.json({ success: true, request: updated });
}
