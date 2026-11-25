/** A single wakeup on opening chat, never a background keepalive. */
export function createTutorPrewarm(now: () => number = Date.now) {
  let previous: {uid:string; at:number} | undefined;
  return async (uid: string | undefined, request: () => Promise<unknown>) => {
    if (!uid || (previous?.uid===uid && now()-previous.at<60000)) return;
    previous={uid,at:now()};
    try { await request(); } catch { /* Chat remains usable if the probe fails. */ }
  };
}
