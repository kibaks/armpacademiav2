/** Source-backed nouns, in reading order, never generated actions or obligations. */
export function lessonConceptLabels(text: string, fallback: string): string[] {
 const source = text.toLocaleLowerCase('fr');
 const concepts = ['autorité contractante','marché public','soumissionnaire','attributaire','titulaire','parties','prestation','prix','besoin','contrat','engagement','entreprise','offres','concurrence','égalité','transparence','dossier','document','procédure','crédits budgétaires','budget','critères','livraison','réception','paiement','contrôle','travaux','fournitures','services','candidat','autorisation','traçabilité','CGPMP','DGCMP','ARMP','SIGMAP'];
 const matches = concepts.map(label => ({label, index: source.indexOf(label.toLocaleLowerCase('fr'))})).filter(item => item.index >= 0).sort((a,b) => a.index-b.index);
 return matches.length ? matches.slice(0,3).map(item => item.label) : [fallback];
}
