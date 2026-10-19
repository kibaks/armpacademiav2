export type VisualSubject = 'categories' | 'lots' | 'matrix' | 'delivery' | 'shield' | 'ledger' | 'balance' | 'inspection' | 'calendar' | 'people' | 'digital' | 'target' | 'contract' | 'notice' | 'book';
const subjects: Record<VisualSubject, readonly [string, RegExp][]> = {
  categories: [['Travaux', /travaux|route|bâtiment/giu], ['Fournitures', /fourniture|ordinateur|matériel/giu], ['Services', /service|formation|prestation intellectuelle/giu]],
  lots: [['Besoin global', /besoin|ensemble|achat/giu], ['Organisation des lots', /\blots?\b|alloti|tronçon/giu], ['Justification', /justifi|fractionnement|contourn/giu]],
  matrix: [['Critères annoncés', /critère|exigence|grille/giu], ['Éléments des offres', /offre|pièce|preuve|proposition/giu], ['Analyse motivée', /constat|compar|conclu|classement|analyse/giu]],
  delivery: [['Commande', /contrat|commande|attendu|caractéristique/giu], ['Livraison', /livr|fourni|présence|quantité/giu], ['Contrôle de conformité', /vérifi|conform|réception|écart|défaut|réserve/giu]],
  shield: [['Engagement', /engagement|contrat|obligation/giu], ['Garantie', /garanti|caution|protèg|protég/giu], ['Conditions de mobilisation', /condition|mobilis|défaill|libér/giu]],
  ledger: [['Prestations et charges', /prestation|quantité|charge|personnel|produit/giu], ['Montants à rapprocher', /montant|prix|coût|facture|financ|crédit/giu], ['Vérification du calcul', /calcul|total|vérifi|justifi|rapproch/giu]],
  balance: [['Faits', /fait|décision|constat/giu], ['Pièces et arguments', /pièce|preuve|argument|réclamation|intérêt/giu], ['Examen impartial', /examen|impartial|recours|condition|délai/giu]],
  inspection: [['Pièces du dossier', /pièce|dossier|document|version/giu], ['Examen', /examen|analys|vérifi|contrôl|cherch/giu], ['Constat documenté', /constat|conclu|trace|justifi|rapport/giu]],
  calendar: [['Préparation', /prépar|étude|besoin|planif/giu], ['Consultation', /consult|procédure|offre|évalu/giu], ['Réalisation', /réalis|exécut|livr|suivi|réception/giu]],
  people: [['Expression du besoin', /utilisateur|usager|exprime|décrit|citoyen/giu], ['Préparation et décision', /autorité|passation|prépare|décide|signature/giu], ['Contrôle et régulation', /contrôle|régulation|régulat|compéten|délégation/giu]],
  digital: [['Information', /information|document|donnée|offre/giu], ['Sécurité', /sécur|accès|crypt|intégrité/giu], ['Traçabilité', /trace|traçabilité|échange|horodat/giu]],
  target: [['Usage attendu', /usage|besoin|utilisateur|fonction/giu], ['Caractéristiques', /caractéristique|performance|quantité|spécification/giu], ['Vérification', /vérifi|mesur|critère|test/giu]],
  contract: [['Engagements écrits', /engagement|clause|contrat|écrit/giu], ['Exécution', /exécut|démarr|travaux|prestation|retard/giu], ['Formalités', /approb|autoris|sign|avenant|résili|modif/giu]],
  notice: [['Information à diffuser', /information|avis|objet|publicité/giu], ['Accès des candidats', /candidat|entreprise|accès|particip/giu], ['Communication commune', /commun|réponse|précision|égalité|diffus/giu]],
  book: [['Notion', /notion|définit|signifi/giu], ['Exemple', /exemple|cas|situation/giu], ['Raisonnement', /compren|disting|expliq|raison/giu]],
};

export function lessonVisualFocus(type: VisualSubject, sentence: string, progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const cursor = p * sentence.length;
  const mentions = subjects[type].flatMap(([label, pattern], index) =>
    [...sentence.matchAll(new RegExp(pattern.source, pattern.flags))].map(match => ({ index, label, at: match.index }))
  ).sort((a,b) => a.at - b.at);
  const active = mentions.filter(mention => mention.at <= cursor).at(-1);
  const caution = /(?:^|[^\p{L}])(?:ne\s|n[’']|pas\b|sans\b|si\b)|défaut|écart|risque|irrégul|retard|condition|doit|suppose/iu.test(sentence);
  const confirmed = !caution && /(?:est|sont|été)\s+(?:vérifié|validé|approuvé|conforme)/i.test(sentence);
  return { index: active?.index ?? -1, label: active?.label || '', caution, confirmed };
}
