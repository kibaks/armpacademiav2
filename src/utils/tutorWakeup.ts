/** Wait only for the explicit cold-start response; never retry a completed generation. */
export async function requestTutorWithWakeup(request: () => Promise<Response>, options: {
  currentSession: () => boolean; signal?: AbortSignal | null; onWarming?: () => void;
  now?: () => number; wait?: (ms: number, signal?: AbortSignal | null) => Promise<void>;
}) {
  const now = options.now || Date.now, started = now();
  const wait = options.wait || ((ms, signal) => new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const finish = () => { signal?.removeEventListener('abort', abort); resolve(); };
    const timer = setTimeout(finish, ms);
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(signal?.reason); };
    signal?.addEventListener('abort', abort, {once:true});
  }));
  while (true) {
    options.signal?.throwIfAborted();
    if (!options.currentSession()) throw new Error('La session a changé. Reconnectez-vous.');
    const response = await request();
    if (response.status !== 503 || now() - started >= 600000) return response;
    const data = await response.clone().json().catch(() => ({}));
    if (data.code !== 'TUTOR_WARMING') return response;
    options.onWarming?.();
    await wait(12000, options.signal);
  }
}
