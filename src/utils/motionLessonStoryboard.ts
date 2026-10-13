import type { SingleScreenCardData } from '../components/ProfessorFilmScenes';

const clamp = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
export const easeOutCubic = (value: number) => 1 - (1 - clamp(value)) ** 3;
export const motionWindow = (progress: number, from: number, to: number) => easeOutCubic((progress - from) / Math.max(.001, to - from));

// Pages preserve every word; long sentences continue in the next shot.
export function paginateLessonText(text: string, maxWords = 32): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const limit = Math.max(1, Math.floor(maxWords) || 32);
  const pages: string[] = [];
  let cursor = 0;
  while (cursor < words.length) {
    let end = Math.min(words.length, cursor + limit);
    while(end>cursor+1&&words.slice(cursor,end).join(' ').length>limit*10)end--;
    if (end < words.length) {
      for (let i = end - 1; i >= cursor + Math.max(3, Math.floor(limit * .25)) - 1; i--) {
        if (/[.!?;:]$/.test(words[i])) { end = i + 1; break; }
      }
    }
    pages.push(words.slice(cursor, end).join(' ')); cursor = end;
  }
  return pages.length ? pages : [''];
}
// Visual cues are concepts, never a shortened version of every spoken sentence.
// Only emit an action when its meaning is explicitly present in the source.
export function essentialLessonCues(text: string): string[] {
  const source = text.toLocaleLowerCase('fr');
  const cues: string[] = [];
  if (/citoyens|familles|communautés/.test(source)) cues.push('Les deniers publics servent les citoyens.');
  if (/égalité|même chance|mêmes chances/.test(source)) cues.push('Chaque entreprise doit avoir les mêmes chances.');
  if (!/ne[\s\S]{0,30}vérifi/.test(source) && /vérifi\w*[\s\S]{0,100}crédits budgétaires/.test(source)) cues.push('Vérifiez la disponibilité des crédits budgétaires.');
  if (/sans jamais imposer une marque|sans imposer une marque/.test(source)) cues.push('N’imposez pas de marque commerciale.');
  if (/besoins[\s\S]{0,50}neutre/.test(source)) cues.push('Décrivez vos besoins de manière neutre.');
  if (/document\w*[\s\S]{0,100}traçabilité/.test(source)) cues.push('Documentez les étapes pour assurer leur traçabilité.');
  if (/publi\w*[\s\S]{0,70}avis/.test(source)) cues.push('Publiez les avis pour informer les entreprises.');
  // A neutral concept is safer than cutting a sentence before its negation,
  // exception or legal condition. Narration and transcript retain those details.
  if (!cues.length) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const concise = sentences.map(sentence => sentence.trim()).filter(sentence => sentence.split(/\s+/).length >= 4 && sentence.split(/\s+/).length <= 18);
    if (concise.length) cues.push(...concise.slice(0, 2));
    else {
      const keywords = lessonKeywords(text);
      if (keywords.length) cues.push(`Retenez ces repères : ${keywords.join(', ')}.`);
    }
  }
  return [...new Set(cues)].slice(0, 3);
}
export function sampleLessonStoryboard(screen: SingleScreenCardData, progress: number, _maxWords = 32) {
  const p = clamp(progress);
  const introEnd = Math.max(.05, Math.min(.35, screen.explanationStartRatio || .12));
  const ruleStart = Math.max(introEnd + .1, Math.min(.95, screen.fieldRuleStartRatio || .75));
  const isRule = p >= ruleStart;
  const selected = essentialLessonCues(isRule ? screen.fieldRule : screen.explanation);
  const pages = selected.length ? selected : [isRule ? 'Le bon réflexe' : 'L’idée essentielle'];
  const start = isRule ? ruleStart : introEnd, end = isRule ? 1 : ruleStart;
  const sectionProgress = clamp((p - start) / (end - start));
  const lengths = pages.map(page => Math.max(1, page.split(/\s+/).filter(Boolean).length));
  const total = lengths.reduce((a,b) => a+b,0), position = sectionProgress * total;
  let before = 0, pageIndex = pages.length - 1;
  for (let i=0;i<pages.length;i++) {
    if (position < before + lengths[i] || i === pages.length - 1) { pageIndex=i; break; }
    before += lengths[i];
  }
  return { phase: isRule ? 'rule' as const : 'explanation' as const, text: pages[pageIndex], pageIndex, pageCount: pages.length, pageProgress: clamp((position-before)/lengths[pageIndex]), sectionProgress, titleReveal: motionWindow(p,0,.08), diagramReveal: motionWindow(p,.035,.22) };
}
export function lessonKeywords(text: string): string[] {
  const stop = new Set(['cette','chaque','leurs','notre','votre','toujours','jamais','avant','après','ainsi','comme','faire','entre','toutes','toute','lorsque','aussi','bien','elles','leurs','d’une','d’un','pour','dans','avec','sans','afin','doivent','doit','prendre','gardez','veillez','également']);
  const words: string[] = text.toLocaleLowerCase('fr').match(/[\p{L}’'-]+/gu) || [];
  const vocabulary=['transparence','égalité','crédits','budgétaires','cgpmp','dgcmp','armp','sigmap','contrôle','dossier','offres','garanties','traçabilité','besoins','planification','paiement','procédure','citoyens','éthique','contrat','délais','concurrence'];
  const preferred=vocabulary.filter(word=>words.includes(word));
  return [...new Set([...preferred,...words.filter(word => word.length >= 7 && word.length <= 22 && !stop.has(word))])].slice(0,3).map(word=>['cgpmp','dgcmp','armp','sigmap'].includes(word)?word.toUpperCase():word);
}

// Complete typing within the first half of the cue; leave time to read it.
export function typewriterCount(text: string, progress: number, reducedMotion = false): number {
  const length = Array.from(new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(text)).length;
  return reducedMotion ? length : Math.floor(length * clamp(progress / .5));
}
