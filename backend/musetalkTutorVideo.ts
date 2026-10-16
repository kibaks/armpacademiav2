import { createHash } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';
import { normalizeVideoText } from './syncTutorVideo.js';
import { synthesizePiperTutor } from './piperTutorSpeech.js';
import { synthesizeCartesiaTutor } from './cartesiaTutorSpeech.js';
import { synthesizeElevenTutor } from './elevenTutorSpeech.js';

type Deps = { env?: NodeJS.ProcessEnv; db?: () => any; authenticate?: RequestHandler; fetcher?: typeof fetch;
  synthesize?: (text: string, persona: string) => Promise<{ audioBuffer: Buffer; mimeType: string } | null> };
const personas = ['denise', 'vivienne', 'charline', 'eloise'];
export function createMuseTalkTutorVideoRouter(deps: Deps = {}) {
  const router = Router(), env = deps.env || process.env, request = deps.fetcher || fetch;
  const db = () => deps.db?.() || services().db;
  let endpoint: URL | null = null;
  try { const url = new URL(env.MUSETALK_API_URL || ''); if (url.protocol === 'https:' && !url.username && !url.password) endpoint = url; } catch { /* not configured */ }
  const configured = () => env.TUTOR_VIDEO_ENABLED === 'true' && !!endpoint && !!env.MUSETALK_API_KEY;
  const remote = (suffix: string, init: RequestInit = {}) => request(`${endpoint!.href.replace(/\/$/, '')}${suffix}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${env.MUSETALK_API_KEY}` }, redirect: 'error', signal: AbortSignal.timeout(45000) });
  router.use(deps.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/config', (_req, res) => res.json({ enabled: configured(), provider: 'musetalk', personas, maxTextLength: 1800 }));
  router.post('/', async (req: any, res) => {
    let ref: any, reserved = false;
    try {
      if (!configured()) return res.status(503).json({ error: 'La vidéo MuseTalk n’est pas encore activée.' });
      const { text: raw, persona } = req.body || {};
      if (typeof raw !== 'string' || raw.length > 6000 || !personas.includes(persona)) return res.status(400).json({ error: 'Réponse ou tutrice invalide.' });
      const text = normalizeVideoText(raw);
      if (!text || text.length > 1800) return res.status(400).json({ error: 'Demandez une réponse plus courte pour la vidéo.' });
      const uid = req.identity.uid;
      const id = createHash('sha256').update(JSON.stringify([uid, text, persona, 'musetalk-v15-source-natural-v2'])).digest('hex');
      ref = db().collection('musetalkTutorJobs').doc(id);
      const day = new Date().toISOString().slice(0, 10);
      const quota = db().collection('musetalkTutorQuotas').doc(createHash('sha256').update(`${uid}:${day}`).digest('hex'));
      const rawLimit = Number(env.MUSETALK_VIDEO_DAILY_LIMIT || 6);
      const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? rawLimit : 6;
      const reservation = await db().runTransaction(async (tx: any) => {
        if ((await tx.get(ref)).exists) return 'existing';
        const usage = (await tx.get(quota)).data();
        if ((usage?.count || 0) >= limit) return 'limit';
        tx.set(quota, { uid, day, count: (usage?.count || 0) + 1 });
        tx.set(ref, { uid, status: 'SUBMITTING', createdAt: Date.now() }); return 'new';
      });
      if (reservation === 'limit') return res.status(429).json({ error: 'Votre limite quotidienne de vidéos est atteinte. L’audio reste disponible.' });
      if (reservation === 'existing') return res.status(202).json({ id });
      reserved = true;
      const audio = await (deps.synthesize ? deps.synthesize(text, persona) : synthesizePiperTutor(text, persona).then(async value => value || await synthesizeCartesiaTutor(text, persona) || await synthesizeElevenTutor(text, persona)));
      if (!audio || audio.audioBuffer.length > 4_000_000 || audio.audioBuffer.length <= 44) throw new Error('NO_AUDIO');
      const submitted = await remote('/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, audio: audio.audioBuffer.toString('base64') }) });
      if (!submitted.ok || (await submitted.json()).id !== id) throw new Error('SUBMISSION_FAILED');
      await ref.update({ status: 'PENDING' });
      return res.status(202).json({ id });
    } catch {
      // Keep the reservation after an uncertain submission, avoiding duplicate GPU work.
      if (reserved) await ref.update({ status: 'FAILED' }).catch(() => undefined);
      return res.status(503).json({ error: 'La vidéo n’a pas pu être préparée. Vous pouvez écouter la réponse en audio.' });
    }
  });
  const owned = async (req: any) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id)) return null;
    const ref = db().collection('musetalkTutorJobs').doc(req.params.id), job = (await ref.get()).data();
    return job?.uid === req.identity.uid && Date.now() - job.createdAt < 86400000 ? { ref, job } : null;
  };
  router.get('/:id', async (req: any, res) => {
    try {
      const entry = await owned(req); if (!entry) return res.sendStatus(404);
      if (entry.job.status === 'FAILED') return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' });
      const response = await remote(`/jobs/${req.params.id}`);
      if (!response.ok) return res.sendStatus(503);
      const result = await response.json();
      if (result.status === 'COMPLETED') {
        await entry.ref.update({ status: 'COMPLETED' });
        return res.json({ status: 'COMPLETED', videoUrl: `/api/ai/tutor-video/${req.params.id}/media` });
      }
      if (result.status === 'FAILED') { await entry.ref.update({ status: 'FAILED' }); return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' }); }
      return res.json({ status: 'PENDING' });
    } catch { return res.status(503).json({ error: 'Le serveur vidéo est momentanément indisponible.' }); }
  });
  router.get('/:id/media', async (req: any, res) => {
    try {
      const entry = await owned(req); if (!entry || entry.job.status !== 'COMPLETED') return res.sendStatus(404);
      const response = await remote(`/jobs/${req.params.id}/media`);
      if (!response.ok || !response.body) return res.sendStatus(503);
      res.type('video/mp4');
      const reader = response.body.getReader();
      try { while (true) { const { value, done } = await reader.read(); if (done || res.destroyed) break; if (!res.write(value)) await new Promise<void>(resolve => { const finish = () => { res.off('drain', finish); res.off('close', finish); resolve(); }; res.once('drain', finish); res.once('close', finish); }); } }
      finally { await reader.cancel().catch(() => undefined); }
      return res.end();
    } catch { if (res.headersSent) return res.destroy(); return res.sendStatus(503); }
  });
  return router;
}
