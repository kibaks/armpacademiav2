import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickBrowserTutorVoice, browserTutorProsody } from '../src/utils/browserTutorVoices.js';
const voices = [{ name: 'Thomas', lang: 'fr-FR' }, { name: 'Amélie', lang: 'fr-CA' }, { name: 'Thomas English', lang: 'en-US' }];
test('French masculine and feminine voices follow the selected tutor', () => {
  assert.equal(pickBrowserTutorVoice(voices, 'henri')?.name, 'Thomas');
  assert.equal(pickBrowserTutorVoice(voices, 'vivienne')?.name, 'Amélie');
});
test('unavailable gender or foreign-language voices never silently substitute another voice', () => {
  assert.equal(pickBrowserTutorVoice([{ name: 'Amélie', lang: 'fr-CA' }], 'henri'), null);
  assert.equal(pickBrowserTutorVoice([{ name: 'Henri', lang: 'en-US' }], 'henri'), null);
  assert.equal(pickBrowserTutorVoice([], 'vivienne'), null);
});
test('grave voice prosody remains readable at extreme requested speeds', () => {
  assert.ok(browserTutorProsody('henri').pitch < browserTutorProsody('vivienne').pitch);
  assert.equal(browserTutorProsody('henri', 0).rate, 0.7);
  assert.equal(browserTutorProsody('henri', 99).rate, 1.15);
});
