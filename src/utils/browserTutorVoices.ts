import { getTutorVoice } from '../../shared/tutorVoices';
export function pickBrowserTutorVoice<T extends { name: string; lang: string }>(voices: T[], persona: string): T | null {
  const male = getTutorVoice(persona).gender === 'male';
  const names = male ? ['henri', 'remy', 'thomas', 'daniel', 'paul', 'jacques', 'fabrice', 'alain']
    : ['denise', 'vivienne', 'audrey', 'amelie', 'aurelie', 'marie', 'celine', 'hortense', 'julie', 'brigitte', 'celeste', 'ariane'];
  const french = voices.filter(v => /^fr(?:[-_]|$)/i.test(v.lang));
  for (const name of names) {
    const match = french.find(v => v.name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes(name));
    if (match) return match;
  }
  return null;
}
export function browserTutorProsody(persona: string, speed = 1) {
  return { pitch: getTutorVoice(persona).gender === 'male' ? 0.78 : 0.9, rate: Math.max(0.7, Math.min(1.15, speed * 0.94)) };
}
