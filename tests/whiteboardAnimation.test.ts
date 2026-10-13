import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleDrawing,WHITEBOARD_STROKES} from '../src/utils/whiteboardAnimation';
test('marker follows the exact revealed stroke and completes all themes',()=>{
 const strokes=[[0,0,100,0],[100,50,100,150]];
 assert.deepEqual(sampleDrawing(strokes,.25).cursor,{x:50,y:0});
 assert.deepEqual(sampleDrawing(strokes,.75).cursor,{x:100,y:100});
 for(const paths of Object.values(WHITEBOARD_STROKES)){
  assert.ok(sampleDrawing(paths,0).visible.every(value=>value===0));
  assert.ok(sampleDrawing(paths,1).visible.every(value=>value===1));
  assert.ok(Number.isFinite(sampleDrawing(paths,NaN).cursor.x));
 }
});
