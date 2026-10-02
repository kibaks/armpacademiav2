import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  BookOpen,
  Award,
  Scale,
  FileText,
  Users,
  CheckCircle2,
  Play,
  Lock,
  Sparkles,
  Layers,
  GraduationCap,
  Film,
  Target,
  GitBranch,
  AlertTriangle,
  ShieldCheck,
  Download,
  HelpCircle,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CourseModule, UserProfile } from '../types';
import {
  CourseSummaryMiniVideoPlayer,
  buildStructuredChapterContent,
  StructuredChapterData
} from './StructuredChapterArchitecture';

interface CoursePreviewModalProps {
  course: CourseModule | null;
  isOpen: boolean;
  onClose: () => void;
  onStartLearning: (course: CourseModule) => void;
  isAuthenticated?: boolean;
  currentProfile: UserProfile;
  onRequestCgpmp?: (course: CourseModule) => void;
  onRequireAuth?: (course: CourseModule) => void;
  onOpenAnimatic?: (course: CourseModule) => void;
}

export const CoursePreviewModal: React.FC<CoursePreviewModalProps> = ({
  course,
  isOpen,
  onClose,
  onStartLearning,
  isAuthenticated = false,
  currentProfile,
  onRequestCgpmp,
  onRequireAuth,
  onOpenAnimatic
}) => {
  // Show the Course Summary Video directly open by default in "Aperçu & Plan"
  const [showSummaryVideoInline, setShowSummaryVideoInline] = useState(true);
  // Track which chapters in the Plan have their full 5-pillar summary expanded (all expanded by default so summary is immediately visible)
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Build structured 5-pillar summary data for every chapter of the course
  const chaptersStructuredData: StructuredChapterData[] = useMemo(() => {
    if (!course) return [];
    const lessons = Array.isArray(course.lessons) ? course.lessons : [];
    return lessons.map((lesson, idx) =>
      buildStructuredChapterContent(course, lesson, idx, currentProfile)
    );
  }, [course, currentProfile]);

  if (!isOpen || !course) return null;

  const needsDfat = course.requiresDfatApproval && currentProfile.role === 'cgpmp_member';

  const roleLabelMap: Record<string, string> = {
    particulier: 'Secteur Privé & Candidats',
    cgpmp_member: 'Membres Cellule CGPMP',
    armp_agent: 'Régulateurs ARMP',
    dgcmp_agent: 'Inspecteurs Contrôle DGCMP',
    dfat_admin: 'Administration DFAT',
    formateur: 'Corps des Formateurs'
  };

  // Course-level synthesis built from first chapter + overall module metadata
  const courseSummaryData: StructuredChapterData | null = chaptersStructuredData[0] || null;

  const handleDownloadTemplate = (filename: string, body: string, id: string) => {
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedId(id);
    setTimeout(() => setDownloadedId(null), 2500);
  };

  const toggleChapterExpand = (idx: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const allExpanded = course.lessons.every((_, i) => expandedChapters[i]);
  const toggleAllChapters = () => {
    const nextState: Record<number, boolean> = {};
    course.lessons.forEach((_, i) => {
      nextState[i] = !allExpanded;
    });
    setExpandedChapters(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Course Header Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-950 overflow-hidden flex-shrink-0">
          <img
            src={course.coverImage}
            alt={course.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 transition z-10 cursor-pointer"
            aria-label="Fermer l'aperçu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
              APERÇU, RÉSUMÉ &amp; PLAN DU COURS
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-md">
              {course.code}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-amber-300 border border-amber-400/40 backdrop-blur-md">
              {course.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
              {course.level}
            </span>
          </div>

          {/* Bottom Title Info + Quick Video Toggle */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white z-10">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-sky-300 mb-1">
                <Scale className="w-3.5 h-3.5" />
                <span>{course.legalRef}</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black leading-tight text-white drop-shadow-md">
                {course.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSummaryVideoInline((v) => !v)}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>{showSummaryVideoInline ? 'Vidéo Résumé Active' : 'Voir la Vidéo Résumé'}</span>
              </button>
              {onOpenAnimatic && (
                <button
                  type="button"
                  onClick={() => onOpenAnimatic(course)}
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 backdrop-blur transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Teaser 30s</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
            <div className="p-2">
              <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Volume horaire</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{course.duration}</p>
            </div>

            <div className="p-2 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Architecture</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {course.lessons.length} chapitres • 5 piliers
              </p>
            </div>

            <div className="p-2 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Attestation</span>
              </div>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">Officielle ARMP</p>
            </div>

            <div className="p-2 border-l border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Apprenants</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{course.studentsCount} inscrits</p>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 1. PETITE VIDÉO RÉSUMANT LE COURS (AFFICHÉE DIRECTEMENT DANS APERÇU & PLAN) */}
          {/* ================================================================= */}
          {showSummaryVideoInline ? (
            <CourseSummaryMiniVideoPlayer
              course={course}
              currentProfile={currentProfile}
              onClose={() => setShowSummaryVideoInline(false)}
            />
          ) : (
            <div className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    🎬 Petite Vidéo Résumant le Cours (Synthèse en 5 Piliers)
                  </span>
                  <h4 className="text-sm font-black text-white">
                    Capsule Vidéo Résumé : {course.title}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryVideoInline(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Afficher la Vidéo Résumé</span>
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. RÉSUMÉ EXÉCUTIF DU COURS EN 5 PILIERS OFFICIELS (DANS APERÇU & PLAN) */}
          {/* ================================================================= */}
          {courseSummaryData && (
            <div className="rounded-3xl border-2 border-blue-200 dark:border-blue-800/80 bg-gradient-to-br from-blue-50/70 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-5 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                      📋 RÉSUMÉ COMPLET DU COURS • ARCHITECTURE EN 5 PILIERS
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                      {course.code} • {course.legalRef}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Synthèse Pédagogique &amp; Résumé du Module « {course.title} »
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-300 dark:border-amber-800 self-start sm:self-auto">
                  5 Piliers Méthodologiques ARMP
                </span>
              </div>

              {/* Description générale */}
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white/90 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white">Vue d&apos;ensemble du cours : </strong>
                {course.description}
              </p>

              {/* Les 3 Idées Clés à retenir absolument (Résumé mot à mot mis en avant) */}
              <div className="rounded-2xl bg-purple-50/90 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Résumé Mot à Mot • Les 3 Idées Clés Majeures à Retenir Absolument</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {courseSummaryData.bilan.troisIdeesCles.map((idee, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800/60 text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs"
                    >
                      {idee}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grille des 5 Piliers du Résumé du Cours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Pilier 1 : L'Enjeu */}
                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-amber-800/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-[11px] font-black uppercase">
                      1. Accroche &amp; Mise en contexte (L&apos;Enjeu)
                    </span>
                    <Target className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p>
                      <strong className="text-slate-900 dark:text-white">• Cas concret de terrain : </strong>
                      {courseSummaryData.enjeu.casConcretTitle} — {courseSummaryData.enjeu.casConcretSituation}
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-white">• Ancrage réglementaire : </strong>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                        {courseSummaryData.enjeu.ancrageLegalRef}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-900 dark:text-white">• Objectif pédagogique : </strong>
                      {courseSummaryData.enjeu.objectifPedagogique}
                    </p>
                  </div>
                </div>

                {/* Pilier 2 : Le Principe */}
                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-blue-200 dark:border-blue-800/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 text-[11px] font-black uppercase">
                      2. Le Cœur du Sujet : Règle &amp; Mécanisme (Le Principe)
                    </span>
                    <GitBranch className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p>
                      <strong className="text-slate-900 dark:text-white">• Principe directeur (Règle d&apos;or) : </strong>
                      {courseSummaryData.principe.principeDirecteur}
                    </p>
                    <div className="pt-1">
                      <strong className="text-slate-900 dark:text-white block mb-1">
                        • Schéma / Flux visuel étape par étape :
                      </strong>
                      <div className="grid grid-cols-3 gap-1.5">
                        {courseSummaryData.principe.fluxEtapes.map((et) => (
                          <div
                            key={et.code}
                            className="p-2 rounded-lg bg-blue-50/80 dark:bg-slate-900 border border-blue-200/70 dark:border-blue-900 text-[10px]"
                          >
                            <span className="font-black text-blue-700 dark:text-blue-400 block">{et.code}</span>
                            <span className="font-bold text-slate-900 dark:text-white leading-tight block">
                              {et.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="pt-1">
                      <strong className="text-slate-900 dark:text-white">• Clarification des rôles : </strong>
                      <strong>CGPMP</strong> (préparation/évaluation) • <strong>DGCMP</strong> (contrôle a priori &amp; ANO) • <strong>ARMP</strong> (régulation, audits &amp; recours CRD).
                    </p>
                  </div>
                </div>

                {/* Pilier 3 : La Pratique */}
                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-[11px] font-black uppercase">
                      3. Application Pratique &amp; Rôles du Terrain (La Pratique)
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p>
                      <strong className="text-emerald-800 dark:text-emerald-300">• Check-list d&apos;action : </strong>
                      {courseSummaryData.pratique.checklistActions[0]}{' '}
                      {courseSummaryData.pratique.checklistActions[1]}
                    </p>
                    <p>
                      <strong className="text-rose-700 dark:text-rose-400">• Pièges à éviter : </strong>
                      {courseSummaryData.pratique.piegesAEviter[0]}
                    </p>
                    <p>
                      <strong className="text-blue-800 dark:text-blue-300">• Règles de conformité / Visas : </strong>
                      {courseSummaryData.pratique.visasConformite.join(' • ')}
                    </p>
                  </div>
                </div>

                {/* Pilier 4 & 5 : Livrables & Vérification */}
                <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-purple-200 dark:border-purple-800/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 text-[11px] font-black uppercase">
                      4. Livrables &amp; 5. Évaluation (Bilan &amp; Vérification)
                    </span>
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">
                      • Ressources téléchargeables incluses (Canevas ARMP) :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {courseSummaryData.bilan.livrables.map((liv) => (
                        <button
                          key={liv.id}
                          type="button"
                          onClick={() => handleDownloadTemplate(liv.filename, liv.templateBody, liv.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" />
                          <span>
                            {downloadedId === liv.id ? 'Téléchargé ✓' : liv.typeLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="pt-1">
                      <strong className="text-rose-700 dark:text-rose-400">
                        • 5. Évaluation &amp; Validation :
                      </strong>{' '}
                      QCM rapide ciblé ({courseSummaryData.verification.quizQuestions.length} questions par chapitre) +{' '}
                      <strong>{courseSummaryData.verification.etudeDeCas.title}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Publics cibles & Destinataires éligibles */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center space-x-2 mb-2.5">
              <Users className="w-4 h-4" />
              <span>Publics cibles &amp; Destinataires éligibles</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {course.targetAudience.map((roleKey) => (
                <span
                  key={roleKey}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{roleLabelMap[roleKey] || roleKey}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. PLAN DÉTAILLÉ DU COURS & RÉSUMÉ STRUCTURÉ DE CHAQUE CHAPITRE   */}
          {/* ================================================================= */}
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Plan Détaillé du Cours &amp; Résumé par Chapitre (en 5 Piliers)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chaque chapitre présente son résumé complet : 1. L&apos;Enjeu • 2. Le Principe • 3. La Pratique • 4. Le Bilan &amp; Livrables • 5. La Vérification
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAllChapters}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {allExpanded ? 'Réduire les détails des chapitres' : 'Déplier le résumé de tous les chapitres'}
              </button>
            </div>

            <div className="space-y-3.5">
              {course.lessons.map((lesson, idx) => {
                const chData = chaptersStructuredData[idx];
                const isExpanded = !!expandedChapters[idx];

                return (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition overflow-hidden shadow-xs"
                  >
                    {/* Chapter Header Bar */}
                    <div
                      onClick={() => toggleChapterExpand(idx)}
                      className="p-4 bg-slate-50/90 dark:bg-slate-800/90 flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                          0{idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                              Chapitre {idx + 1} : {lesson.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                              Résumé 5 Piliers inclus
                            </span>
                          </div>

                          {lesson.content && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {lesson.content}
                            </p>
                          )}

                          {/* Always-visible 5-Pillar Badges Strip */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              1. L&apos;Enjeu (Cas &amp; Loi)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              2. Le Principe (Flux &amp; Rôles)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              3. La Pratique (Check-list &amp; Pièges)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              4. Le Bilan (3 Idées Clés &amp; Livrables)
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              5. La Vérification (QCM &amp; Cas)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{lesson.duration}</span>
                        </span>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                          aria-label="Afficher ou réduire le résumé du chapitre"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded 5-Pillar Chapter Summary inside Plan */}
                    {isExpanded && chData && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* 1. L'Enjeu */}
                          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
                            <div className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-amber-600" />
                              <span>1. Accroche &amp; Mise en contexte (L&apos;Enjeu)</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>Cas concret :</strong> {chData.enjeu.casConcretTitle} —{' '}
                              {chData.enjeu.casConcretSituation}
                            </p>
                            <p className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                              Ancrage légal : {chData.enjeu.ancrageLegalRef}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              <strong>Objectif :</strong> {chData.enjeu.objectifPedagogique}
                            </p>
                          </div>

                          {/* 2. Le Principe */}
                          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
                            <div className="text-[11px] font-black uppercase text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                              <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                              <span>2. Le Cœur du Sujet : Règle &amp; Mécanisme</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>Principe directeur :</strong> {chData.principe.principeDirecteur}
                            </p>
                            <p className="text-[11px] text-blue-800 dark:text-blue-300 font-semibold">
                              Flux : {chData.principe.fluxEtapes.map((e) => `${e.code} (${e.title})`).join(' ➔ ')}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              <strong>Rôles :</strong> CGPMP (Gestion) • DGCMP (Contrôle a priori / ANO) • ARMP (Régulation / CRD)
                            </p>
                          </div>

                          {/* 3. La Pratique */}
                          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                            <div className="text-[11px] font-black uppercase text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>3. Application Pratique &amp; Rôles du Terrain</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>Check-list :</strong> {chData.pratique.checklistActions[0]}
                            </p>
                            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                              <strong>Piège à éviter :</strong> {chData.pratique.piegesAEviter[0]}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              <strong>Visas requis :</strong> {chData.pratique.visasConformite[0]} • {chData.pratique.visasConformite[1]}
                            </p>
                          </div>

                          {/* 4. Le Bilan & 5. La Vérification */}
                          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-1.5">
                            <div className="text-[11px] font-black uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                              <span>4. Synthèse &amp; Livrables • 5. Évaluation &amp; Validation</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                              <div className="font-bold text-purple-950 dark:text-purple-200">
                                Résumé mot à mot (3 idées clés du chapitre) :
                              </div>
                              {chData.bilan.troisIdeesCles.map((idCle, kIdx) => (
                                <p key={kIdx} className="leading-snug">
                                  • {idCle}
                                </p>
                              ))}
                            </div>
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              {chData.bilan.livrables.map((liv) => (
                                <button
                                  key={liv.id}
                                  type="button"
                                  onClick={() => handleDownloadTemplate(liv.filename, liv.templateBody, liv.id)}
                                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1 hover:bg-purple-100 transition cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>{downloadedId === liv.id ? 'Téléchargé ✓' : liv.typeLabel}</span>
                                </button>
                              ))}
                              <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                                ✓ {chData.verification.quizQuestions.length} QCM + Étude de cas
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluation Banner */}
          {course.quiz && course.quiz.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-3">
              <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  5. Évaluation &amp; Validation Finale ({course.quiz.length} questions + études de cas par chapitre)
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                  Chaque chapitre comporte un Quiz rapide ciblé (3 à 5 questions sur cas pratiques) et une Étude de cas courte décisionnelle avant l&apos;examen certifiant ARMP.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Fermer l&apos;aperçu &amp; plan
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  onClose();
                  onRequireAuth?.(course);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Se connecter pour commencer</span>
              </button>
            ) : needsDfat ? (
              <button
                onClick={() => {
                  onClose();
                  onRequestCgpmp?.(course);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Soumettre requête CGPMP</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartLearning(course);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Démarrer l&apos;apprentissage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
