import { demoLearners } from '../shared/demoLearners';
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { demoPersonas } from '../shared/demoPersonas';
import { demoRoles } from '../shared/demoRoles';
import config from '../firebase-applet-config.json' with { type: 'json' };
import { services } from '../backend/services';
import { passwordHash, passwordMatches } from '../backend/nativeSession';

const apply = process.argv.includes('--apply');
const confirmation = process.argv.find(arg => arg.startsWith('--project='))?.slice(10);
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9);
const refresh = process.argv.includes('--refresh-fixtures');
const lifetimeHours = Number(process.argv.find(arg => arg.startsWith('--lifetime-hours='))?.slice(17) || 24);
if (!Number.isInteger(lifetimeHours) || lifetimeHours < 1 || lifetimeHours > 168) throw new Error('Durée de démonstration attendue : 1 à 168 heures.');
const lifetime = lifetimeHours * 3600000;
const plan = [...demoRoles.map(role => ({ role, email: `demo.${role}@academia.example.test`, ...demoPersonas[role] })), ...(process.argv.includes('--include-learners') ? demoLearners : [])];
if (!apply) { console.log(JSON.stringify({ project: config.projectId, lifetimeHours, accounts: plan, applied: false }, null, 2)); }
else {
  if (confirmation !== config.projectId || !output) throw new Error('Confirmez le projet configuré avec --project=<ID> et indiquez --output=<dossier privé>.');
  const folder = resolve(output);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const { auth, db } = services();
  const accounts: any[] = [];
  let previous: any[] = [];
  try { previous = JSON.parse(await readFile(resolve(folder, 'comptes-demo-prives.json'), 'utf8')).accounts || []; } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  const persist = async () => {
    const merged = new Map(previous.map(account => [account.email, account]));
    for (const account of accounts) merged.set(account.email, account);
    await writeFile(resolve(folder, 'comptes-demo-prives.json'), JSON.stringify({ project: config.projectId, fictional: true, accounts: [...merged.values()] }, null, 2), { mode: 0o600 });
  };
  for (const entry of plan) {
    let existing;
    try { existing = await auth.getUserByEmail(entry.email); } catch (error: any) { if (error.code !== 'auth/user-not-found') throw error; }
    if (existing) {
      if (existing.customClaims?.demoFixture !== true || existing.customClaims?.role !== entry.role) throw new Error('Adresse déjà utilisée : aucun compte existant ne sera remplacé.');
      const known = previous.find(account => account.uid === existing.uid && account.role === entry.role);
      if (refresh) {
        const expiresAt = Date.now() + lifetime;
        const credentialRef = db.collection('authAccounts').doc(existing.uid);
        const credentials = await credentialRef.get();
        if (!known?.password || !credentials.data()?.passwordHash || !await passwordMatches(known.password, credentials.data()!.passwordHash)) throw new Error('Identifiants privés manquants ou incohérents : aucun mot de passe existant ne sera changé.');
        await db.runTransaction(async tx => {
          const profileRef = db.collection('users').doc(existing!.uid);
          const profile = await tx.get(profileRef);
          if (profile.data()?.demoFixture !== true || profile.data()?.role !== entry.role) throw new Error('Le profil existant n’est pas une démonstration du rôle attendu.');
          tx.update(credentialRef, { demoExpiresAt: expiresAt });
          tx.update(profileRef, { name: entry.name, prenom: entry.prenom, nom: entry.nom, postnom: entry.postnom, roleTitle: entry.roleTitle, institution: entry.institution, demoMission: entry.mission, demoExpiresAt: expiresAt, updatedAt: new Date().toISOString() });
        });
        await auth.updateUser(existing.uid, { displayName: entry.name });
        accounts.push({ ...known, ...entry, uid: existing.uid, expiresAt: new Date(expiresAt).toISOString(), status: 'démonstration actualisée, mot de passe inchangé' });
        await persist();
      } else accounts.push({ ...known, ...entry, uid: existing.uid, status: 'existant, mot de passe inchangé' });
      continue;
    }
    const password = randomBytes(24).toString('base64url');
    const hash = await passwordHash(password);
    const user = await auth.createUser({ email: entry.email, displayName: entry.name });
    const expiresAt = Date.now() + lifetime;
    try {
      await auth.setCustomUserClaims(user.uid, { role: entry.role, demoFixture: true });
      await db.runTransaction(async tx => {
        tx.set(db.collection('authAccounts').doc(user.uid), { passwordHash: hash, version: 1, demoExpiresAt: expiresAt });
        tx.set(db.collection('users').doc(user.uid), { id: user.uid, name: entry.name, email: entry.email, role: entry.role, prenom: entry.prenom, nom: entry.nom, postnom: entry.postnom, roleTitle: entry.roleTitle, institution: entry.institution, demoMission: entry.mission, demoExpiresAt: expiresAt, twoFactorEnabled: false, demoFixture: true, level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [], joinDate: new Date().toISOString() });
      });
    } catch (error) { await auth.deleteUser(user.uid); throw error; }
    accounts.push({ ...entry, uid: user.uid, password, expiresAt: new Date(expiresAt).toISOString(), status: 'créé' });
    // Persist after each account so a partial failure never loses credentials.
    await persist();
  }
  await persist();
  console.log(`${accounts.length} comptes traités. Identifiants enregistrés uniquement dans le dossier privé demandé.`);
}
