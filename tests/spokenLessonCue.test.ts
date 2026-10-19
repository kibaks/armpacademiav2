import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {SingleScreenCardData} from '../src/components/ProfessorFilmScenes';
import {spokenLessonCue} from '../src/utils/spokenLessonCue';
import {lessonVisualFocus} from '../src/utils/lessonVisualFocus';
import {LessonContextIllustration} from '../src/components/LessonContextIllustration';

const screen = {
  explanation: 'Le contrat définit la commande. Les équipements sont livrés sur le site. Le contrôle vérifie leur conformité.',
  fieldRule: 'Comparez les pièces à la livraison.', explanationStartRatio: 0, fieldRuleStartRatio: .8,
} as SingleScreenCardData;
test('the diagram cue follows whole spoken sentences and the actual application boundary',()=>{
  assert.equal(spokenLessonCue(screen,0).text,'Le contrat définit la commande.');
  assert.equal(spokenLessonCue(screen,.35).text,'Les équipements sont livrés sur le site.');
  assert.match(spokenLessonCue(screen,.7).text,/contrôle/);
  assert.equal(spokenLessonCue(screen,.79).phase,'explanation');
  assert.equal(spokenLessonCue(screen,.8).phase,'rule');
  assert.equal(spokenLessonCue(screen,1).text,screen.fieldRule);
  assert.deepEqual(spokenLessonCue(screen,.35),spokenLessonCue(screen,.35));
  for(const p of [NaN,-3,2]) assert.ok(Number.isFinite(spokenLessonCue(screen,p).progress));
  assert.equal(spokenLessonCue({...screen,fieldRule:''},1).phase,'explanation');
  assert.equal(spokenLessonCue({...screen,explanation:'',fieldRule:''},0).text,'');
});
test('the active part follows the concepts mentioned instead of a fixed three-step timer',()=>{
  const sentence='La commande précise ce qui est attendu. La livraison est ensuite examinée pour vérifier la conformité.';
  assert.equal(lessonVisualFocus('delivery',sentence,.1).index,0);
  assert.equal(lessonVisualFocus('delivery',sentence,.6).index,1);
  assert.equal(lessonVisualFocus('delivery',sentence,1).index,2);
  assert.equal(lessonVisualFocus('delivery','Une prestation est conforme.',1).confirmed,true);
  for(const text of ['La livraison ne prouve pas la conformité.','Si la prestation est conforme, examinez les pièces.','La prestation doit être vérifiée.']) assert.equal(lessonVisualFocus('delivery',text,1).confirmed,false);
});
test('spoken content can change the illustration and unverified delivery is not labelled as approved',()=>{
  const render=(narration:string)=>renderToStaticMarkup(React.createElement(LessonContextIllustration,{topic:'Évaluation des offres',labels:[],progress:.8,still:true,narration,narrationProgress:.8}));
  assert.match(render('Le prix couvre les charges.'),/lesson-context-figure--ledger/);
  const delivery=render('Une livraison ne prouve pas la conformité.');
  assert.match(delivery,/lesson-context-figure--delivery/);
  assert.ok(!delivery.includes('M100 255l23 23 48-55'));
  assert.match(delivery,/lesson-context-figure__focus/);
  const stable=renderToStaticMarkup(React.createElement(LessonContextIllustration,{topic:'Livraison',labels:[],progress:.8,still:true,narration:'Le contrôle confronte ce qui est fourni aux engagements contractuels.',narrationProgress:.8}));
  assert.match(stable,/lesson-context-figure--delivery/);
});
