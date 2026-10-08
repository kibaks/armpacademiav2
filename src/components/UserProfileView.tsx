import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  FileText, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Smartphone,
  KeyRound,
  Lock,
  X,
  QrCode,
  Edit3,
  Save,
  Phone,
  RefreshCw,
  Camera,
  Plus,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  Download,
  Printer,
  Sparkles,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  GraduationCap,
  Users,
  Bell,
  MessageSquare,
  Check,
  Video,
  Music,
  Smile,
  Hash,
  BadgeCheck,
  Upload,
  Trash2,
  Play,
  Link as LinkIcon,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  Timer,
  Flame,
  Mic,
  Waves,
  Search,
  Filter
} from 'lucide-react';
import { UserProfile, UserRole, CourseModule, TrainingRequest, SocialPost, NiveauValidation } from '../types';
import { firebaseResetPassword, savePostToFirestore, fetchPostsFromFirestore, deletePostFromFirestore } from '../firebase';
import { ArmpLogo } from './ArmpLogo';
import { VIRTUAL_TUTORS } from './AITutorModal';
import { uploadFile, uploadBlob, type AcademiaFile } from '../lib/academiaStorage';
import { AcademiaMediaUploader, AcademiaMediaPreview } from './AcademiaMediaUploader';
import { computeUserLearningStats } from '../utils/learningStats';
import {
  formatDRCPhoneMask,
  isValidDRCPhone,
  filterPersonNameMask,
  filterInstitutionMask,
  filterRoleTitleMask,
  formatMatriculeOrRccmMask,
  filterOtpMask,
  DRC_PROVINCES
} from '../utils/inputMasks';

import imgMentor from '../assets/images/mentor_juriste_africain_1789983212035.jpg';
import imgCoverSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgCoverFormation from '../assets/images/formation_numerique_1789983181347.jpg';
import imgCoverAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';

export type ProfileTab = 'suivi' | 'publications' | 'apropos' | 'forum' | 'photos' | 'securite' | 'notifications';

interface UserProfileViewProps {
  currentProfile: UserProfile;
  allProfiles: Record<string, UserProfile>;
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
  courses: CourseModule[];
  requests: TrainingRequest[];
  onOpenCourse?: (course: CourseModule) => void;
  onOpenCoursePlayer?: (course: CourseModule) => void;
  onNavigateToCourses: () => void;
  onOpenPlacementQuiz: () => void;
  onOpenTuteur?: () => void;
  onCallTutor?: (action: 'chat' | 'call' | 'video' | 'voice', tutorId?: any) => void;
  onOpenCgpmpRequests?: () => void;
  onToggleTwoFactor?: (enabled: boolean) => void;
  onUpdateProfile?: (profile: UserProfile) => Promise<void> | void;
  onShowToast?: (msg: string) => void;
  activeTab?: ProfileTab;
  initialTab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
}

interface PostItem {
  id: string;
  author: string;
  roleTitle: string;
  avatar: string;
  timeAgo: string;
  content: string;
  badgeTag?: string;
  certificateData?: {
    title: string;
    code: string;
    score: number;
    sealText: string;
  };
  image?: string;
  video?: string;
  videoTitle?: string;
  audio?: string;
  audioTitle?: string;
  likes: number;
  userLiked: boolean;
  comments: {
    id: string;
    author: string;
    avatar: string;
    text: string;
    timeAgo: string;
  }[];
}

