export type LearningStage = 'Initiation' | 'Approfondi' | 'Avancé';
export function validatedStage(attempts: any[]): LearningStage {
  const passed = attempts.filter(a => a?.passed === true);
  if (passed.some(a => a.level === 'Avancé')) return 'Avancé';
  return passed.some(a => ['Initiation', 'Approfondi'].includes(a.level)) ? 'Approfondi' : 'Initiation';
}
export function learnerLevelGuidance(stage: LearningStage) {
  return stage === 'Initiation'
    ? 'Niveau confirmé : Initiation. Explique les bases avec des mots simples, définis les termes nouveaux et donne une seule étape ou un exemple concret à la fois. Vérifie la compréhension sans supposer de connaissances préalables. Si la demande porte sur une notion approfondie ou un cas complexe, interpelle l’apprenant avec bienveillance : « Pour bien comprendre cette notion, terminez d’abord vos modules d’initiation, puis passez le test de niveau. » Donne seulement un repère introductif utile et propose de reprendre le module de base correspondant. Ne fournis pas un cours avancé ni une manière de contourner le parcours. Ne prétends jamais connaître les modules effectivement terminés sans preuve serveur. Ne prétends pas que le niveau approfondi est déjà acquis.'
    : stage === 'Approfondi'
      ? 'Niveau confirmé : Approfondi. Appuie-toi sur les bases acquises, détaille les conditions d’application, les étapes et les erreurs fréquentes avec un cas réaliste lié au métier.'
      : 'Niveau confirmé : Avancé. Privilégie les cas complexes, les arbitrages, les limites et la justification des décisions, sans répéter les bases sauf demande.';
}

// Explicit requests for a higher-level course are handled before any model call.
// A question defining a basic term remains available to beginners.
export function beginnerAdvancedRedirect(stage: LearningStage, question: string): string | null {
  if (stage !== 'Initiation') return null;
  const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!/\b(niveau|notions?|cours|modules?|formation|cas|analyse)\b.{0,45}\b(avance\w*|approfond\w*|complexe\w*|expert\w*)\b|\b(avance\w*|approfond\w*)\b.{0,25}\b(cours|modules?|notions?)\b/.test(text)) return null;
  return 'Votre niveau actuel est Initiation. Pour aborder ces notions avec de bonnes bases, terminez d’abord vos modules d’initiation, puis réussissez le test de niveau pour accéder au parcours approfondi. Je peux vous aider dès maintenant à comprendre une définition ou à reprendre le module de base lié à votre question. Quelle notion souhaitez-vous clarifier ?';
}

// Correct answers stay on the server; the browser submits option indexes only.
export const INITIATION_ASSESSMENT = [
  { question: 'Pourquoi définir le besoin avant de préparer un achat public ?', options: ['Pour choisir immédiatement un fournisseur', 'Pour préciser ce qui doit être acheté et pourquoi', 'Pour éviter toute mise en concurrence', 'Pour remplacer le budget'], answer: 1 },
  { question: 'Que signifie traiter les candidats de façon égale ?', options: ['Choisir toujours le candidat déjà connu', 'Changer les critères selon le candidat', 'Appliquer les mêmes règles annoncées à tous', 'Accepter seulement les entreprises locales'], answer: 2 },
  { question: 'À quoi sert un dossier d’appel d’offres ?', options: ['À présenter le besoin, les règles et les conditions de la consultation', 'À attribuer le marché avant la consultation', 'À supprimer l’évaluation', 'À garantir la victoire d’un candidat'], answer: 0 },
  { question: 'Comment comparer les offres de manière transparente ?', options: ['Avec les préférences personnelles de l’évaluateur', 'En modifiant les règles après réception', 'En demandant au candidat favori', 'Avec les critères annoncés dans le dossier'], answer: 3 },
  { question: 'Que faire si une règle ou une pièce essentielle manque dans un dossier ?', options: ['Inventer une règle plausible', 'Identifier l’information manquante et vérifier le document applicable', 'Ignorer la difficulté', 'Valider automatiquement'], answer: 1 },
  { question: 'Que doit inclure une estimation utile ?', options: ['Seulement un prix choisi au hasard', 'Seulement le prix affiché le plus bas', 'Les coûts pertinents, comme le transport, avec leurs sources', 'Uniquement les habitudes du service'], answer: 2 },
  { question: 'Comment vérifier la procédure adaptée à un achat ?', options: ['Examiner l’objet, l’estimation et les textes applicables à jour', 'Copier une ancienne procédure sans vérification', 'Demander au fournisseur préféré de décider', 'Supposer qu’une urgence suffit toujours à déroger'], answer: 0 },
  { question: 'Quel est le bon réflexe avant de déposer une offre ?', options: ['Modifier discrètement les exigences', 'Vérifier les pièces, les calculs et les modalités de dépôt du dossier', 'Oublier les frais de livraison', 'Se fier uniquement à une promesse orale'], answer: 1 },
  { question: 'Que signifie la lecture d’un prix lors de l’ouverture ?', options: ['Le contrat est déjà signé', 'Le candidat a automatiquement gagné', 'Un élément est constaté ; l’évaluation reste distincte', 'Le paiement est autorisé'], answer: 2 },
  { question: 'Que vérifier avant de commencer l’exécution ?', options: ['La pièce et les conditions autorisant effectivement le démarrage', 'La présence d’une rumeur d’attribution', 'Le seul fait d’avoir proposé le prix le plus bas', 'Une simple discussion informelle'], answer: 0 },
  { question: 'Comment traiter une livraison ?', options: ['Certifier sans regarder', 'Payer uniquement sur présentation d’une facture', 'Ignorer les défauts visibles', 'Comparer aux engagements et consigner les constats'], answer: 3 },
  { question: 'Que faire si un proche dirige une entreprise candidate ?', options: ['Cacher le lien', 'Favoriser discrètement son offre', 'Déclarer la situation et faire examiner la mesure appropriée', 'Détruire les pièces du dossier'], answer: 2 },
];
export function gradeInitiation(answers: unknown) {
  if (!Array.isArray(answers) || answers.length !== INITIATION_ASSESSMENT.length || !answers.every(a => Number.isInteger(a) && a >= 0 && a < 4)) throw new Error('answers-invalid');
  const correct = INITIATION_ASSESSMENT.filter((q, i) => q.answer === answers[i]).length;
  return { correct, score: Math.round(correct * 100 / INITIATION_ASSESSMENT.length) };
}
