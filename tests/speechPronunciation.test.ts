import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSpeechPronunciation as speak, parsePronunciationEntries } from '../shared/speechPronunciation';

test('requested names and Congolese terms receive French voice hints without changing source text', () => {
  const original = 'Ester et David parlent de Luba, des Bakongo et de Bandundu.';
  assert.equal(speak(original), 'Estère et David parlent de Louba, des Bakongo et de Bandoundou.');
  assert.equal(original, 'Ester et David parlent de Luba, des Bakongo et de Bandundu.');
  assert.equal(speak('Kasaï-Central, Haut-Uélé, Tshuapa, Kinshasa, Lubumbashi.'), 'Kassaï-Central, Haut-Ouélé, Tchouapa, Kinshassa, Louboumbachi.');
});
test('custom names override defaults, including accents, phrases and non-Congolese names', () => {
  const entries = parsePronunciationEntries([{ word: 'Kasaï-Central', pronunciation: 'Kassaï Central' }, { word: 'David', pronunciation: 'Davide' }, { word: '李', pronunciation: 'Li' }]);
  assert.equal(speak('KASAÏ-CENTRAL, David et 李.', entries), 'Kassaï Central, Davide et Li.');
  assert.equal(speak('unDavidson et Bakongolais'), 'unDavidson et Bakongolais');
  assert.equal(speak('Émile', [{ word: 'E\u0301mile', pronunciation: 'Émile' }]), 'Émile');
});
test('already normalized browser aliases can still be overridden by the server without cascading', () => {
  const entries = [{ word: 'Mukendi', pronunciation: 'Moukèndi' }, { word: 'David', pronunciation: 'Ester' }];
  assert.equal(speak('Moukéndi et David', entries), 'Moukèndi et Ester');
});
test('dictionary validation rejects markup, duplicates and excessive payloads', () => {
  assert.throws(() => parsePronunciationEntries([{ word: 'Ester', pronunciation: '<break />' }]));
  assert.throws(() => parsePronunciationEntries([{ word: 'Ester', pronunciation: 'Estère' }, { word: 'ESTER', pronunciation: 'Ester' }]));
  assert.throws(() => parsePronunciationEntries(Array.from({ length: 201 }, () => ({ word: 'Nom', pronunciation: 'Nom' }))));
  assert.deepEqual(parsePronunciationEntries([]), []);
});

test('a browser-prepared pronunciation is not transformed a second time on the server', async () => {
  const { prepareTutorSpeech } = await import('../backend/speechPronunciation');
  const prepared = speak('Bonjour David', [{ word: 'David', pronunciation: 'Ester' }]);
  assert.equal(await prepareTutorSpeech(prepared, true), 'Bonjour Ester');
});

test('province aliases handle accents, whitespace and Unicode hyphens consistently', () => {
  assert.equal(speak('haut uele, KASAI CENTRAL, Nord‑Ubangi et Mai–Ndombe.'), 'Haut-Ouélé, Kassaï-Central, Nord-Oubangui et Maï-Ndombé.');
  assert.equal(speak('Equateur et Kongo Central.'), 'Équateur et Kongo-Central.');
  assert.equal(speak('Nord‑Ubangi', [{ word: 'Nord-Ubangi', pronunciation: 'Nord Oubangui' }]), 'Nord Oubangui');
  assert.equal(speak('Nord-Ubangien et Kasailand'), 'Nord-Ubangien et Kasailand');
});

test('compound personal names use the configured pronunciation without changing the original', () => {
  const source = 'Bonjour Jean‑Paul Mukendi. Bienvenue au Haut Katanga.';
  const entries = [{ word: 'Jean-Paul Mukendi', pronunciation: 'Jean Pol Moukèndi' }];
  assert.equal(speak(source, entries), 'Bonjour Jean Pol Moukèndi. Bienvenue au Haut-Katanga.');
  assert.equal(source, 'Bonjour Jean‑Paul Mukendi. Bienvenue au Haut Katanga.');
});
