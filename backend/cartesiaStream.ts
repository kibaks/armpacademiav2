import type { TimedPhoneme } from '../shared/speechTiming.js';
export async function readCartesiaStream(response: Response, text: string) {
  if (!response.body) throw new Error('Flux vocal vide.');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  const pcm: Buffer[] = [], wordBoundaries: Array<{ text: string; offsetMs: number; durationMs: number; charIndex: number }> = [], phonemeBoundaries: TimedPhoneme[] = [];
  let pending = '', completed = false, bytes = 0, cursor = 0;
  const line = (raw: string) => {
    if (!raw.startsWith('data:')) return;
    const value = raw.slice(5).trim(); if (!value || value === '[DONE]') return;
    const event = JSON.parse(value);
    if (event.type === 'error' || event.status_code >= 400) throw new Error('Le fournisseur vocal a interrompu le flux.');
    if (event.type === 'chunk' && typeof event.data === 'string') { const chunk = Buffer.from(event.data, 'base64'); bytes += chunk.length; if (bytes > 16 * 1024 * 1024) throw new Error('Flux vocal trop volumineux.'); pcm.push(chunk); }
    const words = event.word_timestamps;
    if (Array.isArray(words?.words)) words.words.forEach((word: string, i: number) => {
      const start = Number(words.start?.[i]), end = Number(words.end?.[i]); if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || typeof word !== 'string') return;
      const position = text.toLocaleLowerCase('fr').indexOf(word.toLocaleLowerCase('fr'), cursor);
      const charIndex = position >= 0 ? position : cursor; cursor = Math.min(text.length, charIndex + word.length);
      wordBoundaries.push({ text: word, offsetMs: Math.round(start * 1000), durationMs: Math.round((end - start) * 1000), charIndex });
    });
    const phonemes = event.phoneme_timestamps;
    if (Array.isArray(phonemes?.phonemes)) phonemes.phonemes.forEach((phoneme: string, i: number) => { const start = Number(phonemes.start?.[i]), end = Number(phonemes.end?.[i]); if (typeof phoneme === 'string' && Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start) phonemeBoundaries.push({ phoneme, offsetMs: Math.round(start * 1000), durationMs: Math.round((end - start) * 1000) }); });
    if (event.done === true) completed = true;
  };
  try { while (true) { const { value, done } = await reader.read(); if (done) break; pending += decoder.decode(value, { stream: true }); let index; while ((index = pending.indexOf('\n')) >= 0) { line(pending.slice(0, index).replace(/\r$/, '')); pending = pending.slice(index + 1); } } pending += decoder.decode(); if (pending.trim()) line(pending); }
  catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const buffer = Buffer.concat(pcm);
  if (!completed || buffer.length < 256 || buffer.length % 2) throw new Error('Audio incomplet.');
  const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(buffer.length + 36, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(24000, 24); header.writeUInt32LE(48000, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(buffer.length, 40);
  return { audioBuffer: Buffer.concat([header, buffer]), wordBoundaries: wordBoundaries.sort((a,b) => a.offsetMs - b.offsetMs), phonemeBoundaries: phonemeBoundaries.sort((a,b) => a.offsetMs - b.offsetMs) };
}
