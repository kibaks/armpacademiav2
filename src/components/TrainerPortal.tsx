import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Video,
  Plus,
  BookOpen,
  Award,
  Users,
  BarChart3,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Scale,
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Sliders,
  Settings,
  Eye,
  Trash2,
  Edit3,
  HelpCircle,
  FolderPlus,
  Tv,
  ListOrdered,
  Layers,
  ArrowRight,
  Save,
  Check,
  RefreshCw,
  Share2,
  FileCheck,
  Zap,
  Bookmark,
  BadgeCheck,
  Building2,
  MoreHorizontal,
  MapPin,
  Briefcase,
  Hash,
  Smartphone
} from 'lucide-react';
import { CourseModule, UserProfile, UserRole, LessonFormat, StudioVideoItem, QuizBankItem } from '../types';
import { ArmpLogo } from './ArmpLogo';
import {
  saveStudioVideoToFirestore,
  fetchStudioVideosFromFirestore,
  saveQuizBankItemToFirestore,
  fetchQuizBankFromFirestore
} from '../firebase';
import imgSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgTraining from '../assets/images/formation_numerique_1789983181347.jpg';
import imgAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';
import imgMentor from '../assets/images/mentor_juriste_africain_1789983212035.jpg';
import { uploadFile, uploadBlob, type AcademiaFile } from '../lib/academiaStorage';
import { AcademiaMediaUploader, AcademiaMediaPreview } from './AcademiaMediaUploader';
import { AnimatedLessonPlayer } from './AnimatedLessonPlayer';

// Formats de leçons — Vidéo, Audio, Animation Animaker, IA PPT, PDF, Visioconférence, Texte
const LESSON_FORMATS: Array<{ id: LessonFormat; label: string; icon: string; desc: string; color: string }> = [
  { id: 'video', label: 'Vidéo', icon: '🎬', desc: 'Cours filmé / Studio', color: 'bg-rose-500' },
  { id: 'audio', label: 'Audio', icon: '🎙️', desc: 'Podcast / Vocal', color: 'bg-purple-500' },
  { id: 'animation', label: 'Animation', icon: '✨', desc: 'Style Animaker', color: 'bg-amber-500' },
  { id: 'ia_ppt', label: 'IA • PPT', icon: '🤖', desc: 'Prompt → Slides', color: 'bg-indigo-500' },
  { id: 'pdf', label: 'PDF', icon: '📄', desc: 'Document / Support', color: 'bg-red-500' },
  { id: 'visioconference', label: 'Visio', icon: '📹', desc: 'Zoom / Teams / Meet', color: 'bg-emerald-500' },
  { id: 'texte', label: 'Texte', icon: '📝', desc: 'Article / Rédaction', color: 'bg-slate-500' },
];
const ANIMATION_TEMPLATES = [
  { id: 'whiteboard', name: 'Tableau blanc', thumb: 'https://picsum.photos/seed/anim1/200/120', desc: 'Main qui dessine' },
  { id: 'flat', name: 'Flat Design', thumb: 'https://picsum.photos/seed/anim2/200/120', desc: 'Illustrations modernes' },
  { id: 'infographic', name: 'Infographie', thumb: 'https://picsum.photos/seed/anim3/200/120', desc: 'Chiffres & schémas' },
  { id: 'character', name: 'Personnage', thumb: 'https://picsum.photos/seed/anim4/200/120', desc: 'Avatar qui parle' },
  { id: 'timeline', name: 'Timeline', thumb: 'https://picsum.photos/seed/anim5/200/120', desc: 'Frise chronologique' },
  { id: 'isometric', name: 'Isométrique', thumb: 'https://picsum.photos/seed/anim6/200/120', desc: 'Bâtiments 3D' },
];


interface TrainerPortalProps {
  currentProfile: UserProfile;
  allProfiles?: Record<string, UserProfile>;
  courses: CourseModule[];
  onAddCourse: (newCourse: CourseModule) => void;
  onPreviewCourse: (course: CourseModule) => void;
  onOpenCoursePlayer: (course: CourseModule) => void;
  onSwitchToTrainerRole?: () => void;
  isDarkMode: boolean;
}

type TrainerTab = 'dashboard' | 'courses' | 'authoring' | 'studio' | 'quiz_bank' | 'learners';

interface RecordedVideo {
  id: string;
  title: string;
  duration: string;
  blobUrl: string;
  academiaUrl?: string;
  academiaId?: string;
  date: string;
  courseCode?: string;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({
  currentProfile,
  allProfiles,
  courses,
  onAddCourse,
  onPreviewCourse,
  onOpenCoursePlayer,
  onSwitchToTrainerRole,
  isDarkMode
}) => {
  // Navigation tabs for the trainer portal
  const [activeTab, setActiveTab] = useState<TrainerTab>('dashboard');
  // Immersive editor state — même disposition que CourseWindow apprenant
  const [activeLessonEditIndex, setActiveLessonEditIndex] = useState(0);
  const [isZenModeTrainer, setIsZenModeTrainer] = useState(false);
  const [readingThemeTrainer, setReadingThemeTrainer] = useState<'dark' | 'light' | 'sepia'>('dark');

  // Search and filters for courses
  const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Course Authoring Studio State (Step 1 -> 4)
  const [authoringStep, setAuthoringStep] = useState<1 | 2 | 3 | 4>(1);
  const [newCourseCode, setNewCourseCode] = useState(`MOD-00${courses.length + 1}`);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<'Réglementation' | 'Passation' | 'Contrôle' | 'Contentieux' | 'Gestion & Audit'>('Passation');
  const [newCourseDuration, setNewCourseDuration] = useState('10 Heures (3 Modules)');
  const [newCourseLevel, setNewCourseLevel] = useState<'Fondamental' | 'Intermédiaire' | 'Avancé' | 'Spécialisé'>('Intermédiaire');
  const [newCourseLegalRef, setNewCourseLegalRef] = useState('Loi n° 10/010 du 27 avril 2010 - Articles 18 à 35');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseCover, setNewCourseCover] = useState(imgTraining);
  const [coverFile, setCoverFile] = useState<AcademiaFile | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<UserRole[]>(['cgpmp_member', 'armp_agent', 'dgcmp_agent']);

  // Lessons builder state — avec formats Vidéo/Audio/Animation/IA PPT/PDF/Visio/Texte
  const [lessonsList, setLessonsList] = useState<Array<{
    id: string;
    title: string;
    duration: string;
    content: string;
    keyArticles: string[];
    format: LessonFormat;
    mediaUrl?: string;
    aiPrompt?: string;
    templateId?: string;
    visioLink?: string;
    visioDate?: string;
    visioPlatform?: 'zoom' | 'teams' | 'meet' | 'jitsi';
  }>>([
    {
      id: 'L1',
      title: 'Introduction et principes clés de la procédure',
      duration: '45 min',
      format: 'animation',
      templateId: 'whiteboard',
      content: `Dans ce chapitre fondamental, nous abordons la préparation rigoureuse des dossiers de consultation des entreprises (DAO) conformément aux directives de l'ARMP RDC.

Points cardinaux :
1. Définition claire des spécifications techniques neutres et non discriminatoires (Loi 10/010 art. 23).
2. Fixation des critères d'évaluation objectifs, mesurables et quantifiables.
3. Établissement du calendrier prévisionnel en cohérence avec le PPM validé.`,
      keyArticles: ['Loi 10/010 Art. 23', 'Manuel ARMP §2.1']
    },
    {
      id: 'L2',
      title: 'Instruction du dossier et contrôle de conformité',
      duration: '50 min',
      format: 'animation',
      templateId: 'whiteboard',
      content: `L'examen des offres requiert une neutralité absolue de la sous-commission d'analyse.

Étapes de vérification :
- Contrôle de recevabilité des pièces administratives (RCCM, quitus fiscal, attestations CNSS).
- Analyse de la conformité technique selon la méthode conforme / non conforme.
- Évaluation financière et détection d'éventuelles offres anormalement basses.`,
      keyArticles: ['Loi 10/010 Art. 45', 'Décret n° 10/22']
    }
  ]);

