import React from 'react';

export type ContextualSceneType =
  | 'justice_principles'
  | 'institutions_separation'
  | 'works_thresholds'
  | 'dao_allotment'
  | 'sealed_bids_ano'
  | 'litigation_audit_digital';

export type RealisticCardAnimationId =
  | 'citizen_impact_law'
  | 'open_competition_access'
  | 'scale_justice'
  | 'transparency_traceability'
  | 'legal_codex'
  | 'ministry_cgpmp'
  | 'dgcmp_shield'
  | 'armp_tower'
  | 'construction_crane'
  | 'supply_truck'
  | 'intellectual_compass'
  | 'threshold_gauge'
  | 'dao_calendar'
  | 'allotment_puzzle'
  | 'sealed_ballot_ano'
  | 'bank_guarantee_vault'
  | 'gavel_tribunal'
  | 'audit_scanner'
  | 'sigmap_server';

export interface SingleScreenCardData {
  screenNumber: number; // 1..5
  shortTabLabel: string;
  categoryTag: string;
  title: string;
  explanation: string;
  fieldRule: string;
  fieldLeadIn: string;
  fieldBoxTitle: string;
  fieldBannerSubtitle: string;
  legalArticle: string;
  metricLabel: string;
  metricVal: number;
  accentColor: string;
  animationId: RealisticCardAnimationId;
  animationCaption: string;
  spokenText: string;
  explanationStartRatio: number;
  fieldRuleStartRatio: number;
}

export const PEDAGOGICAL_TRANSITION_VARIATIONS: Array<{
  spokenLeadIn: string;
  boxTitle: string;
  bannerSubtitle: string;
}> = [
  {
    spokenLeadIn: 'Dans votre quotidien professionnel, gardez bien à l’esprit ce repère,',
    boxTitle: '💡 DANS VOTRE QUOTIDIEN PROFESSIONNEL',
    bannerSubtitle: '🎙️ REPÈRE POUR VOTRE QUOTIDIEN PROFESSIONNEL…'
  },
  {
    spokenLeadIn: 'Retenez avec soin ce repère essentiel,',
    boxTitle: '✨ REPÈRE ESSENTIEL À RETENIR',
    bannerSubtitle: '🎙️ REPÈRE ESSENTIEL À GARDER À L’ESPRIT…'
  },
  {
    spokenLeadIn: 'Concrètement, lorsque vous préparez vos dossiers,',
    boxTitle: '📋 CONCRÈTEMENT POUR VOS DOSSIERS',
    bannerSubtitle: '🎙️ MISE EN ŒUVRE CONCRÈTE DANS VOS DOSSIERS…'
  },
  {
    spokenLeadIn: 'Voici le bon réflexe professionnel à cultiver,',
    boxTitle: '🧭 LE BON RÉFLEXE À ADOPTER',
    bannerSubtitle: '🎙️ LE BON RÉFLEXE PROFESSIONNEL À ADOPTER…'
  },
  {
    spokenLeadIn: 'Mon conseil de vigilance pour vous accompagner,',
    boxTitle: '🛡️ CONSEIL DE VIGILANCE',
    bannerSubtitle: '🎙️ CONSEIL DE VIGILANCE ET DE SÉRÉNITÉ…'
  },
  {
    spokenLeadIn: 'Pour sécuriser sereinement votre démarche,',
    boxTitle: '⚖️ POUR SÉCURISER VOTRE DÉMARCHE',
    bannerSubtitle: '🎙️ SÉCURISATION JURIDIQUE DE VOTRE DÉMARCHE…'
  },
  {
    spokenLeadIn: 'Ce que je vous invite toujours à privilégier,',
    boxTitle: '🌟 CE QU’IL CONVIENT DE PRIVILÉGIER',
    bannerSubtitle: '🎙️ ORIENTATION MÉTHODOLOGIQUE À PRIVILÉGIER…'
  },
  {
    spokenLeadIn: 'Au cœur de votre mission au service du citoyen,',
    boxTitle: '🤝 AU CŒUR DE VOTRE MISSION',
    bannerSubtitle: '🎙️ L’ESPRIT DE RESPONSABILITÉ DE VOTRE MISSION…'
  },
  {
    spokenLeadIn: 'Pour conduire une procédure apaisée et conforme,',
    boxTitle: '🔑 LA CLÉ D’UNE PROCÉDURE SEREINE',
    bannerSubtitle: '🎙️ LA CLÉ D’UNE PROCÉDURE APAISÉE ET CONFORME…'
  },
  {
    spokenLeadIn: 'Lorsque vous accompagnez vos équipes en situation réelle,',
    boxTitle: '🏛️ EN SITUATION RÉELLE',
    bannerSubtitle: '🎙️ TRANSPOSITION DIRECTE EN SITUATION RÉELLE…'
  },
  {
    spokenLeadIn: 'Dans cet esprit de responsabilité et d’éthique,',
    boxTitle: '🎓 L’ATTITUDE PROFESSIONNELLE ATTENDUE',
    bannerSubtitle: '🎙️ POSTURE ÉTHIQUE ET PROFESSIONNELLE…'
  },
  {
    spokenLeadIn: 'Afin de protéger durablement l’intérêt général,',
    boxTitle: '🌱 POUR PROTÉGER L’INTÉRÊT GÉNÉRAL',
    bannerSubtitle: '🎙️ PROTECTION CONCRÈTE DE L’INTÉRÊT CITOYEN…'
  },
  {
    spokenLeadIn: 'Portez une attention toute particulière à ce point,',
    boxTitle: '🔍 POINT D’ATTENTION MAJEUR',
    bannerSubtitle: '🎙️ POINT D’ATTENTION POUR VOS ÉQUIPES…'
  },
  {
    spokenLeadIn: 'Dans la conduite calme et rigoureuse de vos opérations,',
    boxTitle: '📐 DANS LA CONDUITE DE VOS OPÉRATIONS',
    bannerSubtitle: '🎙️ BONNE CONDUITE DE VOS OPÉRATIONS…'
  },
  {
    spokenLeadIn: 'Voici la règle de sagesse que je vous recommande,',
    boxTitle: '📖 LA RÈGLE DE SAGESSE À SUIVRE',
    bannerSubtitle: '🎙️ RÈGLE DE SAGESSE ET DE BONNE GOUVERNANCE…'
  }
];

