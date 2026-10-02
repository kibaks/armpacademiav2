// Bibliothèque de Micro-Gestes Corporels & Céphaliques déclenchés par les Balises Émotionnelles TTS
// Anime le corps (haussements d'épaules, port du buste, respiration) et la tête (hochements affirmatifs,
// inclinaisons empathiques, appuis pédagogiques) des tutrices lors des dialogues et cours animés.

export type MicroGestureId =
  | 'affirmative_nod'            // Hochement de tête affirmatif (« Oui », validation, accord, exactitude)
  | 'shoulder_shrug'             // Haussement d'épaules expressif / interrogatif / dédramatisant
  | 'empathetic_shoulder_soften' // Haussement doux d'épaules & souffle bienveillant du buste
  | 'pedagogical_emphasis_nod'   // Hochement d'appui pédagogique & redressement structuré des épaules
  | 'vigilance_shake_shrug'      // Haussement d'épaules d'alerte & hochet latéral de vigilance
  | 'enthusiastic_welcome_lift'; // Haussement d'épaules joyeux & hochement d'accueil

export interface TtsEmotionalTag {
  id: string;
  tag: MicroGestureId;
  emotion:
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
  offsetMs: number;
  durationMs: number;
  intensity: number; // 0.5 .. 1.0
  triggerWord: string;
  wordIndex?: number;
  label: string;
}

export interface MicroGestureTemplate {
  id: MicroGestureId;
  label: string;
  defaultDurationMs: number;
  description: string;
}

export const MICRO_GESTURE_CATALOG: Record<MicroGestureId, MicroGestureTemplate> = {
  affirmative_nod: {
    id: 'affirmative_nod',
    label: '🙆‍♀️ Hochement affirmatif (« Oui »)',
    defaultDurationMs: 780,
    description:
      'Double hochement vertical affirmatif de la tête accompagné d’une légère impulsion respiratoire du buste et d’un sourire de validation.',
  },
  shoulder_shrug: {
    id: 'shoulder_shrug',
    label: '🤷‍♀️ Haussement d’épaules expressif',
    defaultDurationMs: 880,
    description:
      'Élévation souple et naturelle des épaules et des revers du tailleur avec légère inclinaison interrogative ou dédramatisante de la tête.',
  },
  empathetic_shoulder_soften: {
    id: 'empathetic_shoulder_soften',
    label: '💛 Haussement doux & souffle d’empathie',
    defaultDurationMs: 940,
    description:
      'Montée douce des épaules suivie d’un relâchement apaisant du buste, inclinaison chaleureuse de la tête et sourire fraternel.',
  },
  pedagogical_emphasis_nod: {
    id: 'pedagogical_emphasis_nod',
    label: '🎓 Appui pédagogique & port du buste',
    defaultDurationMs: 760,
    description:
      'Hochement vertical franc d’insistance pédagogique accompagné d’un redressement tonique des épaules et du col.',
  },
  vigilance_shake_shrug: {
    id: 'vigilance_shake_shrug',
    label: '⚖️ Haussement de vigilance & hochet',
    defaultDurationMs: 840,
    description:
      'Haussement protecteur des épaules couplé à un hochet latéral mesuré de la tête sur un point de vigilance juridique.',
  },
  enthusiastic_welcome_lift: {
    id: 'enthusiastic_welcome_lift',
    label: '🌟 Haussement joyeux & hochement d’accueil',
    defaultDurationMs: 860,
    description:
      'Élévation lumineuse du buste et des épaules avec hochement d’accueil bienveillant et sourire de Duchenne.',
  },
};

export interface EvaluatedMicroGestureKinematics {
  activeTag: MicroGestureId | null;
  activeLabel: string;
  /** Vertical head nod offset in pixels (+ is downward affirmative nod) */
  nodOffsetPx: number;
  /** Horizontal 3D head turn offset in pixels */
  turnOffsetPx: number;
  /** Lateral feminine head tilt offset in degrees */
  tiltOffsetDeg: number;
  /** Left shoulder & lapel vertical displacement in pixels (- is upward shrug lift) */
  leftShoulderLiftDy: number;
  /** Right shoulder & lapel vertical displacement in pixels (- is upward shrug lift) */
  rightShoulderLiftDy: number;
  /** Central collarbone & blouse collar vertical displacement in pixels (- is upward lift) */
  collarLiftDy: number;
  /** Upper-body lateral sway in pixels */
  torsoSwayDx: number;
  /** Eyebrow arch boost (0..0.5) */
  browBoost: number;
  /** Inner brow furrow boost (0..0.5) */
  furrowBoost: number;
  /** Duchenne smile boost (0..0.4) */
  smileBoost: number;
}