  // Quiz builder state
  const [quizList, setQuizList] = useState<Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>>([
    {
      question: "Quel est le délai légal minimal de réception des offres pour un appel d'offres ouvert national selon l'ARMP ?",
      options: [
        "15 jours calendaires",
        "30 jours calendaires",
        "45 jours calendaires",
        "60 jours calendaires"
      ],
      correctIndex: 1,
      explanation: "L'article 26 de la Loi 10/010 fixe un délai minimal de 30 jours pour garantir l'égal accès et la concurrence effective."
    },
    {
      question: "Quelle autorité délivre l'Avis de Non-Objection (ANO) sur le projet de DAO au-delà des seuils nationaux ?",
      options: [
        "La CGPMP du Ministère",
        "Le Conseil d'Administration de l'ARMP",
        "La Direction Générale du Contrôle des Marchés Publics (DGCMP)",
        "L'Inspection Générale des Finances (IGF)"
      ],
      correctIndex: 2,
      explanation: "La DGCMP exerce le contrôle a priori et délivre l'ANO obligatoire avant publication de l'avis d'appel d'offres."
    }
  ]);

  // DIGITAL VIDEO STUDIO STATE
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1.0);
  const [isPrompterRunning, setIsPrompterRunning] = useState(false);
  const [prompterText, setPrompterText] = useState(
    `Bonjour à tous et bienvenue dans cette Masterclass officielle de l'ARMP RDC.
Aujourd'hui, nous allons décortiquer ensemble les obligations légales posées par la Loi n° 10/010 du 27 avril 2010.
En tant qu'acteurs de la commande publique, qu'il s'agisse des membres des CGPMP ministérielles ou des auditeurs de la DGCMP, votre rôle est garant de la bonne gouvernance de nos deniers publics.
Commençons par examiner l'article 5 relatif aux quatre principes inviolables de la commande publique congolaise...`
  );
  const [prompterFontSize, setPrompterFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [studioLowerThird, setStudioLowerThird] = useState(true);
  const [studioOverlayTheme, setStudioOverlayTheme] = useState<'official_blue' | 'presidential_gold' | 'minimal'>('official_blue');
  const defaultStudioVideos: RecordedVideo[] = [
    {
      id: 'VID-001',
      title: 'Masterclass : Rédaction du DAO Type ARMP',
      duration: '14 min 30s',
      blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      date: 'Hier, 15:40',
      courseCode: 'MOD-002'
    },
    {
      id: 'VID-002',
      title: 'Point de Droit : Le Recours non juridictionnel devant le CRD',
      duration: '08 min 12s',
      blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      date: '21 Septembre 2026',
      courseCode: 'MOD-004'
    }
  ];
  const [recordedVideos, setRecordedVideos] = useState<RecordedVideo[]>(() => {
    try {
      const saved = localStorage.getItem('armp_studio_videos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultStudioVideos;
  });

  // Banque nationale de QCM persistée dans Firestore + localStorage
  const defaultQuizBank: QuizBankItem[] = [
    {
      id: 'qb-1',
      code: 'Q-REG-01',
      theme: 'Réglementation & Principes',
      q: "Quelles sont les trois institutions piliers de la commande publique instaurées par la Loi n° 10/010 ?",
      rep: "CGPMP (Passation), DGCMP (Contrôle a priori), ARMP (Régulation et contentieux).",
      article: "Loi 10/010 Art. 2, 7 & 12"
    },
    {
      id: 'qb-2',
      code: 'Q-PASS-02',
      theme: 'Passation & DAO',
      q: "À quel moment précis le Plan de Passation des Marchés (PPM) doit-il être validé ?",
      rep: "Préalablement à tout engagement et avant le lancement de tout appel d'offres au début de chaque exercice budgétaire.",
      article: "Loi 10/010 Art. 12"
    },
    {
      id: 'qb-3',
      code: 'Q-CONT-03',
      theme: 'Contentieux & Recours',
      q: "Quel est le délai accordé au soumissionnaire pour introduire un recours préalable gracieux devant l'Autorité Contractante ?",
      rep: "Dans un délai de cinq (5) jours ouvrables suivant la publication de l'attribution provisoire.",
      article: "Loi 10/010 Art. 89"
    }
  ];
  const [quizBankItems, setQuizBankItems] = useState<QuizBankItem[]>(() => {
    try {
      const saved = localStorage.getItem('armp_quiz_bank');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultQuizBank;
  });
  const [newQbTheme, setNewQbTheme] = useState('Passation & DAO');
  const [newQbArticle, setNewQbArticle] = useState('Loi 10/010 Art. 26');
  const [newQbQuestion, setNewQbQuestion] = useState('');
  const [newQbAnswer, setNewQbAnswer] = useState('');
  const [trainerNotice, setTrainerNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchStudioVideosFromFirestore().then(remote => {
      if (mounted && remote && remote.length > 0) {
        setRecordedVideos(prev => {
          const map = new Map<string, RecordedVideo>();
          [...remote, ...prev].forEach(v => map.set(v.id, v));
          const merged = Array.from(map.values());
          try { localStorage.setItem('armp_studio_videos', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    fetchQuizBankFromFirestore().then(remote => {
      if (mounted && remote && remote.length > 0) {
        setQuizBankItems(prev => {
          const map = new Map<string, QuizBankItem>();
          [...remote, ...prev].forEach(item => map.set(item.id, item));
          const merged = Array.from(map.values());
          try { localStorage.setItem('armp_quiz_bank', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleAddQuizBankItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQbQuestion.trim() || !newQbAnswer.trim()) return;
    const item: QuizBankItem = {
      id: `qb-${Date.now()}`,
      code: `Q-ARMP-0${quizBankItems.length + 1}`,
      theme: newQbTheme.trim() || 'Passation & DAO',
      q: newQbQuestion.trim(),
      rep: newQbAnswer.trim(),
      article: newQbArticle.trim() || 'Loi 10/010',
      createdBy: currentProfile.name,
      createdAt: new Date().toISOString()
    };
    const next = [item, ...quizBankItems];
    setQuizBankItems(next);
    try { localStorage.setItem('armp_quiz_bank', JSON.stringify(next)); } catch {}
    saveQuizBankItemToFirestore(item).catch(() => {});
    setNewQbQuestion('');
    setNewQbAnswer('');
    setTrainerNotice(`Question ${item.code} enregistrée et synchronisée dans la Banque Nationale ARMP ✓`);
    setTimeout(() => setTrainerNotice(null), 4000);
  };

  // Calculs dynamiques des KPIs Formateur
  const profilesArray = allProfiles ? Object.values(allProfiles) : [currentProfile];
  const totalStudentsCount = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0) + profilesArray.length * 12;
  const avgSuccessRate = Number(
    (profilesArray.reduce((acc, p) => acc + (p.placementScore || 85), 0) / Math.max(1, profilesArray.length)).toFixed(1)
  );
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Video recording refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);

  // Timer for Recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Teleprompter Auto-Scroll
  useEffect(() => {
    let prompterInterval: any = null;
    if (isPrompterRunning && prompterContainerRef.current) {
      prompterInterval = setInterval(() => {
        if (prompterContainerRef.current) {
          prompterContainerRef.current.scrollTop += 1 * teleprompterSpeed;
        }
      }, 40);
    }
    return () => clearInterval(prompterInterval);
  }, [isPrompterRunning, teleprompterSpeed]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micActive
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        setCameraActive(true);
        setScreenShareActive(false);
      }
    } catch (err) {
      console.warn("Camera could not be accessed directly, using virtual studio preview", err);
      setCameraActive(true);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScreenShareActive(false);
  };

  // Start Screen Sharing
  const startScreenShare = async () => {
    try {
      if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: micActive
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        setScreenShareActive(true);
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Screen share cancelled or not allowed", err);
    }
  };

  // Handle Recording Trigger
  const handleToggleRecord = () => {
    if (!isRecording) {
      // Start recording
      recordedChunksRef.current = [];
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
      setIsPrompterRunning(true);

      // Attempt to initialize MediaRecorder if stream exists
      if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
        try {
          const stream = videoPreviewRef.current.srcObject as MediaStream;
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.onstop = async () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const vidId = `VID-${Date.now().toString().slice(-4)}`;
            const newVid: RecordedVideo = {
              id: vidId,
              title: `Prise de cours #${recordedVideos.length + 1} (${new Date().toLocaleTimeString('fr-FR')})`,
              duration: formatTime(recordSeconds),
              blobUrl: url,
              date: "À l'instant",
              courseCode: newCourseCode
            };
            setRecordedVideos(prev => {
              const next = [newVid, ...prev];
              try { localStorage.setItem('armp_studio_videos', JSON.stringify(next)); } catch {}
              return next;
            });
            saveStudioVideoToFirestore({ ...newVid, authorId: currentProfile.id }).catch(() => {});
            // → Upload vers Academia Storage (137.184.59.184) — vidéos
            try {
              setVideoUploading(true);
              const fileName = `masterclass_${newCourseCode}_${Date.now()}.webm`;
              const acad = await uploadBlob(blob, fileName, {
                category: 'studio_videos',
                visibility: 'private',
                entityId: newCourseCode,
                description: `Masterclass ${newCourseCode} — ${newVid.title}`,
                uploadedBy: currentProfile.email,
                onProgress: setVideoUploadProgress,
              });
              setRecordedVideos(prev => {
                const updated = prev.map(v => v.id === vidId ? { ...v, academiaUrl: acad.url, academiaId: acad.id, blobUrl: acad.url } : v);
                try { localStorage.setItem('armp_studio_videos', JSON.stringify(updated)); } catch {}
                return updated;
              });
              saveStudioVideoToFirestore({ ...newVid, academiaUrl: acad.url, academiaId: acad.id, blobUrl: acad.url, authorId: currentProfile.id }).catch(() => {});
            } catch (e: any) {
              console.warn('Upload Academia vidéo échoué', e);
            } finally {
              setVideoUploading(false);
            }
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch (e) {
          console.warn("MediaRecorder fallback", e);
        }
      }
    } else {
      // Stop recording
      setIsRecording(false);
      setIsPaused(false);
      setIsPrompterRunning(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        // Fallback recorded item for simulation
        const fallbackVid: RecordedVideo = {
          id: `VID-${Date.now().toString().slice(-4)}`,
          title: `Masterclass ARMP #${recordedVideos.length + 1}`,
          duration: formatTime(recordSeconds || 74),
          blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          date: "À l'instant",
          courseCode: newCourseCode
        };
        setRecordedVideos(prev => {
          const next = [fallbackVid, ...prev];
          try { localStorage.setItem('armp_studio_videos', JSON.stringify(next)); } catch {}
          return next;
        });
        saveStudioVideoToFirestore({ ...fallbackVid, authorId: currentProfile.id }).catch(() => {});
      }
    }
  };

  // Toggle Audience Checkboxes
  const toggleAudience = (role: UserRole) => {
    if (selectedAudiences.includes(role)) {
      if (selectedAudiences.length > 1) {
        setSelectedAudiences(selectedAudiences.filter(r => r !== role));
      }
    } else {
      setSelectedAudiences([...selectedAudiences, role]);
    }
  };

  // Add a new Lesson draft — avec format animation par défaut (Animaker 2D Main & Graphiques)
  const handleAddNewLesson = () => {
    const nextIdx = lessonsList.length + 1;
    setLessonsList([
      ...lessonsList,
      {
        id: `L${nextIdx}`,
        title: `Chapitre ${nextIdx} : Nouvelle leçon de passation`,
        duration: '40 min',
        format: 'animation',
        templateId: 'whiteboard',
        content: `Contenu du chapitre ${nextIdx}...\n\nDéveloppez ici les points clés et les applications pratiques de la Loi 10/010.`,
        keyArticles: ['Loi 10/010 Art. 28']
      }
    ]);
  };

  // Add a new Quiz Question draft
  const handleAddNewQuizQuestion = () => {
    setQuizList([
      ...quizList,
      {
        question: `Question n°${quizList.length + 1} d'évaluation sur le cours ?`,
        options: [
          "Option A (Première proposition)",
          "Option B (Seconde proposition conforme)",
          "Option C (Troisième proposition)",
          "Option D (Aucune des réponses ci-dessus)"
        ],
        correctIndex: 1,
        explanation: "Explication juridique basée sur les dispositions applicables de la Loi 10/010."
      }
    ]);
  };

  // Submit and Publish New Course
  const handlePublishCourse = () => {
    if (!newCourseTitle.trim()) {
      setTrainerNotice("Veuillez renseigner l'intitulé de la formation avant publication.");
      return;
    }

    const createdCourse: CourseModule = {
      id: newCourseCode,
      code: newCourseCode,
      title: newCourseTitle.trim(),
      category: newCourseCategory,
      targetAudience: selectedAudiences,
      duration: newCourseDuration,
      level: newCourseLevel,
      legalRef: newCourseLegalRef,
      description: newCourseDescription || `Formation officielle conçue par ${currentProfile.name}, formatrice accréditée ARMP. Maîtrise des standards de passation et de conformité.`,
      coverImage: newCourseCover,
      chaptersCount: lessonsList.length,
      rating: 5.0,
      studentsCount: 1,
      requiresDfatApproval: false,
      lessons: lessonsList,
      quiz: quizList
    };

    onAddCourse(createdCourse);
    setActiveTab('courses');
    setAuthoringStep(1);
    setNewCourseTitle('');
    setTrainerNotice(`La formation « ${createdCourse.title} » a été publiée et persistée dans Firestore ✓`);
    setTimeout(() => setTrainerNotice(null), 5000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} pb-24 transition-colors`}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER FULL WIDTH — COVER + AVATAR + TABS (full bleed, content en container) */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Cover Photo — full width edge-to-edge */}
          <div className="h-44 sm:h-64 md:h-80 w-full relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 group">
            <img
              src={imgSeminar}
              alt="Couverture Studio Formateur"
              className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-mono max-w-[85vw] truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-bold truncate">ARMP ACADEMIA • STUDIO FORMATEUR CERTIFIÉ</span>
            </div>
            <div className="absolute top-4 right-4 hidden sm:flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <ArmpLogo size="sm" isDarkMode={true} />
              <div className="text-left leading-tight">
                <span className="text-[10px] font-black text-amber-400 block tracking-wider">ACADEMIA ITECH</span>
                <span className="text-[8px] text-slate-300">DFAT • RDC</span>
              </div>
            </div>
          </div>

          {/* Profile Identity — contenu dans container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 -mt-14 sm:-mt-20 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
                <div className="relative group mx-auto sm:mx-0">
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100 ring-2 ring-blue-500/20"
                  />
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2 rounded-full bg-amber-400 text-slate-950 border-2 border-white dark:border-slate-900 shadow-md">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1 text-center sm:text-left bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 shadow-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentProfile.name}
                    </h1>
                    <span className="text-[#1877F2] inline-flex items-center" title="Formateur certifié ARMP">
                      <BadgeCheck className="w-6 h-6 fill-[#1877F2] text-white" />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="px-3 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Formateur Homologué DFAT
                    </span>
                    <span className="text-slate-400 font-semibold">•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {currentProfile.institution}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl font-medium pt-1 italic">
                    « Studio pédagogique — {currentProfile.roleTitle}. Conception de cours Loi 10/010, encadrement CGPMP et attestation DFAT. »
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 pt-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex -space-x-2 overflow-hidden">
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src={imgMentor} alt="Apprenant" />
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900 text-[9px] font-bold text-white">AR</div>
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900 text-[9px] font-bold text-white">+1k</div>
                    </div>
                    <span className="font-semibold">
                      <strong className="text-slate-800 dark:text-slate-200">1 842 apprenants</strong> • 91,4% réussite • 38h Masterclass
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 md:pt-0">
                <button
                  onClick={() => {
                    setActiveTab('authoring');
                    setAuthoringStep(1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Créer un Cours</span>
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center space-x-1.5 active:scale-95"
                >
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  <span>Studio Vidéo</span>
                </button>
                {currentProfile.role !== 'formateur' && onSwitchToTrainerRole && (
                  <button
                    onClick={onSwitchToTrainerRole}
                    className="px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs transition border border-amber-200 dark:border-amber-900/50 flex items-center space-x-1.5"
                    title="Activer le rôle Formateur"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Activer rôle Formateur</span>
                  </button>
                )}
              </div>
            </div>

            {/* Facebook Tabs — sticky style comme UserProfileView */}
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart3 },
                { id: 'courses' as const, label: 'Mes Formations', icon: BookOpen, badge: courses.length },
                { id: 'authoring' as const, label: 'Créateur de Cours', icon: FolderPlus },
                { id: 'studio' as const, label: 'Studio Vidéo', icon: Tv },
                { id: 'quiz_bank' as const, label: 'Banque QCM', icon: ListOrdered },
                { id: 'learners' as const, label: 'Apprenants', icon: Users }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 relative ${
                      isActive
                        ? 'text-[#1877F2] bg-blue-50/80 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1877F2] dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? 'bg-[#1877F2] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1877F2] rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT — DANS CONTAINER                                          */}
      {/* ========================================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ======================================================================= */}
        {/* TAB 1: TRAINER DASHBOARD OVERVIEW                                       */}
        {/* ======================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formations Créées</span>
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {courses.length}
                </div>
                <span className="text-[11px] text-emerald-500 font-bold block">✓ 100% Homologuées DFAT</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apprenants Suivis</span>
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {totalStudentsCount.toLocaleString('fr-FR')}
                </div>
                <span className="text-[11px] text-purple-500 font-bold block">{profilesArray.length} profils actifs synchronisés</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</span>
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {avgSuccessRate}%
                </div>
                <span className="text-[11px] text-slate-400 block">Moyenne certifiante ARMP</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vidéos Masterclass</span>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {recordedVideos.length} prises
                </div>
                <span className="text-[11px] text-amber-500 font-bold block">{quizBankItems.length} QCM nationaux</span>
              </div>
            </div>

            {/* Quick Actions & Recent Productions */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Courses Management Preview */}
              <div className={`lg:col-span-2 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Formations sous votre supervision pédagogique</span>
                    </h3>
                    <p className="text-xs text-slate-500">Modules publiés au catalogue national ACADEMIA ITECH</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Voir tout</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {courses.slice(0, 4).map(c => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 group hover:border-blue-400 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={c.coverImage}
                          alt={c.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold">
                              {c.code}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{c.category}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                            {c.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 block">
                            {c.lessons.length} chapitres • {c.studentsCount} inscrits • Note {c.rating}★
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onPreviewCourse(c)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition"
                          title="Aperçu plan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenCoursePlayer(c)}
                          className="px-3 py-1.5 rounded-xl bg-[#0866FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span className="hidden sm:inline">Tester cours</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Video Studio Shortcut & Quick Stats */}
              <div className="space-y-4">
                
                {/* Video Studio Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 text-white shadow-xl border border-blue-800/40 space-y-4 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Studio Vidéo Masterclass</h3>
                    <p className="text-xs text-blue-200/80 leading-relaxed mt-1">
                      Enregistrez vos capsules pédagogiques avec prompteur interactif et habillage officiel ARMP.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Lancer la régie de tournage</span>
                  </button>
                </div>

                {/* Pedagogical Quality Badge */}
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conformité Pédagogique ARMP</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Toutes vos évaluations sont alignées sur le Référentiel National des Compétences en Commande Publique (Loi 10/010).
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: COURSES & PROGRAM MANAGEMENT                                     */}
        {/* ======================================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Gestion des Programmes & Formations
                </h2>
                <p className="text-xs text-slate-500">
                  Consultez, modifiez ou créez les cursus de formation destinés aux autorités contractantes
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('authoring');
                  setAuthoringStep(1);
                }}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Cursus</span>
              </button>
            </div>

            {/* Courses Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map(course => (
                <div
                  key={course.id}
                  className={`rounded-3xl border overflow-hidden transition flex flex-col ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'
                  } shadow-sm group`}
                >
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono text-[10px] font-bold">
                      {course.code}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-amber-300 font-bold text-[10px] backdrop-blur-xs">
                      {course.level}
                    </span>
                    <div className="absolute bottom-2 left-3 right-3 text-white text-xs flex items-center justify-between">
                      <span className="font-mono text-[11px]">{course.duration}</span>
                      <span className="font-bold text-emerald-400">{course.lessons.length} leçons</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {course.category}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onPreviewCourse(course)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Aperçu
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setActiveTab('studio');
                            setNewCourseCode(course.code);
                          }}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold transition"
                          title="Enregistrer une vidéo pour ce cours"
                        >
                          <Video className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenCoursePlayer(course)}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Lancer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: COURSE AUTHORING STUDIO — MÊME DISPOSITION QUE COURS APPRENANT  */}
        {/* ======================================================================= */}
        {activeTab === 'authoring' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Stepper identique mais dans header immersif */}
            <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <FolderPlus className="w-5 h-5 text-blue-600" />
                    <span>Créateur de Cursus Certifiant (Studio d'Auteur ARMP)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Homologation conforme aux standards de la Direction de la Formation et des Appuis Techniques (DFAT)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  Étape {authoringStep} / 4
                </span>
              </div>

              {/* Progress Stepper Pills */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { step: 1, label: '1. Informations Générales' },
                  { step: 2, label: '2. Programme & Leçons' },
                  { step: 3, label: '3. Examen & QCM' },
                  { step: 4, label: '4. Validation & Publication' }
                ].map(s => (
                  <button
                    key={s.step}
                    onClick={() => setAuthoringStep(s.step as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition text-center truncate ${
                      authoringStep === s.step
                        ? 'bg-blue-600 text-white shadow-sm'
                        : authoringStep > s.step
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1: GENERAL INFORMATIONS */}
            {authoringStep === 1 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Étape 1 : Paramètres généraux du cours
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez le titre, le code réglementaire et les publics cibles assujettis.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Code Réglementaire *
                      </label>
                      <input
                        type="text"
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="Ex: MOD-007"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Intitulé de la formation *
                      </label>
                      <input
                        type="text"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Ex: Audit de Conformité et Contrôle a Posteriori des Marchés Publics"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Catégorie Pédagogique
                      </label>
                      <select
                        value={newCourseCategory}
                        onChange={(e) => setNewCourseCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Passation">Passation des Marchés</option>
                        <option value="Réglementation">Réglementation & Cadre Juridique</option>
                        <option value="Contrôle">Contrôle a Priori (DGCMP)</option>
                        <option value="Contentieux">Contentieux & Recours (CRD)</option>
                        <option value="Gestion & Audit">Gestion & Audit CGPMP</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Niveau d'accréditation
                      </label>
                      <select
                        value={newCourseLevel}
                        onChange={(e) => setNewCourseLevel(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Fondamental">Fondamental (Niveau 1)</option>
                        <option value="Intermédiaire">Intermédiaire (Niveau 2)</option>
                        <option value="Avancé">Avancé (Niveau 3)</option>
                        <option value="Spécialisé">Spécialisé / Expert (Niveau 4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Volume Horaire Estimé
                      </label>
                      <input
                        type="text"
                        value={newCourseDuration}
                        onChange={(e) => setNewCourseDuration(e.target.value)}
                        placeholder="Ex: 12 Heures (3 Modules)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Référence Légale d'Appui (Code des Marchés Publics / Loi 10/010)
                    </label>
                    <input
                      type="text"
                      value={newCourseLegalRef}
                      onChange={(e) => setNewCourseLegalRef(e.target.value)}
                      placeholder="Ex: Loi n° 10/010 du 27 avril 2010 - Articles 18 à 35"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Publics Cibles Assujettis (Sélectionnez les rôles)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        { role: 'cgpmp_member' as const, label: 'Cellules CGPMP (Ministères & Régies)' },
                        { role: 'dgcmp_agent' as const, label: 'Contrôleurs DGCMP' },
                        { role: 'armp_agent' as const, label: 'Régulateurs ARMP / CRD' },
                        { role: 'particulier' as const, label: 'Soumissionnaires & PME du Secteur Privé' },
                        { role: 'formateur' as const, label: 'Formateurs & Auditeurs' }
                      ].map(item => (
                        <div
                          key={item.role}
                          onClick={() => toggleAudience(item.role)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center space-x-2 ${
                            selectedAudiences.includes(item.role)
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            selectedAudiences.includes(item.role) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400'
                          }`}>
                            {selectedAudiences.includes(item.role) && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-[11px]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Description Pédagogique Synthétique
                    </label>
                    <textarea
                      value={newCourseDescription}
                      onChange={(e) => setNewCourseDescription(e.target.value)}
                      rows={3}
                      placeholder="Résumez les compétences opérationnelles acquises par l'apprenant à l'issue de cette session certifiante..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Illustration & Image de Couverture — <span className="text-blue-600 font-mono text-[10px]">Academia Storage (images)</span>
                    </label>
                    {/* Bibliothèque + Upload Academia */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { title: 'Formation Numérique', img: imgTraining },
                        { title: 'Séminaire ARMP', img: imgSeminar },
                        { title: 'Audit CGPMP', img: imgAudit },
                        { title: 'Juriste & Formateur', img: imgMentor }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setNewCourseCover(item.img); setCoverFile(null); }}
                          className={`rounded-xl overflow-hidden border-2 cursor-pointer aspect-16/10 relative transition ${
                            newCourseCover === item.img && !coverFile ? 'border-blue-600 shadow-md scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Upload personnalisé vers Academia 137.184.59.184 */}
                    <div className="mt-3 space-y-2">
                      <AcademiaMediaUploader
                        kind="image"
                        category="covers"
                        visibility="public"
                        entityId={newCourseCode}
                        label="Téléverser votre propre couverture (Academia)"
                        hint="Image stockée sur 137.184.59.184 • JPG/PNG/WebP • 100 Mo max • URL publique /storage/academia/covers/..."
                        onUploaded={(f) => { setNewCourseCover(f.url); setCoverFile(f); }}
                        onError={(m) => alert(m)}
                      />
                      {coverFile && (
                        <AcademiaMediaPreview file={coverFile} onRemove={() => { setCoverFile(null); setNewCourseCover(imgTraining); }} />
                      )}
                      {coverUploading && <span className="text-[11px] text-blue-600">Envoi en cours…</span>}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (!newCourseTitle.trim()) {
                        alert("Veuillez saisir un intitulé pour le cours.");
                        return;
                      }
                      setAuthoringStep(2);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                  >
                    <span>Continuer vers le Programme (Étape 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LESSONS & CURRICULUM BUILDER — DISPOSITION IMMERSIVE APPRENANT */}
            {authoringStep === 2 && (
              <>
              <div className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} shadow-xl`} style={{minHeight:'640px'}}>
                {/* Header immersif même style que CourseWindow */}
                <div className="h-14 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-lg bg-[#0866FF] text-white text-[11px] font-mono font-bold">{newCourseCode}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate max-w-md">{newCourseTitle || 'Nouvelle formation — en création'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{newCourseLegalRef} • Étape 2/4 • Leçon {activeLessonEditIndex+1}/{lessonsList.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <button onClick={()=>setReadingThemeTrainer('dark')} className={`p-1.5 rounded-lg ${readingThemeTrainer==='dark'?'bg-slate-700 text-white':'text-slate-400'}`} title="Sombre">🌙</button>
                      <button onClick={()=>setReadingThemeTrainer('light')} className={`p-1.5 rounded-lg ${readingThemeTrainer==='light'?'bg-white text-slate-900':'text-slate-400'}`} title="Clair">☀️</button>
                    </div>
                    <button onClick={()=>setIsZenModeTrainer(!isZenModeTrainer)} className={`p-2 rounded-xl border ${isZenModeTrainer?'bg-blue-600 border-blue-500 text-white':'bg-slate-800 border-slate-700 text-slate-300'}`} title="Mode concentration"><Eye className="w-4 h-4"/></button>
                    <span className="hidden md:block text-xs font-mono bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">{Math.round(((activeLessonEditIndex+1)/lessonsList.length)*100)}%</span>
                  </div>
                </div>
                <div className="flex flex-1 overflow-hidden min-h-0">
                  {/* Sidebar chapitres — même que CourseWindow */}
                  {!isZenModeTrainer && (
                    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
                      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Programme</span>
                        <button onClick={handleAddNewLesson} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {lessonsList.map((lesson, idx) => {
                          const isActive = idx===activeLessonEditIndex;
                          const fmtIcon = lesson.format==='video'?'🎬':lesson.format==='audio'?'🎙️':lesson.format==='animation'?'✨':lesson.format==='ia_ppt'?'🤖':lesson.format==='pdf'?'📄':lesson.format==='visioconference'?'📹':'📝';
                          return (
                            <button key={lesson.id} onClick={()=>setActiveLessonEditIndex(idx)} className={`w-full text-left p-2.5 rounded-2xl flex items-start gap-3 transition ${isActive?'bg-[#0866FF] text-white shadow-md':'hover:bg-slate-800 text-slate-400'}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive?'bg-white text-[#0866FF]':'bg-slate-800 text-slate-400'}`}>{fmtIcon}</div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold leading-snug line-clamp-2">{lesson.title}</div>
                                <div className="text-[10px] opacity-75 flex items-center gap-1"><Clock className="w-3 h-3"/>{lesson.duration} • {lesson.format}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="p-3 border-t border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-2">{lessonsList.length} chapitres • {quizList.length} questions</div>
                        <button onClick={()=>setAuthoringStep(3)} className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1"><span>Continuer → QCM</span><ChevronRight className="w-3.5 h-3.5"/></button>
                      </div>
                    </aside>
                  )}
                  {/* Center canvas — même carte que CourseWindow reading */}
                  <main className={`flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center ${readingThemeTrainer==='dark'?'bg-slate-950':readingThemeTrainer==='light'?'bg-slate-100':'bg-[#F4EEDD]'}`}>
                    <div className="w-full max-w-3xl space-y-4">
                      {/* Carte édition leçon — même style que CourseWindow p-5 rounded-3xl */}
                      <div className={`p-5 sm:p-7 rounded-3xl border ${readingThemeTrainer==='dark'?'bg-slate-900 border-slate-800 text-slate-100':readingThemeTrainer==='light'?'bg-white border-slate-200 text-slate-900':'bg-[#FCF9F0] border-[#E6DCBF] text-[#2D2418]'} shadow-sm space-y-4`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Étape 2 : Structure du programme ({lessonsList.length} chapitres)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rédigez le contenu textuel et associez vos enregistrements vidéo Masterclass.
                    </p>
                  </div>
                  <button
                    onClick={handleAddNewLesson}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un chapitre</span>
                  </button>
                </div>

                {/* Leçon active — même disposition que lecture apprenant (une seule carte centrée) */}
                <div className="space-y-4">
                  {(() => {
                    const lesson = lessonsList[activeLessonEditIndex];
                    const idx = activeLessonEditIndex;
                    if (!lesson) return null;
                    return (
                    <div
                      key={lesson.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-500 uppercase">Chapitre {idx + 1}</span>
                        </div>
                        {lessonsList.length > 1 && (
                          <button
                            onClick={() => setLessonsList(lessonsList.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                            title="Supprimer cette leçon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Titre du chapitre
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const updated = [...lessonsList];
                              updated[idx].title = e.target.value;
                              setLessonsList(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Durée estimée
                          </label>
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) => {
                              const updated = [...lessonsList];
                              updated[idx].duration = e.target.value;
                              setLessonsList(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Contenu pédagogique & Textes explicatifs
                        </label>
                        <textarea
                          rows={4}
                          value={lesson.content}
                          onChange={(e) => {
                            const updated = [...lessonsList];
                            updated[idx].content = e.target.value;
                            setLessonsList(updated);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed"
                        />
                      </div>

                      {/* Format de leçon — 7 formats : Vidéo / Audio / Animation / IA PPT / PDF / Visio / Texte */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Format de la leçon
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                            {LESSON_FORMATS.find(f=>f.id===lesson.format)?.label} {LESSON_FORMATS.find(f=>f.id===lesson.format)?.icon}
                          </span>
                        </div>
                        {/* Sélecteur de format — 7 boutons */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {LESSON_FORMATS.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => { const u=[...lessonsList]; u[idx].format=f.id as LessonFormat; setLessonsList(u); }}
                              className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${lesson.format===f.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600 dark:text-slate-300'}`}
                              title={f.desc}
                            >
                              <span className="text-lg leading-none">{f.icon}</span>
                              <span className="text-[10px] font-bold leading-none">{f.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* --- Éditeur selon le format --- */}
                        {lesson.format === 'video' && (
                          <div className="space-y-2 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">🎬 Vidéo — Studio ou upload</span>
                              <button onClick={() => setActiveTab('studio')} className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"><Video className="w-3 h-3"/> Studio</button>
                            </div>
                            {lesson.mediaUrl && lesson.mediaUrl.match(/\.(mp4|webm|mov)$/i) && (
                              <video src={lesson.mediaUrl} controls className="w-full rounded-xl max-h-48 bg-black" />
                            )}
                            {lesson.mediaUrl && !lesson.mediaUrl.match(/\.(mp4|webm|mov)$/i) && (
                              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-xs flex items-center justify-between">
                                <span className="truncate">{lesson.mediaUrl.split('/').pop()}</span>
                                <button onClick={()=>{const u=[...lessonsList]; u[idx].mediaUrl=undefined; setLessonsList(u);}} className="text-rose-500"><X className="w-3.5 h-3.5"/></button>
                              </div>
                            )}
                            <AcademiaMediaUploader kind="video" category="cours_videos" visibility="private" entityId={lesson.id} label="Uploader la vidéo (MP4/WebM)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <div className="flex gap-2">
                              <input placeholder="Ou coller une URL YouTube / Vimeo" value={lesson.mediaUrl?.startsWith('http') && !lesson.mediaUrl.includes('academia') ? lesson.mediaUrl : ''} onChange={e=>{const u=[...lessonsList]; u[idx].mediaUrl=e.target.value; setLessonsList(u);}} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                            </div>
                          </div>
                        )}

                        {lesson.format === 'audio' && (
                          <div className="space-y-2 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                            <span className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1">🎙️ Audio — Podcast / narration</span>
                            {lesson.mediaUrl && <audio controls src={lesson.mediaUrl} className="w-full" />}
                            <AcademiaMediaUploader kind="audio" category="cours_audios" visibility="private" entityId={lesson.id} label="Uploader l'audio (MP3/WAV)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <p className="text-[11px] text-slate-500">Astuce : le lecteur du cours génère aussi une version audio automatique via synthèse vocale.</p>
                          </div>
                        )}

                        {lesson.format === 'animation' && (
                          <div className="space-y-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <span className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">✨ Animation — style Animaker (Aperçu interactif en temps réel)</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {ANIMATION_TEMPLATES.map(t => (
                                <button key={t.id} type="button" onClick={()=>{const u=[...lessonsList]; u[idx].templateId=t.id; setLessonsList(u);}} className={`rounded-xl overflow-hidden border-2 text-left transition ${lesson.templateId===t.id ? 'border-amber-500 ring-2 ring-amber-300' : 'border-transparent opacity-80 hover:opacity-100'}`}>
                                  <img src={t.thumb} alt={t.name} className="w-full h-16 object-cover" />
                                  <div className="p-1.5 bg-white dark:bg-slate-800">
                                    <div className="text-[11px] font-bold leading-none">{t.name}</div>
                                    <div className="text-[10px] text-slate-500 leading-none mt-0.5">{t.desc}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                            {/* Aperçu réel du lecteur vidéo animé correspondant au template sélectionné */}
                            <div className="pt-2">
                              <AnimatedLessonPlayer
                                course={{
                                  id: newCourseCode,
                                  code: newCourseCode,
                                  title: newCourseTitle || 'Module ARMP en cours de paramétrage',
                                  category: newCourseCategory,
                                  targetAudience: selectedAudiences,
                                  duration: newCourseDuration,
                                  level: newCourseLevel,
                                  legalRef: newCourseLegalRef,
                                  description: newCourseDescription || 'Aperçu du rendu vidéo animé',
                                  coverImage: newCourseCover,
                                  chaptersCount: lessonsList.length,
                                  rating: 5,
                                  studentsCount: 1,
                                  requiresDfatApproval: false,
                                  lessons: lessonsList,
                                  quiz: quizList
                                }}
                                lesson={lesson}
                                lessonIndex={idx}
                                isSpeaking={false}
                                onToggleSpeech={() => {}}
                                onTemplateChange={(tplId) => {
                                  const u = [...lessonsList];
                                  u[idx].templateId = tplId;
                                  setLessonsList(u);
                                }}
                                compactPreview={true}
                              />
                            </div>
                            <AcademiaMediaUploader kind="video" category="cours_animations" visibility="private" entityId={lesson.id} label="Ou uploader une animation déjà exportée (MP4/GIF)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                          </div>
                        )}

                        {lesson.format === 'ia_ppt' && (
                          <div className="space-y-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1">🤖 IA — Génération PPT</span>
                            <textarea rows={3} value={lesson.aiPrompt || ''} onChange={e=>{const u=[...lessonsList]; u[idx].aiPrompt=e.target.value; setLessonsList(u);}} placeholder="Ex: Génère un cours PPT de 8 slides sur le fractionnement des marchés (Art.13), avec définitions, exemples chiffrés, et un quiz final..." className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs" />
                            <div className="flex gap-2">
                              <button onClick={()=> alert(`Prompt IA envoyé : ${lesson.aiPrompt?.slice(0,60)}...\n→ Slides PPT générés (8 slides) + PDF` )} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Générer le PPT avec l'IA</button>
                              <AcademiaMediaUploader kind="image" category="cours_ppt" visibility="private" entityId={lesson.id} compact label="Uploader PPT/PDF" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            </div>
                            {lesson.mediaUrl && lesson.mediaUrl.match(/\.(ppt|pptx|pdf)$/i) && <div className="text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border flex items-center justify-between"><span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500"/>{lesson.mediaUrl.split('/').pop()}</span><a href={lesson.mediaUrl} target="_blank" className="text-indigo-600 underline">Ouvrir</a></div>}
                          </div>
                        )}

                        {lesson.format === 'pdf' && (
                          <div className="space-y-2 p-3 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                            <span className="font-bold text-red-700 dark:text-red-300 text-xs flex items-center gap-1">📄 PDF — Support / DAO Type</span>
                            {lesson.mediaUrl && <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border text-xs flex items-center justify-between"><span className="flex items-center gap-1 truncate"><FileText className="w-3.5 h-3.5 text-red-500"/>{lesson.mediaUrl.split('/').pop()?.slice(0,40)}</span><a href={lesson.mediaUrl} target="_blank" className="text-blue-600 underline">Aperçu</a></div>}
                            <AcademiaMediaUploader kind="image" category="cours_pdfs" visibility="private" entityId={lesson.id} label="Uploader le PDF (DAO, guide, fiche)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <input placeholder="Ou URL externe du PDF" value={lesson.mediaUrl?.endsWith('.pdf') ? lesson.mediaUrl : ''} onChange={e=>{const u=[...lessonsList]; u[idx].mediaUrl=e.target.value; setLessonsList(u);}} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                          </div>
                        )}

                        {lesson.format === 'visioconference' && (
                          <div className="space-y-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1">📹 Visioconférence — Cours en direct</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(['zoom','teams','meet','jitsi'] as const).map(p => (
                                <button key={p} type="button" onClick={()=>{const u=[...lessonsList]; u[idx].visioPlatform=p; setLessonsList(u);}} className={`py-1.5 rounded-lg border text-[11px] font-bold capitalize ${lesson.visioPlatform===p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{p}</button>
                              ))}
                            </div>
                            <input placeholder="Lien de la réunion (https://...)" value={lesson.visioLink || ''} onChange={e=>{const u=[...lessonsList]; u[idx].visioLink=e.target.value; setLessonsList(u);}} className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs" />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="datetime-local" value={lesson.visioDate || ''} onChange={e=>{const u=[...lessonsList]; u[idx].visioDate=e.target.value; setLessonsList(u);}} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                              <div className="flex items-center text-[11px] text-slate-500 px-2">Durée : {lesson.duration}</div>
                            </div>
                            {lesson.visioLink && <a href={lesson.visioLink} target="_blank" className="block text-center py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Rejoindre la visio →</a>}
                          </div>
                        )}

                        {lesson.format === 'texte' && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                            ✍️ Leçon texte — utilise le champ <b>Contenu pédagogique</b> ci-dessus. Idéal pour articles, définitions, études de cas.
                          </div>
                        )}

                        {/* Articles associés */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Bookmark className="w-3 h-3 text-blue-600" />
                          <span>Articles : {lesson.keyArticles.join(', ') || '—'}</span>
                        </div>
                      </div>

                    </div>
                  );
                  })()}
                </div>

                        {/* Navigation chapitres */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/40 gap-3">
                          <button disabled={activeLessonEditIndex===0} onClick={()=>setActiveLessonEditIndex(p=>Math.max(0,p-1))} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1"><ChevronLeft className="w-4 h-4"/><span>Précédent</span></button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{activeLessonEditIndex+1} / {lessonsList.length}</span>
                            <button onClick={()=>setActiveLessonEditIndex(p=>Math.min(lessonsList.length-1,p+1))} className="px-4 py-2 rounded-xl bg-[#0866FF] text-white font-bold text-xs flex items-center gap-1"><span>Suivant</span><ChevronRight className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
              {/* Barre basse globale */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between rounded-b-3xl">
                <button onClick={()=>setAuthoringStep(1)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">← Étape 1</button>
                <button onClick={()=>setAuthoringStep(3)} className="px-6 py-2.5 rounded-xl bg-[#0866FF] text-white font-bold text-xs flex items-center gap-2"><span>Continuer vers l'Évaluation QCM</span><ArrowRight className="w-4 h-4"/></button>
              </div>
              </>
            )}

            {/* STEP 3: QUIZ & CERTIFYING EXAM BUILDER */}
            {authoringStep === 3 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Étape 3 : Banque de Questions & Examen Certifiant ARMP
                    </h3>
                    <p className="text-xs text-slate-500">
                      Définissez les questions QCM et les justifications juridiques. Seuil officiel : 70%.
                    </p>
                  </div>
                  <button
                    onClick={handleAddNewQuizQuestion}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                {/* Quiz Questions List */}
                <div className="space-y-5">
                  {quizList.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Question #{qIdx + 1}</span>
                        {quizList.length > 1 && (
                          <button
                            onClick={() => setQuizList(quizList.filter((_, i) => i !== qIdx))}
                            className="p-1 text-slate-400 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].question = e.target.value;
                            setQuizList(updated);
                          }}
                          placeholder="Intitulé de la question juridique..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          Options de réponse (Cochez le bouton radio de la bonne réponse) :
                        </span>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => {
                                const updated = [...quizList];
                                updated[qIdx].correctIndex = optIdx;
                                setQuizList(updated);
                              }}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizList];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setQuizList(updated);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-xl text-xs border ${
                                q.correctIndex === optIdx
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Justification juridique (affichée après correction)
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].explanation = e.target.value;
                            setQuizList(updated);
                          }}
                          placeholder="Ex: Fondement sur l'article 26 de la Loi n° 10/010..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setAuthoringStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    ← Étape précédente
                  </button>
                  <button
                    onClick={() => setAuthoringStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                  >
                    <span>Finaliser et Réviser (Étape 4)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & PUBLICATION */}
            {authoringStep === 4 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Étape 4 : Récapitulatif avant Homologation & Publication</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vérifiez l'ensemble des éléments avant l'intégration automatique dans le catalogue national.
                  </p>
                </div>

                {/* Recap Card */}
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={newCourseCover}
                      alt={newCourseTitle}
                      className="w-16 h-16 rounded-xl object-cover border border-blue-300"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-bold">
                        {newCourseCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {newCourseTitle || "Nouvelle Formation"}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">
                        {newCourseLegalRef} • {newCourseLevel} • {newCourseDuration}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Chapitres</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lessonsList.length} leçons</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Questions QCM</span>
                      <span className="font-bold text-slate-900 dark:text-white">{quizList.length} questions</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Seuil Certificat</span>
                      <span className="font-bold text-emerald-600">70% requis</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setAuthoringStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    ← Modifier le QCM
                  </button>

                  <button
                    onClick={handlePublishCourse}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl transition flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Publier officiellement la formation</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: DIGITAL VIDEO PRODUCTION STUDIO (ENREGISTREUR & MASTERCLASS)     */}
        {/* ======================================================================= */}
        {activeTab === 'studio' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Studio Numérique ARMP • Tournage des Masterclasses
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Régie d'enregistrement multimédia avec prompteur temps réel et habillage institutionnel
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>{isRecording ? `REC ${formatTime(recordSeconds)}` : 'STUDIO PRÊT'}</span>
                </span>
              </div>
            </div>

            {/* Studio Main Workspace Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Interactive Video Stage & Controls */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Live Stage Canvas / Video Container */}
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                  
                  {/* Real WebRTC Video Tag */}
                  <video
                    ref={videoPreviewRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Fallback Simulator Screen if Camera is Off */}
                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3 z-10">
                      <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Caméra en attente de signal</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          Activez la caméra ou le partage d'écran pour démarrer votre session de tournage Masterclass.
                        </p>
                      </div>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Allumer la webcam</span>
                        </button>
                        <button
                          onClick={startScreenShare}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5"
                        >
                          <ScreenShare className="w-4 h-4" />
                          <span>Partager l'écran</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Institutional Top Right ARMP Seal Overlay */}
                  <div className="absolute top-4 right-4 pointer-events-none z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <ArmpLogo size="sm" isDarkMode={true} />
                    <div className="text-left leading-tight">
                      <span className="text-[10px] font-black text-amber-400 block tracking-wider">ACADEMIA ITECH</span>
                      <span className="text-[8px] text-slate-300">DFAT • RDC</span>
                    </div>
                  </div>

                  {/* Lower Third (Bandeau Titre TV Professionnel) */}
                  {studioLowerThird && (
                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-20 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="max-w-md bg-gradient-to-r from-blue-950/95 via-indigo-950/90 to-slate-900/90 backdrop-blur-md border-l-4 border-amber-400 p-3 rounded-r-2xl shadow-2xl">
                        <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider block">
                          Masterclass Officielle • Loi n° 10/010 du 27 avril 2010
                        </span>
                        <h4 className="text-sm font-black text-white truncate">
                          {currentProfile.name}
                        </h4>
                        <p className="text-[10px] text-slate-300 truncate">
                          {currentProfile.roleTitle} — Formateur Homologué ARMP
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Red REC Watermark during active recording */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>REC {formatTime(recordSeconds)}</span>
                    </div>
                  )}

                </div>

                {/* Studio Control Deck Bar */}
                <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-wrap items-center justify-between gap-3`}>
                  
                  {/* Media toggles */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={cameraActive ? stopCamera : startCamera}
                      className={`p-2.5 rounded-xl border transition ${
                        cameraActive
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title={cameraActive ? "Désactiver la caméra" : "Activer la caméra"}
                    >
                      {cameraActive ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setMicActive(!micActive)}
                      className={`p-2.5 rounded-xl border transition ${
                        micActive
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-rose-600 border-rose-500 text-white'
                      }`}
                      title={micActive ? "Microphone actif" : "Microphone coupé"}
                    >
                      {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={startScreenShare}
                      className={`p-2.5 rounded-xl border transition ${
                        screenShareActive
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Partager une fenêtre ou un document de cours"
                    >
                      <ScreenShare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setStudioLowerThird(!studioLowerThird)}
                      className={`p-2.5 rounded-xl border transition ${
                        studioLowerThird
                          ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Afficher / Masquer le bandeau titre télévisé"
                    >
                      <Tv className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Record Action Button */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleToggleRecord}
                      className={`px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition flex items-center space-x-2 ${
                        isRecording
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white" />
                      <span>{isRecording ? "Arrêter & Enregistrer la Prise" : "Lancer l'Enregistrement Vidéo"}</span>
                    </button>
                  </div>

                </div>

                {/* Recorded Takes Library */}
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span>Médiathèque des Prises Masterclass ({recordedVideos.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {recordedVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {vid.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Durée {vid.duration} • Enregistré {vid.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <a
                            href={vid.blobUrl}
                            download={`${vid.title}.webm`}
                            className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
                            title="Télécharger le fichier vidéo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Col: Virtual Interactive Teleprompter (Téléprompteur) */}
              <div className="space-y-4">
                
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4 flex flex-col h-[540px]`}>
                  
                  {/* Prompter Controls Header */}
                  <div className="border-b pb-3 border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span>Téléprompteur Virtuel</span>
                      </span>
                      <button
                        onClick={() => setIsPrompterRunning(!isPrompterRunning)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                          isPrompterRunning
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isPrompterRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPrompterRunning ? 'Pause Défilement' : 'Défiler'}</span>
                      </button>
                    </div>

                    {/* Speed and font controls */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center space-x-1">
                        <span>Vitesse :</span>
                        {[1.0, 1.5, 2.0].map(spd => (
                          <button
                            key={spd}
                            onClick={() => setTeleprompterSpeed(spd)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              teleprompterSpeed === spd ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setPrompterFontSize(prompterFontSize === 'xl' ? 'large' : 'normal')}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                        >
                          A-
                        </button>
                        <button
                          onClick={() => setPrompterFontSize(prompterFontSize === 'normal' ? 'large' : 'xl')}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prompter Scrolling Canvas */}
                  <div
                    ref={prompterContainerRef}
                    className="flex-1 overflow-y-auto p-4 rounded-2xl bg-black text-amber-300 font-serif leading-loose select-none border border-slate-800 relative shadow-inner"
                  >
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                    <div className={`whitespace-pre-line ${
                      prompterFontSize === 'normal' ? 'text-sm' : prompterFontSize === 'large' ? 'text-base font-bold' : 'text-xl font-bold'
                    }`}>
                      {prompterText}
                    </div>
                    <div className="h-40" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                  </div>

                  {/* Prompter Text Editor Area */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Modifier le texte du prompteur :
                    </label>
                    <textarea
                      rows={2}
                      value={prompterText}
                      onChange={(e) => setPrompterText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 resize-none font-mono"
                    />
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 5: CERTIFYING QUESTION BANK (BANQUE DE QCM PERSISTÉE FIRESTORE)     */}
        {/* ======================================================================= */}
        {activeTab === 'quiz_bank' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <ListOrdered className="w-5 h-5 text-blue-600" />
                  <span>Banque Nationale des Questions d'Évaluation ARMP ({quizBankItems.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Questions types issues de la jurisprudence et des cas pratiques de la commande publique en RDC (persistées dans Firestore)
                </p>
              </div>
            </div>

            {trainerNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {trainerNotice}
              </div>
            )}

            {/* Formulaire d'ajout de question dans la Banque Nationale */}
            <form
              onSubmit={handleAddQuizBankItem}
              className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}
            >
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Ajouter une question officielle à la Banque Nationale ARMP</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Thématique</label>
                  <input
                    type="text"
                    value={newQbTheme}
                    onChange={e => setNewQbTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    placeholder="Ex: Passation & DAO"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Référence Légale (Loi 10/010)</label>
                  <input
                    type="text"
                    value={newQbArticle}
                    onChange={e => setNewQbArticle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    placeholder="Ex: Loi 10/010 Art. 26"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="font-bold text-slate-500 block mb-1">Énoncé de la question</label>
                <input
                  type="text"
                  value={newQbQuestion}
                  onChange={e => setNewQbQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Saisissez la question d'évaluation..."
                  required
                />
              </div>
              <div className="text-xs">
                <label className="font-bold text-slate-500 block mb-1">Réponse officielle homologuée DFAT</label>
                <textarea
                  rows={2}
                  value={newQbAnswer}
                  onChange={e => setNewQbAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  placeholder="Saisissez la réponse de référence..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer dans la Banque Nationale</span>
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {quizBankItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-2`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {item.code} • {item.theme}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.article}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.q}
                  </h4>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    <b>Réponse de référence :</b> {item.rep}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 6: LEARNERS & CERTIFICATIONS TRACKING (SYNCHRONISÉ FIRESTORE)       */}
        {/* ======================================================================= */}
        {activeTab === 'learners' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Suivi Pédagogique des Apprenants & Habilitations ({profilesArray.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Validation des attestations de réussite des cadres des CGPMP et régies financières synchronisés dans Firestore
              </p>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Candidats et profils certifiés sous votre tutelle
                </span>
                <span className="text-xs font-bold text-emerald-500">✓ Synchronisé Firestore ARMP</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {profilesArray.map((p) => {
                  const completedIds = p.completedCourseIds || [];
                  const latestCourseCode = completedIds[completedIds.length - 1] || courses[0]?.code || 'MOD-001';
                  const foundCourse = courses.find(c => c.id === latestCourseCode || c.code === latestCourseCode);
                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.avatarUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {p.institution} • {foundCourse ? `${foundCourse.code} • ${foundCourse.title}` : `${p.completedModulesCount} modules validés`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-emerald-600 block">
                          Score {p.placementScore || 84}% • {p.certificationsCount} certif.
                        </span>
                        <span className="text-[10px] text-slate-400">{p.level} • {p.lastActiveDate || "Actif aujourd'hui"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
