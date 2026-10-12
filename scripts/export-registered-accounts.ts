import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { services } from '../backend/services';

const destination = process.argv[2];
if (!destination) throw new Error('Usage : node --import tsx scripts/export-registered-accounts.ts <fichier.csv>');
const { auth, db } = services();
const rows: string[][] = [['Identifiant', 'Nom', 'Email', 'Rôle', 'État', 'Modes de connexion', 'Création', 'Dernière connexion']];
let pageToken: string | undefined;
do {
  const page = await auth.listUsers(1000, pageToken);
  for (const user of page.users) {
    const profile = (await db.collection('users').doc(user.uid).get()).data();
    rows.push([user.uid, profile?.name || user.displayName || '', user.email || '', user.customClaims?.role || profile?.role || 'Non renseigné', user.disabled ? 'Désactivé' : 'Actif', user.providerData.map(provider => provider.providerId === 'google.com' ? 'Google' : provider.providerId).join(', '), user.metadata.creationTime || '', user.metadata.lastSignInTime || '']);
  }
  pageToken = page.pageToken;
} while (pageToken);
const cell = (value: string) => {
  const safe = /^[\s]*[=+@-]/.test(String(value)) ? `'${value}` : String(value);
  return `"${safe.replaceAll('"', '""')}"`;
};
const path = resolve(destination);
await mkdir(dirname(path), { recursive: true });
await writeFile(path, '\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n') + '\r\n', { mode: 0o600 });
console.log(`${rows.length - 1} comptes exportés vers ${path}. Aucun mot de passe inclus.`);
