import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceBudgets } from '../backend/voiceBudgets.js';
import { synthesizeGeminiTutor } from '../backend/tutorSpeechProviders.js';
const pcm = Buffer.alloc(512).toString('base64');
test('Gemini keeps delivery instructions separate from the spoken transcript and selects a male voice', async () => {
  let sent: any;
  const result = await synthesizeGeminiTutor('Bonjour.', 'henri', { apiKey: 'test-key', fetcher: (async (_url, options) => {
    sent = JSON.parse(options!.body as string);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: pcm, mimeType: 'audio/L16;rate=24000' } }] } }] }));
  }) as typeof fetch });
  assert.equal(sent.contents[0].parts[0].text, 'Bonjour.');
  assert.ok(sent.contents[0].parts[0].speechMetadata.style.includes('rocailleuse'));
  assert.equal(sent.generationConfig.speechConfig.voiceConfig.voice, 'Orus');
  assert.equal(result?.audioBuffer.subarray(0, 4).toString(), 'RIFF');
  assert.equal(result?.audioBuffer.readUInt32LE(40), 512);
});
test('the female tutor uses a female preset', async () => {
  let voice: string;
  await synthesizeGeminiTutor('Bonjour.', 'vivienne', { apiKey: 'test', budgets: new VoiceBudgets(), fetcher: (async (_url, options) => { voice = JSON.parse(options!.body as string).generationConfig.speechConfig.voiceConfig.voice; return new Response('{}'); }) as typeof fetch });
  assert.equal(voice!, 'Kore');
});
test('missing credentials, provider refusals and invalid audio fail without returning fake audio', async () => {
  assert.equal(await synthesizeGeminiTutor('Bonjour.', 'henri'), null);
  assert.equal(await synthesizeGeminiTutor('Bonjour.', 'henri', { apiKey: 'test', budgets: new VoiceBudgets(), fetcher: (async () => new Response('{}', { status: 403 })) as typeof fetch }), null);
  assert.equal(await synthesizeGeminiTutor('Bonjour.', 'henri', { apiKey: 'test', budgets: new VoiceBudgets(), fetcher: (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: pcm, mimeType: 'text/plain' } }] } }] }))) as typeof fetch }), null);
});

test('Gemini daily quota reset is respected instead of retrying every few minutes', async () => {
  let now = 1000;
  const budgets = new VoiceBudgets(() => now);
  let calls = 0;
  const fetcher = (async () => {
    calls++;
    return new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '21600s' }] } }), { status: 429 });
  }) as typeof fetch;
  assert.equal(await synthesizeGeminiTutor('Bonjour', 'henri', { apiKey: 'test', fetcher, budgets }), null);
  now += 3600000;
  assert.equal(await synthesizeGeminiTutor('Bonjour', 'henri', { apiKey: 'test', fetcher, budgets }), null);
  assert.equal(calls, 1);
  now = 21601000;
  assert.equal(budgets.available('gemini'), true);
});
