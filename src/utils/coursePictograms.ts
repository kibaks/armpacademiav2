/** Code-drawn illustrations of source concepts; no implied legal sequence. */
export function coursePictogramKind(text:string){
 const s=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(/citoyen|famille|communaute|personne|eleve/.test(s))return 'people';
 if(/autorite|entreprise|institution|ecole|administration/.test(s))return 'building';
 if(/prix|budget|credit|paiement|financ|montant/.test(s))return 'coins';
 if(/travaux|ouvrage|chantier|construction/.test(s))return 'works';
 if(/controle|verifi|conform|garantie/.test(s))return 'shield';
 if(/egalite|equite|concurrence|transparence/.test(s))return 'scales';
 return 'document';
}
export function drawCoursePictogram(c:CanvasRenderingContext2D,term:string,x:number,y:number,time:number){
 c.save();c.translate(x,y);c.lineWidth=2.5;c.lineCap='round';c.lineJoin='round';
 const navy='#123457',gold='#D8AA4B',teal='#6D9D99';
 const line=(p:number[],color=navy,width=2.5)=>{c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.beginPath();c.roundRect(x,y,w,h,3);c.fillStyle=color;c.fill();};
 const circle=(x:number,y:number,r:number,color:string)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();};
 const kind=coursePictogramKind(term),beat=(Math.sin(time*1.7)+1)/2;
 circle(0,0,37,'#E7EFF6');
 if(kind==='building'){
  c.beginPath();c.moveTo(-28,-12);c.lineTo(0,-30);c.lineTo(28,-12);c.closePath();c.fillStyle=navy;c.fill();
  rect(-26,-9,52,5,gold);for(const dx of [-19,-4,11])rect(dx,0,8,23,teal);rect(-29,25,58,5,navy);
  const p=(time*.3)%1;rect(-37+p*17,7-p*5,12,17,'#FFF3D8');
 }else if(kind==='people'){
  for(const dx of [-21,21,0]){const dy=Math.sin(time*1.5+dx*.03)*2;circle(dx,-15+dy,7,dx===0?navy:teal);rect(dx-9,-3+dy,18,25,dx===0?navy:teal);}
 }else if(kind==='coins'){
  for(let i=0;i<3;i++)rect(-28+i*20,23-(10+i*10),14,10+i*10,[navy,teal,gold][i]);
  circle(17,-25+beat*10,10,gold);line([13,-25+beat*10,21,-25+beat*10],'#FFFFFF',2);
 }else if(kind==='works'){
  line([-30,27,30,27],navy,3);line([-17,25,-17,-28,18,-28,18,-18],navy,3);line([-29,-18,31,-18],gold,4);
  const hook=8+Math.sin(time*1.2)*13;line([hook,-18,hook,4],navy,2);rect(hook-9,4,18,10,teal);
  for(let i=0;i<3;i++)rect(i*10,18,8,7,gold);
 }else if(kind==='shield'){
  c.beginPath();c.moveTo(-23,-26);c.lineTo(0,-32);c.lineTo(23,-26);c.lineTo(20,4);c.lineTo(0,29);c.lineTo(-20,4);c.closePath();c.fillStyle='#D9ECE8';c.fill();c.strokeStyle=teal;c.lineWidth=2;c.stroke();
  line([-13,-3,-3,8,15,-13],navy,4);const scan=-22+((time*.3)%1)*42;line([-16,scan,16,scan],gold,2);
 }else if(kind==='scales'){
  const tilt=Math.sin(time*1.1)*3;line([0,-29,0,25,-18,25,18,25],navy,3);line([-28,-16+tilt,28,-16-tilt],gold,3);
  for(const dx of [-22,22]){const dy=dx<0?tilt:-tilt;line([dx,-16+dy,dx-10,8+dy,dx+10,8+dy,dx,-16+dy],navy,2);line([dx-10,9+dy,dx,15+dy,dx+10,9+dy],teal,3);}
 }else{
  rect(-22,-29,44,58,'#FFFFFF');line([-22,-29,22,-29,22,29,-22,29,-22,-29],navy,2);
  for(let i=0;i<4;i++)line([-14,-16+i*11,-14+(28-i*3)*Math.min(1,((time*.35+i*.23)%1)*2),-16+i*11],i===0?gold:teal,2.5);
 }
 c.restore();
}
