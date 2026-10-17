import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLearnerOnboarding } from '../src/utils/learnerOnboarding';
import { recordCourseReadingInProfile } from '../src/utils/learningStats';
import { CourseModule, UserProfile } from '../src/types';
const courses = [
  { id: 'intro', level: 'Fondamental', targetAudience: ['pme'], lessons: [{ title: 'A' }, { title: 'B' }] },
  { id: 'advanced', level: 'Avancé', targetAudience: ['pme'] },
  { id: 'other', level: 'Fondamental', targetAudience: ['cgpmp_member'] },
] as CourseModule[];
const profile = (fields = {}) => ({ id: 'u1', role: 'pme', level: 'Non évalué', ...fields }) as UserProfile;

test('new account must read its initiation modules before the test', () => {
  const state = getLearnerOnboarding(profile(), courses);
  assert.equal(state.required, true);
  assert.deepEqual(state.modules.map(course => course.id), ['intro']);
  assert.equal(state.readyForTest, false);
});
test('all distinct chapter indexes are required; opening a course does not complete a chapter', () => {
  const opened = recordCourseReadingInProfile(profile(), courses[0]);
  assert.deepEqual(opened.completedLessonsByCourse?.intro, []);
  assert.equal(getLearnerOnboarding(opened, courses).readyForTest, false);
  for (const indices of [[0], [0, 0], [0, 99]]) {
    assert.equal(getLearnerOnboarding(profile({ completedLessonsByCourse: { intro: indices } }), courses).readyForTest, false);
  }
});
test('saved reading resumes after login and unlocks only the test', () => {
  const restored = JSON.parse(JSON.stringify(profile({ completedLessonsByCourse: { intro: [0, 1] } })));
  const state = getLearnerOnboarding(restored, courses);
  assert.equal(state.required, true);
  assert.equal(state.readyForTest, true);
  assert.equal(getLearnerOnboarding(profile({ id: 'u2' }), courses).readyForTest, false);
});
test('a score or initiation validation alone never unlocks the advanced curriculum', () => {
  for (const placementScore of [0, 40, 100]) assert.equal(getLearnerOnboarding(profile({ placementScore }), courses).required, true);
  assert.equal(getLearnerOnboarding(profile({ niveauValidation: 'Initiation' }), courses).required, true);
});
test('missing initiation configuration cannot silently unlock a test', () => {
  assert.equal(getLearnerOnboarding(profile(), []).readyForTest, false);
});
test('profiles without a dedicated module receive the common legal foundation', () => {
  const state = getLearnerOnboarding(profile({ role: 'societe_civile' }), [...courses, { id: 'MOD-001', level: 'Fondamental', targetAudience: ['pme'] } as CourseModule]);
  assert.deepEqual(state.modules.map(course => course.id), ['MOD-001']);
});

test('only a confirmed higher stage unlocks the curriculum; staff keep their workspace',()=>{
 assert.equal(getLearnerOnboarding(profile({ niveauValidation: 'Approfondi' }),courses).required,false);
 assert.equal(getLearnerOnboarding(profile({ role: 'super_admin' }),courses).required,false);
});
