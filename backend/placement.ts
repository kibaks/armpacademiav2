import { HttpError } from './http';
export const placementQuestions = [
        {
          id: 1,
          question: "Selon la Loi n° 10/010 du 27 avril 2010, quel organe est compétent pour le règlement non juridictionnel des litiges en matière de marchés publics en RDC ?",
          options: [
            "La Direction Générale du Contrôle des Marchés Publics (DGCMP)",
            "Le Comité de Règlement des Différends de l'ARMP (CRD)",
            "La Cellule de Gestion des Projets et des Marchés Publics (CGPMP)",
            "L'Inspection Générale des Finances (IGF)"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 78 & Décret n° 10/21"
        },
        {
          id: 2,
          question: "Quelle est l'obligation préalable imposée à toute autorité contractante avant de lancer un appel d'offres ?",
          options: [
            "Demander un prêt bancaire certifié",
            "Élaborer et faire approuver son Plan de Passation des Marchés (PPM)",
            "Publier les comptes de l'exercice précédent",
            "Nommer un médiateur international"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 14"
        },
        {
          id: 3,
          question: "Quel est le rôle principal de la DGCMP dans la commande publique congolaise ?",
          options: [
            "Réguler la formation des auditeurs privés",
            "Assurer le contrôle a priori des opérations de passation et autoriser les dérogations",
            "Attribuer directement les marchés aux soumissionnaires",
            "Rendre des jugements pénaux"
          ],
          correctIndex: 1,
          legalRef: "Décret n° 10/23, Art. 3"
        },
        {
          id: 4,
          question: "En cas de contestation des résultats de l'évaluation d'un appel d'offres, quel recours préalable le soumissionnaire doit-il exercer ?",
          options: [
            "Saisir immédiatement la Cour Constitutionnelle",
            "Exercer un recours gracieux devant la personne responsable des marchés de l'autorité contractante",
            "Publier un communiqué de presse d'annulation",
            "Saisir directement le Tribunal de Commerce"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 77"
        },
        {
          id: 5,
          question: "Quel principe fondamental garantit que tous les candidats qualifiés reçoivent les mêmes informations et opportunités ?",
          options: [
            "Le principe de confidentialité restreinte",
            "Le principe d'égalité de traitement des candidats",
            "Le principe de préférence géographique absolue",
            "Le principe d'arbitrage tacite"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 5"
        }
      ];
export function gradePlacement(answers: unknown) {
  if (!Array.isArray(answers) || answers.length !== placementQuestions.length) throw new HttpError(400, 'Réponses incomplètes.');
  const ids = new Set();
  let correct = 0;
  for (const answer of answers) {
    const question = placementQuestions.find(q => q.id === answer?.questionId);
    if (!question || ids.has(question.id) || !Number.isInteger(answer.pickedIndex) || answer.pickedIndex < 0 || answer.pickedIndex >= question.options.length) throw new HttpError(400, 'Réponses invalides.');
    ids.add(question.id);
    if (question.correctIndex === answer.pickedIndex) correct++;
  }
  return { correct, score: Math.round(correct / placementQuestions.length * 100) };
}
