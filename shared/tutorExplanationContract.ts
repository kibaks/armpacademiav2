/** A pedagogical example must not turn invented quantities into apparent facts. */
export function explanationReview(prompt: string, reply: string): 'label' | 'quantities' | null {
  let question: string;
  try { const data=JSON.parse(prompt.slice(prompt.indexOf('{'))); question=typeof data.question==='string'?data.question:''; } catch { return null; }
  if (!/expliqu|comment|pourquoi|comprendre|différence|exemple/i.test(question)) return null;
  const example=/exemple ficti[fv][^:]*:\s*([\s\S]*?)(?=\n\s*\n|(?:Le point à vérifier|En pratique|Le bon réflexe|Vérifiez)\b|$)/i.exec(reply);
  if (/exemple/i.test(question) && !example) return 'label';
  if (!example || /\d|chiffr[ée]|calcul|combien/i.test(question)) return null;
  const inventedQuantity=/\d|\b(?:deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt|trente|cent)\s+(?:tables?|chaises?|salles?|semaines?|jours?|mois|places?|écoles?)\b/i;
  return inventedQuantity.test(example[1])?'quantities':null;
}
export const EXPLANATION_REVISION_POLICY = `Révision pédagogique : produis une nouvelle réponse complète, simple et qualitative. Si la question demande un exemple, introduis-le littéralement par « Exemple fictif : ». Décris une situation, son usage et les caractéristiques à préciser. N’ajoute ni quantité, ni mesure, ni durée, ni montant. Le paragraphe de l’exemple ne contient aucun chiffre. Par exemple, pour le mobilier d’une école : « Exemple fictif : une école décrit des tables adaptées à ses élèves et à ses salles. Elle précise les caractéristiques utiles et les conditions de livraison à définir. » Adapte le sujet de cette illustration à la question, puis donne un seul point à vérifier. Ne présente pas cette illustration comme une règle juridique.`;
