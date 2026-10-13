import type { AvatarComputedFrame } from '../workers/avatarExpressionWorker';
import type { TutorMotion } from '../../shared/tutorPresentation';
export function applyTutorMotion(frame: AvatarComputedFrame, motion: TutorMotion, facialExpressions: boolean, reducedMotion: boolean): AvatarComputedFrame {
  const amount = reducedMotion || motion === 'off' ? 0 : motion === 'subtle' ? 0.45 : 0.85;
  const result = { ...frame };
  for (const key of ['turn', 'nod', 'tilt', 'hairLagTurn', 'hairLagNod', 'breathY', 'shoulderLift', 'leftShoulderLift', 'rightShoulderLift', 'collarLift', 'torsoSwayX', 'leftHandDx', 'leftHandDy', 'rightHandDx', 'rightHandDy'] as const) result[key] = amount === 0 ? 0 : result[key] * amount;
  if (!facialExpressions || reducedMotion) { result.smile = 0; result.cheekLift = 0; result.eyebrowLift = 0; result.browFurrow = 0; result.eyeWide = 0; }
  // Mouth articulation and natural blinking remain independent of body animation.
  return result;
}
