import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  AlertCircle,
  Sparkles,
  UserPlus,
  Phone,
  Shield,
  KeyRound,
  Mail,
  RefreshCw,
  MapPin,
  Briefcase,
  Hash,
  Users,
  FileText,
  UserCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  CgpmpCellMember,
  CgpmpCreationDocumentInfo,
  CgpmpAccountCreationRequest
} from '../types';
import { PME_DEMO_ACCOUNTS, DEMO_PROFILES } from '../data/initialData';
import {
  firebaseLoginUser,
  firebaseGoogleAuthenticate,
  saveGoogleRegisteredProfile,
  checkExistingRegisteredUser,
  firebaseResetPassword,
  getLocalCgpmpAccountRequests,
  saveCgpmpAccountRequestToFirestore,
  validateCgpmpAccountRequestByArmp,
  rejectCgpmpAccountRequestByArmp
} from '../firebase';
import {
  formatDRCPhoneMask,
  isValidDRCPhone,
  filterPersonNameMask,
  filterInstitutionMask,
  filterRoleTitleMask,
  formatMatriculeOrRccmMask,
  getDefaultMatriculePrefixByRole,
  filterEmailMask,
  DRC_PROVINCES
} from '../utils/inputMasks';
import { AuthPortalLeftColumn } from './AuthPortalLeftColumn';
import {
  CgpmpCreationDocumentSection,
  CgpmpMembersRosterStep,
  CgpmpSubmittedConfirmationCard
} from './CgpmpMemberAndDocSteps';
import { CgpmpAdminValidationPanel } from './CgpmpAdminValidationPanel';
import { ArmpLogo } from './ArmpLogo';

export interface RegisterLearnerData {
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
}

interface RoleCreationFieldSpec {
  label: string;
  shortDesc: string;
  badgeText: string;
  institutionLabel: string;
  institutionPlaceholder: string;
  institutionPresets: string[];
  subCategoryLabel: string;
  subCategoryOptions: string[];
  specialtyLabel: string;
  specialtyOptions: string[];
  roleTitleLabel: string;
  roleTitlePlaceholder: string;
  roleTitlePresets: string[];
  matriculeLabel: string;
  matriculePlaceholder: string;
  secondaryIdLabel: string;
  secondaryIdPlaceholder: string;
  defaultSecondaryId: string;
}

