// Keep whole sentences: never discard a negation or a legal condition to fit a caption.
export function compactLessonPhrases(text: string, fallback = 'Reliez la notion aux faits et aux conditions du dossier.'): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const selected = sentences.map(s => s.trim()).filter(s => {
    const words = s.split(/\s+/).length;
    return words >= 4 && words <= 24 && s.length <= 185 && !/reformule le texte|référence du chapitre/i.test(s);
  });
  return [...new Set(selected)].slice(0, 3).length ? [...new Set(selected)].slice(0, 3) : [fallback];
}
export function motionCaptionAt(phrases: readonly string[], progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(.999999, progress)) : 0;
  const index = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
  return { index: Math.max(0, index), text: phrases[index] || '', progress: p * Math.max(1, phrases.length) - Math.max(0, index) };
}


/** Use the chapter's actual sentences instead of repeated stock topic captions. */
export function contextualLessonPhrases(_title: string, text: string, fallback?: string) {
  const exact = compactLessonPhrases(text, '');
  if (exact[0]) return exact;
  if (fallback) return [fallback];
  // A complete long sentence is preferable to an invented or truncated legal rule.
  const complete = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return [...new Set(complete.map(s => s.trim()).filter(Boolean))].slice(0,3);
}
