import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeCourse } from '../backend/courseResults';
import bank from '../backend/courseBank.json';
test('all official course quizzes grade valid canonical answers without trusting client scores', () => {
  for (const course of bank) {
    assert.equal(gradeCourse(course.quiz, course.quiz.map(q => q.correctIndex)), 100, course.id);
    assert.equal(gradeCourse(course.quiz, course.quiz.map(q => (q.correctIndex + 1) % q.options.length)), 0, course.id);
  }
});
test('course grading rejects missing quizzes, missing answers and forged out-of-range indexes', () => {
  for (const [quiz, answers] of [[[], []], [bank[0].quiz, []], [bank[0].quiz, bank[0].quiz.map(() => 99)]]) assert.throws(() => gradeCourse(quiz as any[], answers), (error: any) => error.status === 400);
});
