import type { UserRole } from '../src/types';
import { demoPersonas } from './demoPersonas';
const records: Array<[UserRole, string, string, string]> = [
  ['cgpmp_member', 'Laurent', 'Mukeba', 'Tshiala'], ['cgpmp_member', 'Pauline', 'Kavira', 'Mboli'],
  ['ac_agent', 'Didier', 'Malemba', 'Kipanga'], ['ac_agent', 'Rosalie', 'Ntumba', 'Banza'],
  ['armp_agent', 'Joseph', 'Mampuya', 'Kisimba'], ['armp_agent', 'Marcelline', 'Tshiyoyo', 'Kambale'],
  ['dgcmp_agent', 'François', 'Nkulu', 'Mwamba'], ['dgcmp_agent', 'Odette', 'Masengo', 'Lukombo'],
  ['pme', 'Trésor', 'Banza', 'Kitenge'], ['pme', 'Florence', 'Mbuyamba', 'Kalenga'],
  ['grande_entreprise', 'Emmanuel', 'Muteba', 'Ilunga'], ['grande_entreprise', 'Sylvie', 'Mbombo', 'Nsumbu'],
  ['societe_civile', 'Dieudonné', 'Katembo', 'Lusamba'], ['societe_civile', 'Patricia', 'Lulendo', 'Mbikayi'],
  ['independant', 'Fabrice', 'Lukau', 'Mputu'], ['independant', 'Solange', 'Mukoko', 'Kabaseya'],
  ['particulier', 'Jonathan', 'Kisonga', 'Muleka'], ['particulier', 'Blandine', 'Mpoyi', 'Kashala'],
];
export const demoLearners = records.map(([role, prenom, nom, postnom]) => {
  const emailName = `${prenom}.${nom}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return { ...demoPersonas[role], role, name: `${prenom} ${nom} ${postnom}`, prenom, nom, postnom, email: `demo.${emailName}@academia.example.test` };
});
