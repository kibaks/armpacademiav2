import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sessionIdleExpired, SESSION_IDLE_MS} from '../backend/sessionIdle';
test('idle expiry is enforced exactly at five minutes and old sessions use issue time',()=>{
 assert.equal(sessionIdleExpired({issuedAt:1000},1000+SESSION_IDLE_MS-1),false);
 assert.equal(sessionIdleExpired({issuedAt:1000},1000+SESSION_IDLE_MS),true);
 assert.equal(sessionIdleExpired({issuedAt:1000,lastActivityAt:2000},2000+SESSION_IDLE_MS-1),false);
 assert.equal(sessionIdleExpired({issuedAt:1000,lastActivityAt:2000},2000+SESSION_IDLE_MS),true);
 assert.equal(sessionIdleExpired({},0),true);
});
