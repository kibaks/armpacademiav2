import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nationalLanguageConfig, translateTutorReply, nationalSpeechPayload, sendTutorReply } from '../backend/nationalLanguages';
import { normalizeNationalSpeech, nationalVoiceAvailable } from '../shared/tutorLanguages';
const env = { MUSETALK_API_URL: 'https://engines.example/musetalk', MUSETALK_API_KEY: 'server-key' };
test('national gateway reuses server authentication only on the known deployment path', () => {
  assert.deepEqual(nationalLanguageConfig(env), { url: 'https://engines.example/national', key: 'server-key' });
  assert.equal(nationalLanguageConfig({ QWEN_API_KEY: 'key', QWEN_API_URL: 'https://other.example/chat' }), null);
  assert.equal(nationalLanguageConfig({ ...env, MUSETALK_API_URL: 'https://user:pass@engines.example/musetalk' }), null);
  assert.equal(nationalLanguageConfig({}), null);
});
test('all four target languages and reverse translation preserve explicit language codes', async () => {
  for (const language of ['ln', 'sw', 'kg', 'lua'] as const) {
    const result = await translateTutorReply('Texte français.', language, { env, fetcher: async (url, options) => {
      assert.equal(url, 'https://engines.example/national/translate');
      assert.equal((options!.headers as any).authorization, 'Bearer server-key');
      assert.equal(options!.redirect, 'error');
      assert.deepEqual(JSON.parse(options!.body as string), { text: 'Texte français.', sourceLanguage: 'fr', language });
      return Response.json({ text: 'ɛ\u0301 ɔ\u0301', language });
    } });
    assert.equal(result, 'ɛ́ ɔ́');
  }
  assert.equal(await translateTutorReply('Bonjour', 'fr'), 'Bonjour');
  await translateTutorReply('Mbote', 'fr', { env, sourceLanguage: 'ln', fetcher: async (_url, options) => {
    assert.deepEqual(JSON.parse(options!.body as string), { text: 'Mbote', sourceLanguage: 'ln', language: 'fr' });
    return Response.json({ text: 'Bonjour', language: 'fr' });
  } });
});
test('wrong-language and failed translations never become a verified answer', async () => {
  await assert.rejects(translateTutorReply('Texte', 'ln', { env, fetcher: async () => Response.json({ text: 'Text', language: 'sw' }) }));
  await assert.rejects(translateTutorReply('Texte', 'ln', { env, fetcher: async () => new Response('', { status: 503 }) }));
});
test('national speech is not sent to French voices and invalid audio is refused', async () => {
  let calls = 0;
  for (const language of ['kg', 'lua'] as const) await assert.rejects(nationalSpeechPayload('Texte', language, { env, fetcher: async () => { calls++; return Response.json({}); } }));
  assert.equal(calls, 0);
  await assert.rejects(nationalSpeechPayload('Habari', 'sw', { env, fetcher: async () => Response.json({ language: 'sw', provider: 'national-vits', mimeType: 'audio/mpeg', audioData: Buffer.alloc(100).toString('base64') }) }));
});
test('diacritics and national spelling are never rewritten as French phonetics', () => {
  assert.equal(normalizeNationalSpeech('**Mbɔ́tɛ**, Mbuyi. Tshiluba.'), 'Mbɔ́tɛ, Mbuyi. Tshiluba.');
  assert.equal(nationalVoiceAvailable('ln', 'Mbote.'), true);
  assert.equal(nationalVoiceAvailable('ln', 'Mbɔ́tɛ.'), false);
  assert.equal(nationalVoiceAvailable('ln', 'e\u0301'), false);
  assert.equal(nationalVoiceAvailable('kg'), false);
  assert.equal(nationalVoiceAvailable('lua'), false);
});
