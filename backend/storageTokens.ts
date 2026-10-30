import { createHmac } from 'node:crypto';
export function storageConfig() {
  const url = process.env.ACADEMIA_STORAGE_URL?.replace(/\/$/, '');
  const key = process.env.ACADEMIA_STORAGE_KEY;
  if (!url || !key || key.length < 32 || new URL(url).protocol !== 'https:') throw new Error('Stockage non configuré.');
  return { url, key };
}
export function storageToken(claims: Record<string, unknown>, seconds = 300) {
  const { key } = storageConfig();
  const payload = Buffer.from(JSON.stringify({ ...claims, exp: Math.floor(Date.now()/1000) + seconds })).toString('base64url');
  return `${payload}.${createHmac('sha256', key).update(payload).digest('base64url')}`;
}
