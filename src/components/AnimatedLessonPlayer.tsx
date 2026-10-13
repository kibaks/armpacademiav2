import { CartoonLessonStage } from './CartoonLessonStage';
import './CartoonLesson.css';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
  Sparkles,
  GraduationCap,
  Eye,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Video,
  Award,
  RefreshCw,
  Music,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { CourseModule, UserProfile } from '../types';
import {
  speechService,
  SpeechPlaybackState,
  VoicePersona,
  LipViseme,
  analyzeFrenchPhonemeAt
} from '../utils/speechService';
import { ambientMusicService } from '../utils/ambientMusicService';
import {
  ContextualSceneType,
  buildSynchronizedLessonScreens,
  formatProtocolPrecedenceIdentity
} from './ProfessorFilmScenes';
import { getPersonalizedLessonAdaptation } from '../utils/profileCoursePersonalization';

export type AnimationTemplateId = 'whiteboard' | 'character' | 'infographic' | 'casestudy';

interface AnimatedLessonPlayerProps {
  course: CourseModule;
  lesson?: any;
  lessonIndex: number;
  onTemplateChange?: (template: AnimationTemplateId) => void;
  autoPlayVoice?: boolean;
  isSpeaking?: boolean;
  onToggleSpeech?: () => void;
  playbackState?: SpeechPlaybackState;
  isPreloading?: boolean;
  currentProfile?: UserProfile;
  compactPreview?: boolean;
  requestedScreenIndex?: { idx: number; ts: number } | null;
  onActiveScreenChange?: (screenIdx: number) => void;
  // Navigation & Validation Test Props
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
  isLessonValidated?: boolean;
  requiresValidationTest?: boolean;
  onOpenValidationTest?: () => void;
}

