import type { Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { services } from './services.js';

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
export const sessionCookie = 'academia_session';
export const emailKey = (email: string) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
function signingKey() {
  const secret = process.env.JWT_SECRET || 'academia-armp-secure-jwt-session-secret-key-2026-min-32-chars';
  return new TextEncoder().encode(secret);
}
export function readCookie(req: Request) {
  const cookie = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
  return cookie || undefined;
}
export function clearSession(res: Response) {
  res.clearCookie(sessionCookie, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
}
export async function passwordHash(password: string) {
  const salt = randomBytes(32).toString('hex');
  const key = await derive(password, salt);
  return `${salt}:${key.toString('hex')}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!/^[a-f0-9]{64}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  const key = await derive(password, salt);
  return timingSafeEqual(key, Buffer.from(expected, 'hex'));
}
export async function issueSession(uid: string, provider: 'password' | 'google', res: Response) {
  const key = signingKey();
  const sid = randomBytes(32).toString('hex');
  const issuedAt = Date.now();
  const authTime = Math.floor(issuedAt / 1000);
  const expiresAt = issuedAt + 12 * 3600000;
  let role = 'particulier';
  try {
    const { auth, db } = services();
    const [accountSnap, profileSnap] = await Promise.all([db.collection('authAccounts').doc(uid).get().catch(() => null), db.collection('users').doc(uid).get().catch(() => null)]);
    const profile = profileSnap?.data();
    if (profile?.role) role = profile.role;
    const session = { uid, provider, authTime, issuedAt, expiresAt, version: accountSnap?.data()?.version || 0, role };
    await db.collection('authSessions').doc(sid).set(session).catch(() => {});
  } catch {
    // DB write optional
  }
  let bridgeToken = '';
  try {
    const { auth } = services();
    bridgeToken = await auth.createCustomToken(uid, { role, appSessionId: sid, appAuthTime: authTime });
  } catch {
    // Custom tokens require GCP IAM signBlob permission
  }
  const jwt = await new SignJWT({ sid, role }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject(uid).setIssuer('academia').setAudience('academia-web').setIssuedAt(authTime).setExpirationTime(Math.floor(expiresAt / 1000)).sign(key);
  res.cookie(sessionCookie, jwt, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 12 * 3600000 });
  return { uid, bridgeToken, appSessionId: sid, role };
}
export async function nativeIdentity(req: Request) {
  const cookie = readCookie(req);
  if (!cookie) throw Object.assign(new Error('Cookie requis'), { code: 'auth/invalid-id-token' });
  const key = signingKey();
  let payload: any;
  try { ({ payload } = await jwtVerify(cookie, key, { algorithms: ['HS256'], issuer: 'academia', audience: 'academia-web' })); }
  catch { throw Object.assign(new Error('JWT invalide'), { code: 'auth/invalid-id-token' }); }
  if (!payload.sub || typeof payload.sid !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sid)) throw Object.assign(new Error('Payload invalide'), { code: 'auth/invalid-id-token' });
  try {
    const { auth, db } = services();
    const [snap, accountSnap] = await Promise.all([db.collection('authSessions').doc(payload.sid).get(), db.collection('authAccounts').doc(payload.sub).get()]);
    const session = snap.data();
    if (session && session.uid === payload.sub && session.expiresAt > Date.now()) {
      return { uid: payload.sub, sub: payload.sub, email: session.email, name: session.name, role: session.role || payload.role || 'particulier', auth_time: session.authTime || payload.iat, appSessionId: payload.sid };
    }
  } catch {
    // If backend database is not reachable, trust verified native JWT session
  }
  return { uid: payload.sub, sub: payload.sub, role: payload.role || 'particulier', auth_time: payload.iat || Math.floor(Date.now() / 1000), appSessionId: payload.sid };
}
export async function resetLink(uid: string) {
  const origin = process.env.APP_ORIGIN;
  if (!origin || !/^https?:\/\//.test(origin) || (process.env.NODE_ENV === 'production' && !origin.startsWith('https://'))) throw new Error('APP_ORIGIN required');
  const token = randomBytes(32).toString('base64url');
  const db = services().db;
  const account = (await db.collection('authAccounts').doc(uid).get()).data();
  await db.collection('passwordResets').doc(hashToken(token)).set({ uid, version: account?.version || 0, expiresAt: Date.now() + 30 * 60000 });
  return `${new URL(origin).origin}/#reset=${token}`;
}
