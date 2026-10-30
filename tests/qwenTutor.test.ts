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
    assert.ok((TUTOR_RESPONSE_POLICY + '\n' + learnerLevelGuidance('Initiation')).length <= 8000, 'gateway system prompt limit');
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

import { tutorConversationData } from '../shared/tutorReplyPolicy';
import { explanationReview } from '../shared/tutorExplanationContract';
test('qualitative examples retry once when the model adds unrequested figures, within one shared deadline',async()=>{
 const prompt=tutorConversationData('Explique le besoin avec un exemple fictif.',[],'','','');let calls=0;let signal:AbortSignal|undefined;
 const reply=await generateQwenTutor(prompt,{env,fetcher:async(_url,init)=>{
  calls++; if(signal)assert.equal(init!.signal,signal);signal=init!.signal as AbortSignal;
  if(calls===2)assert.match(JSON.parse(init!.body as string).system,/Révision pédagogique/);
  return Response.json({reply:calls===1?'Exemple fictif : une école achète 30 tables en 3 semaines.':'Exemple fictif : une école décrit un mobilier adapté à ses élèves. Vérifiez les caractéristiques du besoin.',model:'academia-tuteur'});
 }});
 assert.equal(calls,2);assert.match(reply,/adapté/);
});
test('repeatedly noncompliant examples are not returned as verified explanations',async()=>{
 const prompt=tutorConversationData('Donne un exemple fictif du besoin.',[],'','','');let calls=0;
 await assert.rejects(generateQwenTutor(prompt,{env,fetcher:async()=>{calls++;return Response.json({reply:'Achetez 30 tables dans deux semaines.',model:'academia-tuteur'});}}),/QWEN_INVALID_EXPLANATION/);
 assert.equal(calls,2);
});
test('explicit numeric exercises and simple definitions remain allowed; labels must be explicit',()=>{
 const prompt=(q:string)=>tutorConversationData(q,[],'','','');
 assert.equal(explanationReview(prompt('Définis un besoin.'),'Un besoin décrit le résultat attendu.'),null);
 assert.equal(explanationReview(prompt('Donne un exemple chiffré de 20 tables.'),'Exemple fictif : une école achète 20 tables.'),null);
 assert.equal(explanationReview(prompt('Donne un exemple fictif.'),'Par exemple, une école décrit un besoin.'),'label');
 assert.equal(explanationReview(prompt('Donne un exemple fictif.'),'Exemple fictif : une école utilise trois salles.'),'quantities');
});
