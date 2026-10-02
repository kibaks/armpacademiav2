import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Target,
  GitBranch,
  Users,
  ShieldCheck,
  FileText,
  HelpCircle,
  Briefcase,
  Sparkles,
  ChevronRight,
  Film,
  Award,
  BookOpen,
  Check,
  Music
} from 'lucide-react';
import { CourseModule, UserProfile } from '../types';
import { speechService } from '../utils/speechService';
import { ambientMusicService } from '../utils/ambientMusicService';
import {
  buildSynchronizedLessonScreens,
  RealisticDrawingHandSVG
} from './ProfessorFilmScenes';
import { AishaAvatar } from './AishaAvatar';

interface StructuredChapterArchitectureProps {
  course: CourseModule;
  lesson: any;
  lessonIndex: number;
  currentProfile: UserProfile;
  activeScreenIndex: number;
  onJumpToWhiteboardScreen: (screenIdx: number) => void;
  onCompleteChapterAndNext: () => void;
  isChapterCompleted: boolean;
  isLastChapter: boolean;
  autoOpenSummaryVideo?: boolean;
  onCloseSummaryVideo?: () => void;
}

interface ChapterCaseOption {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
}

interface ChapterQuickQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StructuredChapterData {
  // 1. Accroche & Mise en contexte (L'Enjeu)
  enjeu: {
    casConcretTitle: string;
    casConcretSituation: string;
    ancrageLegalRef: string;
    ancrageLegalDetail: string;
    objectifPedagogique: string;
  };
  // 2. Le Cœur du Sujet : Règle & Mécanisme (Le Principe)
  principe: {
    principeDirecteur: string;
    fluxEtapes: [
      { code: string; title: string; detail: string },
      { code: string; title: string; detail: string },
      { code: string; title: string; detail: string }
    ];
    roles: {
      cgpmp: string;
      dgcmp: string;
      armp: string;
    };
  };
  // 3. Application Pratique & Rôles du Terrain (La Pratique)
  pratique: {
    checklistActions: string[];
    piegesAEviter: string[];
    visasConformite: string[];
  };
  // 4. Synthèse & Livrables (Le Bilan)
  bilan: {
    troisIdeesCles: [string, string, string];
    livrables: {
      id: string;
      title: string;
      typeLabel: string;
      description: string;
      filename: string;
      templateBody: string;
    }[];
  };
  // 5. Évaluation & Validation (La Vérification)
  verification: {
    quizQuestions: ChapterQuickQuizItem[];
    etudeDeCas: {
      title: string;
      scenario: string;
      questionDecision: string;
      options: ChapterCaseOption[];
    };
  };
}

