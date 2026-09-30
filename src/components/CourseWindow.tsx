import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Scale,
  Volume2,
  VolumeX,
  Award,
  Download,
  Printer,
  Sparkles,
  QrCode,
  RotateCcw,
  FileText,
  Video,
  MessageCircle,
  Send,
  HelpCircle,
  Clock,
  Star,
  Layers,
  Search,
  Bookmark,
  ThumbsUp,
  Maximize2,
  Minimize2,
  Type,
  Sun,
  Moon,
  FileEdit,
  CheckCircle2,
  Play,
  Pause,
  Headphones,
  Eye,
  Check,
  RefreshCw,
  Share2,
  ShieldCheck,
  Film
} from 'lucide-react';
import { CourseModule, UserProfile, CourseQAItem } from '../types';
import { ArmpLogo } from './ArmpLogo';
import { speechService, SpeechPlaybackState } from '../utils/speechService';
import { AishaAvatar } from './AishaAvatar';
import {
  detectContextualSceneType,
  buildSynchronizedLessonScreens,
  PEDAGOGICAL_TRANSITION_VARIATIONS
} from './ProfessorFilmScenes';
import { saveCourseQAToFirestore, fetchCourseQAFromFirestore } from '../firebase';
import { AnimatedLessonPlayer } from './AnimatedLessonPlayer';

interface CourseWindowProps {
  course: CourseModule;
  onClose: () => void;
  currentProfile: UserProfile;
  onCompleteModule: (courseId: string, score?: number) => void;
  onUpdateCourseProgress?: (courseId: string, progressPct: number, completedLessonIndices: number[], quizScore?: number) => void;
  onSaveCourseNote?: (courseId: string, lessonIdx: number, noteText: string) => void;
  onAskTutor?: (question: string) => void;
}

type Mode = 'reading' | 'resources' | 'qa' | 'quiz' | 'certificate' | 'notes';
type ReadingTheme = 'dark' | 'light' | 'sepia';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

interface QAItem {
  id: string;
  author: string;
  avatar: string;
  question: string;
  answer?: string;
  likes: number;
  time: string;
}

