import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';

const fields = ['avatarUrl', 'coverUrl'];
function validImageUrl(value: unknown): value is string {
  if (value === '') return true; // Restore the default image.
  if (typeof value !== 'string' || value.length > 4096 || /[\\\x00-\x1f]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return !value.split('/').includes('..');
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export function createProfileMediaRouter(dependencies: { authenticate?: RequestHandler; db?: () => any } = {}) {
  const router = Router();
  router.use(dependencies.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const refFor = (uid: string) => (dependencies.db?.() || services().db).collection('users').doc(uid);
  const media = (data: any) => ({ avatarUrl: data.avatarUrl || '', coverUrl: data.coverUrl || '', mediaRevision: data.mediaRevision || 0 });
  router.get('/media', async (req: any, res) => {
    try {
      const snapshot = await refFor(req.identity.uid).get();
      if (!snapshot.exists) return res.status(409).json({ error: 'Profil introuvable. Reconnectez-vous.' });
      return res.json({ media: media(snapshot.data()) });
    } catch { return res.status(503).json({ error: 'Lecture des photos indisponible. Réessayez.' }); }
  });
  router.patch('/media', async (req: any, res) => {
    const patch = req.body;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) || !Object.keys(patch).length || Object.keys(patch).some(key => !fields.includes(key) || !validImageUrl(patch[key]))) {
      return res.status(400).json({ error: 'Photo ou couverture invalide. Choisissez une image puis réessayez.' });
    }
    try {
      const db = dependencies.db?.() || services().db;
      const ref = refFor(req.identity.uid);
      const saved = await db.runTransaction(async (transaction: any) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error('PROFILE_REQUIRED');
        const before = snapshot.data();
        const update = { ...patch, mediaRevision: (Number.isSafeInteger(before.mediaRevision) ? before.mediaRevision : 0) + 1 };
        transaction.update(ref, update);
        return media({ ...before, ...update });
      });
      return res.json({ media: saved });
    } catch (error) {
      const missing = error instanceof Error && error.message === 'PROFILE_REQUIRED';
      return res.status(missing ? 409 : 503).json({ error: missing ? 'Profil introuvable. Reconnectez-vous.' : 'La photo n’a pas pu être enregistrée. Réessayez.' });
    }
  });
  return router;
}
export const profileMediaRouter = createProfileMediaRouter();
