import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCartesiaStream } from '../backend/cartesiaStream.js';
import { samplePhoneme } from '../shared/speechTiming.js';
const event = (data: unknown) => `data: ${JSON.stringify(data)}\r\n\r\n`;
const pcm = Buffer.alloc(9600);
const streamText = event({ type:'chunk',data:pcm.toString('base64') }) + event({type:'timestamps',word_timestamps:{words:['École'],start:[0.02],end:[0.15]}}) + event({type:'phoneme_timestamps',phoneme_timestamps:{phonemes:['e','k','ɔ'],start:[0.02,0.06,0.09],end:[0.06,0.09,0.15]}}) + event({type:'done',done:true});
test('fragmented UTF-8 SSE preserves exact word/phoneme times and wraps the PCM as valid WAV', async () => {
  const bytes = new TextEncoder().encode(streamText);
  const response = new Response(new ReadableStream({ start(controller) { for(let i=0;i<bytes.length;i+=7)controller.enqueue(bytes.slice(i,i+7));controller.close(); } }));
  const result=await readCartesiaStream(response,'École');
  assert.equal(result.audioBuffer.subarray(0,4).toString(),'RIFF'); assert.equal(result.audioBuffer.readUInt32LE(40),pcm.length);
  assert.deepEqual(result.wordBoundaries,[{text:'École',offsetMs:20,durationMs:130,charIndex:0}]);
  assert.equal(result.phonemeBoundaries[2].phoneme,'ɔ');assert.equal(result.phonemeBoundaries[2].offsetMs,90);
});
test('interrupted and rejected streams never become playable audio', async () => {
  await assert.rejects(readCartesiaStream(new Response(event({type:'chunk',data:pcm.toString('base64')})),'Bonjour'),/incomplet/);
  await assert.rejects(readCartesiaStream(new Response(event({type:'chunk',data:pcm.toString('base64')}) + event({type:'error',status_code:429})),'Bonjour'),/interrompu/);
});
test('audio-time sampling keeps bilabial consonants closed, rounds French vowels and closes genuine pauses', () => {
  const timings=[{phoneme:'b',offsetMs:100,durationMs:80},{phoneme:'ɔ̃',offsetMs:180,durationMs:120}];
  assert.deepEqual(samplePhoneme(timings,90),{viseme:'closed',openness:0,pause:true});
  assert.deepEqual(samplePhoneme(timings,120),{viseme:'closed',openness:0,pause:false});
  assert.equal(samplePhoneme(timings,180)?.viseme,'round');
  assert.equal(samplePhoneme(timings,300)?.pause,true);assert.equal(samplePhoneme([],200),null);
});
