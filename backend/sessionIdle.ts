export const SESSION_IDLE_MS = 5 * 60_000;
export function sessionIdleExpired(session: {lastActivityAt?: number; issuedAt?: number}, now = Date.now()) {
  const last = session.lastActivityAt ?? session.issuedAt;
  return typeof last !== 'number' || !Number.isFinite(last) || now - last >= SESSION_IDLE_MS;
}
