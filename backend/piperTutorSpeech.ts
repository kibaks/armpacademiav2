import { getTutorVoice } from '../shared/tutorVoices.js';

export function piperConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.PIPER_TTS_URL && env.PIPER_TTS_API_KEY);
}
let tail: Promise<unknown> = Promise.resolve();
export async function synthesizePiperTutor(text: string, persona: string, options: {
  env?: NodeJS.ProcessEnv; fetcher?: typeof fetch;
} = {}) {
  const env = options.env || process.env;
  if (!piperConfigured(env)) return null;
  const endpoint = new URL(env.PIPER_TTS_URL!);
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname))) {
    throw new Error('Le service Piper doit utiliser une connexion sécurisée.');
  }
  const cleanText = text.trim();
  if (!cleanText || cleanText.length > 3000) throw new Error('Le passage vocal doit contenir entre 1 et 3000 caractères.');
  const voice = getTutorVoice(persona).gender === 'male' ? 'male' : 'female';
  // This small CPU server processes one narration at a time. Avoid speculative
  // requests competing for its only synthesis slot within a Vercel instance.
  const task = tail.catch(() => undefined).then(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await (options.fetcher || fetch)(endpoint, {
        method: 'POST', redirect: 'error',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.PIPER_TTS_API_KEY}` },
        body: JSON.stringify({ text: cleanText, voice, format: 'mp3' }),
        signal: AbortSignal.timeout(90000),
      });
      if (response.status === 429 && attempt < 2) {
        await response.body?.cancel();
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      if (!response.ok) throw new Error('Le service vocal Piper est momentanément indisponible.');
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const wav = audioBuffer.toString('ascii', 0, 4) === 'RIFF' && audioBuffer.toString('ascii', 8, 12) === 'WAVE';
      const mp3 = audioBuffer.toString('ascii', 0, 3) === 'ID3' || (audioBuffer[0] === 0xff && (audioBuffer[1] & 0xe0) === 0xe0);
      if (audioBuffer.length <= 44 || audioBuffer.length > 4_000_000 || (!wav && !mp3)) {
        throw new Error('Le service Piper a renvoyé un audio invalide.');
      }
      return { audioBuffer, mimeType: wav ? 'audio/wav' : 'audio/mpeg', provider: 'piper' as const, wordBoundaries: [] };
    }
    throw new Error('Le service vocal Piper est occupé.');
  });
  tail = task.then(() => undefined, () => undefined);
  return task;
}
