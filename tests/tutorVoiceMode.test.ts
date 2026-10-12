import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTutorVoiceMode, TUTOR_VOICE_MODE_KEY } from '../src/utils/tutorVoiceMode.js';
test('the old device preference does not override the newly configured studio providers', () => {
  const storage = new Map([['academia-tutor-voice-mode', 'device']]);
  assert.equal(readTutorVoiceMode({ getItem: key => storage.get(key) || null }, 'studio'), 'studio');
});
test('a deliberate new device choice remains available', () => {
  assert.equal(readTutorVoiceMode({ getItem: key => key === TUTOR_VOICE_MODE_KEY ? 'device' : null }), 'device');
});
test('blocked storage and missing preferences keep studio playback as the default', () => {
  assert.equal(readTutorVoiceMode({ getItem: () => { throw new Error('Storage unavailable'); } }), 'studio');
  assert.equal(readTutorVoiceMode(null), 'studio');
});
