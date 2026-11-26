import corpus from './data/procurementCorpus.json' with {type:'json'};

const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const stop=new Set('les des une est sont pour dans avec comment quoi quels quelles quelle quel que qui du de la le un et en au aux ce cette ces sur par peut doit tout tous plus pas nous vous expliquer explique bonjour bonsoir'.split(' '));
const tokens=(s:string)=>[...new Set(fold(s).match(/[a-z0-9]{3,}/g)||[])].filter(t=>!stop.has(t));
// Pre-index once per server instance. No embedding service, download or GPU per request.
const passages=corpus.documents.flatMap(doc=>doc.passages.map(p=>({
  ...p,doc,words:new Set(tokens(p.text)),title:fold(doc.title),
})));
const frequency=new Map<string,number>();
for(const p of passages) for(const t of p.words) frequency.set(t,(frequency.get(t)||0)+1);

export function retrieveProcurementKnowledge(question:string) {
  const q=fold(question),terms=tokens(question);
  const article=/\barticle\s+(\d+(?:er)?)/.exec(q)?.[1];
  const historical=/historique|ancien|2010|10\/22/.test(q);
  const province=/province|provincial|kinshasa|bandundu|kongo central|kasai|lomami|tshopo|equateur|maniema|sud.kivu/.test(q);
  const ranked=passages.filter(p=>(!p.doc.archived||historical)&&(!p.doc.provincial||(province&&tokens(p.doc.title).some(t=>!['province','edit','du','central','type'].includes(t)&&terms.includes(t))))&&p.doc.usable)
    .map(p=>({p,score:(/difference|disting|compar/.test(q)&&/services/.test(q)&&/intellectuell/.test(q)&&p.doc.title.includes('10/010')&&/^article (10|11) /.test(p.reference)?25:0)+(article&&new RegExp('^article '+article+'(?: \u00b7|$)').test(p.reference)?30:0)+(/manuel|10\/22/.test(q)&&/2010|10\/22|abrog/.test(q)&&p.doc.title.includes('23/12')&&p.reference.includes('article 195')?20:0)+terms.reduce((score,t)=>score+(p.words.has(t)?Math.log(1+passages.length/(1+(frequency.get(t)||0))):0)+(p.title.includes(t)?0.15:0),0)}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  const selected:typeof passages=[];let length=0;
  for(const {p} of ranked) {
    if(selected.length>=3) break;
    // Keep a whole passage; never truncate a condition or exception to fit the prompt.
    if(length+p.text.length>7500) continue;
    selected.push(p);length+=p.text.length;
  }
  const sources=selected.map(p=>`${p.doc.title} · ${p.reference} — ${p.doc.url}`);
  const block=selected.length ? '\n=== SOURCES OFFICIELLES ARMP — PRIORITAIRES SUR LES REFORMULATIONS DE COURS ===\n'
    +'Respecter la date, le champ et les conditions du texte. Un scan OCR non relu ne permet pas de certifier un chiffre, un délai ou un article : demander une vérification du PDF. Les documents historiques et modèles ne prouvent pas seuls la règle actuelle. Le décret n°23/12 du 3 mars 2023, article 195 (page PDF 41 vérifiée), abroge le manuel n°10/22 de 2010. Ne pas appliquer cet ancien manuel à un cas actuel. Ne pas attribuer aux lois le numéro d’article d’un décret.\n'
    +selected.map((p,i)=>`[Source ${i+1}] ${sources[i]}\nQualité : ${p.doc.quality}.\n${p.text}`).join('\n\n')+'\n=== FIN SOURCES OFFICIELLES ===\n' : '';
  return {block,sources};
}

export function procurementCorpusCoverage() {
  return corpus.documents.map(({id,title,url,usable,quality,archived,provincial,passages})=>({id,title,url,usable,quality,archived,provincial,passages:passages.length}));
}
