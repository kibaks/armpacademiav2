import {test} from 'node:test';
import assert from 'node:assert/strict';
import {procurementCorpusCoverage,retrieveProcurementKnowledge} from '../backend/procurementKnowledge';

test('the entire official documentation catalogue has explicit source and extraction coverage',()=>{
 const docs=procurementCorpusCoverage();assert.equal(docs.length,39);
 for(const d of docs) {assert.match(d.url,/^https:\/\/armp-rdc\.cd\//);assert.equal(d.usable,d.passages>0);}
 assert.ok(docs.find(d=>d.title.includes('23/12'))?.usable);
});
test('intellectual services are grounded in official texts, without historical or provincial defaults',()=>{
 const r=retrieveProcurementKnowledge('Les quatre types de marchés publics et les prestations intellectuelles');
 assert.match(r.block,/prestations intellectuelles/i);
 assert.ok(r.sources.length>0);
 assert.ok(r.sources.every(s=>!s.includes('10/22')&&!s.includes('PROVINCE')));
 assert.ok(r.block.length<11000);
});
test('questions about the old manual retrieve the 2023 abrogation rather than presenting 2010 as current',()=>{
 const r=retrieveProcurementKnowledge('Le manuel de procédures 10/22 de 2010 est-il encore valable ?');
 assert.match(r.sources[0],/23\/12.*article 195/);
 assert.match(r.block,/abrog/i);
});
test('an unknown topic does not fabricate legal sources',()=>{
 assert.deepEqual(retrieveProcurementKnowledge('xylophonissime').sources,[]);
});