export const CourseWindow: React.FC<CourseWindowProps> = ({
  course,
  onClose,
  currentProfile,
  onCompleteModule,
  onUpdateCourseProgress,
  onSaveCourseNote,
  onAskTutor
}) => {
  // Preloader state
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(15);
  const [preloadPhase, setPreloadPhase] = useState('Authentification de la session et des prérequis...');

  // Navigation & Mode
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('reading');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileChaptersOpen, setIsMobileChaptersOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reading Comfort
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSize>('base');

  // Video & Audio
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [activeCardScreenIdx, setActiveCardScreenIdx] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>(speechService.getState());
  const [autoReadLessons, setAutoReadLessons] = useState<boolean>(() => {
    try {
      return localStorage.getItem('academia_course_autoread') === 'true';
    } catch {
      return false;
    }
  });

  // Completed Lessons Tracking (synchronisé avec Firestore + localStorage)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(() => {
    try {
      const fromProfile = currentProfile.completedLessonsByCourse?.[course.id];
      if (Array.isArray(fromProfile) && fromProfile.length > 0) {
        return new Set(fromProfile);
      }
      const saved = localStorage.getItem(`armp_completed_lessons_${course.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set([0]);
    } catch {
      return new Set([0]);
    }
  });

  // Notes state
  const [notes, setNotes] = useState<string>('');
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(() => {
    return (currentProfile.quizScoresByCourse?.[course.id] ?? 0) >= 70;
  });
  const [quizScore, setQuizScore] = useState<number>(() => {
    return currentProfile.quizScoresByCourse?.[course.id] ?? 0;
  });

  // Q&A and Resources
  const [questionInput, setQuestionInput] = useState('');
  const [qaFilter, setQaFilter] = useState<'all' | 'mine'>('all');
  const [resourceSearch, setResourceSearch] = useState('');
  const defaultQA: QAItem[] = [
    {
      id: `qa-seed-1-${course.id}`,
      author: 'M. Alain (CGPMP - Santé)',
      avatar: currentProfile.avatarUrl,
      question: 'Quelle est la différence entre ANO et avis de non-objection DGCMP pour ce module ?',
      answer: 'L’ANO DGCMP est l’acte préalable obligatoire avant conclusion du marché > seuil. Voir Loi 10/010 art. 28 et DAO Type ARMP.',
      likes: 8,
      time: 'Il y a 2j'
    },
    {
      id: `qa-seed-2-${course.id}`,
      author: currentProfile.name,
      avatar: currentProfile.avatarUrl,
      question: 'Le PPM 2026 doit-il être publié avant le DAO ?',
      answer: 'Oui, le PPM est préalable et conditionne la recevabilité du DAO (art. 12). Le Tuteur IA peut détailler.',
      likes: 3,
      time: 'Hier'
    }
  ];
  const [qaItems, setQaItems] = useState<QAItem[]>(() => {
    try {
      const saved = localStorage.getItem(`armp_qa_${course.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultQA;
  });

  // Charger les Q&A persistés depuis Firestore
  useEffect(() => {
    let mounted = true;
    fetchCourseQAFromFirestore(course.id).then(remote => {
      if (mounted && remote && remote.length > 0) {
        setQaItems(prev => {
          const map = new Map<string, QAItem>();
          [...remote, ...prev].forEach(item => map.set(item.id, item));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(`armp_qa_${course.id}`, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [course.id]);

  const safeLessons = Array.isArray(course.lessons) && course.lessons.length > 0
    ? course.lessons
    : [{
        id: `${course.id}-l1`,
        title: course.title || 'Chapitre 1',
        duration: course.duration || '45 min',
        content: course.description || 'Contenu pédagogique homologué par la DFAT / ARMP.',
        keyArticles: [course.legalRef || 'Loi 10/010'],
        format: 'animation' as const,
        templateId: 'whiteboard' as const,
      }];
  const safeQuiz = Array.isArray(course.quiz) && course.quiz.length > 0
    ? course.quiz
    : [{
        question: `Quel est le cadre légal de référence applicable au module « ${course.title} » ?`,
        options: [
          `La Loi n° 10/010 du 27 avril 2010 (${course.legalRef || 'Marchés Publics RDC'})`,
          'Une simple note interne sans valeur réglementaire',
          'Uniquement un accord verbal entre parties'
        ],
        correctIndex: 0,
        explanation: `Conformément à la Loi n° 10/010 du 27 avril 2010 (${course.legalRef || 'Code des Marchés Publics'}), toute procédure est encadrée par les textes officiels ARMP.`
      }];
  const currentLesson = safeLessons[activeLessonIndex] || safeLessons[0];
  const currentKeyArticles = Array.isArray(currentLesson?.keyArticles) ? currentLesson.keyArticles : [];
  const progress = Math.max(
    Math.round(((activeLessonIndex + 1) / Math.max(1, safeLessons.length)) * 100),
    Math.round((completedLessons.size / Math.max(1, safeLessons.length)) * 100)
  );

  // Lock body scroll on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Preloader timer sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      setPreloadProgress(45);
      setPreloadPhase('Chargement des contenus pédagogiques et des DAO Types ARMP...');
    }, 280);

    const t2 = setTimeout(() => {
      setPreloadProgress(80);
      setPreloadPhase('Indexation des articles de la Loi 10/010 et de la jurisprudence...');
    }, 620);

    const t3 = setTimeout(() => {
      setPreloadProgress(100);
      setPreloadPhase('Salle de formation ARMP prête !');
    }, 950);

    const t4 = setTimeout(() => {
      setIsPreloading(false);
    }, 1150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [course.id]);

  // Load and save notes per lesson
  useEffect(() => {
    try {
      const key = `armp_notes_${course.id}_${activeLessonIndex}`;
      const fromProfile = currentProfile.notesByCourse?.[key];
      const saved = fromProfile ?? localStorage.getItem(key);
      setNotes(saved || '');
    } catch {
      setNotes('');
    }
  }, [course.id, activeLessonIndex, currentProfile.notesByCourse]);

  const handleSaveNotes = () => {
    try {
      const key = `armp_notes_${course.id}_${activeLessonIndex}`;
      localStorage.setItem(key, notes);
      onSaveCourseNote?.(course.id, activeLessonIndex, notes);
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNextLesson();
      } else if (e.key === 'ArrowLeft') {
        handlePrevLesson();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLessonIndex, course.lessons.length]);

  // Fullscreen toggle (browser native)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Lesson progression
  const handleMarkAsCompleted = (index: number) => {
    const next = new Set(completedLessons);
    next.add(index);
    const arr = Array.from(next);
    const pct = Math.min(100, Math.round((arr.length / Math.max(1, safeLessons.length)) * 100));
    setCompletedLessons(next);
    try {
      localStorage.setItem(`armp_completed_lessons_${course.id}`, JSON.stringify(arr));
    } catch {}
    onUpdateCourseProgress?.(course.id, pct, arr);
  };

  const handleNextLesson = () => {
    handleMarkAsCompleted(activeLessonIndex);
    if (activeLessonIndex < safeLessons.length - 1) {
      setActiveLessonIndex(prev => prev + 1);
      setMode('reading');
      stopSpeech();
    } else {
      setMode('quiz');
      stopSpeech();
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(prev => prev - 1);
      setMode('reading');
      stopSpeech();
    }
  };

  // Speech synthesis
  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setPlaybackState(state);
      setIsSpeaking(state.isPlaying && state.currentId === `lesson-${course.id}-${activeLessonIndex}`);
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, [course.id, activeLessonIndex]);

  // Auto-lecture vocale automatique au changement de chapitre si activée
  useEffect(() => {
    const fmt = (currentLesson as any)?.format || 'animation';
    if (fmt === 'animation') return; // AnimatedLessonPlayer gère directement la voix synchronisée au film 2D
    if (autoReadLessons && mode === 'reading' && !isPreloading) {
      const lessonId = `lesson-${course.id}-${activeLessonIndex}`;
      const customSentences = buildLessonNarrationSentences();
      const timer = setTimeout(() => {
        speechService.unlockAudio();
        speechService.play(customSentences.join(' '), lessonId, {
          speed: speechRate,
          voice: speechService.getVoicePersona(),
          customSentences
        });
      }, 350);
      return () => {
        clearTimeout(timer);
        speechService.stop();
      };
    }
  }, [activeLessonIndex, autoReadLessons, mode, isPreloading, course.id, speechRate, currentLesson]);

  const stopSpeech = () => {
    speechService.stop();
    setIsSpeaking(false);
  };

  // Build the 5 calibrated spoken acts matching AnimatedLessonPlayer so both controls stay 100% in sync
  const buildLessonNarrationSentences = () => {
    const safeTitle = currentLesson?.title || course?.title || 'Chapitre de formation';
    const safeContent = currentLesson?.content || course?.description || '';
    const { sentences } = buildSynchronizedLessonScreens(
      safeTitle,
      safeContent,
      course?.code || '',
      course?.legalRef || 'Loi n° 10/010',
      activeLessonIndex,
      null,
      currentProfile
    );
    return sentences;
  };

  const toggleSpeech = () => {
    const lessonId = `lesson-${course.id}-${activeLessonIndex}`;
    if (isSpeaking) {
      stopSpeech();
    } else {
      speechService.unlockAudio();
      const customSentences = buildLessonNarrationSentences();
      speechService.play(customSentences.join(' '), lessonId, {
        speed: speechRate,
        voice: speechService.getVoicePersona(),
        customSentences
      });
    }
  };

  const toggleAutoReadLessons = () => {
    speechService.unlockAudio();
    const next = !autoReadLessons;
    setAutoReadLessons(next);
    try {
      localStorage.setItem('academia_course_autoread', String(next));
    } catch {}
    if (next && !isSpeaking) {
      const lessonId = `lesson-${course.id}-${activeLessonIndex}`;
      const customSentences = buildLessonNarrationSentences();
      speechService.play(customSentences.join(' '), lessonId, {
        speed: speechRate,
        voice: speechService.getVoicePersona(),
        customSentences
      });
    }
  };

  // Quiz submission
  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitQuiz = () => {
    let correct = 0;
    safeQuiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correct++;
    });
    const finalScore = Math.round((correct / Math.max(1, safeQuiz.length)) * 100);
    setQuizScore(finalScore);
    setIsQuizSubmitted(true);
    const allLessonIndices = safeLessons.map((_, idx) => idx);
    onUpdateCourseProgress?.(course.id, finalScore >= 70 ? 100 : progress, allLessonIndices, finalScore);
    if (finalScore >= 70) {
      onCompleteModule(course.id, finalScore);
    }
  };

  // Q&A (persisté dans Firestore + localStorage + réponse IA en direct avec voix d'Aïsha)
  const [isAskingTutorQA, setIsAskingTutorQA] = useState(false);
  const [activeSpeakingQaId, setActiveSpeakingQaId] = useState<string | null>(null);

  const speakQaAnswer = (answerText: string, qaId: string) => {
    if (!answerText) return;
    speechService.unlockAudio();
    const clean = answerText
      .replace(/[*#`_>]/g, '')
      .replace(/\|.*\|/g, ' ')
      .replace(/💡|✨|⚖️|🏛️|📋|👥|🤝|🎓|📄|📢|🛡️|📦|🔄|🌸|🎯|🧩|🚫|🚦|👣|🔒|🗺️|⚠️|🤗|🇨🇩|📐|🧠/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    setActiveSpeakingQaId(qaId);
    speechService.play(clean, `qa-voice-${qaId}`, {
      speed: 0.9,
      voice: speechService.getVoicePersona()
    });
  };

  const askQuestion = async (presetQuestion?: string) => {
    const qText = (presetQuestion ?? questionInput).trim();
    if (!qText || isAskingTutorQA) return;

    speechService.unlockAudio();
    const qaId = `qa-${course.id}-${Date.now()}`;
    if (!presetQuestion) setQuestionInput('');
    setIsAskingTutorQA(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: qText,
          userName: currentProfile.name,
          context: `Utilisateur: ${currentProfile.name}, Rôle: ${currentProfile.roleTitle} | Cours actif: ${course.code} - ${course.title} (${course.legalRef}) | Chapitre ${activeLessonIndex + 1}: ${currentLesson.title} | Contenu: ${(currentLesson.content || '').slice(0, 500)}`,
          learningContext: {
            lastCourseTitle: course.title,
            lastCourseCode: course.code,
            lastCourseCategory: course.category,
            lastCourseProgress: progress,
            recentTitles: course.title,
            overallProgress: progress,
            lastCourseExcerpt: `${currentLesson.title} — ${(currentLesson.content || '').slice(0, 380)}`
          }
        })
      });
      const data = await res.json().catch(() => ({}));
      const aiAnswer =
        data.reply ||
        `En référence à ${course.legalRef} (Chapitre ${activeLessonIndex + 1} : ${currentLesson.title}), la règle impose le respect strict de la procédure préalable et la traçabilité écrite de chaque étape.`;

      const newQ: CourseQAItem = {
        id: qaId,
        courseId: course.id,
        authorId: currentProfile.id,
        author: currentProfile.name,
        avatar: currentProfile.avatarUrl,
        question: qText,
        answer: aiAnswer,
        likes: 1,
        time: "À l'instant",
        createdAt: new Date().toISOString()
      };
      const nextList = [newQ, ...qaItems];
      setQaItems(nextList);
      try {
        localStorage.setItem(`armp_qa_${course.id}`, JSON.stringify(nextList));
      } catch {}
      saveCourseQAToFirestore(newQ).catch(() => {});

      // Lecture vocale automatique de la réponse d'Aïsha
      setTimeout(() => speakQaAnswer(aiAnswer, qaId), 80);
    } catch {
      const fallbackAnswer = `En référence à ${course.legalRef} (Chapitre ${activeLessonIndex + 1} : ${currentLesson.title}), veillez à documenter chaque étape conformément au manuel officiel ARMP.`;
      const newQ: CourseQAItem = {
        id: qaId,
        courseId: course.id,
        authorId: currentProfile.id,
        author: currentProfile.name,
        avatar: currentProfile.avatarUrl,
        question: qText,
        answer: fallbackAnswer,
        likes: 1,
        time: "À l'instant",
        createdAt: new Date().toISOString()
      };
      const nextList = [newQ, ...qaItems];
      setQaItems(nextList);
    } finally {
      setIsAskingTutorQA(false);
    }
  };

  // Resources
  const resources = [
    { id: 'r1', title: `Support officiel complet ${course.code}`, type: 'PDF ARMP', size: '4.2 Mo', icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10', action: 'Télécharger' },
    { id: 'r2', title: `DAO Type ARMP — ${course.category}`, type: 'Modèle Standard', size: '1.8 Mo', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', action: 'Consulter' },
    { id: 'r3', title: `Masterclass Vidéo Chapitre ${activeLessonIndex + 1}`, type: 'Vidéo HD 1080p', size: currentLesson.duration, icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10', action: 'Visionner' },
    { id: 'r4', title: `Loi n° 10/010 du 27 avril 2010 — ${course.legalRef}`, type: 'Texte Légal Intégral', size: 'Journal Officiel RDC', icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10', action: 'Ouvrir' },
    ...(currentKeyArticles.map((a, i) => ({
      id: `art-${i}`,
      title: `${a} — Manuel des Procédures de passation`,
      type: 'Article Fondateur',
      size: 'Homologué DFAT',
      icon: Bookmark,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      action: 'Étudier'
    })))
  ].filter(r => !resourceSearch || r.title.toLowerCase().includes(resourceSearch.toLowerCase()) || r.type.toLowerCase().includes(resourceSearch.toLowerCase()));

  // Dynamic Theme Colors for Reading Body
  const themeStyles = {
    dark: {
      bg: 'bg-slate-950',
      cardBg: 'bg-slate-900 border-slate-800',
      text: 'text-slate-100',
      textMuted: 'text-slate-400',
      highlightBg: 'bg-slate-800/80 border-slate-700',
      sidebarBg: 'bg-slate-900 border-slate-800'
    },
    sepia: {
      bg: 'bg-[#F4EEDD]',
      cardBg: 'bg-[#FCF9F0] border-[#E6DCBF]',
      text: 'text-[#2D2418]',
      textMuted: 'text-[#6B5A42]',
      highlightBg: 'bg-[#EFE6CD] border-[#D8C7A0]',
      sidebarBg: 'bg-[#EFE7D2] border-[#DFCFA7]'
    },
    light: {
      bg: 'bg-slate-100',
      cardBg: 'bg-white border-slate-200 shadow-sm',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      highlightBg: 'bg-slate-50 border-slate-200',
      sidebarBg: 'bg-white border-slate-200'
    }
  }[readingTheme];

  const fontClasses = {
    sm: 'text-xs sm:text-sm leading-relaxed',
    base: 'text-sm sm:text-base leading-relaxed',
    lg: 'text-base sm:text-lg leading-loose',
    xl: 'text-lg sm:text-xl leading-loose font-serif'
  }[fontSize];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. INSTITUTIONAL IMMERSIVE PRELOADER (ARMP RDC)                           */}
      {/* ========================================================================= */}
      {isPreloading && (
        <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center select-none animate-in fade-in duration-200">
          <div className="max-w-md w-full space-y-6 flex flex-col items-center">
            
            {/* Pulsing ARMP Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
                <ArmpLogo size="lg" isDarkMode={true} />
              </div>
            </div>

            {/* National Republic & ARMP Badges */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Direction de la Formation et des Appuis Techniques (DFAT)
              </span>
            </div>

            {/* Course Card Preview */}
            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-1.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-[#0866FF] text-white text-[10px] font-bold font-mono">
                  {course.code}
                </span>
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {course.level} • {course.duration}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white line-clamp-1">
                {course.title}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                {course.legalRef} • {course.category}
              </p>
            </div>

            {/* Progress Bar & Status Text */}
            <div className="w-full space-y-2">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-amber-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${preloadProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="text-[11px] font-medium text-slate-300 animate-pulse truncate max-w-[280px]">
                    {preloadPhase}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-white">
                  {preloadProgress}%
                </span>
              </div>
            </div>

            {/* Fast Skip Button */}
            <button
              onClick={() => setIsPreloading(false)}
              className="text-xs font-bold text-slate-400 hover:text-white transition underline underline-offset-4"
            >
              Accéder immédiatement au cours →
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FULLSCREEN IMMERSIVE LMS WINDOW (TAKES OVER 100% OF SCREEN)            */}
      {/* ========================================================================= */}
      <div className={`fixed inset-0 z-[100] w-screen h-screen flex flex-col ${themeStyles.bg} transition-colors duration-200 overflow-hidden`}>
        
        {/* TOP BAR: ARMP INSTITUTIONAL LMS HEADER */}
        <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-3 sm:px-5 shrink-0 z-30 shadow-md">
          
          {/* Left: Close & Course Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <button
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              title="Quitter la session (Échap)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-bold">Fermer</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center space-x-2 min-w-0">
              <span className="px-2 py-0.5 rounded-lg bg-[#0866FF] text-white text-[11px] font-mono font-bold shrink-0">
                {course.code}
              </span>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md lg:max-w-lg text-white">
                  {course.title}
                </h1>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                  {course.legalRef} • Chapitre {activeLessonIndex + 1}/{course.lessons.length}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Progress Bar */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-[11px] font-bold text-white">
                Progression : {progress}%
              </div>
              <div className="text-[9px] text-slate-400">
                {completedLessons.size}/{course.lessons.length} assimilés
              </div>
            </div>
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Right: Controls (Zen Mode, Font Size, Theme, Native Fullscreen, Modes) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Reading Mode Switchers */}
            <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              {[
                { id: 'reading' as const, label: 'Leçon', icon: BookOpen },
                { id: 'resources' as const, label: 'Ressources', icon: FileText },
                { id: 'notes' as const, label: 'Notes', icon: FileEdit },
                { id: 'qa' as const, label: 'Tuteur IA', icon: MessageCircle },
                { id: 'quiz' as const, label: 'Examen', icon: Award },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMode(tab.id);
                    stopSpeech();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    mode === tab.id
                      ? 'bg-[#0866FF] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              ))}
              {isQuizSubmitted && quizScore >= 70 && (
                <button
                  onClick={() => setMode('certificate')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                    mode === 'certificate' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/40'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Certificat</span>
                </button>
              )}
            </div>

            {/* Reading Theme Toggle (Dark / Sepia / Light) */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                onClick={() => setReadingTheme('dark')}
                title="Mode Sombre"
                className={`p-1.5 rounded-lg text-xs transition ${readingTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingTheme('sepia')}
                title="Mode Papier Sépia"
                className={`p-1.5 rounded-lg text-xs transition ${readingTheme === 'sepia' ? 'bg-[#FCF9F0] text-[#2D2418] font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="text-[11px] font-serif font-bold">S</span>
              </button>
              <button
                onClick={() => setReadingTheme('light')}
                title="Mode Clair"
                className={`p-1.5 rounded-lg text-xs transition ${readingTheme === 'light' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Size Adjuster (A- / A+) */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs font-bold text-slate-300">
              <button
                onClick={() => {
                  if (fontSize === 'xl') setFontSize('lg');
                  else if (fontSize === 'lg') setFontSize('base');
                  else if (fontSize === 'base') setFontSize('sm');
                }}
                title="Diminuer la police"
                className="px-2 py-1 hover:text-white"
              >
                A-
              </button>
              <span className="px-1 text-slate-500 font-mono text-[10px]">{fontSize}</span>
              <button
                onClick={() => {
                  if (fontSize === 'sm') setFontSize('base');
                  else if (fontSize === 'base') setFontSize('lg');
                  else if (fontSize === 'lg') setFontSize('xl');
                }}
                title="Agrandir la police"
                className="px-2 py-1 hover:text-white"
              >
                A+
              </button>
            </div>

            {/* Zen / Focus Mode Toggle */}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              title={isZenMode ? "Quitter le mode concentration" : "Mode concentration zen"}
              className={`p-2 rounded-xl border transition ${
                isZenMode
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Native Fullscreen Toggle (F11) */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran matériel (F)"}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

          </div>

        </header>

        {/* MOBILE & TABLET MODE TABS BAR */}
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-2 py-1.5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setIsMobileChaptersOpen(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 shrink-0 border ${
              isMobileChaptersOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'text-amber-300 bg-slate-800/90 border-amber-500/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sommaire ({activeLessonIndex + 1}/{course.lessons.length})</span>
          </button>
          {[
            { id: 'reading' as const, label: 'Leçon', icon: BookOpen },
            { id: 'resources' as const, label: 'Ressources', icon: FileText },
            { id: 'notes' as const, label: 'Mes Notes', icon: FileEdit },
            { id: 'qa' as const, label: 'Questions', icon: MessageCircle },
            { id: 'quiz' as const, label: 'Examen', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id);
                setIsMobileChaptersOpen(false);
                stopSpeech();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                mode === tab.id ? 'bg-[#0866FF] text-white' : 'text-slate-400 bg-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN WORKSPACE: 3-COLUMN RESPONSIVE LAYOUT                             */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* LEFT SIDEBAR: CHAPTERS & PEDAGOGICAL OUTLINE */}
          {!isZenMode && (
            <>
              {isMobileChaptersOpen && (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
                  onClick={() => setIsMobileChaptersOpen(false)}
                />
              )}
              <aside
                className={`${
                  isMobileChaptersOpen
                    ? 'fixed inset-y-0 left-0 z-40 flex w-80 max-w-[85vw] shadow-2xl'
                    : 'hidden lg:flex'
                } ${
                  isSidebarCollapsed ? 'lg:w-16' : 'lg:w-72 xl:w-80'
                } ${themeStyles.sidebarBg} border-r flex-col shrink-0 overflow-hidden transition-all duration-200`}
              >
                {/* Sidebar Collapse Toggle */}
                <div className="p-2 border-b border-slate-800/60 flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 ${isSidebarCollapsed ? 'lg:hidden' : 'block'}`}>
                    Programme du module
                  </span>
                  <button
                    onClick={() => {
                      if (window.innerWidth < 1024) setIsMobileChaptersOpen(false);
                      else setIsSidebarCollapsed(!isSidebarCollapsed);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white lg:mx-auto"
                    title={isSidebarCollapsed ? "Développer le sommaire" : "Réduire"}
                  >
                    <ChevronLeft className={`w-4 h-4 transition ${isSidebarCollapsed ? 'lg:rotate-180' : ''}`} />
                  </button>
                </div>

              {/* Course Meta Info Widget */}
              {!isSidebarCollapsed && (
                <div className="p-3 border-b border-slate-800/60 bg-slate-900/40 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px]">Durée totale</span>
                      <span className="font-bold">{course.duration}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px]">Niveau</span>
                      <span className="font-bold">{course.level}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] flex items-center justify-between">
                    <span className="text-blue-300 font-mono font-bold">{course.legalRef}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Homologué DFAT</span>
                  </div>
                </div>
              )}

              {/* Chapters List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {safeLessons.map((lesson, idx) => {
                  const isActive = idx === activeLessonIndex;
                  const isDone = completedLessons.has(idx);
                  const lessonArts = Array.isArray(lesson.keyArticles) ? lesson.keyArticles : [];

                  return (
                    <button
                      key={lesson.id || idx}
                      onClick={() => {
                        setActiveLessonIndex(idx);
                        setMode('reading');
                        setIsMobileChaptersOpen(false);
                        stopSpeech();
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl transition flex items-start space-x-3 ${
                        isActive
                          ? 'bg-[#0866FF] text-white shadow-md'
                          : isDone
                          ? 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-300'
                          : 'hover:bg-slate-800/50 text-slate-400'
                      } ${isSidebarCollapsed ? 'justify-center p-2' : ''}`}
                    >
                      {/* Chapter Indicator / Completion Checkmark */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-white text-[#0866FF]'
                            : isDone
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                        title={(lesson as any).format || 'animation'}
                      >
                        {isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : (()=>{
                          const f=(lesson as any).format || 'animation';
                          if(f==='video') return '🎬';
                          if(f==='audio') return '🎙️';
                          if(f==='animation') return '✨';
                          if(f==='ia_ppt') return '🤖';
                          if(f==='pdf') return '📄';
                          if(f==='visioconference') return '📹';
                          return idx + 1;
                        })()}
                      </div>

                      {!isSidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : ''}`}>
                            {lesson.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1 text-[10px] opacity-75">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration}
                            </span>
                            {lessonArts.length > 0 && (
                              <span>• {lessonArts[0]}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Final Exam Trigger */}
              <div className="p-3 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    setMode('quiz');
                    setIsMobileChaptersOpen(false);
                    stopSpeech();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  {!isSidebarCollapsed && <span>Examen Certifiant Final</span>}
                </button>
              </div>

            </aside>
            </>
          )}

          {/* ======================================================================= */}
          {/* CENTER CANVAS: READING & LESSON BODY (AGRANDI, RESPONSIVE, PLEIN ÉCRAN) */}
          {/* ======================================================================= */}
          <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 lg:p-6 xl:p-8 flex flex-col items-center">
            
            {/* TAB 1: READING VIEW */}
            {mode === 'reading' && (
              <div className={`w-full ${isZenMode ? 'max-w-7xl 2xl:max-w-[1600px]' : 'max-w-6xl xl:max-w-7xl 2xl:max-w-[1460px]'} mx-auto space-y-6 pb-20`}>
                
                {/* MEDIA BAR — 7 formats : Vidéo / Audio / Animation / IA PPT / PDF / Visio / Texte */}
                {(() => {
                  const fmt = (currentLesson as any).format || 'animation';
                  const mediaUrl = (currentLesson as any).mediaUrl;
                  const aiPrompt = (currentLesson as any).aiPrompt;
                  const templateId = (currentLesson as any).templateId;
                  const visioLink = (currentLesson as any).visioLink;
                  const visioDate = (currentLesson as any).visioDate;
                  const visioPlatform = (currentLesson as any).visioPlatform;
                  // Vidéo
                  if (fmt === 'video') {
                    return (
                      <div className="rounded-3xl overflow-hidden border border-slate-800 bg-black shadow-2xl relative">
                        {isVideoMode ? (
                          <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                            <video src={mediaUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"} controls autoPlay playsInline className="w-full h-full object-contain" />
                            <button onClick={() => setIsVideoMode(false)} className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 z-10"><BookOpen className="w-3.5 h-3.5" /><span>Mode Lecture</span></button>
                          </div>
                        ) : (
                          <div onClick={() => setIsVideoMode(true)} className="relative aspect-video sm:aspect-21/9 w-full bg-slate-950 flex items-center justify-center cursor-pointer group">
                            <img src={course.coverImage} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                            <div className="relative flex flex-col items-center space-y-2">
                              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition"><Play className="w-7 h-7 fill-white ml-1" /></div>
                              <span className="text-xs font-black uppercase tracking-wider text-white bg-black/60 px-3 py-1 rounded-full">🎬 Lancer la Vidéo ({currentLesson.duration})</span>
                            </div>
                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                              <span className="px-2.5 py-1 rounded-lg bg-black/70 font-mono text-[11px] font-bold">Chapitre {activeLessonIndex + 1} • {currentLesson.title}</span>
                              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]">Vidéo HD</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // Audio
                  if (fmt === 'audio') {
                    return (
                      <div className="rounded-3xl border border-purple-800/50 bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0"><Headphones className="w-7 h-7" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">🎙️ Leçon Audio • {currentLesson.duration}</div>
                            <div className="text-sm font-bold text-white truncate">{currentLesson.title}</div>
                          </div>
                          <button onClick={toggleSpeech} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${isSpeaking ? 'bg-amber-500 text-slate-950' : 'bg-purple-600 text-white'}`}>{isSpeaking ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Écouter</>}</button>
                        </div>
                        <div className="mt-4">
                          {mediaUrl ? <audio controls src={mediaUrl} className="w-full" /> : <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300">Aucun fichier audio uploadé — synthèse vocale disponible via le bouton Écouter</div>}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400"><div className="flex gap-0.5">{[1,2,3,4,5,6,7,8,9,10,11,12].map(i=> <div key={i} className={`w-1 rounded-full ${i%3===0 ? 'h-6 bg-purple-400' : 'h-3 bg-slate-600'}`} />)}</div><span>Podcast • Lecture à 1x</span></div>
                      </div>
                    );
                  }
                  // Animation Animaker (Vidéo Animée Interactive)
                  if (fmt === 'animation') {
                    return (
                      <AnimatedLessonPlayer
                        course={course}
                        lesson={currentLesson}
                        lessonIndex={activeLessonIndex}
                        isSpeaking={isSpeaking}
                        onToggleSpeech={toggleSpeech}
                        playbackState={playbackState}
                        isPreloading={isPreloading}
                        currentProfile={currentProfile}
                      />
                    );
                  }
                  // IA PPT
                  if (fmt === 'ia_ppt') {
                    return (
                      <div className="rounded-3xl border border-indigo-800/50 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                          <div><div className="text-xs font-bold text-indigo-300 uppercase">🤖 IA • Présentation PPT</div><div className="text-sm font-bold text-white">Slides générées à partir du prompt</div></div>
                          <span className="ml-auto px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-mono">8 slides</span>
                        </div>
                        {aiPrompt && <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 mb-3"><span className="font-bold text-indigo-300">Prompt :</span> {aiPrompt.slice(0,180)}{aiPrompt.length>180?'...':''}</div>}
                        {mediaUrl ? (
                          <div className="rounded-xl overflow-hidden border border-slate-700 bg-white p-2"><a href={mediaUrl} target="_blank" className="flex items-center gap-2 text-sm font-bold text-indigo-600"><FileText className="w-4 h-4" /> Ouvrir le PPT / PDF généré</a><iframe src={mediaUrl} className="w-full h-64 mt-2 rounded-lg border" title="ppt" /></div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {[1,2,3,4,5,6,7,8].map(n=> <div key={n} className="aspect-[4/3] rounded-xl bg-white border border-slate-200 p-2 flex flex-col"><div className="text-[10px] font-mono text-indigo-600">Slide {n}</div><div className="text-[11px] font-bold text-slate-900 line-clamp-3 mt-1">{n===1 ? currentLesson.title : n===2 ? 'Objectifs pédagogiques' : n===8 ? 'Quiz final' : `Point clé ${n-1} — Loi 10/010`}</div><div className="mt-auto h-1 rounded-full bg-indigo-100"><div className="h-1 rounded-full bg-indigo-600" style={{width: `${60+n*5}%`}} /></div></div>)}
                          </div>
                        )}
                      </div>
                    );
                  }
                  // PDF
                  if (fmt === 'pdf') {
                    return (
                      <div className="rounded-3xl border border-red-800/50 bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                          <div><div className="text-xs font-bold text-red-300 uppercase">📄 Document PDF</div><div className="text-sm font-bold text-white truncate max-w-md">{mediaUrl ? mediaUrl.split('/').pop()?.slice(0,40) : currentLesson.title + '.pdf'}</div></div>
                          {mediaUrl && <a href={mediaUrl} target="_blank" className="ml-auto px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Télécharger</a>}
                        </div>
                        {mediaUrl ? <iframe src={mediaUrl} className="w-full h-80 rounded-xl bg-white border" title="pdf" /> : <div className="p-8 rounded-xl bg-white text-center text-sm text-slate-500">Aucun PDF uploadé — le formateur ajoutera le support (DAO Type, guide, fiche).</div>}
                      </div>
                    );
                  }
                  // Visioconférence
                  if (fmt === 'visioconference') {
                    return (
                      <div className="rounded-3xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center"><Video className="w-6 h-6" /></div>
                          <div><div className="text-xs font-bold text-emerald-300 uppercase">📹 Visioconférence • {visioPlatform || 'Zoom'}</div><div className="text-sm font-bold text-white">{currentLesson.title}</div><div className="text-xs text-slate-400">{visioDate ? new Date(visioDate).toLocaleString('fr-FR') : currentLesson.duration} • En direct</div></div>
                        </div>
                        <div className="aspect-video rounded-2xl bg-black flex flex-col items-center justify-center p-6 text-center border border-white/10">
                          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-3"><Video className="w-8 h-8" /></div>
                          <div className="text-white font-bold">Cours en direct prévu</div>
                          <div className="text-xs text-slate-400 max-w-md mt-1">Rejoignez la salle virtuelle à l'heure indiquée. Le formateur partagera son écran et répondra à vos questions.</div>
                          {visioLink ? <a href={visioLink} target="_blank" className="mt-4 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2">Rejoindre la visio →</a> : <div className="mt-4 px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 font-bold text-sm">Lien à venir</div>}
                        </div>
                      </div>
                    );
                  }
                  // Texte / Autre — pas de barre média, juste header
                  return null;
                })()}

                {/* AUDIO NARRATOR & LESSON HEADER CARD */}
                <div className={`p-5 sm:p-7 rounded-3xl border ${themeStyles.cardBg} space-y-5 transition-colors`}>
                  
                  {/* Lesson Meta Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-800/40">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0866FF]">
                        Chapitre {activeLessonIndex + 1} sur {course.lessons.length} • {progress}% complété
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {currentLesson.title}
                      </h2>
                    </div>

                    {/* Audio Synthesizer Narration Button */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleSpeech}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                          isSpeaking
                            ? 'bg-amber-500 text-slate-950 shadow-lg animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <Pause className="w-4 h-4 fill-current" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Headphones className="w-4 h-4" />
                            <span>Écouter la leçon</span>
                          </>
                        )}
                      </button>

                      {/* Bouton Toggle Lecture Automatique du cours */}
                      <button
                        onClick={toggleAutoReadLessons}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                          autoReadLessons
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Activer ou désactiver la lecture automatique vocale à chaque chapitre"
                      >
                        {autoReadLessons ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                            <span>Lecture auto : ON</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                            <span>Lecture auto : OFF</span>
                          </>
                        )}
                      </button>

                      {isSpeaking ? (
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 shadow-md">
                          <AishaAvatar isSpeaking={isSpeaking} size={40} showWave={false} />
                          <div className="flex items-center gap-1">
                            <span className="w-1 rounded-full bg-cyan-400" style={{ height: `${6 + (playbackState.mouthOpenness || 0) * 16}px`, transition: 'height 60ms linear' }} />
                            <span className="w-1 rounded-full bg-cyan-400" style={{ height: `${8 + (playbackState.mouthOpenness || 0) * 12}px`, transition: 'height 60ms linear' }} />
                            <span className="w-1 rounded-full bg-cyan-400" style={{ height: `${5 + (playbackState.mouthOpenness || 0) * 14}px`, transition: 'height 60ms linear' }} />
                          </div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-[11px] text-cyan-300 font-bold">
                              Aïsha explique ({currentProfile?.roleTitle || 'Praticien'})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Écran {playbackState.currentSentence || 1}/{playbackState.totalSentences || 5}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
                          <AishaAvatar isSpeaking={false} size={32} />
                          <span className="text-[11px] text-slate-400 font-medium">Aïsha prête à lire</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Reading Typography (Formatted cleanly without raw pipe separators or scene tags) */}
                  <div className={`${fontClasses} ${themeStyles.text} whitespace-pre-line leading-relaxed font-normal`}>
                    {(() => {
                      let occIdx = 0;
                      return (currentLesson.content || '')
                        .replace(/\[Scène\s*:\s*[a-z0-9_]+\]\s*/gi, '')
                        .replace(/\s*\|\s*Application\s+terrain\s*:\s*/gi, () => {
                          const v =
                            PEDAGOGICAL_TRANSITION_VARIATIONS[
                              (activeLessonIndex * 5 + occIdx++) %
                                PEDAGOGICAL_TRANSITION_VARIATIONS.length
                            ];
                          return `\n   ↳ ${v.spokenLeadIn} `;
                        });
                    })()}
                  </div>

                  {/* Contextualized Professor's Visual Synthesis Board (Varies Structure & SVG Objects by Lesson Topic!) */}
                  {/* Single-Card-Per-Screen Interactive Deck ("Chaque carte doit avoir son écran") */}
                  {(() => {
                    const { sceneData, sentences } = buildSynchronizedLessonScreens(
                      currentLesson.title || course.title || '',
                      currentLesson.content || course.description || '',
                      course.code || '',
                      course.legalRef || 'Loi n° 10/010',
                      activeLessonIndex,
                      null,
                      currentProfile
                    );

                    const borderColors = [
                      'border-blue-500/50 bg-slate-900/90',
                      'border-emerald-500/50 bg-slate-900/90',
                      'border-amber-500/50 bg-slate-900/90',
                      'border-purple-500/50 bg-slate-900/90',
                      'border-rose-500/50 bg-slate-900/90'
                    ];

                    const screenCards = sceneData.screens.map((scr, idx) => ({
                      num: scr.screenNumber,
                      badge: `ÉCRAN ${scr.screenNumber} / 5 • ${scr.categoryTag}`,
                      title: scr.title,
                      text: scr.explanation,
                      rule: scr.fieldRule,
                      leadInTitle: scr.fieldBoxTitle,
                      explanationStartRatio: scr.explanationStartRatio,
                      fieldRuleStartRatio: scr.fieldRuleStartRatio,
                      color: borderColors[idx] || borderColors[0]
                    }));

                    const effectiveIdx =
                      isSpeaking && (playbackState.currentSentence || 0) > 0
                        ? Math.max(0, Math.min(4, (playbackState.currentSentence || 1) - 1))
                        : Math.max(0, Math.min(4, activeCardScreenIdx));

                    const activeCard = screenCards[effectiveIdx] || screenCards[0];
                    const wpRatio = isSpeaking ? (playbackState.wordProgressPct || 0) / 100 : 0;
                    const readingZone = !isSpeaking
                      ? 0
                      : wpRatio < activeCard.fieldRuleStartRatio
                      ? 2
                      : 3;

                    const playScreenIdx = (idx: number) => {
                      setActiveCardScreenIdx(idx);
                      speechService.unlockAudio();
                      speechService.play(
                        sentences.join(' '),
                        `lesson-${course.id}-${activeLessonIndex}`,
                        {
                          speed: speechRate,
                          voice: speechService.getVoicePersona(),
                          startSentenceIndex: idx,
                          customSentences: sentences
                        }
                      );
                    };

                    return (
                      <div className="pt-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{sceneData.sceneBadge} • Explication Directe</span>
                          </span>

                          {/* Screen Tabs 1..5 */}
                          <div className="flex items-center gap-1">
                            {screenCards.map((sc, idx) => (
                              <button
                                key={sc.num}
                                type="button"
                                onClick={() => setActiveCardScreenIdx(idx)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                  effectiveIdx === idx
                                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Écran {sc.num}/5
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Single Dedicated Screen for the Active Card Only */}
                        <div className={`p-5 rounded-2xl border-2 ${activeCard.color} shadow-xl space-y-4 transition-all`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div>
                              <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                {activeCard.badge}
                              </div>
                              <h5 className="text-base sm:text-lg font-black text-white mt-0.5">
                                {activeCard.title}
                              </h5>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => playScreenIdx(effectiveIdx)}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Écouter l’explication</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsVideoMode(true)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                              >
                                <Film className="w-3.5 h-3.5" />
                                <span>Voir l’animation</span>
                              </button>
                            </div>
                          </div>

                          <div
                            className={`p-3.5 rounded-xl transition-all ${
                              readingZone === 2
                                ? 'bg-blue-950/60 border-2 border-blue-400 shadow-md'
                                : 'bg-slate-950/50 border border-slate-800'
                            }`}
                          >
                            <p className="text-sm text-slate-100 leading-relaxed font-medium">
                              {activeCard.text}
                            </p>
                          </div>

                          <div
                            className={`p-3.5 rounded-xl flex items-start gap-2.5 transition-all ${
                              readingZone === 3
                                ? 'bg-amber-500/25 border-2 border-amber-400 shadow-md'
                                : 'bg-amber-500/10 border border-amber-500/30'
                            }`}
                          >
                            <span className="text-amber-400 text-xs sm:text-sm font-black shrink-0">
                              {activeCard.leadInTitle} :
                            </span>
                            <span className="text-xs text-amber-200 font-bold leading-relaxed">
                              {activeCard.rule}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setActiveCardScreenIdx((i) => Math.max(0, i - 1))}
                              disabled={effectiveIdx <= 0}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Carte précédente</span>
                            </button>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              Carte {effectiveIdx + 1} sur 5
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveCardScreenIdx((i) => Math.min(4, i + 1))}
                              disabled={effectiveIdx >= 4}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center gap-1"
                            >
                              <span>Carte suivante</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Legal Foundations & Loi 10/010 Callout */}
                  {currentKeyArticles.length > 0 && (
                    <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.highlightBg} space-y-2 mt-6`}>
                      <div className="flex items-center space-x-2 text-xs font-bold text-[#0866FF]">
                        <Scale className="w-4 h-4 text-[#0866FF]" />
                        <span>Fondements Légaux & Textes Réglementaires de Référence :</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {currentKeyArticles.map((art, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold flex items-center space-x-1.5"
                          >
                            <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                            <span>{art}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1 leading-normal">
                        Conformément au Code des marchés publics de la RDC et aux arrêtés d'application homologués par l'ARMP.
                      </p>
                    </div>
                  )}

                  {/* Bottom Navigation & Progression Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/40 gap-3">
                    <button
                      disabled={activeLessonIndex === 0}
                      onClick={handlePrevLesson}
                      className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center space-x-2 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Chapitre précédent</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMarkAsCompleted(activeLessonIndex)}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 ${
                          completedLessons.has(activeLessonIndex)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Assimilé</span>
                      </button>

                      <button
                        onClick={handleNextLesson}
                        className="px-5 py-2.5 rounded-2xl bg-[#0866FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                      >
                        <span>
                          {activeLessonIndex < safeLessons.length - 1
                            ? 'Chapitre suivant'
                            : 'Passer à l’examen final'}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* STUDENT PERSONAL NOTE TAKER DRAWER */}
                <div className={`p-5 rounded-3xl border ${themeStyles.cardBg} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                      <FileEdit className="w-4 h-4 text-amber-400" />
                      <span>Bloc-Notes de l'apprenant (Chapitre {activeLessonIndex + 1})</span>
                    </h3>
                    {notesSavedToast && (
                      <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
                        ✓ Enregistré !
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Saisissez vos remarques, points de vigilance ou questions pour le formateur..."
                    rows={3}
                    className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                    >
                      Enregistrer mes notes
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: RESOURCES & DOWNLOADS */}
            {mode === 'resources' && (
              <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-20">
                <div className={`p-6 rounded-3xl border ${themeStyles.cardBg} space-y-5`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-[#0866FF]" />
                        <span>Ressources & Documentation Officielle ARMP</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Supports de cours, modèles types de DAO, décrets et fiches pratiques
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                        placeholder="Rechercher un document..."
                        className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 outline-none w-full sm:w-56"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {resources.map(r => (
                      <div
                        key={r.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center space-x-3.5 group"
                      >
                        <div className={`w-10 h-10 rounded-xl ${r.bg} ${r.color} flex items-center justify-center shrink-0`}>
                          <r.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition">
                            {r.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {r.type} • {r.size}
                          </span>
                        </div>
                        <button
                          onClick={() => alert(`Téléchargement de « ${r.title} » en cours...`)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title={r.action}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: NOTES VIEW */}
            {mode === 'notes' && (
              <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-20">
                <div className={`p-6 rounded-3xl border ${themeStyles.cardBg} space-y-4`}>
                  <div className="flex items-center justify-between border-b pb-4 border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center space-x-2">
                        <FileEdit className="w-5 h-5 text-amber-400" />
                        <span>Cahier de notes de l'apprenant</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Notes enregistrées pour {course.title} (Chapitre {activeLessonIndex + 1})
                      </p>
                    </div>
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                    >
                      Enregistrer
                    </button>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Consignez ici vos synthèses, questions pour le contrôle a priori, ou éléments clés pour vos marchés..."
                    rows={12}
                    className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Q&A & AI TUTOR */}
            {mode === 'qa' && (
              <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-20">
                <div className={`p-6 rounded-3xl border ${themeStyles.cardBg} space-y-5`}>
                  {/* Studio Aïsha — Bandeau Tuteur Virtuel du Chapitre */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 border border-blue-800/40 flex flex-col sm:flex-row items-center gap-4 text-white shadow-xl">
                    <AishaAvatar
                      isSpeaking={Boolean(playbackState.isPlaying && playbackState.currentId?.startsWith('qa-voice-'))}
                      isLoading={isAskingTutorQA}
                      size="lg"
                      className="shrink-0"
                    />
                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-base sm:text-lg font-black tracking-tight">
                          Prof. Aïsha • Questions / Réponses sur le Chapitre {activeLessonIndex + 1}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                          {course.code} • {course.legalRef}
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/90 leading-relaxed">
                        Posez votre question ci-dessous : Aïsha vous répond immédiatement par écrit et de vive voix en s'appuyant sur « <b>{currentLesson.title}</b> ».
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        {[
                          `Explique-moi l'essentiel du chapitre « ${currentLesson.title.slice(0, 42)} »`,
                          `Quel est le piège juridique à éviter dans ce chapitre (${currentKeyArticles[0] || course.legalRef}) ?`,
                          `Donne-moi un cas pratique sur ce chapitre`
                        ].map((qPreset, idx) => (
                          <button
                            key={idx}
                            onClick={() => askQuestion(qPreset)}
                            disabled={isAskingTutorQA}
                            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-cyan-200 transition"
                          >
                            {qPreset} →
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => onAskTutor?.(`J'étudie le chapitre "${currentLesson.title}" (${course.code}). Peux-tu m'interroger dessus ?`)}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Studio Q/R Complet</span>
                      </button>
                      {playbackState.isPlaying && playbackState.currentId?.startsWith('qa-voice-') && (
                        <button
                          onClick={() => {
                            speechService.stop();
                            setActiveSpeakingQaId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Pause className="w-3.5 h-3.5" /> Stop Voix
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-[#0866FF]" />
                        <span>Historique des Questions / Réponses du Module</span>
                      </h4>
                    </div>

                    <div className="flex bg-slate-900 rounded-xl p-1 text-xs">
                      <button
                        onClick={() => setQaFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold ${qaFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        Toutes ({qaItems.length})
                      </button>
                      <button
                        onClick={() => setQaFilter('mine')}
                        className={`px-3 py-1 rounded-lg font-bold ${qaFilter === 'mine' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        Mes questions
                      </button>
                    </div>
                  </div>

                  {/* Ask Question Input */}
                  <div className="flex gap-2">
                    <input
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
                      disabled={isAskingTutorQA}
                      placeholder="Posez une question juridique à Aïsha sur ce chapitre..."
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => askQuestion()}
                      disabled={!questionInput.trim() || isAskingTutorQA}
                      className="px-5 py-3 rounded-2xl bg-[#0866FF] hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-xs transition flex items-center space-x-1.5"
                    >
                      {isAskingTutorQA ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Aïsha répond…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Demander à Aïsha</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Q&A Items List */}
                  <div className="space-y-3 pt-2">
                    {(qaFilter === 'mine' ? qaItems.filter(q => q.author === currentProfile.name) : qaItems).map(q => {
                      const isPlayingThisQa =
                        playbackState.isPlaying && playbackState.currentId === `qa-voice-${q.id}`;
                      return (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              {q.author}
                            </span>
                            <span className="text-slate-500">{q.time}</span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-amber-300">
                            « {q.question} »
                          </p>
                          {q.answer && (
                            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-xs sm:text-sm text-blue-100 space-y-2 leading-relaxed">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-cyan-300 flex items-center gap-1.5 text-xs">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Réponse de Prof. Aïsha :
                                </span>
                                <div className="flex items-center gap-2">
                                  {isPlayingThisQa ? (
                                    <button
                                      onClick={() => {
                                        speechService.stop();
                                        setActiveSpeakingQaId(null);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1"
                                    >
                                      <Pause className="w-3 h-3" /> Pause
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => speakQaAnswer(q.answer!, q.id)}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                                    >
                                      <Volume2 className="w-3 h-3" /> Écouter Aïsha
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="whitespace-pre-line text-xs leading-relaxed">
                                {q.answer.replace(/\*\*/g, '')}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: CERTIFYING EXAM (QUIZ) */}
            {mode === 'quiz' && (
              <div className="w-full max-w-5xl xl:max-w-6xl mx-auto space-y-6 pb-20">
                <div className={`p-6 sm:p-8 rounded-3xl border ${themeStyles.cardBg} space-y-6`}>
                  
                  {/* Quiz Header */}
                  <div className="text-center border-b border-slate-800 pb-5 space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                      <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-white">
                      Évaluation Finale & Examen Certifiant
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Validez vos compétences sur {course.title}. Seuil d'accréditation officiel ARMP : <b className="text-amber-400">70%</b>
                    </p>
                  </div>

                  {/* Quiz Questions */}
                  <div className="space-y-5">
                    {safeQuiz.map((q, qIdx) => {
                      const picked = selectedAnswers[qIdx];
                      return (
                        <div key={qIdx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-start space-x-3">
                            <span className="w-6 h-6 rounded-full bg-[#0866FF] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {q.question}
                            </h4>
                          </div>

                          <div className="space-y-2 pl-0 sm:pl-9">
                            {(Array.isArray(q.options) ? q.options : []).map((opt, optIdx) => {
                              const isPicked = picked === optIdx;
                              let btnClass = "border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300";
                              if (isQuizSubmitted) {
                                if (optIdx === q.correctIndex) {
                                  btnClass = "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold";
                                } else if (isPicked) {
                                  btnClass = "border-rose-500 bg-rose-950/60 text-rose-200";
                                }
                              } else if (isPicked) {
                                btnClass = "border-[#0866FF] bg-blue-950/60 text-white font-bold ring-2 ring-blue-500/30";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                                  disabled={isQuizSubmitted}
                                  className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm border transition ${btnClass}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {isQuizSubmitted && (
                            <div className={`p-3 rounded-xl text-xs ${picked === q.correctIndex ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800' : 'bg-amber-950/40 text-amber-300 border border-amber-800'} ml-0 sm:ml-9`}>
                              <b>{picked === q.correctIndex ? '✓ Réponse exacte' : '✗ Réponse incorrecte'}</b> — {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission and Result */}
                  {!isQuizSubmitted ? (
                    <button
                      onClick={submitQuiz}
                      disabled={Object.keys(selectedAnswers).length < safeQuiz.length}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 text-slate-950 font-black text-sm shadow-xl transition"
                    >
                      Soumettre l'examen et calculer le score
                    </button>
                  ) : (
                    <div className={`p-6 rounded-3xl text-center space-y-4 border ${quizScore >= 70 ? 'bg-emerald-950/40 border-emerald-800' : 'bg-rose-950/40 border-rose-800'}`}>
                      <div className="text-2xl font-black text-white">
                        {quizScore >= 70 ? 'Félicitations, vous êtes certifié !' : 'Score insuffisant pour la délivrance du certificat'}
                      </div>
                      <div className="font-mono font-black text-4xl text-amber-400">
                        {quizScore}%
                      </div>
                      <div className="flex justify-center gap-3">
                        {quizScore < 70 ? (
                          <button
                            onClick={() => {
                              setIsQuizSubmitted(false);
                              setSelectedAnswers({});
                              setMode('reading');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Réviser les leçons & Réessayer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setMode('certificate')}
                            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center space-x-2 shadow-xl"
                          >
                            <Award className="w-5 h-5" />
                            <span>Générer mon Diplôme Officiel ARMP</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB 6: OFFICIAL PRINTABLE CERTIFICATE */}
            {mode === 'certificate' && (
              <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
                <div className="bg-white rounded-3xl p-8 sm:p-10 border-8 border-double border-amber-600 text-slate-900 text-center space-y-5 shadow-2xl relative">
                  
                  <div className="border-b-2 border-slate-200 pb-4 space-y-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                      RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </span>
                    <div className="flex justify-center my-2">
                      <ArmpLogo size="lg" isDarkMode={false} />
                    </div>
                    <h1 className="font-serif font-black text-2xl uppercase tracking-tight text-slate-950">
                      Certificat d'Aptitude & de Réussite
                    </h1>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      Loi n° 10/010 du 27 avril 2010 • Marchés Publics
                    </span>
                  </div>

                  <div className="py-4 space-y-2">
                    <p className="text-xs text-slate-500">Il est certifié que :</p>
                    <h2 className="text-2xl font-black text-blue-900 tracking-tight">
                      {currentProfile.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium">
                      {currentProfile.roleTitle} • {currentProfile.institution}
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto pt-3">
                      A validé avec succès l'ensemble du cursus de formation portant sur le module :
                    </p>
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 max-w-lg mx-auto">
                      <span className="text-xs font-mono font-bold text-amber-800">{course.code}</span>
                      <h3 className="text-sm font-black text-slate-900">{course.title}</h3>
                      <span className="text-xs font-bold text-emerald-700">Score officiel : {quizScore}%</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center space-x-2 text-left">
                      <div className="p-1.5 rounded-lg border border-slate-200 bg-white shadow-xs shrink-0">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold">Réf: CERT-ARMP-2026-{course.code}</div>
                        <div className="text-[10px] text-slate-400">Kinshasa, le {new Date().toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="font-bold text-slate-900 block text-xs">La Direction de la Formation (DFAT)</span>
                      <span className="text-[10px] text-emerald-700 font-bold">✓ Homologation ARMP Validée</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 pt-4 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer le certificat</span>
                    </button>
                    <button
                      onClick={() => alert(`Téléchargement du certificat CERT-ARMP-2026-${course.code}.pdf`)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger PDF</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

          </main>

        </div>

      </div>
    </>
  );
};
