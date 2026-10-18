// Keep whole sentences: never discard a negation or a legal condition to fit a caption.
export function compactLessonPhrases(text: string, fallback = 'Reliez la notion aux faits et aux conditions du dossier.'): string[] {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const selected = sentences.map(s => s.trim()).filter(s => {
    const words = s.split(/\s+/).length;
    return words >= 4 && words <= 24 && s.length <= 185 && !/reformule le texte|référence du chapitre/i.test(s);
  });
  return [...new Set(selected)].slice(0, 3).length ? [...new Set(selected)].slice(0, 3) : [fallback];
}
export function motionCaptionAt(phrases: readonly string[], progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(.999999, progress)) : 0;
  const index = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
  return { index: Math.max(0, index), text: phrases[index] || '', progress: p * Math.max(1, phrases.length) - Math.max(0, index) };
}

// Neutral teaching summaries: no invented amounts, deadlines or legal exceptions.
const topics: [RegExp, string][] = [
  [/besoin|usager|utilisateur/i, 'Le besoin se définit à partir de l’usage attendu.'],
  [/financ|crédit|budgét/i, 'Le besoin doit être rapproché des conditions de financement.'],
  [/ppm|planification|calendrier|plan de passation/i, 'Le calendrier relie les étapes de préparation et de réalisation.'],
  [/publicit|publi|avis/i, 'L’information permet aux entreprises de préparer leur participation.'],
  [/alloti|\blots?\b/i, 'L’allotissement répartit l’achat en plusieurs lots.'],
  [/spécification|technique|cahier des charges/i, 'Les caractéristiques attendues doivent pouvoir être comprises et vérifiées.'],
  [/dossier|dao|formulaire|soumission/i, 'Les pièces du dossier doivent rester cohérentes entre elles.'],
  [/critère|évalu|compar|notation/i, 'L’analyse relie chaque constat aux critères annoncés.'],
  [/garanti|caution/i, 'Une garantie se comprend à partir de l’engagement qu’elle protège.'],
  [/avenant|modification/i, 'Modifier un contrat suppose d’examiner les conditions applicables.'],
  [/prix|chiffrage|coût|bpu|dqe/i, 'Le prix se lit avec les prestations et les charges qu’il couvre.'],
  [/réception|livraison|conformité/i, 'La réception confronte les prestations aux engagements contractuels.'],
  [/paiement|acompte|avance|décompte/i, 'Le paiement se justifie par son fondement et les pièces requises.'],
  [/recours|réclamation|contentieux|litige|crd/i, 'La contestation doit être rattachée aux faits et à la décision concernée.'],
  [/audit|contrôle|inspection/i, 'Le contrôle s’appuie sur des pièces et des constats vérifiables.'],
  [/conflit|intérêt|éthique|fraude|collusion|corruption/i, 'L’impartialité exige d’identifier les intérêts en présence.'],
  [/archiv|traçabilité|document/i, 'Les écrits permettent de reconstituer le raisonnement du dossier.'],
  [/acteur|rôle|responsab|cgpmp|autorité/i, 'Les intervenants exercent des responsabilités distinctes.'],
  [/sigmap|numéri|électron|dématérial|crypt/i, 'Le support numérique doit préserver la sécurité et la traçabilité.'],
  [/consultant|intellectuel|tdr|étude|expert/i, 'Une mission d’expertise se comprend par les résultats attendus.'],
  [/groupement|partenariat|sous.trait|pme/i, 'Distinguez les engagements propres à chaque entreprise participante.'],
  [/exécution|chantier|travaux|maîtrise/i, 'Le suivi compare les réalisations aux engagements du contrat.'],
  [/procédure|appel d.offres|gré à gré|concurrence/i, 'La procédure doit être examinée dans les conditions du dossier.'],
  [/compétence|appren|pédagog|formation|certifi/i, 'Comprendre le raisonnement permet de justifier sa réponse.'],
  [/sanction|exclusion|irrégularité/i, 'La qualification d’un manquement suppose d’établir les faits.'],
];
export function contextualLessonPhrases(title: string, text: string, fallback?: string) {
  const exact = compactLessonPhrases(text, '');
  if (exact[0]) return exact;
  if (fallback) return [fallback];
  const matches = topics.map(([pattern, phrase]) => ({ phrase, score: (pattern.test(title) ? 6 : 0) + (pattern.test(text) ? 1 : 0) })).filter(t => t.score > 0).sort((a,b) => b.score-a.score);
  return matches.length ? matches.slice(0,2).map(t => t.phrase) : ['Reliez la notion aux faits et aux conditions du dossier.'];
}
