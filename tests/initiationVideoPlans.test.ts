import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createInitiationVideoPlansRouter} from '../backend/initiationVideoPlans';
import {buildInitiationModules} from '../src/data/initiationCurriculum';
import {buildSynchronizedLessonScreens} from '../src/components/ProfessorFilmScenes';

test('hosted authoring only highlights exact source text, caches plans, and rejects inventions',async()=>{
 const course=buildInitiationModules([''])[0],lesson=course.lessons[0];
 const original=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code!,course.legalRef!,0).sentences;
 let calls=0,saved:any=null,bad=false;
 const db={collection:()=>({doc:()=>({get:async()=>({exists:!!saved,data:()=>saved}),set:async(plan:any)=>{saved=plan;}})})};
 const app=express();app.use(express.json());app.use(createInitiationVideoPlansRouter({db:()=>db,author:async()=>{calls++;return JSON.stringify(original.map(()=>bad?'Un seuil inventé de 9000 dollars':0));}}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${(server.address() as any).port}/initiation/video-plan`;
 const send=(body:any)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await send({courseId:'arbitrary',lessonIndex:0})).status,400);assert.equal(calls,0);
  const response=await send({courseId:course.id,lessonIndex:0});assert.equal(response.status,200);const plan=await response.json();assert.deepEqual(plan.scenes.map((s:any)=>s.text),original);assert.equal(plan.model,'academia-tuteur');
  assert.equal((await send({courseId:course.id,lessonIndex:0})).status,200);assert.equal(calls,1);
  saved=null;bad=true;assert.equal((await send({courseId:course.id,lessonIndex:0})).status,503);assert.equal(saved,null);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
