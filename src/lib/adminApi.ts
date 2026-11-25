import { requestTutorWithWakeup } from '../utils/tutorWakeup';
import { auth } from '../firebase';

async function authenticatedFetchOnce(url: string, options: RequestInit = {}) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous avec votre compte.');
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== user.uid) throw new Error('La session a changé. Reconnectez-vous.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers, signal: options.signal || AbortSignal.timeout(url === '/api/ai/tutor' ? 45000 : url === '/api/2fa/send' ? 40000 : 15000) });
  if (!url.startsWith('/api/auth/') && !url.startsWith('/api/2fa/') && (response.status === 401 || response.status === 403)) {
    const data = await response.clone().json().catch(() => ({}));
    if (auth.currentUser?.uid === user.uid && ['SESSION_INVALID', 'AUTH_REQUIRED', 'REAUTH_REQUIRED', 'MFA_REQUIRED'].includes(data.code)) {
      window.dispatchEvent(new CustomEvent('academia-session-required', { detail: { uid: user.uid, code: data.code } }));
    }
  }
  return response;
}
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  if (url !== '/api/ai/tutor') return authenticatedFetchOnce(url, options);
  await auth.authStateReady();
  const owner = auth.currentUser?.uid;
  return requestTutorWithWakeup(() => authenticatedFetchOnce(url, options), {
    signal: options.signal, currentSession: () => auth.currentUser?.uid === owner,
  });
}
export async function adminApi(path: string, method = 'GET', body?: unknown) {
  const res = await authenticatedFetch(`/api/admin${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Opération refusée.');
  return data;
}
