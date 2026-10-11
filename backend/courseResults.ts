import { Router } from 'express';
import crypto from 'node:crypto';
import bank from './courseBank.json';
import { authenticate, services } from './admin';
import { HttpError, safeAsync } from './http';
import { aiGuard } from './aiGuard';

export function gradeCourse(quiz: any[], answers: unknown) {
  if (!Array.isArray(quiz) || !quiz.length || !Array.isArray(answers) || answers.length !== quiz.length || !quiz.every((q, i) => Number.isInteger(q.correctIndex) && Array.isArray(q.options) && q.correctIndex >= 0 && q.correctIndex < q.options.length && Number.isInteger(answers[i]) && answers[i] >= 0 && answers[i] < q.options.length)) throw new HttpError(400, 'Quiz indisponible ou réponses incomplètes.');
  return Math.round(quiz.filter((q, i) => q.correctIndex === answers[i]).length / quiz.length * 100);
}
export const courseResultsRouter = Router();
courseResultsRouter.use(authenticate, aiGuard);
courseResultsRouter.post('/:id/attempt', safeAsync(async (req: any, res) => {
  const id = String(req.params.id);
  if (!/^[\w-]{1,128}$/.test(id)) throw new HttpError(400, 'Module invalide.');
  const { db } = services();
  const course = bank.find(c => c.id === id) || (await db.collection('courses').doc(id).get()).data();
  if (!course) throw new HttpError(404, 'Module introuvable.');
  const score = gradeCourse(course.quiz, req.body?.answers);
  const version = crypto.createHash('sha256').update(JSON.stringify(course.quiz)).digest('hex');
  const uid = req.identity.uid;
  const recordRef = db.collection('learningRecords').doc(uid);
  const attemptRef = db.collection('courseAttempts').doc();
  const certificateId = 'CERT-' + crypto.createHash('sha256').update(`${uid}:${id}:${version}`).digest('hex').slice(0, 32);
  await db.runTransaction(async tx => {
    const previous = (await tx.get(recordRef)).data() || {};
    const certificates = [...(previous.certificates || [])];
    const completed = new Set<string>(previous.completedCourseIds || []);
    if (score >= 70) {
      completed.add(id);
      if (!certificates.some(c => c.id === certificateId)) certificates.push({ id: certificateId, courseId: id, courseCode: course.code, courseTitle: course.title, score, issuedAt: new Date().toISOString(), sealNumber: certificateId, quizVersion: version });
    }
    tx.set(recordRef, { ...previous, completedCourseIds: [...completed], completedModulesCount: completed.size, certificationsCount: certificates.length, certificates, quizScoresByCourse: { ...previous.quizScoresByCourse, [id]: score } });
    tx.set(attemptRef, { uid, courseId: id, score, passed: score >= 70, version, date: new Date().toISOString() });
  });
  res.json({ score, passed: score >= 70 });
}));
