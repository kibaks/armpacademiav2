import { Router, type RequestHandler } from 'express';
export class TutorVoiceError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
const MIME_ALIASES: Record<string, string> = { 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4', 'audio/mp3': 'audio/mpeg', 'audio/x-wav': 'audio/wav', 'audio/opus': 'audio/ogg' };
const ALLOWED = new Set(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/flac']);
export function parseTutorRecording(value: unknown, mime: unknown) {
  if (typeof value !== 'string' || !value || value.length > 8000200) throw new TutorVoiceError('Le vocal est vide ou dépasse 6 Mo.', 413);
  if (typeof mime !== 'string') throw new TutorVoiceError('Format audio manquant.', 415);
  let mimeType = mime.split(';')[0].trim().toLowerCase(); mimeType = MIME_ALIASES[mimeType] || mimeType;
  if (!ALLOWED.has(mimeType)) throw new TutorVoiceError('Choisissez un vocal WebM, MP4, OGG, WAV, MP3, AAC ou FLAC.', 415);
  let audio = value;
  if (audio.startsWith('data:')) {
    const comma = audio.indexOf(',');
    if (comma < 0 || !/;base64$/i.test(audio.slice(0, comma))) throw new TutorVoiceError('Enregistrement audio invalide.', 400);
    audio = audio.slice(comma + 1);
  }
  if (audio.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) throw new TutorVoiceError('Enregistrement audio invalide.', 400);
  const size = Buffer.byteLength(audio, 'base64');
  if (size <= 44 || size > 6000000) throw new TutorVoiceError('Le vocal est vide ou dépasse 6 Mo.', 413);
  return { audio, mimeType };
}
export async function transcribeTutorRecording(audio: unknown, mime: unknown, options: { owner?: string; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}) {
  const recording = parseTutorRecording(audio, mime);
  if (!options.owner || options.owner.length > 128) throw new TutorVoiceError('Connexion requise.', 401);
  const env = options.env || process.env;
  let endpoint: URL;
  try {
    endpoint = new URL(env.STT_API_URL || '');
    if ((endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname))) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !env.STT_API_KEY) throw new Error();
  } catch { throw new TutorVoiceError('La transcription vocale n’est pas disponible pour le moment. Réessayez dans un instant.'); }
  try {
    const response = await (options.fetcher || fetch)(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(40000), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.STT_API_KEY}` }, body: JSON.stringify({ ...recording, owner: options.owner }) });
    if (response.status === 429) throw new TutorVoiceError('La tutrice traite déjà un vocal. Réessayez dans quelques secondes.', 429);
    if ([400, 413, 415, 422].includes(response.status)) throw new TutorVoiceError('Le vocal n’a pas pu être compris. Vérifiez le son ou enregistrez à nouveau (90 secondes maximum).', 422);
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (typeof data.text !== 'string' || !data.text.trim() || data.text.length > 4000) throw new TutorVoiceError('Aucune parole intelligible détectée. Enregistrez à nouveau votre question.', 422);
    if (typeof data.recordingId !== 'string' || !/^[a-f0-9]{64}$/.test(data.recordingId)) throw new Error();
    return { text: data.text.trim(), recordingId: data.recordingId };
  } catch (error) {
    if (error instanceof TutorVoiceError) throw error;
    throw new TutorVoiceError('La transcription prend trop de temps ou est indisponible. Votre vocal peut être réessayé.');
  }
}
export function createTutorVoiceInput(transcribe = transcribeTutorRecording): RequestHandler {
  return async (req, res, next) => {
    const body = req.body;
    if (body?.mediaType !== 'audio' && !body?.audioBase64) return next();
    if (!body?.audioBase64) {
      if (typeof body?.message === 'string' && body.message.trim()) return next();
      return void res.status(422).json({ error: 'Joignez ou enregistrez votre question vocale.' });
    }
    try {
      const { text, recordingId } = await transcribe(body.audioBase64, body.audioMimeType, { owner: (req as any).identity?.uid });
      body.message = text;
      // Do not forward raw recordings to dialogue providers or duplicate them in history.
      delete body.audioBase64;
      body.hasMedia = false;
      if (Array.isArray(body.history)) body.history = body.history.slice(-8).map((m: any, i: number, list: any[]) => ({ sender: m?.sender, text: i === list.length - 1 && m?.sender === 'user' ? text : String(m?.text || '').slice(0, 6000) }));
      const send = res.json.bind(res);
      res.json = (payload: any) => send(payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...payload, transcribedText: text, voiceRecordingUrl: `/api/ai/tutor-voice/${recordingId}` } : payload);
      next();
    } catch (error) {
      const failure = error instanceof TutorVoiceError ? error : new TutorVoiceError('Votre vocal n’a pas pu être traité. Réessayez.');
      res.status(failure.status).json({ error: failure.message });
    }
  };
}

export function createTutorVoiceMediaRouter(options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}) {
  const router = Router();
  router.get('/:id', async (req: any, res) => {
    if (!req.identity?.uid) return void res.sendStatus(401);
    if (!/^[a-f0-9]{64}$/.test(req.params.id)) return void res.sendStatus(404);
    try {
      const env = options.env || process.env;
      const endpoint = new URL(env.STT_API_URL || '');
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || !env.STT_API_KEY) throw new Error();
      endpoint.pathname = endpoint.pathname.replace(/\/transcribe\/?$/, '') + '/recordings/' + req.params.id;
      endpoint.search = new URLSearchParams({ owner: req.identity.uid }).toString();
      const upstream = await (options.fetcher || fetch)(endpoint, { headers: { Authorization: `Bearer ${env.STT_API_KEY}`, ...(typeof req.headers.range === 'string' ? { Range: req.headers.range } : {}) }, redirect: 'error', signal: AbortSignal.timeout(30000) });
      if ([404, 416].includes(upstream.status)) return void res.sendStatus(upstream.status);
      if (!upstream.ok || !upstream.body || !upstream.headers.get('content-type')?.startsWith('audio/')) throw new Error();
      res.status(upstream.status === 206 ? 206 : 200).set('Cache-Control', 'private, no-store');
      for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges']) { const value = upstream.headers.get(header); if (value) res.set(header, value); }
      const reader = upstream.body.getReader();
      try {
        while (!res.destroyed) { const { value, done } = await reader.read(); if (done) break; if (!res.write(value)) await new Promise<void>(resolve => { const finish = () => { res.off('drain', finish); res.off('close', finish); resolve(); }; res.once('drain', finish); res.once('close', finish); }); }
      } finally { await reader.cancel().catch(() => undefined); }
      res.end();
    } catch { if (res.headersSent) res.destroy(); else res.status(503).json({ error: 'Le vocal est momentanément indisponible.' }); }
  });
  return router;
}
