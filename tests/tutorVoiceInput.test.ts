import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { parseTutorRecording, transcribeTutorRecording, createTutorVoiceInput, createTutorVoiceMediaRouter, TutorVoiceError } from '../backend/tutorVoiceInput';
import { tutorHistoryForStorage, tutorAudioMime } from '../shared/tutorVoice';
const audio = Buffer.alloc(64, 1).toString('base64');
const id = 'a'.repeat(64);
const env = { STT_API_URL: 'https://voice.example/stt/transcribe', STT_API_KEY: 'server-key' };
test('browser recordings accept MIME parameters and data URLs, reject malformed or oversized input', () => {
  assert.deepEqual(parseTutorRecording('data:audio/webm;codecs=opus;base64,'+audio, 'audio/webm;codecs=opus'), { audio, mimeType: 'audio/webm' });
  assert.equal(parseTutorRecording(audio,'audio/x-m4a').mimeType, 'audio/mp4');
  assert.throws(()=>parseTutorRecording('not base64', 'audio/wav'));
  assert.throws(()=>parseTutorRecording(audio, 'text/html'));
  assert.throws(()=>parseTutorRecording('x'.repeat(8000201), 'audio/wav'));
  assert.equal(tutorAudioMime('vocal.m4a',''), 'audio/mp4');
});
test('transcription uses the authenticated owner and never exposes the service key', async () => {
  const result=await transcribeTutorRecording(audio,'audio/wav',{env,owner:'learner',fetcher:(async(url:any,init:any)=>{
    assert.equal(String(url),'https://voice.example/stt/transcribe');
    assert.equal(init.headers.Authorization,'Bearer server-key');
    assert.equal(JSON.parse(init.body).owner,'learner');assert.equal(init.redirect,'error');
    return Response.json({text:' Explique le marché public. ',recordingId:id});
  }) as typeof fetch});
  assert.deepEqual(result,{text:'Explique le marché public.',recordingId:id});
  await assert.rejects(transcribeTutorRecording(audio,'audio/wav',{env,owner:'learner',fetcher:(async()=>new Response('',{status:422})) as typeof fetch}), (e:any)=>e.status===422);
  await assert.rejects(transcribeTutorRecording(audio,'audio/wav',{env,owner:'learner',fetcher:(async()=>new Response('',{status:429})) as typeof fetch}), (e:any)=>e.status===429);
});
async function withServer(app: ReturnType<typeof express>, run:(base:string)=>Promise<void>) {
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
  try {await run(`http://127.0.0.1:${(server.address() as any).port}`);}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
test('audio-only questions reach the dialogue without typed text or raw audio history',async()=>{
  const app=express();app.use(express.json());app.use((req:any,_res,next)=>{req.identity={uid:'owner'};next();});
  app.post('/tutor',createTutorVoiceInput(async()=>({text:'Qu’est-ce qu’un marché public ?',recordingId:id})),(req,res)=>{
    assert.equal(req.body.message,'Qu’est-ce qu’un marché public ?');assert.equal(req.body.audioBase64,undefined);
    assert.equal(req.body.history[0].media,undefined);res.json({reply:'Réponse.'});
  });
  await withServer(app,async base=>{const response=await fetch(base+'/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'',mediaType:'audio',audioBase64:audio,audioMimeType:'audio/wav',history:[{sender:'user',text:'Message vocal',media:{audioBase64:audio}}]})});assert.equal(response.status,200);const data=await response.json();assert.equal(data.transcribedText,'Qu’est-ce qu’un marché public ?');assert.equal(data.voiceRecordingUrl,'/api/ai/tutor-voice/'+id);});
});
test('unintelligible audio never triggers an invented dialogue response',async()=>{
  const app=express();app.use(express.json());let called=false;
  app.post('/tutor',createTutorVoiceInput(async()=>{throw new TutorVoiceError('Vocal incompris',422);}),(_req,res)=>{called=true;res.json({reply:'wrong'});});
  await withServer(app,async base=>{const r=await fetch(base+'/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mediaType:'audio',audioBase64:audio})});assert.equal(r.status,422);assert.equal(called,false);});
});
test('recording playback is protected and forwards byte ranges with the verified owner',async()=>{
 const app=express();app.use((req:any,_res,next)=>{if(req.headers.authorization)req.identity={uid:'owner'};next();});
 app.use('/voice',createTutorVoiceMediaRouter({env,fetcher:(async(url:any,init:any)=>{assert.equal(new URL(url).searchParams.get('owner'),'owner');assert.equal(init.headers.Range,'bytes=0-2');return new Response('abc',{status:206,headers:{'content-type':'audio/mpeg','content-range':'bytes 0-2/10','accept-ranges':'bytes'}});}) as typeof fetch}));
 await withServer(app,async base=>{assert.equal((await fetch(base+'/voice/'+id)).status,401);const r=await fetch(base+'/voice/'+id,{headers:{Authorization:'owner',Range:'bytes=0-2'}});assert.equal(r.status,206);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(await r.text(),'abc');});
});
test('history keeps existing recordings and stores pending uploads without oversized base64',()=>{
 const old={text:'older',media:{type:'audio',url:'data:audio/wav;base64,'+audio,audioBase64:audio}};
 const pending={text:'Message vocal',media:{type:'audio',name:'vocal',url:'blob:temporary',audioBase64:audio,pendingUpload:true,transcriptText:'question'}};
 const saved=tutorHistoryForStorage([old,pending]);assert.deepEqual(saved[0],old);assert.equal(saved[1].media.audioBase64,undefined);assert.equal(pending.media.audioBase64,audio);
});
