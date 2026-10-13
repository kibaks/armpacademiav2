import React, { useEffect, useRef, useState } from 'react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { cartoonSceneKind, cartoonSpeechMouth, CARTOON_SCENE_LABELS } from '../utils/cartoonLessonScene';
import { sampleLessonStoryboard, motionWindow, typewriterCount } from '../utils/motionLessonStoryboard';
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
function cloud(c:Pen,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,0,48,17,'#FFFFFF');ellipse(c,-19,-11,24,22,'#FFFFFF');ellipse(c,14,-15,28,25,'#FFFFFF');c.restore();}
function plant(c:Pen,x:number,y:number){box(c,x-20,y,40,37,coral,6);line(c,[x,y,x,y-100],teal,5);for(let i=0;i<3;i++){ellipse(c,x-16,y-25-i*24,20,9,teal);ellipse(c,x+16,y-40-i*24,20,9,'#3F9B84');}}
function documentCard(c:Pen,x:number,y:number,s=1){c.save();c.translate(x,y);c.scale(s,s);box(c,0,0,102,124,'#FFFDF7',9,true);box(c,17,18,44,9,gold,3);for(let i=0;i<4;i++)line(c,[18,45+i*15,82-(i%2)*18,45+i*15],'#8DACA8',5);ellipse(c,79,106,14,14,teal);line(c,[72,106,77,111,86,101],'#fff',3);c.restore();}
function building(c:Pen,x:number,y:number,name:string,color:string){
 c.save();c.translate(x,y);box(c,0,0,126,123,'#FFF9EB',4,true);c.beginPath();c.moveTo(-10,0);c.lineTo(63,-43);c.lineTo(136,0);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
 for(let i=0;i<3;i++){box(c,16+i*35,22,20,75,'#B6D7D0',2);box(c,14+i*35,96,24,5,color,2);}box(c,-9,123,144,12,color,3);label(c,name,63,160,19);c.restore();
}
function sceneProps(c:Pen,kind:ReturnType<typeof cartoonSceneKind>,t:number,p:number){
 c.save();c.translate(350,255);
 if(kind==='justice'){
  box(c,33,168,255,16,'#BED4CD',8);box(c,78,124,160,45,'#FFF9E8',6,true);box(c,148,-20,15,142,gold,5,true);line(c,[63,20,244,20],ink,8);
  const tilt=Math.sin(t*1.5)*5;line(c,[65,20,65,84+tilt],ink,3);line(c,[243,20,243,84-tilt],ink,3);
  for(const [x,y] of [[65,86+tilt],[243,86-tilt]]){c.beginPath();c.moveTo(x-47,y);c.quadraticCurveTo(x,y+47,x+47,y);c.closePath();c.fillStyle=teal;c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();line(c,[x-47,y,x,y-32,x+47,y],ink,2);}
  documentCard(c,270,58,.7);label(c,'ÉGALITÉ • TRANSPARENCE',168,214,18);
 }else if(kind==='institutions'){
  building(c,-5,36,'CGPMP',teal);building(c,145,0,'DGCMP',coral);building(c,292,36,'ARMP',gold);
  line(c,[78,-17,180,-60,350,-17],'#779AA0',3);ellipse(c,213,-60,14,14,gold);line(c,[205,-60,211,-54,221,-67],ink,3);
 }else if(kind==='logistics'){
  box(c,15,18,145,95,'#A8D2CA',7,true);box(c,158,52,69,61,gold,8,true);box(c,169,63,40,23,'#F9FCF9',3);ellipse(c,54,119,23,23,ink);ellipse(c,181,119,23,23,ink);ellipse(c,54,119,10,10,'#FDF7E9');ellipse(c,181,119,10,10,'#FDF7E9');
  line(c,[290,142,290,-80,393,-80],ink,7);line(c,[290,-80,344,-115,383,-80],coral,5);line(c,[359,-80,359,24+Math.sin(t)*8],ink,3);box(c,327,27+Math.sin(t)*8,62,38,gold,3,true);box(c,263,141,60,14,coral,4);
  label(c,'TRAVAUX & FOURNITURES',204,192,18);
 }else if(kind==='planning'){
  box(c,20,-25,230,189,'#FFFDF7',12,true);box(c,20,-25,230,45,teal,12);label(c,'PLANIFIER',135,5,19,'#fff');
  for(let i=0;i<12;i++)box(c,42+(i%4)*51,41+Math.floor(i/4)*34,32,22,i<Math.round(p*12)?gold:'#DCE6DE',4);
  documentCard(c,273,30,.9);label(c,'UN DOSSIER BIEN PRÉPARÉ',194,203,18);
 }else if(kind==='tender'){
  box(c,37,62,220,101,teal,12,true);box(c,27,42,242,28,'#A8D2CA',8,true);box(c,113,53,61,5,ink,2);
  const y=-42+Math.min(1,p*1.5)*59;box(c,101,y,84,57,'#FFFDF7',5,true);line(c,[101,y,143,y+31,185,y],coral,3);
  ellipse(c,148,114,25,25,gold);line(c,[135,114,144,123,162,103],ink,4);documentCard(c,293,50,.75);label(c,'UNE PROCÉDURE TRAÇABLE',199,208,18);
 }else{
  box(c,40,29,239,132,ink,12);box(c,53,42,213,98,'#D7ECE4',5);line(c,[78,115,106,95,142,106,179,72,224,63],teal,5);box(c,133,160,45,24,ink,4);box(c,99,180,118,11,ink,5);
  documentCard(c,300,58,.72);c.save();c.translate(284,-3);c.rotate(-.4+Math.sin(t)*.05);box(c,-54,-14,108,30,coral,8,true);box(c,-6,10,12,72,gold,5,true);c.restore();label(c,'VÉRIFIER • DÉCIDER • ARCHIVER',201,225,17);
 }
 c.restore();
}
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
 const reveal=reduced?1:shot.titleReveal;
 c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.scale(w/W,h/H);
 const kind=cartoonSceneKind(props.screen.animationId);
 c.fillStyle='#FFFDF9';c.fillRect(0,0,W,H);
 // Pastel geometric scene framing, based on the Teacher Video Resume reference.
 c.fillStyle='#DEEEEE';c.beginPath();c.moveTo(0,0);c.lineTo(W*.62,0);c.lineTo(0,H*.72);c.closePath();c.fill();
 c.fillStyle='#F0B9A4';c.beginPath();c.moveTo(0,H*.2);c.lineTo(W*.57,H);c.lineTo(0,H);c.closePath();c.fill();
 c.fillStyle='#F4E4BA';c.beginPath();c.moveTo(W,H*.72);c.lineTo(W,H);c.lineTo(W*.78,H);c.closePath();c.fill();
 const margin=portrait?38:48;
 box(c,margin,24,portrait?210:140,portrait?36:28,ink,8);label(c,'ACADEMIA • ANIMÉ',margin+(portrait?105:70),portrait?48:43,portrait?19:10,'#FFF5DA');
 c.textAlign='right';c.fillStyle='#58766C';c.font=`700 ${portrait?20:12}px system-ui, sans-serif`;c.fillText(`SÉQUENCE ${String(props.screen.screenNumber).padStart(2,'0')} / ${String(props.sceneCount).padStart(2,'0')}`,W-margin,43);
 c.save();c.translate(0,(1-reveal)*14);c.globalAlpha=.75+.25*reveal;
 paragraph(c,props.screen.title,margin,portrait?100:99,W-margin*2,portrait?112:96,portrait?34:36,ink,800);
 c.restore();trace(c,[margin,portrait?202:163,margin+105,portrait?202:163],reveal,coral,5);
 const artY=portrait?150:40,artScale=portrait?.84:1;
 c.save();c.translate(portrait?0:-18,artY);c.scale(artScale,artScale);
 // Color illustrations enter as a scene rather than a hand-drawn whiteboard.
 const objectReveal=reduced?1:motionWindow(props.progress,.035,.19);
 c.save();c.translate(550,365+(1-objectReveal)*35);
 c.scale(.86+.14*objectReveal,.86+.14*objectReveal);c.translate(-550,-365);
 c.globalAlpha=objectReveal;
 sceneProps(c,kind,reduced?0:time,reduced?1:props.progress);
 c.restore();
 const arrow=motionWindow(props.progress,.12,.36);
 trace(c,[285,282,320,282,320,223,350,223],reduced?1:arrow,coral,4);
 if(arrow>.95||reduced)line(c,[340,214,350,223,340,232],coral,3);
 character(c,time,props.speaking,props.mouthOpenness,props.viseme,Boolean(props.male),reduced?1:props.progress);
 c.restore();
 const x=portrait?38:824,y=portrait?650:208,bw=portrait?644:408,bh=portrait?355:366;
 c.save();c.translate(0,reduced?0:(1-motionWindow(shot.pageProgress,0,.13))*10);
 c.textAlign='left';c.font=`800 ${portrait?20:12}px system-ui, sans-serif`;c.fillStyle=shot.phase==='rule'?'#926027':teal;
 c.fillText(shot.phase==='rule'?'À RETENIR':'L’IDÉE ESSENTIELLE',x+25,y+34);
 // Layout the complete sentence once so words never jump between lines while typing.
 const layout=fitCanvasText(c,shot.text,bw-50,bh-125,portrait?48:38,800);
 let remaining=typewriterCount(shot.text,shot.pageProgress,reduced);
 let cursorX=0,cursorY=0;
 c.save();c.translate(x+25,y+103);
 c.font=`800 ${layout.size}px system-ui, sans-serif`;
 c.fillStyle=shot.phase==='rule'?teal:ink;c.textAlign='left';
 layout.lines.forEach((text,index)=>{
  const characters=Array.from(new Intl.Segmenter('fr',{granularity:'grapheme'}).segment(text),part=>part.segment);
  const visible=characters.slice(0,Math.max(0,remaining)).join('');
  if(visible){c.fillText(visible,0,index*layout.size*1.4);cursorX=c.measureText(visible).width;cursorY=index*layout.size*1.4;}
  remaining-=characters.length+1;
 });
 if(!reduced && props.playing && (shot.pageProgress<.5 || Math.floor(time*2)%2===0)){
  box(c,Math.min(cursorX+4,bw-54),cursorY-layout.size*.8,3,layout.size,coral,1);
 }
 c.restore();
 trace(c,[x+25,y+bh-40,x+145,y+bh-40],reduced?1:motionWindow(shot.pageProgress,.25,.65),shot.phase==='rule'?coral:teal,6);
 c.restore();
 // Shape-layer progress and a lower-third stay inside the video composition.
 const lowerY=portrait?1060:657;
 box(c,margin,lowerY-32,portrait?285:243,39,ink,12);c.fillStyle='#FFF8E4';c.textAlign='left';c.font=`700 ${portrait?23:13}px system-ui, sans-serif`;c.fillText(`${props.male?'Prof. Henri':'Prof. Aïsha'}  •  ${shot.phase==='rule'?'À retenir':'Explication'}`,margin+16,lowerY-8);
 paragraph(c,props.screen.legalArticle||props.legalRef,portrait?340:820,lowerY-15,portrait?342:410,45,portrait?24:13,'#506D61',600);
 box(c,margin,H-24,W-margin*2,4,'#D6E4D8',2);box(c,margin,H-24,(W-margin*2)*Math.max(0,Math.min(1,props.progress)),4,shot.phase==='rule'?coral:teal,2);
 c.restore();
}
export const CartoonLessonStage: React.FC<StageProps> = props => {
 const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef(props);latest.current=props;
 const [systemReduced,setReduced]=useState(false);
 const reduced=systemReduced||Boolean(props.reducedMotion);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;const context=canvas.getContext('2d');if(!context)return;
  let frame=0,last=0;let disposed=false;
  const paint=(time:number)=>{if(disposed)return;if(!document.hidden&&(time-last>=33||!last)){const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);const w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);if(w&&h){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}drawScene(context,latest.current,reduced?0:time/1000,w,h,reduced);}last=time;}if(props.playing&&!reduced)frame=requestAnimationFrame(paint);};
  const redraw=()=>{last=0;if(!props.playing||reduced)paint(performance.now());};
  const resize=new ResizeObserver(redraw);resize.observe(canvas);frame=requestAnimationFrame(paint);document.addEventListener('visibilitychange',redraw);
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',redraw);};
 },[props.playing,reduced]);
 useEffect(()=>{
  if(props.playing&&!reduced)return;
  const canvas=canvasRef.current,context=canvas?.getContext('2d');
  if(canvas&&context)drawScene(context,latest.current,0,canvas.width,canvas.height,reduced);
 },[props.playing,reduced,props.screen.animationId,props.progress,props.speaking,props.male,props.mouthOpenness,props.viseme]);
 return <section className="cartoon-film" aria-label={`Scène ${props.screen.screenNumber} : ${props.screen.title}`}>
  <figure className="cartoon-film__frame">
   <canvas ref={canvasRef} aria-hidden="true" className="cartoon-film__canvas"/>
   <figcaption className="sr-only">{props.male?'Prof. Henri':'Prof. Aïsha'} explique {props.screen.title}. {CARTOON_SCENE_LABELS[cartoonSceneKind(props.screen.animationId)]}.</figcaption>
  </figure>
  <details className="cartoon-film__transcript">
   <summary>Lire la transcription de cette scène</summary>
   <h3>{props.screen.title}</h3><p>{props.screen.explanation}</p><h4>Le bon réflexe</h4><p>{props.screen.fieldRule}</p><small>{props.screen.legalArticle || props.legalRef}</small>
  </details>
 </section>;
};
