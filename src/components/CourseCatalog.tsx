import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Award, 
  DownloadCloud, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Star, 
  Users, 
  ExternalLink, 
  ChevronRight,
  Layers,
  LayoutGrid,
  Scale,
  ShieldCheck,
  Building2,
  AlertTriangle,
  FolderArchive,
  Lock,
  LogIn,
  Eye,
  TrendingUp,
  Play,
  RotateCcw,
  Target,
  Timer
} from 'lucide-react';
import { CourseModule, UserProfile, UserRole } from '../types';
import { computeUserLearningStats } from '../utils/learningStats';

interface CourseCatalogProps {
  courses: CourseModule[];
  currentProfile: UserProfile;
  isAuthenticated?: boolean;
  onRequireAuth?: (course?: CourseModule) => void;
  onOpenCoursePlayer: (course: CourseModule) => void;
  onOpenCgpmpRequestForm: (course: CourseModule) => void;
  onToggleOfflineDownload: (courseId: string) => void;
  isOfflineMode: boolean;
  onSelectSubCategoryForBreadcrumb?: (cat: string | null) => void;
  onPreviewCourse?: (course: CourseModule) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  currentProfile,
  isAuthenticated = true,
  onRequireAuth,
  onOpenCoursePlayer,
  onOpenCgpmpRequestForm,
  onToggleOfflineDownload,
  isOfflineMode,
  onSelectSubCategoryForBreadcrumb,
  onPreviewCourse
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous');
  const [selectedAudience, setSelectedAudience] = useState<string>('Tous');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tous');
  const [viewMode, setViewMode] = useState<'pillars' | 'grid'>('grid');

  // Categories list
  const categories = ['Tous', 'Réglementation', 'Passation', 'Contrôle', 'Contentieux', 'Gestion & Audit'];
  const levels = ['Tous', 'Fondamental', 'Intermédiaire', 'Avancé', 'Spécialisé'];
  const audiences: { label: string; roleKey: string }[] = [
    { label: 'Tous les publics', roleKey: 'Tous' },
    { label: 'Cellules CGPMP', roleKey: 'cgpmp_member' },
    { label: 'Régulateurs ARMP', roleKey: 'armp_agent' },
    { label: 'Contrôleurs DGCMP', roleKey: 'dgcmp_agent' },
    { label: 'Opérateurs / PME', roleKey: 'particulier' }
  ];

  // Sync with breadcrumb
  useEffect(() => {
    if (onSelectSubCategoryForBreadcrumb) {
      if (selectedCategory !== 'Tous') {
        onSelectSubCategoryForBreadcrumb(`Catégorie : ${selectedCategory}`);
      } else if (selectedLevel !== 'Tous') {
        onSelectSubCategoryForBreadcrumb(`Niveau : ${selectedLevel}`);
      } else if (selectedAudience !== 'Tous') {
        const found = audiences.find(a => a.roleKey === selectedAudience);
        onSelectSubCategoryForBreadcrumb(`Public : ${found?.label || selectedAudience}`);
      } else if (viewMode === 'pillars') {
        onSelectSubCategoryForBreadcrumb(`Classement par Piliers Réglementaires`);
      } else {
        onSelectSubCategoryForBreadcrumb(null);
      }
    }
  }, [selectedCategory, selectedLevel, selectedAudience, viewMode]);

