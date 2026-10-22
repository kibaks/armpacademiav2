import type { CourseModule } from '../types';
import { lessonContext } from './lessonContext';
import { lessonEssentialSummary, lessonDisplayHeading } from './lessonEssentialSummary';

const clean = (text: string) => text.replace(/\[Sc[èe]ne\s*:[^\]]*\]/gi, '').replace(/\*\*/g, '').trim();
const sentences = (text: string) => Array.from(new Intl.Segmenter('fr', { granularity: 'sentence' }).segment(text), part => part.segment.trim()).filter(Boolean);

/** Extractive recap: keep the course's wording and conditions, without adding rules. */
export function buildModuleSummary(course: CourseModule) {
  const lessons = course.lessons?.length ? course.lessons : [{ id: course.id, title: course.title, content: course.description }];
  return lessons.map((lesson, index) => {
    const paragraphs = lesson.content.split(/\n\s*\n/).map(clean).filter(Boolean);
    const explanations = paragraphs.filter(text => !/^(Cas fictif|À vous de jouer)\s*:/i.test(text));
    const points = (explanations.length ? explanations : paragraphs).map(text => {
      const parts = text.split(/\|\s*Application terrain\s*:/i);
      const body = parts[0].replace(/^[^:.!?]{1,160}\s:\s*/, '');
      return sentences(body)[0] || body;
    }).filter(Boolean);
    const unique = [...new Set(points)];
    const takeaway = paragraphs.find(text => /^À retenir\s*:/i.test(text))?.replace(/^À retenir\s*:\s*/i, '');
    const brief = [...new Set([unique[0], takeaway || unique[unique.length - 1]])].filter(Boolean);
    const context = lessonContext(lesson.title, '', index + 1);
    const caption = lessonEssentialSummary(unique.join(' '), takeaway, context.question)[0] || lessonDisplayHeading(lesson.title, 'Les notions essentielles');
    return {
      num: index + 1,
      pillarTag: `Chapitre ${index + 1}`,
      title: lesson.title,
      caption,
      terms: context.terms,
      color: ['#2563EB', '#059669', '#7C3AED', '#D97706'][index % 4],
      spoken: brief.join(' ') || clean(course.description),
    };
  });
}
