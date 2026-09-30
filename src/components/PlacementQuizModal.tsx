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
import { UserProfile, DiagnosticResult } from '../types';

interface PlacementQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onUpdateProfileLevel: (level: UserProfile['level'], score: number) => void;
  onSelectModule: (moduleId: string) => void;
}

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

  useEffect(() => {
    if (!isOpen) return;
    fetchQuestions();
  }, [isOpen]);

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
              <h3 className="font-bold text-base sm:text-lg">Test de Positionnement Automatisé par IA</h3>
              <p className="text-xs text-amber-100">
                Évaluation initiale & Calibration de parcours • Loi n° 10/010 du 27 avril 2010
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
                      <span>Calculer mon Diagnostic IA</span>
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
