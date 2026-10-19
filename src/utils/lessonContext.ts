import { lessonVisualKind } from './lessonVisualKind';
const contexts = [
  [/garanti|caution/i, 'definition', ['Engagement protégé','Instrument de garantie','Conditions applicables'], 'Quel engagement la garantie protège-t-elle ?'],
  [/avenant|modification|résiliation|pénalité/i, 'comparison', ['Clause du contrat','Fait constaté','Suite à justifier'], 'Que prévoit le contrat dans cette situation ?'],
  [/exécution|chantier|suivi contractuel/i, 'comparison', ['Engagement prévu','Réalisation observée','Écart à traiter'], 'La réalisation correspond-elle au contrat ?'],
  [/acteur|rôle|responsabil|cgpmp|intervenant/i, 'roles', ['Autorité contractante','Service de contrôle','Régulation'], 'Qui intervient, et dans quelle limite ?'],
  [/allotissement|fractionnement/i, 'comparison', ['Besoin global','Lots cohérents','Justification'], 'Comment organiser cet achat ?'],
  [/critère|évalu|notation|comparaison des offres/i, 'comparison', ['Critère annoncé','Élément de l’offre','Constat justifié'], 'Sur quelle preuve repose la comparaison ?'],
  [/réception|livraison|réserve|conformité/i, 'comparison', ['Prestation attendue','Prestation livrée','Écart constaté'], 'Qu’a-t-on réellement reçu ?'],
  [/prix|chiffrage|bpu|dqe|coût/i, 'definition', ['Quantités','Prix unitaires','Charges prévues'], 'Que couvre le prix proposé ?'],
  [/paiement|acompte|avance|décompte/i, 'definition', ['Fondement','Pièces justificatives','Montant demandé'], 'Qu’est-ce qui justifie la somme demandée ?'],
  [/recours|réclamation|litige|contentieux/i, 'definition', ['Décision contestée','Faits et pièces','Conditions du recours'], 'Que conteste-t-on, et pour quelle raison ?'],
  [/audit|traçabilité|archiv|contrôle/i, 'definition', ['Pièce conservée','Constat vérifiable','Conclusion motivée'], 'Peut-on reconstituer la décision ?'],
  [/conflit|corruption|collusion|intérêts/i, 'comparison', ['Intérêt personnel','Décision publique','Risque à traiter'], 'Quel lien peut affecter l’impartialité ?'],
  [/planif|calendrier|ppm|cycle|démarrage|clôtur/i, 'timeline', ['Préparer','Organiser','Suivre'], 'Comment articuler les étapes ?'],
  [/besoin|usager|spécification|cahier des charges/i, 'definition', ['Usage attendu','Caractéristiques','Vérification'], 'À quel usage la prestation doit-elle répondre ?'],
  [/numérique|dématérial|sigmap|électronique/i, 'definition', ['Accès sécurisé','Intégrité','Trace des échanges'], 'Comment conserver une information fiable ?'],
  [/consultant|tdr|expertise|intellectuelle/i, 'definition', ['Mission','Résultat attendu','Livrable'], 'Quel résultat attend-on de la mission ?'],
] as const;
export function lessonContext(title: string, explanation: string, scene: number, authoredLabel?: string): { kind: ReturnType<typeof lessonVisualKind>; terms: string[]; question: string } {
  const context = contexts.find(c => c[0].test(title)) || contexts.find(c => c[0].test(explanation));
  const base = lessonVisualKind(title, scene, authoredLabel);
  // Preserve the function of examples, questions and summaries.
  const kind = base === 'case' || base === 'practice' || base === 'summary' ? base : context?.[1] || base;
  return {kind, terms: context ? [...context[2]] : [], question: context?.[3] || 'Comment appliquer cette notion à la situation présentée ?'};
}
