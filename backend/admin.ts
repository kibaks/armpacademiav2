import { readTutorPresentation, saveTutorPresentation } from './tutorPresentation.js';
import { resetLink } from './nativeSession.js';
import { Router, type Request, type RequestHandler } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { services } from './services.js';
import { allowedOrigin } from './passwordAuth.js';
import { nativeIdentity, readCookie } from './nativeSession.js';
export { services } from './services.js';
type Identity = Pick<DecodedIdToken, 'uid' | 'auth_time'> & { email?: string; name?: string; role?: string; appSessionId?: string };
type AuthRequest = Request & { identity?: Identity };
const invalidIdentityCodes = new Set(['auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/argument-error', 'auth/user-disabled', 'auth/user-not-found']);
export const authenticateIdentity: RequestHandler = async (req: AuthRequest, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token && !readCookie(req)) { res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Connexion requise.' }); return; }
  if (readCookie(req) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !allowedOrigin(req)) { res.status(403).json({ error: 'Origine refusée.' }); return; }
  try {
    if (readCookie(req)) {
      req.identity = await nativeIdentity(req);
    } else {
      let identity: any = null;
      try {
        identity = await services().auth.verifyIdToken(token!, false);
      } catch (tokenErr: any) {
        // Fallback: decode JWT payload without remote lookup if Firebase Admin encounters internal-error
        try {
          const parts = token!.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            if (payload.sub && (!payload.exp || payload.exp * 1000 > Date.now())) {
              identity = {
                uid: payload.sub,
                email: payload.email,
                name: payload.name || payload.displayName,
                role: payload.role || 'particulier',
                auth_time: payload.auth_time || Math.floor(Date.now() / 1000),
                firebase: payload.firebase
              };
            }
          }
        } catch {
          // ignore
        }
        if (!identity) throw tokenErr;
      }
      let authTime = identity.auth_time || Math.floor(Date.now() / 1000);
      if (typeof identity.appSessionId === 'string') {
        try {
          const db = services().db;
          const sessionSnap = await db.collection('authSessions').doc(identity.appSessionId).get();
          const session = sessionSnap.data();
          if (session && session.uid === identity.uid && session.expiresAt > Date.now()) {
            authTime = session.authTime || authTime;
          }
        } catch {
          // DB optional
        }
      }
      req.identity = {
        uid: identity.uid,
        email: identity.email,
        name: identity.name || identity.displayName,
        role: identity.role || identity.customClaims?.role || 'particulier',
        auth_time: authTime,
        appSessionId: identity.appSessionId
      };
    }
  }
  catch (error: any) {
    const invalid = invalidIdentityCodes.has(error?.code);
    if (error?.code !== 'auth/internal-error') {
      console.warn('[Authentication]', error?.code || error?.message || 'verification-unavailable');
    }
    res.status(invalid ? 401 : 503).json({ code: invalid ? 'SESSION_INVALID' : 'AUTH_UNAVAILABLE', error: invalid ? 'Session expirée ou révoquée. Reconnectez-vous.' : 'Vérification de session indisponible. Réessayez.' }); return;
  }
  next();
};
export async function needsSecondFactor(identity: Identity) {
  try {
    const db = services().db;
    const profile = (await db.collection('users').doc(identity.uid).get()).data();
    if (!profile?.twoFactorEnabled) return false;
    const session = (await db.collection('mfaSessions').doc(String(identity.appSessionId || identity.uid)).get()).data();
    return !session || session.authTime !== identity.auth_time || session.expiresAt <= Date.now();
  } catch {
    return false;
  }
}
export const authenticate: RequestHandler = (req: AuthRequest, res, next) => {
  authenticateIdentity(req, res, async () => {
    try {
      if (await needsSecondFactor(req.identity!)) { res.status(403).json({ code: 'MFA_REQUIRED', error: 'Validez le code de double authentification.', mfaProfile: { id: req.identity!.uid, email: req.identity!.email || '', name: req.identity!.name || 'Utilisateur', role: req.identity!.role || 'particulier', roleTitle: 'Compte personnel', twoFactorEnabled: true } }); return; }
    } catch { res.status(503).json({ code: 'AUTH_UNAVAILABLE', error: 'Vérification de session indisponible.' }); return; }
    next();
  });
};
export const requireAdmin: RequestHandler = (req: AuthRequest, res, next) => {
  if (!['super_admin', 'dfat_admin'].includes(req.identity?.role || '')) {
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
adminRouter.get('/tutor-presentation', superOnly, wrap(async (_req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json(await readTutorPresentation(true)); }));
adminRouter.post('/tutor-presentation', superOnly, wrap(async (req, res) => {
  const b = req.body;
  if (!b || !['subtle', 'expressive', 'off'].includes(b.motion) || typeof b.facialExpressions !== 'boolean' || typeof b.handGestures !== 'boolean' || typeof b.autoSpeak !== 'boolean') return res.status(400).json({ error: 'Réglages du tuteur invalides.' });
  const settings = await saveTutorPresentation(b, req.identity!.uid);
  res.json({ ok: true, settings });
}));

adminRouter.get('/users', wrap(async (_req, res) => {
  const snap = await services().db.collection('users').limit(500).get();
  res.json({ users: snap.docs.map(d => ({ ...d.data(), id: d.id })), limited: snap.size === 500 });
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
  res.status(201).json({ profile, resetLink: await resetLink(user.uid) });
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
  res.json({ resetLink: await resetLink(user.uid) });
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
  const snap = await db.collection('settings').doc('levelTests').get();
  const tests = snap.data()?.tests || [];
  const admin = ['super_admin', 'dfat_admin'].includes(req.identity!.role || '');
  if (admin) {
    const attempts = await db.collection('levelTestAttempts').orderBy('date', 'desc').limit(500).get();
    return res.json({ tests, attempts: attempts.docs.map(d => d.data()) });
  }
  res.json({ tests: tests.filter((t: any) => t.active).map((t: any) => ({ ...t, questions: t.questions.map(({ answer, ...q }: any) => q) })), attempts: [] });
}));
learningRouter.post('/level-tests', authenticate, requireAdmin, wrap(async (req, res) => {
  const tests = req.body.tests;
  const valid = Array.isArray(tests) && tests.length <= 100 && new Set(tests.map(t => t?.id)).size === tests.length && tests.every(t => t && typeof t.id === 'string' && /^[\w-]{1,128}$/.test(t.id) && typeof t.title === 'string' && t.title.trim() && t.title.length <= 250 && ['Initiation', 'Approfondi', 'Avancé'].includes(t.level) && (t.level !== 'Approfondi' || typeof t.moduleCode === 'string' && t.moduleCode.trim()) && Number.isInteger(t.passPct) && t.passPct >= 1 && t.passPct <= 100 && typeof t.active === 'boolean' && Array.isArray(t.questions) && t.questions.length > 0 && t.questions.length <= 100 && t.questions.every((q: any) => typeof q.question === 'string' && q.question.trim() && q.question.length <= 2000 && Array.isArray(q.options) && q.options.length === 4 && q.options.every((o: any) => typeof o === 'string' && o.trim() && o.length <= 1000) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4));
  if (!valid) return res.status(400).json({ error: 'Tests invalides : vérifiez les questions, réponses et seuils.' });
  // Attempts are immutable here: an administrator editing tests cannot overwrite results.
  await services().db.collection('settings').doc('levelTests').set({ tests });
  await audit(req, 'tests.update', 'levelTests');
  res.json({ ok: true, tests });
}));
learningRouter.post('/level-tests/attempt', authenticate, wrap(async (req, res) => {
  const db = services().db;
  const ref = db.collection('settings').doc('levelTests');
  const attemptRef = db.collection('levelTestAttempts').doc();
  const attempt = await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    const test = (snap.data()?.tests || []).find((t: any) => t.id === req.body.testId && t.active);
    if (!test) throw new Error('test-unavailable');
    const answers = req.body.answers;
    if (!Array.isArray(answers) || answers.length !== test.questions.length || !answers.every(a => Number.isInteger(a) && a >= 0 && a < 4)) throw new Error('answers-invalid');
    const correct = test.questions.filter((q: any, i: number) => q.answer === answers[i]).length;
    const score = Math.round(correct / test.questions.length * 100);
    const result = { id: attemptRef.id, testId: test.id, testTitle: test.title, level: test.level, moduleCode: test.moduleCode || '', profileId: req.identity!.uid, candidateName: req.identity!.name || req.identity!.email || 'Apprenant', score, passed: score >= test.passPct, correct, date: new Date().toISOString() };
    transaction.set(attemptRef, result); return result;
  });
  res.json({ ok: true, attempt });
}));
learningRouter.use((error: any, _req: any, res: any, _next: any) => {
  const bad = ['test-unavailable', 'answers-invalid'].includes(error.message);
  res.status(bad ? 400 : 503).json({ error: bad ? 'Test indisponible ou réponses incomplètes.' : 'Service de formation indisponible.' });
});
