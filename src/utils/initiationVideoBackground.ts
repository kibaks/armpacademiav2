import type { CourseModule } from '../types';
import { authenticatedFetch } from '../lib/adminApi';
import { courseVideoRequest, waitForCourseVideo } from './courseMotionVideo';
import { publishedInitiationVideo } from './publishedInitiationVideos';

const ready=new Map<string,string>();
const listeners=new Set<()=>void>();
export const subscribeInitiationVideos=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const initiationVideoKey=(id:string,index:number,content:string)=>JSON.stringify([id,index,content]);
export function generatedInitiationVideo(id:string,index:number,content:string){return ready.get(initiationVideoKey(id,index,content));}
export function clearGeneratedInitiationVideos(){for(const url of ready.values())URL.revokeObjectURL(url);ready.clear();listeners.forEach(fn=>fn());}
export async function prepareInitiationVideos(courses:CourseModule[],userId:string,signal:AbortSignal){
 let disk:Cache;
 try{disk=await caches.open(`academia-generated-initiation-v1:${encodeURIComponent(userId)}`);}catch{return;}
 for(const course of courses.filter(c=>/^INIT-\d{2}$/.test(c.id)))for(const [index,lesson] of course.lessons.entries()){
  if(signal.aborted)return;
  if(publishedInitiationVideo(course.id,index,lesson.content))continue;
  const key=initiationVideoKey(course.id,index,lesson.content);
  if(ready.has(key))continue;
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key))),b=>b.toString(16).padStart(2,'0')).join('');
  const cacheUrl=new URL('/__academia-initiation-video/'+digest+'.mp4',location.origin).href;
  const show=(blob:Blob)=>{if(signal.aborted)return;ready.set(key,URL.createObjectURL(blob));listeners.forEach(fn=>fn());};
  const cached=await disk.match(cacheUrl);if(cached){show(await cached.blob());continue;}
  try{
   const response=await authenticatedFetch('/api/ai/initiation/video-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId:course.id,lessonIndex:index}),signal:AbortSignal.any([signal,AbortSignal.timeout(60000)])});
   if(!response.ok)return;
   const plan=await response.json();
   if(plan.content!==lesson.content||!Array.isArray(plan.scenes)||plan.scenes.length>12)return;
   const parts:string[]=[];
   for(const scene of plan.scenes){
    signal.throwIfAborted();
    const job=await courseVideoRequest('',{text:scene.text,lesson:scene.lesson,persona:'vivienne',language:'fr',retry:true},signal);
    const result=await waitForCourseVideo(job.id,signal);parts.push(result.id);
   }
   const film=await courseVideoRequest('/film',{parts},signal),result=await waitForCourseVideo(film.id,signal);
   const mediaSignal=AbortSignal.any([signal,AbortSignal.timeout(60000)]);
   const media=result.url.startsWith('/api/') ? await authenticatedFetch(result.url,{signal:mediaSignal}) : await fetch(result.url,{signal:mediaSignal,credentials:'omit'});
   if(!media.ok||!media.headers.get('Content-Type')?.includes('video/mp4'))return;
   const blob=await media.blob();if(signal.aborted)return;
   if(blob.size>24000000)return;
   await disk.put(cacheUrl,new Response(blob,{headers:{'Content-Type':'video/mp4'}}));show(blob);
  }catch{return;}
 }
}
