import type { SingleScreenCardData } from '../components/ProfessorFilmScenes';
import { readCourseMotionStoryboard, type CourseMotionStoryboard } from '../../shared/courseMotionVideo';
import { paginateLessonText } from './motionLessonStoryboard';
import { lessonConceptLabels } from './lessonConceptLabels';

export function courseMotionStoryboard(screen: SingleScreenCardData, chapter: string, sceneIndex: number, sceneCount: number, music: boolean): CourseMotionStoryboard {
 const explanation = paginateLessonText(screen.explanation,40).filter(Boolean), rules = paginateLessonText(screen.fieldRule,40).filter(Boolean);
 const start = Math.max(0, Math.min(.3, screen.explanationStartRatio ?? 0));
 const rule = rules.length ? Math.max(start+.2, Math.min(.995, screen.fieldRuleStartRatio ?? .75)) : 1;
 const section=(pages:string[],from:number,to:number,phase:'explanation'|'rule')=>{
  const lengths=pages.map(text=>text.split(/\s+/).length),total=lengths.reduce((a,b)=>a+b,0);let before=0;
  return pages.map((text,i)=>{const cue={text,start:from+(to-from)*before/total,phase};before+=lengths[i];return cue;});
 };
 const cues = [...section(explanation,start,rule,'explanation'),...section(rules,rule,1,'rule')];
 const story=readCourseMotionStoryboard({title:screen.title,chapter,sceneIndex,sceneCount,music,legalRef:screen.legalArticle || '',terms:lessonConceptLabels(screen.explanation+' '+screen.fieldRule,screen.title).filter(term=>term.length<=80),cues});
 if (!story) throw new Error('Cette séquence doit être vérifiée avant sa mise en vidéo.');
 return story;
}