/**
 * Classify a spoken French word into a specific TTS Emotional & Micro-Gesture Tag
 */
export function classifyWordMicroGesture(rawWord: string): {
  tag: MicroGestureId;
  emotion: TtsEmotionalTag['emotion'];
  intensity: number;
} | null {
  const w = (rawWord || '')
    .toLowerCase()
    .replace(/^(?:n['’]|l['’]|d['’]|qu['’]|c['’]|s['’]|j['’]|m['’]|t['’])/i, '')
    .replace(/[.,;:!?«»"()—\-]/g, '')
    .trim();
  if (!w) return null;

  // 1. Affirmative Head Nod ("Hochement de tête affirmatif" — validation, "retrouver", "oui", "bien", "mieux", "confiance")
  if (
    /^(oui|exact|exactement|absolument|parfait|parfaitement|tout|effectivement|certes|valide|validé|validée|valider|validation|conforme|conformité|approuvé|approuver|accepté|accepter|accord|autorisé|autorisée|autorisation|juste|vrai|obligatoire|impératif|impérativement|admis|recevable|favorable|garantie|transparence|égalité|intégrité|clair|évidemment|naturellement|retrouver|retrouve|retrouvons|bien|mieux|confiance|avancer|avançons)$/.test(
      w
    )
  ) {
    return {
      tag: 'affirmative_nod',
      emotion: 'acceptance',
      intensity: 0.96,
    };
  }

  // 2. Expressive Shoulder Shrug ("Haussement d'épaules" — "n'hésitez pas", "poser vos questions", questioning, nuance)
  if (
    /\?/.test(rawWord || '') ||
    /^(pourquoi|comment|quand|quel|quelle|quels|quelles|qui|combien|où|quoi|lequel|laquelle|parfois|souvent|simplement|pourtant|cependant|toutefois|ailleurs|imaginons|imagine|imaginez|supposons|hélas|étonnant|incroyable|surprise|surprenant|doute|hésiter|hésites|hésitez|hésite|hésitation|poser|posez|question|questions|quelques|hypothèse|scénario|choix|alternative|dépend|selon|soit)$/.test(
      w
    )
  ) {
    return {
      tag: 'shoulder_shrug',
      emotion: 'curious',
      intensity: 0.96,
    };
  }

  // 3. Empathetic Shoulder Soften & Reassuring Breath ("Haussement doux d'empathie" — "ensemble", "écoutez", "échange", "aide", "comprendre")
  if (
    /^(rassure|rassurez|comprends|comprenons|comprendre|doucement|ensemble|échange|échanges|accompagne|confiance|calme|sérénité|cœur|frère|sœur|collègue|cher|chère|inquiète|normal|aide|aider|écoute|écoutez|écoutons|soutien|respire|respirons|tranquillement|patience|main)$/.test(
      w
    )
  ) {
    return {
      tag: 'empathetic_shoulder_soften',
      emotion: 'empathetic',
      intensity: 0.92,
    };
  }

  // 4. Enthusiastic Welcome Lift ("Haussement d'accueil joyeux & hochement" — "Bonjour, ravie de vous retrouver")
  if (
    /^(bonjour|bienvenue|bonsoir|salut|bravo|félicitations|excellent|excellente|honneur|plaisir|heureuse|ravie|ravi|joie|merveilleux|superbe|magnifique|formidable|succès|réussi|réussir|fière|enchantée)$/.test(
      w
    )
  ) {
    return {
      tag: 'enthusiastic_welcome_lift',
      emotion: 'enthusiastic',
      intensity: 0.95,
    };
  }

  // 5. Vigilance Shake & Shrug ("Haussement d'alerte & hochet")
  if (
    /^(non|jamais|aucun|aucune|rien|interdit|interdite|interdits|interdiction|interdire|illégal|illégale|illicite|impossible|nul|nulle|nullité|rejet|rejeté|rejetée|rejeter|refus|refusé|forclusion|irrecevable|saucissonnage|fractionnement|fraude|conflit|faute|sanction|sanctions|pénalité|pénalités|éviter|évitez|prohibé|abus|irrégulier|attention|piège|risque)$/.test(
      w
    )
  ) {
    return {
      tag: 'vigilance_shake_shrug',
      emotion: 'refusal',
      intensity: 0.92,
    };
  }

  // 6. Pedagogical Emphasis Nod & Upright Bust ("Appui pédagogique" — "Aujourd'hui", "explorer", "idées", "Regardez")
  if (
    /^(aujourd['’]?hui|explorer|explorons|explore|idée|idées|regardez|regarde|regardons|article|loi|décret|ordonnance|important|essentiel|fondamental|clé|retiens|retenons|notamment|premièrement|deuxièmement|troisièmement|enfin|ensuite|toujours|seuil|seuils|délai|délais|principe|principes|règle|règles|étape|étapes|commission|autorité|contrôle|dossier|plan|marché|marchés)$/.test(
      w
    )
  ) {
    return {
      tag: 'pedagogical_emphasis_nod',
      emotion: 'pedagogical',
      intensity: 0.90,
    };
  }

  return null;
}

/**
 * Extract structured TTS Emotional & Micro-Gesture Tags synchronized with wordBoundaries.
 * Called by the TTS API (`/api/ai/tts`) and by the client speech/expression pipeline.
 */
export function extractTtsEmotionalTags(
  sentence: string,
  wordBoundaries: Array<{ text: string; offsetMs: number; durationMs: number; charIndex?: number }>,
  globalEmotion: string = 'pedagogical'
): TtsEmotionalTag[] {
  if (!Array.isArray(wordBoundaries) || wordBoundaries.length === 0) {
    return [];
  }

  const tags: TtsEmotionalTag[] = [];
  let lastTagEndMs = -250;

  for (let i = 0; i < wordBoundaries.length; i++) {
    const wb = wordBoundaries[i];
    const classified = classifyWordMicroGesture(wb.text);
    if (!classified) continue;

    // Avoid overlapping micro-gestures closer than 420ms so each gesture reads with natural human poise
    if (wb.offsetMs < lastTagEndMs - 120) continue;

    const template = MICRO_GESTURE_CATALOG[classified.tag];
    const durationMs = Math.max(
      template.defaultDurationMs,
      Math.min(1150, wb.durationMs + 540)
    );

    tags.push({
      id: `tts-mg-${i}-${classified.tag}`,
      tag: classified.tag,
      emotion: classified.emotion,
      offsetMs: Math.max(0, wb.offsetMs - 35),
      durationMs,
      intensity: classified.intensity,
      triggerWord: wb.text,
      wordIndex: i,
      label: template.label,
    });

    lastTagEndMs = wb.offsetMs + durationMs;
  }

  // Ensure every spoken sentence has a lively sequence of body & head micro-gestures
  // (including both affirmative nods and expressive shoulder shrugs) even on generic sentences
  const totalWords = wordBoundaries.length;
  const firstWb = wordBoundaries[0];
  const lastWb = wordBoundaries[totalWords - 1];
  const totalSpanMs = Math.max(600, lastWb.offsetMs + lastWb.durationMs - firstWb.offsetMs);

  const hasShrug = tags.some(
    (t) =>
      t.tag === 'shoulder_shrug' ||
      t.tag === 'empathetic_shoulder_soften' ||
      t.tag === 'enthusiastic_welcome_lift'
  );
  const hasNod = tags.some(
    (t) => t.tag === 'affirmative_nod' || t.tag === 'pedagogical_emphasis_nod'
  );

  if (!hasNod && totalWords >= 2) {
    const nodWordIdx = Math.min(totalWords - 1, Math.max(0, Math.floor(totalWords * 0.25)));
    const wb = wordBoundaries[nodWordIdx];
    const nodType: MicroGestureId =
      globalEmotion === 'acceptance' || globalEmotion === 'smiling' || globalEmotion === 'encouraging'
        ? 'affirmative_nod'
        : 'pedagogical_emphasis_nod';
    const tmpl = MICRO_GESTURE_CATALOG[nodType];
    tags.push({
      id: `tts-mg-auto-nod-${nodWordIdx}`,
      tag: nodType,
      emotion: (globalEmotion as TtsEmotionalTag['emotion']) || 'pedagogical',
      offsetMs: Math.max(0, wb.offsetMs - 25),
      durationMs: tmpl.defaultDurationMs,
      intensity: 0.86,
      triggerWord: wb.text,
      wordIndex: nodWordIdx,
      label: tmpl.label,
    });
  }

  if (!hasShrug && totalSpanMs >= 900 && totalWords >= 4) {
    const shrugWordIdx = Math.min(totalWords - 1, Math.max(1, Math.floor(totalWords * 0.62)));
    const wb = wordBoundaries[shrugWordIdx];
    const shrugType: MicroGestureId =
      globalEmotion === 'empathetic'
        ? 'empathetic_shoulder_soften'
        : globalEmotion === 'enthusiastic' || globalEmotion === 'smiling'
        ? 'enthusiastic_welcome_lift'
        : 'shoulder_shrug';
    const tmpl = MICRO_GESTURE_CATALOG[shrugType];
    tags.push({
      id: `tts-mg-auto-shrug-${shrugWordIdx}`,
      tag: shrugType,
      emotion: (globalEmotion as TtsEmotionalTag['emotion']) || 'curious',
      offsetMs: Math.max(0, wb.offsetMs - 25),
      durationMs: tmpl.defaultDurationMs,
      intensity: 0.88,
      triggerWord: wb.text,
      wordIndex: shrugWordIdx,
      label: tmpl.label,
    });
  }

  tags.sort((a, b) => a.offsetMs - b.offsetMs);
  return tags;
}

/**
 * Re-anchors TTS Emotional Tags to the PCM-calibrated wordBoundaries so micro-gestures
 * remain 100% locked to the voice with zero drift.
 */
export function reanchorEmotionalTagsToBoundaries(
  tags: TtsEmotionalTag[],
  calibratedBoundaries: Array<{ text: string; offsetMs: number; durationMs: number; charIndex?: number }>,
  sentence: string,
  globalEmotion: string = 'pedagogical'
): TtsEmotionalTag[] {
  if (!Array.isArray(calibratedBoundaries) || calibratedBoundaries.length === 0) {
    return tags || [];
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    return extractTtsEmotionalTags(sentence, calibratedBoundaries, globalEmotion);
  }

  return tags.map((tag) => {
    if (
      typeof tag.wordIndex === 'number' &&
      tag.wordIndex >= 0 &&
      tag.wordIndex < calibratedBoundaries.length
    ) {
      const wb = calibratedBoundaries[tag.wordIndex];
      return {
        ...tag,
        offsetMs: Math.max(0, wb.offsetMs - 30),
      };
    }
    // Fallback match by triggerWord
    const match = calibratedBoundaries.find(
      (w) =>
        w.text.toLowerCase() === (tag.triggerWord || '').toLowerCase() &&
        Math.abs(w.offsetMs - tag.offsetMs) < 1200
    );
    if (match) {
      return {
        ...tag,
        offsetMs: Math.max(0, match.offsetMs - 30),
      };
    }
    return tag;
  });
}

/**
 * Raised-cosine C²-continuous bell envelope on [0, 1]:
 * Zero value, zero velocity, and smooth acceleration at t=0 and t=1.
 */
function smoothBellEnvelope(phase: number): number {
  const p = Math.max(0, Math.min(1, phase));
  return 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
}

/**
 * Asymmetric attack-hold-release envelope for natural human shoulder shrugs:
 * Smooth rise (0..0.35), expressive plateau (0.35..0.62), and soft exhale release (0.62..1.0).
 */
function shoulderShrugEnvelope(phase: number): number {
  const p = Math.max(0, Math.min(1, phase));
  if (p < 0.36) {
    return 0.5 - 0.5 * Math.cos((p / 0.36) * Math.PI);
  }
  if (p < 0.62) {
    const plateauPhase = (p - 0.36) / 0.26;
    return 1.0 - 0.06 * Math.sin(plateauPhase * Math.PI);
  }
  const releasePhase = (p - 0.62) / 0.38;
  return 0.5 + 0.5 * Math.cos(releasePhase * Math.PI);
}

/**
 * Evaluate the active micro-gesture kinematics at the exact audio stream timestamp (`streamElapsedMs`)
 * or during active listening (`!isSpeaking`).
 */
export function evaluateMicroGestureTimeline(
  streamElapsedMs: number,
  nowMs: number,
  isSpeaking: boolean,
  globalEmotion: string,
  tags: TtsEmotionalTag[]
): EvaluatedMicroGestureKinematics {
  let activeTag: MicroGestureId | null = null;
  let activeLabel = '';
  let nodOffsetPx = 0;
  let turnOffsetPx = 0;
  let tiltOffsetDeg = 0;
  let leftShoulderLiftDy = 0;
  let rightShoulderLiftDy = 0;
  let collarLiftDy = 0;
  let torsoSwayDx = 0;
  let browBoost = 0;
  let furrowBoost = 0;
  let smileBoost = 0;

  if (isSpeaking && tags.length > 0 && streamElapsedMs > 0) {
    for (let i = 0; i < tags.length; i++) {
      const t = tags[i];
      if (streamElapsedMs >= t.offsetMs && streamElapsedMs <= t.offsetMs + t.durationMs) {
        const phase = (streamElapsedMs - t.offsetMs) / Math.max(180, t.durationMs);
        const env = smoothBellEnvelope(phase);
        const shrugEnv = shoulderShrugEnvelope(phase);
        const k = t.intensity;

        activeTag = t.tag;
        activeLabel = t.label;

        switch (t.tag) {
          case 'affirmative_nod': {
            // Double harmonic affirmative head nod ("Oui, tout à fait") + subtle shoulder breath
            const doubleNod =
              Math.sin(phase * Math.PI * 2) * (phase < 0.5 ? 1.0 : 0.62) +
              Math.sin(phase * Math.PI) * 0.55;
            nodOffsetPx += Math.max(-1.8, doubleNod * 7.8 * k);
            tiltOffsetDeg += Math.sin(phase * Math.PI) * 1.8 * k;
            leftShoulderLiftDy += -shrugEnv * 3.4 * k;
            rightShoulderLiftDy += -shrugEnv * 3.4 * k;
            collarLiftDy += -shrugEnv * 2.2 * k;
            smileBoost = Math.max(smileBoost, env * 0.36 * k);
            browBoost = Math.max(browBoost, env * 0.22 * k);
            break;
          }

          case 'shoulder_shrug': {
            // Expressive bilateral shoulder shrug ("Haussement d'épaules") with subtle asymmetric grace
            leftShoulderLiftDy += -shrugEnv * 9.6 * k;
            rightShoulderLiftDy += -shrugEnv * 8.8 * k;
            collarLiftDy += -shrugEnv * 5.8 * k;
            torsoSwayDx += Math.sin(phase * Math.PI) * 3.2 * k;
            tiltOffsetDeg += -shrugEnv * 2.9 * k;
            nodOffsetPx += -shrugEnv * 2.4 * k;
            browBoost = Math.max(browBoost, shrugEnv * 0.34 * k);
            smileBoost = Math.max(smileBoost, shrugEnv * 0.28 * k);
            break;
          }

          case 'empathetic_shoulder_soften': {
            // Warm shoulder rise followed by soothing release + empathetic head inclination
            const breathCurve =
              phase < 0.48
                ? -Math.sin((phase / 0.48) * (Math.PI / 2))
                : Math.sin(((phase - 0.48) / 0.52) * Math.PI) * 0.28;
            leftShoulderLiftDy += breathCurve * 7.4 * k;
            rightShoulderLiftDy += breathCurve * 7.0 * k;
            collarLiftDy += breathCurve * 4.6 * k;
            torsoSwayDx += env * 2.8 * k;
            tiltOffsetDeg += env * 3.2 * k;
            nodOffsetPx += Math.sin(phase * Math.PI) * 4.8 * k;
            smileBoost = Math.max(smileBoost, env * 0.38 * k);
            break;
          }

          case 'pedagogical_emphasis_nod': {
            // Crisp downward pedagogical nod + structured shoulder alignment
            const beatNod = Math.sin(phase * Math.PI) * (0.65 + 0.35 * Math.sin(phase * Math.PI * 2));
            nodOffsetPx += beatNod * 7.2 * k;
            leftShoulderLiftDy += -env * 5.2 * k;
            rightShoulderLiftDy += -env * 5.6 * k;
            collarLiftDy += -env * 3.4 * k;
            torsoSwayDx += -env * 2.0 * k;
            browBoost = Math.max(browBoost, env * 0.28 * k);
            break;
          }

          case 'vigilance_shake_shrug': {
            // Protective shoulder shrug + damped lateral head shake ("Non / Attention")
            leftShoulderLiftDy += -shrugEnv * 6.8 * k;
            rightShoulderLiftDy += -shrugEnv * 6.8 * k;
            collarLiftDy += -shrugEnv * 4.2 * k;
            turnOffsetPx += Math.sin(phase * Math.PI * 3) * env * 6.4 * k;
            nodOffsetPx += -env * 1.6 * k;
            furrowBoost = Math.max(furrowBoost, env * 0.32 * k);
            break;
          }

          case 'enthusiastic_welcome_lift': {
            // Joyful shoulder & collarbone lift + welcoming nod
            leftShoulderLiftDy += -shrugEnv * 8.2 * k;
            rightShoulderLiftDy += -shrugEnv * 8.6 * k;
            collarLiftDy += -shrugEnv * 5.2 * k;
            torsoSwayDx += Math.sin(phase * Math.PI) * 2.6 * k;
            nodOffsetPx += Math.sin(phase * Math.PI * 2) * 5.8 * k;
            tiltOffsetDeg += env * 2.6 * k;
            smileBoost = Math.max(smileBoost, env * 0.35 * k);
            browBoost = Math.max(browBoost, env * 0.26 * k);
            break;
          }
        }
      }
    }
  } else if (!isSpeaking) {
    // Active Listening Dialogue Micro-Gestures:
    // Periodically alternate between an attentive affirmative nod ("Oui, je vous écoute")
    // and a gentle empathetic shoulder shrug/breath so the tutor's body stays alive during user turns!
    const cycleMs = nowMs % 6400;
    if (cycleMs < 1400) {
      const phase = cycleMs / 1400;
      const env = smoothBellEnvelope(phase);
      activeTag = 'affirmative_nod';
      activeLabel = '🙆‍♀️ Écoute active • Hochement affirmatif';
      nodOffsetPx = Math.sin(phase * Math.PI * 2) * 4.8 * env + env * 2.4;
      leftShoulderLiftDy = -env * 2.8;
      rightShoulderLiftDy = -env * 2.8;
      collarLiftDy = -env * 1.8;
      smileBoost = env * 0.18;
    } else if (cycleMs >= 3200 && cycleMs < 4700) {
      const phase = (cycleMs - 3200) / 1500;
      const shrugEnv = shoulderShrugEnvelope(phase);
      activeTag =
        globalEmotion === 'curious' ? 'shoulder_shrug' : 'empathetic_shoulder_soften';
      activeLabel =
        globalEmotion === 'curious'
          ? '🤷‍♀️ Écoute attentive • Haussement d’épaules'
          : '💛 Écoute bienveillante • Souffle & Épaules';
      leftShoulderLiftDy = -shrugEnv * 5.8;
      rightShoulderLiftDy = -shrugEnv * 5.4;
      collarLiftDy = -shrugEnv * 3.6;
      tiltOffsetDeg = (globalEmotion === 'curious' ? -2.2 : 2.2) * shrugEnv;
      browBoost = shrugEnv * 0.20;
    }
  }

  return {
    activeTag,
    activeLabel,
    nodOffsetPx,
    turnOffsetPx,
    tiltOffsetDeg,
    leftShoulderLiftDy,
    rightShoulderLiftDy,
    collarLiftDy,
    torsoSwayDx,
    browBoost,
    furrowBoost,
    smileBoost,
  };
}
