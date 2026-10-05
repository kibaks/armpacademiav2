import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ArrowRight,
  RotateCcw,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { CourseModule } from '../types';
import imgTutrice from '../assets/images/aisha_avatar_thumb.jpg';

export interface LessonQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  legalReference: string;
}

/**
 * Determines whether a specific lesson requires passing a validation test to proceed.
 */
export function isLessonRequiringValidationTest(
  course: CourseModule,
  lessonIndex: number
): boolean {
  const lesson = course.lessons?.[lessonIndex];
  if (!lesson) return false;
  if (lesson.requiresValidationQuiz === true) return true;
  if (lesson.requiresValidationQuiz === false) return false;

  // By default, Chapter 1 (index 0) and milestone chapters require validation
  // to ensure serious pedagogical rigor across the ARMP curriculum
  return lessonIndex === 0 || lessonIndex % 2 === 1 || lessonIndex === (course.lessons?.length || 1) - 1;
}

/**
 * Generates authentic, lesson-tied questions derived from the lesson's title, key articles & content
 */
export function generateLessonValidationQuestions(
  course: CourseModule,
  lesson: any,
  lessonIndex: number
): LessonQuizQuestion[] {
  if (lesson?.quiz && Array.isArray(lesson.quiz) && lesson.quiz.length >= 2) {
    return lesson.quiz.map((q: any, i: number) => ({
      id: `q-${lessonIndex}-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation || 'Selon la Loi n° 10/010 du 27 avril 2010.',
      legalReference: lesson.keyArticles?.[0] || course.legalRef || 'Loi n° 10/010'
    }));
  }

  const title = lesson?.title || 'Marchés Publics';
  const keyArticle = lesson?.keyArticles?.[0] || 'Art. 1er Loi 10/010';
  const secondArticle = lesson?.keyArticles?.[1] || 'Art. 14 Loi 10/010';
  const lowTitle = title.toLowerCase();

  if (lowTitle.includes('architecture') || lowTitle.includes('piliers') || lowTitle.includes('fondament') || lessonIndex === 0) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Dans le cadre de « ${title} », quel principe fondamental régit l'accès des candidats à la commande publique selon ${keyArticle} ?`,
        options: [
          'La liberté d’accès, l’égalité de traitement des candidats et la transparence des procédures',
          'La préférence arbitraire accordée aux entreprises recommandées par le pouvoir adjudicateur',
          'La dispense totale de mise en concurrence pour tous les marchés régionaux'
        ],
        correctIndex: 0,
        explanation: `L'Article 1er de la Loi n° 10/010 pose les trois piliers intangibles : liberté d'accès à la commande publique, égalité de traitement des soumissionnaires et transparence des opérations.`,
        legalReference: keyArticle
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Quelle pratique est formellement interdite lors de la planification des marchés pour éviter d'éluder les seuils légaux d'appel d'offres ?`,
        options: [
          'La publication annuelle du Plan Prévisionnel de Passation des Marchés (PPM)',
          'Le fractionnement artificiel des besoins (saucissonnage)',
          'L’allotissement pour permettre la participation des PME locales'
        ],
        correctIndex: 1,
        explanation: `L'interdiction du fractionnement (saucissonnage) empêche de découper artificiellement une prestation annuelle en plusieurs petits achats pour échapper aux règles de l'appel d'offres ouvert.`,
        legalReference: 'Art. 19 Loi n° 10/010'
      }
    ];
  }

  if (lowTitle.includes('séparation') || lowTitle.includes('cgpmp') || lowTitle.includes('dgcmp') || lowTitle.includes('armp') || lowTitle.includes('institution')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Dans l'architecture institutionnelle congolaise, quelle est la mission exclusive dévolue à la DGCMP ?`,
        options: [
          'La passation directe et la signature des contrats pour le compte des ministères',
          'Le contrôle a priori de la régularité des procédures et la délivrance de l’A.N.O. (Autorisation de Non-Objection)',
          'La gestion financière exclusive des paiements du Trésor Public'
        ],
        correctIndex: 1,
        explanation: `La DGCMP est l'organe central de contrôle a priori : elle valide les DAO, autorise les dérogations et délivre l'A.N.O. avant toute signature définitive.`,
        legalReference: secondArticle
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Pourquoi la fonction de Régulation (ARMP) est-elle strictement séparée de la fonction de Passation (CGPMP) ?`,
        options: [
          'Pour garantir l’indépendance des audits, former les acteurs et régler les différends en toute impartialité',
          'Pour doubler les délais administratifs de traitement des offres',
          'Pour permettre aux cellules de passation de s’auto-auditer sans contrôle'
        ],
        correctIndex: 0,
        explanation: `Le principe de séparation des fonctions empêche qu'un même organe soit à la fois juge et partie : la CGPMP passe les marchés, la DGCMP contrôle a priori, et l'ARMP régule et tranche les litiges.`,
        legalReference: keyArticle
      }
    ];
  }

  if (lowTitle.includes('seuil') || lowTitle.includes('procédure') || lowTitle.includes('appel d’offres') || lowTitle.includes('gré à gré')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `En droit congolais des marchés publics, quel est le mode de passation érigé en règle de principe obligatoire ?`,
        options: [
          'L’appel d’offres ouvert garantissant la libre concurrence',
          'Le marché de gré à gré après négociation directe',
          'La consultation restreinte sans publication préalable'
        ],
        correctIndex: 0,
        explanation: `L'appel d'offres ouvert est la règle d'or républicaine. Toute autre procédure (gré à gré, appel d'offres restreint) constitue une dérogation soumise à autorisation préalable expresse de la DGCMP.`,
        legalReference: keyArticle
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Pour recourir légalement à une procédure de gré à gré exceptionnelle, quelle condition préalable est impérative ?`,
        options: [
          'La simple convenance personnelle du coordonnateur de la CGPMP',
          'L’obtention formelle de l’Autorisation de Non-Objection (A.N.O.) délivrée par la DGCMP',
          'Une simple mention orale dans le rapport d’évaluation des offres'
        ],
        correctIndex: 1,
        explanation: `Le recours au gré à gré sans A.N.O. préalable de la DGCMP est nul de plein droit et passible de sanctions administratives et pénales.`,
        legalReference: secondArticle
      }
    ];
  }

  if (lowTitle.includes('recours') || lowTitle.includes('différend') || lowTitle.includes('litige') || lowTitle.includes('contentieux') || lowTitle.includes('crd')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Devant quelle instance un candidat s'estimant lésé peut-il introduire un recours non juridictionnel suspensif ?`,
        options: [
          'Le Comité de Règlement des Différends (CRD) de l’ARMP',
          'Le cabinet du Ministre des Finances uniquement',
          'Le bureau direct de l’autorité adjudicatrice sans formalité'
        ],
        correctIndex: 0,
        explanation: `Le Comité de Règlement des Différends (CRD) au sein de l'ARMP est l'autorité indépendante compétente pour statuer sur les recours préalables des soumissionnaires.`,
        legalReference: 'Art. 89 Loi n° 10/010'
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Quel est l'effet immédiat de la saisine du CRD / ARMP dans les délais légaux ?`,
        options: [
          'La suspension immédiate de la procédure de passation du marché jusqu’à la décision sur le fond',
          'La signature accélérée du contrat avant notification de l’ordonnance',
          'Le rejet automatique de la candidature du soumissionnaire requérant'
        ],
        correctIndex: 0,
        explanation: `La notification du recours au CRD suspend la poursuite de la passation afin d'éviter la conclusion irréversible d'un contrat entaché d'irrégularité.`,
        legalReference: 'Art. 91 Loi n° 10/010'
      }
    ];
  }

  if (lowTitle.includes('avenant') || lowTitle.includes('exécution') || lowTitle.includes('pénalité') || lowTitle.includes('délai') || lowTitle.includes('réception')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Quelle est la limite réglementaire maximale d'augmentation du montant initial d'un marché public par voie d'avenants ?`,
        options: [
          '15 % au maximum du montant du marché initial cumulé',
          '50 % sur simple accord tacite entre parties',
          'Aucune limite dès lors que les travaux ont débuté'
        ],
        correctIndex: 0,
        explanation: `Conformément à la réglementation congolaise, la modification par avenant ne peut en aucun cas dépasser 15 % du montant initial du marché, sous peine de constituer un nouveau marché déguisé.`,
        legalReference: 'Décret n° 10/22 d’application'
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Quelle formalité clôture la phase d'exécution avant la libération du cautionnement de bonne fin ?`,
        options: [
          'Le procès-verbal de réception définitive constatant la parfaite conformité des prestations',
          'Une simple conversation téléphonique de confirmation',
          'Le paiement partiel de la première avance forfaitaire'
        ],
        correctIndex: 0,
        explanation: `La réception définitive, actée par PV contradictoire à l'issue de la période de garantie, libère définitivement le titulaire et ses cautions bancaires.`,
        legalReference: keyArticle
      }
    ];
  }

  if (lowTitle.includes('pme') || lowTitle.includes('local') || lowTitle.includes('sous-traitance') || lowTitle.includes('préférence')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Quel mécanisme la Loi 10/010 prévoit-elle pour favoriser la participation des PME nationales ?`,
        options: [
          'L’allotissement des marchés et l’application de la marge de préférence nationale',
          'L’interdiction formelle aux entreprises locales de soumissionner',
          'La réservation exclusive de tous les marchés publics aux multinationales'
        ],
        correctIndex: 0,
        explanation: `L'allotissement permet de fractionner légalement les prestations en lots techniques accessibles aux PME, complété par la marge de préférence nationale (jusqu'à 15%).`,
        legalReference: 'Art. 42 Loi n° 10/010'
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Quelle condition légale s'applique aux entreprises étrangères retenues sur des marchés publics en RDC pour la sous-traitance ?`,
        options: [
          'L’obligation de sous-traiter une part des activités à des entreprises congolaises à capitaux majoritairement nationaux',
          'L’interdiction absolue de recruter des travailleurs congolais',
          'L’exonération intégrale de toute taxe et contrôle'
        ],
        correctIndex: 0,
        explanation: `La Loi sur la sous-traitance en RDC impose aux adjudicataires de confier des tranches d'activités à des structures congolaises éligibles.`,
        legalReference: 'Loi n° 17/001'
      }
    ];
  }

  if (lowTitle.includes('garantie') || lowTitle.includes('caution') || lowTitle.includes('dépouillement') || lowTitle.includes('offre') || lowTitle.includes('évaluation')) {
    return [
      {
        id: `q-${lessonIndex}-1`,
        question: `Quelle est la finalité obligatoire de la garantie de soumission (cautionnement d’offre) ?`,
        options: [
          'Empêcher le désistement intempestif des soumissionnaires pendant la durée de validité de leurs offres',
          'Régler les honoraires des membres de la commission de passation',
          'Servir de caution pour le paiement des pénalités de retard d’un autre marché'
        ],
        correctIndex: 0,
        explanation: `La garantie de soumission assure à l'autorité contractante que le candidat maintiendra son offre et signera le marché s'il est retenu.`,
        legalReference: keyArticle
      },
      {
        id: `q-${lessonIndex}-2`,
        question: `Lors de la séance d'ouverture publique des plis, quelle obligation s'impose à la commission ?`,
        options: [
          'La lecture à haute voix des noms des candidats, des prix et de la présence des cautions, consignée dans le PV d’ouverture',
          'Le dépouillement en secret dans un bureau fermé sans procès-verbal',
          'L’élimination immédiate des offres dont le montant est jugé trop bas sans analyse arithmétique'
        ],
        correctIndex: 0,
        explanation: `L'ouverture des plis est obligatoirement publique et contradictoire. Le PV d'ouverture est paraphé et communiqué à tous les candidats présents.`,
        legalReference: secondArticle
      }
    ];
  }

  // Default lesson-tied questions
  return [
    {
      id: `q-${lessonIndex}-1`,
      question: `Concernant « ${title} », quelle règle opérationnelle s’impose à l'autorité contractante selon ${keyArticle} ?`,
      options: [
        'Le respect strict de la conformité juridique et des spécifications techniques neutres',
        'La sélection arbitraire sans examen comparatif des critères du DAO',
        'La modification confidentielle des critères d’évaluation après l’ouverture des plis'
      ],
      correctIndex: 0,
      explanation: `L'évaluation des offres doit s'effectuer exclusivement sur la base des critères expressément prévus et pondérés dans le Dossier d'Appel d'Offres (DAO).`,
      legalReference: keyArticle
    },
    {
      id: `q-${lessonIndex}-2`,
      question: `Sur le terrain, quel réflexe professionnel garantit la traçabilité intégrale de cette leçon ?`,
      options: [
        'Consigner fidèlement chaque étape par un procès-verbal écrit et archivé',
        'Procéder par accords verbaux pour accélérer l’attribution',
        'Détruire les offres non retenues dès l’attribution provisoire'
      ],
      correctIndex: 0,
      explanation: `La traçabilité documentaire (PV d'ouverture, rapport d'évaluation, lettres de notification) est l'exigence légale requise pour tout contrôle ou audit a posteriori.`,
      legalReference: secondArticle
    }
  ];
}

