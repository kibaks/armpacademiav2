import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartoonSceneKind, cartoonSpeechMouth } from '../src/utils/cartoonLessonScene';
import { buildSynchronizedLessonScreens } from '../src/components/ProfessorFilmScenes';
test('lesson themes select the appropriate illustrated setting', () => {
 assert.equal(cartoonSceneKind('ministry_cgpmp'),'institutions');
 assert.equal(cartoonSceneKind('construction_crane'),'logistics');
 assert.equal(cartoonSceneKind('dao_calendar'),'planning');
 assert.equal(cartoonSceneKind('sealed_ballot_ano'),'tender');
 assert.equal(cartoonSceneKind('sigmap_server'),'review');
 assert.equal(cartoonSceneKind('open_competition_access'),'justice');
});
test('cartoon lips close when narration is paused or silent and clamp invalid amplitude', () => {
 assert.equal(cartoonSpeechMouth(false,1,'open').height,2);
 assert.equal(cartoonSpeechMouth(true,1,'closed').height,2);
 assert.equal(cartoonSpeechMouth(true,1,'round').width,10);
 assert.ok(cartoonSpeechMouth(true,100,'open').height<=18);
 assert.ok(Number.isFinite(cartoonSpeechMouth(true,NaN,'open').height));
});
test('the illustrated course displays and narrates complete source sentences', () => {
 const explanation='Cette explication est volontairement longue pour vérifier que le générateur ne coupe plus le texte au milieu d’une phrase : '+ 'la procédure doit rester transparente et documentée '.repeat(8)+'.';
 const rule='Avant de transmettre le dossier, vérifiez toutes les pièces et gardez une trace des échanges afin de garantir la transparence de la procédure et la bonne compréhension des obligations par toutes les parties.';
 const content=Array.from({length:5},()=>`Finalité des deniers publics : ${explanation} | Application terrain : ${rule}`).join('\n\n');
 const {sceneData}=buildSynchronizedLessonScreens('Principes',content,'MP-101','Loi 10/010',0);
 assert.ok(sceneData.screens[0].explanation.includes('toutes les parties')===false);
 assert.ok(sceneData.screens[0].explanation.length>230);
 assert.ok(sceneData.screens[0].fieldRule.includes('toutes les parties'));
 assert.ok(sceneData.screens[0].spokenText.includes(sceneData.screens[0].explanation));
 assert.ok(sceneData.screens[0].spokenText.includes('toutes les parties'));
});
