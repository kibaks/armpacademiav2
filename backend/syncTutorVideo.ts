import { createHash } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';
import { synthesizePiperTutor } from './piperTutorSpeech.js';
import { synthesizeCartesiaTutor } from './cartesiaTutorSpeech.js';
import { synthesizeElevenTutor } from './elevenTutorSpeech.js';

const API = 'https://api.sync.so/v2/generate';
const PERSONAS = ['denise', 'vivienne', 'charline', 'eloise'];
export const MAX_VIDEO_TEXT = 1800;
type Narration = { audioBuffer: Buffer; mimeType: string };
type Dependencies = { authenticate?: RequestHandler; db?: () => any; env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch; synthesize?: (text: string, persona: string) => Promise<Narration | null> };

export function secureVideoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch { return null; }
}
export function syncVideoConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const source = secureVideoUrl(env.SYNC_TUTOR_VIDEO_URL) || ((env.SYNC_VIDEO_MODEL || 'sync-3') === 'sync-3' && secureVideoUrl(env.SYNC_TUTOR_IMAGE_URL));
  return { enabled: env.TUTOR_VIDEO_ENABLED === 'true' && Boolean(env.SYNC_API_KEY && source),
    personas: PERSONAS, maxTextLength: MAX_VIDEO_TEXT };
}
export function normalizeVideoText(text: string) {
  return text.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ').replace(/[#*`_>|]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function videoJobKey(uid: string, text: string, persona: string, source: string, model: string) {
  return createHash('sha256').update(JSON.stringify([uid, text, persona, source, model])).digest('hex');
}
async function narration(text: string, persona: string) {
  return await synthesizePiperTutor(text, persona) || await synthesizeCartesiaTutor(text, persona)
    || await synthesizeElevenTutor(text, persona);
}

