import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatedStage, gradeInitiation, learnerLevelGuidance } from '../shared/learnerProgression';
test('no attempt or failed attempt keeps initiation; a passed test unlocks the next stage', () => {
  assert.equal(validatedStage([]), 'Initiation');
  assert.equal(validatedStage([{ level: 'Avancé', passed: false }]), 'Initiation');
  assert.equal(validatedStage([{ level: 'Initiation', passed: true }]), 'Approfondi');
  assert.equal(validatedStage([{ level: 'Avancé', passed: true }, { level: 'Initiation', passed: false }]), 'Avancé');
});
test('grading uses canonical indexes, never client-provided correctness flags', () => {
  assert.equal(gradeInitiation([0, 0, 1, 0, 0]).score, 0);
  assert.equal(gradeInitiation([1, 2, 0, 3, 1]).score, 100);
  assert.throws(() => gradeInitiation(Array(5).fill({ isCorrect: true })), /answers-invalid/);
  assert.throws(() => gradeInitiation([1]), /answers-invalid/);
});
test('tutor guidance differs between confirmed learning stages', () => {
  assert.match(learnerLevelGuidance('Initiation'), /définis les termes/);
  assert.match(learnerLevelGuidance('Approfondi'), /bases acquises/);
});
