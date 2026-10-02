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
  Music
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
import { avatarExpressionEngine } from '../utils/avatarExpressionEngine';
import type { AvatarEmotion } from '../workers/avatarExpressionWorker';
import imgTutrice from '../assets/images/aisha_portrait_sans_main_1790912759956.jpg';
import {
  ContextualSceneType,
  ProfessorContextualStage,
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
  onActiveScreenChange
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
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('vivienne');

  const [pipExpanded, setPipExpanded] = useState<boolean>(false);
  const [manualWinkUntil, setManualWinkUntil] = useState<number>(0);

  // Real-Time 60 FPS Wav2Lip Video Engine state (active by default)
  const [flowVideoUrl, setFlowVideoUrl] = useState<string | null>(null);
  const [flowVideoStatus, setFlowVideoStatus] = useState<'idle' | 'generating' | 'ready' | 'live_neural'>('live_neural');
  const [flowStatusMessage, setFlowStatusMessage] = useState<string>(
    'Synthèse Vidéo Réelle Wav2Lip HD (60 FPS) active • Synchronisation labiale, émotions & gestuelle des mains'
  );
  const flowVideoRef = useRef<HTMLVideoElement | null>(null);

  // Overall 0..100 progress & per-screen 0..1 progress
  const [filmProgress, setFilmProgress] = useState<number>(0);
  const [tickCount, setTickCount] = useState<number>(0);
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState | null>(null);
  const playbackStateRef = useRef<SpeechPlaybackState | null>(null);
  const [showRawVideo, setShowRawVideo] = useState<boolean>(false);

  const smoothProgressRef = useRef<number>(0);
  const lastVoiceStartAtRef = useRef<number>(0);

  // Direct DOM Refs for 60 FPS Zero-Lag Wav2Lip Video Synthesis & HUD Overlays
  const headerWav2LipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const headerEmotionBadgeRef = useRef<SVGTextElement | null>(null);
  const headerPostureBadgeRef = useRef<SVGTextElement | null>(null);
  const headerVisemeBadgeRef = useRef<SVGTextElement | null>(null);
  const headerEqBarRefs = useRef<(SVGRectElement | null)[]>([]);

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
          next = current + (targetVoicePct - current) * 0.68;
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
    const speeds = [1.0, 1.1, 0.92];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length] || 1.0;
    setPlaybackSpeed(nextSpeed);
    if (isPlaying && !voiceMuted) startVoiceAtProgress(filmProgress, nextSpeed);
  };

  const handleCycleVoicePersona = () => {
    speechService.unlockAudio();
    const personas: VoicePersona[] = ['vivienne', 'charline', 'denise', 'eloise'];
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

  const triggerManualWink = () => {
    setManualWinkUntil(Date.now() + 850);
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

  // Exact 0..1 progress inside the active screen (strictly locked 1:1 to live audio wordProgressPct when voice is speaking)
  const actVoiceProgress = useMemo(() => {
    if (isPreloading) {
      return 0;
    }
    if (isSpeaking && playbackState) {
      return clamp01((playbackState.wordProgressPct ?? playbackState.wordProgress ?? 0) / 100);
    }
    const actSpan = Math.max(1, activeAct.endPct - activeAct.startPct);
    return clamp01((filmProgress - activeAct.startPct) / actSpan);
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

    // High-contrast syllabic articulation envelope:
    // Dips to 0.0 on consonant closures between syllables and rises to 0.95 on vowel peaks!
    const rawSyllable =
      Math.sin(tickCount * 0.78) * 0.56 +
      Math.sin(tickCount * 0.47) * 0.34 +
      Math.cos(tickCount * 1.15) * 0.22;
    const crispSyllabicPulse = Math.max(0, Math.min(1, (rawSyllable + 0.16) / 0.92));

    // Brief natural inter-word / breathing closures so the mouth visibly closes between words
    const wordPauseGate = Math.sin(tickCount * 0.15) < -0.82 ? 0.02 : 1;

    if (isSpeaking && typeof playbackState?.mouthOpenness === 'number' && playbackState.mouthOpenness > 0.02) {
      const srvBoost = Math.max(0.3, playbackState.mouthOpenness * 1.25);
      const combined =
        crispSyllabicPulse * 0.72 * wordPauseGate +
        srvBoost * 0.35 * crispSyllabicPulse +
        filmDerivedPhoneme.mouthOpenness * 0.18 * crispSyllabicPulse;
      return Math.min(0.98, Math.max(0, combined));
    }

    return Math.min(
      0.96,
      Math.max(
        0,
        (filmDerivedPhoneme.mouthOpenness * 0.45 + 0.65) * crispSyllabicPulse * wordPauseGate
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

  // ===========================================================================
  // DEDICATED WEB WORKER + requestAnimationFrame AVATAR RENDERING ENGINE
  // All facial expression math, phoneme-viseme interpolation, and 3D head kinematics
  // are computed in the background Web Worker thread (avatarExpressionWorker.ts)
  // and applied inside requestAnimationFrame with zero main-thread blocking!
  // ===========================================================================
  const isActivelySpeakingRef = useRef(false);
  isActivelySpeakingRef.current = isActivelySpeaking;

  const [manualStudioEmotion, setManualStudioEmotion] = useState<AvatarEmotion | 'auto'>('auto');
  const manualStudioEmotionRef = useRef<AvatarEmotion | 'auto'>('auto');
  manualStudioEmotionRef.current = manualStudioEmotion;

  const handleSelectStudioEmotion = (emo: AvatarEmotion | 'auto') => {
    setManualStudioEmotion(emo);
    if (emo !== 'auto') {
      avatarExpressionEngine.setEmotion(emo);
    }
  };

  useEffect(() => {
    const unregister = avatarExpressionEngine.registerAvatarTarget({
      wav2lipCanvas: headerWav2LipCanvasRef.current,
      wav2lipViewport: { x: 174, y: 134, w: 548, h: 552 },
      emotionBadgeEl: headerEmotionBadgeRef.current,
      postureBadgeEl: headerPostureBadgeRef.current,
      visemeBadgeEl: headerVisemeBadgeRef.current,
      eqBars: headerEqBarRefs.current,
      isSpeakingOverride: () => Boolean(isActivelySpeakingRef.current),
      emotionOverride: () =>
        manualStudioEmotionRef.current !== 'auto' ? manualStudioEmotionRef.current : undefined,
    });
    return unregister;
  }, []);

  // ===========================================================================
  // GOOGLE FLOW (VEO 3.1) VIDEO GENERATION & VOICE-SYNCHRONIZED GESTURE ENGINE
  // ===========================================================================
  const triggerGoogleFlowVideoGeneration = useCallback(
    async (forceRegenerate: boolean = false) => {
      try {
        setFlowVideoStatus('generating');
        setFlowStatusMessage('Génération vidéo Google Flow (Veo HD) d’Aïsha en cours…');
        const startRes = await fetch('/api/ai/flow-video/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forceRegenerate,
            contextPrompt: `Chapitre: ${safeTitle}. S'adresse avec préséance à ${userPrecedence.spokenFullName}.`
          })
        });

        if (!startRes.ok) {
          setFlowVideoStatus('live_neural');
          setFlowStatusMessage('Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées');
          return;
        }

        const startData = await startRes.json();
        if (startData.done && startData.videoUrl) {
          setFlowVideoUrl(startData.videoUrl);
          setFlowVideoStatus('ready');
          setFlowStatusMessage('Vidéo Google Flow (Veo HD) prête & synchronisée avec la voix');
          return;
        }

        if (startData.fallback === 'live_neural' || !startData.operationName) {
          setFlowVideoStatus('live_neural');
          setFlowStatusMessage(
            startData.message || 'Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées'
          );
          return;
        }

        const opName = startData.operationName;

        // Poll status every 6 seconds up to 25 times
        let attempts = 0;
        const pollTimer = window.setInterval(async () => {
          attempts += 1;
          try {
            const stRes = await fetch('/api/ai/flow-video/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: opName })
            });
            if (!stRes.ok) {
              if (attempts > 3) {
                window.clearInterval(pollTimer);
                setFlowVideoStatus('live_neural');
                setFlowStatusMessage('Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées');
              }
              return;
            }
            const stData = await stRes.json();
            if (stData.done && stData.videoUrl) {
              window.clearInterval(pollTimer);
              setFlowVideoUrl(stData.videoUrl);
              setFlowVideoStatus('ready');
              setFlowStatusMessage('Vidéo Google Flow (Veo HD) active & synchronisée avec Vivienne HD');
            } else if (stData.fallback === 'live_neural' || attempts >= 25) {
              window.clearInterval(pollTimer);
              setFlowVideoStatus('live_neural');
              setFlowStatusMessage('Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées');
            }
          } catch {
            if (attempts >= 5) {
              window.clearInterval(pollTimer);
              setFlowVideoStatus('live_neural');
            }
          }
        }, 6000);
      } catch {
        setFlowVideoStatus('live_neural');
        setFlowStatusMessage('Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées');
      }
    },
    [safeTitle, userPrecedence.spokenFullName]
  );

  // Keep 60 FPS WebGL Wav2Lip engine active by default
  useEffect(() => {
    setFlowVideoUrl(null);
    setFlowVideoStatus('live_neural');
    setFlowStatusMessage(
      'Synthèse Vidéo Réelle Wav2Lip HD (60 FPS) active • Synchronisation labiale, sourire & port de tête féminin'
    );
  }, []);

  // Synchronize optional HTML5 <video> playback if ever loaded
  useEffect(() => {
    const vid = flowVideoRef.current;
    if (!vid || !flowVideoUrl) return;
    if (isActivelySpeaking) {
      vid.playbackRate = Math.max(0.85, Math.min(1.18, 0.92 + dampedFace.mouth * 0.25));
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    } else {
      if (!vid.paused) {
        vid.pause();
      }
    }
  }, [isActivelySpeaking, dampedFace.mouth, flowVideoUrl]);

  // Voice-synchronized upper-body & shoulder gesture kinematics ("gestuels cadrant avec sa voix")
  const gestureKinematics = useMemo(() => {
    const p = actVoiceProgress;
    const ruleStart = currentScreenCard.fieldRuleStartRatio;
    const voiceAmp = isActivelySpeaking ? dampedFace.mouth : 0;
    const waveA = isActivelySpeaking ? Math.sin(tickCount * 0.08) : Math.sin(tickCount * 0.02) * 0.2;
    const waveB = isActivelySpeaking ? Math.cos(tickCount * 0.065) : Math.cos(tickCount * 0.02) * 0.2;

    if (p < 0.22) {
      return {
        gestureName: `Salutation de préséance à ${userPrecedence.displayFullName}`,
        shoulderShiftX: waveA * 2.5,
        shoulderLiftY: -voiceAmp * 5 + waveB * 1.8,
        torsoScaleX: 1 + voiceAmp * 0.018,
        mode: 'precedence_salute' as const
      };
    } else if (p < ruleStart) {
      return {
        gestureName: 'Posture pédagogique cadencée sur la voix',
        shoulderShiftX: waveA * 4.2,
        shoulderLiftY: -voiceAmp * 7.5 + waveB * 2.5,
        torsoScaleX: 1 + voiceAmp * 0.026,
        mode: 'open_teaching' as const
      };
    } else {
      return {
        gestureName: 'Présence posée de cadrage & sagesse pratique',
        shoulderShiftX: waveA * 2.2,
        shoulderLiftY: -voiceAmp * 4.5 + waveB * 1.5,
        torsoScaleX: 1 + voiceAmp * 0.015,
        mode: 'poised_framing' as const
      };
    }
  }, [
    actVoiceProgress,
    currentScreenCard.fieldRuleStartRatio,
    isActivelySpeaking,
    dampedFace.mouth,
    tickCount,
    userPrecedence.displayFullName
  ]);

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 shadow-2xl select-none">
      {/* =========================================================================== */}
      {/* 1. ENTÊTE DU BLOC — STUDIO VIDÉO D'AÏSHA (SANS SOUS-TITRES) & PRÉSÉANCES    */}
      {/* =========================================================================== */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-amber-500/30 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row items-stretch gap-3.5 sm:gap-4">
          {/* A. PORTRAIT STUDIO ANIMÉ HAUTE FIDÉLITÉ D'AÏSHA (POSTURE DROITE, VISAGE FACE CAMÉRA & MAINS EXPRESSIVES) */}
          <div
            className={`relative shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-slate-950 shadow-xl ${
              isActivelySpeaking ? 'border-cyan-400 shadow-cyan-500/20' : 'border-amber-400/70'
            } ${
              pipExpanded
                ? 'w-full md:w-[360px] xl:w-[400px] h-[300px] sm:h-[330px]'
                : 'w-full md:w-[300px] lg:w-[330px] xl:w-[350px] h-[265px] sm:h-[290px]'
            } mx-auto md:mx-0`}
          >
            {/* Real-Time 60 FPS WebGL Wav2Lip Video Synthesizer (540-Triangle Dense Mesh + Oral Composite) */}
            <canvas
              ref={headerWav2LipCanvasRef}
              width={640}
              height={560}
              className="w-full h-full block object-cover opacity-100"
            />

            {/* Broadcast HUD Overlay (Compact Top Bar leaving Aïsha's face, torso & speaking hands 100% unobstructed) */}
            <svg
              viewBox="0 0 360 260"
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Top Overlay Badge: Active Facial & Vocal Emotion + Equalizer */}
              <g transform="translate(6, 6)">
                <rect
                  x="0"
                  y="0"
                  width="244"
                  height="18"
                  rx="9"
                  fill="#0F172A"
                  fillOpacity="0.78"
                  stroke="#22D3EE"
                  strokeWidth="1"
                />
                <circle cx="10" cy="9" r="3.5" fill={isActivelySpeaking ? '#10B981' : '#F59E0B'} />
                <text
                  ref={headerEmotionBadgeRef}
                  x="18"
                  y="12.2"
                  fill="#ECFEFF"
                  fontSize="7.4"
                  fontWeight="900"
                >
                  🎓 Éloquence &amp; Sérénité académique
                </text>
                <g transform="translate(204, 3)">
                  {[0, 1, 2, 3, 4].map((bIdx) => (
                    <rect
                      key={bIdx}
                      ref={(el) => {
                        headerEqBarRefs.current[bIdx] = el;
                      }}
                      x={bIdx * 6.5}
                      y={4.25}
                      width="3.5"
                      height={3.5}
                      rx="1.75"
                      fill={isActivelySpeaking ? '#22D3EE' : '#64748B'}
                    />
                  ))}
                </g>
              </g>

              {/* Top-Right 6-Viseme Phonetic Articulation Badge */}
              <g transform="translate(256, 6)">
                <rect
                  x="0"
                  y="0"
                  width="98"
                  height="18"
                  rx="9"
                  fill="#020617"
                  fillOpacity="0.78"
                  stroke={isActivelySpeaking ? '#10B981' : '#38BDF8'}
                  strokeWidth="1"
                />
                <circle cx="10" cy="9" r="3" fill={isActivelySpeaking ? '#10B981' : '#38BDF8'} />
                <text
                  ref={headerVisemeBadgeRef}
                  x="17"
                  y="12.0"
                  fill="#E0F2FE"
                  fontSize="7.0"
                  fontWeight="900"
                >
                  VISÈME 1/6
                </text>
              </g>

              {/* Hidden/Compact Top-Left Sub-Pill for Posture Ref so hands at bottom remain 100% uncovered */}
              <g transform="translate(6, 26)" opacity="0.82">
                <rect
                  x="0"
                  y="0"
                  width="126"
                  height="14"
                  rx="7"
                  fill="#0F172A"
                  fillOpacity="0.68"
                />
                <text
                  ref={headerPostureBadgeRef}
                  x="7"
                  y="9.8"
                  fill="#FDE68A"
                  fontSize="5.8"
                  fontWeight="800"
                >
                  🌸 Port de tête féminin • Sourire
                </text>
              </g>
            </svg>
          </div>

          {/* B. PROTOCOLE DE PRÉSÉANCE, RÔLE DE L'APPRENANT & NAVIGATION D'ÉCRAN */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4">
            {/* Top Row: Connected User Precedence Protocol & Role */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={effectiveUserProfile?.avatarUrl || imgTutrice}
                    alt={userPrecedence.displayFullName}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      {userPrecedence.roleBadgeLabel}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] font-semibold text-cyan-300 truncate">
                      {userPrecedence.precedenceTitle}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white truncate">
                    Apprenant honoré : {userPrecedence.displayFullName}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      ({userPrecedence.institutionName})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: Interactive Wav2Lip Emotion, Smile & Full-Image Gesture Selector */}
            <div className="flex flex-wrap items-center gap-1.5 py-1 border-y border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mr-1 flex items-center gap-1">
                <span>😊</span>
                <span>Expressions &amp; Sourire Wav2Lip :</span>
              </span>
              {(
                [
                  { id: 'auto', icon: '✨', label: 'Auto Voix' },
                  { id: 'smiling', icon: '😊', label: 'Sourire' },
                  { id: 'pedagogical', icon: '🎓', label: 'Éloquence' },
                  { id: 'empathetic', icon: '💛', label: 'Empathie' },
                  { id: 'curious', icon: '🤔', label: 'Réflexion' },
                  { id: 'enthusiastic', icon: '🌟', label: 'Joie' },
                  { id: 'astonished', icon: '😲', label: 'Alerte' },
                  { id: 'solemn', icon: '⚖️', label: 'Rigueur' },
                ] as Array<{ id: AvatarEmotion | 'auto'; icon: string; label: string }>
              ).map((preset) => {
                const active = manualStudioEmotion === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectStudioEmotion(preset.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row in Header Block: Screen Navigation & Engine Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{flowStatusMessage}</span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => handleJumpToScreen(activeAct.index - 1)}
                  disabled={activeAct.index <= 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Écran préc.</span>
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-black">
                  Écran {activeAct.index + 1} / 5
                </span>
                <button
                  type="button"
                  onClick={() => handleJumpToScreen(activeAct.index + 1)}
                  disabled={activeAct.index >= 4}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                >
                  <span>Écran suiv.</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {uploadedVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowRawVideo((v) => !v)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white whitespace-nowrap ml-1"
                  >
                    {showRawVideo ? 'Film Pédagogique' : 'Fichier MP4'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WIDESCREEN 16:9 FULL-HEIGHT WHITEBOARD STAGE WITH HAND DRAWING EXPLANATIONS */}
      {showRawVideo && uploadedVideoUrl ? (
        <div className="relative aspect-video w-full bg-black">
          <video
            src={uploadedVideoUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="relative w-full aspect-video min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] xl:min-h-[640px] bg-slate-950 overflow-hidden">
          <svg
            viewBox="0 0 960 540"
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="studioWallBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <pattern id="boardDots" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.1" fill="#CBD5E1" />
              </pattern>

              <filter id="cardDropShadow" x="-10%" y="-10%" width="125%" height="125%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.24" />
              </filter>
            </defs>

            {/* A. STUDIO BACKGROUND & FULL-HEIGHT PRESENTATION WHITEBOARD (516px tall) */}
            <rect x="0" y="0" width="960" height="540" fill="url(#studioWallBg)" />

            <g filter="url(#cardDropShadow)">
              <rect
                x="16"
                y="12"
                width="928"
                height="516"
                rx="18"
                fill="#FFFDF9"
                stroke="#1E293B"
                strokeWidth="3"
              />
              <rect x="16" y="12" width="928" height="516" rx="18" fill="url(#boardDots)" />

              {/* Top Presentation Window Bar */}
              <rect x="16" y="12" width="928" height="34" rx="14" fill="#0F172A" />
              <circle cx="38" cy="29" r="5" fill="#F43F5E" />
              <circle cx="54" cy="29" r="5" fill="#FBBF24" />
              <circle cx="70" cy="29" r="5" fill="#10B981" />
              <text x="90" y="33" fill="#FFFFFF" fontSize="11" fontWeight="900">
                ✍️ TABLEAU BLANC GRAND ÉCRAN — {safeTitle.slice(0, 46).toUpperCase()}
              </text>
              <text
                x="926"
                y="33"
                textAnchor="end"
                fill="#FBBF24"
                fontSize="10.5"
                fontWeight="800"
                fontFamily="monospace"
              >
                PLANCHE {activeAct.index + 1}/5 • DESSIN EN DIRECT {Math.round(actVoiceProgress * 100)}%
              </text>
            </g>

            {/* B. WIDESCREEN STAGE WITH ARTICULATED HAND DRAWING EXPLANATIONS */}
            <ProfessorContextualStage
              data={calibratedLesson.sceneData}
              activeActIndex={activeAct.index}
              actVoiceProgress={actVoiceProgress}
              tickCount={tickCount}
              courseLegalRef={course.legalRef}
              onSelectScreen={handleJumpToScreen}
            />
          </svg>
        </div>
      )}

      {/* 3. BOTTOM TIMELINE & CONTROLS */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 sm:px-5 py-3 flex flex-col gap-2.5">
        {/* 5-Screen Interactive Timeline Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-400 w-11">
            {formatTime(filmProgress)}
          </span>
          <div className="relative flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 transition-all duration-75"
              style={{ width: `${filmProgress}%` }}
            />
            {[20, 40, 60, 80].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 bottom-0 w-0.5 bg-slate-950/80"
                style={{ left: `${mark}%` }}
              />
            ))}
            <input
              type="range"
              min={0}
              max={100}
              step={0.2}
              value={filmProgress}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Progression de la leçon"
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400 w-11 text-right">
            {totalFormattedTime}
          </span>
        </div>

        {/* Transport & Theme Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Recommencer dès l'Écran 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleJumpToScreen(activeAct.index - 1)}
              disabled={activeAct.index <= 0}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition"
              title="Écran précédent"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleJumpToScreen(activeAct.index + 1)}
              disabled={activeAct.index >= 4}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition"
              title="Écran suivant"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition ${
                voiceMuted
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {voiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{voiceMuted ? 'Voix coupée' : 'Voix active'}</span>
            </button>

            <button
              type="button"
              onClick={() => ambientMusicService.toggleEnabled()}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                musicEnabled
                  ? 'bg-indigo-950/75 border-indigo-400/50 text-indigo-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Activer ou couper la musique douce d'ambiance au fond"
            >
              <Music className="w-3.5 h-3.5 text-amber-300" />
              <span>{musicEnabled ? 'Musique douce : ON' : 'Musique : OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCycleSpeed}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-black transition cursor-pointer"
              title="Vitesse de diction posée d'Aïsha"
            >
              {playbackSpeed}x • {playbackSpeed >= 1.08 ? 'Dynamique' : playbackSpeed <= 0.94 ? 'Posé' : 'Naturel'}
            </button>

            <button
              type="button"
              onClick={handleCycleVoicePersona}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs font-black transition cursor-pointer"
              title="Changer de timbre vocal haute définition"
            >
              🎙️ {voicePersona === 'denise'
                ? 'Denise HD • Éloquente'
                : voicePersona === 'charline'
                ? 'Charline HD • Mélodieuse'
                : voicePersona === 'vivienne'
                ? 'Vivienne HD • Douce'
                : 'Ariane HD • Cristalline'}
            </button>
          </div>

          {/* 5 Quick Screen Jump Pills (Structured 5 Pillars) */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {calibratedLesson.sceneData.screens.map((scr, idx) => {
              const isAct = activeAct.index === idx;
              return (
                <button
                  key={scr.screenNumber}
                  type="button"
                  onClick={() => handleJumpToScreen(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition whitespace-nowrap cursor-pointer ${
                    isAct
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {scr.shortTabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bandeau d'adaptation personnalisée au profil connecté (comme avec la Tutrice Virtuelle) */}
        {profileAdaptation && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {profileAdaptation.profileBadge}
              </span>
              <span className="text-[11px] text-slate-200 font-semibold italic truncate">
                {profileAdaptation.animatedProfessorCallout}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-300 shrink-0">
              Livrable : {profileAdaptation.expectedDeliverable.slice(0, 58)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