export function buildStructuredChapterContent(
  course: CourseModule,
  lesson: any,
  lessonIndex: number,
  userProfile: UserProfile
): StructuredChapterData {
  const lessonTitle = lesson?.title || course.title || 'Chapitre Marchés Publics RDC';
  const legalRef = course.legalRef || 'Loi n° 10/010 du 27 avril 2010';
  const keyArts: string[] =
    Array.isArray(lesson?.keyArticles) && lesson.keyArticles.length > 0
      ? lesson.keyArticles
      : [legalRef, 'Art. 17 Loi 10/010', 'Décret n° 10/22'];

  const { sceneData } = buildSynchronizedLessonScreens(
    lessonTitle,
    lesson?.content || course.description || '',
    course.code || 'MP-RDC',
    legalRef,
    lessonIndex,
    null,
    userProfile
  );

  const s0 = sceneData.screens[0];
  const s1 = sceneData.screens[1] || s0;
  const s2 = sceneData.screens[2] || s0;
  const s3 = sceneData.screens[3] || s0;
  const s4 = sceneData.screens[4] || s0;

  const low = `${lessonTitle} ${lesson?.content || ''} ${course.category || ''}`.toLowerCase();

  // Contextualize concrete field scenario & golden rule according to chapter topic
  let casConcretTitle = 'Litige lors de la passation & risque d’annulation du marché';
  let casConcretSituation =
    s0?.explanation ||
    `Lors d'un contrôle sur un marché public de ${userProfile.institution || "l'Autorité Contractante"}, un dossier est bloqué faute de justificatif préalable conforme à la ${legalRef}, entraînant un retard critique de livraison et un risque de contentieux.`;
  let principeDirecteur =
    s1?.explanation ||
    "L'appel d'offres ouvert demeure la règle d'or absolue ; toute procédure dérogatoire (gré à gré ou appel d'offres restreint) est une exception strictement encadrée et soumise à l'Avis de Non-Objection préalable.";

  if (/seuil|plan|ppm|fractionnement|saucissonnage|budget/.test(low)) {
    casConcretTitle = 'Fractionnement artificiel (« saucissonnage ») & rejet d’ANO';
    casConcretSituation = `Une autorité contractante scinde un besoin annuel de fournitures en trois commandes successives pour rester sous le seuil d'appel d'offres. Lors de l'examen, la DGCMP refuse le visa et l'ARMP relève une infraction de fractionnement prohibé (${keyArts[0]}). ${s0?.explanation || ''}`;
    principeDirecteur =
      "Tout besoin homogène annuel doit être consolidé dans le Plan de Passation des Marchés (PPM) publié : le saucissonnage pour contourner les seuils légaux entraîne la nullité absolue de la procédure.";
  } else if (/ouverture|pli|évaluation|attribution|dépouillement|offre/.test(low)) {
    casConcretTitle = 'Pli reçu hors délai & contestation du PV d’évaluation';
    casConcretSituation = `Lors de la séance publique d'ouverture des plis, un soumissionnaire arrive 12 minutes après l'heure limite fixée au DAO. Par ailleurs, la sous-commission tente d'introduire un sous-critère non publié. Un recours est immédiatement déposé devant le CRD. ${s0?.explanation || ''}`;
    principeDirecteur =
      "L'heure limite de dépôt est impérative et l'évaluation technique et financière ne peut reposer que sur les seuls critères objectifs, chiffrés et publiés dans le Dossier d'Appel d'Offres.";
  } else if (/exécution|avenant|paiement|décompte|réception|garantie|caution/.test(low)) {
    casConcretTitle = 'Retard de paiement de décompte, dépassement d’avenant & blocage de chantier';
    casConcretSituation = `En cours d'exécution d'un marché de travaux, des prestations supplémentaires portent le cumul des avenants à 22 % du montant initial sans nouvel appel d'offres, tandis que le décompte provisoire accuse 45 jours de retard. ${s0?.explanation || ''}`;
    principeDirecteur =
      "Tout paiement public est subordonné au service fait constaté par PV contradictoire, et le cumul des avenants ne peut jamais bouleverser l'économie du marché ni dépasser le plafond légal sans autorisation.";
  } else if (/recours|contentieux|crd|litige|sanction|audit/.test(low)) {
    casConcretTitle = 'Signature précipitée pendant le délai de standstill & saisine du CRD';
    casConcretSituation = `Après notification de l'attribution provisoire, l'Autorité Contractante signe le contrat dès le lendemain sans respecter le délai d'attente (standstill), privant un candidat évincé de son recours préalable. Le CRD suspend et annule la procédure. ${s0?.explanation || ''}`;
    principeDirecteur =
      "Le respect du délai de standstill et du contradictoire devant le Comité de Règlement des Différends (CRD) de l'ARMP est d'ordre public : aucun marché ne peut être signé pendant la suspension légale.";
  }

  const fluxEtapes: [
    { code: string; title: string; detail: string },
    { code: string; title: string; detail: string },
    { code: string; title: string; detail: string }
  ] = [
    {
      code: 'ÉTAPE 01',
      title: 'Préparation & Instruction CGPMP',
      detail:
        s0?.fieldRule ||
        `Identifier le besoin réel au PPM, vérifier les crédits budgétaires et rédiger le dossier selon le modèle type ARMP (${keyArts[0]}).`
    },
    {
      code: 'ÉTAPE 02',
      title: 'Contrôle a priori & Visa DGCMP',
      detail:
        s1?.fieldRule ||
        `Soumettre le dossier complet et les procès-verbaux à l'examen de conformité pour obtenir l'Avis de Non-Objection (ANO) préalable.`
    },
    {
      code: 'ÉTAPE 03',
      title: 'Validation, Notification & Traçabilité ARMP',
      detail:
        s2?.fieldRule ||
        `Purger le délai de recours, notifier l'acte, publier dans SIGMAP et archiver l'intégralité des pièces pour l'audit ARMP.`
    }
  ];

  const roles = {
    cgpmp: `Prépare le PPM, rédige le DAO neutre, conduit la réception et l'ouverture des plis, et rédige les procès-verbaux d'évaluation au sein de l'Autorité Contractante.`,
    dgcmp: `Exerce le contrôle a priori de régularité sur les dossiers dépassant le seuil légal et délivre l'Avis de Non-Objection (ANO) obligatoire avant chaque étape clé.`,
    armp: `Édicte les dossiers types, assure la régulation normative, tranche les litiges via le Comité de Règlement des Différends (CRD) et réalise les audits indépendants a posteriori.`
  };

  const checklistActions = [
    `Vérifier l'inscription préalable de l'opération au Plan de Passation des Marchés (PPM) approuvé et publié (${keyArts[0]}).`,
    `Utiliser exclusivement les Dossiers Types et grilles d'évaluation homologués par l'ARMP sans clause discriminatoire.`,
    `Consigner chaque séance (ouverture, analyse, réception) dans un Procès-Verbal daté et signé contradictoirement par tous les membres.`,
    s2?.fieldRule || `Obtenir et classer l'Avis de Non-Objection (ANO) avant toute notification ou engagement financier.`
  ];

  const piegesAEviter = [
    `Le saucissonnage (fractionnement artificiel d'un marché) pour contourner les seuils d'appel d'offres et de contrôle a priori.`,
    `La modification des critères d'évaluation après l'ouverture des plis ou l'orientation technique vers une marque commerciale unique.`,
    `La signature du contrat pendant le délai de standstill ou l'exécution de prestations par avenant hors plafond légal.`
  ];

  const visasConformite = [
    `Visa technique et procès-verbal signé par la Cellule de Gestion des Marchés Publics (CGPMP).`,
    `Avis de Non-Objection (ANO) préalable de la DGCMP pour tout marché atteignant le seuil réglementaire.`,
    `Approbation de l'Autorité Compétente, réservation budgétaire certifiée et publication officielle ARMP / SIGMAP.`
  ];

  const troisIdeesCles: [string, string, string] = [
    `1. Enjeu & Légalité (${keyArts[0]}) : ${s0?.explanation || casConcretSituation}`,
    `2. Règle d'Or & Mécanisme : ${s1?.explanation || principeDirecteur}`,
    `3. Réflexe Terrain & Conformité : ${s3?.explanation || s2?.fieldRule || 'Tout acte de passation ou d’exécution doit être motivé par écrit, validé par ANO et archivé pour audit.'}`
  ];

  const livrables = [
    {
      id: `dao-type-${course.id}-${lessonIndex}`,
      title: `Modèle de DAO & Clauses Types — ${lessonTitle}`,
      typeLabel: 'Canevas DAO ARMP (.doc)',
      description: 'Canevas officiel incluant les clauses administratives, critères objectifs de qualification et références Loi n° 10/010.',
      filename: `Modele_DAO_${course.code}_Chapitre_${lessonIndex + 1}.doc`,
      templateBody: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS (ARMP)
====================================================================
MODÈLE TYPE DE DOSSIER D'APPEL D'OFFRES (DAO) & FICHE DE CADRAGE
Module : ${course.code} — ${course.title}
Chapitre ${lessonIndex + 1} : ${lessonTitle}
Références légales : ${keyArts.join(' • ')}
====================================================================

1. OBJET DU MARCHÉ & INSCRIPTION AU PPM
- Intitulé du marché : [À compléter par la CGPMP]
- Référence ligne PPM approuvé : [Réf. PPM / Exercice 2026]
- Certificat de disponibilité budgétaire : [N° Engagement Budget]

2. PRINCIPE DIRECTEUR APPLICABLE
${principeDirecteur}

3. CRITÈRES D'ÉVALUATION OBJECTIFS ET NON DISCRIMINATOIRES
- Conformité administrative (éliminatoire : Oui/Non sur pièces légales)
- Qualification technique : Spécifications neutres (sans marque imposée)
- Évaluation financière : Offre conforme évaluée économiquement la plus avantageuse

4. VISAS DE CONFORMITÉ REQUIS
[ ] Visa Chef de la CGPMP
[ ] Avis de Non-Objection (ANO) DGCMP
[ ] Signature Autorité Contractante`
    },
    {
      id: `grille-depouillement-${course.id}-${lessonIndex}`,
      title: `Grille d'ouverture & de dépouillement — Chapitre ${lessonIndex + 1}`,
      typeLabel: 'Grille d’Évaluation (.doc)',
      description: 'Matrice contradictoire de vérification des plis, conformité technique et comparaison financière.',
      filename: `Grille_Depouillement_${course.code}_Chap_${lessonIndex + 1}.doc`,
      templateBody: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
CELLULE DE GESTION DES MARCHÉS PUBLICS (CGPMP)
====================================================================
GRILLE OFFICIELLE DE DÉPOUILLEMENT ET D'ÉVALUATION DES OFFRES
Module : ${course.code} • Chapitre ${lessonIndex + 1} : ${lessonTitle}
Base légale : ${legalRef} (${keyArts.join(', ')})
====================================================================

A. CONTRÔLE DE RECEVABILITÉ DES PLIS EN SÉANCE PUBLIQUE
1. Date et heure exactes de réception : [JJ/MM/AAAA à HH:MM]
2. État des scellés et anonymat : [Conforme / Non conforme]
3. Présence de la garantie d'offre : [Vérifiée / Montant CDF]

B. RÈGLES IMPÉRATIVES D'ANALYSE EN SOUS-COMMISSION
- Aucun critère non publié au DAO ne peut être appliqué.
- Toute demande d'éclaircissement se fait par écrit sans modifier la substance de l'offre.

C. SIGNATURES CONTRADICTOIRES DES MEMBRES DE LA COMMISSION
- Président de séance : _______________________
- Rapporteur CGPMP : __________________________
- Observateur indépendant : ___________________`
    },
    {
      id: `formulaire-recours-visa-${course.id}-${lessonIndex}`,
      title: `Formulaire de Visa & Fiche de Recours CRD — ${course.code}`,
      typeLabel: 'Formulaire Officiel (.doc)',
      description: 'Fiche de contrôle de conformité préalable et canevas de saisine gracieux / Comité de Règlement des Différends.',
      filename: `Formulaire_Conformite_Recours_${course.code}_Chap_${lessonIndex + 1}.doc`,
      templateBody: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
AUTORITÉ DE RÉGULATION DES MARCHÉS PUBLICS (ARMP - CRD)
====================================================================
FICHE DE CONTRÔLE DE CONFORMITÉ & FORMULAIRE TYPE DE RECOURS
Module : ${course.code} — ${lessonTitle}
Texte de référence : ${legalRef}
====================================================================

I. CHECK-LIST DE CONFORMITÉ AVANT PASSAGE À L'ÉTAPE SUIVANTE
- [ ] ${checklistActions[0]}
- [ ] ${checklistActions[1]}
- [ ] ${checklistActions[2]}
- [ ] ${checklistActions[3]}

II. POINTS DE VIGILANCE VÉRIFIÉS (ZÉRO INFRACTION)
- Absence de saucissonnage : OUI / NON
- Respect strict du délai de standstill avant signature : OUI / NON

III. CADRE DE SAISINE (EN CAS DE CONTESTATION)
- Date de notification des résultats provisoires : [JJ/MM/AAAA]
- Date du recours gracieux auprès de l'Autorité Contractante : [JJ/MM/AAAA]
- Objet et griefs articulés sur la Loi n° 10/010 : [Détail des moyens de droit]`
    }
  ];

  // Build 4 targeted chapter quiz questions
  const baseCourseQuiz = Array.isArray(course.quiz) ? course.quiz : [];
  const quizQuestions: ChapterQuickQuizItem[] = [
    {
      question: `Cas pratique (Enjeu du chapitre « ${lessonTitle} ») : Que se passe-t-il si une Autorité Contractante engage cette étape sans respecter l'ancrage réglementaire (${keyArts[0]}) ?`,
      options: [
        `La procédure est entachée d'irrégularité pouvant entraîner le refus d'ANO par la DGCMP ou l'annulation par l'ARMP`,
        `Une simple régularisation verbale après le paiement suffit à valider le marché`,
        `Seul le fournisseur supporte la responsabilité de l'irrégularité administrative`
      ],
      correctIndex: 0,
      explanation: `Conformément à la ${legalRef} (${keyArts[0]}), le respect des règles préalables de publicité, de mise en concurrence et de visa conditionne la validité juridique du marché.`
    },
    {
      question: `Répartition des rôles (CGPMP / DGCMP / ARMP) : Qui est compétent pour préparer techniquement le dossier et conduire l'évaluation d'une part, et délivrer l'ANO a priori d'autre part ?`,
      options: [
        `La CGPMP prépare et évalue le dossier ; la DGCMP exerce le contrôle a priori (ANO) ; l'ARMP régule et tranche les recours (CRD)`,
        `L'ARMP rédige le DAO à la place du ministère et signe les contrats de travaux`,
        `La DGCMP choisit librement l'attributaire sans commission d'évaluation`
      ],
      correctIndex: 0,
      explanation: `La Loi n° 10/010 consacre la séparation stricte des fonctions : gestion par la CGPMP, contrôle a priori par la DGCMP et régulation/recours par l'ARMP.`
    },
    {
      question: `Piège de terrain : Laquelle de ces pratiques constitue une infraction grave prohibée dans le cadre de « ${lessonTitle} » ?`,
      options: [
        `Le saucissonnage (fractionnement artificiel du besoin) ou l'application d'un critère non publié dans le DAO`,
        `La publication préalable du Plan de Passation des Marchés (PPM) et l'ouverture publique des plis`,
        `L'archivage complet des procès-verbaux contradictoires dans SIGMAP`
      ],
      correctIndex: 0,
      explanation: `Le fractionnement artificiel visant à échapper aux seuils réglementaires ainsi que l'ajout de critères occultes violent les principes d'égalité et de transparence.`
    },
    baseCourseQuiz[lessonIndex % Math.max(1, baseCourseQuiz.length)] || {
      question: `Validation & Livrables : Quelle condition formelle est indispensable avant de passer à l'étape suivante d'exécution ou de signature ?`,
      options: [
        `Détenir le Procès-Verbal contradictoire signé, le visa ANO requis et purger le délai légal de recours (standstill)`,
        `Obtenir uniquement l'accord téléphonique du soumissionnaire pressenti`,
        `Attendre la fin des travaux pour rédiger le dossier d'appel d'offres`
      ],
      correctIndex: 0,
      explanation: `La traçabilité écrite (PV signé, ANO DGCMP et respect du délai de standstill) sécurise juridiquement l'Autorité Contractante et l'opérateur économique.`
    }
  ];

  const etudeDeCas = {
    title: `Étude de cas décisionnelle — ${lessonTitle}`,
    scenario: `Vous intervenez en qualité de ${userProfile.roleTitle || 'praticien des marchés publics'} au sein de « ${userProfile.institution || "l'Autorité Contractante"} ». Dans le cadre d'un dossier lié à « ${lessonTitle} », un service opérationnel invoque l'urgence pour écarter une formalité substantielle prévue par ${keyArts[0]} (${s4?.explanation || casConcretSituation.slice(0, 160)}).`,
    questionDecision: `Quelle décision prenez-vous immédiatement pour sécuriser la procédure ?`,
    options: [
      {
        id: 'opt-conforme',
        label: `Exiger la régularisation formelle du dossier selon le canevas type ARMP (${keyArts[0]}), consigner les réserves au PV et solliciter le visa / ANO réglementaire avant tout acte.`,
        isCorrect: true,
        feedback: `Décision exemplaire ! Vous protégez l'institution contre la nullité du marché et les sanctions financières ou disciplinaires prévues par la Loi n° 10/010.`
      },
      {
        id: 'opt-risque',
        label: `Autoriser provisoirement l'opération sans visa ni procès-verbal en promettant de régulariser les documents lors du paiement final.`,
        isCorrect: false,
        feedback: `Attention : un vice de procédure préalable ou l'absence d'ANO ne peut pas être régularisé a posteriori lors du paiement. Le comptable public et la DGCMP bloqueront le dossier.`
      },
      {
        id: 'opt-saucisson',
        label: `Diviser le montant en plusieurs bons de commande inférieurs au seuil pour éviter le contrôle a priori.`,
        isCorrect: false,
        feedback: `Infraction caractérisée : il s'agit d'un fractionnement artificiel (« saucissonnage ») formellement interdit et sanctionné par l'ARMP.`
      }
    ]
  };

  return {
    enjeu: {
      casConcretTitle,
      casConcretSituation,
      ancrageLegalRef: keyArts.join(' • '),
      ancrageLegalDetail: `Cadre normatif obligatoire de la commande publique en RDC (${legalRef}) : tout manquement expose le marché à la nullité et aux recours devant le CRD de l'ARMP.`,
      objectifPedagogique: `À la fin de ce chapitre, vous serez capable d'analyser une situation réelle portant sur « ${lessonTitle} », d'appliquer le mécanisme légal étape par étape, d'éviter les pièges de terrain et d'utiliser les livrables officiels ARMP.`
    },
    principe: {
      principeDirecteur,
      fluxEtapes,
      roles
    },
    pratique: {
      checklistActions,
      piegesAEviter,
      visasConformite
    },
    bilan: {
      troisIdeesCles,
      livrables
    },
    verification: {
      quizQuestions,
      etudeDeCas
    }
  };
}

