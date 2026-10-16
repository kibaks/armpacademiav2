import type { AvatarComputedFrame } from '../workers/avatarExpressionWorker';
import type { TutorMotion } from '../../shared/tutorPresentation';
export function applyTutorMotion(frame: AvatarComputedFrame, motion: TutorMotion, facialExpressions: boolean, reducedMotion: boolean, professional = false): AvatarComputedFrame {
  const amount = reducedMotion || motion === 'off' ? 0 : motion === 'subtle' ? 0.45 : 0.85;
  const result = { ...frame };
  for (const key of ['turn', 'nod', 'tilt', 'hairLagTurn', 'hairLagNod', 'breathY', 'shoulderLift', 'leftShoulderLift', 'rightShoulderLift', 'collarLift', 'torsoSwayX', 'leftHandDx', 'leftHandDy', 'rightHandDx', 'rightHandDy'] as const) result[key] = amount === 0 ? 0 : result[key] * amount;
  if (!facialExpressions || reducedMotion) { result.smile = 0; result.cheekLift = 0; result.eyebrowLift = 0; result.browFurrow = 0; result.eyeWide = 0; }
  if (professional) {
    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
    result.turn = clamp(result.turn, 1.2);
    result.nod = clamp(result.nod, 2);
    result.tilt = clamp(result.tilt, 0.7);
    result.hairLagTurn = clamp(result.hairLagTurn, 0.4);
    result.hairLagNod = clamp(result.hairLagNod, 0.5);
    result.torsoSwayX = clamp(result.torsoSwayX, 0.8);
    result.breathY = clamp(result.breathY, 1.5);
    result.shoulderLift = clamp(result.shoulderLift, 1.2);
    result.leftShoulderLift = clamp(result.leftShoulderLift, 1.2);
    result.rightShoulderLift = clamp(result.rightShoulderLift, 1.2);
    result.collarLift = clamp(result.collarLift, 0.8);
    result.gazeX = clamp(result.gazeX, 0.5);
    result.gazeY = clamp(result.gazeY, 0.5);
    result.smile = Math.min(result.smile, 0.18);
    result.eyeWide = Math.min(result.eyeWide, 0.12);
    result.leftHandDx = result.leftHandDy = result.rightHandDx = result.rightHandDy = 0;
  }
  // Mouth articulation and natural blinking remain independent of body animation.
  return result;
}
