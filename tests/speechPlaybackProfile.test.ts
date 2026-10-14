import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerRate} from '../src/utils/speechPlaybackProfile';
test('mastered Piper voices retain their original pitch at normal speed',()=>{
 assert.equal(providerRate('piper',1),1);
 assert.equal(providerRate('piper',1.25),1.25);
 assert.equal(providerRate('piper',NaN),1);
 assert.equal(providerRate('cartesia-sonic',1),1.02);
});
