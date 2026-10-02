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
  Timer,
  BarChart3,
  Activity
} from 'lucide-react';
import { CourseModule, UserProfile, UserRole } from '../types';
import { computeUserLearningStats, buildChapterGraphForCourse } from '../utils/learningStats';
import {
  filterCoursesByProfile,
  getProfilePedagogicalConfig,
  getPersonalizedLessonAdaptation
} from '../utils/profileCoursePersonalization';

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
  const profileConfig = useMemo(
    () => getProfilePedagogicalConfig(currentProfile.role),
    [currentProfile.role]
  );

  // Verrouillage strict des filtres sur le profil connecté
  const lockedAudienceRole: string = useMemo(() => {
    if (
      currentProfile.role === 'dfat_admin' ||
      currentProfile.role === 'formateur'
    ) {
      return 'formateur';
    }
    return currentProfile.role;
  }, [currentProfile.role]);

  const isFiltersLocked = Boolean(isAuthenticated);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous');
  const [selectedAudience, setSelectedAudience] = useState<string>(
    isAuthenticated ? lockedAudienceRole : 'Tous'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    isAuthenticated ? 'Certifiant' : 'Tous'
  );
  const [viewMode, setViewMode] = useState<'pillars' | 'grid'>('grid');

  // Synchroniser le verrouillage : verrouillé sur le profil si connecté, tous les cours par défaut si non connecté
  useEffect(() => {
    if (isAuthenticated) {
      setSelectedAudience(lockedAudienceRole);
      setSelectedCategory('Tous');
      setSelectedLevel('Tous');
      setSelectedStatus('Certifiant');
    } else {
      setSelectedAudience('Tous');
      setSelectedCategory('Tous');
      setSelectedLevel('Tous');
      setSelectedStatus('Tous');
    }
  }, [isAuthenticated, lockedAudienceRole]);

  // Cours du profil si connecté, sinon tous les cours par défaut
  const profileScopedCourses = useMemo(
    () => (isAuthenticated ? filterCoursesByProfile(courses, currentProfile) : courses),
    [courses, currentProfile, isAuthenticated]
  );

  // Categories list
  const categories = ['Tous', 'Réglementation', 'Passation', 'Contrôle', 'Contentieux', 'Gestion & Audit'];
  const levels = ['Tous', 'Fondamental', 'Intermédiaire', 'Avancé', 'Spécialisé'];
  const audiences: { label: string; roleKey: string }[] = [
    { label: 'Tous les publics', roleKey: 'Tous' },
    { label: 'PME & Sous-Traitants (Loi 17/001)', roleKey: 'pme' },
    { label: 'Cellules CGPMP', roleKey: 'cgpmp_member' },
    { label: 'Régulateurs ARMP', roleKey: 'armp_agent' },
    { label: 'Contrôleurs DGCMP', roleKey: 'dgcmp_agent' },
    { label: 'Soumissionnaires / Consultants', roleKey: 'particulier' },
    { label: 'Formateurs & Supervision DFAT', roleKey: 'formateur' }
  ];

  // Sync with breadcrumb
  useEffect(() => {
    if (onSelectSubCategoryForBreadcrumb) {
      if (isAuthenticated) {
        const found = audiences.find(a => a.roleKey === lockedAudienceRole);
        if (viewMode === 'pillars') {
          onSelectSubCategoryForBreadcrumb(`Cursus ${found?.label || currentProfile.roleTitle} • Piliers Réglementaires`);
        } else {
          onSelectSubCategoryForBreadcrumb(`Cursus verrouillé : ${found?.label || currentProfile.roleTitle}`);
        }
      } else {
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
    }
  }, [isAuthenticated, lockedAudienceRole, currentProfile.roleTitle, selectedCategory, selectedLevel, selectedAudience, viewMode]);

  // Compute count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Tous: profileScopedCourses.length };
    profileScopedCourses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [profileScopedCourses]);

  // Progression réelle par cours synchronisée avec currentProfile (Firestore + localStorage)
  const learningStats = useMemo(
    () => computeUserLearningStats(currentProfile, profileScopedCourses),
    [currentProfile, profileScopedCourses]
  );
  const courseProgressMap = learningStats.courseProgressMap;
  const completedLessonsMap = learningStats.completedLessonsMap;
  const recentCourses = learningStats.recentCourses;
  const recentReadEntries = learningStats.recentReadEntries;
  const overallProgress = learningStats.overallProgress;
  const avgScoreDisplay = learningStats.averageScore;
  const completedCoursesCount = learningStats.completedCoursesCount;
  const inProgressCoursesCount = learningStats.inProgressCoursesCount;
  const certificationsCount = learningStats.certificationsCount;

  const [selectedCatalogGraphCourseId, setSelectedCatalogGraphCourseId] = useState<string | null>(null);
  const activeCatalogGraphEntry = useMemo(() => {
    if (selectedCatalogGraphCourseId) {
      const found = recentReadEntries.find((e) => e.courseId === selectedCatalogGraphCourseId);
      if (found) return found;
    }
    return recentReadEntries[0] || null;
  }, [selectedCatalogGraphCourseId, recentReadEntries]);
  const lastReadEntry = recentReadEntries[0] || null;

  // Filter courses: locked to profile when authenticated, or multi-criteria across all courses when not connected
  const filteredCourses = useMemo(() => {
    return profileScopedCourses.filter((c) => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.legalRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());

      if (isAuthenticated) {
        return matchesSearch;
      }

      const matchesCat = selectedCategory === 'Tous' || c.category === selectedCategory;
      const matchesLevel = selectedLevel === 'Tous' || c.level === selectedLevel;
      const matchesAudience =
        selectedAudience === 'Tous' ||
        (c.targetAudience && c.targetAudience.includes(selectedAudience as UserRole));

      let matchesStatus = true;
      if (selectedStatus === 'Certifiant') {
        matchesStatus = true;
      } else if (selectedStatus === 'DFAT') {
        matchesStatus = c.requiresDfatApproval;
      } else if (selectedStatus === 'Downloaded') {
        matchesStatus = currentProfile.offlineDownloads.includes(c.id);
      }

      return matchesSearch && matchesCat && matchesLevel && matchesAudience && matchesStatus;
    });
  }, [
    profileScopedCourses,
    isAuthenticated,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedAudience,
    selectedStatus,
    currentProfile.offlineDownloads
  ]);

  // Five Regulatory Pillars of Public Procurement in DRC (Loi n° 10/010)
  const regulatoryPillars = [
    {
      id: 'PIL-1',
      title: 'Pilier I : Cadre Légal, Gouvernance CGPMP/DFAT, Contenu Local PME (Loi 17/001) & PPP (Loi 18/016)',
      legalBasis: 'Loi n° 10/010 (Art. 1 à 25) • Décret n° 10/32 • Loi n° 17/001 (ARSP) • Loi n° 18/016 (PPP)',
      description: 'Séparation étanche des fonctions (CGPMP, DGCMP, ARMP), fonctionnement interne des CGPMP, conformité fiscale/sociale/ARSP des PME, sous-traitance (quota de 40%), PPP et ingénierie pédagogique DFAT.',
      icon: <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
      categoryMatch: 'Réglementation',
      courseCodes: ['MP-RDC-101', 'MP-RDC-701', 'MP-RDC-1201', 'MP-RDC-1401', 'MP-RDC-1501', 'MP-RDC-2301']
    },
    {
      id: 'PIL-2',
      title: 'Pilier II : Planification (PPM), Montage des DAO, Chiffrage BPU/DQE, GME & Prestations Intellectuelles',
      legalBasis: 'Loi n° 10/010 (Art. 16 à 46) • Décret n° 10/22 • Dossiers Types ARMP',
      description: 'Élaboration du PPM, rédaction de spécifications techniques neutres, chiffrage financier BPU/DQE, montage d’offres en Groupement PME (GME) et sélection de consultants sur AMI/TDR (SBQC/SCI).',
      icon: <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
      categoryMatch: 'Passation',
      courseCodes: ['MP-RDC-201', 'MP-RDC-801', 'MP-RDC-901', 'MP-RDC-1301', 'MP-RDC-1601', 'MP-RDC-2101']
    },
    {
      id: 'PIL-3',
      title: 'Pilier III : Contrôle a Priori DGCMP, Ouverture des Plis, ANO, Gré à Gré & Bailleurs Internationaux',
      legalBasis: 'Loi n° 10/010 (Art. 3, 14, 26 à 55) • Décret n° 10/27 • Règlements Banque Mondiale / BAD (STEP)',
      description: 'Séance publique d’ouverture des plis, grille de revue a priori DGCMP, délivrance de l’Avis de Non-Objection (ANO), encadrement strict du gré à gré et marchés sur financements extérieurs.',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      categoryMatch: 'Contrôle',
      courseCodes: ['MP-RDC-301', 'MP-RDC-1101', 'MP-RDC-1701', 'MP-RDC-1801']
    },
    {
      id: 'PIL-4',
      title: 'Pilier IV : Exécution des Contrats, Audit Technique, Provinces/ETD & E-Procurement SIGMAP',
      legalBasis: 'Loi n° 10/010 (Art. 47 à 65) • CCAG RDC • Directives SIGMAP & Décentralisation ETD',
      description: 'Gestion des garanties bancaires, attachements contradictoires, avenants (15%), audit technique et financier des chantiers, marchés provinciaux/ETD et dématérialisation sur SIGMAP.',
      icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      categoryMatch: 'Gestion & Audit',
      courseCodes: ['MP-RDC-401', 'MP-RDC-601', 'MP-RDC-1001', 'MP-RDC-2001', 'MP-RDC-2201', 'MP-RDC-2401']
    },
    {
      id: 'PIL-5',
      title: 'Pilier V : Contentieux, Recours Suspensifs (CRD/ARMP), Jurisprudence & Régime des Sanctions',
      legalBasis: 'Loi n° 10/010 (Art. 73 à 82) • Décret n° 10/21 • Charte d’Éthique',
      description: 'Voies de recours non juridictionnelles : recours gracieux préalable et saisine suspensive du Comité de Règlement des Différends (CRD), jurisprudence ARMP, détection des collusions et liste noire.',
      icon: <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />,
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
      categoryMatch: 'Contentieux',
      courseCodes: ['MP-RDC-501', 'MP-RDC-1901']
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
                {completedCoursesCount} / {profileScopedCourses.length}
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                Modules du Profil
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

      {/* Reprendre — ProgressBar Catalogue + Graphique du cours lu + Dernière lecture & Récentes lectures */}
      {isAuthenticated && recentReadEntries.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                  Suivi de Lecture, Dernière Lecture & Graphique du Cours Lu
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Visualisez le graphique chapitre par chapitre du cours lu et reprenez votre dernière lecture ou vos lectures récentes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Target className="w-3.5 h-3.5" /> {overallProgress}% global
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Activity className="w-3.5 h-3.5" /> {recentReadEntries.length} cours lus
              </span>
            </div>
          </div>

          {/* 1. ProgressBar Globale + Graphique du cours lu */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4 space-y-3.5">
            {/* Barre de progression globale du cursus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Évolution moyenne du cursus ({completedCoursesCount}/{profileScopedCourses.length} validés)
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
                <span>
                  Score moyen : {avgScoreDisplay}% • {completedCoursesCount} validé{completedCoursesCount > 1 ? 's' : ''}
                  {inProgressCoursesCount > 0 ? ` • ${inProgressCoursesCount} en cours de lecture` : ''}
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Graphique détaillé du cours lu */}
            {activeCatalogGraphEntry && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-black uppercase flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Graphique du cours lu
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
                        {activeCatalogGraphEntry.code} • {activeCatalogGraphEntry.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Lu : {activeCatalogGraphEntry.readAtLabel}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 truncate">
                      {activeCatalogGraphEntry.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      activeCatalogGraphEntry.progressPct >= 100
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {activeCatalogGraphEntry.progressPct}% lu ({activeCatalogGraphEntry.completedChapters}/{activeCatalogGraphEntry.totalChapters} chap.)
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCoursePlayer(activeCatalogGraphEntry.course)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{activeCatalogGraphEntry.progressPct >= 100 ? 'Relire ce cours' : 'Reprendre la lecture'}</span>
                    </button>
                  </div>
                </div>

                {/* ProgressBar spécifique au cours lu */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Progression du cours lu • Chapitre {activeCatalogGraphEntry.lessonIndex + 1}/{activeCatalogGraphEntry.totalChapters} : {activeCatalogGraphEntry.lastLessonTitle}
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-black">
                      {activeCatalogGraphEntry.progressPct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        activeCatalogGraphEntry.progressPct >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
                      }`}
                      style={{ width: `${activeCatalogGraphEntry.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Histogramme Chapitre par Chapitre + Comparatif des cours lus */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  <div className="lg:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                      <span>Graphique de lecture par chapitre ({activeCatalogGraphEntry.code})</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Lu (100%)
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-blue-600" /> En lecture
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-end">
                      {activeCatalogGraphEntry.chapterGraph.map((ch) => (
                        <div
                          key={ch.index}
                          onClick={() => onOpenCoursePlayer(activeCatalogGraphEntry.course)}
                          className="cursor-pointer rounded-xl p-2 bg-slate-50 hover:bg-blue-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition flex flex-col justify-between"
                          title={`${ch.shortLabel} : ${ch.title} (${ch.progressPct}%)`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                            <span className="text-slate-700 dark:text-slate-200">{ch.shortLabel}</span>
                            <span className={ch.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : ch.isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                              {ch.progressPct}%
                            </span>
                          </div>
                          <div className="w-full h-14 bg-slate-200/80 dark:bg-slate-700 rounded-lg overflow-hidden flex items-end p-0.5">
                            <div
                              className={`w-full rounded-md transition-all duration-700 ${
                                ch.isCompleted
                                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                  : ch.isCurrent
                                  ? 'bg-gradient-to-t from-blue-700 to-cyan-400 animate-pulse'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                              style={{ height: `${Math.max(15, ch.progressPct)}%` }}
                            />
                          </div>
                          <div className="mt-1">
                            <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {ch.title}
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center justify-between mt-0.5">
                              <span>{ch.duration}</span>
                              <span>{ch.isCompleted ? '✓ Lu' : ch.isCurrent ? '● Actif' : 'À lire'}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Barre Examen QCM */}
                      <div
                        onClick={() => onOpenCoursePlayer(activeCatalogGraphEntry.course)}
                        className="cursor-pointer rounded-xl p-2 bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 transition flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                          <span className="text-amber-800 dark:text-amber-300">QCM</span>
                          <span className="text-amber-700 dark:text-amber-400">
                            {currentProfile.quizScoresByCourse?.[activeCatalogGraphEntry.courseId] ?? (activeCatalogGraphEntry.progressPct >= 100 ? 88 : 0)}%
                          </span>
                        </div>
                        <div className="w-full h-14 bg-amber-200/50 dark:bg-slate-700 rounded-lg overflow-hidden flex items-end p-0.5">
                          <div
                            className="w-full rounded-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-700"
                            style={{
                              height: `${Math.max(
                                18,
                                currentProfile.quizScoresByCourse?.[activeCatalogGraphEntry.courseId] ??
                                  (activeCatalogGraphEntry.progressPct >= 100 ? 88 : Math.round(activeCatalogGraphEntry.progressPct * 0.5))
                              )}%`
                            }}
                          />
                        </div>
                        <div className="mt-1">
                          <div className="text-[10px] font-bold text-amber-900 dark:text-amber-200 truncate">
                            Examen QCM
                          </div>
                          <div className="text-[9px] text-amber-700 dark:text-amber-400 mt-0.5">
                            {activeCatalogGraphEntry.progressPct >= 100 ? '✓ Certifié' : 'Seuil 70%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sélecteur comparatif des cours lus */}
                  <div className="lg:col-span-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Cours lus (cliquer pour voir le graphique)</span>
                    </div>
                    <div className="space-y-1.5">
                      {recentReadEntries.slice(0, 4).map((entry) => {
                        const isSelected = activeCatalogGraphEntry.courseId === entry.courseId;
                        return (
                          <button
                            key={entry.courseId}
                            type="button"
                            onClick={() => setSelectedCatalogGraphCourseId(entry.courseId)}
                            className={`w-full text-left p-1.5 rounded-lg border transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50'
                                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="truncate text-slate-800 dark:text-slate-200">
                                {entry.isLastRead ? '★ Dernière lecture : ' : ''}{entry.code}
                              </span>
                              <span className={`font-mono ${entry.progressPct >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {entry.progressPct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  entry.progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${entry.progressPct}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. DERNIÈRE LECTURE (Mise en avant) & RÉCENTES LECTURES */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Votre Dernière Lecture & Récentes Lectures</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Cliquez sur « Graphique » pour inspecter les chapitres d'un cours
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReadEntries.slice(0, 3).map((entry, idx) => {
                const course = entry.course;
                const progress = entry.progressPct;
                const isCompleted = progress >= 100;
                const isLastRead = idx === 0;
                const isGraphActive = activeCatalogGraphEntry?.courseId === course.id;

                return (
                  <div
                    key={course.id}
                    className={`rounded-2xl border overflow-hidden transition flex flex-col group ${
                      isLastRead
                        ? 'border-2 border-blue-500 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                        : isGraphActive
                        ? 'border-blue-400 bg-slate-50 dark:bg-slate-800/40'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="relative h-28 overflow-hidden">
                      <img src={course.coverImage} alt={course.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                          isLastRead
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/90 text-slate-800'
                        }`}>
                          {isLastRead ? '★ Dernière lecture' : `Récente lecture #${idx + 1}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold drop-shadow">
                        <span className="truncate">{course.code} • {course.category}</span>
                        <span className="font-mono text-amber-300 shrink-0">{entry.readAtLabel}</span>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                      <div className="space-y-1.5">
                        <h4 className="font-black text-sm leading-tight line-clamp-2 text-slate-900 dark:text-white">
                          {course.title}
                        </h4>
                        <div className="text-[11px] text-blue-700 dark:text-blue-300 font-bold truncate">
                          Ch. {entry.lessonIndex + 1}/{entry.totalChapters} : {entry.lastLessonTitle}
                        </div>

                        {/* Mini graphique par chapitre directement sur la carte */}
                        <div className="grid grid-cols-3 gap-1 pt-0.5">
                          {entry.chapterGraph.map((ch) => (
                            <div key={ch.index} className="bg-white dark:bg-slate-900 rounded-md p-1 border border-slate-200/70 dark:border-slate-700/70">
                              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-500">
                                <span>{ch.shortLabel}</span>
                                <span className={ch.isCompleted ? 'text-emerald-600' : 'text-blue-600'}>{ch.progressPct}%</span>
                              </div>
                              <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                                <div
                                  className={`h-full rounded-full ${ch.isCompleted ? 'bg-emerald-500' : ch.isCurrent ? 'bg-blue-600' : 'bg-slate-300'}`}
                                  style={{ width: `${ch.progressPct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1 pt-0.5">
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>{entry.completedChapters}/{entry.totalChapters} chapitres lus</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() => onOpenCoursePlayer(course)}
                          className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                          }`}
                        >
                          {isCompleted ? (
                            <><CheckCircle2 className="w-4 h-4" /> Relire le cours</>
                          ) : (
                            <><Play className="w-4 h-4 fill-white" /> {isLastRead ? 'Reprendre ma dernière lecture' : 'Reprendre la lecture'}</>
                          )}
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCatalogGraphCourseId(course.id)}
                            className={`py-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                              isGraphActive
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            <BarChart3 className="w-3 h-3" />
                            <span>Graphique</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onPreviewCourse?.(course)}
                            className="py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            Aperçu & plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

        {/* Bandeau d'état : Filtres verrouillés uniquement lorsque l'utilisateur est connecté */}
        {isFiltersLocked ? (
          <div className="rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-blue-950 dark:text-blue-200">
                    Catalogue filtré et verrouillé pour votre profil : {currentProfile.roleTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300/70">
                    {profileConfig.shortLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Institution : <span className="font-bold">{currentProfile.institution}</span> • {profileConfig.legalBasisFocus}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-[10px] font-mono font-bold shrink-0 self-start sm:self-center">
              <Lock className="w-3 h-3" /> Filtres verrouillés ({profileScopedCourses.length} cours habilités)
            </span>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mode exploration libre (non connecté) : tous les {courses.length} cours officiels sont chargés par défaut et les filtres restent ouverts.
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
              Filtres déverrouillés ({courses.length} modules)
            </span>
          </div>
        )}

        {/* Secondary Filter Row: Category Pills with Counts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              {isFiltersLocked ? (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Filter className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>
                {isFiltersLocked
                  ? `Domaine Thématique (verrouillé sur le cursus ${profileConfig.shortLabel}) :`
                  : 'Domaine Thématique :'}
              </span>
            </span>
            <span className="text-slate-500 font-semibold">
              {filteredCourses.length} module{filteredCourses.length > 1 ? 's' : ''}{' '}
              {isFiltersLocked
                ? `habilité${filteredCourses.length > 1 ? 's' : ''} pour votre profil`
                : `disponible${filteredCourses.length > 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                disabled={isFiltersLocked}
                onClick={() => {
                  if (!isFiltersLocked) setSelectedCategory(cat);
                }}
                title={
                  isFiltersLocked
                    ? 'Filtre verrouillé en fonction de votre profil connecté'
                    : `Filtrer par ${cat}`
                }
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isFiltersLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/50'
                    : isFiltersLocked
                    ? 'bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 opacity-75'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isFiltersLocked && selectedCategory === cat && <Lock className="w-3 h-3 text-amber-300" />}
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
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
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              {isFiltersLocked && <Lock className="w-3 h-3 text-amber-500" />}
              <span>Public cible :</span>
            </span>
            <select
              value={selectedAudience}
              disabled={isFiltersLocked}
              onChange={(e) => {
                if (!isFiltersLocked) setSelectedAudience(e.target.value);
              }}
              title={isFiltersLocked ? 'Verrouillé sur votre profil connecté' : 'Filtrer par public cible'}
              className={`w-full text-xs rounded-lg px-2.5 py-1.5 font-bold ${
                isFiltersLocked
                  ? 'bg-slate-100 dark:bg-slate-800/90 border border-blue-300 dark:border-blue-800 text-slate-800 dark:text-slate-200 cursor-not-allowed opacity-90'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {audiences.map((aud) => (
                <option key={aud.roleKey} value={aud.roleKey}>{aud.label}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              {isFiltersLocked && <Lock className="w-3 h-3 text-amber-500" />}
              <span>Niveau :</span>
            </span>
            <select
              value={selectedLevel}
              disabled={isFiltersLocked}
              onChange={(e) => {
                if (!isFiltersLocked) setSelectedLevel(e.target.value);
              }}
              title={isFiltersLocked ? "Niveau verrouillé selon votre parcours d'habilitation" : 'Filtrer par niveau'}
              className={`w-full text-xs rounded-lg px-2.5 py-1.5 font-bold ${
                isFiltersLocked
                  ? 'bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-90'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {isFiltersLocked ? `${lvl} (Cursus complet du profil)` : lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              {isFiltersLocked && <Lock className="w-3 h-3 text-amber-500" />}
              <span>Statut :</span>
            </span>
            <select
              value={selectedStatus}
              disabled={isFiltersLocked}
              onChange={(e) => {
                if (!isFiltersLocked) setSelectedStatus(e.target.value);
              }}
              title={isFiltersLocked ? 'Statut verrouillé sur le cursus certifiant de votre profil' : 'Filtrer par statut'}
              className={`w-full text-xs rounded-lg px-2.5 py-1.5 font-bold ${
                isFiltersLocked
                  ? 'bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed opacity-90'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Certifiant">
                {isFiltersLocked ? `Certifiant Officiel ARMP (${profileConfig.shortLabel})` : 'Certifiant Officiel ARMP'}
              </option>
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
            const allExplicitCodes = regulatoryPillars.flatMap((p) => p.courseCodes);
            const pillarCourses = profileScopedCourses.filter(
              (c) =>
                pillar.courseCodes.includes(c.code) ||
                (!allExplicitCodes.includes(c.code) && c.category === pillar.categoryMatch)
            );
            
            // Only show courses matching profile + search
            const visiblePillarCourses = pillarCourses.filter((c) => 
              filteredCourses.some((fc) => fc.id === c.id)
            );

            if (visiblePillarCourses.length === 0) {
              return null;
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
                  {visiblePillarCourses.map((course) => {
                    const isDownloaded = currentProfile.offlineDownloads.includes(course.id);
                    const needsDfat = course.requiresDfatApproval && currentProfile.role === 'cgpmp_member';
                    const firstLesson = course.lessons[0];
                    const adaptation = firstLesson
                      ? getPersonalizedLessonAdaptation(course, firstLesson, 0, currentProfile)
                      : null;

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

                            {adaptation && (
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/70 dark:border-blue-800/60">
                                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{adaptation.profileBadge}</span>
                                </span>
                              </div>
                            )}

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

                    {/* Encadré d'adaptation directe au profil connecté (style Tutrice Virtuelle) */}
                    {course.lessons[0] && (() => {
                      const cardAdapt = getPersonalizedLessonAdaptation(course, course.lessons[0], 0, currentProfile);
                      return (
                        <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 p-2.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{cardAdapt.profileBadge}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
                            {cardAdapt.roleSpecificObjective}
                          </p>
                        </div>
                      );
                    })()}

                    {isAuthenticated && cardProgress > 0 && (() => {
                      const cardChapters = buildChapterGraphForCourse(
                        course,
                        completedLessonsMap[course.id] || [],
                        cardProgress
                      );
                      const isLastReadCard = lastReadEntry?.courseId === course.id;
                      const recentMatch = recentReadEntries.find((r) => r.courseId === course.id);
                      return (
                        <div className="pt-1.5 space-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-2.5">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3 text-blue-600" />
                              {isLastReadCard
                                ? '★ Dernière lecture'
                                : isCardCompleted
                                ? 'Cours lu & certifié'
                                : 'Graphique de lecture'}
                            </span>
                            <span className={isCardCompleted ? 'text-emerald-600 font-mono' : 'text-blue-600 font-mono'}>
                              {cardProgress}% {recentMatch ? `• ${recentMatch.readAtLabel}` : ''}
                            </span>
                          </div>

                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCardCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${cardProgress}%` }}
                            />
                          </div>

                          {/* Mini-graphique par chapitre sur la carte du catalogue */}
                          <div className="grid grid-cols-3 gap-1 pt-0.5">
                            {cardChapters.map((ch) => (
                              <div key={ch.index} className="bg-white dark:bg-slate-900 rounded px-1.5 py-1 border border-slate-200/60 dark:border-slate-700/60">
                                <div className="flex items-center justify-between text-[8px] font-mono font-bold text-slate-500">
                                  <span>{ch.shortLabel}</span>
                                  <span className={ch.isCompleted ? 'text-emerald-600' : 'text-blue-600'}>{ch.progressPct}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className={`h-full rounded-full ${ch.isCompleted ? 'bg-emerald-500' : ch.isCurrent ? 'bg-blue-600' : 'bg-slate-300'}`}
                                    style={{ width: `${ch.progressPct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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
              if (!isFiltersLocked) {
                setSelectedCategory('Tous');
                setSelectedLevel('Tous');
                setSelectedAudience('Tous');
                setSelectedStatus('Tous');
              }
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            {isFiltersLocked ? 'Effacer la recherche textuelle' : 'Réinitialiser les filtres'}
          </button>
        </div>
      )}

    </div>
  );
};
