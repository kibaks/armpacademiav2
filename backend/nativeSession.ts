import type { Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { services } from './services.js';

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
export const sessionCookie = 'academia_session';
export const emailKey = (email: string) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
  return new TextEncoder().encode(secret);
}
export function readCookie(req: Request) {
  return req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
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
  const { auth, db } = services();
  const user = await auth.getUser(uid);
  if (user.disabled) throw Object.assign(new Error(), { code: 'auth/user-disabled' });
  const sid = randomBytes(32).toString('hex');
  const issuedAt = Date.now();
  const authTime = Math.floor(issuedAt / 1000);
  const expiresAt = issuedAt + 12 * 3600000;
  const [accountSnap, profileSnap] = await Promise.all([db.collection('authAccounts').doc(uid).get(), db.collection('users').doc(uid).get()]);
  const account = accountSnap.data();
  if (account?.demoExpiresAt && account.demoExpiresAt <= Date.now()) throw Object.assign(new Error(), { code: 'auth/user-disabled' });
  const profile = profileSnap.data();
  if (!user.customClaims?.role && ['super_admin', 'dfat_admin', 'formateur', 'armp_agent', 'dgcmp_agent'].includes(profile?.role)) throw new Error('Privileged claims must be configured by the administrator');
  const role = user.customClaims?.role || (['cgpmp_member', 'ac_agent', 'pme', 'grande_entreprise', 'societe_civile', 'independant', 'particulier'].includes(profile?.role) ? profile!.role : 'particulier');
  if (!user.customClaims?.role) await auth.setCustomUserClaims(uid, { ...user.customClaims, role });
  const session = { uid, provider, authTime, issuedAt, expiresAt, version: account?.version || 0, role };
  const bridgeToken = await auth.createCustomToken(uid, { role, appSessionId: sid, appAuthTime: authTime });
  const jwt = await new SignJWT({ sid }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject(uid).setIssuer('academia').setAudience('academia-web').setIssuedAt(authTime).setExpirationTime(Math.floor(expiresAt / 1000)).sign(key);
  await db.collection('authSessions').doc(sid).set(session);
  res.cookie(sessionCookie, jwt, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 12 * 3600000 });
  return { uid, bridgeToken, appSessionId: sid, role };
}
export async function nativeIdentity(req: Request) {
  const key = signingKey();
  let payload;
  try { ({ payload } = await jwtVerify(readCookie(req) || '', key, { algorithms: ['HS256'], issuer: 'academia', audience: 'academia-web' })); }
  catch { throw Object.assign(new Error(), { code: 'auth/invalid-id-token' }); }
  if (!payload.sub || typeof payload.sid !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sid)) throw Object.assign(new Error(), { code: 'auth/invalid-id-token' });
  const { auth, db } = services();
  const [snap, accountSnap, user] = await Promise.all([db.collection('authSessions').doc(payload.sid).get(), db.collection('authAccounts').doc(payload.sub).get(), auth.getUser(payload.sub)]);
  const session = snap.data();
  if (!session || session.uid !== payload.sub || session.expiresAt <= Date.now() || session.version !== (accountSnap.data()?.version || 0) || (accountSnap.data()?.demoExpiresAt && accountSnap.data()!.demoExpiresAt <= Date.now()) || user.disabled || Date.parse(user.tokensValidAfterTime || '') > session.issuedAt) throw Object.assign(new Error(), { code: 'auth/id-token-revoked' });
  return { uid: user.uid, sub: user.uid, email: user.email, name: user.displayName, role: user.customClaims?.role || 'particulier', auth_time: session.authTime, appSessionId: payload.sid };
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
