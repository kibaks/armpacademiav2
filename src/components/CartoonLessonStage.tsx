import React, { useEffect, useRef, useState } from 'react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { cartoonSpeechMouth } from '../utils/cartoonLessonScene';
import { sampleLessonStoryboard, motionWindow } from '../utils/motionLessonStoryboard';
import { lessonConceptLabels } from '../utils/lessonConceptLabels';
import { advanceLessonMotion, type LessonMotionClock } from '../utils/lessonMotionClock';
import './CartoonLesson.css';

type StageProps = { screen: SingleScreenCardData; progress: number; playing: boolean; speaking: boolean; mouthOpenness: number; viseme: string; male?: boolean; legalRef: string; sceneCount: number; reducedMotion?: boolean };
const ink = '#203B50', teal = '#287A75', gold = '#EAB859', coral = '#E77E65';
type Pen = CanvasRenderingContext2D;
function line(c: Pen, points: number[], color = ink, width = 3) {
 c.beginPath(); c.moveTo(points[0],points[1]); for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]); c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function box(c: Pen,x:number,y:number,w:number,h:number,color:string,r=12,stroke=false) {
 c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=ink;c.lineWidth=3;c.stroke();}
}
function ellipse(c:Pen,x:number,y:number,rx:number,ry:number,color:string) {
 c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function label(c:Pen,text:string,x:number,y:number,size=18,color=ink) {c.fillStyle=color;c.font=`700 ${size}px system-ui, sans-serif`;c.textAlign='center';c.fillText(text,x,y);}
function character(c:Pen,t:number,speaking:boolean,openness:number,viseme:string,male:boolean,progress=1){
 c.save();c.translate(198+Math.sin(t*.9)*5,345);
 c.rotate(Math.sin(t*.9)*.018);
 const pulse=Math.sin(t*1.6)*(speaking?1:.65);
 const gesture=(1-Math.cos(t*.85))*.5;
 const skin='#9B5B3F', darkSkin='#78442F';
 ellipse(c,0,194,92,12,'#D5D9C7');
 // Legs and shoes share the same local body coordinates.
 box(c,-43,75,38,113,ink,16);box(c,9,75,38,113,ink,16);box(c,-53,178,49,18,'#162A3A',8);box(c,8,178,52,18,'#162A3A',8);
 const sleeve=male?'#2D7979':'#E7856E';
 c.beginPath();c.moveTo(-43,-72);c.quadraticCurveTo(0,-91,43,-72);c.lineTo(58,78);c.quadraticCurveTo(0,93,-58,78);c.closePath();c.fillStyle=sleeve;c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
 c.beginPath();c.moveTo(-20,-76);c.lineTo(0,15);c.lineTo(23,-76);c.closePath();c.fillStyle='#FFF8EA';c.fill();line(c,[0,17,0,78],ink,2);ellipse(c,11,43,3,3,gold);
 // Continuous shoulder → elbow → wrist paths: no detached hand sprites.
 line(c,[-44,-58,-73,-6,-50,34],ink,28);line(c,[-44,-58,-73,-6,-50,34],sleeve,22);ellipse(c,-48,40,12,17,skin);
 const greeting=progress<.15;
 const palmX=greeting?62+Math.sin(t*4)*12:78+gesture*36,palmY=greeting?-135+Math.cos(t*4)*8:-35-gesture*57-pulse*12;
 const elbowY=greeting?-96:-3;
 line(c,[44,-58,65,elbowY,palmX,palmY+13],ink,29);line(c,[44,-58,65,elbowY,palmX,palmY+13],sleeve,23);line(c,[palmX,palmY+13,palmX+6,palmY],skin,17);
 c.save();c.translate(palmX+6,palmY);c.rotate(greeting?-1.1+Math.sin(t*4)*.18:-.38);ellipse(c,0,0,20,9,skin);line(c,[-2,0,14,-12],skin,7);for(let i=0;i<3;i++)line(c,[6+i*4,-3,18+i*4,-5+i*3],darkSkin,1.3);c.restore();
 box(c,-15,-110,31,39,skin,9);ellipse(c,0,-145,58,65,'#192C31');
 c.save();c.translate(0,-143);c.rotate(pulse*.055);
 ellipse(c,-42,0,11,16,skin);ellipse(c,43,0,11,16,skin);ellipse(c,0,-4,46,55,skin);
 if(male){c.beginPath();c.moveTo(-46,-15);c.quadraticCurveTo(-53,-68,2,-66);c.quadraticCurveTo(47,-66,48,-13);c.lineTo(25,-40);c.quadraticCurveTo(-12,-22,-46,-15);c.fillStyle='#172B30';c.fill();}
 else{ellipse(c,-39,-25,23,44,'#182E33');ellipse(c,4,-52,49,25,'#182E33');ellipse(c,44,-15,17,45,'#182E33');for(let i=0;i<6;i++)line(c,[-39+i*7,-54,-42+i*5,-6],'#314347',2);ellipse(c,-42,20,4,6,gold);ellipse(c,42,20,4,6,gold);}
 const blink=(t%5.6)>5.43;
 if(blink){line(c,[-26,-6,-13,-6],ink,3);line(c,[14,-6,27,-6],ink,3);}else{ellipse(c,-19,-5,8,6,'#FFF8EA');ellipse(c,20,-5,8,6,'#FFF8EA');ellipse(c,-17,-5,3,4,ink);ellipse(c,22,-5,3,4,ink);}
 line(c,[-28,-20-pulse*3,-12,-22-pulse*3],ink,3);line(c,[12,-22-pulse*3,28,-20-pulse*3],ink,3);line(c,[3,-2,-1,13,6,14],darkSkin,2);
 const mouth=cartoonSpeechMouth(speaking,openness,viseme);
 if(mouth.height<=3){c.beginPath();c.moveTo(-12,25);c.quadraticCurveTo(0,34,13,25);c.strokeStyle='#552E29';c.lineWidth=3;c.stroke();}else{ellipse(c,0,28,mouth.width/2,mouth.height/2,'#512D2B');box(c,-mouth.width*.32,24,mouth.width*.64,3,'#FFF9EB',1);}
 c.restore();c.restore();
}
function wrapCanvasText(c: Pen, text: string, width: number): string[] {
 const lines: string[] = []; let current = '';
 for (const word of text.trim().split(/\s+/)) {
  if (current && c.measureText(current + ' ' + word).width > width) { lines.push(current); current=word; }
  else current += (current ? ' ' : '') + word;
 }
 if (current) lines.push(current);
 return lines;
}
const textLayoutCache = new WeakMap<Pen,Map<string,{lines:string[];size:number}>>();
function fitCanvasText(c: Pen, text: string, width: number, height: number, preferred: number, weight=600) {
 const key=JSON.stringify([text,width,height,preferred,weight]);
 let cache=textLayoutCache.get(c);if(!cache){cache=new Map();textLayoutCache.set(c,cache);}
 const cached=cache.get(key);if(cached){c.font=`${weight} ${cached.size}px system-ui, sans-serif`;return cached;}
 let size=preferred,lines:string[]=[];
 while(true){c.font=`${weight} ${size}px system-ui, sans-serif`;lines=wrapCanvasText(c,text,width);if(lines.length*size*1.4<=height||size<=Math.min(16,preferred))break;size--;}
 const result={lines,size};if(cache.size>=128)cache.clear();cache.set(key,result);return result;
}
function paragraph(c:Pen,text:string,x:number,y:number,width:number,height:number,size:number,color=ink,weight=600){
 const layout=fitCanvasText(c,text,width,height,size,weight);c.fillStyle=color;c.textAlign='left';
 layout.lines.forEach((value,index)=>c.fillText(value,x,y+index*layout.size*1.4));return layout;
}
function trace(c:Pen,points:number[],p:number,color=teal,width=4){
 let length=0;for(let i=2;i<points.length;i+=2)length+=Math.hypot(points[i]-points[i-2],points[i+1]-points[i-1]);
 c.save();c.setLineDash([length]);c.lineDashOffset=length*(1-Math.max(0,Math.min(1,p)));line(c,points,color,width);c.restore();
}
function drawScene(c:Pen,props:StageProps,time:number,w:number,h:number,reduced=false){
 const portrait=w/h<1, W=portrait?720:1280,H=portrait?1120:720;
 const shot=sampleLessonStoryboard(props.screen,props.progress,portrait?20:32);
 const margin=portrait?32:48,navy='#123457',muted='#587088',accent='#D8AA4B';
 c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.scale(w/W,h/H);
 c.fillStyle='#F0F4F8';c.fillRect(0,0,W,H);
 c.fillStyle=navy;c.fillRect(0,0,W,portrait?174:148);
 c.textAlign='left';c.font=`700 ${portrait?17:13}px system-ui,sans-serif`;c.fillStyle='#F2CF88';
 c.fillText('ARMP  /  ACADEMIA',margin,39);
 c.textAlign='right';c.fillStyle='#D4E2F0';c.font=`600 ${portrait?16:12}px system-ui,sans-serif`;
 c.fillText(`SÉQUENCE ${String(props.screen.screenNumber).padStart(2,'0')} / ${String(props.sceneCount).padStart(2,'0')}`,W-margin,39);
 paragraph(c,props.screen.title,margin,portrait?94:96,W-margin*2,80,portrait?35:37,'#FFFFFF',750);
 box(c,margin,portrait?150:128,72,4,accent,2);
 const boardY=portrait?196:184,boardH=portrait?435:400,boardW=portrait?656:688;
 box(c,margin,boardY+5,boardW,boardH,'#E1E8F0',24);
 box(c,margin,boardY,boardW,boardH,'#FFFFFF',24);
 c.textAlign='left';c.font=`700 ${portrait?15:12}px system-ui,sans-serif`;c.fillStyle=muted;
 c.fillText('LES REPÈRES DU COURS',margin+26,boardY+34);
 // The presenter accompanies source-derived concepts; no invented legal steps.
 c.save();c.translate(portrait?-23:-9,boardY-29);c.scale(.62,.62);
 character(c,reduced?0:time,props.speaking,props.mouthOpenness,props.viseme,Boolean(props.male),1);
 c.restore();
 const terms=lessonConceptLabels(shot.text,props.screen.title);
 const items=terms.length?terms:['La notion à comprendre'];
 const cardX=portrait?270:296,cardW=portrait?370:408;
 items.forEach((term,index)=>{
  const entry=reduced?1:motionWindow(props.progress,.06+index*.09,.2+index*.09);
  const y=boardY+64+index*97;
  c.save();c.globalAlpha=.28+.72*entry;c.translate((1-entry)*12,0);
  box(c,cardX,y,cardW,78,'#F0F5FA',14);
  box(c,cardX,y,4,78,index===shot.pageIndex%items.length?accent:'#C3D4E5',2);
  ellipse(c,cardX+36,y+39,17,17,navy);
  ellipse(c,cardX+36,y+39,3,3,'#FFFFFF');
  paragraph(c,term.charAt(0).toUpperCase()+term.slice(1),cardX+67,y+31,cardW-86,62,portrait?23:24,navy,700);
  c.restore();
 });
 const textY=portrait?658:184,textX=portrait?32:768,textW=portrait?656:464,textH=portrait?340:400;
 box(c,textX,textY,textW,textH,'#FFFFFF',24);
 box(c,textX+26,textY+25,shot.phase==='rule'?136:159,28,shot.phase==='rule'?'#FFF3D8':'#EAF3F4',7);
 c.textAlign='left';c.fillStyle=shot.phase==='rule'?'#88601A':'#286D69';c.font=`750 ${portrait?14:11}px system-ui,sans-serif`;
 c.fillText(shot.phase==='rule'?'LE BON RÉFLEXE':'L’IDÉE ESSENTIELLE',textX+38,textY+44);
 const appear=reduced?1:motionWindow(shot.pageProgress,0,.1);
 c.save();c.globalAlpha=appear;c.translate(0,(1-appear)*8);
 // Display each complete thought together; no flickering letter-by-letter text.
 paragraph(c,shot.text,textX+27,textY+112,textW-54,textH-132,portrait?33:33,navy,700);
 c.restore();
 const lowerY=portrait?1044:632;
 c.fillStyle=navy;c.textAlign='left';c.font=`700 ${portrait?18:14}px system-ui,sans-serif`;
 c.fillText(`${props.male?'Prof. Henri':'Prof. Aïsha'} · ${shot.phase==='rule'?'À retenir':'Explication'}`,margin,lowerY);
 paragraph(c,props.screen.legalArticle||props.legalRef,portrait?340:765,lowerY,portrait?346:466,49,portrait?16:13,muted,500);
 box(c,margin,H-30,W-margin*2,5,'#D7E2ED',3);
 box(c,margin,H-30,(W-margin*2)*Math.max(0,Math.min(1,props.progress)),5,accent,3);
 c.restore();
}
export const CartoonLessonStage: React.FC<StageProps> = props => {
 const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef(props);latest.current=props;
 const motionClock = useRef<LessonMotionClock>({seconds:0,previous:null});
 useEffect(()=>{motionClock.current={seconds:0,previous:null};},[props.screen.animationId,props.screen.screenNumber,props.screen.title]);
 const [systemReduced,setReduced]=useState(false);
 const reduced=systemReduced||Boolean(props.reducedMotion);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;const context=canvas.getContext('2d');if(!context)return;
  let frame=0,last=0;let disposed=false;
  const paint=(time:number)=>{if(disposed)return;const seconds=advanceLessonMotion(motionClock.current,time,props.playing&&!reduced&&!document.hidden);if(!document.hidden&&(time-last>=33||!last)){const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);const w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);if(w&&h){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}drawScene(context,latest.current,reduced?0:seconds,w,h,reduced);}last=time;}if(props.playing&&!reduced)frame=requestAnimationFrame(paint);};
  const redraw=()=>{last=0;if(!props.playing||reduced)paint(performance.now());};
  const resize=new ResizeObserver(redraw);resize.observe(canvas);frame=requestAnimationFrame(paint);document.addEventListener('visibilitychange',redraw);
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',redraw);};
 },[props.playing,reduced]);
 useEffect(()=>{
  if(props.playing&&!reduced)return;
  const canvas=canvasRef.current,context=canvas?.getContext('2d');
  if(canvas&&context)drawScene(context,latest.current,reduced?0:motionClock.current.seconds,canvas.width,canvas.height,reduced);
 },[props.playing,reduced,props.screen.animationId,props.progress,props.speaking,props.male,props.mouthOpenness,props.viseme]);
 return <section className="cartoon-film" aria-label={`Scène ${props.screen.screenNumber} : ${props.screen.title}`}>
  <figure className="cartoon-film__frame">
   <canvas ref={canvasRef} aria-hidden="true" className="cartoon-film__canvas"/>
   <figcaption className="sr-only">{props.male?'Prof. Henri':'Prof. Aïsha'} explique {props.screen.title}. Repères du cours : {lessonConceptLabels(props.screen.explanation+' '+props.screen.fieldRule,props.screen.title).join(', ')}.</figcaption>
  </figure>
  <details className="cartoon-film__transcript">
   <summary>Lire la transcription de cette scène</summary>
   <h3>{props.screen.title}</h3><p>{props.screen.explanation}</p><h4>Le bon réflexe</h4><p>{props.screen.fieldRule}</p><small>{props.screen.legalArticle || props.legalRef}</small>
  </details>
 </section>;
};
