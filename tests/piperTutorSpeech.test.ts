import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizePiperTutor } from '../backend/piperTutorSpeech';
const env = {PIPER_TTS_URL:'https://voice.example/synthesize', PIPER_TTS_API_KEY:'server-secret'};
const wav = Buffer.alloc(48); wav.write('RIFF'); wav.write('WAVE',8);
test('Piper maps tutor genders and keeps credentials in server requests',async()=>{
 const bodies:any[]=[];
 const fetcher=(async(_url:any,options:any)=>{
  assert.equal(options.headers.authorization,'Bearer server-secret');
  assert.equal(options.redirect,'error');assert.equal(JSON.parse(options.body).format,'mp3');bodies.push(JSON.parse(options.body));
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
test('complete course passages beyond the old cutoff reach Piper without losing words',async()=>{
 const text=('Vérifiez les pièces et conservez toutes les décisions. '.repeat(24)+'Fin du passage.').trim();
 assert.ok(text.length>950);
 const fetcher=(async(_url:any,options:any)=>{assert.equal(JSON.parse(options.body).text,text);return new Response(wav);}) as typeof fetch;
 assert.equal((await synthesizePiperTutor(text,'henri',{env,fetcher}))?.provider,'piper');
 await assert.rejects(synthesizePiperTutor('a'.repeat(3001),'henri',{env,fetcher}),/3000/);
});

test('compressed narration avoids oversized Vercel responses',async()=>{
 const mp3=Buffer.alloc(100);mp3.write('ID3');
 const result=await synthesizePiperTutor('Bonjour.','henri',{env,fetcher:(async()=>new Response(mp3)) as typeof fetch});
 assert.equal(result?.mimeType,'audio/mpeg');
});
