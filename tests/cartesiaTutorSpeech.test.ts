import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeCartesiaTutor, CARTESIA_TUTOR_VOICES } from '../backend/cartesiaTutorSpeech.js';
import { VoiceBudgets } from '../backend/voiceBudgets.js';
const wav = Buffer.alloc(512); wav.write('RIFF'); wav.write('WAVE', 8);
test('Cartesia sends French narration with distinct masculine and feminine presets, and returns real WAV', async () => {
  const requests: any[] = [];
  const fetcher = (async (_url, init) => { requests.push(JSON.parse(init!.body as string)); return new Response(wav); }) as typeof fetch;
  for (const persona of ['henri', 'vivienne']) {
    const audio = await synthesizeCartesiaTutor('Bonjour.', persona, { env: { CARTESIA_API_KEY: 'test' }, fetcher, budgets: new VoiceBudgets() });
    assert.equal(audio?.provider, 'cartesia-sonic'); assert.equal(audio?.mimeType, 'audio/wav');
  }
  assert.equal(requests[0].language, undefined); assert.equal(requests[1].language, 'fr'); assert.equal(requests[0].locale, 'fr-FR'); assert.equal(requests[0].accent, 'parisian'); assert.equal(requests[0].voice, CARTESIA_TUTOR_VOICES.henri);
  assert.equal(requests[1].voice, CARTESIA_TUTOR_VOICES.vivienne); assert.notEqual(requests[0].voice, requests[1].voice);
  assert.equal(requests[0].transcript, 'Bonjour.');
});
test('Cartesia respects quota cooldown without retrying or inventing audio', async () => {
  let now = 1000, calls = 0; const budgets = new VoiceBudgets(() => now);
  const fetcher = (async () => { calls++; return new Response('{}', { status: 429, headers: { 'retry-after': '120' } }); }) as typeof fetch;
  const options = { env: { CARTESIA_API_KEY: 'test' }, fetcher, budgets };
  assert.equal(await synthesizeCartesiaTutor('Bonjour', 'henri', options), null);
  assert.equal(await synthesizeCartesiaTutor('Bonjour', 'henri', options), null); assert.equal(calls, 1);
  now += 120000; assert.equal(budgets.available('cartesia'), true);
});
test('missing credentials and invalid audio do not produce a studio playback', async () => {
  assert.equal(await synthesizeCartesiaTutor('Bonjour', 'henri', { env: {} }), null);
  const audio = await synthesizeCartesiaTutor('Bonjour', 'henri', { env: { CARTESIA_API_KEY: 'test' }, fetcher: (async () => new Response(Buffer.alloc(512))) as typeof fetch });
  assert.equal(audio, null);
});
