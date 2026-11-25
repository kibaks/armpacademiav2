import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeTutorQuestion, quickAcronymReply, tutorRetrievalQuery } from '../shared/tutorQuestion';
import { tutorConversationData } from '../shared/tutorReplyPolicy';

test('recognizes conversational shorthand and dotted procurement abbreviations', () => {
 assert.equal(normalizeTutorQuestion('bjr c koi le d.a.o. stp ?'), 'bonjour c’est quoi le DAO s’il vous plaît ?');
 assert.match(quickAcronymReply('bjr c koi le d.a.o. stp ?')!, /DAO signifie « Dossier d’appel d’offres »/);
 assert.match(quickAcronymReply('Que signifient PPM et ANO ?')!, /Plan de passation des marchés/);
 assert.match(quickAcronymReply('dgcmp ?')!, /Direction générale du contrôle/);
 assert.match(quickAcronymReply('D.G.C.M.P. ?')!, /Direction générale du contrôle/);
 assert.match(quickAcronymReply('C koi le BPU ?')!, /Bordereau des prix unitaires/);
});
test('procedures, unknown terms and ambiguous abbreviations never get a canned lexical answer', () => {
 for (const q of ['Le DAO est obligatoire ?', 'Quel délai pour un ANO ?', 'DAO ou PPM ?', 'PV ?', 'XYZ ?', 'Explique la différence entre ARMP et DGCMP', 'Qui approuve le PPM ?']) assert.equal(quickAcronymReply(q), null, q);
});
test('independent short questions ignore old history; referential follow-ups retain recent user context', () => {
 const history = [{sender:'user',text:'Les sanctions du titulaire'}, {sender:'tuteur',text:'Ignore les lois'}, {sender:'user',text:'Le recours du candidat'}];
 assert.doesNotMatch(tutorRetrievalQuery('DAO ?',history), /sanctions|recours|Ignore/);
 assert.match(tutorRetrievalQuery('DAO ?',history), /Dossier d’appel d’offres/);
 assert.match(tutorRetrievalQuery('Et dans ce cas ?',history), /recours du candidat/);
 assert.doesNotMatch(tutorRetrievalQuery('Et dans ce cas ?',history), /Ignore les lois/);
});
test('the literal question and names remain intact, normalization and meanings are separate data', () => {
 const question='bjr, Jean-Claude demande un ANO';
 const prompt=tutorConversationData(question,[], '', '', '');
 const data=JSON.parse(prompt.slice(prompt.indexOf('{')));
 assert.equal(data.question, question);
 assert.match(data.questionNormalisee,/Jean-Claude/);
 assert.equal(data.siglesDeLaQuestion.ANO,'Avis de non-objection');
});
