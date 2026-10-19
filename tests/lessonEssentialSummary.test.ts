import assert from 'node:assert/strict';
import {test} from 'node:test';
import {lessonEssentialSummary} from '../src/utils/lessonEssentialSummary';
import {buildInitiationModules} from '../src/data/initiationCurriculum';
import {buildSynchronizedLessonScreens} from '../src/components/ProfessorFilmScenes';
import {INITIATION_MOTION_NOTES} from '../src/data/initiationMotionNotes';

test('screen summaries stay concise without cutting conditions or replaying full narration',()=>{
  const long='Si les documents présentent des contradictions, '+Array(35).fill('vérifiez').join(' ')+', ne concluez pas avant de rapprocher les pièces.';
  const fallback='Quelles pièces faut-il rapprocher ?';
  assert.deepEqual(lessonEssentialSummary(long,undefined,fallback),[fallback]);
  assert.deepEqual(lessonEssentialSummary(long,'La décision doit être justifiée.',fallback),['La décision doit être justifiée.']);
  for(const phrase of lessonEssentialSummary('Une facture ne prouve pas la conformité. Le contrôle confronte les pièces. La narration développe le raisonnement.',undefined,fallback)) {
    assert.ok(phrase.split(/\s+/).length<=24);
    assert.ok(!phrase.includes('La narration'));
  }
});
test('the screen displays the essential note while the tutor retains the detailed explanation',()=>{
  const course=buildInitiationModules([''])[0], lesson=course.lessons[0];
  const {sceneData,sentences}=buildSynchronizedLessonScreens(lesson.title,lesson.content,course.code,course.legalRef,0);
  const caption=lessonEssentialSummary(sceneData.screens[0].explanation,INITIATION_MOTION_NOTES[0][0][0],'Quels engagements faut-il identifier ?')[0];
  assert.equal(caption,INITIATION_MOTION_NOTES[0][0][0]);
  assert.ok(sentences[0].includes(INITIATION_MOTION_NOTES[0][0][1]));
  assert.ok(!caption?.includes(INITIATION_MOTION_NOTES[0][0][1]));
});
