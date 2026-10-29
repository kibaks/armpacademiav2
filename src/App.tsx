import { operationsApi } from './lib/operationsApi';
import { downloadOperation } from './lib/operationsApi';
import { InitiationPathway } from './components/InitiationPathway';
import type { LearningStage } from '../shared/learnerProgression';
import { getLearnerOnboarding } from './utils/learnerOnboarding';
import { authenticatedFetch } from './lib/adminApi';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { TutorialSection } from './components/TutorialSection';
import { ContenuLocalSection } from './components/ContenuLocalSection';
import { 
  HeroSlider 
} from './components/HeroSlider';
import { 
  CourseCatalog 
} from './components/CourseCatalog';
import { 
  CourseWindow 
} from './components/CourseWindow';
import { 
  CgpmpWorkflowBoard 
} from './components/CgpmpWorkflowBoard';
import { 
  AnalyticsDashboard 
} from './components/AnalyticsDashboard';
import { SkeletonLoader } from './components/SkeletonLoader';
const AdminSpace = React.lazy(() => import('./components/AdminSpace').then(m => ({ default: m.AdminSpace })));
import { 
  LegalDocsViewer 
} from './components/LegalDocsViewer';
import { 
  AITutorModal 
} from './components/AITutorModal';
import { 
  PlacementQuizModal 
} from './components/PlacementQuizModal';
import { 
  Footer 
} from './components/Footer';
import { 
  AuthModal 
} from './components/AuthModal';
import { 
  CoursePreviewModal 
} from './components/CoursePreviewModal';
import {
  CourseAnimaticModal
} from './components/CourseAnimaticModal';
import { 
  UserProfileView 
} from './components/UserProfileView';
import { 
  TrainerPortal 
} from './components/TrainerPortal';
import { InstitutionalPreloader } from './components/InstitutionalPreloader';
import { ArmpLogo } from './components/ArmpLogo';

import { 
  UserRole, 
  UserProfile, 
  CourseModule, 
  TrainingRequest,
  CgpmpAccountCreationRequest,
  NiveauValidation
} from './types';
import { DEMO_PROFILES, INITIAL_TRAINING_REQUESTS } from './data/initialData';
import { COURSES_DATA } from './data/coursesData';
import { applyProfileMedia, changedProfileFields, mediaPatch, rollbackProfileMedia } from './utils/profileMediaSync';
import { computeUserLearningStats, recordCourseReadingInProfile } from './utils/learningStats';
import { readModuleAuthors, recordModuleAuthor } from './utils/moduleAuthors';
import { getLevelSettings, levelKeyFromLabel } from './utils/levelSettings';
import { 
  auth, 
  getOrInitUserProfile, 
  syncUserProfileToFirestore,
  subscribeProfileMedia,
  saveProfileToLocalRegistry, 
  saveTrainingRequestToFirestore, 
  fetchTrainingRequestsFromFirestore, 
  getLocalCgpmpAccountRequests,
  saveCgpmpAccountRequestToFirestore,
  fetchCgpmpAccountRequestsFromFirestore,
  validateCgpmpAccountRequestByArmp,
  rejectCgpmpAccountRequestByArmp,
  fetchCustomCoursesFromFirestore,
  saveCustomCourseToFirestore,
  deleteCustomCourseFromFirestore,
  fetchAllUserProfilesFromFirestore,
  testFirestoreConnection,
  restoreBackendSession,
  firebaseLogout 
} from './firebase';
import { onIdTokenChanged } from 'firebase/auth';

import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Scale, 
  Award, 
  ArrowRight, 
  FileText, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  LogIn,
  User,
  Eye,
  RefreshCw,
  Phone,
  Waves,
  Video
} from 'lucide-react';

import imgMentor from './assets/images/mentor_juriste_africain_1789983212035.jpg';

