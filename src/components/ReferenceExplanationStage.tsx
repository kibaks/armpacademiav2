import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Volume2, Play, Pause, RotateCcw } from 'lucide-react';
import { explanationStoryboard, explanationShotAt, explanationSpokenShot, explanationConcepts } from '../utils/explanationStoryboard';
import { lessonDisplayHeading } from '../utils/lessonEssentialSummary';
import { ExplanationEvidenceVisual } from './ExplanationEvidenceVisual';
import './ReferenceExplanationStage.css';

export function ReferenceExplanationStage({ title, text, spokenText, progress, still = false, autoPlay = false, children, onListen, caption, label }: {
  title: string; text: string; spokenText?: string; progress?: number; still?: boolean; autoPlay?: boolean;
  children?: React.ReactNode; onListen?: () => void; caption?: string; label?: string;
}) {
  const reduceMotion=useReducedMotion();
  const shots=useMemo(()=>explanationStoryboard(text),[text]);
  const [manualIndex,setManualIndex]=useState(0);
  const [playing,setPlaying]=useState(autoPlay && !reduceMotion && !still);
  const [elapsed,setElapsed]=useState(0);
  const [visible,setVisible]=useState(false);
  const stageRef=useRef<HTMLElement>(null);
  const externallyControlled=typeof progress==='number' || Boolean(spokenText);
  useEffect(()=>{
    setManualIndex(0); setElapsed(0);
    setPlaying(autoPlay && !reduceMotion && !still);
  },[text,autoPlay,reduceMotion,still]);
  useEffect(()=>{
    const node=stageRef.current;
    if (!node) return;
    if (typeof IntersectionObserver==='undefined') { setVisible(true); return; }
    const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:0.15});
    observer.observe(node);
    return ()=>observer.disconnect();
  },[]);
  const spokenIndex=spokenText ? explanationSpokenShot(shots,spokenText) : -1;
  const index=typeof progress==='number'?explanationShotAt(shots,progress):spokenIndex>=0?spokenIndex:Math.min(manualIndex,Math.max(0,shots.length-1));
  useEffect(()=>{ if(spokenIndex>=0) setManualIndex(spokenIndex); },[spokenIndex]);
  const shot=shots[index];
  const duration=Math.max(4000,Math.min(20000,(shot?.text.trim().split(/\s+/).length || 0)*350));
  useEffect(()=>{ setElapsed(0); },[index]);
  useEffect(()=>{
    if (!playing || externallyControlled || !visible || still || !shot) return;
    let previous=performance.now();
    const timer=window.setInterval(()=>{
      const now=performance.now();
      const delta=document.hidden ? 0 : Math.min(250,now-previous);
      previous=now;
      setElapsed(value=>Math.min(duration,value+delta));
    },100);
    return ()=>window.clearInterval(timer);
  },[playing,externallyControlled,visible,still,shot,duration]);
  useEffect(()=>{
    if (elapsed<duration || !playing || externallyControlled) return;
    if (index<shots.length-1) { setManualIndex(index+1); setElapsed(0); }
    else setPlaying(false);
  },[elapsed,duration,playing,externallyControlled,index,shots.length]);
  if (!shot) return null;
  const terms=explanationConcepts(shot.text);
  const staticMotion=Boolean(reduceMotion||still);
  const heading=lessonDisplayHeading(title,terms.join(' · '));
  return <section ref={stageRef} className={'reference-explanation reference-explanation--'+(index%3)} aria-label={'Explication animée : '+title}>
    <header className="reference-explanation__heading"><span>ACADEMIA · COMPRENDRE EN IMAGES</span><h3>{heading}</h3></header>
    <AnimatePresence initial={false} mode="wait">
      <motion.div className="reference-explanation__scene" key={shot.start+':'+text} initial={staticMotion?false:{opacity:0,scale:.97,y:10}} animate={{opacity:1,scale:1,y:0}} exit={staticMotion?undefined:{opacity:0,scale:1.015,y:-7}} transition={{duration:staticMotion?0:.24}}>
        <div className="reference-explanation__window">
          <div className="reference-explanation__window-bar" aria-hidden="true"><i/><i/><i/><span>Le repère visuel</span></div>
          <div className="reference-explanation__illustration">{children || <ExplanationEvidenceVisual title={title} text={shot.text} still={staticMotion} progress={externallyControlled ? 1 : elapsed/duration} narrationProgress={externallyControlled ? .6 : elapsed/duration}/>}</div>
        </div>
        <div className="reference-explanation__callout"><span className="reference-explanation__number">{String(index+1).padStart(2,'0')}</span><div><span className="reference-explanation__label">{label || shot.label}</span><p>{caption || shot.text}</p></div></div>
      </motion.div>
    </AnimatePresence>
    <footer className="reference-explanation__controls">
      {typeof progress!=='number' && !still && <button type="button" aria-label={playing ? 'Mettre l’animation en pause' : elapsed>=duration && index===shots.length-1 ? 'Rejouer l’animation' : 'Lire l’animation'} disabled={Boolean(spokenText)} onClick={()=>{
        if (!playing && elapsed>=duration && index===shots.length-1) { setManualIndex(0); setElapsed(0); }
        setPlaying(value=>!value);
      }}>{playing ? <Pause size={16}/> : elapsed>=duration && index===shots.length-1 ? <RotateCcw size={16}/> : <Play size={16}/>}</button>}
      {typeof progress!=='number' && <button type="button" aria-label="Scène précédente" disabled={index===0 || Boolean(spokenText)} onClick={()=>{setManualIndex(index-1);setElapsed(0);}}><ArrowLeft size={16}/></button>}
      <span>{String(index+1).padStart(2,'0')} <span>/ {String(shots.length).padStart(2,'0')}</span></span>
      <div className="reference-explanation__track" aria-hidden="true"><i style={{transform:`scaleX(${(index+1)/shots.length})`}}/></div>
      {typeof progress!=='number' && <button type="button" aria-label="Scène suivante" disabled={index===shots.length-1 || Boolean(spokenText)} onClick={()=>{setManualIndex(index+1);setElapsed(0);}}><ArrowRight size={16}/></button>}
      {onListen && <button type="button" className="reference-explanation__listen" onClick={onListen}><Volume2 size={16}/>Écouter</button>}
    </footer>
    {typeof progress!=='number' && <details className="reference-explanation__transcript"><summary><BookOpen size={14}/>Lire l’explication complète</summary><p>{text}</p></details>}
  </section>;
}
