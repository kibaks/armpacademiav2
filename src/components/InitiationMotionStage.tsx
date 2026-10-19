import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { INITIATION_UNITS } from '../data/initiationCurriculum';
import { INITIATION_DEFINITIONS, PROCUREMENT_LAW_URL, PROCUREMENT_MANUAL_URL } from '../data/initiationDefinitions';
import { ArmpLogo } from './ArmpLogo';
import { spokenLessonCue } from '../utils/spokenLessonCue';
import { LessonContextIllustration } from './LessonContextIllustration';
import { lessonContext } from '../utils/lessonContext';
import './InitiationMotionStage.css';

// Advanced scenes use their own content, never the initiation fallback.
export function InitiationMotionStage({ screen, progress, courseId, lessonIndex, reducedMotion = false }: {
  screen: SingleScreenCardData; progress: number; courseId: string; lessonIndex: number; reducedMotion?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const still = Boolean(prefersReduced || reducedMotion);
  const initiation = courseId.startsWith('INIT-');
  const unit = initiation ? INITIATION_UNITS[Number(courseId.replace('INIT-', '')) - 1] : undefined;
  const chapter = unit?.chapters[lessonIndex];
  const definition = unit ? INITIATION_DEFINITIONS[Number(courseId.replace('INIT-', '')) - 1]?.[lessonIndex] : undefined;
  const title = chapter?.[0] || screen.title;
  const context = lessonContext(title, screen.explanation, screen.screenNumber, initiation ? undefined : screen.shortTabLabel);
  const kind = context.kind;
  const cue = spokenLessonCue(screen, progress);
  const vocabulary = ['besoins', 'planification', 'financement', 'dossier', 'offres', 'évaluation', 'contrat', 'recours', 'garanties', 'paiement', 'réception', 'audit', 'responsabilités', 'transparence', 'concurrence', 'traçabilité'];
  const source = (title + ' ' + screen.explanation).toLocaleLowerCase('fr');
  const terms = chapter?.[4].split('|') || (context.terms.length ? context.terms : vocabulary.filter(term => source.includes(term)).slice(0, 4));
  const enter = (i = 0) => ({ initial: still ? false as const : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: still ? 0 : .35, delay: still ? 0 : i * .08 } });
  const caption = cue;
  const diagramTerms = terms.length ? terms : ['Le besoin', 'Les pièces du dossier', 'Les conditions applicables'];
  const words = caption.text.split(/\s+/);
  return <section className={'lesson-explainer lesson-explainer--' + kind} aria-label={'Explication pédagogique : ' + title}>
    {initiation && <div className="lesson-explainer__brand"><ArmpLogo size="sm" /><span>ACADEMIA<small>Parcours Initiation</small></span></div>}
    <header className="lesson-explainer__header"><span>{initiation ? 'LES FONDAMENTAUX' : 'APPROFONDIR LES MARCHÉS PUBLICS'}</span><span>{screen.shortTabLabel}</span></header>
    <div className="lesson-explainer__body">
      <motion.h3 key={title} {...enter()}>{title}</motion.h3>
      <div className={'lesson-motion-board lesson-motion-board--' + kind}>
        <div className="lesson-motion-board__visual">
          <LessonContextIllustration topic={title + ' ' + screen.title} progress={progress} still={still} labels={diagramTerms} narration={cue.text} narrationProgress={cue.progress} />
        </div>
        <div className="lesson-motion-board__message">
          <span className="lesson-motion-board__eyebrow">{cue.phase === 'rule' ? 'Faire le lien avec la pratique' : kind === 'practice' ? 'À vous de raisonner' : 'L’idée essentielle'}</span>
          <motion.p className={"lesson-motion-board__phrase" + (words.length > 24 ? " lesson-motion-board__phrase--long" : "")} key={screen.screenNumber + cue.phase + caption.index} initial={still ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:still ? 0 : .22}}>
            {words.map((word,i) => <motion.span key={i} initial={false} animate={{opacity:still || caption.progress * words.length * 2 >= i ? 1 : .6}} transition={{duration:0}}>{word}{i < words.length-1 ? ' ' : ''}</motion.span>)}
          </motion.p>
          <div className="lesson-motion-board__dots" aria-hidden="true">{Array.from({length:cue.count},(_,i) => <span key={i} className={i === caption.index ? 'is-active' : ''} />)}</div>
          
        </div>
      </div>
      {definition && <div className="lesson-explainer__source"><span>Explication pédagogique du texte</span><a href={definition[2].startsWith('Décret') ? PROCUREMENT_MANUAL_URL : PROCUREMENT_LAW_URL} target="_blank" rel="noopener noreferrer">{definition[2]}</a>{definition[2].includes(';') && <a href={PROCUREMENT_MANUAL_URL} target="_blank" rel="noopener noreferrer">Consulter aussi le manuel des procédures</a>}</div>}
    </div>
    <div className="lesson-explainer__progress" aria-hidden="true"><span style={{ transform: 'scaleX(' + Math.max(0, Math.min(1, progress)) + ')' }} /></div>
  </section>;
}
