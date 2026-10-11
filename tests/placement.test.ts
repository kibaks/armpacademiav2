import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradePlacement, placementQuestions } from '../backend/placement';

test('placement preserves zero and ignores client-provided correctness', () => {
  const answers = placementQuestions.map(q => ({ questionId: q.id, pickedIndex: (q.correctIndex + 1) % q.options.length, isCorrect: true }));
  assert.deepEqual(gradePlacement(answers), { correct: 0, score: 0 });
});
test('placement scores canonical indexes regardless of question order', () => {
  const answers = placementQuestions.map(q => ({ questionId: q.id, pickedIndex: q.correctIndex, isCorrect: false })).reverse();
  assert.equal(gradePlacement(answers).score, 100);
});
test('placement rejects missing, duplicate, unknown and out-of-range answers', () => {
  const answers = placementQuestions.map(q => ({ questionId: q.id, pickedIndex: 0 }));
  for (const invalid of [[], answers.slice(1), [...answers.slice(1), answers[1]], answers.map(a => ({ ...a, pickedIndex: 99 })), answers.map(a => ({ ...a, questionId: 999 })), { isCorrect: true }]) {
    assert.throws(() => gradePlacement(invalid), (error: any) => error.status === 400);
  }
});
