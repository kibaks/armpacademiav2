import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Native media elements cannot attach Firebase bearer headers. The server
// issues a revocable HttpOnly cookie, which never becomes a public file token.
export function MediaSessionBridge() {
  useEffect(() => {
    let revision = 0;
    let queue = Promise.resolve();
    const unsubscribe = onIdTokenChanged(auth, user => {
      const current = ++revision;
      queue = queue.catch(() => {}).then(async () => {
        if (current !== revision) return;
        await fetch('/api/storage/session', { method: 'DELETE' });
        if (!user || current !== revision) return;
        const token = await user.getIdToken();
        if (current !== revision) return;
        await fetch('/api/storage/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      }).catch(() => {});
    });
    return () => { revision++; unsubscribe(); };
  }, []);
  return null;
}
