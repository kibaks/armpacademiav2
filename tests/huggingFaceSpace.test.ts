import assert from 'node:assert/strict';
import {test} from 'node:test';
import {preparePrivateSpace} from '../backend/huggingFaceSpace';
test('a sleeping Space wakes through a bounded health visit before any generation is submitted',async()=>{
 const calls:string[]=[];
 const ready=await preparePrivateSpace('private-key',async(url,init)=>{
  calls.push(String(url));assert.equal((init?.headers as any).authorization,'Bearer private-key');assert.equal(init?.body,undefined);assert.ok(init?.signal);
  return String(url).endsWith('/health')?new Response('',{status:503}):Response.json({runtime:{stage:'SLEEPING'}});
 });
 assert.equal(ready,false);assert.equal(calls.length,2);assert.ok(calls[1].endsWith('/health'));
});
test('a healthy Space caches readiness briefly; paused or failed Spaces are not advertised as waking',async()=>{
 let calls=0;
 const request:typeof fetch=async()=>{calls++;return Response.json({runtime:{stage:'RUNNING'}});};
 assert.equal(await preparePrivateSpace('key',request),true);assert.equal(await preparePrivateSpace('key',request),true);assert.equal(calls,1);
 for(const stage of ['PAUSED','RUNTIME_ERROR','BUILD_ERROR']) await assert.rejects(preparePrivateSpace('key',async()=>Response.json({runtime:{stage}})),/unavailable/);
 assert.equal(await preparePrivateSpace('key',async()=>Response.json({runtime:{stage:'APP_STARTING'}})),false);
});
