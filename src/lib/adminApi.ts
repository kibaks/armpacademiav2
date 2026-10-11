import { auth } from '../firebase';
import { createAuthenticatedFetch } from '../../shared/authenticatedRequest';

export const authenticatedFetch = createAuthenticatedFetch({ currentUser: () => auth.currentUser, origin: () => window.location.origin, fetch: (...args) => fetch(...args) });
export async function adminApi(path: string, method = 'GET', body?: unknown) {
  const res = await authenticatedFetch(`/api/admin${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Opération refusée.');
  return data;
}
