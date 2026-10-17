import initiationCatalog from '../shared/initiationCatalog.json' with { type: 'json' };
import { Router } from 'express';
import { authenticate, services } from './admin.js';
import { validatedStage, INITIATION_ASSESSMENT, gradeInitiation } from '../shared/learnerProgression.js';
import { getLearnerOnboarding } from '../src/utils/learnerOnboarding.js';

export async function readLearningStage(uid: string) {
  const attempts = await services().db.collection('levelTestAttempts').where('profileId', '==', uid).get();
  return validatedStage(attempts.docs.map(d => d.data()));
}
export async function requireInitiationReading(uid: string) {
  if (await readLearningStage(uid) !== 'Initiation') return;
  const db = services().db;
  const [profile, courses] = await Promise.all([db.collection('users').doc(uid).get(), db.collection('courses').get()]);
  const catalog = new Map(initiationCatalog.map(c => [c.id, c as any]));
  courses.docs.forEach(d => catalog.set(d.id, { ...d.data(), id: d.id }));
  const state = getLearnerOnboarding({ ...profile.data(), id: uid } as any, Array.from(catalog.values()) as any);
  if (!state.readyForTest) throw new Error('initiation-incomplete');
}
export const learnerProgressionRouter = Router();
learnerProgressionRouter.use(['/learning-level', '/ai/placement-quiz'], authenticate);
learnerProgressionRouter.get('/learning-level', async (req: any, res) => {
  try { res.set('Cache-Control', 'no-store').json({ stage: await readLearningStage(req.identity.uid) }); }
  catch { res.status(503).json({ error: 'Votre niveau ne peut pas être vérifié. Réessayez.' }); }
});
learnerProgressionRouter.post('/ai/placement-quiz', async (req: any, res) => {
  try {
    await requireInitiationReading(req.identity.uid);
    if (req.body.answers === undefined) return res.json({ questions: INITIATION_ASSESSMENT.map(({ answer, ...q }, id) => ({ ...q, id })) });
    const { correct, score } = gradeInitiation(req.body.answers);
    const db = services().db;
    const settings = (await db.collection('settings').doc('levels').get()).data();
    const threshold = Number.isInteger(settings?.intermediaire) && settings!.intermediaire > 0 ? settings!.intermediaire : 60;
    const passed = score >= threshold;
    await db.collection('levelTestAttempts').add({ profileId: req.identity.uid, testId: 'initiation-core-v1', level: 'Initiation', score, correct, passed, date: new Date().toISOString() });
    const stage = await readLearningStage(req.identity.uid);
    res.json({ score, passed, stage, level: stage === 'Initiation' ? 'Débutant' : stage === 'Approfondi' ? 'Intermédiaire' : 'Avancé', diagnostic: passed ? 'Test réussi : le parcours approfondi est accessible.' : 'Le seuil n’est pas atteint. Reprenez les notions d’initiation, puis réessayez.', strengths: [], weaknesses: [], recommendedModuleIds: [] });
  } catch (error: any) {
    const expected = ['initiation-incomplete', 'answers-invalid'].includes(error.message);
    res.status(expected ? 400 : 503).json({ error: error.message === 'initiation-incomplete' ? 'Terminez tous les chapitres d’initiation avant le test.' : expected ? 'Répondez à toutes les questions.' : 'Évaluation indisponible. Réessayez.' });
  }
});
