export type TutorVoiceMode = 'studio' | 'device';
export const TUTOR_VOICE_MODE_KEY = 'academia-tutor-voice-mode-v2';
export function readTutorVoiceMode(storage: Pick<Storage, 'getItem'> | null, defaultMode: TutorVoiceMode = 'studio'): TutorVoiceMode {
  try { const chosen = storage?.getItem(TUTOR_VOICE_MODE_KEY); return chosen === 'studio' || chosen === 'device' ? chosen : defaultMode; } catch { return defaultMode; }
}
