import React from 'react';
import { motion } from 'motion/react';
import { lessonVisualFocus, type VisualSubject } from '../utils/lessonVisualFocus';

export function lessonIllustration(title: string) {
  if (/travaux, fournitures|types de prestations/i.test(title)) return 'categories';
  if (/service des citoyens|autorité contractante|service utilisateur|responsable|régulation/i.test(title)) return 'people';
  if (/principes|contestation/i.test(title)) return 'balance';
  if (/ouverture|questions et modifications|expliquer le résultat/i.test(title)) return 'notice';
  if (/procédures et les seuils|démarrage|de A à Z/i.test(title)) return 'calendar';
  if (/décider de participer/i.test(title)) return 'target';
  if (/chiffrer/i.test(title)) return 'ledger';
  if (/modification|retard|difficulté/i.test(title)) return 'contract';
  if (/alloti|fractionnement/i.test(title)) return 'lots';
  if (/critère|évalu|notation|comparaison|comparer|grille/i.test(title)) return 'matrix';
  if (/réception|livr|réserve|conformité/i.test(title)) return 'delivery';
  if (/garanti|caution/i.test(title)) return 'shield';
  if (/prix|chiffrage|bpu|dqe|coût|paiement|acompte|avance|financ|budget|crédit/i.test(title)) return 'ledger';
  if (/recours|réclamation|litige|contentieux|conflit|intérêts/i.test(title)) return 'balance';
  if (/audit|traçabilité|archiv|contrôle|dossier|pièce|rapport/i.test(title)) return 'inspection';
  if (/planif|calendrier|ppm|cycle|étape/i.test(title)) return 'calendar';
  if (/acteur|rôle|responsab|cgpmp|intervenant|autorité contractante|service utilisateur/i.test(title)) return 'people';
  if (/numéri|dématérial|sigmap|électron|informat/i.test(title)) return 'digital';
  if (/besoin|usager|spécification|cahier/i.test(title)) return 'target';
  if (/avenant|contrat|exécution|chantier|consultant|tdr|expertise/i.test(title)) return 'contract';
  if (/publicit|avis|candidat|concurrence|information/i.test(title)) return 'notice';
  return 'book';
}
const descriptions = {
  categories: 'Des travaux, des fournitures et des services de nature différente',
  lots: 'Un besoin réparti en lots distincts', matrix: 'Une grille croisant critères et éléments des offres', delivery: 'Une livraison comparée à la commande',
  shield: 'Un engagement protégé par une garantie', ledger: 'Un relevé rapprochant prestations et montants', balance: 'Des faits et des pièces examinés de façon impartiale',
  inspection: 'Une loupe examine les pièces du dossier', calendar: 'Des opérations réparties sur un calendrier', people: 'Des intervenants aux responsabilités distinctes',
  digital: 'Des échanges numériques sécurisés', target: 'Un besoin traduit en caractéristiques vérifiables', contract: 'Un contrat et ses engagements écrits', notice: 'Un avis diffusé aux candidats', book: 'Une notion expliquée dans un livre ouvert',
};

const spots: Record<VisualSubject, number[][]> = {
    categories:[[30,95,160,170],[240,95,160,170],[450,95,160,170]],
    lots:[[70,35,500,65],[65,170,510,155],[65,170,510,155]],
    matrix:[[60,40,170,290],[230,40,175,290],[405,40,175,290]],
    delivery:[[48,75,190,245],[300,85,270,270],[80,230,115,70]],
    shield:[[65,70,220,250],[310,40,250,305],[360,130,150,115]],
    ledger:[[70,85,220,215],[290,85,110,215],[425,140,150,180]],
    balance:[[90,100,150,190],[400,100,150,190],[280,40,80,290]],
    inspection:[[100,45,280,280],[290,110,190,190],[330,165,115,80]],
    calendar:[[95,150,135,50],[240,195,135,50],[385,240,135,50]],
    people:[[55,45,150,220],[245,75,150,220],[435,45,150,220]],
    digital:[[90,55,460,245],[260,105,120,130],[295,165,50,50]],
    target:[[100,50,280,280],[365,40,115,115],[410,160,150,150]],
    contract:[[130,35,360,205],[160,240,140,70],[390,225,110,110]],
    notice:[[90,50,280,280],[410,105,90,170],[480,60,100,270]],
    book:[[75,85,240,240],[325,85,240,240],[285,95,70,240]],
  };

