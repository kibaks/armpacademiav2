import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tutorReplyStoryboard} from '../src/utils/tutorReplyStoryboard';
import {readCourseMotionStoryboard} from '../shared/courseMotionVideo';
test('reply video captions use the complete answer and the associated question',()=>{
 const text='L’autorité contractante prépare le dossier. Le soumissionnaire remet une offre. La vérification porte sur les pièces du dossier.';
 const story=tutorReplyStoryboard(text,{question:'Quel est le rôle du soumissionnaire ?',lessonTitle:'Les acteurs de la commande publique'})!;
 assert.ok(readCourseMotionStoryboard(story));assert.equal(story.title,'Quel est le rôle du soumissionnaire ?');
 assert.equal(story.chapter,'Les acteurs de la commande publique');assert.equal(story.cues.map(c=>c.text).join(' '),text);assert.equal(story.music,false);
 const other=tutorReplyStoryboard('Le titulaire exécute les prestations prévues au marché.',{question:'Que fait le titulaire ?'})!;
 assert.notDeepEqual(other.cues,story.cues);assert.ok(!other.cues.some(c=>c.text.includes('soumissionnaire')));
});
test('long and accented replies preserve every word, within the renderer bounds',()=>{
 const text=('Le contrôle vérifie les pièces, sans remplacer l’autorité contractante. '.repeat(35)).trim();
 const story=tutorReplyStoryboard(text)!;assert.ok(story.cues.length<=8);assert.ok(story.cues.every(c=>c.text.length<=500));
 assert.equal(story.cues.map(c=>c.text).join(' '),text);assert.equal(story.cues[0].start,0);
 for(let i=1;i<story.cues.length;i++)assert.ok(story.cues[i].start>story.cues[i-1].start);
 assert.equal(tutorReplyStoryboard('x'.repeat(3001)),null);assert.equal(tutorReplyStoryboard(' '),null);
});
