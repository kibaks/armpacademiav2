/** Explicit learner choice; never infer language or accent from a name. */
export const TUTOR_LANGUAGES = [
  { code: 'fr', locale: 'fr-CD', label: 'Français', guidance: 'Français professionnel, simple et respectueux.' },
  { code: 'ln', locale: 'ln-CD', label: 'Lingala', guidance: 'Lingala de RDC. Préserve ɛ, ɔ et les marques tonales attestées ; ne remplace pas ces voyelles par e et o.' },
  { code: 'sw', locale: 'sw-CD', label: 'Swahili', guidance: 'Kiswahili de RDC. Respecte la variété demandée, les voyelles et la prosodie du kiswahili ; n’ajoute pas de marques tonales artificielles.' },
  { code: 'kg', locale: 'kg-CD', label: 'Kikongo', guidance: 'Kikongo. Ne confonds pas automatiquement kikongo et kituba : si la variété change le sens, demande une précision. Préserve les tons et la graphie fournis.' },
  { code: 'lua', locale: 'lua-CD', label: 'Tshiluba', guidance: 'Tshiluba (ciluba) de RDC. Respecte les voyelles, la longueur vocalique et les tons attestés, sans franciser les mots.' },
] as const;
export type TutorLanguage = typeof TUTOR_LANGUAGES[number]['code'];
export function tutorLanguage(value: unknown): TutorLanguage {
  return TUTOR_LANGUAGES.some(item => item.code === value) ? value as TutorLanguage : 'fr';
}
export function tutorLanguageProfile(value: unknown) {
  return TUTOR_LANGUAGES.find(item => item.code === tutorLanguage(value))!;
}
export function tutorLanguageInstruction(value: unknown) {
  const profile = tutorLanguageProfile(value);
  if (profile.code === 'fr') return '';
  return `Langue de réponse choisie : ${profile.label} (${profile.locale}). ${profile.guidance}
Rédige la réponse dans cette langue. Cette préférence remplace uniquement la consigne de répondre en français ; toutes les exigences de fiabilité, de pédagogie et de sources restent applicables.
Conserve les noms propres, les références juridiques et les signes diacritiques Unicode. N’invente pas de tons ni de traduction technique incertaine : conserve le terme juridique français entre parenthèses et signale l’incertitude. Ne prétends pas maîtriser une variante que tu ne connais pas. Ne transpose pas les règles phonétiques françaises aux langues nationales. Le libellé « Exemple fictif : » reste inchangé pour identifier les illustrations.`;
}

export function normalizeNationalSpeech(text: string) {
  return text.normalize('NFC').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*#`_>]/g, '').replace(/\s+/g, ' ').trim();
}
export function nationalVoiceAvailable(language: TutorLanguage, text = '') {
  if (language === 'fr' || language === 'sw') return true;
  if (language !== 'ln') return false;
  return !Array.from(text.normalize('NFC').toLowerCase()).some(char => /[\p{L}\p{M}\p{N}]/u.test(char) && !"abcdefghijklmnopqrstuvwyz012345678".includes(char));
}

/** Bound national speech requests without stripping accents or losing words. */
export function nationalSpeechChunks(text: string, limit = 500): string[] {
  const words=normalizeNationalSpeech(text).split(/\s+/).filter(Boolean);
  const chunks:string[]=[];
  let current='';
  for (const word of words) {
    if (current && current.length+1+word.length>limit) {chunks.push(current);current='';}
    current=current ? current+' '+word : word;
  }
  if (current) chunks.push(current);
  return chunks;
}
