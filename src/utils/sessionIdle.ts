export const SESSION_IDLE_MS = 5 * 60_000;
/** Background requests, token refreshes and media playback are not activity. */
export function watchSessionIdle(onActivity: () => void, onExpired: () => void, key: string) {
  let last = Date.now(), sent = 0, expired = false;
  const read = () => { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } };
  const check = () => {
    last = Math.max(last, read());
    if (!expired && Date.now() - last >= SESSION_IDLE_MS) { expired = true; onExpired(); }
    return expired;
  };
  const activity = () => {
    if (check()) return;
    last = Date.now();
    try { localStorage.setItem(key, String(last)); } catch { /* Private storage unavailable. */ }
    if (last - sent >= 30_000) { sent = last; onActivity(); }
  };
  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => window.addEventListener(event, activity, {passive:true}));
  const visible = () => { if (document.visibilityState === 'visible') check(); };
  document.addEventListener('visibilitychange', visible);
  const timer = window.setInterval(check, 1000);
  onActivity();
  return () => { window.clearInterval(timer); events.forEach(event => window.removeEventListener(event, activity)); document.removeEventListener('visibilitychange', visible); };
}
