import { auth } from '../firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous avec votre compte.');
  const token = await user.getIdToken();
  if (auth.currentUser?.uid !== user.uid) throw new Error('La session a changé. Reconnectez-vous.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers, signal: options.signal || AbortSignal.timeout(15000) });
  if (!url.startsWith('/api/auth/') && !url.startsWith('/api/2fa/') && (response.status === 401 || response.status === 403)) {
    const data = await response.clone().json().catch(() => ({}));
    if (auth.currentUser?.uid === user.uid && ['SESSION_INVALID', 'AUTH_REQUIRED', 'REAUTH_REQUIRED', 'MFA_REQUIRED'].includes(data.code)) {
      window.dispatchEvent(new CustomEvent('academia-session-required', { detail: { uid: user.uid, code: data.code } }));
    }
  }
  return response;
}
export async function adminApi(path: string, method = 'GET', body?: unknown) {
  const res = await authenticatedFetch(`/api/admin${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Opération refusée.');
  return data;
}
