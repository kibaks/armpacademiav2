import { UserRole } from '../types';

/**
 * Masque de saisie verrouillé et filtré pour les numéros de téléphone / WhatsApp RDC (+243 XX XXX XXXX)
 * - Verrouille l'indicatif +243
 * - Filtre strictement tous les caractères non numériques
 * - Convertit automatiquement 081... ou 24381... en +243 81 ...
 * - Limite strictement à 9 chiffres nationaux après +243
 */
export function formatDRCPhoneMask(rawInput: string): string {
  // Extraire uniquement les chiffres
  let digits = (rawInput || '').replace(/\D/g, '');

  // Si l'utilisateur efface tout ou ne laisse que "243"
  if (!digits || digits === '243' || digits === '24' || digits === '2') {
    return '+243 ';
  }

  // Si commence par 243, retirer le préfixe pays pour isoler les 9 chiffres nationaux
  if (digits.startsWith('243')) {
    digits = digits.slice(3);
  }

  // Si commence par 0 (ex: 081...), retirer le 0 initial
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Verrouiller à 9 chiffres maximum (format national RDC : XX XXX XXXX)
  const localDigits = digits.slice(0, 9);

  if (localDigits.length === 0) {
    return '+243 ';
  }
  if (localDigits.length <= 2) {
    return `+243 ${localDigits}`;
  }
  if (localDigits.length <= 5) {
    return `+243 ${localDigits.slice(0, 2)} ${localDigits.slice(2)}`;
  }
  return `+243 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5, 9)}`;
}

/**
 * Vérifie si un numéro RDC formaté est complet (exactement 9 chiffres après +243)
 */
export function isValidDRCPhone(formattedPhone: string): boolean {
  const digits = (formattedPhone || '').replace(/\D/g, '');
  if (!digits.startsWith('243')) return false;
  const local = digits.slice(3);
  if (local.length !== 9) return false;
  // Préfixes opérateurs mobiles RDC valides (Vodacom, Airtel, Orange, Africell)
  return /^(80|81|82|83|84|85|89|90|91|97|98|99)\d{7}$/.test(local);
}

/**
 * Filtre et masque pour Nom complet, Post-nom et Prénom :
 * - Interdit les chiffres et symboles spéciaux (@, #, $, %, etc.)
 * - Autorise uniquement les lettres (y compris accents français), espaces, tirets, apostrophes et points
 * - Limite à 70 caractères
 */
export function filterPersonNameMask(rawInput: string): string {
  const cleaned = (rawInput || '')
    .replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\-{2,}/g, '-')
    .slice(0, 70);

  // Mettre en majuscule l'initiale de chaque mot tout en préservant la saisie en cours
  return cleaned.replace(/(^|[\s\-'])([a-zà-ÿ])/g, (_match, sep, char) => `${sep}${char.toUpperCase()}`);
}

/**
 * Filtre et masque pour Institution, Ministère ou Raison Sociale PME :
 * - Supprime les balises, chevrons et caractères spéciaux non institutionnels
 * - Limite à 90 caractères
 */
export function filterInstitutionMask(rawInput: string): string {
  return (rawInput || '')
    .replace(/[<>{}[\]\\^~`$#*+=|]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 90);
}

/**
 * Filtre et masque pour Fonction officielle / Titre de poste :
 * - Autorise lettres, accents, espaces, tirets, apostrophes, parenthèses et slashs
 * - Limite à 75 caractères
 */
export function filterRoleTitleMask(rawInput: string): string {
  return (rawInput || '')
    .replace(/[^a-zA-ZÀ-ÿ0-9\s\-'().,/&]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 75);
}

/**
 * Masque verrouillé et filtré pour Matricule Administratif ou N° ARSP / RCCM (PME)
 * - Convertit tout en MAJUSCULES
 * - N'autorise que A-Z, 0-9, tiret (-) et slash (/)
 * - Limite à 28 caractères
 */
export function formatMatriculeOrRccmMask(rawInput: string): string {
  return (rawInput || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\-\/]/g, '')
    .replace(/[\-]{2,}/g, '-')
    .replace(/[\/]{2,}/g, '/')
    .slice(0, 28);
}

/**
 * Génère un préfixe de matricule suggéré selon le rôle choisi
 */
export function getDefaultMatriculePrefixByRole(role: UserRole): string {
  switch (role) {
    case 'pme':
      return 'ARSP-RDC-2026-';
    case 'grande_entreprise':
      return 'GE-RDC-2026-';
    case 'cgpmp_member':
      return 'CGPMP-RDC-';
    case 'ac_agent':
      return 'AC-RDC-';
    case 'societe_civile':
      return 'SOC-CIV-RDC-';
    case 'independant':
      return 'IND-RDC-';
    case 'armp_agent':
      return 'ARMP-DIR-';
    case 'dgcmp_agent':
      return 'DGCMP-CTRL-';
    case 'formateur':
      return 'DFAT-FORM-';
    case 'dfat_admin':
      return 'DFAT-ADM-';
    default:
      return 'CAND-RDC-';
  }
}

/**
 * Filtre strict pour adresse email (sans espaces ni caractères interdits)
 */
export function filterEmailMask(rawInput: string): string {
  return (rawInput || '')
    .replace(/\s+/g, '')
    .replace(/[<>,;:"'[\]\\()]/g, '')
    .toLowerCase()
    .slice(0, 90);
}

/**
 * Filtre strict pour code OTP à 6 chiffres
 */
export function filterOtpMask(rawInput: string): string {
  return (rawInput || '').replace(/\D/g, '').slice(0, 6);
}

/**
 * Liste officielle des 26 Provinces de la République Démocratique du Congo pour verrouiller la saisie géographique
 */
export const DRC_PROVINCES = [
  'Kinshasa',
  'Haut-Katanga (Lubumbashi)',
  'Lualaba (Kolwezi)',
  'Kongo Central (Matadi)',
  'Nord-Kivu (Goma)',
  'Sud-Kivu (Bukavu)',
  'Kasaï-Oriental (Mbuji-Mayi)',
  'Kasaï-Central (Kananga)',
  'Kasaï (Tshikapa)',
  'Tshopo (Kisangani)',
  'Ituri (Bunia)',
  'Équateur (Mbandaka)',
  'Kwilu (Bandundu / Kikwit)',
  'Kwango (Kenge)',
  'Mai-Ndombe (Inongo)',
  'Maniema (Kindu)',
  'Tanganyika (Kalemie)',
  'Haut-Lomami (Kamina)',
  'Lomami (Kabinda)',
  'Sankuru (Lusambo)',
  'Sud-Ubangi (Gemena)',
  'Nord-Ubangi (Gbadolite)',
  'Mongala (Lisala)',
  'Tshuapa (Boende)',
  'Bas-Uele (Buta)',
  'Haut-Uele (Isiro)'
] as const;
