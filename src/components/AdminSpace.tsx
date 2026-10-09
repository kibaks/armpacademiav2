import { adminApi, authenticatedFetch } from '../lib/adminApi';
import { SkeletonLoader } from './SkeletonLoader';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Power,
  Pencil,
  LayoutDashboard,
  CheckCircle2,
  Copy,
  Sparkles,
  AlertCircle,
  Layers,
  Award,
  ArrowLeft,
  KeyRound,
  X,
  UserCheck,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { UserProfile, CourseModule, TrainingRequest, NiveauValidation, UserRole } from '../types';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ROLE_CREATION_CONFIG } from './AuthModal';
import { computeUserLearningStats } from '../utils/learningStats';
import { readModuleAuthors, recordModuleAuthor, ModuleAuthor } from '../utils/moduleAuthors';
import {
  LevelSettings,
  DEFAULT_LEVEL_SETTINGS,
  buildLevelOrder,
  levelLabels,
  levelLabel,
  resolveLevelIndex,
  normalizeLevelSettings as normalizeLevelSettingsClient,
  setLevelSettingsCache,
} from '../utils/levelSettings';

interface LevelTestQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  legalRef?: string;
}
interface LevelTest {
  id: string;
  title: string;
  level: NiveauValidation;
  moduleCode?: string;
  passPct: number;
  active: boolean;
  questions: LevelTestQuestion[];
  createdAt: string;
}
interface LevelTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  level: NiveauValidation;
  moduleCode?: string;
  profileId: string;
  candidateName: string;
  score: number;
  passed: boolean;
  date: string;
}
interface LevelTestDoc {
  tests: LevelTest[];
  attempts: LevelTestAttempt[];
}

interface AdminSpaceProps {
  currentProfile: UserProfile;
  courses: CourseModule[];
  requests: TrainingRequest[];
  allProfiles: Record<string, UserProfile>;
  firestoreProfiles?: UserProfile[];
  onShowToast?: (msg: string) => void;
  onDeleteCourse?: (id: string) => Promise<void>;
  onAddCourse?: (course: CourseModule) => void | Promise<void>;
}

const NIVEAUX: NiveauValidation[] = ['Initiation', 'Approfondi', 'Avancé'];

const levelBadge = (level: NiveauValidation): string => {
  if (level === 'Initiation') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60';
  if (level === 'Approfondi') return 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400/50';
  return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-400/50';
};

const emptyDraft = (): {
  id: string;
  title: string;
  level: NiveauValidation;
  moduleCode: string;
  passPct: number;
  active: boolean;
  questions: { question: string; options: string[]; answer: number }[];
} => ({
  id: '',
  title: '',
  level: 'Initiation',
  moduleCode: '',
  passPct: 60,
  active: true,
  questions: [
    {
      question: '',
      options: ['', '', '', ''],
      answer: 0,
    },
  ],
});





