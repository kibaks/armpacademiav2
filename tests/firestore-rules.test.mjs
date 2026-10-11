import { readFile } from 'node:fs/promises';
import { after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-armp-security', firestore: { host: '127.0.0.1', port: 8085, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
after(() => env.cleanup());
const learner = env.authenticatedContext('learner', { email: 'learner@example.com' }).firestore();
const trainer = env.authenticatedContext('trainer', { role: 'formateur' }).firestore();
const initial = { id: 'learner', name: 'Apprenant', email: 'learner@example.com', role: 'particulier', level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, certificates: [], completedCourseIds: [], quizScoresByCourse: {} };
test('learner registration cannot grant roles, scores or certificates', async () => {
  for (const forged of [{ role: 'super_admin' }, { level: 'Expert' }, { certificationsCount: 8 }, { certificates: [{ id: 'forged' }] }, { niveauValidation: 'Avancé' }]) await assertFails(setDoc(doc(learner, 'users/learner'), { ...initial, ...forged }));
  await assertSucceeds(setDoc(doc(learner, 'users/learner'), initial));
  await assertSucceeds(updateDoc(doc(learner, 'users/learner'), { bio: 'Nouvelle présentation' }));
  for (const forged of [{ level: 'Expert' }, { completedCourseIds: ['MOD-001'] }, { quizScoresByCourse: { 'MOD-001': 100 } }, { role: 'formateur' }]) await assertFails(updateDoc(doc(learner, 'users/learner'), forged));
});
test('learning records are readable by their owner and writable by the server only', async () => {
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'learningRecords/learner'), { level: 'Débutant' }));
  await assertSucceeds(getDoc(doc(learner, 'learningRecords/learner')));
  await assertFails(getDoc(doc(trainer, 'learningRecords/learner')));
  await assertFails(setDoc(doc(learner, 'learningRecords/learner'), { level: 'Expert' }));
});
test('trainers cannot edit another trainer’s studio videos or answer unrelated course questions', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'courses/owned'), { authorId: 'trainer' });
    await setDoc(doc(db, 'courses/other'), { authorId: 'someone-else' });
    await setDoc(doc(db, 'courseQA/owned'), { id: 'owned', authorId: 'learner', author: 'Apprenant', courseId: 'owned', question: 'Question' });
    await setDoc(doc(db, 'courseQA/other'), { id: 'other', authorId: 'learner', author: 'Apprenant', courseId: 'other', question: 'Question' });
    await setDoc(doc(db, 'studioVideos/other'), { id: 'other', authorId: 'someone-else', title: 'Vidéo', blobUrl: 'https://example.com/video.mp4' });
  });
  await assertSucceeds(updateDoc(doc(trainer, 'courseQA/owned'), { answer: 'Réponse' }));
  await assertFails(updateDoc(doc(trainer, 'courseQA/other'), { answer: 'Réponse' }));
  await assertFails(updateDoc(doc(trainer, 'studioVideos/other'), { title: 'Modifié' }));
  await assertFails(deleteDoc(doc(trainer, 'studioVideos/other')));
});

test('native MFA policy blocks old tokens and cannot be altered by the account owner', async () => {
  const passwordOnly = env.authenticatedContext('secured', { email: 'secured@example.com' }).firestore();
  const secondFactor = env.authenticatedContext('secured', { email: 'secured@example.com', firebase: { sign_in_second_factor: 'totp' } }).firestore();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/secured'), { ...initial, id: 'secured', email: 'secured@example.com' });
    await setDoc(doc(context.firestore(), 'accountSecurity/secured'), { mfaRequired: true });
  });
  await assertFails(getDoc(doc(passwordOnly, 'users/secured')));
  await assertSucceeds(getDoc(doc(secondFactor, 'users/secured')));
  await assertFails(setDoc(doc(secondFactor, 'accountSecurity/secured'), { mfaRequired: false }));
  await assertFails(setDoc(doc(secondFactor, 'privateFiles/forged'), { uploadedBy: 'secured', visibility: 'public' }));
});