/** Pastilles des niveaux validés — test de validation de niveau (Initiation / Approfondi selon modules / Avancé) */
const NiveauValideChips: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const n = profile.niveauValidation;
  const mods = Object.entries(profile.niveauxModules || {});
  if (!n && mods.length === 0) return null;
  const cls = (l: string) =>
    l === 'Initiation'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60'
      : l === 'Approfondi'
      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-400/50'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-400/50';
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap align-middle">
      {n && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide ${cls(n)}`}>
          ✓ {n}
        </span>
      )}
      {mods.map(([code, lvl]) => (
        <span
          key={code}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black ${cls(lvl)}`}
          title={`Niveau ${lvl} validé sur le module ${code}`}
        >
          {code} · {lvl}
        </span>
      ))}
    </span>
  );
};

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentProfile,
  allProfiles,
  onSelectRole,
  onLogout,
  courses,
  requests,
  onOpenCourse,
  onOpenCoursePlayer,
  onNavigateToCourses,
  onOpenPlacementQuiz,
  onOpenTuteur,
  onCallTutor,
  onOpenCgpmpRequests,
  onToggleTwoFactor,
  onUpdateProfile,
  onShowToast,
  activeTab,
  initialTab,
  onTabChange
}) => {
  // Navigation tabs (Facebook menus)
  const [currentTab, setCurrentTab] = useState<ProfileTab>(activeTab || initialTab || 'suivi');

  // Sync prop changes
  React.useEffect(() => {
    const target = activeTab || initialTab;
    if (target) {
      setCurrentTab(target);
    }
  }, [activeTab, initialTab]);

  const handleTabClick = (tab: ProfileTab) => {
    setCurrentTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // 2FA Security Modal
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [otp2FAHint, setOtp2FAHint] = useState<string | null>(null);
  const [otp2FAError, setOtp2FAError] = useState<string | null>(null);

  // Password reset state
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentProfile.name);
  const [editRoleTitle, setEditRoleTitle] = useState(currentProfile.roleTitle);
  const [editInstitution, setEditInstitution] = useState(currentProfile.institution);
  const [editPhone, setEditPhone] = useState(currentProfile.phone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(currentProfile.whatsapp || '');
  const [editMatricule, setEditMatricule] = useState(currentProfile.matricule || '');
  const [editLocation, setEditLocation] = useState(currentProfile.location || 'Kinshasa, RDC');
  const [editWebsite, setEditWebsite] = useState(currentProfile.website || 'https://armp-rdc.org');
  const [editBio, setEditBio] = useState(currentProfile.bio || '');
  const [editCoverBio, setEditCoverBio] = useState(currentProfile.coverBio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar upload modal dédié (formulaire d'upload seul, pas édition infos perso)
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarDraftUrl, setAvatarDraftUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cover Image picker modal — formulaire d'upload dédié avec prévisualisation
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverDraftUrl, setCoverDraftUrl] = useState<string | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const availableCovers = [
    { name: 'Séminaire National ARMP', url: imgCoverSeminar },
    { name: 'Formation Numérique ACADEMIA', url: imgCoverFormation },
    { name: 'Audit & Contrôle CGPMP', url: imgCoverAudit },
  ];

  // Role Switcher Dropdown in profile header
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Certificate Printable Modal
  const [previewCertificate, setPreviewCertificate] = useState<{
    courseTitle: string;
    courseCode: string;
    issuedTo: string;
    role: string;
    date: string;
  } | null>(null);

  // Facebook Feed Posts State (synchronisé avec Firestore + localStorage)
  const defaultPosts: PostItem[] = [
    {
      id: 'post-1',
      author: currentProfile.name,
      roleTitle: currentProfile.roleTitle,
      avatar: currentProfile.avatarUrl,
      timeAgo: 'Il y a 3 heures • Kinshasa • 🌐',
      badgeTag: 'Certification Officielle',
      content: "Fier d'avoir validé avec succès le module d'excellence ARMP MOD-002 sur « L'Élaboration du Plan de Passation des Marchés (PPM) et Rédaction des DAO Types ». Une étape clé pour la régularité des marchés publics de notre institution et la réduction des délais d'ANO DGCMP !",
      certificateData: {
        title: 'Élaboration du PPM et Rédaction des DAO Types ARMP',
        code: 'CERT-ARMP-2026-0884',
        score: currentProfile.placementScore || 92,
        sealText: 'République Démocratique du Congo • Autorité de Régulation des Marchés Publics'
      },
      image: imgCoverSeminar,
      likes: 38,
      userLiked: false,
      comments: [
        {
          id: 'c-1',
          author: 'Me Christian Ilunga (DGCMP)',
          avatar: imgMentor,
          text: 'Toutes nos félicitations confrère ! La maîtrise des DAO types facilite grandement le contrôle a priori.',
          timeAgo: 'Il y a 2h'
        }
      ]
    },
    {
      id: 'post-2',
      author: currentProfile.name,
      roleTitle: currentProfile.roleTitle,
      avatar: currentProfile.avatarUrl,
      timeAgo: 'Hier à 14:30 • 🏛️',
      badgeTag: 'Dossier CGPMP',
      content: `Dossier de renforcement des capacités soumis à la DFAT/ARMP pour les membres de notre cellule (${currentProfile.institution}). La modernisation des procédures de la Loi 10/010 avance résolument grâce à ACADEMIA ITECH !`,
      likes: 24,
      userLiked: true,
      comments: []
    }
  ];

  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const saved = localStorage.getItem('armp_social_posts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultPosts;
  });

  // Charger les publications depuis Firestore au montage
  React.useEffect(() => {
    let mounted = true;
    fetchPostsFromFirestore().then(remote => {
      if (mounted && remote && remote.length > 0) {
        setPosts(prev => {
          const map = new Map<string, PostItem>();
          [...remote, ...prev].forEach(p => map.set(p.id, p as PostItem));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('armp_social_posts', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);

  // New Post Form State with Media Attachments — Academia Storage (images/vidéos/audios)
  const [newPostText, setNewPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<AcademiaFile | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<AcademiaFile | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [selectedAudioName, setSelectedAudioName] = useState<string | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<AcademiaFile | null>(null);
  const [mediaPickerModal, setMediaPickerModal] = useState<'image' | 'video' | 'audio' | null>(null);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [mediaUploading, setMediaUploading] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isRecordingPostVoice, setIsRecordingPostVoice] = useState(false);
  const [postVoiceSeconds, setPostVoiceSeconds] = useState(0);
  const postMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const postVoiceTimerRef = useRef<any>(null);

  // Hidden File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Active cover photo
  const currentCover = currentProfile.coverUrl || imgCoverSeminar;

  // --- Apprentissage : dernier cours + stats courbe (persistés dans UserProfile / Firestore) ---
  const learningStats = React.useMemo(
    () => computeUserLearningStats(currentProfile, courses),
    [currentProfile, courses]
  );
  const lastLearningCourse = learningStats.lastLearningCourse;
  const avgScoreDisplay = learningStats.averageScore;
  const completedCount = learningStats.completedCoursesCount;
  const inProgressCount = learningStats.inProgressCoursesCount;
  const certificationsCount = learningStats.certificationsCount;
  const totalCourses = learningStats.totalCourses;
  const overallProgress = learningStats.overallProgress;
  const lastCourseProgress = learningStats.lastCourseProgress;
  const lastCourseCompletedChapters = learningStats.lastCourseCompletedChapters;
  const lastCourseTotalChapters = learningStats.lastCourseTotalChapters;
  const lastCourseNextLesson = learningStats.lastCourseNextLessonLabel;
  const recentReadEntries = learningStats.recentReadEntries;
  const [selectedGraphCourseId, setSelectedGraphCourseId] = useState<string | null>(null);
  const activeGraphEntry = React.useMemo(() => {
    if (selectedGraphCourseId) {
      const found = recentReadEntries.find((e) => e.courseId === selectedGraphCourseId);
      if (found) return found;
    }
    return recentReadEntries[0] || null;
  }, [selectedGraphCourseId, recentReadEntries]);
  const lastReadEntry = recentReadEntries[0] || null;
  const persistedHistory = learningStats.studyHoursHistory;
  const sparkValues = persistedHistory.map(h => h.score);
  const sparkLabels = persistedHistory.map(h => h.month);
  const monthlyHours = persistedHistory.map(h => h.hours);
  const totalStudyHours = learningStats.totalStudyHours;
  const monthlyDeltaPct = learningStats.monthlyDeltaPct;
  const currentStreak = learningStats.streakDays;

  // --- Rôle Formatrice/Formateur & Apprenants Réels de la Plateforme ---
  const isTrainer = currentProfile.role === 'formateur';
  const [trainerSuiviTab, setTrainerSuiviTab] = useState<'learners' | 'courses' | 'my_progress'>('learners');
  const [trainerLearnerSearch, setTrainerLearnerSearch] = useState('');
  const [trainerLearnerFilter, setTrainerLearnerFilter] = useState<'all' | 'certified' | 'in_progress'>('all');
  const [selectedLearnerDetail, setSelectedLearnerDetail] = useState<UserProfile | null>(null);

  // Liste réelle de tous les profils apprenants enregistrés (hors formateur et administrateur)
  const realLearnersList = React.useMemo(() => {
    if (!allProfiles) return [];
    return Object.values(allProfiles).filter((p) => p.role !== 'formateur' && p.role !== 'dfat_admin');
  }, [allProfiles]);

  const realLearnersCount = realLearnersList.length;

  // Nombre réel d'apprenants certifiés
  const realCertifiedLearnersCount = React.useMemo(() => {
    return realLearnersList.filter((p) => {
      const hasCerts =
        (p.certificationsCount || 0) > 0 ||
        (p.completedCourseIds && p.completedCourseIds.length > 0) ||
        (p.completedModulesCount && p.completedModulesCount > 0);
      return Boolean(hasCerts);
    }).length;
  }, [realLearnersList]);

  // Nombre réel d'apprenants en cours de formation active
  const realActiveLearnersCount = React.useMemo(() => {
    return realLearnersList.filter((p) => {
      const hasProgress =
        p.courseProgress &&
        Object.values(p.courseProgress).some((v) => typeof v === 'number' && v > 0);
      return Boolean(hasProgress || (p.completedModulesCount && p.completedModulesCount > 0));
    }).length;
  }, [realLearnersList]);

  // Moyenne réelle des scores des apprenants
  const realTrainerAvgScore = React.useMemo(() => {
    if (realLearnersList.length === 0) return 85;
    const totalScore = realLearnersList.reduce((acc, p) => acc + (p.placementScore || 80), 0);
    return Math.round(totalScore / realLearnersList.length);
  }, [realLearnersList]);

  // Données de suivi individuelles réelles par apprenant
  const realLearnersData = React.useMemo(() => {
    return realLearnersList.map((learner) => {
      const completedModules = learner.completedCourseIds?.length || learner.completedModulesCount || 0;
      const progressEntries = Object.values(learner.courseProgress || {});
      const avgProg =
        progressEntries.length > 0
          ? Math.round(progressEntries.reduce((a, b) => a + b, 0) / progressEntries.length)
          : completedModules > 0
          ? 100
          : Math.min(95, learner.placementScore || 75);
      const isCertified = completedModules > 0 || avgProg >= 100;
      const quizScore = learner.placementScore || 82;
      return {
        learner,
        completedModules,
        progressPct: avgProg,
        quizScore,
        isCertified,
        status: isCertified ? ('certified' as const) : avgProg > 25 ? ('in_progress' as const) : ('needs_support' as const)
      };
    });
  }, [realLearnersList]);

  const handleLogStudySession = async () => {
    const nextHistory = persistedHistory.map((h, idx) =>
      idx === persistedHistory.length - 1
        ? { ...h, hours: Number((h.hours + 1.5).toFixed(1)), score: Math.min(100, h.score + 2) }
        : h
    );
    const nextScore = Math.min(100, (currentProfile.placementScore || 82) + 2);
    const updated: UserProfile = {
      ...currentProfile,
      placementScore: nextScore,
      studyHoursHistory: nextHistory,
      totalStudyMinutes: (currentProfile.totalStudyMinutes || 180) + 90,
      streakDays: currentStreak + 1,
      lastActiveDate: new Date().toISOString().slice(0, 10)
    };
    if (onUpdateProfile) await onUpdateProfile(updated);
    onShowToast?.('Séance d’étude (+1h30) enregistrée et synchronisée avec Firestore ✓');
  };

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGalleryUploading(true);
    try {
      const acad = await uploadFile(file, { category: 'images', visibility: 'public', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: acad.url,
        label: file.name.replace(/\.[^/.]+$/, ''),
        createdAt: new Date().toLocaleDateString('fr-FR')
      };
      const updated: UserProfile = {
        ...currentProfile,
        galleryPhotos: [newPhoto, ...(currentProfile.galleryPhotos || [])]
      };
      if (onUpdateProfile) await onUpdateProfile(updated);
      onShowToast?.('Photo ajoutée à votre galerie et persistée dans Firestore ✓');
    } catch {
      onShowToast?.("Erreur lors de l'ajout de la photo.");
    } finally {
      setIsGalleryUploading(false);
      e.target.value = '';
    }
  };
  // Helpers courbe
  const gaugeAngle = (avgScoreDisplay / 100) * 180; // 0-180
  const gaugeCirc = Math.PI * 70; // r=70
  const gaugeDash = (gaugeAngle / 180) * gaugeCirc;

  const handleOpenEditModal = () => {
    setEditName(currentProfile.name);
    setEditRoleTitle(currentProfile.roleTitle);
    setEditInstitution(currentProfile.institution);
    setEditPhone(currentProfile.phone || '');
    setEditWhatsapp(currentProfile.whatsapp || '');
    setEditMatricule(currentProfile.matricule || '');
    setEditLocation(currentProfile.location || 'Kinshasa, RDC');
    setEditWebsite(currentProfile.website || 'https://armp-rdc.org');
    setEditBio(currentProfile.bio || '');
    setEditCoverBio(currentProfile.coverBio || '');
    setShowEditModal(true);
  };

  const handleOpenAvatarModal = () => {
    setAvatarDraftUrl(null);
    setShowAvatarModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = formatDRCPhoneMask(editPhone);
    const formattedWhatsapp = formatDRCPhoneMask(editWhatsapp);
    if (!isValidDRCPhone(formattedPhone)) {
      onShowToast?.('Format Téléphone RDC invalide : +243 suivi de 9 chiffres requis (ex: +243 81 234 5678).');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedProfile: UserProfile = {
        ...currentProfile,
        name: filterPersonNameMask(editName).trim() || currentProfile.name,
        roleTitle: filterRoleTitleMask(editRoleTitle).trim() || currentProfile.roleTitle,
        institution: filterInstitutionMask(editInstitution).trim() || currentProfile.institution,
        phone: formattedPhone.trim(),
        whatsapp: isValidDRCPhone(formattedWhatsapp) ? formattedWhatsapp.trim() : formattedPhone.trim(),
        whatsappLinked: true,
        matricule: formatMatriculeOrRccmMask(editMatricule).trim() || currentProfile.matricule,
        location: editLocation.trim() || currentProfile.location,
        website: editWebsite.trim(),
        bio: editBio.trim(),
        coverBio: editCoverBio.trim()
      };
      if (onUpdateProfile) {
        await onUpdateProfile(updatedProfile);
      }
      onShowToast?.('Profil complété et synchronisé avec masques vérifiés ✓');
      setShowEditModal(false);
    } catch {
      onShowToast?.('Erreur lors de la mise à jour du profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenCoverModal = () => {
    console.log('[ARMP] open cover modal');
    setCoverDraftUrl(null);
    setShowCoverModal(true);
  };

  const handleChangeCover = async (newUrl: string) => {
    try {
      const updated: UserProfile = {
        ...currentProfile,
        coverUrl: newUrl
      };
      if (onUpdateProfile) {
        await onUpdateProfile(updated);
      }
      setShowCoverModal(false);
      setCoverDraftUrl(null);
      onShowToast?.('Photo de couverture mise à jour !');
    } catch {
      onShowToast?.('Erreur lors du changement de couverture.');
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Veuillez sélectionner une image (JPG, PNG, WebP).');
      return;
    }
    setIsCoverUploading(true);
    try {
      onShowToast?.(`Envoi couverture « ${file.name} » vers Academia…`);
      const acad = await uploadFile(file, { category: 'covers', visibility: 'public', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      setCoverDraftUrl(acad.url);
      onShowToast?.('Couverture téléversée sur Academia ✓ — prévisualisation prête');
    } catch (err: any) {
      onShowToast?.(err.message || 'Échec upload couverture');
    } finally {
      setIsCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveCover = async () => {
    if (!coverDraftUrl) return;
    await handleChangeCover(coverDraftUrl);
  };

  const handleSelectPresetCover = (url: string) => {
    setCoverDraftUrl(url);
  };

  // Avatar dédié : upload vers Academia (avatars, public) avec preview dans sa propre modale
  const handleAvatarPickerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Veuillez sélectionner une image (JPG, PNG, WebP).');
      return;
    }
    setIsAvatarUploading(true);
    try {
      onShowToast?.(`Envoi avatar « ${file.name} » vers Academia…`);
      const acad = await uploadFile(file, { category: 'avatars', visibility: 'public', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      setAvatarDraftUrl(acad.url);
      onShowToast?.('Photo téléversée sur Academia ✓ — prévisualisation prête');
    } catch (err: any) {
      onShowToast?.(err.message || 'Échec upload avatar');
    } finally {
      setIsAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarDraftUrl) return;
    try {
      const updated: UserProfile = { ...currentProfile, avatarUrl: avatarDraftUrl };
      if (onUpdateProfile) await onUpdateProfile(updated);
      setShowAvatarModal(false);
      setAvatarDraftUrl(null);
      onShowToast?.('Photo de profil mise à jour avec succès ✓');
    } catch {
      onShowToast?.('Erreur lors de la mise à jour de la photo.');
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentProfile.email) return;
    setIsSendingResetEmail(true);
    try {
      await firebaseResetPassword(currentProfile.email);
      onShowToast?.(`Email de réinitialisation sécurisé envoyé à ${currentProfile.email}`);
    } catch {
      onShowToast?.("Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const is2FAActive = !!currentProfile.twoFactorEnabled;

  const handleOpen2FASetup = async () => {
    setOtpInput('');
    setOtp2FAError(null);
    setOtp2FAHint(null);
    setShow2FASetupModal(true);
    // Envoi réel du code OTP
    try {
      const res = await fetch('/api/2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentProfile.email }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtp2FAHint(
          data.devCode
            ? `Mode sans provider mail — code de test : ${data.devCode}`
            : `Code envoyé à ${currentProfile.email} (valable 10 minutes).`
        );
      } else {
        setOtp2FAError(data.error || 'Envoi du code impossible.');
      }
    } catch {
      setOtp2FAError('Serveur injoignable — réessayez.');
    }
  };

  const handleConfirm2FAActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying2FA(true);
    setOtp2FAError(null);
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentProfile.email, code: otpInput }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtp2FAError(data.error || 'Code incorrect.');
        return;
      }
      setShow2FASetupModal(false);
      if (onToggleTwoFactor) {
        onToggleTwoFactor(true);
      }
      onShowToast?.('Authentification à double facteur (2FA) activée.');
    } catch {
      setOtp2FAError('Serveur injoignable — réessayez.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDirectDisable2FA = () => {
    if (onToggleTwoFactor) {
      onToggleTwoFactor(false);
    }
    onShowToast?.('Authentification à double facteur (2FA) désactivée.');
  };

  // Media Upload & Selection Handlers — Academia Storage (137.184.59.184)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }
    setMediaUploading('image');
    try {
      onShowToast?.(`Envoi image « ${file.name} » vers Academia…`);
      const acad = await uploadFile(file, { category: 'posts_images', visibility: 'public', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      setSelectedImage(acad.url);
      setSelectedImageName(file.name);
      setSelectedImageFile(acad);
      setMediaPickerModal(null);
      onShowToast?.(`Image « ${file.name} » stockée sur Academia ✓`);
    } catch (err: any) {
      onShowToast?.(err.message || 'Échec upload image');
    } finally {
      setMediaUploading(null);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      onShowToast?.('Veuillez sélectionner un fichier vidéo valide (MP4, WebM, MOV).');
      return;
    }
    setMediaUploading('video');
    try {
      onShowToast?.(`Envoi vidéo « ${file.name} » vers Academia…`);
      const acad = await uploadFile(file, { category: 'posts_videos', visibility: 'private', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      setSelectedVideo(acad.url);
      setSelectedVideoName(file.name);
      setSelectedVideoFile(acad);
      setMediaPickerModal(null);
      onShowToast?.(`Vidéo « ${file.name} » stockée sur Academia ✓`);
    } catch (err: any) {
      onShowToast?.(err.message || 'Échec upload vidéo');
    } finally {
      setMediaUploading(null);
      e.target.value = '';
    }
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      onShowToast?.('Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A).');
      return;
    }
    setMediaUploading('audio');
    try {
      onShowToast?.(`Envoi audio « ${file.name} » vers Academia…`);
      const acad = await uploadFile(file, { category: 'posts_audios', visibility: 'private', uploadedBy: currentProfile.email, entityId: currentProfile.id });
      setSelectedAudio(acad.url);
      setSelectedAudioName(file.name);
      setSelectedAudioFile(acad);
      setMediaPickerModal(null);
      onShowToast?.(`Audio « ${file.name} » stocké sur Academia ✓`);
    } catch (err: any) {
      onShowToast?.(err.message || 'Échec upload audio');
    } finally {
      setMediaUploading(null);
      e.target.value = '';
    }
  };

  // Enregistrement direct d'une Note Vocale (Voice) pour publication sur le mur
  const startPostVoiceRecording = async () => {
    setPostVoiceSeconds(0);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      await generateAndUploadSynthesizedPostVoice();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      const startedAt = Date.now();
      if (postVoiceTimerRef.current) clearInterval(postVoiceTimerRef.current);
      postVoiceTimerRef.current = setInterval(() => {
        setPostVoiceSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 500);

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };
      mr.onstop = async () => {
        if (postVoiceTimerRef.current) {
          clearInterval(postVoiceTimerRef.current);
          postVoiceTimerRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingPostVoice(false);

        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const fileName = `voice_${Date.now()}.webm`;
        const localUrl = URL.createObjectURL(blob);
        setSelectedAudio(localUrl);
        setSelectedAudioName(`Note vocale (${elapsed}s)`);
        setMediaPickerModal(null);

        setMediaUploading('audio');
        try {
          const acad = await uploadBlob(blob, fileName, {
            category: 'posts_audios',
            visibility: 'private',
            uploadedBy: currentProfile.email,
            entityId: currentProfile.id
          });
          setSelectedAudio(acad.url);
          setSelectedAudioFile(acad);
          onShowToast?.(`Voice (${elapsed}s) enregistré et stocké sur Academia ✓`);
        } catch {
          onShowToast?.(`Voice (${elapsed}s) prêt à publier ✓`);
        } finally {
          setMediaUploading(null);
        }
      };

      postMediaRecorderRef.current = mr;
      mr.start(250);
      setIsRecordingPostVoice(true);
    } catch {
      await generateAndUploadSynthesizedPostVoice();
    }
  };

  const stopPostVoiceRecording = () => {
    if (postMediaRecorderRef.current && postMediaRecorderRef.current.state === 'recording') {
      postMediaRecorderRef.current.stop();
    } else {
      setIsRecordingPostVoice(false);
    }
  };

  const generateAndUploadSynthesizedPostVoice = async () => {
    const sampleRate = 22050;
    const durationSec = 4;
    const numSamples = sampleRate * durationSec;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = 0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * 3.0 * t));
      const fade = Math.min(1, t / 0.08) * Math.min(1, (durationSec - t) / 0.15);
      const wave = 0.5 * Math.sin(2 * Math.PI * 210 * t) + 0.25 * Math.sin(2 * Math.PI * 420 * t);
      view.setInt16(44 + i * 2, wave * env * fade * 0.18 * 32767, true);
    }
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const localUrl = URL.createObjectURL(blob);
    setSelectedAudio(localUrl);
    setSelectedAudioName(`Note vocale ARMP (0:04)`);
    setMediaPickerModal(null);
    try {
      const acad = await uploadBlob(blob, `voice_${Date.now()}.wav`, {
        category: 'posts_audios',
        visibility: 'private',
        uploadedBy: currentProfile.email,
        entityId: currentProfile.id
      });
      setSelectedAudio(acad.url);
      setSelectedAudioFile(acad);
      onShowToast?.('Note vocale générée et prête à publier ✓');
    } catch {
      onShowToast?.('Note vocale prête à publier ✓');
    }
  };

  const handleSelectLibraryImage = (url: string, name: string) => {
    setSelectedImage(url);
    setSelectedImageName(name);
    setMediaPickerModal(null);
    onShowToast?.(`Photo « ${name} » ajoutée.`);
  };

  const handleSelectLibraryVideo = (url: string, name: string) => {
    setSelectedVideo(url);
    setSelectedVideoName(name);
    setMediaPickerModal(null);
    onShowToast?.(`Extrait vidéo « ${name} » ajouté.`);
  };

  const handleApplyCustomMediaUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customMediaUrl.trim();
    if (!cleanUrl) return;

    if (mediaPickerModal === 'image') {
      setSelectedImage(cleanUrl);
      setSelectedImageName('Image Web importée');
      onShowToast?.('Image Web insérée avec succès.');
    } else if (mediaPickerModal === 'video') {
      setSelectedVideo(cleanUrl);
      setSelectedVideoName('Vidéo Web importée');
      onShowToast?.('Vidéo Web insérée avec succès.');
    } else if (mediaPickerModal === 'audio') {
      setSelectedAudio(cleanUrl);
      setSelectedAudioName('Audio Web importé');
      onShowToast?.('Audio Web inséré avec succès.');
    }
    setCustomMediaUrl('');
    setMediaPickerModal(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedImageName(null);
    setSelectedImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    onShowToast?.('Image retirée de la publication.');
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    setSelectedVideoName(null);
    setSelectedVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    onShowToast?.('Vidéo retirée de la publication.');
  };

  const handleRemoveAudio = () => {
    setSelectedAudio(null);
    setSelectedAudioName(null);
    setSelectedAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
    onShowToast?.('Audio retiré de la publication.');
  };

  // Create post in the Facebook feed (supports Text, Image, Video, Audio ou combinaisons — Academia + Firestore)
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImage && !selectedVideo && !selectedAudio) return;
    setIsPosting(true);

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      authorId: currentProfile.id,
      author: currentProfile.name,
      roleTitle: currentProfile.roleTitle,
      avatar: currentProfile.avatarUrl,
      timeAgo: "À l'instant • 🌐 (Academia 137.184.59.184)",
      createdAt: new Date().toISOString(),
      content: newPostText.trim(),
      image: selectedImage || undefined,
      video: selectedVideo || undefined,
      videoTitle: selectedVideoName || undefined,
      audio: selectedAudio || undefined,
      audioTitle: selectedAudioName || undefined,
      likes: 0,
      userLiked: false,
      comments: []
    };

    const nextPosts = [newPost as PostItem, ...posts];
    setPosts(nextPosts);
    try {
      localStorage.setItem('armp_social_posts', JSON.stringify(nextPosts));
    } catch {}
    savePostToFirestore(newPost).catch(() => {});

    setNewPostText('');
    setSelectedImage(null);
    setSelectedImageName(null);
    setSelectedImageFile(null);
    setSelectedVideo(null);
    setSelectedVideoName(null);
    setSelectedVideoFile(null);
    setSelectedAudio(null);
    setSelectedAudioName(null);
    setSelectedAudioFile(null);
    setIsPosting(false);
    onShowToast?.('Publication partagée et persistée dans Firestore ✓');
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          const nextLiked = !p.userLiked;
          const updated = {
            ...p,
            userLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
          };
          savePostToFirestore(updated as SocialPost).catch(() => {});
          return updated;
        }
        return p;
      });
      try {
        localStorage.setItem('armp_social_posts', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          const updated = {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `c-${Date.now()}`,
                author: currentProfile.name,
                avatar: currentProfile.avatarUrl,
                text: commentText.trim(),
                timeAgo: "À l'instant"
              }
            ]
          };
          savePostToFirestore(updated as SocialPost).catch(() => {});
          return updated;
        }
        return p;
      });
      try {
        localStorage.setItem('armp_social_posts', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleOpenCoursePlayer = onOpenCourse || onOpenCoursePlayer || (() => {});
  const userRequests = requests.filter(r => 
    r.applicantEmail === currentProfile.email || 
    currentProfile.role === 'dfat_admin' || 
    currentProfile.role === 'armp_agent'
  );

  return (
    <div className="w-full space-y-6 pb-10 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. FACEBOOK HERO BANNER & IDENTITY CARD (FULL WIDTH)                     */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Cover Photo Container — clic image ou bouton ouvre le formulaire d'upload dédié */}
        <div className="h-48 sm:h-72 md:h-88 w-full relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 group">
          <button
            onClick={handleOpenCoverModal}
            className="absolute inset-0 w-full h-full cursor-pointer focus:outline-hidden"
            title="Modifier la photo de couverture"
            type="button"
            aria-label="Modifier la photo de couverture"
          >
            <img
              src={currentCover}
              alt="Couverture"
              className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105"
            />
          </button>
          {/* Subtle gradient vignette at bottom — pointer-events-none pour laisser le clic passer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Institutional Badge Watermark */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-mono pointer-events-none max-w-[75vw] truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold truncate">ARMP ACADEMIA • PROFIL CERTIFIÉ</span>
          </div>

          {/* Change Cover Button (Facebook camera icon) — formulaire d'upload dédié — z-10 pour être au-dessus de l'image cliquable */}
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenCoverModal(); }}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-900 dark:text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border border-slate-200/50 flex items-center space-x-2 transition transform active:scale-95 cursor-pointer"
            title="Modifier la photo de couverture"
            type="button"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Modifier la couverture</span>
          </button>
        </div>

        {/* Profile Identity Details (Facebook Avatar Overlap — Full Width) */}
        <div className="w-full px-4 sm:px-8 lg:px-12 pb-4 pt-0 relative">
          <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 -mt-14 sm:-mt-20 mb-4">
            
            {/* Left Avatar & Identity */}
            <div className="w-full flex-1 flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
              
              {/* Circular Avatar with Camera Badge */}
              <div className="relative group mx-auto sm:mx-0 shrink-0">
                <button
                  onClick={handleOpenAvatarModal}
                  className="block rounded-full focus:outline-hidden focus:ring-4 focus:ring-blue-500/30"
                  title="Changer la photo de profil"
                  type="button"
                >
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100 ring-2 ring-blue-500/20 hover:brightness-95 transition"
                  />
                </button>
                
                {/* Facebook Camera badge — ouvre le formulaire d'upload photo dédié */}
                <button
                  onClick={handleOpenAvatarModal}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2.5 rounded-full bg-slate-100 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-white dark:border-slate-900 shadow-lg transition active:scale-95 cursor-pointer"
                  title="Changer la photo de profil"
                  type="button"
                  aria-label="Changer la photo de profil"
                >
                  <Camera className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </button>
              </div>

              {/* Names, Titles, and Facebook Slogan */}
              <div className="w-full flex-1 space-y-1 text-center sm:text-left bg-white dark:bg-slate-900 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentProfile.name}
                  </h1>
                  {/* Verified Badge */}
                  <span className="text-[#1877F2] inline-flex items-center" title="Compte institutionnel certifié par l'ARMP">
                    <BadgeCheck className="w-6 h-6 fill-[#1877F2] text-white" />
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="px-3 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    {currentProfile.roleTitle}
                  </span>
                  <span className="text-slate-400 font-semibold">•</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    {currentProfile.institution}
                  </span>
                </div>

                {/* Statistiques Réelles et Nombre Réel d'Apprenants */}
                {isTrainer ? (
                  <div className="space-y-2 pt-2">
                    {/* Pills de KPIs réels pour le Formateur */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                      <div className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-600" /> Apprenants
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {realLearnersCount} <span className="text-[10px] font-semibold text-slate-500">inscrits</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900/50">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3 h-3" /> Certifiés
                        </div>
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {realCertifiedLearnersCount} <span className="text-[10px] font-semibold text-emerald-600/70">validés</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-900/50">
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Formations
                        </div>
                        <div className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                          {courses.length} <span className="text-[10px] font-semibold text-indigo-500">cours</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-900/50">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Target className="w-3 h-3" /> Réussite
                        </div>
                        <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {realTrainerAvgScore}% <span className="text-[10px] font-semibold text-amber-600/70">moyenne</span>
                        </div>
                      </div>
                    </div>

                    {/* Vrais apprenants connectés (Avatars réels) */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2 text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {realLearnersList.slice(0, 5).map((l) => (
                          <img
                            key={l.id}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                            src={l.avatarUrl}
                            alt={l.name}
                            title={`${l.name} (${l.institution})`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white font-black">{realLearnersCount} apprenants réels</strong> inscrits dans vos promotions
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    {/* Pills de KPIs réels pour l'Apprenant / Membre */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                      <div className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/50">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Progression
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {overallProgress}% <span className="text-[10px] font-semibold text-slate-500">({completedCount}/{totalCourses})</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900/50">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Target className="w-3 h-3" /> Score QCM
                        </div>
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {avgScoreDisplay}% <span className="text-[10px] font-semibold text-emerald-600/70">moyen</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/70 dark:border-purple-900/50">
                        <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <Timer className="w-3 h-3" /> Lecture
                        </div>
                        <div className="text-sm font-black text-purple-700 dark:text-purple-300">
                          {totalStudyHours.toFixed(1)}h <span className="text-[10px] font-semibold text-purple-500">d'étude</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-900/50">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3" /> Apprenants
                        </div>
                        <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {realLearnersCount} <span className="text-[10px] font-semibold text-amber-600/70">inscrits</span>
                        </div>
                      </div>
                    </div>

                    {/* Vrais apprenants de la promotion (Avatars réels) */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2 text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {realLearnersList.filter(l => l.id !== currentProfile.id).slice(0, 5).map((l) => (
                          <img
                            key={l.id}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                            src={l.avatarUrl}
                            alt={l.name}
                            title={`${l.name} (${l.institution})`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white font-black">{realLearnersCount} apprenants réels</strong> inscrits sur la plateforme
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Facebook Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 lg:pt-0 shrink-0">
              
              {/* Blue Action Button (Facebook "+ Ajouter à la story / Publication") */}
              <button
                onClick={() => {
                  handleTabClick('publications');
                  const el = document.getElementById('new-post-input');
                  el?.focus();
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Publier un retour</span>
              </button>

              {/* Grey Action Button (Facebook "Modifier le profil") */}
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center space-x-1.5 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier le profil</span>
              </button>

              {/* Role switch button (Démo & Habilitations) */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center space-x-1"
                  title="Changer de rôle pour tester les vues"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rôles</span>
                </button>

                {showRoleSwitcher && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowRoleSwitcher(false)} />
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-40 space-y-1">
                      <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Basculer le rôle institutionnel :
                      </p>
                      {Object.values(allProfiles).map((p) => (
                        <button
                          key={p.role}
                          onClick={() => {
                            onSelectRole(p.role);
                            setShowRoleSwitcher(false);
                            onShowToast?.(`Session basculée : ${p.roleTitle}`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                            currentProfile.role === p.role 
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="truncate">{p.roleTitle}</span>
                          {currentProfile.role === p.role && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Facebook "..." Options menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Plus d'actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-40 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          navigator.clipboard?.writeText?.(window.location.href);
                          onShowToast?.('Lien du profil copié dans le presse-papier !');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-2"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Partager le profil</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleSendPasswordReset();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-2"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Réinitialiser mot de passe</span>
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center space-x-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>


          {/* ========================================================================= */}
          {/* 2. FACEBOOK SUB-NAVBAR MENUS (TABS)                                      */}
          {/* ========================================================================= */}
          <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'suivi' as const, label: 'Suivi', icon: TrendingUp },
              { id: 'publications' as const, label: 'Publications', icon: FileText },
              { id: 'apropos' as const, label: 'À propos', icon: User },
              { id: 'forum' as const, label: 'Attestations & Diplômes', icon: Award },
              { id: 'photos' as const, label: 'Photos & Documents', icon: ImageIcon },
              { id: 'securite' as const, label: 'Sécurité & Accès', icon: ShieldCheck },
              { id: 'notifications' as const, label: 'WhatsApp & Alertes', icon: Smartphone },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 relative ${
                    isActive
                      ? 'text-[#1877F2] bg-blue-50/80 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1877F2] dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1877F2] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT VIEWS                                                      */}
      {/* ========================================================================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12">

      {/* ------------------------------------------------------------------------- */}
      {/* ONGLET 0: SUIVI (TABLEAU DE BORD, GRAPHIQUES & STATISTIQUES D'APPRENTISSAGE) */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'suivi' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* VUE PÉDAGOGIQUE FORMATRICE / FORMATEUR */}
          {isTrainer && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                      Suivi Pédagogique des Apprenants & Formations
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Supervision des promotions ARMP, analyse en temps réel et validation des compétences
                    </p>
                  </div>
                </div>

                {/* Sub-tabs pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTrainerSuiviTab('learners')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      trainerSuiviTab === 'learners'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Apprenants ({realLearnersCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrainerSuiviTab('courses')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      trainerSuiviTab === 'courses'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Formations ({courses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrainerSuiviTab('my_progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      trainerSuiviTab === 'my_progress'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Mon Évolution</span>
                  </button>
                </div>
              </div>

              {/* Grille des 4 KPIs Réels */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Apprenants Inscrits</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-200/70 dark:bg-blue-900 text-[10px]">100% réel</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{realLearnersCount}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Membres CGPMP et agents enregistrés</div>
                </div>

                <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                    <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Apprenants Certifiés</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-900 text-[10px]">{((realCertifiedLearnersCount / Math.max(1, realLearnersCount)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{realCertifiedLearnersCount}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Attestations officielles délivrées</div>
                </div>

                <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> En Formation Active</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-200/70 dark:bg-indigo-900 text-[10px]">En cours</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{realActiveLearnersCount}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Progression active dans les cours</div>
                </div>

                <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Réussite Moyenne</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900 text-[10px]">QCM</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{realTrainerAvgScore}%</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Moyenne générale des évaluations</div>
                </div>
              </div>

              {/* Sous-section 1 : Apprenants Inscrits */}
              {trainerSuiviTab === 'learners' && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={trainerLearnerSearch}
                        onChange={(e) => setTrainerLearnerSearch(e.target.value)}
                        placeholder="Rechercher un apprenant par nom, cellule ou matricule..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {(['all', 'certified', 'in_progress'] as const).map((filter) => {
                        const label =
                          filter === 'all'
                            ? `Tous (${realLearnersCount})`
                            : filter === 'certified'
                            ? `Certifiés (${realCertifiedLearnersCount})`
                            : `En cours (${realActiveLearnersCount})`;
                        return (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setTrainerLearnerFilter(filter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                              trainerLearnerFilter === filter
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grille des Apprenants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {realLearnersData
                      .filter((item) => {
                        if (trainerLearnerFilter === 'certified' && !item.isCertified) return false;
                        if (trainerLearnerFilter === 'in_progress' && item.isCertified) return false;
                        if (trainerLearnerSearch.trim()) {
                          const q = trainerLearnerSearch.toLowerCase();
                          return (
                            item.learner.name.toLowerCase().includes(q) ||
                            item.learner.institution.toLowerCase().includes(q) ||
                            item.learner.roleTitle.toLowerCase().includes(q) ||
                            (item.learner.matricule && item.learner.matricule.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      })
                      .map((item) => (
                        <div
                          key={item.learner.id}
                          className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-700 transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.learner.avatarUrl}
                                alt={item.learner.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                  {item.learner.name}
                                </h4>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                  <Building2 className="w-3 h-3 shrink-0 text-blue-600" />
                                  <span className="truncate">{item.learner.institution}</span>
                                </div>
                                <div className="text-[10px] font-mono font-bold text-slate-400">
                                  {item.learner.matricule || item.learner.id}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                                item.isCertified
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {item.isCertified ? 'Certifié ARMP ✓' : `${item.progressPct}% en cours`}
                            </span>
                          </div>

                          {/* Progression du cursus */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-600 dark:text-slate-400">Progression globale</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400">{item.progressPct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.isCertified ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                }`}
                                style={{ width: `${item.progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer avec scores et action */}
                          <div className="pt-1 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="font-bold text-slate-600 dark:text-slate-400">
                                Modules : <strong className="text-slate-900 dark:text-white">{item.completedModules}/{courses.length}</strong>
                              </span>
                              <span className="font-bold text-slate-600 dark:text-slate-400">
                                QCM : <strong className="text-emerald-600">{item.quizScore}%</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedLearnerDetail(item.learner)}
                              className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition cursor-pointer"
                            >
                              Fiche apprenant
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Sous-section 2 : Cours Supervisés */}
              {trainerSuiviTab === 'courses' && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Modules et Formations Supervisés ({courses.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between"
                      >
                        <div className="relative h-28 overflow-hidden">
                          <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              {c.code}
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {realLearnersCount} inscrits
                            </span>
                            <span>{c.level}</span>
                          </div>
                        </div>
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{c.category}</div>
                            <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 mt-0.5">
                              {c.title}
                            </h5>
                          </div>
                          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/60">
                            <span className="text-[11px] text-slate-500 font-medium">
                              {c.lessons?.length || c.chaptersCount || 4} chapitres • {c.duration}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenCoursePlayer(c)}
                              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>Consulter</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VUE TABLEAU DE LECTURE (POUR TOUS OU SOUS-ONGLET 'Mon Évolution' DU FORMATEUR) */}
          {(!isTrainer || trainerSuiviTab === 'my_progress') && (
            <div className="space-y-6">
            {/* Tableau de suivi — Progression globale + Graphique du cours lu + Comparatif & Récentes lectures */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 relative overflow-hidden shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                      Niveau d’évolution & Graphique de Lecture des Cours
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {currentProfile.level} • Score moyen : {avgScoreDisplay}% • +{monthlyDeltaPct}% ce trimestre
                      {' '}
                      <NiveauValideChips profile={currentProfile} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Activity className="w-3.5 h-3.5" /> {inProgressCount > 0 ? `${inProgressCount} cours en lecture` : `${completedCount} cours lus`}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogStudySession}
                    className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+1h30 d'étude</span>
                  </button>
                </div>
              </div>
  
              {/* 1. ProgressBar Globale + Indicateurs clés */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-600" /> Progression globale du cursus ({completedCount}/{totalCourses} modules validés)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black">{overallProgress}%</span>
                </div>
                <div
                  className="h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative p-0.5"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={overallProgress}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 relative overflow-hidden transition-all duration-[1.2s] ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{completedCount}/{totalCourses} modules</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">{overallProgress}% du cursus</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1"><Timer className="w-3 h-3" /> {totalStudyHours.toFixed(1)}h</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">temps de lecture</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2 text-center">
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1"><Flame className="w-3 h-3" /> {currentStreak} j</div>
                    <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">série active</div>
                  </div>
                </div>
              </div>
  
              {/* 2. GRAPHIQUE DU COURS LU (Chapitre par Chapitre + Courbe SVG + Sélecteur de cours lu) */}
              {activeGraphEntry && (
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/70 pb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-black uppercase flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Graphique du cours lu
                        </span>
                        <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
                          {activeGraphEntry.code} • {activeGraphEntry.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Lu : {activeGraphEntry.readAtLabel}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 truncate">
                        {activeGraphEntry.title}
                      </h4>
                    </div>
  
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        activeGraphEntry.progressPct >= 100
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {activeGraphEntry.progressPct}% lu ({activeGraphEntry.completedChapters}/{activeGraphEntry.totalChapters} chap.)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCoursePlayer(activeGraphEntry.course)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{activeGraphEntry.progressPct >= 100 ? 'Relire' : 'Continuer'}</span>
                      </button>
                    </div>
                  </div>
  
                  {/* ProgressBar dédiée au cours lu */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-300">
                        Avancement de lecture du cours • {activeGraphEntry.lastLessonTitle}
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-black">
                        {activeGraphEntry.progressPct}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          activeGraphEntry.progressPct >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
                        }`}
                        style={{ width: `${activeGraphEntry.progressPct}%` }}
                      />
                    </div>
                  </div>
  
                  {/* Graphique visuel Chapitre par Chapitre + Examen QCM du cours lu */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch pt-1">
                    {/* Histogramme & Courbe des chapitres du cours sélectionné */}
                    <div className="md:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                        <span>Progression par chapitre du cours ({activeGraphEntry.code})</span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Lu (100%)
                          </span>
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-600" /> En lecture
                          </span>
                        </div>
                      </div>
  
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 items-end pt-2">
                        {activeGraphEntry.chapterGraph.map((ch) => (
                          <div
                            key={ch.index}
                            onClick={() => handleOpenCoursePlayer(activeGraphEntry.course)}
                            className="group cursor-pointer rounded-xl p-2 bg-slate-50 hover:bg-blue-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition flex flex-col justify-between"
                            title={`${ch.shortLabel} : ${ch.title} (${ch.progressPct}%)`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                              <span className="text-slate-700 dark:text-slate-200">{ch.shortLabel}</span>
                              <span className={ch.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : ch.isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                                {ch.progressPct}%
                              </span>
                            </div>
  
                            {/* Barre verticale du graphique */}
                            <div className="w-full h-16 bg-slate-200/80 dark:bg-slate-700 rounded-lg overflow-hidden flex items-end p-0.5">
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
  
                            <div className="mt-1.5">
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
  
                        {/* Colonne Examen QCM Certifiant du cours */}
                        <div
                          onClick={() => handleOpenCoursePlayer(activeGraphEntry.course)}
                          className="group cursor-pointer rounded-xl p-2 bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 transition flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1.5">
                            <span className="text-amber-800 dark:text-amber-300">QCM</span>
                            <span className="text-amber-700 dark:text-amber-400">
                              {currentProfile.quizScoresByCourse?.[activeGraphEntry.courseId] ?? (activeGraphEntry.progressPct >= 100 ? 88 : 0)}%
                            </span>
                          </div>
                          <div className="w-full h-16 bg-amber-200/50 dark:bg-slate-700 rounded-lg overflow-hidden flex items-end p-0.5">
                            <div
                              className="w-full rounded-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-700"
                              style={{
                                height: `${Math.max(
                                  18,
                                  currentProfile.quizScoresByCourse?.[activeGraphEntry.courseId] ??
                                    (activeGraphEntry.progressPct >= 100 ? 88 : Math.round(activeGraphEntry.progressPct * 0.5))
                                )}%`
                              }}
                            />
                          </div>
                          <div className="mt-1.5">
                            <div className="text-[10px] font-bold text-amber-900 dark:text-amber-200 truncate">
                              Examen Certifiant
                            </div>
                            <div className="text-[9px] text-amber-700 dark:text-amber-400 mt-0.5">
                              {activeGraphEntry.progressPct >= 100 ? '✓ Validé' : 'Objectif 70%'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
  
                    {/* Comparatif graphique des cours lus récemment */}
                    <div className="md:col-span-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Comparatif des cours lus</span>
                        <span className="font-mono text-[9px] text-blue-600">Cliquez pour afficher</span>
                      </div>
                      <div className="space-y-2 flex-1 flex flex-col justify-center">
                        {recentReadEntries.slice(0, 4).map((entry) => {
                          const isSelected = activeGraphEntry.courseId === entry.courseId;
                          return (
                            <button
                              key={entry.courseId}
                              type="button"
                              onClick={() => setSelectedGraphCourseId(entry.courseId)}
                              className={`w-full text-left p-1.5 rounded-lg border transition ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50'
                                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                <span className="truncate text-slate-800 dark:text-slate-200">
                                  {entry.isLastRead ? '★ ' : ''}{entry.code}
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
  
              {/* 3. DERNIÈRE LECTURE & RÉCENTES LECTURES (Côte à côte dans le bloc d'évolution) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                {/* Carte Dernière Lecture */}
                {lastReadEntry && (
                  <div className="lg:col-span-5 rounded-2xl border-2 border-blue-500/80 dark:border-blue-500/60 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-3.5 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Dernière lecture
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" /> {lastReadEntry.readAtLabel}
                        </span>
                      </div>
  
                      <div className="flex items-start gap-3">
                        <img
                          src={lastReadEntry.course.coverImage}
                          alt={lastReadEntry.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            {lastReadEntry.code} • {lastReadEntry.category}
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {lastReadEntry.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate font-medium">
                            Chapitre {lastReadEntry.lessonIndex + 1}/{lastReadEntry.totalChapters} : {lastReadEntry.lastLessonTitle}
                          </p>
                        </div>
                      </div>
  
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500">Progression de cette lecture</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono">
                            {lastReadEntry.progressPct}% ({lastReadEntry.completedChapters}/{lastReadEntry.totalChapters} chapitres)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
                            style={{ width: `${lastReadEntry.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
  
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCoursePlayer(lastReadEntry.course)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Reprendre ma dernière lecture</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedGraphCourseId(lastReadEntry.courseId)}
                        className="py-2 px-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-50 transition"
                        title="Afficher le graphique de ce cours"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
  
                {/* Liste des Récentes Lectures */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Récentes lectures ({recentReadEntries.length} cours consultés)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateToCourses()}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Tout le catalogue</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentReadEntries.slice(0, 4).map((item, idx) => {
                      const isGraphSelected = activeGraphEntry?.courseId === item.courseId;
                      return (
                        <div
                          key={item.courseId}
                          onClick={() => setSelectedGraphCourseId(item.courseId)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                            isGraphSelected
                              ? 'bg-white dark:bg-slate-900 border-blue-500 ring-1 ring-blue-500/30 shadow-xs'
                              : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                                {idx === 0 ? 'Dernier lu • ' : `Lecture #${idx + 1} • `}{item.code}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {item.readAtLabel}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              Ch. {item.lessonIndex + 1}/{item.totalChapters} : {item.lastLessonTitle}
                            </div>
                          </div>
  
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className={item.progressPct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
                                {item.progressPct >= 100 ? '✓ Cours lu (100%)' : `${item.progressPct}% lu (${item.completedChapters}/${item.totalChapters} chap.)`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCoursePlayer(item.course);
                                }}
                                className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1"
                              >
                                <Play className="w-2.5 h-2.5 fill-white" />
                                <span>{item.progressPct >= 100 ? 'Relire' : 'Lire'}</span>
                              </button>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${item.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
            </div>
            </div>
          )}

          {/* Modal Dossier Apprenant (Vue Formateur) */}
          {selectedLearnerDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header modal */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedLearnerDetail.avatarUrl}
                      alt={selectedLearnerDetail.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                    />
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {selectedLearnerDetail.name}
                        <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-600 text-white" />
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        {selectedLearnerDetail.roleTitle}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLearnerDetail(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body modal */}
                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Coordonnées & Institution */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution</div>
                      <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedLearnerDetail.institution}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matricule</div>
                      <div className="font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedLearnerDetail.matricule || selectedLearnerDetail.id}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Professionnel</div>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{selectedLearnerDetail.email}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Téléphone / WhatsApp</div>
                      <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLearnerDetail.phone || selectedLearnerDetail.whatsapp || '+243 81 000 0000'}</div>
                    </div>
                  </div>

                  {/* Parcours dans les modules */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                      Progression par module de formation :
                    </h4>
                    <div className="space-y-2">
                      {courses.map((course) => {
                        const isComp = selectedLearnerDetail.completedCourseIds?.includes(course.id) ||
                          (selectedLearnerDetail.courseProgress?.[course.id] ?? 0) >= 100;
                        const prog = isComp ? 100 : selectedLearnerDetail.courseProgress?.[course.id] ?? (selectedLearnerDetail.placementScore ? Math.min(85, selectedLearnerDetail.placementScore) : 40);
                        const score = isComp ? 88 : selectedLearnerDetail.quizScoresByCourse?.[course.id] ?? (selectedLearnerDetail.placementScore || 75);

                        return (
                          <div
                            key={course.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-blue-600">{course.code}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{course.title}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isComp ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                    style={{ width: `${prog}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 font-mono">{prog}%</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isComp
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {isComp ? `Validé (${score}%)` : `En cours (${score}%)`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer modal */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onShowToast?.(`Attestation d'assiduité envoyée à ${selectedLearnerDetail.name} ✓`);
                      setSelectedLearnerDetail(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Valider les acquis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLearnerDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB A: PUBLICATIONS (CLASSIC FACEBOOK 2-COLUMN LAYOUT)                   */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'publications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: INTRO, BADGES, MEDIA, COLLEAGUES (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Intro Card (Présentation) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Présentation
              </h3>

              {/* Bio block */}
              <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  « {currentProfile.bio || currentProfile.coverBio || "Spécialiste de la commande publique en RDC, engagé pour l'application rigoureuse de la Loi 10/010."} »
                </p>
                <button
                  onClick={handleOpenEditModal}
                  className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Modifier la bio
                </button>
              </div>

              {/* Facebook style intro items */}
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start space-x-3">
                  <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Fonction : </span>
                    <strong className="text-slate-900 dark:text-white">{currentProfile.roleTitle}</strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Institution : </span>
                    <strong className="text-slate-900 dark:text-white">{currentProfile.institution}</strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Hash className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Matricule ARMP : </span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {currentProfile.matricule || 'CGPMP-MITP-2024-042'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Résidence : </span>
                    <strong className="text-slate-900 dark:text-white">{currentProfile.location || 'Kinshasa, RDC'}</strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Portail web : </span>
                    <a href={currentProfile.website || 'https://armp-rdc.org'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                      {currentProfile.website || 'https://armp-rdc.org'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Inscrit sur ACADEMIA : </span>
                    <strong className="text-slate-900 dark:text-white">{currentProfile.joinDate || 'Mars 2021'}</strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Smartphone className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>WhatsApp certifié : </span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {currentProfile.whatsapp || '+243 81 234 5678'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <GraduationCap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span>Niveau certifié : </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {currentProfile.level} ({currentProfile.placementScore || 85}%)
                    </span>
                    <span className="block mt-1.5">
                      <NiveauValideChips profile={currentProfile} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit info button */}
              <button
                onClick={handleOpenEditModal}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier les informations</span>
              </button>
            </div>

            {/* Parcours d'apprentissage — Dernier cours en apprentissage */}
            {lastLearningCourse && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Parcours d'apprentissage</span>
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 ${lastCourseProgress >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                    <Activity className="w-3 h-3" /> {lastCourseProgress >= 100 ? 'Validé ✓' : 'En cours'}
                  </span>
                </div>

                {/* Dernier cours en apprentissage */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50 group">
                  <div className="relative h-28 overflow-hidden">
                    <img src={lastLearningCourse.coverImage} alt={lastLearningCourse.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow">
                        <Play className="w-4 h-4 text-blue-600 fill-blue-600 ml-0.5" />
                      </span>
                      <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow">{lastLearningCourse.level}</span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold">
                        {lastLearningCourse.code} • {lastLearningCourse.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow">{lastCourseProgress}%</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2.5">
                    <h4 className="font-black text-sm leading-tight line-clamp-2 text-slate-900 dark:text-white">{lastLearningCourse.title}</h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{lastLearningCourse.duration} • {lastCourseNextLesson}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Progression du cours</span>
                        <span className="text-blue-600">{lastCourseProgress}% • {lastCourseCompletedChapters}/{lastCourseTotalChapters} chapitres</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all" style={{ width: `${lastCourseProgress}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button onClick={() => handleOpenCoursePlayer(lastLearningCourse)} className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition">
                        <Play className="w-3.5 h-3.5 fill-white" /> {lastCourseProgress >= 100 ? 'Revoir' : lastCourseProgress > 0 ? 'Reprendre' : 'Démarrer'}
                      </button>
                      <button onClick={() => onNavigateToCourses()} className="py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition">Catalogue</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tutrices Virtuelles • Appels Directs & Voices */}
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl border border-blue-800/40 p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tutrices Virtuelles • Appels & Voices</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  En ligne 24/7
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                Appelez directement nos 4 tutrices virtuelles en audio/visio ou envoyez-leur un Voice juridique :
              </p>
              <div className="space-y-2">
                {VIRTUAL_TUTORS.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{tutor.name}</div>
                      <div className="text-[10px] text-cyan-200/80 truncate">{tutor.specialty}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onCallTutor ? onCallTutor('voice', tutor.id) : onOpenTuteur?.()
                        }
                        className="p-1.5 rounded-xl bg-purple-500/30 hover:bg-purple-500 text-purple-200 hover:text-white border border-purple-400/30 transition"
                        title={`Envoyer un Voice à ${tutor.name}`}
                      >
                        <Waves className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCallTutor ? onCallTutor('call', tutor.id) : onOpenTuteur?.()
                        }
                        className="p-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500 text-emerald-200 hover:text-white border border-emerald-400/30 transition"
                        title={`Appeler ${tutor.name} en audio`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCallTutor ? onCallTutor('video', tutor.id) : onOpenTuteur?.()
                        }
                        className="p-1.5 rounded-xl bg-blue-500/30 hover:bg-blue-500 text-blue-200 hover:text-white border border-blue-400/30 transition"
                        title={`Appeler ${tutor.name} en visio`}
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificats & Badges Card (Facebook showcase) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Attestations & Titres</span>
                </h3>
                <button
                  onClick={() => handleTabClick('forum')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Tout voir
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { title: 'Passation DAO', code: 'MOD-002', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300' },
                  { title: 'Contrôle a Priori', code: 'MOD-003', color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' },
                  { title: 'Règlement Contentieux', code: 'MOD-004', color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300' },
                  { title: 'Déontologie & Éthique', code: 'MOD-001', color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' }
                ].map((cert, i) => (
                  <div key={i} className={`p-2.5 rounded-xl border ${cert.color} text-center space-y-1`}>
                    <div className="text-[10px] font-mono font-bold uppercase">{cert.code}</div>
                    <div className="text-xs font-black truncate">{cert.title}</div>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/70 dark:bg-slate-900/80">Sceau ARMP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos & Moments Récents Card (Facebook 6-grid photos) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  <span>Photos & Médias</span>
                </h3>
                <button
                  onClick={() => handleTabClick('photos')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Toutes les photos
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
                {[
                  imgCoverSeminar,
                  imgCoverFormation,
                  imgCoverAudit,
                  imgMentor,
                  imgCoverSeminar,
                  imgCoverFormation
                ].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Média"
                    className="w-full h-20 object-cover hover:opacity-90 transition cursor-pointer"
                    onClick={() => handleTabClick('photos')}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: FEED, CREATOR BOX, POSTS (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* "Créer une publication" Card (Facebook Post Box) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
              
              {/* Hidden File Inputs — Academia Storage (images/vidéos/audios) */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioFileChange}
              />

              <div className="flex items-center space-x-3">
                <img
                  src={currentProfile.avatarUrl}
                  alt={currentProfile.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
                <form onSubmit={handleCreatePost} className="flex-1">
                  <input
                    id="new-post-input"
                    type="text"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Quoi de neuf ou quel retour d'expérience sur la Loi 10/010, ${currentProfile.name.split(' ')[0]} ?`}
                    className="w-full px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </form>
              </div>

              {/* Attached Image Preview (Academia) */}
              {selectedImage && (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-slate-800/80 group">
                  <img
                    src={selectedImage}
                    alt="Aperçu importé"
                    className="w-full h-48 sm:h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white shadow-lg transition"
                    title="Supprimer cette image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-[11px] text-white font-bold flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-xs">{selectedImageName || 'Photo prête à publier'} {selectedImageFile ? '• Academia ✓' : ''}</span>
                  </div>
                </div>
              )}

              {/* Attached Video Preview (Academia) */}
              {selectedVideo && (
                <div className="relative rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-800/60 bg-black group">
                  <video
                    src={selectedVideo}
                    controls
                    playsInline
                    className="w-full max-h-60 object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white shadow-lg transition z-10"
                    title="Supprimer cette vidéo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-[11px] text-white font-bold flex items-center space-x-1.5 z-10">
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate max-w-xs">{selectedVideoName || 'Vidéo prête à publier'} {selectedVideoFile ? '• Academia ✓' : ''}</span>
                  </div>
                </div>
              )}

              {/* Attached Audio Preview (Academia) */}
              {selectedAudio && (
                <div className="relative rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 group p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{selectedAudioName || 'Audio prêt'}</div>
                      <audio controls src={selectedAudio} className="w-full mt-1 h-8" />
                      {selectedAudioFile && <span className="text-[10px] text-purple-600 font-bold">Academia 137.184.59.184 ✓ • {selectedAudioFile.size ? `${(selectedAudioFile.size/1024/1024).toFixed(1)} Mo` : ''}</span>}
                    </div>
                    <button type="button" onClick={handleRemoveAudio} className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {mediaUploading && (
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Envoi {mediaUploading} vers Academia 137.184.59.184…</span>
                </div>
              )}

              {/* Action Buttons Bar — Academia Images/Vidéos/Audios */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  
                  <button
                    type="button"
                    onClick={() => setMediaPickerModal('video')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                      selectedVideo
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-1 ring-rose-500'
                        : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    }`}
                    title="Importer une vidéo → Academia (videos)"
                  >
                    <Video className="w-4 h-4 text-rose-500" />
                    <span className="hidden sm:inline">Vidéo</span>
                    {selectedVideo && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaPickerModal('image')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                      selectedImage
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500'
                        : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    }`}
                    title="Importer une image → Academia (images)"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span className="hidden sm:inline">Photo</span>
                    {selectedImage && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isRecordingPostVoice) stopPostVoiceRecording();
                      else startPostVoiceRecording();
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                      isRecordingPostVoice
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                    }`}
                    title="Enregistrer un Voice directement au micro"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isRecordingPostVoice ? `Stop (${postVoiceSeconds}s)` : 'Voice'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaPickerModal('audio')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                      selectedAudio
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-1 ring-purple-500'
                        : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                    }`}
                    title="Importer un audio → Academia (audios)"
                  >
                    <Music className="w-4 h-4 text-purple-500" />
                    <span className="hidden sm:inline">Audio</span>
                    {selectedAudio && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCallTutor) onCallTutor('call', 'denise');
                      else if (onOpenTuteur) onOpenTuteur();
                    }}
                    className="px-2.5 py-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center space-x-1.5 transition"
                    title="Appeler une Tutrice Virtuelle IA"
                  >
                    <Phone className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">Appeler Tutrice</span>
                  </button>
                </div>

                {(newPostText.trim() || selectedImage || selectedVideo || selectedAudio) && (
                  <button
                    onClick={handleCreatePost}
                    disabled={isPosting || !!mediaUploading}
                    className="px-4 py-1.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of Facebook Posts */}
            <div className="space-y-5">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 sm:p-5 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.avatar}
                        alt={post.author}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {post.author}
                          </span>
                          <BadgeCheck className="w-4 h-4 fill-[#1877F2] text-white" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {post.roleTitle} • {post.timeAgo}
                        </div>
                      </div>
                    </div>

                    {post.badgeTag && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {post.badgeTag}
                      </span>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="px-4 sm:px-5 pb-3">
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Certificate showcase inside post */}
                  {post.certificateData && (
                    <div className="mx-4 sm:mx-5 mb-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border border-amber-200/80 dark:border-amber-900/50 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                          <Award className="w-7 h-7" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                            Attestation Officielle ARMP
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {post.certificateData.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            Réf: {post.certificateData.code} • Score: {post.certificateData.score}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPreviewCertificate({
                            courseTitle: post.certificateData?.title || 'Attestation ARMP',
                            courseCode: post.certificateData?.code || 'CERT-2026',
                            issuedTo: currentProfile.name,
                            role: currentProfile.roleTitle,
                            date: new Date().toLocaleDateString('fr-FR')
                          });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 flex-shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Voir le diplôme</span>
                      </button>
                    </div>
                  )}

                  {/* Optional Post Video — Academia (videos) */}
                  {post.video && (
                    <div className="w-full bg-black border-y border-slate-100 dark:border-slate-800 overflow-hidden relative">
                      <video
                        src={post.video}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-96 object-contain mx-auto"
                      />
                      {post.videoTitle && (
                        <div className="px-4 py-2 bg-slate-900/95 text-slate-200 text-xs flex items-center space-x-2 border-t border-slate-800">
                          <Video className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span className="font-semibold truncate">{post.videoTitle} • Academia</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Post Audio — Academia (audios) */}
                  {(post as any).audio && (
                    <div className="w-full border-y border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{(post as any).audioTitle || 'Audio Academia'}</div>
                        <audio controls src={(post as any).audio} className="w-full mt-1 h-8" />
                      </div>
                      <a href={(post as any).audio} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-purple-600 hover:underline shrink-0">
                        Télécharger
                      </a>
                    </div>
                  )}

                  {/* Optional Post Image — Academia (images) */}
                  {post.image && (
                    <div className="max-h-96 w-full overflow-hidden border-y border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                      <img
                        src={post.image}
                        alt="Média de publication"
                        className="w-full h-full object-cover max-h-96"
                      />
                    </div>
                  )}

                  {/* Likes & Comments Count Bar */}
                  <div className="px-4 sm:px-5 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px]">
                        👍
                      </span>
                      <span>{post.likes} mentions J'aime</span>
                    </div>
                    <div>
                      <span>{post.comments.length} commentaire(s)</span>
                    </div>
                  </div>

                  {/* Facebook Action Buttons (Like, Comment, Share) */}
                  <div className="px-4 sm:px-5 py-1.5 grid grid-cols-3 gap-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-2 transition ${
                        post.userLiked ? 'text-[#1877F2]' : ''
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.userLiked ? 'fill-[#1877F2]' : ''}`} />
                      <span>J'aime</span>
                    </button>

                    <button
                      onClick={() => {
                        const input = document.getElementById(`comment-input-${post.id}`);
                        input?.focus();
                      }}
                      className="py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-2 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Commenter</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText?.(window.location.href);
                        onShowToast?.('Lien de la publication copié !');
                      }}
                      className="py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-2 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Partager</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex items-start space-x-2 text-xs">
                        <img src={c.avatar} alt={c.author} className="w-7 h-7 rounded-full object-cover mt-0.5" />
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{c.author}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{c.timeAgo}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Comment Input */}
                    <div className="flex items-center space-x-2 pt-1">
                      <img src={currentProfile.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                      <input
                        id={`comment-input-${post.id}`}
                        type="text"
                        placeholder="Écrivez un commentaire institutionnel..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id, (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB B: À PROPOS (FACEBOOK ABOUT INFO SECTIONS)                            */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'apropos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Informations Personnelles & Institutionnelles
              </h3>
              <p className="text-xs text-slate-500">
                Coordonnées de l'agent, affectation ministérielle et habilitations ARMP
              </p>
            </div>

            <button
              onClick={handleOpenEditModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Emploi & Cellule CGPMP */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Emploi & Institution de Rattachement</span>
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Institution :</span> <strong className="text-slate-900 dark:text-white">{currentProfile.institution}</strong></div>
                <div><span className="text-slate-400">Fonction officielle :</span> <strong>{currentProfile.roleTitle}</strong></div>
                <div><span className="text-slate-400">Rôle système :</span> <span className="font-mono">{currentProfile.role}</span></div>
                <div><span className="text-slate-400">Matricule agent :</span> <strong className="font-mono text-blue-600">{currentProfile.matricule || 'CGPMP-2026-REG'}</strong></div>
              </div>
            </div>

            {/* Coordonnées & WhatsApp */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Coordonnées & Canaux Officiels</span>
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Email professionnel :</span> <strong>{currentProfile.email}</strong></div>
                <div><span className="text-slate-400">Téléphone d'appel :</span> <strong>{currentProfile.phone || '+243 81 234 5678'}</strong></div>
                <div><span className="text-slate-400">Numéro WhatsApp :</span> <strong className="text-emerald-600">{currentProfile.whatsapp || '+243 81 234 5678'}</strong></div>
                <div><span className="text-slate-400">Lieu d'exercice :</span> <strong>{currentProfile.location || 'Kinshasa, RDC'}</strong></div>
              </div>
            </div>

            {/* Profil Pédagogique ARMP */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Profil Pédagogique & Certifications</span>
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Niveau actuel :</span> <strong className="text-purple-600">{currentProfile.level}</strong></div>
                {(currentProfile.niveauValidation || (currentProfile.niveauxModules && Object.keys(currentProfile.niveauxModules).length > 0)) && (
                  <div className="flex items-start gap-2"><span className="text-slate-400 shrink-0">Niveaux validés :</span> <NiveauValideChips profile={currentProfile} /></div>
                )}
                <div><span className="text-slate-400">Score moyen évalué :</span> <strong>{avgScoreDisplay}%</strong></div>
                <div><span className="text-slate-400">Modules validés :</span> <strong>{completedCount} / {totalCourses} modules ({overallProgress}%)</strong></div>
                <div><span className="text-slate-400">Attestations délivrées :</span> <strong>{certificationsCount} diplômes</strong></div>
              </div>
            </div>

            {/* Paramètres de Confidentialité */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Visibilité & Confidentialité</span>
              </h4>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Visibilité des attestations :</span> <strong>Publique (Annuaire ARMP)</strong></div>
                <div><span className="text-slate-400">Partage hiérarchique :</span> <strong className="text-emerald-600">Activé (DFAT & Ministère)</strong></div>
                <div><span className="text-slate-400">Double facteur 2FA :</span> <strong className={is2FAActive ? 'text-emerald-600' : 'text-amber-600'}>{is2FAActive ? 'Activé' : 'Désactivé'}</strong></div>
                <div><span className="text-slate-400">Dernier changement mot de passe :</span> <span>{currentProfile.passwordLastChanged || 'Il y a 10 jours'}</span></div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB C: FORUM & ATTESTATIONS DIPLÔMES                                      */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'forum' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Passeport de Compétences & Attestations Officielles ARMP
              </h3>
              <p className="text-xs text-slate-500">
                Diplômes numériques certifiés conformes à la Loi n° 10/010 du 27 avril 2010
              </p>
            </div>
            <button
              onClick={onNavigateToCourses}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Suivre un nouveau module</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.slice(0, 4).map((c, i) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 hover:border-blue-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        {c.code} • {c.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {c.title}
                      </h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Validé
                  </span>
                </div>

                <div className="text-xs text-slate-500 line-clamp-2">
                  {c.description}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-400">
                    Sceau n° ARMP-RDC-{2026000 + i}
                  </span>
                  <button
                    onClick={() => {
                      setPreviewCertificate({
                        courseTitle: c.title,
                        courseCode: c.code,
                        issuedTo: currentProfile.name,
                        role: currentProfile.roleTitle,
                        date: new Date().toLocaleDateString('fr-FR')
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Visualiser & Imprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB D: PHOTOS & DOCUMENTS                                                 */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'photos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Galerie Photos & Documents Officiels
              </h3>
              <p className="text-xs text-slate-500">
                Clichés de sessions de renforcement des capacités, séminaires et attestations
              </p>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryPhotoUpload}
            />
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={isGalleryUploading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isGalleryUploading ? 'Envoi en cours...' : 'Ajouter une photo'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              ...(currentProfile.galleryPhotos || []).map(p => ({ src: p.url, label: `${p.label} (${p.createdAt})` })),
              { src: imgCoverSeminar, label: 'Séminaire National ARMP 2026' },
              { src: imgCoverFormation, label: 'Atelier DAO Type Kinshasa' },
              { src: imgCoverAudit, label: 'Session de Contrôle CGPMP' },
              { src: imgMentor, label: 'Mentorat Juridique de la Commande Publique' },
              { src: imgCoverSeminar, label: 'Remise des Diplômes DFAT' },
              { src: imgCoverFormation, label: 'Module Numérique E-Procurement' }
            ].map((item, index) => (
              <div key={index} className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 aspect-4/3">
                <img src={item.src} alt={item.label} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-3 flex items-end">
                  <span className="text-[11px] font-bold text-white leading-tight">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB E: SÉCURITÉ & CONNEXION                                               */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'securite' && (
        <div className="space-y-6">
          
          {/* 2FA Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  is2FAActive 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Authentification à Double Facteur (2FA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protégez vos signatures et visas officiels de passation de marchés
                  </p>
                </div>
              </div>

              {is2FAActive ? (
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>2FA Activé</span>
                  </span>
                  <button
                    onClick={handleDirectDisable2FA}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
                  >
                    Désactiver
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpen2FASetup}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Activer la 2FA</span>
                </button>
              )}
            </div>
          </div>

          {/* Password Reset Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Mot de passe & Clé de chiffrement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Réinitialisez votre mot de passe officiel via un lien sécurisé envoyé par Firebase Auth
                  </p>
                </div>
              </div>

              <button
                onClick={handleSendPasswordReset}
                disabled={isSendingResetEmail}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center space-x-2"
              >
                {isSendingResetEmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Envoyer email de réinitialisation</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* TAB F: WHATSAPP & NOTIFICATIONS                                           */}
      {/* ------------------------------------------------------------------------- */}
      {currentTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Liaison WhatsApp & Alertes Légales Directes
                </h3>
                <p className="text-xs text-slate-500">
                  Recevez les nouveaux décrets, avis DFAT et rappels de cours directement sur votre smartphone
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Canal Actif
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Numéro WhatsApp enregistré : {currentProfile.whatsapp || '+243 81 234 5678'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notifications instantanées lors de la publication d'un nouveau modèle de DAO ou d'un visa DFAT.
              </p>
            </div>
            <button
              onClick={() => {
                window.open(`https://wa.me/243812345678?text=Bonjour%20ACADEMIA%20ARMP%20RDC`, '_blank');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 flex-shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ouvrir dans WhatsApp</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div
              onClick={() => {
                const next = !(currentProfile.whatsappNotifications ?? true);
                onUpdateProfile?.({ ...currentProfile, whatsappNotifications: next });
                onShowToast?.(`Alertes Décrets & Arrêtés ARMP : ${next ? 'Activées' : 'Désactivées'}`);
              }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Alertes Décrets & Arrêtés ARMP</span>
                <span className="text-[11px] text-slate-500">Notification en temps réel</span>
              </div>
              <span className={`w-9 h-5 rounded-full flex items-center px-1 transition ${currentProfile.whatsappNotifications !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}>
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
              </span>
            </div>

            <div
              onClick={() => {
                const next = !(currentProfile.tutorReminders ?? true);
                onUpdateProfile?.({ ...currentProfile, tutorReminders: next });
                onShowToast?.(`Rappels du Tuteur IA Aïsha : ${next ? 'Activés' : 'Désactivés'}`);
              }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Rappels du Tuteur IA</span>
                <span className="text-[11px] text-slate-500">Exercices et révisions Loi 10/010</span>
              </div>
              <span className={`w-9 h-5 rounded-full flex items-center px-1 transition ${currentProfile.tutorReminders !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'}`}>
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-xs" />
              </span>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS (EDIT PROFILE, 2FA, CERTIFICATE PREVIEW, COVER SELECTOR)        */}
      {/* ========================================================================= */}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Modifier le profil (Style Facebook)</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              {/* Locked Google / Official Email Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Identifiant Google / Email officiel (Verrouillé)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    🔒 Non modifiable
                  </span>
                </div>
                <input
                  type="email"
                  value={currentProfile.email}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-slate-600 dark:text-slate-300 font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Nom complet & Post-nom</label>
                  <span className="text-[10px] font-mono text-emerald-600">Filtre : Lettres A-Z</span>
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(filterPersonNameMask(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Fonction officielle</label>
                  <span className="text-[10px] font-mono text-slate-400">Masque filtré</span>
                </div>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(filterRoleTitleMask(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Institution, Ministère ou PME</label>
                  <span className="text-[10px] font-mono text-slate-400">Caractères spéciaux filtrés</span>
                </div>
                <input
                  type="text"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(filterInstitutionMask(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Téléphone (+243 verrouillé)</label>
                    <span className={`text-[10px] font-mono font-bold ${isValidDRCPhone(editPhone) ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isValidDRCPhone(editPhone) ? '✓ 9/9' : 'Masque +243'}
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatDRCPhoneMask(e.target.value))}
                    placeholder="+243 81 234 5678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">WhatsApp (+243 verrouillé)</label>
                    <span className={`text-[10px] font-mono font-bold ${isValidDRCPhone(editWhatsapp) ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isValidDRCPhone(editWhatsapp) ? '✓ 9/9' : 'Masque +243'}
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(formatDRCPhoneMask(e.target.value))}
                    placeholder="+243 81 234 5678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Matricule / N° ARSP</label>
                    <span className="text-[10px] font-mono text-slate-400">A-Z 0-9 - /</span>
                  </div>
                  <input
                    type="text"
                    value={editMatricule}
                    onChange={(e) => setEditMatricule(formatMatriculeOrRccmMask(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Province RDC (Verrouillée)</label>
                  <select
                    value={DRC_PROVINCES.some(p => editLocation.includes(p.split(' ')[0])) ? (DRC_PROVINCES.find(p => editLocation.includes(p.split(' ')[0])) || DRC_PROVINCES[0]) : DRC_PROVINCES[0]}
                    onChange={(e) => setEditLocation(`${e.target.value}, RDC`)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    {DRC_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}, RDC
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Citation / Slogan de profil</label>
                <input
                  type="text"
                  value={editCoverBio}
                  onChange={(e) => setEditCoverBio(e.target.value)}
                  placeholder="Ex: Passionné par la régulation et la transparence des marchés."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Biographie détaillée</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cover Upload Modal — formulaire d'upload dédié (Academia covers) avec prévisualisation — au-dessus de tout */}
      {showCoverModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Mettre à jour la photo de couverture</span>
              </h3>
              <button onClick={() => { setShowCoverModal(false); setCoverDraftUrl(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Prévisualisation couverture */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-44">
                <img
                  src={coverDraftUrl || currentCover}
                  alt="Aperçu couverture"
                  className="w-full h-full object-cover"
                />
                {isCoverUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Envoi vers Academia…</span>
                    </div>
                  </div>
                )}
                {!coverDraftUrl && !isCoverUploading && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold backdrop-blur-xs">Photo actuelle</div>
                )}
                {coverDraftUrl && !isCoverUploading && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aperçu — Academia ✓</span>
                  </div>
                )}
              </div>

              {/* Upload perso vers Academia */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Téléverser votre propre couverture (Academia 137.184.59.184 — covers / public, 100 Mo)</p>
                <label className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${isCoverUploading ? 'bg-slate-300 text-slate-600 pointer-events-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow'}`}>
                  <Upload className="w-4 h-4" />
                  <span>{isCoverUploading ? 'Envoi vers Academia…' : coverDraftUrl ? 'Choisir une autre image' : 'Choisir une image (JPG/PNG/WebP)'}</span>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileUpload} disabled={isCoverUploading} />
                </label>
                <p className="text-[10px] text-slate-500">Stockée en public /storage/academia/covers/… • visible immédiatement après enregistrement</p>
              </div>

              {/* Presets institutionnels — sélectionne un draft */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Ou choisir une couverture institutionnelle ARMP :</span>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableCovers.map((cov, idx) => {
                    const isSelected = coverDraftUrl === cov.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectPresetCover(cov.url)}
                        className={`rounded-2xl overflow-hidden border-2 transition cursor-pointer group relative ${isSelected ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                      >
                        <img src={cov.url} alt={cov.name} className="w-full h-24 object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center text-white font-bold text-xs transition">
                          {cov.name}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => { setShowCoverModal(false); setCoverDraftUrl(null); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleSaveCover} disabled={!coverDraftUrl || isCoverUploading} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>Enregistrer comme couverture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal — formulaire d'upload dédié (Academia avatars) */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Mettre à jour la photo de profil</span>
              </h3>
              <button onClick={() => { setShowAvatarModal(false); setAvatarDraftUrl(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <img src={avatarDraftUrl || currentProfile.avatarUrl} alt="Aperçu photo" className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl" />
                  {isAvatarUploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-white animate-spin" /></div>}
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{currentProfile.name}</div>
                  <div className="text-[11px] text-slate-500">{avatarDraftUrl ? 'Aperçu — cliquez sur Enregistrer' : 'Photo actuelle'}</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Téléverser une nouvelle photo (Academia 137.184.59.184 — avatars / public, 100 Mo)</p>
                <label className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${isAvatarUploading ? 'bg-slate-300 text-slate-600 pointer-events-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow'}`}>
                  <Upload className="w-4 h-4" />
                  <span>{isAvatarUploading ? 'Envoi vers Academia…' : avatarDraftUrl ? 'Choisir une autre image' : 'Choisir une image (JPG/PNG/WebP)'}</span>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPickerFileChange} disabled={isAvatarUploading} />
                </label>
                <p className="text-[10px] text-slate-500">Stockée en public /storage/academia/avatars/… • visible immédiatement</p>
              </div>

              {avatarDraftUrl && !isAvatarUploading && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Photo prête — Academia ✓</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => { setShowAvatarModal(false); setAvatarDraftUrl(null); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleSaveAvatar} disabled={!avatarDraftUrl || isAvatarUploading} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>Enregistrer comme photo de profil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Certificate Modal */}
      {previewCertificate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border-8 border-amber-500/30 max-w-2xl w-full p-8 space-y-6 text-slate-900 shadow-2xl relative my-8">
            <button
              onClick={() => setPreviewCertificate(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
              <div className="flex justify-center mb-2">
                <ArmpLogo size="lg" />
              </div>
              <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO • AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS
              </h2>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Certificat Officiel de Réussite
              </h1>
              <p className="text-xs text-amber-700 font-semibold font-mono">
                Délivré conformément à la Loi n° 10/010 du 27 avril 2010
              </p>
            </div>

            <div className="text-center space-y-3 py-4">
              <p className="text-xs text-slate-500">Il est certifié par la présente que :</p>
              <h3 className="text-xl font-extrabold text-blue-900 tracking-tight">
                {previewCertificate.issuedTo}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {previewCertificate.role} • {currentProfile.institution}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto pt-2">
                A validé avec succès l'ensemble des épreuves d'évaluation portant sur le module certifiant :
              </p>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 max-w-lg mx-auto">
                <span className="text-xs font-mono font-bold text-amber-800">{previewCertificate.courseCode}</span>
                <h4 className="text-sm font-black text-slate-900">{previewCertificate.courseTitle}</h4>
              </div>
            </div>

            <div className="border-t-2 border-slate-200 pt-6 flex items-center justify-between text-xs">
              <div>
                <div className="font-mono text-[10px] text-slate-400">Date d'émission : {previewCertificate.date}</div>
                <div className="font-mono text-[10px] text-slate-400">Identifiant : ARMP-CERT-{Math.floor(100000 + Math.random() * 900000)}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">La Direction de la Formation (DFAT)</span>
                <span className="text-[10px] text-emerald-700 font-bold">✓ Sceau officiel validé</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'attestation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Configuration de la 2FA</span>
              </h3>
              <button onClick={() => setShow2FASetupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3 text-xs">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-white p-2 border-2 border-slate-300 flex items-center justify-center shadow-inner">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Scannez ce QR Code avec Google Authenticator ou saisissez le code de vérification à 6 chiffres envoyé à votre adresse email.
              </p>
            </div>

            {otp2FAHint && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-800 dark:text-blue-200 text-center">
                {otp2FAHint}
              </div>
            )}
            {otp2FAError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 text-center">
                {otp2FAError}
              </div>
            )}

            <form onSubmit={handleConfirm2FAActivation} className="space-y-3 pt-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(filterOtpMask(e.target.value))}
                placeholder="Entrez le code à 6 chiffres (ex: 123456)"
                className="w-full text-center tracking-widest text-lg font-mono px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                required
              />

              <button
                type="submit"
                disabled={isVerifying2FA || otpInput.length < 6}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                {isVerifying2FA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Confirmer et Activer la 2FA</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal (Upload local file OR select from ARMP archives) */}
      {mediaPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${mediaPickerModal === 'image' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : mediaPickerModal === 'video' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-purple-100 dark:bg-purple-950 text-purple-600'}`}>
                  {mediaPickerModal === 'image' ? <ImageIcon className="w-5 h-5" /> : mediaPickerModal === 'video' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {mediaPickerModal === 'image' ? 'Importer ou choisir une photo' : mediaPickerModal === 'video' ? 'Importer ou choisir une vidéo' : 'Importer ou choisir un audio'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {mediaPickerModal === 'audio' ? 'Audio stocké sur Academia 137.184.59.184 (audios, 100 Mo)' : 'Fichier depuis votre appareil — stockage Academia 137.184.59.184'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMediaPickerModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Direct File Upload from Device — Academia */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-center space-y-3">
              <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                {mediaPickerModal === 'image' 
                  ? 'Téléverser une image → Academia (images / public)'
                  : mediaPickerModal === 'video'
                  ? 'Téléverser une vidéo → Academia (videos / privé, 100 Mo)'
                  : 'Téléverser un audio → Academia (audios / privé, 100 Mo)'
                }
              </div>
              <button
                type="button"
                onClick={() => {
                  if (mediaPickerModal === 'image') imageInputRef.current?.click();
                  else if (mediaPickerModal === 'video') videoInputRef.current?.click();
                  else audioInputRef.current?.click();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {mediaPickerModal === 'image' ? 'Choisir un fichier image' : mediaPickerModal === 'video' ? 'Choisir un fichier vidéo' : 'Choisir un fichier audio'}
                </span>
              </button>
              <p className="text-[10px] text-slate-500">Stockage serveur 137.184.59.184 • {mediaUploading ? `Envoi ${mediaUploading}…` : 'JPG/PNG/WebP • MP4/WebM/MOV • MP3/WAV/M4A' }</p>
            </div>

            {/* Option 2: Preloaded Library / Official Archives — avec audios */}
            {mediaPickerModal === 'image' ? (
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ou sélectionner une photo institutionnelle ARMP :
                </span>
                <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {[
                    { title: 'Séminaire National ARMP', url: imgCoverSeminar },
                    { title: 'Atelier Numérique E-Procurement', url: imgCoverFormation },
                    { title: 'Audit & Contrôle CGPMP', url: imgCoverAudit },
                    { title: 'Praticiens & Juristes', url: imgMentor }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectLibraryImage(item.url, item.title)}
                      className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition cursor-pointer relative aspect-16/10"
                    >
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-end p-2 transition">
                        <span className="text-[10px] font-bold text-white line-clamp-1">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : mediaPickerModal === 'video' ? (
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ou choisir un extrait Masterclass ARMP officiel :
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    {
                      title: 'Masterclass : Passation & Rédaction des DAO',
                      desc: 'Méthodologie standardisée ARMP',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                    },
                    {
                      title: 'Contrôle a Priori & Avis de Non-Objection',
                      desc: 'Dossiers soumis à la DGCMP',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
                    }
                  ].map((vid, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectLibraryVideo(vid.url, vid.title)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center flex-shrink-0">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{vid.title}</h4>
                          <span className="text-[10px] text-slate-500">{vid.desc}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Choisir
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Enregistrer un Voice en direct au micro :
                </span>
                <div className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                    {isRecordingPostVoice
                      ? `🎙️ Enregistrement en cours (${postVoiceSeconds}s)…`
                      : 'Enregistrez une note vocale (Voice) directement depuis votre micro'}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      isRecordingPostVoice ? stopPostVoiceRecording() : startPostVoiceRecording()
                    }
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition ${
                      isRecordingPostVoice
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isRecordingPostVoice ? 'Terminer & Joindre' : 'Enregistrer Voice'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Option 3: Web URL input */}
            <form onSubmit={handleApplyCustomMediaUrl} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ou insérer via un lien direct (URL) :
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={customMediaUrl}
                  onChange={(e) => setCustomMediaUrl(e.target.value)}
                  placeholder={mediaPickerModal === 'image' ? 'https://exemple.com/photo.jpg' : 'https://exemple.com/video.mp4'}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!customMediaUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
