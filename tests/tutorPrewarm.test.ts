import assert from 'node:assert/strict';
import {test} from 'node:test';
import express from 'express';
import {createTutorPrewarm} from '../src/utils/tutorPrewarm';
import {createTutorWarmupRouter} from '../backend/tutorWarmup';

test('login, course opening and typing share one wakeup per learner per minute without an interval',async()=>{
 let time=0,calls=0;const wake=createTutorPrewarm(()=>time);const request=async()=>{calls++;};
 await Promise.all([wake('user-a',request),wake('user-a',request)]);assert.equal(calls,1);
 time=59999;await wake('user-a',request);assert.equal(calls,1);
 time=60000;await wake('user-a',request);assert.equal(calls,2);
 await wake('user-b',request);assert.equal(calls,3);
 await wake(undefined,request);assert.equal(calls,3);
 await wake('user-c',async()=>{throw Error('offline');});
});

test('private wakeup uses a bounded health probe and never returns provider credentials',async()=>{
 const env={TUTOR_LLM_PROVIDER:'huggingface',HF_MUSETALK_URL:'https://example.endpoints.huggingface.cloud',HF_MUSETALK_TOKEN:'private-test-key'};
 for(const status of [200,503,403]) {
  let calls=0;
  const app=express();app.use('/api/ai',createTutorWarmupRouter(env,async(url,init)=>{
   calls++;assert.equal(String(url),'https://example.endpoints.huggingface.cloud/health');assert.equal((init?.headers as any).authorization,'Bearer private-test-key');assert.ok(init?.signal);assert.equal(init?.redirect,'error');return new Response('',{status});
  }));
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
  try {
   const address=server.address() as any;
   const response=await fetch(`http://127.0.0.1:${address.port}/api/ai/tutor/wake`,{method:'POST'});
   assert.equal(response.status,status===200?200:status===503?202:503);assert.equal(calls,1);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.doesNotMatch(await response.text(),/private-test-key|endpoints.huggingface/);
  } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
 }
});
