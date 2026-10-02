import { CourseModule, UserProfile, UserRole } from '../types';

export type CourseLessonItem = CourseModule['lessons'][number];

export interface ProfilePedagogicalConfig {
  role: UserRole;
  shortLabel: string;
  catalogFilterLabel: string;
  legalBasisFocus: string;
  mandateSummary: string;
  defaultCategoryLock: string;
  defaultLevelLock: string;
  defaultStatusLock: string;
  operationalPosture: string;
  documentaryDeliverables: string[];
  auditAndRiskFocus: string[];
}

export const PROFILE_PEDAGOGICAL_CONFIGS: Record<UserRole, ProfilePedagogicalConfig> = {
  pme: {
    role: 'pme',
    shortLabel: 'PME & Sous-Traitants (Loi 17/001)',
    catalogFilterLabel: 'PME & Sous-Traitants (Loi 17/001)',
    legalBasisFocus: 'Loi n° 10/010 (Art. 46 - Marge de préférence 5-10%) & Loi n° 17/001 (Sous-traitance ARSP 40%)',
    mandateSummary: 'Sécuriser la recevabilité des plis, chiffrer des offres financières rentables, constituer des GME solides et défendre vos droits par recours gracieux/CRD.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Opérateur économique soumissionnaire & titulaire de marché public',
    documentaryDeliverables: [
      'Garantie de soumission conforme (1% à 2%) et Cautionnement définitif (3% à 5%)',
      'Convention de Groupement Momentané d’Entreprises (GME conjoint ou solidaire)',
      'Dossier fiscal & social à jour (Attestation fiscale DGI, CNSS, RCCM, Attestation ARSP)',
      'Bordereau des Prix Unitaires (BPU) et Détail Quantitatif et Estimatif (DQE) sans erreur arithmétique'
    ],
    auditAndRiskFocus: [
      'Élimination automatique à l’ouverture pour absence ou non-conformité de la garantie bancaire',
      'Rejet technique pour absence de signature du mandataire habilité ou spécifications incomplètes',
      'Forclusion des délais de recours (5 jours ouvrables après notification des résultats provisoires)',
      'Pénalités de retard en exécution faute de notification formelle d’un cas de force majeure ou d’ordre de service'
    ]
  },
  cgpmp_member: {
    role: 'cgpmp_member',
    shortLabel: 'Cellule de Gestion (CGPMP)',
    catalogFilterLabel: 'Cellules CGPMP',
    legalBasisFocus: 'Loi n° 10/010 (Art. 13) & Décret n° 10/32 du 28 décembre 2010 portant création des CGPMP',
    mandateSummary: 'Piloter la planification (PPM), rédiger des DAO/TDR neutres et complets, conduire les séances d’ouverture/évaluation et gérer les contrats jusqu’à la réception définitive.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Organe opérationnel de passation auprès de l’Autorité Contractante',
    documentaryDeliverables: [
      'Plan de Passation des Marchés (PPM) corrélé aux crédits budgétaires votés',
      'Dossier d’Appel d’Offres (DAO) basé sur les Dossiers Types officiels de l’ARMP',
      'Procès-Verbal d’ouverture publique des plis et Rapport d’évaluation de la Sous-Commission d’Analyse (SCA)',
      'Dossier de saisine DGCMP pour Avis de Non-Objection (ANO) et Ordres de Service (OS)'
    ],
    auditAndRiskFocus: [
      'Fractionnement artificiel des dépenses pour contourner les seuils d’appel d’offres ou de contrôle DGCMP',
      'Spécifications techniques orientées vers une marque déterminée (violation de l’égalité de traitement)',
      'Modification des critères d’évaluation en cours de dépouillement (motif de rejet d’ANO par la DGCMP)',
      'Dépassement du plafond légal cumulé de 15% sur les avenants en cours d’exécution'
    ]
  },
  armp_agent: {
    role: 'armp_agent',
    shortLabel: 'Régulateur ARMP / CRD',
    catalogFilterLabel: 'Régulateurs ARMP',
    legalBasisFocus: 'Loi n° 10/010 (Art. 15, 73 à 82) & Décret n° 10/21 du 02 juin 2010 portant création de l’ARMP',
    mandateSummary: 'Assurer la régulation normative, instruire les recours suspensifs devant le CRD, diligenter les audits indépendants a posteriori et tenir le registre d’exclusion.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Autorité de régulation normative, d’audit indépendant et de règlement non juridictionnel des différends',
    documentaryDeliverables: [
      'Note d’instruction contradictoire et Projet de décision du Comité de Règlement des Différends (CRD)',
      'Termes de Référence et Rapport d’audit indépendant a posteriori des marchés publics',
      'Mises à jour des Dossiers Types d’Appel d’Offres et directives de régulation',
      'Décisions d’inscription sur la liste noire nationale des entreprises exclues (faux, corruption, collusion)'
    ],
    auditAndRiskFocus: [
      'Vérification stricte de la recevabilité temporelle des recours (délais de 5 jours et 3 jours ouvrables)',
      'Respect de l’effet suspensif légal dès l’enregistrement de la saisine du CRD',
      'Détection des pratiques collusoires, ententes anticoncurrentielles et conflits d’intérêts lors des audits',
      'Contrôle de la publication effective des avis, attributions et rapports d’exécution au Journal des Marchés Publics'
    ]
  },
  dgcmp_agent: {
    role: 'dgcmp_agent',
    shortLabel: 'Contrôleur DGCMP',
    catalogFilterLabel: 'Contrôleurs DGCMP',
    legalBasisFocus: 'Loi n° 10/010 (Art. 14, 26 à 29) & Décret n° 10/27 du 28 juin 2010 portant création de la DGCMP',
    mandateSummary: 'Exercer le contrôle a priori de régularité des procédures au-dessus des seuils, délivrer ou refuser les Avis de Non-Objection (ANO) et encadrer strictement le gré à gré.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Organe de contrôle a priori de la régularité des procédures de passation et d’engagement budgétaire',
    documentaryDeliverables: [
      'Avis de Non-Objection (ANO) motivé sur PPM, DAO, Rapport d’évaluation et Projet de contrat',
      'Note de rejet motivée en cas d’irrégularité substantielle dans l’application des critères du DAO',
      'Décision d’autorisation spéciale préalable de passation par marché de gré à gré (Art. 26 à 29)',
      'Visa de conformité préalable à l’engagement financier dans la chaîne de la dépense publique'
    ],
    auditAndRiskFocus: [
      'Validation de l’adéquation stricte entre le PPM soumis et la Loi de Finances / crédits disponibles',
      'Contrôle de la conformité du rapport de la SCA aux seuls critères annoncés dans les DPAO',
      'Examen rigoureux des justificatifs d’urgence impérieuse ou d’exclusivité technique pour les demandes de gré à gré',
      'Vérification de la régularité des avenants ayant une incidence financière avant signature'
    ]
  },
  particulier: {
    role: 'particulier',
    shortLabel: 'Consultant & Auditeur Indépendant',
    catalogFilterLabel: 'Soumissionnaires / Consultants',
    legalBasisFocus: 'Loi n° 10/010 (Art. 32 à 36 - Prestations Intellectuelles) & Manuel des Procédures ARMP',
    mandateSummary: 'Maîtriser les méthodes de sélection de consultants (SBQC, SBQ, SMC, SCI), rédiger des propositions techniques et financières gagnantes et conduire des missions d’appui.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Consultant individuel, bureau d’études, expert en passation des marchés ou auditeur',
    documentaryDeliverables: [
      'Dossier d’Appel à Manifestation d’Intérêt (AMI) avec références similaires vérifiables',
      'Proposition Technique méthodologique structurée selon les Termes de Référence (TDR)',
      'Proposition Financière sous pli séparé (pour SBQC/SBQ/SMC) et ventilation des honoraires/frais remboursables',
      'Rapports d’évaluation technique/financière ou livrables d’assistance technique aux CGPMP'
    ],
    auditAndRiskFocus: [
      'Interdiction de conflit d’intérêts (incompatibilité entre rédaction des TDR/DAO et soumission au marché subséquent)',
      'Respect de la double enveloppe étanche (ouverture de la proposition financière uniquement après validation des scores techniques)',
      'Justification de la disponibilité réelle du personnel clé proposé dans l’offre technique',
      'Maîtrise de la formule de pondération combinée (ex: 80% score technique / 20% score financier)'
    ]
  },
  formateur: {
    role: 'formateur',
    shortLabel: 'Formateur Homologué DFAT',
    catalogFilterLabel: 'Formateurs & Auditeurs',
    legalBasisFocus: 'Loi n° 10/010 (Intégrale), Décrets d’application & Référentiel National des Compétences DFAT-ARMP',
    mandateSummary: 'Animer les sessions d’habilitation officielle, concevoir des cas pratiques jurisprudentiels CRD/DGCMP et évaluer les compétences des praticiens.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Formateur-Expert certifié DFAT / ARMP en commande publique',
    documentaryDeliverables: [
      'Syllabi pédagogiques alignés sur les 5 piliers réglementaires de la Loi n° 10/010',
      'Études de cas contradictoires (simulation d’ouverture des plis, rédaction de PV, arbitrage CRD)',
      'Grilles d’évaluation certificative et fiches de synthèse réglementaire par profil d’apprenant',
      'Veille jurisprudentielle sur les décisions récentes du CRD et directives ARMP'
    ],
    auditAndRiskFocus: [
      'Exactitude rigoureuse des références légales (articles de la Loi 10/010, Décrets 10/21, 10/22, 10/27, 10/32)',
      'Distinction pédagogique claire entre les prérogatives de passation (CGPMP), de contrôle (DGCMP) et de régulation (ARMP)',
      'Adaptation des exercices pratiques au profil réel des participants (PME vs Acheteurs publics vs Contrôleurs)'
    ]
  },
  dfat_admin: {
    role: 'dfat_admin',
    shortLabel: 'Direction DFAT (ARMP)',
    catalogFilterLabel: 'Formateurs & Auditeurs',
    legalBasisFocus: 'Décret n° 10/21 portant création de l’ARMP & Schéma Directeur de Professionnalisation DFAT',
    mandateSummary: 'Superviser les parcours d’habilitation nationale, instruire les requêtes de formation des CGPMP et certifier les acteurs de la commande publique.',
    defaultCategoryLock: 'Tous',
    defaultLevelLock: 'Tous',
    defaultStatusLock: 'Certifiant',
    operationalPosture: 'Direction de la Formation et de l’Appui Technique (DFAT - ARMP)',
    documentaryDeliverables: [
      'Décisions d’homologation des programmes et d’approbation des requêtes de formation CGPMP',
      'Certificats officiels d’aptitude professionnelle munis d’identifiant de vérification ARMP',
      'Bilans nationaux de renforcement des capacités par ministère, province et secteur PME'
    ],
    auditAndRiskFocus: [
      'Adéquation des plans de formation CGPMP avec les faiblesses relevées lors des audits annuels ARMP',
      'Traçabilité et authenticité des scores d’examen QCM avant délivrance du certificat officiel'
    ]
  }
};

