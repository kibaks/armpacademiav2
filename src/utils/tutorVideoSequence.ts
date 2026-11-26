/** Sentence boundaries first; every word and punctuation mark stays in the narration. */
export function splitTutorVideoText(text: string): string[] {
  const normalized=text.trim();
  if(normalized.length<=420) return [normalized];
  const sentences=Array.from(new Intl.Segmenter('fr',{granularity:'sentence'}).segment(normalized),s=>s.segment.trim()).filter(Boolean);
  const parts:string[]=[];let part='';
  for(const sentence of sentences) {
    const limit=parts.length?480:280;
    if(part && part.length+sentence.length+1>limit) {parts.push(part);part='';}
    // A very long sentence still cannot exceed the worker's input limit.
    if(sentence.length>900) {
      if(part){parts.push(part);part='';}
      for(const word of sentence.split(/\s+/)) {
        if(part && part.length+word.length+1>480){parts.push(part);part='';}
        part+=(part?' ':'')+word;
      }
    } else part+=(part?' ':'')+sentence;
  }
  if(part) parts.push(part);
  return parts;
}

/** One current segment and one lookahead. Prefetch failures surface at the boundary. */
export function createTutorVideoSequence<T>(parts:string[],prepare:(text:string,index:number)=>Promise<T>) {
  let index=0;
  const pending=new Map<number,Promise<T>>(),ready=new Set<number>();
  const load=(n:number)=>{
    let job=pending.get(n);
    if(!job){job=prepare(parts[n],n).then(value=>{ready.add(n);return value;}).catch(error=>{pending.delete(n);throw error;});pending.set(n,job);}
    return job;
  };
  return {
    get index(){return index;},
    get total(){return parts.length;},
    isReady:(n:number)=>ready.has(n),
    load:()=>load(index),
    prefetch:()=>{if(index+1<parts.length)void load(index+1).catch(()=>{});},
    advance:()=>{
      if(index+1>=parts.length)return null;
      pending.delete(index);ready.delete(index);index++;
      return load(index);
    },
  };
}
