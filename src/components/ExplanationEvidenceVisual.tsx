import React from 'react';
import { motion } from 'motion/react';
import { explanationConcepts } from '../utils/explanationStoryboard';
import { LessonContextIllustration } from './LessonContextIllustration';

/** Concrete examples are illustrations, never evidence that a real task was done. */
export function ExplanationEvidenceVisual({ text, title, still, progress = 1, narrationProgress = .6 }: {text:string;title:string;still:boolean;progress?:number;narrationProgress?:number}) {
  const school=/école|salles|scolair/i.test(text) && /tables|bancs|mobilier/i.test(text);
  const specifications=/quantités|dimensions|caractéristiques/i.test(text) && /décri|prévu|défin|pièces|dossier/i.test(text);
  const terms=explanationConcepts(text);
  const entrance=(i:number)=>({initial:still?false as const:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:still?0:.3,delay:still?0:i*.1}});
  if (!school && !specifications) return <LessonContextIllustration topic={title} narration={text} narrationProgress={narrationProgress} progress={progress} still={still} entrance labels={terms}/>;
  return <figure className="lesson-context-figure">
    <svg viewBox="0 0 640 330" role="img" aria-label={school?'Illustration d’un besoin de mobilier scolaire, sans quantité contractuelle représentée.':'Illustration des caractéristiques du besoin citées dans la réponse.'} fill="none" stroke="#214b80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {school ? <>
        <rect x="105" y="28" width="430" height="245" rx="16" fill="#fff" stroke="#cadcec"/>
        <motion.g {...entrance(0)}><rect x="235" y="55" width="200" height="77" rx="5" fill="#173d58"/><path d="M260 82h105m-105 23h145" stroke="#b9e8f5" strokeWidth="5"/></motion.g>
        <rect x="130" y="57" width="60" height="80" rx="4" fill="#e1f2f9"/><path d="M160 57v80m-30-40h60" stroke="#aac7de"/>
        {[170,350].map((x,i)=><motion.g key={x} {...entrance(i+1)}><path d={`M${x} 198h125v18H${x}Z`} fill="#e9bb68"/><path d={`M${x+12} 216v36m101-36v36`} strokeWidth="7"/><path d={`M${x+28} 265h68m-58 0v28m49-28v28`} strokeWidth="7"/></motion.g>)}
      </> : <>
        <motion.g {...entrance(0)}><rect x="135" y="22" width="370" height="275" rx="14" fill="#fff"/><path d="M170 63h230" stroke="#d9e7f5" strokeWidth="15"/></motion.g>
        {terms.map((term,i)=><motion.g key={term} {...entrance(i+1)}><circle cx="185" cy={112+i*57} r="15" fill={i===0?'#e9bb68':'#e4eff9'} stroke="none"/><text x="218" y={120+i*57} fontSize="21" fill="#214b80" stroke="none">{term}</text><path d={`M218 ${134+i*57}h180`} stroke="#d9e7f5" strokeWidth="7"/></motion.g>)}
      </>}
    </svg>
    <figcaption>{school?'Le mobilier, son usage et les caractéristiques attendues':'Les éléments explicitement cités dans l’explication'}</figcaption>
    {terms.length>0 && <ul aria-label="Repères illustrés">{terms.map(term=><li key={term}>{term}</li>)}</ul>}
  </figure>;
}
