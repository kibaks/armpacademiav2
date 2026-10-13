import React, { useEffect, useRef, useState } from 'react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { cartoonSceneKind, cartoonSpeechMouth, CARTOON_SCENE_LABELS } from '../utils/cartoonLessonScene';
import './CartoonLesson.css';

type StageProps = { screen: SingleScreenCardData; progress: number; playing: boolean; speaking: boolean; mouthOpenness: number; viseme: string; male?: boolean; legalRef: string; sceneCount: number };
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
function character(c:Pen,t:number,speaking:boolean,openness:number,viseme:string,male:boolean){
 c.save();c.translate(198,345);
 const pulse=speaking?Math.sin(t*2.4):Math.sin(t*1.1)*.25;
 const skin='#9B5B3F', darkSkin='#78442F';
 ellipse(c,0,194,92,12,'#D5D9C7');
 // Legs and shoes share the same local body coordinates.
 box(c,-43,75,38,113,ink,16);box(c,9,75,38,113,ink,16);box(c,-53,178,49,18,'#162A3A',8);box(c,8,178,52,18,'#162A3A',8);
 const sleeve=male?'#2D7979':'#E7856E';
 c.beginPath();c.moveTo(-43,-72);c.quadraticCurveTo(0,-91,43,-72);c.lineTo(58,78);c.quadraticCurveTo(0,93,-58,78);c.closePath();c.fillStyle=sleeve;c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();
 c.beginPath();c.moveTo(-20,-76);c.lineTo(0,15);c.lineTo(23,-76);c.closePath();c.fillStyle='#FFF8EA';c.fill();line(c,[0,17,0,78],ink,2);ellipse(c,11,43,3,3,gold);
 // Continuous shoulder → elbow → wrist paths: no detached hand sprites.
 line(c,[-44,-58,-73,-6,-50,34],ink,28);line(c,[-44,-58,-73,-6,-50,34],sleeve,22);ellipse(c,-48,40,12,17,skin);
 const palmX=100,palmY=-51-pulse*9;
 line(c,[44,-58,65,-3,palmX,palmY+13],ink,29);line(c,[44,-58,65,-3,palmX,palmY+13],sleeve,23);line(c,[91,palmY+21,104,palmY+5],skin,17);
 c.save();c.translate(palmX+6,palmY);c.rotate(-.38);ellipse(c,0,0,20,9,skin);line(c,[-2,0,14,-12],skin,7);for(let i=0;i<3;i++)line(c,[6+i*4,-3,18+i*4,-5+i*3],darkSkin,1.3);c.restore();
 box(c,-15,-110,31,39,skin,9);ellipse(c,0,-145,58,65,'#192C31');
 c.save();c.translate(0,-143);c.rotate(pulse*.018);
 ellipse(c,-42,0,11,16,skin);ellipse(c,43,0,11,16,skin);ellipse(c,0,-4,46,55,skin);
 if(male){c.beginPath();c.moveTo(-46,-15);c.quadraticCurveTo(-53,-68,2,-66);c.quadraticCurveTo(47,-66,48,-13);c.lineTo(25,-40);c.quadraticCurveTo(-12,-22,-46,-15);c.fillStyle='#172B30';c.fill();}
 else{ellipse(c,-39,-25,23,44,'#182E33');ellipse(c,4,-52,49,25,'#182E33');ellipse(c,44,-15,17,45,'#182E33');for(let i=0;i<6;i++)line(c,[-39+i*7,-54,-42+i*5,-6],'#314347',2);ellipse(c,-42,20,4,6,gold);ellipse(c,42,20,4,6,gold);}
 const blink=(t%5.6)>5.43;
 if(blink){line(c,[-26,-6,-13,-6],ink,3);line(c,[14,-6,27,-6],ink,3);}else{ellipse(c,-19,-5,8,6,'#FFF8EA');ellipse(c,20,-5,8,6,'#FFF8EA');ellipse(c,-17,-5,3,4,ink);ellipse(c,22,-5,3,4,ink);}
 line(c,[-28,-20,-12,-22],ink,3);line(c,[12,-22,28,-20],ink,3);line(c,[3,-2,-1,13,6,14],darkSkin,2);
 const mouth=cartoonSpeechMouth(speaking,openness,viseme);
 if(mouth.height<=3){c.beginPath();c.moveTo(-12,25);c.quadraticCurveTo(0,34,13,25);c.strokeStyle='#552E29';c.lineWidth=3;c.stroke();}else{ellipse(c,0,28,mouth.width/2,mouth.height/2,'#512D2B');box(c,-mouth.width*.32,24,mouth.width*.64,3,'#FFF9EB',1);}
 c.restore();c.restore();
}
function drawScene(c:Pen,props:StageProps,time:number,w:number,h:number){
 c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.scale(w/800,h/650);
 const kind=cartoonSceneKind(props.screen.animationId);
 c.fillStyle='#EDF2E6';c.fillRect(0,0,800,650);c.fillStyle='#D6E9E6';c.fillRect(0,0,800,468);
 ellipse(c,638,99,48,48,'#FFF3C6');cloud(c,99+(Math.sin(time*.15)*8),98,.8);cloud(c,428,70,.65);
 // A quiet skyline and stage floor establish a continuous illustrated setting.
 for(let i=0;i<9;i++){const x=346+i*53,y=207-(i%3)*32;box(c,x,y,40,261-y,'#BED4CC',4);for(let j=0;j<3;j++)box(c,x+11,y+15+j*23,17,9,'#D6E9E6',2);}
 c.fillStyle='#EEF2E3';c.fillRect(0,458,800,192);line(c,[0,459,800,459],'#A1BFB4',2);
 box(c,321,206,445,314,'#FFF9E8',24);box(c,321,206,445,44,'#FAF0D7',24);
 for(let i=0;i<3;i++)ellipse(c,343+i*14,228,4,4,[coral,gold,teal][i]);
 sceneProps(c,kind,time,props.progress);
 plant(c,62,538);plant(c,754,562);
 character(c,time,props.speaking,props.mouthOpenness,props.viseme,Boolean(props.male));
 c.restore();
}
export const CartoonLessonStage: React.FC<StageProps> = props => {
 const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef(props);latest.current=props;
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;const context=canvas.getContext('2d');if(!context)return;
  let frame=0,last=0;let disposed=false;
  const paint=(time:number)=>{if(disposed)return;if(!document.hidden&&(time-last>=33||!last)){const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);const w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);if(w&&h){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}drawScene(context,latest.current,reduced?0:time/1000,w,h);}last=time;}if(props.playing&&!reduced)frame=requestAnimationFrame(paint);};
  const redraw=()=>{last=0;if(!props.playing||reduced)paint(performance.now());};
  const resize=new ResizeObserver(redraw);resize.observe(canvas);frame=requestAnimationFrame(paint);document.addEventListener('visibilitychange',redraw);
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',redraw);};
 },[props.playing,reduced]);
 useEffect(()=>{
  if(props.playing&&!reduced)return;
  const canvas=canvasRef.current,context=canvas?.getContext('2d');
  if(canvas&&context)drawScene(context,latest.current,0,canvas.width,canvas.height);
 },[props.playing,reduced,props.screen.animationId,props.progress,props.speaking,props.male,props.mouthOpenness,props.viseme]);
 const fieldPhase=props.progress>=props.screen.fieldRuleStartRatio;
 return <section className="cartoon-scene" aria-label={`Scène ${props.screen.screenNumber} : ${props.screen.title}`}>
  <figure className="cartoon-scene__art">
   <div className="cartoon-scene__scene-label"><span className="cartoon-scene__dot"/>SCÈNE {String(props.screen.screenNumber).padStart(2,'0')}<span> / {String(props.sceneCount).padStart(2,'0')}</span></div>
   <canvas ref={canvasRef} aria-hidden="true" className="cartoon-scene__canvas"/>
   <figcaption className="cartoon-scene__caption"><span className="cartoon-scene__speaker">{props.male?'Prof. Henri':'Prof. Aïsha'}</span><span>{CARTOON_SCENE_LABELS[cartoonSceneKind(props.screen.animationId)]}</span></figcaption>
  </figure>
  <div className="cartoon-scene__story" key={props.screen.screenNumber+props.screen.title}>
   <span className="cartoon-scene__eyebrow">{["Comprendre l’enjeu", "Découvrir la règle", "Passer à l’action", "Retenir l’essentiel", "Vérifier ses acquis"][Math.max(0,Math.min(4,props.screen.screenNumber-1))]}</span>
   <h3>{props.screen.title}</h3>
   <div className="cartoon-scene__divider"/>
   <p className="cartoon-scene__explanation">{props.screen.explanation}</p>
   <div className={`cartoon-scene__takeaway ${fieldPhase?'is-emphasized':''}`}>
    <span className="cartoon-scene__takeaway-label"><span aria-hidden="true">✦</span> LE BON RÉFLEXE</span>
    <p>{props.screen.fieldRule}</p>
   </div>
   <div className="cartoon-scene__legal"><span>REPÈRE JURIDIQUE</span><p>{props.screen.legalArticle || props.legalRef}</p></div>
  </div>
 </section>;
};
