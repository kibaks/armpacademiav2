import React, { useState, useEffect } from 'react';
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
import { AdminSpace } from './components/AdminSpace';
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
import { computeUserLearningStats, recordCourseReadingInProfile } from './utils/learningStats';
import { readModuleAuthors, recordModuleAuthor } from './utils/moduleAuthors';
import { 
  auth, 
  getOrInitUserProfile, 
  syncUserProfileToFirestore, 
  saveTrainingRequestToFirestore, 
  fetchTrainingRequestsFromFirestore, 
  getLocalCgpmpAccountRequests,
  saveCgpmpAccountRequestToFirestore,
  fetchCgpmpAccountRequestsFromFirestore,
  validateCgpmpAccountRequestByArmp,
  rejectCgpmpAccountRequestByArmp,
  fetchCustomCoursesFromFirestore,
  saveCustomCourseToFirestore,
  fetchAllUserProfilesFromFirestore,
  testFirestoreConnection,
  firebaseLogout 
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('armp_session_profile');
  });
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
        format: 'animation',
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
  const [requests, setRequests] = useState<TrainingRequest[]>(INITIAL_TRAINING_REQUESTS);
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
  const [isOffline, setIsOffline] = useState(false);

  // Modals State
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorInitialQuestion, setTutorInitialQuestion] = useState<string | null>(null);
  const [tutorInitialAction, setTutorInitialAction] = useState<'chat' | 'call' | 'video' | 'voice' | null>(null);
  const [tutorInitialPersona, setTutorInitialPersona] = useState<'denise' | 'charline' | 'vivienne' | 'eloise' | null>(null);
  const [pendingTutorAfterAuth, setPendingTutorAfterAuth] = useState(false);
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

  // 4. Initial Firebase Auth Subscription & Session Restoring on Page Refresh
  useEffect(() => {
    setPreloaderStatus("Vérification de la session et des accès institutionnels...");

    // Immediate local cache hydration to prevent UI flash
    const cachedSession = localStorage.getItem('armp_session_profile');
    if (cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession) as UserProfile;
        if (parsed && parsed.role) {
          setCurrentRole(parsed.role);
          setProfiles(prev => ({
            ...prev,
            [parsed.role]: parsed
          }));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn("Could not read cached profile:", e);
      }
    }

    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setPreloaderStatus(`Chargement du profil sécurisé (${firebaseUser.email || 'Agent'})...`);
        try {
          const userProfile = await getOrInitUserProfile(firebaseUser, currentRole);
          setCurrentRole(userProfile.role);
          setProfiles(prev => ({
            ...prev,
            [userProfile.role]: userProfile
          }));
          setIsAuthenticated(true);
          localStorage.setItem('armp_session_profile', JSON.stringify(userProfile));
        } catch (err) {
          console.error("Erreur de synchronisation Firestore profil:", err);
        }

        // Fetch persistent training requests, custom courses & all user profiles from Firestore when authenticated
        try {
          setPreloaderStatus("Synchronisation des dossiers CGPMP & visas DFAT...");
          const [firestoreReqs, remoteCourses, remoteProfiles, remoteCgpmpAccounts] = await Promise.all([
            fetchTrainingRequestsFromFirestore().catch(() => []),
            fetchCustomCoursesFromFirestore().catch(() => []),
            fetchAllUserProfilesFromFirestore().catch(() => []),
            fetchCgpmpAccountRequestsFromFirestore().catch(() => [])
          ]);
          if (remoteCgpmpAccounts && remoteCgpmpAccounts.length > 0) {
            setCgpmpAccountRequests(remoteCgpmpAccounts);
          }
          if (firestoreReqs && firestoreReqs.length > 0) {
            setRequests(prev => {
              const map = new Map<string, TrainingRequest>();
              firestoreReqs.forEach(r => map.set(r.id, r));
              prev.forEach(r => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              return Array.from(map.values());
            });
          }
          if (remoteCourses && remoteCourses.length > 0) {
            setCourses(prev => {
              const officialMap = new Map<string, CourseModule>();
              COURSES_DATA.forEach(c => officialMap.set(c.id, normalizeCourseToAnimation(c)));
              const map = new Map<string, CourseModule>(officialMap);
              prev.forEach(c => {
                if (!map.has(c.id)) map.set(c.id, normalizeCourseToAnimation(c));
              });
              remoteCourses.forEach(c => {
                if (!map.has(c.id)) map.set(c.id, normalizeCourseToAnimation(c));
              });
              return Array.from(map.values());
            });
          }
          if (remoteProfiles && remoteProfiles.length > 0) {
            setFirestoreProfiles(remoteProfiles);
          }
        } catch (err) {
          console.warn("Erreur chargement données Firestore:", err);
        }
      } else if (!cachedSession) {
        setIsAuthenticated(false);
      }

      // Verify connection to Firestore
      await testFirestoreConnection();

      // Finish Preloading
      setPreloaderStatus("Système ACADEMIA ITECH opérationnel.");
      setTimeout(() => {
        setIsAppLoading(false);
      }, 400);
    });

    return () => unsubscribe();
  }, []);

  const currentProfile = profiles[currentRole] || profiles['cgpmp_member'];

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
    tutorId?: 'denise' | 'charline' | 'vivienne' | 'eloise'
  ) => {
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
  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentRole(profile.role);
    setProfiles(prev => ({
      ...prev,
      [profile.role]: profile
    }));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    localStorage.setItem('armp_session_profile', JSON.stringify(profile));

    // Also fetch training requests now that user is logged in
    fetchTrainingRequestsFromFirestore().then(firestoreReqs => {
      if (firestoreReqs && firestoreReqs.length > 0) {
        setRequests(prev => {
          const map = new Map<string, TrainingRequest>();
          firestoreReqs.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values());
        });
      }
    }).catch(err => console.warn("Erreur chargement requêtes post-login:", err));

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
  };

  // Fast institutional demo login
  const handleDemoLogin = (role: UserRole) => {
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
  };

  // Profile Update (saves to Firestore & local state)
  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfiles(prev => ({
      ...prev,
      [updated.role]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    try {
      await syncUserProfileToFirestore(updated);
    } catch (err) {
      console.warn("Could not sync profile to Firestore:", err);
    }
  };

  // Two-Factor Authentication (2FA) Toggle in Profile
  const handleToggleTwoFactor = async (enabled: boolean) => {
    const updated: UserProfile = {
      ...currentProfile,
      twoFactorEnabled: enabled
    };
    setProfiles(prev => ({
      ...prev,
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    showToast(
      enabled
        ? "Sécurité renforcée : Authentification à double facteur (2FA) activée."
        : "Authentification à double facteur (2FA) désactivée."
    );
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Failed to sync 2FA to Firestore", e);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (e) {
      console.warn("Erreur lors de la déconnexion Firebase", e);
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
      setSelectedCourseForPlayer(course);
      setSubDetailBreadcrumb(`${course.code} • ${course.title}`);
      const updated = recordCourseReadingInProfile(currentProfile, course, 0);
      setProfiles((prev) => ({
        ...prev,
        [currentRole]: updated
      }));
      localStorage.setItem('armp_session_profile', JSON.stringify(updated));
      syncUserProfileToFirestore(updated).catch(() => {});
    }
  };

  // Role Switch Handler
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    const targetProf = profiles[newRole];
    if (targetProf) {
      localStorage.setItem('armp_session_profile', JSON.stringify(targetProf));
      showToast(`Session basculée sur : ${targetProf.roleTitle} (${targetProf.institution})`);
    }
  };

  // Update Profile Level after Placement Quiz
  const handleUpdateProfileLevel = async (
    level: UserProfile['level'],
    score: number,
    validation?: { niveau: NiveauValidation; moduleCode?: string }
  ) => {
    const updated: UserProfile = {
      ...currentProfile,
      level,
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
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    showToast(
      validation
        ? `🎓 Niveau validé : ${validation.niveau}${validation.moduleCode ? ` (${validation.moduleCode})` : ''} — score ${score}%`
        : `Niveau profil actualisé : ${level} (${score}%)`
    );
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync quiz score to Firestore", e);
    }
  };

  // Module Completion Handler
  const handleCompleteModule = async (courseId: string, score?: number) => {
    const courseObj = courses.find(c => c.id === courseId);
    const prevCompletedIds = currentProfile.completedCourseIds || [];
    const isNewCompletion = !prevCompletedIds.includes(courseId);
    const nextCompletedIds = isNewCompletion ? [...prevCompletedIds, courseId] : prevCompletedIds;
    const nextCourseProgress = { ...(currentProfile.courseProgress || {}), [courseId]: 100 };
    const nextQuizScores = score !== undefined
      ? { ...(currentProfile.quizScoresByCourse || {}), [courseId]: score }
      : (currentProfile.quizScoresByCourse || {});

    const existingCerts = currentProfile.certificates || [];
    const hasCertAlready = existingCerts.some(c => c.courseId === courseId);
    const nextCertificates = (!hasCertAlready && courseObj)
      ? [
          {
            id: `CERT-${courseObj.code}-${Date.now().toString().slice(-4)}`,
            courseId: courseObj.id,
            courseCode: courseObj.code,
            courseTitle: courseObj.title,
            score: score || 90,
            issuedAt: new Date().toLocaleDateString('fr-FR'),
            sealNumber: `ARMP-RDC-${courseObj.code}-${Math.floor(100000 + Math.random() * 900000)}`
          },
          ...existingCerts
        ]
      : existingCerts;

    const todayStr = new Date().toISOString().slice(0, 10);
    const isNewActiveDay = currentProfile.lastActiveDate !== todayStr;

    const baseWithReading = courseObj
      ? recordCourseReadingInProfile(
          currentProfile,
          courseObj,
          Math.max(0, (courseObj.lessons?.length || 1) - 1),
          100
        )
      : currentProfile;

    const updated: UserProfile = {
      ...baseWithReading,
      completedModulesCount: Math.max(
        isNewCompletion ? currentProfile.completedModulesCount + 1 : currentProfile.completedModulesCount,
        nextCompletedIds.length
      ),
      certificationsCount: Math.max(
        isNewCompletion ? currentProfile.certificationsCount + 1 : currentProfile.certificationsCount,
        nextCertificates.length
      ),
      completedCourseIds: nextCompletedIds,
      courseProgress: nextCourseProgress,
      quizScoresByCourse: nextQuizScores,
      certificates: nextCertificates,
      totalStudyMinutes: (currentProfile.totalStudyMinutes || 180) + 45,
      streakDays: isNewActiveDay ? (currentProfile.streakDays || 5) + 1 : (currentProfile.streakDays || 5),
      lastActiveDate: todayStr
    };
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    showToast(`Félicitations ! Votre attestation officielle ARMP a été générée et sauvegardée.`);
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync module completion to Firestore", e);
    }
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
      totalStudyMinutes: (currentProfile.totalStudyMinutes || 180) + 10,
      lastActiveDate: new Date().toISOString().slice(0, 10)
    };
    setProfiles((prev) => ({
      ...prev,
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync course progress to Firestore", e);
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
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync course note to Firestore", e);
    }
  };

  // Offline Download Toggle Handler
  const handleToggleOfflineDownload = async (courseId: string) => {
    const exists = currentProfile.offlineDownloads.includes(courseId);
    const nextDownloads = exists
      ? currentProfile.offlineDownloads.filter((id) => id !== courseId)
      : [...currentProfile.offlineDownloads, courseId];

    const updated: UserProfile = {
      ...currentProfile,
      offlineDownloads: nextDownloads
    };

    setProfiles((prev) => ({
      ...prev,
      [currentRole]: updated
    }));
    localStorage.setItem('armp_session_profile', JSON.stringify(updated));

    const isNowDownloaded = !exists;
    showToast(
      isNowDownloaded
        ? `Module sauvegardé en stockage local pour consultation hors-ligne (Province).`
        : `Module retiré du stockage local.`
    );

    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn("Could not sync downloads to Firestore", e);
    }
  };

  // Trainer Course Authoring Handler (persists to localStorage + Firestore)
  const handleAddCustomCourse = (newCourse: CourseModule) => {
    setCourses((prev) => {
      const updated = [newCourse, ...prev];
      try {
        const customOnes = updated.filter(c => !COURSES_DATA.some(d => d.id === c.id));
        localStorage.setItem('armp_courses_custom', JSON.stringify(customOnes));
      } catch (err) {
        console.warn("Could not save custom course", err);
      }
      return updated;
    });
    saveCustomCourseToFirestore(newCourse).catch(err => console.warn("Could not sync custom course to Firestore:", err));
    // Attribution de l'auteur pour les performances des formateurs (si pas déjà attribué)
    try {
      const authors = readModuleAuthors();
      if (!authors[newCourse.id] && currentProfile) {
        recordModuleAuthor(newCourse.id, { id: currentProfile.id, name: currentProfile.name });
      }
    } catch { /* ignore */ }
    showToast(`Formation "${newCourse.title}" publiée et sauvegardée au catalogue officiel !`);
  };

  // CGPMP Request Handlers
  const handleSubmitRequest = async (newReq: TrainingRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    showToast(`Demande ${newReq.id} transmise avec succès à la DFAT pour validation préalable.`);
    try {
      await saveTrainingRequestToFirestore(newReq);
    } catch (err) {
      console.warn("Could not save training request to Firestore", err);
    }
  };

  const handleApproveRequest = async (reqId: string, note?: string) => {
    const decidedAt = new Date().toLocaleDateString('fr-FR');
    const noteText = note || 'Visa DFAT accordé. Session programmée.';

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'Approuvé par DFAT',
              dfatNote: noteText,
              decidedAt
            }
          : r
      )
    );
    showToast(`Visa DFAT accordé pour la demande ${reqId}. Notification envoyée à la CGPMP.`);

    const found = requests.find(r => r.id === reqId);
    if (found) {
      try {
        await saveTrainingRequestToFirestore({
          ...found,
          status: 'Approuvé par DFAT',
          dfatNote: noteText,
          decidedAt
        });
      } catch (e) {
        console.warn("Could not sync approval to Firestore", e);
      }
    }
  };

  const handleRejectRequest = async (reqId: string, note: string) => {
    const decidedAt = new Date().toLocaleDateString('fr-FR');
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'Rejeté',
              dfatNote: note,
              decidedAt
            }
          : r
      )
    );
    showToast(`Demande ${reqId} rejetée avec motif transmis.`);

    const found = requests.find(r => r.id === reqId);
    if (found) {
      try {
        await saveTrainingRequestToFirestore({
          ...found,
          status: 'Rejeté',
          dfatNote: note,
          decidedAt
        });
      } catch (e) {
        console.warn("Could not sync rejection to Firestore", e);
      }
    }
  };

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
        currentProfile={currentProfile}
        allProfiles={profiles}
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
        onOpenPlacementQuiz={() => setIsPlacementOpen(true)}
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
        
        {/* TAB 1: ACCUEIL & INSTITUTIONAL PORTAL */}
        {activeTab === 'accueil' && (
          <div className="space-y-12 pb-12">
            
            {/* Hero Slider — 5 slides renforcement capacités */}
            <HeroSlider
              onExploreCourses={() => setActiveTab('catalogue')}
              onOpenTuteur={handleOpenTutor}
              onOpenPlacement={() => setIsPlacementOpen(true)}
              isDarkMode={isDarkMode}
            />

            {/* Tutoriels + Captures Téléphone/Ordinateur */}
            <TutorialSection onExploreCourses={() => setActiveTab('catalogue')} onOpenTuteur={handleOpenTutor} />

            {/* Contenu Local — 51% • ARSP • Préférence nationale */}
            <ContenuLocalSection
              onExploreCourses={() => setActiveTab('catalogue')}
              onOpenTuteur={handleOpenTutor}
              onSelectPmeDemoAccount={(demoProfile, openModuleId) => {
                handleLoginSuccess(demoProfile);
                if (openModuleId) {
                  const targetMod = courses.find((c) => c.id === openModuleId);
                  if (targetMod) {
                    setSelectedCourseForPlayer(targetMod);
                    setSubDetailBreadcrumb(`${targetMod.code} • ${targetMod.title}`);
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
                    <p className="text-[11px] text-slate-500">12 modules certifiants</p>
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
                  onClick={() => setIsPlacementOpen(true)}
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
                allProfiles={profiles}
                onSelectRole={handleRoleChange}
                courses={courses}
                requests={requests}
                onOpenCourse={handleOpenCourse}
                onOpenPlacementQuiz={() => setIsPlacementOpen(true)}
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
        {(activeTab === 'dashboard' || activeTab === 'analytics') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnalyticsDashboard
              institutionName={currentProfile.institution}
              courses={courses}
              requests={requests}
              allProfiles={profiles}
              firestoreProfiles={firestoreProfiles}
              onShowToast={showToast}
            />
          </div>
        )}

        {/* TAB 6: ESPACE FORMATEUR & STUDIO — réservé formateur connecté uniquement (pas en déconnecté) */}
        {(activeTab === 'formateur' || activeTab === 'studio-formateur') && (
          isAuthenticated && currentProfile.role === 'formateur' ? (
            <TrainerPortal
              currentProfile={currentProfile}
              allProfiles={profiles}
              courses={courses}
              onAddCourse={handleAddCustomCourse}
              onPreviewCourse={(course) => setPreviewCourse(course)}
              onOpenCoursePlayer={handleOpenCourse}
              onSwitchToTrainerRole={() => handleRoleChange('formateur')}
              isDarkMode={isDarkMode}
            />
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
              <AdminSpace
                currentProfile={currentProfile}
                courses={courses}
                requests={requests}
                allProfiles={profiles}
                firestoreProfiles={firestoreProfiles}
                onShowToast={showToast}
                onAddCourse={handleAddCustomCourse}
              />
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
        allProfiles={profiles}
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
        isOpen={isPlacementOpen}
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

      {isAuthenticated && selectedCourseForPlayer && (
        <CourseWindow
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
          onCallTutor={(action, tutorId) => {
            handleCallTutor(action, tutorId);
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
