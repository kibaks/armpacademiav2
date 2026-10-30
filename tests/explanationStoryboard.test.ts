import assert from 'node:assert/strict';
import { test } from 'node:test';
import { explanationStoryboard, explanationShotAt, explanationSpokenShot } from '../src/utils/explanationStoryboard';
const text='Définir le besoin consiste à décrire le résultat attendu. Exemple fictif : une école cherche des tables adaptées à ses salles. Une facture ne prouve pas, à elle seule, la conformité des tables à la commande. Vérifiez les caractéristiques prévues dans les pièces du dossier.';
test('every scene preserves a complete source sentence, including legal conditions and negations',()=>{
 const shots=explanationStoryboard(text);
 assert.equal(shots.map(s=>s.text).join(' '),text);
 assert.ok(shots.some(s=>s.text.includes('ne prouve pas, à elle seule')));
 assert.ok(shots.some(s=>s.label==='Un exemple pour comprendre'));
 assert.ok(shots.every(s=>s.start>=0&&s.end>s.start&&s.end<=1));
});
test('seeking and the actual spoken sentence select the same scenes without independent timers',()=>{
 const shots=explanationStoryboard(text);
 for(let i=0;i<shots.length;i++){
  assert.equal(explanationShotAt(shots,(shots[i].start+shots[i].end)/2),i);
  assert.equal(explanationSpokenShot(shots,shots[i].text),i);
 }
 assert.equal(explanationShotAt(shots,1),shots.length-1);
 assert.equal(explanationShotAt(shots,NaN),0);
 assert.equal(explanationSpokenShot(shots,''),-1);
 assert.equal(explanationSpokenShot(shots,'Autre réponse.'),-1);
});
test('insufficient evidence remains a caution, and long conditions are never shortened',()=>{
 const conditional='Cet extrait ne permet pas de conclure sur ce point : '+Array(60).fill('condition').join(' ')+', sans le texte officiel applicable.';
 const shots=explanationStoryboard(conditional);
 assert.equal(shots[0].text,conditional);
 assert.equal(shots[0].label,'Le point de vigilance');
 assert.deepEqual(explanationStoryboard(''),[]);
});
test('short lead-ins and decimal amounts do not become misleading isolated slides',()=>{
 const shots=explanationStoryboard('Exemple fictif. Le montant est de 12,50 USD. Ce montant n’est pas un seuil légal.');
 assert.ok(shots[0].text.startsWith('Exemple fictif. Le montant'));
 assert.equal(shots.map(s=>s.text).join(' '),'Exemple fictif. Le montant est de 12,50 USD. Ce montant n’est pas un seuil légal.');
});

import { explanationConcepts } from '../src/utils/explanationStoryboard';
test('visual chips identify source concepts rather than generic verbs or invented terminology',()=>{
 assert.deepEqual(explanationConcepts('Définir le besoin consiste à décrire le résultat attendu et les caractéristiques utiles.'),['besoin','résultat attendu','caractéristiques']);
 assert.deepEqual(explanationConcepts('Une offre ne remplace pas les offres des entreprises.'),['offres','entreprises']);
 assert.deepEqual(explanationConcepts('Bonjour, comment allez-vous ?'),[]);
});

test('voice matching tolerates formatting without deleting the condition being explained',()=>{
 const shots=explanationStoryboard('**Vérifiez les pièces** avant de conclure. Consultez [le document](https://example.com/texte).');
 assert.equal(explanationSpokenShot(shots,'Consultez le document.'),1);
});
