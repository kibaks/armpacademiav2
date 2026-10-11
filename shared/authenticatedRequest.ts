type SessionUser = { uid: string; getIdToken: () => Promise<string> };
export async function currentSessionToken(currentUser: () => SessionUser | null) {
  const user = currentUser();
  if (!user) throw new Error('Connectez-vous avec votre compte Firebase.');
  const token = await user.getIdToken();
  if (currentUser() !== user) throw new Error('La session a changé. Réessayez avec le compte connecté.');
  return { user, token };
}

export function createAuthenticatedFetch(dependencies: {
  currentUser: () => SessionUser | null;
  origin: () => string;
  fetch: typeof fetch;
}) {
  return async (url: string, options: RequestInit = {}) => {
    const origin = dependencies.origin();
    const target = new URL(url, origin);
    if (target.origin !== origin || !target.pathname.startsWith('/api/') || target.username || target.password) {
      throw new Error('Les jetons de session sont réservés aux API de cette application.');
    }
    // Firebase refreshes an expired ID token automatically. Never keep a JWT
    // copy in localStorage or send it after the active account has changed.
    const { token } = await currentSessionToken(dependencies.currentUser);
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return dependencies.fetch(target.href, { ...options, headers, redirect: 'error', signal: options.signal || AbortSignal.timeout(15000) });
  };
}
