import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizePiperTutor } from '../backend/piperTutorSpeech';
const env = {PIPER_TTS_URL:'https://voice.example/synthesize', PIPER_TTS_API_KEY:'server-secret'};
const wav = Buffer.alloc(48); wav.write('RIFF'); wav.write('WAVE',8);
test('Piper maps tutor genders and keeps credentials in server requests',async()=>{
 const bodies:any[]=[];
 const fetcher=(async(_url:any,options:any)=>{
  assert.equal(options.headers.authorization,'Bearer server-secret');
  assert.equal(options.redirect,'error');bodies.push(JSON.parse(options.body));
  return new Response(wav);
 }) as typeof fetch;
 for(const persona of ['henri','vivienne']){
  const result=await synthesizePiperTutor('Bonjour.',persona,{env,fetcher});
  assert.equal(result?.provider,'piper');assert.deepEqual(result?.audioBuffer,wav);
 }
 assert.deepEqual(bodies.map(body=>body.voice),['male','female']);
});
test('Piper does not leak credentials through redirects or provider errors',async()=>{
 assert.equal(await synthesizePiperTutor('Bonjour','henri',{env:{}}),null);
 await assert.rejects(synthesizePiperTutor('Bonjour','henri',{env:{...env,PIPER_TTS_URL:'http://voice.example'}}),/sécurisée/);
 await assert.rejects(synthesizePiperTutor('Bonjour','henri',{env,fetcher:(async()=>new Response('secret invalid',{status:401})) as typeof fetch}),/indisponible/);
 await assert.rejects(synthesizePiperTutor('Bonjour','henri',{env,fetcher:(async()=>new Response('not audio')) as typeof fetch}),/invalide/);
 const result=await synthesizePiperTutor('Encore','henri',{env,fetcher:(async()=>new Response(wav)) as typeof fetch});
 assert.equal(result?.provider,'piper');
});
