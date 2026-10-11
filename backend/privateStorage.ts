import express, { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { authenticate, services } from './admin';
import { safeAsync, HttpError } from './http';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { validFileSignature } from './fileSignature';
import { aiGuard } from './aiGuard';
import { FieldPath } from 'firebase-admin/firestore';

export const MAX_FILE_BYTES = 3 * 1024 * 1024;
const contentTypes: Record<string, string> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', txt: 'text/plain', csv: 'text/csv', json: 'application/json',
};
const publicMedia = (mime: string) => /^(image|audio|video)\//.test(mime);
export function privateStorageDependencies() {
  const { auth, db } = services();
  return { auth, db, bucket: getStorage(auth.app).bucket(config.storageBucket) };
}
export function createPrivateStorageRouter(dependencies: any = {}) {
  const router = Router();
  const deps = () => dependencies.services ? dependencies.services() : privateStorageDependencies();
  const verified = dependencies.authenticate || authenticate;
  const quota = dependencies.guard || aiGuard;
  router.delete('/session', (_req, res) => {
    res.clearCookie('academia_media', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/storage' });
    res.json({ cleared: true });
  });
  router.post('/session', verified, quota, safeAsync(async (req: any, res) => {
    const token = req.headers.authorization.match(/^Bearer (.+)$/)[1];
    const cookie = await deps().auth.createSessionCookie(token, { expiresIn: 60 * 60 * 1000 });
    res.cookie('academia_media', cookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/storage', maxAge: 60 * 60 * 1000 });
    res.json({ ready: true });
  }));
  const refFor = (id: string) => {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new HttpError(400, 'Identifiant invalide.');
    return deps().db.collection('privateFiles').doc(id);
  };
  const metadata = (file: any) => ({ ...file, path: '', storedName: '', url: `/api/storage/files/${file.id}/content`, disk: 'academia', size: Number(file.size) });
  router.post('/files', verified, quota, express.raw({ type: 'application/octet-stream', limit: MAX_FILE_BYTES }), safeAsync(async (req: any, res) => {
    let name: string;
    try { name = decodeURIComponent(req.get('X-Upload-Filename') || ''); } catch { return res.status(400).json({ error: 'Nom invalide.' }); }
    const extension = name.split('.').pop()?.toLowerCase() || '';
    const mimeType = contentTypes[extension];
    if (!mimeType || name.length > 180 || /[\/\\\x00-\x1f]/.test(name) || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Format de fichier invalide ou fichier vide.' });
    if (!validFileSignature(req.body, extension)) return res.status(400).json({ error: 'Le contenu ne correspond pas au format du fichier.' });
    const visibility = req.get('X-Upload-Visibility') || 'private';
    if (!['private', 'public'].includes(visibility) || (visibility === 'public' && !publicMedia(mimeType))) return res.status(400).json({ error: 'Seuls les médias peuvent être publiés. Les documents restent privés.' });
    const category = req.get('X-Upload-Category') || 'documents';
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(category)) return res.status(400).json({ error: 'Catégorie invalide.' });
    const id = randomUUID();
    const path = `academia/${req.identity.uid}/${id}`;
    const stored = deps().bucket.file(path);
    await stored.save(req.body, { resumable: false, metadata: { contentType: mimeType, cacheControl: 'private, no-store' } });
    const now = new Date().toISOString();
    const record = { id, originalName: name, path, mimeType, extension, size: req.body.length, category, visibility, uploadedBy: req.identity.uid, entityId: req.identity.uid, description: null, createdAt: now, updatedAt: now };
    try { await refFor(id).set(record); }
    catch (error) { await stored.delete().catch(() => {}); throw error; }
    res.status(201).json({ data: metadata(record) });
  }));
  router.get('/files', verified, safeAsync(async (req: any, res) => {
    const cursor = req.query.cursor;
    if (cursor !== undefined && (typeof cursor !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(cursor))) return res.status(400).json({ error: 'Curseur invalide.' });
    const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: 'Limite invalide.' });
    let query = deps().db.collection('privateFiles').where('uploadedBy', '==', req.identity.uid).orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const snap = await query.limit(limit).get();
    const items = snap.docs.map((doc: any) => metadata(doc.data())).filter((file: any) => (!req.query.category || file.category === req.query.category) && (!req.query.visibility || file.visibility === req.query.visibility));
    res.json({ data: items, nextCursor: snap.size === limit ? snap.docs.at(-1).id : null });
  }));
  router.get('/files/:id/content', safeAsync(async (req: any, res) => {
    const record = (await refFor(String(req.params.id)).get()).data();
    if (!record) return res.status(404).json({ error: 'Fichier introuvable.' });
    if (record.visibility !== 'public') {
      const cookie = (req.get('Cookie') || '').split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith('academia_media='))?.slice('academia_media='.length);
      let identity;
      try {
        const bearer = req.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
        identity = bearer ? await deps().auth.verifyIdToken(bearer, true) : await deps().auth.verifySessionCookie(cookie || '', true);
      } catch { return res.status(401).json({ error: 'Reconnectez-vous pour lire ce fichier.' }); }
      if (identity.uid !== record.uploadedBy) return res.status(404).json({ error: 'Fichier introuvable.' });
      const account = await deps().auth.getUser(identity.uid);
      const policy = await deps().db.collection('accountSecurity').doc(identity.uid).get();
      if ((account.multiFactor?.enrolledFactors?.length || policy.data()?.mfaRequired) && !identity.firebase?.sign_in_second_factor) return res.status(403).json({ error: 'Second facteur requis.' });
    }
    // Object names come only from our server registry, never from request URLs.
    const [buffer] = await deps().bucket.file(record.path).download();
    res.set({ 'Content-Type': record.mimeType, 'Content-Disposition': `${publicMedia(record.mimeType) ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(record.originalName)}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; sandbox" });
    res.send(buffer);
  }));
  router.get('/files/:id', verified, safeAsync(async (req: any, res) => {
    const record = (await refFor(String(req.params.id)).get()).data();
    if (!record || record.uploadedBy !== req.identity.uid) return res.status(404).json({ error: 'Fichier introuvable.' });
    res.json({ data: metadata(record) });
  }));
  router.delete('/files/:id', verified, safeAsync(async (req: any, res) => {
    const ref = refFor(String(req.params.id));
    const record = (await ref.get()).data();
    if (!record || record.uploadedBy !== req.identity.uid) return res.status(404).json({ error: 'Fichier introuvable.' });
    await deps().bucket.file(record.path).delete({ ignoreNotFound: true });
    await ref.delete(); res.json({ deleted: true });
  }));
  return router;
}
export const privateStorageRouter = createPrivateStorageRouter();
