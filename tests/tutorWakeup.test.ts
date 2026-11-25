import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestTutorWithWakeup } from '../src/utils/tutorWakeup';
const warming = () => Response.json({code:'TUTOR_WARMING'},{status:503});
test('cold GPU preserves the request until ready and delivers the successful reply once',async()=>{
 let calls=0,elapsed=0,warmNotices=0;
 const response=await requestTutorWithWakeup(async()=>++calls<4?warming():Response.json({reply:'Une offre.'}),{
  currentSession:()=>true,onWarming:()=>{warmNotices++;},now:()=>elapsed,wait:async(ms)=>{elapsed+=ms;},
 });assert.equal(calls,4);assert.equal(warmNotices,3);assert.equal((await response.json()).reply,'Une offre.');
});
test('authentication, ordinary outages and invalid responses never create retry loops',async()=>{
 for(const response of [new Response('',{status:401}),Response.json({error:'Unavailable'},{status:503}),new Response('Bad gateway',{status:503})]){
  let calls=0;assert.equal(await requestTutorWithWakeup(async()=>{calls++;return response;},{currentSession:()=>true,wait:async()=>{assert.fail('Unexpected retry');}}),response);assert.equal(calls,1);
 }
});
test('logout, cancellation and a ten minute deadline stop cold-start retries',async()=>{
 let calls=0,current=true;
 await assert.rejects(requestTutorWithWakeup(async()=>{calls++;return warming();},{currentSession:()=>current,wait:async()=>{current=false;}}),/session a changé/);assert.equal(calls,1);
 const controller=new AbortController();calls=0;
 await assert.rejects(requestTutorWithWakeup(async()=>{calls++;return warming();},{currentSession:()=>true,signal:controller.signal,wait:async()=>{controller.abort();}}),/abort/i);assert.equal(calls,1);
 let elapsed=0;calls=0;
 const result=await requestTutorWithWakeup(async()=>{calls++;return warming();},{currentSession:()=>true,now:()=>elapsed,wait:async()=>{elapsed=600000;}});
 assert.equal(result.status,503);assert.equal(calls,2);
});
