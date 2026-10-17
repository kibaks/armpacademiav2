import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInitiationModules } from '../src/data/initiationCurriculum';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes';
import metadata from '../shared/initiationCatalog.json';
import knowledge from '../shared/initiationKnowledge.json';
import { getLearnerOnboarding } from '../src/utils/learnerOnboarding';
import type { UserProfile } from '../src/types';
const modules = buildInitiationModules(['cover']);
test('initiation covers twelve modules and thirty-six complete, illustrated chapters', () => {
  assert.equal(modules.length, 12);
  assert.equal(modules.flatMap(m => m.lessons).length, 36);
  assert.equal(new Set(modules.map(m => m.id)).size, 12);
  for (const module of modules) {
    assert.equal(module.level, 'Fondamental');
    assert.equal(module.quiz.length, 3);
    assert.ok(module.targetAudience.includes('ac_agent'));
    assert.ok(module.lessons.every(l => l.content.includes('Cas fictif') && l.content.includes('À vous de jouer')));
    assert.ok(module.lessons.every(l => !/bon réflexe/i.test(l.content) && l.keyArticles.some(source => /article/i.test(source))));
  }
  assert.deepEqual(metadata.map(m => [m.id, m.lessons.length]), modules.map(m => [m.id, m.lessons.length]));
  assert.deepEqual(knowledge.map(m => m.lessons.map(l => l.content)), modules.map(m => m.lessons.map(l => l.content)));
});
test('obsolete fundamental modules cannot be added back into the new prerequisite list', () => {
  const legacy = { ...modules[0], id: 'MOD-001', title: 'Ancienne version' };
  const profile = { id: 'learner', role: 'pme', level: 'Débutant' } as UserProfile;
  const state = getLearnerOnboarding(profile, [...modules, legacy]);
  assert.equal(state.modules.length, 12);
  assert.ok(state.modules.every(m => m.id.startsWith('INIT-')));
});
test('every authored scene survives narration without fabricated article numbers', () => {
  for (const module of modules) for (const [index, lesson] of module.lessons.entries()) {
    const { sceneData, sentences } = buildSynchronizedLessonScreens(lesson.title, lesson.content, module.code, module.legalRef, index);
    assert.equal(sceneData.screens.length, 5);
    assert.ok(sentences[1].includes('école') || sentences[1].includes('entreprise') || sentences[1].length > 30);
    assert.ok(sceneData.screens.every(s => !/Art\.\s*\d/.test(s.legalArticle)));
    assert.ok(sentences.every(sentence => !/Le bon réflexe/i.test(sentence)));
  }
});
test('correct options rotate without changing the actual answer', () => {
  assert.ok(new Set(modules.flatMap(m => m.quiz.map(q => q.correctIndex))).size > 1);
  for (const module of modules) for (const q of module.quiz) assert.ok(q.options[q.correctIndex].length > 15);
});