// ============================================================================
// PETITE VIDÉO RÉSUMANT LE COURS (CAPSULE VIDÉO SYNTHÈSE DU MODULE EN 5 ACTES)
// ============================================================================
export const CourseSummaryMiniVideoPlayer: React.FC<{
  course: CourseModule;
  currentProfile: UserProfile;
  onClose?: () => void;
}> = ({ course, currentProfile, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(() => ambientMusicService.getState().enabled);
  const [activeSeqIdx, setActiveSeqIdx] = useState(0);
  const [seqProgress, setSeqProgress] = useState(0); // 0..1 inside active sequence
  const [tick, setTick] = useState(0);

  const summaryId = `course-summary-video-${course.id}`;

  useEffect(() => {
    const unsubMusic = ambientMusicService.subscribe((st) => {
      setMusicEnabled(st.enabled);
    });
    return () => unsubMusic();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      ambientMusicService.start();
    } else {
      ambientMusicService.stop();
    }
  }, [isPlaying]);

  // Build 5 concise summary sequences covering the whole course across the 5 pedagogical pillars
  const sequences = useMemo(() => {
    const lessons = Array.isArray(course.lessons) && course.lessons.length > 0 ? course.lessons : [];
    const legal = course.legalRef || 'Loi n° 10/010 du 27 avril 2010';

    return [
      {
        num: 1,
        pillarTag: "1. L'ENJEU DU COURS",
        title: `Pourquoi maîtriser « ${course.title} » ?`,
        color: '#D97706',
        cards: [
          { tag: 'CAS TERRAIN', sub: 'Prévenir tout rejet ou blocage de dossier', icon: 'warning_shield' },
          { tag: 'LOI 10/010', sub: `Respect strict : ${legal.slice(0, 32)}`, icon: 'law_scale' },
          { tag: 'OBJECTIF', sub: `Maîtriser les ${lessons.length} chapitres opérationnels`, icon: 'target_gauge' }
        ],
        spoken: `Bonjour et bienvenue, ${currentProfile.name}, c'est un vrai plaisir de vous retrouver aujourd'hui. Prenons un instant ensemble pour découvrir l'essentiel de ce module consacré à ${course.title}. Tout l'enjeu ici, voyez-vous, c'est vraiment de vous permettre d'éviter les blocages de dossiers, et de sécuriser sereinement chaque procédure sur le terrain.`
      },
      {
        num: 2,
        pillarTag: '2. LE PRINCIPE & LES RÔLES',
        title: 'Règle d’or, Flux & Séparation des pouvoirs',
        color: '#2563EB',
        cards: [
          { tag: 'RÈGLE D’OR', sub: 'L’appel d’offres ouvert est la règle', icon: 'open_scale' },
          { tag: 'FLUX VISUEL', sub: 'Étape 01 (PPM) ➔ 02 (DAO) ➔ 03 (ANO)', icon: 'flow_steps' },
          { tag: '3 ORGANES', sub: 'CGPMP prépare • DGCMP contrôle • ARMP régule', icon: 'triad_pillars' }
        ],
        spoken: `Mais alors... quel est le principe fondamental à garder en tête ? C'est notre règle d'or : l'appel d'offres ouvert et la stricte séparation des rôles. ... Tandis que la cellule de gestion prépare et évalue les offres, la direction générale du contrôle délivre son feu vert préalable... et l'autorité de régulation veille à l'équité pour tous.`
      },
      {
        num: 3,
        pillarTag: '3. LA PRATIQUE TERRAIN',
        title: 'Check-list d’action, Vigilance & Visas',
        color: '#059669',
        cards: [
          { tag: 'CHECK-LIST', sub: 'Vérifier PPM + Crédits + DAO complet', icon: 'checklist_board' },
          { tag: 'INTERDICTION', sub: 'Zéro saucissonnage ni hors-seuil', icon: 'no_scissors' },
          { tag: 'VISA REQUIS', sub: 'PV signé + ANO DGCMP obligatoire', icon: 'ano_shield' }
        ],
        spoken: `Sur le terrain, écoutez bien mon conseil de vigilance. Ayez toujours trois réflexes qui vous protégeront... vérifier d'abord l'inscription au plan de passation, refuser catégoriquement tout fractionnement artificiel du besoin... et attendre impérativement l'avis de non-objection avant d'engager la suite.`
      },
      {
        num: 4,
        pillarTag: '4. LE BILAN & LIVRABLES',
        title: 'Les 3 Idées Clés & Modèles Téléchargeables',
        color: '#7C3AED',
        cards: [
          { tag: 'MODÈLE DAO', sub: 'Canevas type ARMP prêt à l’emploi', icon: 'doc_dao' },
          { tag: 'DÉPOUILLEMENT', sub: 'Grille officielle d’évaluation CGPMP', icon: 'doc_grid' },
          { tag: 'RECOURS & VISA', sub: 'Formulaire de requête & liste ANO', icon: 'doc_crd' }
        ],
        spoken: `Rassurez-vous... pour vous accompagner concrètement au bureau, vous retrouverez dans chaque chapitre les trois idées maîtresses... ainsi que des modèles officiels prêts à l'emploi, notamment le dossier type d'appel d'offres et la grille de dépouillement.`
      },
      {
        num: 5,
        pillarTag: '5. LA VÉRIFICATION FINALE',
        title: 'Quiz pratiques, Études de cas & Certification',
        color: '#E11D48',
        cards: [
          { tag: 'QUIZ RAPIDE', sub: 'QCM ciblé sur les cas pratiques', icon: 'quiz_check' },
          { tag: 'ÉTUDE DE CAS', sub: 'Arbitrage d’un scénario réel terrain', icon: 'case_compass' },
          { tag: 'CERTIFICAT', sub: 'Validation & Attestation ARMP ✓', icon: 'trophy_seal' }
        ],
        spoken: `Enfin... prenez tranquillement le temps de tester vos réflexes avec le quiz pratique et l'étude de cas de chaque chapitre... afin de valider sereinement votre parcours, et d'obtenir votre certificat officiel.`
      }
    ];
  }, [course, currentProfile.name]);

  // Subscribe to speechService for exact synchronization when voice is active
  useEffect(() => {
    const unsub = speechService.subscribe((st) => {
      if (st.currentId === summaryId && st.isPlaying) {
        const sIdx = Math.max(0, Math.min(sequences.length - 1, (st.currentSentence || 1) - 1));
        setActiveSeqIdx(sIdx);
        setSeqProgress(Math.max(0, Math.min(1, (st.wordProgressPct || 0) / 100)));
      } else if (st.currentId === summaryId && !st.isPlaying && isPlaying && !isMuted) {
        setIsPlaying(false);
      }
    });
    return () => {
      unsub();
    };
  }, [summaryId, sequences.length, isPlaying, isMuted]);

  // Smooth timer for animation & muted playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const st = speechService.getState();
      const voiceDriving = !isMuted && st.isPlaying && st.currentId === summaryId;
      if (!voiceDriving) {
        setSeqProgress((prev) => {
          const next = prev + 0.0085;
          if (next >= 1) {
            setActiveSeqIdx((curIdx) => {
              if (curIdx < sequences.length - 1) {
                return curIdx + 1;
              } else {
                setIsPlaying(false);
                return curIdx;
              }
            });
            return 0;
          }
          return next;
        });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, isMuted, summaryId, sequences.length]);

  useEffect(() => {
    return () => {
      ambientMusicService.stop();
      const st = speechService.getState();
      if (st.currentId === summaryId) {
        speechService.stop();
      }
    };
  }, [summaryId]);

  const startPlaybackAt = (seqIndex: number) => {
    const clamped = Math.max(0, Math.min(sequences.length - 1, seqIndex));
    setActiveSeqIdx(clamped);
    setSeqProgress(0);
    setIsPlaying(true);
    ambientMusicService.start();
    if (!isMuted) {
      speechService.unlockAudio();
      speechService.play(
        sequences.map((s) => s.spoken).join(' '),
        summaryId,
        {
          speed: 1.0,
          voice: speechService.getVoicePersona(),
          startSentenceIndex: clamped,
          customSentences: sequences.map((s) => s.spoken)
        }
      );
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      ambientMusicService.stop();
      speechService.stop();
    } else {
      startPlaybackAt(activeSeqIdx);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      speechService.stop();
    } else if (isPlaying) {
      startPlaybackAt(activeSeqIdx);
    }
  };

  const currentSeq = sequences[activeSeqIdx] || sequences[0];
  const overallPct = Math.min(100, Math.round(((activeSeqIdx + seqProgress) / sequences.length) * 100));

  // Hand first sketches the SINGLE essential illustration on the left (seqProgress 0..0.35),
  // then writes the 3 fundamental lines on the right (seqProgress 0.35..1.0)
  const isSketchingIllustration = seqProgress < 0.35;
  const sketchRatio = Math.min(1, seqProgress / 0.35);
  const writeProgress = Math.max(0, (seqProgress - 0.35) / 0.65);
  const cardIdx = writeProgress < 0.34 ? 0 : writeProgress < 0.68 ? 1 : 2;
  const localCardRatio =
    cardIdx === 0
      ? writeProgress / 0.34
      : cardIdx === 1
      ? (writeProgress - 0.34) / 0.34
      : (writeProgress - 0.68) / 0.32;

  const handX = isSketchingIllustration
    ? 384 + Math.cos(sketchRatio * Math.PI * 2) * 34
    : 520 + Math.min(1, Math.max(0, localCardRatio)) * 270;
  const handY = isSketchingIllustration
    ? 172 + Math.sin(sketchRatio * Math.PI * 2) * 32
    : 112 + cardIdx * 62 + Math.sin(localCardRatio * Math.PI * 8) * 1.6;

  return (
    <div className="rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                🎬 Petite Vidéo Résumant le Cours (Croquis Essentiel &amp; Points Fondamentaux)
              </span>
              <span className="text-[11px] font-mono font-bold text-cyan-300">
                {course.code} • {course.legalRef}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Capsule Vidéo Illustrée : {course.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={togglePlay}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Résumé' : 'Lancer la Vidéo Résumé'}</span>
          </button>
          <button
            type="button"
            onClick={() => ambientMusicService.toggleEnabled()}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              musicEnabled
                ? 'bg-indigo-950/80 border-indigo-400/50 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Activer ou couper la musique douce de fond"
          >
            <Music className="w-3.5 h-3.5 text-amber-300" />
            <span>{musicEnabled ? 'Musique douce : ON' : 'Musique : OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => startPlaybackAt(0)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Recommencer la vidéo résumé"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title={isMuted ? 'Activer la voix' : 'Couper la voix'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                speechService.stop();
                ambientMusicService.stop();
                setIsPlaying(false);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
            >
              Réduire
            </button>
          )}
        </div>
      </div>

      {/* Widescreen Animated Summary Video Canvas */}
      <div className="relative w-full aspect-[16/7] min-h-[260px] sm:min-h-[310px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
        <svg viewBox="0 0 860 320" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="860" height="320" fill="#0F172A" />

          {/* Left Studio Card: Aïsha + Course Identity */}
          <rect x="14" y="14" width="252" height="292" rx="16" fill="#1E293B" stroke={currentSeq.color} strokeWidth="2.5" />
          <rect x="26" y="26" width="228" height="26" rx="8" fill="#0F172A" />
          <text x="140" y="43" textAnchor="middle" fill="#FBBF24" fontSize="9" fontWeight="900">
            🎨 L&apos;ESSENTIEL EN CROQUIS &amp; MOTS CLÉS
          </text>

          <foreignObject x="92" y="60" width="96" height="96">
            <div className="w-full h-full flex items-center justify-center">
              <AishaAvatar
                isSpeaking={isPlaying && !isMuted}
                size={92}
                showBadge={false}
                className="rounded-full border-2 border-amber-400 shadow-lg"
              />
            </div>
          </foreignObject>
          <text x="140" y="174" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900">
            Prof. Aïsha • Résumé {course.code}
          </text>
          <text x="140" y="191" textAnchor="middle" fill="#94A3B8" fontSize="8.8" fontWeight="700">
            {course.legalRef}
          </text>

          {/* 5 Pillar Mini Progress Dots */}
          <g transform="translate(33, 212)">
            {sequences.map((s, idx) => {
              const done = idx < activeSeqIdx;
              const cur = idx === activeSeqIdx;
              return (
                <g key={s.num} transform={`translate(${idx * 40}, 0)`}>
                  <rect
                    x="0"
                    y="0"
                    width="34"
                    height="24"
                    rx="7"
                    fill={cur ? s.color : done ? '#065F46' : '#0F172A'}
                    stroke={cur ? '#FBBF24' : '#334155'}
                    strokeWidth="1.5"
                  />
                  <text x="17" y="15.5" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900">
                    {done ? '✓' : `${s.num}/5`}
                  </text>
                </g>
              );
            })}
          </g>

          <rect x="26" y="250" width="228" height="42" rx="10" fill="#0F172A" stroke="#334155" strokeWidth="1.2" />
          <text x="140" y="267" textAnchor="middle" fill="#6EE7B7" fontSize="8.5" fontWeight="900">
            PROGRESSION DU RÉSUMÉ : {overallPct}%
          </text>
          <rect x="40" y="275" width="200" height="6" rx="3" fill="#1E293B" />
          <rect x="40" y="275" width={Math.max(6, 2 * overallPct)} height="6" rx="3" fill="#10B981" />

          {/* Right Clean Whiteboard: 1 Essential Illustration + 3 Fundamental Points Written */}
          <rect x="280" y="14" width="566" height="292" rx="16" fill="#FFFDF9" stroke={currentSeq.color} strokeWidth="3" />
          <rect x="280" y="14" width="566" height="50" rx="14" fill="#0F172A" />
          <text x="298" y="33" fill="#FBBF24" fontSize="9" fontWeight="900">
            {currentSeq.pillarTag} • ÉTAPE {currentSeq.num}/5
          </text>
          <text x="298" y="52" fill="#FFFFFF" fontSize="13" fontWeight="900">
            {currentSeq.title}
          </text>

          {/* LEFT OF WHITEBOARD (x=296..472): 1 Single Essential Hand-Drawn Illustration */}
          <g transform="translate(296, 78)">
            <rect
              x="0"
              y="0"
              width="176"
              height="212"
              rx="14"
              fill="#F8FAFC"
              stroke={currentSeq.color}
              strokeWidth="2"
              strokeDasharray="520"
              strokeDashoffset={Math.max(0, 520 * (1 - sketchRatio))}
            />
            <text x="88" y="22" textAnchor="middle" fill={currentSeq.color} fontSize="8.5" fontWeight="900">
              CROQUIS ESSENTIEL
            </text>

            {/* Clean Single Essential Symbol Drawn by Hand */}
            <g
              transform="translate(28, 38)"
              stroke={currentSeq.color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="340"
              strokeDashoffset={Math.max(0, 340 * (1 - sketchRatio))}
            >
              {activeSeqIdx === 0 && (
                <g>
                  <path
                    d="M 60 6 L 106 22 L 106 58 C 106 88 60 108 60 108 C 60 108 14 88 14 58 L 14 22 Z"
                    fill={sketchRatio > 0.6 ? `${currentSeq.color}18` : 'none'}
                  />
                  <polyline points="40,58 55,73 84,42" strokeWidth="4" />
                </g>
              )}
              {activeSeqIdx === 1 && (
                <g>
                  <line x1="60" y1="14" x2="60" y2="98" strokeWidth="3.5" />
                  <line x1="20" y1="36" x2="100" y2="36" strokeWidth="3.5" />
                  <polygon points="20,36 6,66 34,66" fill={sketchRatio > 0.6 ? '#DBEAFE' : 'none'} />
                  <polygon points="100,36 86,66 114,66" fill={sketchRatio > 0.6 ? '#D1FAE5' : 'none'} />
                  <rect x="38" y="98" width="44" height="10" rx="4" />
                </g>
              )}
              {activeSeqIdx === 2 && (
                <g>
                  <rect x="18" y="10" width="84" height="98" rx="10" fill={sketchRatio > 0.6 ? '#ECFDF5' : 'none'} />
                  <polyline points="34,40 44,50 64,30" stroke="#059669" strokeWidth="3.5" />
                  <polyline points="34,74 44,84 64,64" stroke="#059669" strokeWidth="3.5" />
                </g>
              )}
              {activeSeqIdx === 3 && (
                <g>
                  <rect x="22" y="10" width="76" height="96" rx="8" fill={sketchRatio > 0.6 ? '#F3E8FF' : 'none'} />
                  <line x1="38" y1="36" x2="82" y2="36" />
                  <line x1="38" y1="56" x2="82" y2="56" />
                  <line x1="38" y1="76" x2="68" y2="76" />
                </g>
              )}
              {activeSeqIdx === 4 && (
                <g>
                  <circle cx="60" cy="52" r="40" fill={sketchRatio > 0.6 ? '#FFE4E6' : 'none'} />
                  <polyline points="40,54 54,68 82,38" strokeWidth="4" />
                </g>
              )}
            </g>

            <rect x="14" y="172" width="148" height="26" rx="8" fill="#0F172A" opacity={sketchRatio} />
            <text x="88" y="189" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="900" opacity={sketchRatio}>
              {currentSeq.cards[0]?.tag}
            </text>
          </g>

          {/* RIGHT OF WHITEBOARD (x=486..832): 3 Fundamental Elements Written Cleanly */}
          <g transform="translate(486, 78)">
            <text x="4" y="14" fill="#475569" fontSize="9" fontWeight="900">
              ✍️ ÉLÉMENTS FONDAMENTAUX ÉCRITS AU TABLEAU :
            </text>

            {currentSeq.cards.map((cItem, cIdx) => {
              const rowY = 26 + cIdx * 62;
              const rowRatio =
                !isSketchingIllustration && cIdx < cardIdx
                  ? 1
                  : !isSketchingIllustration && cIdx === cardIdx
                  ? Math.max(0.08, Math.min(1, localCardRatio))
                  : 0;
              const visibleChars = Math.floor(cItem.sub.length * rowRatio);
              const writtenSub = rowRatio >= 0.98 ? cItem.sub : cItem.sub.slice(0, visibleChars);

              return (
                <g key={cIdx} transform={`translate(0, ${rowY})`}>
                  <rect
                    x="0"
                    y="0"
                    width="344"
                    height="52"
                    rx="12"
                    fill={rowRatio > 0 ? '#FFFFFF' : '#F8FAFC'}
                    stroke={rowRatio > 0 ? currentSeq.color : '#E2E8F0'}
                    strokeWidth={rowRatio > 0 && cIdx === cardIdx ? '2.4' : '1.5'}
                  />
                  <circle
                    cx="24"
                    cy="26"
                    r="13"
                    fill={rowRatio > 0 ? currentSeq.color : '#CBD5E1'}
                  />
                  <text x="24" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">
                    0{cIdx + 1}
                  </text>
                  <text x="46" y="20" fill={currentSeq.color} fontSize="8.8" fontWeight="900">
                    {cItem.tag}
                  </text>
                  {rowRatio > 0 && (
                    <text x="46" y="38" fill="#0F172A" fontSize="10.8" fontWeight="800">
                      {writtenSub}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 5 Sequence Jump Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {sequences.map((seq, idx) => {
          const isCur = idx === activeSeqIdx;
          return (
            <button
              key={seq.num}
              type="button"
              onClick={() => startPlaybackAt(idx)}
              className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                isCur
                  ? 'bg-amber-400/20 border-amber-400 text-white shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-amber-400 truncate">
                {seq.pillarTag}
              </div>
              <div className="text-[11px] font-bold truncate mt-0.5">{seq.title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// ARCHITECTURE PÉDAGOGIQUE DU CHAPITRE EN 5 PILIERS NORMALISÉS
// ============================================================================
export const StructuredChapterArchitecture: React.FC<StructuredChapterArchitectureProps> = ({
  course,
  lesson,
  lessonIndex,
  currentProfile,
  activeScreenIndex,
  onJumpToWhiteboardScreen,
  onCompleteChapterAndNext,
  isChapterCompleted,
  isLastChapter,
  autoOpenSummaryVideo = false,
  onCloseSummaryVideo
}) => {
  const [activePillarTab, setActivePillarTab] = useState<number>(0);
  const [showSummaryVideo, setShowSummaryVideo] = useState<boolean>(autoOpenSummaryVideo);

  // Sync active pillar tab when whiteboard screen changes
  useEffect(() => {
    if (typeof activeScreenIndex === 'number' && activeScreenIndex >= 0 && activeScreenIndex <= 4) {
      setActivePillarTab(activeScreenIndex);
    }
  }, [activeScreenIndex]);

  useEffect(() => {
    if (autoOpenSummaryVideo) {
      setShowSummaryVideo(true);
    }
  }, [autoOpenSummaryVideo]);

  const structured = useMemo(
    () => buildStructuredChapterContent(course, lesson, lessonIndex, currentProfile),
    [course, lesson, lessonIndex, currentProfile]
  );

  // Interactive Checklist state (Pillar 3)
  const [checkedReflexes, setCheckedReflexes] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
    3: false
  });

  // Download feedback state (Pillar 4)
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Quick Chapter Quiz & Case Study state (Pillar 5)
  const [chapterQuizAnswers, setChapterQuizAnswers] = useState<Record<number, number>>({});
  const [chapterQuizSubmitted, setChapterQuizSubmitted] = useState<boolean>(false);
  const [selectedCaseOptionId, setSelectedCaseOptionId] = useState<string | null>(null);

  useEffect(() => {
    setChapterQuizAnswers({});
    setChapterQuizSubmitted(false);
    setSelectedCaseOptionId(null);
  }, [course.id, lessonIndex]);

  const handleDownloadTemplate = (livrable: StructuredChapterData['bilan']['livrables'][0]) => {
    try {
      const blob = new Blob([livrable.templateBody], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = livrable.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadedId(livrable.id);
      setTimeout(() => setDownloadedId(null), 3000);
    } catch {}
  };

  const handleSelectPillar = (pillarIdx: number) => {
    setActivePillarTab(pillarIdx);
    onJumpToWhiteboardScreen(pillarIdx);
  };

  const chapterQuizScore = useMemo(() => {
    const qs = structured.verification.quizQuestions;
    if (!qs.length) return 0;
    let ok = 0;
    qs.forEach((q, idx) => {
      if (chapterQuizAnswers[idx] === q.correctIndex) ok++;
    });
    return Math.round((ok / qs.length) * 100);
  }, [structured.verification.quizQuestions, chapterQuizAnswers]);

  const PILLAR_NAV = [
    {
      idx: 0,
      num: '1',
      shortTitle: "1. L'Enjeu (Accroche & Contexte)",
      subtitle: 'Cas concret • Loi 10/010 • Objectif',
      icon: Target,
      accent: 'from-amber-500 to-orange-600',
      border: 'border-amber-500/50',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    },
    {
      idx: 1,
      num: '2',
      shortTitle: '2. Le Principe (Règle & Mécanisme)',
      subtitle: 'Règle d’or • Flux 01➔03 • Rôles',
      icon: GitBranch,
      accent: 'from-blue-500 to-indigo-600',
      border: 'border-blue-500/50',
      badgeBg: 'bg-blue-500/20 text-blue-300'
    },
    {
      idx: 2,
      num: '3',
      shortTitle: '3. La Pratique (Terrain & Rôles)',
      subtitle: 'Check-list • Pièges • Visas ANO',
      icon: ShieldCheck,
      accent: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      idx: 3,
      num: '4',
      shortTitle: '4. Le Bilan (Synthèse & Livrables)',
      subtitle: '3 Idées clés • Modèles DAO/PV',
      icon: FileText,
      accent: 'from-purple-500 to-violet-600',
      border: 'border-purple-500/50',
      badgeBg: 'bg-purple-500/20 text-purple-300'
    },
    {
      idx: 4,
      num: '5',
      shortTitle: '5. La Vérification (Quiz & Cas)',
      subtitle: 'QCM rapide • Étude de cas courte',
      icon: Award,
      accent: 'from-rose-500 to-pink-600',
      border: 'border-rose-500/50',
      badgeBg: 'bg-rose-500/20 text-rose-300'
    }
  ];

  return (
    <div className="w-full space-y-5">
      {/* ===================================================================== */}
      {/* BANDEAU & CAPSULE VIDÉO RÉSUMANT LE COURS                             */}
      {/* ===================================================================== */}
      {showSummaryVideo ? (
        <CourseSummaryMiniVideoPlayer
          course={course}
          currentProfile={currentProfile}
          onClose={() => {
            setShowSummaryVideo(false);
            onCloseSummaryVideo?.();
          }}
        />
      ) : (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  🎬 Capsule Vidéo Résumé du Module ({course.code})
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Visionner la petite vidéo résumant l’intégralité du cours « {course.title} » en 5 étapes clés
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSummaryVideo(true)}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Regarder la Vidéo Résumé du Cours</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BARRE DE NAVIGATION DES 5 PILIERS PÉDAGOGIQUES DU CHAPITRE             */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 sm:p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">
              STRUCTURE PÉDAGOGIQUE NORMALISÉE ARMP • CHAPITRE {lessonIndex + 1}
            </span>
            <h3 className="text-sm sm:text-base font-black text-white">
              {lesson?.title || course.title} — Parcours méthodologique en 5 étapes
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Cliquez sur une étape pour synchroniser le tableau blanc et explorer ses outils
          </span>
        </div>

        {/* 5 Pillar Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PILLAR_NAV.map((p) => {
            const Icon = p.icon;
            const isSelected = activePillarTab === p.idx;
            return (
              <button
                key={p.idx}
                type="button"
                onClick={() => handleSelectPillar(p.idx)}
                className={`text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? `bg-slate-800/95 ${p.border} ring-2 ring-amber-400/40 shadow-lg`
                    : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${p.badgeBg}`}>
                    PILIER {p.num}/5
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-snug">{p.shortTitle}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* PILIER 1 : ACCROCHE & MISE EN CONTEXTE (L'ENJEU)                     */}
        {/* =================================================================== */}
        {activePillarTab === 0 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">
                  1. Accroche & Mise en contexte (L&apos;Enjeu)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Objectif : Capter l&apos;attention et expliquer pourquoi ce sujet est crucial sur le terrain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToWhiteboardScreen(0)}
                className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shrink-0 cursor-pointer"
              >
                Voir Planche 1/5 au Tableau ↑
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Élément clé 1 : Cas concret ou mise en situation */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase">
                  <Briefcase className="w-4 h-4" />
                  <span>1. Cas concret / Mise en situation</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  {structured.enjeu.casConcretTitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {structured.enjeu.casConcretSituation}
                </p>
              </div>

              {/* Élément clé 2 : Ancrage réglementaire */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase">
                  <Scale className="w-4 h-4" />
                  <span>2. Ancrage réglementaire</span>
                </div>
                <div className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
                  {structured.enjeu.ancrageLegalRef}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {structured.enjeu.ancrageLegalDetail}
                </p>
              </div>

              {/* Élément clé 3 : Objectif pédagogique */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                  <Target className="w-4 h-4" />
                  <span>3. Objectif pédagogique</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Compétence visée à la fin de la leçon
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {structured.enjeu.objectifPedagogique}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PILIER 2 : LE CŒUR DU SUJET : RÈGLE & MÉCANISME (LE PRINCIPE)        */}
        {/* =================================================================== */}
        {activePillarTab === 1 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400">
                  2. Le Cœur du Sujet : Règle & Mécanisme (Le Principe)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Objectif : Transmettre la notion clé sans surcharger la mémoire cognitive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToWhiteboardScreen(1)}
                className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-black shrink-0 cursor-pointer"
              >
                Voir Planche 2/5 au Tableau ↑
              </button>
            </div>

            {/* 1. Principe directeur (La règle d'or) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/40 space-y-1.5">
              <div className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>1. Principe directeur (La Règle d&apos;Or à retenir)</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                « {structured.principe.principeDirecteur} »
              </p>
            </div>

            {/* 2. Schéma ou flux visuel : Étape 01 ➔ Étape 02 ➔ Étape 03 */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" />
                <span>2. Schéma & Flux visuel étape par étape (Étape 01 ➔ Étape 02 ➔ Étape 03)</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {structured.principe.fluxEtapes.map((etape, idx) => (
                  <div
                    key={etape.code}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 relative space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono text-[10px] font-black">
                        {etape.code}
                      </span>
                      {idx < 2 && (
                        <span className="text-amber-400 font-black text-xs hidden md:inline">➔</span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white">{etape.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{etape.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Clarification des rôles : Qui fait quoi ? (CGPMP vs DGCMP vs ARMP) */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>3. Clarification des rôles : Qui fait quoi ? (CGPMP vs DGCMP vs ARMP)</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-1">
                  <span className="text-[11px] font-black text-blue-400">🏛️ CGPMP (Gestion & Évaluation)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{structured.principe.roles.cgpmp}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-black text-emerald-400">🛡️ DGCMP (Contrôle a priori & ANO)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{structured.principe.roles.dgcmp}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1">
                  <span className="text-[11px] font-black text-amber-400">⚖️ ARMP (Régulation, CRD & Audit)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{structured.principe.roles.armp}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PILIER 3 : APPLICATION PRATIQUE & RÔLES DU TERRAIN (LA PRATIQUE)     */}
        {/* =================================================================== */}
        {activePillarTab === 2 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400">
                  3. Application Pratique & Rôles du Terrain (La Pratique)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Objectif : Transformer la théorie en réflexe métier immédiat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToWhiteboardScreen(2)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black shrink-0 cursor-pointer"
              >
                Voir Planche 3/5 au Tableau ↑
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* 1. Check-list d'action interactive */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Check-list d&apos;action terrain</span>
                </div>
                <div className="space-y-2">
                  {structured.pratique.checklistActions.map((item, idx) => {
                    const checked = Boolean(checkedReflexes[idx]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setCheckedReflexes((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition cursor-pointer ${
                          checked
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            checked ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Points de vigilance / Pièges à éviter */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>2. Vigilance & Pièges à éviter</span>
                </div>
                <div className="space-y-2">
                  {structured.pratique.piegesAEviter.map((piege, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-100 leading-snug flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-black shrink-0">⚠️</span>
                      <span>{piege}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Règles de conformité / Visas */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Règles de conformité & Visas</span>
                </div>
                <div className="space-y-2">
                  {structured.pratique.visasConformite.map((visa, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-800/40 text-xs text-amber-100 leading-snug flex items-start gap-2"
                    >
                      <span className="text-amber-400 font-black shrink-0">✓</span>
                      <span>{visa}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PILIER 4 : SYNTHÈSE & LIVRABLES (LE BILAN)                           */}
        {/* =================================================================== */}
        {activePillarTab === 3 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400">
                  4. Synthèse & Livrables (Le Bilan)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Objectif : Ancrer les connaissances et fournir des outils réutilisables sur le terrain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToWhiteboardScreen(3)}
                className="px-3 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-black shrink-0 cursor-pointer"
              >
                Voir Planche 4/5 au Tableau ↑
              </button>
            </div>

            {/* 1. Résumé mot à mot / Les 3 Idées clés */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>1. Résumé mot à mot — Les 3 points majeurs à retenir absolument</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    speechService.unlockAudio();
                    speechService.play(
                      structured.bilan.troisIdeesCles.join(' '),
                      `bilan-voice-${course.id}-${lessonIndex}`,
                      { speed: 0.92, voice: speechService.getVoicePersona() }
                    );
                  }}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Écouter le résumé mot à mot</span>
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {structured.bilan.troisIdeesCles.map((idee, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-medium"
                  >
                    {idee}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Ressources téléchargeables : Modèles de documents & canevas types */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>2. Ressources téléchargeables : Modèles de documents & Canevas types ARMP</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {structured.bilan.livrables.map((liv) => {
                  const isJustDownloaded = downloadedId === liv.id;
                  return (
                    <div
                      key={liv.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                          {liv.typeLabel}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white">{liv.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{liv.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate(liv)}
                        className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isJustDownloaded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-purple-600 text-white border border-slate-700'
                        }`}
                      >
                        {isJustDownloaded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Modèle téléchargé ✓</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger le canevas</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PILIER 5 : ÉVALUATION & VALIDATION (LA VÉRIFICATION)                 */}
        {/* =================================================================== */}
        {activePillarTab === 4 && (
          <div className="space-y-5 pt-1 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400">
                  5. Évaluation & Validation (La Vérification)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Objectif : Mesurer l&apos;assimilation (QCM rapide + Étude de cas courte) avant de passer au chapitre suivant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onJumpToWhiteboardScreen(4)}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-black shrink-0 cursor-pointer"
              >
                Voir Planche 5/5 au Tableau ↑
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* 1. Quiz ou QCM rapide (4 questions ciblées sur des cas pratiques) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase">
                    <HelpCircle className="w-4 h-4" />
                    <span>1. Quiz / QCM rapide du chapitre (4 questions)</span>
                  </div>
                  {chapterQuizSubmitted && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-black">
                      Score : {chapterQuizScore}%
                    </span>
                  )}
                </div>

                <div className="space-y-3.5">
                  {structured.verification.quizQuestions.map((q, qIdx) => {
                    const picked = chapterQuizAnswers[qIdx];
                    return (
                      <div key={qIdx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-white">
                          <span className="text-amber-400 font-black mr-1.5">Q{qIdx + 1}.</span>
                          {q.question}
                        </div>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oIdx) => {
                            const isPicked = picked === oIdx;
                            let cls = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';
                            if (chapterQuizSubmitted) {
                              if (oIdx === q.correctIndex) {
                                cls = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                              } else if (isPicked) {
                                cls = 'bg-rose-950/60 border-rose-500 text-rose-200';
                              }
                            } else if (isPicked) {
                              cls = 'bg-blue-950/60 border-blue-500 text-white font-bold';
                            }
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={chapterQuizSubmitted}
                                onClick={() =>
                                  setChapterQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                                }
                                className={`w-full text-left p-2 rounded-lg border text-[11px] leading-snug transition cursor-pointer ${cls}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {chapterQuizSubmitted && (
                          <div className="text-[11px] text-cyan-300 bg-slate-950/90 p-2 rounded-lg border border-slate-800">
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!chapterQuizSubmitted ? (
                  <button
                    type="button"
                    disabled={
                      Object.keys(chapterQuizAnswers).length <
                      structured.verification.quizQuestions.length
                    }
                    onClick={() => setChapterQuizSubmitted(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    Vérifier mes réponses au QCM du chapitre
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setChapterQuizAnswers({});
                      setChapterQuizSubmitted(false);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Réinitialiser le QCM rapide
                  </button>
                )}
              </div>

              {/* 2. Étude de cas courte (Analyse d'un scénario pour valider la prise de décision) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase">
                    <Briefcase className="w-4 h-4" />
                    <span>2. Étude de cas courte — Validation de la prise de décision</span>
                  </div>
                  <h4 className="text-sm font-black text-white">
                    {structured.verification.etudeDeCas.title}
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {structured.verification.etudeDeCas.scenario}
                  </div>
                  <p className="text-xs font-black text-amber-300">
                    👉 {structured.verification.etudeDeCas.questionDecision}
                  </p>

                  <div className="space-y-2">
                    {structured.verification.etudeDeCas.options.map((opt) => {
                      const isPicked = selectedCaseOptionId === opt.id;
                      let cls = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                      if (isPicked) {
                        cls = opt.isCorrect
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 font-bold'
                          : 'bg-rose-950/60 border-rose-500 text-rose-100 font-bold';
                      }
                      return (
                        <div key={opt.id} className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCaseOptionId(opt.id)}
                            className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition cursor-pointer ${cls}`}
                          >
                            {opt.label}
                          </button>
                          {isPicked && (
                            <div
                              className={`p-2.5 rounded-xl text-xs border ${
                                opt.isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                                  : 'bg-amber-950/40 border-amber-700 text-amber-300'
                              }`}
                            >
                              {opt.feedback}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bouton de validation finale du chapitre */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {isChapterCompleted
                      ? '✓ Chapitre déjà validé dans votre parcours'
                      : 'Validez cette étape pour débloquer la suite du module'}
                  </span>
                  <button
                    type="button"
                    onClick={onCompleteChapterAndNext}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isLastChapter
                        ? 'Valider le chapitre & Passer à l’Examen Final'
                        : 'Valider l’assimilation & Chapitre suivant →'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
