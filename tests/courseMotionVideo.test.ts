import test from 'node:test';
import assert from 'node:assert/strict';
import { readCourseMotionStoryboard } from '../shared/courseMotionVideo';
import { courseMotionStoryboard } from '../src/utils/courseMotionStoryboard';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes';
import { buildCourseCatalog } from '../shared/courseCatalog';
const course=buildCourseCatalog()[0],lesson=course.lessons[0];
const calibrated=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code,course.legalRef,0);
test('every official introductory chapter produces complete, ordered film storyboards',()=>{
 for(const course of buildCourseCatalog().filter(c=>c.level==='Fondamental'))for(let n=0;n<course.lessons.length;n++){
  const lesson=course.lessons[n],data=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code,course.legalRef,n);
  assert.equal(data.sentences.length,data.sceneData.screens.length);
  data.sceneData.screens.forEach((screen,index)=>{
   assert.ok(data.sentences[index].length<=3000);
   const story=courseMotionStoryboard(screen,lesson.title,index,data.sceneData.screens.length,true);
   assert.ok(readCourseMotionStoryboard(story));assert.equal(story.sceneIndex,index);
   assert.ok(story.cues.every((cue,i)=>i===0||cue.start>story.cues[i-1].start));
  });
 }
});
test('film metadata rejects unbounded captions, invalid timing and unsafe values',()=>{
 const story=courseMotionStoryboard(calibrated.sceneData.screens[0],lesson.title,0,calibrated.sceneData.screens.length,false);
 for(const patch of [{sceneIndex:-1},{sceneCount:99},{music:'yes'},{cues:[{text:'Texte',start:Infinity,phase:'rule'}]},{cues:[{text:'x'.repeat(501),start:0,phase:'rule'}]}])assert.equal(readCourseMotionStoryboard({...story,...patch}),null);
 assert.deepEqual(readCourseMotionStoryboard({...story,externalUrl:'https://example.test/asset'}),story);
});

import { courseVideoRequest, waitForCourseVideo } from '../src/utils/courseMotionVideo';
test('film tracking waits for finalized video and returns its signed HTTPS URL',async()=>{
 const signal=new AbortController().signal;let calls=0,waits=0;
 const result=await waitForCourseVideo('a'.repeat(64),signal,async()=>{
  calls++;return Response.json(calls===1?{status:'PENDING'}:{status:'COMPLETED',videoUrl:'https://engines.example/movie.mp4?ticket=test'});
 },async()=>{waits++;});
 assert.equal(result.id,'a'.repeat(64));assert.equal(waits,1);assert.equal(calls,2);
});
test('an interrupted follow-up does not submit another job and invalid responses have a usable error',async()=>{
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(courseVideoRequest('',{},controller.signal,async()=>{calls++;return Response.json({});}));assert.equal(calls,0);
 await assert.rejects(courseVideoRequest('',{},new AbortController().signal,async()=>new Response('<html>Unavailable</html>',{status:503})),/moteur vidéo/);
 await assert.rejects(waitForCourseVideo('a'.repeat(64),new AbortController().signal,async()=>Response.json({status:'FAILED',error:'Échec de cette séquence.'}),async()=>{}),/Échec de cette séquence/);
});
