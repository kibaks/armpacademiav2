import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, FileSearch, Users, Scale, ClipboardCheck, Building2, Truck, Monitor, Wrench, HeartPulse, Droplets, GraduationCap } from 'lucide-react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { INITIATION_UNITS } from '../data/initiationCurriculum';
import { INITIATION_DEFINITIONS, PROCUREMENT_LAW_URL, PROCUREMENT_MANUAL_URL } from '../data/initiationDefinitions';
import { ArmpLogo } from './ArmpLogo';
import { sampleLessonStoryboard, paginateLessonText } from '../utils/motionLessonStoryboard';
import { lessonVisualKind } from '../utils/lessonVisualKind';
import './InitiationMotionStage.css';

function ContextDrawing({ text }: { text: string }) {
  const Icon = /santé|hôpital|médical/i.test(text) ? HeartPulse : /eau|forage/i.test(text) ? Droplets : /informat|ordinateur|logiciel/i.test(text) ? Monitor : /route|travaux|réhabilit/i.test(text) ? Wrench : /formation|école|banc/i.test(text) ? GraduationCap : /livr|transport/i.test(text) ? Truck : Building2;
  const theme = /informat|ordinateur|logiciel/i.test(text) ? 'digital' : /santé|hôpital|médical/i.test(text) ? 'health' : /route|chantier|travaux|réhabilit/i.test(text) ? 'works' : /eau|pompe|forage/i.test(text) ? 'water' : /dossier|rapport|offre|pièce|critère/i.test(text) ? 'files' : null;
  return <div className="lesson-explainer__drawing" aria-hidden="true">{theme ? <svg className="lesson-context-scene" viewBox="0 0 240 170" width="220" height="156" fill="none">
    <path d="M12 150H228" stroke="#b8cbe5" strokeWidth="3" strokeLinecap="round" />
    {theme === 'digital' && <><rect x="39" y="30" width="163" height="99" rx="9" fill="#0c3b7c" /><rect x="47" y="38" width="147" height="82" rx="3" fill="#f7faff" /><path d="M24 131H217L226 146H15Z" fill="#9bb5d8" /><rect x="60" y="54" width="45" height="50" rx="5" fill="#d7e6fa" /><path d="M119 58h59M119 72h44M119 87h54M119 101h32" stroke="#6085b7" strokeWidth="5" strokeLinecap="round" /><circle cx="82" cy="78" r="11" fill="#eab64a" /></>}
    {theme === 'health' && <><rect x="43" y="39" width="154" height="109" rx="6" fill="#fff" stroke="#9bb5d8" strokeWidth="2" /><rect x="91" y="13" width="57" height="54" rx="10" fill="#0c3b7c" /><path d="M119 25v30M104 40h30" stroke="#fff" strokeWidth="9" /><rect x="104" y="101" width="33" height="47" fill="#c2d9f4" />{[60,155].map(x => <g key={x}><rect x={x} y="81" width="25" height="25" rx="3" fill="#dce9fa" /><path d={'M'+(x+12)+' 81v25M'+x+' 94h25'} stroke="#7196c6" strokeWidth="2" /></g>)}</>}
    {theme === 'works' && <><path d="M75 148L103 28h35l41 120Z" fill="#7894b8" /><path d="M121 38v18m0 14v18m0 15v22" stroke="#fff4d9" strokeWidth="4" /><path d="M28 124h54l-6-28H39Z" fill="#eab64a" /><path d="M48 96V76h26l14 20" stroke="#0c3b7c" strokeWidth="6" /><circle cx="41" cy="137" r="12" fill="#0c3b7c" /><circle cx="75" cy="137" r="12" fill="#0c3b7c" /><path d="M188 113l13 33h-26Z" fill="#eab64a" /><path d="M182 133h15" stroke="white" strokeWidth="4" /></>}
    {theme === 'water' && <><rect x="77" y="64" width="45" height="77" rx="6" fill="#0c3b7c" /><path d="M90 64V44h58M112 44l53-22" stroke="#6c91c2" strokeWidth="9" strokeLinecap="round" /><path d="M122 81h41v19" stroke="#0c3b7c" strokeWidth="10" strokeLinejoin="round" /><path d="M163 109s-10 12-10 18a10 10 0 0020 0c0-6-10-18-10-18" fill="#6eb8e5" /><path d="M146 145h50" stroke="#6eb8e5" strokeWidth="5" strokeLinecap="round" /><rect x="62" y="141" width="74" height="8" rx="3" fill="#9bb5d8" /></>}
    {theme === 'files' && <><rect x="42" y="51" width="127" height="95" rx="8" fill="#eab64a" /><rect x="64" y="25" width="112" height="110" rx="6" fill="white" stroke="#9bb5d8" strokeWidth="2" /><path d="M83 48h71M83 66h55M83 84h63M83 102h36" stroke="#9bb5d8" strokeWidth="5" strokeLinecap="round" /><circle cx="176" cy="113" r="28" fill="#0c3b7c" /><path d="M163 113l9 9 17-20" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></>}
  </svg> : <Icon size={88} strokeWidth={1.2} />}<span /><span /></div>;
}

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
  const selectedKind = lessonVisualKind(title, screen.screenNumber, initiation ? undefined : screen.shortTabLabel);
  const kind = !chapter && selectedKind === 'timeline' ? 'definition' : selectedKind;
  const cue = sampleLessonStoryboard(screen, progress);
  const paragraphs = paginateLessonText(cue.phase === 'rule' ? screen.fieldRule : screen.explanation, 34);
  const page = Math.min(paragraphs.length - 1, Math.floor(Math.max(0, Math.min(.999, cue.sectionProgress)) * paragraphs.length));
  const vocabulary = ['besoins', 'planification', 'financement', 'dossier', 'offres', 'évaluation', 'contrat', 'recours', 'garanties', 'paiement', 'réception', 'audit', 'responsabilités', 'transparence', 'concurrence', 'traçabilité'];
  const source = (title + ' ' + screen.explanation).toLocaleLowerCase('fr');
  const terms = chapter?.[4].split('|') || vocabulary.filter(term => source.includes(term)).slice(0, 4);
  const labels = { definition: 'Définition & compréhension', case: 'Situation à examiner', comparison: 'Comprendre la distinction', roles: 'Acteurs & responsabilités', timeline: 'Le déroulement', practice: 'Vérifier sa compréhension', summary: 'Ce qu’il faut retenir' };
  const enter = (i = 0) => ({ initial: still ? false as const : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: still ? 0 : .35, delay: still ? 0 : i * .08 } });
  const explanation = <p key={cue.phase + page}>{paragraphs[page]}</p>;
  return <section className={'lesson-explainer lesson-explainer--' + kind} aria-label={'Explication pédagogique : ' + title}>
    {initiation && <div className="lesson-explainer__brand"><ArmpLogo size="sm" /><span>ACADEMIA<small>Parcours Initiation</small></span></div>}
    <header className="lesson-explainer__header"><span>{initiation ? 'LES FONDAMENTAUX' : 'APPROFONDIR LES MARCHÉS PUBLICS'}</span><span>{labels[kind]}</span></header>
    <div className="lesson-explainer__body">
      <motion.h3 key={title} {...enter()}>{title}</motion.h3>
      {kind === 'definition' && <div className="lesson-explainer__definition"><motion.div {...enter(1)}><BookOpen size={30} /><span>{definition?.[0] || 'De quoi parle-t-on ?'}</span>{explanation}<small>{paragraphs.length > 1 ? 'Explication ' + (page + 1) + ' / ' + paragraphs.length : 'Le sens de la notion'}</small></motion.div><aside><ContextDrawing text={screen.explanation} /><strong>Les repères du sujet</strong><div className="lesson-explainer__tags">{terms.map(t => <span key={t}>{t}</span>)}</div></aside></div>}
      {kind === 'case' && <div className="lesson-explainer__case"><motion.aside {...enter(1)}><ContextDrawing text={screen.explanation} /><span>CAS PÉDAGOGIQUE</span><strong>Observer les faits avant de décider</strong></motion.aside><div><FileSearch size={28} />{explanation}<blockquote>{screen.fieldRule}</blockquote></div></div>}
      {kind === 'comparison' && <div className="lesson-explainer__comparison"><motion.article {...enter(1)}><Scale size={30} /><span>Comprendre la notion</span>{explanation}</motion.article><motion.article {...enter(2)}><ClipboardCheck size={30} /><span>Ce que cela implique en pratique</span><p>{screen.fieldRule}</p></motion.article></div>}
      {kind === 'roles' && <div className="lesson-explainer__roles"><div className="lesson-explainer__hub"><Users size={50} /><strong>Des interventions distinctes</strong></div><div className="lesson-explainer__role-list">{terms.map((t,i) => <motion.div key={t} {...enter(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{t}</strong></motion.div>)}</div><div className="lesson-explainer__full">{explanation}</div></div>}
      {kind === 'timeline' && <div className="lesson-explainer__timeline"><ol>{terms.map((t,i) => <motion.li key={t} {...enter(i)}><span>{i+1}</span><strong>{t}</strong></motion.li>)}</ol>{explanation}<blockquote>{screen.fieldRule}</blockquote></div>}
      {kind === 'practice' && <div className="lesson-explainer__practice"><span className="lesson-explainer__question">?</span><div><span>Faites le lien avec votre pratique</span>{explanation}<blockquote>{screen.fieldRule}</blockquote></div></div>}
      {kind === 'summary' && <div className="lesson-explainer__summary"><ClipboardCheck size={48} />{explanation}<div className="lesson-explainer__tags">{terms.map(t => <span key={t}>{t}</span>)}</div><blockquote>{screen.fieldRule}</blockquote></div>}
      {definition && <div className="lesson-explainer__source"><span>Explication pédagogique du texte</span><a href={definition[2].startsWith('Décret') ? PROCUREMENT_MANUAL_URL : PROCUREMENT_LAW_URL} target="_blank" rel="noopener noreferrer">{definition[2]}</a>{definition[2].includes(';') && <a href={PROCUREMENT_MANUAL_URL} target="_blank" rel="noopener noreferrer">Consulter aussi le manuel des procédures</a>}</div>}
    </div>
    <div className="lesson-explainer__progress" aria-hidden="true"><span style={{ transform: 'scaleX(' + Math.max(0, Math.min(1, progress)) + ')' }} /></div>
  </section>;
}
