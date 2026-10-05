// Expressive Neural Human Voice, Millisecond Word-Boundary Lip-Sync & Facial Gesture Engine
// Supports ElevenLabs Multilingual v2 API + Studio Neural HD Voices (Vivienne / Denise / Eloise)
// with real-time Web Audio AnalyserNode & exact millisecond WordBoundary synchronization

import {
  type AvatarEmotion,
  detectSentenceEmotion,
  EMOTION_LABELS,
} from '../workers/avatarExpressionWorker';
import {
  type TtsEmotionalTag,
  extractTtsEmotionalTags,
  reanchorEmotionalTagsToBoundaries,
} from './microGestureLibrary';

export type LipViseme = 'closed' | 'narrow' | 'medium' | 'open' | 'wide' | 'round';
export type { AvatarEmotion, TtsEmotionalTag };

export type NeuralVoicePersona = 'vivienne' | 'denise' | 'eloise' | 'charline';
export type VoicePersona = NeuralVoicePersona;

export interface TtsWordBoundary {
  text: string;
  offsetMs: number;
  durationMs: number;
  charIndex: number;
}

export interface SpeechPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentId: string | null;
  // Synchronized aliases for lesson & animation players
  isSpeaking?: boolean;
  isPreloading?: boolean;
  isPaused?: boolean;
  activeId?: string | null;
  wordProgress?: number;
  textSnippet?: string;
  currentSentenceText?: string;
  source: 'gemini-tts' | 'web-speech' | 'none';
  voiceProvider?:
    | 'elevenlabs-v2'
    | 'neural-vivienne-hd'
    | 'neural-denise-hd'
    | 'neural-eloise-hd'
    | 'neural-charline-hd'
    | 'gemini-tts'
    | 'web-speech';
  currentSentence?: number;
  totalSentences?: number;
  wordProgressPct?: number;
  charIndex?: number;
  currentWord?: string;
  mouthOpenness?: number;
  viseme?: LipViseme;
  emotion?: AvatarEmotion;
  emotionLabel?: string;
  emotionalTags?: TtsEmotionalTag[];
  // Facial & Gestural Expression Signals Synchronized with Voice
  eyebrowLift?: number; // 0..1 expressive eyebrow arch on stressed syllables
  headTiltDeg?: number; // -3.5..+3.5 deg natural head tilt
  headNodY?: number; // -2..+3.5 px emphatic head nod
  smileIntensity?: number; // 0..1 warm cheek & lip corner lift
  isPauseBetweenWords?: boolean; // true during natural breathing pauses between words
  gestureEnergy?: number; // 0..1 expressive hand/arm gesture amplitude
}

type StateListener = (state: SpeechPlaybackState) => void;

interface DecodedNeuralEntry {
  audioBuffer: AudioBuffer | null;
  envelope5ms?: Float32Array | null;
  audioDataUrl: string;
  wordBoundaries: TtsWordBoundary[];
  emotionalTags: TtsEmotionalTag[];
  emotion?: AvatarEmotion;
  provider: NonNullable<SpeechPlaybackState['voiceProvider']>;
}

// 200 Hz (5ms step) high-precision PCM vocal envelope with noise-floor gating
function computeAudioBufferEnvelope5ms(buffer: AudioBuffer): Float32Array {
  try {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate || 24000;
    const stepSamples = Math.max(1, Math.floor(sampleRate * 0.005));
    const frameCount = Math.ceil(channelData.length / stepSamples);
    const env = new Float32Array(frameCount);
    let peak = 0.02;
    for (let f = 0; f < frameCount; f++) {
      const start = f * stepSamples;
      const end = Math.min(channelData.length, start + stepSamples);
      let sumSq = 0;
      for (let i = start; i < end; i++) {
        const s = channelData[i];
        sumSq += s * s;
      }
      const rms = Math.sqrt(sumSq / Math.max(1, end - start));
      env[f] = rms;
      if (rms > peak) peak = rms;
    }
    const scale = 1 / Math.max(0.05, peak * 0.84);
    for (let f = 0; f < frameCount; f++) {
      const norm = Math.min(1, env[f] * scale);
      env[f] = norm < 0.022 ? 0 : norm;
    }
    return env;
  } catch {
    return new Float32Array(0);
  }
}

