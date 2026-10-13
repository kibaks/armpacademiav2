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
export function sampleLessonStoryboard(screen: SingleScreenCardData, progress: number, maxWords = 32) {
  const p = clamp(progress);
  const introEnd = Math.max(.05, Math.min(.35, screen.explanationStartRatio || .12));
  const ruleStart = Math.max(introEnd + .1, Math.min(.95, screen.fieldRuleStartRatio || .75));
  const isRule = p >= ruleStart;
  const pages = paginateLessonText(isRule ? screen.fieldRule : screen.explanation, maxWords);
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
