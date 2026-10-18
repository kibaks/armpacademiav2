import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compactLessonPhrases, motionCaptionAt} from '../src/utils/lessonMotionCues';
import {buildInitiationModules} from '../src/data/initiationCurriculum';
import {INITIATION_MOTION_NOTES} from '../src/data/initiationMotionNotes';
import {buildSynchronizedLessonScreens} from '../src/components/ProfessorFilmScenes';
test('visual phrases stay short and never truncate a condition or a negation', () => {
  const source = 'Une facture ne prouve pas, à elle seule, la conformité de la prestation. Le contrat précise les conditions applicables.';
  for(const phrase of compactLessonPhrases(source)) assert.ok(source.includes(phrase));
  assert.match(compactLessonPhrases(source)[0], /ne prouve pas/);
  const long = Array(50).fill('condition').join(' ') + '.';
  assert.deepEqual(compactLessonPhrases(long, 'Examinez les conditions du dossier.'), ['Examinez les conditions du dossier.']);
  for(const notes of INITIATION_MOTION_NOTES) for(const [caption, explanation] of notes) {
    assert.ok(caption.split(/\s+/).length <= 24);
    assert.ok(explanation.split(/\s+/).length >= 25);
  }
});
test('seeking selects the same phrase deterministically without a separate animation clock', () => {
  const phrases = ['Une première idée.', 'Une seconde idée.'];
  assert.equal(motionCaptionAt(phrases,.1).index,0);
  assert.equal(motionCaptionAt(phrases,.8).index,1);
  assert.deepEqual(motionCaptionAt(phrases,.8),motionCaptionAt(phrases,.8));
  for(const p of [NaN,-2,0,.3,1,2]) assert.ok(Number.isFinite(motionCaptionAt(phrases,p).progress));
});
test('complete teacher explanations remain in the audio and transcript, beyond the visual caption', () => {
  for(const [i,course] of buildInitiationModules(['']).entries()) for(const [j,lesson] of course.lessons.entries()) {
    const {sentences}=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code,course.legalRef,j);
    assert.ok(sentences[0].includes(INITIATION_MOTION_NOTES[i][j][1]));
    assert.ok(sentences[0].length > INITIATION_MOTION_NOTES[i][j][0].length * 3);
    assert.ok(!sentences[0].includes(lesson.title));
  }
});
