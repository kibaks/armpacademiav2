export const TUTOR_VOICES = {
  vivienne: { gender: 'female', voices: ['fr-FR-VivienneMultilingualNeural', 'fr-FR-DeniseNeural'], rate: '-2%', pitch: '-4Hz' },
  denise: { gender: 'female', voices: ['fr-FR-DeniseNeural', 'fr-FR-VivienneMultilingualNeural'], rate: '-3%', pitch: '-8Hz' },
  charline: { gender: 'female', voices: ['fr-FR-CelesteNeural', 'fr-FR-DeniseNeural'], rate: '-4%', pitch: '-10Hz' },
  eloise: { gender: 'female', voices: ['fr-FR-BrigitteNeural', 'fr-FR-DeniseNeural'], rate: '-3%', pitch: '-8Hz' },
  henri: { gender: 'male', voices: ['fr-FR-HenriNeural', 'fr-FR-RemyMultilingualNeural'], rate: '-4%', pitch: '-10Hz' },
} as const;
export type TutorPersona = keyof typeof TUTOR_VOICES;
export function getTutorVoice(persona?: string) {
  return TUTOR_VOICES[persona as TutorPersona] || TUTOR_VOICES.vivienne;
}
const DEFAULT_ELEVEN_VOICES: Record<TutorPersona, string> = {
  henri: 'pNInz6obpgDQGcFmaJgB', vivienne: 'EXAVITQu4vr4xnSDxMaL', denise: 'XrExE9yKIg1WjnnlVkGX', charline: 'pFZP5JQG7iQjIQuC4Bku', eloise: 'Xb7hH8MSUJpSbSDYk0k2',
};
export function getElevenLabsTutorVoice(persona: string, env: Record<string, string | undefined>) {
  const specific = env[`ELEVENLABS_VOICE_ID_${persona.toUpperCase()}`];
  if (specific) return specific;
  return (getTutorVoice(persona).gender === 'male' ? env.ELEVENLABS_MALE_VOICE_ID : env.ELEVENLABS_FEMALE_VOICE_ID || env.ELEVENLABS_VOICE_ID) || DEFAULT_ELEVEN_VOICES[persona as TutorPersona] || DEFAULT_ELEVEN_VOICES.vivienne;
}
