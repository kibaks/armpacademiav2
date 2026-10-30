import { ReferenceExplanationStage } from './ReferenceExplanationStage';
import React from 'react';
import { useReducedMotion } from 'motion/react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { INITIATION_UNITS } from '../data/initiationCurriculum';
import { INITIATION_DEFINITIONS, PROCUREMENT_LAW_URL, PROCUREMENT_MANUAL_URL } from '../data/initiationDefinitions';
import { ArmpLogo } from './ArmpLogo';
import { spokenLessonCue } from '../utils/spokenLessonCue';
import { lessonEssentialSummary } from '../utils/lessonEssentialSummary';
import { motionCaptionAt } from '../utils/lessonMotionCues';
import { INITIATION_MOTION_NOTES } from '../data/initiationMotionNotes';
import { ExplanationEvidenceVisual } from './ExplanationEvidenceVisual';
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
  const note = unit ? INITIATION_MOTION_NOTES[Number(courseId.replace('INIT-', '')) - 1]?.[lessonIndex] : undefined;
  const authored = cue.phase === 'explanation' && [1,5].includes(screen.screenNumber) ? note?.[0] : undefined;
  const essentialPhrases = lessonEssentialSummary(cue.phase === 'rule' ? screen.fieldRule : screen.explanation, authored, context.question);
  const caption = motionCaptionAt(essentialPhrases, cue.sectionProgress);
  return <section className={'lesson-explainer lesson-explainer--' + kind} aria-label={'Explication pédagogique : ' + title}>
    {initiation && <div className="lesson-explainer__brand"><ArmpLogo size="sm" /><span>ACADEMIA<small>Parcours Initiation</small></span></div>}
    <header className="lesson-explainer__header"><span>{initiation ? 'LES FONDAMENTAUX' : 'APPROFONDIR LES MARCHÉS PUBLICS'}</span><span>{screen.shortTabLabel}</span></header>
    <div className="lesson-explainer__body lesson-explainer__body--reference">
      <ReferenceExplanationStage key={screen.screenNumber+':'+cue.phase} title={title} text={cue.phase==='rule' ? screen.fieldRule : screen.explanation} progress={cue.sectionProgress} still={still} caption={caption.text} label={cue.phase==='rule' ? 'Faire le lien avec la pratique' : kind==='practice' ? 'À vous de raisonner' : 'L’idée essentielle'}>
        <ExplanationEvidenceVisual key={cue.index} title={title + ' ' + screen.title} progress={progress} still={still} text={cue.text} narrationProgress={cue.progress}/>
      </ReferenceExplanationStage>
      {definition && <div className="lesson-explainer__source"><span>Explication pédagogique du texte</span><a href={definition[2].startsWith('Décret') ? PROCUREMENT_MANUAL_URL : PROCUREMENT_LAW_URL} target="_blank" rel="noopener noreferrer">{definition[2]}</a>{definition[2].includes(';') && <a href={PROCUREMENT_MANUAL_URL} target="_blank" rel="noopener noreferrer">Consulter aussi le manuel des procédures</a>}</div>}
    </div>
    <div className="lesson-explainer__progress" aria-hidden="true"><span style={{ transform: 'scaleX(' + Math.max(0, Math.min(1, progress)) + ')' }} /></div>
  </section>;
}