export const AdminSpace: React.FC<AdminSpaceProps> = ({
  currentProfile,
  courses,
  requests,
  allProfiles,
  firestoreProfiles,
  onShowToast,
  onAddCourse,
  onDeleteCourse,
}) => {
  const [view, setView] = useState<'espace' | 'dashboard'>('espace');
  const [section, setSection] = useState<
    'tableau' | 'formateurs' | 'apprenants' | 'utilisateurs' | 'permissions' | 'tests' | 'performances' | 'modules' | 'audit' | 'systeme'
  >('tableau');

  // ---------- Tous les comptes (backend) ----------
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<UserProfile[]>([]);
  const [acctSearch, setAcctSearch] = useState('');
  const [acctRoleFilter, setAcctRoleFilter] = useState<string>('tous');
  const [roleLocked, setRoleLocked] = useState(false);

  // ---------- Formateurs ----------
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    institution: 'ARMP-RDC',
    phone: '+243 ',
    roleTitle: 'Formateur',
    role: 'formateur' as UserRole,
  });
  const [createdCred, setCreatedCred] = useState<{ email: string; resetLink: string } | null>(null);

  // ---------- Tests de niveau ----------
  const [doc, setDoc] = useState<LevelTestDoc>({ tests: [], attempts: [] });
  const [testsLoading, setTestsLoading] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [testError, setTestError] = useState<string | null>(null);

  // ---------- Suivi des apprenants ----------
  const [lrnSearch, setLrnSearch] = useState('');
  const [lrnLevel, setLrnLevel] = useState('tous');

  // ---------- Modules de formation (ajout super admin) ----------
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [modForm, setModForm] = useState({
    title: '',
    category: 'Passation' as CourseModule['category'],
    level: 'Fondamental' as CourseModule['level'],
    duration: '12h',
    trainerId: '',
    targetAudience: ['particulier', 'pme', 'grande_entreprise', 'independant'] as UserRole[],
    legalRef: '',
    description: '',
  });
  const [moduleAuthors, setModuleAuthors] = useState<Record<string, ModuleAuthor>>(() => readModuleAuthors());

  // ---------- Vue de la section Performances : apprenants | formateurs ----------
  const [perfView, setPerfView] = useState<'apprenants' | 'formateurs'>('apprenants');

  // ---------- Niveaux paramétrables : libellés + seuils (test de positionnement) ----------
  const [levelSettings, setLevelSettings] = useState<LevelSettings>(DEFAULT_LEVEL_SETTINGS);

  const toast = (m: string) => onShowToast?.(m);

  const refreshAccounts = useCallback(async () => {
    setAccountsLoading(true); setAccountsError(null);
    try {
      const data = await adminApi('/users');
      const users = (data.users as UserProfile[]).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
      setAccounts(users); setTrainers(users.filter(p => p.role === 'formateur'));
      if (data.limited) setAccountsError('Affichage limité aux 500 premiers comptes.');
    } catch (error) { setAccountsError(error instanceof Error ? error.message : 'Chargement impossible.'); }
    finally { setAccountsLoading(false); }
  }, []);
  const refreshTrainers = refreshAccounts;

  const refreshTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const res = await authenticatedFetch('/api/level-tests');
      if (!res.ok) throw new Error('Chargement des tests refusé.');
      const data = await res.json();
      setDoc({ tests: data.tests || [], attempts: data.attempts || [] });
      setTestError(null);
    } catch {
      setTestError('Chargement des tests impossible. Vérifiez la connexion et la configuration du serveur.');
    } finally {
      setTestsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
    refreshTests();
    fetch('/api/level-settings')
      .then((r) => r.json())
      .then((s) => {
        if (s && Number.isFinite(+s.intermediaire) && Number.isFinite(+s.avance) && Number.isFinite(+s.expert)) {
          setLevelSettings(normalizeLevelSettingsClient(s));
        }
      })
      .catch(() => {
        /* serveur absent */
      });
  }, [refreshTrainers, refreshAccounts, refreshTests]);

  // ---------- Création de compte (rôle libre ou formateur verrouillé) ----------
  const openCreateForm = (role: UserRole, locked: boolean) => {
    setRoleLocked(locked);
    setTrainerForm({
      prenom: '',
      nom: '',
      email: '',
      institution: 'ARMP-RDC',
      phone: '+243 ',
      roleTitle: role === 'formateur' ? 'Formateur' : '',
      role,
    });
    setCreatedCred(null);
    setShowTrainerForm(true);
    setSection(locked ? 'formateurs' : 'utilisateurs');
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    const { prenom, nom, email, role, institution, phone, roleTitle } = trainerForm;
    if (!prenom.trim() || !nom.trim()) return toast('Prénom et nom requis.');
    setBusy(true);
    try {
      const data = await adminApi('/users', 'POST', { name: [prenom.trim(),nom.trim()].join(' '), email, role, institution, phone, roleTitle });
      setCreatedCred({ email: data.profile.email, resetLink: data.resetLink });
      setShowTrainerForm(false); await refreshAccounts(); toast('Compte Firebase créé. Transmettez le lien de définition du mot de passe au titulaire.');
    } catch (error) { toast(error instanceof Error ? error.message : 'Création impossible.'); }
    finally { setBusy(false); }
  };
  const mutateAccount = async (path: string, method: string, body?: unknown) => {
    if (busy) return; setBusy(true);
    try { const data = await adminApi(path, method, body); await refreshAccounts(); return data; }
    catch (error) { toast(error instanceof Error ? error.message : 'Opération impossible.'); }
    finally { setBusy(false); }
  };
  const handleChangeRole = async (acc: UserProfile, role: UserRole) => {
    if (!window.confirm('Modifier le rôle de ' + acc.name + ' ? Sa session sera révoquée.')) return;
    if (await mutateAccount('/users/' + encodeURIComponent(acc.id), 'PATCH', { role })) toast('Rôle mis à jour.');
  };
  const handleResetPassword = async (acc: UserProfile) => {
    const data = await mutateAccount('/users/' + encodeURIComponent(acc.id) + '/reset-password', 'POST');
    if (data) { setCreatedCred({ email: acc.email, resetLink: data.resetLink }); toast('Lien de réinitialisation généré.'); }
  };
  const handleDeleteTrainer = async (acc: UserProfile) => {
    if (!window.confirm('Supprimer définitivement le compte Firebase de ' + acc.name + ' ?')) return;
    if (await mutateAccount('/users/' + encodeURIComponent(acc.id), 'DELETE')) toast('Compte supprimé.');
  };
  const handleToggleAccount = async (acc: UserProfile) => {
    const disabled = !(acc as UserProfile & { disabled?: boolean }).disabled;
    if (!window.confirm((disabled ? 'Suspendre ' : 'Réactiver ') + acc.name + ' ?')) return;
    if (await mutateAccount('/users/' + encodeURIComponent(acc.id), 'PATCH', { disabled })) toast(disabled ? 'Compte suspendu.' : 'Compte réactivé.');
  };
  useEffect(() => {
    if (section !== 'audit' && section !== 'systeme') return;
    let cancelled = false; setPanelLoading(true); setPanelError(null);
    adminApi(section === 'audit' ? '/audit' : '/health').then(data => {
      if (!cancelled) { if (section === 'audit') setAuditEntries(data.entries); else setSystemHealth(data); }
    }).catch(error => { if (!cancelled) setPanelError(error.message); }).finally(() => { if (!cancelled) setPanelLoading(false); });
    return () => { cancelled = true; };
  }, [section]);

  const copyCred = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('📋 Copié dans le presse-papiers');
    } catch {
      toast('Copie impossible — sélectionnez manuellement');
    }
  };

  // ---------- Niveaux (libellés + seuils) : paramétrage ----------
  const saveLevelSettings = async () => {
    try {
      const res = await authenticatedFetch('/api/level-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(levelSettings),
      });
      const data = await res.json();
      if (data.ok) {
        const next = normalizeLevelSettingsClient(data.settings);
        setLevelSettings(next);
        setLevelSettingsCache(next);
        toast('🎚️ Niveaux paramétrés — libellés et seuils appliqués partout immédiatement');
      } else {
        toast(`⚠️ ${data.error || 'sauvegarde refusée'}`);
      }
    } catch {
      toast('⚠️ Serveur injoignable — sauvegarde impossible');
    }
  };

  // ---------- Tests : persistance ----------
  const persistDoc = async (next: LevelTestDoc, successMsg?: string) => {
    try {
      const res = await authenticatedFetch('/api/level-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (data.ok) {
        setDoc(previous => ({ tests: data.tests || [], attempts: previous.attempts }));
        if (successMsg) toast(successMsg);
        return true;
      }
      toast(`⚠️ ${data.error || 'sauvegarde refusée'}`);
      return false;
    } catch {
      toast('⚠️ Serveur injoignable — sauvegarde impossible');
      return false;
    }
  };

  const validateDraft = (): string | null => {
    if (!draft.title.trim()) return 'Intitulé du test requis';
    if (draft.level === 'Approfondi' && !draft.moduleCode) return 'Le niveau Approfondi exige un module (« approfondi selon les modules »)';
    if (draft.questions.length === 0) return 'Ajoutez au moins une question';
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i];
      if (!q.question.trim()) return `Question ${i + 1} : énoncé requis`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1} : les 4 options doivent être remplies`;
      if (q.answer < 0 || q.answer > 3) return `Question ${i + 1} : bonne réponse invalide`;
    }
    return null;
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDraft();
    if (err) return setTestError(err);
    setTestError(null);
    const id = draft.id || `LT-${Date.now().toString(36).toUpperCase()}`;
    const entry: LevelTest = {
      id,
      title: draft.title.trim(),
      level: draft.level,
      moduleCode: draft.level === 'Approfondi' ? draft.moduleCode : undefined,
      passPct: Math.max(1, Math.min(100, Math.round(draft.passPct))),
      active: draft.active,
      questions: draft.questions.map((q, i) => ({
        id: `${id}-q${i + 1}`,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        answer: q.answer,
        legalRef: draft.level === 'Approfondi' && draft.moduleCode ? draft.moduleCode : 'Test de niveau',
      })),
      createdAt: new Date().toISOString(),
    };
    const exists = doc.tests.some((t) => t.id === id);
    const nextTests = exists ? doc.tests.map((t) => (t.id === id ? entry : t)) : [...doc.tests, entry];
    const ok = await persistDoc({ ...doc, tests: nextTests }, exists ? `✏️ Test « ${entry.title} » mis à jour` : `✅ Test « ${entry.title} » créé (${entry.level})`);
    if (ok) {
      setShowTestForm(false);
      setDraft(emptyDraft());
    }
  };

  const toggleTest = async (t: LevelTest) => {
    await persistDoc(
      { ...doc, tests: doc.tests.map((x) => (x.id === t.id ? { ...x, active: !x.active } : x)) },
      t.active ? `⏸ Test « ${t.title} » désactivé` : `▶️ Test « ${t.title} » activé — disponible aux apprenants`,
    );
  };

  const deleteTest = async (t: LevelTest) => {
    if (!window.confirm(`Supprimer le test « ${t.title} » ?`)) return;
    await persistDoc({ ...doc, tests: doc.tests.filter((x) => x.id !== t.id) }, `🗑 Test « ${t.title} » supprimé`);
  };

  const editTest = (t: LevelTest) => {
    setDraft({
      id: t.id,
      title: t.title,
      level: t.level,
      moduleCode: t.moduleCode || '',
      passPct: t.passPct,
      active: t.active,
      questions: t.questions.map((q) => ({
        question: q.question,
        options: [...q.options, '', '', '', ''].slice(0, 4),
        answer: q.answer,
      })),
    });
    setTestError(null);
    setShowTestForm(true);
    setSection('tests');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateQuestion = (qi: number, patch: Partial<{ question: string; options: string[]; answer: number }>) => {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (i === qi ? { ...q, ...patch } : q)),
    }));
  };

  const activeTests = doc.tests.filter((t) => t.active);
  const passedAttempts = doc.attempts.filter((a) => a.passed).length;

  // ================================================================
  const accountFormNode = (
            <form onSubmit={handleCreateTrainer} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouveau compte — créer n’importe quel profil</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Prénom *</span>
                  <input
                    value={trainerForm.prenom}
                    onChange={(e) => setTrainerForm({ ...trainerForm, prenom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="Jean"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nom *</span>
                  <input
                    value={trainerForm.nom}
                    onChange={(e) => setTrainerForm({ ...trainerForm, nom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="KABASELE"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Email *</span>
                  <input
                    type="email"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="formateur@armp.cd"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Institution</span>
                  <input
                    value={trainerForm.institution}
                    onChange={(e) => setTrainerForm({ ...trainerForm, institution: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="ARMP-RDC"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Téléphone</span>
                  <input
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="+243 81 000 0000"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Fonction</span>
                  <input
                    value={trainerForm.roleTitle}
                    onChange={(e) => setTrainerForm({ ...trainerForm, roleTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="Ex. Formateur, Super Administrateur…"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Rôle du compte *</span>
                  <select
                    value={trainerForm.role}
                    disabled={roleLocked}
                    onChange={(e) => setTrainerForm({ ...trainerForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold disabled:opacity-60"
                  >
                    {Object.entries(ROLE_CREATION_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busy || currentProfile.role !== 'super_admin'}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer le compte</span>
                </button>
              </div>
            </form>
  );
  // ================================================================
  // DONNÉES DÉRIVÉES — apprenants, segments, permissions, performances
  // ================================================================
  const LEARNER_EXCLUDE = new Set<UserRole>(['super_admin', 'dfat_admin', 'formateur']);
  const learners = accounts.filter((a) => a && !LEARNER_EXCLUDE.has(a.role));
  const passRate =
    doc.attempts.length > 0
      ? Math.round((doc.attempts.filter((a) => a.passed).length / doc.attempts.length) * 100)
      : null;

  const levelOrder = buildLevelOrder(levelSettings);
  const levelCounts = levelOrder.map((lv) => ({
    level: lv,
    count: learners.filter((l) => levelLabel(l.level, l.levelKey, levelSettings) === lv).length,
  }));

  // Segmentation des apprenants en fonction de leur niveau de validation
  const segments: { key: NiveauValidation | 'Non assigné'; label: string; members: UserProfile[] }[] = [
    ...NIVEAUX.map((n) => ({ key: n as NiveauValidation | 'Non assigné', label: n, members: [] as UserProfile[] })),
    { key: 'Non assigné' as NiveauValidation | 'Non assigné', label: 'Non assigné', members: [] as UserProfile[] },
  ];
  learners.forEach((l) => {
    const k: NiveauValidation | 'Non assigné' = l.niveauValidation ?? 'Non assigné';
    const seg = segments.find((s) => s.key === k);
    (seg || segments[segments.length - 1]).members.push(l);
  });

  // Matrice des permissions & rôles (récapitule les accès appliqués par le code)
  const PERMISSION_COLS = [
    { key: 'accounts', label: 'Comptes & rôles' },
    { key: 'trainers', label: 'Formateurs' },
    { key: 'modules', label: 'Modules' },
    { key: 'tests', label: 'Tests & segmentation' },
    { key: 'dashboard', label: 'Tableau de bord' },
    { key: 'learners', label: 'Suivi apprenants' },
  ];
  const ALL_PERM: Record<string, boolean> = Object.fromEntries(PERMISSION_COLS.map((c) => [c.key, true]));
  const NONE_PERM: Record<string, boolean> = Object.fromEntries(PERMISSION_COLS.map((c) => [c.key, false]));
  const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
    super_admin: ALL_PERM,
    dfat_admin: { ...ALL_PERM, accounts: false, trainers: false },
    formateur: { ...NONE_PERM, modules: true },
  };
  const permissionRow = (role: string) => PERMISSION_MATRIX[role] || NONE_PERM;
  const ROLE_ORDER: UserRole[] = [
    'super_admin', 'dfat_admin', 'formateur', 'ac_agent', 'armp_agent', 'dgcmp_agent',
    'cgpmp_member', 'pme', 'grande_entreprise', 'societe_civile', 'independant', 'particulier',
  ];
  const permissionRoles: UserRole[] = [
    ...ROLE_ORDER.filter((r) => r in ROLE_CREATION_CONFIG),
    ...(Object.keys(ROLE_CREATION_CONFIG) as UserRole[]).filter((r) => !ROLE_ORDER.includes(r)),
  ];

  // Performances des formateurs en fonction des modules ajoutés
  const trainerPerf = trainers.map((t) => {
    const mods = courses.filter((c) => (c.authorId || moduleAuthors[c.id]?.id) === t.id);
    const students = mods.reduce((s, c) => s + (c.studentsCount || 0), 0);
    const rated = mods.filter((c) => (c.rating || 0) > 0);
    const avgRating = rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : null;
    return {
      trainer: t,
      modules: mods,
      students,
      avgRating,
      chapters: mods.reduce((s, c) => s + (c.chaptersCount || 0), 0),
    };
  });
  const maxPerfStudents = Math.max(1, ...trainerPerf.map((p) => p.students));
  const attributedCount = courses.filter((c) => moduleAuthors[c.id]).length;

  // ---------- Performances : ensemble des apprenants + évolution ----------
  const learnerPerf = learners
    .map((l) => {
      const stats = computeUserLearningStats(l, courses);
      return {
        learner: l,
        progress: stats.overallProgress,
        progressMap: stats.courseProgressMap,
        score: stats.averageScore,
        completed: stats.completedCoursesCount,
        inProgress: stats.inProgressCoursesCount,
        certifs: stats.certificationsCount,
        delta: stats.monthlyDeltaPct,
        level: levelLabel(l.level, l.levelKey, levelSettings),
        levelIndex: resolveLevelIndex(l.level, l.levelKey, levelSettings),
      };
    })
    .sort((a, b) => b.progress - a.progress);
  const perfAvgProgress = learnerPerf.length
    ? Math.round(learnerPerf.reduce((sum, x) => sum + x.progress, 0) / learnerPerf.length)
    : 0;
  const perfAvgScore = learnerPerf.length
    ? Math.round(learnerPerf.reduce((sum, x) => sum + x.score, 0) / learnerPerf.length)
    : 0;
  const perfCertifs = learnerPerf.reduce((sum, x) => sum + x.certifs, 0);

  // Performance des formateurs : progression réelle des apprenants sur leurs modules
  const trainerPerfFull = trainerPerf.map((tp) => {
    const vals = tp.modules.flatMap((m) => learnerPerf.map((lp) => lp.progressMap[m.id] ?? 0));
    const avgProgress = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { ...tp, avgProgress };
  });
  const trainerStudentsTotal = trainerPerfFull.reduce((sum, x) => sum + x.students, 0);
  const trainerProgVals = trainerPerfFull.filter((x) => x.modules.length > 0).map((x) => x.avgProgress);
  const trainerAvgProgress = trainerProgVals.length
    ? Math.round(trainerProgVals.reduce((a, b) => a + b, 0) / trainerProgVals.length)
    : null;
  const trainerRatingVals = courses.filter((c) => (c.rating || 0) > 0).map((c) => c.rating);
  const trainerAvgRating = trainerRatingVals.length
    ? trainerRatingVals.reduce((a, b) => a + b, 0) / trainerRatingVals.length
    : null;
  const perfLevelColor = (idx: number) =>
    idx === 3
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
      : idx === 2
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
        : idx === 1
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
          : idx === 0
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  // ---------- Ajout d'un module de formation (super admin) ----------
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = modForm.title.trim();
    if (!title) return toast('⚠️ Intitulé du module requis');
    const seq = String(courses.length + 1).padStart(3, '0');
    const course: CourseModule = {
      id: editingModule?.id || `ADM-${Date.now().toString(36).toUpperCase()}`,
      code: editingModule?.code || `MDL-${seq}`,
      title,
      category: modForm.category,
      targetAudience: modForm.targetAudience.length ? modForm.targetAudience : ['particulier'],
      duration: modForm.duration.trim() || '8h',
      level: modForm.level,
      legalRef: modForm.legalRef.trim() || 'Loi n° 10/010 du 27 avril 2010',
      description:
        modForm.description.trim() ||
        `Module ajouté par ${currentProfile.name} depuis l'espace super administrateur.`,
      coverImage: '',
      chaptersCount: 1,
      rating: 0,
      studentsCount: 0,
      requiresDfatApproval: false,
      lessons: [
        {
          id: 'L1',
          title: `Chapitre 1 : Introduction — ${title}`,
          duration: '20 min',
          content: 'Présentation du module, objectifs pédagogiques et cadre légal associé.',
          keyArticles: [modForm.legalRef.trim() || 'Loi 10/010'],
        },
      ],
      quiz: [],
    };
    const trainer = trainers.find((t) => t.id === modForm.trainerId);
    const author: ModuleAuthor = trainer
      ? { id: trainer.id, name: trainer.name }
      : { id: currentProfile.id, name: currentProfile.name };
    if (!onAddCourse) return toast('Publication indisponible.');
    setBusy(true);
    try { await onAddCourse({ ...course, ...(editingModule ? { lessons: editingModule.lessons, quiz: editingModule.quiz, coverImage: editingModule.coverImage, chaptersCount: editingModule.chaptersCount, studentsCount: editingModule.studentsCount, rating: editingModule.rating } : {}), authorId: author.id, authorName: author.name }); }
    catch (error) { toast(error instanceof Error ? error.message : 'Publication impossible.'); return; }
    finally { setBusy(false); }
    recordModuleAuthor(course.id, author);
    setModuleAuthors(readModuleAuthors());
    setModForm({ ...modForm, title: '', legalRef: '', description: '' });
    setShowModuleForm(false); setEditingModule(null);
    toast(`📚 Module « ${title} » ajouté${trainer ? ` — auteur : ${trainer.name}` : ''}`);
  };

  // VUE : DASHBOARD (bascule)
  // ================================================================
  if (view === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-900 text-amber-300">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Mode Dashboard</h2>
              <p className="text-xs text-slate-500">Observatoire décisionnel — vue administrative</p>
            </div>
          </div>
          <button
            onClick={() => setView('espace')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0C3B7C] text-white text-xs font-bold hover:bg-blue-800 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Revenir à l'Espace Admin</span>
          </button>
        </div>
        <AnalyticsDashboard
          institutionName={currentProfile.institution}
          courses={courses}
          requests={requests}
          allProfiles={allProfiles}
          onShowToast={toast}
        />
      </div>
    );
  }

  // ================================================================
  // VUE : ESPACE ADMINISTRATEUR
  // ================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête + bascule de mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white border border-blue-800/60 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/40">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Espace Super Administrateur</h2>
            <p className="text-[11px] text-blue-200/80">
              {currentProfile.name} • {currentProfile.roleTitle} — pilotage : comptes, formateurs, apprenants, modules & tests
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white/10 rounded-xl p-1">
          <span className="px-3 py-1.5 rounded-lg bg-white/15 text-xs font-black">Espace</span>
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-100 hover:bg-white/10 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Mode Dashboard</span>
          </button>
        </div>
      </div>

      {accountsError && <div role="alert" className="p-4 rounded-xl bg-amber-50 text-amber-900">{accountsError} <button onClick={refreshAccounts} className="underline font-bold">Réessayer</button></div>}
      {section === 'tests' && testError && <div role="alert" className="p-4 rounded-xl bg-amber-50 text-amber-900">{testError} <button onClick={refreshTests} className="underline font-bold">Recharger les tests</button></div>}
      {accountsLoading && <SkeletonLoader label="Chargement des comptes…" rows={3} />}
      {busy && <p role="status" className="text-sm text-blue-600">Opération en cours…</p>}
      {(section === 'audit' || section === 'systeme') && <section className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-bold">{section === 'audit' ? 'Journal des actions administratives' : 'État des services'}</h3>
        {panelLoading ? <SkeletonLoader rows={4} /> : panelError ? <p role="alert">{panelError}</p> : section === 'audit' ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Date</th><th className="text-left">Action</th><th className="text-left">Auteur</th><th className="text-left">Cible</th></tr></thead><tbody>{auditEntries.map(entry => <tr key={entry.id} className="border-t"><td className="p-2">{new Date(entry.date).toLocaleString('fr-FR')}</td><td>{entry.action}</td><td>{entry.actor}</td><td>{entry.target}</td></tr>)}</tbody></table>{!auditEntries.length && <p>Aucune action enregistrée.</p>}</div> : systemHealth && <dl className="grid grid-cols-2 gap-3"><dt>Base de données</dt><dd>{systemHealth.firestore}</dd><dt>Authentification</dt><dd>{systemHealth.identity}</dd><dt>Persistance</dt><dd>{systemHealth.persistence}</dd></dl>}
      </section>}
      {/* Mini statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <GraduationCap className="w-4 h-4" />, label: 'Formateurs', value: trainers.length, cls: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
          { icon: <UserCheck className="w-4 h-4" />, label: 'Apprenants', value: learners.length, cls: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400' },
          { icon: <BookOpen className="w-4 h-4" />, label: 'Modules', value: courses.length, cls: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
          { icon: <Power className="w-4 h-4" />, label: 'Tests actifs', value: activeTests.length, cls: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${s.cls}`}>{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation sections */}
      <div className="flex flex-wrap gap-x-1 gap-y-0 border-b border-slate-200 dark:border-slate-800">
        {(
          [
            { id: 'tableau', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'formateurs', label: 'Gestion des formateurs', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'apprenants', label: 'Suivi des apprenants', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'utilisateurs', label: 'Gestion des utilisateurs', icon: <Users className="w-4 h-4" /> },
            { id: 'permissions', label: 'Permissions & rôles', icon: <KeyRound className="w-4 h-4" /> },
            { id: 'tests', label: 'Tests de validation', icon: <Award className="w-4 h-4" /> },
            { id: 'performances', label: 'Performances', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'audit', label: 'Journal des actions', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'systeme', label: 'État des services', icon: <Power className="w-4 h-4" /> },
            { id: 'modules', label: 'Modules de formation', icon: <BookOpen className="w-4 h-4" /> },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 -mb-px transition ${
              section === s.id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SECTION GESTION DES UTILISATEURS — backend, gérée par le super admin */}
      {/* ============================================================ */}
      {section === 'utilisateurs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Gestion des utilisateurs</h3>
              <p className="text-xs text-slate-500">
                Tous les comptes de la plateforme — le super administrateur crée, change les rôles et supprime n'importe quel compte (formateurs, agents, administration…).
              </p>
            </div>
            <button
              onClick={() => (showTrainerForm && !roleLocked ? setShowTrainerForm(false) : openCreateForm('particulier', false))}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
            >
              {showTrainerForm && !roleLocked ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showTrainerForm && !roleLocked ? 'Fermer' : 'Créer un compte'}</span>
            </button>
          </div>

          {createdCred && !roleLocked && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
              <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lien de définition ou réinitialisation du mot de passe :</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono">{createdCred.email}</code>
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono font-bold break-all">{createdCred.resetLink}</code>
                <button
                  onClick={() => copyCred(`${createdCred.email} / ${createdCred.resetLink}`)}
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  title="Copier"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setCreatedCred(null)} className="text-[11px] font-bold text-emerald-700 underline">
                  J'ai noté — fermer
                </button>
              </div>
            </div>
          )}

          {showTrainerForm && !roleLocked && accountFormNode}

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={acctSearch}
              onChange={(e) => setAcctSearch(e.target.value)}
              placeholder="Rechercher — nom, email ou institution…"
              className="flex-1 min-w-[14rem] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <select
              value={acctRoleFilter}
              onChange={(e) => setAcctRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              <option value="tous">Tous les rôles</option>
              {Object.entries(ROLE_CREATION_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <span className="text-[11px] font-bold text-slate-400">
              {accounts.filter((a) => {
                const q = acctSearch.trim().toLowerCase();
                const okQ = !q || [a.name, a.email, a.institution].some((v) => (v || '').toLowerCase().includes(q));
                const okR = acctRoleFilter === 'tous' || a.role === acctRoleFilter;
                return okQ && okR;
              }).length} / {accounts.length} comptes
            </span>
          </div>

          {/* Liste de tous les comptes */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.filter((a) => {
              const q = acctSearch.trim().toLowerCase();
              const okQ = !q || [a.name, a.email, a.institution].some((v) => (v || '').toLowerCase().includes(q));
              const okR = acctRoleFilter === 'tous' || a.role === acctRoleFilter;
              return okQ && okR;
            }).length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">Aucun compte trouvé</p>
                <p className="text-xs text-slate-400">Créez un compte ou élargissez la recherche.</p>
              </div>
            ) : (
              accounts.filter((a) => {
                const q = acctSearch.trim().toLowerCase();
                const okQ = !q || [a.name, a.email, a.institution].some((v) => (v || '').toLowerCase().includes(q));
                const okR = acctRoleFilter === 'tous' || a.role === acctRoleFilter;
                return okQ && okR;
              }).map((a) => (
                <div key={a.id || a.email} className="p-3 flex flex-wrap items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                    {(a.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{a.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {a.email} • {a.institution || '—'} {a.roleTitle ? `• ${a.roleTitle}` : ''}
                    </p>
                  </div>
                  <select
                    disabled={busy || currentProfile.role !== 'super_admin' || a.id === currentProfile.id || a.role === 'super_admin'}
                    aria-label={"Rôle de " + a.name}
                    value={a.role}
                    onChange={(e) => handleChangeRole(a, e.target.value as UserRole)}
                    className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold shrink-0"
                    title="Changer le rôle"
                  >
                    {Object.entries(ROLE_CREATION_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-1 shrink-0"><button disabled={busy || currentProfile.role !== 'super_admin' || a.id === currentProfile.id || a.role === 'super_admin'} onClick={() => handleToggleAccount(a)} className="p-1.5 rounded-lg text-amber-600 disabled:opacity-40" title={(a as any).disabled ? 'Réactiver le compte' : 'Suspendre le compte'}><Power className="w-4 h-4" /></button>
                    <button
                      onClick={() => copyCred(a.email || '')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                      title="Copier l'email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(a)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                      title="Générer un nouveau mot de passe"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrainer(a)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {section === 'formateurs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Gestion des formateurs</h3>
              <p className="text-xs text-slate-500">L'administrateur crée les formateurs — ils se connectent avec l'email + mot de passe généré.</p>
            </div>
            <button
              onClick={() => (showTrainerForm && roleLocked ? setShowTrainerForm(false) : openCreateForm('formateur', true))}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 transition shadow-sm"
            >
              {showTrainerForm && roleLocked ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showTrainerForm && roleLocked ? 'Fermer' : 'Créer un formateur'}</span>
            </button>
          </div>

          {createdCred && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
              <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lien de définition du mot de passe du formateur :</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono">{createdCred.email}</code>
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono font-bold break-all">{createdCred.resetLink}</code>
                <button
                  onClick={() => copyCred(`${createdCred.email} / ${createdCred.resetLink}`)}
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  title="Copier"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setCreatedCred(null)} className="text-[11px] font-bold text-emerald-700 underline">
                  J'ai noté — fermer
                </button>
              </div>
            </div>
          )}

          {showTrainerForm && accountFormNode}

          {/* Liste */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {trainers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">Aucun formateur pour le moment</p>
                <p className="text-xs text-slate-400">Créez le premier compte formateur avec le bouton ci-dessus.</p>
              </div>
            ) : (
              trainers.map((t) => (
                <div key={t.id} className="p-3.5 flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
                      {(t.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t.roleTitle} • {t.institution} • {t.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => copyCred(`${t.email}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                      title="Copier l'email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrainer(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION TESTS DE NIVEAU                                      */}
      {/* ============================================================ */}
      {section === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Tests de validation de niveau</h3>
              <p className="text-xs text-slate-500">
                Niveaux : <strong className="text-emerald-600">Initiation</strong> •{' '}
                <strong className="text-amber-600">Approfondi (selon les modules)</strong> •{' '}
                <strong className="text-blue-600">Avancé</strong> — les tests actifs sont proposés aux apprenants.
              </p>
            </div>
            <button
              onClick={() => {
                setDraft(emptyDraft());
                setTestError(null);
                setShowTestForm((v) => !v);
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
            >
              {showTestForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showTestForm ? 'Fermer' : 'Nouveau test'}</span>
            </button>
          </div>

          {/* Paramétrage des seuils de niveau */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Paramétrage des niveaux</p>
                <p className="text-[11px] text-slate-500">
                  Seuils du test de positionnement : {levelSettings.labels.debutant} &lt;&nbsp;{levelSettings.intermediaire} ≤ {levelSettings.labels.intermediaire} &lt;&nbsp;{levelSettings.avance} ≤ {levelSettings.labels.avance} &lt;&nbsp;{levelSettings.expert} ≤ {levelSettings.labels.expert} (% de réussite).
                </p>
              </div>
              <button
                onClick={saveLevelSettings}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
              >
                Enregistrer les niveaux
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { k: 'intermediaire', label: `Seuil ${levelSettings.labels.intermediaire} (score ≥ %)` },
                  { k: 'avance', label: `Seuil ${levelSettings.labels.avance} (score ≥ %)` },
                  { k: 'expert', label: `Seuil ${levelSettings.labels.expert} (score ≥ %)` },
                ] as { k: 'intermediaire' | 'avance' | 'expert'; label: string }[]
              ).map((f) => (
                <label key={f.k} className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={levelSettings[f.k]}
                    onChange={(e) =>
                      setLevelSettings((prev) => ({
                        ...prev,
                        [f.k]: e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value))),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {(
                [
                  { k: 'debutant' as const, hint: 'palier 1 (défaut « Débutant »)' },
                  { k: 'intermediaire' as const, hint: 'palier 2 (défaut « Intermédiaire »)' },
                  { k: 'avance' as const, hint: 'palier 3 (défaut « Avancé »)' },
                  { k: 'expert' as const, hint: 'palier 4 (défaut « Expert »)' },
                ]
              ).map((f) => (
                <label key={f.k} className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Libellé — {f.hint}</span>
                  <input
                    type="text"
                    maxLength={40}
                    value={levelSettings.labels[f.k]}
                    onChange={(e) =>
                      setLevelSettings((prev) => ({
                        ...prev,
                        labels: { ...prev.labels, [f.k]: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </label>
              ))}
            </div>
          </div>

          {testError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {showTestForm && (
            <form onSubmit={handleSaveTest} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {draft.id ? 'Modifier le test' : 'Créer un test de niveau'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Intitulé *</span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="Ex. Validation Initiation — Marchés publics"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Niveau *</span>
                  <select
                    value={draft.level}
                    onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value as NiveauValidation }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Seuil de réussite (%)</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={draft.passPct}
                    onChange={(e) => setDraft((d) => ({ ...d, passPct: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </label>
              </div>

              {draft.level === 'Approfondi' && (
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    Module à approfondir * — « Approfondi selon les modules »
                  </span>
                  <select
                    value={draft.moduleCode}
                    onChange={(e) => setDraft((d) => ({ ...d, moduleCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-sm font-bold"
                  >
                    <option value="">— Sélectionner un module —</option>
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Questions ({draft.questions.length})
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        questions: [...d.questions, { question: '', options: ['', '', '', ''], answer: 0 }],
                      }))
                    }
                    className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                {draft.questions.map((q, qi) => (
                  <div key={qi} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-start justify-between space-x-2">
                      <span className="text-[10px] font-black text-slate-400 pt-1.5">Q{qi + 1}</span>
                      <input
                        value={q.question}
                        onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium"
                        placeholder="Énoncé de la question…"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== qi) }))
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Supprimer la question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition ${
                            q.answer === oi
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`answer-${qi}`}
                            checked={q.answer === oi}
                            onChange={() => updateQuestion(qi, { answer: oi })}
                            className="accent-emerald-600"
                            title="Bonne réponse"
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const options = [...q.options];
                              options[oi] = e.target.value;
                              updateQuestion(qi, { options });
                            }}
                            className="flex-1 bg-transparent outline-none"
                            placeholder={`Option ${String.fromCharCode(65 + oi)}${oi === 0 ? ' (bonne réponse cochée)' : ''}`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center space-x-2 mr-auto text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                    className="accent-blue-700"
                  />
                  <span>Actif (proposé aux apprenants)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTestForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{draft.id ? 'Mettre à jour' : 'Créer le test'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Liste des tests */}
          {testsLoading ? (
            <SkeletonLoader label="Chargement des tests…" rows={3} />
          ) : doc.tests.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Award className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">Aucun test de niveau créé</p>
              <p className="text-xs text-slate-400">Créez un test Initiation, Approfondi (par module) ou Avancé.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {doc.tests.map((t) => {
                const attempts = doc.attempts.filter((a) => a.testId === t.id);
                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3"
                  >
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${levelBadge(t.level)}`}>
                      {t.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.questions.length} question{t.questions.length > 1 ? 's' : ''} • seuil {t.passPct}% •{' '}
                        {t.level === 'Approfondi' ? `module ${t.moduleCode}` : 'tous modules'} • {attempts.length} passage{attempts.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        t.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {t.active ? 'ACTIF' : 'INACTIF'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleTest(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title={t.active ? 'Désactiver' : 'Activer'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editTest(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTest(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Segmentation des apprenants en fonction du niveau */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Segmentation des apprenants par niveau</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{learners.length} apprenants segmentés</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {segments.map((seg) => (
                <div key={seg.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${seg.key === 'Non assigné' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-300' : levelBadge(seg.key)}`}>
                      {seg.label}
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{seg.members.length}</span>
                  </div>
                  <div className="space-y-1">
                    {seg.members.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Aucun apprenant</p>
                    ) : (
                      seg.members.slice(0, 6).map((m) => (
                        <p key={m.id} className="text-[11px] text-slate-600 dark:text-slate-300 truncate" title={m.name}>
                          • {m.name}
                        </p>
                      ))
                    )}
                    {seg.members.length > 6 && (
                      <p className="text-[10px] font-bold text-blue-500">+{seg.members.length - 6} autres…</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résultats */}
          {doc.attempts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Résultats des passages</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {doc.attempts.slice(0, 50).map((a) => (
                  <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{a.candidateName}</p>
                      <p className="text-slate-500 truncate">
                        {a.testTitle} {a.moduleCode ? `• ${a.moduleCode}` : ''} • {new Date(a.date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${levelBadge(a.level)}`}>{a.level}</span>
                      <span className={`font-black ${a.passed ? 'text-emerald-600' : 'text-red-500'}`}>{a.score}%</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${a.passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'}`}>
                        {a.passed ? 'VALIDÉ' : 'REFUSÉ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION TABLEAU DE BORD                                      */}
      {/* ============================================================ */}
      {section === 'tableau' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Tableau de bord</h3>
              <p className="text-xs text-slate-500">Vue d'ensemble de la plateforme — comptes, apprenants, modules, tests et validations.</p>
            </div>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Mode Dashboard complet</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Comptes utilisateurs', value: accounts.length, icon: <Users className="w-4 h-4" />, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' },
              { label: 'Apprenants suivis', value: learners.length, icon: <UserCheck className="w-4 h-4" />, cls: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400' },
              { label: 'Modules de formation', value: courses.length, icon: <BookOpen className="w-4 h-4" />, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' },
              { label: 'Taux de réussite tests', value: passRate === null ? '—' : `${passRate}%`, icon: <Award className="w-4 h-4" />, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400' },
            ].map((k) => (
              <div key={k.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${k.cls}`}>{k.icon}</div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Apprenants par niveau</p>
              {learners.length === 0 && <p className="text-xs text-slate-400 italic">Aucun apprenant enregistré</p>}
              {levelCounts.map((lc) => {
                const pct = learners.length ? Math.round((lc.count / learners.length) * 100) : 0;
                return (
                  <div key={lc.level} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-300">{lc.level}</span>
                      <span className="text-slate-900 dark:text-white">{lc.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Derniers passages des tests</p>
                <span className="text-[10px] font-bold text-slate-400">{passedAttempts} validations réussies</span>
              </div>
              {doc.attempts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun passage enregistré</p>
              ) : (
                doc.attempts.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{a.candidateName}</p>
                      <p className="text-slate-500 truncate">{a.testTitle}</p>
                    </div>
                    <span className={`font-black ${a.passed ? 'text-emerald-600' : 'text-red-500'}`}>{a.score}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'utilisateurs', label: '➕ Créer un compte' },
                { id: 'formateurs', label: '🎓 Ajouter un formateur' },
                { id: 'modules', label: '📚 Ajouter un module' },
                { id: 'tests', label: '🧪 Nouveau test de niveau' },
                { id: 'permissions', label: '🔑 Permissions & rôles' },
                { id: 'performances', label: '📊 Performances' },
              ] as const
            ).map((q) => (
              <button
                key={q.id}
                onClick={() => setSection(q.id)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-600 transition"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION SUIVI DES APPRENANTS                                 */}
      {/* ============================================================ */}
      {section === 'apprenants' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Suivi des apprenants</h3>
            <p className="text-xs text-slate-500">Progression, niveaux et validations de tous les apprenants de la plateforme.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={lrnSearch}
              onChange={(e) => setLrnSearch(e.target.value)}
              placeholder="Rechercher un apprenant — nom, email ou institution…"
              className="flex-1 min-w-[14rem] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
            <select
              value={lrnLevel}
              onChange={(e) => setLrnLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              <option value="tous">Tous les niveaux</option>
              {levelOrder.map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {levelCounts.map((lc) => (
              <span key={lc.level} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {lc.level} :&nbsp;<strong>{lc.count}</strong>
              </span>
            ))}
          </div>

          {(() => {
            const q = lrnSearch.trim().toLowerCase();
            const filtered = learners.filter((l) => {
              const okQ = !q || [l.name, l.email, l.institution].some((v) => (v || '').toLowerCase().includes(q));
              const okL = lrnLevel === 'tous' || levelLabel(l.level, l.levelKey, levelSettings) === lrnLevel;
              return okQ && okL;
            });
            return filtered.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">Aucun apprenant ne correspond à la recherche</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.slice(0, 60).map((l) => (
                  <div key={l.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-black shrink-0">
                        {(l.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {l.roleTitle} • {l.institution} • {l.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{l.level}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold">{l.completedModulesCount} modules</span>
                      {l.placementScore !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">Score {l.placementScore}%</span>
                      )}
                      {l.niveauValidation ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">✓ {l.niveauValidation}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold">Non validé</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION PERMISSIONS & RÔLES                                 */}
      {/* ============================================================ */}
      {section === 'permissions' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Gestion des permissions et rôles</h3>
            <p className="text-xs text-slate-500">
              Attribution des permissions par rôle. Pour changer le rôle d'un compte, utilisez la section « Gestion des utilisateurs ».
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                  <th className="text-left px-4 py-3 font-extrabold">Rôle</th>
                  {PERMISSION_COLS.map((c) => (
                    <th key={c.key} className="px-3 py-3 font-extrabold text-center whitespace-nowrap">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissionRoles.map((r) => {
                  const row = permissionRow(r);
                  const cfg = ROLE_CREATION_CONFIG[r];
                  return (
                    <tr key={r} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{cfg?.label || r}</td>
                      {PERMISSION_COLS.map((c) => (
                        <td key={c.key} className="px-3 py-2.5 text-center">
                          {row[c.key] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 font-black">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400 flex items-start space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Le super administrateur et l'administration DFAT disposent de toutes les permissions ; un formateur peut publier des modules. Les apprenants n'ont aucun accès backend.
            </span>
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION PERFORMANCES DES FORMATEURS                          */}
      {/* ============================================================ */}
      {section === 'performances' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {perfView === 'apprenants' ? 'Performances des apprenants' : 'Performances des formateurs'}
              </h3>
              <p className="text-xs text-slate-500">
                {perfView === 'apprenants'
                  ? `Ensemble des apprenants (${learnerPerf.length} suivi(s)) — progression, niveaux, scores et évolution. Trié par progression.`
                  : `Résultats en fonction des modules ajoutés — ${attributedCount} module(s) attribué(s) sur ${courses.length}. Attribuez un module à un formateur depuis « Modules de formation ».`}
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
              {(
                [
                  { id: 'apprenants' as const, label: `Apprenants (${learnerPerf.length})` },
                  { id: 'formateurs' as const, label: `Formateurs (${trainerPerf.length})` },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPerfView(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition ${
                    perfView === tab.id
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {perfView === 'apprenants' && (
          <div className="space-y-4">

          {/* KPIs globaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Apprenants', value: String(learnerPerf.length), sub: 'actifs suivis' },
              { label: 'Progression moyenne', value: `${perfAvgProgress}%`, sub: `${courses.length} modules au catalogue` },
              { label: 'Score moyen', value: `${perfAvgScore}%`, sub: 'placement & quiz' },
              {
                label: 'Réussite des tests',
                value: passRate === null ? '—' : `${passRate}%`,
                sub: `${perfCertifs} certification(s)`,
              },
            ].map((k) => (
              <div key={k.label} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{k.label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{k.value}</p>
                <p className="text-[10px] text-slate-500 truncate">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Répartition par niveau */}
          <div className="flex flex-wrap gap-2">
            {levelCounts.map((lc) => (
              <span key={lc.level} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {lc.level} :&nbsp;<strong>{lc.count}</strong>
              </span>
            ))}
          </div>

          {/* Ensemble des apprenants */}
          {learnerPerf.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-500">Aucun apprenant enregistré</p>
              <p className="text-xs text-slate-400">Les apprenants apparaîtront ici dès leur inscription.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-wide text-slate-400">
                <span className="md:col-span-4">Apprenant</span>
                <span className="md:col-span-2">Niveau</span>
                <span className="md:col-span-3">Progression</span>
                <span className="md:col-span-1 text-center">Score</span>
                <span className="md:col-span-2 text-right">Évolution</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {learnerPerf.map(({ learner, progress, score, completed, inProgress, certifs, delta, level, levelIndex }) => (
                  <div key={learner.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center">
                    <div className="md:col-span-4 flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black shrink-0 text-xs">
                        {(learner.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{learner.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{learner.institution} • {learner.roleTitle}</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${perfLevelColor(levelIndex)}`}>
                        {level}
                      </span>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>
                          {completed}/{courses.length} modules
                          {inProgress > 0 ? ` • ${inProgress} en cours` : ''}
                        </span>
                        <span className="text-slate-700 dark:text-slate-200">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-blue-500' : 'bg-amber-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1 text-center">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{score}%</span>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        ▲ +{delta}%
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        title="Certifications obtenues"
                      >
                        🎓 {certifs}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
          )}

          {perfView === 'formateurs' && (
          <div className="space-y-4">
            {/* KPIs formateurs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Formateurs', value: String(trainerPerf.length), sub: 'actifs sur la plateforme' },
                { label: 'Modules attribués', value: String(attributedCount), sub: `${courses.length} modules au catalogue` },
                { label: 'Apprenants touchés', value: String(trainerStudentsTotal), sub: 'cumul des portées' },
                {
                  label: 'Progression de leurs apprenants',
                  value: trainerAvgProgress === null ? '—' : `${trainerAvgProgress}%`,
                  sub: trainerAvgRating === null ? 'note moyenne —' : `note moy. ${trainerAvgRating.toFixed(1)} ★`,
                },
              ].map((k) => (
                <div key={k.label} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{k.label}</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{k.value}</p>
                  <p className="text-[10px] text-slate-500 truncate">{k.sub}</p>
                </div>
              ))}
            </div>

            {trainerPerf.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">Aucun formateur enregistré</p>
                <p className="text-xs text-slate-400">Ajoutez d'abord des formateurs depuis « Gestion des formateurs ».</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {trainerPerfFull.map(({ trainer, modules, students, avgRating, chapters, avgProgress }) => (
                  <div key={trainer.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black shrink-0">
                          {(trainer.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{trainer.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{trainer.institution}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                        {modules.length} module(s)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{modules.length}</p>
                        <p className="text-[9px] font-bold uppercase text-slate-500">Modules</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{students}</p>
                        <p className="text-[9px] font-bold uppercase text-slate-500">Apprenants</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                          {avgRating === null ? '—' : `${avgRating.toFixed(1)} ★`}
                        </p>
                        <p className="text-[9px] font-bold uppercase text-slate-500">Note moy.</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Portée apprenants</span>
                        <span>{students}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${Math.round((students / maxPerfStudents) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Progression moyenne des apprenants</span>
                        <span>{avgProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${avgProgress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {chapters} chapitre(s) publié(s)
                      {modules.length > 0 ? ` • ${modules.slice(0, 2).map((m) => m.title).join(' • ')}${modules.length > 2 ? '…' : ''}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION MODULES DE FORMATION (AJOUT)                         */}
      {/* ============================================================ */}
      {section === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Modules de formation</h3>
              <p className="text-xs text-slate-500">
                Consultez le catalogue ({courses.length} modules) et ajoutez de nouveaux modules — attribués au formateur de votre choix.
              </p>
            </div>
            <button
              onClick={() => { setEditingModule(null); setShowModuleForm((v) => !v); }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-black hover:bg-blue-800 transition shadow-sm"
            >
              {showModuleForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showModuleForm ? 'Fermer' : 'Ajouter un module'}</span>
            </button>
          </div>

          {showModuleForm && (
            <form onSubmit={handleAddModule} className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Intitulé *</span>
                  <input
                    value={modForm.title}
                    onChange={(e) => setModForm({ ...modForm, title: e.target.value })}
                    placeholder="ex: Contrôle a priori DGCMP — cas pratiques"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Catégorie</span>
                  <select
                    value={modForm.category}
                    onChange={(e) => setModForm({ ...modForm, category: e.target.value as CourseModule['category'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    {['Réglementation', 'Passation', 'Contrôle', 'Contentieux', 'Gestion & Audit'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Niveau</span>
                  <select
                    value={modForm.level}
                    onChange={(e) => setModForm({ ...modForm, level: e.target.value as CourseModule['level'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    {['Fondamental', 'Intermédiaire', 'Avancé', 'Spécialisé'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Durée</span>
                  <input
                    value={modForm.duration}
                    onChange={(e) => setModForm({ ...modForm, duration: e.target.value })}
                    placeholder="12h"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Formateur auteur</span>
                  <select
                    value={modForm.trainerId}
                    onChange={(e) => setModForm({ ...modForm, trainerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">🔰 Super administrateur (moi)</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Référence légale</span>
                  <input
                    value={modForm.legalRef}
                    onChange={(e) => setModForm({ ...modForm, legalRef: e.target.value })}
                    placeholder="ex: Loi 10/010, Art. 45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </label>
                <label className="space-y-1 sm:col-span-4">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Description</span>
                  <textarea
                    rows={2}
                    value={modForm.description}
                    onChange={(e) => setModForm({ ...modForm, description: e.target.value })}
                    placeholder="Objectifs pédagogiques et public visé…"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Le module apparaît immédiatement dans le catalogue et dans les performances du formateur sélectionné.
                </p>
                <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 transition">
                  {editingModule ? 'Enregistrer les modifications' : 'Publier le module'}
                </button>
              </div>
            </form>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {courses.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">Aucun module dans le catalogue</p>
              </div>
            ) : (
              courses.slice(0, 60).map((c) => {
                const author = c.authorId ? { id: c.authorId, name: c.authorName || c.authorId } : moduleAuthors[c.id];
                return (
                  <div key={c.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.code} • {c.category} • {c.duration} • {c.level}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {author ? `✍️ ${author.name}` : 'Cours officiel'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">{c.studentsCount} apprenants</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">★ {c.rating}</span>
                      {c.id.startsWith('ADM-') && <><button disabled={busy} title="Modifier le module" onClick={() => { setEditingModule(c); setModForm({ title: c.title, category: c.category, level: c.level, duration: c.duration, trainerId: c.authorId || '', targetAudience: c.targetAudience, legalRef: c.legalRef, description: c.description }); setShowModuleForm(true); }} className="p-2 text-blue-600"><Pencil className="w-4 h-4" /></button><button disabled={busy} title="Supprimer le module" onClick={async () => { if (!onDeleteCourse || !window.confirm('Supprimer le module ' + c.title + ' ?')) return; setBusy(true); try { await onDeleteCourse(c.id); toast('Module supprimé.'); } catch (error) { toast(error instanceof Error ? error.message : 'Suppression impossible.'); } finally { setBusy(false); } }} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button></>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
