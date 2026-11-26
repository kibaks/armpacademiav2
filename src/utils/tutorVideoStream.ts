// MuseTalk emits fragmented H.264 Main 3.1 + AAC. MSE keeps the growing
// response open; a native MP4 player can mistake its current end for EOF.
export const TUTOR_STREAM_TYPE = 'video/mp4; codecs="avc1.4D401F, mp4a.40.2"';

export function supportsTutorVideoStream() {
  return typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported(TUTOR_STREAM_TYPE);
}

export function openTutorVideoStream(url: string, signal: AbortSignal, onError: () => void, request: (url:string, init:RequestInit) => Promise<Response> = fetch) {
  const source = new MediaSource();
  const objectUrl = URL.createObjectURL(source);
  source.addEventListener('sourceopen', () => {
    void (async () => {
      const response = await request(url, { signal, credentials: 'omit', redirect: 'error' });
      if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('video/mp4')) throw new Error('Invalid stream');
      const reader = response.body.getReader();
      try {
        const buffer = source.addSourceBuffer(TUTOR_STREAM_TYPE);
        while (!signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value?.length) continue;
          await new Promise<void>((resolve, reject) => {
            const clean = () => { buffer.removeEventListener('updateend', ready); buffer.removeEventListener('error', fail); signal.removeEventListener('abort', fail); };
            const ready = () => { clean(); resolve(); };
            const fail = () => { clean(); reject(new Error('Stream interrupted')); };
            buffer.addEventListener('updateend', ready, { once: true });
            buffer.addEventListener('error', fail, { once: true });
            signal.addEventListener('abort', fail, { once: true });
            try { if (signal.aborted) fail(); else buffer.appendBuffer(new Uint8Array(value).buffer); }
            catch { fail(); }
          });
        }
        if (!signal.aborted && source.readyState === 'open') source.endOfStream();
      } finally { await reader.cancel().catch(() => undefined); }
    })().catch(() => { if (!signal.aborted) onError(); });
  }, { once: true });
  return objectUrl;
}

/** Empty/growing buffers are waiting for generation, not a decoder failure. */
export function hasTutorVideoBuffer(video:Pick<HTMLVideoElement,'readyState'|'currentTime'|'buffered'>) {
  if(video.readyState<2)return false;
  for(let i=0;i<video.buffered.length;i++)
    if(video.buffered.start(i)<=video.currentTime+0.1 && video.buffered.end(i)>video.currentTime+0.2)return true;
  return false;
}
