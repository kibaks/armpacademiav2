import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonConceptLabels } from '../src/utils/lessonConceptLabels';
test('diagrams name the actual concepts rather than incidental verbs', () => {
 assert.deepEqual(lessonConceptLabels('Pour comprendre cette définition, repérez les parties, la prestation et le prix.', 'Définition'), ['parties','prestation','prix']);
 assert.deepEqual(lessonConceptLabels('Vérifiez la livraison puis le paiement.', 'Contrôle'), ['livraison','paiement']);
 assert.deepEqual(lessonConceptLabels('Observez ce qui se passe.', 'Exemple'), ['Exemple']);
});
