// Procedural Engagement & Biomechanical Micro-Movement Engine for AI Studio Avatar
// Simulates natural human presence, eliminating robotic stiffness via:
// 1. Stochastic Bio-Blinking: Asymmetric eyelid closure/opening, double-blinks & saccade coupling.
// 2. Ocular Micro-Kinematics: Fixational micro-saccades, cognitive reflection gaze shifts & Vestibulo-Ocular Reflex (VOR).
// 3. Cervical Procedural Tilt: Multi-frequency Lissajous head-sway, attentive listening tilt & prosodic accentuation.
// 4. Diaphragmatic Respiration: Continuous thoracic breathing cycle coupled to collar, shoulders, and posture.

import type { AvatarEmotion } from '../workers/avatarExpressionWorker';

export interface ProceduralEngagementState {
  // Eyes
  blinkLeft: number;        // 0.0 (open) .. 1.0 (closed)
  blinkRight: number;       // 0.0 (open) .. 1.0 (closed)
  gazeX: number;            // Horizontal eye gaze in pixels (-4.0 .. +4.0)
  gazeY: number;            // Vertical eye gaze in pixels (-3.0 .. +3.0)
  eyeWideMod: number;       // Micro-modulation for pupil/eyelid opening (-0.08 .. +0.12)
  
  // Head Procedural Tilts & Micro-Movements
  proceduralTiltDeg: number;// Subtle procedural cervical tilt in degrees (-2.8 .. +2.8)
  proceduralNodPx: number;  // Subtle procedural pitch nod in pixels (-2.5 .. +3.0)
  proceduralTurnPx: number; // Subtle procedural yaw turn in pixels (-3.5 .. +3.5)
  
  // Respiration & Postural Dynamics
  breathY: number;          // Diaphragmatic respiratory cycle in pixels (-2.5 .. +2.5)
  torsoSwayX: number;       // Postural body sway in pixels (-3.0 .. +3.0)
  postureShiftDy: number;   // Slow postural weight shift in pixels (-1.5 .. +1.5)
}

