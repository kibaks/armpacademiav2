import { compactLessonPhrases } from './lessonMotionCues';

/** Display only a few essential sentences; never paginate the full narration. */
export function lessonEssentialSummary(source: string, authored: string | undefined, fallback: string) {
  const concise = (text: string) => text.trim().split(/\s+/).length <= 24 && text.trim().length <= 185;
  if (authored && concise(authored)) return [authored];
  const extracted = compactLessonPhrases(source, '').filter(Boolean);
  if (extracted.length) return extracted.slice(0, 2);
  // Keep legal conditions intact: use a supplied teaching summary rather than
  // cutting a long spoken sentence or sending the whole paragraph to the screen.
  return concise(fallback) ? [fallback] : [];
}
