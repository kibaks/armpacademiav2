import assert from 'node:assert/strict';
import {test} from 'node:test';
import {streamHuggingFaceVideo} from '../backend/huggingFaceVideoStream';

test('growing MP4 relay preserves offsets and bytes until completion',async()=>{
 const offsets:number[]=[];const output:number[]=[];
 await streamHuggingFaceVideo('a'.repeat(64),async(path,init)=>{
  assert.ok(path.endsWith('/chunk'));const offset=JSON.parse(String(init.body)).offset;offsets.push(offset);
  const data=Buffer.from(offset===0?[1,2]:[3]);
  return Response.json({data:data.toString('base64'),offset:offset+data.length,complete:offset===2});
 },async bytes=>{output.push(...bytes);},new AbortController().signal);
 assert.deepEqual(offsets,[0,2]);assert.deepEqual(output,[1,2,3]);
});
test('relay refuses repeated offsets, failed jobs and empty completions',async()=>{
 for(const body of [{data:'AQ==',offset:0,complete:false},{data:'',offset:0,complete:true}])
  await assert.rejects(streamHuggingFaceVideo('a'.repeat(64),async()=>Response.json(body),async()=>{},new AbortController().signal));
 await assert.rejects(streamHuggingFaceVideo('a'.repeat(64),async()=>new Response('',{status:503}),async()=>{},new AbortController().signal));
});
test('relay stops pulling on client cancellation and honors downstream backpressure',async()=>{
 const abort=new AbortController();let calls=0;let release!:()=>void;
 const blocked=new Promise<void>(r=>{release=r;});
 const job=streamHuggingFaceVideo('a'.repeat(64),async()=>{calls++;return Response.json({data:'AQ==',offset:1,complete:false});},async()=>{await blocked;abort.abort();},abort.signal);
 await new Promise(r=>setImmediate(r));assert.equal(calls,1);release();await assert.rejects(job,/interrupted/);assert.equal(calls,1);
});
