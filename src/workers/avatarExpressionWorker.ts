// Dedicated Web Worker & 60 FPS Biomechanical Female Speech Expression Engine
// Models how a real woman's mouth, lips, jaw, and tongue move when speaking French:
// 1. 7 Articulatory Viseme Classes (Bilabial M/B/P, Labiodental F/V, Dental/Alveolar T/D/L/N/S/Z,
//    Palatal-Round CH/J, Rounded Vowel O/OU/U/ON/EU, Spread Vowel I/É/IN, Open Vowel A/AN/È/OI)
// 2. True French Labial Kinematics: Lateral commissure pinch on rounded vowels (O, OU, ON, U),
//    gentle horizontal stretch on smiling vowels (I, É), labiodental lower-lip-to-incisor contact (F, V),
//    complete bilabial closure (M, B, P), and balanced anatomical mandible arc (+16.2px max).
// 3. Anticipatory Coarticulation (+48ms lookahead) & Frame-Rate-Independent Biomechanical Damping.
// 4. 100% Natural Photographic Inlay (zero synthetic lip lines or painted teeth overlays).

import { avatarKalmanSmoother } from '../utils/kalmanMotionFilter';
import {
  type MicroGestureId,
  type TtsEmotionalTag,
  extractTtsEmotionalTags,
  reanchorEmotionalTagsToBoundaries,
  evaluateMicroGestureTimeline,
} from '../utils/microGestureLibrary';

export type { MicroGestureId, TtsEmotionalTag };

export type WorkerViseme = 'closed' | 'open' | 'wide' | 'round' | 'narrow';

export type AvatarEmotion =
  | 'smiling'
  | 'enthusiastic'
  | 'empathetic'
  | 'solemn'
  | 'curious'
  | 'encouraging'
  | 'pedagogical'
  | 'refusal'
  | 'acceptance'
  | 'astonished';

export type HeadGestureType =
  | 'refusal'      // Hochet latéral gauche-droite (« Non », interdiction, nullité, rejet, fractionnement)
  | 'acceptance'   // Hochement vertical haut-bas (« Oui », validation, conformité, accord, bravo)
  | 'questioning'  // Inclinaison interrogative de la tête + froncement réflexif + main au menton
  | 'astonishment' // Mouvement vif d'étonnement / alerte (yeux grands ouverts + sourcils arqués + bouche en O + mains au buste)
  | 'empathy'      // Inclinaison chaleureuse et apaisante (sourire complice + mains vers le cœur/épaule)
  | 'greeting'     // Révérence courtoise de préséance & ouverture (main droite ouverte paume vers le haut)
  | 'emphasis'     // Appui vertical décisif de la tête + main pédagogique ouverte
  | 'neutral';     // Cadence conversationnelle fluide

// 6 Expressive Facial & Body-Language Postures inspired by Reference Sheet 1 (planche_expressions_visage_langage_corporel.png)
export type BodyLanguagePostureId =
  | 'welcome_open_palm'      // Panel 1 (Top-Left): Sourire rayonnant + main droite ouverte paume vers le haut
  | 'chin_reflection'        // Panel 2 (Top-Center): Sourcils froncés en réflexion + tête inclinée + main sous le menton
  | 'astonished_chest_hands' // Panel 3 (Top-Right): Yeux grands ouverts + bouche en O + deux mains levées sur le haut du buste
  | 'serene_clasped'         // Panel 4 (Bottom-Left): Regard posé et attentif + lèvres douces + mains jointes devant soi
  | 'teaching_gesture'       // Panel 5 (Bottom-Center): Regard direct + sourire confiant + main ouverte d'explication
  | 'heart_encouragement';   // Panel 6 (Bottom-Right): Tête trois-quarts + sourire complice + mains jointes près de l'épaule/cœur

export interface WorkerWordBoundary {
  text: string;
  offsetMs: number;
  durationMs: number;
  charIndex: number;
}

export interface WorkerPhonemeToken {
  openness: number;      // 0.0 (closed) .. 1.0 (open vowel A)
  roundness: number;     // 0.0 .. 1.0 (French lip rounding O, OU, U, ON, EU, CH, J)
  spread: number;        // 0.0 .. 1.0 (French horizontal smile stretch I, É, IN)
  upperLipLift: number;  // -1.0 (descends to close/round) .. +1.0 (lifts to show upper teeth)
  tongueLift: number;    // 0.0 .. 1.0 (retro-incisor contact L, N, T, D)
  viseme: WorkerViseme;
  isBilabialClosure: boolean;
  isLabiodental: boolean;
  startRatio: number;
  endRatio: number;
}

export interface AvatarComputedFrame {
  nowMs: number;
  isSpeaking: boolean;
  open: number;
  viseme: WorkerViseme;
  emotion: AvatarEmotion;
  emotionLabel: string;
  torsoTransform: string;
  headTransform: string;
  jawInlayTransform: string;
  upperLipInlayTransform: string;
  upperLipInlayOpacity: string;
  cavityD: string;
  cavityOpacity: string;
  mouthOpacity: string;
  tongueOpacity: string;
  tongueCx: string;
  tongueCy: string;
  tongueRx: string;
  tongueRy: string;
  leftEyelidD: string;
  leftLashD: string;
  leftBlinkOpacity: string;
  rightEyelidD: string;
  rightLashD: string;
  rightBlinkOpacity: string;
  eqY: [string, string, string, string, string];
  eqH: [string, string, string, string, string];
  // Wav2Lip Dense Video Mesh Kinematics
  jawDy: number;
  upperDy: number;
  roundness: number;
  spread: number;
  upperLipLift: number;
  tongueLift: number;
  turn: number;
  nod: number;
  tilt: number;
  hairLagTurn: number;
  hairLagNod: number;
  eyebrowLift: number;
  browFurrow: number;
  eyeWide: number;
  cheekLift: number;
  smile: number;
  intonation: number;
  blinkLeft: number;
  blinkRight: number;
  gazeX: number;
  gazeY: number;
  breathY: number;
  shoulderLift: number;
  leftShoulderLift: number;
  rightShoulderLift: number;
  collarLift: number;
  torsoSwayX: number;
  activeMicroGestureTag: MicroGestureId | null;
  activeMicroGestureLabel: string;
  leftHandDx: number;
  leftHandDy: number;
  rightHandDx: number;
  rightHandDy: number;
  cavTopYs: number[];
  cavBotYs: number[];
  // 6 Phonetic Mouth Visemes (Reference Sheet 2: planche_articulation_bouche_parole.png)
  activeVisemeNumber: 1 | 2 | 3 | 4 | 5 | 6;
  activeVisemeLabel: string;
  // 6 Facial & Body-Language Postures (Reference Sheet 1: planche_expressions_visage_langage_corporel.png)
  bodyLanguagePosture: BodyLanguagePostureId;
  bodyLanguageLabel: string;
  pWelcome: number;
  pReflection: number;
  pAstonished: number;
  pSerene: number;
  pTeaching: number;
  pEncouragement: number;
}

interface WorkerPoseState {
  lastNowMs: number;
  rawOpen: number;
  open: number;
  openVel: number;
  smoothRms: number;
  roundness: number;
  spread: number;
  upperLipLift: number;
  widthFactor: number;
  tongueLift: number;
  midTilt: number;
  midNod: number;
  midTurn: number;
  tilt: number;
  nod: number;
  turn: number;
  hairLagTurn: number;
  hairLagNod: number;
  eyebrowLift: number;
  browFurrow: number;
  eyeWide: number;
  cheekLift: number;
  smile: number;
  intonation: number;
  wRefusal: number;
  wAcceptance: number;
  wQuestion: number;
  wAstonishment: number;
  wEmpathy: number;
  wGreeting: number;
  wEmphasis: number;
  pWelcome: number;
  pReflection: number;
  pAstonished: number;
  pSerene: number;
  pTeaching: number;
  pEncouragement: number;
  shoulderX: number;
  shoulderY: number;
  leftShoulderY: number;
  rightShoulderY: number;
  collarY: number;
  leftHandDx: number;
  leftHandDy: number;
  rightHandDx: number;
  rightHandDy: number;
  blinkLeft: number;
  blinkRight: number;
}

const pose: WorkerPoseState = {
  lastNowMs: 0,
  rawOpen: 0.04,
  open: 0.04,
  openVel: 0,
  smoothRms: 0,
  roundness: 0,
  spread: 0.22,
  upperLipLift: 0,
  widthFactor: 1,
  tongueLift: 0,
  midTilt: 0,
  midNod: 0,
  midTurn: 0,
  tilt: 0,
  nod: 0,
  turn: 0,
  hairLagTurn: 0,
  hairLagNod: 0,
  eyebrowLift: 0.22,
  browFurrow: 0,
  eyeWide: 0.14,
  cheekLift: 0.32,
  smile: 0.46,
  intonation: 0.24,
  wRefusal: 0,
  wAcceptance: 0,
  wQuestion: 0,
  wAstonishment: 0,
  wEmpathy: 0,
  wGreeting: 0,
  wEmphasis: 0,
  pWelcome: 0,
  pReflection: 0,
  pAstonished: 0,
  pSerene: 1,
  pTeaching: 0,
  pEncouragement: 0,
  shoulderX: 0,
  shoulderY: 0,
  leftShoulderY: 0,
  rightShoulderY: 0,
  collarY: 0,
  leftHandDx: 0,
  leftHandDy: 0,
  rightHandDx: 0,
  rightHandDy: 0,
  blinkLeft: 0,
  blinkRight: 0,
};

// 10-station pixel-calibrated coordinates of Aïsha's natural photographic mouth in aisha_portrait_sans_main_1790912759956.jpg
// from left commissure (408.0, 484.0) to right commissure (500.0, 484.0)
const MOUTH_X = [408.0, 418.0, 428.0, 438.0, 448.0, 458.0, 468.0, 478.0, 488.0, 500.0];
const UPPER_LIP_BOT_Y = [483.5, 482.5, 482.0, 481.5, 481.5, 481.5, 481.5, 482.0, 482.5, 483.5];
const UPPER_TEETH_BOT_Y = [484.0, 484.0, 484.0, 484.0, 484.0, 484.0, 484.0, 484.0, 484.0, 484.0];
const LOWER_LIP_TOP_Y = [484.5, 485.0, 485.2, 485.5, 485.5, 485.5, 485.5, 485.2, 485.0, 484.5];

// Balanced bilateral parabola of human lower lip displacement (strong left-side participation at stations 1..4)
const MANDIBLE_ARC_WEIGHT = [0.22, 0.72, 0.90, 0.98, 1.0, 1.0, 0.98, 0.90, 0.68, 0.16];

export const EMOTION_LABELS: Record<AvatarEmotion, string> = {
  smiling: '😊 Sourire Chaleureux & Bienveillance',
  enthusiastic: '🌟 Joie & Enthousiasme bienveillant',
  empathetic: '💛 Empathie & Douceur fraternelle',
  solemn: '⚖️ Vigilance & Rigueur juridique',
  curious: '🤔 Curiosité & Questionnement',
  encouraging: '🙌 Encouragement & Inspiration',
  pedagogical: '🎓 Éloquence & Sourire Pédagogique',
  refusal: '🙅‍♀️ Refus & Interdiction (« Non »)',
  acceptance: '🙆‍♀️ Approbation & Validation (« Oui »)',
  astonished: '😲 Étonnement & Intonation vive',
};

export const HEAD_GESTURE_LABELS: Record<HeadGestureType, string> = {
  refusal: '🙅‍♀️ Refus & Vigilance (« Non »)',
  acceptance: '🙆‍♀️ Validation & Accord (« Oui »)',
  questioning: '🤔 Questionnement & Réflexion',
  astonishment: '😲 Étonnement & Intonation vive',
  empathy: '💛 Empathie & Écoute bienveillante',
  greeting: '😊 Salutation & Préséance',
  emphasis: '🎓 Appui & Insistance Pédagogique',
  neutral: '',
};