// Distinct visual metaphors; all movement uses the player's clock, including seeking.
export function LessonContextIllustration({ topic, progress, still, labels, narration = '', narrationProgress = 0 }: {topic: string; progress: number; still: boolean; labels: string[]; narration?: string; narrationProgress?: number}) {
  const spokenType = lessonIllustration(narration);
  const primary = lessonIllustration(topic);
  const fallback = primary === 'book' ? lessonIllustration(labels.join(' ')) : primary;
  // Generic words such as “contrôle” and “contrat” describe many subjects.
  // Keep their concrete scene unless the sentence actually introduces a new one.
  const generic = (spokenType === 'inspection' && !/audit|archiv|traçabilité|document|pièce|dossier|rapport/i.test(narration))
    || (spokenType === 'contract' && !/avenant|signature|résiliation|démarrage|modification/i.test(narration))
    || (spokenType === 'target' && fallback !== 'book');
  const type = spokenType !== 'book' && !generic ? spokenType : fallback;
  const focus = lessonVisualFocus(type, narration, narrationProgress);
  const p = still ? 1 : Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const reveal = (i: number) => ({ initial: false as const, animate: { opacity: narration ? 1 : p >= i * .15 ? 1 : .12, y: narration || p >= i * .15 ? 0 : 10 }, transition: { duration: 0 } });
  const stroke = '#214b80', gold = '#e4b34e', pale = '#dbe8f8';
  const spot = focus.index >= 0 ? spots[type][focus.index] : undefined;
  return <figure className={'lesson-context-figure lesson-context-figure--' + type}>
    <svg viewBox="0 0 640 380" role="img" aria-label={descriptions[type] + (focus.label ? '. Repère expliqué : ' + focus.label : '')} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      {type === 'categories' && <>{[0,1,2].map(i=><motion.g key={i} {...reveal(i)}><circle cx={110+i*210} cy="180" r="80" fill={pale}/>{i===0 ? <path d="M60 200v-65l50-35 50 35v65h-35v-45H95v45Z" fill="white"/> : i===1 ? <><rect x="275" y="135" width="90" height="65" rx="6" fill="white"/><path d="M260 215h120M320 200v15"/></> : <><circle cx="530" cy="145" r="24" fill="white"/><path d="M485 220v-20q0-40 45-40t45 40v20Z" fill="white"/></>}<text x={110+i*210} y="300" textAnchor="middle" fontSize="23" fill={stroke} stroke="none">{['Travaux','Fournitures','Services'][i]}</text></motion.g>)}</>}
      {type === 'lots' && <><rect x="70" y="35" width="500" height="65" rx="12" fill={pale}/><path d="M320 100v38M120 138h400M120 138v34M320 138v34M520 138v34"/>{[70,270,470].map((x,i)=><motion.g key={x} {...reveal(i)}><rect x={x} y="175" width="100" height="145" rx="12" fill={i===1?gold:'white'}/><path d={`M${x+20} 205h60m-60 25h60m-60 25h35`}/><text x={x+50} y="300" textAnchor="middle" fill={stroke} stroke="none" fontSize="23">Lot {i+1}</text></motion.g>)}</>}
      {type === 'matrix' && <><rect x="60" y="40" width="520" height="290" rx="16" fill="white"/><path d="M60 105h520M230 40v290M405 40v290M60 180h520M60 255h520"/>{[0,1,2].map(i=><motion.g key={i} {...reveal(i)}><rect x="83" y={125+i*75} width={100-i*15} height="14" rx="7" fill={pale} stroke="none"/>{focus.confirmed ? <path d={`M275 ${140+i*75}l15 15 30-34`} stroke={i===1?gold:stroke}/> : <circle cx="302" cy={140+i*75} r="13" stroke={stroke}/>}<circle cx="490" cy={140+i*75} r={i===1?15:8} fill={i===1?gold:pale}/></motion.g>)}</>}
      {type === 'delivery' && <><rect x="48" y="75" width="190" height="245" rx="12" fill="white"/><path d="M85 125h110M85 157h90M85 189h105"/><motion.g {...reveal(1)}><path d="M305 155l125-65 135 65v135l-135 60-125-60Z" fill={pale}/><path d="M305 155l125 60 135-60M430 215v135M370 122l130 62v55"/></motion.g>{focus.confirmed ? <motion.path {...reveal(2)} d="M100 255l23 23 48-55" stroke="#26775c" strokeWidth="10"/> : <circle cx="142" cy="265" r="22" stroke={gold} />}</>}
      {type === 'shield' && <><rect x="65" y="70" width="220" height="250" rx="14" fill="white"/><path d="M100 115h150M100 150h110M100 185h140"/><motion.g {...reveal(1)}><path d="M435 45l120 48v105c0 65-70 110-120 142-50-32-120-77-120-142V93Z" fill={pale}/>{focus.confirmed ? <motion.path initial={false} animate={{pathLength:p}} transition={{duration:0}} d="M375 190l40 42 82-93" stroke={gold} strokeWidth="15"/> : <circle cx="435" cy="190" r="36" stroke={gold} strokeWidth="9"/>}</motion.g></>}
      {type === 'ledger' && <><rect x="70" y="35" width="330" height="305" rx="18" fill="white"/><path d="M100 85h270M100 130h270M100 185h270M100 240h270M100 295h270M290 85v210"/>{[0,1,2].map(i=><motion.g key={i} {...reveal(i)}><rect x="110" y={146+i*55} width={110-i*15} height="13" rx="5" stroke="none" fill={pale}/><path d={`M315 ${153+i*55}h40`} stroke={gold} strokeWidth="9"/></motion.g>)}<motion.g {...reveal(2)}><rect x="430" y="145" width="140" height="170" rx="15" fill={stroke}/><rect x="450" y="165" width="100" height="35" rx="4" fill={gold} stroke="none"/>{[0,1,2].map(i=><path key={i} d={`M455 ${228+i*28}h12m20 0h12m20 0h12`} stroke="white" strokeWidth="9"/>)}</motion.g></>}
      {type === 'balance' && <><path d="M320 65v240M245 330h150M270 305h100M130 110h380" strokeWidth="9"/><circle cx="320" cy="65" r="22" fill={gold}/>{[165,475].map((x,i)=><motion.g key={x} {...reveal(i)}><path d={`M${x} 110l-70 120h140Z`} fill={pale}/><path d={`M${x-70} 230q70 65 140 0`} fill="white"/></motion.g>)}</>}
      {type === 'inspection' && <><rect x="100" y="45" width="280" height="280" rx="14" fill="white"/>{[0,1,2,3].map(i=><path key={i} d={`M145 ${100+i*48}h${170-i*20}`} stroke={pale} strokeWidth="13"/>)}<motion.g initial={false} animate={{x:still?0:35*(1-p),y:still?0:-20*(1-p)}} transition={{duration:0}}><circle cx="385" cy="200" r="88" fill="#e4eefbe6" strokeWidth="10"/><path d="M450 267l80 72" strokeWidth="23"/>{focus.confirmed ? <motion.path initial={false} animate={{pathLength:p}} transition={{duration:0}} d="M347 202l28 29 51-62" stroke={gold} strokeWidth="9"/> : <circle cx="385" cy="200" r="24" stroke={gold} strokeWidth="6"/>}</motion.g></>}
      {type === 'calendar' && <><rect x="65" y="65" width="510" height="270" rx="20" fill="white"/><path d="M65 125h510M160 40v50M480 40v50" strokeWidth="9"/>{[0,1,2].map(i=><motion.g key={i} {...reveal(i)}><rect x={100+i*145} y={158+i*45} width="125" height="38" rx="8" fill={i===1?gold:pale}/></motion.g>)}<path d="M100 300h425" stroke={pale}/></>}
      {type === 'people' && <>{[130,320,510].map((x,i)=><motion.g key={x} {...reveal(i)}><circle cx={x} cy={100+i%2*30} r="43" fill={i===1?gold:pale}/><path d={`M${x-62} ${240+i%2*30}v-35q0-60 62-60t62 60v35Z`} fill="white"/><rect x={x-60} y="300" width="120" height="18" rx="7" fill={pale} stroke="none"/></motion.g>)}</>}
      {type === 'digital' && <><rect x="90" y="55" width="460" height="245" rx="18" fill={stroke}/><rect x="110" y="75" width="420" height="200" rx="7" fill="white"/><path d="M50 305h540l-20 35H70Z" fill={pale}/><motion.g {...reveal(1)}><rect x="265" y="145" width="110" height="85" rx="12" fill={gold}/><path d="M285 145v-25a35 35 0 0170 0v25"/><circle cx="320" cy="185" r="8" fill={stroke}/></motion.g></>}
      {type === 'target' && <><circle cx="240" cy="190" r="135" fill={pale}/><circle cx="240" cy="190" r="90" fill="white"/><circle cx="240" cy="190" r="38" fill={gold}/><motion.path initial={false} animate={{pathLength:p}} transition={{duration:0}} d="M240 190L445 70m-50-5 50 5-15 50" strokeWidth="9"/>{[0,1,2].map(i=><motion.path key={i} {...reveal(i)} d={`M425 ${190+i*45}h${120-i*20}`} stroke={i===1?gold:stroke} strokeWidth="12"/>)}</>}
      {type === 'contract' && <><rect x="130" y="35" width="360" height="300" rx="15" fill="white"/><path d="M180 90h250M180 130h200M180 170h235M180 210h140" stroke={pale} strokeWidth="12"/><motion.path initial={false} animate={{pathLength:p}} transition={{duration:0}} d="M175 285q20-55 28-13t25-12q8-20 13 8t38-12" strokeWidth="6"/><motion.g {...reveal(2)}><circle cx="445" cy="280" r="48" fill={gold}/>{focus.confirmed ? <path d="M421 281l17 17 32-39"/> : <circle cx="445" cy="280" r="22"/>}</motion.g></>}
      {type === 'notice' && <><path d="M95 150h100l170-95v270l-170-95H95Z" fill={pale}/><path d="M150 230l35 95h60l-35-87" fill="white"/>{[0,1,2].map(i=><motion.path key={i} {...reveal(i)} d={`M${425+i*35} ${140-i*25}q${35+i*10} ${50+i*25} 0 ${100+i*50}`} stroke={gold} strokeWidth="9"/>)}</>}
      {type === 'book' && <><path d="M75 90q120-45 245 15 125-60 245-15v220q-120-40-245 15-125-55-245-15Z" fill="white"/><path d="M320 105v220"/>{[0,1,2].map(i=><motion.path key={i} {...reveal(i)} d={`M115 ${140+i*50}q75-20 155 10m100-10q75-20 155-10`} stroke={i===1?gold:pale} strokeWidth="12"/>)}</>}
      {spot && <rect className="lesson-context-figure__focus" x={spot[0]} y={spot[1]} width={spot[2]} height={spot[3]} rx="14" fill={focus.caution ? "#e4b34e0d" : "#214b8008"} stroke={gold} strokeWidth="5" strokeDasharray={focus.caution ? "10 7" : undefined} pointerEvents="none" />}
    </svg>
    <figcaption>{focus.label || descriptions[type]}</figcaption>
    <ul aria-label="Repères du chapitre">{labels.slice(0,3).map((label,i)=><motion.li key={label} {...reveal(i)}>{label}</motion.li>)}</ul>
  </figure>;
}
