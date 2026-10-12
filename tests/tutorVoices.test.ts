import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUTOR_VOICES, getTutorVoice, getElevenLabsTutorVoice } from '../shared/tutorVoices.js';
test('masculine fallback voices remain masculine and use a grave measured cadence', () => {
  assert.deepEqual(getTutorVoice('henri').voices, ['fr-FR-HenriNeural', 'fr-FR-RemyMultilingualNeural']);
  assert.equal(getTutorVoice('henri').gender, 'male');
  assert.ok(parseInt(getTutorVoice('henri').pitch) < 0);
  assert.ok(parseInt(getTutorVoice('henri').rate) < 0);
});
test('female profiles have distinct primary voices and firm adult voices', () => {
  const women = Object.values(TUTOR_VOICES).filter(p => p.gender === 'female');
  assert.equal(new Set(women.map(p => p.voices[0])).size, 4);
  assert.ok(women.every(p => !p.voices.includes('fr-FR-EloiseNeural' as never)));
});
test('a generic female ElevenLabs voice never overrides a masculine selection', () => {
  assert.equal(getElevenLabsTutorVoice('henri', { ELEVENLABS_VOICE_ID: 'female' }), undefined);
  assert.equal(getElevenLabsTutorVoice('henri', { ELEVENLABS_MALE_VOICE_ID: 'male' }), 'male');
  assert.equal(getElevenLabsTutorVoice('henri', { ELEVENLABS_VOICE_ID_HENRI: 'specific', ELEVENLABS_MALE_VOICE_ID: 'male' }), 'specific');
  assert.equal(getElevenLabsTutorVoice('vivienne', { ELEVENLABS_VOICE_ID: 'female' }), 'female');
});
test('unknown profiles use the explicit default', () => assert.equal(getTutorVoice('missing'), TUTOR_VOICES.vivienne));
