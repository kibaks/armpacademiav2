import { auth } from '../firebase';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  if (!auth.currentUser) throw new Error('Connectez-vous avec votre compte Firebase.');
  const token = await auth.currentUser.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(15000) });
}
export async function adminApi(path: string, method = 'GET', body?: unknown) {
  const res = await authenticatedFetch(`/api/admin${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Opération refusée.');
  return data;
}
