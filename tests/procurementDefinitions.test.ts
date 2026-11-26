import {test} from 'node:test';
import assert from 'node:assert/strict';
import {procurementDefinition} from '../backend/procurementDefinitions';

test('reviewed basic definitions include all four statutory types without GPU inference',()=>{
  for(const q of ['C’est quoi le marché public ?', 'Quels sont les types de marchés publics ?', 'Les catégories des marchés publics', 'La prestation intellectuelle', 'Expliquer moi la préstation intellectuelle', 'Qu’est-ce que les marchés de prestations intellectuelles ?']) {
    const r=procurementDefinition(q);
    assert.ok(r,q);
    assert.match(r.reply,/prestations intellectuelles/);
    assert.match(r.sources[0],/10\/010/);
    assert.equal(r.provider,'procurement-definitions');
  }
});
test('cases, conditions, comparisons and follow-ups remain grounded model questions',()=>{
  for(const q of ['Le nettoyage est-il une prestation intellectuelle ?', 'Une prestation intellectuelle est-elle soumise à une garantie ?', 'Quels seuils pour les prestations intellectuelles ?', 'Compare les types de marchés publics', 'Et les services ?', 'Marché public au Burundi']) assert.equal(procurementDefinition(q),null,q);
});
