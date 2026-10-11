import type { RequestHandler } from 'express';
import { services } from './admin';
import { HttpError, safeAsync } from './http';

// Shared across serverless instances; never silently disable quotas on database failure.
export const aiGuard: RequestHandler = safeAsync(async (req, _res, next) => {
  const identity = (req as any).identity;
  if (Array.isArray(req.body)) throw new HttpError(400, 'Objet JSON requis.');
  if ((req.path === '/generate-report' && !['super_admin', 'dfat_admin'].includes(identity.role)) || (req.path === '/generate-animated-module' && !['super_admin', 'dfat_admin', 'formateur'].includes(identity.role))) {
    throw new HttpError(403, 'Accès pédagogique requis.');
  }
  if (JSON.stringify(req.body || {}).length > 4_000_000) throw new HttpError(413, 'Requête trop volumineuse.');
  if (req.path === '/tutor') {
    const b = req.body || {};
    if ((b.message !== undefined && (typeof b.message !== 'string' || b.message.length > 20000)) ||
        (b.history !== undefined && (!Array.isArray(b.history) || b.history.length > 50 || b.history.some((entry: any) => !entry || !['user', 'bot', 'assistant'].includes(entry.sender) || typeof entry.text !== 'string' || entry.text.length > 20000))) ||
        ['context', 'userName', 'audioBase64', 'audioMimeType'].some(key => b[key] != null && typeof b[key] !== 'string')) {
      throw new HttpError(400, 'Message, historique ou média invalide.');
    }
  }
  const bucket = Math.floor(Date.now() / 60000);
  const day = Math.floor(Date.now() / 86400000);
  const video = req.path.startsWith('/flow-video/start');
  const ref = services().db.collection('apiQuotas').doc(identity.uid);
  await services().db.runTransaction(async tx => {
    const previous = (await tx.get(ref)).data();
    const count = previous?.bucket === bucket ? Number(previous.count) || 0 : 0;
    const dailyCount = previous?.day === day ? Number(previous.dailyCount) || 0 : 0;
    const videos = previous?.day === day ? Number(previous.videos) || 0 : 0;
    if (count >= 30) throw new HttpError(429, 'Limite atteinte. Réessayez dans une minute.');
    if (dailyCount >= 1000 || (video && videos >= 5)) throw new HttpError(429, 'Limite quotidienne atteinte.');
    tx.set(ref, { bucket, count: count + 1, day, dailyCount: dailyCount + 1, videos: videos + (video ? 1 : 0) });
  });
  next();
});