export interface ProfessorSceneData {
  sceneType: ContextualSceneType;
  sceneBadge: string;
  professorHook: string;
  lessonTitle: string;
  courseCode: string;
  screens: SingleScreenCardData[];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['—'];
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) {
        const rest = [current, ...words.slice(i + 1)].join(' ');
        lines.push(
          rest.length > maxCharsPerLine ? rest.slice(0, maxCharsPerLine - 1).trim() + '…' : rest
        );
        return lines;
      }
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export function cleanPedagogicalClause(raw: string): string {
  return (raw || '')
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/^[\d.\-*•)\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateClean(text: string, maxLen: number): string {
  const clean = cleanPedagogicalClause(text);
  if (clean.length <= maxLen) return clean;
  const sub = clean.slice(0, maxLen - 1);
  const lastSpace = sub.lastIndexOf(' ');
  const cut = (lastSpace > maxLen * 0.6 ? sub.slice(0, lastSpace) : sub).replace(/[.,;:\s]+$/, '');
  return cut + '.';
}

export function extractShortHeading(clause: string, fallback: string): string {
  const clean = cleanPedagogicalClause(clause);
  if (!clean) return fallback;
  const colonIdx = clean.indexOf(':');
  if (colonIdx > 4 && colonIdx <= 42) {
    return clean.slice(0, colonIdx).trim();
  }
  const words = clean.split(' ').filter(Boolean);
  const picked = words.slice(0, 4).join(' ').replace(/[.,;:!?]+$/, '');
  return picked.length > 32 ? picked.slice(0, 31).trim() : picked || fallback;
}

export function detectContextualSceneType(
  lessonTitle: string,
  lessonContent: string,
  courseCode: string,
  lessonIndex: number
): { sceneType: ContextualSceneType; sceneBadge: string; professorHook: string } {
  const hay = `${lessonTitle} ${lessonContent} ${courseCode}`.toLowerCase();

  if (
    hay.includes('cgpmp') ||
    hay.includes('dgcmp') ||
    hay.includes('armp') ||
    hay.includes('institution') ||
    hay.includes('séparation') ||
    hay.includes('acteur')
  ) {
    return {
      sceneType: 'institutions_separation',
      sceneBadge: 'ÉTHIQUE INSTITUTIONNELLE & SERVICE PUBLIC',
      professorHook:
        'Découvrons comment les femmes et les hommes de la CGPMP, de la DGCMP et de l’ARMP protègent ensemble l’intérêt des citoyens.'
    };
  }

  if (
    hay.includes('travaux') ||
    hay.includes('fourniture') ||
    hay.includes('prestation') ||
    hay.includes('intellectuel') ||
    hay.includes('seuil') ||
    hay.includes('typologie')
  ) {
    return {
      sceneType: 'works_thresholds',
      sceneBadge: 'OUVRAGES PUBLICS, ÉQUIPEMENTS & SEUILS LÉGAUX',
      professorHook:
        'Voyons comment chaque catégorie de marché répond concrètement aux besoins vitaux des écoles, des hôpitaux et des infrastructures.'
    };
  }

  if (
    hay.includes('dao') ||
    hay.includes('dossier d’appel') ||
    hay.includes("dossier d'appel") ||
    hay.includes('allotissement') ||
    hay.includes('ppm') ||
    hay.includes('plan de passation') ||
    hay.includes('sous-traitance') ||
    hay.includes('pme')
  ) {
    return {
      sceneType: 'dao_allotment',
      sceneBadge: 'PLANIFICATION HUMAINE, DAO ÉQUITABLE & PME LOCALES',
      professorHook:
        'Apprenons à planifier avec rigueur et à ouvrir la commande publique aux PME et artisans congolais créateurs d’emplois.'
    };
  }

  if (
    hay.includes('pli') ||
    hay.includes('ano') ||
    hay.includes('non-objection') ||
    hay.includes('ouverture') ||
    hay.includes('attribution') ||
    hay.includes('gré à gré') ||
    hay.includes('garantie') ||
    hay.includes('avenant')
  ) {
    return {
      sceneType: 'sealed_bids_ano',
      sceneBadge: 'TRANSPARENCE DES PLIS, VISA ANO & BONNE EXÉCUTION',
      professorHook:
        'Suivons pas à pas la protection de la confiance publique, de l’ouverture transparente des offres jusqu’à la livraison finale de l’ouvrage.'
    };
  }

  if (
    hay.includes('recours') ||
    hay.includes('contentieux') ||
    hay.includes('crd') ||
    hay.includes('audit') ||
    hay.includes('sanction') ||
    hay.includes('sigmap') ||
    hay.includes('dématérialisation')
  ) {
    return {
      sceneType: 'litigation_audit_digital',
      sceneBadge: 'JUSTICE DU CRD, INTÉGRITÉ & TRANSPARENCE CITOYENNE',
      professorHook:
        'Explorons comment le droit au recours équitable, l’audit de terrain et le numérique garantissent une commande publique digne de confiance.'
    };
  }

  return {
    sceneType: 'justice_principles',
    sceneBadge: 'HUMANISME, ÉQUITÉ & PRINCIPES DE LA LOI 10/010',
    professorHook:
      'Commençons par comprendre pourquoi chaque règle de la Loi n° 10/010 est avant tout un bouclier au service du citoyen congolais.'
  };
}

const ANIMATION_CATALOG: Record<
  RealisticCardAnimationId,
  {
    caption: string;
    tag: string;
    color: string;
    contextualRule: string;
    metricLabel: string;
  }
> = {
  citizen_impact_law: {
    caption: 'Impact Citoyen : Deniers Publics transformés en Écoles, Hôpitaux & Routes',
    tag: 'FINALITÉ HUMAINE • INTÉRÊT GÉNÉRAL & LOI 10/010',
    color: '#059669',
    contextualRule:
      'Protéger chaque franc public comme une ressource sacrée destinée au bien-être direct des citoyens.',
    metricLabel: 'Impact Social & Intérêt Général'
  },
  open_competition_access: {
    caption: 'Liberté d’Accès & Avis Public Ouvert à Tous les Entrepreneurs',
    tag: 'OUVERTURE • LIBERTÉ D’ACCÈS À LA COMMANDE PUBLIQUE',
    color: '#2563EB',
    contextualRule:
      'Publier largement chaque opportunité et rédiger un cahier des charges neutre ouvert à toutes les compétences.',
    metricLabel: 'Ouverture & Libre Accès'
  },
  scale_justice: {
    caption: 'Balance d’Égalité de Traitement & Neutralité Absolue du Jury',
    tag: 'ÉQUITÉ • ÉGALITÉ DE TRAITEMENT DES CANDIDATS',
    color: '#2563EB',
    contextualRule:
      'Évaluer chaque soumissionnaire avec la même bienveillance objective et les mêmes critères connus d’avance.',
    metricLabel: 'Équité & Impartialité'
  },
  transparency_traceability: {
    caption: 'Registre Ouvert de Transparence, Procès-Verbaux & Motivation des Décisions',
    tag: 'CLARTÉ • TRANSPARENCE & TRAÇABILITÉ ÉCRITE',
    color: '#0284C7',
    contextualRule:
      'Expliquer loyalement à chaque candidat non retenu les motifs précis de la décision et archiver chaque PV.',
    metricLabel: 'Transparence & Redevabilité'
  },
  legal_codex: {
    caption: 'Socle Juridique de la Loi n° 10/010, Dossiers Types & Conformité',
    tag: 'CADRE LÉGAL • RESPECT DES TEXTES & DÉLAIS',
    color: '#059669',
    contextualRule:
      'S’appuyer fidèlement sur les Dossiers Types homologués par l’ARMP pour sécuriser juridiquement chaque étape.',
    metricLabel: 'Sécurité Juridique Loi 10/010'
  },
  ministry_cgpmp: {
    caption: 'Équipe Humaine CGPMP : Concertation Technique & Préparation des Dossiers',
    tag: 'GESTION • CELLULE CGPMP & MAÎTRE D’OUVRAGE',
    color: '#2563EB',
    contextualRule:
      'Travailler en synergie humaine entre ingénieurs métiers, financiers et experts CGPMP dès l’expression du besoin.',
    metricLabel: 'Qualité du Travail CGPMP'
  },
  dgcmp_shield: {
    caption: 'Examen Préventif DGCMP & Délivrance du Visa de Non-Objection (ANO)',
    tag: 'CONTRÔLE A PRIORI • PROTECTION DGCMP & ANO',
    color: '#059669',
    contextualRule:
      'Considérer la revue a priori de la DGCMP comme un garde-fou bienveillant qui sécurise l’Autorité Contractante.',
    metricLabel: 'Conformité Contrôle DGCMP'
  },
  armp_tower: {
    caption: 'Régulation ARMP, Formation Continue des Acteurs & Veille Normative',
    tag: 'RÉGULATION • ACCOMPAGNEMENT & NORMES ARMP',
    color: '#D97706',
    contextualRule:
      'Cultiver la formation continue des praticiens et appliquer les directives de l’ARMP pour élever la qualité publique.',
    metricLabel: 'Excellence Normative ARMP'
  },
  construction_crane: {
    caption: 'Chantier d’Ouvrage Public (École, Route, Pont) & Contrôle de Solidité',
    tag: 'INFRASTRUCTURES • MARCHÉS DE TRAVAUX PUBLICS',
    color: '#2563EB',
    contextualRule:
      'Veiller sur le chantier à la sécurité des travailleurs, à la qualité des matériaux et à la durabilité de l’ouvrage.',
    metricLabel: 'Solidité & Qualité des Ouvrages'
  },
  supply_truck: {
    caption: 'Acheminement de Médicaments, Bancs Scolaires & Équipements aux Populations',
    tag: 'LOGISTIQUE • MARCHÉS DE FOURNITURES & BIENS',
    color: '#059669',
    contextualRule:
      'Vérifier scrupuleusement que chaque équipement ou médicament livré correspond à la qualité promise aux usagers.',
    metricLabel: 'Qualité des Fournitures Livrées'
  },
  intellectual_compass: {
    caption: 'Expertise Humaine, Bureaux d’Études & Sélection Qualité-Coût sur TDR',
    tag: 'SAVOIR-FAIRE • PRESTATIONS INTELLECTUELLES',
    color: '#7C3AED',
    contextualRule:
      'Privilégier la compétence méthodologique et l’expérience humaine des experts lors de l’évaluation des études.',
    metricLabel: 'Pertinence des Études & TDR'
  },
  threshold_gauge: {
    caption: 'Agrégation des Besoins Annuels, Seuils Financiers & Anti-Fractionnement',
    tag: 'RIGUEUR • SEUILS LÉGAUX & ÉCONOMIE D’ÉCHELLE',
    color: '#D97706',
    contextualRule:
      'Regrouper les achats annuels homogènes pour obtenir de meilleurs prix publics sans jamais saucissonner le besoin.',
    metricLabel: 'Respect des Seuils & Économie'
  },
  dao_calendar: {
    caption: 'Planification Annuelle PPM sur 12 Mois & Prévisibilité Budgétaire',
    tag: 'ANTICIPATION • PLAN DE PASSATION (PPM)',
    color: '#2563EB',
    contextualRule:
      'Publier le PPM à temps pour donner à toutes les entreprises la visibilité nécessaire pour préparer des offres sérieuses.',
    metricLabel: 'Fiabilité du Calendrier PPM'
  },
  allotment_puzzle: {
    caption: 'Allotissement Équitable & Accès des PME et Artisans Congolais (Loi 17/001)',
    tag: 'INCLUSION ÉCONOMIQUE • PME LOCALES & EMPLOIS',
    color: '#D97706',
    contextualRule:
      'Structurer des lots adaptés aux capacités des PME congolaises afin de créer des emplois durables dans nos provinces.',
    metricLabel: 'Inclusion des PME Nationales'
  },
  sealed_ballot_ano: {
    caption: 'Séance Publique d’Ouverture des Plis, Horodatage & Lecture à Haute Voix',
    tag: 'CONFIANCE PUBLIQUE • OUVERTURE DES PLIS & STANDSTILL',
    color: '#E11D48',
    contextualRule:
      'Accueillir chaque soumissionnaire avec respect lors de l’ouverture publique et lire les montants en toute clarté.',
    metricLabel: 'Intégrité de l’Ouverture des Plis'
  },
  bank_guarantee_vault: {
    caption: 'Garanties Bancaires, Paiement Juste des Décomptes & Encadrement des Avenants',
    tag: 'ÉQUILIBRE CONTRACTUEL • GARANTIES & PAIEMENTS',
    color: '#7C3AED',
    contextualRule:
      'Protéger l’État par des garanties fiables tout en payant à temps l’entreprise qui exécute loyalement ses prestations.',
    metricLabel: 'Sécurité Financière & Exécution'
  },
  gavel_tribunal: {
    caption: 'Écoute du Recours Gracieux, Effet Suspensif & Arbitrage Équitable du CRD',
    tag: 'JUSTICE • DROIT AU RECOURS & ARBITRAGE CRD',
    color: '#2563EB',
    contextualRule:
      'Respecter le délai de standstill et traiter chaque recours avec écoute, impartialité et respect du contradictoire.',
    metricLabel: 'Respect du Droit au Recours'
  },
  audit_scanner: {
    caption: 'Vérification de Terrain par l’Auditeur, Éthique & Tolérance Zéro Corruption',
    tag: 'PROBITÉ • AUDIT DE TERRAIN & DÉONTOLOGIE',
    color: '#E11D48',
    contextualRule:
      'Prévenir tout conflit d’intérêts et vérifier sur place que chaque ouvrage payé sert réellement la communauté.',
    metricLabel: 'Éthique & Matérialité Physique'
  },
  sigmap_server: {
    caption: 'Portail E-Procurement SIGMAP, Coffre-Fort Chiffré & Contrôle Citoyen OCDS',
    tag: 'INNOVATION • DÉMATÉRIALISATION SIGMAP & OPEN DATA',
    color: '#059669',
    contextualRule:
      'Allier la sécurité cryptographique du SIGMAP à l’ouverture des données publiques pour renforcer la confiance citoyenne.',
    metricLabel: 'Traçabilité Numérique & Citoyenne'
  }
};

export function getAnimationSequenceForTheme(
  sceneType: ContextualSceneType
): Array<{ id: RealisticCardAnimationId; caption: string; tag: string; color: string }> {
  const themeOrder: Record<ContextualSceneType, RealisticCardAnimationId[]> = {
    justice_principles: [
      'citizen_impact_law',
      'open_competition_access',
      'scale_justice',
      'transparency_traceability',
      'threshold_gauge'
    ],
    institutions_separation: [
      'scale_justice',
      'ministry_cgpmp',
      'dgcmp_shield',
      'armp_tower',
      'citizen_impact_law'
    ],
    works_thresholds: [
      'construction_crane',
      'supply_truck',
      'intellectual_compass',
      'threshold_gauge',
      'allotment_puzzle'
    ],
    dao_allotment: [
      'dao_calendar',
      'legal_codex',
      'open_competition_access',
      'allotment_puzzle',
      'citizen_impact_law'
    ],
    sealed_bids_ano: [
      'sealed_ballot_ano',
      'scale_justice',
      'dgcmp_shield',
      'bank_guarantee_vault',
      'construction_crane'
    ],
    litigation_audit_digital: [
      'gavel_tribunal',
      'audit_scanner',
      'armp_tower',
      'sigmap_server',
      'citizen_impact_law'
    ]
  };
  const ids = themeOrder[sceneType] || themeOrder.justice_principles;
  return ids.map((id) => ({
    id,
    caption: `Illustration cohérente : ${ANIMATION_CATALOG[id].caption}`,
    tag: ANIMATION_CATALOG[id].tag,
    color: ANIMATION_CATALOG[id].color
  }));
}

/**
 * High-precision semantic matcher that prioritizes the card's title and core theme
 * so the SVG illustration on the left is ALWAYS 100% coherent with the explanation on the right!
 */
function pickCoherentAnimationForCard(
  visualTitle: string,
  explanationBody: string,
  explicitSceneId: RealisticCardAnimationId | null,
  fallbackId: RealisticCardAnimationId
): RealisticCardAnimationId {
  if (explicitSceneId && ANIMATION_CATALOG[explicitSceneId]) {
    return explicitSceneId;
  }

  const titleLow = visualTitle.toLowerCase();
  const bodyLow = explanationBody.toLowerCase();

  // Score each animation ID with 3x weight on the visual title and 1x weight on the explanation body
  const rules: Array<{ id: RealisticCardAnimationId; titleKeywords: string[]; bodyKeywords: string[] }> = [
    {
      id: 'citizen_impact_law',
      titleKeywords: ['deniers publics', 'champ d’application', "champ d'application", 'citoyen', 'social', 'intérêt général', 'économie', 'synergie', 'professionnalisation'],
      bodyKeywords: ['école', 'hôpital', 'maternité', 'citoyen', 'population', 'communauté', 'deniers publics', 'intérêt général']
    },
    {
      id: 'open_competition_access',
      titleKeywords: ['liberté d’accès', "liberté d'accès", 'ouverture concurrentielle', 'appel d’offres ouvert', "appel d'offres ouvert", 'neutralité absolue', 'téléchargement', 'publicité'],
      bodyKeywords: ['liberté d’accès', 'sans entrave', 'marque commerciale', 'ou équivalent', 'accès instantané', 'tous les candidats']
    },
    {
      id: 'scale_justice',
      titleKeywords: ['égalité de traitement', 'neutralité d’évaluation', 'incompatibilité', 'objectivité', 'comparaison', 'classement', 'marge de préférence'],
      bodyKeywords: ['égalité de traitement', 'règles identiques', 'sans préférence', 'impartial', 'moins-disant', 'équitable']
    },
    {
      id: 'transparency_traceability',
      titleKeywords: ['transparence', 'traçabilité', 'information des candidats', 'publication proactive', 'archivage', 'piste d’audit'],
      bodyKeywords: ['motifs de rejet', 'procès-verbal', 'documenter par écrit', 'transparence', 'candidats évincés', 'archives']
    },
    {
      id: 'threshold_gauge',
      titleKeywords: ['seuil', 'fractionnement', 'saucissonnage', 'agrégation', 'économie'],
      bodyKeywords: ['seuil', 'fractionner', 'découper artificiellement', 'cotation', 'valeur cumulée']
    },
    {
      id: 'ministry_cgpmp',
      titleKeywords: ['cgpmp', 'autorité contractante', 'recensement', 'besoins', 'commission'],
      bodyKeywords: ['cellule de gestion', 'cgpmp', 'expression des besoins', 'maître d’ouvrage']
    },
    {
      id: 'dgcmp_shield',
      titleKeywords: ['dgcmp', 'non-objection', 'ano', 'contrôle a priori', 'autorisation préalable', 'disponibilité effective des crédits'],
      bodyKeywords: ['dgcmp', 'avis de non-objection', 'contrôle a priori', 'visa préalable', 'crédits budgétaires']
    },
    {
      id: 'armp_tower',
      titleKeywords: ['armp', 'régulation', 'dossiers types', 'architecture tripartite', 'notation de la performance'],
      bodyKeywords: ['autorité de régulation', 'dossiers types', 'primature', 'directives normatives']
    },
    {
      id: 'construction_crane',
      titleKeywords: ['travaux', 'chantier', 'ouvrage', 'réception provisoire', 'parfait achèvement', 'réception définitive', 'pré-qualification'],
      bodyKeywords: ['génie civil', 'construction', 'réhabilitation', 'chantier', 'malfaçons', 'plans de récolement', 'ouvrage']
    },
    {
      id: 'supply_truck',
      titleKeywords: ['fournitures', 'équipements', 'livraison', 'logistique'],
      bodyKeywords: ['biens mobiliers', 'véhicules', 'médicaments', 'livraison', 'mise en service']
    },
    {
      id: 'intellectual_compass',
      titleKeywords: ['prestations intellectuelles', 'études', 'consultant', 'termes de référence', 'sous-commission', 'examen de la conformité'],
      bodyKeywords: ['prestations intellectuelles', 'bureaux d’études', 'méthodologique', 'qualité-coût', 'experts clés']
    },
    {
      id: 'dao_calendar',
      titleKeywords: ['plan de passation', 'ppm', 'pilotage dynamique', 'calendrier', 'délai', 'données particulières'],
      bodyKeywords: ['plan de passation', 'ppm', 'douze mois', 'rétroplanning', 'programmation', 'calendrier']
    },
    {
      id: 'allotment_puzzle',
      titleKeywords: ['allotissement', 'lots', 'pme', 'sous-traitance', '17/001'],
      bodyKeywords: ['allotissement', 'lots géographiques', 'pme', 'sous-traitants congolais', 'multi-lots']
    },
    {
      id: 'sealed_ballot_ano',
      titleKeywords: ['ouverture des plis', 'réception sécurisée', 'horodatage', 'cérémonie publique', 'standstill', 'signature'],
      bodyKeywords: ['ouverture publique', 'urne', 'enveloppes', 'haute voix', 'heure limite', 'standstill']
    },
    {
      id: 'bank_guarantee_vault',
      titleKeywords: ['garantie', 'caution', 'avance', 'retenue', 'décompte', 'avenant', 'révision des prix', 'pénalités'],
      bodyKeywords: ['garantie de bonne exécution', 'caution bancaire', 'avance de démarrage', 'décompte', 'avenant', 'quinze pour cent', 'intérêts moratoires']
    },
    {
      id: 'gavel_tribunal',
      titleKeywords: ['recours', 'crd', 'différends', 'effet suspensif', 'injonction', 'force exécutoire', 'résiliation'],
      bodyKeywords: ['recours gracieux', 'comité de règlement des différends', 'crd', 'effet suspensif', 'litiges']
    },
    {
      id: 'audit_scanner',
      titleKeywords: ['audit', 'contrôle a posteriori', 'matérialité', 'cour des comptes', 'conflits d’intérêts', 'collusion', 'exclusion', 'sanction', 'nullité'],
      bodyKeywords: ['auditeurs indépendants', 'inspection générale des finances', 'conflit d’intérêts', 'corruption', 'liste noire', 'fraude']
    },
    {
      id: 'sigmap_server',
      titleKeywords: ['sigmap', 'numérique', 'guichet numérique', 'interconnexion', 'chiffrement', 'coffre-fort', 'signature électronique', 'open contracting', 'ocds'],
      bodyKeywords: ['sigmap', 'dématérialis', 'cryptographique', 'coffre-fort électronique', 'signature électronique', 'open contracting']
    },
    {
      id: 'legal_codex',
      titleKeywords: ['loi', 'décret', 'droit commun', 'gré à gré', 'restreint', 'ccap'],
      bodyKeywords: ['loi n° 10/010', 'décret n° 10/22', 'cahier des clauses']
    }
  ];

  let bestId: RealisticCardAnimationId = fallbackId;
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.titleKeywords) {
      if (titleLow.includes(kw)) score += 6;
    }
    for (const kw of rule.bodyKeywords) {
      if (bodyLow.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = rule.id;
    }
  }

  return bestId;
}

