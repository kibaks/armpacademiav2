import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

export function parseServiceAccount(value: string | undefined) {
  if (!value) return null;
  try {
    const account = JSON.parse(value);
    if (!account || typeof account !== 'object' || Array.isArray(account)
      || account.type !== 'service_account' || account.project_id !== config.projectId
      || typeof account.client_email !== 'string' || typeof account.private_key !== 'string') throw new Error();
    return account;
  } catch {
    throw Object.assign(new Error('La configuration du compte de service Firebase est invalide.'), { code: 'app/invalid-service-account-config' });
  }
}

export function services() {
  let app = getApps().find(a => a.name === 'academia-admin');
  if (!app) {
    const account = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (account && account.project_id !== config.projectId) throw new Error('Le compte de service Firebase doit appartenir au projet configuré.');
    app = initializeApp({ credential: account ? cert(account) : applicationDefault(), projectId: config.projectId, ...(process.env.FIREBASE_SERVICE_ACCOUNT_ID ? { serviceAccountId: process.env.FIREBASE_SERVICE_ACCOUNT_ID } : {}) }, 'academia-admin');
  }
  return { auth: getAuth(app), db: getFirestore(app, config.firestoreDatabaseId) };
}