export function getProfilePedagogicalConfig(role: UserRole): ProfilePedagogicalConfig {
  return PROFILE_PEDAGOGICAL_CONFIGS[role] || PROFILE_PEDAGOGICAL_CONFIGS.particulier;
}

/**
 * Checks whether a course belongs to the connected profile's official habilitation curriculum.
 * Full-access supervisory roles (formateur, dfat_admin) have access to all courses
 * or courses matching their role. Standard practitioner roles strictly see courses targeting their role.
 */
export function isCourseForProfile(course: CourseModule, profile: UserProfile): boolean {
  if (!profile || !profile.role) return true;
  if (profile.role === 'dfat_admin' || profile.role === 'formateur') {
    return true;
  }
  if (!course.targetAudience || course.targetAudience.length === 0) {
    return true;
  }
  return course.targetAudience.includes(profile.role);
}

/**
 * Filters a list of courses strictly according to the connected user's profile.
 */
export function filterCoursesByProfile(courses: CourseModule[], profile: UserProfile): CourseModule[] {
  return courses.filter((course) => isCourseForProfile(course, profile));
}

export interface PersonalizedLessonAdaptation {
  profileBadge: string;
  institutionHeader: string;
  directTutorAddress: string;
  roleSpecificObjective: string;
  terrainActionSteps: string[];
  vigilanceAlert: string;
  practicalCaseTitle: string;
  practicalCaseScenario: string;
  expectedDeliverable: string;
  animatedProfessorCallout: string;
}

