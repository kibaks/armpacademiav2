import React, { useId } from 'react';
import { motion } from 'motion/react';
type Kind = 'definition' | 'case' | 'comparison' | 'roles' | 'timeline' | 'practice' | 'summary';
function lines(text: string) {
  const words = text.split(/\s+/).flatMap(word => word.length > 14 ? word.match(/.{1,14}/gu) || [word] : [word]);
  const rows: string[] = [];
  for (const word of words) {
    if (!rows.length || (rows[rows.length - 1] + ' ' + word).length > 14) rows.push(word);
    else rows[rows.length - 1] += ' ' + word;
  }
  return rows;
}
export function LessonMotionDiagram({ kind, labels, progress, still }: {kind: Kind; labels: string[]; progress: number; still: boolean}) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const arrowId = 'lesson-arrow-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const terms = labels.slice(0,3);
  const positions = kind === 'roles' ? [[130,255],[360,280],[590,255]] : kind === 'comparison' ? [[165,105],[555,105],[360,270]] : kind === 'summary' ? [[360,60],[360,175],[360,290]] : kind === 'definition' ? [[520,58],[520,175],[520,292]] : [[120,175],[360,175],[600,175]];
  const paths = kind === 'roles' ? ['M360 75 Q130 75 130 205','M360 75V230','M360 75 Q590 75 590 205'] : kind === 'definition' ? ['M200 175 Q320 58 420 58','M200 175H420','M200 175 Q320 292 420 292'] : kind === 'summary' ? ['M360 110V125','M360 225V240'] : kind === 'comparison' ? ['M360 25V165'] : ['M220 175H260','M460 175H500'];
  return <svg className={'lesson-motion-diagram lesson-motion-diagram--' + kind} viewBox="0 0 720 360" role="img" aria-label={'Schéma des repères : ' + terms.join(', ')}>
    <defs><marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#0c3b7c" strokeWidth="1.3" /></marker></defs>
    {kind === 'definition' && <g><circle cx="148" cy="175" r="54" fill="#0c3b7c" /><path d="M123 157q12-5 25 2 13-7 25-2v35q-12-5-25 2-13-7-25-2ZM148 159v35" fill="none" stroke="white" strokeWidth="3" /></g>}
    {kind === 'roles' && <g><circle cx="360" cy="55" r="28" fill="#0c3b7c" /><circle cx="360" cy="45" r="7" fill="white" /><path d="M346 66q0-17 14-17t14 17" fill="white" /></g>}
    {paths.map((d,i) => <motion.path key={d} d={d} fill="none" stroke="#6b91c5" strokeWidth="4" strokeLinecap="round" markerEnd={kind === 'timeline' ? 'url(#' + arrowId + ')' : undefined} initial={false} animate={{pathLength:still ? 1 : Math.max(0,Math.min(1,p*3-i*.4))}} transition={{duration:0}} />)}
    {terms.map((label,i) => {
      const [x,y] = positions[i], revealed = still || p >= i*.2;
      const rows = lines(label);
      return <motion.g key={label} initial={false} animate={{opacity:revealed ? 1 : .25, y:revealed ? 0 : 14}} transition={{duration:still ? 0 : .2}}>
        <rect x={x-100} y={y-45} width="200" height="90" rx="17" fill={revealed ? '#fff' : '#edf2f9'} stroke={revealed ? '#0c3b7c' : '#b3c5dd'} strokeWidth="2" />
        <circle cx={x-83} cy={y-41} r="15" fill={revealed ? '#eab64a' : '#dce5f1'} />
        <text x={x-83} y={y-35} textAnchor="middle" fontSize="18" fontWeight="800" fill="#142c4d">{kind === 'summary' ? '✓' : kind === 'timeline' ? i+1 : '•'}</text>
        <text x={x} y={y-(rows.length-1)*13+8} textAnchor="middle" fontSize="25" fontWeight="700" fill="#142c4d">{rows.map((row,j) => <tspan key={j} x={x} dy={j ? 27 : 0}>{row}</tspan>)}</text>
      </motion.g>;
    })}
    {kind === 'practice' && <text x="360" y="70" textAnchor="middle" fontSize="60" fontWeight="800" fill="#0c3b7c">?</text>}
  </svg>;
}
