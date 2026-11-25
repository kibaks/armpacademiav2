/** Vocabulary aid only: these expansions do not establish a legal obligation. */
export const PROCUREMENT_ACRONYMS: Record<string, string> = {
  ARMP: 'Autorité de régulation des marchés publics',
  DGCMP: 'Direction générale du contrôle des marchés publics',
  CGPMP: 'Cellule de gestion des projets et des marchés publics',
  DAO: 'Dossier d’appel d’offres',
  PPM: 'Plan de passation des marchés',
  ANO: 'Avis de non-objection',
  AAO: 'Avis d’appel d’offres',
  CRD: 'Comité de règlement des différends',
  PV: 'Procès-verbal',
  PRM: 'Personne responsable des marchés publics',
  DPAO: 'Données particulières de l’appel d’offres',
  BPU: 'Bordereau des prix unitaires',
  DQE: 'Détail quantitatif et estimatif',
};

export function normalizeTutorQuestion(question: string): string {
  return question.normalize('NFC').trim()
    .replace(/\b(?:bjr|bjour)\b/gi, 'bonjour')
    .replace(/\bbsr\b/gi, 'bonsoir')
    .replace(/\bslt\b/gi, 'salut')
    .replace(/\b(?:svp|stp)\b/gi, 's’il vous plaît')
    .replace(/\bc\s+(?:koi|quoi)\b/gi, 'c’est quoi')
    .replace(/\b(?:kesk[e]?|keske)\s+c\b/gi, 'qu’est-ce que')
    .replace(new RegExp('\\b(?:' + Object.keys(PROCUREMENT_ACRONYMS).map(key => key.split('').join('\\s*\\.\\s*')).join('|') + ')\\.?', 'gi'), token => token.replace(/[^a-z]/gi, '').toUpperCase())
    .replace(new RegExp('\\b(' + Object.keys(PROCUREMENT_ACRONYMS).join('|') + ')\\b', 'gi'), token => token.toUpperCase());
}

export function questionAcronyms(question: string) {
  const found = normalizeTutorQuestion(question).match(new RegExp('\\b(?:' + Object.keys(PROCUREMENT_ACRONYMS).join('|') + ')\\b', 'g')) || [];
  return Object.fromEntries([...new Set(found)].map(key => [key, PROCUREMENT_ACRONYMS[key]]));
}

/** Keep previous user questions only for an actual referential follow-up. */
export function tutorRetrievalQuery(question: string, history: unknown): string {
  const normalized = normalizeTutorQuestion(question);
  const referential = /^(?:et\b|pourquoi\s*\?|comment\s*\?|un\s+exemple\s*\?|(?:donne|donnez|montre|montrez).{0,15}exemple|précise|détaille|continue|dans ce cas|cela|ça\b)/i.test(normalized)
    || /\b(?:ce cas|cette procédure|ce délai|cela|ça veut dire)\b/i.test(normalized);
  const previous = referential && Array.isArray(history)
    ? history.filter(h => h && h.sender === 'user' && typeof h.text === 'string' && h.text !== question).slice(-2).map(h => normalizeTutorQuestion(h.text).slice(0, 500)).join(' ')
    : '';
  const expanded = Object.entries(questionAcronyms(normalized)).map(([key, value]) => `${key} ${value}`).join(' ');
  return [previous, normalized, expanded].filter(Boolean).join(' ');
}

/** Exact lexical requests bypass inference; questions about rules never do. */
export function quickAcronymReply(question: string): string | null {
  const normalized = normalizeTutorQuestion(question);
  const acronyms = questionAcronyms(normalized);
  // PV is ambiguous outside a procurement document: let the tutor clarify it.
  if (!Object.keys(acronyms).length || 'PV' in acronyms) return null;
  const rest = normalized.toLowerCase()
    .replace(new RegExp('\\b(?:' + Object.keys(PROCUREMENT_ACRONYMS).join('|') + ')\\b', 'gi'), '')
    .replace(/s’il vous plaît|s'il vous plaît|qu’est-ce que|qu'est-ce que|c’est|c'est/g, '')
    .replace(/\b(?:bonjour|bonsoir|salut|merci|que|quoi|signifie|signifient|veut|veulent|dire|définition|sigle|sigles|abréviation|abréviations|le|la|les|du|de|des|un|une|et|est)\b/g, '')
    .replace(/[\s?'’.,:;!()\-]/g, '');
  if (rest) return null;
  return Object.entries(acronyms).map(([key, value]) => `${key} signifie « ${value} ».`).join('\n\n');
}
