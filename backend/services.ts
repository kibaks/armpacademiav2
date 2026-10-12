import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

export function services() {
  let app = getApps().find(a => a.name === 'academia-admin');
  if (!app) {
    const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : null;
    if (account && account.project_id !== config.projectId) throw new Error('Le compte de service Firebase doit appartenir au projet configuré.');
    app = initializeApp({ credential: account ? cert(account) : applicationDefault(), projectId: config.projectId, ...(process.env.FIREBASE_SERVICE_ACCOUNT_ID ? { serviceAccountId: process.env.FIREBASE_SERVICE_ACCOUNT_ID } : {}) }, 'academia-admin');
  }
  return { auth: getAuth(app), db: getFirestore(app, config.firestoreDatabaseId) };
}
