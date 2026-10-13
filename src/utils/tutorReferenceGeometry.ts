import type { AvatarEmotion, WorkerViseme } from '../workers/avatarExpressionWorker';
export type TutorPosture = 0 | 1 | 2 | 3 | 4 | 5;
export function selectTutorPosture(speaking: boolean, emotion: AvatarEmotion, gestures: boolean, expressions: boolean): TutorPosture {
  if (!gestures || !expressions) return 3;
  if (!speaking) return emotion === 'curious' ? 1 : emotion === 'astonished' ? 2 : 3;
  if (emotion === 'curious') return 4;
  if (emotion === 'astonished') return 2;
  if (emotion === 'solemn' || emotion === 'refusal' || emotion === 'empathetic') return 3;
  if (emotion === 'enthusiastic' || emotion === 'encouraging' || emotion === 'acceptance') return 5;
  return emotion === 'smiling' ? 0 : 4;
}
export function selectTutorArticulation(viseme: WorkerViseme, openness: number): number {
  if (viseme === 'closed' || openness <= 0.045) return 0;
  if (viseme === 'round') return 4;
  if (viseme === 'wide') return 2;
  if (viseme === 'narrow') return 5;
  return openness >= 0.6 ? 3 : 1;
}
export const FEMALE_POSTURE_MOUTHS = [
  { x: 222, y: 220, angle: -8 }, { x: 221, y: 238, angle: 8 }, { x: 214, y: 240, angle: 0 },
  { x: 215, y: 187, angle: 0 }, { x: 207, y: 189, angle: 0 }, { x: 244, y: 205, angle: -8 },
] as const;
export const FEMALE_ARTICULATION_MOUTHS = [
  { x: 224, y: 289 }, { x: 220, y: 288 }, { x: 223, y: 289 },
  { x: 225, y: 289 }, { x: 227, y: 291 }, { x: 232, y: 290 },
] as const;
export const MALE_POSTURE_MOUTHS = [
  { x: 185, y: 162, angle: 0 }, { x: 189, y: 166, angle: 8 }, { x: 182, y: 173, angle: 0 },
  { x: 190, y: 154, angle: 0 }, { x: 190, y: 153, angle: 0 }, { x: 193, y: 157, angle: 0 },
] as const;
export const MALE_ARTICULATION_MOUTHS = [
  { x: 181, y: 224 }, { x: 185, y: 224 }, { x: 183, y: 227 },
  { x: 182, y: 237 }, { x: 184, y: 234 }, { x: 184, y: 229 },
] as const;
export function referenceCell(male: boolean, index: number, articulation = false) {
  if (!male) return { x: [0, 414, 828][index % 3], y: index < 3 ? 0 : 438, w: 403, h: index < 3 ? 427 : 412 };
  const row = Math.floor(index / 3) + (articulation ? 2 : 0);
  const starts = [0, 375, 754, 1073], heights = [374, 378, 318, 375];
  return { x: [0, 362, 724][index % 3], y: starts[row], w: 361, h: heights[row] };
}
