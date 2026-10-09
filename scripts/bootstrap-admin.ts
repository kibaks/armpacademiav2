import 'dotenv/config';
import { services } from '../backend/admin';

const uid = process.argv[2];
if (!uid) throw new Error('Usage: npx tsx scripts/bootstrap-admin.ts <Firebase UID>');
const { auth, db } = services();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, role: 'super_admin' });
await db.collection('users').doc(uid).set({ id: uid, name: user.displayName || 'Superadministrateur', email: user.email, role: 'super_admin', roleTitle: 'Superadministrateur', institution: 'ARMP-RDC', level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [] }, { merge: true });
await auth.revokeRefreshTokens(uid);
console.log('Rôle superadministrateur attribué. Reconnectez ce compte.');
