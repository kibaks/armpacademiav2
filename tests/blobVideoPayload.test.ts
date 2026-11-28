import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveVideoPayload,loadVideoPayload} from '../backend/huggingFaceTutorVideo';

test('tutor media uses private Blob with job isolation and cleans up a failed metadata write',async()=>{
 const previous=process.env.BLOB_STORE_ID;process.env.BLOB_STORE_ID='test';
 const id='a'.repeat(64),bytes=Buffer.from('private tutor media');let job:any={},deleted='';
 const ref={id,update:async(p:any)=>{job={...job,...p};},collection:()=>{throw Error('Binary must not reach Firestore');}};
 const ops={put:async(path:string,_bytes:any,options:any)=>{assert.equal(options.access,'private');assert.deepEqual(_bytes,bytes);return {pathname:path} as any;},del:async(path:any)=>{deleted=path;}};
 try{
  await saveVideoPayload(ref,'video',bytes,ops as any);assert.equal(job.videoBytes,bytes.length);assert.ok(job.videoBlobPath.startsWith(`academia/tutor/${id}/`));
  let reads=0;const reader={get:async()=>{reads++;return {statusCode:200,stream:new ReadableStream({start(c){c.enqueue(bytes);c.close();}})} as any;}};
  assert.deepEqual(await loadVideoPayload(ref,job,'video',reader as any),bytes);
  await assert.rejects(loadVideoPayload(ref,{...job,videoBlobPath:`academia/tutor/${'b'.repeat(64)}/video.mp4`},'video',reader as any),/Invalid media path/);assert.equal(reads,1);
  await assert.rejects(loadVideoPayload(ref,{...job,videoBytes:999},'video',reader as any),/Incomplete/);
  await assert.rejects(saveVideoPayload({...ref,update:async()=>{throw Error('metadata unavailable');}},'audio',bytes,ops as any),/metadata unavailable/);assert.ok(deleted.endsWith('/audio.mp3'));
 }finally{if(previous===undefined)delete process.env.BLOB_STORE_ID;else process.env.BLOB_STORE_ID=previous;}
});

test('existing Firestore media remains readable',async()=>{
 const bytes=Buffer.from('legacy recording');const ref={collection:()=>({doc:()=>({get:async()=>({data:()=>({data:bytes.toString('base64')})})})})};
 assert.deepEqual(await loadVideoPayload(ref,{audioParts:1,audioBytes:bytes.length},'audio'),bytes);
});
