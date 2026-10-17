import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ClipboardList, FileCheck2, Users, Building2, Truck, Scale, ShieldCheck, ArrowRight, Check, Lightbulb, School, CircleHelp, Target } from 'lucide-react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { INITIATION_UNITS } from '../data/initiationCurriculum';
import { sampleLessonStoryboard } from '../utils/motionLessonStoryboard';
import './InitiationMotionStage.css';

const icons = [Lightbulb, Users, ClipboardList, ClipboardList, FileCheck2, Building2, Users, Scale, FileCheck2, Truck, FileCheck2, ShieldCheck];
function SchoolIllustration({ progress, still }: { progress: number; still: boolean }) {
  const p = still ? 1 : Math.min(1, progress * 2);
  return <svg className="init-motion__school" viewBox="0 0 340 180" role="img" aria-label="Illustration du cas : une école, une livraison et des bancs">
    <circle cx="286" cy="29" r="19" fill="#ffd274" />
    <path d="M12 160H331" stroke="#b8c9df" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 72L130 19L221 72Z" fill="#2258d8" /><rect x="54" y="71" width="153" height="88" rx="5" fill="#fff" stroke="#aec2e5" strokeWidth="2" />
    <rect x="116" y="104" width="29" height="55" rx="4" fill="#1c345c" />
    {[73, 162].map(x => <g key={x}><rect x={x} y="91" width="24" height="28" rx="3" fill="#cee5ff" /><path d={`M${x+12} 91v28M${x} 105h24`} stroke="#6c97d8" strokeWidth="2" /></g>)}
    <motion.g initial={false} animate={{ x: still ? 0 : (1-p)*40 }} transition={{ duration: still ? 0 : .2 }}>
      <rect x="217" y="102" width="67" height="39" rx="5" fill="#ffbd5a" /><path d="M284 116h24l15 17v17h-39Z" fill="#2960dc" /><path d="M289 121h15l10 12h-25Z" fill="#daedff" /><path d="M212 141h75v9h-75Z" fill="#c78324" /><circle cx="232" cy="151" r="10" fill="#173555" /><circle cx="306" cy="151" r="10" fill="#173555" /><circle cx="232" cy="151" r="4" fill="#cce0fa" /><circle cx="306" cy="151" r="4" fill="#cce0fa" />
    </motion.g>
    {[0, 1, 2].map(i => <motion.g key={i} initial={false} animate={{ opacity: still || p > i*.25 ? 1 : 0, y: still || p > i*.25 ? 0 : -14 }} transition={{ duration: still ? 0 : .3 }}>
      <rect x={67+i*43} y="140" width="31" height="6" rx="2" fill="#ba7840" /><path d={`M${71+i*43} 146v13M${94+i*43} 146v13`} stroke="#6e4a32" strokeWidth="3" />
    </motion.g>)}
  </svg>;
}
export function InitiationMotionStage({ screen, progress, courseId, lessonIndex, reducedMotion = false }: {
  screen: SingleScreenCardData; progress: number; courseId: string; lessonIndex: number; reducedMotion?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const unitIndex = Number(courseId.replace('INIT-', '')) - 1;
  const unit = INITIATION_UNITS[unitIndex] || INITIATION_UNITS[0];
  const chapter = unit.chapters[lessonIndex] || unit.chapters[0];
  const steps = chapter[4].split('|');
  const cue = sampleLessonStoryboard(screen, progress);
  const Icon = screen.screenNumber === 2 ? School : screen.screenNumber === 3 ? Target : screen.screenNumber === 4 ? CircleHelp : screen.screenNumber === 5 ? ShieldCheck : icons[unitIndex] || ClipboardList;
  const active = Math.min(2, Math.floor(Math.max(0, Math.min(.999, progress)) * 3));
  const still = Boolean(prefersReduced || reducedMotion);
  return <section className="init-motion" aria-label={`Animation pédagogique : ${chapter[0]}`}>
    <div className="init-motion__top"><span>LES FONDAMENTAUX</span><span>{String(unitIndex + 1).padStart(2, '0')} / 12</span></div>
    <div className="init-motion__composition">
      <div className="init-motion__visual">
        <div className="init-motion__orbit" aria-hidden="true" />
        <motion.div className="init-motion__hero" initial={false} animate={{ scale: still ? 1 : .94 + Math.min(progress * 3, 1) * .06, rotate: still ? 0 : -3 + Math.min(progress * 3, 1) * 3 }} transition={{ duration: still ? 0 : .25 }}>
          {screen.screenNumber === 2 ? <SchoolIllustration progress={progress} still={still} /> : <Icon size={66} strokeWidth={1.35} aria-hidden="true" />}<span>{screen.screenNumber === 2 ? 'Un achat pour les écoles' : ['Comprendre le sujet', '', 'Passer à l’action', 'À vous de réfléchir', 'L’essentiel à retenir'][screen.screenNumber - 1] || unit.title}</span>
        </motion.div>
        <ol className="init-motion__steps" aria-label="Les trois repères du chapitre">
          {steps.map((step, index) => <motion.li key={step} className={index <= active ? 'is-revealed' : ''} initial={false} animate={{ opacity: still || progress >= index * .15 ? 1 : .35, y: still || progress >= index * .15 ? 0 : 18 }} transition={{ duration: still ? 0 : .3 }}>
            <span className="init-motion__number">{index < active ? <Check size={16} aria-hidden="true" /> : `0${index + 1}`}</span><strong>{step}</strong>{index < 2 && <ArrowRight className="init-motion__arrow" size={18} aria-hidden="true" />}
          </motion.li>)}
        </ol>
        <span className="init-motion__case">CAS FIL ROUGE · ÉQUIPER DES ÉCOLES</span>
      </div>
      <div className="init-motion__copy">
        <span className="init-motion__eyebrow">{cue.phase === 'rule' ? 'LE BON RÉFLEXE' : 'COMPRENDRE POUR AGIR'}</span>
        <h3>{chapter[0]}</h3>
        <motion.p key={`${screen.screenNumber}-${cue.phase}-${cue.pageIndex}`} initial={still ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: still ? 0 : .25 }}>
          {cue.text}
        </motion.p>
        <div className="init-motion__meter" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress))})` }} /></div>
        <small>Une idée · Un exemple · Une action</small>
      </div>
    </div>
  </section>;
}
