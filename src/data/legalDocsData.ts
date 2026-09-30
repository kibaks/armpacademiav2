import { LegalDocument } from '../types';

export const LEGAL_DOCS_DATA: LegalDocument[] = [
  {
    id: 'DOC-001',
    title: 'Loi n° 10/010 relative aux marchés publics',
    type: 'Loi',
    category: 'Loi & Décrets',
    reference: 'Journal Officiel RDC - Numéro Spécial du 27 avril 2010',
    promulgationDate: '27 Avril 2010',
    publicationDate: '27 Avril 2010',
    source: 'Portail Officiel ARMP RDC (armp-rdc.org)',
    summary: 'Texte fondateur de la commande publique en République Démocratique du Congo. Fixe les principes directeurs, l’organisation institutionnelle (ARMP, DGCMP, CGPMP), les modes de passation, le contrôle et le contentieux.',
    articlesCount: 94,
    downloadUrl: '#loi-10-010',
    tags: ['Fondamental', 'Loi', 'PPM', 'DAO', 'ARMP', 'DGCMP', 'CRD'],
    articles: [
      {
        number: 'Article 1er',
        title: 'Objet et champ d’application de la Loi',
        content: 'La présente loi fixe les règles régissant la passation, l’exécution et le contrôle des marchés publics passés par l’État, les provinces, les entités territoriales décentralisées, les établissements publics et les entreprises publiques.'
      },
      {
        number: 'Article 3',
        title: 'Principes fondamentaux de la commande publique',
        content: 'Les marchés publics et les délégations de service public sont soumis aux principes fondamentaux suivants :\n1. La liberté d’accès à la commande publique ;\n2. L’égalité de traitement des candidats ;\n3. La transparence des procédures ;\n4. L’économie et l’efficacité de la commande publique.'
      },
      {
        number: 'Article 14',
        title: 'Plan de Passation des Marchés (PPM) & Obligation de publication',
        content: 'Toute autorité contractante est tenue d’élaborer et de publier un plan de passation des marchés (PPM) avant le début de chaque exercice budgétaire. Tout marché passé en dehors d’une inscription préalable au PPM est nul de plein droit.'
      },
      {
        number: 'Article 29',
        title: 'Appel d’offres ouvert comme mode de passation de principe',
        content: 'La passation des marchés publics se fait par la voie de l’appel d’offres ouvert, national ou international. Le recours à tout autre mode de passation est exceptionnel et soumis à autorisation préalable de la Direction Générale du Contrôle des Marchés Publics (DGCMP).'
      },
      {
        number: 'Article 42',
        title: 'Conditions strictes de recours au marché de gré à gré',
        content: 'Le marché de gré à gré ne peut être conclu qu’à titre dérogatoire et exceptionnel, après avis de non-objection (ANO) de la DGCMP, dans les cas de secret de défense nationale, de détention d’un droit d’exclusivité technologique ou d’extrême urgence imprévisible.'
      },
      {
        number: 'Articles 77-79',
        title: 'Recours non juridictionnels & Saisine du CRD / ARMP',
        content: 'Tout candidat ou soumissionnaire s’estimant lésé peut introduire un recours gracieux préalable devant l’autorité contractante dans un délai de 5 jours ouvrables. En cas de rejet ou de silence, le candidat peut saisir le Comité de Règlement des Différends (CRD) de l’ARMP, dont la décision est suspensive.'
      }
    ]
  },
  {
    id: 'DOC-002',
    title: 'Décret n° 10/22 portant Manuel des procédures de la commande publique',
    type: 'Décret',
    category: 'Guides & Manuels',
    reference: 'Décret du Premier Ministre n° 10/22 du 02 juin 2010',
    promulgationDate: '02 Juin 2010',
    publicationDate: '02 Juin 2010',
    source: 'ARMP RDC',
    summary: 'Guide opérationnel et standardisé détaillant chaque étape de la passation, du montage des dossiers d’appel d’offres, des séances d’ouverture des plis et de la gestion des cautions.',
    articlesCount: 160,
    downloadUrl: '#manuel-procedures',
    tags: ['Manuel', 'Procédures', 'CGPMP', 'Passation', 'Pratique'],
    articles: [
      {
        number: 'Section 2.1',
        title: 'Fonctionnement de la Commission d’ouverture des plis',
        content: 'L’ouverture des plis est publique. La présence des soumissionnaires ou de leurs représentants dûment mandatés est garantie. Le président de séance donne lecture à haute voix des montants des offres et de la présence des cautions de soumission.'
      },
      {
        number: 'Section 4.3',
        title: 'Évaluation technique & Critères éliminatoires',
        content: 'La sous-commission d’évaluation vérifie la conformité substantielle de l’offre. Aucun critère non mentionné expressément dans le DAO ne peut être utilisé pour éliminer une soumission.'
      }
    ]
  },
  {
    id: 'DOC-003',
    title: 'Décret n° 10/21 portant création, organisation et fonctionnement de l’ARMP',
    type: 'Décret',
    category: 'Régulation',
    reference: 'Décret n° 10/21 du 02 juin 2010',
    promulgationDate: '02 Juin 2010',
    publicationDate: '02 Juin 2010',
    source: 'Présidence / Primature RDC',
    summary: 'Définit les missions régaliennes de l’Autorité de Régulation des Marchés Publics : régulation, formation continue, audits indépendants a posteriori et fonctionnement du Comité de Règlement des Différends (CRD).',
    articlesCount: 38,
    downloadUrl: '#decret-armp',
    tags: ['Régulation', 'ARMP', 'CRD', 'Contentieux', 'Formation'],
    articles: [
      {
        number: 'Article 4',
        title: 'Missions de régulation et de formation de la DFAT',
        content: 'L’ARMP assure la formation continue et le renforcement des capacités des agents publics et des acteurs du secteur privé à travers sa Direction de la Formation et de l’Appui Technique (DFAT).'
      }
    ]
  },
  {
    id: 'DOC-004',
    title: 'Décret n° 10/23 portant création, organisation et fonctionnement de la DGCMP',
    type: 'Décret',
    category: 'Régulation',
    reference: 'Décret n° 10/23 du 02 juin 2010',
    promulgationDate: '02 Juin 2010',
    publicationDate: '02 Juin 2010',
    source: 'Ministère du Budget & Finances',
    summary: 'Attributions de la Direction Générale du Contrôle des Marchés Publics : contrôle a priori obligatoire, validation des seuils, examen des DAO et délivrance des avis de non-objection (ANO).',
    articlesCount: 26,
    downloadUrl: '#decret-dgcmp',
    tags: ['Contrôle', 'DGCMP', 'ANO', 'Seuils', 'Gré à gré'],
    articles: [
      {
        number: 'Article 2',
        title: 'Portée du contrôle a priori et Avis de Non-Objection',
        content: 'La DGCMP est seule compétente pour émettre les avis de non-objection préalables sur les plans de passation, les dossiers d’appel d’offres et les propositions d’attribution provisoire dépassant les seuils fixés.'
      }
    ]
  },
  {
    id: 'DOC-005',
    title: 'Dossier d’Appel d’Offres Type pour la Passation des Marchés de Travaux (DAO Type ARMP)',
    type: 'DAO Type',
    category: 'Modèles DAO',
    reference: 'Norme officielle ARMP-RDC / Standard Travaux 2024',
    promulgationDate: 'Actualisé 2024',
    publicationDate: 'Janvier 2024',
    source: 'Direction de la Régulation ARMP',
    summary: 'Canevas standard obligatoire pour toute passation de travaux publics en RDC : clauses administratives (CCAG/CCAP), instructions aux candidats, garanties de bonne fin et d’avance de démarrage.',
    articlesCount: 12,
    downloadUrl: '#dao-travaux',
    tags: ['DAO', 'Travaux', 'Canevas', 'CGPMP'],
    articles: [
      {
        number: 'Partie 1 - IC',
        title: 'Instructions aux Candidats et Droit d’Éligibilité',
        content: 'Conditions de nationalité, exclusion des entreprises sanctionnées par l’ARMP ou inscrites sur la liste rouge des bailleurs internationaux.'
      }
    ]
  },
  {
    id: 'DOC-006',
    title: 'Dossier Type pour Fournitures et Services Connexes',
    type: 'DAO Type',
    category: 'Modèles DAO',
    reference: 'Standard ARMP Fournitures RDC',
    promulgationDate: 'Actualisé 2024',
    publicationDate: 'Janvier 2024',
    source: 'Portail ARMP RDC',
    summary: 'Modèle réglementaire pour la commande de fournitures de bureau, matériel informatique, véhicules, équipements hospitaliers et scolaires.',
    articlesCount: 10,
    downloadUrl: '#dao-fournitures',
    tags: ['Fournitures', 'DAO Type', 'Bordereau des prix']
  },
  {
    id: 'DOC-007',
    title: 'Guide d’Élaboration et de Transmission du Plan de Passation des Marchés (PPM)',
    type: 'Guide Pratique',
    category: 'Guides & Manuels',
    reference: 'Guide Méthodologique ARMP / DGCMP',
    promulgationDate: 'Janvier 2023',
    publicationDate: 'Janvier 2023',
    source: 'Direction de la Formation et de l’Appui Technique (DFAT)',
    summary: 'Instructions précises aux cellules CGPMP pour formaliser les calendriers prévisionnels, le chiffrage estimatif, la codification des lots et la validation sur la plateforme e-Procurement.',
    articlesCount: 8,
    downloadUrl: '#guide-ppm',
    tags: ['PPM', 'Planification', 'Budget', 'DFAT']
  }
];

export const LEGAL_DOCS = LEGAL_DOCS_DATA;
