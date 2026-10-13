import { voiceBudgets, type VoiceBudgets } from './voiceBudgets.js';
import { getTutorVoice, type TutorPersona } from '../shared/tutorVoices.js';

export const GEMINI_TUTOR_VOICES: Record<TutorPersona, string> = {
  henri: 'Orus', vivienne: 'Kore', denise: 'Aoede', charline: 'Zephyr', eloise: 'Leda',
};
export async function synthesizeGeminiTutor(text: string, persona: string, options: {
  apiKey?: string; model?: string; fetcher?: typeof fetch; budgets?: VoiceBudgets;
} = {}) {
  const budgets = options.budgets || voiceBudgets;
  if (!options.apiKey || !budgets.available('gemini')) return null;
  const voice = GEMINI_TUTOR_VOICES[persona as TutorPersona] || GEMINI_TUTOR_VOICES.vivienne;
  const style = getTutorVoice(persona).gender === 'male'
    ? 'Parlez en français, avec une tonalité grave, légèrement rocailleuse, ferme et posée. Diction nette, autorité calme, sans crier.'
    : 'Parlez en français, avec une tonalité basse, chaleureuse, ferme et assurée. Diction nette, autorité calme, sans crier.';
  try {
    const response = await (options.fetcher || fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model || 'gemini-3.8-flash-tts')}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': options.apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text, speechMetadata: { style } }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice } } } }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) { let detail = ''; try { const data = await response.json(); detail = data.error?.status || ''; } catch {} budgets.fail('gemini', response.status, response.headers.get('retry-after'), detail); return null; }
    const data = await response.json();
    budgets.recordGeminiUsage(data.usageMetadata?.totalTokenCount);
    const audio = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.data)?.inlineData;
    if (!audio?.data || typeof audio.data !== 'string') return null;
    const buffer = Buffer.from(audio.data, 'base64');
    if (buffer.length < 256) return null;
    // Gemini 3.8 returns a WAV by default. Wrap raw PCM from an explicitly configured legacy model.
    if (buffer.subarray(0, 4).toString() === 'RIFF') return { audioBuffer: buffer, mimeType: 'audio/wav', provider: 'gemini-tts' as const };
    const rate = Number(/rate=(\d+)/.exec(audio.mimeType || '')?.[1] || 24000);
    if (!/audio\/(?:L16|pcm)/i.test(audio.mimeType || '') || rate < 8000 || rate > 96000) return null;
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(buffer.length + 36, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(buffer.length, 40);
    return { audioBuffer: Buffer.concat([header, buffer]), mimeType: 'audio/wav', provider: 'gemini-tts' as const };
  } catch { budgets.fail('gemini', 503); return null; }
}