export function createSyncTutorVideoRouter(deps: Dependencies = {}) {
  const router = Router();
  const env = deps.env || process.env;
  const db = () => deps.db?.() || services().db;
  const request = deps.fetcher || fetch;
  router.use(deps.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/config', (_req, res) => res.json(syncVideoConfiguration(env)));

  router.post('/', async (req: any, res) => {
    let ref: any;
    let reserved = false;
    try {
      if (!syncVideoConfiguration(env).enabled) return res.status(503).json({ error: 'La vidéo de la tutrice n’est pas encore activée.' });
      const raw = req.body?.text, persona = req.body?.persona;
      if (typeof raw !== 'string' || raw.length > 6000 || !PERSONAS.includes(persona)) return res.status(400).json({ error: 'Réponse ou tutrice invalide.' });
      const text = normalizeVideoText(raw);
      if (!text || text.length > MAX_VIDEO_TEXT) return res.status(400).json({ error: `Pour la vidéo, demandez une réponse de ${MAX_VIDEO_TEXT} caractères maximum.` });
      const uid = req.identity.uid;
      const model = env.SYNC_VIDEO_MODEL || 'sync-3';
      if (!['lipsync-2', 'lipsync-2-pro', 'sync-3'].includes(model)) return res.status(503).json({ error: 'Configuration vidéo à vérifier par l’administrateur.' });
      const image = model === 'sync-3' ? secureVideoUrl(env.SYNC_TUTOR_IMAGE_URL) : null;
      const source = image || secureVideoUrl(env.SYNC_TUTOR_VIDEO_URL)!;
      const sourceType = image ? 'image' : 'video';
      const key = videoJobKey(uid, text, persona, `${sourceType}:${source}`, model);
      ref = db().collection('tutorVideoJobs').doc(key);
      const day = new Date().toISOString().slice(0, 10);
      const quota = db().collection('tutorVideoQuotas').doc(createHash('sha256').update(`${uid}:${day}`).digest('hex'));
      const configuredLimit = Number(env.SYNC_VIDEO_DAILY_LIMIT || 6);
      const limit = Number.isSafeInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 6;
      const reservation = await db().runTransaction(async (tx: any) => {
        const existing = await tx.get(ref);
        if (existing.exists) return 'existing';
        const usage = (await tx.get(quota)).data();
        if ((usage?.count || 0) >= limit) return 'limit';
        tx.set(quota, { uid, day, count: (usage?.count || 0) + 1 });
        tx.set(ref, { uid, persona, status: 'SUBMITTING', createdAt: Date.now() });
        return 'new';
      });
      if (reservation === 'limit') return res.status(429).json({ error: 'Votre limite de vidéos du jour est atteinte. Les réponses écrites et vocales restent disponibles.' });
      if (reservation === 'existing') return res.status(202).json({ id: key });
      reserved = true;
      const audio = await (deps.synthesize || narration)(text, persona);
      if (!audio || !audio.audioBuffer.length || audio.audioBuffer.length > 4_000_000 || !['audio/wav', 'audio/mpeg'].includes(audio.mimeType)) throw new Error('NARRATION_UNAVAILABLE');
      const form = new FormData();
      form.set('model', model);
      form.set('input', JSON.stringify([{ type: sourceType, url: source }]));
      form.set('audio', new Blob([new Uint8Array(audio.audioBuffer)], { type: audio.mimeType }), audio.mimeType === 'audio/wav' ? 'reply.wav' : 'reply.mp3');
      form.set('options', JSON.stringify({ sync_mode: 'loop' }));
      const response = await request(API, { method: 'POST', headers: { 'x-api-key': env.SYNC_API_KEY!, 'Idempotency-Key': key },
        body: form, redirect: 'error', signal: AbortSignal.timeout(45000) });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(result.id)) throw new Error('SYNC_UNAVAILABLE');
      await ref.update({ providerId: result.id, status: 'PENDING' });
      return res.status(202).json({ id: key });
    } catch {
      // Never retry an uncertain submission automatically: it may already be billed.
      if (reserved) await ref.update({ status: 'FAILED' }).catch(() => undefined);
      return res.status(503).json({ error: 'La vidéo n’a pas pu être préparée. Vous pouvez écouter la réponse en audio.' });
    }
  });

  router.get('/:id', async (req: any, res) => {
    try {
      if (!/^[a-f0-9]{64}$/.test(req.params.id)) return res.status(404).json({ error: 'Vidéo introuvable.' });
      const ref = db().collection('tutorVideoJobs').doc(req.params.id);
      const job = (await ref.get()).data();
      if (!job || job.uid !== req.identity.uid) return res.status(404).json({ error: 'Vidéo introuvable.' });
      if (job.status === 'FAILED') return res.json({ status: 'FAILED', error: 'La génération vidéo a échoué. La réponse écrite reste disponible.' });
      if (job.status === 'COMPLETED' && secureVideoUrl(job.outputUrl)) return res.json({ status: 'COMPLETED', videoUrl: job.outputUrl });
      if (Date.now() - job.createdAt > 30 * 60 * 1000) return res.json({ status: 'FAILED', error: 'La génération dépasse le délai prévu. Réessayez plus tard.' });
      if (!job.providerId) return res.json({ status: 'PENDING' });
      if (!env.SYNC_API_KEY) return res.status(503).json({ error: 'Le service vidéo est momentanément indisponible.' });
      const response = await request(`${API}/${encodeURIComponent(job.providerId)}`, { headers: { 'x-api-key': env.SYNC_API_KEY }, redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (!response.ok) return res.status(503).json({ error: 'Le suivi de la vidéo est momentanément indisponible.' });
      const result = await response.json();
      if (result.status === 'COMPLETED') {
        const videoUrl = secureVideoUrl(result.outputUrl);
        if (!videoUrl) throw new Error('INVALID_OUTPUT');
        await ref.update({ status: 'COMPLETED', outputUrl: videoUrl });
        return res.json({ status: 'COMPLETED', videoUrl });
      }
      if (['FAILED', 'REJECTED'].includes(result.status)) {
        await ref.update({ status: 'FAILED' });
        return res.json({ status: 'FAILED', error: 'La vidéo n’a pas pu être générée. Vous pouvez écouter la réponse en audio.' });
      }
      return res.json({ status: 'PENDING' });
    } catch { return res.status(503).json({ error: 'Le suivi de la vidéo est momentanément indisponible.' }); }
  });
  return router;
}
