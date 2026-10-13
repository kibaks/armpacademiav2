export interface TimedPhoneme { phoneme: string; offsetMs: number; durationMs: number }
export type SpeechViseme = 'closed' | 'narrow' | 'medium' | 'open' | 'wide' | 'round';
export function samplePhoneme(timeline: TimedPhoneme[], timeMs: number): { viseme: SpeechViseme; openness: number; pause: boolean } | null {
  if (!timeline.length) return null;
  let lo = 0, hi = timeline.length - 1, found = -1;
  while (lo <= hi) { const mid = (lo + hi) >>> 1; if (timeline[mid].offsetMs <= timeMs) { found = mid; lo = mid + 1; } else hi = mid - 1; }
  const item = found >= 0 ? timeline[found] : undefined;
  if (!item || timeMs >= item.offsetMs + item.durationMs) return { viseme: 'closed', openness: 0, pause: true };
  const p = item.phoneme.replace(/[ˈˌː]/g, '').normalize('NFC');
  if (/^[mbp]$/.test(p)) return { viseme: 'closed', openness: 0, pause: false };
  if (/[uoyøœɔ]/.test(p)) return { viseme: 'round', openness: 0.48, pause: false };
  if (/[iɪeɛ]/.test(p)) return { viseme: 'wide', openness: 0.38, pause: false };
  if (/[aɑ]/.test(p)) return { viseme: 'open', openness: 0.8, pause: false };
  if (/[fvsztdnlʃʒ]/.test(p)) return { viseme: 'narrow', openness: 0.2, pause: false };
  return { viseme: 'medium', openness: 0.32, pause: false };
}
