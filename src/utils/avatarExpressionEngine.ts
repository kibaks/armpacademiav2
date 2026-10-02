// Avatar Expression Engine — 60 FPS Zero-Latency requestAnimationFrame Bridge
// Applies the pure 10-station natural photographic mouth inlay (x = 458..568),
// natural eye blinks / winks (clins d'œil), & emotion-modulated 3D head transforms.

import {
  type AvatarComputedFrame,
  type AvatarEmotion,
  type WorkerViseme,
  type WorkerWordBoundary,
  type TtsEmotionalTag,
  stepAvatarExpressionFrame,
  loadAvatarSentencePhonemes,
  clearAvatarSentencePhonemes,
} from '../workers/avatarExpressionWorker';
import { speechService } from './speechService';
import { wav2lipWebGLCore, type Wav2LipViewport } from './wav2lipVideoRenderer';

export interface AvatarSvgDomRefs {
  wav2lipCanvas?: HTMLCanvasElement | null;
  wav2lipViewport?: Wav2LipViewport;
  torsoGroup?: SVGGElement | null;
  headGroup?: SVGGElement | null;
  mouthContainer?: SVGGElement | null;
  mouthClipPath?: SVGPathElement | null;
  mouthCavityFill?: SVGPathElement | null;
  tongueEllipse?: SVGEllipseElement | null;
  jawInlayGroup?: SVGGElement | null;
  upperLipInlayGroup?: SVGGElement | null;
  leftBlinkGroup?: SVGGElement | null;
  leftEyelidPath?: SVGPathElement | null;
  leftLashPath?: SVGPathElement | null;
  rightBlinkGroup?: SVGGElement | null;
  rightEyelidPath?: SVGPathElement | null;
  rightLashPath?: SVGPathElement | null;
  eqBars?: (SVGRectElement | null)[];
  emotionBadgeEl?: HTMLElement | SVGTextElement | null;
  postureBadgeEl?: HTMLElement | SVGTextElement | null;
  visemeBadgeEl?: HTMLElement | SVGTextElement | null;
  isSpeakingOverride?: () => boolean;
  emotionOverride?: () => AvatarEmotion | undefined;
}

const DEFAULT_FRAME: AvatarComputedFrame = stepAvatarExpressionFrame(
  0,
  0,
  0,
  false,
  0,
  'closed',
  true,
  'pedagogical'
);

class AvatarExpressionEngine {
  private latestFrame: AvatarComputedFrame = DEFAULT_FRAME;
  private mountedTargets = new Set<AvatarSvgDomRefs>();
  private rafId: number | null = null;
  private currentEmotion: AvatarEmotion = 'pedagogical';

  constructor() {
    speechService.onSentenceBoundariesLoaded((sentence, wordBoundaries, emotion, emotionalTags) => {
      this.loadSentenceInWorker(
        sentence,
        wordBoundaries,
        emotion as AvatarEmotion | undefined,
        emotionalTags
      );
    });
  }

  public loadSentenceInWorker(
    sentence: string,
    wordBoundaries: WorkerWordBoundary[],
    emotion?: AvatarEmotion,
    emotionalTags?: TtsEmotionalTag[]
  ) {
    loadAvatarSentencePhonemes(sentence, wordBoundaries, emotion, emotionalTags);
    if (emotion) {
      this.currentEmotion = emotion;
    }
  }

  public clearSentenceInWorker() {
    clearAvatarSentencePhonemes();
  }

  public setEmotion(emotion: AvatarEmotion) {
    this.currentEmotion = emotion;
  }

