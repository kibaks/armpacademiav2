import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectTutorPosture, selectTutorArticulation, referenceCell } from '../src/utils/tutorReferenceGeometry';
test('reference gestures use full body poses and fall back to composed hands at rest or when disabled', () => {
  assert.equal(selectTutorPosture(true,'pedagogical',true,true),4);
  assert.equal(selectTutorPosture(false,'curious',true,true),1);
  assert.equal(selectTutorPosture(true,'curious',true,true),4);
  assert.equal(selectTutorPosture(false,'smiling',true,true),3);
  assert.equal(selectTutorPosture(true,'enthusiastic',false,true),3);
  assert.equal(selectTutorPosture(true,'enthusiastic',true,false),3);
});
test('reference articulation closes bilabials, rounds French vowels and reserves the wide-open image for open vowels', () => {
  assert.equal(selectTutorArticulation('closed',0.8),0);
  assert.equal(selectTutorArticulation('round',0.4),4);
  assert.equal(selectTutorArticulation('wide',0.4),2);
  assert.equal(selectTutorArticulation('open',0.8),3);
  assert.equal(selectTutorArticulation('open',0.3),1);
});
test('all cells remain inside each atlas, including the male close-up rows and female gutters', () => {
  for (let i=0;i<6;i++) for(const male of [false,true]) for(const articulation of [false,true]) {
    const cell=referenceCell(male,i,articulation);
    assert.ok(cell.x>=0&&cell.y>=0&&cell.w>0&&cell.h>0);
    assert.ok(cell.x+cell.w <= (male?1086:1232));assert.ok(cell.y+cell.h<=(male?1448:864));
  }
  assert.equal(referenceCell(true,3,true).y,1073);
});