function buildClientEstimatedBoundaries(sentence: string, targetTotalDurationMs?: number): TtsWordBoundary[] {
  const tokens = sentence.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const raw: TtsWordBoundary[] = [];
  let cursorChar = 0;
  let offsetMs = 50;

  for (const token of tokens) {
    const foundAt = sentence.indexOf(token, cursorChar);
    const charIndex = foundAt >= 0 ? foundAt : cursorChar;
    cursorChar = charIndex + token.length;
    const clean = token.replace(/[.,;:!?«»"()—\-]/g, '').trim() || token;
    const hasPauseAfter = /[.,;:!?—]/.test(token);
    const durationMs = Math.max(105, Math.min(600, clean.length * 62));
    raw.push({
      text: clean,
      offsetMs,
      durationMs,
      charIndex,
    });
    offsetMs += durationMs + (hasPauseAfter ? 240 : 36);
  }

  if (targetTotalDurationMs && targetTotalDurationMs > 300 && offsetMs > 100) {
    const scale = (targetTotalDurationMs - 60) / offsetMs;
    if (scale > 0.45 && scale < 2.2) {
      for (const wb of raw) {
        wb.offsetMs = Math.round(wb.offsetMs * scale);
        wb.durationMs = Math.max(40, Math.round(wb.durationMs * scale));
      }
    }
  }

  return raw;
}

// Calibrates WordBoundaries directly against the decoded 200 Hz PCM waveform (envelope5ms) so that:
// 1. Word 1 starts on the exact millisecond vocal energy begins in the audio buffer.
// 2. The last word ends on the exact millisecond vocal energy finishes in the audio buffer.
// 3. Every multi-clause pause (comma, period, dash >= 85ms) is re-anchored to the exact acoustic silence valley
//    and voice resumption frame in envelope5ms — eliminating any 1-second cumulative drift!
// 4. Inter-word transitions snap to local consonant/liaison valleys within ±30ms.
function calibrateWordBoundariesToEnvelope(
  sentence: string,
  rawBoundaries: TtsWordBoundary[],
  envelope5ms: Float32Array | null,
  durationMs?: number
): TtsWordBoundary[] {
  const hasNativeBoundaries = Array.isArray(rawBoundaries) && rawBoundaries.length > 0;
  const base = hasNativeBoundaries
    ? rawBoundaries.map((w) => ({ ...w }))
    : buildClientEstimatedBoundaries(sentence, durationMs);

  // When native millisecond WordBoundaries are returned by Edge Neural TTS, preserve their exact neural timing!
  if (hasNativeBoundaries || base.length === 0 || !envelope5ms || envelope5ms.length < 10) {
    return base;
  }

  const nFrames = envelope5ms.length;
  let firstVoiceFrame = -1;
  let lastVoiceFrame = -1;

  for (let f = 0; f < nFrames - 2; f++) {
    if (envelope5ms[f] > 0.030 && (envelope5ms[f + 1] > 0.035 || envelope5ms[f + 2] > 0.040)) {
      firstVoiceFrame = Math.max(0, f - 2);
      break;
    }
  }

  for (let f = nFrames - 1; f >= 2; f--) {
    if (envelope5ms[f] > 0.035 && (envelope5ms[f - 1] > 0.035 || envelope5ms[f - 2] > 0.035)) {
      lastVoiceFrame = Math.min(nFrames - 1, f + 1);
      break;
    }
  }

  if (firstVoiceFrame === -1 || lastVoiceFrame <= firstVoiceFrame + 8) {
    return base;
  }

  const actualStartMs = Math.max(0, firstVoiceFrame * 5);
  const actualEndMs = lastVoiceFrame * 5;
  const actualSpanMs = Math.max(80, actualEndMs - actualStartMs);

  const origStartMs = base[0].offsetMs;
  const lastWb = base[base.length - 1];
  const origEndMs = lastWb.offsetMs + lastWb.durationMs;
  const origSpanMs = Math.max(80, origEndMs - origStartMs);

  // Step 1: Always linearly align ALL word boundaries to match the exact acoustic speech span [actualStartMs, actualEndMs]
  const scale = actualSpanMs / origSpanMs;
  if (scale > 0.45 && scale < 2.1) {
    for (let i = 0; i < base.length; i++) {
      const wb = base[i];
      const relStart = wb.offsetMs - origStartMs;
      wb.offsetMs = Math.round(actualStartMs + relStart * scale);
      wb.durationMs = Math.max(40, Math.round(wb.durationMs * scale));
    }
  }

  // Step 2: Multi-Clause Pause Re-Anchoring!
  // Detect real silence valleys (>= 75ms of RMS < 0.032) in envelope5ms and lock clause boundaries to the exact voice resumption frame!
  const silenceValleys: Array<{ silenceStartMs: number; voiceResumeMs: number }> = [];
  let silStart = -1;
  for (let f = firstVoiceFrame + 8; f < lastVoiceFrame - 8; f++) {
    if (envelope5ms[f] < 0.032) {
      if (silStart === -1) silStart = f;
    } else {
      if (silStart !== -1) {
        const silFrames = f - silStart;
        if (silFrames >= 15) {
          // >= 75ms real breathing/punctuation pause
          silenceValleys.push({
            silenceStartMs: silStart * 5,
            voiceResumeMs: Math.max(0, (f - 1) * 5),
          });
        }
        silStart = -1;
      }
    }
  }

  if (silenceValleys.length > 0 && base.length >= 3) {
    // Match inter-word punctuation gaps (>= 70ms) to the nearest real acoustic voiceResumeMs within ±650ms
    const anchors: Array<{ wordIdx: number; targetOffsetMs: number; prevEndMs: number }> = [];
    const usedValleys = new Set<number>();

    for (let i = 1; i < base.length; i++) {
      const prev = base[i - 1];
      const curr = base[i];
      const gap = curr.offsetMs - (prev.offsetMs + prev.durationMs);
      if (gap >= 70) {
        let bestV = -1;
        let bestDist = 650;
        for (let v = 0; v < silenceValleys.length; v++) {
          if (usedValleys.has(v)) continue;
          const dist = Math.abs(silenceValleys[v].voiceResumeMs - curr.offsetMs);
          if (dist < bestDist) {
            bestDist = dist;
            bestV = v;
          }
        }
        if (bestV !== -1) {
          usedValleys.add(bestV);
          anchors.push({
            wordIdx: i,
            targetOffsetMs: silenceValleys[bestV].voiceResumeMs,
            prevEndMs: silenceValleys[bestV].silenceStartMs,
          });
        }
      }
    }

    // Piecewise-rescale each clause between anchors so cumulative drift across commas/periods is 0ms!
    if (anchors.length > 0) {
      let segStartIdx = 0;
      let segTargetStartMs = actualStartMs;

      for (let a = 0; a <= anchors.length; a++) {
        const isLastSeg = a === anchors.length;
        const segEndIdx = isLastSeg ? base.length - 1 : anchors[a].wordIdx - 1;
        const segTargetEndMs = isLastSeg ? actualEndMs : anchors[a].prevEndMs;

        if (segEndIdx >= segStartIdx) {
          const rawSegStart = base[segStartIdx].offsetMs;
          const lastInSeg = base[segEndIdx];
          const rawSegEnd = Math.max(rawSegStart + 50, lastInSeg.offsetMs + lastInSeg.durationMs);
          const rawSegSpan = rawSegEnd - rawSegStart;
          const targetSegSpan = Math.max(50, segTargetEndMs - segTargetStartMs);
          const segScale = Math.max(0.55, Math.min(1.65, targetSegSpan / rawSegSpan));

          for (let k = segStartIdx; k <= segEndIdx; k++) {
            const rel = base[k].offsetMs - rawSegStart;
            base[k].offsetMs = Math.round(segTargetStartMs + rel * segScale);
            base[k].durationMs = Math.max(40, Math.round(base[k].durationMs * segScale));
          }
        }

        if (!isLastSeg) {
          segStartIdx = anchors[a].wordIdx;
          segTargetStartMs = anchors[a].targetOffsetMs;
        }
      }
    }
  }

  // Step 3: Snap adjacent inter-word boundaries to the deepest local acoustic consonant valley within ±30ms (6 frames)
  for (let i = 1; i < base.length; i++) {
    const prev = base[i - 1];
    const curr = base[i];
    const gap = curr.offsetMs - (prev.offsetMs + prev.durationMs);
    if (gap <= 60) {
      const centerFrame = Math.round(curr.offsetMs / 5);
      const minF = Math.max(Math.round((prev.offsetMs + 35) / 5), centerFrame - 6);
      const maxF = Math.min(
        nFrames - 1,
        Math.round((curr.offsetMs + curr.durationMs - 35) / 5),
        centerFrame + 6
      );
      if (maxF > minF) {
        let bestF = centerFrame;
        let minVal = envelope5ms[Math.min(nFrames - 1, Math.max(0, centerFrame))];
        for (let f = minF; f <= maxF; f++) {
          if (envelope5ms[f] < minVal - 0.015) {
            minVal = envelope5ms[f];
            bestF = f;
          }
        }
        const snappedMs = bestF * 5;
        const shift = snappedMs - curr.offsetMs;
        if (Math.abs(shift) <= 30) {
          curr.offsetMs = snappedMs;
          curr.durationMs = Math.max(40, curr.durationMs - shift);
          if (gap <= 25) {
            prev.durationMs = Math.max(40, snappedMs - prev.offsetMs);
          }
        }
      }
    }
  }

  return base;
}

export function analyzeFrenchPhonemeAt(
  sentence: string,
  rawIdx: number,
  timeMs: number = typeof performance !== 'undefined' ? performance.now() : 0
): {
  currentWord: string;
  mouthOpenness: number;
  viseme: LipViseme;
  eyebrowLift: number;
  smileIntensity: number;
} {
  if (!sentence || rawIdx < 0 || rawIdx >= sentence.length) {
    return {
      currentWord: '',
      mouthOpenness: 0,
      viseme: 'closed',
      eyebrowLift: 0.1,
      smileIntensity: 0.55,
    };
  }

  const idx = Math.max(0, Math.min(sentence.length - 1, Math.floor(rawIdx)));

  // Extract current word around idx
  let start = idx;
  while (start > 0 && !/\s/.test(sentence[start - 1])) start--;
  let end = idx;
  while (end < sentence.length && !/\s/.test(sentence[end])) end++;
  const currentWord = sentence
    .slice(start, end)
    .replace(/[.,;:!?«»"()—\-]/g, '')
    .trim();

  const ch = sentence[idx].toLowerCase();
  const nextCh = (sentence[idx + 1] || '').toLowerCase();
  const pair = ch + nextCh;

  // Calm, poised human syllable pulse (~3.0 syllables/sec)
  const syllablePulse = 0.54 + 0.38 * Math.abs(Math.sin(timeMs * 0.017 + idx * 0.72));

  // Punctuation -> natural breathing pause, gentle warm pedagogical smile
  if (/[.,;:!?—\-()«»"]/.test(ch)) {
    return {
      currentWord,
      mouthOpenness: 0.015,
      viseme: 'closed',
      eyebrowLift: ch === '!' || ch === '?' ? 0.52 : 0.18,
      smileIntensity: 0.76,
    };
  }

  // Space between words -> brief natural lip closure
  if (/\s/.test(ch)) {
    return {
      currentWord,
      mouthOpenness: 0.08,
      viseme: 'narrow',
      eyebrowLift: 0.18,
      smileIntensity: 0.58,
    };
  }

  // Bilabial consonants (M, B, P) -> lips press together clearly
  if (ch === 'm' || ch === 'b' || ch === 'p') {
    return {
      currentWord,
      mouthOpenness: 0.02,
      viseme: 'closed',
      eyebrowLift: 0.22,
      smileIntensity: 0.5,
    };
  }

  // Labiodental / dental / sibilant consonants (F, V, S, Z, J, C)
  if (/[fvszjcç]/.test(ch)) {
    return {
      currentWord,
      mouthOpenness: 0.22 * syllablePulse,
      viseme: 'narrow',
      eyebrowLift: 0.24,
      smileIntensity: 0.58,
    };
  }

  // Rounded French vowel digraphs & vowels (ou, on, au, eau, o, ô, u, û, ù)
  if (pair === 'ou' || pair === 'on' || pair === 'au' || /[oôuùû]/.test(ch)) {
    return {
      currentWord,
      mouthOpenness: Math.min(0.85, 0.58 + 0.22 * syllablePulse),
      viseme: 'round',
      eyebrowLift: 0.48 * syllablePulse,
      smileIntensity: 0.36,
    };
  }

  // Wide open French vowels & nasals (an, en, am, em, oi, a, à, â)
  if (
    pair === 'an' ||
    pair === 'en' ||
    pair === 'am' ||
    pair === 'em' ||
    pair === 'oi' ||
    /[aàâá]/.test(ch)
  ) {
    return {
      currentWord,
      mouthOpenness: Math.min(0.88, 0.62 + 0.2 * syllablePulse),
      viseme: 'wide',
      eyebrowLift: 0.58 * syllablePulse,
      smileIntensity: 0.64,
    };
  }

  // Mid/front smiling vowels (in, ai, ei, eu, e, é, è, ê, i, î, y)
  if (
    pair === 'in' ||
    pair === 'ai' ||
    pair === 'ei' ||
    pair === 'eu' ||
    /[eéèêëiîïy]/.test(ch)
  ) {
    return {
      currentWord,
      mouthOpenness: Math.min(0.82, 0.46 + 0.22 * syllablePulse),
      viseme: 'medium',
      eyebrowLift: 0.42 * syllablePulse,
      smileIntensity: 0.78,
    };
  }

  // Other consonants (t, d, l, r, n, k, g)
  return {
    currentWord,
    mouthOpenness: 0.28 * syllablePulse,
    viseme: 'narrow',
    eyebrowLift: 0.26,
    smileIntensity: 0.54,
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

class SpeechService {
  private audioCtx: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentAnalyser: AnalyserNode | null = null;
  private audioBufferCache = new Map<string, DecodedNeuralEntry>();
  private inFlightFetches = new Map<string, Promise<DecodedNeuralEntry | null>>();
  private listeners: Set<StateListener> = new Set();
  private queue: string[] = [];
  private currentSentenceIndex = 0;
  private currentPlayingId: string | null = null;
  private currentOptions?: {
    speed?: number;
    voice?: string;
    startSentenceIndex?: number;
    forceQueue?: boolean;
    customSentences?: string[];
  };
  private preferredPersona: NeuralVoicePersona = 'denise';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cadenceTimer: number | null = null;
  private lastBoundaryCharIndex = 0;
  private lastBoundaryTime = 0;
  private isCancelled = false;
  private isUnlocked = false;
  private neuralTtsAvailable = true;
  private liveTimeDomainBuffer: Uint8Array = new Uint8Array(256);
  private currentStartTimeCtx = 0;
  private currentPlaybackRate = 1.0;
  private currentEnvelope5ms: Float32Array | null = null;
  private webSpeechOriginMs = 0;
  private webSpeechBoundaries: TtsWordBoundary[] = [];
  private sentenceWorkerListener:
    | ((
        sentence: string,
        wordBoundaries: TtsWordBoundary[],
        emotion?: AvatarEmotion,
        emotionalTags?: TtsEmotionalTag[]
      ) => void)
    | null = null;
  private lastNotifyTimeMs = 0;
  private lastNotifiedSentence = -1;
  private lastNotifiedPlaying = false;
  private lastNotifiedLoading = false;

  private state: SpeechPlaybackState = {
    isPlaying: false,
    isLoading: false,
    currentId: null,
    source: 'none',
    voiceProvider: 'neural-denise-hd',
    currentSentence: 0,
    totalSentences: 0,
    wordProgressPct: 0,
    charIndex: 0,
    currentWord: '',
    mouthOpenness: 0,
    viseme: 'closed',
    eyebrowLift: 0.15,
    headTiltDeg: 0,
    headNodY: 0,
    smileIntensity: 0.55,
    isPauseBetweenWords: false,
    gestureEnergy: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockHandler = () => {
        this.unlockAudio();
        if (this.currentAudioElement && this.currentAudioElement.paused && this.state.isPlaying) {
          this.currentAudioElement.play().catch(() => {});
        }
        if (this.audioCtx && this.audioCtx.state === 'running') {
          window.removeEventListener('click', unlockHandler);
          window.removeEventListener('pointerup', unlockHandler);
          window.removeEventListener('touchend', unlockHandler);
          window.removeEventListener('keydown', unlockHandler);
        }
      };
      window.addEventListener('click', unlockHandler, { passive: true });
      window.addEventListener('pointerup', unlockHandler, { passive: true });
      window.addEventListener('touchend', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });

      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  public setVoicePersona(persona: NeuralVoicePersona) {
    this.preferredPersona = persona;
  }

  public getVoicePersona(): NeuralVoicePersona {
    return this.preferredPersona;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.enrichStateAliases(this.state));
    return () => this.listeners.delete(listener);
  }

  private enrichStateAliases(raw: SpeechPlaybackState): SpeechPlaybackState {
    return {
      ...raw,
      isSpeaking: raw.isPlaying && !raw.isLoading,
      isPreloading: raw.isLoading,
      activeId: raw.currentId,
      wordProgress: raw.wordProgressPct ?? 0,
    };
  }

  private notify(forceImmediate: boolean = true) {
    this.state = this.enrichStateAliases(this.state);
    if (!forceImmediate) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const stateTransition =
        this.state.isPlaying !== this.lastNotifiedPlaying ||
        Boolean(this.state.isLoading) !== this.lastNotifiedLoading ||
        (this.state.currentSentence || 0) !== this.lastNotifiedSentence;
      if (!stateTransition && now - this.lastNotifyTimeMs < 28) {
        return;
      }
      this.lastNotifyTimeMs = now;
    } else {
      this.lastNotifyTimeMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
    this.lastNotifiedPlaying = this.state.isPlaying;
    this.lastNotifiedLoading = Boolean(this.state.isLoading);
    this.lastNotifiedSentence = this.state.currentSentence || 0;
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): SpeechPlaybackState {
    return this.enrichStateAliases(this.state);
  }

  public onSentenceBoundariesLoaded(
    cb: (
      sentence: string,
      wordBoundaries: TtsWordBoundary[],
      emotion?: AvatarEmotion,
      emotionalTags?: TtsEmotionalTag[]
    ) => void
  ) {
    this.sentenceWorkerListener = cb;
  }

  // Zero-lag articulatory clock with +20ms single-frame scanout lead
  // (locks mouth/head articulation to the exact millisecond the vocal audio hits the speakers)
  private getExactAudioStreamElapsedMs(
    nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()
  ): number {
    const ARTICULATORY_LEAD_MS = 20;
    if (this.audioCtx && this.currentSourceNode && this.audioCtx.state === 'running') {
      const elapsedSec = Math.max(0, this.audioCtx.currentTime - this.currentStartTimeCtx);
      return elapsedSec * this.currentPlaybackRate * 1000 + ARTICULATORY_LEAD_MS;
    }
    if (
      this.currentAudioElement &&
      !this.currentAudioElement.paused &&
      !this.currentAudioElement.ended
    ) {
      return Math.max(0, (this.currentAudioElement.currentTime || 0) * 1000 + ARTICULATORY_LEAD_MS);
    }
    if (this.currentUtterance && this.webSpeechOriginMs > 0) {
      return Math.max(0, nowMs - this.webSpeechOriginMs + ARTICULATORY_LEAD_MS);
    }
    return 0;
  }

  // Ultra-fast hardware audio clock & anticipatory 200 Hz RMS sampler for the 60 FPS requestAnimationFrame bridge (< 0.02ms)
  public sampleInstantAudioTelemetry(
    nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()
  ): {
    isSpeaking: boolean;
    streamElapsedMs: number;
    acousticRms: number;
    mouthOpenness: number;
    viseme: LipViseme;
    isPauseBetweenWords: boolean;
    emotion: AvatarEmotion;
  } {
    const st = this.state;
    const hasActiveWebAudio = Boolean(
      this.currentSourceNode && this.audioCtx && this.audioCtx.state === 'running'
    );
    const hasActiveHtmlAudio = Boolean(
      this.currentAudioElement &&
        !this.currentAudioElement.paused &&
        !this.currentAudioElement.ended
    );
    const hasActiveWebSpeech = Boolean(this.currentUtterance && this.webSpeechOriginMs > 0);

    const isSpeaking = Boolean(
      st.isPlaying && !st.isLoading && (hasActiveWebAudio || hasActiveHtmlAudio || hasActiveWebSpeech)
    );
    const activeEmotion: AvatarEmotion = st.emotion || 'pedagogical';
    if (!isSpeaking) {
      return {
        isSpeaking: false,
        streamElapsedMs: 0,
        acousticRms: 0,
        mouthOpenness: 0,
        viseme: 'closed',
        isPauseBetweenWords: true,
        emotion: activeEmotion,
      };
    }

    const streamElapsedMs = this.getExactAudioStreamElapsedMs(nowMs);

    let acousticRms = 0;
    let hasHardwareTelemetry = false;
    // 1. Primary: 5ms (200 Hz) pre-decoded PCM waveform envelope at the exact hardware audio millisecond
    if (this.currentEnvelope5ms && this.currentEnvelope5ms.length > 0 && streamElapsedMs >= 0) {
      hasHardwareTelemetry = true;
      const env = this.currentEnvelope5ms;
      const lastIdx = env.length - 1;
      const exactFrame = streamElapsedMs / 5;
      const idx0 = Math.min(lastIdx, Math.max(0, Math.floor(exactFrame)));
      const idx1 = Math.min(lastIdx, idx0 + 1);
      const frac = exactFrame - idx0;
      const currVal = env[idx0] * (1 - frac) + env[idx1] * frac;
      const lookahead1 = env[Math.min(lastIdx, idx0 + 1)]; // +5ms
      const lookahead2 = env[Math.min(lastIdx, idx0 + 2)]; // +10ms
      if (currVal < 0.022 && lookahead1 < 0.026) {
        acousticRms = 0;
      } else {
        acousticRms = currVal * 0.65 + Math.max(currVal, lookahead1 * 0.92, lookahead2 * 0.82) * 0.35;
      }
    } else if (this.currentAnalyser) {
      // 2. Fallback: Live Web Audio AnalyserNode
      hasHardwareTelemetry = true;
      const fftLen = this.currentAnalyser.fftSize;
      if (this.liveTimeDomainBuffer.length !== fftLen) {
        this.liveTimeDomainBuffer = new Uint8Array(fftLen);
      }
      this.currentAnalyser.getByteTimeDomainData(this.liveTimeDomainBuffer as Uint8Array<ArrayBuffer>);
      let sumSquares = 0;
      for (let i = 0; i < fftLen; i++) {
        const norm = (this.liveTimeDomainBuffer[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / fftLen);
      acousticRms = Math.min(1, rms * 6.0);
    } else {
      // 3. Phoneme-driven acoustic envelope when playing via HTML5 Audio or Web Speech API (e.g. suspended AudioContext or fallback)
      if (!st.isPauseBetweenWords && st.viseme !== 'closed') {
        const baseOpen = st.mouthOpenness ?? 0.68;
        const syllabicWave =
          0.58 +
          Math.sin(nowMs * 0.018) * 0.24 +
          Math.cos(nowMs * 0.012) * 0.16;
        acousticRms = Math.min(0.95, Math.max(0.18, baseOpen * syllabicWave));
      } else {
        acousticRms = 0;
      }
    }

    const isQuietPause = Boolean(
      st.isPauseBetweenWords || (hasHardwareTelemetry && this.currentEnvelope5ms && acousticRms < 0.012)
    );

    return {
      isSpeaking: true,
      streamElapsedMs,
      acousticRms,
      mouthOpenness: isQuietPause ? 0 : st.mouthOpenness ?? 0.72,
      viseme: isQuietPause ? 'closed' : st.viseme || 'open',
      isPauseBetweenWords: isQuietPause,
      emotion: activeEmotion,
    };
  }

  // Zero-latency 60 FPS direct sampler for requestAnimationFrame avatar loops (bypasses React state lag)
  public sampleInstantMouthOpenness(nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()): {
    isSpeaking: boolean;
    mouthOpenness: number;
    viseme: LipViseme;
    isPauseBetweenWords: boolean;
    eyebrowLift: number;
    smileIntensity: number;
  } {
    const st = this.state;
    const isSpeaking = Boolean(st.isPlaying && !st.isLoading);
    if (!isSpeaking) {
      return {
        isSpeaking: false,
        mouthOpenness: 0,
        viseme: 'closed',
        isPauseBetweenWords: true,
        eyebrowLift: 0.14,
        smileIntensity: 0.74,
      };
    }

    // 1. Sample Web Audio AnalyserNode instantaneously on this exact animation frame (0ms delay)
    if (this.currentAnalyser) {
      const fftLen = this.currentAnalyser.fftSize;
      if (this.liveTimeDomainBuffer.length !== fftLen) {
        this.liveTimeDomainBuffer = new Uint8Array(fftLen);
      }
      this.currentAnalyser.getByteTimeDomainData(this.liveTimeDomainBuffer as Uint8Array<ArrayBuffer>);
      let sumSquares = 0;
      for (let i = 0; i < fftLen; i++) {
        const norm = (this.liveTimeDomainBuffer[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / fftLen);
      const instantAcoustic = Math.min(1, rms * 5.4);

      if (instantAcoustic < 0.018 && st.isPauseBetweenWords) {
        return {
          isSpeaking: true,
          mouthOpenness: 0,
          viseme: 'closed',
          isPauseBetweenWords: true,
          eyebrowLift: st.eyebrowLift ?? 0.2,
          smileIntensity: st.smileIntensity ?? 0.76,
        };
      }

      const phonemeOpen = st.mouthOpenness ?? 0.35;
      const combined = Math.min(
        1,
        instantAcoustic > 0.022
          ? instantAcoustic * 0.68 + phonemeOpen * 0.42
          : phonemeOpen * 0.35
      );
      const viseme: LipViseme =
        combined < 0.04 ? 'closed' : st.viseme && st.viseme !== 'closed' ? st.viseme : 'open';

      return {
        isSpeaking: true,
        mouthOpenness: combined,
        viseme,
        isPauseBetweenWords: combined < 0.035,
        eyebrowLift: Math.min(1, (st.eyebrowLift ?? 0.22) * 0.6 + instantAcoustic * 0.45),
        smileIntensity: st.smileIntensity ?? 0.7,
      };
    }

    // 2. Fallback when HTMLAudioElement or WebSpeech is used
    const pulse =
      Math.max(
        0,
        Math.sin(nowMs * 0.022) * 0.55 +
          Math.sin(nowMs * 0.013) * 0.35 +
          Math.cos(nowMs * 0.031) * 0.25
      );
    const open = st.isPauseBetweenWords
      ? 0
      : Math.min(1, (st.mouthOpenness ?? 0.45) * 0.65 + pulse * 0.35);

    return {
      isSpeaking: true,
      mouthOpenness: open,
      viseme: open < 0.04 ? 'closed' : st.viseme || 'open',
      isPauseBetweenWords: Boolean(st.isPauseBetweenWords || open < 0.04),
      eyebrowLift: st.eyebrowLift ?? 0.22,
      smileIntensity: st.smileIntensity ?? 0.7,
    };
  }

  public pause() {
    if (!this.state.isPlaying) return;
    this.clearCadenceTimer();
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
      } catch {}
    } else if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        this.audioCtx.suspend();
      } catch {}
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
    this.state = {
      ...this.state,
      isPlaying: false,
      isPaused: true,
      mouthOpenness: 0,
      viseme: 'closed',
    };
    this.notify();
  }

  public resume() {
    if (!this.state.isPaused) return;
    const savedIdx = this.currentSentenceIndex;
    const savedId = this.currentPlayingId || `msg-${Date.now()}`;
    const savedQueue = [...this.queue];
    const savedOptions = { ...this.currentOptions, startSentenceIndex: savedIdx, customSentences: savedQueue };
    if (savedQueue.length > 0) {
      this.play(savedQueue.join(' '), savedId, savedOptions);
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlockAudio() {
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch {
      // Ignore unlock issues
    }
  }

  public playTone(type: 'ring' | 'chime' | 'hangup') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'ring') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'hangup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Optional tone
    }
  }

  // Authentic Congolese phonetic adaptation for the 26 DRC Provinces, Capitals, Cities & Proper Nouns
  public normalizeCongoleseProperNounsForSpeech(text: string): string {
    return text
      // Prevent any English-accented reading of first names (e.g. "Landry") or English loanwords at the start of sentences
      .replace(/\bLandry\b/gi, 'Landri')
      .replace(/\bstandstill\b/gi, 'délai de suspension')
      .replace(/\be-procurement\b/gi, 'passation numérique')
      .replace(/\bopen\s+data\b/gi, 'données ouvertes')
      .replace(/\bopen\s+contracting\b/gi, 'commande publique ouverte')
      .replace(/\bworkflow\b/gi, 'circuit de validation')
      .replace(/\bcheck-lists?\b/gi, 'liste de vérification')
      .replace(/\bchecklists?\b/gi, 'liste de vérification')
      .replace(/\bplanning\b/gi, 'calendrier')
      .replace(/\breporting\b/gi, 'rapport de suivi')
      .replace(/\bmanagement\b/gi, 'pilotage')
      .replace(/\bquiz\b/gi, 'questionnaire')
      // 1. Compound & Multi-word DRC Provinces (26 Provinces)
      .replace(/\bKongo[\s-]+Central\b/gi, 'Kongo-Central')
      .replace(/\bMa[iï][\s-]+Ndombe\b/gi, 'Maï-Ndombé')
      .replace(/\bKasa[iï][\s-]+Central\b/gi, 'Kassaï-Central')
      .replace(/\bKasa[iï][\s-]+Oriental\b/gi, 'Kassaï-Oriental')
      .replace(/\bHaut[\s-]+Katanga\b/gi, 'Haut-Katanga')
      .replace(/\bHaut[\s-]+Lomami\b/gi, 'Haut-Lomami')
      .replace(/\bHaut[\s-]+U[eé]l[eé]\b/gi, 'Haut-Ouélé')
      .replace(/\bBas[\s-]+U[eé]l[eé]\b/gi, 'Bas-Ouélé')
      .replace(/\bNord[\s-]+Kivu\b/gi, 'Nord-Kivou')
      .replace(/\bSud[\s-]+Kivu\b/gi, 'Sud-Kivou')
      .replace(/\bNord[\s-]+Ubangi\b/gi, 'Nord-Oubangui')
      .replace(/\bSud[\s-]+Ubangi\b/gi, 'Sud-Oubangui')
      // 2. Single-word DRC Provinces & Historic Regions
      .replace(/\bKinshasa\b/gi, 'Kinshasa')
      .replace(/\bKinchassa\b/gi, 'Kinshasa')
      .replace(/\bKasa[iï][\s-]+Vubu\b/gi, 'Kasa-Vubu')
      .replace(/\bKasa[iï]\b/gi, 'Kassaï')
      .replace(/\bKwilu\b/gi, 'Kwilu')
      .replace(/\bKwango\b/gi, 'Kwango')
      .replace(/\bSankuru\b/gi, 'Sankourou')
      .replace(/\bManiema\b/gi, 'Maniéma')
      .replace(/\bIturi\b/gi, 'Itouri')
      .replace(/\bTshopo\b/gi, 'Tshopo')
      .replace(/\bTshuapa\b/gi, 'Tshuapa')
      .replace(/\bLualaba\b/gi, 'Loualaba')
      .replace(/\bLulua\b/gi, 'Louloua')
      .replace(/\bTanganyika\b/gi, 'Tanganyika')
      .replace(/\bMongala\b/gi, 'Mongala')
      .replace(/\bU[eé]l[eé]\b/gi, 'Ouélé')
      .replace(/\bUbangi\b/gi, 'Oubangui')
      .replace(/\bKivu\b/gi, 'Kivou')
      .replace(/\bBandundu\b/gi, 'Bandoundou')
      .replace(/\bKatanga\b/gi, 'Katanga')
      // 3. Provincial Capitals (Chefs-lieux), Major DRC Cities & Communes
      .replace(/\bLubumbashi\b/gi, 'Louboumbachi')
      .replace(/\bKisangani\b/gi, 'Kissangani')
      .replace(/\bBukavu\b/gi, 'Boukavou')
      .replace(/\bMbuji[\s-]+Mayi\b/gi, 'Mbouji-Mayi')
      .replace(/\bKananga\b/gi, 'Kananga')
      .replace(/\bMbandaka\b/gi, 'Mbandaka')
      .replace(/\bMatadi\b/gi, 'Matadi')
      .replace(/\bBoma\b/gi, 'Boma')
      .replace(/\bGoma\b/gi, 'Goma')
      .replace(/\bKolwezi\b/gi, 'Kolouézi')
      .replace(/\bKolwézi\b/gi, 'Kolouézi')
      .replace(/\bLikasi\b/gi, 'Likassi')
      .replace(/\bKipushi\b/gi, 'Kipouchi')
      .replace(/\bKasumbalesa\b/gi, 'Kassoumbaléssa')
      .replace(/\bTshikapa\b/gi, 'Tchikapa')
      .replace(/\bKikwit\b/gi, 'Kikouite')
      .replace(/\bKenge\b/gi, 'Kéngué')
      .replace(/\bInongo\b/gi, 'Inongo')
      .replace(/\bInga\b/gi, 'Inga')
      .replace(/\bBoende\b/gi, 'Boéndé')
      .replace(/\bGemena\b/gi, 'Guéména')
      .replace(/\bGbadolite\b/gi, 'Gbadolité')
      .replace(/\bLisala\b/gi, 'Lissala')
      .replace(/\bBumba\b/gi, 'Boumba')
      .replace(/\bIsiro\b/gi, 'Issiro')
      .replace(/\bBunia\b/gi, 'Bounia')
      .replace(/\bKindu\b/gi, 'Kindou')
      .replace(/\bKindou\b/gi, 'Kindou')
      .replace(/\bKalemie\b/gi, 'Kalémi')
      .replace(/\bKamina\b/gi, 'Kamina')
      .replace(/\bKabinda\b/gi, 'Kabinda')
      .replace(/\bLusambo\b/gi, 'Loussambo')
      .replace(/\bMwene[\s-]+Ditu\b/gi, 'Mouéné-Ditou')
      .replace(/\bMwéné[\s-]+Ditou\b/gi, 'Mouéné-Ditou')
      .replace(/\bUvira\b/gi, 'Ouvira')
      .replace(/\bButembo\b/gi, 'Boutémbo')
      .replace(/\bBeni\b/gi, 'Béni')
      .replace(/\bMuanda\b/gi, 'Mouanda')
      .replace(/\bMoanda\b/gi, 'Mouanda')
      .replace(/\bZongo\b/gi, 'Zongo')
      .replace(/\bKimpese\b/gi, 'Kimpéssé')
      .replace(/\bGombe\b/gi, 'Gombé')
      .replace(/\bLukunga\b/gi, 'Loukounga')
      .replace(/\bFuna\b/gi, 'Founa')
      .replace(/\bTshangu\b/gi, 'Tchangou')
      .replace(/\bMasina\b/gi, 'Massina')
      .replace(/\bLimete\b/gi, 'Limété')
      .replace(/\bNgaliema\b/gi, 'Ngaliéma')
      .replace(/\bKintambo\b/gi, 'Kintambo')
      .replace(/\bBandalungwa\b/gi, 'Bandaloungoua')
      .replace(/\bSelembao\b/gi, 'Sélémbao')
      .replace(/\bKimbanseke\b/gi, 'Kimbanséké')
      .replace(/\bKimbanséké\b/gi, 'Kimbanséké')
      .replace(/\bMaluku\b/gi, 'Maloukou')
      .replace(/\bKalamu\b/gi, 'Kalamou')
      .replace(/\bBarumbu\b/gi, 'Baroumbou')
      .replace(/\bLingwala\b/gi, 'Lingwala')
      .replace(/\bMatete\b/gi, 'Matété')
      .replace(/\bLemba\b/gi, 'Lémba')
      .replace(/\bNsele\b/gi, 'Nsélé')
      .replace(/\bMont[\s-]+Ngafula\b/gi, 'Mont-Ngafoula')
      // 4. Proper Names & Surnames of DRC Practitioners & Historical Figures (pure French phonetics without English 'w')
      .replace(/\bKibakweto\b/gi, 'Kibakouéto')
      .replace(/\bKibakwéto\b/gi, 'Kibakouéto')
      .replace(/\bMukendi\b/gi, 'Moukéndi')
      .replace(/\bKabangu\b/gi, 'Kabangou')
      .replace(/\bIlunga\b/gi, 'Ilounga')
      .replace(/\bKasongo\b/gi, 'Kassongo')
      .replace(/\bMuteba\b/gi, 'Moutéba')
      .replace(/\bTshilomba\b/gi, 'Tchilomba')
      .replace(/\bMwamba\b/gi, 'Mouamba')
      .replace(/\bTshisekedi\b/gi, 'Tchissékédi')
      .replace(/\bLumumba\b/gi, 'Loumoumba')
      .replace(/\bMobutu\b/gi, 'Moboutou')
      .replace(/\bLukonde\b/gi, 'Loukondé')
      .replace(/\bMbuyi\b/gi, 'Mbouyi')
      .replace(/\bTshiamala\b/gi, 'Tchiamala')
      .replace(/\bKabasele\b/gi, 'Kabassélé')
      .replace(/\bLukoji\b/gi, 'Loukodji')
      .replace(/\bLukusa\b/gi, 'Loukoussa')
      .replace(/\bLufungula\b/gi, 'Loufoungoula')
      .replace(/\bMavungu\b/gi, 'Mavoungou')
      .replace(/\bMutombo\b/gi, 'Moutombo')
      .replace(/\bMulumba\b/gi, 'Mouloumba')
      .replace(/\bNgalula\b/gi, 'Ngaloula')
      .replace(/\bMputu\b/gi, 'Mpoutou')
      .replace(/\bKyungu\b/gi, 'Kyoungou')
      .replace(/\bLukwebo\b/gi, 'Loukouébo')
      .replace(/\bLoukwébo\b/gi, 'Loukouébo')
      .replace(/\bSuminwa\b/gi, 'Souminoua')
      .replace(/\bTuluka\b/gi, 'Toulouka')
      .replace(/\bKapend\b/gi, 'Kapénd')
      // 5. General Congolese proper-noun phonetic rule for capitalized Tsh- names
      .replace(/\bTsh([a-zàâéèêëîïôùû]+)/g, 'Tch$1');
  }

  // Transform raw text into warm, natural spoken French (ZERO robotic letter-by-letter spelling or article stuttering!)
  public normalizeForSpeech(raw: string): string {
    return this.normalizeCongoleseProperNounsForSpeech(
      raw
      .replace(/[*#`_>]/g, '')
      .replace(/\|.*\|/g, ' ')
      .replace(/---+/g, ' ')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/💡|✨|⚖️|🏛️|📋|👥|🤝|🎓|📄|📢|🛡️|📦|🔄|🌸|⭐|🇨🇩|📞|🎥|👆|🖍️|🎬|🎙️|🗣️|✓|🧭|🌟|🔑|🌱|🔍|📐|📖/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\r\n/g, '\n')
      // Laws & Decrees (preserve existing article 'la'/'le'/'du' without duplicating it)
      .replace(/\b([Dd]e\s+la|[Àà]\s+la|[Ss]elon\s+la|[Pp]ar\s+la|[Dd]ans\s+la|[Ll]a)\s+Loi\s*(?:n°\s*|numéro\s*)?10\/010\b/gi, '$1 loi dix zéro dix')
      .replace(/\bLoi\s*(?:n°\s*|numéro\s*)?10\/010\b/gi, 'la loi dix zéro dix')
      .replace(/\b([Dd]e\s+la|[Àà]\s+la|[Ss]elon\s+la|[Pp]ar\s+la|[Dd]ans\s+la|[Ll]a)\s+Loi\s*(?:n°\s*|numéro\s*)?17\/001\b/gi, '$1 loi dix-sept zéro zéro un')
      .replace(/\bLoi\s*(?:n°\s*|numéro\s*)?17\/001\b/gi, 'la loi dix-sept zéro zéro un')
      .replace(/\b([Dd]e\s+la|[Àà]\s+la|[Ss]elon\s+la|[Pp]ar\s+la|[Dd]ans\s+la|[Ll]a)\s+Loi\s*(?:n°\s*|numéro\s*)?11\/011\b/gi, '$1 loi onze zéro onze')
      .replace(/\bLoi\s*(?:n°\s*|numéro\s*)?11\/011\b/gi, 'la loi onze zéro onze')
      .replace(/\b(?:l['’]|L['’])?Ordonnance-Loi\s*(?:n°\s*|numéro\s*)?23\/010\b/gi, "l'ordonnance-loi vingt-trois zéro dix")
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+Décret\s*(?:n°\s*|numéro\s*)?10\/21\b/gi, '$1 décret dix vingt et un')
      .replace(/\bDécret\s*(?:n°\s*|numéro\s*)?10\/21\b/gi, 'le décret dix vingt et un')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+Décret\s*(?:n°\s*|numéro\s*)?10\/22\b/gi, '$1 décret dix vingt-deux')
      .replace(/\bDécret\s*(?:n°\s*|numéro\s*)?10\/22\b/gi, 'le décret dix vingt-deux')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+Décret\s*(?:n°\s*|numéro\s*)?10\/23\b/gi, '$1 décret dix vingt-trois')
      .replace(/\bDécret\s*(?:n°\s*|numéro\s*)?10\/23\b/gi, 'le décret dix vingt-trois')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+Décret\s*(?:n°\s*|numéro\s*)?10\/27\b/gi, '$1 décret dix vingt-sept')
      .replace(/\bDécret\s*(?:n°\s*|numéro\s*)?10\/27\b/gi, 'le décret dix vingt-sept')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+Décret\s*(?:n°\s*|numéro\s*)?10\/33\b/gi, '$1 décret dix trente-trois')
      .replace(/\bDécret\s*(?:n°\s*|numéro\s*)?10\/33\b/gi, 'le décret dix trente-trois')
      .replace(/\b10\/010\b/g, 'dix zéro dix')
      .replace(/\b17\/001\b/g, 'dix-sept zéro zéro un')
      .replace(/\b11\/011\b/g, 'onze zéro onze')
      .replace(/\b23\/010\b/g, 'vingt-trois zéro dix')
      .replace(/\b10\/21\b/g, 'dix vingt et un')
      .replace(/\b10\/22\b/g, 'dix vingt-deux')
      .replace(/\b10\/23\b/g, 'dix vingt-trois')
      .replace(/\b10\/27\b/g, 'dix vingt-sept')
      .replace(/\b10\/33\b/g, 'dix trente-trois')
      .replace(/\bArt\.\s*1er\b/gi, 'article premier')
      .replace(/\bArt\.\s*(\d+)/gi, 'article $1')
      .replace(/\bal\.\s*(\d+)/gi, 'alinéa $1')
      .replace(/\bex\.\s*/gi, 'par exemple ')
      .replace(/\bcf\.\s*/gi, 'selon ')
      // Protocol & Precedence Honorific Titles (Préséance administrative RDC)
      .replace(/\bIng\.\s+/g, 'Ingénieur ')
      .replace(/\bPr\.\s+/g, 'Professeur ')
      .replace(/\bDr\.\s+/g, 'Docteur ')
      .replace(/\bMme\.?\s+/g, 'Madame ')
      .replace(/\bM\.\s+/g, 'Monsieur ')
      .replace(/\bMe\s+([A-ZÀÂÉÈÊËÎÏÔÙÛÇ])/g, 'Maître $1')
      .replace(/\bS\.E\.\s+/g, 'Son Excellence ')
      .replace(/\b([Ll]a)\s+DFAT\b/g, "$1 direction de la formation et de l'appui technique")
      .replace(/\bDFAT\b/g, "la direction de la formation et de l'appui technique")
      .replace(/\bMITP\b/g, 'ministère des infrastructures et travaux publics')
      // Institutional & Procurement Acronyms without double-article collisions
      .replace(/\b([Ll]a|[Uu]ne|[Vv]otre|[Ss]a)\s+CGPMP\b/g, '$1 cellule de gestion des marchés publics')
      .replace(/\b([Ll]es|[Dd]es)\s+CGPMP\b/g, '$1 cellules de gestion des marchés publics')
      .replace(/\bCGPMP\b/g, 'la cellule de gestion des marchés publics')
      .replace(/\b([Ll]a)\s+DGCMP\b/g, '$1 direction générale du contrôle')
      .replace(/\b(revue|contrôle|visa)\s+DGCMP\b/gi, '$1 de la direction générale du contrôle')
      .replace(/\bDGCMP\b/g, 'la direction générale du contrôle')
      .replace(/\b(?:l['’]|L['’])\s*ARMP\b/g, "l'autorité de régulation")
      .replace(/\b(portail|dossiers?\s+types?)\s+ARMP\b/gi, "$1 de l'autorité de régulation")
      .replace(/\bARMP\b/g, "l'autorité de régulation")
      .replace(/\b(?:l['’]|L['’])\s*ARSP\b/g, "l'autorité de sous-traitance")
      .replace(/\bARSP\b/g, "l'autorité de sous-traitance")
      .replace(/\b([Dd]u|[Au]u|[Ll]e|[Cc]e|[Vv]otre|[Ss]on|[Uu]n)\s+PPM\b/g, '$1 plan de passation des marchés')
      .replace(/\b([Dd]es|[Ll]es|[Vv]os)\s+PPM\b/g, '$1 plans de passation des marchés')
      .replace(/\bcalendrier\s+PPM\b/gi, 'calendrier du plan de passation')
      .replace(/\bPPM\b/g, 'le plan de passation des marchés')
      .replace(/\b([Dd]u|[Au]u|[Ll]e|[Cc]e|[Vv]otre|[Ss]on|[Uu]n)\s+DAO\b/g, "$1 dossier d'appel d'offres")
      .replace(/\b([Dd]es|[Ll]es|[Vv]os|[Cc]es)\s+DAO\b/g, "$1 dossiers d'appel d'offres")
      .replace(/\bDAO\b/g, "le dossier d'appel d'offres")
      .replace(/\b([Dd]es|[Ll]es|[Cc]es|[Vv]os)\s+DPAO\b/g, "$1 données particulières de l'appel d'offres")
      .replace(/\bDPAO\b/g, "les données particulières de l'appel d'offres")
      .replace(/\b(?:l['’]|L['’])\s*AAO\b/g, "l'avis d'appel d'offres")
      .replace(/\b([Uu]n)\s+AAO\b/g, "$1 avis d'appel d'offres")
      .replace(/\bAAO\b/g, "l'avis d'appel d'offres")
      .replace(/\b(?:l['’]|L['’])\s*ANO\b/g, "l'avis de non-objection")
      .replace(/\b(?:d['’]|D['’])\s*ANO\b/g, "d'avis de non-objection")
      .replace(/\b([Uu]n)\s+ANO\b/g, "$1 avis de non-objection")
      .replace(/\bvisas?\s+ANO\b/gi, 'visa de non-objection')
      .replace(/\bANO\b/g, "l'avis de non-objection")
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+CRD\b/g, '$1 comité de règlement des différends')
      .replace(/\bCRD\b/g, 'le comité de règlement des différends')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+CCAG\b/g, '$1 cahier des clauses administratives générales')
      .replace(/\bCCAG\b/g, 'le cahier des clauses administratives générales')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+CCAP\b/g, '$1 cahier des clauses administratives particulières')
      .replace(/\bCCAP\b/g, 'le cahier des clauses administratives particulières')
      .replace(/\b([Dd]es|[Ll]es|[Vv]os)\s+TDR\b/g, '$1 termes de référence')
      .replace(/\bTDR\b/g, 'les termes de référence')
      .replace(/\b([Dd]u|[Au]u|[Ll]e)\s+SIGMAP\b/g, '$1 système intégré de gestion des marchés publics')
      .replace(/\bSIGMAP\b/g, 'le système intégré de gestion des marchés publics')
      .replace(/\b(?:l['’]|L['’])\s*IGF\b/g, "l'inspection générale des finances")
      .replace(/\bIGF\b/g, "l'inspection générale des finances")
      .replace(/\b([Dd]es|[Ll]es|[Nn]os|[Vv]os|[Cc]es|[Aa]ux)\s+PME\b/g, '$1 petites et moyennes entreprises')
      .replace(/\b([Uu]ne|[Ll]a)\s+PME\b/g, '$1 petite et moyenne entreprise')
      .replace(/\bPME\b/g, 'petites et moyennes entreprises')
      .replace(/\b([Dd]u|[Au]u|[Ll]e|[Uu]n|[Cc]haque)\s+PV\b/g, '$1 procès-verbal')
      .replace(/\b([Dd]es|[Ll]es)\s+PV\b/g, '$1 procès-verbaux')
      .replace(/\bPV\b/g, 'procès-verbal')
      .replace(/\bOCDS\b/g, 'des données ouvertes')
      .replace(/\bCDF\b/g, 'francs congolais')
      .replace(/\bUSD\b/g, 'dollars américains')
      .replace(/\b([Dd]e\s+la|[Àà]\s+la|[Ee]n|[Ll]a)\s+RDC\b/g, '$1 République Démocratique du Congo')
      .replace(/\bRDC\b/g, 'la République Démocratique du Congo')
      .replace(/(\d+)\s*%/g, '$1 pour cent')
      // Preserve natural conversational French punctuation so fr-FR-VivienneMultilingualNeural
      // produces its authentic breath pauses (~180ms on commas, ~400ms between sentences)
      .replace(/\s*\(([^)]+)\)\s*/g, ', $1, ')
      .replace(/\s*[➔→]+\s*/g, ', puis ')
      .replace(/\s*•\s*/g, '. ')
      .replace(/\s*\+\s*/g, ', ainsi que ')
      .replace(/\s*&\s*/g, ' et ')
      .replace(/\s*:\s*([A-ZÀÂÉÈÊËÎÏÔÙÛÇ])/g, (_m, ch) => `, ${ch.toLowerCase()}`)
      .replace(/\s*:\s*/g, ', ')
      .replace(/\s*;\s*/g, ', ')
      .replace(/\s*—\s*/g, ', ')
      .replace(/\.{4,}/g, '...')
      .replace(/\s*,\s*,+/g, ', ')
      .replace(/\s+\./g, '.')
      .replace(/\s+,/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
    );
  }

  public splitIntoSentences(raw: string): string[] {
    const clean = this.normalizeForSpeech(raw);
    if (!clean) return [];

    // Do not split on ellipsis '...' so short greetings or transitions stay connected to their French sentence
    const rawChunks = clean.split(/(?<!\.\.)(?<=[.!?:\n])\s+/);
    const result: string[] = [];

    for (const chunk of rawChunks) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      if (trimmed.length > 180) {
        const subParts = trimmed.split(/(?<=[;,\n—])\s+/);
        let currentBuffer = '';
        for (const part of subParts) {
          if ((currentBuffer + ' ' + part).trim().length > 160) {
            if (currentBuffer.trim()) result.push(currentBuffer.trim());
            currentBuffer = part;
          } else {
            currentBuffer = (currentBuffer + ' ' + part).trim();
          }
        }
        if (currentBuffer.trim()) result.push(currentBuffer.trim());
      } else {
        result.push(trimmed);
      }
    }

    // Merge any short opening fragment (< 50 chars) with the following sentence so the neural voice has full French context
    if (result.length >= 2 && result[0].length < 50) {
      result[1] = `${result[0]} ${result[1]}`.trim();
      result.shift();
    }

    return result.length > 0 ? result : [clean];
  }

  private getBestFrenchVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const frVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('fr') || v.lang.toLowerCase().includes('fr-fr') || v.lang.toLowerCase().includes('fr_fr')
    );
    if (frVoices.length === 0) return null;

    const pool = frVoices;

    const naturalFemininePriority = [
      'vivienne',
      'denise',
      'eloise',
      'charline',
      'ariane',
      'brigitte',
      'céleste',
      'celeste',
      'amélie',
      'amelie',
      'audrey',
      'aurélie',
      'aurelie',
      'hortense',
      'julie',
      'marie',
      'céline',
      'celine',
      'léa',
      'lea',
      'chloé',
      'chloe',
      'google français',
      'français',
      'french',
    ];

    for (const keyword of naturalFemininePriority) {
      const match = pool.find((v) => v.name.toLowerCase().includes(keyword));
      if (match) return match;
    }

    const frFR = pool.find((v) => v.lang === 'fr-FR' || v.lang === 'fr_FR');
    if (frFR) return frFR;

    return pool[0] || null;
  }

  private clearCadenceTimer() {
    if (this.cadenceTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.cadenceTimer);
      this.cadenceTimer = null;
    }
  }

  // Real-Time Millisecond Word-Boundary + Web Audio AnalyserNode Facial & Gestural Tracker
  private startAudioBufferTracker(
    sentence: string,
    startTimeCtx: number,
    effectiveDurationSec: number,
    playbackRate: number,
    analyser: AnalyserNode | null,
    wordBoundaries: TtsWordBoundary[],
    emotionalTags?: TtsEmotionalTag[],
    emotionOverride?: AvatarEmotion
  ) {
    this.clearCadenceTimer();
    if (typeof window === 'undefined' || !sentence) return;

    this.currentStartTimeCtx = startTimeCtx;
    this.currentPlaybackRate = playbackRate;
    const detectedEmotion = emotionOverride || detectSentenceEmotion(sentence);
    if (this.sentenceWorkerListener) {
      this.sentenceWorkerListener(sentence, wordBoundaries || [], detectedEmotion, emotionalTags);
    }

    const timeDomainData = analyser ? new Uint8Array(analyser.fftSize) : null;

    this.cadenceTimer = window.setInterval(() => {
      if (this.isCancelled || !this.state.isPlaying || !this.audioCtx) {
        this.clearCadenceTimer();
        return;
      }

      const nowMs = performance.now();
      const streamElapsedMs = this.getExactAudioStreamElapsedMs(nowMs);
      const totalAudioMs = effectiveDurationSec * playbackRate * 1000;
      const lastWb =
        wordBoundaries && wordBoundaries.length > 0
          ? wordBoundaries[wordBoundaries.length - 1]
          : undefined;
      // Actual audible speech span: reaches end smoothly with sentence cadence
      const speechSpanMs = lastWb
        ? Math.max(lastWb.offsetMs + lastWb.durationMs + 120, totalAudioMs * 0.96)
        : Math.max(400, totalAudioMs);

      // Exact 1:1 audio progress without artificial lead forward offset
      const audioTimeRatio = Math.min(
        1,
        Math.max(0, streamElapsedMs / Math.max(250, speechSpanMs))
      );

      // 1. Measure real acoustic energy from 5ms PCM envelope or Web Audio AnalyserNode
      let boostedRms = 0;
      if (this.currentEnvelope5ms && this.currentEnvelope5ms.length > 0) {
        const idx = Math.min(
          this.currentEnvelope5ms.length - 1,
          Math.max(0, Math.floor(streamElapsedMs / 5))
        );
        boostedRms = this.currentEnvelope5ms[idx] || 0;
      } else if (analyser && timeDomainData) {
        analyser.getByteTimeDomainData(timeDomainData);
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const normalized = (timeDomainData[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        boostedRms = Math.min(1, rms * 5.2);
      }

      // 2. High-precision Word-Boundary Lookup locked to audio time
      let activeWord = '';
      let mouthOpenness = 0;
      let viseme: LipViseme = 'closed';
      let isPauseBetweenWords = false;
      let leadCharIdx = Math.min(
        sentence.length - 1,
        Math.max(0, Math.floor(audioTimeRatio * sentence.length))
      );
      let leadRatio = audioTimeRatio;

      if (wordBoundaries && wordBoundaries.length > 0) {
        let currentWb: TtsWordBoundary | undefined;
        let prevWb: TtsWordBoundary | undefined;
        let nextWb: TtsWordBoundary | undefined;

        for (let i = 0; i < wordBoundaries.length; i++) {
          const wb = wordBoundaries[i];
          if (streamElapsedMs >= wb.offsetMs) {
            prevWb = wb;
          }
          if (
            !currentWb &&
            streamElapsedMs >= wb.offsetMs - 22 &&
            streamElapsedMs <= wb.offsetMs + wb.durationMs + 32
          ) {
            currentWb = wb;
          }
          if (wb.offsetMs > streamElapsedMs && !nextWb) {
            nextWb = wb;
          }
        }

        const phoneme = analyzeFrenchPhonemeAt(sentence, leadCharIdx, streamElapsedMs);
        const gapToNextMs = nextWb && prevWb ? nextWb.offsetMs - (prevWb.offsetMs + prevWb.durationMs) : 999;
        const isShortIntraPhraseGap = !currentWb && prevWb && nextWb && gapToNextMs < 180 && boostedRms > 0.012;

        if (currentWb && boostedRms > 0.012) {
          activeWord = currentWb.text;
          const phonemeScale = phoneme.viseme === 'closed' ? 0.0 : (phoneme.mouthOpenness || 0.65);
          mouthOpenness = Math.min(1, Math.max(0.16, boostedRms * 0.82 + 0.14) * (0.35 + phonemeScale * 0.65));
          viseme = phoneme.viseme || (mouthOpenness < 0.04 ? 'closed' : 'open');
          isPauseBetweenWords = false;
        } else if (isShortIntraPhraseGap && prevWb) {
          // Coarticulated liaison / breathing continuation between close words
          activeWord = prevWb.text;
          mouthOpenness = Math.max(0.14, boostedRms * 0.65);
          viseme = phoneme.viseme !== 'closed' ? phoneme.viseme : 'narrow';
          isPauseBetweenWords = false;
        } else {
          isPauseBetweenWords = true;
          activeWord = prevWb ? prevWb.text : wordBoundaries[0].text;
          mouthOpenness = 0.0;
          viseme = 'closed';
        }

        const activeWb = currentWb || prevWb || wordBoundaries[0];
        if (activeWb) {
          const wProg = Math.max(
            0,
            Math.min(1, (streamElapsedMs - activeWb.offsetMs) / Math.max(40, activeWb.durationMs))
          );
          const wbCharIdx = Math.min(
            sentence.length - 1,
            Math.floor(activeWb.charIndex + wProg * activeWb.text.length)
          );
          const totalTrackedChars = lastWb
            ? Math.max(1, Math.min(sentence.length, lastWb.charIndex + lastWb.text.length))
            : Math.max(1, sentence.length);
          const charRatio = Math.min(1, Math.max(0, wbCharIdx / totalTrackedChars));
          // Exactly balanced 1:1 timeline synchronization between voice and visual writing
          leadRatio = Math.min(
            1,
            Math.max(0, audioTimeRatio * 0.5 + charRatio * 0.5)
          );
          leadCharIdx = Math.min(
            sentence.length - 1,
            Math.max(0, Math.floor(leadRatio * sentence.length))
          );
        }
      } else {
        mouthOpenness = boostedRms > 0.025 ? Math.min(1, boostedRms * 0.9 + 0.15) : 0.0;
        viseme = mouthOpenness < 0.05 ? 'closed' : 'open';
      }

      const prevMouth = this.state.mouthOpenness || 0;
      const smoothedMouth =
        mouthOpenness > prevMouth
          ? prevMouth * 0.12 + mouthOpenness * 0.88
          : prevMouth * 0.22 + mouthOpenness * 0.78;

      this.state = {
        ...this.state,
        charIndex: leadCharIdx,
        wordProgressPct: Math.min(100, Math.round(leadRatio * 100)),
        currentWord: activeWord,
        mouthOpenness: smoothedMouth,
        viseme,
        isPauseBetweenWords,
        gestureEnergy: Math.min(1, smoothedMouth * 0.55 + boostedRms * 0.25),
      };
      this.notify(false);
    }, 24);
  }

  // Fallback Cadence Tracker for Web Speech API
  private startWebSpeechCadenceTracker(sentence: string, effectiveRate: number) {
    this.clearCadenceTimer();
    if (typeof window === 'undefined' || !sentence) return;

    this.lastBoundaryCharIndex = 0;
    this.lastBoundaryTime = performance.now();
    this.webSpeechOriginMs = this.lastBoundaryTime;

    const charsPerMs = (19.5 * Math.max(0.85, Math.min(1.6, effectiveRate))) / 1000;
    const estDurationMs = Math.max(600, Math.round(sentence.length / charsPerMs));
    this.webSpeechBoundaries = buildClientEstimatedBoundaries(sentence, estDurationMs);
    const detectedEmo = detectSentenceEmotion(sentence);
    const extractedTags = extractTtsEmotionalTags(sentence, this.webSpeechBoundaries, detectedEmo);
    if (this.sentenceWorkerListener) {
      this.sentenceWorkerListener(
        sentence,
        this.webSpeechBoundaries,
        detectedEmo,
        extractedTags
      );
    }
    const leadChars = Math.max(3, Math.round(sentence.length * 0.06));

    this.cadenceTimer = window.setInterval(() => {
      if (this.isCancelled || !this.state.isPlaying) {
        this.clearCadenceTimer();
        return;
      }

      const now = performance.now();
      const elapsedSinceBoundary = Math.max(0, now - this.lastBoundaryTime);
      const advancedChars = Math.floor(elapsedSinceBoundary * charsPerMs);
      const rawIdx = Math.min(
        Math.max(0, sentence.length - 1),
        this.lastBoundaryCharIndex + advancedChars
      );
      const leadIdx = Math.min(Math.max(0, sentence.length - 1), rawIdx + leadChars);

      const pct = Math.min(
        99,
        Math.max(0, Math.round((leadIdx / Math.max(1, sentence.length)) * 100))
      );
      const phoneme = analyzeFrenchPhonemeAt(sentence, rawIdx, now);

      this.state = {
        ...this.state,
        charIndex: leadIdx,
        wordProgressPct: pct,
        currentWord: phoneme.currentWord,
        mouthOpenness: phoneme.mouthOpenness,
        viseme: phoneme.viseme,
        eyebrowLift: phoneme.eyebrowLift,
        headTiltDeg: Math.sin(now * 0.0028) * 2.0,
        headNodY: phoneme.mouthOpenness * 2.5,
        smileIntensity: phoneme.smileIntensity,
        isPauseBetweenWords: phoneme.viseme === 'closed',
        gestureEnergy: phoneme.mouthOpenness * 0.8,
      };
      this.notify();
    }, 32);
  }

  // Fetch & decode Expressive Neural TTS AudioBuffer + Exact Millisecond WordBoundaries
  private async fetchNeuralAudioBuffer(
    sentence: string,
    voice: string = this.preferredPersona,
    timeoutMs: number = 18000
  ): Promise<DecodedNeuralEntry | null> {
    if (!this.neuralTtsAvailable || !sentence.trim()) return null;
    const cacheKey = `aisha_human_voice_v3::${voice}::${sentence}`;
    const cached = this.audioBufferCache.get(cacheKey);
    if (cached) return cached;

    const existingPromise = this.inFlightFetches.get(cacheKey);
    if (existingPromise) return existingPromise;

    const fetchPromise = (async (): Promise<DecodedNeuralEntry | null> => {
      try {
        // Long backoff ladder (~27s total): the API server is restarted by the
        // platform between turns, and users hit speak() right when it is down.
        // Without this, ONE fast failure drops the whole reply to robotic
        // web-speech — the #1 source of "the voice isn't always human".
        // Server down = instant connection error, so the ladder waits ~27s of
        // pure retry; server up but slow = each attempt allows up to
        // timeoutMs for ElevenLabs + edge to answer.
        const NEURAL_BACKOFF_MS = [400, 800, 1600, 3200, 5000, 5000, 5000, 5000];
        for (let attempt = 0; attempt <= NEURAL_BACKOFF_MS.length; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch('/api/ai/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: sentence,
                voice,
                emotion: detectSentenceEmotion(sentence),
              }),
              signal: controller.signal,
            });
            window.clearTimeout(timeoutId);

            if (response.ok && response.status !== 204) {
              const data = await response.json();
              if (data?.audioData) {
                const mimeType = data.mimeType || 'audio/mpeg';
                const audioDataUrl = `data:${mimeType};base64,${data.audioData}`;
                let decoded: AudioBuffer | null = null;

                try {
                  const rawBuf = base64ToArrayBuffer(data.audioData);
                  const ctx = this.getAudioContext();
                  if (ctx && ctx.state === 'running') {
                    decoded = await ctx.decodeAudioData(rawBuf.slice(0));
                  }
                  if (!decoded && typeof window !== 'undefined') {
                    const OfflineCtx =
                      window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
                    if (OfflineCtx) {
                      const offline = new OfflineCtx(1, 1, 24000);
                      decoded = await offline.decodeAudioData(rawBuf.slice(0));
                    } else if (ctx) {
                      decoded = await ctx.decodeAudioData(rawBuf.slice(0));
                    }
                  }
                } catch {
                  decoded = null;
                }

                const env5ms = decoded ? computeAudioBufferEnvelope5ms(decoded) : null;
                const calibratedBoundaries = calibrateWordBoundariesToEnvelope(
                  sentence,
                  Array.isArray(data.wordBoundaries) ? data.wordBoundaries : [],
                  env5ms,
                  decoded ? decoded.duration * 1000 : undefined
                );
                const resolvedEmotion: AvatarEmotion =
                  (data.emotion as AvatarEmotion) || detectSentenceEmotion(sentence);
                const calibratedTags = reanchorEmotionalTagsToBoundaries(
                  Array.isArray(data.emotionalTags) ? data.emotionalTags : [],
                  calibratedBoundaries,
                  sentence,
                  resolvedEmotion
                );

                const entry: DecodedNeuralEntry = {
                  audioBuffer: decoded,
                  envelope5ms: env5ms,
                  audioDataUrl,
                  wordBoundaries: calibratedBoundaries,
                  emotionalTags: calibratedTags,
                  emotion: resolvedEmotion,
                  provider: data.provider || 'neural-vivienne-hd',
                };
                this.audioBufferCache.set(cacheKey, entry);
                return entry;
              }
            }
          } catch {
            // Transient fetch hiccup, retry once
          }
          if (attempt < NEURAL_BACKOFF_MS.length) {
            await new Promise((r) => window.setTimeout(r, NEURAL_BACKOFF_MS[attempt]));
          }
        }
        return null;
      } finally {
        this.inFlightFetches.delete(cacheKey);
      }
    })();

    this.inFlightFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  // Pre-warm lesson sentences sequentially: Sentence 1 gets 100% priority first, then Sentences 2..5
  public prewarmSentences(rawSentences: string[], voice?: string) {
    if (typeof window === 'undefined' || !Array.isArray(rawSentences) || rawSentences.length === 0) {
      return;
    }
    const targetVoice = voice || this.preferredPersona;
    const normalized = rawSentences.map((s) => this.normalizeForSpeech(s)).filter(Boolean);
    if (normalized.length === 0) return;

    (async () => {
      // 1. Fetch & decode Sentence 1 FIRST with zero competition so the opening of the lesson is instant & pure Vivienne HD
      await this.fetchNeuralAudioBuffer(normalized[0], targetVoice, 18000);

      // 2. Then prewarm remaining sentences sequentially on server and client
      if (normalized.length > 1) {
        fetch('/api/ai/tts/prewarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentences: normalized.slice(1), voice: targetVoice }),
        }).catch(() => {});
        await this.fetchNeuralAudioBuffer(normalized[1], targetVoice, 18000);
      }
    })();
  }

  public stop() {
    this.isCancelled = true;
    this.clearCadenceTimer();
    this.queue = [];
    this.currentSentenceIndex = 0;
    this.currentUtterance = null;
    this.currentEnvelope5ms = null;
    this.webSpeechOriginMs = 0;
    this.webSpeechBoundaries = [];
    delete (window as any).__academiaActiveUtterance;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.onended = null;
        this.currentAudioElement.onerror = null;
        this.currentAudioElement.pause();
        this.currentAudioElement.src = '';
      } catch {}
      this.currentAudioElement = null;
    }

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.onended = null;
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {}
      this.currentSourceNode = null;
    }

    if (this.currentAnalyser) {
      try {
        this.currentAnalyser.disconnect();
      } catch {}
      this.currentAnalyser = null;
    }

    this.state = {
      isPlaying: false,
      isLoading: false,
      currentId: null,
      source: 'none',
      voiceProvider: 'neural-vivienne-hd',
      currentSentence: 0,
      totalSentences: 0,
      wordProgressPct: 0,
      charIndex: 0,
      currentWord: '',
      mouthOpenness: 0,
      viseme: 'closed',
      eyebrowLift: 0.15,
      headTiltDeg: 0,
      headNodY: 0,
      smileIntensity: 0.55,
      isPauseBetweenWords: false,
      gestureEnergy: 0,
    };
    this.notify();
  }

  public async play(
    text: string,
    id: string = `msg-${Date.now()}`,
    options?: {
      speed?: number;
      voice?: string;
      startSentenceIndex?: number;
      forceQueue?: boolean;
      customSentences?: string[];
    }
  ) {
    this.unlockAudio();

    if (
      this.state.isPlaying &&
      this.state.currentId === id &&
      options?.startSentenceIndex === undefined
    ) {
      this.stop();
      return;
    }

    this.stop();
    this.isCancelled = false;

    const sentences =
      options?.customSentences && options.customSentences.length > 0
        ? options.customSentences.map((s) => this.normalizeForSpeech(s)).filter(Boolean)
        : this.splitIntoSentences(text);
    if (sentences.length === 0) return;

    const startIdx = Math.max(
      0,
      Math.min(sentences.length - 1, options?.startSentenceIndex ?? 0)
    );
    this.queue = sentences;
    this.currentSentenceIndex = startIdx;
    this.currentPlayingId = id;
    this.currentOptions = { ...options, speed: options?.speed ?? 0.90 };

    const firstPhoneme = analyzeFrenchPhonemeAt(sentences[startIdx], 0);
    const firstEmotion = detectSentenceEmotion(sentences[startIdx]);
    this.state = {
      isPlaying: true,
      isLoading: false,
      currentId: id,
      textSnippet: sentences[startIdx].slice(0, 60),
      currentSentenceText: sentences[startIdx],
      source: this.neuralTtsAvailable ? 'gemini-tts' : 'web-speech',
      voiceProvider: 'neural-vivienne-hd',
      currentSentence: startIdx + 1,
      totalSentences: sentences.length,
      wordProgressPct: 0,
      charIndex: 0,
      currentWord: firstPhoneme.currentWord,
      mouthOpenness: firstPhoneme.mouthOpenness,
      viseme: firstPhoneme.viseme,
      emotion: firstEmotion,
      emotionLabel: EMOTION_LABELS[firstEmotion],
      eyebrowLift: firstPhoneme.eyebrowLift,
      headTiltDeg: 0,
      headNodY: 0,
      smileIntensity: firstPhoneme.smileIntensity,
      isPauseBetweenWords: false,
      gestureEnergy: 0.3,
    };
    this.notify();

    await this.playNextInQueue();
  }

  private async playNextInQueue() {
    if (this.isCancelled) {
      this.stop();
      return;
    }

    if (this.currentSentenceIndex >= this.queue.length) {
      this.stop();
      return;
    }

    const sentenceIdx = this.currentSentenceIndex;
    const sentence = this.queue[sentenceIdx];
    const voiceName = this.currentOptions?.voice || this.preferredPersona;
    const userSpeed = this.currentOptions?.speed ?? 0.90;

    // 1. Primary: Human French Neural Voice (fr-FR-DeniseNeural / Prof. Aïsha)
    if (this.neuralTtsAvailable) {
      const cacheKey = `aisha_human_voice_v3::${voiceName}::${sentence}`;
      if (!this.audioBufferCache.has(cacheKey)) {
        this.state = {
          ...this.state,
          isPlaying: true,
          isLoading: true,
          currentId: this.currentPlayingId,
          currentSentence: sentenceIdx + 1,
          totalSentences: this.queue.length,
          wordProgressPct: 0,
          mouthOpenness: 0,
          viseme: 'closed',
        };
        this.notify();
      }
      const neuralEntry = await this.fetchNeuralAudioBuffer(sentence, voiceName, 18000);
      if (this.isCancelled || this.currentSentenceIndex !== sentenceIdx) return;

      // Now that the current sentence is ready, pre-fetch the next sentences in the background
      if (sentenceIdx + 1 < this.queue.length) {
        this.fetchNeuralAudioBuffer(this.queue[sentenceIdx + 1], voiceName, 18000);
        if (sentenceIdx + 2 < this.queue.length) {
          this.fetchNeuralAudioBuffer(this.queue[sentenceIdx + 2], voiceName, 18000);
        }
      }

      if (neuralEntry) {
        const ctx = this.getAudioContext();
        // Natural, serene & calm pedagogical playback rate matching composed French delivery
        const sentenceEmotion = neuralEntry.emotion || detectSentenceEmotion(sentence);
        const playbackRate = Math.max(0.82, Math.min(1.04, userSpeed * 0.96));
        let { audioBuffer, audioDataUrl, wordBoundaries, emotionalTags, provider } = neuralEntry;

        if (ctx && ctx.state === 'suspended') {
          await Promise.race([
            ctx.resume().catch(() => {}),
            new Promise((resolve) => window.setTimeout(resolve, 160)),
          ]);
        }

        // If audioBuffer was not yet decoded when AudioContext was suspended, decode it now
        if (!audioBuffer && ctx && audioDataUrl) {
          try {
            const b64 = audioDataUrl.split(',')[1];
            if (b64) {
              audioBuffer = await ctx.decodeAudioData(base64ToArrayBuffer(b64));
              neuralEntry.audioBuffer = audioBuffer;
              neuralEntry.envelope5ms = computeAudioBufferEnvelope5ms(audioBuffer);
              neuralEntry.wordBoundaries = calibrateWordBoundariesToEnvelope(
                sentence,
                wordBoundaries || [],
                neuralEntry.envelope5ms,
                audioBuffer.duration * 1000
              );
              wordBoundaries = neuralEntry.wordBoundaries;
              emotionalTags = reanchorEmotionalTagsToBoundaries(
                emotionalTags || [],
                wordBoundaries,
                sentence,
                sentenceEmotion
              );
              neuralEntry.emotionalTags = emotionalTags;
            }
          } catch {}
        }
        this.currentEnvelope5ms = neuralEntry.envelope5ms || null;
        if (!wordBoundaries || wordBoundaries.length === 0) {
          wordBoundaries = calibrateWordBoundariesToEnvelope(
            sentence,
            [],
            this.currentEnvelope5ms,
            audioBuffer ? audioBuffer.duration * 1000 : undefined
          );
          neuralEntry.wordBoundaries = wordBoundaries;
        }
        if (!emotionalTags || emotionalTags.length === 0) {
          emotionalTags = extractTtsEmotionalTags(sentence, wordBoundaries, sentenceEmotion);
          neuralEntry.emotionalTags = emotionalTags;
        }

        // Path 1A: Web Audio API with Natural Broadcast Condenser Microphone Warmth & De-Harshing EQ
        if (ctx && ctx.state === 'running' && audioBuffer) {
          try {
            const sourceNode = ctx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.playbackRate.value = playbackRate;
            this.currentPlaybackRate = playbackRate;

            // 1. Transparent Studio Condenser Warmth (195 Hz) preserving VivienneMultilingualNeural's natural timbre
            const warmthFilter = ctx.createBiquadFilter();
            warmthFilter.type = 'peaking';
            warmthFilter.frequency.value = 195;
            warmthFilter.Q.value = 0.8;
            warmthFilter.gain.value = 0.5;

            // 2. Natural Articulatory Presence (2800 Hz)
            const presenceFilter = ctx.createBiquadFilter();
            presenceFilter.type = 'peaking';
            presenceFilter.frequency.value = 2800;
            presenceFilter.Q.value = 0.85;
            presenceFilter.gain.value = 0.4;

            // 3. Full-Bandwidth Studio Air (14000 Hz)
            const deHarshFilter = ctx.createBiquadFilter();
            deHarshFilter.type = 'lowpass';
            deHarshFilter.frequency.value = 14000;
            deHarshFilter.Q.value = 0.7;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.14;

            const gainNode = ctx.createGain();
            gainNode.gain.value = 1.08;

            sourceNode.connect(warmthFilter);
            warmthFilter.connect(presenceFilter);
            presenceFilter.connect(deHarshFilter);
            deHarshFilter.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(ctx.destination);

            this.currentSourceNode = sourceNode;
            this.currentAnalyser = analyser;

            const effectiveDuration = audioBuffer.duration / playbackRate;
            const initialPhoneme = analyzeFrenchPhonemeAt(sentence, 0);
            this.state = {
              isPlaying: true,
              isLoading: false,
              currentId: this.currentPlayingId,
              textSnippet: sentence.slice(0, 60),
              currentSentenceText: sentence,
              source: 'gemini-tts',
              voiceProvider: provider,
              currentSentence: sentenceIdx + 1,
              totalSentences: this.queue.length,
              wordProgressPct: 0,
              charIndex: 0,
              currentWord: wordBoundaries[0]?.text || initialPhoneme.currentWord,
              mouthOpenness: 0,
              viseme: 'closed',
              emotion: sentenceEmotion,
              emotionLabel: EMOTION_LABELS[sentenceEmotion],
              eyebrowLift: initialPhoneme.eyebrowLift,
              headTiltDeg: 0,
              headNodY: 0,
              smileIntensity: initialPhoneme.smileIntensity,
              isPauseBetweenWords: false,
              gestureEnergy: 0.4,
            };
            this.notify();

            sourceNode.onended = () => {
              if (this.isCancelled || this.currentSourceNode !== sourceNode) return;
              this.clearCadenceTimer();
              this.currentSourceNode = null;
              this.currentAnalyser = null;
              this.currentEnvelope5ms = null;
              this.state = {
                ...this.state,
                wordProgressPct: 100,
                mouthOpenness: 0,
                viseme: 'closed',
                smileIntensity: 0.78,
                isPauseBetweenWords: true,
              };
              this.notify();
              window.setTimeout(() => {
                if (this.isCancelled) return;
                this.currentSentenceIndex++;
                this.playNextInQueue();
              }, 650);
            };

            const exactStartAt = ctx.currentTime;
            sourceNode.start(exactStartAt);
            this.startAudioBufferTracker(
              sentence,
              exactStartAt,
              effectiveDuration,
              playbackRate,
              analyser,
              wordBoundaries,
              emotionalTags,
              sentenceEmotion
            );
            return;
          } catch (err) {
            console.warn('[Speech] WebAudio playback fallback to HTMLAudioElement:', err);
          }
        }

        // Path 1B: HTML5 Audio Element for Neural MP3 (works even if WebAudio was suspended!)
        if (audioDataUrl) {
          try {
            const audioEl = new Audio(audioDataUrl);
            (audioEl as any).preservesPitch = true;
            (audioEl as any).mozPreservesPitch = true;
            (audioEl as any).webkitPreservesPitch = true;
            audioEl.playbackRate = playbackRate;
            this.currentPlaybackRate = playbackRate;
            this.currentAudioElement = audioEl;

            const estimatedDuration =
              audioBuffer?.duration
                ? audioBuffer.duration / playbackRate
                : Math.max(
                    2.0,
                    ((wordBoundaries[wordBoundaries.length - 1]?.offsetMs || 4000) + 500) /
                      1000 /
                      playbackRate
                  );

            const initialPhoneme = analyzeFrenchPhonemeAt(sentence, 0);
            this.state = {
              isPlaying: true,
              isLoading: false,
              currentId: this.currentPlayingId,
              textSnippet: sentence.slice(0, 60),
              currentSentenceText: sentence,
              source: 'gemini-tts',
              voiceProvider: provider,
              currentSentence: sentenceIdx + 1,
              totalSentences: this.queue.length,
              wordProgressPct: 0,
              charIndex: 0,
              currentWord: wordBoundaries[0]?.text || initialPhoneme.currentWord,
              mouthOpenness: initialPhoneme.mouthOpenness,
              viseme: initialPhoneme.viseme,
              emotion: sentenceEmotion,
              emotionLabel: EMOTION_LABELS[sentenceEmotion],
              eyebrowLift: initialPhoneme.eyebrowLift,
              headTiltDeg: 0,
              headNodY: 0,
              smileIntensity: initialPhoneme.smileIntensity,
              isPauseBetweenWords: false,
              gestureEnergy: 0.4,
            };
            this.notify();

            // Track HTMLAudioElement currentTime with WordBoundaries, Emotion & Emotional Tags
            if (this.sentenceWorkerListener) {
              this.sentenceWorkerListener(
                sentence,
                wordBoundaries || [],
                sentenceEmotion,
                emotionalTags
              );
            }
            this.clearCadenceTimer();
            this.cadenceTimer = window.setInterval(() => {
              if (this.isCancelled || !this.state.isPlaying || this.currentAudioElement !== audioEl) {
                this.clearCadenceTimer();
                return;
              }
              const streamElapsedMs = Math.max(0, (audioEl.currentTime || 0) * 1000);
              const totalAudioMs = (audioEl.duration || estimatedDuration) * 1000;
              const lastWb =
                wordBoundaries && wordBoundaries.length > 0
                  ? wordBoundaries[wordBoundaries.length - 1]
                  : undefined;
              const speechSpanMs = lastWb
                ? Math.max(lastWb.offsetMs + lastWb.durationMs + 120, totalAudioMs * 0.96)
                : Math.max(400, totalAudioMs);
              const audioTimeRatio = Math.min(
                1,
                Math.max(0, streamElapsedMs / Math.max(250, speechSpanMs))
              );

              let activeWord = '';
              let isPauseBetweenWords = false;
              let leadCharIdx = Math.min(
                sentence.length - 1,
                Math.max(0, Math.floor(audioTimeRatio * sentence.length))
              );
              let leadRatio = audioTimeRatio;

              if (wordBoundaries.length > 0) {
                let currentWb: TtsWordBoundary | undefined;
                let prevWb: TtsWordBoundary | undefined;
                for (let i = 0; i < wordBoundaries.length; i++) {
                  const wb = wordBoundaries[i];
                  if (streamElapsedMs >= wb.offsetMs) prevWb = wb;
                  if (
                    !currentWb &&
                    streamElapsedMs >= wb.offsetMs - 25 &&
                    streamElapsedMs <= wb.offsetMs + wb.durationMs + 45
                  ) {
                    currentWb = wb;
                  }
                }
                if (currentWb) {
                  activeWord = currentWb.text;
                } else {
                  isPauseBetweenWords = true;
                  activeWord = prevWb ? prevWb.text : wordBoundaries[0].text;
                }

                const activeWb = currentWb || prevWb || wordBoundaries[0];
                if (activeWb) {
                  const wProg = Math.max(
                    0,
                    Math.min(1, (streamElapsedMs - activeWb.offsetMs) / Math.max(40, activeWb.durationMs))
                  );
                  const wbCharIdx = Math.min(
                    sentence.length - 1,
                    Math.floor(activeWb.charIndex + wProg * activeWb.text.length)
                  );
                  const totalTrackedChars = lastWb
                    ? Math.max(1, Math.min(sentence.length, lastWb.charIndex + lastWb.text.length))
                    : Math.max(1, sentence.length);
                  const charRatio = Math.min(
                    1,
                    Math.max(0, wbCharIdx / totalTrackedChars)
                  );
                  leadRatio = Math.min(
                    1,
                    Math.max(0, audioTimeRatio * 0.5 + charRatio * 0.5)
                  );
                  leadCharIdx = Math.min(
                    sentence.length - 1,
                    Math.max(0, Math.floor(leadRatio * sentence.length))
                  );
                }
              }

              const phoneme = analyzeFrenchPhonemeAt(sentence, leadCharIdx, streamElapsedMs);
              this.state = {
                ...this.state,
                charIndex: leadCharIdx,
                wordProgressPct: Math.min(100, Math.round(leadRatio * 100)),
                currentWord: activeWord,
                mouthOpenness: isPauseBetweenWords ? 0 : (phoneme.mouthOpenness || 0.48),
                viseme: isPauseBetweenWords ? 'closed' : phoneme.viseme,
                eyebrowLift: phoneme.eyebrowLift,
                smileIntensity: phoneme.smileIntensity,
                isPauseBetweenWords,
              };
              this.notify(false);
            }, 65);

            audioEl.onended = () => {
              if (this.isCancelled || this.currentAudioElement !== audioEl) return;
              this.clearCadenceTimer();
              this.currentAudioElement = null;
              this.state = {
                ...this.state,
                mouthOpenness: 0,
                viseme: 'closed',
                smileIntensity: 0.78,
                isPauseBetweenWords: true,
              };
              this.notify();
              window.setTimeout(() => {
                if (this.isCancelled) return;
                this.currentSentenceIndex++;
                this.playNextInQueue();
              }, 680);
            };

            try {
              await audioEl.play();
            } catch {
              // Autoplay policy blocked before user gesture: keep audioEl armed for unlockHandler
              // so we NEVER fall back to the browser's robotic speechSynthesis on Sentence 1!
            }
            return;
          } catch (err) {
            this.clearCadenceTimer();
            this.currentAudioElement = null;
            console.warn('[Speech] HTMLAudioElement error:', err);
          }
        }
      }
    }

    // 2. Fallback to Natural Feminine Web Speech API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.stop();
      return;
    }

    const synth = window.speechSynthesis;
    try {
      if (synth.paused) synth.resume();
    } catch {}

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'fr-FR';
    const effectiveRate = Math.max(0.78, Math.min(0.90, 0.86 * (userSpeed / 0.90)));
    utterance.rate = effectiveRate;
    utterance.pitch = 1.0;

    const voice = this.getBestFrenchVoice();
    if (voice) {
      utterance.voice = voice;
    }

    this.currentUtterance = utterance;
    (window as any).__academiaActiveUtterance = utterance;

    const initialPhoneme = analyzeFrenchPhonemeAt(sentence, 0);
    this.state = {
      isPlaying: true,
      isLoading: false,
      currentId: this.currentPlayingId,
      textSnippet: sentence.slice(0, 60),
      currentSentenceText: sentence,
      source: 'web-speech',
      voiceProvider: 'web-speech',
      currentSentence: sentenceIdx + 1,
      totalSentences: this.queue.length,
      wordProgressPct: 0,
      charIndex: 0,
      currentWord: initialPhoneme.currentWord,
      mouthOpenness: initialPhoneme.mouthOpenness,
      viseme: initialPhoneme.viseme,
      eyebrowLift: initialPhoneme.eyebrowLift,
      headTiltDeg: 0,
      headNodY: 0,
      smileIntensity: initialPhoneme.smileIntensity,
      isPauseBetweenWords: false,
      gestureEnergy: 0.35,
    };
    this.notify();
    this.startWebSpeechCadenceTracker(sentence, effectiveRate);

    utterance.onstart = () => {
      if (this.isCancelled || this.currentUtterance !== utterance) return;
      this.lastBoundaryCharIndex = 0;
      this.lastBoundaryTime = performance.now();
    };

    utterance.onboundary = (event) => {
      if (this.isCancelled || this.currentUtterance !== utterance) return;
      if (typeof event.charIndex === 'number' && sentence.length > 0) {
        this.lastBoundaryCharIndex = event.charIndex;
        this.lastBoundaryTime = performance.now();
        // Re-lock webSpeechOriginMs to the active word boundary offsetMs for exact syllable lip-sync
        if (this.webSpeechBoundaries.length > 0) {
          const matchedWb = this.webSpeechBoundaries.find(
            (wb) => Math.abs(wb.charIndex - event.charIndex) <= 3
          );
          if (matchedWb) {
            this.webSpeechOriginMs = this.lastBoundaryTime - matchedWb.offsetMs;
          }
        }
        const leadChars = Math.max(3, Math.round(sentence.length * 0.06));
        const leadIdx = Math.min(sentence.length - 1, event.charIndex + leadChars);
        const pct = Math.min(
          99,
          Math.max(0, Math.round((leadIdx / Math.max(1, sentence.length)) * 100))
        );
        const phoneme = analyzeFrenchPhonemeAt(sentence, event.charIndex);
        this.state = {
          ...this.state,
          charIndex: leadIdx,
          wordProgressPct: pct,
          currentWord: phoneme.currentWord,
          mouthOpenness: phoneme.mouthOpenness,
          viseme: phoneme.viseme,
          eyebrowLift: phoneme.eyebrowLift,
          smileIntensity: phoneme.smileIntensity,
        };
        this.notify();
      }
    };

    utterance.onend = () => {
      if (this.isCancelled || this.currentUtterance !== utterance) return;
      this.clearCadenceTimer();
      window.setTimeout(() => {
        if (this.isCancelled) return;
        this.currentSentenceIndex++;
        this.playNextInQueue();
      }, 650);
    };

    utterance.onerror = () => {
      if (this.isCancelled) return;
      this.clearCadenceTimer();
      this.currentSentenceIndex++;
      if (this.currentSentenceIndex < this.queue.length) {
        setTimeout(() => this.playNextInQueue(), 40);
      } else {
        this.stop();
      }
    };

    try {
      synth.speak(utterance);
    } catch {
      this.stop();
    }
  }
}

export const speechService = new SpeechService();
