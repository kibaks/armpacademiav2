export type LearningStage = 'Initiation' | 'Approfondi' | 'Avancé';
export function validatedStage(attempts: any[]): LearningStage {
  const passed = attempts.filter(a => a?.passed === true);
  if (passed.some(a => a.level === 'Avancé')) return 'Avancé';
  return passed.some(a => ['Initiation', 'Approfondi'].includes(a.level)) ? 'Approfondi' : 'Initiation';
}
export function learnerLevelGuidance(stage: LearningStage) {
  return stage === 'Initiation'
    ? 'Niveau confirmé : Initiation. Explique les bases avec des mots simples, définis les termes nouveaux et donne une seule étape ou un exemple concret à la fois. Vérifie la compréhension sans supposer de connaissances préalables. Ne prétends pas que le niveau approfondi est déjà acquis.'
    : stage === 'Approfondi'
      ? 'Niveau confirmé : Approfondi. Appuie-toi sur les bases acquises, détaille les conditions d’application, les étapes et les erreurs fréquentes avec un cas réaliste lié au métier.'
      : 'Niveau confirmé : Avancé. Privilégie les cas complexes, les arbitrages, les limites et la justification des décisions, sans répéter les bases sauf demande.';
}

// Correct answers stay on the server; the browser submits option indexes only.
export const INITIATION_ASSESSMENT = [
  { question: 'Pourquoi définir le besoin avant de préparer un achat public ?', options: ['Pour choisir immédiatement un fournisseur', 'Pour préciser ce qui doit être acheté et pourquoi', 'Pour éviter toute mise en concurrence', 'Pour remplacer le budget'], answer: 1 },
  { question: 'Que signifie traiter les candidats de façon égale ?', options: ['Choisir toujours le candidat déjà connu', 'Changer les critères selon le candidat', 'Appliquer les mêmes règles annoncées à tous', 'Accepter seulement les entreprises locales'], answer: 2 },
  { question: 'À quoi sert un dossier d’appel d’offres ?', options: ['À présenter le besoin, les règles et les conditions de la consultation', 'À attribuer le marché avant la consultation', 'À supprimer l’évaluation', 'À garantir la victoire d’un candidat'], answer: 0 },
  { question: 'Comment comparer les offres de manière transparente ?', options: ['Avec les préférences personnelles de l’évaluateur', 'En modifiant les règles après réception', 'En demandant au candidat favori', 'Avec les critères annoncés dans le dossier'], answer: 3 },
  { question: 'Que faire si une règle ou une pièce essentielle manque dans un dossier ?', options: ['Inventer une règle plausible', 'Identifier l’information manquante et vérifier le document applicable', 'Ignorer la difficulté', 'Valider automatiquement'], answer: 1 },
];
export function gradeInitiation(answers: unknown) {
  if (!Array.isArray(answers) || answers.length !== INITIATION_ASSESSMENT.length || !answers.every(a => Number.isInteger(a) && a >= 0 && a < 4)) throw new Error('answers-invalid');
  const correct = INITIATION_ASSESSMENT.filter((q, i) => q.answer === answers[i]).length;
  return { correct, score: Math.round(correct * 100 / INITIATION_ASSESSMENT.length) };
}
