import React, { useState } from 'react';
import { 
  Home,
  BookOpen, 
  Send,
  User, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  Building2, 
  Sparkles, 
  Bot,
  ChevronRight,
  UserPlus,
  FileText,
  BarChart3,
  GraduationCap,
  Eye,
  Crown,
  Camera,
  Shield,
  Bell,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
  Target,
  Play,
  Clock,
  Users,
  Briefcase
} from 'lucide-react';
import { UserProfile, UserRole, CourseModule } from '../types';
import { useLevelSettings, levelLabel, resolveLevelIndex } from '../utils/levelSettings';
import { COURSES_DATA } from '../data/coursesData';
import { computeUserLearningStats } from '../utils/learningStats';
import { ArmpLogo } from './ArmpLogo';

interface HeaderProps {
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onOpenRegister?: () => void;
  onLogout: () => void;
  currentProfile: UserProfile;
  allProfiles: Record<string, UserProfile>;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenTuteur?: () => void;
  onOpenPlacementQuiz?: () => void;
  totalCourses?: number;
  courses?: CourseModule[];
  onOpenCourse?: (course: CourseModule) => void;
  onNavigateProfileTab?: (tab: 'suivi' | 'publications' | 'apropos' | 'forum' | 'photos' | 'securite' | 'notifications') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  currentProfile,
  allProfiles,
  onSelectRole,
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  isOfflineMode,
  setIsOfflineMode,
  onOpenTuteur,
  onOpenPlacementQuiz,
  totalCourses: totalCoursesProp,
  courses: coursesProp,
  onOpenCourse,
  onNavigateProfileTab
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Niveaux paramétrables — suit les changements de l'espace admin
  const levelCfg = useLevelSettings();

  const RoleIcon = ({ role }: { role: UserRole }) => {
    switch(role) {
      case 'cgpmp_member': return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'ac_agent': return <Building2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'pme': return <Briefcase className="w-3.5 h-3.5 text-teal-400" />;
      case 'grande_entreprise': return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'societe_civile': return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case 'independant': return <User className="w-3.5 h-3.5 text-cyan-400" />;
      case 'armp_agent': return <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />;
      case 'dgcmp_agent': return <Eye className="w-3.5 h-3.5 text-purple-400" />;
      case 'dfat_admin': return <Crown className="w-3.5 h-3.5 text-amber-500" />;
      case 'super_admin': return <Crown className="w-3.5 h-3.5 text-blue-400" />;
      case 'formateur': return <GraduationCap className="w-3.5 h-3.5 text-amber-400" />;
      default: return <User className="w-3.5 h-3.5" />;
    }
  };

