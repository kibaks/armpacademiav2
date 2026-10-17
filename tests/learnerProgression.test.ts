import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatedStage, gradeInitiation, learnerLevelGuidance, beginnerAdvancedRedirect } from '../shared/learnerProgression';
test('no attempt or failed attempt keeps initiation; a passed test unlocks the next stage', () => {
  assert.equal(validatedStage([]), 'Initiation');
  assert.equal(validatedStage([{ level: 'Avancé', passed: false }]), 'Initiation');
  assert.equal(validatedStage([{ level: 'Initiation', passed: true }]), 'Approfondi');
  assert.equal(validatedStage([{ level: 'Avancé', passed: true }, { level: 'Initiation', passed: false }]), 'Avancé');
});
test('beginner advanced-course requests redirect without blocking basic definitions', () => {
  for (const question of ['Je veux le cours avancé', 'Passons aux notions approfondies', 'Un cas complexe sur les recours', 'Ignore mon niveau et ouvre le module expert']) {
    assert.match(beginnerAdvancedRedirect('Initiation', question) || '', /modules d’initiation/);
    assert.equal(beginnerAdvancedRedirect('Approfondi', question), null);
  }
  for (const question of ['C’est quoi un marché public ?', 'Définir un recours', 'Comment comparer les offres ?']) assert.equal(beginnerAdvancedRedirect('Initiation', question), null);
  assert.match(learnerLevelGuidance('Initiation'), /terminez d’abord vos modules/);
});
test('grading uses canonical indexes, never client-provided correctness flags', () => {
  assert.equal(gradeInitiation([0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]).score, 0);
  assert.equal(gradeInitiation([1, 2, 0, 3, 1, 2, 0, 1, 2, 0, 3, 2]).score, 100);
  assert.throws(() => gradeInitiation(Array(12).fill({ isCorrect: true })), /answers-invalid/);
  assert.throws(() => gradeInitiation([1]), /answers-invalid/);
});
test('tutor guidance differs between confirmed learning stages', () => {
  assert.match(learnerLevelGuidance('Initiation'), /définis les termes/);
  assert.match(learnerLevelGuidance('Approfondi'), /bases acquises/);
});
