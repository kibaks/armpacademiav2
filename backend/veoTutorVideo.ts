import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';
import { normalizeVideoText } from './syncTutorVideo.js';

const MODEL = 'veo-3.1-lite-generate-preview';
const PERSONAS = ['denise', 'vivienne', 'charline', 'eloise'];
export const VEO_MAX_TEXT = 140;
type Deps = { env?: NodeJS.ProcessEnv; db?: () => any; authenticate?: RequestHandler;
  client?: any; portrait?: () => Promise<Buffer>; fetcher?: typeof fetch };
export function veoConfiguration(env: NodeJS.ProcessEnv) {
  return { enabled: env.TUTOR_VIDEO_ENABLED === 'true' && !!env.GEMINI_API_KEY,
    provider: 'veo', personas: PERSONAS, maxTextLength: VEO_MAX_TEXT };
}
function googleMediaUri(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const u = new URL(value); return u.origin === 'https://generativelanguage.googleapis.com' && !u.username && !u.password; }
  catch { return false; }
}
export function createVeoTutorVideoRouter(deps: Deps = {}) {
  const router = Router();
  const env = deps.env || process.env;
  const db = () => deps.db?.() || services().db;
  const client = () => deps.client || new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } } });
  router.use(deps.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/config', (_req, res) => res.json(veoConfiguration(env)));
  router.post('/', async (req: any, res) => {
    let ref: any, reserved = false;
    try {
      if (!veoConfiguration(env).enabled) return res.status(503).json({ error: 'La vidéo Veo n’est pas encore activée.' });
      const { persona, text: raw } = req.body || {};
      if (typeof raw !== 'string' || raw.length > 6000 || !PERSONAS.includes(persona)) return res.status(400).json({ error: 'Réponse ou tutrice invalide.' });
      const text = normalizeVideoText(raw);
      if (!text || text.length > VEO_MAX_TEXT || text.split(/\s+/).length > 22) return res.status(400).json({ error: 'Cet extrait accepte une courte phrase de 22 mots maximum. Écoutez la réponse complète en audio.' });
      const uid = req.identity.uid;
      const id = createHash('sha256').update(JSON.stringify([uid, persona, text, MODEL, 'portrait-v1'])).digest('hex');
      ref = db().collection('veoTutorJobs').doc(id);
      const day = new Date().toISOString().slice(0, 10);
      const quota = db().collection('veoTutorQuotas').doc(createHash('sha256').update(`${uid}:${day}`).digest('hex'));
      const configured = Number(env.VEO_VIDEO_DAILY_LIMIT || 1);
      const limit = Number.isSafeInteger(configured) && configured > 0 ? configured : 1;
      const reservation = await db().runTransaction(async (tx: any) => {
        const existing = await tx.get(ref);
        if (existing.exists) return 'existing';
        const usage = (await tx.get(quota)).data();
        if ((usage?.count || 0) >= limit) return 'limit';
        tx.set(quota, { uid, day, count: (usage?.count || 0) + 1 });
        tx.set(ref, { uid, status: 'SUBMITTING', createdAt: Date.now() });
        return 'new';
      });
      if (reservation === 'limit') return res.status(429).json({ error: 'Votre limite quotidienne de vidéos est atteinte. La réponse audio reste disponible.' });
      if (reservation === 'existing') return res.status(202).json({ id });
      reserved = true;
      const portrait = await (deps.portrait?.() || readFile(path.join(process.cwd(), 'public/assets/tutrice-portrait-v1.jpg')));
      const operation = await client().models.generateVideos({ model: MODEL,
        prompt: `One continuous fixed-camera shot of this same adult female tutor. Preserve identity, clothing and background. She says exactly in clear eloquent French: ${JSON.stringify(text)}. Natural female French voice. Sharp lips and teeth with synchronized articulation, gentle affirmative head nod and natural blinking. Coherent head, neck and body. Hands outside the frame. No zoom, cuts, overlays, music or other speech. Finish naturally with mouth at rest. Eight seconds.`,
        image: { imageBytes: portrait.toString('base64'), mimeType: 'image/jpeg' },
        config: { numberOfVideos: 1, durationSeconds: 8, resolution: '720p', aspectRatio: '9:16', personGeneration: 'allow_adult' } });
      if (typeof operation.name !== 'string') throw new Error('NO_OPERATION');
      await ref.update({ operationName: operation.name, status: 'PENDING' });
      return res.status(202).json({ id });
    } catch {
      // An uncertain submission is never automatically repeated or routed to a costlier model.
      if (reserved) await ref.update({ status: 'FAILED' }).catch(() => undefined);
      return res.status(503).json({ error: 'Google n’a pas pu préparer la vidéo. Vous pouvez écouter la réponse en audio.' });
    }
  });
  const ownedJob = async (req: any) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id)) return null;
    const ref = db().collection('veoTutorJobs').doc(req.params.id);
    const job = (await ref.get()).data();
    return job?.uid === req.identity.uid ? { ref, job } : null;
  };
  router.get('/:id', async (req: any, res) => {
    try {
      const owned = await ownedJob(req);
      if (!owned) return res.sendStatus(404);
      const { ref, job } = owned;
      if (job.status === 'FAILED') return res.json({ status: 'FAILED', error: 'La génération a échoué. Écoutez la réponse en audio.' });
      if (Date.now() - job.createdAt > 24 * 3600000) return res.json({ status: 'FAILED', error: 'Cet extrait a expiré. La réponse écrite reste disponible.' });
      if (job.status === 'COMPLETED') return res.json({ status: 'COMPLETED', videoUrl: `/api/ai/tutor-video/${req.params.id}/media` });
      if (!job.operationName) return res.json({ status: 'PENDING' });
      const operation = await client().operations.getVideosOperation({ operation: { name: job.operationName } });
      if (operation.error || (operation.done && !operation.response?.generatedVideos?.[0]?.video?.uri)) {
        await ref.update({ status: 'FAILED' });
        return res.json({ status: 'FAILED', error: 'Google n’a pas retourné de vidéo. Écoutez la réponse en audio.' });
      }
      if (operation.done) {
        const uri = operation.response.generatedVideos[0].video.uri;
        if (!googleMediaUri(uri)) throw new Error('INVALID_MEDIA');
        await ref.update({ status: 'COMPLETED', mediaUri: uri });
        return res.json({ status: 'COMPLETED', videoUrl: `/api/ai/tutor-video/${req.params.id}/media` });
      }
      return res.json({ status: 'PENDING' });
    } catch { return res.status(503).json({ error: 'Le suivi Google est momentanément indisponible.' }); }
  });
  router.get('/:id/media', async (req: any, res) => {
    try {
      const owned = await ownedJob(req);
      if (!owned || owned.job.status !== 'COMPLETED' || Date.now() - owned.job.createdAt > 24 * 3600000 || !googleMediaUri(owned.job.mediaUri)) return res.sendStatus(404);
      const request = deps.fetcher || fetch;
      const signal = AbortSignal.timeout(45000);
      let response = await request(owned.job.mediaUri, { headers: { 'x-goog-api-key': env.GEMINI_API_KEY! }, redirect: 'manual', signal });
      for (let redirects = 0; response.status >= 300 && response.status < 400 && redirects < 3; redirects++) {
        const location = response.headers.get('location');
        if (!location) return res.sendStatus(503);
        const next = new URL(location, owned.job.mediaUri);
        // Signed Google Storage redirects need no API key. Never forward it off the API origin.
        if (next.protocol !== 'https:' || next.username || next.password || !(next.hostname === 'storage.googleapis.com' || next.hostname.endsWith('.storage.googleapis.com'))) return res.sendStatus(503);
        response = await request(next, { redirect: 'manual', signal });
      }
      if (!response.ok || !response.body) return res.sendStatus(503);
      // Stream the response instead of buffering it inside a Vercel Function.
      res.type('video/mp4');
      const reader = response.body.getReader();
      try { while (true) {
        const { value, done } = await reader.read(); if (done) break;
        if (res.destroyed) break;
        if (!res.write(value)) await new Promise<void>(resolve => { const finish = () => { res.off('drain', finish); res.off('close', finish); resolve(); }; res.once('drain', finish); res.once('close', finish); });
      } }
      finally { await reader.cancel().catch(() => undefined); }
      return res.end();
    } catch { if (res.headersSent) return res.destroy(); return res.sendStatus(503); }
  });
  return router;
}
