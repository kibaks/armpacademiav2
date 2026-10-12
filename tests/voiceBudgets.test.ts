import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceBudgets } from '../backend/voiceBudgets.js';
import { synthesizeElevenTutor } from '../backend/elevenTutorSpeech.js';
import { synthesizeGeminiTutor } from '../backend/tutorSpeechProviders.js';

test('ElevenLabs reservations prevent concurrent requests from overspending the known balance', async () => {
  const budgets = new VoiceBudgets(() => 1000);
  await budgets.readElevenQuota('test', (async () => new Response(JSON.stringify({ character_count: 90, character_limit: 100 }))) as typeof fetch);
  assert.equal(budgets.reserveEleven(8), true);
  assert.equal(budgets.reserveEleven(3), false);
  budgets.releaseEleven(8, false);
  assert.equal(budgets.reserveEleven(10), true);
  budgets.releaseEleven(10, true);
  assert.equal(budgets.snapshot().elevenlabs.remainingCharacters, 0);
});
test('missing quota-read permission stays unknown and does not disable a permitted synthesis', async () => {
  const budgets = new VoiceBudgets(() => 1000);
  let calls = 0;
  const result = await synthesizeElevenTutor('Bonjour.', 'henri', { env: { ELEVENLABS_API_KEY: 'test' }, budgets, fetcher: (async (url, options) => {
    calls++;
    if (String(url).endsWith('/subscription')) return new Response(JSON.stringify({ detail: { status: 'missing_permissions' } }), { status: 401 });
    assert.ok(String(url).includes('pNInz6obpgDQGcFmaJgB'));
    assert.equal(JSON.parse(options!.body as string).language_code, 'fr');
    return new Response(JSON.stringify({ audio_base64: Buffer.alloc(512).toString('base64'), alignment: { characters: ['B','o','n','j','o','u','r','.'], character_start_times_seconds: [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7], character_end_times_seconds: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8] } }));
  }) as typeof fetch });
  assert.equal(calls, 2); assert.equal(result?.wordBoundaries[0].text, 'Bonjour.');
  assert.equal(budgets.snapshot().elevenlabs.remainingCharacters, null);
});
test('an exhausted ElevenLabs balance skips synthesis and permits the Gemini fallback', async () => {
  const budgets = new VoiceBudgets(() => 1000); let synthesisCalls = 0;
  const el = await synthesizeElevenTutor('Bonjour.', 'henri', { env: { ELEVENLABS_API_KEY: 'test' }, budgets, fetcher: (async url => { if (!String(url).endsWith('/subscription')) synthesisCalls++; return new Response(JSON.stringify({ character_count: 100, character_limit: 100 })); }) as typeof fetch });
  assert.equal(el, null); assert.equal(synthesisCalls, 0); assert.equal(budgets.available('gemini'), true);
});
test('Gemini rate limiting is observed before retrying and its unknown token balance is not invented', async () => {
  let now = 1000; const budgets = new VoiceBudgets(() => now); let calls = 0;
  const fetcher = (async () => { calls++; return new Response(JSON.stringify({ error: { status: 'RESOURCE_EXHAUSTED' } }), { status: 429, headers: { 'retry-after': '120' } }); }) as typeof fetch;
  assert.equal(await synthesizeGeminiTutor('Bonjour.', 'henri', { apiKey: 'test', budgets, fetcher }), null);
  assert.equal(await synthesizeGeminiTutor('Bonjour.', 'henri', { apiKey: 'test', budgets, fetcher }), null);
  assert.equal(calls, 1); assert.equal(budgets.snapshot().gemini.remainingTokens, null);
  now += 120001; assert.equal(budgets.available('gemini'), true);
});
test('quota reads are deduplicated for simultaneous requests', async () => {
  const budgets = new VoiceBudgets(() => 1000); let calls = 0;
  const fetcher = (async () => { calls++; return new Response(JSON.stringify({ character_count: 0, character_limit: 1000 })); }) as typeof fetch;
  await Promise.all([budgets.readElevenQuota('test', fetcher), budgets.readElevenQuota('test', fetcher)]);
  assert.equal(calls, 1);
});
