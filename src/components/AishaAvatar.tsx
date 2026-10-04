import React, { useEffect, useRef, useState } from 'react';
import imgTutrice from '../assets/images/aisha_cutout_foreground.png';
import imgStudioBg from '../assets/images/studio_static_background.jpg';
import { speechService, type VoicePersona } from '../utils/speechService';
import { avatarExpressionEngine } from '../utils/avatarExpressionEngine';
import type { AvatarEmotion } from '../workers/avatarExpressionWorker';

export interface AishaAvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  isLoading?: boolean;
  emotion?:
    | 'neutral'
    | 'happy'
    | 'smiling'
    | 'empathetic'
    | 'encouraging'
    | 'enthusiastic'
    | 'solemn'
    | 'curious'
    | 'pedagogical'
    | 'astonished'
    | 'refusal'
    | 'acceptance';
  tutorPersona?: VoicePersona;
  tutorName?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'call' | 'hero';
  variant?: 'avatar' | 'studio' | 'visio';
  showBadge?: boolean;
  showWaves?: boolean;
  showWave?: boolean;
  className?: string;
}

const SIZE_MAP: Record<string, { w: number; h: number }> = {
  xs: { w: 34, h: 34 },
  sm: { w: 46, h: 46 },
  md: { w: 68, h: 68 },
  lg: { w: 136, h: 152 },
  xl: { w: 220, h: 248 },
  call: { w: 290, h: 325 },
  hero: { w: 320, h: 360 },
};

const TUTOR_ACCENT_BORDERS: Record<VoicePersona, string> = {
  denise: 'border-cyan-400/90 shadow-cyan-500/25',
  charline: 'border-fuchsia-400/90 shadow-fuchsia-500/25',
  vivienne: 'border-emerald-400/90 shadow-emerald-500/25',
  eloise: 'border-amber-400/90 shadow-amber-500/25',
};

function mapPropEmotion(
  propEmotion?: AishaAvatarProps['emotion'],
  isListening?: boolean,
  isThinking?: boolean
): AvatarEmotion | undefined {
  if (propEmotion && propEmotion !== 'neutral') {
    if (propEmotion === 'happy') return 'smiling';
    return propEmotion as AvatarEmotion;
  }
  if (isListening) return 'empathetic';
  if (isThinking) return 'curious';
  return undefined;
}

/**
 * AishaAvatar — Real-Time 60 FPS Wav2Lip Video Synthesizer (WebGL 648-Triangle Full-Image Mesh Warp)
 * - Realistic Wav2Lip lip-sync (6 phonetic visemes, upper dental arch, oral cavity & 3D tongue)
 * - Genuine Duchenne smile ("Le sourire") lifting mouth corners, cheeks & lower eyelids
 * - Full-image animation: 3D head movement, eyebrows, eye blinks/winks, shoulders & both hands
 */
