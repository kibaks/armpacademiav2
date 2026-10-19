import type { SingleScreenCardData } from '../components/ProfessorFilmScenes';

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const sentenceSegmenter = new Intl.Segmenter('fr', { granularity: 'sentence' });

/** Character-weighted cues on the existing audio clock, not word timestamps. */
export function spokenLessonCue(screen: SingleScreenCardData, progress: number) {
  const p = clamp(progress);
  const boundary = screen.fieldRule.trim() && Number.isFinite(screen.fieldRuleStartRatio)
    ? clamp(screen.fieldRuleStartRatio) : 1;
  const rule = Boolean(screen.fieldRule.trim()) && p >= boundary;
  const phase = rule ? 'rule' as const : 'explanation' as const;
  const source = (rule ? screen.fieldRule : screen.explanation).trim();
  const start = rule ? boundary : clamp(screen.explanationStartRatio);
  const end = rule ? 1 : boundary;
  const sectionProgress = clamp((p - start) / Math.max(.000001, end - start));
  const segments = [...sentenceSegmenter.segment(source)]
    .map(segment => ({ text: segment.segment.trim(), start: segment.index, end: segment.index + segment.segment.length }))
    .filter(segment => segment.text.length > 0);
  const position = sectionProgress * source.length;
  const index = Math.max(0, segments.findIndex(segment => position < segment.end));
  const selectedIndex = sectionProgress === 1 ? Math.max(0, segments.length - 1) : index;
  const selected = segments[selectedIndex];
  return {
    phase, text: selected?.text || source, index: selectedIndex, count: segments.length,
    progress: selected ? clamp((position - selected.start) / Math.max(1, selected.end - selected.start)) : 0,
    sectionProgress,
  };
}