/**
 * Generates deep, contextualized pedagogical content for a specific course and chapter
 * tailored to the connected user's profile (role, roleTitle, institution, level),
 * mirroring the personalized mentoring style of the Virtual Tutor.
 */
export function getPersonalizedLessonAdaptation(
  course: CourseModule,
  lesson: CourseLessonItem,
  lessonIndex: number,
  profile: UserProfile
): PersonalizedLessonAdaptation {
  const cfg = getProfilePedagogicalConfig(profile.role);
  const userName = profile.name || 'Praticien';
  const institution = profile.institution || cfg.shortLabel;
  const roleTitle = profile.roleTitle || cfg.shortLabel;

  // Customize based on role + course category + lesson context
  switch (profile.role) {
    case 'pme': {
      return {
        profileBadge: `Adaptation PME & Soumissionnaire • ${institution}`,
        institutionHeader: `Application directe pour ${userName} (${roleTitle} — ${institution})`,
        directTutorAddress: `En tant que ${roleTitle} au sein de ${institution}, ce chapitre « ${lesson.title} » (${course.code}) doit être lu sous l'angle de la sécurisation de votre offre et de la rentabilité de votre contrat face à l'Autorité Contractante.`,
        roleSpecificObjective: `Maximiser vos chances d'attribution régulière et protéger les intérêts financiers et juridiques de ${institution} sur le fondement de ${course.legalRef}.`,
        terrainActionSteps: [
          `Vérifier avant tout dépôt que chaque exigence de « ${lesson.title} » est couverte par une pièce justificative valide au nom de ${institution}.`,
          `Mobiliser les dispositions favorables aux PME congolaises (marge de préférence nationale Art. 46 Loi 10/010, sous-traitance Loi 17/001 ou constitution de GME) applicables à ce module.`,
          `Archiver systématiquement les accusés de réception (dépôt des plis, demandes d'éclaircissements, notifications d'ordres de service) pour préserver vos droits de recours.`
        ],
        vigilanceAlert: `Point critique PME (${institution}) : Toute omission formelle ou hors-délai sur les règles exposées dans « ${lesson.title} » entraîne le rejet automatique de votre pli ou la forclusion de votre réclamation sans possibilité de régularisation a posteriori.`,
        practicalCaseTitle: `Mise en situation PME pour ${institution} — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `${institution} prépare un dossier dans le cadre du module « ${course.title} » (${course.legalRef}). Lors de la revue finale relative à « ${lesson.title} », votre équipe identifie une clause exigeante du DAO ou du contrat. Vous devez établir la conformité immédiate de votre dossier tout en chiffrant l'impact financier réel.`,
        expectedDeliverable: `Checklist de conformité soumissionnaire validée pour ${institution} + Note de sécurisation juridique et financière (${course.code} - Ch.${lessonIndex + 1}).`,
        animatedProfessorCallout: `« Attention ${userName} (${institution}) : côté PME soumissionnaire, appliquez cette règle de "${lesson.title}" pour verrouiller la recevabilité de votre offre et sécuriser votre marge ! »`
      };
    }

    case 'cgpmp_member': {
      return {
        profileBadge: `Adaptation Cellule CGPMP • ${institution}`,
        institutionHeader: `Directives opérationnelles CGPMP pour ${userName} (${roleTitle} — ${institution})`,
        directTutorAddress: `En votre qualité de ${roleTitle} au sein de ${institution}, ce chapitre « ${lesson.title} » encadre directement votre responsabilité d'organe de passation chargé de préparer les dossiers et d'assister la Personne Responsable des Marchés (PRM).`,
        roleSpecificObjective: `Garantir la régularité procédurale de ${institution}, obtenir l'Avis de Non-Objection (ANO) de la DGCMP dès la première soumission et prévenir tout contentieux devant le CRD.`,
        terrainActionSteps: [
          `Contrôler la conformité stricte des actes produits par ${institution} dans le cadre de « ${lesson.title} » avec le PPM approuvé et les Dossiers Types de l'ARMP.`,
          `Documenter chaque étape par un procès-verbal ou rapport motivé signé par tous les membres compétents (Sous-Commission d'Analyse / Commission de Passation).`,
          `Vérifier que les délais réglementaires (publicité, éclaircissements, attente standstill) sont intégralement respectés avant transmission au contrôle a priori.`
        ],
        vigilanceAlert: `Alerte CGPMP (${institution}) : Une motivation insuffisante ou l'application d'un critère non prévu au DAO lors de « ${lesson.title} » exposera votre dossier à un refus d'ANO de la DGCMP ou à une annulation par le CRD/ARMP.`,
        practicalCaseTitle: `Dossier d'instruction CGPMP pour ${institution} — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `La CGPMP de ${institution} instruit un marché relevant de « ${course.title} ». À l'étape « ${lesson.title} », la Personne Responsable des Marchés vous demande une note technique garantissant la conformité à ${course.legalRef} avant envoi du dossier à la DGCMP.`,
        expectedDeliverable: `Projet d'acte procédural / PV conforme aux standards ARMP + Bordereau de contrôle qualité interne CGPMP pour ${institution}.`,
        animatedProfessorCallout: `« Réflexe CGPMP pour ${institution} : dans "${lesson.title}", la traçabilité écrite de vos PV et le respect des dossiers types ARMP sont la clé d'un ANO sans réserve ! »`
      };
    }

    case 'dgcmp_agent': {
      return {
        profileBadge: `Adaptation Contrôle a Priori DGCMP • ${institution}`,
        institutionHeader: `Grille d'examen de régularité DGCMP pour ${userName} (${roleTitle})`,
        directTutorAddress: `En tant que ${roleTitle} (${institution}), vous examinez les règles de « ${lesson.title} » sous l'angle du contrôle a priori de régularité avant délivrance ou refus motivé de l'Avis de Non-Objection (ANO).`,
        roleSpecificObjective: `Vérifier l'exactitude juridique, budgétaire et procédurale des dossiers soumis par les Autorités Contractantes au regard de ${course.legalRef}.`,
        terrainActionSteps: [
          `Vérifier l'inscription préalable de l'opération au PPM approuvé et l'existence d'un certificat de disponibilité budgétaire valide.`,
          `Auditer la neutralité des critères et la concordance stricte entre les règles annoncées et les conclusions du rapport soumis à l'étape « ${lesson.title} ».`,
          `Rédiger un avis motivé (ANO ou observations suspensives) dans le strict respect des délais impartis par le Décret n° 10/27.`
        ],
        vigilanceAlert: `Vigilance Contrôleur DGCMP : Ne jamais délivrer d'ANO de complaisance si « ${lesson.title} » révèle une modification des critères en cours d'analyse, un fractionnement de marché ou un gré à gré ne remplissant pas les conditions cumulatives des articles 26 à 29.`,
        practicalCaseTitle: `Instruction de demande d'ANO (${institution}) — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `Une Autorité Contractante saisit ${institution} d'une demande d'Avis de Non-Objection portant sur « ${course.title} ». En examinant la section relative à « ${lesson.title} », vous devez vérifier la régularité substantielle des pièces et statuer sur l'octroi de l'ANO.`,
        expectedDeliverable: `Fiche de contrôle de régularité a priori DGCMP + Projet de lettre d'ANO ou de rejet motivé (${course.code} - Ch.${lessonIndex + 1}).`,
        animatedProfessorCallout: `« Point de contrôle DGCMP (${userName}) : lors de l'examen de "${lesson.title}", vérifiez l'adéquation PPM/Budget et l'objectivité absolue du rapport d'analyse avant tout visa ANO ! »`
      };
    }

    case 'armp_agent': {
      return {
        profileBadge: `Adaptation Régulation & CRD ARMP • ${institution}`,
        institutionHeader: `Perspective Régulation, Contentieux CRD & Audit pour ${userName} (${roleTitle})`,
        directTutorAddress: `En votre qualité de ${roleTitle} à ${institution}, le chapitre « ${lesson.title} » constitue une norme de référence pour l'instruction des recours devant le CRD et la conduite des audits indépendants a posteriori.`,
        roleSpecificObjective: `Sanctionner les atteintes aux principes fondamentaux (liberté d'accès, égalité de traitement, transparence) et consolider la jurisprudence du CRD sur ${course.legalRef}.`,
        terrainActionSteps: [
          `Examiner la recevabilité formelle et temporelle des saisines ou constats d'audit portant sur « ${lesson.title} ».`,
          `Confronter les actes de l'Autorité Contractante et les avis de contrôle aux dispositions impératives de ${course.legalRef}.`,
          `Qualifier juridiquement les manquements éventuels et formuler les mesures correctives, injonctions de reprise ou sanctions d'exclusion.`
        ],
        vigilanceAlert: `Point de droit ARMP / CRD : Toute violation substantielle des règles de « ${lesson.title} » affectant l'égalité entre soumissionnaires ou le secret des offres justifie l'annulation de la procédure ou la correction de l'attribution par le CRD.`,
        practicalCaseTitle: `Instruction Régulation / CRD (${institution}) — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `Le Comité de Règlement des Différends ou la cellule d'audit de ${institution} est saisi d'un grief portant précisément sur l'application de « ${lesson.title} » dans le cadre de « ${course.title} ». Vous êtes chargé d'établir la note d'instruction juridique contradictoire.`,
        expectedDeliverable: `Note d'instruction juridique contradictoire ARMP/CRD + Grille de qualification des irrégularités (${course.code} - Ch.${lessonIndex + 1}).`,
        animatedProfessorCallout: `« Regard Régulateur ARMP (${userName}) : sur "${lesson.title}", contrôlez le respect des principes d'égalité et de transparence pour motiver vos décisions CRD et rapports d'audit ! »`
      };
    }

    case 'particulier': {
      return {
        profileBadge: `Adaptation Consultant & Expert • ${institution}`,
        institutionHeader: `Guide d'Ingénierie & Conseil pour ${userName} (${roleTitle} — ${institution})`,
        directTutorAddress: `En tant que ${roleTitle} (${institution}), votre maîtrise de « ${lesson.title} » est déterminante tant pour remporter des missions de prestations intellectuelles (AMI/DP) que pour sécuriser les dossiers de vos clients publics ou privés.`,
        roleSpecificObjective: `Produire une expertise technique et méthodologique irréprochable conforme à ${course.legalRef} et aux standards internationaux.`,
        terrainActionSteps: [
          `Intégrer les exigences normatives de « ${lesson.title} » dans votre méthodologie d'intervention et vos livrables d'expertise.`,
          `Vérifier l'absence de toute situation de conflit d'intérêts entre vos missions d'études/TDR et l'exécution des marchés subséquents.`,
          `Structurer vos recommandations avec les références exactes (${course.legalRef}) pour sécuriser la prise de décision de votre commanditaire.`
        ],
        vigilanceAlert: `Conseil Expert (${institution}) : Lors d'une mission de conseil ou d'évaluation portant sur « ${lesson.title} », toute approximation sur les seuils, délais ou formules de pondération engage votre crédibilité professionnelle.`,
        practicalCaseTitle: `Mission d'Expertise & Conseil (${institution}) — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `Mandaté comme ${roleTitle} (${institution}) sur un dossier relevant de « ${course.title} », vous devez rédiger une note méthodologique et opérationnelle appliquant les règles de « ${lesson.title} » à un cas concret de passation ou d'audit.`,
        expectedDeliverable: `Note méthodologique d'expert + Matrice de conformité réglementaire (${course.code} - Ch.${lessonIndex + 1}).`,
        animatedProfessorCallout: `« Conseil d'Expert pour ${userName} : intégrez les règles de "${lesson.title}" dans vos propositions techniques et notes d'audit pour démontrer une maîtrise parfaite de la Loi 10/010 ! »`
      };
    }

    default: {
      return {
        profileBadge: `Adaptation Formateur & Supervision DFAT • ${institution}`,
        institutionHeader: `Référentiel Pédagogique & Méthodologique pour ${userName} (${roleTitle})`,
        directTutorAddress: `En votre qualité de ${roleTitle} (${institution}), ce chapitre « ${lesson.title} » structure les compétences clés à transmettre et à évaluer lors des sessions d'habilitation nationale.`,
        roleSpecificObjective: `Assurer l'appropriation opérationnelle de ${course.legalRef} par l'ensemble des acteurs de la chaîne de passation, de contrôle et de régulation.`,
        terrainActionSteps: [
          `Mettre en évidence la répartition des rôles (CGPMP, DGCMP, ARMP, PME) autour de « ${lesson.title} ».`,
          `Illustrer chaque règle par un cas jurisprudentiel concret du CRD et les erreurs fréquentes relevées en audit.`,
          `Vérifier la maîtrise des délais, seuils et pièces obligatoires avant validation certificative.`
        ],
        vigilanceAlert: `Exigence DFAT (${institution}) : Veiller à ce que les praticiens distinguent rigoureusement le contrôle a priori de régularité (DGCMP) et la régulation/contentieux (ARMP) dans l'application de « ${lesson.title} ».`,
        practicalCaseTitle: `Scénario d'Évaluation Certificative (${institution}) — Chapitre ${lessonIndex + 1}`,
        practicalCaseScenario: `Dans le cadre de la supervision pédagogique de « ${course.title} », vous préparez une étude de cas transversale sur « ${lesson.title} » confrontant le point de vue d'une CGPMP, d'un contrôleur DGCMP et d'un soumissionnaire PME.`,
        expectedDeliverable: `Corrigé-type multi-acteurs + Grille d'évaluation officielle DFAT-ARMP (${course.code} - Ch.${lessonIndex + 1}).`,
        animatedProfessorCallout: `« Synthèse DFAT-ARMP (${userName}) : ce chapitre "${lesson.title}" articule les obligations croisées de la CGPMP, de la DGCMP, de l'ARMP et des opérateurs économiques ! »`
      };
    }
  }
}