// Pseudo-random deterministic noise generator based on fractals of primes
function pseudoNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class AvatarProceduralEngagementEngine {
  // --- Blinking State ---
  private nextBlinkMs: number = 2200;
  private blinkStartMs: number = 0;
  private isBlinking: boolean = false;
  private isDoubleBlink: boolean = false;
  private secondBlinkPending: boolean = false;
  private secondBlinkStartMs: number = 0;
  private blinkCloseDurationMs: number = 75;
  private blinkOpenDurationMs: number = 120;
  private currentBlinkLeft: number = 0;
  private currentBlinkRight: number = 0;

  // --- Gaze & Saccade State ---
  private currentGazeX: number = 0;
  private currentGazeY: number = 0;
  private targetGazeX: number = 0;
  private targetGazeY: number = 0;
  private gazeShiftStartMs: number = 0;
  private gazeShiftDurationMs: number = 180;
  private nextGazeShiftMs: number = 1800;
  private isCognitiveGlance: boolean = false;
  private cognitiveGlanceEndMs: number = 0;

  // --- Attentive Listening & Head Tilt State ---
  private targetAttentiveTiltDeg: number = 1.8;
  private currentAttentiveTiltDeg: number = 1.0;
  private nextTiltShiftMs: number = 4200;

  // --- Diaphragmatic Breath & Posture ---
  private breathPhase: number = 0;

  /**
   * Evaluates all procedural micro-movements for the current animation frame (60 FPS).
   */
  public step(
    nowMs: number,
    dtSec: number,
    isSpeaking: boolean,
    emotion: AvatarEmotion,
    acousticRms: number,
    headTurn: number,
    headNod: number,
    headTilt: number
  ): ProceduralEngagementState {
    const dt = Math.max(0.005, Math.min(0.050, dtSec));

    // =========================================================================
    // 1. STOCHASTIC BIO-BLINKING (Natural Eyelid Kinematics)
    // =========================================================================
    this.updateBlinking(nowMs, isSpeaking, emotion);

    // =========================================================================
    // 2. OCULAR SACCADES, FIXATIONAL DRIFT & VOR
    // =========================================================================
    const { gazeX, gazeY, eyeWideMod } = this.updateGaze(
      nowMs,
      dt,
      isSpeaking,
      emotion,
      headTurn,
      headNod,
      headTilt
    );

    // =========================================================================
    // 3. SUBTLE PROCEDURAL HEAD-TILTING & CERVICAL KINEMATICS
    // =========================================================================
    const { proceduralTiltDeg, proceduralNodPx, proceduralTurnPx } = this.updateHeadPose(
      nowMs,
      dt,
      isSpeaking,
      emotion,
      acousticRms
    );

    // =========================================================================
    // 4. DIAPHRAGMATIC RESPIRATION & POSTURAL MICRO-SWAY
    // =========================================================================
    // Breath frequency: ~0.22 Hz (one breath every ~4.5 seconds)
    // Faster, deeper respiration during passionate speech or solemn analysis
    const breathSpeed = isSpeaking ? 0.0017 : 0.00135;
    this.breathPhase += dt * breathSpeed * 1000;
    
    // Asymmetric breathing: smoother inhalation (40%), gentle settling exhalation (60%)
    const rawSin = Math.sin(this.breathPhase);
    const shapedBreath = rawSin >= 0 ? Math.pow(rawSin, 1.2) : -Math.pow(Math.abs(rawSin), 0.85);
    const breathAmp = isSpeaking ? 2.4 + acousticRms * 1.8 : 1.75;
    const breathY = shapedBreath * breathAmp;

    // Organic torso sway (multi-harmonic low frequency)
    const torsoSwayX =
      Math.sin(nowMs * 0.00078) * 1.6 +
      Math.sin(nowMs * 0.00135 + 1.2) * 0.9 +
      Math.cos(nowMs * 0.00045) * 0.6;

    // Postural weight shift every 12-18 seconds
    const postureShiftDy = Math.sin(nowMs * 0.00028) * 0.85;

    return {
      blinkLeft: this.currentBlinkLeft,
      blinkRight: this.currentBlinkRight,
      gazeX,
      gazeY,
      eyeWideMod,
      proceduralTiltDeg,
      proceduralNodPx,
      proceduralTurnPx,
      breathY,
      torsoSwayX,
      postureShiftDy,
    };
  }

  /**
   * Biological blinking model with asymmetric closing/opening curves,
   * stochastic inter-blink intervals, double-blinks, and winks.
   */
  private updateBlinking(nowMs: number, isSpeaking: boolean, emotion: AvatarEmotion) {
    // Schedule next natural blink if idle
    if (!this.isBlinking && nowMs >= this.nextBlinkMs) {
      this.isBlinking = true;
      this.blinkStartMs = nowMs;
      // Close phase is fast (~70-85ms), open phase is cushioned (~110-140ms)
      this.blinkCloseDurationMs = 70 + Math.floor(pseudoNoise(nowMs) * 18);
      this.blinkOpenDurationMs = 115 + Math.floor(pseudoNoise(nowMs + 45) * 30);
      
      // 18% chance of triggering a double-blink (flutter) for high human realism
      this.isDoubleBlink = pseudoNoise(nowMs * 0.77) < 0.20 && emotion !== 'solemn';
      this.secondBlinkPending = this.isDoubleBlink;
    }

    if (this.isBlinking) {
      const elapsed = nowMs - this.blinkStartMs;
      const totalDuration = this.blinkCloseDurationMs + this.blinkOpenDurationMs;

      if (elapsed < this.blinkCloseDurationMs) {
        // Fast quadratic closing phase
        const t = elapsed / this.blinkCloseDurationMs;
        const curve = t * t * (3 - 2 * t); // smooth cubic hermite
        this.currentBlinkLeft = curve;
        this.currentBlinkRight = curve * (0.97 + pseudoNoise(this.blinkStartMs) * 0.06);
      } else if (elapsed < totalDuration) {
        // Cushioned exponential opening phase
        const t = (elapsed - this.blinkCloseDurationMs) / this.blinkOpenDurationMs;
        const curve = 1.0 - Math.pow(t, 0.85);
        this.currentBlinkLeft = Math.max(0, curve);
        this.currentBlinkRight = Math.max(0, curve * (0.97 + pseudoNoise(this.blinkStartMs) * 0.06));
      } else {
        // First blink complete
        this.currentBlinkLeft = 0;
        this.currentBlinkRight = 0;
        this.isBlinking = false;

        if (this.secondBlinkPending) {
          this.secondBlinkPending = false;
          // Trigger second lighter flutter after 130-180ms
          this.nextBlinkMs = nowMs + 130 + Math.floor(pseudoNoise(nowMs + 99) * 50);
        } else {
          // Schedule next stochastic blink:
          // Speaking: blinks every 2.4s to 4.5s
          // Listening/Reflection: blinks every 3.2s to 6.0s
          const baseInterval = isSpeaking ? 2600 : 3400;
          const variance = isSpeaking ? 2000 : 2800;
          this.nextBlinkMs = nowMs + baseInterval + Math.floor(pseudoNoise(nowMs * 1.33) * variance);
        }
      }
    } else {
      this.currentBlinkLeft = 0;
      this.currentBlinkRight = 0;
    }

    // Occasional affectionate micro-wink or soft unilateral squint during smiling or encouragement
    const winkPeriod = emotion === 'enthusiastic' || emotion === 'encouraging' ? 6200 : 8800;
    const winkPhase = (nowMs + 2100) % winkPeriod;
    if (winkPhase < 240 && emotion !== 'solemn' && !this.isBlinking) {
      const w = winkPhase < 100
        ? Math.sin((winkPhase / 100) * (Math.PI / 2))
        : Math.cos(((winkPhase - 100) / 140) * (Math.PI / 2));
      this.currentBlinkLeft = Math.max(this.currentBlinkLeft, w * 0.88);
      this.currentBlinkRight = Math.max(this.currentBlinkRight, w * 0.12);
    }
  }

  /**
   * Procedural eye gaze with fixational scanning, cognitive glances,
   * micro-saccades, and Vestibulo-Ocular Reflex (VOR).
   */
  private updateGaze(
    nowMs: number,
    dt: number,
    isSpeaking: boolean,
    emotion: AvatarEmotion,
    headTurn: number,
    headNod: number,
    headTilt: number
  ): { gazeX: number; gazeY: number; eyeWideMod: number } {
    // Schedule natural gaze shift
    if (nowMs >= this.nextGazeShiftMs) {
      this.gazeShiftStartMs = nowMs;
      this.gazeShiftDurationMs = 140 + Math.floor(pseudoNoise(nowMs) * 80);

      // Roll for cognitive reflection glance (looking slightly up/side while thinking)
      const rollCognitive = pseudoNoise(nowMs * 0.45);
      if (rollCognitive < 0.18) {
        // Cognitive glance: looking up-left (visual memory) or up-right (conceptual construction)
        this.isCognitiveGlance = true;
        this.cognitiveGlanceEndMs = nowMs + 650 + Math.floor(pseudoNoise(nowMs + 12) * 450);
        this.targetGazeX = (pseudoNoise(nowMs + 77) > 0.5 ? -2.2 : 2.0);
        this.targetGazeY = -1.6;
      } else {
        // Direct human engagement: scanning user's eyes & face
        this.isCognitiveGlance = false;
        const scanTarget = Math.floor(pseudoNoise(nowMs + 33) * 4);
        if (scanTarget === 0) {
          // Centered direct eye contact
          this.targetGazeX = 0.0;
          this.targetGazeY = 0.0;
        } else if (scanTarget === 1) {
          // User's right eye (avatar's left)
          this.targetGazeX = -1.35;
          this.targetGazeY = -0.25;
        } else if (scanTarget === 2) {
          // User's left eye (avatar's right)
          this.targetGazeX = 1.35;
          this.targetGazeY = -0.25;
        } else {
          // Subtle engagement with speaker mouth / expression
          this.targetGazeX = 0.0;
          this.targetGazeY = 0.85;
        }
      }

      // Schedule next shift: 1.2s to 3.2s
      const dwell = this.isCognitiveGlance ? 900 : 1400;
      this.nextGazeShiftMs = nowMs + dwell + Math.floor(pseudoNoise(nowMs * 2.1) * 1600);
    }

    // Check if cognitive glance ended
    if (this.isCognitiveGlance && nowMs >= this.cognitiveGlanceEndMs) {
      this.isCognitiveGlance = false;
      // Smoothly snap back to user eye contact
      this.targetGazeX = 0.0;
      this.targetGazeY = 0.0;
      this.gazeShiftStartMs = nowMs;
      this.gazeShiftDurationMs = 160;
    }

    // Interpolate current gaze toward target using minimum-jerk profile
    const gazeElapsed = nowMs - this.gazeShiftStartMs;
    const progress = Math.min(1.0, Math.max(0.0, gazeElapsed / Math.max(40, this.gazeShiftDurationMs)));
    const smoothStep = progress * progress * (3 - 2 * progress);
    this.currentGazeX += (this.targetGazeX - this.currentGazeX) * (smoothStep * 0.45 + 0.15);
    this.currentGazeY += (this.targetGazeY - this.currentGazeY) * (smoothStep * 0.45 + 0.15);

    // Physiological micro-nystagmus tremor (3.8Hz & 5.1Hz)
    const microTremorX = Math.sin(nowMs * 0.024) * 0.35 + Math.cos(nowMs * 0.038) * 0.18;
    const microTremorY = Math.sin(nowMs * 0.031) * 0.25 + Math.cos(nowMs * 0.019) * 0.15;

    // Vestibulo-Ocular Reflex (VOR): Counter-rotation against head turns/tilts
    // Real eyes keep locking onto user when head turns
    const vorX = -headTurn * 0.28;
    const vorY = -headNod * 0.22;

    const finalGazeX = Math.max(-4.2, Math.min(4.2, this.currentGazeX + microTremorX + vorX));
    const finalGazeY = Math.max(-3.0, Math.min(3.0, this.currentGazeY + microTremorY + vorY));

    // Eye widening modulation: slight alert widening on cognitive glance or questioning
    const eyeWideMod = this.isCognitiveGlance
      ? 0.08
      : emotion === 'curious'
      ? 0.06
      : Math.sin(nowMs * 0.0016) * 0.03;

    return {
      gazeX: finalGazeX,
      gazeY: finalGazeY,
      eyeWideMod,
    };
  }

  /**
   * Procedural head tilts and continuous multi-harmonic cervical motion.
   */
  private updateHeadPose(
    nowMs: number,
    dt: number,
    isSpeaking: boolean,
    emotion: AvatarEmotion,
    acousticRms: number
  ): { proceduralTiltDeg: number; proceduralNodPx: number; proceduralTurnPx: number } {
    // Active listening attentive head tilt:
    // Alternate head inclination gracefully between left & right every 5.5s to 8.5s
    if (nowMs >= this.nextTiltShiftMs) {
      const roll = pseudoNoise(nowMs * 0.55);
      // Inclinations favor gentle right-tilt (+2.2°) or left-tilt (-2.0°)
      const sign = this.targetAttentiveTiltDeg > 0 ? -1 : 1;
      const magnitude = 1.4 + roll * 1.1; // 1.4° to 2.5°
      this.targetAttentiveTiltDeg = sign * magnitude;
      this.nextTiltShiftMs = nowMs + 5500 + Math.floor(pseudoNoise(nowMs + 88) * 3500);
    }

    // Smooth exponential approach to attentive tilt target
    const tiltLerpRate = Math.min(0.20, dt * 1.2);
    this.currentAttentiveTiltDeg += (this.targetAttentiveTiltDeg - this.currentAttentiveTiltDeg) * tiltLerpRate;

    // Multi-harmonic Lissajous cervical wave (never repeats exactly, zero robotic loops)
    const waveA = Math.sin(nowMs * 0.00095);
    const waveB = Math.cos(nowMs * 0.00155);
    const waveC = Math.sin(nowMs * 0.00235);
    const waveD = Math.cos(nowMs * 0.00062);

    // Continuous procedural tilt (inclination)
    const liveTiltMod = waveA * 0.65 + waveB * 0.35;
    const proceduralTiltDeg = Math.max(
      -2.8,
      Math.min(2.8, this.currentAttentiveTiltDeg * 0.75 + liveTiltMod)
    );

    // Continuous procedural nod (pitch): gentle attentive breathing & listening rhythm
    const proceduralNodPx =
      (waveB * 1.25 + waveC * 0.65 + waveD * 0.45) *
      (isSpeaking ? 1.0 + acousticRms * 1.5 : 0.85);

    // Continuous procedural turn (yaw)
    const proceduralTurnPx = (waveA * 1.85 + waveD * 1.15) * (isSpeaking ? 1.0 : 0.80);

    return {
      proceduralTiltDeg,
      proceduralNodPx,
      proceduralTurnPx,
    };
  }
}

// Global singleton instance for worker / expression engine
export const avatarProceduralEngine = new AvatarProceduralEngagementEngine();
