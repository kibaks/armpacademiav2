import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTutorVideoReplayCache} from '../src/utils/tutorVideoReplayCache';
test('replay reuses a completed blob only for the identical learner request',()=>{
 const revoked:string[]=[];const cache=createTutorVideoReplayCache(url=>revoked.push(url));
 cache.remember('learner-A/fr/question-1','blob:one');
 assert.equal(cache.get('learner-A/fr/question-1'),'blob:one');
 assert.equal(cache.get('learner-B/fr/question-1'),undefined);
 assert.equal(cache.get('learner-A/ln/question-1'),undefined);
 assert.equal(cache.owns('blob:one'),true);assert.deepEqual(revoked,[]);
 cache.remember('learner-A/fr/question-2','blob:two');
 assert.deepEqual(revoked,['blob:one']);assert.equal(cache.get('learner-A/fr/question-1'),undefined);
 cache.clear();cache.clear();assert.deepEqual(revoked,['blob:one','blob:two']);
 assert.equal(cache.get('learner-A/fr/question-2'),undefined);
});
test('expiring remote links and incomplete streams are not retained',()=>{
 const cache=createTutorVideoReplayCache(()=>{});
 cache.remember('question','https://example.com/private?ticket=expired');
 assert.equal(cache.get('question'),undefined);
});
