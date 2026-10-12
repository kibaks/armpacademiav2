import assert from 'node:assert/strict';
import { initializeApp as adminApp } from 'firebase-admin/app';
import { getFirestore as adminFirestore } from 'firebase-admin/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, getDoc, doc, setDoc, updateDoc, terminate } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('This check requires a local Firestore emulator.');
const projectId = 'demo-academia-auth';
const admin = adminFirestore(adminApp({ projectId }));
const now = Date.now();
const authTime = Math.floor(now / 1000);
const profile = { id: 'alice', email: 'alice@example.com', name: 'Alice', role: 'particulier', twoFactorEnabled: true };
await admin.doc('users/alice').set(profile);
await admin.doc('authSessions/alice-session').set({ uid: 'alice', role: 'particulier', version: 0, expiresAt: now + 60000 });
await admin.doc('tutorConversations/alice').set({ messages: ['private'] });
const apps = [];
function client(uid, claims = {}) {
  const app = initializeApp({ projectId, apiKey: 'test', appId: 'test' }, `${uid}-${apps.length}`);
  const db = getFirestore(app);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port), { mockUserToken: { sub: uid, user_id: uid, email: `${uid}@example.com`, auth_time: authTime, appAuthTime: authTime, appSessionId: `${uid}-session`, role: 'particulier', ...claims } });
  apps.push({ app, db }); return db;
}
const alice = client('alice');
try {
  await assert.rejects(getDoc(doc(alice, 'users/alice')), e => e.code === 'permission-denied', 'private profile is also locked before OTP');
  await assert.rejects(getDoc(doc(alice, 'tutorConversations/alice')), e => e.code === 'permission-denied', 'private data must be locked before OTP');
  await assert.rejects(updateDoc(doc(alice, 'users/alice'), { twoFactorEnabled: false }), e => e.code === 'permission-denied', 'owner cannot bypass MFA by editing profile');
  await assert.rejects(setDoc(doc(alice, 'mfaSessions/alice-session'), { authTime, expiresAt: now + 60000 }), e => e.code === 'permission-denied', 'client cannot forge MFA proof');
  await admin.doc('mfaSessions/alice-session').set({ authTime, expiresAt: now + 60000 });
  assert.equal((await getDoc(doc(alice, 'tutorConversations/alice'))).exists(), true, 'verified session may read private data');
  await updateDoc(doc(alice, 'users/alice'), { name: 'Alice Updated' });
  await assert.rejects(updateDoc(doc(alice, 'users/alice'), { role: 'super_admin' }), e => e.code === 'permission-denied');
  const otherSession = client('alice', { appAuthTime: authTime + 1 });
  await assert.rejects(getDoc(doc(otherSession, 'tutorConversations/alice')), e => e.code === 'permission-denied', 'proof cannot unlock another sign-in');
  await admin.doc('mfaSessions/alice-session').set({ authTime, expiresAt: now - 1 });
  await assert.rejects(getDoc(doc(alice, 'tutorConversations/alice')), e => e.code === 'permission-denied', 'expired proof must lock Firestore');
  await admin.doc('users/bob').set({ ...profile, id: 'bob', email: 'bob@example.com', twoFactorEnabled: false });
  await admin.doc('tutorConversations/bob').set({ messages: [] });
  await admin.doc('authSessions/bob-session').set({ uid: 'bob', role: 'particulier', version: 0, expiresAt: now + 60000 });
  const bob = client('bob');
  assert.equal((await getDoc(doc(bob, 'tutorConversations/bob'))).exists(), true);
  await assert.rejects(getDoc(doc(bob, 'users/alice')), e => e.code === 'permission-denied');
  await admin.doc('authSessions/bob-session').delete();
  await assert.rejects(getDoc(doc(bob, 'tutorConversations/bob')), e => e.code === 'permission-denied', 'logout revokes direct Firestore reads');
  console.log('Firestore authentication rules verified: OTP gating, protected fields, session binding, expiry and ownership.');
} finally {
  for (const { app, db } of apps) { await terminate(db); await deleteApp(app); }
  await admin.terminate();
}
