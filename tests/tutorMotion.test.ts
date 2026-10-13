import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepAvatarExpressionFrame } from '../src/workers/avatarExpressionWorker';
import { applyTutorMotion } from '../src/utils/tutorMotion';
import { normalizeTutorPresentation } from '../shared/tutorPresentation';
test('motion preferences reduce posture without changing phoneme lip sync or blink timing', () => {
  const frame = stepAvatarExpressionFrame(250, 250, 0.1, true, 0.8, 'open', false, 'pedagogical', true);
  const off = applyTutorMotion(frame, 'off', true, false);
  assert.equal(off.turn, 0); assert.equal(off.nod, 0); assert.equal(off.leftShoulderLift, 0);
  assert.equal(off.open, frame.open); assert.equal(off.viseme, frame.viseme); assert.equal(off.blinkLeft, frame.blinkLeft);
  const reduced = applyTutorMotion(frame, 'expressive', true, true);
  assert.equal(reduced.torsoSwayX, 0); assert.equal(reduced.smile, 0); assert.equal(reduced.open, frame.open);
  assert.notEqual(off, frame);
});
test('presentation uses safe defaults and never accepts an unknown motion mode', () => {
  assert.deepEqual(normalizeTutorPresentation({ motion: 'unknown', facialExpressions: 'false' }), { motion: 'subtle', facialExpressions: true, handGestures: true, autoSpeak: true });
});

test('hands accompany speech and settle rather than moving continuously at rest', () => {
  let frame = stepAvatarExpressionFrame(500, 500, 0.1, true, 0.6, 'open', false, 'pedagogical', true);
  for (let i = 1; i < 60; i++) frame = stepAvatarExpressionFrame(500 + i * 17, 500 + i * 17, 0.1, true, 0.6, 'open', false, 'pedagogical', true);
  assert.ok(frame.leftHandDy < -5 && frame.rightHandDy < -5);
  for (let i = 60; i < 240; i++) frame = stepAvatarExpressionFrame(500 + i * 17, 0, 0, false, 0, 'closed', true, 'pedagogical', false);
  assert.ok(Math.abs(frame.leftHandDy) < 0.1 && Math.abs(frame.rightHandDy) < 0.1);
});
