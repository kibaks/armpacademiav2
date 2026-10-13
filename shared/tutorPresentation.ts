export type TutorMotion = 'subtle' | 'expressive' | 'off';
export interface TutorPresentation { motion: TutorMotion; facialExpressions: boolean; handGestures: boolean; autoSpeak: boolean }
export const DEFAULT_TUTOR_PRESENTATION: TutorPresentation = { motion: 'subtle', facialExpressions: true, handGestures: true, autoSpeak: true };
export function normalizeTutorPresentation(input: unknown): TutorPresentation {
  const value = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return { motion: ['subtle', 'expressive', 'off'].includes(String(value.motion)) ? value.motion as TutorMotion : 'subtle', facialExpressions: typeof value.facialExpressions === 'boolean' ? value.facialExpressions : true, handGestures: typeof value.handGestures === 'boolean' ? value.handGestures : true, autoSpeak: typeof value.autoSpeak === 'boolean' ? value.autoSpeak : true };
}
