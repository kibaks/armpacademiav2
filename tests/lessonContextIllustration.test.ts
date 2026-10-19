import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LessonContextIllustration} from '../src/components/LessonContextIllustration';
import {contextualLessonPhrases} from '../src/utils/lessonMotionCues';
import {INITIATION_QUESTIONS} from '../src/data/initiationQuestions';
test('context changes SVG geometry, not merely three diagram labels',()=>{
 const topics=['Allotissement','Évaluation des offres','Réception','Garantie','Prix','Recours','Audit','Calendrier','Acteurs','Numérique','Besoin','Contrat','Publicité'];
 const drawings=topics.map(topic=>renderToStaticMarkup(React.createElement(LessonContextIllustration,{topic,progress:1,still:true,labels:[]})).match(/<svg[\s\S]*?<\/svg>/)?.[0]);
 assert.equal(new Set(drawings).size,topics.length);
});
test('long source sentences replace generic topic slogans without truncating conditions',()=>{
 const source='Lorsque le service prépare un achat de matériel destiné à plusieurs sites, les quantités, les destinations et les conditions de livraison doivent rester cohérentes dans toutes les pièces du dossier.';
 assert.deepEqual(contextualLessonPhrases('Dossier',source),[source]);
 const questions=INITIATION_QUESTIONS.flat();assert.equal(new Set(questions).size,36);
});