export function detectSentenceEmotion(text: string): AvatarEmotion {
  const s = (text || '').toLowerCase();
  if (!s) return 'pedagogical';

  if (
    /\b(non\b|jamais|interdit|interdite|interdiction|illégal|illicite|nullité|forclusion|irrecevable|saucissonnage|fractionnement|fraude|conflit d['’]intérêts|rejeté|refusé|aucun cas)/i.test(
      s
    )
  ) {
    return 'refusal';
  }

  if (
    /(incroyable|étonnant|étonnement|étonné|étonnée|surprise|surprenant|impressionnant|extraordinaire|stupéfiant|inattendu|saisissant|figure-toi|figurez-vous|imaginez|waouh|oh là là|croire|révélation)/i.test(
      s
    ) ||
    (/!/.test(s) && /(vraiment|quel|quelle|comment|déjà|autant|jamais vu|exceptionnel|remarquable)/i.test(s))
  ) {
    return 'astonished';
  }

  if (
    /(attention|sanction|rejet|obligatoire|piège|risque|infraction|faute|pénalité)/i.test(
      s
    )
  ) {
    return 'solemn';
  }

  if (
    /\b(oui\b|exactement|absolument|parfaitement|tout à fait|bien sûr|valide|validé|conforme|approuvé|accepté|accord|autorisé)\b/i.test(
      s
    )
  ) {
    return 'acceptance';
  }

  if (
    /(rassure|inquiète|comprends|doucement|pas à pas|grande sœur|mon frère|ma sœur|avec cœur|normal d['’]hésiter|calme|sérénité|accompagne|ensemble nous|confiance en toi|respire)/i.test(
      s
    )
  ) {
    return 'empathetic';
  }

  if (
    /(bonjour|sourire|souris|souriante|heureuse|ravie|ravi|retrouver|joie|plaisir|enchantée|chaleureusement|bienvenue|ensemble|échange|confiance|mieux comprendre|avancer)/i.test(
      s
    )
  ) {
    return 'smiling';
  }

  if (
    /(bienvenue|bravo|excellent|félicitations|merveilleux|superbe|quel honneur|magnifique|formidable|bonjour)/i.test(
      s
    )
  ) {
    return 'enthusiastic';
  }

  if (
    /\?/.test(s) ||
    /(pourquoi|comment|à ton avis|que ferais-tu|imagine|sais-tu|observons|pose-toi la question|quel est|quelle est)/i.test(
      s
    )
  ) {
    return 'curious';
  }

  if (
    /(en pratique|sur le terrain|conseil|astuce|capable|réussir|courage|retiens|retenons|clé|maîtrise|fière|succès|quotidien professionnel|bon réflexe)/i.test(
      s
    )
  ) {
    return 'encouraging';
  }

  return 'pedagogical';
}

// Classify a single spoken French word into an expressive biomechanical head gesture
function classifyWordHeadGesture(rawWord: string): HeadGestureType {
  const w = (rawWord || '')
    .toLowerCase()
    .replace(/[.,;:!?«»"()—\-]/g, '')
    .trim();
  if (!w) return 'neutral';

  // 1. Refusal / Prohibition -> Lateral head shake ("Non / Interdit")
  // (Note: never classify warm invitations like "n'hésitez pas" as refusal!)
  if (
    /^(non|jamais|aucun|aucune|aucuns|rien|personne|interdit|interdite|interdits|interdiction|interdire|illégal|illégale|illicite|impossible|nul|nulle|nullité|rejet|rejeté|rejetée|rejeter|refus|refusé|refuser|forclusion|irrecevable|saucissonnage|fractionnement|fraude|conflit|faute|sanction|sanctions|pénalité|pénalités|éviter|évitez|prohibé|abus|irrégulier|irrégularité|défaut)$/.test(
      w
    )
  ) {
    return 'refusal';
  }

  // 2. Acceptance / Approval / Validation -> Affirmative vertical nod ("Oui")
  if (
    /^(oui|exact|exactement|absolument|parfait|parfaitement|bravo|félicitations|excellent|excellente|effectivement|certes|valide|validé|validée|valider|validation|conforme|conformité|approuvé|approuver|accepté|accepter|accord|autorisé|autorisée|autorisation|régulier|régulière|légal|légale|succès|réussi|réussir|juste|vrai|obligatoire|impératif|impérativement|admis|recevable|favorable|garantie|transparence|égalité|intégrité)$/.test(
      w
    )
  ) {
    return 'acceptance';
  }

  // 3. Astonishment / Exclamatory Intonation / Surprise -> Expressive head pull-back, brow arch & oval mouth
  if (
    /!/.test(rawWord || '') ||
    /^(incroyable|étonnant|étonnement|étonné|étonnée|surprise|surprenant|impressionnant|extraordinaire|stupéfiant|inattendu|saisissant|remarquable|exceptionnel|exceptionnelle|vraiment|figure|figurez|imagine|imaginez|waouh|oh|ah|eh|tiens|voilà|découverte|révélation|miracle|attention)$/.test(
      w
    )
  ) {
    return 'astonishment';
  }

  // 4. Questioning / Inquiry / Doubt -> Inquisitive lateral head tilt + chin lift
  if (
    /\?/.test(rawWord || '') ||
    /^(pourquoi|comment|quand|quel|quelle|quels|quelles|qui|combien|où|est-ce|quoi|lequel|laquelle|sais-tu|savez-vous|question|hypothèse|scénario|doute|hésiter|vérifier)$/.test(
      w
    )
  ) {
    return 'questioning';
  }

  // 4. Greeting / Protocol Precedence -> Courteous precedence bow & warm lift
  if (
    /^(bonjour|bienvenue|bonsoir|salut|honneur|plaisir|excellence|monsieur|madame|maître|docteur|professeur|ingénieur|heureuse|ravie|joie|merveilleux|hommages|préséance|salutation|félicite)$/.test(
      w
    )
  ) {
    return 'greeting';
  }

  // 5. Empathy / Reassurance -> Warm compassionate head inclination
  if (
    /^(rassure|rassurez|comprends|comprenons|doucement|ensemble|accompagne|confiance|calme|sérénité|cœur|frère|sœur|collègue|cher|chère|inquiète|normal|aide|aider|écoute|soutien|conseil|astuce)$/.test(
      w
    )
  ) {
    return 'empathy';
  }

  // 6. Pedagogical Emphasis -> Crisp downward beat nod on legal & structural anchors
  if (
    /^(article|loi|décret|ordonnance|important|essentiel|fondamental|clé|retiens|retenons|notamment|premièrement|deuxièmement|troisièmement|enfin|ensuite|toujours|seuil|seuils|délai|délais|principe|principes|règle|règles|étape|étapes|commission|autorité|contrôle)$/.test(
      w
    )
  ) {
    return 'emphasis';
  }

  return 'neutral';
}

function buildSmoothSplinePath(xs: number[], ys: number[]): string {
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(2)}`;
  const n = xs.length;
  for (let i = 0; i < n - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)];
    const y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[Math.min(n - 1, i + 2)];
    const y3 = ys[Math.min(n - 1, i + 2)];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(2)} ${cp2x.toFixed(1)} ${cp2y.toFixed(2)} ${x2.toFixed(1)} ${y2.toFixed(2)}`;
  }
  return d;
}

function buildClosedApertureSpline(xs: number[], topYs: number[], botYs: number[]): string {
  const topD = buildSmoothSplinePath(xs, topYs);
  const revXs = [...xs].reverse();
  const revBotYs = [...botYs].reverse();
  const botD = buildSmoothSplinePath(revXs, revBotYs).replace(/^M [^C]+/, '');
  return `${topD}${botD} Z`;
}

// ============================================================================
// REAL FEMALE FRENCH ARTICULATORY PHONEME TOKENIZER
// Maps French words into biomechanical articulatory targets (openness, roundness,
// spread, upperLipLift, tongueLift) with realistic vocalic vs consonantal timing.
// ============================================================================
interface RawBiomechanicalUnit {
  openness: number;
  roundness: number;
  spread: number;
  upperLipLift: number;
  tongueLift: number;
  viseme: WorkerViseme;
  isBilabialClosure: boolean;
  isLabiodental: boolean;
  weight: number;
}

function tokenizeFrenchWordPhonemes(rawWord: string): WorkerPhonemeToken[] {
  let w = (rawWord || '')
    .toLowerCase()
    .replace(/[^a-zàâäéèêëîïôöùûüÿçœæ]/g, '');

  if (!w) {
    return [
      {
        openness: 0.65,
        roundness: 0.1,
        spread: 0.2,
        upperLipLift: 0.3,
        tongueLift: 0,
        viseme: 'open',
        isBilabialClosure: false,
        isLabiodental: false,
        startRatio: 0,
        endRatio: 1,
      },
    ];
  }

  // Strip silent French word-final letters ('e', 'es', 's', 'x', 'z', 't', 'd', 'p')
  // when preceded by at least one vowel earlier in the word
  if (w.length > 3 && /[aeiouyàâéèêëîïôùûœ]/.test(w.slice(0, -2))) {
    w = w.replace(/(es|e|s|x|z|t|d|p)$/, '') || w;
  } else if (w.length > 2 && /[aeiouyàâéèêëîïôùûœ]/.test(w.slice(0, -1))) {
    w = w.replace(/[sxztdp]$/, '') || w;
  }

  const rawUnits: RawBiomechanicalUnit[] = [];
  let i = 0;
  const len = w.length;
  const isVowelChar = (ch: string) => /[aeiouyàâäéèêëîïôöùûüÿœæ]/.test(ch);

  while (i < len) {
    const rem = w.slice(i);

    // 1. Silent 'h'
    if (rem[0] === 'h') {
      i += 1;
      continue;
    }

    // 2. French Nasal Vowels (an, am, en, em, on, om, in, im, ain, ein, un, um, oin, ien)
    const nasalMatch = /^(oin|ien|ain|ein|an|am|en|em|on|om|in|im|un|um|yn|ym)/.exec(rem);
    if (nasalMatch) {
      const m = nasalMatch[0];
      const nextCh = rem[m.length] || '';
      const lastNasalChar = m[m.length - 1];
      if (!isVowelChar(nextCh) && nextCh !== lastNasalChar) {
        const isRoundNasal = /^(on|om|un|um|oin)/.test(m);
        const isOpenNasal = /^(an|am|en|em)/.test(m);
        if (isRoundNasal) {
          // Rounded French nasal ('on', 'om', 'un'): lips round inward into a soft oval
          rawUnits.push({
            openness: 0.72,
            roundness: 0.88,
            spread: 0.0,
            upperLipLift: -0.35,
            tongueLift: 0.0,
            viseme: 'round',
            isBilabialClosure: false,
            isLabiodental: false,
            weight: 1.85,
          });
        } else if (isOpenNasal) {
          // Open French nasal ('an', 'en'): mandible drops clearly, natural lip width
          rawUnits.push({
            openness: 0.92,
            roundness: 0.18,
            spread: 0.0,
            upperLipLift: 0.55,
            tongueLift: 0.0,
            viseme: 'open',
            isBilabialClosure: false,
            isLabiodental: false,
            weight: 1.9,
          });
        } else {
          // Spread French nasal ('in', 'ain', 'ein', 'ien'): corners stretch gently, medium jaw drop
          rawUnits.push({
            openness: 0.68,
            roundness: 0.0,
            spread: 0.78,
            upperLipLift: 0.65,
            tongueLift: 0.35,
            viseme: 'wide',
            isBilabialClosure: false,
            isLabiodental: false,
            weight: 1.75,
          });
        }
        i += m.length;
        continue;
      }
    }

    // 3. Diphthong 'oi' / 'oî' (pronounced [wa] in French: starts rounded [w] then opens wide into [a]!)
    const oiMatch = /^(oi|oî|oy)/.exec(rem);
    if (oiMatch) {
      rawUnits.push({
        openness: 0.48,
        roundness: 0.92,
        spread: 0.0,
        upperLipLift: -0.45,
        tongueLift: 0.0,
        viseme: 'round',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 0.75,
      });
      rawUnits.push({
        openness: 0.95,
        roundness: 0.0,
        spread: 0.25,
        upperLipLift: 0.7,
        tongueLift: 0.0,
        viseme: 'open',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 1.35,
      });
      i += oiMatch[0].length;
      continue;
    }

    // 4. Multi-letter French Oral Vowel Digraphs (eau, au, ou, eu, œu, ai, ei)
    const digraphVowel = /^(eau|œu|ou|où|oû|au|ai|aî|ei|eu)/.exec(rem);
    if (digraphVowel) {
      const m = digraphVowel[0];
      const isRound = /^(eau|au|ou|où|oû|eu|œu)/.test(m);
      if (isRound) {
        const isTightRound = /^(ou|où|oû)/.test(m);
        rawUnits.push({
          openness: isTightRound ? 0.58 : 0.74,
          roundness: isTightRound ? 0.95 : 0.82,
          spread: 0.0,
          upperLipLift: -0.4,
          tongueLift: 0.0,
          viseme: 'round',
          isBilabialClosure: false,
          isLabiodental: false,
          weight: 1.8,
        });
      } else {
        // 'ai', 'ei' -> open-mid front vowel [ɛ] / [e]
        rawUnits.push({
          openness: 0.78,
          roundness: 0.0,
          spread: 0.65,
          upperLipLift: 0.65,
          tongueLift: 0.3,
          viseme: 'wide',
          isBilabialClosure: false,
          isLabiodental: false,
          weight: 1.8,
        });
      }
      i += m.length;
      continue;
    }

    // 5. Bilabial Consonants (m, b, p, mm, bb, pp) -> Complete natural lip contact!
    const bilabial = /^(mm|bb|pp|m|b|p)/.exec(rem);
    if (bilabial) {
      rawUnits.push({
        openness: 0.0,
        roundness: 0.15,
        spread: 0.0,
        upperLipLift: -1.0,
        tongueLift: 0.0,
        viseme: 'closed',
        isBilabialClosure: true,
        isLabiodental: false,
        weight: 0.78,
      });
      i += bilabial[0].length;
      continue;
    }

    // 6. Labiodental Consonants (ph, ff, f, v) -> Lower lip touches bottom of upper incisors!
    const labiodental = /^(ph|ff|f|v)/.exec(rem);
    if (labiodental) {
      rawUnits.push({
        openness: 0.04,
        roundness: 0.1,
        spread: 0.15,
        upperLipLift: 0.25,
        tongueLift: 0.0,
        viseme: 'narrow',
        isBilabialClosure: false,
        isLabiodental: true,
        weight: 0.72,
      });
      i += labiodental[0].length;
      continue;
    }

    // 7. Postalveolar Rounded Consonants (ch, j, ge, gi) -> French lip protrusion & rounding
    const postalveolar = /^(ch|j)/.exec(rem);
    if (postalveolar) {
      rawUnits.push({
        openness: 0.12,
        roundness: 0.88,
        spread: 0.0,
        upperLipLift: -0.35,
        tongueLift: 0.55,
        viseme: 'round',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 0.68,
      });
      i += postalveolar[0].length;
      continue;
    }

    // 8. Dental / Alveolar / Liquid Consonants (tt, dd, ll, nn, gn, t, d, l, n) -> Tongue tip behind upper teeth
    const dental = /^(tt|dd|ll|nn|gn|th|t|d|l|n)/.exec(rem);
    if (dental) {
      rawUnits.push({
        openness: 0.10,
        roundness: 0.0,
        spread: 0.25,
        upperLipLift: 0.28,
        tongueLift: 1.0,
        viseme: 'narrow',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 0.68,
      });
      i += dental[0].length;
      continue;
    }

    // 9. Sibilant / Velar / Uvular Consonants (qu, gu, ss, cc, rr, s, z, c, ç, g, k, q, r, x)
    const otherConsonant = /^(qu|gu|ss|cc|rr|sc|s|z|c|ç|g|k|q|r|x|w)/.exec(rem);
    if (otherConsonant) {
      const m = otherConsonant[0];
      const isSibilant = /^(ss|sc|s|z|ç)/.test(m);
      rawUnits.push({
        openness: isSibilant ? 0.08 : 0.12,
        roundness: m === 'w' ? 0.88 : 0.0,
        spread: isSibilant ? 0.38 : 0.15,
        upperLipLift: 0.22,
        tongueLift: isSibilant ? 0.65 : 0.30,
        viseme: 'narrow',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 0.66,
      });
      i += m.length;
      continue;
    }

    // 10. Single Vowels: Wide Open (a, à, â, ä, è, ê, ë, æ)
    if (/^[aàâäèêëæ]/.test(rem)) {
      const isA = /^[aàâäæ]/.test(rem);
      rawUnits.push({
        openness: isA ? 0.96 : 0.84,
        roundness: 0.0,
        spread: isA ? 0.22 : 0.58,
        upperLipLift: 0.72,
        tongueLift: isA ? 0.1 : 0.35,
        viseme: isA ? 'open' : 'wide',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 1.42,
      });
      i += 1;
      continue;
    }

    // 11. Single Vowels: Rounded (o, ô, ö, u, ù, û, ü, œ)
    if (/^[oôöuùûüœ]/.test(rem)) {
      const isU = /^[uùûü]/.test(rem);
      rawUnits.push({
        openness: isU ? 0.48 : 0.72,
        roundness: isU ? 0.96 : 0.88,
        spread: 0.0,
        upperLipLift: -0.45,
        tongueLift: isU ? 0.45 : 0.1,
        viseme: 'round',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 1.38,
      });
      i += 1;
      continue;
    }

    // 12. Single Vowels: Front / Smiling (é, e, i, î, ï, y, ÿ)
    if (/^[éiîïyÿe]/.test(rem)) {
      const isHighFront = /^[iîïyÿ]/.test(rem);
      const isSchwa = rem[0] === 'e';
      rawUnits.push({
        openness: isHighFront ? 0.52 : isSchwa ? 0.58 : 0.74,
        roundness: isSchwa ? 0.42 : 0.0,
        spread: isHighFront ? 0.92 : isSchwa ? 0.0 : 0.76,
        upperLipLift: isSchwa ? 0.10 : 0.68,
        tongueLift: isHighFront ? 0.70 : 0.4,
        viseme: isSchwa ? 'open' : 'wide',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 1.32,
      });
      i += 1;
      continue;
    }

    i += 1;
  }

  if (rawUnits.length === 0) {
    return [
      {
        openness: 0.7,
        roundness: 0.1,
        spread: 0.2,
        upperLipLift: 0.35,
        tongueLift: 0,
        viseme: 'open',
        isBilabialClosure: false,
        isLabiodental: false,
        startRatio: 0,
        endRatio: 1,
      },
    ];
  }

  // Merge consecutive consonant clusters cleanly while preserving bilabial/labiodental priority
  const mergedUnits: RawBiomechanicalUnit[] = [];
  for (const u of rawUnits) {
    const prev = mergedUnits[mergedUnits.length - 1];
    const prevIsCons = prev && (prev.isBilabialClosure || prev.isLabiodental || prev.openness <= 0.30);
    const currIsCons = u.isBilabialClosure || u.isLabiodental || u.openness <= 0.30;

    if (prev && prevIsCons && currIsCons) {
      if (u.isBilabialClosure) {
        prev.isBilabialClosure = true;
        prev.openness = 0.0;
        prev.upperLipLift = -1.0;
        prev.viseme = 'closed';
      } else if (u.isLabiodental && !prev.isBilabialClosure) {
        prev.isLabiodental = true;
        prev.openness = 0.10;
      } else {
        prev.openness = Math.min(prev.openness, u.openness);
      }
      prev.roundness = Math.max(prev.roundness, u.roundness);
      prev.tongueLift = Math.max(prev.tongueLift, u.tongueLift);
      prev.weight = Math.min(0.42, prev.weight + 0.10);
    } else if (prev && !prevIsCons && !currIsCons) {
      // Two adjacent vowels in hiatus: gentle articulatory dip between syllables
      mergedUnits.push({
        openness: 0.32,
        roundness: (prev.roundness + u.roundness) * 0.5,
        spread: (prev.spread + u.spread) * 0.5,
        upperLipLift: 0.2,
        tongueLift: 0.3,
        viseme: 'narrow',
        isBilabialClosure: false,
        isLabiodental: false,
        weight: 0.35,
      });
      mergedUnits.push(u);
    } else {
      mergedUnits.push(u);
    }
  }

  const totalWeight = mergedUnits.reduce((acc, u) => acc + u.weight, 0) || 1;
  let accum = 0;
  return mergedUnits.map((u) => {
    const startRatio = accum / totalWeight;
    accum += u.weight;
    const endRatio = accum / totalWeight;
    return {
      openness: u.openness,
      roundness: u.roundness,
      spread: u.spread,
      upperLipLift: u.upperLipLift,
      tongueLift: u.tongueLift,
      viseme: u.viseme,
      isBilabialClosure: u.isBilabialClosure,
      isLabiodental: u.isLabiodental,
      startRatio,
      endRatio,
    };
  });
}

interface PreparedWordBoundary extends WorkerWordBoundary {
  tokens: WorkerPhonemeToken[];
  headGesture: HeadGestureType;
  intonationWeight: number; // 0.0 .. 1.0 prosodic pitch/stress & astonishment intensity
  gestureSpanStartMs: number;
  gestureSpanEndMs: number;
}

// Compute prosodic intonation & astonishment intensity (0.0 .. 1.0) for each spoken word
function computeWordIntonationWeight(
  rawWord: string,
  gesture: HeadGestureType,
  sentenceEmotion: AvatarEmotion,
  idx: number,
  totalWords: number
): number {
  const raw = rawWord || '';
  let weight =
    sentenceEmotion === 'astonished'
      ? 0.78
      : sentenceEmotion === 'enthusiastic' || sentenceEmotion === 'curious'
      ? 0.58
      : sentenceEmotion === 'solemn' || sentenceEmotion === 'refusal'
      ? 0.54
      : 0.36;

  if (/!/.test(raw) || gesture === 'astonishment') {
    weight = Math.max(weight, 0.96);
  } else if (/\?/.test(raw) || gesture === 'questioning') {
    weight = Math.max(weight, 0.86);
  } else if (gesture === 'emphasis' || gesture === 'refusal' || gesture === 'acceptance') {
    weight = Math.max(weight, 0.74);
  } else if (gesture === 'greeting') {
    weight = Math.max(weight, 0.70);
  }

  // Prosodic stress on clause-initial attack and clause-final intonation rise/fall
  if (idx === 0 || /[:;—]/.test(raw)) {
    weight = Math.min(1.0, weight + 0.14);
  } else if (idx === totalWords - 1 || /[,."]/.test(raw)) {
    weight = Math.min(1.0, weight + 0.10);
  }

  // Longer polysyllabic French words carry higher tonic accent on their final syllable
  const cleanLen = raw.replace(/[^a-zA-Zà-ÿ]/g, '').length;
  if (cleanLen >= 8) {
    weight = Math.min(1.0, weight + 0.12);
  }

  return Math.max(0.20, Math.min(1.0, weight));
}

let currentBoundaries: PreparedWordBoundary[] = [];
let activeSentenceEmotion: AvatarEmotion = 'pedagogical';
let activeEmotionalTags: TtsEmotionalTag[] = [];

export function loadAvatarSentencePhonemes(
  sentence: string,
  wordBoundaries: WorkerWordBoundary[],
  emotionOverride?: AvatarEmotion,
  emotionalTags?: TtsEmotionalTag[]
) {
  activeSentenceEmotion = emotionOverride || detectSentenceEmotion(sentence);
  const rawList = Array.isArray(wordBoundaries) ? wordBoundaries : [];
  const sentStr = sentence || '';
  activeEmotionalTags =
    Array.isArray(emotionalTags) && emotionalTags.length > 0
      ? reanchorEmotionalTagsToBoundaries(
          emotionalTags,
          rawList,
          sentStr,
          activeSentenceEmotion
        )
      : extractTtsEmotionalTags(sentStr, rawList, activeSentenceEmotion);
  const initial: PreparedWordBoundary[] = rawList.map((wb, i) => {
    const snippet =
      typeof wb.charIndex === 'number' && wb.charIndex >= 0
        ? sentStr.slice(wb.charIndex, wb.charIndex + (wb.text || '').length + 4)
        : '';
    const wordWithPunct = snippet ? `${wb.text}${snippet.replace(/[^.,;:!?—]/g, '')}` : wb.text;
    const hg = classifyWordHeadGesture(wordWithPunct);
    return {
      ...wb,
      tokens: tokenizeFrenchWordPhonemes(wb.text),
      headGesture: hg,
      intonationWeight: computeWordIntonationWeight(
        wordWithPunct,
        hg,
        activeSentenceEmotion,
        i,
        rawList.length
      ),
      gestureSpanStartMs: wb.offsetMs,
      gestureSpanEndMs: wb.offsetMs + Math.max(450, wb.durationMs),
    };
  });

  // Coarticulate head gestures across adjacent words (e.g., "ne ... pas", "sans aucun", "tout à fait")
  // so head shakes ("Non") and nods ("Oui") span a natural 550ms–1100ms phrase window!
  for (let i = 0; i < initial.length; i++) {
    const g = initial[i].headGesture;
    if (g !== 'neutral') {
      const next = initial[i + 1];
      if (next && next.headGesture === 'neutral' && next.offsetMs - (initial[i].offsetMs + initial[i].durationMs) <= 120) {
        next.headGesture = g;
      }
    }
  }

  // Compute contiguous span start/end timestamps for each multi-word gesture group
  let idx = 0;
  while (idx < initial.length) {
    const g = initial[idx].headGesture;
    if (g === 'neutral') {
      idx++;
      continue;
    }
    let endIdx = idx;
    while (
      endIdx + 1 < initial.length &&
      initial[endIdx + 1].headGesture === g &&
      initial[endIdx + 1].offsetMs - (initial[endIdx].offsetMs + initial[endIdx].durationMs) <= 180
    ) {
      endIdx++;
    }
    const spanStart = initial[idx].offsetMs;
    const rawEnd = initial[endIdx].offsetMs + initial[endIdx].durationMs;
    const spanEnd = Math.max(spanStart + 520, rawEnd);
    for (let k = idx; k <= endIdx; k++) {
      initial[k].gestureSpanStartMs = spanStart;
      initial[k].gestureSpanEndMs = spanEnd;
    }
    idx = endIdx + 1;
  }

  currentBoundaries = initial;
}

export function clearAvatarSentencePhonemes() {
  currentBoundaries = [];
  activeEmotionalTags = [];
}

interface SampledHeadGestureState {
  gesture: HeadGestureType;
  phase: number; // 0.0 .. 1.0 normalized progress through the active head gesture span
  intonation: number; // 0.0 .. 1.0 prosodic intonation / astonishment level at this instant
}

function sampleHeadGestureAtTime(
  timeMs: number,
  sentenceEmotion: AvatarEmotion
): SampledHeadGestureState {
  const n = currentBoundaries.length;
  let sampledIntonation =
    sentenceEmotion === 'astonished'
      ? 0.85
      : sentenceEmotion === 'enthusiastic' || sentenceEmotion === 'curious'
      ? 0.62
      : 0.42;

  if (n > 0 && timeMs > 0) {
    for (let i = 0; i < n; i++) {
      const wb = currentBoundaries[i];
      if (timeMs >= wb.offsetMs - 40 && timeMs <= wb.offsetMs + wb.durationMs + 60) {
        const wProg = Math.max(0, Math.min(1, (timeMs - wb.offsetMs) / Math.max(80, wb.durationMs)));
        // French tonic accent peaks in the second half of the word (0.35 .. 0.85)
        const tonicArch = 0.72 + 0.28 * Math.sin(wProg * Math.PI);
        sampledIntonation = Math.max(sampledIntonation, wb.intonationWeight * tonicArch);
      }
      if (
        wb.headGesture !== 'neutral' &&
        timeMs >= wb.gestureSpanStartMs - 40 &&
        timeMs <= wb.gestureSpanEndMs + 60
      ) {
        const span = Math.max(450, wb.gestureSpanEndMs - wb.gestureSpanStartMs);
        const phase = Math.max(0, Math.min(1, (timeMs - wb.gestureSpanStartMs) / span));
        return {
          gesture: wb.headGesture,
          phase,
          intonation: Math.max(sampledIntonation, wb.intonationWeight),
        };
      }
    }
  }

  // Fallback to sentence-level emotion gesture when between specific keywords
  const continuousPhase = (timeMs > 0 ? timeMs : 0) / 900;
  if (sentenceEmotion === 'astonished') {
    return { gesture: 'astonishment', phase: continuousPhase % 1, intonation: 0.88 };
  }
  if (sentenceEmotion === 'refusal') {
    return { gesture: 'refusal', phase: continuousPhase % 1, intonation: sampledIntonation };
  }
  if (sentenceEmotion === 'acceptance' || sentenceEmotion === 'encouraging') {
    return { gesture: 'acceptance', phase: continuousPhase % 1, intonation: sampledIntonation };
  }
  if (sentenceEmotion === 'curious') {
    return { gesture: 'questioning', phase: continuousPhase % 1, intonation: Math.max(0.68, sampledIntonation) };
  }
  if (sentenceEmotion === 'empathetic') {
    return { gesture: 'empathy', phase: continuousPhase % 1, intonation: sampledIntonation };
  }
  if (sentenceEmotion === 'enthusiastic' || sentenceEmotion === 'smiling') {
    return { gesture: 'greeting', phase: continuousPhase % 1, intonation: Math.max(0.68, sampledIntonation) };
  }
  if (sentenceEmotion === 'solemn') {
    return { gesture: 'emphasis', phase: continuousPhase % 1, intonation: Math.max(0.62, sampledIntonation) };
  }
  return { gesture: 'neutral', phase: continuousPhase % 1, intonation: sampledIntonation };
}

interface SampledArticulatoryTarget {
  openness: number;
  roundness: number;
  spread: number;
  upperLipLift: number;
  tongueLift: number;
  viseme: WorkerViseme;
  isPause: boolean;
  isBilabialClosure: boolean;
  isLabiodental: boolean;
}

function samplePhonemeAtTime(timeMs: number): SampledArticulatoryTarget | null {
  const n = currentBoundaries.length;
  if (n === 0) return null;

  let lo = 0;
  let hi = n - 1;
  let matchedIdx = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const wb = currentBoundaries[mid];
    if (timeMs < wb.offsetMs) {
      hi = mid - 1;
    } else if (timeMs > wb.offsetMs + wb.durationMs) {
      lo = mid + 1;
    } else {
      matchedIdx = mid;
      break;
    }
  }

  // Between words: smooth French liaison & short inter-word transition (< 220ms) vs true breathing pause (>= 220ms)
  if (matchedIdx === -1) {
    const prevWb = hi >= 0 && hi < n ? currentBoundaries[hi] : null;
    const nextWb = lo >= 0 && lo < n ? currentBoundaries[lo] : null;
    if (prevWb && nextWb) {
      const gapMs = nextWb.offsetMs - (prevWb.offsetMs + prevWb.durationMs);
      const prevLastToken = prevWb.tokens[prevWb.tokens.length - 1];
      const nextFirstToken = nextWb.tokens[0];
      if (gapMs < 220 && nextFirstToken) {
        const elapsedInGap = Math.max(0, timeMs - (prevWb.offsetMs + prevWb.durationMs));
        const tGap = Math.min(1, elapsedInGap / Math.max(20, gapMs));
        const blend = 0.5 - 0.5 * Math.cos(tGap * Math.PI);
        const pOpen = prevLastToken ? Math.max(0.16, prevLastToken.openness * 0.55) : 0.18;
        const nOpen = nextFirstToken.isBilabialClosure
          ? 0.04
          : Math.max(0.16, nextFirstToken.openness * 0.55);
        return {
          openness: pOpen * (1 - blend) + nOpen * blend,
          roundness: (prevLastToken ? prevLastToken.roundness : 0) * (1 - blend) + nextFirstToken.roundness * blend,
          spread: (prevLastToken ? prevLastToken.spread : 0.15) * (1 - blend) + nextFirstToken.spread * blend,
          upperLipLift: nextFirstToken.isBilabialClosure ? -0.45 * blend : 0.12,
          tongueLift: nextFirstToken.tongueLift * 0.45,
          viseme: nextFirstToken.isBilabialClosure && blend > 0.6 ? 'closed' : 'narrow',
          isPause: false,
          isBilabialClosure: Boolean(nextFirstToken.isBilabialClosure && blend > 0.65),
          isLabiodental: Boolean(nextFirstToken.isLabiodental && blend > 0.65),
        };
      }
    }
    return {
      openness: 0.10,
      roundness: 0.0,
      spread: 0.15,
      upperLipLift: -0.25,
      tongueLift: 0.0,
      viseme: 'closed',
      isPause: true,
      isBilabialClosure: false,
      isLabiodental: false,
    };
  }

  const matched = currentBoundaries[matchedIdx];
  const wordDuration = Math.max(80, matched.durationMs);
  const wordElapsed = timeMs - matched.offsetMs;
  const wordRatio = Math.max(0, Math.min(0.999, wordElapsed / wordDuration));

  const tokens = matched.tokens;
  let activeIdx = tokens.length - 1;
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (wordRatio >= tk.startRatio && wordRatio <= tk.endRatio) {
      activeIdx = i;
      break;
    }
  }

  const activeToken = tokens[activeIdx];
  if (!activeToken) {
    return {
      openness: 0.58,
      roundness: 0.1,
      spread: 0.2,
      upperLipLift: 0.3,
      tongueLift: 0.0,
      viseme: 'open',
      isPause: false,
      isBilabialClosure: false,
      isLabiodental: false,
    };
  }

  const prevToken = activeIdx > 0 ? tokens[activeIdx - 1] : null;
  const nextToken = activeIdx + 1 < tokens.length ? tokens[activeIdx + 1] : null;
  const neighborVowelOpen = Math.max(
    prevToken && prevToken.openness > 0.35 ? prevToken.openness : 0,
    nextToken && nextToken.openness > 0.35 ? nextToken.openness : 0,
    0.62
  );

  // 1. True Bilabial Closure (M, B, P): complete natural lip contact covering teeth
  if (activeToken.isBilabialClosure) {
    return {
      openness: 0.0,
      roundness: activeToken.roundness,
      spread: activeToken.spread,
      upperLipLift: -0.85,
      tongueLift: 0.0,
      viseme: 'closed',
      isPause: false,
      isBilabialClosure: true,
      isLabiodental: false,
    };
  }

  // 2. Labiodental (F, V): lower lip rises to touch bottom of upper incisors
  if (activeToken.isLabiodental) {
    return {
      openness: 0.06,
      roundness: activeToken.roundness,
      spread: activeToken.spread,
      upperLipLift: 0.20,
      tongueLift: 0.0,
      viseme: 'narrow',
      isPause: false,
      isBilabialClosure: false,
      isLabiodental: true,
    };
  }

  // 3. Lingual / Dental / Alveolar / Sibilant / Velar Consonants (T, D, L, N, S, Z, R, K, G, C, CH, J):
  // Preserve crisp consonant constriction (0.10..0.20) so the jaw and lips visibly narrow between vowels!
  if (activeToken.openness <= 0.30) {
    const consOpen = Math.min(0.22, Math.max(0.08, activeToken.openness));
    return {
      openness: consOpen,
      roundness:
        activeToken.roundness > 0.4
          ? activeToken.roundness
          : nextToken
          ? nextToken.roundness * 0.55
          : 0.1,
      spread:
        activeToken.spread > 0.3
          ? activeToken.spread
          : nextToken
          ? nextToken.spread * 0.55
          : 0.2,
      upperLipLift: activeToken.upperLipLift,
      tongueLift: activeToken.tongueLift,
      viseme: activeToken.viseme,
      isPause: false,
      isBilabialClosure: false,
      isLabiodental: false,
    };
  }

  // 4. Vowel Nucleus: high-contrast syllabic arch (0.20 at edges -> 1.00 at peak -> 0.20)
  // so every syllable inside multi-syllable words clearly opens and closes the mouth!
  const tokenSpan = Math.max(0.05, activeToken.endRatio - activeToken.startRatio);
  const tokenLocal = Math.max(0, Math.min(1, (wordRatio - activeToken.startRatio) / tokenSpan));
  const vowelArch = 0.20 + 0.84 * Math.sin(tokenLocal * Math.PI);

  return {
    openness: Math.min(0.98, activeToken.openness * vowelArch),
    roundness: activeToken.roundness,
    spread: activeToken.spread,
    upperLipLift: activeToken.upperLipLift,
    tongueLift: activeToken.tongueLift,
    viseme: activeToken.viseme,
    isPause: false,
    isBilabialClosure: false,
    isLabiodental: false,
  };
}

// Crisp Coarticulation Window (-12ms, 0ms, +14ms)
// Preserves consonant closures and constrictions while keeping vowel peaks at full amplitude.
function lookupCoarticulatedPhoneme(streamElapsedMs: number): SampledArticulatoryTarget | null {
  const curr = samplePhonemeAtTime(streamElapsedMs);
  if (!curr) return null;
  if (curr.isPause || curr.isBilabialClosure || curr.isLabiodental || curr.openness <= 0.24) {
    return curr;
  }

  const prev = samplePhonemeAtTime(Math.max(0, streamElapsedMs - 12));
  const ahead = samplePhonemeAtTime(streamElapsedMs + 14);

  const p = prev && !prev.isPause ? prev : curr;
  const a = ahead && !ahead.isPause ? ahead : curr;

  return {
    openness: Math.max(
      curr.openness * 0.94,
      p.openness * 0.10 + curr.openness * 0.80 + a.openness * 0.10
    ),
    roundness: p.roundness * 0.15 + curr.roundness * 0.70 + a.roundness * 0.15,
    spread: p.spread * 0.15 + curr.spread * 0.70 + a.spread * 0.15,
    upperLipLift: p.upperLipLift * 0.14 + curr.upperLipLift * 0.72 + a.upperLipLift * 0.14,
    tongueLift: p.tongueLift * 0.14 + curr.tongueLift * 0.72 + a.tongueLift * 0.14,
    viseme: curr.viseme,
    isPause: false,
    isBilabialClosure: false,
    isLabiodental: curr.isLabiodental,
  };
}

function computeBlinkAndWink(
  nowMs: number,
  isSpeaking: boolean,
  emotion: AvatarEmotion
): {
  targetBlinkLeft: number;
  targetBlinkRight: number;
} {
  const cycleA = nowMs % 3800;
  const cycleB = (nowMs + 1800) % 7600;

  let bilateralBlink = 0;
  if (cycleA < 190) {
    bilateralBlink =
      cycleA < 85
        ? Math.sin((cycleA / 85) * (Math.PI / 2))
        : Math.cos(((cycleA - 85) / 105) * (Math.PI / 2));
  } else if (cycleB < 170) {
    bilateralBlink =
      cycleB < 75
        ? Math.sin((cycleB / 75) * (Math.PI / 2))
        : Math.cos(((cycleB - 75) / 95) * (Math.PI / 2));
  }

  const winkPeriod =
    emotion === 'enthusiastic' || emotion === 'encouraging' ? 6400 : isSpeaking ? 7400 : 9600;
  const winkPhase = (nowMs + 2300) % winkPeriod;
  let leftWink = 0;
  let rightWinkCompanion = 0;

  if (emotion !== 'solemn' && winkPhase < 260) {
    const w =
      winkPhase < 110
        ? Math.sin((winkPhase / 110) * (Math.PI / 2))
        : Math.cos(((winkPhase - 110) / 150) * (Math.PI / 2));
    leftWink = w;
    rightWinkCompanion = w * 0.16;
  }

  return {
    targetBlinkLeft: Math.min(1, Math.max(bilateralBlink, leftWink)),
    targetBlinkRight: Math.min(1, Math.max(bilateralBlink, rightWinkCompanion)),
  };
}

export function stepAvatarExpressionFrame(
  nowMs: number,
  streamElapsedMs: number,
  acousticRms: number,
  isSpeaking: boolean,
  fallbackOpen: number,
  fallbackViseme: WorkerViseme,
  isPauseHint: boolean,
  emotionOverride?: AvatarEmotion
): AvatarComputedFrame {
  const emotion: AvatarEmotion = emotionOverride || activeSentenceEmotion || 'pedagogical';
  const dtMs = pose.lastNowMs > 0 ? Math.min(40, Math.max(8, nowMs - pose.lastNowMs)) : 16.67;
  pose.lastNowMs = nowMs;
  const dtScale = dtMs / 16.67;

  // Low-pass filter the 200Hz acoustic RMS envelope so 5ms unvoiced consonant dips (t, k, s)
  // never cause the lips to flutter/stammer ("balbutier") mid-word!
  const rawRms = Math.max(0, acousticRms);
  const rmsRate = rawRms > pose.smoothRms ? Math.min(0.42, 0.30 * dtScale) : Math.min(0.18, 0.12 * dtScale);
  pose.smoothRms += (rawRms - pose.smoothRms) * rmsRate;

  const REST_OPEN = 0.04;
  let targetOpen = REST_OPEN;
  let targetRoundness = 0.0;
  let targetSpread = 0.18;
  let targetUpperLipLift = 0.0;
  let targetTongueLift = 0.0;
  let viseme: WorkerViseme = 'closed';

  // Natural 4.3 Hz French syllabic articulation wave (alternating between consonant closures 0.0 and vowel peaks 1.0)
  const rawSyllableOsc =
    Math.sin(nowMs * 0.0265) * 0.55 +
    Math.sin(nowMs * 0.0172) * 0.32 +
    Math.cos(nowMs * 0.0410) * 0.22;
  const livelySyllablePulse = Math.max(0, Math.min(1, (rawSyllableOsc + 0.22) / 0.95));

  if (isSpeaking) {
    const coart = streamElapsedMs > 0 ? lookupCoarticulatedPhoneme(streamElapsedMs) : null;

    if (coart) {
      targetRoundness = coart.roundness;
      targetSpread = coart.spread;
      targetUpperLipLift = coart.upperLipLift;
      targetTongueLift = coart.tongueLift;

      // 1. Acoustic silence or inter-word pause -> close lips immediately when voice drops
      if (
        coart.isPause ||
        isPauseHint ||
        (streamElapsedMs > 0 && rawRms > 0.001 && rawRms < 0.020 && pose.smoothRms < 0.024)
      ) {
        targetOpen = 0.0;
        targetRoundness = 0.05;
        targetSpread = 0.05;
        targetUpperLipLift = -0.75;
        viseme = 'closed';
      } else if (coart.isBilabialClosure) {
        // 2. True bilabial consonant (M, B, P): ALWAYS press upper & lower lips together!
        targetOpen = 0.0;
        targetUpperLipLift = -0.95;
        viseme = 'closed';
      } else if (coart.isLabiodental) {
        // 3. Labiodental consonant (F, V): lower lip touches upper incisors
        targetOpen = 0.04;
        targetUpperLipLift = 0.25;
        viseme = 'narrow';
      } else if (coart.openness <= 0.24) {
        // 4. Dental, alveolar, sibilant, postalveolar & velar consonants (T, D, S, Z, L, N, CH, J, R, K):
        // Distinct consonant constriction between vowels so every syllable articulates!
        targetOpen = Math.min(0.16, coart.openness);
        viseme = coart.viseme;
      } else {
        // 5. Vowel nucleus: directly locked to real instantaneous voice energy (zero drift!)
        const instantVoice = Math.max(rawRms, pose.smoothRms);
        const envFactor =
          instantVoice > 0.018
            ? 0.38 + Math.min(0.72, Math.pow(instantVoice, 0.45) * 0.95)
            : 0.78 + livelySyllablePulse * 0.22;
        targetOpen = Math.min(1.0, Math.max(0.28, coart.openness * envFactor));
        viseme = coart.viseme;
      }
    } else {
      // Lively French syllabic speech articulation when speaking in fallback / muted film mode
      const phrasePause = Math.sin(nowMs * 0.0038) < -0.84;
      if (isPauseHint || phrasePause || (pose.smoothRms > 0 && pose.smoothRms < 0.015)) {
        targetOpen = 0.0;
        targetRoundness = 0.05;
        targetSpread = 0.05;
        targetUpperLipLift = -0.80;
        viseme = 'closed';
      } else {
        const baseEnergy =
          pose.smoothRms > 0.018
            ? Math.min(1.0, 0.55 + Math.pow(pose.smoothRms, 0.45) * 0.52)
            : Math.max(0.86, fallbackOpen);
        // Cycle through natural French visemes (bilabial closure -> open 'A' -> round 'O/OU' -> narrow 'T/S' -> wide 'É/I')
        const syllablePhase = Math.floor(nowMs / 155) % 6;
        if (livelySyllablePulse < 0.18 || syllablePhase === 0) {
          targetOpen = 0.0;
          targetRoundness = 0.12;
          targetSpread = 0.0;
          targetUpperLipLift = -0.90;
          viseme = 'closed';
        } else if (syllablePhase === 2) {
          targetOpen = Math.min(0.84, Math.max(0.52, baseEnergy * (0.55 + livelySyllablePulse * 0.45)));
          targetRoundness = 0.90;
          targetSpread = 0.0;
          targetUpperLipLift = -0.42;
          viseme = 'round';
        } else if (syllablePhase === 3) {
          targetOpen = 0.09;
          targetRoundness = 0.0;
          targetSpread = 0.28;
          targetUpperLipLift = 0.25;
          targetTongueLift = 0.95;
          viseme = 'narrow';
        } else if (syllablePhase === 4) {
          targetOpen = Math.min(0.88, Math.max(0.56, baseEnergy * (0.58 + livelySyllablePulse * 0.42)));
          targetRoundness = 0.0;
          targetSpread = 0.84;
          targetUpperLipLift = 0.68;
          targetTongueLift = 0.45;
          viseme = 'wide';
        } else {
          targetOpen = Math.min(0.98, Math.max(0.64, baseEnergy * (0.62 + livelySyllablePulse * 0.38)));
          targetRoundness = 0.08;
          targetSpread = 0.25;
          targetUpperLipLift = 0.72;
          targetTongueLift = 0.20;
          viseme = 'open';
        }
      }
    }
  }

  // ============================================================================
  // STATE-SPACE KALMAN FILTER ARTICULATORY TRACKING (Zero-Lag Voice Lock)
  // ============================================================================
  const dtSec = dtMs / 1000.0;
  pose.rawOpen = targetOpen;
  pose.open = avatarKalmanSmoother.mouthOpen.update(targetOpen, dtSec);
  if (!isSpeaking && Math.abs(pose.open - REST_OPEN) < 0.004) {
    pose.open = REST_OPEN;
  }

  pose.roundness = Math.max(0, Math.min(1, avatarKalmanSmoother.mouthRound.update(targetRoundness, dtSec)));
  pose.spread = Math.max(0, Math.min(1, avatarKalmanSmoother.mouthSpread.update(targetSpread, dtSec)));
  const lipRate = Math.min(0.56, 0.44 * dtScale);
  pose.upperLipLift += (targetUpperLipLift - pose.upperLipLift) * lipRate;
  pose.tongueLift = Math.max(0, Math.min(1, avatarKalmanSmoother.tongueLift.update(targetTongueLift, dtSec)));

  const targetWidth = 1.0 - pose.roundness * 0.11 + pose.spread * 0.042;
  pose.widthFactor += (targetWidth - pose.widthFactor) * lipRate;

  const { targetBlinkLeft, targetBlinkRight } = computeBlinkAndWink(nowMs, isSpeaking, emotion);
  pose.blinkLeft += (targetBlinkLeft - pose.blinkLeft) * 0.45;
  pose.blinkRight += (targetBlinkRight - pose.blinkRight) * 0.45;

  // ============================================================================
  // ULTRA-FLUID, C²-CONTINUOUS 3D HEAD & PROSODIC INTONATION KINEMATICS
  // - Driven by semantic gestures + vocal intonation / astonishment ('étonnement')
  // - Smoothly ramped gesture weights + continuous time-domain sine waves
  // - Active bilateral movement even when looking at the user (idle / listening / speaking)
  // ============================================================================
  const activeHeadGesture = sampleHeadGestureAtTime(
    streamElapsedMs > 0 ? streamElapsedMs : nowMs,
    emotion
  );
  const gType = isSpeaking
    ? activeHeadGesture.gesture
    : emotion === 'astonished'
    ? 'astonishment'
    : emotion === 'curious'
    ? 'questioning'
    : emotion === 'empathetic'
    ? 'empathy'
    : 'neutral';

  // Combine word-level prosodic intonation with real-time acoustic RMS voice energy
  const acousticIntonationBoost =
    pose.smoothRms > 0.02 ? Math.min(0.42, Math.pow(pose.smoothRms, 0.5) * 0.55) : 0;
  const targetIntonation = isSpeaking
    ? Math.min(
        1.0,
        activeHeadGesture.intonation * (0.78 + 0.22 * livelySyllablePulse) + acousticIntonationBoost
      )
    : emotion === 'astonished'
    ? 0.72 + Math.sin(nowMs * 0.0022) * 0.14
    : emotion === 'curious' || emotion === 'enthusiastic'
    ? 0.42 + Math.sin(nowMs * 0.0016) * 0.12
    : 0.24 + Math.sin(nowMs * 0.0012) * 0.08;

  pose.intonation += (targetIntonation - pose.intonation) * Math.min(0.22, 0.15 * dtScale);

  // Modulate mouth opening & oval shaping when vocal intonation or astonishment is high
  if (isSpeaking && pose.open > REST_OPEN + 0.04 && pose.intonation > 0.55) {
    const intonBoost = (pose.intonation - 0.55) * 0.26;
    pose.open = Math.min(1.0, pose.open + intonBoost);
    if (gType === 'astonishment' || emotion === 'astonished') {
      pose.roundness = Math.min(0.68, Math.max(pose.roundness, (pose.intonation - 0.4) * 0.65));
    }
  }

  const wRate = Math.min(0.14, 0.08 * dtScale);
  pose.wRefusal += ((gType === 'refusal' ? 1 : 0) - pose.wRefusal) * wRate;
  pose.wAcceptance += ((gType === 'acceptance' ? 1 : 0) - pose.wAcceptance) * wRate;
  pose.wQuestion += ((gType === 'questioning' ? 1 : 0) - pose.wQuestion) * wRate;
  pose.wAstonishment += ((gType === 'astonishment' ? 1 : 0) - pose.wAstonishment) * wRate;
  pose.wEmpathy += ((gType === 'empathy' ? 1 : 0) - pose.wEmpathy) * wRate;
  pose.wGreeting += ((gType === 'greeting' ? 1 : 0) - pose.wGreeting) * wRate;
  pose.wEmphasis += ((gType === 'emphasis' ? 1 : 0) - pose.wEmphasis) * wRate;

  // Continuous, infinitely differentiable sinusoidal waves (zero cusps, zero phase jumps)
  const refusalWave = Math.sin(nowMs * 0.0046);
  const acceptanceWave = 0.5 - 0.5 * Math.cos(nowMs * 0.0050);
  const greetingWave = Math.sin(nowMs * 0.0034);
  const emphasisWave = 0.5 - 0.5 * Math.cos(nowMs * 0.0042);
  const astonishmentWave = Math.sin(nowMs * 0.0038);
  const intonationAccentWave = Math.sin(nowMs * 0.0030);

  // ============================================================================
  // ACTIVE LISTENING ("MOUVEMENT D'ÉCOUTE") & CONVERSATIONAL HEAD KINEMATICS:
  // - When listening (!isSpeaking): rhythmic, attentive nods of comprehension
  //   ("Oui, je vous écoute"), warm feminine lateral head tilt (±3.8°..4.8°),
  //   and natural 3D conversational turns (±5.2px) so the head movement is clearly felt!
  // - When speaking (isSpeaking): lively prosodic nods, expressive feminine tilts
  //   (±4.5°..5.6°), and 3D turns (±7.5px) synchronized with vocal intonation.
  // ============================================================================
  const listeningNodCycle = Math.max(0, Math.sin(nowMs * 0.0026));
  const listeningAckPulse = Math.pow(listeningNodCycle, 2) * 5.6 + Math.sin(nowMs * 0.0017) * 2.4;
  const listeningTiltWave =
    Math.sin(nowMs * 0.00145) * 3.2 +
    Math.cos(nowMs * 0.00095) * 1.6;
  const listeningTurnWave =
    Math.sin(nowMs * 0.00125) * 4.6 +
    Math.cos(nowMs * 0.00195) * 2.2;

  const voiceActivityBoost = isSpeaking
    ? Math.min(1.28, 0.58 + Math.pow(Math.max(0, pose.smoothRms), 0.48) * 0.98)
    : 1.0;

  const speakingCadenceTilt =
    (Math.sin(nowMs * 0.00175) * 3.1 + Math.cos(nowMs * 0.00110) * 1.65) * voiceActivityBoost;
  const speakingCadenceTurn =
    (Math.sin(nowMs * 0.00145) * 5.6 + Math.cos(nowMs * 0.00225) * 2.8) * voiceActivityBoost;
  // Direct prosodic nod impulse locked to VivienneMultilingualNeural's real voice syllable energy
  // and smooth breath lift during comma/inter-sentence pauses
  const isBreathPause = isSpeaking && (isPauseHint || (pose.smoothRms < 0.022 && pose.open <= 0.05));
  const voiceSyllableNod = isBreathPause
    ? -1.25
    : pose.smoothRms * 5.2 + Math.max(0, pose.open - 0.10) * 3.8;
  const speakingCadenceNod =
    Math.sin(nowMs * 0.00255) * 3.6 +
    Math.cos(nowMs * 0.00165) * 2.0 +
    voiceSyllableNod;

  const gestureTurn =
    pose.wRefusal * (refusalWave * 8.8) +
    pose.wGreeting * (greetingWave * 5.2) +
    pose.wQuestion * (Math.sin(nowMs * 0.0026) * 4.6) +
    pose.wEmphasis * (Math.sin(nowMs * 0.0032) * 5.0) +
    pose.wEmpathy * (Math.cos(nowMs * 0.0020) * 4.2) +
    (isSpeaking ? (pose.intonation - 0.20) * intonationAccentWave * 5.8 : 0);

  const gestureNod =
    pose.wAcceptance * (acceptanceWave * 7.8) -
    pose.wQuestion * 3.4 -
    pose.wAstonishment * (3.8 + Math.abs(astonishmentWave) * 2.6) +
    pose.wEmpathy * (3.4 + Math.sin(nowMs * 0.0029) * 3.0) +
    pose.wGreeting * (greetingWave * 5.5) +
    pose.wEmphasis * (emphasisWave * 6.4) -
    pose.wRefusal * 1.0 +
    (isSpeaking
      ? -Math.max(0, pose.intonation - 0.28) * 5.2 * Math.cos(nowMs * 0.0040)
      : listeningAckPulse * 0.55);

  // Expressive Feminine Head Inclination ('tilt' in degrees, clearly perceptible up to ±5.6°):
  const gestureTilt =
    pose.wEmpathy * (2.6 + Math.sin(nowMs * 0.0020) * 1.5) +
    pose.wQuestion * (-3.2 + Math.cos(nowMs * 0.0023) * 1.4) +
    pose.wGreeting * (2.4 * Math.sin(nowMs * 0.0028) + 1.5) +
    pose.wAcceptance * (2.0 * Math.sin(nowMs * 0.0034)) +
    pose.wEmphasis * (2.2 * Math.cos(nowMs * 0.0030)) +
    (emotion === 'smiling' || emotion === 'enthusiastic'
      ? 2.0 + Math.sin(nowMs * 0.0019) * 1.5
      : emotion === 'empathetic' || emotion === 'encouraging'
      ? 2.4 + Math.cos(nowMs * 0.0017) * 1.4
      : emotion === 'curious'
      ? -2.6 + Math.sin(nowMs * 0.0019) * 1.2
      : 0);

  const baseTilt = isSpeaking ? speakingCadenceTilt : listeningTiltWave;
  const baseNod = isSpeaking ? speakingCadenceNod : listeningAckPulse;
  const baseTurn = isSpeaking ? speakingCadenceTurn : listeningTurnWave;

  // Evaluate TTS Emotional Tag Micro-Gestures (haussements d'épaules, hochements de tête affirmatifs, etc.)
  const microGesture = evaluateMicroGestureTimeline(
    streamElapsedMs,
    nowMs,
    isSpeaking,
    emotion,
    activeEmotionalTags
  );

  const targetTilt = Math.max(
    -5.6,
    Math.min(5.6, baseTilt + gestureTilt + microGesture.tiltOffsetDeg)
  );
  const targetNod = Math.max(
    -8.5,
    Math.min(10.2, baseNod + gestureNod + microGesture.nodOffsetPx)
  );
  const targetTurn = Math.max(
    -9.2,
    Math.min(9.2, baseTurn + gestureTurn + microGesture.turnOffsetPx)
  );

  // State-Space Kalman Temporal Smoothing for 3D Head Kinematics (eliminates all saccades & jitter)
  pose.tilt = avatarKalmanSmoother.headTilt.update(targetTilt, dtSec);
  pose.nod = avatarKalmanSmoother.headNod.update(targetNod, dtSec);
  pose.turn = avatarKalmanSmoother.headTurn.update(targetTurn, dtSec);
  pose.midTilt = pose.tilt;
  pose.midNod = pose.nod;
  pose.midTurn = pose.turn;

  // Cohesive head & hair state
  pose.hairLagTurn = pose.turn;
  pose.hairLagNod = pose.nod;

  // Expressive bilateral eyebrow arch synchronized with speech intonation, astonishment, questions, and micro-gestures
  const targetBrow = isSpeaking
    ? Math.min(
        1.0,
        0.22 +
          Math.max(0, pose.open - 0.14) * 0.48 +
          pose.intonation * 0.52 +
          microGesture.browBoost +
          pose.wAstonishment * 0.65 +
          pose.wQuestion * 0.42 +
          pose.wEmphasis * 0.44 +
          pose.wAcceptance * 0.28 +
          (emotion === 'astonished'
            ? 0.45
            : emotion === 'enthusiastic'
            ? 0.26
            : emotion === 'curious'
            ? 0.35
            : 0)
      )
    : (emotion === 'astonished' ? 0.68 : emotion === 'curious' ? 0.38 : 0.22) +
      microGesture.browBoost +
      Math.sin(nowMs * 0.0011) * 0.14 +
      Math.cos(nowMs * 0.0007) * 0.08;
  pose.eyebrowLift = avatarKalmanSmoother.eyebrowLift.update(targetBrow, dtSec);

  // Inner eyebrow furrow ('browFurrow') for Precision & Critical Analysis
  const targetBrowFurrow = isSpeaking
    ? Math.min(
        1.0,
        pose.wQuestion * 0.88 +
          pose.wRefusal * 0.48 +
          microGesture.furrowBoost +
          (emotion === 'curious' ? 0.65 : emotion === 'solemn' ? 0.38 : 0)
      )
    : (emotion === 'curious' ? 0.68 : emotion === 'solemn' ? 0.28 : 0.0) +
      microGesture.furrowBoost;
  pose.browFurrow = avatarKalmanSmoother.browFurrow.update(targetBrowFurrow, dtSec);

  // Compute the 6 Upright Facial & Hand-Speaking Postures inspired by planche_parole_mains.png (Visage droit et non incliné)
  let bodyLanguagePosture: BodyLanguagePostureId = 'serene_clasped';
  if (!isSpeaking) {
    bodyLanguagePosture =
      emotion === 'curious'
        ? 'chin_reflection'
        : emotion === 'astonished'
        ? 'astonished_chest_hands'
        : emotion === 'enthusiastic' || emotion === 'smiling'
        ? 'welcome_open_palm'
        : emotion === 'empathetic' || emotion === 'encouraging'
        ? 'heart_encouragement'
        : 'serene_clasped';
  } else if (pose.open <= 0.03 && isPauseHint) {
    bodyLanguagePosture = 'welcome_open_palm';
  } else if (gType === 'greeting' || emotion === 'enthusiastic' || emotion === 'smiling') {
    bodyLanguagePosture = 'welcome_open_palm';
  } else if (gType === 'questioning' || emotion === 'curious') {
    bodyLanguagePosture = 'chin_reflection';
  } else if (
    gType === 'astonishment' ||
    gType === 'refusal' ||
    emotion === 'astonished' ||
    emotion === 'refusal'
  ) {
    bodyLanguagePosture = 'astonished_chest_hands';
  } else if (
    gType === 'empathy' ||
    gType === 'acceptance' ||
    emotion === 'empathetic' ||
    emotion === 'encouraging' ||
    emotion === 'acceptance'
  ) {
    bodyLanguagePosture = 'heart_encouragement';
  } else if (emotion === 'solemn' && gType !== 'emphasis') {
    bodyLanguagePosture = 'serene_clasped';
  } else {
    bodyLanguagePosture = 'teaching_gesture';
  }

  const pRate = Math.min(0.14, 0.09 * dtScale);
  pose.pWelcome += ((bodyLanguagePosture === 'welcome_open_palm' ? 1 : 0) - pose.pWelcome) * pRate;
  pose.pReflection += ((bodyLanguagePosture === 'chin_reflection' ? 1 : 0) - pose.pReflection) * pRate;
  pose.pAstonished += ((bodyLanguagePosture === 'astonished_chest_hands' ? 1 : 0) - pose.pAstonished) * pRate;
  pose.pSerene += ((bodyLanguagePosture === 'serene_clasped' ? 1 : 0) - pose.pSerene) * pRate;
  pose.pTeaching += ((bodyLanguagePosture === 'teaching_gesture' ? 1 : 0) - pose.pTeaching) * pRate;
  pose.pEncouragement += ((bodyLanguagePosture === 'heart_encouragement' ? 1 : 0) - pose.pEncouragement) * pRate;

  const BODY_LANGUAGE_LABELS: Record<BodyLanguagePostureId, string> = {
    welcome_open_palm: '🌸 Port de tête féminin • Sourire & Accueil',
    chin_reflection: '💫 Inflexion interrogative • Écoute & Analyse',
    astonished_chest_hands: '✨ Port de tête vif • Alerte & Intonation',
    serene_clasped: '👂 Mouvement d\'écoute active • Hochement bienveillant',
    teaching_gesture: '🎓 Port de tête gracieux • Conversation & Éloquence',
    heart_encouragement: '💛 Inclinaison d\'écoute • Empathie & Sourire',
  };
  const bodyLanguageLabel = microGesture.activeLabel || BODY_LANGUAGE_LABELS[bodyLanguagePosture];

  // Classify active mouth posture into the 6 Phonetic Visemes of Reference Sheet 2
  let activeVisemeNumber: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  if (!isSpeaking || pose.open <= 0.06) {
    activeVisemeNumber = 1; // Panel 1 (Top-Left): Lèvres jointes (Repos / M, B, P)
  } else if (pose.roundness >= 0.48) {
    activeVisemeNumber = 5; // Panel 5 (Bottom-Center): Lèvres arrondies & projetées (OU, O, ON, U, CH)
  } else if (pose.open >= 0.56 && pose.spread < 0.52) {
    activeVisemeNumber = 4; // Panel 4 (Bottom-Left): Grande ouverture verticale (A, AN, OI)
  } else if (pose.spread >= 0.45) {
    activeVisemeNumber = 3; // Panel 3 (Top-Right): Étirement souriant (I, É, IN)
  } else if (viseme === 'narrow' && pose.upperLipLift >= 0.18) {
    activeVisemeNumber = 6; // Panel 6 (Bottom-Right): Labio-dental & semi-ouvert (F, V, R, È)
  } else {
    activeVisemeNumber = 2; // Panel 2 (Top-Center): Légèrement entrouvert & dentales (E, T, D, L, N)
  }

  const VISEME_6_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
    1: 'Visème 1 • Lèvres jointes (M, B, P & Pause)',
    2: 'Visème 2 • Entrouvert doux (E, T, D, L, N)',
    3: 'Visème 3 • Souriant écarté (I, É, IN)',
    4: 'Visème 4 • Grande ouverture (A, AN, OI)',
    5: 'Visème 5 • Arrondi projeté (OU, O, ON, U)',
    6: 'Visème 6 • Labio-dental & souple (F, V, R, È)',
  };
  const activeVisemeLabel = VISEME_6_LABELS[activeVisemeNumber];

  // Eyelid widening ('eyeWide') on astonishment, inquisitive intonation, and vocal pitch peaks
  const targetEyeWide = isSpeaking
    ? Math.min(
        1.0,
        Math.max(0, pose.intonation - 0.30) * 0.85 +
          pose.wAstonishment * 0.78 +
          pose.wQuestion * 0.46 +
          pose.wEmphasis * 0.32 +
          (emotion === 'astonished' ? 0.55 : emotion === 'curious' ? 0.30 : 0.12)
      )
    : (emotion === 'astonished' ? 0.62 : emotion === 'curious' ? 0.28 : 0.16) +
      Math.sin(nowMs * 0.0010) * 0.10;
  pose.eyeWide += (targetEyeWide - pose.eyeWide) * Math.min(0.22, 0.15 * dtScale);

  // Bilateral zygomaticus cheek & nasolabial animation ('cheekLift')
  // Full Duchenne Smile ("Insérer le sourire") & Bilateral Zygomaticus Cheek Lift ('smile' & 'cheekLift')
  const emotionSmileBase =
    emotion === 'smiling'
      ? 0.98
      : emotion === 'enthusiastic'
      ? 0.94
      : emotion === 'encouraging' || emotion === 'acceptance'
      ? 0.90
      : emotion === 'empathetic'
      ? 0.86
      : emotion === 'pedagogical'
      ? 0.78
      : emotion === 'curious'
      ? 0.70
      : emotion === 'astonished'
      ? 0.36
      : 0.22; // solemn / refusal

  // Insert a warm, radiant smile on inter-clause comma pauses, sentence transitions, and open vowels
  const breathPauseSmileBoost = isBreathPause && emotion !== 'refusal' && emotion !== 'solemn' ? 0.28 : 0;
  const liveSmileWave = 0.5 + 0.5 * Math.sin(nowMs * 0.00145) * Math.cos(nowMs * 0.00085);
  const targetSmile = isSpeaking
    ? Math.min(
        1.0,
        Math.max(
          0.22,
          emotionSmileBase * (1 - pose.roundness * 0.45) +
            pose.spread * 0.52 +
            breathPauseSmileBoost +
            pose.wGreeting * 0.48 +
            pose.wAcceptance * 0.42 +
            pose.wEmpathy * 0.38 +
            microGesture.smileBoost -
            pose.wRefusal * 0.30 -
            pose.browFurrow * 0.18
        )
      )
    : Math.min(
        1.0,
        Math.max(
          0.35,
          emotionSmileBase +
            0.12 +
            microGesture.smileBoost +
            liveSmileWave * 0.14 -
            pose.browFurrow * 0.16
        )
      );
  pose.smile = avatarKalmanSmoother.smile.update(targetSmile, dtSec);

  const targetCheekLift = isSpeaking
    ? Math.min(
        1.0,
        0.34 +
          pose.smile * 0.64 +
          pose.spread * 0.42 +
          pose.intonation * 0.28 +
          pose.wGreeting * 0.35 +
          pose.wAcceptance * 0.30 +
          pose.wEmpathy * 0.28
      )
    : Math.min(1.0, 0.34 + pose.smile * 0.66 + Math.sin(nowMs * 0.00095) * 0.08);
  pose.cheekLift = avatarKalmanSmoother.cheekLift.update(targetCheekLift, dtSec);

  const gazeX =
    Math.sin(nowMs * 0.00115) * 1.85 +
    Math.cos(nowMs * 0.0022) * 0.85 +
    pose.turn * 0.26;
  const gazeY =
    Math.sin(nowMs * 0.00095) * 1.05 +
    Math.cos(nowMs * 0.0017) * 0.48 +
    pose.nod * 0.20 -
    pose.eyeWide * 0.60;
  const breathY =
    Math.sin(nowMs * 0.00185) * (isSpeaking ? 2.6 + pose.intonation * 1.2 : 1.85);

  // Full-Image Upper-Body, Shoulder & Independent Bilateral Hand Kinematics ("animer toute l'image, les mains")
  const syllableBeat = isSpeaking
    ? Math.sin(nowMs * 0.0068) * (0.45 + pose.open * 0.85 + pose.intonation * 0.45)
    : Math.sin(nowMs * 0.0018) * 0.30;
  const counterBeat = isSpeaking
    ? Math.cos(nowMs * 0.0054) * (0.40 + pose.open * 0.75 + pose.intonation * 0.40)
    : Math.cos(nowMs * 0.0015) * 0.25;

  const targetTorsoSwayX =
    (isSpeaking ? Math.sin(nowMs * 0.00125) * 3.0 : Math.sin(nowMs * 0.00085) * 1.4) +
    pose.turn * 0.22 +
    microGesture.torsoSwayDx;
  const baseShoulderBreathLift =
    breathY * 1.1 -
    (isSpeaking ? pose.intonation * 2.8 + pose.open * 1.8 : 0) -
    pose.pAstonished * 3.2 -
    pose.pWelcome * 2.2 -
    pose.smile * 1.2;

  const targetLeftShoulderLift = baseShoulderBreathLift + microGesture.leftShoulderLiftDy;
  const targetRightShoulderLift = baseShoulderBreathLift + microGesture.rightShoulderLiftDy;
  const targetCollarLift = baseShoulderBreathLift * 0.72 + microGesture.collarLiftDy;

  pose.shoulderX = avatarKalmanSmoother.torsoSwayX.update(targetTorsoSwayX, dtSec);
  pose.leftShoulderY = avatarKalmanSmoother.leftShoulderLift.update(targetLeftShoulderLift, dtSec);
  pose.rightShoulderY = avatarKalmanSmoother.rightShoulderLift.update(targetRightShoulderLift, dtSec);
  pose.collarY = avatarKalmanSmoother.collarLift.update(targetCollarLift, dtSec);
  pose.shoulderY = (pose.leftShoulderY + pose.rightShoulderY) * 0.5;

  // Expressive Left Hand (x=176..430, y=800..960) & Right Hand (x=430..728, y=780..950)
  const targetLeftHandDx =
    pose.shoulderX * 1.15 -
    pose.pWelcome * 10.5 -
    pose.pTeaching * (6.5 + syllableBeat * 7.5) +
    pose.pReflection * 6.0 -
    pose.pAstonished * 8.0 +
    pose.pEncouragement * 4.5 +
    counterBeat * (isSpeaking ? 6.2 : 2.2);

  const targetLeftHandDy =
    pose.shoulderY * 1.1 -
    (isSpeaking ? pose.open * 10.5 + pose.intonation * 7.5 : 0) -
    pose.pWelcome * 8.5 -
    pose.pTeaching * (8.0 + Math.abs(syllableBeat) * 8.5) -
    pose.pAstonished * 13.5 -
    pose.pReflection * 7.5 -
    pose.pEncouragement * 6.5 +
    syllableBeat * (isSpeaking ? 7.4 : 2.4);

  const targetRightHandDx =
    pose.shoulderX * 1.15 +
    pose.pWelcome * (11.5 + syllableBeat * 6.5) +
    pose.pTeaching * (7.5 + counterBeat * 8.2) -
    pose.pReflection * 7.5 +
    pose.pAstonished * 8.5 -
    pose.pEncouragement * 5.0 +
    syllableBeat * (isSpeaking ? 6.8 : 2.4);

  const targetRightHandDy =
    pose.shoulderY * 1.1 -
    (isSpeaking ? pose.open * 12.0 + pose.intonation * 8.5 : 0) -
    pose.pWelcome * (10.5 + Math.abs(counterBeat) * 6.0) -
    pose.pTeaching * (9.5 + Math.abs(counterBeat) * 9.0) -
    pose.pAstonished * 14.5 -
    pose.pReflection * 11.0 -
    pose.pEncouragement * 8.0 +
    counterBeat * (isSpeaking ? 8.2 : 2.6);

  const handRate = Math.min(0.24, 0.16 * dtScale);
  pose.leftHandDx += (targetLeftHandDx - pose.leftHandDx) * handRate;
  pose.leftHandDy += (targetLeftHandDy - pose.leftHandDy) * handRate;
  pose.rightHandDx += (targetRightHandDx - pose.rightHandDx) * handRate;
  pose.rightHandDy += (targetRightHandDy - pose.rightHandDy) * handRate;

  const activeBadgeLabel =
    microGesture.activeLabel
      ? microGesture.activeLabel
      : isSpeaking && gType !== 'neutral' && HEAD_GESTURE_LABELS[gType]
      ? HEAD_GESTURE_LABELS[gType]
      : EMOTION_LABELS[emotion];

  // Animate upper torso / shoulders with Kalman-smoothed micro-gesture shrugs & breathing
  const torsoTransform = `translate(${(pose.shoulderX * 0.45).toFixed(2)}, ${(pose.shoulderY * 0.65).toFixed(2)})`;
  const headTransform = `translate(${(455 + pose.turn).toFixed(2)}, ${(563 + pose.nod).toFixed(2)}) rotate(${pose.tilt.toFixed(2)}) scale(1.0120) translate(-455, -563)`;

  // ============================================================================
  // REAL FEMALE ANATOMICAL MOUTH KINEMATICS (10-Station Pixel-Calibrated Inlay)
  // - REST_OPEN = 0.04 matches the natural resting lip posture in aisha_posture_droite_mains_1790908221106.jpg.
  // ============================================================================
  const open = pose.open;
  const roundness = pose.roundness;

  let jawDy = 0;
  let jawScaleY = 1.0;
  let upperScaleY = 1.0;
  let upperDy = 0;

  if (open <= REST_OPEN) {
    const closeRatio = 1 - open / REST_OPEN;
    jawDy = 0;
    jawScaleY = 1.0;
    const descendFactor = Math.max(0, -pose.upperLipLift);
    upperDy = closeRatio * (0.4 + descendFactor * 0.2);
    upperScaleY = 1.0;
  } else {
    const openRatio = (open - REST_OPEN) / (1 - REST_OPEN);
    const intonationJawBoost = 1.0 + Math.max(0, pose.intonation - 0.4) * 0.18;
    const maxNaturalJawDrop = 16.5 * (1 - roundness * 0.15) * intonationJawBoost;
    jawDy = openRatio * maxNaturalJawDrop;
    jawScaleY = 1.0 + roundness * 0.08;
    upperDy = -pose.upperLipLift * openRatio * 1.8 + roundness * 1.6;
    upperScaleY = 1.0 + roundness * 0.08;
  }

  const jawInlayTransform = `translate(0.00, ${jawDy.toFixed(2)}) translate(454.0, 505.0) scale(1.000, ${jawScaleY.toFixed(3)}) translate(-454.0, -505.0)`;

  const upperLipInlayTransform = `translate(0.00, ${upperDy.toFixed(2)}) translate(454.0, 476.0) scale(1.000, ${upperScaleY.toFixed(3)}) translate(-454.0, -476.0)`;

  const upperLipInlayOpacity = '1.00';

  const openRatio = open > REST_OPEN ? (open - REST_OPEN) / (1 - REST_OPEN) : 0;
  const closeRatio = open <= REST_OPEN ? 1 - open / REST_OPEN : 0;

  const cavTopYs = new Array<number>(10);
  const cavBotYs = new Array<number>(10);

  for (let i = 0; i < 10; i++) {
    const isCorner = i === 0 || i === 9;
    const isNearCorner = i === 1 || i === 8;

    // Lateral Commissure Pinch on rounded French vowels ('O', 'OU', 'U', 'ON', 'CH')
    const topLateralPinch = isNearCorner
      ? roundness * 0.85
      : i === 2 || i === 7
      ? roundness * 0.52
      : 0.0;

    // Bottom arch tracks the lowered jaw across stations 2..7 so the static lower lip is 100% covered,
    // while tapering smoothly at stations 1 and 8 toward the anchored commissures (0 and 9)
    const botCornerWeight = isCorner
      ? 0.0
      : isNearCorner
      ? 0.62 * (1 - roundness * 0.50)
      : 1.0;

    if (open <= REST_OPEN) {
      // As the lips close over the upper teeth, the aperture narrows toward the meeting line
      const seamY = UPPER_LIP_BOT_Y[i] * 0.42 + LOWER_LIP_TOP_Y[i] * 0.58;
      cavTopYs[i] =
        UPPER_TEETH_BOT_Y[i] * (1 - closeRatio * 0.96) + seamY * (closeRatio * 0.96);
      cavBotYs[i] =
        LOWER_LIP_TOP_Y[i] * (1 - closeRatio * 0.96) + seamY * (closeRatio * 0.96);
    } else {
      // Top of dark oral cavity stays right at UPPER_TEETH_BOT_Y so upper teeth remain whole
      cavTopYs[i] = UPPER_TEETH_BOT_Y[i] - 0.3 + topLateralPinch * 1.4;

      const overlapUnderLowerLip = isCorner ? 0 : isNearCorner ? 1.4 : 2.8;
      cavBotYs[i] =
        LOWER_LIP_TOP_Y[i] + jawDy * botCornerWeight + overlapUnderLowerLip;
    }
  }

  const cavityD = buildClosedApertureSpline(MOUTH_X, cavTopYs, cavBotYs);
  const mouthActive = isSpeaking || Math.abs(open - REST_OPEN) > 0.008;
  const cavityOpacity = !mouthActive
    ? '0.00'
    : open <= 0.05
    ? Math.max(0, Math.min(1, (open - 0.015) / 0.035)).toFixed(2)
    : '1.00';

  const mouthOpacity = mouthActive ? '1' : '0';

  // Expressive anatomical tongue inside the oral cavity (elevates on T/D/L/N, rests in lower cavity on open vowels)
  const tongueOpacity =
    mouthActive && (open > 0.10 || pose.tongueLift > 0.28)
      ? Math.min(0.92, Math.max((open - 0.08) * 1.45, pose.tongueLift * 0.82)).toFixed(2)
      : '0';
  const tongueCx = '454.0';
  const tongueCy = (
    488.0 +
    Math.max(0, jawDy) * 0.54 -
    pose.tongueLift * 4.2
  ).toFixed(2);
  const tongueRx = (17.2 * (1 - roundness * 0.28) + open * 3.8).toFixed(2);
  const tongueRy = (3.2 + Math.max(0, open - REST_OPEN) * 5.6 + pose.tongueLift * 1.8).toFixed(2);

  // Photorealistic Eye Blinks & Winks ("clins d'œil")
  const bL = pose.blinkLeft;
  const leftLidCtrlY = 356.0 + bL * 19.5;
  const leftEyelidD = `M 373 365.0 Q 395 354.5 417 366.0 Q 395 ${leftLidCtrlY.toFixed(2)} 373 365.0 Z`;
  const leftLashD = `M 373 365.0 Q 395 ${leftLidCtrlY.toFixed(2)} 417 366.0`;
  const leftBlinkOpacity = bL > 0.04 ? Math.min(1, bL * 1.15).toFixed(2) : '0';

  const bR = pose.blinkRight;
  const rightLidCtrlY = 356.0 + bR * 19.5;
  const rightEyelidD = `M 496 366.0 Q 518 354.5 540 365.0 Q 518 ${rightLidCtrlY.toFixed(2)} 496 366.0 Z`;
  const rightLashD = `M 496 366.0 Q 518 ${rightLidCtrlY.toFixed(2)} 540 365.0`;
  const rightBlinkOpacity = bR > 0.04 ? Math.min(1, bR * 1.15).toFixed(2) : '0';

  const eqY: [string, string, string, string, string] = ['4.25', '4.25', '4.25', '4.25', '4.25'];
  const eqH: [string, string, string, string, string] = ['3.50', '3.50', '3.50', '3.50', '3.50'];
  for (let i = 0; i < 5; i++) {
    const bh = isSpeaking
      ? Math.max(3.5, Math.min(12, open * 15 * (i % 2 === 0 ? 1 : 0.72)))
      : 3.5;
    eqY[i] = (6 - bh / 2).toFixed(2);
    eqH[i] = bh.toFixed(2);
  }

  return {
    nowMs,
    isSpeaking,
    open,
    viseme,
    emotion,
    emotionLabel: activeBadgeLabel,
    torsoTransform,
    headTransform,
    jawInlayTransform,
    upperLipInlayTransform,
    upperLipInlayOpacity,
    cavityD,
    cavityOpacity,
    mouthOpacity,
    tongueOpacity,
    tongueCx,
    tongueCy,
    tongueRx,
    tongueRy,
    leftEyelidD,
    leftLashD,
    leftBlinkOpacity,
    rightEyelidD,
    rightLashD,
    rightBlinkOpacity,
    eqY,
    eqH,
    jawDy,
    upperDy,
    roundness,
    spread: pose.spread,
    upperLipLift: pose.upperLipLift,
    tongueLift: pose.tongueLift,
    turn: pose.turn,
    nod: pose.nod,
    tilt: pose.tilt,
    hairLagTurn: pose.hairLagTurn,
    hairLagNod: pose.hairLagNod,
    eyebrowLift: pose.eyebrowLift,
    browFurrow: pose.browFurrow,
    eyeWide: pose.eyeWide,
    cheekLift: pose.cheekLift,
    smile: pose.smile,
    intonation: pose.intonation,
    blinkLeft: pose.blinkLeft,
    blinkRight: pose.blinkRight,
    gazeX,
    gazeY,
    breathY,
    shoulderLift: pose.shoulderY,
    leftShoulderLift: pose.leftShoulderY,
    rightShoulderLift: pose.rightShoulderY,
    collarLift: pose.collarY,
    torsoSwayX: pose.shoulderX,
    activeMicroGestureTag: microGesture.activeTag,
    activeMicroGestureLabel: microGesture.activeLabel,
    leftHandDx: pose.leftHandDx,
    leftHandDy: pose.leftHandDy,
    rightHandDx: pose.rightHandDx,
    rightHandDy: pose.rightHandDy,
    cavTopYs,
    cavBotYs,
    activeVisemeNumber,
    activeVisemeLabel,
    bodyLanguagePosture,
    bodyLanguageLabel,
    pWelcome: pose.pWelcome,
    pReflection: pose.pReflection,
    pAstonished: pose.pAstonished,
    pSerene: pose.pSerene,
    pTeaching: pose.pTeaching,
    pEncouragement: pose.pEncouragement,
  };
}

if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function') {
  self.onmessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'LOAD_SENTENCE') {
      const sentence = String(data.sentence || '');
      const boundaries = Array.isArray(data.wordBoundaries) ? data.wordBoundaries : [];
      const emotionalTags = Array.isArray(data.emotionalTags) ? data.emotionalTags : undefined;
      loadAvatarSentencePhonemes(
        sentence,
        boundaries,
        data.emotion as AvatarEmotion | undefined,
        emotionalTags
      );
      return;
    }

    if (data.type === 'CLEAR_SENTENCE') {
      clearAvatarSentencePhonemes();
      return;
    }

    if (data.type === 'STEP_FRAME') {
      const frame = stepAvatarExpressionFrame(
        Number(data.nowMs) || 0,
        Number(data.streamElapsedMs) || 0,
        Number(data.acousticRms) || 0,
        Boolean(data.isSpeaking),
        Number(data.fallbackOpen) || 0,
        (data.fallbackViseme as WorkerViseme) || 'closed',
        Boolean(data.isPauseHint),
        data.emotion as AvatarEmotion | undefined
      );
      self.postMessage({ type: 'FRAME_READY', frame });
    }
  };
}
