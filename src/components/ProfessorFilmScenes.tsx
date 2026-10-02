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
    spokenLeadIn: 'Dans votre quotidien professionnel... gardez bien à l’esprit ce repère essentiel,',
    boxTitle: '💡 DANS VOTRE QUOTIDIEN PROFESSIONNEL',
    bannerSubtitle: '🎙️ REPÈRE POUR VOTRE QUOTIDIEN PROFESSIONNEL…'
  },
  {
    spokenLeadIn: 'Écoutez bien ceci... retenez avec soin ce réflexe précieux,',
    boxTitle: '✨ REPÈRE ESSENTIEL À RETENIR',
    bannerSubtitle: '🎙️ REPÈRE ESSENTIEL À GARDER À L’ESPRIT…'
  },
  {
    spokenLeadIn: 'Concrètement... lorsque vous préparez vos dossiers sur le terrain,',
    boxTitle: '📋 CONCRÈTEMENT POUR VOS DOSSIERS',
    bannerSubtitle: '🎙️ MISE EN ŒUVRE CONCRÈTE DANS VOS DOSSIERS…'
  },
  {
    spokenLeadIn: 'Voyez-vous... voici le bon réflexe professionnel à cultiver,',
    boxTitle: '🧭 LE BON RÉFLEXE À ADOPTER',
    bannerSubtitle: '🎙️ LE BON RÉFLEXE PROFESSIONNEL À ADOPTER…'
  },
  {
    spokenLeadIn: 'Attention toutefois... voici mon conseil de vigilance pour vous protéger,',
    boxTitle: '🛡️ CONSEIL DE VIGILANCE',
    bannerSubtitle: '🎙️ CONSEIL DE VIGILANCE ET DE SÉRÉNITÉ…'
  },
  {
    spokenLeadIn: 'Rassurez-vous... pour sécuriser sereinement votre démarche,',
    boxTitle: '⚖️ POUR SÉCURISER VOTRE DÉMARCHE',
    bannerSubtitle: '🎙️ SÉCURISATION JURIDIQUE DE VOTRE DÉMARCHE…'
  },
  {
    spokenLeadIn: 'Au fond... ce que je vous invite toujours à privilégier,',
    boxTitle: '🌟 CE QU’IL CONVIENT DE PRIVILÉGIER',
    bannerSubtitle: '🎙️ ORIENTATION MÉTHODOLOGIQUE À PRIVILÉGIER…'
  },
  {
    spokenLeadIn: 'Au cœur de votre mission au service du citoyen... souvenez-vous que',
    boxTitle: '🤝 AU CŒUR DE VOTRE MISSION',
    bannerSubtitle: '🎙️ L’ESPRIT DE RESPONSABILITÉ DE VOTRE MISSION…'
  },
  {
    spokenLeadIn: 'C’est là tout le secret d’une procédure apaisée... veillez donc à',
    boxTitle: '🔑 LA CLÉ D’UNE PROCÉDURE SEREINE',
    bannerSubtitle: '🎙️ LA CLÉ D’UNE PROCÉDURE APAISÉE ET CONFORME…'
  },
  {
    spokenLeadIn: 'En réalité... lorsque vous accompagnez vos équipes sur le terrain,',
    boxTitle: '🏛️ EN SITUATION RÉELLE',
    bannerSubtitle: '🎙️ TRANSPOSITION DIRECTE EN SITUATION RÉELLE…'
  },
  {
    spokenLeadIn: 'Dans cet esprit de responsabilité et d’éthique... prenez soin de',
    boxTitle: '🎓 L’ATTITUDE PROFESSIONNELLE ATTENDUE',
    bannerSubtitle: '🎙️ POSTURE ÉTHIQUE ET PROFESSIONNELLE…'
  },
  {
    spokenLeadIn: 'Surtout... afin de protéger durablement l’intérêt général,',
    boxTitle: '🌱 POUR PROTÉGER L’INTÉRÊT GÉNÉRAL',
    bannerSubtitle: '🎙️ PROTECTION CONCRÈTE DE L’INTÉRÊT CITOYEN…'
  },
  {
    spokenLeadIn: 'Soyez très vigilant sur ce point... portez une attention particulière à',
    boxTitle: '🔍 POINT D’ATTENTION MAJEUR',
    bannerSubtitle: '🎙️ POINT D’ATTENTION POUR VOS ÉQUIPES…'
  },
  {
    spokenLeadIn: 'Dans la conduite calme et rigoureuse de vos opérations...',
    boxTitle: '📐 DANS LA CONDUITE DE VOS OPÉRATIONS',
    bannerSubtitle: '🎙️ BONNE CONDUITE DE VOS OPÉRATIONS…'
  },
  {
    spokenLeadIn: 'Enfin, croyez-en mon expérience... voici la règle de sagesse à suivre,',
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
  terrainRule: string,
  explicitSceneId: RealisticCardAnimationId | null,
  fallbackId: RealisticCardAnimationId,
  usedIds?: Set<RealisticCardAnimationId>
): RealisticCardAnimationId {
  if (explicitSceneId && ANIMATION_CATALOG[explicitSceneId]) {
    return explicitSceneId;
  }

  const titleLow = visualTitle.toLowerCase();
  const bodyLow = `${explanationBody} ${terrainRule}`.toLowerCase();

  // Score each animation ID with 4x weight on the visual title and 1.5x weight on the explanation + terrain rule
  const rules: Array<{ id: RealisticCardAnimationId; titleKeywords: string[]; bodyKeywords: string[] }> = [
    {
      id: 'citizen_impact_law',
      titleKeywords: ['deniers publics', 'finalité humaine', 'champ d’application', "champ d'application", 'citoyen', 'social', 'intérêt général', 'utilité', 'bien-être'],
      bodyKeywords: ['école', 'hôpital', 'maternité', 'route', 'citoyen', 'population', 'communauté', 'deniers publics', 'intérêt général', 'dignité', 'usagers']
    },
    {
      id: 'open_competition_access',
      titleKeywords: ['liberté d’accès', "liberté d'accès", 'ouverture concurrentielle', 'appel d’offres ouvert', "appel d'offres ouvert", 'neutralité absolue', 'publicité', 'avis'],
      bodyKeywords: ['liberté d’accès', 'sans entrave', 'marque commerciale', 'ou équivalent', 'accès instantané', 'tous les candidats', 'publier largement', 'opportunité']
    },
    {
      id: 'scale_justice',
      titleKeywords: ['égalité de traitement', 'équité', 'neutralité d’évaluation', 'incompatibilité', 'objectivité', 'comparaison', 'classement', 'respect du travail'],
      bodyKeywords: ['égalité de traitement', 'règles identiques', 'sans préférence', 'sans favoritisme', 'impartial', 'moins-disant', 'équitable', 'bienveillance objective', 'préjugé']
    },
    {
      id: 'transparency_traceability',
      titleKeywords: ['transparence', 'traçabilité', 'redevabilité', 'information des candidats', 'publication proactive', 'archivage', 'piste d’audit'],
      bodyKeywords: ['motifs de rejet', 'procès-verbal', 'documenter', 'transparence', 'candidats évincés', 'archives', 'rendre compte', 'dossier limpide']
    },
    {
      id: 'threshold_gauge',
      titleKeywords: ['seuil', 'fractionnement', 'saucissonnage', 'agrégation', 'économie d’échelle'],
      bodyKeywords: ['seuil', 'fractionner', 'saucissonn', 'découper artificiellement', 'cotation', 'valeur cumulée', 'achats annuels']
    },
    {
      id: 'ministry_cgpmp',
      titleKeywords: ['cgpmp', 'écoute et concertation', 'cellule de gestion', 'autorité contractante', 'recensement', 'besoins', 'commission'],
      bodyKeywords: ['cellule de gestion', 'cgpmp', 'expression des besoins', 'maître d’ouvrage', 'ingénieurs', 'médecins', 'enseignants', 'travail d’équipe', 'utilisateurs']
    },
    {
      id: 'dgcmp_shield',
      titleKeywords: ['dgcmp', 'non-objection', 'ano', 'contrôle a priori', 'autorisation préalable', 'disponibilité effective des crédits', 'sécurisation mutuelle'],
      bodyKeywords: ['dgcmp', 'avis de non-objection', 'contrôle a priori', 'visa préalable', 'crédits budgétaires', 'garde-fou']
    },
    {
      id: 'armp_tower',
      titleKeywords: ['armp', 'régulation', 'dossiers types', 'architecture tripartite', 'notation de la performance', 'formation'],
      bodyKeywords: ['autorité de régulation', 'dossiers types', 'primature', 'directives normatives', 'régulateur']
    },
    {
      id: 'construction_crane',
      titleKeywords: ['travaux', 'chantier', 'ouvrage', 'réception provisoire', 'parfait achèvement', 'réception définitive', 'pré-qualification'],
      bodyKeywords: ['génie civil', 'construction', 'réhabilitation', 'chantier', 'malfaçons', 'plans de récolement', 'ouvrage', 'matériaux']
    },
    {
      id: 'supply_truck',
      titleKeywords: ['fournitures', 'équipements', 'livraison', 'logistique', 'médicaments'],
      bodyKeywords: ['biens mobiliers', 'véhicules', 'médicaments', 'bancs scolaires', 'livraison', 'mise en service', 'équipements']
    },
    {
      id: 'intellectual_compass',
      titleKeywords: ['prestations intellectuelles', 'études', 'consultant', 'termes de référence', 'sous-commission', 'examen de la conformité'],
      bodyKeywords: ['prestations intellectuelles', 'bureaux d’études', 'méthodologique', 'qualité-coût', 'experts clés', 'tdr']
    },
    {
      id: 'dao_calendar',
      titleKeywords: ['plan de passation', 'ppm', 'pilotage dynamique', 'calendrier', 'délai', 'données particulières', 'planification'],
      bodyKeywords: ['plan de passation', 'ppm', 'douze mois', 'rétroplanning', 'programmation', 'calendrier', 'prévisibilité']
    },
    {
      id: 'allotment_puzzle',
      titleKeywords: ['allotissement', 'lots', 'pme', 'sous-traitance', '17/001', 'inclusion'],
      bodyKeywords: ['allotissement', 'lots géographiques', 'pme', 'sous-traitants congolais', 'multi-lots', 'artisans', 'emplois']
    },
    {
      id: 'sealed_ballot_ano',
      titleKeywords: ['ouverture des plis', 'réception sécurisée', 'horodatage', 'cérémonie publique', 'standstill', 'signature', 'plis'],
      bodyKeywords: ['ouverture publique', 'urne', 'enveloppes', 'haute voix', 'heure limite', 'standstill', 'plis']
    },
    {
      id: 'bank_guarantee_vault',
      titleKeywords: ['garantie', 'caution', 'avance', 'retenue', 'décompte', 'avenant', 'révision des prix', 'pénalités', 'confiance contractuelle'],
      bodyKeywords: ['garantie de bonne exécution', 'caution bancaire', 'avance de démarrage', 'décompte', 'acomptes', 'santé financière', 'avenant', 'quinze pour cent', 'intérêts moratoires']
    },
    {
      id: 'gavel_tribunal',
      titleKeywords: ['recours', 'crd', 'différends', 'effet suspensif', 'injonction', 'force exécutoire', 'résiliation', 'arbitrage'],
      bodyKeywords: ['recours gracieux', 'comité de règlement des différends', 'crd', 'effet suspensif', 'litiges', 'contradictoire']
    },
    {
      id: 'audit_scanner',
      titleKeywords: ['audit', 'contrôle a posteriori', 'matérialité', 'cour des comptes', 'conflits d’intérêts', 'collusion', 'exclusion', 'sanction', 'nullité'],
      bodyKeywords: ['auditeurs', 'inspection générale des finances', 'conflit d’intérêts', 'corruption', 'liste noire', 'fraude', 'probité']
    },
    {
      id: 'sigmap_server',
      titleKeywords: ['sigmap', 'numérique', 'guichet numérique', 'interconnexion', 'chiffrement', 'coffre-fort', 'signature électronique', 'open contracting', 'ocds'],
      bodyKeywords: ['sigmap', 'dématérialis', 'cryptographique', 'coffre-fort électronique', 'signature électronique', 'open contracting']
    },
    {
      id: 'legal_codex',
      titleKeywords: ['loi', 'décret', 'droit commun', 'gré à gré', 'restreint', 'ccap', 'cahier des charges'],
      bodyKeywords: ['loi n° 10/010', 'décret n° 10/22', 'cahier des clauses', 'spécifications techniques']
    }
  ];

  const scored = rules.map((rule) => {
    let score = 0;
    for (const kw of rule.titleKeywords) {
      if (titleLow.includes(kw)) score += 7;
    }
    for (const kw of rule.bodyKeywords) {
      if (bodyLow.includes(kw)) score += 2.5;
    }
    // Slight penalty if already used in an earlier screen of the same lesson so each screen's visual context evolves!
    if (usedIds && usedIds.has(rule.id)) {
      score *= 0.35;
    }
    return { id: rule.id, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score > 0) {
    return scored[0].id;
  }

  return fallbackId;
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
  } else if (role === 'pme') {
    precedenceTitle = 'Madame ou Monsieur le Dirigeant de PME Nationale & Sous-Traitante';
    roleBadgeLabel = `RÔLE ACTIF : PME NATIONALE & CONTENU LOCAL • ${rawRoleTitle.toUpperCase()}`;
    roleMissionContext = 'Dans le développement de votre PME congolaise et vos soumissions publiques';
    warmSpokenRole = 'en tant que dirigeant de PME congolaise et acteur majeur du contenu local';
    roleScreenPerspective = [
      `Pour votre PME (${institutionName}), ce principe protège votre accès équitable aux marchés publics allotis et à la sous-traitance (Loi n° 17/001) dans les 26 provinces.`,
      `En tant que ${rawRoleTitle}, cette règle vous aide à préparer un dossier technique et administratif conforme dès le premier dépôt.`,
      `Lors de l'ouverture publique des plis et de l'évaluation, ce garde-fou protège votre PME contre toute éviction arbitraire et valorise la préférence nationale.`,
      `Dans l'exécution de votre marché ou contrat de sous-traitance, ce mécanisme sécurise vos avances de démarrage, vos cautions et le paiement régulier de vos décomptes.`,
      `Pour la croissance durable de votre PME (${institutionName}), cette disposition garantit votre droit au recours devant le CRD de l'ARMP.`
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
  const usedAnimIds = new Set<RealisticCardAnimationId>();

  const PILLAR_SCREEN_META = [
    {
      tab: "1. L'Enjeu (Contexte)",
      header: "1. ACCROCHE & MISE EN CONTEXTE (L'ENJEU) — OBJECTIF : CAPTER L'ATTENTION",
      leadIn: 'Sur le terrain... gardez toujours ce repère essentiel à l’esprit,'
    },
    {
      tab: '2. Le Principe (Règle)',
      header: '2. LE CŒUR DU SUJET : RÈGLE & MÉCANISME (LE PRINCIPE) — NOTION CLÉ',
      leadIn: 'Voyez-vous... dans votre pratique quotidienne, retenez surtout ce principe,'
    },
    {
      tab: '3. La Pratique (Terrain)',
      header: '3. APPLICATION PRATIQUE & RÔLES DU TERRAIN — RÉFLEXES & VIGILANCE',
      leadIn: 'Attention... voici mon conseil de vigilance pour sécuriser vos dossiers,'
    },
    {
      tab: '4. Le Bilan (Livrables)',
      header: '4. SYNTHÈSE & LIVRABLES (LE BILAN) — 3 IDÉES CLÉS & MODÈLES TYPES',
      leadIn: 'Concrètement... pour accompagner sereinement vos équipes au quotidien,'
    },
    {
      tab: '5. La Vérification (Quiz)',
      header: '5. ÉVALUATION & VALIDATION (LA VÉRIFICATION) — QUIZ & ÉTUDE DE CAS',
      leadIn: 'En conclusion... veillez toujours à appliquer cette règle de sagesse,'
    }
  ];

  const screens: SingleScreenCardData[] = clauses.map((clause, idx) => {
    const pillarMeta = PILLAR_SCREEN_META[idx] || PILLAR_SCREEN_META[0];
    const fallbackAnimId = defaultThemeSeq[idx]?.id || 'citizen_impact_law';
    const preParsed = parsePedagogicalBlock(clause, pillarMeta.tab, '');
    const animId = pickCoherentAnimationForCard(
      preParsed.visualTitle,
      preParsed.explanationBody,
      preParsed.terrainRule,
      preParsed.explicitSceneId,
      fallbackAnimId,
      usedAnimIds
    );
    usedAnimIds.add(animId);
    const catalogMeta = ANIMATION_CATALOG[animId];

    const parsed = parsePedagogicalBlock(
      clause,
      pillarMeta.tab,
      catalogMeta.contextualRule
    );

    const shortLabel = pillarMeta.tab;

    // Clean, eloquent & well-paced explanation & practical rule matched to whiteboard drawing speed
    const explanationText = truncateClean(parsed.explanationBody, 230);
    const fieldRuleText = truncateClean(parsed.terrainRule, 150);

    const variation =
      PEDAGOGICAL_TRANSITION_VARIATIONS[
        (Math.max(0, lessonIndex) * 5 + idx) % PEDAGOGICAL_TRANSITION_VARIATIONS.length
      ];

    // Natural, warm human transitions so Aïsha speaks with authentic eloquence rather than reading dry titles
    const naturalTitleSpoken =
      parsed.visualTitle.length > 1 && !/^[A-Z]{2,}/.test(parsed.visualTitle)
        ? parsed.visualTitle.charAt(0).toLowerCase() + parsed.visualTitle.slice(1)
        : parsed.visualTitle;

    const ELOQUENT_OPENERS = [
      `Bonjour et bienvenue, ${precedence.spokenFullName}, c'est un vrai plaisir de vous retrouver aujourd'hui. Prenons le temps d'explorer ensemble ${naturalTitleSpoken}. `,
      `Voyez-vous, au cœur du sujet, penchons-nous maintenant pas à pas sur ${naturalTitleSpoken}. `,
      `Concrètement sur le terrain, regardons de près comment s'applique ${naturalTitleSpoken}. `,
      `Faisons maintenant le point, avec clarté, sur l'essentiel à retenir concernant ${naturalTitleSpoken}. `,
      `Terminons enfin par la validation pratique et la prise de décision autour de ${naturalTitleSpoken}. `
    ];

    const introPrefix = ELOQUENT_OPENERS[idx] || `${parsed.visualTitle}... `;
    const part1Explanation = `${introPrefix}${explanationText}`;

    const personalizedLeadIn = variation.spokenLeadIn || pillarMeta.leadIn;
    const spokenRuleBody =
      fieldRuleText.length > 1 && !/^[A-Z]{2,}/.test(fieldRuleText)
        ? fieldRuleText.charAt(0).toLowerCase() + fieldRuleText.slice(1)
        : fieldRuleText;
    const part2Rule = `${personalizedLeadIn} ${spokenRuleBody}`;

    const fullSpoken = `${part1Explanation} ${part2Rule}`;
    const totalSpokenLen = Math.max(1, fullSpoken.length);
    const exactExplanationStartRatio = clamp01((introPrefix.length * 0.8) / totalSpokenLen);
    // Start drawing the bottom field rule box as soon as Aïsha finishes the 3 explanation points
    const ruleStartChar = part1Explanation.length;
    const shortRoleTag = precedence.roleBadgeLabel.replace(/^RÔLE ACTIF\s*:\s*/i, '').slice(0, 32);

    return {
      screenNumber: idx + 1,
      shortTabLabel: shortLabel,
      categoryTag: `${pillarMeta.header} • ${shortRoleTag}`,
      title: parsed.visualTitle,
      explanation: explanationText,
      fieldRule: fieldRuleText,
      fieldLeadIn: personalizedLeadIn,
      fieldBoxTitle: `${variation.boxTitle} (${precedence.institutionName.slice(0, 22)})`,
      fieldBannerSubtitle: `${variation.bannerSubtitle}`,
      legalArticle: artList[idx],
      metricLabel: catalogMeta.metricLabel,
      metricVal: metricVals[idx],
      accentColor: catalogMeta.color,
      animationId: animId,
      animationCaption: catalogMeta.caption,
      spokenText: fullSpoken,
      explanationStartRatio: exactExplanationStartRatio,
      fieldRuleStartRatio: clamp01(ruleStartChar / totalSpokenLen)
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
}> = React.memo(({ x, y, suitColor, skinColor = '#8D5524', helmetColor, label, waveArm = 0 }) => (
  <g transform={`translate(${x}, ${y})`} style={{ willChange: 'transform' }}>
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
));

const RealisticCardSceneCanvas: React.FC<{
  card: SingleScreenCardData;
  localProgress: number;
  spokenPhase: 1 | 2 | 3;
  tickCount: number;
}> = React.memo(({ card, localProgress, spokenPhase, tickCount }) => {
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
                {spokenPhase === 3 ? 'OUVRAGE ✓' : 'TRAVAUX'}
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
});

// ============================================================================
// SEMANTIC MEANING ANALYZER & CONTEXTUAL VISUAL SKETCH ENGINE
// ("contextualiser selon le sens du contenu")
// ============================================================================
export type SemanticSketchArchetype =
  | 'citizen_school'
  | 'open_access'
  | 'scale_equity'
  | 'transparency_pv'
  | 'triad_institutions'
  | 'cgpmp_needs'
  | 'ppm_calendar'
  | 'thresholds_nosplit'
  | 'works_crane'
  | 'supplies_truck'
  | 'intellectual_tdr'
  | 'pme_allotment'
  | 'sealed_bids'
  | 'dgcmp_ano'
  | 'finance_vault'
  | 'crd_gavel'
  | 'audit_sigmap'
  | 'legal_codex';

interface ClauseSemanticMeta {
  archetype: SemanticSketchArchetype;
  semanticBadge: string;
  flowSteps: [string, string, string];
  miniCaption: string;
  color: string;
  bgTint: string;
}

function analyzeClauseSemanticContext(
  clauseText: string,
  cardTitle: string,
  stepIdx: number,
  usedArchetypes: Set<SemanticSketchArchetype>
): ClauseSemanticMeta {
  const low = `${clauseText} ${cardTitle}`.toLowerCase();
  const clauseOnly = (clauseText || '').toLowerCase();

  const candidates: Array<{
    archetype: SemanticSketchArchetype;
    keywords: string[];
    semanticBadge: string;
    flowSteps: [string, string, string];
    miniCaption: string;
    color: string;
    bgTint: string;
  }> = [
    {
      archetype: 'citizen_school',
      keywords: ['citoyen', 'école', 'hôpital', 'route', 'deniers publics', 'population', 'usager', 'bien-être', 'dignité', 'communauté', 'social', 'utilité'],
      semanticBadge: 'SENS : IMPACT CITOYEN & OUVRAGES',
      flowSteps: ['Deniers Publics', 'École / Hôpital', 'Bien-être Citoyen'],
      miniCaption: 'CDF ➔ École & Hôpital',
      color: '#059669',
      bgTint: '#ECFDF5'
    },
    {
      archetype: 'open_access',
      keywords: ['liberté d’accès', "liberté d'accès", 'publicité', 'avis', 'ouvert', 'sans entrave', 'marque', 'équivalent', 'opportunité', 'concurrence'],
      semanticBadge: 'SENS : LIBRE ACCÈS & PUBLICITÉ',
      flowSteps: ['Avis Publié', 'Cahier Neutre', 'Accès Ouvert'],
      miniCaption: 'Avis Public ➔ Tous Candidats',
      color: '#2563EB',
      bgTint: '#EFF6FF'
    },
    {
      archetype: 'scale_equity',
      keywords: ['égalité', 'équité', 'impartial', 'favoritisme', 'préjugé', 'objectif', 'comparaison', 'identique', 'bienveillance objective', 'mérite'],
      semanticBadge: 'SENS : ÉGALITÉ & IMPARTIALITÉ',
      flowSteps: ['Mêmes Règles', 'Grille Objective', '0% Favoritisme'],
      miniCaption: 'Offre A = Offre B',
      color: '#1D4ED8',
      bgTint: '#EFF6FF'
    },
    {
      archetype: 'transparency_pv',
      keywords: ['transparence', 'traçabilité', 'procès-verbal', 'rejet', 'motif', 'archiver', 'archives', 'rendre compte', 'redevabilité', 'limpide', 'documenter'],
      semanticBadge: 'SENS : TRAÇABILITÉ & MOTIVATION',
      flowSteps: ['PV Écrit', 'Motifs Clairs', 'Archive Intègre'],
      miniCaption: 'PV Motivé & Archivé ✓',
      color: '#0284C7',
      bgTint: '#F0F9FF'
    },
    {
      archetype: 'triad_institutions',
      keywords: ['séparation', 'tripartite', 'indépendance', 'incompatibilité', 'cumul', 'primature', 'architecture'],
      semanticBadge: 'SENS : SÉPARATION DES POUVOIRS',
      flowSteps: ['CGPMP Gère', 'DGCMP Contrôle', 'ARMP Régule'],
      miniCaption: 'Gestion ≠ Contrôle ≠ Régul.',
      color: '#4F46E5',
      bgTint: '#EEF2FF'
    },
    {
      archetype: 'cgpmp_needs',
      keywords: ['cgpmp', 'cellule de gestion', 'médecin', 'ingénieur', 'enseignant', 'besoin', 'concertation', 'équipe', 'utilisateur', 'spécification'],
      semanticBadge: 'SENS : CONCERTATION & BESOINS',
      flowSteps: ['Terrain Métier', 'Équipe CGPMP', 'DAO Adapté'],
      miniCaption: 'Médecins/Ing. + CGPMP',
      color: '#2563EB',
      bgTint: '#EFF6FF'
    },
    {
      archetype: 'ppm_calendar',
      keywords: ['ppm', 'plan de passation', 'calendrier', 'douze mois', '12 mois', 'programmation', 'rétroplanning', 'délai', 'anticipation', 'prévisibilité'],
      semanticBadge: 'SENS : PLANIFICATION PPM 12 MOIS',
      flowSteps: ['Recensement', 'Budget Voté', 'PPM Publié'],
      miniCaption: 'Calendrier PPM T1→T4',
      color: '#0284C7',
      bgTint: '#F0F9FF'
    },
    {
      archetype: 'thresholds_nosplit',
      keywords: ['seuil', 'fractionnement', 'saucissonnage', 'découper', 'agrégation', 'cumul', 'cotation', 'homogène'],
      semanticBadge: 'SENS : SEUILS & ANTI-FRACTIONNEMENT',
      flowSteps: ['Cumul Annuel', 'Zéro Découpage', 'Seuil Respecté'],
      miniCaption: '✂️ Saucissonnage Interdit',
      color: '#D97706',
      bgTint: '#FFFBEB'
    },
    {
      archetype: 'works_crane',
      keywords: ['travaux', 'chantier', 'génie civil', 'construction', 'réhabilitation', 'ouvrage', 'malfaçon', 'réception provisoire', 'réception définitive', 'matériaux'],
      semanticBadge: 'SENS : CHANTIER & OUVRAGE PUBLIC',
      flowSteps: ['Étude & Plans', 'Suivi Chantier', 'Ouvrage Durable'],
      miniCaption: 'Chantier Contrôlé ✓',
      color: '#2563EB',
      bgTint: '#EFF6FF'
    },
    {
      archetype: 'supplies_truck',
      keywords: ['fourniture', 'équipement', 'médicament', 'banc', 'véhicule', 'livraison', 'mobilier', 'logistique', 'réceptionner'],
      semanticBadge: 'SENS : LIVRAISON DE FOURNITURES',
      flowSteps: ['Commande', 'Livraison Site', 'Vérif. Qualité'],
      miniCaption: 'Livraison & Qualité ✓',
      color: '#059669',
      bgTint: '#ECFDF5'
    },
    {
      archetype: 'intellectual_tdr',
      keywords: ['intellectuel', 'étude', 'consultant', 'termes de référence', 'tdr', 'méthodologi', 'qualité-coût', 'expert', 'bureau d’études'],
      semanticBadge: 'SENS : EXPERTISE & ÉTUDES (TDR)',
      flowSteps: ['TDR Précis', 'Score Tech/Fin', 'Expertise Clé'],
      miniCaption: 'TDR : Qualité + Coût',
      color: '#7C3AED',
      bgTint: '#F5F3FF'
    },
    {
      archetype: 'pme_allotment',
      keywords: ['allotissement', 'lot', 'pme', 'sous-traitance', '17/001', 'artisan', 'emploi', 'local', 'province', 'préférence nationale'],
      semanticBadge: 'SENS : ALLOTISSEMENT & PME RDC',
      flowSteps: ['Lots Adaptés', 'PME & Artisans', 'Emplois Locaux'],
      miniCaption: 'Lot 1 • Lot 2 ➔ PME RDC',
      color: '#D97706',
      bgTint: '#FFFBEB'
    },
    {
      archetype: 'sealed_bids',
      keywords: ['pli', 'urne', 'enveloppe', 'scellé', 'horodatage', 'heure limite', 'séance publique', 'haute voix', 'ouverture'],
      semanticBadge: 'SENS : SECRET & OUVERTURE DES PLIS',
      flowSteps: ['Pli Horodaté', 'Urne Scellée', 'Lecture Publique'],
      miniCaption: 'Urne Scellée ➔ Lecture',
      color: '#E11D48',
      bgTint: '#FFF1F2'
    },
    {
      archetype: 'dgcmp_ano',
      keywords: ['dgcmp', 'non-objection', 'ano', 'contrôle a priori', 'visa', 'garde-fou', 'préalable', 'crédits'],
      semanticBadge: 'SENS : CONTRÔLE A PRIORI & VISA ANO',
      flowSteps: ['Examen Dossier', 'Filtre Légal', 'Visa ANO ✓'],
      miniCaption: 'Bouclier DGCMP • ANO ✓',
      color: '#059669',
      bgTint: '#ECFDF5'
    },
    {
      archetype: 'finance_vault',
      keywords: ['garantie', 'caution', 'avance', 'retenue', 'décompte', 'acompte', 'paiement', 'santé financière', 'avenant', '15%', 'quinze pour cent', 'pénalité'],
      semanticBadge: 'SENS : GARANTIES & PAIEMENT JUSTE',
      flowSteps: ['Caution 3-5%', 'Service Fait', 'Paiement & ≤15%'],
      miniCaption: 'Caution & Acompte Payé',
      color: '#7C3AED',
      bgTint: '#F5F3FF'
    },
    {
      archetype: 'crd_gavel',
      keywords: ['recours', 'crd', 'différend', 'suspensif', 'standstill', 'litige', 'arbitrage', 'contradictoire', 'gracieux'],
      semanticBadge: 'SENS : RECOURS SUSPENSIF & CRD',
      flowSteps: ['Standstill ⏸️', 'Écoute Recours', 'Décision CRD'],
      miniCaption: 'Pause & Arbitrage CRD',
      color: '#2563EB',
      bgTint: '#EFF6FF'
    },
    {
      archetype: 'audit_sigmap',
      keywords: ['audit', 'sigmap', 'numérique', 'chiffrement', 'coffre-fort', 'open data', 'ocds', 'conflit d’intérêts', 'corruption', 'fraude', 'cour des comptes', 'sanction'],
      semanticBadge: 'SENS : AUDIT, PROBITÉ & SIGMAP',
      flowSteps: ['Chiffrement 🔒', 'Audit Terrain', 'Zéro Corruption'],
      miniCaption: 'Audit & SIGMAP Chiffré',
      color: '#059669',
      bgTint: '#ECFDF5'
    },
    {
      archetype: 'legal_codex',
      keywords: ['loi', '10/010', 'décret', '10/22', 'dossier type', 'ccap', 'cahier des charges', 'règle', 'droit'],
      semanticBadge: 'SENS : CONFORMITÉ LOI N° 10/010',
      flowSteps: ['Loi n° 10/010', 'Dossier Type', 'Sécurité Légale'],
      miniCaption: 'Socle Légal Loi 10/010',
      color: '#1E3A8A',
      bgTint: '#EFF6FF'
    }
  ];

  let best = candidates[candidates.length - 1];
  let bestScore = -1;

  for (const cand of candidates) {
    let score = 0;
    for (const kw of cand.keywords) {
      if (clauseOnly.includes(kw)) score += 6;
      else if (low.includes(kw)) score += 2;
    }
    if (usedArchetypes.has(cand.archetype)) {
      score *= 0.25;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  if (bestScore <= 0) {
    const fallbacks: SemanticSketchArchetype[] = ['citizen_school', 'cgpmp_needs', 'scale_equity', 'dgcmp_ano', 'transparency_pv'];
    const fbArch = fallbacks[stepIdx % fallbacks.length];
    best = candidates.find((c) => c.archetype === fbArch) || best;
  }

  usedArchetypes.add(best.archetype);
  return {
    archetype: best.archetype,
    semanticBadge: best.semanticBadge,
    flowSteps: best.flowSteps,
    miniCaption: best.miniCaption,
    color: best.color,
    bgTint: best.bgTint
  };
}

interface SynchronizedSketchNode {
  stepNum: string;
  badge: string;
  spokenClause: string;
  line1: string;
  line2: string;
  line3: string;
  keywordPill: string;
  color: string;
  bgTint: string;
  iconType: SemanticSketchArchetype;
  flowSteps: [string, string, string];
  miniCaption: string;
  startRatio: number;
  endRatio: number;
}

interface VisualSketchDiagramData {
  mainFormula: string;
  introStartRatio: number;
  introEndRatio: number;
  nodes: [SynchronizedSketchNode, SynchronizedSketchNode, SynchronizedSketchNode];
  equationPills: [string, string, string];
  terrainCheck1: {
    line1: string;
    line2: string;
    semanticTag: string;
    startRatio: number;
    endRatio: number;
  };
  terrainCheck2: {
    line1: string;
    line2: string;
    semanticTag: string;
    startRatio: number;
    endRatio: number;
  };
  sealStartRatio: number;
}

function splitIntoBalancedSegments(text: string, count: number): string[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return Array(count).fill('');

  const rawParts = clean
    .split(/(?<=[.!?;:])\s+|\s+-\s+|\s*,\s+(?=[A-ZÉÈÊÀa-zéèêà]{3,})|\s+(?=ainsi que|tandis que|afin de|pour que|tout en|et garantit|et assure|et impose|mais )/gi)
    .map((s) => s.replace(/^[,\s\-•:;]+/, '').trim())
    .filter((s) => s.length > 3);

  if (rawParts.length >= count) {
    const result: string[] = [];
    const targetLen = clean.length / count;
    let current = '';
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i];
      if (result.length === count - 1) {
        current = current ? `${current}, ${part}` : part;
      } else if (!current) {
        current = part;
      } else if (current.length + part.length < targetLen * 1.15 && rawParts.length - i >= count - result.length) {
        current = `${current}, ${part}`;
      } else {
        result.push(current);
        current = part;
      }
    }
    if (current) result.push(current);
    while (result.length < count) result.push(clean);
    return result.slice(0, count);
  }

  const words = clean.split(/\s+/);
  const perSeg = Math.max(1, Math.ceil(words.length / count));
  const segments: string[] = [];
  for (let i = 0; i < count; i++) {
    const slice = words.slice(i * perSeg, (i + 1) * perSeg).join(' ');
    segments.push(slice || clean);
  }
  return segments;
}

function formatCompleteVisualLines(
  clause: string,
  maxLineChars = 46
): { line1: string; line2: string; line3: string } {
  const cleaned = (clause || '')
    .replace(/\s+/g, ' ')
    .replace(/^[,\s\-•:;]+/, '')
    .trim();
  if (!cleaned) return { line1: '', line2: '', line3: '' };

  const cap = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const words = cap.split(' ');
  const lines: string[] = ['', '', ''];
  let currentLine = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const candidate = lines[currentLine] ? `${lines[currentLine]} ${w}` : w;
    if (candidate.length <= maxLineChars || !lines[currentLine]) {
      lines[currentLine] = candidate;
    } else if (currentLine < 2) {
      currentLine++;
      lines[currentLine] = w;
    } else {
      lines[2] = `${lines[2]} ${w}`;
    }
  }

  return {
    line1: lines[0],
    line2: lines[1],
    line3: lines[2]
  };
}

function extractLiveSpokenSnippet(spokenText: string, localProgress: number): string {
  const words = (spokenText || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const centerIdx = Math.min(
    words.length - 1,
    Math.max(0, Math.floor(clamp01(localProgress) * words.length))
  );
  const start = Math.max(0, centerIdx - 1);
  const end = Math.min(words.length, start + 5);
  return words.slice(start, end).join(' ');
}

function extractVisualSketchDiagrams(card: SingleScreenCardData): VisualSketchDiagramData {
  const expStart = clamp01(card.explanationStartRatio || 0.12);
  const fieldStart = Math.max(expStart + 0.25, clamp01(card.fieldRuleStartRatio || 0.74));
  const expSpan = Math.max(0.2, fieldStart - expStart);

  const expClauses = splitIntoBalancedSegments(card.explanation || card.title, 3);
  const expLengths = expClauses.map((c) => Math.max(8, c.length));
  const totalExpLen = expLengths[0] + expLengths[1] + expLengths[2];

  const r0Span = (expLengths[0] / totalExpLen) * expSpan;
  const r1Span = (expLengths[1] / totalExpLen) * expSpan;

  const n0Start = expStart;
  const n0End = n0Start + r0Span;
  const n1Start = n0End;
  const n1End = n1Start + r1Span;
  const n2Start = n1End;
  const n2End = fieldStart;

  const fmt0 = formatCompleteVisualLines(expClauses[0], 64);
  const fmt1 = formatCompleteVisualLines(expClauses[1], 64);
  const fmt2 = formatCompleteVisualLines(expClauses[2], 64);

  const usedArch = new Set<SemanticSketchArchetype>();
  const sem0 = analyzeClauseSemanticContext(expClauses[0], card.title, 0, usedArch);
  const sem1 = analyzeClauseSemanticContext(expClauses[1], card.title, 1, usedArch);
  const sem2 = analyzeClauseSemanticContext(expClauses[2], card.title, 2, usedArch);

  const fieldClauses = splitIntoBalancedSegments(card.fieldRule || card.animationCaption, 2);
  const fLen0 = Math.max(6, fieldClauses[0].length);
  const fLen1 = Math.max(6, fieldClauses[1].length);
  const totalFieldLen = fLen0 + fLen1;

  const sealStartRatio = 0.90;
  const fieldDrawSpan = Math.max(0.1, sealStartRatio - fieldStart);
  const check1Start = fieldStart;
  const check1End = check1Start + (fLen0 / totalFieldLen) * fieldDrawSpan;
  const check2Start = check1End;
  const check2End = sealStartRatio;

  const check1Fmt = formatCompleteVisualLines(fieldClauses[0], 68);
  const check2Fmt = formatCompleteVisualLines(fieldClauses[1], 68);
  const semField1 = analyzeClauseSemanticContext(fieldClauses[0], card.title, 3, usedArch);
  const semField2 = analyzeClauseSemanticContext(fieldClauses[1], card.title, 4, usedArch);

  // Exact 3-element pedagogical breakdown for each of the 5 structured chapter pillars
  const PILLAR_ELEMENT_BADGES: Record<number, [string, string, string]> = {
    1: [
      '01 • CAS CONCRET & MISE EN SITUATION',
      '02 • ANCRAGE RÉGLEMENTAIRE (LOI 10/010)',
      '03 • OBJECTIF PÉDAGOGIQUE DU CHAPITRE'
    ],
    2: [
      "01 • PRINCIPE DIRECTEUR (LA RÈGLE D'OR)",
      '02 • SCHÉMA & FLUX (ÉTAPE 01 ➔ 02 ➔ 03)',
      '03 • RÔLES : CGPMP vs DGCMP vs ARMP'
    ],
    3: [
      "01 • CHECK-LIST D'ACTION SUR LE TERRAIN",
      '02 • VIGILANCE & PIÈGES À ÉVITER',
      '03 • RÈGLES DE CONFORMITÉ & VISAS ANO'
    ],
    4: [
      '01 • RÉSUMÉ MOT À MOT (IDÉE CLÉ N°1)',
      '02 • IDÉES CLÉS MAJEURES N°2 & N°3',
      '03 • LIVRABLES & CANEVAS TYPES (DAO/PV)'
    ],
    5: [
      '01 • QUIZ CIBLÉ SUR CAS PRATIQUE',
      '02 • ÉTUDE DE CAS COURTE (SCÉNARIO)',
      '03 • DÉCISION & VALIDATION DU CHAPITRE'
    ]
  };
  const pillarBadges = PILLAR_ELEMENT_BADGES[card.screenNumber] || PILLAR_ELEMENT_BADGES[1];

  return {
    mainFormula: card.title,
    introStartRatio: 0,
    introEndRatio: expStart,
    nodes: [
      {
        stepNum: '01',
        badge: pillarBadges[0],
        spokenClause: expClauses[0],
        line1: fmt0.line1,
        line2: fmt0.line2,
        line3: fmt0.line3,
        keywordPill: sem0.miniCaption,
        color: sem0.color,
        bgTint: sem0.bgTint,
        iconType: sem0.archetype,
        flowSteps: sem0.flowSteps,
        miniCaption: sem0.miniCaption,
        startRatio: n0Start,
        endRatio: n0End
      },
      {
        stepNum: '02',
        badge: pillarBadges[1],
        spokenClause: expClauses[1],
        line1: fmt1.line1,
        line2: fmt1.line2,
        line3: fmt1.line3,
        keywordPill: sem1.miniCaption,
        color: sem1.color,
        bgTint: sem1.bgTint,
        iconType: sem1.archetype,
        flowSteps: sem1.flowSteps,
        miniCaption: sem1.miniCaption,
        startRatio: n1Start,
        endRatio: n1End
      },
      {
        stepNum: '03',
        badge: pillarBadges[2],
        spokenClause: expClauses[2],
        line1: fmt2.line1,
        line2: fmt2.line2,
        line3: fmt2.line3,
        keywordPill: sem2.miniCaption,
        color: sem2.color,
        bgTint: sem2.bgTint,
        iconType: sem2.archetype,
        flowSteps: sem2.flowSteps,
        miniCaption: sem2.miniCaption,
        startRatio: n2Start,
        endRatio: n2End
      }
    ],
    equationPills: [
      `1. ${sem0.flowSteps[0]}`,
      `2. ${sem1.flowSteps[1]}`,
      `3. ${sem2.flowSteps[2]} ✓`
    ],
    terrainCheck1: {
      line1: check1Fmt.line1,
      line2: [check1Fmt.line2, check1Fmt.line3].filter(Boolean).join(' '),
      semanticTag: semField1.miniCaption,
      startRatio: check1Start,
      endRatio: check1End
    },
    terrainCheck2: {
      line1: check2Fmt.line1,
      line2: [check2Fmt.line2, check2Fmt.line3].filter(Boolean).join(' '),
      semanticTag: semField2.miniCaption,
      startRatio: check2Start,
      endRatio: check2End
    },
    sealStartRatio
  };
}

// ============================================================================
// CONTEXTUAL HAND-DRAWN PICTOGRAMS MATCHING CLAUSE MEANING
// ============================================================================
const SketchedNodePictogram: React.FC<{
  type: SemanticSketchArchetype;
  color: string;
  drawProgress: number;
}> = React.memo(({ type, color, drawProgress }) => {
  const p = clamp01(drawProgress);
  const dashOffset = Math.max(0, 126 * (1 - p));

  return (
    <g>
      <circle
        cx="22"
        cy="22"
        r="20"
        fill="#FFFFFF"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray="126"
        strokeDashoffset={dashOffset}
      />
      <g stroke={color} strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {(type === 'citizen_school' || type === 'works_crane') && (
          <>
            <polygon points="22,8 9,17 35,17" fill={p > 0.5 ? `${color}22` : 'none'} />
            <rect x="12" y="17" width="20" height="15" rx="1.5" />
            <line x1="22" y1="11" x2="22" y2="15" />
            <line x1="20" y1="13" x2="24" y2="13" />
            <rect x="19" y="23" width="6" height="9" />
          </>
        )}
        {type === 'scale_equity' && (
          <>
            <line x1="22" y1="9" x2="22" y2="33" />
            <line x1="11" y1="15" x2="33" y2="15" />
            <polygon points="11,15 8,24 14,24" fill={p > 0.5 ? '#FEF08A' : 'none'} />
            <polygon points="33,15 30,24 36,24" fill={p > 0.5 ? '#FEF08A' : 'none'} />
            <line x1="16" y1="33" x2="28" y2="33" />
          </>
        )}
        {type === 'open_access' && (
          <>
            <path d="M 11 22 L 19 16 L 19 28 Z" fill={p > 0.5 ? `${color}22` : 'none'} />
            <path d="M 23 16 Q 28 22 23 28" />
            <path d="M 27 12 Q 35 22 27 32" />
          </>
        )}
        {(type === 'triad_institutions' || type === 'cgpmp_needs') && (
          <>
            <rect x="9" y="13" width="6" height="18" rx="1" fill={p > 0.4 ? `${color}22` : 'none'} />
            <rect x="19" y="10" width="6" height="21" rx="1" fill={p > 0.6 ? `${color}33` : 'none'} />
            <rect x="29" y="13" width="6" height="18" rx="1" fill={p > 0.8 ? `${color}22` : 'none'} />
            <line x1="8" y1="33" x2="36" y2="33" />
          </>
        )}
        {type === 'ppm_calendar' && (
          <>
            <rect x="10" y="11" width="24" height="22" rx="3" fill={p > 0.5 ? `${color}18` : 'none'} />
            <line x1="10" y1="17" x2="34" y2="17" />
            <line x1="16" y1="8" x2="16" y2="13" />
            <line x1="28" y1="8" x2="28" y2="13" />
            <path d="M 16 25 L 20 29 L 28 21" />
          </>
        )}
        {type === 'thresholds_nosplit' && (
          <>
            <path d="M 11 28 A 11 11 0 0 1 33 28" />
            <line x1="22" y1="28" x2="29" y2="17" strokeWidth="2.5" />
            <circle cx="22" cy="28" r="2.5" fill={color} />
          </>
        )}
        {type === 'supplies_truck' && (
          <>
            <rect x="9" y="14" width="16" height="12" rx="2" fill={p > 0.5 ? `${color}22` : 'none'} />
            <path d="M 25 18 L 32 18 L 35 22 L 35 26 L 25 26 Z" />
            <circle cx="15" cy="29" r="3" />
            <circle cx="30" cy="29" r="3" />
          </>
        )}
        {type === 'intellectual_tdr' && (
          <>
            <circle cx="22" cy="12" r="3" fill={color} />
            <line x1="20" y1="15" x2="13" y2="33" />
            <line x1="24" y1="15" x2="31" y2="33" />
            <line x1="15" y1="25" x2="29" y2="25" />
          </>
        )}
        {type === 'pme_allotment' && (
          <>
            <rect x="10" y="11" width="10" height="10" rx="2" fill={p > 0.4 ? '#DBEAFE' : 'none'} />
            <rect x="24" y="11" width="10" height="10" rx="2" fill={p > 0.6 ? '#D1FAE5' : 'none'} />
            <rect x="17" y="24" width="10" height="10" rx="2" fill={p > 0.8 ? '#FEF3C7' : 'none'} />
          </>
        )}
        {type === 'sealed_bids' && (
          <>
            <rect x="10" y="13" width="24" height="18" rx="2" fill={p > 0.5 ? '#FEF3C7' : 'none'} />
            <polyline points="10,13 22,23 34,13" />
            <circle cx="22" cy="22" r="3" fill="#E11D48" />
          </>
        )}
        {type === 'dgcmp_ano' && (
          <>
            <path
              d="M 22 8 L 34 13 L 34 23 C 34 31 22 36 22 36 C 22 36 10 31 10 23 L 10 13 Z"
              fill={p > 0.55 ? `${color}22` : 'none'}
            />
            <path d="M 17 22 L 21 26 L 28 18" strokeWidth="2.6" />
          </>
        )}
        {type === 'finance_vault' && (
          <>
            <rect x="10" y="11" width="24" height="22" rx="3" fill={p > 0.5 ? `${color}18` : 'none'} />
            <circle cx="22" cy="22" r="6" />
            <line x1="22" y1="16" x2="22" y2="28" />
            <line x1="16" y1="22" x2="28" y2="22" />
          </>
        )}
        {type === 'crd_gavel' && (
          <>
            <rect x="14" y="10" width="16" height="8" rx="2" fill={p > 0.5 ? '#FEF08A' : 'none'} />
            <line x1="22" y1="18" x2="22" y2="31" strokeWidth="2.6" />
            <line x1="12" y1="33" x2="32" y2="33" strokeWidth="3" />
          </>
        )}
        {(type === 'transparency_pv' || type === 'audit_sigmap' || type === 'legal_codex') && (
          <>
            <rect x="11" y="9" width="20" height="25" rx="2" fill={p > 0.5 ? `${color}15` : 'none'} />
            <line x1="15" y1="15" x2="27" y2="15" />
            <line x1="15" y1="20" x2="27" y2="20" />
            <circle cx="27" cy="27" r="5" fill="#FEF08A" />
            <line x1="31" y1="31" x2="35" y2="35" strokeWidth="2.6" />
          </>
        )}
      </g>
    </g>
  );
});

// ============================================================================
// CONTEXTUAL MINI-DIAGRAM DRAWN ON THE RIGHT OF EACH WHITEBOARD NODE
// Visually illustrates the concrete meaning ("le sens") of that exact clause!
// ============================================================================
const SketchedContextualMiniDiagram: React.FC<{
  archetype: SemanticSketchArchetype;
  color: string;
  flowSteps: [string, string, string];
  miniCaption: string;
  drawProgress: number;
}> = React.memo(({ archetype, color, flowSteps, miniCaption, drawProgress }) => {
  const p = clamp01((drawProgress - 0.45) / 0.55);

  return (
    <g transform="translate(332, 6)">
      {/* Sketched Mini-Canvas Frame (148 x 60) */}
      <rect
        x="0"
        y="0"
        width="148"
        height="60"
        rx="10"
        fill="#FFFFFF"
        stroke={color}
        strokeWidth="1.8"
        strokeDasharray="420"
        strokeDashoffset={Math.max(0, 420 * (1 - clamp01(drawProgress * 1.4)))}
      />

      {/* Top Mini-Header showing the Semantic Meaning */}
      <rect x="2" y="2" width="144" height="14" rx="7" fill={color} fillOpacity="0.12" />
      <text x="74" y="11.5" textAnchor="middle" fill={color} fontSize="7.2" fontWeight="900">
        ✍️ {miniCaption}
      </text>

      {/* Contextual Hand-Drawn Scene inside the Mini-Canvas (y=18..43) */}
      <g transform="translate(8, 17)" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round">
        {archetype === 'citizen_school' && (
          <>
            <circle cx="16" cy="13" r="9" fill="#FEF08A" />
            <text x="16" y="16" textAnchor="middle" fill="#0F172A" fontSize="6.5" fontWeight="900" stroke="none">
              CDF
            </text>
            <path d="M 28 13 L 44 13" strokeWidth="2" />
            <polygon points="64,3 48,11 80,11" fill={`${color}22`} />
            <rect x="51" y="11" width="26" height="13" fill="#ECFDF5" />
            <path d="M 84 13 L 98 13" strokeWidth="2" />
            <circle cx="112" cy="8" r="4" fill={color} />
            <path d="M 105 23 C 105 15 119 15 119 23" fill={`${color}33`} />
          </>
        )}

        {archetype === 'scale_equity' && (
          <>
            <line x1="66" y1="3" x2="66" y2="24" strokeWidth="2" />
            <line x1="28" y1="8" x2="104" y2="8" strokeWidth="2" />
            <rect x="14" y="11" width="28" height="12" rx="3" fill="#DBEAFE" />
            <text x="28" y="19.5" textAnchor="middle" fill="#1E3A8A" fontSize="6.5" fontWeight="900" stroke="none">
              OFFRE A
            </text>
            <text x="66" y="19" textAnchor="middle" fill={color} fontSize="9" fontWeight="900" stroke="none">
              =
            </text>
            <rect x="90" y="11" width="28" height="12" rx="3" fill="#D1FAE5" />
            <text x="104" y="19.5" textAnchor="middle" fill="#065F46" fontSize="6.5" fontWeight="900" stroke="none">
              OFFRE B
            </text>
          </>
        )}

        {archetype === 'thresholds_nosplit' && (
          <>
            {/* Crossed-out scissors ("Saucissonnage interdit") */}
            <circle cx="24" cy="13" r="10" fill="#FEE2E2" stroke="#E11D48" />
            <line x1="17" y1="6" x2="31" y2="20" stroke="#E11D48" strokeWidth="2.2" />
            <text x="24" y="15.5" textAnchor="middle" fill="#991B1B" fontSize="7.5" fontWeight="900" stroke="none">
              ✂️
            </text>
            <path d="M 38 13 L 54 13" strokeWidth="2" />
            {/* Cumulative bar chart */}
            <rect x="60" y="15" width="14" height="9" fill="#FDE68A" />
            <rect x="78" y="10" width="14" height="14" fill="#F59E0B" />
            <rect x="96" y="4" width="26" height="20" rx="3" fill="#10B981" />
            <text x="109" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="6.2" fontWeight="900" stroke="none">
              CUMUL
            </text>
          </>
        )}

        {archetype === 'pme_allotment' && (
          <>
            <rect x="4" y="4" width="32" height="18" rx="3" fill="#DBEAFE" />
            <text x="20" y="15.5" textAnchor="middle" fill="#1E3A8A" fontSize="6.5" fontWeight="900" stroke="none">
              LOT 1
            </text>
            <rect x="40" y="4" width="32" height="18" rx="3" fill="#D1FAE5" />
            <text x="56" y="15.5" textAnchor="middle" fill="#065F46" fontSize="6.5" fontWeight="900" stroke="none">
              LOT 2
            </text>
            <path d="M 76 13 L 88 13" strokeWidth="2" />
            <rect x="90" y="4" width="38" height="18" rx="4" fill="#FEF3C7" stroke="#D97706" />
            <text x="109" y="15.5" textAnchor="middle" fill="#92400E" fontSize="6.5" fontWeight="900" stroke="none">
              PME RDC
            </text>
          </>
        )}

        {archetype === 'sealed_bids' && (
          <>
            <rect x="6" y="5" width="32" height="17" rx="2" fill="#FEF3C7" />
            <polyline points="6,5 22,14 38,5" />
            <circle cx="22" cy="13" r="2.5" fill="#E11D48" />
            <path d="M 42 13 L 56 13" strokeWidth="2" />
            <rect x="60" y="3" width="30" height="20" rx="3" fill="#DBEAFE" />
            <text x="75" y="15.5" textAnchor="middle" fill="#1E3A8A" fontSize="6.2" fontWeight="900" stroke="none">
              URNE 🔒
            </text>
            <circle cx="112" cy="13" r="9" fill="#FFF1F2" />
            <polyline points="112,8 112,13 116,15" />
          </>
        )}

        {archetype === 'triad_institutions' && (
          <>
            <rect x="2" y="4" width="36" height="18" rx="3" fill="#DBEAFE" />
            <text x="20" y="15.5" textAnchor="middle" fill="#1E3A8A" fontSize="6.2" fontWeight="900" stroke="none">
              CGPMP
            </text>
            <line x1="42" y1="2" x2="42" y2="24" stroke="#E11D48" strokeWidth="2.2" strokeDasharray="3 2" />
            <rect x="46" y="4" width="38" height="18" rx="3" fill="#D1FAE5" />
            <text x="65" y="15.5" textAnchor="middle" fill="#065F46" fontSize="6.2" fontWeight="900" stroke="none">
              DGCMP
            </text>
            <line x1="88" y1="2" x2="88" y2="24" stroke="#E11D48" strokeWidth="2.2" strokeDasharray="3 2" />
            <rect x="92" y="4" width="36" height="18" rx="3" fill="#FEF3C7" />
            <text x="110" y="15.5" textAnchor="middle" fill="#92400E" fontSize="6.2" fontWeight="900" stroke="none">
              ARMP
            </text>
          </>
        )}

        {archetype !== 'citizen_school' &&
          archetype !== 'scale_equity' &&
          archetype !== 'thresholds_nosplit' &&
          archetype !== 'pme_allotment' &&
          archetype !== 'sealed_bids' &&
          archetype !== 'triad_institutions' && (
            <>
              {flowSteps.map((st, sIdx) => (
                <g key={sIdx} transform={`translate(${sIdx * 44}, 3)`}>
                  <rect
                    x="0"
                    y="0"
                    width="39"
                    height="19"
                    rx="4"
                    fill={sIdx === 2 && p > 0.6 ? '#DCFCE7' : '#F8FAFC'}
                    stroke={color}
                    strokeWidth="1.3"
                  />
                  <text
                    x="19.5"
                    y="12"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="5.8"
                    fontWeight="900"
                    stroke="none"
                  >
                    {st.slice(0, 11)}
                  </text>
                  {sIdx < 2 && (
                    <text x="41.5" y="12" textAnchor="middle" fill={color} fontSize="7" fontWeight="900" stroke="none">
                      ➔
                    </text>
                  )}
                </g>
              ))}
            </>
          )}
      </g>

      {/* Bottom 3-Step Semantic Flow Footer inside Mini-Diagram */}
      <text x="74" y="54" textAnchor="middle" fill="#334155" fontSize="6.4" fontWeight="900">
        {flowSteps[0]} ➔ {flowSteps[1]} ➔ {flowSteps[2]}
      </text>
    </g>
  );
});

// ============================================================================
// SHARED LINE-BY-LINE WRITING GEOMETRY & FLUID TRAJECTORY HELPER
// Guarantees 100% pixel lockstep between per-line ink clipPaths and Marker Nib (0,0)
// ============================================================================
interface MultiLineWriteMetrics {
  l1Ratio: number;
  l2Ratio: number;
  l3Ratio: number;
  w1: number;
  w2: number;
  w3: number;
  activeLine: 1 | 2 | 3;
  nibLocalX: number;
  nibLocalY: number;
}

function estimateLinePixelWidth(text: string, charPx: number, maxWidthPx: number): number {
  if (!text) return 0;
  return Math.min(maxWidthPx, Math.max(26, Math.round(text.length * charPx)));
}

function easeInOutCubic(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function computeNodeWritingMetrics(
  node: SynchronizedSketchNode,
  nodeRatio: number
): MultiLineWriteMetrics {
  const r = clamp01(nodeRatio);
  const len1 = Math.max(1, node.line1.length);
  const len2 = node.line2 ? node.line2.length : 0;
  const len3 = node.line3 ? node.line3.length : 0;
  const totalLen = Math.max(1, len1 + len2 + len3);

  const r1End = len1 / totalLen;
  const r2End = (len1 + len2) / totalLen;

  const w1 = estimateLinePixelWidth(node.line1, 5.25, 266);
  const w2 = len2 > 0 ? estimateLinePixelWidth(node.line2, 5.05, 266) : 0;
  const w3 = len3 > 0 ? estimateLinePixelWidth(node.line3, 4.95, 266) : 0;

  const l1Ratio = clamp01(r / Math.max(0.01, r1End));
  const l2Ratio = len2 > 0 ? clamp01((r - r1End) / Math.max(0.01, r2End - r1End)) : 0;
  const l3Ratio = len3 > 0 ? clamp01((r - r2End) / Math.max(0.01, 1 - r2End)) : 0;

  const textStartX = 64;
  const y1 = 33;
  const y2 = 48;
  const y3 = 62;

  // Determine active line & smooth carriage-return glide between lines
  if (r <= r1End || len2 === 0) {
    return {
      l1Ratio,
      l2Ratio: 0,
      l3Ratio: 0,
      w1,
      w2,
      w3,
      activeLine: 1,
      nibLocalX: textStartX + w1 * l1Ratio,
      nibLocalY: y1
    };
  }

  if (r <= r2End || len3 === 0) {
    // Smooth carriage return from end of line 1 to start of line 2 over the first 10% of line 2
    const glideZone = 0.1;
    const targetX = textStartX + w2 * l2Ratio;
    if (l2Ratio < glideZone) {
      const gt = easeInOutCubic(l2Ratio / glideZone);
      return {
        l1Ratio: 1,
        l2Ratio,
        l3Ratio: 0,
        w1,
        w2,
        w3,
        activeLine: 2,
        nibLocalX: lerp(textStartX + w1, targetX, gt),
        nibLocalY: lerp(y1, y2, gt) - Math.sin(gt * Math.PI) * 4.5
      };
    }
    return {
      l1Ratio: 1,
      l2Ratio,
      l3Ratio: 0,
      w1,
      w2,
      w3,
      activeLine: 2,
      nibLocalX: targetX,
      nibLocalY: y2
    };
  }

  // Line 3 active: smooth carriage return from end of line 2 to start of line 3
  const glideZone = 0.12;
  const targetX = textStartX + w3 * l3Ratio;
  if (l3Ratio < glideZone) {
    const gt = easeInOutCubic(l3Ratio / glideZone);
    return {
      l1Ratio: 1,
      l2Ratio: 1,
      l3Ratio,
      w1,
      w2,
      w3,
      activeLine: 3,
      nibLocalX: lerp(textStartX + w2, targetX, gt),
      nibLocalY: lerp(y2, y3, gt) - Math.sin(gt * Math.PI) * 4.5
    };
  }

  return {
    l1Ratio: 1,
    l2Ratio: 1,
    l3Ratio,
    w1,
    w2,
    w3,
    activeLine: 3,
    nibLocalX: targetX,
    nibLocalY: y3
  };
}

function computeTerrainCheckWritingMetrics(
  check: { line1: string; line2: string; line3?: string },
  checkRatio: number
): {
  l1Ratio: number;
  l2Ratio: number;
  w1: number;
  w2: number;
  nibLocalX: number;
  nibLocalY: number;
} {
  const r = clamp01(checkRatio);
  const len1 = Math.max(1, check.line1.length);
  const len2 = check.line2 ? check.line2.length : 0;
  const totalLen = Math.max(1, len1 + len2);
  const r1End = len1 / totalLen;

  const w1 = estimateLinePixelWidth(check.line1, 5.15, 338);
  const w2 = len2 > 0 ? estimateLinePixelWidth(check.line2, 4.95, 338) : 0;

  const l1Ratio = clamp01(r / Math.max(0.01, r1End));
  const l2Ratio = len2 > 0 ? clamp01((r - r1End) / Math.max(0.01, 1 - r1End)) : 0;

  const textStartX = 33;
  const y1 = 12;
  const y2 = 25;

  if (r <= r1End || len2 === 0) {
    return {
      l1Ratio,
      l2Ratio: 0,
      w1,
      w2,
      nibLocalX: textStartX + w1 * l1Ratio,
      nibLocalY: y1
    };
  }

  const glideZone = 0.12;
  const targetX = textStartX + w2 * l2Ratio;
  if (l2Ratio < glideZone) {
    const gt = easeInOutCubic(l2Ratio / glideZone);
    return {
      l1Ratio: 1,
      l2Ratio,
      w1,
      w2,
      nibLocalX: lerp(textStartX + w1, targetX, gt),
      nibLocalY: lerp(y1, y2, gt) - Math.sin(gt * Math.PI) * 4
    };
  }

  return {
    l1Ratio: 1,
    l2Ratio,
    w1,
    w2,
    nibLocalX: targetX,
    nibLocalY: y2
  };
}

// ============================================================================
// DRAWING HAND COMPONENT REMOVED PER USER REQUEST ("Enlever la main")
// ============================================================================
export const RealisticDrawingHandSVG: React.FC<{
  x: number;
  y: number;
  angleDeg: number;
  inkColor: string;
  isDrawing: boolean;
  phaseLabel?: string;
  liveWords?: string;
  tickCount: number;
}> = React.memo(() => null);

// ============================================================================
// SINGLE ESSENTIAL ILLUSTRATION PANEL (LEFT SIDE OF WHITEBOARD: 348 x 420)
// Draws ONLY ONE large, clean, uncluttered visual representation matching
// what the voice is currently explaining, plus the 3 fundamental keywords.
// ============================================================================
const EssentialVoiceSyncedIllustration: React.FC<{
  archetype: SemanticSketchArchetype;
  color: string;
  badgeLabel: string;
  miniCaption: string;
  flowSteps: [string, string, string];
  drawProgress: number;
  legalArticle: string;
}> = React.memo(
  ({ archetype, color, badgeLabel, miniCaption, flowSteps, drawProgress, legalArticle }) => {
    const p = clamp01(drawProgress);
    const strokeDash = Math.max(0, 520 * (1 - clamp01(p * 1.35)));
    const fillOpacity = clamp01((p - 0.25) / 0.55);

    return (
      <g>
        {/* Clean Light Sketchpad Card */}
        <rect
          x="0"
          y="0"
          width="348"
          height="420"
          rx="16"
          fill="#FFFFFF"
          stroke={color}
          strokeWidth="3"
        />

        {/* Minimalist Header */}
        <rect x="0" y="0" width="348" height="50" rx="14" fill="#0F172A" />
        <text x="18" y="20" fill="#FBBF24" fontSize="8" fontWeight="900">
          🎨 CROQUIS ESSENTIEL DE L&apos;EXPLICATION
        </text>
        <text x="18" y="38" fill="#FFFFFF" fontSize="11.5" fontWeight="900">
          {miniCaption}
        </text>

        {/* Single Large, Clean, Centered Hand-Drawn Illustration (x=24..324, y=68..296) */}
        <g transform="translate(24, 68)">
          <rect
            x="0"
            y="0"
            width="300"
            height="224"
            rx="16"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="1.8"
          />

          <g
            transform="translate(30, 22)"
            stroke={color}
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="520"
            strokeDashoffset={strokeDash}
          >
            {(archetype === 'citizen_school' || archetype === 'works_crane') && (
              <g>
                {/* Essential Public Infrastructure Building (Clean & Iconic) */}
                <polygon
                  points="120,14 36,64 204,64"
                  fill={fillOpacity > 0.2 ? '#DBEAFE' : 'none'}
                />
                <rect
                  x="50"
                  y="64"
                  width="140"
                  height="96"
                  rx="6"
                  fill={fillOpacity > 0.4 ? '#EFF6FF' : 'none'}
                />
                <rect x="72" y="84" width="28" height="26" rx="3" fill={fillOpacity > 0.6 ? '#FDE68A' : 'none'} />
                <rect x="140" y="84" width="28" height="26" rx="3" fill={fillOpacity > 0.6 ? '#FDE68A' : 'none'} />
                <rect x="104" y="114" width="32" height="46" rx="3" fill={fillOpacity > 0.7 ? color : 'none'} />
                <line x1="20" y1="160" x2="220" y2="160" strokeWidth="4" />
              </g>
            )}

            {archetype === 'scale_equity' && (
              <g>
                {/* Essential Balance of Justice & Equality of Bids */}
                <line x1="120" y1="16" x2="120" y2="156" strokeWidth="4" />
                <line x1="76" y1="156" x2="164" y2="156" strokeWidth="4.5" />
                <line x1="36" y1="46" x2="204" y2="46" strokeWidth="3.5" />
                <polygon points="36,46 14,96 58,96" fill={fillOpacity > 0.4 ? '#DBEAFE' : 'none'} />
                <polygon points="204,46 182,96 226,96" fill={fillOpacity > 0.4 ? '#D1FAE5' : 'none'} />
                <circle cx="120" cy="46" r="9" fill="#FBBF24" />
              </g>
            )}

            {archetype === 'open_access' && (
              <g>
                {/* Essential Public Call Megaphone */}
                <polygon
                  points="44,86 116,42 116,130 44,86"
                  fill={fillOpacity > 0.35 ? '#FEF3C7' : 'none'}
                />
                <rect x="24" y="72" width="20" height="28" rx="4" fill={fillOpacity > 0.5 ? color : 'none'} />
                <path d="M 140 58 Q 168 86 140 114" strokeWidth="3.5" />
                <path d="M 164 40 Q 204 86 164 132" strokeWidth="3.5" />
              </g>
            )}

            {(archetype === 'triad_institutions' || archetype === 'cgpmp_needs') && (
              <g>
                {/* Essential 3 Institutional Pillars: CGPMP • DGCMP • ARMP */}
                <g transform="translate(10, 24)">
                  <polygon points="32,0 4,18 60,18" fill={fillOpacity > 0.3 ? '#DBEAFE' : 'none'} />
                  <rect x="8" y="18" width="48" height="106" rx="4" fill={fillOpacity > 0.4 ? '#EFF6FF' : 'none'} />
                  <text x="32" y="76" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="900" stroke="none">
                    CGPMP
                  </text>
                </g>
                <g transform="translate(88, 24)">
                  <polygon points="32,0 4,18 60,18" fill={fillOpacity > 0.5 ? '#D1FAE5' : 'none'} />
                  <rect x="8" y="18" width="48" height="106" rx="4" fill={fillOpacity > 0.6 ? '#ECFDF5' : 'none'} />
                  <text x="32" y="76" textAnchor="middle" fill="#065F46" fontSize="10" fontWeight="900" stroke="none">
                    DGCMP
                  </text>
                </g>
                <g transform="translate(166, 24)">
                  <polygon points="32,0 4,18 60,18" fill={fillOpacity > 0.7 ? '#FEF3C7' : 'none'} />
                  <rect x="8" y="18" width="48" height="106" rx="4" fill={fillOpacity > 0.8 ? '#FFFBEB' : 'none'} />
                  <text x="32" y="76" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="900" stroke="none">
                    ARMP
                  </text>
                </g>
              </g>
            )}

            {archetype === 'thresholds_nosplit' && (
              <g>
                {/* Essential Anti-Saucissonnage Symbol */}
                <circle
                  cx="120"
                  cy="86"
                  r="64"
                  fill={fillOpacity > 0.35 ? '#FEE2E2' : 'none'}
                  stroke="#E11D48"
                  strokeWidth="4"
                />
                <line x1="84" y1="64" x2="156" y2="108" stroke="#991B1B" strokeWidth="3.5" />
                <line x1="84" y1="108" x2="156" y2="64" stroke="#991B1B" strokeWidth="3.5" />
                <line x1="74" y1="40" x2="166" y2="132" stroke="#E11D48" strokeWidth="5" />
              </g>
            )}

            {archetype === 'dgcmp_ano' && (
              <g>
                {/* Essential Conformity Shield & ANO Checkmark */}
                <path
                  d="M 120 14 L 194 40 L 194 94 C 194 140 120 168 120 168 C 120 168 46 140 46 94 L 46 40 Z"
                  fill={fillOpacity > 0.4 ? '#D1FAE5' : 'none'}
                  stroke="#059669"
                  strokeWidth="4"
                />
                <polyline points="88,92 112,116 156,66" stroke="#059669" strokeWidth="5" />
              </g>
            )}

            {archetype === 'sealed_bids' && (
              <g>
                {/* Essential Sealed Bid Envelope */}
                <rect
                  x="36"
                  y="36"
                  width="168"
                  height="108"
                  rx="10"
                  fill={fillOpacity > 0.4 ? '#FEF3C7' : 'none'}
                />
                <polyline points="36,36 120,98 204,36" strokeWidth="3.5" />
                <circle cx="120" cy="92" r="14" fill="#E11D48" />
              </g>
            )}

            {archetype !== 'citizen_school' &&
              archetype !== 'works_crane' &&
              archetype !== 'scale_equity' &&
              archetype !== 'open_access' &&
              archetype !== 'triad_institutions' &&
              archetype !== 'cgpmp_needs' &&
              archetype !== 'thresholds_nosplit' &&
              archetype !== 'dgcmp_ano' &&
              archetype !== 'sealed_bids' && (
                <g>
                  {/* Essential Official Document & Validation Checkmark */}
                  <rect
                    x="56"
                    y="16"
                    width="128"
                    height="148"
                    rx="10"
                    fill={fillOpacity > 0.35 ? '#EFF6FF' : 'none'}
                  />
                  <line x1="80" y1="50" x2="160" y2="50" strokeWidth="3.5" />
                  <line x1="80" y1="78" x2="160" y2="78" strokeWidth="3.5" />
                  <line x1="80" y1="106" x2="132" y2="106" strokeWidth="3.5" />
                  <circle cx="156" cy="132" r="24" fill={fillOpacity > 0.6 ? '#DCFCE7' : 'none'} stroke="#059669" />
                  <polyline points="145,132 153,140 169,122" stroke="#059669" strokeWidth="3.5" />
                </g>
              )}
          </g>
        </g>

        {/* Bottom 3 Essential Keywords Flow (Clean & Easy to Read) */}
        <g transform="translate(24, 308)">
          <rect x="0" y="0" width="300" height="54" rx="12" fill="#0F172A" />
          <text x="150" y="19" textAnchor="middle" fill="#FBBF24" fontSize="8.2" fontWeight="900">
            REPÈRE VISUEL • {badgeLabel.slice(0, 34)}
          </text>
          <text x="150" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
            {flowSteps[0]} ➔ {flowSteps[1]} ➔ {flowSteps[2]}
          </text>
        </g>

        {/* Legal Reference Pill at Bottom */}
        <g transform="translate(24, 372)">
          <rect x="0" y="0" width="300" height="32" rx="10" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <text x="150" y="20" textAnchor="middle" fill="#1E3A8A" fontSize="9.5" fontWeight="900">
            ⚖️ Base légale : {legalArticle}
          </text>
        </g>
      </g>
    );
  }
);

// ============================================================================
// HAND TRAJECTORY ENGINE: DRAWS THE ESSENTIAL ICON + WRITES FUNDAMENTAL POINTS
// ============================================================================
function computeHandDrawingPose(
  p: number,
  sketchData: VisualSketchDiagramData,
  accentColor: string,
  liveWords: string
): {
  x: number;
  y: number;
  angleDeg: number;
  inkColor: string;
  isDrawing: boolean;
  phaseLabel: string;
  liveWords: string;
  activeZone: 'intro' | 'node0' | 'node1' | 'node2' | 'check1' | 'check2' | 'seal';
} {
  const cp = clamp01(p);
  const introEnd = sketchData.introEndRatio;

  // Global SVG origin of the Right Fundamental Points Board: X = 28 + 364 = 392, Y = 94
  const boardOriginX = 392;
  const boardOriginY = 94;

  // Phase 0 (0.00 -> introEndRatio): Hand writes the Main Title on the Top Header
  if (cp < introEnd) {
    const t = clamp01(cp / Math.max(0.04, introEnd));
    const titleWidthPx = estimateLinePixelWidth(sketchData.mainFormula, 7.2, 360);
    return {
      x: boardOriginX + 18 + titleWidthPx * t,
      y: boardOriginY + 38,
      angleDeg: -14,
      inkColor: '#FBBF24',
      isDrawing: true,
      phaseLabel: 'Écriture du Titre',
      liveWords,
      activeZone: 'intro'
    };
  }

  // Phases 1, 2, 3: For each of the 3 Fundamental Elements:
  // - First 22% of the segment: Hand sketches the essential icon on the left of the row
  // - Remaining 78% of the segment: Hand writes the fundamental phrase (Line 1 -> Line 2)
  for (let nIdx = 0; nIdx < 3; nIdx++) {
    const node = sketchData.nodes[nIdx];
    if (cp < node.endRatio) {
      const nodeRatio = clamp01(
        (cp - node.startRatio) / Math.max(0.02, node.endRatio - node.startRatio)
      );
      const rowOriginX = boardOriginX + 14; // 406
      const rowOriginY = boardOriginY + 64 + nIdx * 82; // 158, 240, 322

      if (nodeRatio < 0.22) {
        const iconT = nodeRatio / 0.22;
        const angle = iconT * Math.PI * 2;
        return {
          x: rowOriginX + 32 + Math.cos(angle) * 14,
          y: rowOriginY + 38 + Math.sin(angle) * 14,
          angleDeg: -15,
          inkColor: node.color,
          isDrawing: true,
          phaseLabel: `Croquis Icône ${node.stepNum}`,
          liveWords,
          activeZone: nIdx === 0 ? 'node0' : nIdx === 1 ? 'node1' : 'node2'
        };
      }

      const writeRatio = clamp01((nodeRatio - 0.22) / 0.78);
      const w1 = estimateLinePixelWidth(node.line1, 5.8, 410);
      const w2 = node.line2 ? estimateLinePixelWidth(node.line2, 5.5, 410) : 0;

      if (writeRatio < 0.55 || !node.line2) {
        const l1T = clamp01(writeRatio / (node.line2 ? 0.55 : 1));
        return {
          x: rowOriginX + 68 + w1 * l1T,
          y: rowOriginY + 36,
          angleDeg: -14,
          inkColor: node.color,
          isDrawing: true,
          phaseLabel: `Élément fondamental ${node.stepNum}`,
          liveWords,
          activeZone: nIdx === 0 ? 'node0' : nIdx === 1 ? 'node1' : 'node2'
        };
      } else {
        const l2T = clamp01((writeRatio - 0.55) / 0.45);
        return {
          x: rowOriginX + 68 + w2 * l2T,
          y: rowOriginY + 54,
          angleDeg: -14,
          inkColor: node.color,
          isDrawing: true,
          phaseLabel: `Élément fondamental ${node.stepNum}`,
          liveWords,
          activeZone: nIdx === 0 ? 'node0' : nIdx === 1 ? 'node1' : 'node2'
        };
      }
    }
  }

  // Phase 4: Hand writes the Fundamental Field Rule at the bottom (y = 314)
  if (cp < sketchData.sealStartRatio) {
    const fieldRatio = clamp01(
      (cp - sketchData.terrainCheck1.startRatio) /
        Math.max(0.02, sketchData.sealStartRatio - sketchData.terrainCheck1.startRatio)
    );
    const boxOriginX = boardOriginX + 14;
    const boxOriginY = boardOriginY + 312;
    const wField = estimateLinePixelWidth(sketchData.terrainCheck1.line1, 5.8, 340);

    if (fieldRatio < 0.55) {
      const t1 = fieldRatio / 0.55;
      return {
        x: boxOriginX + 52 + wField * t1,
        y: boxOriginY + 42,
        angleDeg: -13,
        inkColor: '#D97706',
        isDrawing: true,
        phaseLabel: 'Réflexe fondamental',
        liveWords,
        activeZone: 'check1'
      };
    } else {
      const t2 = (fieldRatio - 0.55) / 0.45;
      return {
        x: boxOriginX + 52 + wField * t2,
        y: boxOriginY + 62,
        angleDeg: -13,
        inkColor: '#059669',
        isDrawing: true,
        phaseLabel: 'Règle de conformité',
        liveWords,
        activeZone: 'check2'
      };
    }
  }

  // Phase 5: Hand signs the Conformity Checkmark on the right
  const t = clamp01((cp - sketchData.sealStartRatio) / Math.max(0.02, 1 - sketchData.sealStartRatio));
  const angle = t * Math.PI * 2;
  return {
    x: 874 + Math.cos(angle) * 18,
    y: 452 + Math.sin(angle) * 18,
    angleDeg: -15,
    inkColor: '#10B981',
    isDrawing: cp < 0.995,
    phaseLabel: 'Visa Conforme ✓',
    liveWords,
    activeZone: 'seal'
  };
}

// ============================================================================
// MAIN WIDESCREEN WHITEBOARD STAGE — FOCUSED ON ESSENTIAL ELEMENTS ONLY
// - Left (348px): 1 Single Clean Illustration matching the active voice segment
// - Right (540px): The 3 Fundamental Elements (1 Icon + Fundamental Text Written)
// ============================================================================
export const ProfessorContextualStage: React.FC<{
  data: ProfessorSceneData;
  activeActIndex: number;
  actVoiceProgress: number;
  tickCount: number;
  courseLegalRef: string;
  onSelectScreen?: (screenIdx: number) => void;
}> = React.memo(({ data, activeActIndex, actVoiceProgress, tickCount, onSelectScreen }) => {
  const screens = data.screens;
  const activeIdx = Math.max(0, Math.min(screens.length - 1, activeActIndex));
  const currentCard = screens[activeIdx] || screens[0];

  const localProgress = clamp01(actVoiceProgress);

  const sketchData = React.useMemo(
    () => extractVisualSketchDiagrams(currentCard),
    [currentCard]
  );

  const introWriteRatio = clamp01(localProgress / Math.max(0.04, sketchData.introEndRatio));
  const titleWidthPx = estimateLinePixelWidth(sketchData.mainFormula, 7.2, 360);

  const nodeRatios = sketchData.nodes.map((node) =>
    clamp01((localProgress - node.startRatio) / Math.max(0.02, node.endRatio - node.startRatio))
  );

  const fieldTotalRatio = clamp01(
    (localProgress - sketchData.terrainCheck1.startRatio) /
      Math.max(0.02, sketchData.sealStartRatio - sketchData.terrainCheck1.startRatio)
  );
  const f1Len = Math.max(1, (sketchData.terrainCheck1.line1 || '').length);
  const f2Len = Math.max(0, (sketchData.terrainCheck2.line1 || '').length);
  const f1Share = f2Len > 0 ? f1Len / Math.max(1, f1Len + f2Len) : 1;
  const fieldLine1Ratio = clamp01(fieldTotalRatio / Math.max(0.1, f1Share));
  const fieldLine2Ratio = f2Len > 0 ? clamp01((fieldTotalRatio - f1Share) / Math.max(0.1, 1 - f1Share)) : 0;
  const fieldW1 = estimateLinePixelWidth(sketchData.terrainCheck1.line1, 6.2, 455) + 18;
  const fieldW2 = estimateLinePixelWidth(sketchData.terrainCheck2.line1, 5.9, 455) + 18;

  const sealRatio = clamp01(
    (localProgress - sketchData.sealStartRatio) / Math.max(0.02, 1 - sketchData.sealStartRatio)
  );

  const liveSpokenSnippet = React.useMemo(
    () => extractLiveSpokenSnippet(currentCard.spokenText, localProgress),
    [currentCard.spokenText, localProgress]
  );

  const handPose = computeHandDrawingPose(
    localProgress,
    sketchData,
    currentCard.accentColor,
    liveSpokenSnippet
  );

  // Determine which single essential illustration is shown on the Left Panel
  const activeNodeIdx =
    localProgress >= sketchData.nodes[2].startRatio
      ? 2
      : localProgress >= sketchData.nodes[1].startRatio
      ? 1
      : 0;
  const activeNodeForIllustration = sketchData.nodes[activeNodeIdx] || sketchData.nodes[0];
  const activeIllustrationProgress =
    localProgress < sketchData.nodes[0].startRatio
      ? clamp01(0.25 + introWriteRatio * 0.75)
      : Math.max(0.25, nodeRatios[activeNodeIdx]);

  const clipIdBase = `sketch-clip-${activeIdx}`;

  return (
    <g>
      <defs>
        {/* Title Reveal synchronized with Intro Voice */}
        <clipPath id={`${clipIdBase}-title`}>
          <rect
            x="14"
            y="20"
            width={Math.max(0, (titleWidthPx + 12) * introWriteRatio)}
            height="30"
          />
        </clipPath>

        {/* Per-Row Fundamental Text Clip Masks (starts immediately with clause voice and finishes at 85% of clause so video never lags behind voice) */}
        {[0, 1, 2].map((nIdx) => {
          const node = sketchData.nodes[nIdx];
          const r = nodeRatios[nIdx];
          const writeR = clamp01((r - 0.03) / 0.82);
          const len1 = Math.max(1, (node.line1 || '').length);
          const len2 = Math.max(0, (node.line2 || '').length);
          const l1Share = len2 > 0 ? len1 / Math.max(1, len1 + len2) : 1;
          const l1R = clamp01(writeR / Math.max(0.1, l1Share));
          const l2R = len2 > 0 ? clamp01((writeR - l1Share) / Math.max(0.1, 1 - l1Share)) : 0;
          const w1Px = estimateLinePixelWidth(node.line1, 6.8, 435) + 24;
          const w2Px = estimateLinePixelWidth(node.line2, 6.4, 435) + 24;
          return (
            <React.Fragment key={nIdx}>
              <clipPath id={`${clipIdBase}-fund-${nIdx}-l1`}>
                <rect x="64" y="20" width={w1Px * l1R} height="24" />
              </clipPath>
              <clipPath id={`${clipIdBase}-fund-${nIdx}-l2`}>
                <rect x="64" y="42" width={w2Px * l2R} height="24" />
              </clipPath>
            </React.Fragment>
          );
        })}

        <clipPath id={`${clipIdBase}-field-l1`}>
          <rect x="48" y="24" width={fieldW1 * fieldLine1Ratio} height="24" />
        </clipPath>
        <clipPath id={`${clipIdBase}-field-l2`}>
          <rect x="48" y="46" width={fieldW2 * fieldLine2Ratio} height="24" />
        </clipPath>
      </defs>

      {/* 1. TOP 5-SCREEN WHITEBOARD PROGRESS TABS */}
      <g transform="translate(28, 52)">
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
                fontSize="9.4"
                fontWeight="900"
              >
                {scr.shortTabLabel}
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

      {/* 2. CLEAN, UNCLUTTERED WHITEBOARD STAGE (x=28..932, y=94..514) */}
      <g transform="translate(28, 94)">
        {/* LEFT PANEL (0..348): SINGLE ESSENTIAL ILLUSTRATION MATCHING THE VOICE */}
        <EssentialVoiceSyncedIllustration
          archetype={activeNodeForIllustration.iconType}
          color={activeNodeForIllustration.color}
          badgeLabel={activeNodeForIllustration.badge}
          miniCaption={activeNodeForIllustration.miniCaption}
          flowSteps={activeNodeForIllustration.flowSteps}
          drawProgress={activeIllustrationProgress}
          legalArticle={currentCard.legalArticle}
        />

        {/* RIGHT PANEL (364..904): THE 3 FUNDAMENTAL ELEMENTS (ICON + KEY WRITTEN POINT) */}
        <g transform="translate(364, 0)">
          <rect
            x="0"
            y="0"
            width="540"
            height="420"
            rx="16"
            fill="#FFFDF9"
            stroke={currentCard.accentColor}
            strokeWidth="3"
          />

          {/* Clean Top Title Banner */}
          <rect x="0" y="0" width="540" height="54" rx="14" fill="#0F172A" />
          <text x="18" y="18" fill="#FBBF24" fontSize="8" fontWeight="900">
            ✍️ ÉLÉMENTS FONDAMENTAUX • {currentCard.categoryTag.split('•')[0].trim()}
          </text>
          <text x="18" y="39" fill="#334155" fontSize="13" fontWeight="900">
            {sketchData.mainFormula}
          </text>
          <g clipPath={`url(#${clipIdBase}-title)`}>
            <text x="18" y="39" fill="#FFFFFF" fontSize="13" fontWeight="900">
              {sketchData.mainFormula}
            </text>
          </g>

          {/* 3 CLEAN, SPACIOUS FUNDAMENTAL ROWS (1 Icon + Fundamental Written Concept) */}
          {sketchData.nodes.map((node, nIdx) => {
            const ratio = nodeRatios[nIdx];
            const rowY = 64 + nIdx * 82;
            const isStarted = ratio > 0.005;
            const isActive = ratio > 0.005 && ratio < 0.995;

            return (
              <g key={node.stepNum} transform={`translate(14, ${rowY})`}>
                <rect
                  x="0"
                  y="0"
                  width="512"
                  height="74"
                  rx="14"
                  fill={isStarted ? '#FFFFFF' : '#F8FAFC'}
                  stroke={isActive ? node.color : isStarted ? '#CBD5E1' : '#E2E8F0'}
                  strokeWidth={isActive ? '2.8' : '1.6'}
                  strokeDasharray={isStarted ? undefined : '6 4'}
                />

                {!isStarted && (
                  <text x="256" y="41" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontWeight="800">
                    {node.badge}
                  </text>
                )}

                {isStarted && (
                  <g>
                    {/* Left Accent Bar */}
                    <rect x="0" y="0" width="7" height="74" rx="3.5" fill={node.color} />

                    {/* Single Clean Hand-Sketched Essential Icon on Left */}
                    <g transform="translate(14, 15)">
                      <SketchedNodePictogram
                        type={node.iconType}
                        color={node.color}
                        drawProgress={clamp01(ratio / 0.25)}
                      />
                    </g>

                    {/* Essential Pillar Sub-Header Badge */}
                    <text x="68" y="17" fill={node.color} fontSize="8.2" fontWeight="900">
                      {node.badge}
                    </text>

                    {/* Fundamental Written Line 1 (Large, Bold & Clear) */}
                    <g clipPath={`url(#${clipIdBase}-fund-${nIdx}-l1)`}>
                      <text x="68" y="37" fill="#0F172A" fontSize="10.8" fontWeight="900">
                        {node.line1}
                      </text>
                    </g>

                    {/* Fundamental Written Line 2 */}
                    {node.line2 && (
                      <g clipPath={`url(#${clipIdBase}-fund-${nIdx}-l2)`}>
                        <text x="68" y="56" fill="#334155" fontSize="10" fontWeight="800">
                          {node.line2}
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* BOTTOM FUNDAMENTAL TAKEAWAY BAR (y = 312..406) — FULL WIDTH WITHOUT CONFORME STAMP */}
          <g transform="translate(14, 312)">
            <rect
              x="0"
              y="0"
              width="512"
              height="94"
              rx="14"
              fill={fieldTotalRatio > 0.01 ? '#FEF3C7' : '#FFFBEB'}
              stroke="#D97706"
              strokeWidth="2"
            />
            <text x="16" y="18" fill="#92400E" fontSize="8.5" fontWeight="900">
              ⚡ À RETENIR SUR LE TERRAIN (RÈGLE FONDAMENTALE) :
            </text>

            {fieldTotalRatio > 0.01 && (
              <g>
                <circle cx="26" cy="48" r="14" fill="#059669" />
                <polyline
                  points="19,48 24,53 33,42"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <g clipPath={`url(#${clipIdBase}-field-l1)`}>
                  <text x="50" y="42" fill="#0F172A" fontSize="10.2" fontWeight="900">
                    {sketchData.terrainCheck1.line1}
                  </text>
                </g>
                <g clipPath={`url(#${clipIdBase}-field-l2)`}>
                  <text x="50" y="63" fill="#1E293B" fontSize="9.6" fontWeight="800">
                    {sketchData.terrainCheck2.line1}
                  </text>
                </g>
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
});