  // Compute count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Tous: courses.length };
    courses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [courses]);

  // Progression réelle par cours synchronisée avec currentProfile (Firestore + localStorage)
  const learningStats = useMemo(
    () => computeUserLearningStats(currentProfile, courses),
    [currentProfile, courses]
  );
  const courseProgressMap = learningStats.courseProgressMap;
  const recentCourses = learningStats.recentCourses;
  const overallProgress = learningStats.overallProgress;
  const avgScoreDisplay = learningStats.averageScore;
  const completedCoursesCount = learningStats.completedCoursesCount;
  const inProgressCoursesCount = learningStats.inProgressCoursesCount;
  const certificationsCount = learningStats.certificationsCount;

  // Filter courses based on user criteria
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.legalRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'Tous' || c.category === selectedCategory;
      const matchesLevel = selectedLevel === 'Tous' || c.level === selectedLevel;
      const matchesAudience = selectedAudience === 'Tous' || (c.targetAudience && c.targetAudience.includes(selectedAudience as UserRole));

      let matchesStatus = true;
      if (selectedStatus === 'Certifiant') {
        matchesStatus = true; // All courses have official certification
      } else if (selectedStatus === 'DFAT') {
        matchesStatus = c.requiresDfatApproval;
      } else if (selectedStatus === 'Downloaded') {
        matchesStatus = currentProfile.offlineDownloads.includes(c.id);
      }

      return matchesSearch && matchesCat && matchesLevel && matchesAudience && matchesStatus;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedAudience, selectedStatus, currentProfile.offlineDownloads]);

  // Five Regulatory Pillars of Public Procurement in DRC (Loi n° 10/010)
  const regulatoryPillars = [
    {
      id: 'PIL-1',
      title: 'Pilier I : Cadre Légal, Régulation & Principes Fondamentaux',
      legalBasis: 'Loi n° 10/010 (Art. 1 à 12) • Décrets 10/21 & 10/23',
      description: 'Séparation étanche des fonctions de passation (CGPMP), de contrôle a priori (DGCMP) et de régulation/contentieux (ARMP). Liberté d’accès, égalité de traitement et transparence.',
      icon: <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      courseCodes: ['MP-RDC-101']
    },
    {
      id: 'PIL-2',
      title: 'Pilier II : Planification & Préparation de la Commande Publique (PPM & DAO)',
      legalBasis: 'Loi n° 10/010 (Art. 14 à 27) • Décret n° 10/22 (Manuel)',
      description: 'Obligation absolue d’inscription au Plan de Passation des Marchés (PPM). Synchronisation budgétaire, confection des DAO types ARMP (Travaux, Fournitures, Services) et critères éliminatoires.',
      icon: <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
      courseCodes: ['MP-RDC-202']
    },
    {
      id: 'PIL-3',
      title: 'Pilier III : Passation, Commissions d’Ouverture & Évaluation des Offres',
      legalBasis: 'Loi n° 10/010 (Art. 28 à 56) • Manuel des Procédures',
      description: 'Modalités d’appel d’offres ouvert (règle générale). Séance publique obligatoire d’ouverture des plis, analyse de recevabilité, conformité technique et offre financière équitable.',
      icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      courseCodes: ['MP-RDC-505']
    },
    {
      id: 'PIL-4',
      title: 'Pilier IV : Contrôle a Priori, Seuils & Dérogations DGCMP',
      legalBasis: 'Loi n° 10/010 (Art. 12, 42, 43) • Décret n° 10/23',
      description: 'Contrôle a priori obligatoire. Délivrance de l’Avis de Non-Objection (ANO) sur les DAO et attributions. Encadrement très restrictif des marchés par entente directe (gré à gré).',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      courseCodes: ['MP-RDC-303']
    },
    {
      id: 'PIL-5',
      title: 'Pilier V : Contentieux, Audits a Posteriori & Éthique Publique (CRD/ARMP)',
      legalBasis: 'Loi n° 10/010 (Art. 76 à 93) • Dispositions Pénales et Sanctions',
      description: 'Voies de recours non juridictionnelles : recours gracieux et saisine suspensive du Comité des Différends (CRD). Audits indépendants, exclusion pour fraude et répression de la corruption.',
      icon: <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />,
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
      courseCodes: ['MP-RDC-404', 'MP-RDC-606']
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* AI Recommendation Banner tailored to user role */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 p-5 sm:p-6 text-white shadow-lg border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Recommandations Adaptatives IA • Profil {currentProfile.roleTitle}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Parcours Institutionnel Recommandé pour {currentProfile.institution}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Basé sur votre niveau diagnostique (<span className="font-bold text-amber-300">{currentProfile.level}</span>) et vos prérogatives institutionnelles selon la Loi n° 10/010. Les modules ci-dessous répondent directement aux exigences d'habilitation officielle.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="block text-xl font-extrabold text-amber-300 font-mono">
                {completedCoursesCount} / {courses.length}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Modules Validés
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <span className="block text-xl font-extrabold text-emerald-400 font-mono">
                {certificationsCount}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Certificats ARMP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reprendre — uniquement connecté : évolution + plus récents d'abord */}
      {isAuthenticated && recentCourses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <RotateCcw className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Reprendre l’apprentissage</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Vos cours les plus récents — reprenez où vous avez arrêté</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Target className="w-3.5 h-3.5" /> {overallProgress}% global
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                <Clock className="w-3.5 h-3.5" /> Tri récents
              </span>
            </div>
          </div>

          {/* Evolution globale — ProgressBar */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Évolution moyenne du cursus ({completedCoursesCount}/{courses.length} validés)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black">
                {overallProgress}% • {currentProfile.level}
              </span>
            </div>
            <div
              className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <span>0%</span>
              <span className="hidden sm:inline">
                Score moyen : {avgScoreDisplay}% • {completedCoursesCount} validé{completedCoursesCount > 1 ? 's' : ''}
                {inProgressCoursesCount > 0 ? ` • ${inProgressCoursesCount} en cours` : ''}
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* 3 cartes les plus récentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCourses.map((course) => {
              const progress = courseProgressMap[course.id] ?? 0;
              const isCompleted = progress >= 100;
              return (
                <div key={course.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition flex flex-col group">
                  <div className="relative h-28 overflow-hidden">
                    <img src={course.coverImage} alt={course.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold shadow">{course.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>{progress}%</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-[11px] font-bold text-white drop-shadow line-clamp-1">{course.category} • {course.level}</span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2.5">
                    <h4 className="font-black text-sm leading-tight line-clamp-2 text-slate-900 dark:text-white">{course.title}</h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" /> {course.duration} • {course.lessons.length} chapitres</div>
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>{progress}% complété</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {course.lessons.length * 12} min rest.</span>
                      </div>
                    </div>
                    <button onClick={() => onOpenCoursePlayer(course)} className={`mt-1 w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}>
                      {isCompleted ? <><CheckCircle2 className="w-4 h-4" /> Revoir le cours</> : <><Play className="w-4 h-4 fill-white" /> Reprendre</>}
                    </button>
                    <button onClick={() => onPreviewCourse?.(course)} className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition">Aperçu & plan</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visitor Access Banner when not logged in */}
      {!isAuthenticated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Connexion Requise pour Visualiser les Formations
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Vous explorez actuellement le catalogue en mode visiteur. L'accès complet aux cours, chapitres interactifs et examens certifiants exige d'être connecté.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequireAuth?.()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 flex-shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </button>
        </div>
      )}

      {/* Advanced Classification & Filtering Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Control Bar: Search & View Mode Switcher */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé, article Loi 10/010, PPM, DAO, ANO..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Classification View Switcher */}
          <div className="flex items-center space-x-2 self-end lg:self-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Mode de classement :
            </span>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('pillars')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  viewMode === 'pillars'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Classer les modules selon les 5 Piliers réglementaires de la Loi 10/010"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Piliers Réglementaires</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Afficher la grille complète avec tri multi-critères"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grille Globale ({filteredCourses.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Category Pills with Counts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Domaine Thématique :</span>
            </span>
            <span className="text-slate-400">
              {filteredCourses.length} module{filteredCourses.length > 1 ? 's' : ''} disponible{filteredCourses.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tertiary Filter Multi-Selects (Audience, Level, Status) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Target Audience Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Public cible :
            </span>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {audiences.map((aud) => (
                <option key={aud.roleKey} value={aud.roleKey}>{aud.label}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Niveau :
            </span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Statut :
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Certifiant">Certifiant Officiel ARMP</option>
              <option value="DFAT">Requiert Approbation DFAT (CGPMP)</option>
              <option value="Downloaded">Téléchargés en local (Hors-ligne)</option>
            </select>
          </div>

        </div>

      </div>

      {/* VIEW 1: CLASSIFICATION BY 5 REGULATORY PILLARS */}
      {viewMode === 'pillars' && (
        <div className="space-y-8">
          {regulatoryPillars.map((pillar) => {
            const pillarCourses = courses.filter((c) => pillar.courseCodes.includes(c.code));
            
            // If user searched/filtered, only show courses matching search
            const visiblePillarCourses = pillarCourses.filter((c) => 
              filteredCourses.some((fc) => fc.id === c.id)
            );

            if (visiblePillarCourses.length === 0 && (searchQuery || selectedCategory !== 'Tous' || selectedLevel !== 'Tous')) {
              return null; // hide empty pillar during targeted search
            }

            return (
              <div 
                key={pillar.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Pillar Header with Legal Framing */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {pillar.icon}
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                        {pillar.legalBasis}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar Courses List */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pillarCourses.map((course) => {
                    const isDownloaded = currentProfile.offlineDownloads.includes(course.id);
                    const isCompleted = currentProfile.completedModulesCount > 0;
                    const needsDfat = course.requiresDfatApproval && currentProfile.role === 'cgpmp_member';

                    return (
                      <div
                        key={course.id}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 p-4 flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition"
                      >
                        <div className="flex gap-4">
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0 shadow-xs"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                {course.code}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {course.level}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                              {course.title}
                            </h4>

                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {course.description}
                            </p>

                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                              Ref : {course.legalRef}
                            </p>
                          </div>
                        </div>

                        {/* Actions and Status Bar */}
                        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{course.duration}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>Certifiant ARMP</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Offline toggle */}
                            <button
                              onClick={() => {
                                if (!isAuthenticated) {
                                  onRequireAuth?.(course);
                                } else {
                                  onToggleOfflineDownload(course.id);
                                }
                              }}
                              className={`p-2 rounded-lg border transition ${
                                isDownloaded
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200'
                                  : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                              title={isDownloaded ? 'Téléchargé hors-ligne' : 'Sauvegarder pour consultation hors-ligne'}
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                            </button>

                            {/* Bouton Aperçu & Plan */}
                            <button
                              onClick={() => onPreviewCourse?.(course)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center space-x-1"
                              title="Aperçu des premières informations et plan du cours"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Aperçu & Plan</span>
                            </button>

                            {/* Authentication Guard: Connect to view */}
                            {!isAuthenticated ? (
                              <button
                                onClick={() => onRequireAuth?.(course)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
                              >
                                <Lock className="w-3 h-3 text-amber-300" />
                                <span>Se connecter pour visualiser</span>
                              </button>
                            ) : needsDfat ? (
                              <button
                                onClick={() => onOpenCgpmpRequestForm(course)}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                              >
                                Requête CGPMP
                              </button>
                            ) : (
                              <button
                                onClick={() => onOpenCoursePlayer(course)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                              >
                                Démarrer le cours
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: FULL GRID DISPLAY WITH ENHANCED CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isDownloaded = currentProfile.offlineDownloads.includes(course.id);
            const needsDfat = course.requiresDfatApproval && currentProfile.role === 'cgpmp_member';
            const cardProgress = isAuthenticated ? (courseProgressMap[course.id] ?? 0) : 0;
            const isCardCompleted = cardProgress >= 100;

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 flex flex-col overflow-hidden group"
              >
                {/* Image Cover & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 text-white backdrop-blur-md shadow-xs">
                      {course.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isAuthenticated && cardProgress > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${isCardCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {isCardCompleted ? '✓ 100%' : `${cardProgress}%`}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-amber-300 border border-amber-400/40 backdrop-blur-md">
                        {course.level}
                      </span>
                    </div>
                  </div>

                  {/* Legal Ref at bottom of photo */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <span className="inline-block text-[11px] font-semibold text-sky-200 drop-shadow-md">
                      {course.legalRef}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono font-bold">
                      <span className="text-blue-600 dark:text-blue-400">{course.code}</span>
                      <span>{course.lessons.length} chapitres</span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {course.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    {isAuthenticated && cardProgress > 0 && (
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span>{isCardCompleted ? 'Module certifié' : 'Progression'}</span>
                          <span className={isCardCompleted ? 'text-emerald-600' : 'text-blue-600'}>{cardProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCardCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${cardProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Tooling */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {course.duration}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            onRequireAuth?.(course);
                          } else {
                            onToggleOfflineDownload(course.id);
                          }
                        }}
                        className={`p-2 rounded-xl border transition ${
                          isDownloaded
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200'
                            : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isDownloaded ? 'Disponible hors-ligne' : 'Sauvegarder en local'}
                      >
                        <DownloadCloud className="w-4 h-4" />
                      </button>

                      {/* Bouton Aperçu & Plan */}
                      <button
                        onClick={() => onPreviewCourse?.(course)}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center space-x-1.5"
                        title="Aperçu des premières informations et plan du cours sans entrer à l'apprentissage"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Aperçu & Plan</span>
                      </button>

                      {!isAuthenticated ? (
                        <button
                          onClick={() => onRequireAuth?.(course)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                          <span>Se connecter</span>
                        </button>
                      ) : needsDfat ? (
                        <button
                          onClick={() => onOpenCgpmpRequestForm(course)}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          Requête CGPMP
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenCoursePlayer(course)}
                          className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition ${
                            isCardCompleted
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isCardCompleted ? 'Revoir' : cardProgress > 0 ? 'Reprendre' : 'Démarrer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <FolderArchive className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
            Aucun module ne correspond aux critères sélectionnés
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Veuillez réinitialiser vos filtres ou modifier votre recherche textuelle.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Tous');
              setSelectedLevel('Tous');
              setSelectedAudience('Tous');
              setSelectedStatus('Tous');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

    </div>
  );
};