export const ROLE_CREATION_CONFIG: Record<UserRole, RoleCreationFieldSpec> = {
  pme: {
    label: '🏢 PME & Sous-Traitant',
    shortDesc: 'Loi 17/001 • ARSP • Contenu Local 51%',
    badgeText: 'Champs PME & Sous-Traitance (Loi n° 17/001) chargés',
    institutionLabel: 'Dénomination Sociale de la PME / Entreprise *',
    institutionPlaceholder: 'ex: CONGO BÂTI-TECH SARL',
    institutionPresets: [
      'CONGO BÂTI-TECH SARL',
      'KATANGA LOGISTIQUE & MINES SAS',
      'KIN-ÉNERGIE & TECH SARL',
      'GROUPE KASAÏ INFRASTRUCTURES SA'
    ],
    subCategoryLabel: "Secteur d'Activité PME & Sous-Traitance *",
    subCategoryOptions: [
      'BTP, Génie Civil & Infrastructures Routières',
      'Fournitures, Équipements & Matériels Techniques',
      'Mines, Énergie, Eau & Hydrocarbures (Sous-Traitance)',
      'Informatique, Numérique, Télécoms & SIGMAP',
      'Logistique, Transport, Douane & Manutention',
      'Services Généraux, Sécurité & Maintenance',
      'Santé, Médicaments & Agro-industrie'
    ],
    specialtyLabel: 'Forme Juridique & Part du Capital Congolais (Loi 17/001) *',
    specialtyOptions: [
      'SARL — ≥ 51% Capital Congolais (Éligible Contenu Local ARSP)',
      'SAS — ≥ 51% Capital Congolais (Éligible Contenu Local ARSP)',
      'SA — Société Anonyme de Droit Congolais (100% RDC)',
      'Établissement / Entreprise Individuelle (100% Congolais)',
      'Groupement Momentané d’Entreprises (GME PME RDC)'
    ],
    roleTitleLabel: 'Fonction du Dirigeant ou Représentant PME *',
    roleTitlePlaceholder: 'ex: Gérant Statutaire & Responsable Marchés',
    roleTitlePresets: [
      'Gérant Statutaire & Responsable Marchés',
      'Directeur Général PME',
      'Responsable Appels d’Offres & Soumissions',
      'Directeur Technique & Opérations'
    ],
    matriculeLabel: "N° Attestation d'Enregistrement ARSP *",
    matriculePlaceholder: 'ARSP-RDC-2026-0412',
    secondaryIdLabel: 'N° RCCM ou Identification Nationale (ID Nat) *',
    secondaryIdPlaceholder: 'CD/KIN/RCCM/26-B-0412',
    defaultSecondaryId: 'CD/KIN/RCCM/26-B-0412'
  },
  particulier: {
    label: '👤 Consultant / Candidat',
    shortDesc: 'Expert indépendant, bureau d’études',
    badgeText: 'Champs Consultant & Prestations Intellectuelles chargés',
    institutionLabel: "Cabinet d'Études, Université ou Statut Indépendant *",
    institutionPlaceholder: 'ex: Consultant Individuel Indépendant — Kinshasa',
    institutionPresets: [
      'Consultant Individuel Indépendant (RDC)',
      'Cabinet Afrique Conseil & Ingénierie',
      'Bureau d’Études Techniques & Audit RDC',
      'Chercheur Associé — Université de Kinshasa'
    ],
    subCategoryLabel: "Domaine d'Expertise (Prestations Intellectuelles) *",
    subCategoryOptions: [
      'Passation des Marchés & Élaboration DAO / DP / TDR',
      'Ingénierie, Architecture & Maîtrise d’Œuvre BTP',
      'Audit Financier, Comptable & Revue Indépendante',
      'Droit Public, Contentieux & Arbitrage des Marchés',
      'Suivi-Évaluation Projets (Banque Mondiale / BAD / UE)',
      'Systèmes d’Information, Digitalisation & E-Procurement'
    ],
    specialtyLabel: "Niveau de Qualification & Années d'Expérience *",
    specialtyOptions: [
      'Expert Senior Certifié (+10 ans d’expérience)',
      'Consultant Confirmé — Master / Ingénieur (5 à 10 ans)',
      'Consultant Junior — Licence / Master (2 à 5 ans)',
      'Enseignant-Chercheur / Docteur en Droit ou Économie'
    ],
    roleTitleLabel: 'Titre Professionnel du Consultant *',
    roleTitlePlaceholder: 'ex: Consultant Senior en Passation des Marchés',
    roleTitlePresets: [
      'Consultant Senior en Passation des Marchés',
      'Ingénieur-Conseil Maîtrise d’Œuvre',
      'Auditeur Indépendant Commande Publique',
      'Juriste-Conseil en Marchés Publics & PPP'
    ],
    matriculeLabel: 'N° Identifiant Consultant / Candidat *',
    matriculePlaceholder: 'CAND-RDC-0412',
    secondaryIdLabel: 'N° Ordre Professionnel (ONEC / OAC / Barreau) ou NIF *',
    secondaryIdPlaceholder: 'NIF-RDC-2026-0412',
    defaultSecondaryId: 'NIF-RDC-2026-0412'
  },
  cgpmp_member: {
    label: '🏛️ Cellule CGPMP',
    shortDesc: 'Secrétaire Permanent • Acte & Membres',
    badgeText: 'Procédure CGPMP : Secrétaire Permanent + Acte de Création + Liste des Membres',
    institutionLabel: 'Ministère, Gouvernorat ou Autorité Contractante *',
    institutionPlaceholder: 'ex: Ministère des Infrastructures et Travaux Publics',
    institutionPresets: [
      'Ministère du Budget — Secrétariat Général',
      'Ministère des Infrastructures et Travaux Publics (ITPR)',
      'Ministère de la Santé Publique, Hygiène et Prévoyance',
      'Ministère des Finances — CGPMP',
      'Gouvernorat Provincial de Kinshasa'
    ],
    subCategoryLabel: "Catégorie d'Autorité Contractante *",
    subCategoryOptions: [
      'Ministère du Gouvernement Central (Kinshasa)',
      'Gouvernorat de Province (Exécutif Provincial)',
      'Entité Territoriale Décentralisée (Ville, Commune, Secteur)',
      'Établissement Public ou Entreprise du Portefeuille',
      'Unité de Gestion de Projet (BCECO / CEP-O / CFEF)'
    ],
    specialtyLabel: 'Organe de Direction de la CGPMP *',
    specialtyOptions: [
      'Secrétariat Permanent de la CGPMP (Habilité à créer le compte CGPMP)',
      'Commission de Passation des Marchés (CPM)',
      'Sous-Commission Technique d’Analyse des Offres'
    ],
    roleTitleLabel: 'Qualité Officielle du Créateur du Compte (Verrouillé) *',
    roleTitlePlaceholder: 'Secrétaire Permanent de la CGPMP',
    roleTitlePresets: ['Secrétaire Permanent de la CGPMP'],
    matriculeLabel: 'N° Matricule du Secrétaire Permanent CGPMP *',
    matriculePlaceholder: 'CGPMP-RDC-0412',
    secondaryIdLabel: 'Réf. Arrêté Ministériel / Acte portant Création CGPMP *',
    secondaryIdPlaceholder: 'ARR-CAB-MIN-2026-018',
    defaultSecondaryId: 'ARR-CAB-MIN-2026-018'
  },
  armp_agent: {
    label: '⚖️ Régulateur ARMP',
    shortDesc: 'DFAT, CRD, Réglementation, Audit',
    badgeText: 'Champs Autorité de Régulation (ARMP) chargés',
    institutionLabel: "Direction ou Antenne Provinciale de l'ARMP *",
    institutionPlaceholder: 'ex: Autorité de Régulation des Marchés Publics (DG-ARMP)',
    institutionPresets: [
      'Autorité de Régulation des Marchés Publics (DG-ARMP)',
      'ARMP — Direction de la Formation et Appuis Techniques (DFAT)',
      'ARMP — Comité de Règlement des Différends (CRD)',
      'ARMP — Direction des Statistiques, Audits et Enquêtes'
    ],
    subCategoryLabel: "Direction ou Organe ARMP d'affectation *",
    subCategoryOptions: [
      'Direction Générale (DG-ARMP — Kinshasa Gombe)',
      'Direction de la Formation et des Appuis Techniques (DFAT)',
      'Comité de Règlement des Différends (CRD — Recours)',
      'Direction de la Réglementation et des Études',
      'Direction des Statistiques, Audits et Enquêtes',
      'Antenne Provinciale ARMP'
    ],
    specialtyLabel: "Domaine d'Habilitation Réglementaire ARMP *",
    specialtyOptions: [
      'Instruction des Recours & Contentieux devant le CRD',
      'Homologation Pédagogique & Renforcement des Capacités',
      'Audit a posteriori Indépendant & Enquêtes Nationales',
      'Système d’Information, Statistiques & Portail ARMP'
    ],
    roleTitleLabel: "Fonction Officielle à l'ARMP *",
    roleTitlePlaceholder: 'ex: Cadre Technique DFAT & Chargé de Régulation',
    roleTitlePresets: [
      'Cadre Technique DFAT & Appuis Techniques',
      'Rapporteur près le Comité de Règlement des Différends (CRD)',
      'Auditeur des Marchés Publics & Enquêtes',
      'Chargé d’Études Juridiques & Réglementation'
    ],
    matriculeLabel: 'N° Matricule Agent ARMP *',
    matriculePlaceholder: 'ARMP-DIR-0412',
    secondaryIdLabel: "N° Décision d'Affectation / Carte d'Agent ARMP *",
    secondaryIdPlaceholder: 'DEC-DG-ARMP-2026-09',
    defaultSecondaryId: 'DEC-DG-ARMP-2026-09'
  },
  dgcmp_agent: {
    label: '🛡️ Contrôleur DGCMP',
    shortDesc: 'Contrôle a priori, Seuils & ANO',
    badgeText: 'Champs Contrôle a priori (DGCMP) chargés',
    institutionLabel: 'Direction ou Pool de Contrôle DGCMP *',
    institutionPlaceholder: 'ex: Direction Générale du Contrôle des Marchés Publics (DGCMP)',
    institutionPresets: [
      'Direction Générale du Contrôle des Marchés Publics (DGCMP)',
      'DGCMP — Direction du Contrôle a priori (Kinshasa)',
      'DGCMP — Commission d’Avis de Non-Objection (ANO)',
      'Direction Provinciale du Contrôle des Marchés Publics'
    ],
    subCategoryLabel: 'Pool Technique de Contrôle DGCMP *',
    subCategoryOptions: [
      'Pool Contrôle a priori — Travaux & Infrastructures',
      'Pool Contrôle a priori — Fournitures, Santé & Équipements',
      'Pool Contrôle a priori — Prestations Intellectuelles',
      'Commission d’Émission des Avis de Non-Objection (ANO)',
      'Cellule Examen des Dérogations & Gré à Gré'
    ],
    specialtyLabel: "Périmètre & Seuil d'Habilitation de Contrôle *",
    specialtyOptions: [
      'Marchés Nationaux ≥ Seuil de Contrôle a priori',
      'Marchés sur Financements Extérieurs (Banque Mondiale / BAD)',
      'Contrôle des Plans de Passation des Marchés (PPM)',
      'Autorisations Spéciales de Gré à Gré & Urgences'
    ],
    roleTitleLabel: 'Fonction de Contrôleur DGCMP *',
    roleTitlePlaceholder: 'ex: Vérificateur Principal des DAO & ANO',
    roleTitlePresets: [
      'Vérificateur Principal des Dossiers d’Appel d’Offres (DAO)',
      'Analyste Avis de Non-Objection (ANO)',
      'Chef de Bureau Contrôle a priori DGCMP',
      'Contrôleur National des Marchés Publics'
    ],
    matriculeLabel: 'N° Matricule Contrôleur DGCMP *',
    matriculePlaceholder: 'DGCMP-CTRL-0412',
    secondaryIdLabel: 'N° Habilitation Contrôle a priori / Commission ANO *',
    secondaryIdPlaceholder: 'HAB-DGCMP-2026-044',
    defaultSecondaryId: 'HAB-DGCMP-2026-044'
  },
  formateur: {
    label: '🎓 Formateur DFAT',
    shortDesc: 'Studio IA, Visio & Cours Homologués',
    badgeText: 'Champs Formateur Homologué DFAT chargés',
    institutionLabel: 'Institution Académique ou Centre Homologué DFAT *',
    institutionPlaceholder: 'ex: Direction de la Formation et des Appuis Techniques (DFAT - ARMP)',
    institutionPresets: [
      'Direction de la Formation et des Appuis Techniques (DFAT - ARMP)',
      'École Nationale d’Administration (ENA RDC)',
      'École Nationale des Finances (ENF — Ministère des Finances)',
      'Faculté de Droit — Université de Kinshasa (UNIKIN)'
    ],
    subCategoryLabel: 'Chaire / Spécialité Pédagogique Enseignée *',
    subCategoryOptions: [
      'Procédures de Passation & Montage des DAO (Loi 10/010)',
      'Contrôle a priori, Seuils & Avis de Non-Objection (DGCMP)',
      'Contentieux, Recours & Arbitrage (CRD / ARMP)',
      'Sous-Traitance, PME & Contenu Local 51% (Loi 17/001)',
      'Exécution Financière, Garanties, Avenants & Audits'
    ],
    specialtyLabel: "Grade Académique & Mode d'Intervention *",
    specialtyOptions: [
      'Formateur Senior Certifié DFAT — Studio IA, Visio & Présentiel',
      'Professeur Associé Commande Publique — Masterclass Nationale',
      'Expert Formateur National — Coaching CGPMP & PME'
    ],
    roleTitleLabel: 'Titre Académique / Grade de Formateur *',
    roleTitlePlaceholder: 'ex: Formateur Senior Certifié DFAT / ARMP',
    roleTitlePresets: [
      'Formateur Senior Certifié DFAT / ARMP',
      'Professeur & Expert en Commande Publique RDC',
      'Maître de Conférences & Auteur de Modules ARMP'
    ],
    matriculeLabel: "N° d'Agrément Formateur DFAT *",
    matriculePlaceholder: 'DFAT-FORM-0412',
    secondaryIdLabel: "N° Décision d'Homologation Pédagogique ARMP *",
    secondaryIdPlaceholder: 'HOM-DFAT-ARMP-2026-12',
    defaultSecondaryId: 'HOM-DFAT-ARMP-2026-12'
  },
  dfat_admin: {
    label: '🏛️ Administration DFAT',
    shortDesc: 'Pilotage National & Certification',
    badgeText: 'Champs Administration DFAT chargés',
    institutionLabel: 'Direction Nationale DFAT / ARMP *',
    institutionPlaceholder: 'Direction de la Formation et des Appuis Techniques (DFAT)',
    institutionPresets: [
      'Direction de la Formation et des Appuis Techniques (DFAT)',
      'Secrétariat Technique National de Certification ARMP'
    ],
    subCategoryLabel: 'Service de Pilotage DFAT *',
    subCategoryOptions: [
      'Homologation des Programmes & Certification Nationale',
      'Coordination des Sessions Ministérielles & Provinciales',
      'Administration de la Plateforme ACADEMIA ITECH'
    ],
    specialtyLabel: 'Niveau d’Accréditation *',
    specialtyOptions: [
      'Administrateur National DFAT / ARMP',
      'Coordinateur Pédagogique National'
    ],
    roleTitleLabel: 'Fonction Administrative DFAT *',
    roleTitlePlaceholder: 'Directeur / Coordinateur DFAT',
    roleTitlePresets: [
      'Coordinateur National Formation & Certification DFAT',
      'Chef de Division Appuis Techniques DFAT'
    ],
    matriculeLabel: 'N° Matricule Administrateur DFAT *',
    matriculePlaceholder: 'DFAT-ADM-0412',
    secondaryIdLabel: 'N° Acte d’Habilitation DFAT *',
    secondaryIdPlaceholder: 'ACT-DFAT-2026-01',
    defaultSecondaryId: 'ACT-DFAT-2026-01'
  },
  super_admin: {
    label: '🔰 Super Administrateur',
    shortDesc: 'Gestion backend de tous les comptes & rôles',
    badgeText: 'Privilèges Super Admin chargés',
    institutionLabel: 'Structure de tutelle *',
    institutionPlaceholder: 'Administration centrale / Direction générale',
    institutionPresets: [
      'Administration centrale ARMP',
      'Direction Générale — Plateforme ACADEMIA ITECH'
    ],
    subCategoryLabel: 'Périmètre de gestion *',
    subCategoryOptions: [
      'Comptes, rôles & habilitations',
      'Paramétrage global de la plateforme',
      'Supervision pédagogique & contenus'
    ],
    specialtyLabel: 'Niveau d’accréditation *',
    specialtyOptions: [
      'Super Administrateur technique',
      'Super Administrateur délégué'
    ],
    roleTitleLabel: 'Fonction *',
    roleTitlePlaceholder: 'Super Administrateur / Directeur de plateforme',
    roleTitlePresets: [
      'Super Administrateur Plateforme ACADEMIA',
      'Directeur Systèmes & Comptes'
    ],
    matriculeLabel: 'N° Matricule Super Admin *',
    matriculePlaceholder: 'SUPA-001',
    secondaryIdLabel: 'N° Arrêté / Décision *',
    secondaryIdPlaceholder: 'ARR-SUPA-2026-01',
    defaultSecondaryId: 'ARR-SUPA-2026-01'
  },
  ac_agent: {
    label: '🏛️ Autorité Contractante — Autre Agent',
    shortDesc: 'DAF • Contrôle Interne • Technique',
    badgeText: 'Champs Cadre & Agent de l’Autorité Contractante chargés',
    institutionLabel: 'Ministère, Gouvernorat ou Autorité Contractante *',
    institutionPlaceholder: 'ex: Ministère des Infrastructures et Travaux Publics',
    institutionPresets: [
      'Ministère des Infrastructures et Travaux Publics (MITP)',
      'Ministère de la Santé Publique, Hygiène et Prévoyance',
      'Ministère des Finances — DAF',
      'Gouvernorat Provincial de Kinshasa',
      'Office des Routes (Direction Générale)'
    ],
    subCategoryLabel: "Direction ou Service d'Affectation *",
    subCategoryOptions: [
      'Direction Administrative et Financière (DAF)',
      'Direction des Études et Planification (DEP)',
      'Direction de l’Audit Interne & Contrôle de Gestion',
      'Division Technique & Suivi des Chantiers',
      'Secrétariat Général'
    ],
    specialtyLabel: "Fonction & Responsabilité au sein de l'AC *",
    specialtyOptions: [
      'Cadre DAF & Ordonnancement des Dépenses',
      'Auditeur Interne des Procédures de Marchés',
      'Ingénieur Suivi Technique & Réception des Ouvrages',
      'Gestionnaire des Crédits Budgétaires & PPM'
    ],
    roleTitleLabel: "Titre du Poste au sein de l'Autorité Contractante *",
    roleTitlePlaceholder: 'ex: Cadre DAF & Chargé de l’Ordonnancement',
    roleTitlePresets: [
      'Cadre DAF & Chargé de l’Ordonnancement',
      'Auditeur Interne de l’Autorité Contractante',
      'Chef de Bureau Suivi de l’Exécution Budgétaire',
      'Ingénieur Chef de Projet Infrastructures'
    ],
    matriculeLabel: "N° Matricule Agent de l'État / AC *",
    matriculePlaceholder: 'AC-RDC-2026-0412',
    secondaryIdLabel: "Réf. Décision d'Affectation / Commission d'Emploi *",
    secondaryIdPlaceholder: 'DEC-AFF-AC-2026-08',
    defaultSecondaryId: 'DEC-AFF-AC-2026-08'
  },
  grande_entreprise: {
    label: '🏢 Opérateur Économique — Grande Entreprise',
    shortDesc: 'Grands Travaux • BTP • Industrie',
    badgeText: 'Champs Opérateur Économique — Grande Entreprise chargés',
    institutionLabel: 'Dénomination Sociale de la Grande Entreprise *',
    institutionPlaceholder: 'ex: GROUPE KIN-INFRASTRUCTURES SA',
    institutionPresets: [
      'GROUPE KIN-INFRASTRUCTURES SA',
      'CONGO BÂTIMENT & TRAVAUX PUBLICS SA',
      'KATANGA MINING LOGISTICS SA',
      'AFRIQUE ÉNERGIE & INFRASTRUCTURES SA'
    ],
    subCategoryLabel: "Secteur d'Activité Majeur *",
    subCategoryOptions: [
      'BTP, Grands Ouvrages d’Art & Génie Civil',
      'Énergie, Électrification & Barrages Hydroélectriques',
      'Infrastructures Ferroviaires & Portuaires',
      'Télécoms, Réseaux Nationaux & Numérique',
      'Mines, Métallurgie & Installations Industrielles'
    ],
    specialtyLabel: "Forme Juridique & Statut National/International *",
    specialtyOptions: [
      'Société Anonyme (SA) de Droit Congolais',
      'Société par Actions Simplifiée (SAS)',
      'Consortium International & Succursale RDC',
      'Groupement Momentané d’Entreprises International (GME)'
    ],
    roleTitleLabel: 'Fonction du Dirigeant ou Représentant *',
    roleTitlePlaceholder: 'ex: Directeur des Grands Marchés Publics & Offres',
    roleTitlePresets: [
      'Directeur des Grands Marchés Publics & Offres',
      'Directeur Général Adjoint — Opérations RDC',
      'Responsable Département Appels d’Offres Internationaux',
      'Directeur Juridique & Contrats Publics'
    ],
    matriculeLabel: 'N° RCCM Grande Entreprise *',
    matriculePlaceholder: 'CD/KIN/RCCM/26-B-8800',
    secondaryIdLabel: 'N° Identification Nationale (ID Nat) & NIF *',
    secondaryIdPlaceholder: 'IDNAT-01-G4500-NIF-2601',
    defaultSecondaryId: 'IDNAT-01-G4500-NIF-2601'
  },
  societe_civile: {
    label: '⚖️ Société Civile & Observateur Citoyen',
    shortDesc: 'Observatoire • Transparence • Contrôle Citoyen',
    badgeText: 'Champs Société Civile & Observateur Citoyen chargés',
    institutionLabel: 'Nom de l’Organisation, Observatoire ou ONG *',
    institutionPlaceholder: 'ex: Observatoire Citoyen des Marchés Publics (OCP RDC)',
    institutionPresets: [
      'Observatoire Citoyen des Marchés Publics (OCP RDC)',
      'Réseau pour la Transparence et la Redevabilité (RTR RDC)',
      'Coalition Citoyenne Contre la Corruption',
      'Ligue Congolaise pour l’Éthique et la Commande Publique'
    ],
    subCategoryLabel: "Périmètre de Veille & d'Observation Citoyenne *",
    subCategoryOptions: [
      'Veille Citoyenne sur les Appels d’Offres Publics',
      'Observation Indépendante des Séances d’Ouverture des Plis',
      'Suivi Citoyen de l’Exécution Physique des Chantiers',
      'Plaidoyer pour la Transparence & l’Accès à l’Information',
      'Contrôle Budgétaire & Dénonciation des Pratiques Anti-Concurrentielles'
    ],
    specialtyLabel: "Statut Juridique & Agrément de l'Organisation *",
    specialtyOptions: [
      'Association Sans But Lucratif (ASBL) agréée en RDC',
      'Observatoire Indépendant des Finances & Marchés Publics',
      'ONG Nationale de Défense des Droits & Transparence',
      'Plateforme de la Société Civile Reconnue'
    ],
    roleTitleLabel: 'Qualité de l’Observateur Citoyen *',
    roleTitlePlaceholder: 'ex: Observateur Citoyen & Responsable de Veille',
    roleTitlePresets: [
      'Observateur Citoyen & Responsable de Veille',
      'Coordinateur National de l’Observatoire',
      'Chargé d’Enquêtes Citoyennes & Plaidoyer',
      'Juriste Observateur de la Commande Publique'
    ],
    matriculeLabel: 'N° Enregistrement / F92 Ministère Justice *',
    matriculePlaceholder: 'JUST-ASBL-2026-012',
    secondaryIdLabel: 'N° Carte d’Observateur Citoyen / Accréditation *',
    secondaryIdPlaceholder: 'OCP-OBS-RDC-2026-042',
    defaultSecondaryId: 'OCP-OBS-RDC-2026-042'
  },
  independant: {
    label: '👤 Indépendant (Consultant & Expert)',
    shortDesc: 'Consultant individuel, Expert en passation',
    badgeText: 'Champs Consultant & Praticien Indépendant chargés',
    institutionLabel: 'Cabinet Indépendant, Raison Commerciale ou Nom Propre *',
    institutionPlaceholder: 'ex: Cabinet Indépendant de Conseil & Audit RDC',
    institutionPresets: [
      'Cabinet Indépendant de Conseil & Audit RDC',
      'Consultant Individuel Indépendant (RDC)',
      'Cabinet Spécialisé en Passation des Marchés',
      'Bureau d’Études & Expertise Juridique'
    ],
    subCategoryLabel: "Domaine de Compétence & d'Appui *",
    subCategoryOptions: [
      'Montage et Relecture des DAO & TDR',
      'Audit Indépendant & Revue des Procédures',
      'Assistance Technique aux Autorités Contractantes',
      'Formations Pratiques & Préparation des Soumissionnaires',
      'Assistance dans les Recours Contentieux (CRD/ARMP)'
    ],
    specialtyLabel: "Niveau de Qualification & Ancienneté *",
    specialtyOptions: [
      'Expert Senior Indépendant (+10 ans d’expérience)',
      'Consultant Confirmé en Passation des Marchés (5 à 10 ans)',
      'Ingénieur-Conseil Indépendant',
      'Juriste d’Affaires & Spécialiste Commande Publique'
    ],
    roleTitleLabel: 'Titre Professionnel *',
    roleTitlePlaceholder: 'ex: Consultant Indépendant en Marchés Publics',
    roleTitlePresets: [
      'Consultant Indépendant en Marchés Publics',
      'Auditeur Indépendant en Commande Publique',
      'Ingénieur-Conseil Indépendant',
      'Expert Juridique en Contentieux des Marchés'
    ],
    matriculeLabel: 'N° Identifiant Consultant Indépendant *',
    matriculePlaceholder: 'IND-RDC-2026-0412',
    secondaryIdLabel: 'N° NIF, Ordre Professionnel ou Registre National *',
    secondaryIdPlaceholder: 'NIF-IND-2026-881',
    defaultSecondaryId: 'NIF-IND-2026-881'
  }
};

