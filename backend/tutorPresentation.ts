import { services } from './services.js';
import { DEFAULT_TUTOR_PRESENTATION, normalizeTutorPresentation, type TutorPresentation } from '../shared/tutorPresentation.js';
let cache = { value: DEFAULT_TUTOR_PRESENTATION, expires: 0 };
let revision = 0;
let pending: Promise<TutorPresentation> | null = null;
export async function readTutorPresentation(strict = false): Promise<TutorPresentation> {
  if (!strict && Date.now() < cache.expires) return cache.value;
  if (!strict && pending) return pending;
  const startedAtRevision = revision;
  pending = (async () => {
    try { const snap = await services().db.collection('settings').doc('tutorPresentation').get(); if (revision === startedAtRevision) cache = { value: normalizeTutorPresentation(snap.data()), expires: Date.now() + 60000 }; }
    catch (error) { if (strict) throw error; cache = { value: cache.value, expires: Date.now() + 10000 }; }
    return cache.value;
  })().finally(() => { pending = null; });
  return pending;
}
export async function saveTutorPresentation(input: unknown, actor: string) {
  const value = normalizeTutorPresentation(input);
  const db = services().db, batch = db.batch(), date = new Date().toISOString();
  batch.set(db.collection('settings').doc('tutorPresentation'), { ...value, updatedAt: date, updatedBy: actor });
  batch.set(db.collection('adminAudit').doc(), { actor, action: 'tutor.presentation.updated', target: 'tutorPresentation', date });
  await batch.commit();
  revision++;
  cache = { value, expires: Date.now() + 60000 };
  return value;
}
