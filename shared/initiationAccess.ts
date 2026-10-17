export const INITIATION_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;
export function initiationWindowExpired(expiresAt: unknown, now = Date.now()) {
  return typeof expiresAt === 'number' && Number.isFinite(expiresAt) && expiresAt <= now;
}