export const AishaAvatar: React.FC<AishaAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  isLoading = false,
  emotion,
  tutorPersona = 'denise',
  size = 'md',
  variant = 'avatar',
  showBadge = true,
  className = '',
}) => {
  const isVisio = variant === 'visio';
  const isStudio = variant === 'studio';
  const dim =
    typeof size === 'number'
      ? { w: size, h: size }
      : SIZE_MAP[size] || SIZE_MAP.md;

  const [globalSpeaking, setGlobalSpeaking] = useState(false);
  const wav2lipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const emotionBadgeRef = useRef<SVGTextElement | null>(null);
  const postureBadgeRef = useRef<SVGTextElement | HTMLSpanElement | null>(null);
  const visemeBadgeRef = useRef<SVGTextElement | null>(null);
  const eqBarRefs = useRef<(SVGRectElement | null)[]>([null, null, null, null, null]);

  const isSpeakingPropRef = useRef(isSpeaking);
  isSpeakingPropRef.current = isSpeaking;

  const emotionPropRef = useRef<AvatarEmotion | undefined>(
    mapPropEmotion(emotion, isListening, isThinking || isLoading)
  );
  emotionPropRef.current = mapPropEmotion(emotion, isListening, isThinking || isLoading);

  useEffect(() => {
    const unsub = speechService.subscribe((st) => {
      const active = Boolean(st.isPlaying && !st.isLoading);
      setGlobalSpeaking((prev) => (prev !== active ? active : prev));
    });
    return unsub;
  }, []);

  useEffect(() => {
    // True Gros Plan (Close-Up) framing on Aïsha's expressive face, smile, eyes & mouth
    // with static pedagogical studio background (flower pots, plants & warm shelves)
    // Visio framing keeps the full head inside the camera (crown y=149,
    // chin y≈590) with shoulders entering at the bottom edge.
    const viewport = isVisio
      ? { x: 158, y: 110, w: 584, h: 550, tutorPersona }
      : isStudio || dim.w >= 120
      ? { x: 238, y: 200, w: 420, h: 395, tutorPersona }
      : { x: 240, y: 205, w: 416, h: 390, tutorPersona };

    const unregister = avatarExpressionEngine.registerAvatarTarget({
      wav2lipCanvas: wav2lipCanvasRef.current,
      wav2lipViewport: viewport,
      emotionBadgeEl: emotionBadgeRef.current,
      postureBadgeEl: postureBadgeRef.current,
      visemeBadgeEl: visemeBadgeRef.current,
      eqBars: eqBarRefs.current,
      isSpeakingOverride: () => Boolean(isSpeakingPropRef.current),
      emotionOverride: () => emotionPropRef.current,
    });
    return unregister;
  }, [isVisio, isStudio, dim.w, tutorPersona]);

  const activeSpeaking = isSpeaking || globalSpeaking;
  const accentBorder = TUTOR_ACCENT_BORDERS[tutorPersona] || TUTOR_ACCENT_BORDERS.denise;

  return (
    <div
      className={`relative flex items-center justify-center select-none overflow-hidden ${
        isVisio
          ? 'w-full h-full bg-slate-950'
          : isStudio
          ? 'w-full h-full rounded-2xl bg-slate-950 border-2'
          : 'inline-flex rounded-2xl bg-slate-900 border'
      } ${
        !isVisio
          ? activeSpeaking
            ? `${accentBorder} shadow-lg`
            : 'border-amber-400/65'
          : ''
      } ${className}`}
      style={isVisio || isStudio ? undefined : { width: dim.w, height: dim.h }}
    >
      {isVisio && (
        <>
          <img
            src={imgStudioBg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-45 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70 pointer-events-none" />
        </>
      )}

      <canvas
        ref={wav2lipCanvasRef}
        width={isVisio ? 680 : isStudio || dim.w >= 180 ? 600 : 360}
        height={isVisio ? 640 : isStudio || dim.w >= 180 ? 580 : 380}
        className={
          isVisio
            ? 'relative z-10 w-full h-full block object-contain object-center'
            : 'w-full h-full block object-cover object-top'
        }
      />

      {isVisio && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 rounded-full bg-slate-950/85 border border-cyan-400/50 backdrop-blur-sm pointer-events-none max-w-[92%] truncate shadow-lg">
          <span
            ref={postureBadgeRef as React.RefObject<HTMLSpanElement>}
            className="text-[11px] font-extrabold text-amber-200 tracking-wide"
          >
            🌸 Wav2Lip 60 FPS • Port de tête féminin &amp; Sourire naturel
          </span>
        </div>
      )}

      {showBadge && !isVisio && !isStudio && dim.w < 180 && (
        <span
          className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 z-20 ${
            activeSpeaking
              ? 'bg-cyan-400 animate-pulse'
              : isListening
              ? 'bg-rose-500 animate-ping'
              : isThinking || isLoading
              ? 'bg-amber-400 animate-bounce'
              : 'bg-emerald-500'
          }`}
        />
      )}
    </div>
  );
};

export default AishaAvatar;
