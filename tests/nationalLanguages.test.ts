import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nationalLanguageConfig, translateTutorReply, nationalSpeechPayload, sendTutorReply } from '../backend/nationalLanguages';
import { normalizeNationalSpeech, nationalVoiceAvailable, nationalSpeechChunks } from '../shared/tutorLanguages';
const env = { MUSETALK_API_URL: 'https://engines.example/musetalk', MUSETALK_API_KEY: 'server-key' };
test('national gateway reuses server authentication only on the known deployment path', () => {
  assert.deepEqual(nationalLanguageConfig(env), { url: 'https://engines.example/national', key: 'server-key' });
  assert.equal(nationalLanguageConfig({ QWEN_API_KEY: 'key', QWEN_API_URL: 'https://other.example/chat' }), null);
  assert.equal(nationalLanguageConfig({ ...env, MUSETALK_API_URL: 'https://user:pass@engines.example/musetalk' }), null);
  assert.equal(nationalLanguageConfig({}), null);
  assert.deepEqual(nationalLanguageConfig({ ...env, MUSETALK_API_URL: 'https://old.example/old-video', QWEN_API_URL: 'https://active.example/musetalk/chat', QWEN_API_KEY: 'dialogue-key' }), { url: 'https://active.example/national', key: 'dialogue-key' });
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
  for (const language of ['ln', 'kg', 'lua'] as const) {
    const audio = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(100)]).toString('base64');
    const result = await nationalSpeechPayload('Texte ɛ́', language, { env, fetcher: async (_url, options) => {
      assert.equal(JSON.parse(options!.body as string).text, 'Texte ɛ́');
      return Response.json({ language, provider: 'national-omnivoice', mimeType: 'audio/mpeg', audioData: audio });
    } });
    assert.equal(result.provider, 'national-omnivoice');
  }
  await assert.rejects(nationalSpeechPayload('Texte', 'kg', { env, fetcher: async () => Response.json({ language: 'kg', provider: 'national-vits', mimeType: 'audio/mpeg', audioData: Buffer.concat([Buffer.from('ID3'), Buffer.alloc(100)]).toString('base64') }) }));
  await assert.rejects(nationalSpeechPayload('Habari', 'sw', { env, fetcher: async () => Response.json({ language: 'sw', provider: 'national-vits', mimeType: 'audio/mpeg', audioData: Buffer.alloc(100).toString('base64') }) }));
});
test('diacritics and national spelling are never rewritten as French phonetics', () => {
  assert.equal(normalizeNationalSpeech('**Mbɔ́tɛ**, Mbuyi. Tshiluba.'), 'Mbɔ́tɛ, Mbuyi. Tshiluba.');
  assert.equal(nationalVoiceAvailable('ln', 'Mbote.'), true);
  assert.equal(nationalVoiceAvailable('ln', 'Mbɔ́tɛ.'), true);
  assert.equal(nationalVoiceAvailable('ln', 'e\u0301'), true);
  assert.equal(nationalVoiceAvailable('kg'), true);
  assert.equal(nationalVoiceAvailable('lua'), true);
});

test('long national narration is split without losing words or diacritics',()=>{
 const text=('Habari, elimu na haki. Mbɔ́tɛ na bino. ').repeat(50).trim();
 const chunks=nationalSpeechChunks(text);
 assert.ok(chunks.length>1);
 assert.ok(chunks.every(chunk=>chunk.length<=500));
 assert.equal(chunks.join(' '),normalizeNationalSpeech(text));
});

test('consistent identity is preserved across all languages and mismatched speakers are refused', async () => {
 const consistentEnv = { ...env, TUTOR_CONSISTENT_VOICE: 'true' };
 const audio = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(100)]).toString('base64');
 for (const language of ['fr', 'ln', 'sw', 'kg', 'lua'] as const) {
  for (const voice of ['vivienne', 'henri']) {
   const voiceId = voice === 'henri' ? 'academia-male-v1' : 'academia-female-v1';
   const result = await nationalSpeechPayload('Texte ɛ́', language, { env: consistentEnv, voice, fetcher: async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    assert.equal(body.voiceMode, 'consistent');
    assert.equal(body.voice, voice === 'henri' ? 'male' : 'female');
    assert.equal(body.language, language);
    return Response.json({ language, voiceId, provider: 'national-omnivoice', mimeType: 'audio/mpeg', audioData: audio });
   } });
   assert.equal(result.voiceId, voiceId);
  }
 }
 await assert.rejects(nationalSpeechPayload('Habari', 'sw', { env: consistentEnv, fetcher: async () => Response.json({ language: 'sw', voiceId: 'different', provider: 'national-omnivoice', mimeType: 'audio/mpeg', audioData: audio }) }));
});

test('HF French speech uses only the scoped inference endpoint and reports cold starts',async()=>{
 const hfEnv={...env,MUSETALK_PROVIDER:'huggingface',HF_MUSETALK_URL:'https://video.endpoints.huggingface.cloud',HF_MUSETALK_TOKEN:'limited-key'};
 const mp3=Buffer.alloc(100);mp3.write('ID3');
 const voice=await nationalSpeechPayload('Le soumissionnaire remet une offre.','fr',{env:hfEnv,voice:'vivienne',fetcher:(async(url:any,init:any)=>{
  assert.equal(String(url),hfEnv.HF_MUSETALK_URL+'/');assert.equal(init.headers.authorization,'Bearer limited-key');
  assert.equal(JSON.parse(init.body).inputs.operation,'/speech');
  return Response.json({statusCode:200,body:{mimeType:'audio/mpeg',audioData:mp3.toString('base64')}});
 }) as typeof fetch});
 assert.equal(voice.provider,'huggingface-piper');assert.equal(voice.language,'fr');
 await assert.rejects(()=>nationalSpeechPayload('Bonjour.','fr',{env:hfEnv,fetcher:(async()=>Response.json({error:'loading'},{status:503})) as typeof fetch}),/réveille/);
});