export interface LoginProfileSpec {
  role: UserRole;
  category: 'Autorité Contractante' | 'Opérateurs Économiques' | 'Sociétés Civiles' | 'Indépendant' | 'Administration & Supervision';
  categoryKey: 'ac' | 'oe' | 'sc' | 'ind' | 'admin';
  categoryIcon: string;
  title: string;
  subLabel: string;
  shortTag: string;
  demoName: string;
  demoInstitution: string;
  demoEmail: string;
  demoPass: string;
  matricule: string;
  description: string;
  privileges: string[];
}

export const LOGIN_PROFILES_CATALOG: LoginProfileSpec[] = [
  {
    role: 'cgpmp_member',
    category: 'Autorité Contractante',
    categoryKey: 'ac',
    categoryIcon: '🏛️',
    title: 'Membre de la cellule',
    subLabel: 'CGPMP • Secrétaire Permanent & CPM',
    shortTag: 'CGPMP Cellule',
    demoName: 'Ing. Jean-Paul Mukendi',
    demoInstitution: 'Ministère des Infrastructures et Travaux Publics (MITP)',
    demoEmail: 'jp.mukendi@infrastructures.gouv.cd',
    demoPass: 'CGPMP-2026-BUD1',
    matricule: 'CGPMP-MITP-2024-042',
    description: 'Gestion des DAO, séances d’ouverture, analyse des offres et suivi des dossiers de passation de l’Autorité Contractante.',
    privileges: ['Validation des dossiers CGPMP', 'Soumission de requêtes DFAT', 'Suivi des avis ANO DGCMP']
  },
  {
    role: 'ac_agent',
    category: 'Autorité Contractante',
    categoryKey: 'ac',
    categoryIcon: '🏛️',
    title: 'Autre agent',
    subLabel: 'DAF • Contrôle Interne • Technique',
    shortTag: 'Agent AC',
    demoName: 'Alain Kalombo Mwanza',
    demoInstitution: 'Ministère des Infrastructures et Travaux Publics (MITP)',
    demoEmail: 'alain.kalombo@infrastructures.gouv.cd',
    demoPass: 'AC-MITP-2026-PASS',
    matricule: 'AC-MITP-2024-019',
    description: 'Cadre financier, ordonnancement, gestionnaire des crédits ou ingénieur de suivi au sein de l’Autorité Contractante.',
    privileges: ['Consultation du PPM', 'Suivi de l’exécution financière', 'Accès aux formations acheteurs']
  },
  {
    role: 'pme',
    category: 'Opérateurs Économiques',
    categoryKey: 'oe',
    categoryIcon: '🏢',
    title: 'PME',
    subLabel: 'Loi 17/001 • ARSP • Contenu Local 51%',
    shortTag: 'PME Soumissionnaire',
    demoName: 'Mme Grâce Mbuyi Tshiamala',
    demoInstitution: 'CONGO BÂTI-TECH SARL (PME Agréée ARSP / COPEMECO)',
    demoEmail: 'grace.mbuyi@congobatitech-pme.cd',
    demoPass: 'PME-ARSP-2026-PASS',
    matricule: 'PME-ARSP-2026-412',
    description: 'Entreprise soumissionnaire éligible à la sous-traitance, à la marge de préférence nationale et au contenu local.',
    privileges: ['Contenu Local & ARSP 51%', 'Simulateurs de cautions & offres', 'Formations soumissionnaires']
  },
  {
    role: 'grande_entreprise',
    category: 'Opérateurs Économiques',
    categoryKey: 'oe',
    categoryIcon: '🏢',
    title: 'Grandes entreprises',
    subLabel: 'BTP • Grands Travaux • Industrie',
    shortTag: 'Grande Entreprise',
    demoName: 'Patrick Tshilombo Kabengele',
    demoInstitution: 'GROUPE KIN-INFRASTRUCTURES SA',
    demoEmail: 'p.tshilombo@kin-infrastructures.cd',
    demoPass: 'GE-RDC-2026-PASS',
    matricule: 'GE-RDC-2026-088',
    description: 'Société majeure titulaire de marchés d’envergure, marchés internationaux, génie civil et consortiums.',
    privileges: ['Grands appels d’offres ouverts', 'Conformité DAO & garanties', 'Recours & arbitrage CRD']
  },
  {
    role: 'societe_civile',
    category: 'Sociétés Civiles',
    categoryKey: 'sc',
    categoryIcon: '⚖️',
    title: 'Sociétés civiles',
    subLabel: 'Observatoire • Veille • Transparence',
    shortTag: 'Société Civile',
    demoName: 'Me Espérance Kabedi Mulumba',
    demoInstitution: 'Observatoire Citoyen des Marchés Publics (OCP RDC)',
    demoEmail: 'esperance.kabedi@ocp-rdc.org',
    demoPass: 'SOC-CIV-2026-PASS',
    matricule: 'SOC-CIV-2026-012',
    description: 'Veille citoyenne indépendante, observation publique des séances d’ouverture et redevabilité de la commande publique.',
    privileges: ['Observatoire citoyen', 'Suivi de la transparence des avis', 'Formations intégrité & éthique']
  },
  {
    role: 'independant',
    category: 'Indépendant',
    categoryKey: 'ind',
    categoryIcon: '👤',
    title: 'Indépendant',
    subLabel: 'Consultant & Expert en Marchés Publics',
    shortTag: 'Expert Indépendant',
    demoName: 'Dieudonné Mwamba',
    demoInstitution: 'Cabinet Indépendant de Conseil & Audit RDC',
    demoEmail: 'dmwamba.consulting@gmail.com',
    demoPass: 'IND-RDC-2026-PASS',
    matricule: 'IND-RDC-2026-881',
    description: 'Consultant individuel, auditeur indépendant ou expert en passation des marchés intervenant en appui technique.',
    privileges: ['Prestations intellectuelles (TDR)', 'Certification d’expertise ARMP', 'Études de cas & jurisprudence']
  },
  {
    role: 'super_admin',
    category: 'Administration & Supervision',
    categoryKey: 'admin',
    categoryIcon: '🔰',
    title: 'Super Administrateur',
    subLabel: 'Backend • Comptes, Rôles & Paramétrage global',
    shortTag: 'Super Admin',
    demoName: 'Dieudonné KASONGO',
    demoInstitution: 'Administration centrale ARMP',
    demoEmail: 'superadmin@academia.cd',
    demoPass: 'SUPA-2026-ROOT',
    matricule: 'SUPA-001',
    description: 'Compte de supervision qui gère tout en backend : création et rôles de tous les comptes, activation des tests de niveau, paramétrage de la chaîne vocale et observatoire décisionnel.',
    privileges: ['Création & rôles de tous les comptes', 'Activation des tests de niveau', 'Supervision backend & dashboard']
  }
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  canClose?: boolean;
  allProfiles?: Record<string, UserProfile>;
  onLoginSuccess?: (profile: UserProfile) => void;
  onDemoLogin?: (role: UserRole) => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register' | 'forgot_password';
  /** Distinction des entrées : formulaire de création de compte vs demande CGPMP */
  initialRegisterEntry?: 'creation' | 'demande';
  pendingCourseTitle?: string | null;
  targetCourseTitle?: string | null;
  onShowToast?: (msg: string) => void;
  cgpmpAccountRequests?: CgpmpAccountCreationRequest[];
  onUpdateCgpmpAccountRequests?: (list: CgpmpAccountCreationRequest[]) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canClose = false,
  allProfiles,
  onLoginSuccess,
  onDemoLogin,
  initialRole = 'cgpmp_member',
  initialMode = 'login',
  initialRegisterEntry = 'creation',
  pendingCourseTitle,
  targetCourseTitle,
  onShowToast,
  cgpmpAccountRequests: externalCgpmpReqs,
  onUpdateCgpmpAccountRequests
}) => {
  const courseTitle = pendingCourseTitle || targetCourseTitle;
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'armp_admin'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [selectedLoginRole, setSelectedLoginRole] = useState<UserRole>(initialRole || 'cgpmp_member');
  const [showOtherLoginRoles, setShowOtherLoginRoles] = useState(false);
  const [showDemoExpandable, setShowDemoExpandable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Registration steps (1 to 5 for CGPMP, 1 to 4 for other profiles)
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Google Auth State
  const [googleAuthUid, setGoogleAuthUid] = useState<string | null>(null);
  const [googlePhotoUrl, setGooglePhotoUrl] = useState<string | null>(null);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [existingGoogleAccount, setExistingGoogleAccount] = useState<UserProfile | null>(null);

  // Civil Identity Fields (Step 2 — Separated from Step 1)
  const [civiliteInput, setCiviliteInput] = useState<string>('M.');
  const [nomInput, setNomInput] = useState<string>('');
  const [postnomInput, setPostnomInput] = useState<string>('');
  const [prenomInput, setPrenomInput] = useState<string>('');
  const [sexeInput, setSexeInput] = useState<'M' | 'F'>('M');
  const [dateNaissanceInput, setDateNaissanceInput] = useState<string>('1984-06-15');
  const [lieuNaissanceInput, setLieuNaissanceInput] = useState<string>('Kinshasa');
  const [nationaliteInput, setNationaliteInput] = useState<string>('Congolaise (RDC)');
  const [etatCivilInput, setEtatCivilInput] = useState<string>('Marié(e)');
  const [pieceIdentiteInput, setPieceIdentiteInput] = useState<string>('ONIP-RDC-24389104');
  const [adressePhysiqueInput, setAdressePhysiqueInput] = useState<string>('Boulevard du 30 Juin, Commune de la Gombe, Kinshasa');

  // Dynamic Profile Fields
  const initialConfig = ROLE_CREATION_CONFIG[initialRole] || ROLE_CREATION_CONFIG.cgpmp_member;
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('+243 ');
  const [institutionInput, setInstitutionInput] = useState(initialConfig.institutionPresets[0] || '');
  const [roleTitleInput, setRoleTitleInput] = useState(initialConfig.roleTitlePresets[0] || '');
  const [subCategoryInput, setSubCategoryInput] = useState(initialConfig.subCategoryOptions[0] || '');
  const [specialtyInput, setSpecialtyInput] = useState(initialConfig.specialtyOptions[0] || '');
  const [provinceInput, setProvinceInput] = useState<string>(DRC_PROVINCES[0]);
  const [matriculeInput, setMatriculeInput] = useState(
    `${getDefaultMatriculePrefixByRole(initialRole)}0412`
  );
  const [secondaryIdInput, setSecondaryIdInput] = useState(initialConfig.defaultSecondaryId);
  const [enable2FAOnRegister, setEnable2FAOnRegister] = useState(true);

  // ---------- 2FA : étape OTP après validation du mot de passe ----------
  const [twoFAProfile, setTwoFAProfile] = useState<UserProfile | null>(null);
  const [otp2FA, setOtp2FA] = useState('');
  const [otp2FAHint, setOtp2FAHint] = useState<string | null>(null);
  const [otp2FAError, setOtp2FAError] = useState<string | null>(null);
  const [isSending2FA, setIsSending2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // Réinitialisation de l'étape OTP à la fermeture du modal
  useEffect(() => {
    if (!isOpen) {
      setTwoFAProfile(null);
      setOtp2FA('');
      setOtp2FAHint(null);
      setOtp2FAError(null);
    }
  }, [isOpen]);
  const [acceptEthicsCharter, setAcceptEthicsCharter] = useState(true);

  // CGPMP Specific Conditions State:
  // 1) Seul le Secrétaire Permanent peut créer le compte CGPMP
  const [cgpmpApplicantCapacity, setCgpmpApplicantCapacity] = useState<'secretaire_permanent' | 'membre_ordinaire'>('secretaire_permanent');
  // 2) Document portant création de la cellule CGPMP
  const [creationDocType, setCreationDocType] = useState<CgpmpCreationDocumentInfo['documentType']>('Arrêté Ministériel');
  const [creationDocRef, setCreationDocRef] = useState('ARR-CAB-MIN/BUDGET/2026/018');
  const [creationDocDate, setCreationDocDate] = useState('2026-02-15');
  const [creationDocSignatory, setCreationDocSignatory] = useState('Ministre de Tutelle / Autorité Contractante');
  const [creationDocFileName, setCreationDocFileName] = useState('');
  const [creationDocFileSize, setCreationDocFileSize] = useState('');
  const [creationDocMimeType, setCreationDocMimeType] = useState('application/pdf');
  const [creationDocDataUrl, setCreationDocDataUrl] = useState<string | undefined>(undefined);
  // 3) Liste des membres CGPMP (Noms complets + Adresses email)
  const [cgpmpMembers, setCgpmpMembers] = useState<CgpmpCellMember[]>([
    {
      id: 'MEM-INIT-1',
      fullName: 'Ir. Célestin Kabuya Mutombo',
      email: 'c.kabuya@infrastructures.gouv.cd',
      functionInCell: 'Président de la Commission de Passation des Marchés (CPM)'
    },
    {
      id: 'MEM-INIT-2',
      fullName: 'Me Mireille Ngalula Tshimanga',
      email: 'm.ngalula@infrastructures.gouv.cd',
      functionInCell: 'Expert en Passation des Marchés & Montage DAO'
    }
  ]);
  // 4) Submitted CGPMP Request awaiting ARMP validation
  const [submittedCgpmpRequest, setSubmittedCgpmpRequest] = useState<CgpmpAccountCreationRequest | null>(null);
  const [localCgpmpRequests, setLocalCgpmpRequests] = useState<CgpmpAccountCreationRequest[]>(() =>
    getLocalCgpmpAccountRequests()
  );
  const [processingArmpReqId, setProcessingArmpReqId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCgpmpRequests = externalCgpmpReqs || localCgpmpRequests;
  const activeRoleConfig = ROLE_CREATION_CONFIG[selectedRole] || ROLE_CREATION_CONFIG.cgpmp_member;
  const isCgpmp = selectedRole === 'cgpmp_member';

  const updateCgpmpRequestsList = (next: CgpmpAccountCreationRequest[]) => {
    setLocalCgpmpRequests(next);
    onUpdateCgpmpAccountRequests?.(next);
  };

  const applyDynamicFieldsForRole = (role: UserRole, existingProf?: UserProfile | null) => {
    const cfg = ROLE_CREATION_CONFIG[role] || ROLE_CREATION_CONFIG.cgpmp_member;
    setSelectedRole(role);

    const defaultPrefix = getDefaultMatriculePrefixByRole(role);
    const currentSuffix = matriculeInput.split('-').pop() || '0412';
    const nextMatricule = existingProf?.matricule
      ? formatMatriculeOrRccmMask(existingProf.matricule)
      : formatMatriculeOrRccmMask(`${defaultPrefix}${currentSuffix}`);
    setMatriculeInput(nextMatricule);

    setInstitutionInput(
      existingProf?.institution
        ? filterInstitutionMask(existingProf.institution)
        : cfg.institutionPresets[0] || ''
    );
    setRoleTitleInput(
      role === 'cgpmp_member'
        ? 'Secrétaire Permanent de la CGPMP'
        : existingProf?.roleTitle
        ? filterRoleTitleMask(existingProf.roleTitle)
        : cfg.roleTitlePresets[0] || ''
    );
    setSubCategoryInput(
      existingProf?.subCategory && cfg.subCategoryOptions.includes(existingProf.subCategory)
        ? existingProf.subCategory
        : cfg.subCategoryOptions[0] || ''
    );
    setSpecialtyInput(
      existingProf?.specialty && cfg.specialtyOptions.includes(existingProf.specialty)
        ? existingProf.specialty
        : cfg.specialtyOptions[0] || ''
    );
    setSecondaryIdInput(
      existingProf?.secondaryIdNumber
        ? formatMatriculeOrRccmMask(existingProf.secondaryIdNumber)
        : cfg.defaultSecondaryId
    );
    if (existingProf?.phone) {
      setPhoneInput(formatDRCPhoneMask(existingProf.phone));
    }
  };

  const activeLoginSpec =
    LOGIN_PROFILES_CATALOG.find((p) => p.role === selectedLoginRole) ||
    LOGIN_PROFILES_CATALOG[0];

  const handleSelectLoginProfile = (spec: LoginProfileSpec) => {
    setSelectedLoginRole(spec.role);
    setSelectedRole(spec.role);
    setEmailInput(spec.demoEmail);
    setPasswordInput(spec.demoPass);
    setStepError(null);
  };

  const handleDirectLoginForRole = (role: UserRole) => {
    const targetProf = (allProfiles && allProfiles[role]) || DEMO_PROFILES[role];
    if (targetProf) {
      onShowToast?.(`Connexion réussie : Bienvenue ${targetProf.name} (${targetProf.roleTitle}).`);
      onLoginSuccess?.(targetProf);
      onClose();
    } else if (onDemoLogin) {
      onDemoLogin(role);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRegisterStep(1);
      setStepError(null);
      setResetSuccessMessage(null);
      setExistingGoogleAccount(null);
      setSubmittedCgpmpRequest(null);
      setLocalCgpmpRequests(getLocalCgpmpAccountRequests());
      applyDynamicFieldsForRole(initialRole);
      // Entrées distinctes : « Créer Compte » n'ouvre jamais le parcours CGPMP,
      // « Demande CGPMP » force le profil CGPMP (validation ARMP).
      if (initialMode === 'register') {
        if (initialRegisterEntry === 'demande') {
          applyDynamicFieldsForRole('cgpmp_member');
        } else if (initialRole === 'cgpmp_member') {
          applyDynamicFieldsForRole('ac_agent');
        }
      }

      const matchedLogin = LOGIN_PROFILES_CATALOG.find((p) => p.role === initialRole) || LOGIN_PROFILES_CATALOG[0];
      setSelectedLoginRole(matchedLogin.role);
      if (initialMode === 'login') {
        setEmailInput(matchedLogin.demoEmail);
        setPasswordInput(matchedLogin.demoPass);
      }
    }
  }, [isOpen, initialMode, initialRole]);

  const handleSelectRoleInRegistration = (role: UserRole) => {
    setSubmittedCgpmpRequest(null);
    applyDynamicFieldsForRole(role, existingGoogleAccount?.role === role ? existingGoogleAccount : null);
  };

  if (!isOpen) return null;

  const getFriendlyAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.startsWith('CGPMP_PENDING_ARMP:')) {
      return raw.replace('CGPMP_PENDING_ARMP:', '');
    }
    if (raw.startsWith('CGPMP_REJECTED_ARMP:')) {
      return raw.replace('CGPMP_REJECTED_ARMP:', '');
    }
    const message = raw.toLowerCase();
    if (message.includes('auth/unauthorized-domain') || message.includes('is not authorized')) {
      return 'Domaine non encore autorisé côté Firebase Console. Poursuivez avec la vérification Google ci-dessous.';
    }
    if (message.includes('auth/popup-blocked') || message.includes('popup-closed-by-user')) {
      return 'Popup Google fermée ou bloquée. Utilisez la vérification directe par adresse email ci-dessous.';
    }
    if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
      return 'Identifiants ou mot de passe invalides. Si vous êtes membre CGPMP, utilisez le mot de passe reçu par mail après validation ARMP.';
    }
    if (message.includes('auth/user-not-found')) {
      return 'Aucun compte actif trouvé pour cet email.';
    }
    return `Information d'authentification : ${raw.slice(0, 240)}`;
  };

  // File upload handler for CGPMP Creation Document
  const handleCreationDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreationDocFileName(file.name);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    setCreationDocFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(2)} Mo` : `${sizeKb} Ko`);
    setCreationDocMimeType(file.type || 'application/pdf');
    setStepError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length < 150000) {
        setCreationDocDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    onShowToast?.(`Document portant création de la CGPMP joint : ${file.name}`);
  };

  const handleAttachSpecimenDocument = () => {
    const cleanInst = institutionInput.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25) || 'Ministere';
    setCreationDocFileName(`Arrete_Creation_Cellule_CGPMP_${cleanInst}_2026.pdf`);
    setCreationDocFileSize('1.38 Mo');
    setCreationDocMimeType('application/pdf');
    if (!creationDocRef.trim()) {
      setCreationDocRef('ARR-CAB-MIN/CGPMP/2026/018');
    }
    setStepError(null);
    onShowToast?.('Spécimen officiel d’Arrêté portant création de la CGPMP attaché avec succès.');
  };

  // Helper to sync composed full name whenever nom, postnom, prenom or civilite changes
  const composeOfficialFullName = (
    civ = civiliteInput,
    prenom = prenomInput,
    nom = nomInput,
    postnom = postnomInput
  ) => {
    const cleanNom = filterPersonNameMask(nom).trim().toUpperCase();
    const cleanPost = filterPersonNameMask(postnom).trim().toUpperCase();
    const cleanPre = filterPersonNameMask(prenom).trim();
    if (!cleanNom && !cleanPost && !cleanPre) return nameInput.trim();
    return `${civ ? `${civ} ` : ''}${[cleanPre, cleanNom, cleanPost].filter(Boolean).join(' ')}`.trim();
  };

  // Step 1/2 Google Verification
  const handleGoogleRegistrationStep1 = async () => {
    setStepError(null);
    if (isCgpmp && cgpmpApplicantCapacity !== 'secretaire_permanent') {
      setStepError(
        'Accès refusé : Seul le Secrétaire Permanent de la CGPMP est habilité à créer le compte de la cellule et à enregistrer la liste des membres.'
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const googleRes = await firebaseGoogleAuthenticate(allProfiles);
      setGoogleAuthUid(googleRes.uid);
      setEmailInput(filterEmailMask(googleRes.email));
      const fullDisplay = filterPersonNameMask(googleRes.displayName || 'Fidèle Kabasele Lukoji');
      setNameInput(fullDisplay);
      const parts = fullDisplay.split(' ').filter(Boolean);
      if (parts.length >= 3) {
        setPrenomInput(parts[0]);
        setNomInput(parts[1].toUpperCase());
        setPostnomInput(parts.slice(2).join(' ').toUpperCase());
      } else if (parts.length === 2) {
        setPrenomInput(parts[0]);
        setNomInput(parts[1].toUpperCase());
      } else if (parts.length === 1) {
        setNomInput(parts[0].toUpperCase());
      }
      setGooglePhotoUrl(googleRes.photoURL);
      setIsGoogleVerified(true);

      if (googleRes.existingProfile) {
        const ep = googleRes.existingProfile;
        setExistingGoogleAccount(ep);
        applyDynamicFieldsForRole(ep.role || selectedRole, ep);
        onShowToast?.(`Compte Google déjà enregistré détecté : ${ep.name} (${ep.institution}).`);
        return;
      }

      setExistingGoogleAccount(null);
      applyDynamicFieldsForRole(selectedRole, null);
      setRegisterStep(2);
      onShowToast?.(`Identité Google pré-remplie (${googleRes.email}). Complétez vos informations civiles à l'Étape 2.`);
    } catch (err) {
      setStepError(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCivilIdentityStep2 = async () => {
    setStepError(null);
    if (isCgpmp && cgpmpApplicantCapacity !== 'secretaire_permanent') {
      setStepError(
        'Seul le Secrétaire Permanent de la CGPMP peut initier la création du compte de la Cellule CGPMP.'
      );
      return;
    }
    const cleanNom = filterPersonNameMask(nomInput).trim().toUpperCase();
    const cleanPostnom = filterPersonNameMask(postnomInput).trim().toUpperCase();
    const cleanPrenom = filterPersonNameMask(prenomInput).trim();
    const cleanMail = filterEmailMask(emailInput).trim().toLowerCase();

    if (cleanNom.length < 2) {
      setStepError('Veuillez renseigner votre Nom de famille (au moins 2 lettres).');
      return;
    }
    if (cleanPostnom.length < 2) {
      setStepError('Veuillez renseigner votre Post-nom (au moins 2 lettres).');
      return;
    }
    if (cleanPrenom.length < 2) {
      setStepError('Veuillez renseigner votre Prénom (au moins 2 lettres).');
      return;
    }
    if (!cleanMail || !cleanMail.includes('@') || !cleanMail.includes('.')) {
      setStepError('Veuillez saisir une adresse email officielle valide.');
      return;
    }

    const fullComposed = composeOfficialFullName(civiliteInput, cleanPrenom, cleanNom, cleanPostnom);
    setNameInput(fullComposed);
    setNomInput(cleanNom);
    setPostnomInput(cleanPostnom);
    setPrenomInput(cleanPrenom);
    setEmailInput(cleanMail);

    setIsSubmitting(true);
    try {
      const check = await checkExistingRegisteredUser({
        email: cleanMail,
        knownProfiles: allProfiles
      });

      if (check.exists && check.profile) {
        const ep = check.profile;
        setExistingGoogleAccount(ep);
        setGoogleAuthUid(ep.id || `GOOGLE-USR-${Date.now().toString().slice(-6)}`);
        setGooglePhotoUrl(ep.avatarUrl || null);
        setIsGoogleVerified(true);
        applyDynamicFieldsForRole(ep.role || selectedRole, ep);
        onShowToast?.(`Utilisateur déjà enregistré détecté : ${ep.name} (${ep.institution}).`);
        return;
      }

      setExistingGoogleAccount(null);
      setGoogleAuthUid(`GOOGLE-USR-${Date.now().toString().slice(-6)}`);
      setIsGoogleVerified(true);
      applyDynamicFieldsForRole(selectedRole, null);
      setRegisterStep(3);
      onShowToast?.(`Identité civile validée (${fullComposed}). Passage à l'Étape 3.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setStepError(null);
    if (registerStep === 1) {
      if (isCgpmp && cgpmpApplicantCapacity !== 'secretaire_permanent') {
        setStepError('Seul le Secrétaire Permanent peut créer le compte CGPMP.');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      void handleVerifyCivilIdentityStep2();
    } else if (registerStep === 3) {
      const cleanInst = filterInstitutionMask(institutionInput).trim();
      if (cleanInst.length < 3) {
        setStepError('Veuillez renseigner l’Autorité Contractante ou Organisation.');
        return;
      }
      // Mandatory check for CGPMP: Document portant création de la cellule
      if (isCgpmp) {
        if (!creationDocRef.trim() || creationDocRef.trim().length < 4) {
          setStepError(
            'Condition CGPMP : Veuillez indiquer la référence officielle du document portant création de la cellule.'
          );
          return;
        }
        if (!creationDocFileName) {
          setStepError(
            'Condition CGPMP obligatoire : Vous devez joindre le document portant création de la cellule CGPMP (ou cliquer sur « Charger un spécimen d’Arrêté CGPMP ») pour passer à la liste des membres.'
          );
          return;
        }
        setSecondaryIdInput(formatMatriculeOrRccmMask(creationDocRef));
      }
      setRegisterStep(4);
    } else if (registerStep === 4 && isCgpmp) {
      if (cgpmpMembers.length === 0) {
        setStepError(
          'Veuillez ajouter au moins un membre de la Cellule CGPMP (Nom, Post-nom, Prénom et adresse email) dans la liste.'
        );
        return;
      }
      setRegisterStep(5);
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (registerStep > 1) {
      setRegisterStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Final Submit Handler
  // ---------- 2FA : envoi / vérification du code ----------
  const beginTwoFA = async (profile: UserProfile) => {
    setTwoFAProfile(profile);
    setOtp2FA('');
    setOtp2FAError(null);
    setIsSending2FA(true);
    try {
      const res = await fetch('/api/2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtp2FAError(data.error || "Envoi du code impossible.");
        return;
      }
      setOtp2FAHint(
        data.devCode
          ? `Mode sans provider mail — code de test : ${data.devCode}`
          : `Code envoyé à ${profile.email} (valable 10 minutes).`
      );
      onShowToast?.('🔐 Code de vérification 2FA envoyé.');
    } catch {
      setOtp2FAError('Serveur injoignable — réessayez.');
    } finally {
      setIsSending2FA(false);
    }
  };

  const confirmTwoFA = async () => {
    if (!twoFAProfile) return;
    setIsVerifying2FA(true);
    setOtp2FAError(null);
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: twoFAProfile.email, code: otp2FA }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtp2FAError(data.error || 'Code incorrect.');
        return;
      }
      onShowToast?.(`Double authentification validée — Bienvenue ${twoFAProfile.name}.`);
      const prof = twoFAProfile;
      setTwoFAProfile(null);
      setOtp2FA('');
      onLoginSuccess?.(prof);
      onClose();
    } catch {
      setOtp2FAError('Serveur injoignable — réessayez.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (mode === 'forgot_password') {
      const cleanMail = filterEmailMask(emailInput);
      if (!cleanMail || !cleanMail.includes('@')) {
        setStepError('Veuillez renseigner votre adresse email.');
        return;
      }
      setIsSubmitting(true);
      try {
        await firebaseResetPassword(cleanMail);
        setResetSuccessMessage(`Un lien de réinitialisation a été envoyé à ${cleanMail}.`);
        onShowToast?.('Email de réinitialisation envoyé.');
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      const finalStep = isCgpmp ? 5 : 4;
      if (registerStep !== finalStep) {
        handleNextStep();
        return;
      }

      if (!isValidDRCPhone(phoneInput)) {
        setStepError('Numéro de téléphone RDC invalide. Format exigé : +243 suivi de 9 chiffres.');
        return;
      }
      const cleanMatricule = formatMatriculeOrRccmMask(matriculeInput);
      if (cleanMatricule.length < 6) {
        setStepError('Veuillez saisir un numéro de matricule / identifiant valide (min. 6 caractères).');
        return;
      }
      if (!acceptEthicsCharter) {
        setStepError('Vous devez accepter la Charte d’intégrité de la commande publique (Loi n° 10/010).');
        return;
      }

      const finalComposedName = composeOfficialFullName();

      // SPECIAL CGPMP WORKFLOW: Submit Request for ARMP Administration Validation!
      if (isCgpmp) {
        if (!creationDocFileName) {
          setStepError('Le document portant création de la cellule CGPMP est obligatoire.');
          return;
        }
        if (cgpmpMembers.length === 0) {
          setStepError('La liste des membres de la CGPMP ne peut pas être vide.');
          return;
        }

        setIsSubmitting(true);
        try {
          const newCgpmpReq: CgpmpAccountCreationRequest = {
            id: `CGPMP-ACC-2026-${Math.floor(110 + Math.random() * 880)}`,
            institution: institutionInput.trim(),
            subCategory: subCategoryInput || activeRoleConfig.subCategoryOptions[0],
            province: provinceInput,
            permanentSecretaryName: finalComposedName || nameInput.trim(),
            permanentSecretaryNom: nomInput.trim().toUpperCase(),
            permanentSecretaryPostnom: postnomInput.trim().toUpperCase(),
            permanentSecretaryPrenom: prenomInput.trim(),
            permanentSecretarySexe: sexeInput,
            permanentSecretaryCivilite: civiliteInput,
            permanentSecretaryDateNaissance: dateNaissanceInput,
            permanentSecretaryLieuNaissance: lieuNaissanceInput,
            permanentSecretaryNationalite: nationaliteInput,
            permanentSecretaryEtatCivil: etatCivilInput,
            permanentSecretaryPieceIdentite: pieceIdentiteInput,
            permanentSecretaryEmail: emailInput.trim().toLowerCase(),
            permanentSecretaryPhone: phoneInput.trim(),
            permanentSecretaryMatricule: cleanMatricule,
            creationDocument: {
              documentRef: creationDocRef.trim(),
              documentType: creationDocType,
              signedDate: creationDocDate,
              signatoryAuthority: creationDocSignatory.trim(),
              fileName: creationDocFileName,
              fileSizeLabel: creationDocFileSize || '1.20 Mo',
              fileMimeType: creationDocMimeType,
              uploadedAt: new Date().toLocaleDateString('fr-FR'),
              verificationHash: `SHA256-ARMP-${Date.now().toString(16).toUpperCase()}`,
              fileDataUrl: creationDocDataUrl
            },
            members: cgpmpMembers,
            status: 'En attente de validation ARMP',
            createdAt: 'À l’instant'
          };

          await saveCgpmpAccountRequestToFirestore(newCgpmpReq);
          const updatedList = [
            newCgpmpReq,
            ...activeCgpmpRequests.filter((r) => r.id !== newCgpmpReq.id)
          ];
          updateCgpmpRequestsList(updatedList);
          setSubmittedCgpmpRequest(newCgpmpReq);
          onShowToast?.(
            `Demande de compte CGPMP (${newCgpmpReq.id}) soumise à l'Administration ARMP ! Les coordonnées seront envoyées par mail aux ${cgpmpMembers.length + 1} membres dès validation ARMP.`
          );
        } catch (err) {
          setStepError(getFriendlyAuthError(err));
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Standard Registration for Non-CGPMP Profiles
      setIsSubmitting(true);
      try {
        const defaultRoleTitle =
          roleTitleInput.trim() ||
          DEMO_PROFILES[selectedRole]?.roleTitle ||
          'Cadre de la Commande Publique';
        const defaultInstitution =
          institutionInput.trim() || 'Administration / Organisation RDC';
        const cleanSecondaryId = formatMatriculeOrRccmMask(
          secondaryIdInput || activeRoleConfig.defaultSecondaryId
        );

        const extraDetails: Partial<UserProfile> = {
          nom: nomInput.trim().toUpperCase(),
          postnom: postnomInput.trim().toUpperCase(),
          prenom: prenomInput.trim(),
          sexe: sexeInput,
          civilite: civiliteInput,
          dateNaissance: dateNaissanceInput,
          lieuNaissance: lieuNaissanceInput,
          nationalite: nationaliteInput,
          etatCivil: etatCivilInput,
          pieceIdentite: pieceIdentiteInput,
          adressePhysique: adressePhysiqueInput,
          phone: phoneInput.trim(),
          whatsapp: phoneInput.trim(),
          whatsappLinked: true,
          institution: defaultInstitution,
          roleTitle: defaultRoleTitle,
          matricule: cleanMatricule,
          secondaryIdNumber: cleanSecondaryId,
          subCategory: subCategoryInput || activeRoleConfig.subCategoryOptions[0],
          specialty: specialtyInput || activeRoleConfig.specialtyOptions[0],
          legalForm: selectedRole === 'pme' ? specialtyInput : undefined,
          localContentShare: selectedRole === 'pme' ? '≥ 51% Capital Congolais (Loi 17/001)' : undefined,
          location: `${provinceInput}, RDC`,
          province: provinceInput,
          twoFactorEnabled: enable2FAOnRegister,
          bio: `${defaultRoleTitle} • ${defaultInstitution} (${provinceInput}). Identifiant : ${cleanMatricule}.`
        };

        const uidToUse =
          googleAuthUid && !googleAuthUid.startsWith('GOOGLE-USR-')
            ? googleAuthUid
            : `USR-GOOGLE-${Date.now()}`;

        const userProfile = await saveGoogleRegisteredProfile({
          uid: uidToUse,
          email: emailInput.trim(),
          name: finalComposedName || nameInput.trim(),
          role: selectedRole,
          photoURL: googlePhotoUrl,
          extraDetails
        });

        onShowToast?.(`Inscription complétée avec succès ! Bienvenue ${userProfile.name}.`);
        onLoginSuccess?.(userProfile);
        onClose();
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'login') {
      const cleanMail = filterEmailMask(emailInput);
      if (!cleanMail || !cleanMail.includes('@')) {
        setStepError('Veuillez saisir une adresse email valide.');
        return;
      }
      if (!passwordInput) {
        setStepError('Veuillez saisir votre mot de passe (ou le mot de passe reçu par mail).');
        return;
      }

      setIsSubmitting(true);
      try {
        const userProfile = await firebaseLoginUser(cleanMail, passwordInput);
        // Authentification à double facteur : code OTP exigé si activé sur le compte
        if (userProfile.twoFactorEnabled) {
          setIsSubmitting(false);
          await beginTwoFA(userProfile);
          return;
        }
        onShowToast?.(`Connexion réussie : Bienvenue ${userProfile.name} (${userProfile.roleTitle}).`);
        onLoginSuccess?.(userProfile);
        onClose();
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setStepError(null);
    setIsSubmitting(true);
    try {
      const googleRes = await firebaseGoogleAuthenticate(allProfiles);
      if (googleRes.isNewAccount || !googleRes.existingProfile) {
        setGoogleAuthUid(googleRes.uid);
        setEmailInput(filterEmailMask(googleRes.email));
        setNameInput(filterPersonNameMask(googleRes.displayName || 'Apprenant ARMP'));
        setGooglePhotoUrl(googleRes.photoURL);
        setIsGoogleVerified(true);
        setExistingGoogleAccount(null);
        applyDynamicFieldsForRole(selectedRole, null);
        setMode('register');
        setRegisterStep(2);
        onShowToast?.('Nouvel utilisateur Google détecté. Complétez les étapes de création de compte.');
        return;
      }
      onShowToast?.(`Compte reconnu : Bienvenue ${googleRes.existingProfile.name}.`);
      onLoginSuccess?.(googleRes.existingProfile);
      onClose();
    } catch (err) {
      setStepError(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (role: UserRole, customProfile?: UserProfile) => {
    setSelectedRole(role);
    if (customProfile) {
      onLoginSuccess?.(customProfile);
      onShowToast?.(`Session active : ${customProfile.name} (${customProfile.institution})`);
      onClose();
      return;
    }
    if (onDemoLogin) {
      onDemoLogin(role);
      onClose();
    }
  };

  const handleApproveCgpmpByArmp = async (req: CgpmpAccountCreationRequest, note?: string) => {
    setProcessingArmpReqId(req.id);
    try {
      const updated = await validateCgpmpAccountRequestByArmp(
        req,
        'Pr. Antoine Kasongo Muteba (Direction DFAT / Administration ARMP)',
        note
      );
      const nextList = activeCgpmpRequests.map((r) => (r.id === updated.id ? updated : r));
      updateCgpmpRequestsList(nextList);
      if (submittedCgpmpRequest?.id === updated.id) {
        setSubmittedCgpmpRequest(updated);
      }
      onShowToast?.(
        `✅ Demande ${updated.id} validée par l'ARMP ! Les coordonnées d'authentification ont été envoyées par mail au Secrétaire Permanent et aux ${updated.members.length} membres.`
      );
    } finally {
      setProcessingArmpReqId(null);
    }
  };

  const handleRejectCgpmpByArmp = async (req: CgpmpAccountCreationRequest, reason: string) => {
    setProcessingArmpReqId(req.id);
    try {
      const updated = await rejectCgpmpAccountRequestByArmp(
        req,
        'Administration ARMP (Direction DFAT)',
        reason
      );
      const nextList = activeCgpmpRequests.map((r) => (r.id === updated.id ? updated : r));
      updateCgpmpRequestsList(nextList);
      onShowToast?.(`Demande CGPMP ${updated.id} rejetée avec motif transmis.`);
    } finally {
      setProcessingArmpReqId(null);
    }
  };

  const phoneDigitsCount = phoneInput.replace(/\D/g, '').replace(/^243/, '').length;
  const isPhoneComplete = isValidDRCPhone(phoneInput);

  return (
    <div className="fixed inset-0 z-50 w-full h-screen overflow-y-auto lg:overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 grid grid-cols-1 lg:grid-cols-12 animate-in fade-in duration-200">
      {/* COLUMN 1 (LEFT — 6 COLS EQUAL 50% FULL HEIGHT): LOGO, STEPS, LIVE CGPMP DOSSIER, CREDENTIALS SENT BY MAIL & DEMO ACCESS */}
      <div className="lg:col-span-6 lg:h-screen lg:overflow-y-auto bg-[#08244D] text-white border-b lg:border-b-0 lg:border-r border-slate-800 p-6 sm:p-8 xl:p-10">
        <AuthPortalLeftColumn
          mode={mode}
          onChangeMode={(nextMode) => {
            setMode(nextMode);
            setStepError(null);
          }}
          onEnterCreation={() => {
            // Création de compte : jamais de profil CGPMP (formulaire distinct de la demande)
            if (selectedRole === 'cgpmp_member') handleSelectRoleInRegistration('ac_agent');
            setRegisterStep(1);
          }}
          onEnterDemande={() => {
            // Demande CGPMP : parcours dédié (acte de création, membres, validation ARMP)
            handleSelectRoleInRegistration('cgpmp_member');
            setRegisterStep(1);
          }}
          onClose={canClose ? onClose : undefined}
          selectedRole={selectedRole}
          roleLabel={activeRoleConfig.label}
          roleBadgeText={activeRoleConfig.badgeText}
          registerStep={registerStep}
          onSelectStep={(st) => setRegisterStep(st)}
          isGoogleVerified={isGoogleVerified}
          nameInput={composeOfficialFullName() || nameInput}
          nomInput={nomInput}
          postnomInput={postnomInput}
          prenomInput={prenomInput}
          sexeInput={sexeInput}
          civiliteInput={civiliteInput}
          dateNaissanceInput={dateNaissanceInput}
          lieuNaissanceInput={lieuNaissanceInput}
          nationaliteInput={nationaliteInput}
          etatCivilInput={etatCivilInput}
          pieceIdentiteInput={pieceIdentiteInput}
          emailInput={emailInput}
          institutionInput={institutionInput}
          isPermanentSecretary={cgpmpApplicantCapacity === 'secretaire_permanent'}
          creationDocRef={creationDocRef}
          creationDocType={creationDocType}
          creationDocDate={creationDocDate}
          creationDocSignatory={creationDocSignatory}
          creationDocFileName={creationDocFileName}
          creationDocFileSize={creationDocFileSize}
          cgpmpMembers={cgpmpMembers}
          cgpmpAccountRequests={activeCgpmpRequests}
          onSelectDemo={handleSelectDemo}
          onPrefillLoginFromEmail={(loginEmail, tempPassword, recipientName) => {
            setEmailInput(loginEmail);
            setPasswordInput(tempPassword);
            setMode('login');
            setStepError(null);
            onShowToast?.(
              `Coordonnées reçues par mail pour ${recipientName} pré-remplies dans la colonne d'authentification.`
            );
          }}
          onOpenArmpValidationView={() => setMode('armp_admin')}
        />
      </div>

      {/* COLUMN 2 (RIGHT — 6 COLS EQUAL 50% FULL HEIGHT & FULL WIDTH): AUTHENTICATION, REGISTRATION STEPS OR ARMP VALIDATION */}
      <div className="lg:col-span-6 lg:h-screen lg:overflow-y-auto bg-white dark:bg-slate-950 p-6 sm:p-8 xl:p-10 flex flex-col justify-start">
        <div className="w-full space-y-5">
          {/* Large Official ARMP Logo in the White Column */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <ArmpLogo size="2xl" />
            <div className="text-xs sm:text-right text-slate-600 dark:text-slate-400">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                {mode === 'login'
                  ? 'Authentification Officielle ARMP & CGPMP'
                  : mode === 'register'
                  ? (isCgpmp
                      ? `Demande de Compte CGPMP (${activeRoleConfig.label}) — Étape ${registerStep}/5`
                      : `Création de Compte (${activeRoleConfig.label}) — Étape ${registerStep}/4`)
                  : mode === 'armp_admin'
                  ? 'Validation Administrative ARMP & Envoi Mail CGPMP'
                  : 'Réinitialisation des accès'}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Autorité de Régulation des Marchés Publics • RDC
              </span>
            </div>
          </div>
          {courseTitle && (
            <div className="p-3.5 rounded-2xl bg-blue-950 text-white border border-blue-700 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  Authentification requise pour accéder au module :{' '}
                  <strong className="text-amber-300">{courseTitle}</strong>
                </span>
              </div>
            </div>
          )}

          {stepError && (
            <div className="p-4 rounded-2xl border bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{stepError}</span>
              </div>
              {stepError.includes("Administration de l'ARMP") && (
                <button
                  type="button"
                  onClick={() => setMode('armp_admin')}
                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Valider dans Admin ARMP →
                </button>
              )}
            </div>
          )}

          {mode === 'armp_admin' ? (
            <CgpmpAdminValidationPanel
              requests={activeCgpmpRequests}
              isProcessingId={processingArmpReqId}
              onApproveRequest={handleApproveCgpmpByArmp}
              onRejectRequest={handleRejectCgpmpByArmp}
              onUseDispatchedCredentialsForLogin={(loginEmail, tempPassword, recipientName) => {
                setEmailInput(loginEmail);
                setPasswordInput(tempPassword);
                setMode('login');
                setStepError(null);
                onShowToast?.(
                  `Coordonnées reçues par mail chargées pour ${recipientName}. Cliquez sur « Accéder à mon espace sécurisé » pour vous connecter.`
                );
              }}
            />
          ) : mode === 'register' && submittedCgpmpRequest ? (
            <CgpmpSubmittedConfirmationCard
              request={submittedCgpmpRequest}
              onOpenArmpAdminConsole={() => setMode('armp_admin')}
              onBackToLogin={() => {
                setSubmittedCgpmpRequest(null);
                setMode('login');
              }}
            />
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-5">
                  {/* ======================================================== */}
                  {/* MODE 1: FORGOT PASSWORD */}
                  {/* ======================================================== */}
                  {mode === 'forgot_password' && (
                    <div className="space-y-4">
                      {resetSuccessMessage ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
                          <div className="font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{resetSuccessMessage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMode('login');
                              setResetSuccessMessage(null);
                            }}
                            className="text-xs font-bold text-blue-600 underline"
                          >
                            Retourner à la connexion
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Saisissez votre adresse email professionnelle pour recevoir un lien de réinitialisation.
                          </p>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Adresse Email officielle *
                            </label>
                            <div className="relative">
                              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                              <input
                                type="email"
                                required
                                value={emailInput}
                                onChange={(e) => setEmailInput(filterEmailMask(e.target.value))}
                                placeholder="ex: f.kabasele@budget.gouv.cd"
                                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setMode('login')}
                              className="text-xs font-bold text-slate-500 hover:underline flex items-center gap-1"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Retour à la connexion</span>
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                            >
                              Envoyer le lien
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODE 2: LOGIN (RIGHT COLUMN OF 2-COLUMN FULL PAGE) */}
                  {/* ======================================================== */}
                  {/* Étape 2FA : vérification du code OTP après mot de passe */}
                  {mode === 'login' && twoFAProfile && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span>Double authentification (2FA)</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Identifiants reconnus pour <strong className="text-slate-700 dark:text-slate-200">{twoFAProfile.email}</strong>.
                          Saisissez le code à 6 chiffres pour finaliser la connexion.
                        </p>
                      </div>

                      {otp2FAHint && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-800 dark:text-blue-200">
                          {otp2FAHint}
                        </div>
                      )}
                      {otp2FAError && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
                          {otp2FAError}
                        </div>
                      )}

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={otp2FA}
                        onChange={(e) => setOtp2FA(e.target.value.replace(/\D/g, ''))}
                        placeholder="Code à 6 chiffres (ex : 123456)"
                        className="w-full text-center tracking-widest text-lg font-mono px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirmTwoFA}
                          disabled={isVerifying2FA || isSending2FA || otp2FA.length < 6}
                          className="flex-1 py-3 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Vérifier et se connecter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => beginTwoFA(twoFAProfile)}
                          disabled={isSending2FA}
                          className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 cursor-pointer"
                        >
                          {isSending2FA ? 'Envoi…' : 'Renvoyer'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTwoFAProfile(null);
                          setOtp2FA('');
                          setOtp2FAError(null);
                        }}
                        className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                      >
                        ← Retour à la connexion
                      </button>
                    </div>
                  )}
                  {mode === 'login' && !twoFAProfile && (
                    <div className="space-y-4">
                      {/* Entête du formulaire de connexion */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#0C3B7C] dark:text-blue-400" />
                            <span>Connexion à votre espace</span>
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                            Portail Officiel RDC
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Connectez-vous à l'aide de vos identifiants pour accéder aux marchés publics et formations.
                        </p>
                      </div>

                      {/* 1. GOOGLE SIGN IN */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-extrabold text-xs transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Continuer avec Google</span>
                      </button>

                      <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-[11px]">
                          <span className="bg-white dark:bg-slate-950 px-3 text-slate-500 font-bold">
                            ou avec vos identifiants officiels
                          </span>
                        </div>
                      </div>

                      {/* 2. FORMULAIRE EMAIL & MOT DE PASSE */}
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Adresse Email officielle ou personnelle *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="email"
                              required
                              value={emailInput}
                              onChange={(e) => setEmailInput(filterEmailMask(e.target.value))}
                              placeholder="ex: s.mwanza@budget.gouv.cd"
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Mot de passe *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setMode('forgot_password');
                                setStepError(null);
                              }}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Mot de passe oublié ?
                            </button>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="Votre mot de passe"
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3.5 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Authentification en cours...</span>
                            </>
                          ) : (
                            <>
                              <span>Se connecter à mon espace</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Info CGPMP discrète */}
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <Info className="w-4 h-4 text-[#0C3B7C] dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Membres CGPMP :</strong> Utilisez votre adresse email enregistrée et le mot de passe reçu par notification ARMP après validation officielle de la cellule.
                        </p>
                      </div>

                      {/* Redirection Création de compte */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <p className="text-[11px] leading-relaxed">
                          Vous n’avez pas encore de compte ? Créez un profil adapté à votre activité.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('register');
                            setRegisterStep(1);
                            setStepError(null);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shrink-0 cursor-pointer"
                        >
                          Créer un compte →
                        </button>
                      </div>

                      {/* 3. REGROUPEMENT DES COMPTES DÉMOS DANS UN EXPANDABLE POUR ÉVITER LA SURCHARGE */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setShowDemoExpandable((prev) => !prev)}
                          className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Comptes de démonstration & tests rapides (6 profils prédéfinis)</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            <span>{showDemoExpandable ? 'Masquer' : 'Afficher'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemoExpandable ? 'rotate-180' : ''}`} />
                          </span>
                        </button>

                        {showDemoExpandable && (
                          <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-lg animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs">
                              <span className="font-bold text-amber-300">Accès direct en 1-clic :</span>
                              <span className="text-[10px] text-slate-400">Cliquez pour tester immédiatement</span>
                            </div>

                            {/* 1. Autorité Contractante */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                🏛️ Autorité Contractante
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {LOGIN_PROFILES_CATALOG.filter((p) => p.categoryKey === 'ac').map((spec) => (
                                  <button
                                    key={spec.role}
                                    type="button"
                                    onClick={() => handleDirectLoginForRole(spec.role)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400 text-left transition flex items-center justify-between group cursor-pointer"
                                  >
                                    <div className="min-w-0 pr-1">
                                      <div className="text-xs font-bold text-white truncate">{spec.title}</div>
                                      <div className="text-[10px] text-slate-300 truncate">{spec.demoName}</div>
                                      <div className="text-[9px] text-sky-300 font-mono truncate">{spec.demoEmail}</div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 2. Opérateurs Économiques */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                🏢 Opérateurs Économiques
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {LOGIN_PROFILES_CATALOG.filter((p) => p.categoryKey === 'oe').map((spec) => (
                                  <button
                                    key={spec.role}
                                    type="button"
                                    onClick={() => handleDirectLoginForRole(spec.role)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400 text-left transition flex items-center justify-between group cursor-pointer"
                                  >
                                    <div className="min-w-0 pr-1">
                                      <div className="text-xs font-bold text-white truncate">{spec.title}</div>
                                      <div className="text-[10px] text-slate-300 truncate">{spec.demoName}</div>
                                      <div className="text-[9px] text-teal-300 font-mono truncate">{spec.demoEmail}</div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 3 & 4. Sociétés Civiles & Indépendant */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                ⚖️ Sociétés Civiles & 👤 Indépendant
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {LOGIN_PROFILES_CATALOG.filter((p) => p.categoryKey === 'sc' || p.categoryKey === 'ind').map((spec) => (
                                  <button
                                    key={spec.role}
                                    type="button"
                                    onClick={() => handleDirectLoginForRole(spec.role)}
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400 text-left transition flex items-center justify-between group cursor-pointer"
                                  >
                                    <div className="min-w-0 pr-1">
                                      <div className="text-xs font-bold text-white truncate">{spec.title}</div>
                                      <div className="text-[10px] text-slate-300 truncate">{spec.demoName}</div>
                                      <div className="text-[9px] text-emerald-300 font-mono truncate">{spec.demoEmail}</div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 5. Administration & Supervision */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                🔰 Administration & Supervision
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {LOGIN_PROFILES_CATALOG.filter((p) => p.categoryKey === 'admin').map((spec) => (
                                  <button
                                    key={spec.role}
                                    type="button"
                                    onClick={() => handleDirectLoginForRole(spec.role)}
                                    className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/40 hover:border-sky-300 text-left transition flex items-center justify-between group cursor-pointer"
                                  >
                                    <div className="min-w-0 pr-1">
                                      <div className="text-xs font-bold text-white truncate">{spec.title}</div>
                                      <div className="text-[10px] text-slate-300 truncate">{spec.demoName}</div>
                                      <div className="text-[9px] text-sky-300 font-mono truncate">{spec.demoEmail}</div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-sky-300 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODE 3: REGISTER (MULTI-STEP IN RIGHT COLUMN) */}
                  {/* ======================================================== */}
                  {mode === 'register' && (
                    <div className="space-y-5">
                      {/* STEP 1: ROLE SELECTION + CGPMP PERMANENT SECRETARY CONDITION (SEPARATED FROM NAMES & EMAILS) */}
                      {registerStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              Étape 1/{isCgpmp ? 5 : 4} — Choisissez le profil de compte à créer *
                            </label>

                            {/* Catégorie 1 : Autorité Contractante */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                🏛️ Autorité Contractante
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {((isCgpmp ? ['cgpmp_member'] : ['ac_agent']) as UserRole[]).map((rKey) => {
                                  const cfg = ROLE_CREATION_CONFIG[rKey];
                                  const isSelected = selectedRole === rKey;
                                  return (
                                    <button
                                      key={rKey}
                                      type="button"
                                      onClick={() => handleSelectRoleInRegistration(rKey)}
                                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                        isSelected
                                          ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500/30'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                        {cfg.label}
                                      </span>
                                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {cfg.shortDesc}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Catégorie 2 : Opérateurs Économiques */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                🏢 Opérateurs Économiques
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(['pme', 'grande_entreprise'] as UserRole[]).map((rKey) => {
                                  const cfg = ROLE_CREATION_CONFIG[rKey];
                                  const isSelected = selectedRole === rKey;
                                  return (
                                    <button
                                      key={rKey}
                                      type="button"
                                      onClick={() => handleSelectRoleInRegistration(rKey)}
                                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                        isSelected
                                          ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/60 ring-2 ring-teal-500/30'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                        {cfg.label}
                                      </span>
                                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {cfg.shortDesc}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Catégorie 3 : Sociétés civiles */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                ⚖️ Sociétés Civiles
                              </span>
                              <div>
                                {(['societe_civile'] as UserRole[]).map((rKey) => {
                                  const cfg = ROLE_CREATION_CONFIG[rKey];
                                  const isSelected = selectedRole === rKey;
                                  return (
                                    <button
                                      key={rKey}
                                      type="button"
                                      onClick={() => handleSelectRoleInRegistration(rKey)}
                                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                                        isSelected
                                          ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                          {cfg.label}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                          Contrôle Citoyen
                                        </span>
                                      </div>
                                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {cfg.shortDesc}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Catégorie 4 : Indépendant */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                👤 Indépendant
                              </span>
                              <div>
                                {(['independant'] as UserRole[]).map((rKey) => {
                                  const cfg = ROLE_CREATION_CONFIG[rKey];
                                  const isSelected = selectedRole === rKey;
                                  return (
                                    <button
                                      key={rKey}
                                      type="button"
                                      onClick={() => handleSelectRoleInRegistration(rKey)}
                                      className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                                        isSelected
                                          ? 'border-cyan-600 bg-cyan-50/90 dark:bg-cyan-950/60 ring-2 ring-cyan-500/30'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="block text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                          {cfg.label}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300">
                                          Expert Libéral
                                        </span>
                                      </div>
                                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {cfg.shortDesc}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Formateur & Régulateurs */}
                            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>Autres habilitations :</span>
                              {(['armp_agent', 'dgcmp_agent', 'formateur'] as UserRole[]).map((rKey) => {
                                const cfg = ROLE_CREATION_CONFIG[rKey];
                                const isSelected = selectedRole === rKey;
                                return (
                                  <button
                                    key={rKey}
                                    type="button"
                                    onClick={() => handleSelectRoleInRegistration(rKey)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                      isSelected
                                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {cfg.label.split(' ')[0]} {rKey === 'armp_agent' ? 'ARMP' : rKey === 'dgcmp_agent' ? 'DGCMP' : 'Formateur'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* EXCLUSIVE CGPMP CONDITION: SEUL LE SECRÉTAIRE PERMANENT PEUT CRÉER LE COMPTE CGPMP */}
                          {isCgpmp && (
                            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-400 dark:border-indigo-700 space-y-3">
                              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>
                                  Habilitation Réglementaire CGPMP : Seul le Secrétaire Permanent peut créer le compte CGPMP *
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                Conformément aux dispositions régissant les Cellules de Gestion des Projets et des Marchés Publics, <strong>seul le Secrétaire Permanent</strong> est habilité à créer le compte de la cellule, à joindre le document portant création de la CGPMP et à inscrire la liste des membres.
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setCgpmpApplicantCapacity('secretaire_permanent')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    cgpmpApplicantCapacity === 'secretaire_permanent'
                                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-extrabold'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600'
                                  }`}
                                >
                                  <div className="text-xs font-extrabold">
                                    ✓ Je suis le Secrétaire Permanent de la CGPMP
                                  </div>
                                  <div className="text-[10px] opacity-80 mt-0.5">
                                    Habilité à créer le compte CGPMP et ajouter les membres
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCgpmpApplicantCapacity('membre_ordinaire')}
                                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                    cgpmpApplicantCapacity === 'membre_ordinaire'
                                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-extrabold'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600'
                                  }`}
                                >
                                  <div className="text-xs font-bold">
                                    Je suis un Membre de la CGPMP (CPM / Expert)
                                  </div>
                                  <div className="text-[10px] opacity-80 mt-0.5">
                                    Inscrit par le Secrétaire Permanent (accès reçu par mail)
                                  </div>
                                </button>
                              </div>

                              {cgpmpApplicantCapacity === 'membre_ordinaire' && (
                                <div className="p-3.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/80 border border-amber-400 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                                  <div className="font-extrabold">
                                    🔒 Création directe verrouillée pour les membres individuels :
                                  </div>
                                  <p className="text-[11px] leading-relaxed">
                                    En tant que membre de la CGPMP, vous ne créez pas de compte individuellement. Votre <strong>Secrétaire Permanent</strong> vous inscrit sur la liste officielle de la cellule avec votre nom complet et votre adresse email. Dès que <strong>l’Administration de l’ARMP</strong> valide la demande, le système vous envoie vos coordonnées d’authentification par mail.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className="px-3.5 py-2 rounded-lg bg-[#0C3B7C] text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    Aller à la page de connexion (utiliser mes coordonnées reçues par mail) →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Summary of what Steps 2 to 5 will collect */}
                          {(!isCgpmp || cgpmpApplicantCapacity === 'secretaire_permanent') && (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                Profil sélectionné : <span className="text-blue-600 dark:text-blue-400">{activeRoleConfig.label}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                L’étape suivante (<strong>Étape 2/{isCgpmp ? 5 : 4}</strong>) est dédiée à vos informations d’identité civile complète (<strong>Nom, Post-nom, Prénom, Sexe, Date et Lieu de naissance, Nationalité, Pièce d’identité et Adresse Email officielle</strong>).
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={handleGoogleRegistrationStep1}
                                  disabled={isSubmitting}
                                  className="py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-900 dark:text-white font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                  </svg>
                                  <span>Pré-remplir avec Google</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={handleNextStep}
                                  className="py-3 px-4 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <span>Continuer vers l’Identité Civile (Étape 2/{isCgpmp ? 5 : 4})</span>
                                  <ArrowRight className="w-4 h-4 shrink-0" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 2 (NOUVELLE ÉTAPE DÉDIÉE): IDENTITÉ CIVILE COMPLÈTE (NOM, POSTNOM, PRÉNOM, SEXE, EMAIL & AUTRES INFOS UTILES) */}
                      {registerStep === 2 && (
                        <div className="space-y-4">
                          {/* Existing Google Account Detected Card */}
                          {existingGoogleAccount && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 space-y-3">
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                ✓ Utilisateur déjà enregistré détecté : {existingGoogleAccount.name} ({existingGoogleAccount.institution})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onLoginSuccess?.(existingGoogleAccount);
                                    onClose();
                                  }}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                                >
                                  Me connecter directement à ce compte
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRegisterStep(3)}
                                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                                >
                                  Poursuivre vers l’Étape 3 →
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                  Étape 2/{isCgpmp ? 5 : 4} — Identité Civile Complète & Adresse Email {isCgpmp ? 'du Secrétaire Permanent CGPMP' : 'du Titulaire'}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Renseignez votre Nom, Post-nom, Prénom, Sexe et toutes les informations civiles requises.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCiviliteInput('M.');
                                  setNomInput('KABASELE');
                                  setPostnomInput('LUKOJI');
                                  setPrenomInput('Fidèle');
                                  setSexeInput('M');
                                  setDateNaissanceInput('1982-04-18');
                                  setLieuNaissanceInput('Kinshasa');
                                  setNationaliteInput('Congolaise (RDC)');
                                  setEtatCivilInput('Marié(e)');
                                  setPieceIdentiteInput('ONIP-RDC-24390812');
                                  if (!emailInput) {
                                    setEmailInput(
                                      isCgpmp
                                        ? 'sp.cgpmp@infrastructures.gouv.cd'
                                        : 'f.kabasele@finances.gouv.cd'
                                    );
                                  }
                                  setStepError(null);
                                  onShowToast?.('Exemple d’identité civile complète pré-rempli.');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-[11px] font-extrabold hover:bg-blue-200 transition cursor-pointer"
                              >
                                + Pré-remplir un exemple d’identité
                              </button>
                            </div>

                            {/* Row 1: Civilité & Sexe */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Civilité / Titre *
                                </label>
                                <select
                                  value={civiliteInput}
                                  onChange={(e) => setCiviliteInput(e.target.value)}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  <option value="M.">Monsieur (M.)</option>
                                  <option value="Mme">Madame (Mme)</option>
                                  <option value="Ir.">Ingénieur (Ir.)</option>
                                  <option value="Me">Maître (Me)</option>
                                  <option value="Dr">Docteur (Dr)</option>
                                  <option value="Pr.">Professeur (Pr.)</option>
                                  <option value="Hon.">Honorable (Hon.)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Sexe / Genre *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSexeInput('M')}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                                      sexeInput === 'M'
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    Masculin (M)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSexeInput('F')}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                                      sexeInput === 'F'
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    Féminin (F)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Nom, Post-nom, Prénom */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Nom (Nom de famille) *
                                </label>
                                <div className="relative">
                                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                  <input
                                    type="text"
                                    required
                                    value={nomInput}
                                    onChange={(e) => setNomInput(filterPersonNameMask(e.target.value).toUpperCase())}
                                    placeholder="ex: KABASELE"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Post-nom *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={postnomInput}
                                  onChange={(e) => setPostnomInput(filterPersonNameMask(e.target.value).toUpperCase())}
                                  placeholder="ex: LUKOJI"
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white uppercase"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Prénom *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={prenomInput}
                                  onChange={(e) => setPrenomInput(filterPersonNameMask(e.target.value))}
                                  placeholder="ex: Fidèle"
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Row 3: Adresse Email officielle & N° Pièce d'Identité */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  {isCgpmp ? 'Adresse Email officielle du Secrétaire Permanent *' : 'Adresse Email professionnelle / officielle *'}
                                </label>
                                <div className="relative">
                                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                  <input
                                    type="email"
                                    required
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(filterEmailMask(e.target.value))}
                                    placeholder="ex: sp.cgpmp@finances.gouv.cd"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  N° Pièce d’Identité (Carte d’Électeur ONIP / Passeport) *
                                </label>
                                <input
                                  type="text"
                                  value={pieceIdentiteInput}
                                  onChange={(e) => setPieceIdentiteInput(formatMatriculeOrRccmMask(e.target.value))}
                                  placeholder="ex: ONIP-RDC-24389104"
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase"
                                />
                              </div>
                            </div>

                            {/* Row 4: Date de naissance, Lieu de naissance, Nationalité, État civil */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Date de naissance
                                </label>
                                <input
                                  type="date"
                                  value={dateNaissanceInput}
                                  onChange={(e) => setDateNaissanceInput(e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Lieu de naissance
                                </label>
                                <input
                                  type="text"
                                  value={lieuNaissanceInput}
                                  onChange={(e) => setLieuNaissanceInput(filterPersonNameMask(e.target.value))}
                                  placeholder="ex: Kinshasa"
                                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Nationalité
                                </label>
                                <input
                                  type="text"
                                  value={nationaliteInput}
                                  onChange={(e) => setNationaliteInput(e.target.value)}
                                  placeholder="Congolaise (RDC)"
                                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  État civil
                                </label>
                                <select
                                  value={etatCivilInput}
                                  onChange={(e) => setEtatCivilInput(e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  <option value="Marié(e)">Marié(e)</option>
                                  <option value="Célibataire">Célibataire</option>
                                  <option value="Veuf / Veuve">Veuf / Veuve</option>
                                  <option value="Divorcé(e)">Divorcé(e)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Étape 1 (Profil)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleVerifyCivilIdentityStep2}
                              disabled={isSubmitting}
                              className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                            >
                              <span>
                                {isCgpmp
                                  ? 'Suivant : Document de Création CGPMP (Étape 3/5)'
                                  : 'Suivant : Institution & Fonction (Étape 3/4)'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: INSTITUTION + MANDATORY CGPMP CREATION DOCUMENT (OR ROLE DYNAMIC FIELDS) */}
                      {registerStep === 3 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {activeRoleConfig.institutionLabel}
                            </label>
                            <div className="relative">
                              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                              <input
                                type="text"
                                required
                                value={institutionInput}
                                onChange={(e) => setInstitutionInput(filterInstitutionMask(e.target.value))}
                                placeholder={activeRoleConfig.institutionPlaceholder}
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {activeRoleConfig.institutionPresets.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setInstitutionInput(filterInstitutionMask(preset))}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    institutionInput === preset
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {activeRoleConfig.subCategoryLabel}
                              </label>
                              <select
                                value={subCategoryInput}
                                onChange={(e) => setSubCategoryInput(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                              >
                                {activeRoleConfig.subCategoryOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {activeRoleConfig.roleTitleLabel}
                              </label>
                              <div className="relative">
                                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                  type="text"
                                  readOnly={isCgpmp}
                                  value={isCgpmp ? 'Secrétaire Permanent de la CGPMP' : roleTitleInput}
                                  onChange={(e) => setRoleTitleInput(filterRoleTitleMask(e.target.value))}
                                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold ${
                                    isCgpmp
                                      ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 cursor-not-allowed'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* IF CGPMP: MANDATORY DOCUMENT PORTANT CRÉATION DE LA CELLULE */}
                          {isCgpmp ? (
                            <CgpmpCreationDocumentSection
                              creationDocType={creationDocType}
                              setCreationDocType={setCreationDocType}
                              creationDocRef={creationDocRef}
                              setCreationDocRef={setCreationDocRef}
                              creationDocDate={creationDocDate}
                              setCreationDocDate={setCreationDocDate}
                              creationDocSignatory={creationDocSignatory}
                              setCreationDocSignatory={setCreationDocSignatory}
                              creationDocFileName={creationDocFileName}
                              creationDocFileSize={creationDocFileSize}
                              onFileUpload={handleCreationDocUpload}
                              onAttachSpecimenDocument={handleAttachSpecimenDocument}
                            />
                          ) : (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {activeRoleConfig.specialtyLabel}
                              </label>
                              <select
                                value={specialtyInput}
                                onChange={(e) => setSpecialtyInput(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                              >
                                {activeRoleConfig.specialtyOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Étape 2 (Identité Civile)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                            >
                              <span>
                                {isCgpmp
                                  ? 'Suivant : Liste des Membres CGPMP (Étape 4/5)'
                                  : 'Suivant : Coordonnées RDC & Activation (Étape 4/4)'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 4 FOR CGPMP: LISTE DES MEMBRES (NOM, POST-NOM, PRÉNOM, SEXE & ADRESSES EMAIL) */}
                      {registerStep === 4 && isCgpmp && (
                        <div className="space-y-4">
                          <CgpmpMembersRosterStep
                            permanentSecretaryName={composeOfficialFullName() || nameInput || 'Secrétaire Permanent'}
                            permanentSecretaryEmail={emailInput}
                            institutionName={institutionInput}
                            members={cgpmpMembers}
                            onAddMember={(newMem) => {
                              setCgpmpMembers((prev) => [
                                ...prev,
                                { ...newMem, id: `MEM-${Date.now()}` }
                              ]);
                              onShowToast?.(
                                `Membre ajouté : ${newMem.fullName} (${newMem.email}).`
                              );
                            }}
                            onRemoveMember={(id) =>
                              setCgpmpMembers((prev) => prev.filter((m) => m.id !== id))
                            }
                            onLoadDefaultMembers={() => {
                              setCgpmpMembers([
                                {
                                  id: 'MEM-PRE-1',
                                  fullName: 'Ir. Célestin KABUYA MUTOMBO',
                                  nom: 'KABUYA',
                                  postnom: 'MUTOMBO',
                                  prenom: 'Célestin',
                                  sexe: 'M',
                                  email: 'c.kabuya@infrastructures.gouv.cd',
                                  functionInCell:
                                    'Président de la Commission de Passation des Marchés (CPM)'
                                },
                                {
                                  id: 'MEM-PRE-2',
                                  fullName: 'Me Mireille NGALULA TSHIMANGA',
                                  nom: 'NGALULA',
                                  postnom: 'TSHIMANGA',
                                  prenom: 'Mireille',
                                  sexe: 'F',
                                  email: 'm.ngalula@infrastructures.gouv.cd',
                                  functionInCell: 'Expert en Passation des Marchés & Montage DAO'
                                },
                                {
                                  id: 'MEM-PRE-3',
                                  fullName: 'M. Serge MBUYI KALONJI',
                                  nom: 'MBUYI',
                                  postnom: 'KALONJI',
                                  prenom: 'Serge',
                                  sexe: 'M',
                                  email: 's.mbuyi@infrastructures.gouv.cd',
                                  functionInCell: 'Expert Technique & Analyse des Offres'
                                }
                              ]);
                              onShowToast?.('3 membres types de la Cellule CGPMP chargés.');
                            }}
                          />

                          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Étape 3 (Acte de création)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                            >
                              <span>Suivant : Coordonnées & Soumission ARMP (Étape 5/5)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* FINAL STEP (STEP 5 FOR CGPMP, STEP 4 FOR OTHERS): DRC PHONE MASK, MATRICULE & SUBMIT */}
                      {((registerStep === 5 && isCgpmp) || (registerStep === 4 && !isCgpmp)) && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Province de rattachement (RDC) *
                              </label>
                              <div className="relative">
                                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                                <select
                                  value={provinceInput}
                                  onChange={(e) => setProvinceInput(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  {DRC_PROVINCES.map((prov) => (
                                    <option key={prov} value={prov}>
                                      {prov}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Téléphone RDC (+243 verrouillé) *
                                </label>
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    isPhoneComplete ? 'text-emerald-600' : 'text-amber-600'
                                  }`}
                                >
                                  {isPhoneComplete ? '✓ 9/9 chiffres' : `${phoneDigitsCount}/9 chiffres`}
                                </span>
                              </div>
                              <div className="relative">
                                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                  type="tel"
                                  required
                                  value={phoneInput}
                                  onChange={(e) => setPhoneInput(formatDRCPhoneMask(e.target.value))}
                                  placeholder="+243 81 234 5678"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Adresse physique / Siège administratif (RDC)
                            </label>
                            <input
                              type="text"
                              value={adressePhysiqueInput}
                              onChange={(e) => setAdressePhysiqueInput(e.target.value)}
                              placeholder="ex: Boulevard du 30 Juin, Commune de la Gombe, Kinshasa"
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {activeRoleConfig.matriculeLabel}
                              </label>
                              <div className="relative">
                                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                  type="text"
                                  required
                                  value={matriculeInput}
                                  onChange={(e) =>
                                    setMatriculeInput(formatMatriculeOrRccmMask(e.target.value))
                                  }
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {activeRoleConfig.secondaryIdLabel}
                              </label>
                              <div className="relative">
                                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                  type="text"
                                  required
                                  readOnly={isCgpmp}
                                  value={isCgpmp ? creationDocRef : secondaryIdInput}
                                  onChange={(e) =>
                                    setSecondaryIdInput(formatMatriculeOrRccmMask(e.target.value))
                                  }
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase"
                                />
                              </div>
                            </div>
                          </div>

                          {/* CGPMP Final Recap Box before submitting to ARMP Admin */}
                          {isCgpmp && (
                            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                              <div className="font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <span>
                                  Récapitulatif de la Demande CGPMP soumise à la Validation de l’ARMP :
                                </span>
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                                <li>
                                  • <strong>Secrétaire Permanent :</strong> {composeOfficialFullName() || nameInput} — Sexe: {sexeInput} ({emailInput})
                                </li>
                                <li>
                                  • <strong>Document portant création joint :</strong> {creationDocType} n°{' '}
                                  <span className="font-mono font-bold">{creationDocRef}</span> ({creationDocFileName})
                                </li>
                                <li>
                                  • <strong>Membres inscrits ({cgpmpMembers.length}) :</strong>{' '}
                                  {cgpmpMembers.map((m) => `${m.fullName} (${m.email})`).join(' · ')}
                                </li>
                                <li className="text-emerald-800 dark:text-emerald-300 font-bold pt-1">
                                  ➔ Le système enverra par mail les coordonnées d’authentification au Secrétaire Permanent et à chaque membre dès validation de cette demande par l’Administration de l’ARMP.
                                </li>
                              </ul>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={enable2FAOnRegister}
                                onChange={(e) => setEnable2FAOnRegister(e.target.checked)}
                                className="rounded text-blue-600 w-4 h-4"
                              />
                              <span className="font-bold flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-blue-600" />
                                <span>Activer la Double Protection (2FA)</span>
                              </span>
                            </label>

                            <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={acceptEthicsCharter}
                                onChange={(e) => setAcceptEthicsCharter(e.target.checked)}
                                className="rounded text-blue-600 w-4 h-4"
                              />
                              <span className="font-medium">
                                J’accepte la Charte d’intégrité (Loi 10/010)
                              </span>
                            </label>
                          </div>

                          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Précédent</span>
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-amber-300" />
                              <span>
                                {isSubmitting
                                  ? 'Transmission en cours...'
                                  : isCgpmp
                                  ? `Soumettre la Demande CGPMP (${cgpmpMembers.length + 1} membres) à la Validation ARMP`
                                  : 'Finaliser mon inscription & Accéder à mon compte'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
          )}
        </div>
      </div>
    </div>
  );
};
