import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonVisualKind } from '../src/utils/lessonVisualKind';
import { buildInitiationModules } from '../src/data/initiationCurriculum';
test('authored chapters provide distinct explanatory forms and contextual cases', () => {
  const modules = buildInitiationModules(['']);
  const kinds = new Set(modules.flatMap(m => m.lessons.flatMap(l => [1,2,3,4,5].map(n => lessonVisualKind(l.title,n)))));
  assert.equal(kinds.size, 7);
  const cases = modules.flatMap(m => m.lessons.map(l => l.content.split('Cas fictif : ')[1].split(' | ')[0]));
  assert.equal(new Set(cases).size, 36);
  assert.ok(cases.some(c => c.includes('route')));
  assert.ok(cases.some(c => c.includes('santé')));
  assert.ok(cases.some(c => c.includes('nettoyage')));
  assert.ok(cases.some(c => c.includes('maintenance')));
  assert.equal(lessonVisualKind('Un principe juridique', 2, '2. Le Principe (Règle)'), 'comparison');
  assert.equal(lessonVisualKind('La vérification du dossier', 5, '5. La Vérification (Quiz)'), 'practice');
});
