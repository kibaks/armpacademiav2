import { services } from './services.js';
import { normalizeSpeechPronunciation, parsePronunciationEntries, type PronunciationEntry } from '../shared/speechPronunciation.js';
let cache: { entries: PronunciationEntry[]; expires: number } = { entries: [], expires: 0 };
let pending: Promise<PronunciationEntry[]> | null = null;
let revision = 0;
export async function readSpeechPronunciation(strict = false, store?: any): Promise<PronunciationEntry[]> {
  if (!store && !strict && Date.now() < cache.expires) return cache.entries;
  if (!store && !strict && pending) return pending;
  const current = revision;
  const load = async () => {
    try {
      const snap = await (store || services().db).collection('settings').doc('speechPronunciation').get();
      const entries = parsePronunciationEntries(snap.data()?.entries || []);
      if (!store && revision === current) cache = { entries, expires: Date.now() + 30000 };
      return entries;
    } catch (error) { if (strict) throw error; if (!store && revision === current) cache = { ...cache, expires: Date.now() + 10000 }; return cache.entries; }
  };
  if (store || strict) return load();
  pending = load().finally(() => { pending = null; });
  return pending;
}
export async function saveSpeechPronunciation(input: unknown, actor: string) {
  const entries = parsePronunciationEntries(input);
  const db = services().db, batch = db.batch(), date = new Date().toISOString();
  batch.set(db.collection('settings').doc('speechPronunciation'), { entries, updatedAt: date, updatedBy: actor });
  batch.set(db.collection('adminAudit').doc(), { actor, action: 'speech.pronunciation.updated', target: 'speechPronunciation', date });
  await batch.commit(); revision++;
  cache = { entries, expires: Date.now() + 30000 };
  return entries;
}
export async function prepareTutorSpeech(text: string, alreadyApplied = false) {
  if (alreadyApplied) return text;
  return normalizeSpeechPronunciation(text, await readSpeechPronunciation());
}
