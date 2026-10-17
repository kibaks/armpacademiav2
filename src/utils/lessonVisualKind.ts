export function lessonVisualKind(title: string, scene: number, authoredLabel?: string) {
  if (authoredLabel) {
    if (/quiz|vérification|question/i.test(authoredLabel)) return 'practice';
    if (/bilan|synthèse|résumé/i.test(authoredLabel)) return 'summary';
    if (/cas|terrain|pratique/i.test(authoredLabel)) return 'case';
    // Advanced scene numbering has a different meaning: scene 2 is a rule.
    scene = /principe|règle/i.test(authoredLabel) ? 3 : 1;
  }
  if (scene === 2) return 'case';
  if (scene === 4) return 'practice';
  if (scene === 5) return 'summary';
  if (/disting|différen|compar|conformité|conflit/i.test(title)) return 'comparison';
  if (/acteur|responsab|interven|rôle|compéten/i.test(title)) return 'roles';
  if (/étape|chaîne|circuit|planif|déroul|calendrier|clôtur/i.test(title) && scene === 1) return 'timeline';
  return scene === 3 ? 'comparison' : 'definition';
}
