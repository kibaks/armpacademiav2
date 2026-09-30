import React, { useEffect, useRef, useState, useId } from 'react';
import imgTutrice from '../assets/images/tutrice_sereine_claude.jpg';
import { speechService } from '../utils/speechService';
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
    | 'empathetic'
    | 'encouraging'
    | 'enthusiastic'
    | 'solemn'
    | 'curious'
    | 'pedagogical';
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'call' | 'hero';
  variant?: 'avatar' | 'visio';
  showBadge?: boolean;
  showWaves?: boolean;
  showWave?: boolean;
  className?: string;
}

const SIZE_MAP: Record<string, { w: number; h: number }> = {
  xs: { w: 34, h: 34 },
  sm: { w: 46, h: 46 },
  md: { w: 68, h: 68 },
  lg: { w: 128, h: 128 },
  xl: { w: 190, h: 190 },
  call: { w: 280, h: 310 },
  hero: { w: 320, h: 360 },
};

function mapPropEmotion(
  propEmotion?: AishaAvatarProps['emotion'],
  isListening?: boolean,
  isThinking?: boolean
): AvatarEmotion | undefined {
  if (isListening) return 'empathetic';
  if (isThinking) return 'curious';
  if (!propEmotion || propEmotion === 'neutral') return undefined;
  if (propEmotion === 'happy') return 'enthusiastic';
  return propEmotion as AvatarEmotion;
}

/**
 * AishaAvatar — Real-Time 60 FPS Wav2Lip Video Synthesizer (WebGL 540-Triangle Mesh Warp)
 * Replaces static/cutout SVG layers with continuous pixel-warped video synthesis:
 * - Wav2Lip lower-face, jaw, upper/lower lips, teeth & tongue synthesis
 * - Full 3D head & back hair chignon kinematics with secondary hair inertia
 * - Expressive eyebrows, natural eye blinks/winks, micro-saccades & thoracic breathing
 */
export const AishaAvatar: React.FC<AishaAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  isLoading = false,
  emotion,
  size = 'md',
  variant = 'avatar',
  showBadge = true,
  className = '',
}) => {
  const _uid = useId();
  const isVisio = variant === 'visio';
  const dim =
    typeof size === 'number'
      ? { w: size, h: size }
      : SIZE_MAP[size] || SIZE_MAP.md;
  const isMini = !isVisio && dim.w <= 48;

  const [globalSpeaking, setGlobalSpeaking] = useState(false);
  const wav2lipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSpeakingPropRef = useRef(isSpeaking);
  isSpeakingPropRef.current = isSpeaking;

  const emotionPropRef = useRef<AvatarEmotion | undefined>(
    mapPropEmotion(emotion, isListening, isThinking)
  );
  emotionPropRef.current = mapPropEmotion(emotion, isListening, isThinking);

  useEffect(() => {
    const unsub = speechService.subscribe((st) => {
      const active = Boolean(st.isPlaying && !st.isLoading);
      setGlobalSpeaking((prev) => (prev !== active ? active : prev));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isMini) return;
    const unregister = avatarExpressionEngine.registerAvatarTarget({
      wav2lipCanvas: wav2lipCanvasRef.current,
      wav2lipViewport: { x: 245, y: 55, w: 495, h: 585 },
      isSpeakingOverride: () => Boolean(isSpeakingPropRef.current),
      emotionOverride: () => emotionPropRef.current,
    });
    return unregister;
  }, [isMini]);

  const activeSpeaking = isSpeaking || globalSpeaking;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none overflow-hidden ${
        isVisio ? '' : 'rounded-2xl bg-slate-900 border'
      } ${
        !isVisio
          ? activeSpeaking
            ? 'border-cyan-400/90 shadow-lg shadow-cyan-500/20'
            : 'border-amber-400/60'
          : ''
      } ${className}`}
      style={isVisio ? undefined : { width: dim.w, height: dim.h }}
    >
      {isMini ? (
        <img
          src={imgTutrice}
          alt="Professeure Aïsha"
          className="w-full h-full object-cover object-top"
          referrerPolicy="no-referrer"
        />
      ) : (
        <canvas
          ref={wav2lipCanvasRef}
          width={495}
          height={585}
          className="w-full h-full block object-cover"
        />
      )}

      {showBadge && !isMini && !isVisio && (
        <span
          className={`absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
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
