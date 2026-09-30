import React from 'react';
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
  ShieldCheck, 
  Sparkles,
  Layers,
  GraduationCap,
  Film,
  Video
} from 'lucide-react';
import { CourseModule, UserProfile } from '../types';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Course Header Banner */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-950 overflow-hidden flex-shrink-0">
          <img
            src={course.coverImage}
            alt={course.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white border border-white/20 transition z-10"
            aria-label="Fermer l'aperçu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animatic short play — accessible visiteurs sans connexion */}
          <button
            onClick={() => onOpenAnimatic?.(course)}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 hover:bg-black/20 transition z-[5] group"
            title="Lire le short animatic 30s — prévisualisation sans connexion"
          >
            <span className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
              <Play className="w-7 h-7 ml-0.5 fill-current" />
            </span>
            <span className="mt-2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 backdrop-blur">
              <Film className="w-4 h-4 text-amber-400" /> SHORT ANIMATIC • 0:30
            </span>
          </button>

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
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

          {/* Bottom Title Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center space-x-2 text-xs font-mono text-sky-300 mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>{course.legalRef}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black leading-tight text-white drop-shadow-md">
              {course.title}
            </h2>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
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
                <span>Chapitres</span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{course.lessons.length} modules</p>
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

          {/* Short animatic teaser — prévisualisation vidéo 30s sans connexion */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 flex gap-4 items-center shadow-md">
            <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 shadow">
              <img src={course.coverImage} alt="" className="w-full h-full object-cover opacity-70" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => onOpenAnimatic?.(course)}
                className="absolute inset-0 flex items-center justify-center"
                title="Lire le short animatic"
              >
                <span className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center shadow">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </span>
              </button>
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold border border-white/20">
                0:30
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold tracking-widest uppercase">
                <Film className="w-3.5 h-3.5" /> Prévisualisation vidéo • Sans connexion
              </div>
              <h4 className="font-black text-sm text-white leading-tight">Short animatic — résumé animé du module</h4>
              <p className="text-xs text-white/80 line-clamp-2">Parcours visuel 30s : enjeux, 2 chapitres clés et certification. Accessible aux visiteurs.</p>
              <button
                onClick={() => onOpenAnimatic?.(course)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-white/90 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Lire l'animatic
              </button>
            </div>
          </div>

          {/* Section 1: Overview & Competencies */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Présentation de la formation & Enjeux</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Section 2: Target Audience & Prerequisites */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center space-x-2 mb-2.5">
              <Users className="w-4 h-4" />
              <span>Publics cibles & Destinataires éligibles</span>
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

          {/* Section 3: Detailed Syllabus / Course Plan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Plan détaillé du cours (Syllabus officiel)</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {course.lessons.length} chapitres indexés
              </span>
            </div>

            <div className="space-y-2.5">
              {course.lessons.map((lesson, idx) => {
                const tplNames: Record<string, string> = {
                  whiteboard: 'Aïsha • Explication Didactique Pas-à-Pas',
                  character: 'Aïsha • Accueil Bienveillant & Diction Posée',
                  infographic: 'Aïsha • Mentor Pratique & Vigilance Terrain',
                  timeline: 'Aïsha • Lecture Guidée des Délais & Seuils',
                  flat: 'Aïsha • Synthèse Pédagogique & Encouragement',
                  isometric: 'Aïsha • Rappel Institutionnel Loi 10/010'
                };
                const tplCycle = ['whiteboard', 'infographic', 'timeline', 'isometric', 'flat', 'character'];
                const tplId = (lesson as any).templateId || tplCycle[idx % tplCycle.length];
                const tplLabel = tplNames[tplId] || tplNames.whiteboard;
                return (
                <div
                  key={lesson.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-700 transition space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        ✨
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {lesson.title}
                        </h4>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Studio Pédagogique • {tplLabel}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.duration}</span>
                    </span>
                  </div>

                  {lesson.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-8.5 line-clamp-2 leading-relaxed">
                      {lesson.content}
                    </p>
                  )}

                  {lesson.keyArticles && lesson.keyArticles.length > 0 && (
                    <div className="pl-8.5 pt-1 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Articles liés :</span>
                      {lesson.keyArticles.map((art, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          {art}
                        </span>
                      ))}
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
                  Examen certifiant inclus ({course.quiz.length} questions à validation immédiate)
                </h4>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                  L'obtention de l'attestation DFAT nécessite un score minimum de 75% à l'épreuve de validation finale.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer / Action CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Fermer l'aperçu
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  onClose();
                  onRequireAuth?.(course);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center space-x-2"
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition flex items-center justify-center space-x-2"
              >
                <span>Soumettre requête CGPMP</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartLearning(course);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Démarrer l'apprentissage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
