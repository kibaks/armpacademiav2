import type { CartoonSceneKind } from './cartoonLessonScene';
export type DrawingStroke = number[];
const rectangle=(x:number,y:number,w:number,h:number):DrawingStroke=>[x,y,x+w,y,x+w,y+h,x,y+h,x,y];
const paper=[rectangle(295,60,85,120),[310,85,355,85],[310,108,365,108],[310,130,353,130],[310,153,365,153]];
export const WHITEBOARD_STROKES:Record<CartoonSceneKind,DrawingStroke[]>={
 justice:[[150,180,150,25],[75,55,225,55],[80,55,45,125,115,125,80,55],[220,55,185,125,255,125,220,55],[105,180,195,180],...paper],
 institutions:[rectangle(20,65,100,115),[10,65,70,25,130,65],[40,90,40,150],[70,90,70,150],[100,90,100,150],rectangle(170,65,100,115),[160,65,220,25,280,65],[190,90,190,150],[220,90,220,150],[250,90,250,150],[125,122,165,122],...paper],
 logistics:[rectangle(25,95,190,80),[215,115,260,115,285,145,285,175,215,175],[60,175,45,190,60,205,75,190,60,175],[240,175,225,190,240,205,255,190,240,175],[100,95,100,25,285,25,285,75],...paper],
 planning:[rectangle(30,35,225,175),[30,75,255,75],[65,25,65,50],[215,25,215,50],[70,100,215,100],[70,130,215,130],[70,160,215,160],[125,160,140,175,175,140],...paper],
 tender:[rectangle(35,90,225,100),[25,75,270,75,270,90,25,90,25,75],[105,30,190,30,190,85,105,85,105,30],[105,30,147,60,190,30],[110,95,190,95],...paper],
 review:[rectangle(25,35,245,145),[40,50,255,50,255,155,40,155,40,50],[65,130,100,100,135,113,175,77,225,65],[135,180,135,200,165,200,165,180],[90,210,210,210],...paper],
};
export function sampleDrawing(strokes:DrawingStroke[],progress:number){
 const lengths=strokes.map(points=>{let length=0;for(let i=2;i<points.length;i+=2)length+=Math.hypot(points[i]-points[i-2],points[i+1]-points[i-1]);return length;});
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 let remaining=p*lengths.reduce((a,b)=>a+b,0);
 let cursor={x:strokes[0]?.[0]||0,y:strokes[0]?.[1]||0};
 const visible=strokes.map((points,index)=>{
  const amount=p===1?lengths[index]:Math.max(0,Math.min(lengths[index],remaining));remaining-=lengths[index];
  if(amount>0){let distance=amount;for(let i=2;i<points.length;i+=2){const span=Math.hypot(points[i]-points[i-2],points[i+1]-points[i-1]);const ratio=span?Math.min(1,distance/span):1;cursor={x:points[i-2]+(points[i]-points[i-2])*ratio,y:points[i-1]+(points[i+1]-points[i-1])*ratio};if(distance<=span)break;distance-=span;}}
  return lengths[index]?amount/lengths[index]:1;
 });
 return {visible,cursor,complete:p===1};
}
