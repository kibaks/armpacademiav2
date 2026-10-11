import { Router, type Request, type RequestHandler } from 'express';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import crypto from 'node:crypto';
import { emptyResults, omitResults } from '../shared/results';

export function services() {
  const app = getApps().find(a => a.name === 'academia-admin') || initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
    projectId: config.projectId,
  }, 'academia-admin');
  return { auth: getAuth(app), db: getFirestore(app, config.firestoreDatabaseId) };
}
type AuthRequest = Request & { identity?: DecodedIdToken };
export const authenticate: RequestHandler = async (req: AuthRequest, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) { res.status(401).json({ error: 'Connexion Firebase requise.' }); return; }
  try { req.identity = await services().auth.verifyIdToken(token, true); }
  catch { res.status(401).json({ error: 'Session expirée ou invalide.' }); return; }
  try {
    const { auth, db } = services();
    const account = await auth.getUser(req.identity.uid);
    const policy = await db.collection('accountSecurity').doc(req.identity.uid).get();
    if ((account.multiFactor?.enrolledFactors?.length || policy.data()?.mfaRequired === true) && !req.identity.firebase?.sign_in_second_factor) {
      res.status(403).json({ error: 'Reconnectez-vous avec votre second facteur.', code: 'MFA_REQUIRED' }); return;
    }
    next();
  } catch { res.status(503).json({ error: 'Vérification de la sécurité du compte indisponible.' }); }
};
export const requireAdmin: RequestHandler = (req: AuthRequest, res, next) => {
  if (!['super_admin', 'dfat_admin'].includes(req.identity?.role)) {
    res.status(403).json({ error: 'Accès administrateur requis.' }); return;
  }
  next();
};
const superOnly: RequestHandler = (req: AuthRequest, res, next) => {
  if (req.identity?.role !== 'super_admin') { res.status(403).json({ error: 'Accès superadministrateur requis.' }); return; }
  next();
};
const roles = ['cgpmp_member', 'ac_agent', 'pme', 'grande_entreprise', 'societe_civile', 'independant', 'armp_agent', 'dgcmp_agent', 'particulier', 'dfat_admin', 'super_admin', 'formateur'];
const wrap = (fn: (req: AuthRequest, res: any) => Promise<any>): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
const audit = async (req: AuthRequest, action: string, target: string) => {
  await services().db.collection('adminAudit').add({ actor: req.identity!.uid, action, target, date: new Date().toISOString() });
};
export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/users', wrap(async (req, res) => {
  const limit = req.query.limit === undefined ? 500 : Number(req.query.limit);
  const cursor = req.query.cursor;
  if (!Number.isInteger(limit) || limit < 1 || limit > 500 || (cursor !== undefined && (typeof cursor !== 'string' || !cursor.length || cursor.length > 128 || cursor.includes('/')))) return res.status(400).json({ error: 'Limite ou curseur invalide.' });
  const db = services().db;
  let query = db.collection('users').orderBy(FieldPath.documentId());
  if (cursor) query = query.startAfter(cursor);
  const snap = await query.limit(limit + 1).get();
  const page = snap.docs.slice(0, limit);
  const records = page.length ? await db.getAll(...page.map(doc => db.collection('learningRecords').doc(doc.id))) : [];
  const trusted = new Map(records.map(record => [record.id, record.exists ? record.data() : {}]));
  res.json({ users: page.map(doc => ({ ...omitResults(doc.data()), ...emptyResults(), ...trusted.get(doc.id), id: doc.id })), nextCursor: snap.docs.length > limit ? page.at(-1)!.id : null, limited: snap.docs.length > limit });
}));
adminRouter.post('/users', superOnly, wrap(async (req, res) => {
  const b = req.body;
  if (!b || !roles.includes(b.role) || typeof b.name !== 'string' || !b.name.trim() || typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return res.status(400).json({ error: 'Nom, email et rôle valides requis.' });
  const { auth, db } = services();
  const user = await auth.createUser({ email: b.email.trim().toLowerCase(), displayName: b.name.trim().slice(0, 120) });
  const profile = { id: user.uid, email: user.email, name: user.displayName, role: b.role, roleTitle: b.roleTitle || b.role, institution: String(b.institution || 'ARMP-RDC').slice(0,150), phone: String(b.phone || '').slice(0,40), level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [], joinDate: new Date().toISOString() };
  try {
    await auth.setCustomUserClaims(user.uid, { role: b.role });
    await db.collection('users').doc(user.uid).set(profile);
  } catch (error) { await auth.deleteUser(user.uid); throw error; }
  await audit(req, 'user.create', user.uid);
  res.status(201).json({ profile, resetLink: await auth.generatePasswordResetLink(user.email!) });
}));
adminRouter.patch('/users/:id', superOnly, wrap(async (req, res) => {
  const id = String(req.params.id);
  if (id === req.identity!.uid) return res.status(400).json({ error: 'Modification de votre propre accès interdite.' });
  const { auth, db } = services();
  const user = await auth.getUser(id);
  if (user.customClaims?.role === 'super_admin') return res.status(400).json({ error: 'Les comptes superadministrateurs sont protégés.' });
  const patch: Record<string, any> = {};
  if (req.body.role !== undefined) {
    if (!roles.includes(req.body.role)) return res.status(400).json({ error: 'Rôle invalide.' });
    await auth.setCustomUserClaims(id, { ...user.customClaims, role: req.body.role });
    patch.role = req.body.role;
  }
  if (typeof req.body.disabled === 'boolean') {
    await auth.updateUser(id, { disabled: req.body.disabled }); patch.disabled = req.body.disabled;
  }
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Modification vide.' });
  await auth.revokeRefreshTokens(id);
  await db.collection('users').doc(id).update(patch);
  await audit(req, 'user.update', id);
  res.json({ ok: true });
}));
adminRouter.post('/users/:id/reset-password', superOnly, wrap(async (req, res) => {
  const user = await services().auth.getUser(String(req.params.id));
  await audit(req, 'user.reset-password', user.uid);
  res.json({ resetLink: await services().auth.generatePasswordResetLink(user.email!) });
}));
adminRouter.delete('/users/:id', superOnly, wrap(async (req, res) => {
  const id = String(req.params.id);
  const { auth, db } = services();
  const user = await auth.getUser(id);
  if (id === req.identity!.uid || user.customClaims?.role === 'super_admin') return res.status(400).json({ error: 'Compte protégé : suppression interdite.' });
  await auth.deleteUser(id);
  await db.collection('users').doc(id).delete();
  await audit(req, 'user.delete', id);
  res.json({ ok: true });
}));
adminRouter.get('/audit', wrap(async (_req, res) => {
  const snap = await services().db.collection('adminAudit').orderBy('date', 'desc').limit(100).get();
  res.json({ entries: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
}));
adminRouter.get('/health', wrap(async (_req, res) => {
  await services().db.collection('settings').doc('levels').get();
  res.json({ firestore: 'opérationnel', identity: 'Firebase Auth', persistence: 'Firestore', date: new Date().toISOString() });
}));
adminRouter.use((error: any, _req: any, res: any, _next: any) => {
  console.error('[Admin API]', error.code || 'unavailable');
  res.status(error.code === 'auth/email-already-exists' ? 409 : 503).json({ error: error.code === 'auth/email-already-exists' ? 'Cette adresse possède déjà un compte.' : 'Service administratif indisponible. Vérifiez la configuration Firebase du serveur.' });
});

const defaults = { intermediaire: 60, avance: 80, expert: 90, labels: { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert' } };
export const learningRouter = Router();
learningRouter.get('/level-settings', wrap(async (_req, res) => {
  const snap = await services().db.collection('settings').doc('levels').get();
  res.json(snap.exists ? snap.data() : defaults);
}));
learningRouter.post('/level-settings', authenticate, requireAdmin, wrap(async (req, res) => {
  const b = req.body;
  const values = [b.intermediaire, b.avance, b.expert];
  const labels = Object.keys(defaults.labels).map(k => b.labels?.[k]);
  if (!values.every(Number.isInteger) || !(0 <= values[0] && values[0] < values[1] && values[1] < values[2] && values[2] <= 100) || !labels.every(v => typeof v === 'string' && v.trim() && v.length <= 40) || new Set(labels.map(v => v.trim().toLowerCase())).size !== 4) return res.status(400).json({ error: 'Seuils croissants entre 0 et 100 et quatre libellés distincts requis.' });
  const settings = { intermediaire: b.intermediaire, avance: b.avance, expert: b.expert, labels: Object.fromEntries(Object.keys(defaults.labels).map((k,i) => [k,labels[i].trim()])) };
  await services().db.collection('settings').doc('levels').set(settings);
  await audit(req, 'settings.update', 'levels'); res.json({ ok: true, settings });
}));
learningRouter.get('/level-tests', authenticate, wrap(async (req, res) => {
  const db = services().db;
  const ref = db.collection('settings').doc('levelTests');
  const config = await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const existing = snap.data() || {};
    const revision = existing.revision || crypto.randomUUID();
    if (!existing.revision) transaction.set(ref, { revision }, { merge: true });
    return { tests: existing.tests || [], revision };
  });
  // Random revision reveals no answer-key hash. Editing the bank invalidates
  // papers already open in the browser, including answer-only changes.
  const tests = (config.tests || []).map((test: any) => ({ ...test, version: config.revision }));
  const admin = ['super_admin', 'dfat_admin'].includes(req.identity!.role);
  if (admin) {
    const attempts = await db.collection('levelTestAttempts').orderBy('date', 'desc').limit(501).get();
    return res.json({ tests, attempts: attempts.docs.slice(0, 500).map(d => d.data()), attemptsLimited: attempts.docs.length > 500 });
  }
  res.json({ tests: tests.filter((t: any) => t.active).map((t: any) => ({ ...t, questions: t.questions.map(({ answer, ...q }: any) => q) })), attempts: [] });
}));
learningRouter.post('/level-tests', authenticate, requireAdmin, wrap(async (req, res) => {
  const tests = req.body.tests;
  const valid = Array.isArray(tests) && tests.length <= 100 && new Set(tests.map(t => t?.id)).size === tests.length && tests.every(t => t && typeof t.id === 'string' && /^[\w-]{1,128}$/.test(t.id) && typeof t.title === 'string' && t.title.trim() && t.title.length <= 250 && ['Initiation', 'Approfondi', 'Avancé'].includes(t.level) && (t.level !== 'Approfondi' || typeof t.moduleCode === 'string' && t.moduleCode.trim()) && Number.isInteger(t.passPct) && t.passPct >= 1 && t.passPct <= 100 && typeof t.active === 'boolean' && Array.isArray(t.questions) && t.questions.length > 0 && t.questions.length <= 100 && t.questions.every((q: any) => typeof q.question === 'string' && q.question.trim() && q.question.length <= 2000 && Array.isArray(q.options) && q.options.length === 4 && q.options.every((o: any) => typeof o === 'string' && o.trim() && o.length <= 1000) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4));
  if (!valid) return res.status(400).json({ error: 'Tests invalides : vérifiez les questions, réponses et seuils.' });
  // Attempts are immutable here: an administrator editing tests cannot overwrite results.
  const revision = crypto.randomUUID();
  const stored = tests.map(({ version, ...test }: any) => test);
  await services().db.collection('settings').doc('levelTests').set({ tests: stored, revision });
  await audit(req, 'tests.update', 'levelTests');
  res.json({ ok: true, tests: stored.map((test: any) => ({ ...test, version: revision })) });
}));
learningRouter.post('/level-tests/attempt', authenticate, wrap(async (req, res) => {
  const db = services().db;
  const ref = db.collection('settings').doc('levelTests');
  const attemptRef = db.collection('levelTestAttempts').doc();
  const attempt = await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const test = (snap.data()?.tests || []).find((t: any) => t.id === req.body.testId && t.active);
    if (!test) throw new Error('test-unavailable');
    const version = snap.data()?.revision;
    if (!version || typeof req.body.version !== 'string' || req.body.version !== version) throw new Error('test-obsolete');
    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length !== test.questions.length || !answers.every(a => Number.isInteger(a) && a >= 0 && a < 4)) throw new Error('answers-invalid');
    const correct = test.questions.filter((q: any, i: number) => q.answer === answers[i]).length;
    const score = Math.round(correct / test.questions.length * 100);
    const settings = (await transaction.get(db.collection('settings').doc('levels'))).data() || defaults;
    const recordRef = db.collection('learningRecords').doc(req.identity!.uid);
    const previous = (await transaction.get(recordRef)).data() || {};
    const result = { id: attemptRef.id, testId: test.id, testTitle: test.title, level: test.level, moduleCode: test.moduleCode || '', profileId: req.identity!.uid, candidateName: req.identity!.name || req.identity!.email || 'Apprenant', score, passed: score >= test.passPct, correct, version, date: new Date().toISOString() };
    if (result.passed) {
      const key = test.level === 'Initiation' ? 'debutant' : test.level === 'Approfondi' ? 'intermediaire' : 'avance';
      transaction.set(recordRef, { level: settings.labels?.[key] || defaults.labels[key], niveauValidation: test.level, ...(test.moduleCode ? { niveauxModules: { ...previous.niveauxModules, [test.moduleCode]: test.level } } : {}) }, { merge: true });
    }
    transaction.set(attemptRef, result); return result;
  });
  res.json({ ok: true, attempt });
}));
learningRouter.use((error: any, _req: any, res: any, _next: any) => {
  if (error.message === 'test-obsolete') { res.status(409).json({ error: 'Le questionnaire a été modifié. Rechargez les questions avant de recommencer.', code: 'TEST_OBSOLETE' }); return; }
  const bad = ['test-unavailable', 'answers-invalid'].includes(error.message);
  res.status(bad ? 400 : 503).json({ error: bad ? 'Test indisponible ou réponses incomplètes.' : 'Service de formation indisponible.' });
});
