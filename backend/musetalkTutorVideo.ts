import { createHash, createHmac } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';
import { normalizeVideoText } from './syncTutorVideo.js';
import { synthesizePiperTutor } from './piperTutorSpeech.js';
import { synthesizeCartesiaTutor } from './cartesiaTutorSpeech.js';
import { synthesizeElevenTutor } from './elevenTutorSpeech.js';

type Deps = { env?: NodeJS.ProcessEnv; db?: () => any; authenticate?: RequestHandler; fetcher?: typeof fetch;
  synthesize?: (text: string, persona: string) => Promise<{ audioBuffer: Buffer; mimeType: string } | null> };
const personas = ['vivienne'];
export function createMuseTalkTutorVideoRouter(deps: Deps = {}) {
  const router = Router(), env = deps.env || process.env, request = deps.fetcher || fetch;
  const db = () => deps.db?.() || services().db;
  let endpoint: URL | null = null;
  try { const url = new URL(env.MUSETALK_API_URL || ''); if (url.protocol === 'https:' && !url.username && !url.password) endpoint = url; } catch { /* not configured */ }
  const configured = () => env.TUTOR_VIDEO_ENABLED === 'true' && !!endpoint && !!env.MUSETALK_API_KEY;
  const playbackUrl = (id: string) => {
    const expires = Math.floor(Date.now() / 1000) + 15 * 60;
    const token = createHmac('sha256', env.MUSETALK_API_KEY!).update(`${id}:${expires}`).digest('hex');
    return `${endpoint!.href.replace(/\/$/, '')}/jobs/${id}/play?expires=${expires}&token=${token}`;
  };
  const remote = (suffix: string, init: RequestInit = {}) => request(`${endpoint!.href.replace(/\/$/, '')}${suffix}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${env.MUSETALK_API_KEY}` }, redirect: 'error', signal: AbortSignal.timeout(45000) });
  router.use(deps.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/config', (_req, res) => res.json({ enabled: configured(), provider: 'musetalk', personas, maxTextLength: 3000, dailyLimit: null, maxDurationSeconds: null }));
  router.post('/', async (req: any, res) => {
    let ref: any, reserved = false;
    try {
      if (!configured()) return res.status(503).json({ error: 'La vidéo MuseTalk n’est pas encore activée.' });
      const { text: raw, persona } = req.body || {};
      if (typeof raw !== 'string' || raw.length > 6000 || !personas.includes(persona)) return res.status(400).json({ error: 'Réponse ou tutrice invalide.' });
      const text = normalizeVideoText(raw);
      if (!text || text.length > 3000) return res.status(400).json({ error: 'Le passage vocal doit contenir entre 1 et 3 000 caractères. Vous pouvez poursuivre dans une nouvelle réponse.' });
      const uid = req.identity.uid;
      const id = createHash('sha256').update(JSON.stringify([uid, text, persona, 'musetalk-v15-realtime-fragments-v5'])).digest('hex');
      ref = db().collection('musetalkTutorJobs').doc(id);
      // Self-hosted use has no daily quota. The transaction only deduplicates jobs.
      const reservation = await db().runTransaction(async (tx: any) => {
        const existing = await tx.get(ref);
        if (existing.exists) {
          const job = existing.data();
          return job?.status === 'COMPLETED' && Date.now() - job.createdAt < 86400000 ? 'completed' : 'existing';
        }
        tx.set(ref, { uid, status: 'SUBMITTING', createdAt: Date.now() }); return 'new';
      });
      if (reservation === 'completed') return res.json({ id, status: 'COMPLETED', videoUrl: playbackUrl(id) });
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
      // Completed jobs are immutable: issue a fresh playback ticket without another worker round trip.
      if (entry.job.status === 'COMPLETED') return res.json({ status: 'COMPLETED', videoUrl: playbackUrl(req.params.id) });
      const response = await remote(`/jobs/${req.params.id}`);
      if (response.status === 404 && entry.job.status === 'FAILED') return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' });
      if (!response.ok) return res.sendStatus(503);
      const result = await response.json();
      // A growing MP4 has no stable length/range contract. Native players may
      // treat its current end as the end of the answer. Publish only final files.
      if (result.status === 'STREAMING') return res.json({ status: 'PENDING' });
      if (result.status === 'COMPLETED') {
        await entry.ref.update({ status: 'COMPLETED' });
        // A short-lived read-only ticket enables native streaming and byte ranges.
        // The worker key stays private; the browser does not buffer an entire MP4.
        return res.json({ status: 'COMPLETED', videoUrl: playbackUrl(req.params.id) });
      }
      if (result.status === 'FAILED') { await entry.ref.update({ status: 'FAILED' }); return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' }); }
      return res.json({ status: 'PENDING' });
    } catch { return res.status(503).json({ error: 'Le serveur vidéo est momentanément indisponible.' }); }
  });
  router.get('/:id/media', async (req: any, res) => {
    try {
      const entry = await owned(req); if (!entry || entry.job.status !== 'COMPLETED') return res.sendStatus(404);
      const range = req.headers.range;
      const response = await remote(`/jobs/${req.params.id}/media`, { headers: typeof range === 'string' ? { range } : {} });
      if (response.status === 416) {
        const contentRange = response.headers.get('content-range');
        if (contentRange) res.set('Content-Range', contentRange);
        return res.sendStatus(416);
      }
      if (!response.ok || !response.body) return res.sendStatus(503);
      res.status(response.status === 206 ? 206 : 200).type('video/mp4');
      // Preserve byte-range metadata so playback can start and seek without fetching the full file.
      for (const header of ['accept-ranges', 'content-range', 'content-length']) {
        const value = response.headers.get(header);
        if (value) res.set(header, value);
      }
      res.flushHeaders();
      const reader = response.body.getReader();
      try { while (true) { const { value, done } = await reader.read(); if (done || res.destroyed) break; if (!res.write(value)) await new Promise<void>(resolve => { const finish = () => { res.off('drain', finish); res.off('close', finish); resolve(); }; res.once('drain', finish); res.once('close', finish); }); } }
      finally { await reader.cancel().catch(() => undefined); }
      return res.end();
    } catch { if (res.headersSent) return res.destroy(); return res.sendStatus(503); }
  });
  return router;
}
