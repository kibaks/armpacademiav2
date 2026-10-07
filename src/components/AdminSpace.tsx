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
  X,
} from 'lucide-react';
import { UserProfile, CourseModule, TrainingRequest, NiveauValidation } from '../types';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { saveProfileToLocalRegistry } from '../firebase';

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
  onShowToast?: (msg: string) => void;
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

const genPassword = () =>
  'FRM-' + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.floor(10 + Math.random() * 89);

const REGISTRY_KEY = 'academia_registered_users_v1';

export const AdminSpace: React.FC<AdminSpaceProps> = ({
  currentProfile,
  courses,
  requests,
  allProfiles,
  onShowToast,
}) => {
  const [view, setView] = useState<'espace' | 'dashboard'>('espace');
  const [section, setSection] = useState<'formateurs' | 'tests'>('formateurs');

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
  });
  const [createdCred, setCreatedCred] = useState<{ email: string; password: string } | null>(null);

  // ---------- Tests de niveau ----------
  const [doc, setDoc] = useState<LevelTestDoc>({ tests: [], attempts: [] });
  const [testsLoading, setTestsLoading] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [testError, setTestError] = useState<string | null>(null);

  const toast = (m: string) => onShowToast?.(m);

  const refreshTrainers = useCallback(() => {
    const merged = new Map<string, UserProfile>();
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      if (raw) {
        const map: Record<string, UserProfile> = JSON.parse(raw);
        Object.values(map).forEach((p) => {
          if (p && p.role === 'formateur' && p.id) merged.set(p.id, p);
        });
      }
    } catch {
      /* registry illisible */
    }
    Object.values(allProfiles || {}).forEach((p) => {
      if (p && p.role === 'formateur' && p.id && !merged.has(p.id)) merged.set(p.id, p);
    });
    setTrainers(Array.from(merged.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
  }, [allProfiles]);

  const refreshTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const res = await fetch('/api/level-tests');
      const data = await res.json();
      setDoc({ tests: data.tests || [], attempts: data.attempts || [] });
    } catch {
      /* serveur absent */
    } finally {
      setTestsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrainers();
    refreshTests();
  }, [refreshTrainers, refreshTests]);

  // ---------- Création formateur ----------
  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    const prenom = trainerForm.prenom.trim();
    const nom = trainerForm.nom.trim();
    const email = trainerForm.email.trim().toLowerCase();
    if (!prenom || !nom) return toast('⚠️ Prénom et nom requis');
    if (!email.includes('@')) return toast('⚠️ Adresse email invalide');
    const password = genPassword();
    const profile: UserProfile = {
      id: `TRN-${Date.now().toString(36).toUpperCase()}`,
      name: `${prenom} ${nom}`,
      nom: nom.toUpperCase(),
      prenom,
      email,
      role: 'formateur',
      roleTitle: trainerForm.roleTitle.trim() || 'Formateur',
      institution: trainerForm.institution.trim() || 'ARMP-RDC',
      phone: trainerForm.phone.trim(),
      avatarUrl: '',
      level: 'Non évalué',
      completedModulesCount: 0,
      certificationsCount: 0,
      offlineDownloads: [],
      joinDate: new Date().toLocaleDateString('fr-FR'),
    };
    try {
      saveProfileToLocalRegistry(profile);
    } catch {
      /* quota */
    }
    refreshTrainers();
    setCreatedCred({ email, password });
    setShowTrainerForm(false);
    setTrainerForm({ prenom: '', nom: '', email: '', institution: 'ARMP-RDC', phone: '+243 ', roleTitle: 'Formateur' });
    toast(`✅ Formateur ${profile.name} créé — identifiants générés`);
  };

  const handleDeleteTrainer = (t: UserProfile) => {
    if (!window.confirm(`Supprimer le formateur ${t.name} ?`)) return;
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      const map: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
      delete map[`uid:${t.id}`];
      if (t.email) delete map[`email:${t.email.trim().toLowerCase()}`];
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
    refreshTrainers();
    toast(`🗑 Formateur ${t.name} supprimé`);
  };

  const copyCred = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('📋 Copié dans le presse-papiers');
    } catch {
      toast('Copie impossible — sélectionnez manuellement');
    }
  };

  // ---------- Tests : persistance ----------
  const persistDoc = async (next: LevelTestDoc, successMsg?: string) => {
    try {
      const res = await fetch('/api/level-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (data.ok) {
        setDoc({ tests: data.tests || [], attempts: data.attempts || [] });
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
            <h2 className="text-lg font-extrabold tracking-tight">Espace Administrateur</h2>
            <p className="text-[11px] text-blue-200/80">
              {currentProfile.name} • {currentProfile.roleTitle} — gestion des formateurs & tests de niveau
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

      {/* Mini statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <GraduationCap className="w-4 h-4" />, label: 'Formateurs', value: trainers.length, cls: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
          { icon: <Layers className="w-4 h-4" />, label: 'Tests de niveau', value: doc.tests.length, cls: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
          { icon: <Power className="w-4 h-4" />, label: 'Tests actifs', value: activeTests.length, cls: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
          { icon: <Award className="w-4 h-4" />, label: 'Validations réussies', value: passedAttempts, cls: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
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
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        {(
          [
            { id: 'formateurs', label: 'Formateurs', icon: <Users className="w-4 h-4" /> },
            { id: 'tests', label: 'Tests de validation de niveau', icon: <Award className="w-4 h-4" /> },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition ${
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
      {/* SECTION FORMATEURS                                           */}
      {/* ============================================================ */}
      {section === 'formateurs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Comptes formateurs</h3>
              <p className="text-xs text-slate-500">L'administrateur crée les formateurs — ils se connectent avec l'email + mot de passe généré.</p>
            </div>
            <button
              onClick={() => setShowTrainerForm((v) => !v)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 transition shadow-sm"
            >
              {showTrainerForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showTrainerForm ? 'Fermer' : 'Créer un formateur'}</span>
            </button>
          </div>

          {createdCred && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
              <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Formateur créé — transmettez-lui ses identifiants :</span>
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono">{createdCred.email}</code>
                <code className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono font-bold">{createdCred.password}</code>
                <button
                  onClick={() => copyCred(`${createdCred.email} / ${createdCred.password}`)}
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

          {showTrainerForm && (
            <form onSubmit={handleCreateTrainer} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouveau formateur</p>
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
                    placeholder="Formateur"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer le compte formateur</span>
                </button>
              </div>
            </form>
          )}

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
            <p className="text-xs text-slate-400 text-center py-6">Chargement…</p>
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
    </div>
  );
};
