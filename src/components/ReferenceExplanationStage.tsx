import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Volume2 } from 'lucide-react';
import { explanationStoryboard, explanationShotAt, explanationSpokenShot, explanationConcepts } from '../utils/explanationStoryboard';
import { lessonDisplayHeading } from '../utils/lessonEssentialSummary';
import { ExplanationEvidenceVisual } from './ExplanationEvidenceVisual';
import './ReferenceExplanationStage.css';

export function ReferenceExplanationStage({ title, text, spokenText, progress, still = false, children, onListen, caption, label }: {
  title: string; text: string; spokenText?: string; progress?: number; still?: boolean;
  children?: React.ReactNode; onListen?: () => void; caption?: string; label?: string;
}) {
  const reduceMotion=useReducedMotion();
  const shots=useMemo(()=>explanationStoryboard(text),[text]);
  const [manualIndex,setManualIndex]=useState(0);
  const spokenIndex=spokenText ? explanationSpokenShot(shots,spokenText) : -1;
  const index=typeof progress==='number'?explanationShotAt(shots,progress):spokenIndex>=0?spokenIndex:Math.min(manualIndex,Math.max(0,shots.length-1));
  useEffect(()=>{ if(spokenIndex>=0) setManualIndex(spokenIndex); },[spokenIndex]);
  const shot=shots[index];
  if (!shot) return null;
  const terms=explanationConcepts(shot.text);
  const staticMotion=Boolean(reduceMotion||still);
  const heading=lessonDisplayHeading(title,terms.join(' · '));
  return <section className={'reference-explanation reference-explanation--'+(index%3)} aria-label={'Explication animée : '+title}>
    <header className="reference-explanation__heading"><span>ACADEMIA · COMPRENDRE EN IMAGES</span><h3>{heading}</h3></header>
    <AnimatePresence initial={false} mode="wait">
      <motion.div className="reference-explanation__scene" key={shot.start+':'+text} initial={staticMotion?false:{opacity:0,scale:.97,y:10}} animate={{opacity:1,scale:1,y:0}} exit={staticMotion?undefined:{opacity:0,scale:1.015,y:-7}} transition={{duration:staticMotion?0:.24}}>
        <div className="reference-explanation__window">
          <div className="reference-explanation__window-bar" aria-hidden="true"><i/><i/><i/><span>Le repère visuel</span></div>
          <div className="reference-explanation__illustration">{children || <ExplanationEvidenceVisual title={title} text={shot.text} still={staticMotion}/>}</div>
        </div>
        <div className="reference-explanation__callout"><span className="reference-explanation__number">{String(index+1).padStart(2,'0')}</span><div><span className="reference-explanation__label">{label || shot.label}</span><p>{caption || shot.text}</p></div></div>
      </motion.div>
    </AnimatePresence>
    <footer className="reference-explanation__controls">
      {typeof progress!=='number' && <button type="button" aria-label="Scène précédente" disabled={index===0 || Boolean(spokenText)} onClick={()=>setManualIndex(index-1)}><ArrowLeft size={16}/></button>}
      <span>{String(index+1).padStart(2,'0')} <span>/ {String(shots.length).padStart(2,'0')}</span></span>
      <div className="reference-explanation__track" aria-hidden="true"><i style={{transform:`scaleX(${(index+1)/shots.length})`}}/></div>
      {typeof progress!=='number' && <button type="button" aria-label="Scène suivante" disabled={index===shots.length-1 || Boolean(spokenText)} onClick={()=>setManualIndex(index+1)}><ArrowRight size={16}/></button>}
      {onListen && <button type="button" className="reference-explanation__listen" onClick={onListen}><Volume2 size={16}/>Écouter</button>}
    </footer>
    {typeof progress!=='number' && <details className="reference-explanation__transcript"><summary><BookOpen size={14}/>Lire l’explication complète</summary><p>{text}</p></details>}
  </section>;
}
