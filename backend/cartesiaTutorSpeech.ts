import { voiceBudgets, type VoiceBudgets } from './voiceBudgets.js';
import type { TutorPersona } from '../shared/tutorVoices.js';
export const CARTESIA_TUTOR_VOICES: Record<TutorPersona, string> = {
  henri: '68db3d29-e0ab-4d4f-a5d5-e34ee47d38b7', // Joris: grave, ferme, français.
  vivienne: 'dd951538-c475-4bde-a3f7-9fd7b3e4d8f5', // Vanessa: instructions assurées.
  denise: '7c58f4a4-a72c-42fa-a503-41b9408820f3', // Inès: narration articulée.
  charline: '8832a0b5-47b2-4751-bb22-6a8e2149303d', // Narratrice française.
  eloise: '6c64b57a-bc65-48e4-bff4-12dbe85606cd', // Eloise: chaleureuse, posée.
};
export async function synthesizeCartesiaTutor(text: string, persona: string, options: {
  env?: Record<string, string | undefined>; fetcher?: typeof fetch; budgets?: VoiceBudgets;
} = {}) {
  const env = options.env || process.env, budgets = options.budgets || voiceBudgets;
  if (!env.CARTESIA_API_KEY || !budgets.available('cartesia') || !text.trim()) return null;
  const selected = Object.hasOwn(CARTESIA_TUTOR_VOICES, persona) ? persona as TutorPersona : 'vivienne';
  const voice = env[`CARTESIA_VOICE_${selected.toUpperCase()}`] || CARTESIA_TUTOR_VOICES[selected];
  try {
    const response = await (options.fetcher || fetch)('https://api.cartesia.ai/tts/bytes', {
      method: 'POST', headers: { Authorization: `Bearer ${env.CARTESIA_API_KEY}`, 'Cartesia-Version': '2026-08-14', 'content-type': 'application/json' },
      body: JSON.stringify({ model_id: env.CARTESIA_TTS_MODEL || 'sonic-3.6', transcript: text, voice, language: 'fr', output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 24000 }, generation_config: { speed: 0.94 } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) { budgets.fail('cartesia', response.status, response.headers.get('retry-after')); return null; }
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (audioBuffer.length < 256 || audioBuffer.subarray(0, 4).toString() !== 'RIFF' || audioBuffer.subarray(8, 12).toString() !== 'WAVE') return null;
    return { audioBuffer, mimeType: 'audio/wav', provider: 'cartesia-sonic' as const };
  } catch { budgets.fail('cartesia', 503); return null; }
}