function parsePedagogicalBlock(
  rawBlock: string,
  fallbackTitle: string,
  fallbackRule: string
): {
  visualTitle: string;
  explanationBody: string;
  terrainRule: string;
  explicitSceneId: RealisticCardAnimationId | null;
} {
  let cleaned = cleanPedagogicalClause(rawBlock);
  if (!cleaned) {
    return {
      visualTitle: fallbackTitle,
      explanationBody: '',
      terrainRule: fallbackRule,
      explicitSceneId: null
    };
  }

  // Extract optional [Scène: id] tag if embedded
  let explicitSceneId: RealisticCardAnimationId | null = null;
  const sceneMatch = cleaned.match(/^\[Sc[èe]ne\s*:\s*([a-z_]+)\]\s*/i);
  if (sceneMatch) {
    explicitSceneId = sceneMatch[1].toLowerCase() as RealisticCardAnimationId;
    cleaned = cleaned.slice(sceneMatch[0].length).trim();
  }

  // Split off "| Application terrain :" if present
  let mainPart = cleaned;
  let extractedRule = '';
  const pipeSplit = cleaned.split(
    /\s*\|\s*(?:Application\s+terrain|En\s+pratique|Cas\s+pratique|Règle\s+d['’]or)\s*:\s*/i
  );
  if (pipeSplit.length > 1) {
    mainPart = pipeSplit[0].trim();
    extractedRule = pipeSplit.slice(1).join(' ').trim();
  }

  // Extract visual heading before the first colon ":" and strip it from the explanation body!
  let visualTitle = fallbackTitle;
  let explanationBody = mainPart;
  const colonIdx = mainPart.indexOf(':');
  if (colonIdx >= 4 && colonIdx <= 72) {
    visualTitle = mainPart
      .slice(0, colonIdx)
      .replace(/^[\d.\-*•)\s]+/, '')
      .trim();
    explanationBody = mainPart.slice(colonIdx + 1).trim();
  } else {
    visualTitle = extractShortHeading(mainPart, fallbackTitle);
  }

  if (!extractedRule) {
    extractedRule = fallbackRule;
  }

  return {
    visualTitle,
    explanationBody: explanationBody || mainPart,
    terrainRule: extractedRule,
    explicitSceneId
  };
}

export interface UserPrecedenceProfile {
  name?: string;
  roleTitle?: string;
  institution?: string;
  role?: string;
  avatarUrl?: string;
}

export function formatProtocolPrecedenceIdentity(userProfile?: UserPrecedenceProfile | null): {
  displayFullName: string;
  spokenFullName: string;
  precedenceTitle: string;
  institutionName: string;
  shortHonorificName: string;
  roleBadgeLabel: string;
  roleMissionContext: string;
  warmSpokenRole: string;
  roleScreenPerspective: string[];
} {
  const rawName = (userProfile?.name || 'Ing. Jean-Paul Mukendi').trim();
  const role = userProfile?.role || 'cgpmp_member';
  const rawRoleTitle = (userProfile?.roleTitle || 'Responsable Technique CGPMP').trim();
  const institutionName = (userProfile?.institution || 'Administration Publique RDC').trim();

  // Expand honorific prefixes for warm spoken French
  const spokenFullName = rawName
    .replace(/^Ing\.\s*/i, 'Ingénieur ')
    .replace(/^Pr\.\s*/i, 'Professeur ')
    .replace(/^Dr\.\s*/i, 'Docteur ')
    .replace(/^Mme\.?\s*/i, 'Madame ')
    .replace(/^M\.\s*/i, 'Monsieur ')
    .replace(/^Me\s+/i, 'Maître ');

  const hasHonorific = /^(Ingénieur|Professeur|Docteur|Madame|Monsieur|Maître)\b/i.test(spokenFullName);
  const politeSpokenName = hasHonorific ? spokenFullName : `Monsieur ${spokenFullName}`;

  let precedenceTitle = 'Monsieur le Responsable Technique de la Cellule de Gestion';
  let roleBadgeLabel = `RÔLE ACTIF : ${rawRoleTitle.toUpperCase()} (CGPMP)`;
  let roleMissionContext = 'Dans votre mission au sein de la cellule de gestion';
  let warmSpokenRole = 'au sein de la cellule de gestion des marchés publics';
  let roleScreenPerspective = [
    `Pour votre fonction de ${rawRoleTitle}, cette règle guide le recensement des besoins et l'élaboration du PPM, de Kinshasa au Haut-Katanga.`,
    `En tant que ${rawRoleTitle}, vous traduisez ce principe lors de la rédaction impartiale du Dossier d'Appel d'Offres.`,
    `Au sein de la commission d'analyse CGPMP, votre rôle garantit ici l'objectivité absolue du procès-verbal d'évaluation.`,
    `Dans le suivi des marchés de ${institutionName}, ce mécanisme sécurise vos demandes d'Avis de Non-Objection et vos décomptes.`,
    `Pour votre responsabilité de ${rawRoleTitle}, cette traçabilité protège durablement vos dossiers lors des audits ARMP.`
  ];

  if (role === 'dfat_admin') {
    precedenceTitle = 'Monsieur le Directeur de la Formation et de l’Appui Technique';
    roleBadgeLabel = `RÔLE ACTIF : DIRECTION DFAT • ${rawRoleTitle.toUpperCase()}`;
    roleMissionContext = 'Dans votre mission de pilotage à la direction de la formation';
    warmSpokenRole = "à la direction de la formation et de l'appui technique";
    roleScreenPerspective = [
      `Pour votre rôle de pilotage à la DFAT, ce fondement structure les référentiels nationaux de compétences dans les 26 provinces de la RDC.`,
      `En tant que ${rawRoleTitle}, ce mécanisme constitue un indicateur clé d'appui technique, de Kinshasa au Lualaba et à la Tshopo.`,
      `Dans votre supervision pédagogique à la DFAT, ce principe renforce la qualité des commissions d'évaluation, du Kongo-Central au Nord-Kivu.`,
      `Au titre de votre mission à la DFAT, cette règle guide l'accompagnement méthodologique des cellules de gestion provinciales.`,
      `Pour votre direction (${institutionName}), cette exigence consolide la gouvernance et la certification nationale ARMP.`
    ];
  } else if (role === 'armp_agent') {
    precedenceTitle = rawRoleTitle.toLowerCase().includes('rapporteur')
      ? 'Madame le Rapporteur du Comité de Règlement des Différends'
      : 'Haut Cadre de l’Autorité de Régulation des Marchés Publics';
    roleBadgeLabel = `RÔLE ACTIF : RÉGULATION ARMP • ${rawRoleTitle.toUpperCase()}`;
    roleMissionContext = "Dans votre mission de régulation et d'arbitrage";
    warmSpokenRole = "au sein de l'autorité de régulation";
    roleScreenPerspective = [
      `Dans votre fonction de ${rawRoleTitle} à l'ARMP, ce principe éclaire la veille normative de Kinshasa jusqu'au Kasaï-Central et à l'Ituri.`,
      `En tant que régulateur (${rawRoleTitle}), vous vérifiez ici la conformité stricte aux Dossiers Types homologués par l'ARMP.`,
      `Lors de l'instruction des dossiers et recours au CRD, votre rôle veille au respect rigoureux de l'égalité de traitement.`,
      `Pour votre mission à l'ARMP, ce garde-fou sert de référence directe lors des audits indépendants a posteriori.`,
      `En votre qualité de ${rawRoleTitle}, cette transparence renforce l'autorité morale et exécutoire des décisions de régulation.`
    ];
  } else if (role === 'dgcmp_agent') {
    precedenceTitle = 'Monsieur l’Inspecteur Principal du Contrôle a Priori';
    roleBadgeLabel = `RÔLE ACTIF : CONTRÔLE A PRIORI DGCMP • ${rawRoleTitle.toUpperCase()}`;
    roleMissionContext = 'Dans votre mission de contrôle a priori';
    warmSpokenRole = 'au sein de la direction générale du contrôle';
    roleScreenPerspective = [
      `Pour votre rôle d'examen a priori à la DGCMP (${rawRoleTitle}), ce point commande la validation préalable des plans de passation.`,
      `Lors de votre revue technique du DAO avant publication, votre contrôle DGCMP écarte toute clause discriminatoire.`,
      `Dans l'analyse des rapports d'évaluation soumis au visa ANO, votre regard d'inspecteur sécurise la régularité du choix.`,
      `En tant que ${rawRoleTitle}, vous vérifiez ici le respect strict des seuils légaux, à Kinshasa comme dans le Haut-Katanga ou le Sud-Kivu.`,
      `Pour votre mission de contrôle à la DGCMP, cette exigence prévient tout risque de nullité contractuelle ou de dépassement.`
    ];
  } else if (role === 'formateur') {
    precedenceTitle = 'Chère Consœur Formatrice Certifiée';
    roleBadgeLabel = `RÔLE ACTIF : FORMATEUR CERTIFIÉ • ${rawRoleTitle.toUpperCase()}`;
    roleMissionContext = 'Dans votre mission de transmission pédagogique';
    warmSpokenRole = 'dans la formation des praticiens de la commande publique';
    roleScreenPerspective = [
      `Pour votre enseignement en tant que ${rawRoleTitle}, ce pilier permet d'illustrer concrètement le sens civique de la Loi 10/010.`,
      `Lors de vos ateliers pratiques sur les DAO, votre rôle de formateur aide les praticiens du Kwilu, de la Tshopo ou du Lualaba à maîtriser cette étape.`,
      `Dans vos simulations de séance d'ouverture et d'évaluation, ce cas pratique ancre les bons réflexes déontologiques.`,
      `En tant que ${rawRoleTitle}, vous démontrez ici comment articuler sécurité juridique et efficacité opérationnelle.`,
      `Pour vos sessions de certification (${institutionName}), ce repère synthétise l'excellence attendue sur le terrain.`
    ];
  } else if (role === 'particulier') {
    precedenceTitle = 'Distingué Partenaire Opérateur Économique';
    roleBadgeLabel = `RÔLE ACTIF : OPÉRATEUR ÉCONOMIQUE / SOUMISSIONNAIRE (${rawRoleTitle.toUpperCase()})`;
    roleMissionContext = "Dans votre activité d'opérateur économique et soumissionnaire";
    warmSpokenRole = "en tant qu'opérateur économique et partenaire de l'État";
    roleScreenPerspective = [
      `Pour votre entreprise (${institutionName}), ce principe garantit votre libre accès aux avis d'appel d'offres à Kinshasa, Lubumbashi, Kisangani ou Bukavu.`,
      `En tant que ${rawRoleTitle} préparant une soumission, cette règle vous assure un cahier des charges équitable et lisible.`,
      `Lors du dépôt et de l'ouverture publique des plis, ce mécanisme protège l'intégrité financière et technique de votre offre.`,
      `Dans l'exécution de votre contrat public, ce cadre sécurise vos garanties bancaires et le paiement régulier de vos décomptes.`,
      `Pour votre rôle d'opérateur économique, cette disposition protège votre droit au recours gracieux et devant le CRD.`
    ];
  } else if (rawRoleTitle) {
    precedenceTitle = rawRoleTitle;
  }

  return {
    displayFullName: rawName,
    spokenFullName: politeSpokenName,
    precedenceTitle,
    institutionName,
    shortHonorificName: politeSpokenName,
    roleBadgeLabel,
    roleMissionContext,
    warmSpokenRole,
    roleScreenPerspective
  };
}

export function buildSynchronizedLessonScreens(
  lessonTitle: string,
  lessonContent: string,
  courseCode: string,
  courseLegalRef: string,
  lessonIndex: number,
  sceneOverride?: ContextualSceneType | null,
  userProfile?: UserPrecedenceProfile | null
): {
  sceneData: ProfessorSceneData;
  sentences: string[];
} {
  const safeTitle = lessonTitle || 'Module Marchés Publics RDC';
  const safeContent = lessonContent || '';
  const autoCtx = detectContextualSceneType(safeTitle, safeContent, courseCode || '', lessonIndex);
  const effectiveSceneType = sceneOverride || autoCtx.sceneType;
  const precedence = formatProtocolPrecedenceIdentity(userProfile);

  const paragraphBlocks = safeContent
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const rawClauses =
    paragraphBlocks.length >= 4
      ? paragraphBlocks
      : safeContent
          .replace(/\r\n/g, '\n')
          .split(/(?:\n+|(?<=[.!?;])\s+)/)
          .map((s) => cleanPedagogicalClause(s))
          .filter((s) => s.length > 18);

  const c0 =
    rawClauses[0] ||
    `Finalité humaine des deniers publics : Derrière chaque franc congolais engagé dans un marché public, il y a l'effort des citoyens et l'espoir concret d'une école, d'un hôpital ou d'une route durable. La Loi n° 10/010 veille à ce que chaque ressource publique serve exclusivement la dignité et le bien-être de la population. | Application terrain : Avant tout lancement d'achat, interrogez-vous toujours sur l'utilité réelle et directe du projet pour les usagers et la communauté.`;
  const c1 =
    rawClauses[1] ||
    `Écoute et concertation au sein de la CGPMP : Préparer un marché public est avant tout un travail d'équipe humain où les ingénieurs, les médecins ou les enseignants expriment leurs besoins réels, que la Cellule de Gestion traduit avec soin en un dossier d'appel d'offres clair et loyal. | Application terrain : Associez toujours les futurs utilisateurs sur le terrain dès la rédaction des spécifications techniques pour acquérir des équipements réellement adaptés.`;
  const c2 =
    rawClauses[2] ||
    `Équité et respect du travail des soumissionnaires : Chaque entreprise qui dépose une offre a investi du temps, de l'énergie et des compétences. L'égalité de traitement garantit que toutes les offres sont examinées avec la même bienveillance objective, sans favoritisme ni préjugé. | Application terrain : Offrez à chaque candidat les mêmes informations au même moment afin que la compétition récompense sincèrement le mérite et la qualité.`;
  const c3 =
    rawClauses[3] ||
    `Sécurisation mutuelle et confiance contractuelle : Le contrôle a priori de la DGCMP et les garanties d'exécution ne sont pas des obstacles bureaucratiques, mais des garde-fous qui protègent à la fois l'État et l'entreprise sérieuse qui réalise les travaux. | Application terrain : Veillez au paiement régulier des acomptes dès que les prestations sont réceptionnées sur le terrain afin de préserver la santé financière des PME.`;
  const c4 =
    rawClauses[4] ||
    `Transparence et redevabilité envers la communauté : Qu'il s'agisse de l'archivage complet ou de la publication dans SIGMAP, rendre compte de chaque marché public renforce le lien de confiance entre les institutions de la République et les citoyens. | Application terrain : Documentez chaque étape avec intégrité pour pouvoir présenter à tout moment un dossier limpide aux auditeurs comme aux citoyens.`;

  const extractedArticles =
    safeContent.match(/(?:Art(?:icle)?\.?\s*\d+|Loi\s*n°?\s*[\d/-]+|Décret\s*n°?\s*[\d/-]+|Ordonnance-Loi\s*n°?\s*[\d/-]+)/gi) || [];
  const uniqueArts = Array.from(new Set(extractedArticles.map((a) => a.trim())));
  const artList = [
    uniqueArts[0] || 'Art. 1er Loi 10/010',
    uniqueArts[1] || 'Art. 17 Loi 10/010',
    uniqueArts[2] || 'Art. 26 Loi 10/010',
    uniqueArts[3] || 'Art. 43 Loi 10/010',
    uniqueArts[4] || courseLegalRef || 'Décret 10/22 RDC'
  ];

  const defaultThemeSeq = getAnimationSequenceForTheme(effectiveSceneType);
  const clauses = [c0, c1, c2, c3, c4];
  const metricVals = [96, 95, 97, 98, 100];

  const screens: SingleScreenCardData[] = clauses.map((clause, idx) => {
    const fallbackAnimId = defaultThemeSeq[idx]?.id || 'citizen_impact_law';
    const preParsed = parsePedagogicalBlock(clause, `Axe Pédagogique 0${idx + 1}`, '');
    const animId = pickCoherentAnimationForCard(
      preParsed.visualTitle,
      preParsed.explanationBody,
      preParsed.explicitSceneId,
      fallbackAnimId
    );
    const catalogMeta = ANIMATION_CATALOG[animId];

    const parsed = parsePedagogicalBlock(
      clause,
      `Axe Pédagogique 0${idx + 1}`,
      catalogMeta.contextualRule
    );

    const shortLabel =
      parsed.visualTitle.length > 26
        ? parsed.visualTitle.slice(0, 25).trim() + '…'
        : parsed.visualTitle;

    // Preserve 100% of the warm, human pedagogical story and practical rule without truncating or stuffing robotic labels!
    const explanationText = truncateClean(parsed.explanationBody, 275);
    const fieldRuleText = truncateClean(parsed.terrainRule, 185);

    const variation =
      PEDAGOGICAL_TRANSITION_VARIATIONS[
        (Math.max(0, lessonIndex) * 5 + idx) % PEDAGOGICAL_TRANSITION_VARIATIONS.length
      ];

    // Warm, emotionally expressive spoken narration across the 5 screens (Enthusiasm -> Empathy -> Curiosity -> Vigilance -> Pride/Encouragement)
    let part1Explanation = explanationText;
    if (idx === 0) {
      const openingGreeting =
        lessonIndex === 0
          ? `Bonjour ${precedence.spokenFullName}, quel plaisir et quelle joie de vous accompagner ${precedence.warmSpokenRole} !`
          : `Quel bonheur de poursuivre ensemble avec enthousiasme, ${precedence.spokenFullName} !`;
      part1Explanation = `${openingGreeting} ${explanationText}`;
    } else if (idx === 1) {
      part1Explanation = `Avançons pas à pas avec cœur et sérénité. ${explanationText}`;
    } else if (idx === 2) {
      part1Explanation = `Observons ensemble ce point essentiel : ${explanationText}`;
    } else if (idx === 3) {
      part1Explanation = `Portons ici une attention vigilante et rigoureuse : ${explanationText}`;
    } else if (idx === 4) {
      part1Explanation = `Avec confiance et maîtrise sur le terrain, ${explanationText}`;
    }

    const personalizedLeadIn =
      idx === 2
        ? `${precedence.roleMissionContext}, ${precedence.spokenFullName},`
        : idx === 4
        ? `${variation.spokenLeadIn} ${precedence.spokenFullName},`
        : variation.spokenLeadIn;

    const spokenRuleBody =
      fieldRuleText.length > 1 && !/^[A-Z]{2,}/.test(fieldRuleText)
        ? fieldRuleText.charAt(0).toLowerCase() + fieldRuleText.slice(1)
        : fieldRuleText;
    const part2Rule = `${personalizedLeadIn} ${spokenRuleBody}`;

    const fullSpoken = `${part1Explanation} ${part2Rule}`;
    const ruleStartChar = part1Explanation.length + 1;

    return {
      screenNumber: idx + 1,
      shortTabLabel: shortLabel,
      categoryTag: catalogMeta.tag,
      title: parsed.visualTitle,
      explanation: explanationText,
      fieldRule: fieldRuleText,
      fieldLeadIn: personalizedLeadIn,
      fieldBoxTitle: variation.boxTitle,
      fieldBannerSubtitle: variation.bannerSubtitle,
      legalArticle: artList[idx],
      metricLabel: catalogMeta.metricLabel,
      metricVal: metricVals[idx],
      accentColor: catalogMeta.color,
      animationId: animId,
      animationCaption: catalogMeta.caption,
      spokenText: fullSpoken,
      explanationStartRatio: 0,
      fieldRuleStartRatio: clamp01(ruleStartChar / Math.max(1, fullSpoken.length))
    };
  });

  const sceneData: ProfessorSceneData = {
    sceneType: effectiveSceneType,
    sceneBadge: autoCtx.sceneBadge,
    professorHook: autoCtx.professorHook,
    lessonTitle: safeTitle,
    courseCode: courseCode || 'MP-RDC',
    screens
  };

  return {
    sceneData,
    sentences: screens.map((s) => s.spokenText)
  };
}

// ============================================================================
// HUMAN-CENTERED & COHERENT SVG SCENE SIMULATIONS SYNCHRONIZED WITH VOICE
// Canvas box: x=0..380, y=0..268
// ============================================================================
const HumanFigureSVG: React.FC<{
  x: number;
  y: number;
  suitColor: string;
  skinColor?: string;
  helmetColor?: string;
  label?: string;
  waveArm?: number;
}> = ({ x, y, suitColor, skinColor = '#8D5524', helmetColor, label, waveArm = 0 }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Shoulders / Torso */}
    <path
      d="M -16 34 C -16 16 16 16 16 34 L 18 52 L -18 52 Z"
      fill={suitColor}
      stroke="#E2E8F0"
      strokeWidth="1.3"
    />
    {/* Collar / Tie detail */}
    <polygon points="-4,19 4,19 0,30" fill="#FDE68A" />
    {/* Animated gesturing arm */}
    <line
      x1="13"
      y1="25"
      x2={24 + Math.sin(waveArm) * 5}
      y2={15 - Math.cos(waveArm) * 6}
      stroke={suitColor}
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx={25 + Math.sin(waveArm) * 5} cy={14 - Math.cos(waveArm) * 6} r="3.2" fill={skinColor} />
    {/* Head */}
    <circle cx="0" cy="6" r="10.5" fill={skinColor} stroke="#FDE68A" strokeWidth="1" />
    {/* Warm Smile & Eyes */}
    <circle cx="-3.5" cy="4.5" r="1.2" fill="#0F172A" />
    <circle cx="3.5" cy="4.5" r="1.2" fill="#0F172A" />
    <path d="M -3.5 9 Q 0 12 3.5 9" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    {/* Optional Safety Helmet or Hair */}
    {helmetColor ? (
      <path d="M -12 3 C -12 -8 12 -8 12 3 Z" fill={helmetColor} stroke="#FEF08A" strokeWidth="1.2" />
    ) : (
      <path d="M -10 2 C -10 -7 10 -7 10 2 C 6 -2 -6 -2 -10 2 Z" fill="#1E293B" />
    )}
    {label && (
      <g transform="translate(0, 62)">
        <rect x="-32" y="-9" width="64" height="14" rx="7" fill="#0F172A" stroke="#475569" strokeWidth="1" />
        <text x="0" y="1" textAnchor="middle" fill="#FDE68A" fontSize="7.2" fontWeight="900">
          {label}
        </text>
      </g>
    )}
  </g>
);