  public registerAvatarTarget(target: AvatarSvgDomRefs): () => void {
    this.mountedTargets.add(target);
    this.applyFrameToTarget(this.latestFrame, target);
    this.ensureRafRunning();

    return () => {
      this.mountedTargets.delete(target);
      if (this.mountedTargets.size === 0 && this.rafId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };
  }

  public getLatestFrame(): AvatarComputedFrame {
    return this.latestFrame;
  }

  private ensureRafRunning() {
    if (this.rafId !== null || typeof window === 'undefined') return;

    const loop = (nowMs: number) => {
      if (this.mountedTargets.size === 0) {
        this.rafId = null;
        return;
      }

      const audioTelemetry = speechService.sampleInstantAudioTelemetry(nowMs);
      const speechState = speechService.getState();

      let anyTargetSpeaking = audioTelemetry.isSpeaking;
      let targetEmotion: AvatarEmotion | undefined = audioTelemetry.emotion as
        | AvatarEmotion
        | undefined;

      this.mountedTargets.forEach((t) => {
        // Allow isSpeakingOverride (e.g. lesson film mode or WebSpeech startup) whenever speechService is not actively loading audio
        if (
          !anyTargetSpeaking &&
          !speechState.isLoading &&
          t.isSpeakingOverride &&
          t.isSpeakingOverride()
        ) {
          anyTargetSpeaking = true;
        }
        if (t.emotionOverride) {
          const eo = t.emotionOverride();
          if (eo) targetEmotion = eo;
        }
      });

      const rawViseme = audioTelemetry.viseme as string;
      const mappedViseme: WorkerViseme =
        rawViseme === 'medium' ? 'open' : (rawViseme as WorkerViseme) || 'open';

      this.latestFrame = stepAvatarExpressionFrame(
        nowMs,
        audioTelemetry.streamElapsedMs,
        audioTelemetry.acousticRms,
        anyTargetSpeaking,
        audioTelemetry.mouthOpenness,
        mappedViseme,
        audioTelemetry.isPauseBetweenWords,
        targetEmotion
      );

      const frame = this.latestFrame;
      let warpedSurface: HTMLCanvasElement | HTMLImageElement | null = null;
      let hasCanvasTarget = false;
      this.mountedTargets.forEach((t) => {
        if (t.wav2lipCanvas) hasCanvasTarget = true;
      });
      if (hasCanvasTarget) {
        warpedSurface = wav2lipWebGLCore.renderWarpedFullFrame(frame);
      }

      this.mountedTargets.forEach((target) => {
        if (target.wav2lipCanvas && warpedSurface) {
          wav2lipWebGLCore.renderToTargetCanvas(
            target.wav2lipCanvas,
            target.wav2lipViewport || { x: 245, y: 55, w: 495, h: 585 },
            frame,
            warpedSurface
          );
        }
        this.applyFrameToTarget(frame, target);
      });

      this.rafId = window.requestAnimationFrame(loop);
    };

    this.rafId = window.requestAnimationFrame(loop);
  }

  private applyFrameToTarget(frame: AvatarComputedFrame, target: AvatarSvgDomRefs) {
    if (target.torsoGroup) {
      target.torsoGroup.setAttribute('transform', frame.torsoTransform);
    }
    if (target.headGroup) {
      target.headGroup.setAttribute('transform', frame.headTransform);
    }

    if (target.leftBlinkGroup) {
      target.leftBlinkGroup.setAttribute('opacity', frame.leftBlinkOpacity);
      if (frame.leftBlinkOpacity !== '0') {
        if (target.leftEyelidPath) {
          target.leftEyelidPath.setAttribute('d', frame.leftEyelidD);
        }
        if (target.leftLashPath) {
          target.leftLashPath.setAttribute('d', frame.leftLashD);
        }
      }
    }
    if (target.rightBlinkGroup) {
      target.rightBlinkGroup.setAttribute('opacity', frame.rightBlinkOpacity);
      if (frame.rightBlinkOpacity !== '0') {
        if (target.rightEyelidPath) {
          target.rightEyelidPath.setAttribute('d', frame.rightEyelidD);
        }
        if (target.rightLashPath) {
          target.rightLashPath.setAttribute('d', frame.rightLashD);
        }
      }
    }

    if (target.mouthContainer) {
      const overrideSpeak = target.isSpeakingOverride ? target.isSpeakingOverride() : false;
      const showMouth = frame.mouthOpacity === '1' || overrideSpeak;
      target.mouthContainer.setAttribute('opacity', showMouth ? '1' : '0');

      if (showMouth) {
        if (target.jawInlayGroup) {
          target.jawInlayGroup.setAttribute('transform', frame.jawInlayTransform);
        }
        if (target.upperLipInlayGroup) {
          target.upperLipInlayGroup.setAttribute('transform', frame.upperLipInlayTransform);
          target.upperLipInlayGroup.setAttribute('opacity', frame.upperLipInlayOpacity);
        }
        if (target.mouthClipPath) {
          target.mouthClipPath.setAttribute('d', frame.cavityD);
        }
        if (target.mouthCavityFill) {
          target.mouthCavityFill.setAttribute('d', frame.cavityD);
          target.mouthCavityFill.setAttribute('opacity', frame.cavityOpacity);
        }
        if (target.tongueEllipse) {
          target.tongueEllipse.setAttribute('opacity', frame.tongueOpacity);
          if (frame.tongueOpacity !== '0') {
            target.tongueEllipse.setAttribute('cx', frame.tongueCx);
            target.tongueEllipse.setAttribute('cy', frame.tongueCy);
            target.tongueEllipse.setAttribute('rx', frame.tongueRx);
            target.tongueEllipse.setAttribute('ry', frame.tongueRy);
          }
        }
      }
    }

    if (target.emotionBadgeEl && target.emotionBadgeEl.textContent !== frame.emotionLabel) {
      target.emotionBadgeEl.textContent = frame.emotionLabel;
    }

    if (target.postureBadgeEl && frame.bodyLanguageLabel) {
      const shortViseme = frame.activeVisemeLabel
        ? frame.activeVisemeLabel.replace(/^Visème (\d) • /, 'V$1: ')
        : '';
      const combinedPostureText = shortViseme
        ? `${frame.bodyLanguageLabel} • ${shortViseme}`
        : frame.bodyLanguageLabel;
      if (target.postureBadgeEl.textContent !== combinedPostureText) {
        target.postureBadgeEl.textContent = combinedPostureText;
      }
    }

    if (target.visemeBadgeEl && frame.activeVisemeLabel) {
      const compactViseme = `VISÈME ${frame.activeVisemeNumber}/6`;
      if (target.visemeBadgeEl.textContent !== compactViseme) {
        target.visemeBadgeEl.textContent = compactViseme;
      }
    }

    if (target.eqBars && target.eqBars.length > 0) {
      for (let i = 0; i < 5; i++) {
        const bar = target.eqBars[i];
        if (bar) {
          bar.setAttribute('y', frame.eqY[i]);
          bar.setAttribute('height', frame.eqH[i]);
        }
      }
    }
  }
}

export const avatarExpressionEngine = new AvatarExpressionEngine();