export default function App() {
  // Preloader State
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [preloaderStatus, setPreloaderStatus] = useState<string>("Démarrage du système ACADEMIA ITECH...");

  // Navigation & Role State (Persisted across page refreshes)
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('armp_active_tab') || 'accueil';
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('armp_current_role') as UserRole) || 'cgpmp_member';
  });
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>(DEMO_PROFILES);
  const [firestoreProfiles, setFirestoreProfiles] = useState<UserProfile[]>([]);

  // Authentication & Session State
  const pendingMedia = useRef<{ uid: string; patch: Partial<UserProfile> } | null>(null);
  const sessionGeneration = useRef(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingCourseForAuth, setPendingCourseForAuth] = useState<CourseModule | null>(null);

  // App Features State
  const normalizeCourseToAnimation = (c: CourseModule): CourseModule => {
    const tplCycle: Array<'whiteboard' | 'infographic' | 'timeline' | 'isometric' | 'flat' | 'character'> = [
      'whiteboard',
      'infographic',
      'timeline',
      'isometric',
      'flat',
      'character'
    ];
    const seed = (c.code || c.id || '')
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return {
      ...c,
      lessons: (c.lessons || []).map((l, idx) => ({
        ...l,
        format: l.format || 'animation',
        templateId:
          l.templateId && l.templateId !== 'whiteboard'
            ? l.templateId
            : tplCycle[(idx + seed) % tplCycle.length]
      }))
    };
  };

  const [courses, setCourses] = useState<CourseModule[]>(() => {
    const officialNormalized = COURSES_DATA.map(normalizeCourseToAnimation);
    const officialIds = new Set(officialNormalized.map((c) => c.id));
    try {
      const saved = localStorage.getItem('armp_courses_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const extraCustom = parsed
            .filter((c: CourseModule) => c && c.id && !officialIds.has(c.id))
            .map(normalizeCourseToAnimation);
          return [...officialNormalized, ...extraCustom];
        }
      }
    } catch (e) {
      console.warn("Could not read custom courses", e);
    }
    return officialNormalized;
  });
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [cgpmpAccountRequests, setCgpmpAccountRequests] = useState<CgpmpAccountCreationRequest[]>(() => {
    return getLocalCgpmpAccountRequests();
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('armp_theme');
    // Par défaut : MODE JOUR (light) — même si la machine est en nuit, on reste en clair
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // Aucune préférence enregistrée → force light et nettoie
    localStorage.setItem('armp_theme', 'light');
    document.documentElement.classList.remove('dark');
    return false;
  });
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isOffline,setIsOffline]=useState(!navigator.onLine);
  useEffect(()=> {const online=()=>setIsOffline(false),offline=()=>setIsOffline(true);window.addEventListener('online',online);window.addEventListener('offline',offline);return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',offline);};},[]);

  // Modals State
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorInitialQuestion, setTutorInitialQuestion] = useState<string | null>(null);
  const [tutorInitialAction, setTutorInitialAction] = useState<'chat' | 'call' | 'video' | 'voice' | null>(null);
  const [tutorInitialPersona, setTutorInitialPersona] = useState<'henri' | 'denise' | 'charline' | 'vivienne' | 'eloise' | null>(null);
  const [pendingTutorAfterAuth, setPendingTutorAfterAuth] = useState(false);
  const [pendingPlacementAfterAuth, setPendingPlacementAfterAuth] = useState(false);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [selectedCourseForPlayer, setSelectedCourseForPlayer] = useState<CourseModule | null>(null);
  const [preselectedCourseForCgpmp, setPreselectedCourseForCgpmp] = useState<CourseModule | null>(null);
  const [previewCourse, setPreviewCourse] = useState<CourseModule | null>(null);
  const [animaticCourse, setAnimaticCourse] = useState<CourseModule | null>(null);

  // Breadcrumbs Contextual State
  const [subCategoryBreadcrumb, setSubCategoryBreadcrumb] = useState<string | null>(null);
  const [subDetailBreadcrumb, setSubDetailBreadcrumb] = useState<string | null>(null);

  // Authentication Mode (login vs register vs forgot_password)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [authModalEntry, setAuthModalEntry] = useState<'creation' | 'demande'>('creation');

  // Profile Facebook SubTab state
  const [profileSubTab, setProfileSubTab] = useState<'suivi' | 'publications' | 'apropos' | 'forum' | 'photos' | 'securite' | 'notifications'>('suivi');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Persist Active Tab to localStorage
  useEffect(() => {
    localStorage.setItem('armp_active_tab', activeTab);
  }, [activeTab]);

  // 2. Persist Dark Mode & Apply Class
  useEffect(() => {
    localStorage.setItem('armp_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 3. Persist Current Role
  useEffect(() => {
    localStorage.setItem('armp_current_role', currentRole);
  }, [currentRole]);

  // Backend JWT authenticates the session; Firebase bridges direct Firestore access.
  useEffect(() => {
    const timeout = window.setTimeout(() => setIsAppLoading(false), 12000);
    const reset = () => {
      setIsAuthenticated(false);
      setProfiles(DEMO_PROFILES);
      setFirestoreProfiles([]);
      setRequests([]);
      setCgpmpAccountRequests([]);
      setSelectedCourseForPlayer(null);
      setIsTutorOpen(false);
      setIsPlacementOpen(false);
      localStorage.removeItem('armp_session_profile');
      localStorage.removeItem('academia_cgpmp_member_credentials_v1');
    };
    let lastSessionUid: string | null = null;
    const restore = async () => {
      const generation = ++sessionGeneration.current;
      const user = auth.currentUser;
      const active = () => generation === sessionGeneration.current && auth.currentUser === user;
      if (!user || lastSessionUid !== user.uid) reset();
      // Keep the verified identity visible while refreshing the same session.
      // Invalid sessions and identity changes still reset through the checks below.
      try {
        if (!user) return;
        const token = await user.getIdTokenResult();
        if (!active() || !token.claims.appSessionId) return;
        const response = await authenticatedFetch('/api/auth/session');
        const session = await response.json();
        if (!active()) return;
        if (!response.ok) {
          reset(); lastSessionUid = null;
          if (session.code === 'MFA_REQUIRED') { setAuthModalMode('login'); setIsAuthModalOpen(true); }
          else if (['SESSION_INVALID', 'AUTH_REQUIRED'].includes(session.code)) { setAuthModalMode('login'); setIsAuthModalOpen(true); await firebaseLogout(); }
          else if (session.code !== 'PROFILE_REQUIRED') showToast(session.error || 'Session indisponible.');
          return;
        }
        const profile = await getOrInitUserProfile(user);
        if (!active() || session.uid !== user.uid) return;
        lastSessionUid = user.uid;
        setCurrentRole(profile.role);
        setProfiles(previous => {
          const existing = previous[profile.role];
          let restored = existing?.id === profile.id && (existing.mediaRevision || 0) > (profile.mediaRevision || 0) ? applyProfileMedia(profile, existing) : profile;
          if (pendingMedia.current?.uid === user.uid) restored = { ...restored, ...pendingMedia.current.patch };
          return { ...DEMO_PROFILES, [profile.role]: restored };
        });
        setIsAuthenticated(true);
        localStorage.setItem('armp_session_profile', JSON.stringify(profile));
        const [requests, courses, profiles, accounts] = await Promise.all([
          fetchTrainingRequestsFromFirestore(), fetchCustomCoursesFromFirestore(),
          fetchAllUserProfilesFromFirestore(), fetchCgpmpAccountRequestsFromFirestore()
        ]);
        if (!active()) return;
        setRequests(requests);
        setFirestoreProfiles(profiles);
        setCgpmpAccountRequests(accounts);
        if (courses) {
          const map = new Map<string, CourseModule>();
          COURSES_DATA.forEach(c => map.set(c.id, normalizeCourseToAnimation(c)));
          courses.filter(c => !COURSES_DATA.some(official => official.id===c.id && official.level==='Fondamental')).forEach(c => map.set(c.id, normalizeCourseToAnimation(c)));
          setCourses(Array.from(map.values()));
        }
      } catch { if (active()) showToast('Chargement de la session ou des données indisponible. Réessayez.'); }
      finally { if (active()) setIsAppLoading(false); }
    };
    const required = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.uid !== auth.currentUser?.uid) return;
      ++sessionGeneration.current;
      reset();
      setAuthModalMode('login'); setIsAuthModalOpen(true);
      if (detail.code !== 'MFA_REQUIRED') void firebaseLogout().catch(() => {});
    };
    const refreshed = () => { void restore(); };
    const unsubscribe = onIdTokenChanged(auth, () => { void restore(); });
    void restoreBackendSession().catch(() => showToast('Restauration de session indisponible. Réessayez.'));
    window.addEventListener('academia-session-required', required);
    window.addEventListener('academia-session-verified', refreshed);
    return () => {
      ++sessionGeneration.current;
      window.clearTimeout(timeout); unsubscribe();
      window.removeEventListener('academia-session-required', required);
      window.removeEventListener('academia-session-verified', refreshed);
    };
  }, []);

  const storedProfile = profiles[currentRole] || profiles['cgpmp_member'];
  const [verifiedStage, setVerifiedStage] = useState<{ uid: string; stage: LearningStage } | null>(null);
  const [initiationDeadline, setInitiationDeadline] = useState<{ uid: string; expiresAt: number; enforced: boolean } | null>(null);
  useEffect(() => {
    if (!isAuthenticated) { setVerifiedStage(null); return; }
    const abort = new AbortController();
    void authenticatedFetch('/api/learning-level', { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('level-unavailable');
      const data = await response.json();
      if (!abort.signal.aborted) setVerifiedStage({ uid: storedProfile.id, stage: data.stage });
      if (!abort.signal.aborted) setInitiationDeadline(data.initiation?.required && typeof data.initiation.expiresAt === 'number' ? { uid: storedProfile.id, expiresAt: data.initiation.expiresAt, enforced: data.initiation.enforced === true } : null);
    }).catch(() => { if (!abort.signal.aborted) showToast('Vérification du niveau indisponible. Le parcours d’initiation reste accessible.'); });
    return () => abort.abort();
  }, [isAuthenticated, storedProfile.id]);
  const confirmedStage = verifiedStage?.uid === storedProfile.id ? verifiedStage.stage : 'Initiation';
  useEffect(() => {
    if (!isAuthenticated || confirmedStage !== 'Initiation' || initiationDeadline?.uid !== storedProfile.id || !initiationDeadline.enforced) return;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('academia-session-required', { detail: { uid: storedProfile.id, code: 'MFA_REQUIRED' } }));
    }, Math.max(0, initiationDeadline.expiresAt - Date.now()) + 100);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, confirmedStage, initiationDeadline, storedProfile.id]);
  const currentProfile: UserProfile = useMemo(() => ['super_admin', 'dfat_admin', 'formateur'].includes(storedProfile.role) ? storedProfile : {
    ...storedProfile, niveauValidation: confirmedStage,
    level: confirmedStage === 'Initiation' ? 'Débutant' : confirmedStage === 'Approfondi' ? 'Intermédiaire' : 'Avancé',
    levelKey: confirmedStage === 'Initiation' ? 'debutant' : confirmedStage === 'Approfondi' ? 'intermediaire' : 'avance'
  }, [storedProfile, confirmedStage]);
  const onboarding = getLearnerOnboarding(currentProfile, courses);
  // Start in initiation on sign-in, without trapping subsequent portal/profile navigation.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (onboarding.required) setActiveTab('initiation');
    else setActiveTab(tab => tab === 'initiation' ? 'catalogue' : tab);
  }, [isAuthenticated, currentProfile.id, onboarding.required]);


  useEffect(() => {
    const uid = currentProfile.id;
    if (!isAuthenticated || auth.currentUser?.uid !== uid) return;
    let active = true;
    const unsubscribe = subscribeProfileMedia(uid, media => {
      if (!active || auth.currentUser?.uid !== uid) return;
      const pending = pendingMedia.current;
      if (pending?.uid === uid) media = { ...media, ...pending.patch };
      setProfiles(previous => Object.fromEntries(Object.entries(previous).map(([role, profile]) =>
        [role, profile.id === uid ? applyProfileMedia(profile, media) : profile]
      )));
      setFirestoreProfiles(previous => previous.map(profile => profile.id === uid ? applyProfileMedia(profile, media) : profile));
    }, () => { if (active) showToast('Synchronisation des photos interrompue. Rechargez la page pour réessayer.'); });
    return () => { active = false; unsubscribe(); };
  }, [isAuthenticated, currentProfile.id]);

  useEffect(() => {
    if (!isAuthenticated || auth.currentUser?.uid !== currentProfile.id) return;
    localStorage.setItem('armp_session_profile', JSON.stringify(currentProfile));
    saveProfileToLocalRegistry(currentProfile);
  }, [isAuthenticated, currentProfile]);



  // Tutor learning context — utilise la progression réelle persistée du profil
  const tutorLearningContext = React.useMemo(() => {
    const stats = computeUserLearningStats(currentProfile, courses);
    const last = stats.lastLearningCourse;
    if (!last) return null;
    const lastProgress = stats.lastCourseProgress;
    const lastExcerpt = (last.lessons && last.lessons[0]) ? `${last.lessons[0].title} — ${last.lessons[0].content.slice(0, 380)}` : '';
    const lastLessons = last.lessons ? last.lessons.map((l: any) => l.title).join(' | ') : '';
    const recent = stats.recentCourses.length > 0 ? stats.recentCourses : [last];
    return {
      lastCourseTitle: last.title,
      lastCourseCode: last.code,
      lastCourseCategory: last.category,
      lastCourseProgress: lastProgress,
      recentTitles: recent.map(r => `${r.title} (${stats.courseProgressMap[r.id] ?? 0}%)`).join(' • '),
      overallProgress: stats.overallProgress,
      lastCourseExcerpt: lastExcerpt,
      lastCourseLessons: lastLessons
    };
  }, [
    courses,
    currentProfile
  ]);

  // Tuteur IA & Appels aux Tutrices Virtuelles — Conditionné par une connexion ou une création de compte
  const handleOpenTutor = (initialQuestion?: string) => {
    if (typeof initialQuestion === 'string' && initialQuestion.trim()) {
      setTutorInitialQuestion(initialQuestion.trim());
    }
    if (!isAuthenticated) {
      setPendingTutorAfterAuth(true);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Veuillez vous connecter ou créer un compte pour accéder à la conversation IA.');
      return;
    }
    setIsTutorOpen(true);
  };

  const handleCallTutor = (
    action: 'chat' | 'call' | 'video' | 'voice' = 'call',
    tutorId?: 'henri' | 'denise' | 'charline' | 'vivienne' | 'eloise',
    question?: string
  ) => {
    if (question?.trim()) setTutorInitialQuestion(question.trim());
    setTutorInitialAction(action);
    if (tutorId) setTutorInitialPersona(tutorId);
    if (!isAuthenticated) {
      setPendingTutorAfterAuth(true);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Veuillez vous connecter ou créer un compte pour accéder à la conversation IA.');
      return;
    }
    setIsTutorOpen(true);
  };

  // Handle successful login from Firebase
  const handleLoginSuccess = async (profile: UserProfile) => {
    if (!auth.currentUser || auth.currentUser.uid !== profile.id) {
      showToast('Connectez-vous avec un compte Firebase réel.');
      setIsAuthModalOpen(true); return;
    }
    const user = auth.currentUser;
    const generation = sessionGeneration.current;
    try {
    const response = await authenticatedFetch('/api/auth/session');
    if (!response.ok) return;
    try { profile = await getOrInitUserProfile(user); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Profil Firebase indisponible.'); return; }
    if (auth.currentUser !== user || generation !== sessionGeneration.current) return;
    window.dispatchEvent(new Event('academia-session-verified'));
    setIsAuthModalOpen(false);

    if (pendingCourseForAuth) {
      setSelectedCourseForPlayer(pendingCourseForAuth);
      setSubDetailBreadcrumb(`${pendingCourseForAuth.code} • ${pendingCourseForAuth.title}`);
      setPendingCourseForAuth(null);
    }
    if (pendingTutorAfterAuth) {
      setPendingTutorAfterAuth(false);
      setTimeout(() => setIsTutorOpen(true), 300);
      showToast("✅ Accès Tuteur IA Arena déverrouillé");
    }
    if (pendingPlacementAfterAuth) {
      setPendingPlacementAfterAuth(false);
      setTimeout(() => setIsPlacementOpen(true), 400);
      showToast('✅ Test de niveau débloqué — bienvenue !');
    }
    } catch (error) { showToast(error instanceof Error ? error.message : 'Connexion indisponible.'); setIsAuthModalOpen(true); }
  };

  // Fast institutional demo login
  const handleDemoLogin = (role: UserRole) => {
    if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO !== 'true') {
      showToast('Connexion de démonstration désactivée. Utilisez un compte Firebase.'); return;
    }
    setCurrentRole(role);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    const demoProf = profiles[role] || DEMO_PROFILES[role];
    localStorage.setItem('armp_session_profile', JSON.stringify(demoProf));
    showToast(`Session active : ${demoProf.roleTitle}`);

    if (pendingCourseForAuth) {
      setSelectedCourseForPlayer(pendingCourseForAuth);
      setSubDetailBreadcrumb(`${pendingCourseForAuth.code} • ${pendingCourseForAuth.title}`);
      setPendingCourseForAuth(null);
    }
    if (pendingTutorAfterAuth) {
      setPendingTutorAfterAuth(false);
      setTimeout(() => setIsTutorOpen(true), 300);
      showToast('✅ Accès Tuteur IA déverrouillé');
    }
    if (pendingPlacementAfterAuth) {
      setPendingPlacementAfterAuth(false);
      setTimeout(() => setIsPlacementOpen(true), 400);
      showToast('✅ Test de niveau débloqué — bienvenue !');
    }
  };

  // Profile Update (saves to Firestore & local state)
  const handleUpdateProfile = async (updated: UserProfile) => {
    const patch = changedProfileFields(currentProfile, updated);
    const optimistic = mediaPatch(patch);
    const hasMedia = Object.keys(optimistic).length > 0;
    const uid = auth.currentUser?.uid;
    const generation = sessionGeneration.current;
    if (!uid || uid !== updated.id) throw new Error('La session a changé.');
    if (hasMedia && pendingMedia.current?.uid === uid) throw new Error('Une photo est déjà en cours d’enregistrement.');
    const pending = { uid, patch: optimistic };
    let mediaSaved = false;
    if (hasMedia) {
      pendingMedia.current = pending;
      setProfiles(prev => ({ ...prev, [updated.role]: { ...prev[updated.role], ...optimistic } }));
      setFirestoreProfiles(prev => prev.map(profile => profile.id === uid ? { ...profile, ...optimistic } : profile));
    }
    try {
      if (hasMedia) {
        const response = await authenticatedFetch('/api/profile/media', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(optimistic) });
        const data = await response.json();
        if (!response.ok || !data.media || !Number.isSafeInteger(data.media.mediaRevision)) throw new Error(data.error || 'Confirmation de la photo indisponible.');
        mediaSaved = true;
        if (auth.currentUser?.uid === uid) {
          Object.assign(patch, data.media);
          setProfiles(prev => ({ ...prev, [updated.role]: applyProfileMedia(prev[updated.role], data.media) }));
          setFirestoreProfiles(prev => prev.map(profile => profile.id === uid ? applyProfileMedia(profile, data.media) : profile));
        }
        const otherFields = Object.fromEntries(Object.entries(patch).filter(([key]) => !['avatarUrl', 'coverUrl', 'mediaRevision'].includes(key)));
        if (Object.keys(otherFields).length) await syncUserProfileToFirestore(updated, otherFields);
      } else await syncUserProfileToFirestore(updated, patch);
      if (auth.currentUser?.uid !== uid) throw new Error('La session a changé.');
      // A verified session refresh will read the saved profile itself.
      if (generation !== sessionGeneration.current) return;
      setProfiles(prev => ({ ...prev, [updated.role]: { ...prev[updated.role], ...patch } }));
      setFirestoreProfiles(prev => prev.map(profile => profile.id === uid ? { ...profile, ...patch } : profile));
    } catch (error) {
      if (hasMedia && !mediaSaved && auth.currentUser?.uid === uid && generation === sessionGeneration.current) {
        setProfiles(prev => ({ ...prev, [updated.role]: rollbackProfileMedia(prev[updated.role], currentProfile, optimistic) }));
        setFirestoreProfiles(prev => prev.map(profile => profile.id === uid ? rollbackProfileMedia(profile, currentProfile, optimistic) : profile));
      }
      throw error;
    } finally {
      if (pendingMedia.current === pending) pendingMedia.current = null;
    }
  };

  // Two-Factor Authentication (2FA) Toggle in Profile
  const handleToggleTwoFactor = async (enabled: boolean) => {
    try {
      if (!enabled) {
        const response = await authenticatedFetch('/api/auth/mfa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Modification refusée.');
      }
      window.dispatchEvent(new Event('academia-session-verified'));
      showToast(enabled ? 'Double authentification activée après vérification du code.' : 'Double authentification désactivée.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Modification de sécurité indisponible.'); }
  };

  const handleLogout = async () => {
    ++sessionGeneration.current;
    setIsAuthenticated(false);
    setProfiles(DEMO_PROFILES);
    setFirestoreProfiles([]);
    setRequests([]);
    setCgpmpAccountRequests([]);
    setIsTutorOpen(false);
    setIsPlacementOpen(false);
    try {
      await firebaseLogout();
    } catch (e) {
      showToast("Déconnexion impossible. Réessayez.");
      return;
    }
    localStorage.removeItem('armp_session_profile');
    setIsAuthenticated(false);
    setSelectedCourseForPlayer(null);
    setActiveTab('accueil');
    setSubCategoryBreadcrumb(null);
    setSubDetailBreadcrumb(null);
    showToast("Vous avez été déconnecté avec succès.");
  };

  // Open course player with authentication guard + record as Last Reading & Recent Reading
  const handleOpenCourse = (course: CourseModule) => {
    if (!isAuthenticated) {
      setPendingCourseForAuth(course);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast(`Connexion requise pour visualiser le module "${course.title}".`);
    } else {
      if (onboarding.required && !onboarding.modules.some(module => module.id === course.id)) {
        showToast('Lisez les modules d’initiation, puis passez le test de niveau.');
        return;
      }
      setSelectedCourseForPlayer(course);
      setSubDetailBreadcrumb(`${course.code} • ${course.title}`);
      const updated = recordCourseReadingInProfile(currentProfile, course, 0);
      setProfiles((prev) => ({
        ...prev,
        [currentRole]: applyProfileMedia(updated, prev[currentRole] || currentProfile)
      }));
        syncUserProfileToFirestore(updated).catch(() => {});
    }
  };

  // Role Switch Handler
  const handleRoleChange = (newRole: UserRole) => {
    if (isAuthenticated && newRole !== currentProfile.role) { showToast('Votre rôle est attribué par le superadministrateur.'); return; }
    setCurrentRole(newRole);
    const targetProf = profiles[newRole];
    if (targetProf) {
      localStorage.setItem('armp_session_profile', JSON.stringify(targetProf));
      showToast(`Session basculée sur : ${targetProf.roleTitle} (${targetProf.institution})`);
    }
  };

  // Test de niveau conditionné à la connexion : sinon, ouvrir l'authentification
  // puis relancer automatiquement le test une fois connecté.
  const handleOpenPlacement = () => {
    if (!isAuthenticated) {
      setPendingPlacementAfterAuth(true);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('🔐 Connectez-vous pour passer le test de niveau');
      return;
    }
    if (onboarding.required && !onboarding.readyForTest) {
      showToast('Terminez la lecture des modules d’initiation avant le test de niveau.');
      return;
    }
    setIsPlacementOpen(true);
  };

  // Update Profile Level after Placement Quiz
  const handleUpdateProfileLevel = async (
    level: UserProfile['level'],
    score: number,
    validation?: { niveau: NiveauValidation; moduleCode?: string }
  ) => {
    if (onboarding.required && !onboarding.readyForTest) throw new Error('Terminez les modules d’initiation avant le test.');
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('Score de niveau invalide.');
    const sessionUid = auth.currentUser?.uid;
    const verifiedResponse = await authenticatedFetch('/api/learning-level');
    if (!verifiedResponse.ok) throw new Error('Le résultat ne peut pas être confirmé. Réessayez.');
    const verifiedResult = await verifiedResponse.json();
    setVerifiedStage({ uid: currentProfile.id, stage: verifiedResult.stage });
    const lvlCfg = await getLevelSettings();
    const levelKey = levelKeyFromLabel(level, lvlCfg);
    const updated: UserProfile = {
      ...currentProfile,
      level: verifiedResult.stage === 'Initiation' ? 'Débutant' : verifiedResult.stage === 'Approfondi' ? 'Intermédiaire' : 'Avancé',
      levelKey: verifiedResult.stage === 'Initiation' ? 'debutant' : verifiedResult.stage === 'Approfondi' ? 'intermediaire' : 'avance',
      placementScore: score,
      ...(validation
        ? {
            niveauValidation: validation.niveau,
            niveauxModules: validation.moduleCode
              ? { ...(currentProfile.niveauxModules || {}), [validation.moduleCode]: validation.niveau }
              : currentProfile.niveauxModules,
          }
        : {}),
    };
    updated.niveauValidation = verifiedResult.stage;
    // Unlock the curriculum only after the result has been saved to this account.
    await syncUserProfileToFirestore(updated);
    if (auth.currentUser?.uid !== sessionUid || sessionUid !== updated.id) return;
    setIsPlacementOpen(false);
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: applyProfileMedia(updated, prev[currentRole] || currentProfile)
    }));
    showToast(
      validation
        ? `🎓 Niveau validé : ${validation.niveau}${validation.moduleCode ? ` (${validation.moduleCode})` : ''} — score ${score}%`
        : `Niveau profil actualisé : ${level} (${score}%)`
    );
  };

  // Certificates and final scores are issued by the assessment API, never invented here.
  const handleCompleteModule = async () => {
    const response = await authenticatedFetch('/api/operations/profiles');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Actualisation du résultat impossible.');
    const profile = data.profiles.find((p: UserProfile) => p.id === currentProfile.id);
    if (profile) setProfiles(prev => ({...prev,[currentRole]:applyProfileMedia(profile,prev[currentRole] || profile)}));
    showToast('Évaluation enregistrée. Votre attestation pédagogique est disponible après réussite.');
  };

  // Persist granular course progress (lessons completed, percentage, quiz score, and last reading history)
  const handleUpdateCourseProgress = async (
    courseId: string,
    progressPct: number,
    completedLessonIndices: number[],
    quizScore?: number,
    activeLessonIdx?: number
  ) => {
    const courseObj = courses.find((c) => c.id === courseId);
    const resolvedPct = Math.max(currentProfile.courseProgress?.[courseId] || 0, progressPct);
    const lessonIdx =
      typeof activeLessonIdx === 'number'
        ? activeLessonIdx
        : completedLessonIndices.length > 0
        ? completedLessonIndices[completedLessonIndices.length - 1]
        : 0;

    const baseWithReading = courseObj
      ? recordCourseReadingInProfile(currentProfile, courseObj, lessonIdx, resolvedPct)
      : currentProfile;

    const nextCourseProgress = {
      ...(baseWithReading.courseProgress || {}),
      [courseId]: resolvedPct
    };
    const nextLessonsMap = {
      ...(baseWithReading.completedLessonsByCourse || {}),
      [courseId]: completedLessonIndices
    };
    const nextQuizScores = quizScore !== undefined
      ? { ...(baseWithReading.quizScoresByCourse || {}), [courseId]: quizScore }
      : (baseWithReading.quizScoresByCourse || {});

    const updated: UserProfile = {
      ...baseWithReading,
      courseProgress: nextCourseProgress,
      completedLessonsByCourse: nextLessonsMap,
      quizScoresByCourse: nextQuizScores,
      lastActiveDate: new Date().toISOString().slice(0, 10)
    };
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: applyProfileMedia(updated, prev[currentRole] || currentProfile)
    }));
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync course progress to Firestore", e);
      showToast('La progression n’a pas pu être enregistrée. Vérifiez votre connexion avant de quitter le module.');
    }
  };

  // Persist user course notes to profile & Firestore
  const handleSaveCourseNote = async (courseId: string, lessonIdx: number, noteText: string) => {
    const key = `${courseId}_${lessonIdx}`;
    const updated: UserProfile = {
      ...currentProfile,
      notesByCourse: {
        ...(currentProfile.notesByCourse || {}),
        [key]: noteText
      }
    };
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: applyProfileMedia(updated, prev[currentRole] || currentProfile)
    }));
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync course note to Firestore", e);
    }
  };

  // Actual PDF export; the profile tracks the download, not a simulated offline app.
  const handleToggleOfflineDownload = async (courseId:string) => {
    const course=courses.find(c=>c.id===courseId); if(!course) return;
    if(onboarding.required && !onboarding.modules.some(c=>c.id===courseId)) {showToast('Réussissez le test de niveau avant de télécharger ce module.');return;}
    try {
      await downloadOperation(`/courses/${courseId}/document`,`support-${course.code}.pdf`);
      const updated={...currentProfile,offlineDownloads:[...new Set([...(currentProfile.offlineDownloads || []),courseId])]};
      await syncUserProfileToFirestore(updated,{offlineDownloads:updated.offlineDownloads});
      setProfiles(prev=>({...prev,[currentRole]:applyProfileMedia(updated,prev[currentRole] || currentProfile)}));
      showToast('Support PDF téléchargé. Ouvrez ce fichier pour le consulter sans connexion.');
    }catch(error) {showToast(error instanceof Error ? error.message : 'Téléchargement non confirmé.');}
  };

  // Trainer Course Authoring Handler (persists to localStorage + Firestore)
  const handleAddCustomCourse = async (newCourse: CourseModule) => {
    await saveCustomCourseToFirestore(newCourse);
    setCourses((prev) => {
      const updated = [newCourse, ...prev.filter(c => c.id !== newCourse.id)];
      try {
        const customOnes = updated.filter(c => !COURSES_DATA.some(d => d.id === c.id));
        localStorage.setItem('armp_courses_custom', JSON.stringify(customOnes));
      } catch (err) {
        console.warn("Could not save custom course", err);
      }
      return updated;
    });

    // Attribution de l'auteur pour les performances des formateurs (si pas déjà attribué)
    try {
      const authors = readModuleAuthors();
      if (!authors[newCourse.id] && currentProfile) {
        recordModuleAuthor(newCourse.id, { id: currentProfile.id, name: currentProfile.name });
      }
    } catch { /* ignore */ }
    showToast(`Formation "${newCourse.title}" publiée et sauvegardée au catalogue officiel !`);
  };

  const handleDeleteCustomCourse = async (id: string) => {
    if (COURSES_DATA.some(c => c.id === id)) throw new Error('Les cours officiels sont protégés.');
    await deleteCustomCourseFromFirestore(id);
    setCourses(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('armp_courses_custom', JSON.stringify(updated.filter(c => !COURSES_DATA.some(d => d.id === c.id))));
      return updated;
    });
  };
  // CGPMP Request Handlers
  const handleSubmitRequest = async (newReq:TrainingRequest) => {
    await saveTrainingRequestToFirestore(newReq);
    setRequests(prev=>[newReq,...prev]);
    showToast(`Demande ${newReq.id} enregistrée et disponible pour instruction par la DFAT.`);
  };
  const decideTraining = async (id:string,status:string,note:string) => {
    const result=await operationsApi(`/training/${id}/decision`,{status,note});
    setRequests(prev=>prev.map(r=>r.id===id?result.request:r));
    showToast('Décision enregistrée. Elle est consultable depuis le guichet.');
  };
  const handleApproveRequest=(id:string,note?:string)=>decideTraining(id,'Approuvé par DFAT',note || 'Visa DFAT accordé.');
  const handleRejectRequest=(id:string,note:string)=>decideTraining(id,'Rejeté',note);

  // CGPMP Account Creation Request Handlers (Secrétaire Permanent + ARMP Validation + Email Dispatch)
  const handleApproveCgpmpAccountRequest = async (req: CgpmpAccountCreationRequest, note?: string) => {
    const updated = await validateCgpmpAccountRequestByArmp(req, currentProfile.name, note);
    setCgpmpAccountRequests(getLocalCgpmpAccountRequests());
    showToast(`Compte CGPMP validé ! Coordonnées d'authentification envoyées par mail au Secrétaire Permanent et aux ${updated.members.length} membres.`);
  };

  const handleRejectCgpmpAccountRequest = async (req: CgpmpAccountCreationRequest, reason: string) => {
    await rejectCgpmpAccountRequestByArmp(req, currentProfile.name, reason);
    setCgpmpAccountRequests(getLocalCgpmpAccountRequests());
    showToast(`Dossier de création de compte CGPMP (${req.id}) rejeté par l'Administration ARMP.`);
  };

  // Open course player directly by ID
  const handleSelectModuleById = (moduleId: string) => {
    const found = courses.find((c) => c.id === moduleId);
    if (found) {
      handleOpenCourse(found);
    }
  };


  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200 ${
      isMobileMode ? 'max-w-md mx-auto shadow-2xl border-x border-slate-300 dark:border-slate-800' : ''
    }`}>
      
      {/* Institutional Preloader */}
      <InstitutionalPreloader isLoading={isAppLoading} statusText={preloaderStatus} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold flex items-center space-x-2.5 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-amber-400 dark:text-blue-600 flex-shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* Main Institutional Header */}
      <Header
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthModalEntry('creation');
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        initiationRequired={isAuthenticated && onboarding.required}
        onOpenInitiation={() => setActiveTab('initiation')}
        currentProfile={currentProfile}
        allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
        onSelectRole={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={(tab: string) => {
          setActiveTab(tab);
          setSubCategoryBreadcrumb(null);
          setSubDetailBreadcrumb(null);
        }}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isOfflineMode={isOffline}
        setIsOfflineMode={setIsOffline}
        onOpenTuteur={handleOpenTutor}
        onOpenPlacementQuiz={handleOpenPlacement}
        totalCourses={courses.length}
        courses={courses}
        onOpenCourse={handleOpenCourse}
        onNavigateProfileTab={(tab) => {
          setActiveTab('profil');
          setProfileSubTab(tab);
          setSubCategoryBreadcrumb(null);
          setSubDetailBreadcrumb(null);
        }}
      />

      {/* Fil d'Ariane supprimé à la demande — Breadcrumbs retiré */}

      {/* Main Container Viewport */}
      <main className="flex-1">
        {isAuthenticated && onboarding.required && activeTab === 'initiation' && <div className="p-4 sm:p-6">
          <InitiationPathway modules={onboarding.modules} isRead={onboarding.isRead} ready={onboarding.readyForTest} expiresAt={initiationDeadline?.uid === currentProfile.id ? initiationDeadline.expiresAt : undefined} enforced={initiationDeadline?.uid === currentProfile.id && initiationDeadline.enforced} showHeader={false} onReturnPortal={() => setActiveTab('accueil')} onOpen={handleOpenCourse} onTest={handleOpenPlacement} onTutor={() => handleOpenTutor()} onLogout={handleLogout} />
        </div>}

        
        {/* TAB 1: ACCUEIL & INSTITUTIONAL PORTAL */}
        {activeTab === 'accueil' && (
          <div className="space-y-12 pb-12">
            
            {/* Hero Slider — 5 slides renforcement capacités */}
            <HeroSlider
              onExploreCourses={() => setActiveTab('catalogue')}
              onOpenTuteur={handleOpenTutor}
              onOpenPlacement={handleOpenPlacement}
              isDarkMode={isDarkMode}
            />

            {/* Tutoriels + Captures Téléphone/Ordinateur */}
            <TutorialSection onExploreCourses={() => setActiveTab('catalogue')} onOpenTuteur={handleOpenTutor} />

            {/* Contenu Local — 51% • ARSP • Préférence nationale */}
            <ContenuLocalSection
              onExploreCourses={() => setActiveTab('catalogue')}
              onOpenTuteur={handleOpenTutor}
              onSelectPmeDemoAccount={(demoProfile, openModuleId) => {
                // The public examples never replace the signed-in identity.
                if (openModuleId) {
                  const targetMod = courses.find((c) => c.id === openModuleId);
                  if (targetMod) {
                    handleOpenCourse(targetMod);
                    return;
                  }
                }
                setActiveTab('catalogue');
              }}
            />

            {/* Quick Access Badges Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div 
                  onClick={() => setActiveTab('catalogue')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500 transition cursor-pointer flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Catalogues des formations</h4>
                    <p className="text-[11px] text-slate-500">{courses.length} modules disponibles</p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('demander')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-500 transition cursor-pointer flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Guichet CGPMP</h4>
                    <p className="text-[11px] text-slate-500">Demandes de renforcement</p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('textes')}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500 transition cursor-pointer flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Textes Réglementaires</h4>
                    <p className="text-[11px] text-slate-500">Loi 10/010 & Décrets</p>
                  </div>
                </div>

                <div 
                  onClick={() => handleOpenTutor()}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tuteur Juridique IA</h4>
                    <p className="text-[11px] text-slate-500">Assistance instantanée</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Featured Course Highlight */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
                <div className="relative z-10 max-w-2xl space-y-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 inline-flex items-center space-x-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Module Prioritaire National</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Maîtrise du Contentieux & Recours Devant le Comité de Règlement des Différends (CRD)
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    Formation certifiante accélérée sur les délais impératifs, la saisine non juridictionnelle, les motifs d'irrecevabilité et les décisions de l'ARMP faisant jurisprudence en RDC.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleOpenCourse(courses[0])}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition flex items-center space-x-2 shadow-lg"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{isAuthenticated ? 'Accéder au Cours' : 'Se Connecter pour Suivre'}</span>
                    </button>
                    <button
                      onClick={() => setPreviewCourse(courses[0])}
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4 text-sky-300" />
                      <span>Aperçu & Plan de Formation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Institutional Mentor Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <img 
                  src={imgMentor} 
                  alt="Mentor Juridique ARMP" 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 uppercase tracking-wider">
                      Cellule d'Appui Pédagogique ARMP
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Un encadrement d'experts juristes assermentés de la commande publique
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Chaque module ACADEMIA ITECH est conçu et homologué par la DFAT avec des cas pratiques réels issus des marchés des ministères, provinces et régies financières congolaises.
                  </p>
                </div>
                <button
                  onClick={handleOpenPlacement}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-2 flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Évaluer mon niveau</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CATALOGUE DES FORMATIONS (AFFICHAGE PAR DÉFAUT EN GRILLE) */}
        {activeTab === 'catalogue' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CourseCatalog
              courses={courses}
              currentProfile={currentProfile}
              isAuthenticated={isAuthenticated}
              onOpenCoursePlayer={handleOpenCourse}
              onOpenInitiation={() => setActiveTab('initiation')}
              onRequireAuth={(course?: CourseModule) => {
                if (course) {
                  setPendingCourseForAuth(course);
                }
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              onToggleOfflineDownload={handleToggleOfflineDownload}
              onOpenCgpmpRequestForm={(course: CourseModule) => {
                setPreselectedCourseForCgpmp(course);
                setActiveTab('demander');
              }}
              isOfflineMode={isOffline}
              onSelectSubCategoryForBreadcrumb={setSubCategoryBreadcrumb}
              onPreviewCourse={(course: CourseModule) => setPreviewCourse(course)}
            />
          </div>
        )}

        {/* TAB: MON PROFIL & HABILITATIONS */}
        {activeTab === 'profil' && (
          <div className="w-full">
            {!isAuthenticated ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-xs">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Espace Profil Sécurisé
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Veuillez vous connecter pour consulter vos certifications officielles ARMP, vos attestations de formation, vos requêtes CGPMP et votre suivi d'habilitation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 mx-auto"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Se connecter à mon compte</span>
                  </button>
                </div>
              </div>
            ) : (
              <UserProfileView
                currentProfile={currentProfile}
                allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
                onSelectRole={handleRoleChange}
                courses={courses}
                requests={requests}
                onOpenCourse={handleOpenCourse}
                onOpenPlacementQuiz={handleOpenPlacement}
                onOpenTuteur={handleOpenTutor}
                onCallTutor={handleCallTutor}
                onLogout={handleLogout}
                onNavigateToCourses={() => setActiveTab('catalogue')}
                onToggleTwoFactor={handleToggleTwoFactor}
                onUpdateProfile={handleUpdateProfile}
                onShowToast={showToast}
                initialTab={profileSubTab}
                onTabChange={(tab) => setProfileSubTab(tab)}
              />
            )}
          </div>
        )}

        {/* TAB 3: WORKFLOW CGPMP & DFAT VALIDATION (DEMANDER) — FULL WIDTH 2 COLONNES SANS ENTÊTE */}
        {(activeTab === 'demander' || activeTab === 'workflow' || activeTab === 'cgpmp-workflow') && (
          <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
            <CgpmpWorkflowBoard
              requests={requests}
              courses={courses}
              currentProfile={currentProfile}
              onSubmitRequest={handleSubmitRequest}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              preselectedCourse={preselectedCourseForCgpmp}
              onClearPreselectedCourse={() => setPreselectedCourseForCgpmp(null)}
              onSelectSubCategoryForBreadcrumb={setSubCategoryBreadcrumb}
              cgpmpAccountRequests={cgpmpAccountRequests}
              onApproveCgpmpAccountRequest={handleApproveCgpmpAccountRequest}
              onRejectCgpmpAccountRequest={handleRejectCgpmpAccountRequest}
              onOpenCgpmpRegistrationPage={() => {
                setAuthModalEntry('demande');
                setCurrentRole('cgpmp_member');
                setAuthModalMode('register');
                setIsAuthModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 4: TEXTES LÉGAUX & PORTAIL ARMP */}
        {(activeTab === 'textes' || activeTab === 'textes-legaux') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LegalDocsViewer
              onAskTutorAboutDoc={(query) => {
                handleOpenTutor(query);
              }}
              onSelectSubCategoryForBreadcrumb={setSubCategoryBreadcrumb}
              onSelectSubDetailForBreadcrumb={setSubDetailBreadcrumb}
            />
          </div>
        )}

        {/* TAB 5: TABLEAU DE BORD DÉCISIONNEL & ANALYTICS */}
        {(activeTab === 'dashboard' || activeTab === 'analytics') && isAuthenticated && ['super_admin','dfat_admin'].includes(currentProfile.role) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnalyticsDashboard
              institutionName={currentProfile.institution}
              courses={courses}
              requests={requests}
              allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
              firestoreProfiles={firestoreProfiles}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* TAB 6: ESPACE FORMATEUR & STUDIO — réservé formateur connecté uniquement (pas en déconnecté) */}
        {(activeTab === 'formateur' || activeTab === 'studio-formateur') && (
          isAuthenticated && currentProfile.role === 'formateur' ? (
            <div className="w-full">
              <TrainerPortal
                currentProfile={currentProfile}
                allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
                courses={courses}
                onAddCourse={handleAddCustomCourse}
                onPreviewCourse={(course) => setPreviewCourse(course)}
                onOpenCoursePlayer={handleOpenCourse}
                onSwitchToTrainerRole={() => handleRoleChange('formateur')}
                onUpdateProfile={handleUpdateProfile}
                isDarkMode={isDarkMode}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Espace Formateur — Accès réservé</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cet espace est réservé aux <strong>formateurs homologués DFAT</strong>. Votre profil actuel est <strong>{currentProfile.roleTitle}</strong> ({currentProfile.institution}).<br />Veuillez vous connecter avec un compte formateur ou demander votre habilitation auprès de la DFAT.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => setActiveTab('catalogue')} className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] text-white font-bold text-sm">Voir le catalogue</button>
                <button onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm">Se connecter comme formateur</button>
              </div>
              <p className="text-xs text-slate-500">RDC • Loi 10/010 • DFAT — Kinshasa, Gombe</p>
            </div>
          )
        )}

        {/* TAB 7: ESPACE ADMINISTRATEUR — bascule Espace/Dashboard, formateurs & tests de niveau */}
        {activeTab === 'admin' && (
          isAuthenticated && (currentProfile.role === 'dfat_admin' || currentProfile.role === 'super_admin') ? (
            <div className="px-4 sm:px-6 lg:px-8 py-8">
              <React.Suspense fallback={<SkeletonLoader label="Chargement de l’espace administrateur…" />}><AdminSpace
                currentProfile={currentProfile}
                courses={courses}
                requests={requests}
                allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
                firestoreProfiles={firestoreProfiles}
                onShowToast={showToast}
                onAddCourse={handleAddCustomCourse}
                onDeleteCourse={handleDeleteCustomCourse}
              /></React.Suspense>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Espace Administrateur — Accès réservé</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cet espace est réservé aux <strong>super administrateurs & administration DFAT</strong>. Votre profil actuel est{' '}
                  <strong>{currentProfile.roleTitle}</strong> ({currentProfile.institution}).<br />
                  Connectez-vous avec un compte super administrateur ou basculez votre rôle en « 🔰 Super Administrateur » / « 🏛️ Administration DFAT » depuis votre profil.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }} className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] text-white font-bold text-sm">Se connecter</button>
              </div>
              <p className="text-xs text-slate-500">RDC • Loi 10/010 • DFAT — Kinshasa, Gombe</p>
            </div>
          )
        )}

      </main>

      {/* Persistent Floating Legal AI Tutor & Direct Call / Voice Dock — Masqué uniquement sur la page Connexion / Création de Compte */}
      {!isAuthModalOpen && (
        <div className="fixed bottom-5 right-5 z-[110] flex items-center gap-2">
          <button
            onClick={() => handleCallTutor('voice', 'denise')}
            className="p-3 sm:px-3.5 sm:py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-purple-400/40 cursor-pointer"
            title={
              isAuthenticated
                ? 'Envoyer un Voice aux Tutrices Virtuelles'
                : 'Connexion requise — Envoyer un Voice aux Tutrices Virtuelles'
            }
          >
            <Waves className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Voice</span>
          </button>

          <button
            onClick={() => handleCallTutor('call', 'denise')}
            className="p-3 sm:px-3.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-emerald-400/40 cursor-pointer"
            title={
              isAuthenticated
                ? 'Appeler une Tutrice Virtuelle en direct (Audio)'
                : 'Connexion requise — Appeler une Tutrice Virtuelle en direct'
            }
          >
            <Phone className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Appeler</span>
          </button>

          <button
            onClick={() => handleCallTutor('video', 'denise')}
            className="p-3 sm:px-3.5 sm:py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 border border-blue-400/40 cursor-pointer"
            title={
              isAuthenticated
                ? 'Lancer un appel Visio HD avec une Tutrice Virtuelle'
                : 'Connexion requise — Lancer un appel Visio HD'
            }
          >
            <Video className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Visio</span>
          </button>

          <button
            onClick={() => handleOpenTutor()}
            className="p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 text-white font-bold text-xs shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition flex items-center space-x-2 group cursor-pointer"
            aria-label="Ouvrir le Tuteur Juridique IA"
            title={
              isAuthenticated
                ? 'Ouvrir le Tuteur Juridique IA'
                : 'Connexion ou création de compte requise pour ouvrir le Tuteur IA'
            }
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-amber-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            </div>
            <span className="hidden sm:inline font-bold tracking-tight">Tuteur IA • Q/R</span>
          </button>
        </div>
      )}

      {/* Authentication & Registration Full-Window Two-Column Portal with Firebase Auth */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canClose={true}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingCourseForAuth(null);
          setPendingTutorAfterAuth(false);
        }}
        initialRole={currentRole}
        initialMode={authModalMode}
        initialRegisterEntry={authModalEntry}
        allProfiles={isAuthenticated ? Object.fromEntries([currentProfile, ...firestoreProfiles].map(p => [p.id, p])) : {}}
        pendingCourseTitle={
          pendingCourseForAuth?.title ||
          (pendingTutorAfterAuth ? 'Conversation & Assistance Juridique IA (ARMP)' : undefined)
        }
        onLoginSuccess={handleLoginSuccess}
        onDemoLogin={handleDemoLogin}
        onShowToast={showToast}
        cgpmpAccountRequests={cgpmpAccountRequests}
        onUpdateCgpmpAccountRequests={(list) => setCgpmpAccountRequests(list)}
      />

      <AITutorModal
        isOpen={isAuthenticated && isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        currentProfile={currentProfile}
        learningContext={tutorLearningContext}
        initialQuestion={tutorInitialQuestion}
        onClearInitialQuestion={() => setTutorInitialQuestion(null)}
        initialAction={tutorInitialAction}
        initialTutor={tutorInitialPersona}
        onClearInitialAction={() => {
          setTutorInitialAction(null);
          setTutorInitialPersona(null);
        }}
      />

      <PlacementQuizModal
        isOpen={isPlacementOpen && (!onboarding.required || onboarding.readyForTest)}
        onClose={() => setIsPlacementOpen(false)}
        currentProfile={currentProfile}
        onUpdateProfileLevel={handleUpdateProfileLevel}
        onSelectModule={handleSelectModuleById}
      />

      {/* Course Details & Plan Preview Modal (sans entrer à l'apprentissage) */}
      <CoursePreviewModal
        course={previewCourse}
        isOpen={!!previewCourse}
        onClose={() => setPreviewCourse(null)}
        onStartLearning={(course) => {
          setPreviewCourse(null);
          handleOpenCourse(course);
        }}
        isAuthenticated={isAuthenticated}
        currentProfile={currentProfile}
        onRequireAuth={(course) => {
          setPreviewCourse(null);
          setPendingCourseForAuth(course);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onRequestCgpmp={(course) => {
          setPreviewCourse(null);
          setPreselectedCourseForCgpmp(course);
          setActiveTab('demander');
        }}
        onOpenAnimatic={(course) => {
          setPreviewCourse(null);
          setAnimaticCourse(course);
        }}
      />

      <CourseAnimaticModal
        course={animaticCourse}
        isOpen={!!animaticCourse}
        onClose={() => setAnimaticCourse(null)}
        isAuthenticated={isAuthenticated}
        currentProfile={currentProfile}
        onStartLearning={(course) => {
          setAnimaticCourse(null);
          handleOpenCourse(course);
        }}
        onRequireAuth={(course) => {
          setAnimaticCourse(null);
          setPendingCourseForAuth(course);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onRequestCgpmp={(course) => {
          setAnimaticCourse(null);
          setPreselectedCourseForCgpmp(course);
          setActiveTab('demander');
        }}
      />

      {isAuthenticated && selectedCourseForPlayer && (!onboarding.required || onboarding.modules.some(module => module.id === selectedCourseForPlayer.id)) && (
        <CourseWindow
          key={`${currentProfile.id}:${selectedCourseForPlayer.id}`}
          course={selectedCourseForPlayer}
          onClose={() => {
            setSelectedCourseForPlayer(null);
            setSubDetailBreadcrumb(null);
          }}
          currentProfile={currentProfile}
          onCompleteModule={handleCompleteModule}
          onUpdateCourseProgress={handleUpdateCourseProgress}
          onSaveCourseNote={handleSaveCourseNote}
          onAskTutor={(question) => {
            handleOpenTutor(question);
          }}
          onCallTutor={(action, tutorId, question) => {
            handleCallTutor(action, tutorId, question);
          }}
        />
      )}

      {/* Institutional Footer */}
      <Footer
        onOpenLegalDocs={() => setActiveTab('textes')}
        onOpenTuteur={handleOpenTutor}
        isOffline={isOffline}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}
