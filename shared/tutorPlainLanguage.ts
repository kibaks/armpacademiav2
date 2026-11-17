import type { TutorLanguage } from './tutorLanguages.js';

/** Plain French source makes the local translation easier to understand. */
export function tutorPlainLanguagePolicy(language?: TutorLanguage): string {
  if (language !== 'ln' && language !== 'kg') return '';
  return `Source destinée au ${language === 'ln' ? 'lingala courant de Kinshasa' : 'kituba courant du Bandundu'} : reste en français ici, la traduction est séparée. Utilise des phrases courtes, une idée par phrase, des mots du quotidien et un ton oral respectueux. Deux phrases pour une définition ; 60 à 90 mots pour expliquer, sauf précision indispensable. Évite les tournures administratives ou littéraires. Explique simplement les termes techniques utiles. Aucun argot ou accent imité. Respecte la définition fournie : ne confonds pas ce qui est nécessaire avec une simple envie. Conserve toutes les conditions, exceptions, noms, nombres et références utiles des documents fournis. La simplification ne change ni les faits ni le sens juridique. Un exemple reste explicitement fictif. Ne supprime aucune information nécessaire pour raccourcir.`;
}
