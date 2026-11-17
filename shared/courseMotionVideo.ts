export type MotionCue = { text: string; start: number; phase: 'explanation' | 'rule' };
export type CourseMotionStoryboard = { title: string; chapter: string; sceneIndex: number; sceneCount: number; terms: string[]; cues: MotionCue[]; legalRef: string; music: boolean };
export function readCourseMotionStoryboard(value: unknown): CourseMotionStoryboard | null {
 if (!value || typeof value !== 'object') return null;
 const v = value as Record<string, any>;
 const text = (s: unknown, max: number) => typeof s === 'string' && s.trim().length > 0 && s.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
 if (!text(v.title,250) || !text(v.chapter,250) || !Number.isInteger(v.sceneIndex) || !Number.isInteger(v.sceneCount) || v.sceneCount<1 || v.sceneCount>12 || v.sceneIndex<0 || v.sceneIndex>=v.sceneCount || typeof v.music !== 'boolean') return null;
 if (!Array.isArray(v.terms) || v.terms.length>3 || !v.terms.every((s:unknown)=>text(s,80)) || !Array.isArray(v.cues) || v.cues.length<1 || v.cues.length>8 || typeof v.legalRef!=='string' || v.legalRef.length>500) return null;
 let previous = -1;
 for (const cue of v.cues) {
  if (!cue || !text(cue.text,500) || typeof cue.start!=='number' || !Number.isFinite(cue.start) || cue.start<0 || cue.start>=1 || cue.start<=previous || !['explanation','rule'].includes(cue.phase)) return null;
  previous=cue.start;
 }
 return {title:v.title.trim(),chapter:v.chapter.trim(),sceneIndex:v.sceneIndex,sceneCount:v.sceneCount,terms:[...v.terms],cues:v.cues.map((c:MotionCue)=>({text:c.text,start:c.start,phase:c.phase})),legalRef:v.legalRef,music:v.music};
}