interface LessonValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseModule;
  lesson: any;
  lessonIndex: number;
  onPassValidation: (lessonIndex: number) => void;
  onPassAndNextLesson: (lessonIndex: number) => void;
  isAlreadyValidated?: boolean;
}

export const LessonValidationModal: React.FC<LessonValidationModalProps> = ({
  isOpen,
  onClose,
  course,
  lesson,
  lessonIndex,
  onPassValidation,
  onPassAndNextLesson,
  isAlreadyValidated = false
}) => {
  const questions = useMemo(
    () => generateLessonValidationQuestions(course, lesson, lessonIndex),
    [course, lesson, lessonIndex]
  );

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedAnswers({});
      setIsSubmitted(false);
    }
  }, [isOpen, lessonIndex]);

  if (!isOpen || !lesson) return null;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === totalQuestions;

  const correctAnswersCount = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  const isPassed = isSubmitted && correctAnswersCount === totalQuestions;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted && isPassed) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setIsSubmitted(true);
    if (correctAnswersCount === totalQuestions) {
      onPassValidation(lessonIndex);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handleConfirmAndNext = () => {
    onPassAndNextLesson(lessonIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden text-white">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Test de Validation Requis
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-semibold text-cyan-300">
                  Chapitre {lessonIndex + 1} / {course.lessons?.length || 1}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {lesson.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pedagogical Instructor Banner */}
        <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border-b border-blue-900/40 flex items-center gap-3">
          <img
            src={imgTutrice}
            alt="Prof. Aïsha"
            className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 shrink-0"
          />
          <div className="text-xs leading-relaxed text-blue-100">
            <p className="font-semibold text-white">
              Prof. Aïsha : « Pour valider ce chapitre et débloquer la leçon suivante, répondez avec exactitude aux 2 questions d'assimilation ci-dessous. »
            </p>
            <span className="text-[10px] text-amber-300 font-bold">
              Score requis : 100% de réussite (2/2) • Références de conformité ARMP
            </span>
          </div>
        </div>

        {/* Content Body: Questions */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Passed Banner if already completed */}
          {isAlreadyValidated && !isSubmitted && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Chapitre déjà validé :</span> Vous avez déjà réussi le test d'assimilation de ce chapitre. Vous pouvez le repasser pour réviser ou passer directement à la suite.
              </div>
            </div>
          )}

          {/* Submission Result Banner */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in zoom-in-95 duration-200 ${
                isPassed
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {isPassed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-black text-white">
                    {isPassed
                      ? '🎉 Félicitations ! Test validé avec succès (Score : 2/2)'
                      : `⚠️ Validation non obtenue (${correctAnswersCount}/${totalQuestions})`}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {isPassed
                      ? 'Vous avez démontré la maîtrise des principes fondamentaux. La leçon suivante est débloquée !'
                      : 'La réglementation ARMP exige 100% d’exactitude. Consultez les explications et réessayez.'}
                  </div>
                </div>
              </div>

              {!isPassed && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réessayer le test</span>
                </button>
              )}
            </div>
          )}

          {/* Questions list */}
          {questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isCorrect = isSubmitted && selectedOpt === q.correctIndex;
            const isWrong = isSubmitted && selectedOpt !== undefined && selectedOpt !== q.correctIndex;

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Question Title */}
                <div className="flex items-start gap-2.5 mb-3.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {q.question}
                    </h3>
                    <div className="text-[10px] text-amber-300/90 font-medium mt-1">
                      ⚖️ Référence légale : {q.legalReference}
                    </div>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2 pl-0 sm:pl-8">
                  {q.options.map((optionText, optIdx) => {
                    const isOptionSelected = selectedOpt === optIdx;
                    const isThisOptionCorrect = isSubmitted && optIdx === q.correctIndex;
                    const isThisOptionWrong = isSubmitted && isOptionSelected && optIdx !== q.correctIndex;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center gap-3 cursor-pointer ${
                          isThisOptionCorrect
                            ? 'bg-emerald-900/60 border-emerald-400 text-white font-semibold'
                            : isThisOptionWrong
                            ? 'bg-rose-900/60 border-rose-400 text-white line-through'
                            : isOptionSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white font-semibold'
                            : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isThisOptionCorrect
                              ? 'bg-emerald-500 border-emerald-400 text-white'
                              : isThisOptionWrong
                              ? 'bg-rose-500 border-rose-400 text-white'
                              : isOptionSelected
                              ? 'bg-amber-400 border-amber-400 text-slate-950'
                              : 'border-slate-600 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{optionText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on Submission */}
                {isSubmitted && (
                  <div
                    className={`mt-3.5 p-3 rounded-xl text-[11px] leading-relaxed border ${
                      isCorrect
                        ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <span className="font-bold">
                      {isCorrect ? '✓ Explication officielle :' : '✗ Correction ARMP :'}
                    </span>{' '}
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium">
            {!isSubmitted && (
              <span>
                {answeredCount}/{totalQuestions} questions répondues
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isSubmitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>Soumettre mes réponses</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : isPassed ? (
              <button
                type="button"
                onClick={handleConfirmAndNext}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>Passer à la leçon suivante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recommencer</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