const RealisticCardSceneCanvas: React.FC<{
  card: SingleScreenCardData;
  localProgress: number;
  spokenPhase: 1 | 2 | 3;
  tickCount: number;
}> = ({ card, localProgress, spokenPhase, tickCount }) => {
  const { animationId, accentColor, shortTabLabel, legalArticle } = card;
  const t = tickCount;
  const p = clamp01(localProgress);
  const smoothP = easeOutCubic(p);

  const phaseLabel =
    spokenPhase === 2
      ? '🎙️ EXPLICATION PÉDAGOGIQUE EN DIRECT'
      : `${card.fieldBoxTitle} ✓`;

  const phaseColor = spokenPhase === 2 ? '#38BDF8' : '#10B981';

  const renderBackdrop = () => (
    <g>
      <rect x="0" y="0" width="380" height="268" rx="16" fill="#0B132B" />
      <g stroke="#1E293B" strokeWidth="1" opacity="0.6">
        <line x1="0" y1="54" x2="380" y2="54" />
        <line x1="0" y1="108" x2="380" y2="108" />
        <line x1="0" y1="162" x2="380" y2="162" />
        <line x1="0" y1="216" x2="380" y2="216" />
        <line x1="76" y1="0" x2="76" y2="268" />
        <line x1="152" y1="0" x2="152" y2="268" />
        <line x1="228" y1="0" x2="228" y2="268" />
        <line x1="304" y1="0" x2="304" y2="268" />
      </g>
      <ellipse
        cx="190"
        cy="236"
        rx={132 + Math.sin(t * 0.05) * 6}
        ry="16"
        fill={spokenPhase === 3 ? '#10B981' : accentColor}
        fillOpacity="0.24"
      />
      {/* Top Synchronized Concept Pill showing the exact topic of this screen */}
      <g transform="translate(12, 10)">
        <rect
          x="0"
          y="0"
          width="246"
          height="22"
          rx="11"
          fill="#0F172A"
          stroke={phaseColor}
          strokeWidth="1.5"
        />
        <circle cx="12" cy="11" r="4" fill={phaseColor} />
        <text x="22" y="14.5" fill="#F8FAFC" fontSize="8.2" fontWeight="900">
          {shortTabLabel.toUpperCase()}
        </text>
      </g>
      <g transform="translate(264, 10)">
        <rect x="0" y="0" width="104" height="22" rx="11" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.2" />
        <text x="52" y="14.5" textAnchor="middle" fill="#FDE68A" fontSize="7.8" fontWeight="900">
          {legalArticle.slice(0, 16)}
        </text>
      </g>
      {/* Bottom Phase Indicator */}
      <text x="190" y="258" textAnchor="middle" fill={phaseColor} fontSize="8" fontWeight="900">
        {phaseLabel} ({Math.round(p * 100)}%)
      </text>
    </g>
  );

  switch (animationId) {
    case 'citizen_impact_law': {
      // Public Funds transform into a Community School & Health Center for Citizens!
      const beamProgress = smoothP;
      return (
        <g>
          {renderBackdrop()}
          {/* Left: Public Funds Shield (Loi 10/010) */}
          <g transform="translate(56, 98)">
            <path
              d="M 0 -38 L 34 -24 L 34 8 C 34 30 0 46 0 46 C 0 46 -34 30 -34 8 L -34 -24 Z"
              fill="#1E3A8A"
              stroke="#FBBF24"
              strokeWidth="2.5"
            />
            <text x="0" y="-8" textAnchor="middle" fill="#FDE68A" fontSize="8" fontWeight="900">
              DENIERS
            </text>
            <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">
              PUBLICS
            </text>
            <text x="0" y="18" textAnchor="middle" fill="#6EE7B7" fontSize="7.5" fontWeight="900">
              LOI 10/010
            </text>
          </g>

          {/* Animated Flow of Public Investment to Citizens */}
          <line x1="94" y1="98" x2="166" y2="98" stroke="#334155" strokeWidth="5" strokeDasharray="6 4" />
          <line
            x1="94"
            y1="98"
            x2={94 + 72 * beamProgress}
            y2="98"
            stroke="#10B981"
            strokeWidth="5"
          />
          <circle cx={94 + 72 * beamProgress} cy="98" r="6" fill="#FBBF24" />

          {/* Right: School & Health Center Built for Citizens */}
          <g transform="translate(172, 48)">
            <polygon points="92,0 8,32 176,32" fill="#059669" stroke="#A7F3D0" strokeWidth="2" />
            <rect x="18" y="32" width="148" height="72" rx="6" fill="#F8FAFC" stroke="#10B981" strokeWidth="2" />
            <rect x="30" y="42" width="52" height="26" rx="4" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
            <text x="56" y="58" textAnchor="middle" fill="#1E3A8A" fontSize="7.5" fontWeight="900">
              ÉCOLE
            </text>
            <rect x="102" y="42" width="52" height="26" rx="4" fill="#DCFCE7" stroke="#059669" strokeWidth="1.5" />
            <text x="128" y="58" textAnchor="middle" fill="#065F46" fontSize="7.5" fontWeight="900">
              SANTÉ +
            </text>
            <rect x="76" y="74" width="32" height="30" rx="3" fill="#1E3A8A" />
          </g>

          {/* Citizens & Practitioner benefitting */}
          <HumanFigureSVG x={72} y={168} suitColor="#2563EB" label="ACHETEUR" waveArm={p * 6} />
          <HumanFigureSVG x={208} y={168} suitColor="#059669" label="ENSEIGNANTE" waveArm={p * 6 + 1} />
          <HumanFigureSVG x={296} y={168} suitColor="#D97706" label="CITOYEN" waveArm={p * 6 + 2} />
        </g>
      );
    }

    case 'open_competition_access': {
      // Public Tender Portal broadcasting equally to 3 diverse Entrepreneurs across DRC
      const waveR = 18 + smoothP * 75;
      return (
        <g>
          {renderBackdrop()}
          {/* Top Official Public Call Portal */}
          <g transform="translate(115, 40)">
            <rect x="0" y="0" width="150" height="54" rx="10" fill="#1E3A8A" stroke="#FBBF24" strokeWidth="2.5" />
            <text x="75" y="21" textAnchor="middle" fill="#FDE68A" fontSize="8.8" fontWeight="900">
              AVIS D’APPEL PUBLIC
            </text>
            <text x="75" y="37" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
              OUVERT À TOUS • NEUTRE
            </text>
          </g>
          <circle
            cx="190"
            cy="94"
            r={waveR}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeOpacity={Math.max(0.15, 1 - smoothP * 0.7)}
          />
          {/* Equal Beams to All Candidates */}
          <line x1="155" y1="94" x2="78" y2="156" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="5 3" />
          <line x1="190" y1="94" x2="190" y2="156" stroke="#10B981" strokeWidth="2.5" strokeDasharray="5 3" />
          <line x1="225" y1="94" x2="302" y2="156" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="5 3" />

          <HumanFigureSVG x={78} y={162} suitColor="#2563EB" label="PME KINSHASA" waveArm={p * 5} />
          <HumanFigureSVG x={190} y={162} suitColor="#059669" label="PME PROVINCE" waveArm={p * 5 + 1} />
          <HumanFigureSVG x={302} y={162} suitColor="#7C3AED" label="INGÉNIEUR" waveArm={p * 5 + 2} />
        </g>
      );
    }

    case 'transparency_traceability': {
      // Transparent Glass Ledger + Public Notification to Candidates
      const checkCount = Math.min(4, Math.floor(p * 5));
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(42, 44)">
            <rect
              x="0"
              y="0"
              width="196"
              height="168"
              rx="12"
              fill="#0F172A"
              fillOpacity="0.9"
              stroke="#38BDF8"
              strokeWidth="2.5"
            />
            <rect x="12" y="12" width="172" height="24" rx="6" fill="#0284C7" />
            <text x="98" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="8.8" fontWeight="900">
              REGISTRE PUBLIC MOTIVÉ & PV
            </text>
            {[
              '1. PV d’ouverture émargé',
              '2. Grille d’analyse objective',
              '3. Motivation écrite des rejets',
              '4. Piste d’audit archivée ✓'
            ].map((item, idx) => {
              const done = idx <= checkCount;
              return (
                <g key={idx} transform={`translate(16, ${48 + idx * 28})`}>
                  <rect
                    x="0"
                    y="0"
                    width="164"
                    height="22"
                    rx="5"
                    fill={done ? '#1E3A8A' : '#1E293B'}
                    stroke={done ? '#38BDF8' : '#334155'}
                    strokeWidth="1.5"
                  />
                  <text x="10" y="14" fill={done ? '#F8FAFC' : '#94A3B8'} fontSize="8" fontWeight="800">
                    {item}
                  </text>
                  {done && (
                    <text x="150" y="15" fill="#10B981" fontSize="10" fontWeight="900">
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <HumanFigureSVG x={304} y={82} suitColor="#0284C7" label="RAPPORTEUR" waveArm={p * 6} />
          <HumanFigureSVG x={304} y={168} suitColor="#059669" label="CANDIDAT INFORMÉ" waveArm={p * 4} />
        </g>
      );
    }

    case 'scale_justice': {
      const damping = spokenPhase === 3 ? 0 : 1 - smoothP * 0.85;
      const tiltAngle = Math.sin(p * Math.PI * 4 + t * 0.04) * 8 * damping;
      const panShiftY = Math.sin(tiltAngle * (Math.PI / 180)) * 88;
      return (
        <g>
          {renderBackdrop()}
          <rect x="130" y="218" width="120" height="14" rx="5" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="183" y="64" width="14" height="154" rx="4" fill="#D97706" stroke="#FDE68A" strokeWidth="1.5" />
          <circle cx="190" cy="60" r="13" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2.5" />

          <g transform={`translate(190, 60) rotate(${tiltAngle})`}>
            <rect x="-112" y="-5" width="224" height="10" rx="5" fill="#FBBF24" stroke="#FEF08A" strokeWidth="1.5" />
            <circle cx="-96" cy="0" r="5" fill="#78350F" />
            <circle cx="96" cy="0" r="5" fill="#78350F" />
          </g>

          <g transform={`translate(94, ${60 - panShiftY})`}>
            <line x1="0" y1="0" x2="-28" y2="62" stroke="#FDE68A" strokeWidth="2" />
            <line x1="0" y1="0" x2="28" y2="62" stroke="#FDE68A" strokeWidth="2" />
            <path d="M -36 62 Q 0 80 36 62 Z" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
            <rect x="-26" y="38" width="52" height="22" rx="4" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.5" />
            <text x="0" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">
              CANDIDAT A
            </text>
          </g>

          <g transform={`translate(286, ${60 + panShiftY})`}>
            <line x1="0" y1="0" x2="-28" y2="62" stroke="#FDE68A" strokeWidth="2" />
            <line x1="0" y1="0" x2="28" y2="62" stroke="#FDE68A" strokeWidth="2" />
            <path d="M -36 62 Q 0 80 36 62 Z" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
            <rect x="-26" y="38" width="52" height="22" rx="4" fill="#059669" stroke="#6EE7B7" strokeWidth="1.5" />
            <text x="0" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900">
              CANDIDAT B
            </text>
          </g>

          <HumanFigureSVG x={44} y={168} suitColor="#1E3A8A" label="ÉVALUATEUR" waveArm={p * 5} />
          <HumanFigureSVG x={336} y={168} suitColor="#065F46" label="ÉQUITÉ 100%" waveArm={p * 5 + 1} />
        </g>
      );
    }

    case 'legal_codex': {
      const scanY = lerp(66, 192, p);
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(38, 44)">
            <rect x="0" y="0" width="236" height="168" rx="12" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2.5" />
            <path d="M 10 10 Q 64 4 118 14 L 118 156 Q 64 146 10 154 Z" fill="#FFFBEB" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M 118 14 Q 172 4 226 10 L 226 154 Q 172 146 118 156 Z" fill="#FFFBEB" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="118" y1="12" x2="118" y2="156" stroke="#94A3B8" strokeWidth="2.5" />

            <rect x="20" y="22" width="84" height="20" rx="5" fill="#1E3A8A" />
            <text x="62" y="35" textAnchor="middle" fill="#FDE68A" fontSize="8.5" fontWeight="900">
              LOI N° 10/010
            </text>
            {[0, 1, 2, 3, 4].map((lineIdx) => {
              const active = p >= lineIdx / 5;
              return (
                <rect
                  key={lineIdx}
                  x="20"
                  y={52 + lineIdx * 17}
                  width={lineIdx % 2 === 0 ? 82 : 68}
                  height="7"
                  rx="3.5"
                  fill={active ? '#2563EB' : '#CBD5E1'}
                />
              );
            })}

            <text x="172" y="34" textAnchor="middle" fill="#0F172A" fontSize="8.2" fontWeight="900">
              DAO TYPE ARMP
            </text>
            {[0, 1, 2, 3].map((lineIdx) => {
              const active = p >= 0.25 + lineIdx * 0.18;
              return (
                <rect
                  key={lineIdx}
                  x="132"
                  y={46 + lineIdx * 16}
                  width={78 - (lineIdx % 2) * 14}
                  height="7"
                  rx="3.5"
                  fill={active ? '#059669' : '#CBD5E1'}
                />
              );
            })}
          </g>
          <line x1="46" y1={scanY} x2="266" y2={scanY} stroke="#FBBF24" strokeWidth="3" />
          <HumanFigureSVG x={322} y={148} suitColor="#2563EB" label="JURISTE MP" waveArm={p * 6} />
        </g>
      );
    }

    case 'ministry_cgpmp': {
      const docX = lerp(48, 250, smoothP);
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(36, 40)">
            <polygon points="122,0 10,36 234,36" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2.2" />
            <rect x="18" y="36" width="208" height="16" rx="3" fill="#2563EB" />
            <text x="122" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="8.8" fontWeight="900">
              CELLULE DE GESTION (CGPMP)
            </text>
            {[36, 86, 140, 190].map((px, idx) => {
              const pillarLit = p >= idx * 0.22;
              return (
                <rect
                  key={idx}
                  x={px}
                  y="54"
                  width="18"
                  height="78"
                  rx="3"
                  fill={pillarLit ? '#DBEAFE' : '#E2E8F0'}
                  stroke={pillarLit ? '#2563EB' : '#64748B'}
                  strokeWidth="2"
                />
              );
            })}
            <rect x="12" y="132" width="220" height="14" rx="4" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
          </g>

          <HumanFigureSVG x={318} y={76} suitColor="#2563EB" label="EXPERT CGPMP" waveArm={p * 6} />
          <HumanFigureSVG x={318} y={164} suitColor="#059669" label="SERVICE MÉTIER" waveArm={p * 6 + 1.5} />

          <line x1="48" y1="218" x2="262" y2="218" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <line
            x1="48"
            y1="218"
            x2={docX + 20}
            y2="218"
            stroke={spokenPhase === 3 ? '#10B981' : '#38BDF8'}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <g transform={`translate(${docX}, 202)`}>
            <rect
              x="0"
              y="0"
              width="54"
              height="26"
              rx="6"
              fill={spokenPhase === 3 ? '#10B981' : '#F59E0B'}
              stroke="#FEF08A"
              strokeWidth="2"
            />
            <text x="27" y="16" textAnchor="middle" fill="#0F172A" fontSize="8" fontWeight="900">
              {spokenPhase === 3 ? 'PRÊT ✓' : 'DOSSIER'}
            </text>
          </g>
        </g>
      );
    }

    case 'dgcmp_shield': {
      const laserY = lerp(62, 182, Math.min(1, p / 0.78));
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(34, 46)">
            <rect x="0" y="0" width="118" height="158" rx="10" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
            <rect x="12" y="14" width="94" height="18" rx="4" fill="#0F172A" />
            <text x="59" y="26" textAnchor="middle" fill="#38BDF8" fontSize="8" fontWeight="900">
              REVUE PRÉALABLE
            </text>
            {[0, 1, 2, 3, 4].map((i) => {
              const rowY = 44 + i * 18;
              const verified = 46 + rowY <= laserY + 6;
              return (
                <g key={i}>
                  <rect
                    x="12"
                    y={rowY}
                    width={i % 2 === 0 ? 74 : 60}
                    height="8"
                    rx="4"
                    fill={verified ? '#10B981' : '#CBD5E1'}
                  />
                  {verified && (
                    <text x="96" y={rowY + 8} fill="#059669" fontSize="10" fontWeight="900">
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <line x1="26" y1={laserY} x2="164" y2={laserY} stroke="#10B981" strokeWidth="3.5" />

          <g transform={`translate(226, 124) scale(${spokenPhase === 3 ? 1.05 : 1})`}>
            <path
              d="M 0 -48 L 42 -30 L 42 8 C 42 36 0 54 0 54 C 0 54 -42 36 -42 8 L -42 -30 Z"
              fill={spokenPhase === 3 ? '#059669' : '#065F46'}
              stroke="#A7F3D0"
              strokeWidth="2.8"
            />
            <path
              d="M -16 2 L -4 14 L 20 -12"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset={Math.max(0, 60 - p * 80)}
            />
            <text x="0" y="34" textAnchor="middle" fill="#ECFDF5" fontSize="8.2" fontWeight="900">
              {spokenPhase === 3 ? 'VISA ANO ✓' : 'DGCMP'}
            </text>
          </g>
          <HumanFigureSVG x={326} y={148} suitColor="#065F46" label="INSPECTEUR" waveArm={p * 6} />
        </g>
      );
    }

    case 'armp_tower': {
      const waveRadius1 = 22 + p * 62;
      return (
        <g>
          {renderBackdrop()}
          <circle
            cx="156"
            cy="88"
            r={waveRadius1}
            fill="none"
            stroke="#FBBF24"
            strokeWidth="2.5"
            strokeOpacity={1 - (waveRadius1 - 22) / 68}
          />
          <polygon points="156,50 124,202 188,202" fill="#1E293B" stroke="#FBBF24" strokeWidth="2.5" />
          <circle cx="156" cy="88" r="17" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2.5" />
          <text x="156" y="92" textAnchor="middle" fill="#0F172A" fontSize="8.5" fontWeight="900">
            ARMP
          </text>

          <rect x="24" y="158" width="88" height="44" rx="8" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2" />
          <text x="68" y="184" textAnchor="middle" fill="#FFFFFF" fontSize="8.2" fontWeight="900">
            NORMES & DAO
          </text>

          <HumanFigureSVG x={256} y={148} suitColor="#D97706" label="FORMATEUR ARMP" waveArm={p * 6} />
          <HumanFigureSVG x={328} y={148} suitColor="#2563EB" label="PRATICIEN" waveArm={p * 6 + 1.2} />
        </g>
      );
    }

    case 'construction_crane': {
      const trolleyX = lerp(110, 232, Math.min(1, p / 0.65));
      const cableLen = p < 0.65 ? 42 : lerp(42, 68, (p - 0.65) / 0.35);
      return (
        <g>
          {renderBackdrop()}
          <rect x="24" y="224" width="332" height="10" rx="4" fill="#334155" />
          <rect x="178" y="148" width="116" height="76" rx="4" fill="#1E293B" stroke="#60A5FA" strokeWidth="2" />
          <text x="236" y="162" textAnchor="middle" fill="#FDE68A" fontSize="7.8" fontWeight="900">
            OUVRAGE PUBLIC (ÉCOLE)
          </text>
          {[0, 1].map((r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={192 + c * 32}
                y={170 + r * 22}
                width="22"
                height="14"
                rx="2"
                fill={p >= (r * 3 + c) / 6 ? '#38BDF8' : '#334155'}
              />
            ))
          )}

          <rect x="64" y="44" width="18" height="180" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
          <rect x="34" y="46" width="254" height="11" rx="4" fill="#FBBF24" stroke="#FEF08A" strokeWidth="2" />

          <g transform={`translate(${trolleyX}, 57)`}>
            <rect x="-12" y="0" width="24" height="8" rx="3" fill="#0F172A" stroke="#FDE68A" strokeWidth="1.5" />
            <line x1="0" y1="8" x2="0" y2={cableLen} stroke="#E2E8F0" strokeWidth="2.2" />
            <g transform={`translate(0, ${cableLen})`}>
              <rect
                x="-32"
                y="4"
                width="64"
                height="17"
                rx="4"
                fill={spokenPhase === 3 ? '#059669' : '#2563EB'}
                stroke="#93C5FD"
                strokeWidth="2"
              />
              <text x="0" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="7.8" fontWeight="900">
                {spokenPhase === 3 ? 'CONFORME ✓' : 'TRAVAUX'}
              </text>
            </g>
          </g>

          <HumanFigureSVG
            x={332}
            y={154}
            suitColor="#2563EB"
            helmetColor="#FBBF24"
            label="INGÉNIEUR"
            waveArm={p * 6}
          />
        </g>
      );
    }

    case 'supply_truck': {
      const truckX = lerp(22, 86, smoothP);
      const wheelRot = p * 720;
      return (
        <g>
          {renderBackdrop()}
          <rect x="20" y="198" width="340" height="28" rx="6" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <g transform={`translate(${truckX}, 98)`}>
            <rect
              x="0"
              y="0"
              width="138"
              height="78"
              rx="10"
              fill={spokenPhase === 3 ? '#059669' : '#2563EB'}
              stroke="#93C5FD"
              strokeWidth="2.5"
            />
            <text x="69" y="34" textAnchor="middle" fill="#FFFFFF" fontSize="9.2" fontWeight="900">
              FOURNITURES &
            </text>
            <text x="69" y="50" textAnchor="middle" fill="#FDE68A" fontSize="8.5" fontWeight="900">
              MÉDICAMENTS / ÉCOLES
            </text>
            <path d="M 138 22 L 182 22 L 196 50 L 196 78 L 138 78 Z" fill="#0F172A" stroke="#60A5FA" strokeWidth="2.5" />
            {[38, 162].map((wx, idx) => (
              <g key={idx} transform={`translate(${wx}, 82) rotate(${wheelRot})`}>
                <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#E2E8F0" strokeWidth="3" />
                <line x1="-10" y1="0" x2="10" y2="0" stroke="#FBBF24" strokeWidth="2" />
              </g>
            ))}
          </g>
          <HumanFigureSVG x={326} y={136} suitColor="#059669" label="RÉCEPTION PV" waveArm={p * 6} />
        </g>
      );
    }

    case 'intellectual_compass': {
      return (
        <g>
          {renderBackdrop()}
          <rect
            x="34"
            y="44"
            width="224"
            height="164"
            rx="12"
            fill="#1E1B4B"
            stroke="#A78BFA"
            strokeWidth="2.5"
          />
          <text x="146" y="64" textAnchor="middle" fill="#DDD6FE" fontSize="8.8" fontWeight="900">
            ÉTUDES, TDR & MÉTHODOLOGIE
          </text>
          <g transform={`translate(106, 126) rotate(${p * 360})`}>
            <circle cx="0" cy="0" r="30" fill="#312E81" stroke="#C4B5FD" strokeWidth="3" strokeDasharray="8 5" />
            <circle cx="0" cy="0" r="12" fill="#0F172A" stroke="#A78BFA" strokeWidth="2" />
          </g>
          <g transform={`translate(186, 82) rotate(${(p - 0.5) * 18})`}>
            <circle cx="0" cy="0" r="8" fill="#F59E0B" stroke="#FEF08A" strokeWidth="2" />
            <line x1="-4" y1="8" x2="-30" y2="76" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
            <line x1="4" y1="8" x2="30" y2="76" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          </g>
          <HumanFigureSVG x={316} y={144} suitColor="#7C3AED" label="EXPERT TDR" waveArm={p * 6} />
        </g>
      );
    }

    case 'threshold_gauge': {
      const needleDeg = lerp(-105, 68, smoothP);
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(154, 174)">
            <path d="M -98 0 A 98 98 0 0 1 98 0" fill="none" stroke="#1E293B" strokeWidth="22" strokeLinecap="round" />
            <path d="M -98 0 A 98 98 0 0 1 -32 -92" fill="none" stroke="#10B981" strokeWidth="18" strokeLinecap="round" />
            <path d="M -28 -94 A 98 98 0 0 1 48 -84" fill="none" stroke="#F59E0B" strokeWidth="18" />
            <path d="M 52 -82 A 98 98 0 0 1 98 0" fill="none" stroke="#E11D48" strokeWidth="18" strokeLinecap="round" />

            <g transform={`rotate(${needleDeg})`}>
              <polygon points="-5,10 0,-86 5,10" fill="#FBBF24" stroke="#FEF08A" strokeWidth="1.5" />
            </g>
            <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#FBBF24" strokeWidth="3" />

            <text x="-80" y="24" textAnchor="middle" fill="#6EE7B7" fontSize="8" fontWeight="900">
              COTATION
            </text>
            <text x="0" y="-106" textAnchor="middle" fill="#FDE68A" fontSize="8.5" fontWeight="900">
              AGRÉGATION ANNUELLE (SANS FRACTIONNER)
            </text>
            <text x="80" y="24" textAnchor="middle" fill="#FDA4AF" fontSize="8" fontWeight="900">
              APPEL D’OFFRES
            </text>
          </g>
          <HumanFigureSVG x={322} y={144} suitColor="#D97706" label="PLANIFICATEUR" waveArm={p * 5} />
        </g>
      );
    }

    case 'dao_calendar': {
      const activeMilestone = Math.min(5, Math.floor(p * 6));
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(24, 42)">
            <rect x="0" y="0" width="258" height="176" rx="12" fill="#1E293B" stroke="#38BDF8" strokeWidth="2.2" />
            <rect x="0" y="0" width="258" height="30" rx="12" fill="#0284C7" />
            <text x="129" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="8.8" fontWeight="900">
              CALENDRIER PRÉVISIONNEL PPM & DAO
            </text>

            {[
              { m: 'ÉTAPE 1', l: 'Besoins Réels' },
              { m: 'ÉTAPE 2', l: 'Crédits Votés' },
              { m: 'ÉTAPE 3', l: 'PPM Publié' },
              { m: 'ÉTAPE 4', l: 'DAO Neutre' },
              { m: 'ÉTAPE 5', l: 'Visa DGCMP' },
              { m: 'ÉTAPE 6', l: 'Lancement ✓' }
            ].map((cell, idx) => {
              const col = idx % 3;
              const row = Math.floor(idx / 3);
              const isLit = idx <= activeMilestone;
              return (
                <g key={idx} transform={`translate(${12 + col * 80}, ${40 + row * 62})`}>
                  <rect
                    x="0"
                    y="0"
                    width="74"
                    height="50"
                    rx="8"
                    fill={isLit ? '#0F172A' : '#0B132B'}
                    stroke={isLit ? '#FBBF24' : '#334155'}
                    strokeWidth={isLit ? '2.2' : '1.2'}
                  />
                  <text x="37" y="19" textAnchor="middle" fill={isLit ? '#FBBF24' : '#64748B'} fontSize="8" fontWeight="900">
                    {cell.m}
                  </text>
                  <text x="37" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="7.8" fontWeight="800">
                    {cell.l}
                  </text>
                </g>
              );
            })}
          </g>
          <HumanFigureSVG x={328} y={144} suitColor="#0284C7" label="ÉQUIPE PPM" waveArm={p * 6} />
        </g>
      );
    }

    case 'allotment_puzzle': {
      const slideOffset = lerp(24, 0, smoothP);
      return (
        <g>
          {renderBackdrop()}
          <g transform={`translate(${26 - slideOffset}, 52)`}>
            <rect x="0" y="0" width="84" height="98" rx="10" fill="#2563EB" stroke="#93C5FD" strokeWidth="2" />
            <text x="42" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
              LOT 01
            </text>
            <text x="42" y="56" textAnchor="middle" fill="#DBEAFE" fontSize="8" fontWeight="800">
              PME Kinshasa
            </text>
            <text x="42" y="78" textAnchor="middle" fill="#FDE68A" fontSize="7.8" fontWeight="900">
              Emplois ✓
            </text>
          </g>

          <g transform="translate(116, 52)">
            <rect x="0" y="0" width="84" height="98" rx="10" fill="#059669" stroke="#6EE7B7" strokeWidth="2" />
            <text x="42" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
              LOT 02
            </text>
            <text x="42" y="56" textAnchor="middle" fill="#D1FAE5" fontSize="8" fontWeight="800">
              PME Katanga
            </text>
            <text x="42" y="78" textAnchor="middle" fill="#FDE68A" fontSize="7.8" fontWeight="900">
              Artisans ✓
            </text>
          </g>

          <g transform={`translate(${206 + slideOffset}, 52)`}>
            <rect x="0" y="0" width="84" height="98" rx="10" fill="#D97706" stroke="#FDE68A" strokeWidth="2" />
            <text x="42" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
              LOT 03
            </text>
            <text x="42" y="56" textAnchor="middle" fill="#FEF3C7" fontSize="8" fontWeight="800">
              PME Kivu
            </text>
            <text x="42" y="78" textAnchor="middle" fill="#FFFFFF" fontSize="7.8" fontWeight="900">
              Loi 17/001 ✓
            </text>
          </g>

          <HumanFigureSVG x={78} y={168} suitColor="#2563EB" label="PME LOCALE 1" waveArm={p * 6} />
          <HumanFigureSVG x={198} y={168} suitColor="#059669" label="PME LOCALE 2" waveArm={p * 6 + 1} />
          <HumanFigureSVG x={318} y={168} suitColor="#D97706" label="SOUS-TRAITANT" waveArm={p * 6 + 2} />
        </g>
      );
    }

    case 'sealed_ballot_ano': {
      const envDropY = lerp(24, 106, Math.min(1, p / 0.65));
      const stampPressY = p < 0.65 ? 14 : lerp(14, 42, easeOutCubic((p - 0.65) / 0.35));
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(28, 26)">
            <g transform={`translate(22, ${envDropY})`}>
              <rect x="0" y="0" width="70" height="42" rx="6" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
              <polyline points="0,0 35,22 70,0" fill="none" stroke="#B45309" strokeWidth="2" />
              <circle cx="35" cy="20" r="6" fill="#E11D48" />
            </g>
            <rect
              x="8"
              y="92"
              width="98"
              height="96"
              rx="10"
              fill="#1E3A8A"
              fillOpacity="0.5"
              stroke="#60A5FA"
              strokeWidth="2.5"
            />
            <text x="57" y="172" textAnchor="middle" fill="#BAE6FD" fontSize="8.2" fontWeight="900">
              URNE PUBLIQUE
            </text>
          </g>

          <g transform="translate(158, 52)">
            <rect
              x="0"
              y="96"
              width="112"
              height="56"
              rx="8"
              fill={spokenPhase === 3 ? '#ECFDF5' : '#1E293B'}
              stroke={spokenPhase === 3 ? '#10B981' : '#64748B'}
              strokeWidth="2.2"
            />
            <text
              x="56"
              y="122"
              textAnchor="middle"
              fill={spokenPhase === 3 ? '#065F46' : '#E2E8F0'}
              fontSize="9"
              fontWeight="900"
            >
              {spokenPhase === 3 ? 'VALIDÉ & LU ✓' : 'SÉANCE PUBLIQUE'}
            </text>
            <text
              x="56"
              y="138"
              textAnchor="middle"
              fill={spokenPhase === 3 ? '#059669' : '#94A3B8'}
              fontSize="7.8"
              fontWeight="800"
            >
              {spokenPhase === 3 ? 'TRANSPARENCE' : 'HORODATAGE'}
            </text>
            <g transform={`translate(26, ${stampPressY})`}>
              <rect x="18" y="0" width="22" height="30" rx="5" fill="#B45309" stroke="#FDE68A" strokeWidth="2" />
              <rect x="0" y="28" width="58" height="16" rx="4" fill="#0F172A" stroke="#10B981" strokeWidth="2" />
            </g>
          </g>
          <HumanFigureSVG x={324} y={144} suitColor="#E11D48" label="CANDIDATS" waveArm={p * 6} />
        </g>
      );
    }

    case 'bank_guarantee_vault': {
      const wheelAngle = smoothP * 360;
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(46, 42)">
            <rect x="0" y="0" width="188" height="176" rx="18" fill="#1E293B" stroke="#94A3B8" strokeWidth="3.5" />
            <rect x="12" y="12" width="164" height="152" rx="12" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />

            <g transform={`translate(94, 78) rotate(${wheelAngle})`}>
              <circle cx="0" cy="0" r="38" fill="none" stroke="#FBBF24" strokeWidth="5" />
              <line x1="-38" y1="0" x2="38" y2="0" stroke="#FBBF24" strokeWidth="4" />
              <line x1="0" y1="-38" x2="0" y2="38" stroke="#FBBF24" strokeWidth="4" />
            </g>
            <circle cx="94" cy="78" r="16" fill={spokenPhase === 3 ? '#10B981' : '#059669'} stroke="#A7F3D0" strokeWidth="2" />
            <text x="94" y="81" textAnchor="middle" fill="#FFFFFF" fontSize="8.2" fontWeight="900">
              {spokenPhase === 3 ? 'OK ✓' : '3-5%'}
            </text>
            <text x="94" y="146" textAnchor="middle" fill="#FDE68A" fontSize="8.2" fontWeight="900">
              GARANTIE & PAIEMENT JUSTE
            </text>
          </g>
          <HumanFigureSVG x={308} y={144} suitColor="#7C3AED" label="TITULAIRE PAYÉ" waveArm={p * 6} />
        </g>
      );
    }

    case 'gavel_tribunal': {
      const gavelRot = p < 0.6 ? lerp(-34, 8, easeOutCubic(p / 0.6)) : 8;
      const impactActive = p >= 0.56;
      return (
        <g>
          {renderBackdrop()}
          <ellipse cx="122" cy="196" rx="44" ry="12" fill="#78350F" stroke="#FBBF24" strokeWidth="2" />
          <rect x="86" y="180" width="72" height="16" rx="5" fill="#92400E" stroke="#FDE68A" strokeWidth="2" />

          {impactActive && (
            <ellipse cx="122" cy="180" rx="64" ry="18" fill="none" stroke="#10B981" strokeWidth="2" />
          )}

          <g transform={`translate(216, 144) rotate(${gavelRot})`}>
            <rect x="-98" y="-6" width="98" height="12" rx="5" fill="#B45309" stroke="#FDE68A" strokeWidth="2" />
            <rect x="-112" y="-26" width="30" height="52" rx="7" fill="#78350F" stroke="#FBBF24" strokeWidth="2" />
          </g>

          <rect x="28" y="42" width="224" height="28" rx="8" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
          <text x="140" y="60" textAnchor="middle" fill="#FDE68A" fontSize="8.8" fontWeight="900">
            {spokenPhase === 3 ? 'ÉCOUTE & ARBITRAGE CRD ✓' : 'RECOURS SUSPENSIF RESPECTÉ'}
          </text>

          <HumanFigureSVG x={316} y={144} suitColor="#2563EB" label="MÉDIATEUR CRD" waveArm={p * 6} />
        </g>
      );
    }

    case 'audit_scanner': {
      const lensY = lerp(92, 174, p);
      const lensX = 128 + Math.sin(p * Math.PI * 2) * 36;
      return (
        <g>
          {renderBackdrop()}
          <rect x="28" y="42" width="224" height="176" rx="12" fill="#F8FAFC" stroke="#64748B" strokeWidth="2.2" />
          <rect x="40" y="54" width="200" height="22" rx="5" fill="#0F172A" />
          <text x="140" y="69" textAnchor="middle" fill="#FBBF24" fontSize="8.5" fontWeight="900">
            AUDIT DE TERRAIN & ÉTHIQUE
          </text>
          {[0, 1, 2, 3].map((row) => {
            const inspected = p >= (row + 1) * 0.22;
            return (
              <g key={row} transform={`translate(42, ${88 + row * 26})`}>
                <rect x="0" y="0" width="136" height="13" rx="4" fill={inspected ? '#93C5FD' : '#CBD5E1'} />
                <rect x="146" y="0" width="48" height="13" rx="4" fill={inspected ? '#10B981' : '#94A3B8'} />
              </g>
            );
          })}

          <g transform={`translate(${lensX}, ${lensY})`}>
            <line x1="22" y1="22" x2="52" y2="52" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
            <circle cx="0" cy="0" r="30" fill="#38BDF8" fillOpacity="0.24" stroke="#0284C7" strokeWidth="4" />
          </g>
          <HumanFigureSVG x={316} y={144} suitColor="#E11D48" label="AUDITEUR" waveArm={p * 6} />
        </g>
      );
    }

    case 'sigmap_server':
    default: {
      return (
        <g>
          {renderBackdrop()}
          <g transform="translate(34, 42)">
            <rect x="0" y="0" width="218" height="176" rx="14" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
            <text x="109" y="23" textAnchor="middle" fill="#6EE7B7" fontSize="8.8" fontWeight="900">
              E-PROCUREMENT SIGMAP & CITOYENS
            </text>
            {[0, 1, 2].map((rack) => {
              const rackProgress = clamp01((p - rack * 0.25) / 0.5);
              return (
                <g key={rack} transform={`translate(16, ${36 + rack * 44})`}>
                  <rect x="0" y="0" width="186" height="34" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                  <circle cx="18" cy="17" r="5" fill={rackProgress > 0.5 ? '#10B981' : '#38BDF8'} />
                  <circle cx="34" cy="17" r="5" fill="#FBBF24" />
                  <rect x="52" y="11" width="116" height="12" rx="4" fill="#0F172A" />
                  <rect
                    x="52"
                    y="11"
                    width={Math.max(14, 116 * rackProgress)}
                    height="12"
                    rx="4"
                    fill="#10B981"
                  />
                </g>
              );
            })}
          </g>
          <HumanFigureSVG x={316} y={144} suitColor="#059669" label="USAGER CONNECTÉ" waveArm={p * 6} />
        </g>
      );
    }
  }
};

// ============================================================================
// MAIN SINGLE-CARD-PER-SCREEN PROFESSOR STAGE
// ============================================================================
export const ProfessorContextualStage: React.FC<{
  data: ProfessorSceneData;
  activeActIndex: number;
  actVoiceProgress: number;
  tickCount: number;
  courseLegalRef: string;
  onSelectScreen?: (screenIdx: number) => void;
}> = ({ data, activeActIndex, actVoiceProgress, tickCount, onSelectScreen }) => {
  const screens = data.screens;
  const activeIdx = Math.max(0, Math.min(screens.length - 1, activeActIndex));
  const currentCard = screens[activeIdx] || screens[0];

  const localProgress = clamp01(actVoiceProgress);

  const spokenPhase: 1 | 2 | 3 =
    localProgress < currentCard.fieldRuleStartRatio ? 2 : 3;

  const explanationSpan = Math.max(0.1, currentCard.fieldRuleStartRatio);
  const explanationReadRatio = clamp01(localProgress / explanationSpan);

  const ruleSpan = Math.max(0.1, 1 - currentCard.fieldRuleStartRatio);
  const ruleReadRatio = clamp01((localProgress - currentCard.fieldRuleStartRatio) / ruleSpan);

  const titleLines = wrapTextLines(currentCard.title, 48, 1);
  const explanationLines = wrapTextLines(currentCard.explanation, 58, 5);
  const ruleLines = wrapTextLines(currentCard.fieldRule, 62, 3);

  return (
    <g>
      {/* 1. TOP SCREEN SWITCHER BAR */}
      <g transform="translate(28, 54)">
        {screens.map((scr, idx) => {
          const isCurrent = idx === activeIdx;
          const isCompleted = idx < activeIdx;
          const tabW = 176;
          const tabX = idx * 182;
          const fillRatio = isCurrent ? localProgress : isCompleted ? 1 : 0;

          return (
            <g
              key={scr.screenNumber}
              transform={`translate(${tabX}, 0)`}
              onClick={() => onSelectScreen?.(idx)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x="0"
                y="0"
                width={tabW}
                height="34"
                rx="10"
                fill={isCurrent ? '#0F172A' : isCompleted ? '#EFF6FF' : '#F1F5F9'}
                stroke={isCurrent ? scr.accentColor : isCompleted ? '#3B82F6' : '#CBD5E1'}
                strokeWidth={isCurrent ? '2.5' : '1.5'}
              />
              <rect
                x="6"
                y="26"
                width={tabW - 12}
                height="4"
                rx="2"
                fill={isCurrent ? '#1E293B' : '#E2E8F0'}
              />
              <rect
                x="6"
                y="26"
                width={Math.max(0, (tabW - 12) * fillRatio)}
                height="4"
                rx="2"
                fill={isCurrent ? '#FBBF24' : '#10B981'}
              />
              <text
                x="12"
                y="18"
                fill={isCurrent ? '#FBBF24' : isCompleted ? '#1D4ED8' : '#475569'}
                fontSize="10"
                fontWeight="900"
              >
                ÉCRAN {scr.screenNumber}/5 • {scr.shortTabLabel.slice(0, 14)}
              </text>
              {isCompleted && (
                <text x={tabW - 14} y="18" textAnchor="middle" fill="#10B981" fontSize="10.5" fontWeight="900">
                  ✓
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* 2. DEDICATED FULL SCREEN FOR THE CURRENT CARD ONLY (ENLARGED FULL-HEIGHT STAGE) */}
      <g transform="translate(28, 98)">
        {/* LEFT PANEL: HUMAN-CENTERED & COHERENT SVG SCENE (380 x 416) */}
        <g>
          <rect
            x="0"
            y="0"
            width="380"
            height="416"
            rx="16"
            fill="#0F172A"
            stroke={currentCard.accentColor}
            strokeWidth="3"
          />
          <g transform="translate(0, 14) scale(1, 1.24)">
            <RealisticCardSceneCanvas
              card={currentCard}
              localProgress={localProgress}
              spokenPhase={spokenPhase}
              tickCount={tickCount}
            />
          </g>
          {/* Scene Caption Bar at bottom of animation */}
          <rect x="10" y="362" width="360" height="44" rx="10" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
          <circle cx="26" cy="384" r="5.5" fill="#10B981" />
          <text x="38" y="379" fill="#FDE68A" fontSize="9" fontWeight="900">
            ILLUSTRATION COHÉRENTE • ÉCRAN 0{currentCard.screenNumber} / 05
          </text>
          <text x="38" y="396" fill="#E2E8F0" fontSize="9.5" fontWeight="700">
            {currentCard.animationCaption.slice(0, 58)}
          </text>
        </g>

        {/* RIGHT PANEL: ENLARGED PEDAGOGICAL CONTENT CARD (512 x 416) */}
        <g transform="translate(392, 0)">
          <rect
            x="0"
            y="0"
            width="512"
            height="416"
            rx="16"
            fill="#FFFFFF"
            stroke={currentCard.accentColor}
            strokeWidth="3"
          />

          {/* Top Card Header Banner */}
          <rect x="0" y="0" width="512" height="48" rx="14" fill={currentCard.accentColor} />
          <text x="18" y="21" fill="#FEF08A" fontSize="10" fontWeight="900">
            {currentCard.categoryTag}
          </text>
          <text x="18" y="38" fill="#FFFFFF" fontSize="11.5" fontWeight="900">
            {spokenPhase === 2
              ? '🎙️ EXPLICATION PÉDAGOGIQUE & HUMAINE EN COURS…'
              : currentCard.fieldBannerSubtitle}
          </text>
          <rect x="362" y="12" width="136" height="24" rx="12" fill="#0F172A" fillOpacity="0.88" />
          <text x="430" y="28" textAnchor="middle" fill="#FDE68A" fontSize="9.5" fontWeight="900">
            {currentCard.legalArticle.slice(0, 20)}
          </text>

          {/* Visual Concept Heading */}
          <g transform="translate(20, 72)">
            <text x="0" y="0" fill="#0F172A" fontSize="15.5" fontWeight="900">
              {titleLines[0]}
            </text>
          </g>

          {/* ZONE 2: Enlarged Deep Humanist & Pedagogical Explanation Box (5 lines) */}
          <g transform="translate(18, 86)">
            <rect
              x="0"
              y="0"
              width="476"
              height="168"
              rx="12"
              fill={spokenPhase === 2 ? '#EFF6FF' : '#F8FAFC'}
              stroke={spokenPhase === 2 ? '#2563EB' : '#CBD5E1'}
              strokeWidth={spokenPhase === 2 ? '2.5' : '1.5'}
            />
            <rect
              x="0"
              y="0"
              width="7"
              height={Math.max(16, 168 * explanationReadRatio)}
              rx="3.5"
              fill={spokenPhase === 2 ? '#2563EB' : currentCard.accentColor}
            />
            {explanationLines.map((line, idx) => {
              const lineStart = idx / Math.max(1, explanationLines.length);
              const lineEnd = (idx + 1) / Math.max(1, explanationLines.length);
              const isCurrentLine =
                spokenPhase === 2 &&
                explanationReadRatio >= lineStart &&
                explanationReadRatio <= lineEnd + 0.05;
              const isPastLine = explanationReadRatio >= lineStart;

              return (
                <g key={idx}>
                  {isCurrentLine && (
                    <rect
                      x="11"
                      y={9 + idx * 30}
                      width="454"
                      height="25"
                      rx="5"
                      fill="#DBEAFE"
                    />
                  )}
                  <text
                    x="18"
                    y={26 + idx * 30}
                    fill={isCurrentLine ? '#1E3A8A' : isPastLine ? '#0F172A' : '#64748B'}
                    fontSize="12.2"
                    fontWeight={isCurrentLine || isPastLine ? '800' : '600'}
                  >
                    {line}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ZONE 3: Full-Width Concrete Terrain Application Box & KPI (476px wide) */}
          <g transform="translate(18, 266)">
            <rect
              x="0"
              y="0"
              width="476"
              height="92"
              rx="12"
              fill={spokenPhase === 3 ? '#FEF3C7' : '#FFFBEB'}
              stroke={spokenPhase === 3 ? '#D97706' : '#F59E0B'}
              strokeWidth={spokenPhase === 3 ? '3' : '1.8'}
            />
            <text x="16" y="21" fill="#B45309" fontSize="10" fontWeight="900">
              {currentCard.fieldBoxTitle} {spokenPhase === 3 ? '• EN DIRECT' : ':'}
            </text>
            {ruleLines.map((rLine, rIdx) => (
              <text
                key={rIdx}
                x="16"
                y={42 + rIdx * 19}
                fill={spokenPhase === 3 ? '#78350F' : '#0F172A'}
                fontSize="11.5"
                fontWeight="800"
              >
                {rLine}
              </text>
            ))}

            <rect x="0" y="100" width="476" height="36" rx="10" fill="#0F172A" />
            <text x="16" y="116" fill="#94A3B8" fontSize="9.5" fontWeight="900">
              {currentCard.metricLabel.slice(0, 44).toUpperCase()}
            </text>
            <text x="460" y="116" textAnchor="end" fill="#FBBF24" fontSize="11" fontWeight="900">
              {Math.round(currentCard.metricVal * clamp01(0.25 + localProgress * 0.75))}%
            </text>
            <rect x="16" y="123" width="444" height="6" rx="3" fill="#1E293B" />
            <rect
              x="16"
              y="123"
              width={Math.max(18, 444 * (currentCard.metricVal / 100) * clamp01(0.25 + localProgress * 0.75))}
              height="6"
              rx="3"
              fill={spokenPhase === 3 ? '#10B981' : '#38BDF8'}
            />
            {ruleReadRatio > 0.05 && (
              <circle
                cx={16 + 444 * (currentCard.metricVal / 100) * clamp01(0.25 + localProgress * 0.75)}
                cy="126"
                r="4.5"
                fill="#FBBF24"
              />
            )}
          </g>
        </g>
      </g>
    </g>
  );
};
