import { test } from 'node:test';
import assert from 'node:assert/strict';
import { essentialLessonCues, sampleLessonStoryboard, motionWindow } from '../src/utils/motionLessonStoryboard';
import type { SingleScreenCardData } from '../src/components/ProfessorFilmScenes';
const explanation='Les besoins doivent être définis avec les équipes de terrain. Chaque étape de la procédure doit être documentée afin de préserver la transparence et la traçabilité des décisions.';
const rule='Vérifiez les crédits budgétaires avant de lancer la procédure.';
const screen={explanation,fieldRule:rule,explanationStartRatio:.15,fieldRuleStartRatio:.8} as SingleScreenCardData;
test('visual cues select essential concepts rather than reproduce narration',()=>{
 const cues=essentialLessonCues(explanation);
 assert.ok(cues.length<=3);
 assert.ok(cues.every(cue=>cue.split(/\s+/).length<=6));
 assert.notEqual(cues.join(' '),explanation);
 assert.deepEqual(essentialLessonCues(rule),['Vérifier les crédits budgétaires']);
 assert.deepEqual(essentialLessonCues('Sans jamais imposer une marque commerciale précise.'),['Sans marque imposée']);
 assert.deepEqual(essentialLessonCues(''),[]);
 assert.ok(!essentialLessonCues('Ne vérifiez pas les crédits budgétaires.').includes('Vérifier les crédits budgétaires'));
});
test('caption phase follows narration and seeking is deterministic',()=>{
 assert.equal(sampleLessonStoryboard(screen,.79,8).phase,'explanation');
 assert.equal(sampleLessonStoryboard(screen,.8,8).phase,'rule');
 assert.equal(sampleLessonStoryboard(screen,1,8).text,essentialLessonCues(rule).at(-1));
 assert.equal(sampleLessonStoryboard(screen,0,8).pageIndex,0);
 assert.deepEqual(sampleLessonStoryboard(screen,.5,8),sampleLessonStoryboard(screen,.5,8));
});
test('keyframes clamp invalid input and ease to their final position',()=>{
 assert.equal(motionWindow(-2,.1,.4),0);
 assert.equal(motionWindow(2,.1,.4),1);
 assert.equal(motionWindow(NaN,.1,.4),0);
 assert.ok(motionWindow(.25,.1,.4)>.5);
 for(const progress of [NaN,-1,0,.2,.8,1,2]){
  const shot=sampleLessonStoryboard(screen,progress,8);
  assert.ok(shot.pageIndex>=0&&shot.pageIndex<shot.pageCount);
  assert.ok(Number.isFinite(shot.pageProgress));
 }
});
