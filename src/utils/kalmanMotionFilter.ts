// State-Space Linear Kalman Filter & Temporal Motion Smoother for 60 FPS WebGL Avatar Rendering
// Eliminates head-movement micro-saccades, gesture transition cusps, and vertex shear artifacts
// while maintaining zero-latency (< 6ms) voice-to-lip synchronization via adaptive innovation gating.

/**
 * 1D Constant-Velocity State-Space Kalman Filter:
 * State vector: x = [position, velocity]^T
 * Transition model:
 *   pos_k = pos_{k-1} + vel_{k-1} * dt
 *   vel_k = vel_{k-1} * velocityDecay
 * Observation model:
 *   z_k = pos_k + v_k,  v_k ~ N(0, R)
 */
export class KalmanFilter1D {
  private pos: number;
  private vel: number = 0;
  // Error covariance matrix P = [[p00, p01], [p10, p11]]
  private p00: number = 1.0;
  private p01: number = 0.0;
  private p10: number = 0.0;
  private p11: number = 1.0;

  private readonly qAccel: number;
  private readonly rMeasBase: number;
  private readonly velDecay: number;
  private readonly adaptiveGate: number;

  constructor(
    initialPos: number = 0,
    options?: {
      processNoiseAccel?: number;
      measurementNoise?: number;
      velocityDecay?: number;
      adaptiveInnovationGate?: number;
    }
  ) {
    this.pos = initialPos;
    this.qAccel = options?.processNoiseAccel ?? 18.0;
    this.rMeasBase = options?.measurementNoise ?? 0.08;
    this.velDecay = options?.velocityDecay ?? 0.92;
    this.adaptiveGate = options?.adaptiveInnovationGate ?? 0.0;
  }

  public reset(position: number) {
    this.pos = position;
    this.vel = 0;
    this.p00 = 1.0;
    this.p01 = 0.0;
    this.p10 = 0.0;
    this.p11 = 1.0;
  }

  public update(measurement: number, dtSec: number): number {
    const dt = Math.max(0.004, Math.min(0.050, dtSec));
    const vd = Math.pow(this.velDecay, dt * 60.0);

    // 1. Predict State: x_{k|k-1} = F * x_{k-1|k-1}
    const predPos = this.pos + this.vel * dt;
    const predVel = this.vel * vd;

    // 2. Predict Covariance: P_{k|k-1} = F * P * F^T + Q
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt2 * dt2;
    const q00 = 0.25 * dt4 * this.qAccel;
    const q01 = 0.5 * dt3 * this.qAccel;
    const q11 = dt2 * this.qAccel;

    const fp00 = this.p00 + dt * (this.p10 + this.p01) + dt2 * this.p11 + q00;
    const fp01 = (this.p01 + dt * this.p11) * vd + q01;
    const fp10 = (this.p10 + dt * this.p11) * vd + q01;
    const fp11 = this.p11 * vd * vd + q11;

    // 3. Innovation (measurement residual): y = z - H * x_{k|k-1}
    const innovation = measurement - predPos;

    // Optional adaptive innovation gating for crisp plosive/vowel lip-sync transitions
    let effectiveR = this.rMeasBase;
    if (this.adaptiveGate > 0) {
      const normInnov = Math.abs(innovation) / this.adaptiveGate;
      if (normInnov > 1.0) {
        effectiveR = this.rMeasBase / Math.min(8.0, normInnov * normInnov);
      }
    }

    // 4. Innovation Covariance: S = H * P_{k|k-1} * H^T + R = fp00 + R
    const S = Math.max(1e-6, fp00 + effectiveR);

    // 5. Optimal Kalman Gain: K = P_{k|k-1} * H^T * S^{-1}
    const k0 = fp00 / S;
    const k1 = fp10 / S;

    // 6. Update State Estimate: x_{k|k} = x_{k|k-1} + K * y
    this.pos = predPos + k0 * innovation;
    this.vel = predVel + k1 * innovation;

    // 7. Update Error Covariance: P_{k|k} = (I - K * H) * P_{k|k-1}
    const oneMinusK0 = 1.0 - k0;
    this.p00 = oneMinusK0 * fp00;
    this.p01 = oneMinusK0 * fp01;
    this.p10 = fp10 - k1 * fp00;
    this.p11 = fp11 - k1 * fp01;

    return this.pos;
  }

