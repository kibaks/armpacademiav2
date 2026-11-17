import type { SingleScreenCardData } from '../components/ProfessorFilmScenes';
import { readCourseMotionStoryboard, type CourseMotionStoryboard } from '../../shared/courseMotionVideo';
import { essentialLessonCues } from './motionLessonStoryboard';
import { lessonConceptLabels } from './lessonConceptLabels';

export function courseMotionStoryboard(screen: SingleScreenCardData, chapter: string, sceneIndex: number, sceneCount: number, music: boolean): CourseMotionStoryboard {
 const explanation = essentialLessonCues(screen.explanation), rules = essentialLessonCues(screen.fieldRule);
 const start = Math.max(0, Math.min(.3, screen.explanationStartRatio || .08));
 const rule = Math.max(start+.2, Math.min(.95, screen.fieldRuleStartRatio || .75));
 const cues = [
  ...explanation.map((text,i)=>({text,start:start+(rule-start)*i/explanation.length,phase:'explanation' as const})),
  ...rules.map((text,i)=>({text,start:rule+(1-rule)*i/rules.length,phase:'rule' as const}))
 ];
 const story=readCourseMotionStoryboard({title:screen.title,chapter,sceneIndex,sceneCount,music,legalRef:screen.legalArticle || '',terms:lessonConceptLabels(screen.explanation+' '+screen.fieldRule,screen.title).filter(term=>term.length<=80),cues});
 if (!story) throw new Error('Cette séquence doit être vérifiée avant sa mise en vidéo.');
 return story;
}
