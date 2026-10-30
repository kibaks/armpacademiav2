/** Slides keep complete source sentences: a condition or negation is never cut. */
export interface ExplanationShot { text: string; label: string; start: number; end: number }
export function explanationStoryboard(input: string): ExplanationShot[] {
  const text = input.replace(/\*\*/g, '').trim();
  if (!text) return [];
  const segments = [...new Intl.Segmenter('fr', { granularity: 'sentence' }).segment(text)];
  const groups: { text:string; start:number; end:number }[] = [];
  for (const segment of segments) {
    if (!segment.segment.trim()) continue;
    const prior = groups.at(-1);
    // Keep a short lead-in (e.g. “Exemple fictif :”) attached to its example.
    if (prior && /^(?:exemple fictif|en pratique|à retenir|bon réflexe|point de vigilance)[\s:!.]*$/i.test(prior.text.trim()) && prior.end === segment.index) {
      prior.text += segment.segment; prior.end = segment.index + segment.segment.length;
    } else groups.push({text:segment.segment, start:segment.index,end:segment.index+segment.segment.length});
  }
  return groups.map((s,i)=>({text:s.text.trim(),start:s.start/text.length,end:s.end/text.length,
    label:/exemple fictif|imaginons|par exemple|supposons/i.test(s.text)?'Un exemple pour comprendre':/ne permet pas|à vérifier|texte officiel|information manque|ne suffit pas/i.test(s.text)?'Le point de vigilance':/retenez|en pratique|bon réflexe|vérifiez/i.test(s.text)?'Le bon réflexe':i===0?'L’idée de départ':'Comprendre la suite'}));
}
export function explanationShotAt(shots: readonly ExplanationShot[], progress: number) {
  const p = Number.isFinite(progress) ? Math.max(0,Math.min(1,progress)) : 0;
  if (!shots.length) return 0;
  if (p===1) return shots.length-1;
  const index=shots.findIndex(s=>p<s.end);
  return index<0?shots.length-1:index;
}
export function explanationSpokenShot(shots: readonly ExplanationShot[], spoken: string) {
  const normalize=(s:string)=>s.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*#`_>]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('fr');
  const sentence=normalize(spoken);
  if (!sentence) return -1;
  return shots.findIndex(s=>normalize(s.text).includes(sentence)||sentence.includes(normalize(s.text)));
}

/** Only show concepts actually named in the sentence, never filler verbs. */
export function explanationConcepts(text: string): string[] {
  const vocabulary=['résultat attendu','caractéristiques','quantités','dimensions','livraison','besoin','besoins','dossier','pièces','critères','offres','comparaison','égalité','transparence','concurrence','traçabilité','crédits budgétaires','budget','délais','garantie','garanties','contrat','contrôle','réception','paiement','recours','évaluation','service utilisateur','entreprise','entreprises','documents','montant','ARMP','DGCMP','CGPMP','SIGMAP','caméra','voix','audio','vidéo','logiciel'];
  const source=text.toLocaleLowerCase('fr');
  return vocabulary.map(label=>({label,index:source.search(new RegExp('(?<![\\p{L}])'+label.toLocaleLowerCase('fr')+'(?![\\p{L}])','u'))})).filter(item=>item.index>=0).sort((a,b)=>a.index-b.index).slice(0,3).map(item=>item.label);
}
