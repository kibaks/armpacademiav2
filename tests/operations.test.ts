import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createOperationsRouter} from '../backend/operations';
import {buildCourseCatalog} from '../shared/courseCatalog';
const c=buildCourseCatalog()[0];
const records=new Map<string,any>();
records.set('users/learner',{id:'learner',role:'particulier',name:'Esther',institution:'ARMP',email:'private@example.cd',completedLessonsByCourse:{[c.id]:c.lessons.map((_,i)=>i)}});
records.set('users/stranger',{id:'stranger',role:'particulier',name:'David'});
records.set('users/trainer',{id:'trainer',role:'formateur',name:'Trainer',registeredCourseIds:[c.id]});
records.set('posts/post-1',{id:'post-1',authorId:'stranger',content:'Bonjour',likes:0,likedBy:[],comments:[]});
let seq=0;
function reference(name:string,id:string) {const key=`${name}/${id}`;return {id,key,get:async()=>({exists:records.has(key),data:()=>records.get(key)}),set:async(data:any)=>records.set(key,data),update:async(data:any)=>records.set(key,{...records.get(key),...data})};}
const db:any={collection:(name:string)=>({doc:(id?:string)=>reference(name,id || `id-${++seq}`),get:async()=>({docs:[...records].filter(([key])=>key.startsWith(name+'/')).map(([key,data])=>({id:key.split('/')[1],data:()=>data}))}),where:(field:string,op:string,value:any)=>({get:async()=>({docs:[...records].filter(([key,d])=>key.startsWith(name+'/') && d[field]===value).map(([key,d])=>({id:key.split('/')[1],data:()=>d}))})}),add:async(data:any)=>records.set(`${name}/id-${++seq}`,data)}),runTransaction:async(fn:any)=>fn({get:(r:any)=>r.get(),set:(r:any,d:any)=>r.set(d),update:(r:any,d:any)=>r.update(d)})};
const app=express();app.use(express.json());app.use('/api',createOperationsRouter({db,authenticate:(req:any,res,next)=>{const uid=req.get('X-Test-User');if(!uid)return void res.status(401).json({error:'auth'});req.identity={uid,role:uid==='admin'?'super_admin':records.get(`users/${uid}`)?.role};next();},generate:async()=> 'Présentation\n- Introduction\n===\nComprendre\n- Exercice pratique'}));
const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const url=`http://127.0.0.1:${(server.address() as any).port}/api`;
after(()=>server.close());
const request=(path:string,user?:string,body?:unknown)=>fetch(url+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(user?{'X-Test-User':user}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
test('authentication, administrator analytics and private learner profile scopes',async()=>{
 assert.equal((await request('/profiles')).status,401);assert.equal((await request('/analytics','learner')).status,403);
 const own=await(await request('/profiles','learner')).json();assert.equal(own.profiles.length,1);assert.equal(own.profiles[0].id,'learner');
 const staff=await(await request('/profiles','trainer')).json();assert.equal(staff.profiles.length,1);assert.equal('email' in staff.profiles[0],false);assert.equal(staff.profiles[0].id,'learner');
});
test('failed quiz never issues a certificate; success is stable and idempotent',async()=>{
 const failed=await(await request(`/courses/${c.id}/attempt`,'learner',{answers:c.quiz.map(q=>(q.correctIndex+1)%q.options.length),score:100})).json();assert.equal(failed.score,0);assert.equal(failed.certificate,null);
 const passed=await(await request(`/courses/${c.id}/attempt`,'learner',{answers:c.quiz.map(q=>q.correctIndex),profileId:'stranger'})).json();assert.equal(passed.score,100);assert.equal(passed.profile.id,'learner');assert.equal(passed.profile.certificates.length,1);
 const retry=await(await request(`/courses/${c.id}/attempt`,'learner',{answers:c.quiz.map(q=>q.correctIndex)})).json();assert.equal(retry.certificate.id,passed.certificate.id);assert.equal(retry.profile.certificates.length,1);
 assert.equal((await request(`/courses/${c.id}/attempt`,'stranger',{answers:c.quiz.map(q=>q.correctIndex)})).status,409);
});
test('real PDF output requires a canonical owner certificate; support is a real PDF',async()=>{
 const support=await request(`/courses/${c.id}/document`,'learner');assert.equal(support.status,200);assert.equal(support.headers.get('content-type'),'application/pdf');assert.equal(Buffer.from(await support.arrayBuffer()).subarray(0,4).toString(),'%PDF');
 const certificate=await request(`/courses/${c.id}/document?kind=certificate`,'learner');assert.equal(certificate.status,200);assert.equal((await request(`/courses/${c.id}/document?kind=certificate`,'stranger')).status,404);
});
test('cross-author reactions and comments persist once without changing post ownership',async()=>{
 const a=await(await request('/posts/post-1/like','learner',{liked:true})).json();assert.equal(a.post.likes,1);assert.equal(a.post.authorId,'stranger');
 const b=await(await request('/posts/post-1/like','learner',{liked:true})).json();assert.equal(b.post.likes,1);
 const comment=await(await request('/posts/post-1/comment','learner',{text:'Merci'})).json();assert.equal(comment.post.comments[0].authorId,'learner');assert.equal(comment.post.comments[0].text,'Merci');
 assert.equal((await request('/posts/post-1/comment','learner',{text:'x'.repeat(1501)})).status,400);
});
test('trainer observations respect module and enrollment scope and are server-persisted',async()=>{
 assert.equal((await request('/trainer/observations','learner',{courseId:c.id,learnerId:'stranger',text:'test'})).status,403);
 assert.equal((await request('/trainer/observations','trainer',{courseId:c.id,learnerId:'stranger',text:'test'})).status,403);
 assert.equal((await request('/trainer/observations','trainer',{courseId:c.id,learnerId:'learner',text:'Reprendre la lecture'})).status,200);
 const result=await(await request('/trainer/observations','trainer')).json();assert.equal(result.observations[`learner_${c.id}`],'Reprendre la lecture');
});
test('presentation is a real PowerPoint archive and learners cannot generate it',async()=>{
 assert.equal((await request('/presentation','learner',{prompt:'test'})).status,403);
 const response=await request('/presentation','trainer',{prompt:'Introduction',content:'Support pédagogique',title:'Cours'});assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,2).toString(),'PK');assert.ok(bytes.includes(Buffer.from('ppt/presentation.xml')));
});
test('training decisions are administrator-only and cannot overwrite an earlier decision',async()=>{
 records.set('trainingRequests/req-1',{id:'req-1',status:'En attente',applicantEmail:'demo@example.test'});
 assert.equal((await request('/training/req-1/decision','learner',{status:'Approuvé par DFAT',note:'test'})).status,403);
 const decision=await request('/training/req-1/decision','admin',{status:'Approuvé par DFAT',note:'Décision de test'});assert.equal(decision.status,200);assert.equal((await decision.json()).request.status,'Approuvé par DFAT');
 assert.equal((await request('/training/req-1/decision','admin',{status:'Rejeté',note:'écraser'})).status,409);
});
test('forged profile certificate is insufficient to obtain an attestation PDF',async()=>{
 const p=records.get('users/stranger');records.set('users/stranger',{...p,certificates:[{courseId:c.id,source:'server-assessment',score:100,id:'FAKE'}]});
 assert.equal((await request(`/courses/${c.id}/document?kind=certificate`,'stranger')).status,404);
});
