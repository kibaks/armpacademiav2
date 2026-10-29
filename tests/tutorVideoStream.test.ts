import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openTutorVideoStream, supportsTutorVideoStream } from '../src/utils/tutorVideoStream';

test('MSE stream appends every chunk and closes only when the response finishes', { timeout: 5000 }, async t => {
  const appended: number[] = [];
  let instance: any;
  let finished!: () => void;
  const ended = new Promise<void>(resolve => { finished = resolve; });
  class Buffer extends EventTarget {
    appendBuffer(value: ArrayBuffer) { appended.push(...new Uint8Array(value)); queueMicrotask(() => this.dispatchEvent(new Event('updateend'))); }
  }
  class Source extends EventTarget {
    static isTypeSupported() { return true; }
    readyState = 'open';
    constructor() { super(); instance = this; }
    addSourceBuffer() { return new Buffer(); }
    endOfStream() { finished(); }
  }
  t.mock.method(globalThis.URL, 'createObjectURL', () => 'blob:test');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'MediaSource');
  Object.defineProperty(globalThis, 'MediaSource', { value: Source, configurable: true, writable: true });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'MediaSource', previous); else Reflect.deleteProperty(globalThis, 'MediaSource'); });
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2])); controller.enqueue(new Uint8Array([3, 4])); controller.close(); } }), { headers: { 'content-type': 'video/mp4' } }));
  assert.equal(supportsTutorVideoStream(), true);
  let failed = false;
  assert.equal(openTutorVideoStream('https://worker.example/play', new AbortController().signal, () => { failed = true; }), 'blob:test');
  instance.dispatchEvent(new Event('sourceopen'));
  await ended;
  assert.deepEqual(appended, [1, 2, 3, 4]);
  assert.equal(failed, false);
});

test('a failed or expired playback request invokes ordinary-playback fallback', { timeout: 5000 }, async t => {
  let source: EventTarget;
  class Source extends EventTarget { constructor() { super(); source = this; } }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'MediaSource');
  Object.defineProperty(globalThis, 'MediaSource', { value: Source, configurable: true, writable: true });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'MediaSource', previous); else Reflect.deleteProperty(globalThis, 'MediaSource'); });
  t.mock.method(globalThis.URL, 'createObjectURL', () => 'blob:test');
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 403 }));
  const failed = new Promise<void>(resolve => { openTutorVideoStream('https://worker.example/play', new AbortController().signal, resolve); });
  source!.dispatchEvent(new Event('sourceopen'));
  await failed;
});
