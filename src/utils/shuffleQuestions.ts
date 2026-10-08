/**
 * Aléatorisation des questions de test de niveau :
 * - mélange l'ordre des questions (Fisher–Yates)
 * - mélange les options de chaque question en réaffectant l'indice
 *   de la bonne réponse sur le BON texte d'option (aucune triche possible
 *   à partir de la position).
 */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface QuestionWithOptions {
  options: string[];
  correctIndex: number;
}

export function randomizeQuestions<T extends QuestionWithOptions>(questions: T[]): T[] {
  return shuffle(questions).map((q) => {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.correctIndex == null) {
      return { ...q };
    }
    const correctIndexClamped = Math.min(Math.max(0, q.correctIndex), q.options.length - 1);
    const correctText = q.options[correctIndexClamped];
    const options = shuffle(q.options);
    const idx = options.indexOf(correctText);
    return {
      ...q,
      options,
      correctIndex: idx < 0 ? correctIndexClamped : idx,
    };
  });
}