  const activeCoursesList = coursesProp && coursesProp.length > 0 ? coursesProp : COURSES_DATA;
  const learningStats = React.useMemo(
    () => computeUserLearningStats(currentProfile, activeCoursesList),
    [currentProfile, activeCoursesList]
  );
  const avgScoreDisplay = learningStats.averageScore;
  const overallProgress = learningStats.overallProgress;
  const completedCoursesCount = learningStats.completedCoursesCount;
  const totalCourses = totalCoursesProp ?? learningStats.totalCourses;
  const lastCourse = learningStats.lastLearningCourse;
  const lastCourseProgress = learningStats.lastCourseProgress;
  const lastCourseChapterGraph = learningStats.lastCourseChapterGraph;
  const recentReadEntries = learningStats.recentReadEntries;

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${
      isDarkMode 
        ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md' 
        : 'bg-slate-100/95 border-slate-300 text-slate-800 shadow-xs backdrop-blur-md'
    }`}>
      {/* Top Banner */}
      <div className="bg-[#0C3B7C] text-white text-[10px] sm:text-xs px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2 border-b border-[#0B3266]">
        <div className="flex items-center space-x-2 font-medium tracking-tight min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#E5B83B] animate-pulse shrink-0" />
            <span className="font-extrabold text-[#E5B83B] tracking-wide truncate">
              <span className="sm:hidden">RDC • ARMP</span>
              <span className="hidden sm:inline">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</span>
            </span>
          </div>
          <span className="text-blue-300/40 hidden md:inline">|</span>
          <span className="text-white/90 font-semibold hidden md:inline truncate">AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS (ARMP)</span>
          <span className="text-blue-300/40 hidden lg:inline">|</span>
          <span className="text-sky-200 hidden lg:inline font-mono font-medium text-[11px] shrink-0">Loi n° 10/010 du 27 avril 2010</span>
        </div>
        <div className="flex items-center space-x-2 text-[10.5px] shrink-0">
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-0.5 rounded-full transition font-bold text-[10px] sm:text-[10.5px] ${isOfflineMode ? 'bg-[#C89628] text-slate-950 shadow-xs' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            {isOfflineMode ? <WifiOff className="w-3 h-3 text-slate-950 shrink-0" /> : <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />}
            <span className="hidden xs:inline sm:inline">{isOfflineMode ? 'Mode Hors-ligne (Province)' : 'Portail En Ligne (Kinshasa)'}</span>
            <span className="xs:hidden sm:hidden">{isOfflineMode ? 'Hors-ligne' : 'En ligne'}</span>
          </button>
        </div>
      </div>

      {/* Main Bar — seulement Accueil + Catalogue + Demander */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          <div 
            onClick={() => setActiveTab('accueil')}
            className="flex items-center cursor-pointer group flex-shrink-0 select-none py-1"
          >
            <ArmpLogo size="md" isDarkMode={isDarkMode} className="transition-transform duration-200 group-hover:scale-[1.01]" />
          </div>

          {/* Menu principal épuré : uniquement Accueil / Catalogue / Demander */}
          <nav className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('accueil')}
              className={`px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 ${activeTab === 'accueil' ? (isDarkMode ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'bg-[#0C3B7C] text-white font-extrabold shadow-md shadow-blue-900/20') : (isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold' : 'text-slate-800 hover:text-[#0C3B7C] hover:bg-slate-200/80 font-bold')}`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'accueil' ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-700'}`} />
              <span>Accueil</span>
            </button>

            {isAuthenticated && currentProfile.role === 'super_admin' ? (
              /* Super admin : Catalogue remplacé par l'Espace Administrateur */
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 ${activeTab === 'admin' ? (isDarkMode ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'bg-[#0C3B7C] text-white font-extrabold shadow-md shadow-blue-900/20') : (isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold' : 'text-slate-800 hover:text-[#0C3B7C] hover:bg-slate-200/80 font-bold')}`}
              >
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-700'}`} />
                <span>Espace Administrateur</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${activeTab === 'admin' ? 'bg-white/20 text-white' : isDarkMode ? 'bg-slate-800 text-blue-300 border border-blue-500/40' : 'bg-blue-100 text-blue-800 border border-blue-300/60'}`}>
                  Super Admin
                </span>
              </button>
            ) : (
            <button
              onClick={() => setActiveTab('catalogue')}
              className={`px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 ${activeTab === 'catalogue' || activeTab === 'cours' ? (isDarkMode ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'bg-[#0C3B7C] text-white font-extrabold shadow-md shadow-blue-900/20') : (isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold' : 'text-slate-800 hover:text-[#0C3B7C] hover:bg-slate-200/80 font-bold')}`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'catalogue' || activeTab === 'cours' ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-700'}`} />
              <span>Catalogue</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${activeTab === 'catalogue' || activeTab === 'cours' ? 'bg-white/20 text-white' : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'}`}>{totalCourses}</span>
            </button>
            )}

            {/* Demander visible en déconnecté ou si rôle ≠ formateur ; Espace Formateur uniquement si connecté + formateur */}
            {(!isAuthenticated || currentProfile.role !== 'formateur') && (
              <button
                onClick={() => setActiveTab('demander')}
                className={`px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 ${activeTab === 'demander' || activeTab === 'workflow' || activeTab === 'cgpmp-workflow' ? (isDarkMode ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'bg-[#0C3B7C] text-white font-extrabold shadow-md shadow-blue-900/20') : (isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold' : 'text-slate-800 hover:text-[#0C3B7C] hover:bg-slate-200/80 font-bold')}`}
              >
                <Send className={`w-4 h-4 ${activeTab === 'demander' || activeTab === 'workflow' || activeTab === 'cgpmp-workflow' ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-700'}`} />
                <span>Demander</span>
              </button>
            )}

            {isAuthenticated && currentProfile.role === 'formateur' && (
              <button
                onClick={() => setActiveTab('formateur')}
                className={`px-4 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 ${activeTab === 'formateur' || activeTab === 'studio-formateur' ? (isDarkMode ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/25') : (isDarkMode ? 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold' : 'text-slate-800 hover:text-[#0C3B7C] hover:bg-slate-200/80 font-bold')}`}
              >
                <GraduationCap className={`w-4 h-4 ${activeTab === 'formateur' || activeTab === 'studio-formateur' ? 'text-slate-950' : isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>Espace Formateur</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${activeTab === 'formateur' || activeTab === 'studio-formateur' ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40'}`}>
                  Studio
                </span>
              </button>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <div className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-xs'}`}>
                <RoleIcon role={currentProfile.role} />
                <span className="truncate max-w-[110px]">{currentProfile.roleTitle.split('(')[0].trim()}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${resolveLevelIndex(currentProfile.level, currentProfile.levelKey, levelCfg) === 3 ? 'bg-amber-500' : resolveLevelIndex(currentProfile.level, currentProfile.levelKey, levelCfg) === 2 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              </div>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button onClick={onOpenRegister || onOpenLogin} className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-blue-600/40 text-blue-700 dark:text-blue-400 dark:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs transition">
                  <UserPlus className="w-3.5 h-3.5" /><span>S'inscrire</span>
                </button>
                <button onClick={onOpenLogin} className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#114488] hover:bg-[#0c3b7c] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition active:scale-95">
                  <LogIn className="w-4 h-4" /><span>Se connecter</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 sm:pl-2 sm:pr-3 rounded-2xl border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 shadow-xs transition"
                >
                  <div className="relative">
                    <img src={currentProfile.avatarUrl} alt={currentProfile.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border-2 border-[#114488]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{currentProfile.name.split(' ')[0]} {currentProfile.name.split(' ')[1] ? currentProfile.name.split(' ')[1][0] + '.' : ''}</div>
                    <div className="text-[10px] text-[#114488] dark:text-blue-400 font-semibold truncate max-w-[120px]">{currentProfile.roleTitle}</div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-80 sm:w-88 sm:max-w-none bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100 dark:divide-slate-800 max-h-[85vh] overflow-y-auto">
                      <div className="px-4 pb-3">
                        <div className="flex items-center space-x-3">
                          <img src={currentProfile.avatarUrl} alt={currentProfile.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-2xl object-cover border-2 border-[#114488] shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{currentProfile.name}</div>
                            <div className="text-xs font-bold text-[#114488] dark:text-blue-400 truncate">{currentProfile.roleTitle}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentProfile.email}</div>
                          </div>
                        </div>
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-[#114488] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-[11px] leading-snug">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{currentProfile.institution}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[10px]">Niveau {levelLabel(currentProfile.level, currentProfile.levelKey, levelCfg)} • {currentProfile.certificationsCount} certification(s)</span>
                          </div>
                        </div>

                      </div>

                      {/* Autres items — seulement en mode connecté */}
                      <div className="p-2 space-y-1">
                        <p className="px-3 pt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Espace connecté</p>
                        <button onClick={() => { setActiveTab('profil'); setIsProfileMenuOpen(false); if(onNavigateProfileTab) onNavigateProfileTab('suivi'); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#114488] dark:hover:text-blue-300 flex items-center justify-between transition">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300"><User className="w-4 h-4" /></div>
                            <div><span className="block font-bold">Mon Profil & Habilitations</span><span className="text-[10px] text-slate-500 font-normal">Certificats et suivi</span></div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                        {/* Niveau d'évolution — ProgressBar + Graphique du cours lu + Dernière lecture & Récentes lectures */}
                        <div className="mx-1 my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Progression & Lecture ({completedCoursesCount}/{totalCourses})
                            </span>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">
                              {overallProgress}%
                            </span>
                          </div>
                          <div
                            className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5"
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

                          {/* Dernière lecture + Graphique par chapitre du cours lu */}
                          {lastCourse && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-800/70 space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> Dernière lecture
                                </span>
                                <span className="text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> {learningStats.lastCourseReadAtLabel}
                                </span>
                              </div>

                              <div className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-1">
                                {lastCourse.code} — {lastCourse.title}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {learningStats.lastCourseNextLessonLabel}
                              </div>

                              {/* Mini Graphique des chapitres du cours lu */}
                              {lastCourseChapterGraph.length > 0 && (
                                <div className="pt-1 space-y-1">
                                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                                    <span>Graphique du cours lu (chapitres)</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-mono">{lastCourseProgress}%</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 items-end h-10 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                                    {lastCourseChapterGraph.map((ch) => (
                                      <div key={ch.index} className="flex flex-col items-center gap-0.5 h-full justify-end">
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-xs h-5 flex items-end overflow-hidden">
                                          <div
                                            className={`w-full rounded-xs transition-all ${
                                              ch.isCompleted
                                                ? 'bg-emerald-500'
                                                : ch.isCurrent
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300 dark:bg-slate-600'
                                            }`}
                                            style={{ height: `${Math.max(20, ch.progressPct)}%` }}
                                          />
                                        </div>
                                        <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                          {ch.shortLabel}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {onOpenCourse && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsProfileMenuOpen(false);
                                    onOpenCourse(lastCourse);
                                  }}
                                  className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Reprendre la lecture ({lastCourseProgress}%)</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Récentes lectures */}
                          {recentReadEntries.length > 1 && (
                            <div className="space-y-1 pt-0.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block px-0.5">
                                Récentes lectures ({recentReadEntries.length})
                              </span>
                              <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                                {recentReadEntries.slice(0, 3).map((entry) => (
                                  <button
                                    key={entry.courseId}
                                    type="button"
                                    onClick={() => {
                                      setIsProfileMenuOpen(false);
                                      if (onOpenCourse) onOpenCourse(entry.course);
                                    }}
                                    className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-left transition flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {entry.code} • {entry.title}
                                      </div>
                                      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                        <div
                                          className={`h-full rounded-full ${entry.progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                          style={{ width: `${entry.progressPct}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                      {entry.progressPct}%
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {levelLabel(currentProfile.level, currentProfile.levelKey, levelCfg)}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Target className="w-3 h-3 text-blue-600" /> Score : {avgScoreDisplay}%
                            </span>
                          </div>
                        </div>
                        {currentProfile.role === 'formateur' && (
                          <button onClick={() => { setActiveTab('formateur'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center justify-between transition">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300"><GraduationCap className="w-4 h-4" /></div>
                              <div><span className="block font-bold">Espace Formateur & Studio</span><span className="text-[10px] text-slate-500 font-normal">Création de cours & Vidéo Masterclass</span></div>
                            </div>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">Studio</span>
                          </button>
                        )}
                        <button onClick={() => { setActiveTab('textes'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-between transition">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300"><FileText className="w-4 h-4" /></div>
                            <div><span className="block font-bold">Bibliothèque</span><span className="text-[10px] text-slate-500 font-normal">Loi 10/010, décrets, DAO</span></div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                        {currentProfile.role !== 'particulier' && (
                          <button onClick={() => { setActiveTab('dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center justify-between transition">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300"><BarChart3 className="w-4 h-4" /></div>
                              <div><span className="block font-bold">Observatoire</span><span className="text-[10px] text-slate-500 font-normal">Tableaux de bord DFAT</span></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                        {(currentProfile.role === 'dfat_admin' || currentProfile.role === 'super_admin') && (
                          <button onClick={() => { setActiveTab('admin'); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between transition">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300"><ShieldCheck className="w-4 h-4" /></div>
                              <div><span className="block font-bold">Espace Administrateur</span><span className="text-[10px] text-slate-500 font-normal">Formateurs, tests de niveau & dashboard</span></div>
                            </div>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-700 text-white">Admin</span>
                          </button>
                        )}
                        {onOpenTuteur && (
                          <button onClick={() => { onOpenTuteur(); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 flex items-center justify-between transition">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300"><Bot className="w-4 h-4" /></div>
                              <div><span className="block font-bold">Tuteur IA</span><span className="text-[10px] text-slate-500 font-normal">Loi 10/010</span></div>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">IA</span>
                          </button>
                        )}
                        {onOpenPlacementQuiz && (
                          <button onClick={() => { onOpenPlacementQuiz(); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between transition">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#114488] dark:text-blue-300"><Sparkles className="w-4 h-4" /></div>
                              <div><span className="block font-bold">Test de Positionnement</span><span className="text-[10px] text-slate-500 font-normal">Évaluer mon niveau</span></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </div>

                      {/* Sélecteur rapide de profil démo institutionnel selon les 4 catégories */}
                      <div className="p-2.5 pt-2 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-80 overflow-y-auto">
                        <p className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-400 flex items-center justify-between">
                          <span>Changer de profil officiel</span>
                          <span className="text-amber-500 font-bold">Instantané</span>
                        </p>

                        {/* 1. Autorité Contractante */}
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 px-1 mb-1">🏛️ Autorité Contractante</p>
                          <div className="grid grid-cols-1 gap-1">
                            <button
                              onClick={() => { onSelectRole('cgpmp_member'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'cgpmp_member' ? 'bg-[#0C3B7C] text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50'}`}
                            >
                              <span className="truncate">Membre de la cellule (CGPMP)</span>
                              {currentProfile.role === 'cgpmp_member' && <span className="text-[10px]">✓</span>}
                            </button>
                            <button
                              onClick={() => { onSelectRole('ac_agent'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'ac_agent' ? 'bg-[#0C3B7C] text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50'}`}
                            >
                              <span className="truncate">Autre agent AC (DAF / Audit)</span>
                              {currentProfile.role === 'ac_agent' && <span className="text-[10px]">✓</span>}
                            </button>
                          </div>
                        </div>

                        {/* 2. Opérateurs Économiques */}
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 px-1 mb-1">🏢 Opérateurs Économiques</p>
                          <div className="grid grid-cols-1 gap-1">
                            <button
                              onClick={() => { onSelectRole('pme'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'pme' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50'}`}
                            >
                              <span className="truncate">PME & Sous-traitant (Loi 17/001)</span>
                              {currentProfile.role === 'pme' && <span className="text-[10px]">✓</span>}
                            </button>
                            <button
                              onClick={() => { onSelectRole('grande_entreprise'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'grande_entreprise' ? 'bg-teal-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-teal-50'}`}
                            >
                              <span className="truncate">Grandes entreprises (BTP / Travaux)</span>
                              {currentProfile.role === 'grande_entreprise' && <span className="text-[10px]">✓</span>}
                            </button>
                          </div>
                        </div>

                        {/* 3 & 4. Sociétés Civiles & Indépendant */}
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-500 px-1 mb-1">⚖️ Société Civile & 👤 Indépendant</p>
                          <div className="grid grid-cols-1 gap-1">
                            <button
                              onClick={() => { onSelectRole('societe_civile'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'societe_civile' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50'}`}
                            >
                              <span className="truncate">Sociétés civiles (Observatoire)</span>
                              {currentProfile.role === 'societe_civile' && <span className="text-[10px]">✓</span>}
                            </button>
                            <button
                              onClick={() => { onSelectRole('independant'); setIsProfileMenuOpen(false); }}
                              className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition flex items-center justify-between gap-1.5 ${currentProfile.role === 'independant' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-50'}`}
                            >
                              <span className="truncate">Indépendant (Consultant & Expert)</span>
                              {currentProfile.role === 'independant' && <span className="text-[10px]">✓</span>}
                            </button>
                          </div>
                        </div>

                        {/* Autres : ARMP, DGCMP, Formateur */}
                        <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1">
                          <button
                            onClick={() => { onSelectRole('armp_agent'); setIsProfileMenuOpen(false); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${currentProfile.role === 'armp_agent' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            ⚖️ ARMP
                          </button>
                          <button
                            onClick={() => { onSelectRole('dgcmp_agent'); setIsProfileMenuOpen(false); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${currentProfile.role === 'dgcmp_agent' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            🛡️ DGCMP
                          </button>
                          <button
                            onClick={() => { onSelectRole('formateur'); setIsProfileMenuOpen(false); }}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${currentProfile.role === 'formateur' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            🎓 Formateur
                          </button>
                        </div>
                      </div>

                      <div className="p-2 pt-2">
                        <button onClick={() => { setIsProfileMenuOpen(false); onLogout(); }} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 transition">
                          <LogOut className="w-4 h-4" /><span>Se déconnecter</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer — seulement Catalogue / Demander + profil connecté */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-in slide-in-from-top-2 shadow-lg max-h-[85vh] overflow-y-auto">
          <button onClick={() => { setActiveTab('accueil'); setIsMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${activeTab === 'accueil' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#0C3B7C] text-white') : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100')}`}>
            <Home className="w-4 h-4" /><span>Accueil</span>
          </button>
          {isAuthenticated && currentProfile.role === 'super_admin' ? (
            <button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${activeTab === 'admin' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#0C3B7C] text-white') : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100')}`}>
              <ShieldCheck className="w-4 h-4" /><span>Espace Administrateur</span>
            </button>
          ) : (
          <button onClick={() => { setActiveTab('catalogue'); setIsMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between ${activeTab === 'catalogue' || activeTab === 'cours' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#0C3B7C] text-white') : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100')}`}>
            <div className="flex items-center space-x-2.5"><BookOpen className="w-4 h-4" /><span>Catalogue des formations</span></div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${activeTab === 'catalogue' || activeTab === 'cours' ? 'bg-white/20 text-white' : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-900'}`}>{totalCourses}</span>
          </button>
          )}
          {(!isAuthenticated || currentProfile.role !== 'formateur') && (
            <button onClick={() => { setActiveTab('demander'); setIsMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-xs font-bold flex items-center space-x-2.5 ${activeTab === 'demander' || activeTab === 'workflow' ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#0C3B7C] text-white') : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100')}`}>
              <Send className="w-4 h-4" /><span>Demander</span>
            </button>
          )}
          {isAuthenticated && currentProfile.role === 'formateur' && (
            <button onClick={() => { setActiveTab('formateur'); setIsMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between ${activeTab === 'formateur' || activeTab === 'studio-formateur' ? (isDarkMode ? 'bg-amber-500 text-slate-950 font-black' : 'bg-amber-400 text-slate-950 font-black') : (isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100')}`}>
              <div className="flex items-center space-x-2.5">
                <GraduationCap className={`w-4 h-4 ${activeTab === 'formateur' ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>Espace Formateur & Studio</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Studio
              </span>
            </button>
          )}

          {isAuthenticated && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Espace connecté</p>
              <button onClick={() => { setActiveTab('profil'); setIsMobileMenuOpen(false); if(onNavigateProfileTab) onNavigateProfileTab('suivi'); }} className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${activeTab === 'profil' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center space-x-2"><User className="w-4 h-4 text-purple-600" /><span>Mon Profil & Suivi</span></div><ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { id: 'suivi' as const, label: 'Suivi', icon: TrendingUp },
                  { id: 'publications' as const, label: 'Publications', icon: FileText },
                  { id: 'apropos' as const, label: 'À propos', icon: User },
                  { id: 'forum' as const, label: 'Diplômes', icon: MessageSquare },
                  { id: 'photos' as const, label: 'Photos', icon: ImageIcon },
                  { id: 'securite' as const, label: 'Sécurité', icon: Shield },
                  { id: 'notifications' as const, label: 'Alertes', icon: Bell },
                ].map((s) => (
                  <button key={s.id} onClick={() => { setActiveTab('profil'); setIsMobileMenuOpen(false); if(onNavigateProfileTab) onNavigateProfileTab(s.id); }} className="px-2 py-2 rounded-lg bg-white dark:bg-slate-800 border text-[11px] font-bold flex flex-col items-center gap-1 hover:bg-blue-50">
                    <s.icon className="w-4 h-4 text-blue-600" />{s.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { setActiveTab('textes'); setIsMobileMenuOpen(false); }} className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center space-x-2"><FileText className="w-4 h-4 text-emerald-600" /><span>Bibliothèque</span></button>
              <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center space-x-2"><BarChart3 className="w-4 h-4 text-amber-600" /><span>Observatoire</span></button>
              {(currentProfile.role === 'dfat_admin' || currentProfile.role === 'super_admin') && (
                <button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-blue-600" /><span>Espace Administrateur</span></button>
              )}
              {onOpenTuteur && <button onClick={() => { onOpenTuteur(); setIsMobileMenuOpen(false); }} className="w-full p-2.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 flex items-center space-x-2"><Bot className="w-4 h-4 text-amber-600" /><span>Tuteur IA</span></button>}

            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {!isAuthenticated ? (
              <>
                <button onClick={() => { if(onOpenRegister) onOpenRegister(); else onOpenLogin(); setIsMobileMenuOpen(false); }} className="w-full py-2.5 rounded-xl border border-blue-600/50 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center space-x-2 bg-blue-50/60 dark:bg-blue-950/40"><UserPlus className="w-4 h-4" /><span>Créer un compte</span></button>
                <button onClick={() => { onOpenLogin(); setIsMobileMenuOpen(false); }} className="w-full py-2.5 rounded-xl bg-[#114488] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm"><LogIn className="w-4 h-4" /><span>Se connecter</span></button>
              </>
            ) : (
              <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center space-x-2 border border-rose-200 dark:border-rose-900/50"><LogOut className="w-4 h-4" /><span>Se déconnecter</span></button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
