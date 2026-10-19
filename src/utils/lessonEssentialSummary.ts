import { compactLessonPhrases } from './lessonMotionCues';

const concise = (text: string) => Boolean(text.trim()) && text.trim().split(/\s+/).length <= 12 && text.trim().length <= 96;

export function lessonDisplayHeading(title: string, fallback: string) {
  if (concise(title)) return title;
  const mainHeading = title.split(/[,;:—]/u)[0].trim();
  if (concise(mainHeading)) return mainHeading;
  return concise(fallback) ? fallback : 'Repères du chapitre';
}

/** One short sentence, including on mobile; never paginate full narration. */
export function lessonEssentialSummary(source: string, authored: string | undefined, fallback: string) {
  const displayAuthored = authored === 'L’estimation prépare le budget ; elle ne fixe pas le prix du contrat.'
    ? 'L’estimation prépare le budget, sans fixer le prix du contrat.' : authored;
  if (displayAuthored && concise(displayAuthored)) return [displayAuthored];
  const extracted = compactLessonPhrases(source, '').filter(concise);
  if (extracted.length) return extracted.slice(0, 1);
  // Keep legal conditions intact: use a supplied teaching summary rather than
  // cutting a long spoken sentence or sending the whole paragraph to the screen.
  return concise(fallback) ? [fallback] : [];
}
