import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTutorVideoSequence,splitTutorVideoText} from '../src/utils/tutorVideoSequence';

test('long narration preserves every word, condition and accent; short replies remain one video',()=>{
 const sentence='Les prestations intellectuelles constituent un type de marché public. Conservez les conditions et les exceptions ; ne changez aucun montant ni délai. ';
 const text=sentence.repeat(12).trim();const parts=splitTutorVideoText(text);
 assert.ok(parts.length>1);assert.equal(parts.join(' ').replace(/\s+/g,' '),text.replace(/\s+/g,' '));
 assert.ok(parts[0].length<text.length/3);assert.deepEqual(splitTutorVideoText('Bonjour !'),['Bonjour !']);
 assert.ok(splitTutorVideoText('Un mot très long. '.repeat(500)).every(p=>p.length<=900));
});
test('playback only prepares one following part, reusing its job at the boundary',async()=>{
 const calls:number[]=[];const q=createTutorVideoSequence(['premier','deuxième','troisième'],async(t,i)=>{calls.push(i);return t;});
 assert.equal(await q.load(),'premier');q.prefetch();q.prefetch();
 await Promise.resolve();assert.deepEqual(calls,[0,1]);
 assert.equal(await q.advance(),'deuxième');assert.deepEqual(calls,[0,1]);
 q.prefetch();assert.equal(await q.advance(),'troisième');assert.equal(q.advance(),null);
 assert.deepEqual(calls,[0,1,2]);
});
test('a failed lookahead can be retried and never skips a part',async()=>{
 let attempts=0;const q=createTutorVideoSequence(['début','suite'],async(t,i)=>{if(i===1&&++attempts<3)throw Error('network');return t;});
 await q.load();q.prefetch();await new Promise(resolve=>setImmediate(resolve));
 await assert.rejects(q.advance()!,/network/);assert.equal(q.index,1);
 assert.equal(await q.load(),'suite');assert.equal(q.index,1);
});
