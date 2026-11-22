import {readCourseMotionStoryboard,type CourseMotionStoryboard} from '../../shared/courseMotionVideo';
import {lessonConceptLabels} from './lessonConceptLabels';
export type TutorVideoContext={question?:string;lessonTitle?:string};
/** Only the actual answer is illustrated. No stock lesson or generated legal claim. */
export function tutorReplyStoryboard(text:string,context:TutorVideoContext={}):CourseMotionStoryboard|null{
 const source=text.trim().replace(/\s+/g,' ');
 if(!source || source.length>3000)return null;
 const pages:string[]=[];let page='';
 for(const word of source.split(' ')){
  if(word.length>500)return null;
  if(page && (page+' '+word).length>440){pages.push(page);page='';}
  page+=(page?' ':'')+word;
 }
 if(page)pages.push(page);
 if(pages.length>8)return null;
 const title=(context.question?.trim()||'Votre question').slice(0,250),chapter=(context.lessonTitle?.trim()||'Réponse de la tutrice').slice(0,250);
 const counts=pages.map(p=>p.split(' ').length),total=counts.reduce((a,b)=>a+b,0);let before=0;
 const cues=pages.map((text,i)=>{const cue={text,start:before/total,phase:'explanation' as const};before+=counts[i];return cue;});
 return readCourseMotionStoryboard({title,chapter,sceneIndex:0,sceneCount:1,terms:lessonConceptLabels(source,title).filter(t=>t.length<=80),cues,legalRef:'',music:false});
}