  public getPosition(): number {
    return this.pos;
  }

  public getVelocity(): number {
    return this.vel;
  }
}

/**
 * Multi-channel Kalman Temporal Smoother for the AI Tutor's 3D head kinematics,
 * facial expressions, and voice-locked Wav2Lip articulation.
 */
export class AvatarKalmanTemporalSmoother {
  // 3D Head Kinematics Kalman Filters (high temporal smoothness, zero saccades)
  public readonly headTurn = new KalmanFilter1D(0, {
    processNoiseAccel: 28.0,
    measurementNoise: 0.14,
    velocityDecay: 0.90,
  });
  public readonly headNod = new KalmanFilter1D(0, {
    processNoiseAccel: 28.0,
    measurementNoise: 0.14,
    velocityDecay: 0.90,
  });
  public readonly headTilt = new KalmanFilter1D(0, {
    processNoiseAccel: 18.0,
    measurementNoise: 0.16,
    velocityDecay: 0.90,
  });

  // Facial Expression Kalman Filters (eyebrows, smile, cheeks, gaze)
  public readonly eyebrowLift = new KalmanFilter1D(0.22, {
    processNoiseAccel: 16.0,
    measurementNoise: 0.10,
    velocityDecay: 0.88,
  });
  public readonly browFurrow = new KalmanFilter1D(0, {
    processNoiseAccel: 14.0,
    measurementNoise: 0.12,
    velocityDecay: 0.88,
  });
  public readonly smile = new KalmanFilter1D(0.46, {
    processNoiseAccel: 12.0,
    measurementNoise: 0.12,
    velocityDecay: 0.88,
  });
  public readonly cheekLift = new KalmanFilter1D(0.32, {
    processNoiseAccel: 12.0,
    measurementNoise: 0.12,
    velocityDecay: 0.88,
  });

  // Upper-Body & Shoulder Micro-Gesture Kalman Filters (shoulder shrugs, empathetic breath, torso sway)
  public readonly leftShoulderLift = new KalmanFilter1D(0, {
    processNoiseAccel: 34.0,
    measurementNoise: 0.10,
    velocityDecay: 0.89,
  });
  public readonly rightShoulderLift = new KalmanFilter1D(0, {
    processNoiseAccel: 34.0,
    measurementNoise: 0.10,
    velocityDecay: 0.89,
  });
  public readonly collarLift = new KalmanFilter1D(0, {
    processNoiseAccel: 30.0,
    measurementNoise: 0.10,
    velocityDecay: 0.89,
  });
  public readonly torsoSwayX = new KalmanFilter1D(0, {
    processNoiseAccel: 22.0,
    measurementNoise: 0.12,
    velocityDecay: 0.90,
  });

  // Voice-Locked Articulatory Kalman Filters (poised, steady biomechanical tracking matching calm French syllable cadence)
  public readonly mouthOpen = new KalmanFilter1D(0.04, {
    processNoiseAccel: 110.0,
    measurementNoise: 0.016,
    velocityDecay: 0.82,
    adaptiveInnovationGate: 0.05,
  });
  public readonly mouthRound = new KalmanFilter1D(0.0, {
    processNoiseAccel: 90.0,
    measurementNoise: 0.020,
    velocityDecay: 0.82,
    adaptiveInnovationGate: 0.06,
  });
  public readonly mouthSpread = new KalmanFilter1D(0.22, {
    processNoiseAccel: 90.0,
    measurementNoise: 0.020,
    velocityDecay: 0.82,
    adaptiveInnovationGate: 0.06,
  });
  public readonly tongueLift = new KalmanFilter1D(0.0, {
    processNoiseAccel: 100.0,
    measurementNoise: 0.018,
    velocityDecay: 0.82,
    adaptiveInnovationGate: 0.06,
  });
}

export const avatarKalmanSmoother = new AvatarKalmanTemporalSmoother();
