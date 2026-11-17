import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceLessonMotion } from '../src/utils/lessonMotionClock';
test('pause and a hidden tab do not advance or rewind the illustration', () => {
 const clock = { seconds: 0, previous: null as number | null };
 advanceLessonMotion(clock, 1000, true);
 assert.ok(Math.abs(advanceLessonMotion(clock, 1040, true) - .04) < .0001);
 assert.equal(advanceLessonMotion(clock, 5000, false), .04);
 assert.equal(advanceLessonMotion(clock, 9000, true), .04);
 assert.ok(Math.abs(advanceLessonMotion(clock, 9040, true) - .08) < .0001);
});
test('a delayed frame cannot make characters or props jump forward', () => {
 const clock = { seconds: 0, previous: 1000 };
 assert.equal(advanceLessonMotion(clock, 20000, true), .1);
 assert.equal(advanceLessonMotion(clock, NaN, true), .1);
 assert.equal(clock.previous, null);
});
