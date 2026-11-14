import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorMediaStatus} from '../backend/tutorMediaHealth';
const env={STT_API_URL:'https://engines.example/stt/transcribe',STT_API_KEY:'stt-secret',PIPER_TTS_URL:'https://engines.example/piper/synthesize',PIPER_TTS_API_KEY:'speech-secret',MUSETALK_API_URL:'https://engines.example/musetalk',MUSETALK_API_KEY:'video-secret',TUTOR_VIDEO_ENABLED:'true'};
test('media readiness verifies each engine without exposing configuration or credentials',async()=>{
 const paths:string[]=[];
 const request=(async(url:any,options:any)=>{
  paths.push(url.pathname);
  assert.equal(options.redirect,'error');
  assert.ok(options.headers.Authorization.startsWith('Bearer '));
  return new Response(JSON.stringify(url.pathname.includes('piper')?{status:'ok',engine:'piper'}:{ready:true}));
 }) as typeof fetch;
 assert.deepEqual(await tutorMediaStatus(env,request),{transcription:true,speech:true,video:true});
 assert.deepEqual(paths.sort(),['/musetalk/health','/piper/health','/stt/health']);
});
test('offline, unauthorized and disabled engines never report an active service',async()=>{
 const request=(async()=>new Response('{}',{status:401})) as typeof fetch;
 assert.deepEqual(await tutorMediaStatus(env,request),{transcription:false,speech:false,video:false});
 assert.deepEqual(await tutorMediaStatus({...env,TUTOR_VIDEO_ENABLED:'false'},(async()=>new Response('{"ready":true,"status":"ok","engine":"piper"}')) as typeof fetch),{transcription:true,speech:true,video:false});
 assert.deepEqual(await tutorMediaStatus({},request),{transcription:false,speech:false,video:false});
});
