import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectTutorHeadPoint, sampleTutorBlink } from '../src/utils/tutorPortraitMotion';

test('a neutral portrait retains its framing regardless of face depth', () => {
  for (const depth of [-50, 0, 90]) {
    assert.deepEqual(projectTutorHeadPoint(390, 350, depth, 454, 538, 0, 0, 0), [390, 350]);
  }
});
test('roll rotates around the neck without adding a zoom', () => {
  const [x, y] = projectTutorHeadPoint(390, 350, 70, 454, 538, 0, 0, 3);
  assert.ok(Math.abs(Math.hypot(x - 454, y - 538) - Math.hypot(390 - 454, 350 - 538)) < 1e-9);
});
test('blink closes, holds, then opens over half a second without a second flutter', () => {
  assert.equal(sampleTutorBlink(0), 0);
  assert.equal(sampleTutorBlink(160), 1);
  assert.equal(sampleTutorBlink(250), 1);
  assert.ok(sampleTutorBlink(380) > 0.49 && sampleTutorBlink(380) < 0.51);
  assert.equal(sampleTutorBlink(500), 0);
  assert.equal(sampleTutorBlink(650), 0);
});
