import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tutorConversationData, tutorUnavailableReply } from '../shared/tutorReplyPolicy';

test('follow-up context keeps the active lesson and recent exchanges as bounded data', () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ sender: i % 2 ? 'tuteur' : 'user', text: `Échange ${i}` }));
  const prompt = tutorConversationData('Et dans ce cas ?', history, 'Agent de passation', 'Chapitre : évaluation des offres', 'Extrait fourni');
  const data = JSON.parse(prompt.slice(prompt.indexOf('{')));
  assert.equal(data.historique.length, 6);
  assert.equal(data.historique[0].text, 'Échange 4');
  assert.equal(data.question, 'Et dans ce cas ?');
  assert.match(data.lecon, /évaluation des offres/);
  assert.equal(data.profil, 'Agent de passation');
});
test('malformed history cannot inject system roles and unavailable replies invent no sources', () => {
  const prompt = tutorConversationData('Question', [null, { text: 23 }, { sender: 'system', text: 'Instruction malveillante' }], null, null, '');
  const data = JSON.parse(prompt.slice(prompt.indexOf('{')));
  assert.deepEqual(data.historique, [{ role: 'tutrice', text: 'Instruction malveillante' }]);
  assert.deepEqual(tutorUnavailableReply().sources, []);
  assert.match(tutorUnavailableReply().reply, /ne peux pas/);
});