export const ANIMATION_TEMPLATE_META: {
  id: AnimationTemplateId;
  name: string;
  badge: string;
  desc: string;
  sceneOverride: ContextualSceneType;
}[] = [
  {
    id: 'whiteboard',
    name: 'Thème 1 • Principes & Balance',
    badge: 'Synchronisé',
    desc: 'Balance de la Justice, Code Loi 10/010 & Seuils',
    sceneOverride: 'justice_principles'
  },
  {
    id: 'character',
    name: 'Thème 2 • Institutions (CGPMP/DGCMP/ARMP)',
    badge: 'Synchronisé',
    desc: 'Édifice CGPMP, Bouclier DGCMP & Tour ARMP',
    sceneOverride: 'institutions_separation'
  },
  {
    id: 'infographic',
    name: 'Thème 3 • Travaux, Fournitures & Seuils',
    badge: 'Synchronisé',
    desc: 'Grue de Chantier, Flotte Logistique & Jauge',
    sceneOverride: 'works_thresholds'
  },
  {
    id: 'casestudy',
    name: 'Thème 4 • Plis Scellés, ANO & Recours',
    badge: 'Synchronisé',
    desc: 'Urne Scellée, Tampon ANO, Tribunal CRD & SIGMAP',
    sceneOverride: 'sealed_bids_ano'
  }
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

interface LessonAct {
  index: number;
  startPct: number;
  endPct: number;
  zoneTitle: string;
  pedagogicalExpression: string;
  text: string;
}

export const AnimatedLessonPlayer: React.FC<AnimatedLessonPlayerProps> = ({
  course,
  lessonIndex,
  onTemplateChange,
  autoPlayVoice = true,
  isPreloading: isCoursePreloading = false,
  currentProfile,
  requestedScreenIndex,
  onActiveScreenChange,
  onNextLesson,
  onPrevLesson,
  hasNextLesson = false,
  hasPrevLesson = false,
  isLessonValidated = false,
  requiresValidationTest = false,
  onOpenValidationTest
}) => {
  const lesson = course.lessons?.[lessonIndex] || course.lessons?.[0];
  const safeTitle = lesson?.title || course.title || 'Module Marchés Publics RDC';
  const safeContent = lesson?.content || course.description || '';

  // Resolve connected user profile from prop or active session in localStorage
  const effectiveUserProfile = useMemo(() => {
    if (currentProfile?.name) return currentProfile;
    try {
      const raw = localStorage.getItem('armp_session_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name) return parsed as UserProfile;
      }
    } catch {}
    return undefined;
  }, [currentProfile]);

  const userPrecedence = useMemo(
    () => formatProtocolPrecedenceIdentity(effectiveUserProfile),
    [effectiveUserProfile]
  );

  const profileAdaptation = useMemo(() => {
    if (!effectiveUserProfile || !lesson) return null;
    return getPersonalizedLessonAdaptation(course, lesson, lessonIndex, effectiveUserProfile);
  }, [course, lesson, lessonIndex, effectiveUserProfile]);

  const [manualSceneOverride, setManualSceneOverride] = useState<ContextualSceneType | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(!autoPlayVoice);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [voicePersona, setVoicePersona] = useState<VoicePersona>(() => speechService.getVoicePersona());

  const [manualWinkUntil] = useState(0);

  // Overall 0..100 progress & per-screen 0..1 progress
  const [filmProgress, setFilmProgress] = useState<number>(0);
  const [tickCount, setTickCount] = useState<number>(0);
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState | null>(null);
  const playbackStateRef = useRef<SpeechPlaybackState | null>(null);
  const [showRawVideo, setShowRawVideo] = useState<boolean>(false);

  const smoothProgressRef = useRef<number>(0);
  const lastVoiceStartAtRef = useRef<number>(0);

  // Smoothly damped facial & gesture kinematics ref so Aïsha's movements are fluid and poised
  const smoothFaceRef = useRef({
    mouth: 0,
    smile: 0.72,
    browLeft: 0.15,
    browRight: 0.15,
    eyeSquint: 0.18,
    gazeX: 0,
    gazeY: 0,
    blinkLeft: 0,
    blinkRight: 0,
    headTilt: 0,
    headNod: 0,
    headTurn: 0
  });

  useEffect(() => {
    setManualSceneOverride(null);
  }, [course.id, lessonIndex]);

  // ===========================================================================
  // SHARED SYNCHRONIZED LESSON BUILDER:
  // Includes Protocol Precedence (Préséance) and cites the connected user's name!
  // ===========================================================================
  const calibratedLesson = useMemo(() => {
    const { sceneData, sentences } = buildSynchronizedLessonScreens(
      safeTitle,
      safeContent,
      course.code || '',
      course.legalRef || 'Loi n° 10/010',
      lessonIndex,
      manualSceneOverride,
      effectiveUserProfile
    );

    const postures = [
      'Écran 1/5 • Salutation de Préséance & Accueil',
      'Écran 2/5 • Gestuelle Ouverte & Analyse',
      'Écran 3/5 • Démonstration & Courtoisie',
      'Écran 4/5 • Vigilance Sereine & Repère',
      'Écran 5/5 • Hommages de Préséance & Synthèse'
    ];

    const acts: LessonAct[] = sceneData.screens.map((scr, idx) => ({
      index: idx,
      startPct: idx * 20,
      endPct: (idx + 1) * 20,
      zoneTitle: `Écran ${scr.screenNumber}/5 • ${scr.shortTabLabel}`,
      pedagogicalExpression: postures[idx] || postures[0],
      text: scr.spokenText
    }));

    return {
      acts,
      sentences,
      sceneData
    };
  }, [safeTitle, safeContent, course.code, course.legalRef, lessonIndex, manualSceneOverride, effectiveUserProfile]);

  // Prewarm all 5 synchronized sentences immediately when the lesson opens
  useEffect(() => {
    speechService.prewarmSentences(calibratedLesson.sentences, voicePersona);
  }, [calibratedLesson.sentences, voicePersona]);

  // Subscribe to speechService state with fine-grained 0.2% resolution so the hand draws in real time with the voice
  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      const prev = playbackStateRef.current;
      playbackStateRef.current = state;
      if (
        !prev ||
        prev.isPlaying !== state.isPlaying ||
        prev.isLoading !== state.isLoading ||
        prev.currentSentence !== state.currentSentence ||
        prev.currentId !== state.currentId ||
        Math.abs((prev.wordProgressPct || 0) - (state.wordProgressPct || 0)) >= 0.2
      ) {
        setPlaybackState(state);
      }
    });
    return unsub;
  }, []);

  const currentLessonAudioId = `lesson-${course.id}-${lessonIndex}`;
  const isThisLessonActiveInSpeech = Boolean(
    playbackState?.currentId &&
      (playbackState.currentId === currentLessonAudioId ||
        playbackState.currentId.startsWith(`anim-lesson-${course.id}-${lessonIndex}`))
  );
  const isSpeaking = isThisLessonActiveInSpeech && Boolean(playbackState?.isPlaying && !playbackState?.isLoading);
  const isPreloading = isThisLessonActiveInSpeech && Boolean(playbackState?.isLoading);
  const isVoiceDriving = isSpeaking || isPreloading;

  const startVoiceAtProgress = useCallback(
    (targetPct: number, speedOverride?: number, personaOverride?: VoicePersona) => {
      if (voiceMuted) return;
      const now = Date.now();
      if (now - lastVoiceStartAtRef.current < 80) return;
      lastVoiceStartAtRef.current = now;

      let actIdx = calibratedLesson.acts.findIndex(
        (a) => targetPct >= a.startPct && targetPct < a.endPct
      );
      if (actIdx === -1) actIdx = targetPct >= 99 ? 0 : calibratedLesson.acts.length - 1;

      const selectedPersona = personaOverride || voicePersona;
      speechService.setVoicePersona(selectedPersona);

      // Immediately snap visual progress to the start of the selected screen so there is zero visual lag
      const alignedPct = actIdx * 20;
      smoothProgressRef.current = alignedPct;
      setFilmProgress(alignedPct);

      speechService.play(calibratedLesson.sentences.join(' '), currentLessonAudioId, {
        speed: speedOverride ?? playbackSpeed,
        voice: selectedPersona,
        startSentenceIndex: actIdx,
        customSentences: calibratedLesson.sentences
      });
    },
    [voiceMuted, calibratedLesson, voicePersona, currentLessonAudioId, playbackSpeed]
  );

  // Auto-start when lesson or scene theme changes (after preloader finishes so Sentence 1 is already cached in Vivienne HD)
  useEffect(() => {
    if (isCoursePreloading) {
      smoothProgressRef.current = 0;
      setFilmProgress(0);
      return;
    }

    smoothProgressRef.current = 0;
    setFilmProgress(0);
    setIsPlaying(true);

    if (!voiceMuted && autoPlayVoice) {
      const timer = setTimeout(() => {
        startVoiceAtProgress(0);
      }, 60);
      return () => {
        clearTimeout(timer);
        speechService.stop();
      };
    } else {
      speechService.stop();
    }
    return () => {
      speechService.stop();
    };
  }, [course.id, lessonIndex, manualSceneOverride, isCoursePreloading]);

  // Ensure animation loop always runs if external speech starts
  useEffect(() => {
    if (isSpeaking && !isPlaying) {
      setIsPlaying(true);
    }
  }, [isSpeaking, isPlaying]);

  // Synchronize filmProgress tightly with voice sentence & wordProgressPct (38ms cadence for real-time hand-drawing lockstep)
  useEffect(() => {
    if (!isPlaying && !isSpeaking) return;

    const intervalMs = 38;
    const fallbackTotalDurationMs = (75 * 1000) / playbackSpeed;
    let subTick = 0;

    const commitProgressIfChanged = (targetPct: number) => {
      smoothProgressRef.current = targetPct;
      setFilmProgress((prev) => {
        const prevAct = Math.floor(prev / 20);
        const nextAct = Math.floor(targetPct / 20);
        if (prevAct !== nextAct || Math.abs(targetPct - prev) >= 0.06 || targetPct === 0 || targetPct >= 99.8) {
          return targetPct;
        }
        return prev;
      });
    };

    const timer = setInterval(() => {
      subTick = (subTick + 1) % 2;
      if (subTick === 0) {
        setTickCount((c) => c + 1);
      }
      const liveState = speechService.getState();
      playbackStateRef.current = liveState;
      const activeForThisLesson = Boolean(
        liveState?.currentId &&
          (liveState.currentId === currentLessonAudioId ||
            liveState.currentId.startsWith(`anim-lesson-${course.id}-${lessonIndex}`))
      );
      const speakingNow = activeForThisLesson && Boolean(liveState?.isPlaying && !liveState?.isLoading);
      const preloadingNow = activeForThisLesson && Boolean(liveState?.isLoading);
      const voiceDrivingNow = speakingNow || preloadingNow;

      // While neural audio is buffering for the current sentence, hold the screen at the start of that sentence!
      if (preloadingNow && liveState?.currentSentence) {
        const loadingIdx = Math.max(
          0,
          Math.min(calibratedLesson.acts.length - 1, liveState.currentSentence - 1)
        );
        const holdPct = loadingIdx * 20;
        commitProgressIfChanged(holdPct);
        return;
      }

      if (speakingNow && liveState && (liveState.totalSentences || 0) > 0) {
        const sIdx = Math.max(
          0,
          Math.min(calibratedLesson.acts.length - 1, (liveState.currentSentence || 1) - 1)
        );
        const act = calibratedLesson.acts[sIdx];
        const wordRatio = clamp01((liveState.wordProgressPct ?? liveState.wordProgress ?? 0) / 100);
        const targetVoicePct = act.startPct + wordRatio * (act.endPct - act.startPct);

        // Lock strictly inside [act.startPct, act.endPct - 0.02] so the screen NEVER switches before the voice finishes the sentence!
        const current = smoothProgressRef.current;
        let next: number;
        if (current < act.startPct || current > act.endPct) {
          next = targetVoicePct;
        } else {
          next = current + (targetVoicePct - current) * 0.85;
        }
        const clampedInAct = Math.max(act.startPct, Math.min(act.endPct - 0.02, next));
        commitProgressIfChanged(clampedInAct);

        if (sIdx === calibratedLesson.acts.length - 1 && wordRatio >= 0.98) {
          commitProgressIfChanged(100);
        }
      } else if (!voiceMuted && !voiceDrivingNow) {
        const graceElapsed = Date.now() - lastVoiceStartAtRef.current;
        if (graceElapsed < 3500) return;

        const step = (intervalMs / fallbackTotalDurationMs) * 100;
        const next = smoothProgressRef.current + step;
        if (next >= 100) {
          smoothProgressRef.current = 100;
          setFilmProgress(100);
          setIsPlaying(false);
        } else {
          smoothProgressRef.current = next;
          setFilmProgress(next);
        }
      } else if (voiceMuted) {
        const step = (intervalMs / fallbackTotalDurationMs) * 100;
        const next = smoothProgressRef.current + step;
        if (next >= 100) {
          smoothProgressRef.current = 100;
          setFilmProgress(100);
          setIsPlaying(false);
        } else {
          smoothProgressRef.current = next;
          setFilmProgress(next);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    isPlaying,
    isSpeaking,
    voiceMuted,
    playbackSpeed,
    currentLessonAudioId,
    course.id,
    lessonIndex,
    calibratedLesson.acts
  ]);

  const handleTogglePlay = () => {
    speechService.unlockAudio();
    if (isPlaying) {
      setIsPlaying(false);
      if (isVoiceDriving) speechService.pause();
    } else {
      const restartFromZero = filmProgress >= 99.5;
      const nextPct = restartFromZero ? 0 : filmProgress;
      if (restartFromZero) {
        smoothProgressRef.current = 0;
        setFilmProgress(0);
      }
      setIsPlaying(true);
      if (!voiceMuted) {
        if (playbackState?.isPaused && !restartFromZero && isThisLessonActiveInSpeech) {
          speechService.resume();
        } else {
          startVoiceAtProgress(nextPct);
        }
      }
    }
  };

  const handleRestart = () => {
    speechService.unlockAudio();
    speechService.stop();
    smoothProgressRef.current = 0;
    setFilmProgress(0);
    setIsPlaying(true);
    if (!voiceMuted) {
      setTimeout(() => startVoiceAtProgress(0), 50);
    }
  };

  const handleSeek = (nextPct: number) => {
    speechService.unlockAudio();
    const clamped = Math.max(0, Math.min(100, nextPct));
    smoothProgressRef.current = clamped;
    setFilmProgress(clamped);
    setIsPlaying(true);
    if (!voiceMuted) {
      startVoiceAtProgress(clamped);
    }
  };

  const handleJumpToScreen = (screenIdx: number) => {
    const clampedIdx = Math.max(0, Math.min(4, screenIdx));
    const targetAct = calibratedLesson.acts[clampedIdx];
    if (targetAct) {
      handleSeek(targetAct.startPct + 0.1);
    }
  };

  const handleToggleMute = () => {
    speechService.unlockAudio();
    const nextMuted = !voiceMuted;
    setVoiceMuted(nextMuted);
    if (nextMuted) {
      speechService.stop();
    } else if (isPlaying) {
      startVoiceAtProgress(filmProgress);
    }
  };

  const handleCycleSpeed = () => {
    speechService.unlockAudio();
    const speeds = [1.0, 1.1, 0.95];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length] || 1.0;
    setPlaybackSpeed(nextSpeed);
    if (isPlaying && !voiceMuted) startVoiceAtProgress(filmProgress, nextSpeed);
  };

  const handleCycleVoicePersona = () => {
    speechService.unlockAudio();
    const personas: VoicePersona[] = ['vivienne', 'henri'];
    const nextPersona = personas[(personas.indexOf(voicePersona) + 1) % personas.length] || 'vivienne';
    setVoicePersona(nextPersona);
    speechService.setVoicePersona(nextPersona);
    if (isPlaying && !voiceMuted) {
      speechService.play(calibratedLesson.acts.map((a) => a.text).join(' '), currentLessonAudioId, {
        speed: playbackSpeed,
        voice: nextPersona,
        startSentenceIndex: activeAct.index,
        customSentences: calibratedLesson.acts.map((a) => a.text),
      });
    }
  };

  const [musicEnabled, setMusicEnabled] = useState(() => ambientMusicService.getState().enabled);

  useEffect(() => {
    const unsubMusic = ambientMusicService.subscribe((st) => {
      setMusicEnabled(st.enabled);
    });
    return () => unsubMusic();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      ambientMusicService.start();
    } else {
      ambientMusicService.stop();
    }
    return () => {
      ambientMusicService.stop();
    };
  }, [isPlaying]);

  // Strictly lock activeAct to the spoken sentence index whenever voice is active!
  const activeAct = useMemo(() => {
    if (isVoiceDriving && playbackState?.currentSentence) {
      const idx = Math.max(
        0,
        Math.min(calibratedLesson.acts.length - 1, playbackState.currentSentence - 1)
      );
      return calibratedLesson.acts[idx];
    }
    const idx = Math.min(4, Math.max(0, Math.floor(filmProgress / 20)));
    return calibratedLesson.acts[idx] || calibratedLesson.acts[0];
  }, [isVoiceDriving, playbackState?.currentSentence, calibratedLesson.acts, filmProgress]);

  // Exact 0..1 progress inside the active screen (locked directly to live voice wordProgressPct)
  const actVoiceProgress = useMemo(() => {
    if (isPreloading) {
      return 0;
    }
    const actSpan = Math.max(1, activeAct.endPct - activeAct.startPct);
    const filmActRatio = clamp01((filmProgress - activeAct.startPct) / actSpan);
    if (isSpeaking && playbackState) {
      const liveVoiceRatio = clamp01((playbackState.wordProgressPct ?? playbackState.wordProgress ?? 0) / 100);
      return liveVoiceRatio;
    }
    return filmActRatio;
  }, [isSpeaking, isPreloading, playbackState, filmProgress, activeAct]);

  const currentScreenCard =
    calibratedLesson.sceneData.screens[activeAct.index] || calibratedLesson.sceneData.screens[0];

  useEffect(() => {
    onActiveScreenChange?.(activeAct.index);
  }, [activeAct.index, onActiveScreenChange]);

  useEffect(() => {
    if (requestedScreenIndex && typeof requestedScreenIndex.idx === 'number') {
      handleJumpToScreen(requestedScreenIndex.idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedScreenIndex?.ts]);

  // ===========================================================================
  // SYNCHRONIZED LASER POINTER:
  // Points to the exact visual zone Aïsha is explaining right now!
  // - Phase Explication (0 -> fieldRuleStartRatio): Line-by-line across the 5-line Explanation Box
  // - Phase Pratique Terrain (fieldRuleStartRatio -> 1.0): Practical Terrain Box ("En pratique sur le terrain")
  // ===========================================================================
  const focusPose = useMemo(() => {
    const p = actVoiceProgress;
    const ruleStart = currentScreenCard.fieldRuleStartRatio;

    if (p < ruleStart) {
      const t = clamp01(p / Math.max(0.1, ruleStart));
      // Sweeps across each of the 5 explanation lines as Aïsha explains the mechanism!
      const lineIdx = Math.min(4, Math.floor(t * 5));
      const lineProgress = t * 5 - lineIdx;
      return {
        x: lerp(460, 815, lineProgress),
        y: 206 + lineIdx * 30,
        label: `Explication • ${currentScreenCard.shortTabLabel}`
      };
    } else {
      const t = clamp01((p - ruleStart) / Math.max(0.08, 1 - ruleStart));
      const cleanLeadIn = (currentScreenCard.fieldLeadIn || 'Repère essentiel').replace(/\s*[,:]\s*$/, '');
      return {
        x: lerp(460, 815, t),
        y: lerp(402, 428, t),
        label: `${cleanLeadIn} (${currentScreenCard.legalArticle})`
      };
    }
  }, [actVoiceProgress, currentScreenCard]);

  // ===========================================================================
  // REALISTIC, SMOOTHLY DAMPED PHOTOGRAPHIC FACIAL ANIMATION FOR AÏSHA
  // ===========================================================================
  const isActivelySpeaking = isSpeaking || (isPlaying && voiceMuted);

  const filmDerivedPhoneme = useMemo(() => {
    if (!isActivelySpeaking || !activeAct?.text) {
      return {
        currentWord: '',
        mouthOpenness: 0,
        viseme: 'closed' as LipViseme,
        eyebrowLift: 0.14,
        smileIntensity: 0.74
      };
    }
    const charIdx = Math.floor(actVoiceProgress * activeAct.text.length);
    return analyzeFrenchPhonemeAt(activeAct.text, charIdx, tickCount * 28);
  }, [isActivelySpeaking, activeAct, actVoiceProgress, tickCount]);

  const targetMouthOpenness = useMemo(() => {
    if (!isActivelySpeaking) return 0;
    if (isSpeaking && playbackState?.isPauseBetweenWords) {
      return 0.0;
    }

    if (isSpeaking && typeof playbackState?.mouthOpenness === 'number') {
      if (playbackState.mouthOpenness <= 0.03) return 0.0;
      return Math.min(0.96, Math.max(0.18, playbackState.mouthOpenness));
    }

    // Composed, poised French pedagogical rhythm in fallback / muted mode (~3.0 syllables/sec)
    const calmRhythm = 0.52 + 0.38 * Math.abs(Math.sin(tickCount * 0.18));
    const wordPauseGate = Math.sin(tickCount * 0.06) < -0.88 ? 0.0 : 1;

    return Math.min(
      0.92,
      Math.max(
        0,
        (filmDerivedPhoneme.mouthOpenness * 0.55 + 0.45) * calmRhythm * wordPauseGate
      )
    );
  }, [
    isActivelySpeaking,
    isSpeaking,
    playbackState?.mouthOpenness,
    playbackState?.isPauseBetweenWords,
    filmDerivedPhoneme.mouthOpenness,
    tickCount
  ]);

  const effectiveViseme: LipViseme = useMemo(() => {
    if (!isActivelySpeaking || targetMouthOpenness < 0.05) return 'closed';
    if (isSpeaking && playbackState?.viseme && playbackState.viseme !== 'closed') {
      return playbackState.viseme;
    }
    if (filmDerivedPhoneme.viseme !== 'closed') return filmDerivedPhoneme.viseme;
    const mod = tickCount % 9;
    if (mod < 3) return 'open';
    if (mod < 6) return 'wide';
    return 'round';
  }, [isActivelySpeaking, isSpeaking, targetMouthOpenness, playbackState?.viseme, filmDerivedPhoneme.viseme, tickCount]);

  // Full 3D Whole-Head Kinematics ("au lieu d'animer seulement la bouche, animer toute la tête") & mouth articulation without winks
  const dampedFace = useMemo(() => {
    const prev = smoothFaceRef.current;

    const visemeSmileBoost =
      effectiveViseme === 'wide' ? 0.18 : effectiveViseme === 'round' ? -0.12 : 0.04;
    const targetSmile = clamp01(isActivelySpeaking ? 0.65 + visemeSmileBoost : 0.74);

    // Visage droit et non incliné : aucun basculement latéral (targetTilt = 0)
    const targetTilt = 0;

    const targetNod = isActivelySpeaking
      ? Math.sin(tickCount * 0.068) * 5.2 +
        Math.cos(tickCount * 0.039) * 2.8 +
        targetMouthOpenness * 6.4
      : Math.sin(tickCount * 0.02) * 1.8;

    const targetTurn = isActivelySpeaking
      ? Math.sin(tickCount * 0.031) * 2.2
      : Math.sin(tickCount * 0.014) * 0.8;

    const targetBrowLift = isActivelySpeaking
      ? -(targetMouthOpenness * 5.4 + Math.max(0, Math.sin(tickCount * 0.085)) * 2.8)
      : -Math.max(0, Math.sin(tickCount * 0.022)) * 1.1;

    const next = {
      mouth: prev.mouth + (targetMouthOpenness - prev.mouth) * 0.78,
      smile: prev.smile + (targetSmile - prev.smile) * 0.24,
      browLeft: prev.browLeft + (targetBrowLift - prev.browLeft) * 0.28,
      browRight: prev.browRight + (targetBrowLift - prev.browRight) * 0.28,
      eyeSquint: 0,
      gazeX: 0,
      gazeY: 0,
      blinkLeft: 0,
      blinkRight: 0,
      headTilt: 0,
      headNod: prev.headNod + (targetNod - prev.headNod) * 0.25,
      headTurn: prev.headTurn + (targetTurn - prev.headTurn) * 0.22
    };
    smoothFaceRef.current = next;
    return next;
  }, [
    tickCount,
    targetMouthOpenness,
    isActivelySpeaking,
    effectiveViseme
  ]);

  const formatTime = (pct: number) => {
    const totalSeconds = 65;
    const currentSec = Math.round(clamp01(pct / 100) * totalSeconds);
    const mins = Math.floor(currentSec / 60);
    const secs = currentSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalFormattedTime = '01:05';
  const uploadedVideoUrl = (lesson as any)?.mediaUrl;

  const playerRef = useRef<HTMLDivElement>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const changed = () => setFullScreen(document.fullscreenElement === playerRef.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const toggleFullScreen = async () => {
    try {
      if (document.fullscreenElement === playerRef.current) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch { /* The course remains usable when fullscreen is unavailable. */ }
  };
  const nextChapter = () => requiresValidationTest && !isLessonValidated ? onOpenValidationTest?.() : onNextLesson?.();

  return (
    <div ref={playerRef} className="cartoon-player" data-motion={motionEnabled ? "full" : "reduced"}>
      <header className="cartoon-player__header">
        <div className="cartoon-player__heading">
          <span className="cartoon-player__mark"><GraduationCap size={23} aria-hidden="true" /></span>
          <div><small>{course.code || 'ACADEMIA'} · COURS ANIMÉ · CHAPITRE {lessonIndex + 1}</small><h2>{safeTitle}</h2></div>
        </div>
        <div className="cartoon-player__header-actions">
          {uploadedVideoUrl && <button type="button" className={`cartoon-player__pill ${showRawVideo ? 'is-active' : ''}`} onClick={() => setShowRawVideo(value => !value)} aria-pressed={showRawVideo} aria-label={showRawVideo ? 'Afficher le cours animé' : 'Afficher la vidéo du cours'}><Video /><span>{showRawVideo ? 'Animation' : 'Vidéo'}</span></button>}
          <button type="button" className="cartoon-player__icon-button" onClick={toggleFullScreen} aria-label={fullScreen ? 'Quitter le plein écran' : 'Afficher en plein écran'}>{fullScreen ? <Minimize2 /> : <Maximize2 />}</button>
        </div>
      </header>
      {showRawVideo && uploadedVideoUrl ? <div className="cartoon-player__raw"><video src={uploadedVideoUrl} controls playsInline /></div> :
        <CartoonLessonStage screen={currentScreenCard} progress={actVoiceProgress} playing={isPlaying && !isPreloading && motionEnabled} speaking={isSpeaking} mouthOpenness={isSpeaking ? dampedFace.mouth : 0} viseme={isSpeaking ? effectiveViseme : 'closed'} male={voicePersona === 'henri'} legalRef={course.legalRef || 'Loi n° 10/010'} sceneCount={calibratedLesson.acts.length} />}
      <div className="cartoon-player__transport">
        <div className="cartoon-player__progress"><input type="range" min="0" max="100" step="0.2" value={filmProgress} onChange={event => handleSeek(Number(event.target.value))} aria-label="Progression de la leçon" aria-valuetext={`${Math.round(filmProgress)} % de la leçon`} /><span>{Math.round(filmProgress)} %</span></div>
        <div className="cartoon-player__tools">
          <div className="cartoon-player__tool-group">
            <button type="button" onClick={handleTogglePlay} className="cartoon-player__play">{isPlaying ? <Pause /> : <Play />}{isPlaying ? 'Pause' : 'Lire le cours'}</button>
            <button type="button" onClick={handleRestart} className="cartoon-player__icon-button" aria-label="Recommencer la leçon"><RotateCcw /></button>
            <button type="button" onClick={() => handleJumpToScreen(activeAct.index - 1)} disabled={activeAct.index <= 0} className="cartoon-player__icon-button" aria-label="Scène précédente"><ChevronLeft /></button>
            <button type="button" onClick={() => handleJumpToScreen(activeAct.index + 1)} disabled={activeAct.index >= calibratedLesson.acts.length - 1} className="cartoon-player__icon-button" aria-label="Scène suivante"><ChevronRight /></button>
          </div>
          <div className="cartoon-player__tool-group">
            <button type="button" onClick={handleToggleMute} className="cartoon-player__pill" aria-pressed={!voiceMuted} aria-label={voiceMuted ? 'Activer la narration' : 'Couper la narration'}>{voiceMuted ? <VolumeX /> : <Volume2 />}{voiceMuted ? 'Sans voix' : 'Narration'}</button>
            <button type="button" onClick={handleCycleSpeed} className="cartoon-player__pill" aria-label={`Vitesse de lecture : ${playbackSpeed}. Changer la vitesse`}>{playbackSpeed}×</button>
            <button type="button" onClick={handleCycleVoicePersona} className="cartoon-player__pill" aria-label="Changer la voix du professeur">{voicePersona === 'henri' ? 'Prof. Henri' : 'Prof. Aïsha'}</button>
            <button type="button" onClick={() => setMotionEnabled(value => !value)} className="cartoon-player__pill" aria-pressed={!motionEnabled} aria-label="Mouvements réduits"><Sparkles />{motionEnabled ? 'Mouvements' : 'Mouvements réduits'}</button>
            <button type="button" onClick={() => ambientMusicService.toggleEnabled()} className="cartoon-player__icon-button" aria-pressed={musicEnabled} aria-label={musicEnabled ? 'Couper la musique' : 'Activer la musique'}><Music /></button>
          </div>
        </div>
        <p className="cartoon-player__status" role="status">{isPreloading || isCoursePreloading ? 'Préparation de la narration…' : isSpeaking ? 'Les scènes suivent la narration.' : voiceMuted ? 'Parcourez le cours à votre rythme.' : isPlaying ? 'Le cours est en lecture.' : 'En pause · reprenez quand vous le souhaitez.'}</p>
      </div>
      <nav className="cartoon-player__scenes" aria-label="Scènes de la leçon">
        {calibratedLesson.sceneData.screens.map((screen, index) => <button type="button" key={screen.screenNumber} className="cartoon-player__scene-button" onClick={() => handleJumpToScreen(index)} aria-current={activeAct.index === index ? 'step' : undefined}>
          <span className="cartoon-player__scene-top">SCÈNE {String(index + 1).padStart(2, '0')}{index < activeAct.index ? <CheckCircle2 size={13} /> : <span aria-hidden="true">↗</span>}</span>
          <strong>{screen.shortTabLabel.replace(/^\d+\s*[.•:–-]?\s*/, '')}</strong>
          <span className="cartoon-player__scene-meter" style={{ width: `${index < activeAct.index ? 100 : index === activeAct.index ? actVoiceProgress * 100 : 0}%` }} />
        </button>)}
      </nav>
      <footer className="cartoon-player__lesson-nav">
        <button type="button" onClick={onPrevLesson} disabled={!hasPrevLesson} className="cartoon-player__pill"><ChevronLeft />Chapitre précédent</button>
        {requiresValidationTest ? <button type="button" onClick={onOpenValidationTest} className={`cartoon-player__validation ${isLessonValidated ? 'is-validated' : ''}`}>{isLessonValidated ? <CheckCircle2 /> : <ShieldCheck />}{isLessonValidated ? 'Test validé' : 'Valider mes acquis'}</button> : <span className="cartoon-player__chapter-label">Chapitre {lessonIndex + 1} sur {course.lessons?.length || 1}</span>}
        <button type="button" onClick={nextChapter} disabled={!(requiresValidationTest && !isLessonValidated ? onOpenValidationTest : onNextLesson)} className="cartoon-player__play">{requiresValidationTest && !isLessonValidated ? 'Passer le test' : hasNextLesson ? 'Chapitre suivant' : 'Terminer'}<ChevronRight /></button>
      </footer>
      {profileAdaptation && <div className="cartoon-player__adaptation">{profileAdaptation.profileBadge} · {profileAdaptation.roleSpecificObjective}</div>}
    </div>
  );
};
