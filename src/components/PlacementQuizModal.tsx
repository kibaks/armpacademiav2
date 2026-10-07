import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Loader2,
  Scale
} from 'lucide-react';
import { UserProfile, DiagnosticResult, NiveauValidation } from '../types';

interface PlacementQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onUpdateProfileLevel: (
    level: UserProfile['level'],
    score: number,
    validation?: { niveau: NiveauValidation; moduleCode?: string }
  ) => void;
  onSelectModule: (moduleId: string) => void;
}

interface AdminLevelTest {
  id: string;
  title: string;
  level: NiveauValidation;
  moduleCode?: string;
  passPct: number;
  active: boolean;
  questions: { id: string; question: string; options: string[]; answer: number; legalRef?: string }[];
}

/** Correspondance profil (chaîne historique) → niveaux du test de validation */
const mapValidationToProfileLevel = (n: NiveauValidation): UserProfile['level'] =>
  n === 'Initiation' ? 'Débutant' : n === 'Approfondi' ? 'Intermédiaire' : 'Avancé';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  legalRef: string;
}

export const PlacementQuizModal: React.FC<PlacementQuizModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onUpdateProfileLevel,
  onSelectModule
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [adminTests, setAdminTests] = useState<AdminLevelTest[]>([]);
  const [mode, setMode] = useState<'select' | 'quiz'>('quiz');
  const [activeTest, setActiveTest] = useState<AdminLevelTest | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setActiveTest(null);
    (async () => {
      try {
        const res = await fetch('/api/level-tests');
        const data = await res.json();
        const actives: AdminLevelTest[] = (data.tests || []).filter(
          (t: AdminLevelTest) => t && t.active && Array.isArray(t.questions) && t.questions.length > 0
        );
        setAdminTests(actives);
        if (actives.length > 0) {
          setMode('select');
          setQuestions([]);
          return;
        }
      } catch {
        /* serveur absent → quiz IA */
      }
      setMode('quiz');
      fetchQuestions();
    })();
  }, [isOpen]);

  const startAdminTest = (test: AdminLevelTest) => {
    setActiveTest(test);
    setQuestions(
      test.questions.map((q, i) => ({
        id: i,
        question: q.question,
        options: q.options,
        correctIndex: Math.min(q.answer, q.options.length - 1),
        legalRef: q.legalRef || test.moduleCode || 'Test de niveau',
      }))
    );
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setResult(null);
    setMode('quiz');
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/placement-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentProfile.roleTitle,
          institution: currentProfile.institution
        })
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentQIndex];

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex
    }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      submitEvaluation();
    }
  };

  const submitEvaluation = async () => {
    setIsSubmitting(true);
    try {
      // ---- Test de validation de niveau (créé par l'administrateur) ----
      if (activeTest) {
        const correct = questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
        const score = Math.round((correct / Math.max(1, questions.length)) * 100);
        const passed = score >= activeTest.passPct;
        try {
          await fetch('/api/level-tests/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: activeTest.id,
              profileId: currentProfile.id,
              candidateName: currentProfile.name,
              score,
              passed,
            }),
          });
        } catch {
          /* enregistrement best-effort */
        }
        const wrong = questions.filter((q) => selectedAnswers[q.id] !== q.correctIndex);
        const diagnostic = passed
          ? `Validation ${activeTest.level} RÉUSSIE : ${correct}/${questions.length} bonnes réponses, seuil de ${activeTest.passPct}%. ${activeTest.level === 'Approfondi' && activeTest.moduleCode ? `Module ${activeTest.moduleCode} — niveau Approfondi validé selon les modules.` : `Niveau ${activeTest.level} validé.`}`
          : `Validation ${activeTest.level} non atteinte : ${correct}/${questions.length} (${score}%) pour un seuil de ${activeTest.passPct}%. Révisez le module concerné puis repassez le test.`;
        setResult({
          score,
          level: activeTest.level,
          diagnostic,
          strengths: questions
            .filter((q) => selectedAnswers[q.id] === q.correctIndex)
            .slice(0, 5)
            .map((q) => q.question),
          weaknesses: wrong.slice(0, 5).map((q) => q.question),
          recommendedModuleIds: [],
        });
        onUpdateProfileLevel(mapValidationToProfileLevel(activeTest.level), score, {
          niveau: activeTest.level,
          moduleCode: activeTest.moduleCode,
        });
        return;
      }

      // ---- Quiz IA de positionnement (comportement historique) ----
      const payloadAnswers = questions.map((q) => {
        const picked = selectedAnswers[q.id];
        return {
          questionId: q.id,
          question: q.question,
          pickedIndex: picked,
          isCorrect: picked === q.correctIndex
        };
      });

      const res = await fetch('/api/ai/placement-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentProfile.roleTitle,
          institution: currentProfile.institution,
          answers: payloadAnswers
        })
      });

      const data = await res.json();
      setResult(data);
      onUpdateProfileLevel(data.level as any, data.score);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setResult(null);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setActiveTest(null);
    if (adminTests.length > 0) {
      setMode('select');
      setQuestions([]);
      return;
    }
    fetchQuestions();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 text-white p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {activeTest || mode === 'select' ? 'Test de Validation de Niveau' : 'Test de Positionnement Automatisé par IA'}
              </h3>
              <p className="text-xs text-amber-100">
                {activeTest
                  ? `${activeTest.title} • Niveau ${activeTest.level}`
                  : 'Évaluation initiale & Calibration de parcours • Loi n° 10/010 du 27 avril 2010'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Génération des questions d'évaluation réglementaire pour votre profil...
              </p>
            </div>
          ) : result ? (
            /* Result View */
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/50 text-amber-600 dark:text-amber-400">
                  <Award className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Évaluation Complétée : Niveau {result.level}
                </h4>
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-extrabold text-lg">
                  Score : {result.score}%
                </div>
              </div>

              {/* Diagnostic Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-blue-500" />
                  <span>Diagnostic Pédagogique ARMP / IA :</span>
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {result.diagnostic}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.strengths && result.strengths.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Points Forts Validés</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.weaknesses && result.weaknesses.length > 0 && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-xs">
                    <span className="font-bold text-orange-800 dark:text-orange-300 flex items-center space-x-1 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Axes à Renforcer</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Course Modules */}
              {result.recommendedModuleIds && result.recommendedModuleIds.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Parcours Calibré & Modules Recommandés :
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.recommendedModuleIds.map((mId) => (
                      <button
                        key={mId}
                        onClick={() => {
                          onSelectModule(mId);
                          onClose();
                        }}
                        className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-left transition flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {mId}
                          </span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {mId === 'MOD-001'
                              ? 'Cadre Juridique et Principes Directeurs'
                              : mId === 'MOD-002'
                              ? 'Élaboration du PPM et DAO Type'
                              : mId === 'MOD-003'
                              ? 'Contrôle a Priori DGCMP'
                              : mId === 'MOD-004'
                              ? 'Contentieux & Recours CRD/ARMP'
                              : 'Techniques d’Évaluation des Offres'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={resetQuiz}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Repasser le test
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition"
                >
                  Valider et Voir mes Modules
                </button>
              </div>
            </div>
          ) : mode === 'select' && !result ? (
            /* Sélection d'un test de validation de niveau (créé par l'admin) */
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center space-y-1.5">
                <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <Award className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">Tests de validation de niveau</h4>
                <p className="text-xs text-slate-500">
                  Choisissez le test proposé par l'administration — <strong>Initiation</strong>,{' '}
                  <strong>Approfondi (selon les modules)</strong> ou <strong>Avancé</strong>.
                </p>
              </div>
              <div className="space-y-2.5">
                {adminTests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => startAdminTest(t)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.questions.length} question{t.questions.length > 1 ? 's' : ''} • seuil {t.passPct}%
                        {t.moduleCode ? ` • module ${t.moduleCode}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${
                        t.level === 'Initiation'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60'
                          : t.level === 'Approfondi'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400/50'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-400/50'
                      }`}
                    >
                      {t.level}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-center">
                <button
                  onClick={() => {
                    setMode('quiz');
                    fetchQuestions();
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Ou passer le Quiz IA de positionnement →
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question View */
            <div className="space-y-5">
              {/* Progress indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Question {currentQIndex + 1} sur {questions.length}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">
                    {Math.round(((currentQIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h4>
                <div className="mt-2 flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Réf : {currentQ.legalRef}</span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-xl text-sm font-medium border transition flex items-start space-x-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Précédent
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQ.id] === undefined || isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyse IA en cours...</span>
                    </>
                  ) : currentQIndex === questions.length - 1 ? (
                    <>
                      <span>{activeTest ? 'Soumettre le test de niveau' : 'Calculer mon Diagnostic IA'}</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Suivant</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};
