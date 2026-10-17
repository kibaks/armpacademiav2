import { learnerLevelGuidance } from '../shared/learnerProgression';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateQwenTutor, qwenTutorConfig } from '../backend/qwenTutor';
import { TUTOR_RESPONSE_POLICY } from '../shared/tutorReplyPolicy';

const env = { MUSETALK_API_URL: 'https://gateway.example/musetalk', MUSETALK_API_KEY: 'private-key' };
test('Qwen uses the authenticated HTTPS gateway and keeps Aisha policy separate from course data', async () => {
  const reply = await generateQwenTutor('Cours et question', { env, fetcher: async (url, init) => {
    assert.equal(url, 'https://gateway.example/musetalk/chat');
    assert.equal((init!.headers as any).authorization, 'Bearer private-key');
    assert.equal(init!.redirect, 'error');
    assert.deepEqual(JSON.parse(init!.body as string), { system: TUTOR_RESPONSE_POLICY + '\n' + learnerLevelGuidance('Initiation'), prompt: 'Cours et question' });
    return Response.json({ reply: ' Réponse du cours. ', model: 'academia-tuteur' });
  } });
  assert.equal(reply, 'Réponse du cours.');
});
test('invalid endpoints, missing credentials and legacy mode do not configure Qwen', () => {
  assert.equal(qwenTutorConfig({}), null);
  assert.equal(qwenTutorConfig({ ...env, TUTOR_LLM_PROVIDER: 'legacy' }), null);
  for (const url of ['http://gateway.example/chat', 'https://user:pass@gateway.example/chat', 'https://gateway.example/chat?key=x']) {
    assert.equal(qwenTutorConfig({ ...env, QWEN_API_URL: url }), null);
  }
});
test('unavailable, empty and unexpected-model responses are rejected without leaking credentials', async () => {
  for (const response of [new Response('', { status: 503 }), Response.json({ reply: '', model: 'academia-tuteur' }), Response.json({ reply: 'Réponse', model: 'other' })]) {
    await assert.rejects(generateQwenTutor('Question', { env, fetcher: async () => response }), /^Error: QWEN_/);
  }
});
