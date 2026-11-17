import React, { useEffect, useRef, useState } from 'react';
import { Clapperboard, Download, LoaderCircle, Play, RefreshCw } from 'lucide-react';
import type { SingleScreenCardData } from './ProfessorFilmScenes';
import { courseMotionStoryboard, courseVideoRequest, waitForCourseVideo } from '../utils/courseMotionVideo';
import { authenticatedFetch } from '../lib/adminApi';

type Props={courseId:string;lessonIndex:number;chapter:string;screens:SingleScreenCardData[];sentences:string[];userId?:string;onPrepare:()=>void};
type State={kind:'idle'|'working'|'ready'|'error';progress:number;label?:string;id?:string;url?:string;error?:string};
export function CourseMotionVideo(props:Props){
 const [music,setMusic]=useState(true),[state,setState]=useState<State>({kind:'idle',progress:0}),[downloading,setDownloading]=useState(false);
 const active=useRef<AbortController|null>(null),generation=useRef(0);
 const key=props.courseId+':'+props.lessonIndex;
 useEffect(()=>{generation.current++;active.current?.abort();setState({kind:'idle',progress:0});return()=>{generation.current++;active.current?.abort();};},[key]);
 const generate=async()=>{
  if(active.current && !active.current.signal.aborted && state.kind==='working')return;
  props.onPrepare();active.current?.abort();const controller=new AbortController();active.current=controller;
  const current=++generation.current,valid=()=>current===generation.current && !controller.signal.aborted;
  setState({kind:'working',progress:0,label:'Préparation du film du chapitre…'});
  try{
   const source=JSON.stringify(['course-film-v2-vector',props.sentences,props.screens,music]);
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
   const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   const storageKey=`academia-course-film-v2-vector:${props.userId||'session'}:${key}:${music}`;
   let saved:{id?:string;fingerprint?:string}|null=null;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
   if(saved?.fingerprint===fingerprint && /^[a-f0-9]{64}$/.test(saved.id||'')){
    try{const ready=await waitForCourseVideo(saved.id!,controller.signal);if(valid()){setState({kind:'ready',progress:1,...ready});return;}}catch{controller.signal.throwIfAborted();}
   }
   if(!props.screens.length || props.screens.length>12 || props.screens.length!==props.sentences.length)throw new Error('Ce chapitre doit être vérifié avant sa mise en vidéo.');
   const parts:string[]=[];
   for(let index=0;index<props.screens.length;index++){
    controller.signal.throwIfAborted();
    if(!props.sentences[index]?.trim() || props.sentences[index].length>3000)throw new Error('Une séquence dépasse la longueur vocale prise en charge. Le cours animé reste disponible.');
    const lesson=courseMotionStoryboard(props.screens[index],props.chapter,index,props.screens.length,music);
    if(valid())setState({kind:'working',progress:index/(props.screens.length+1),label:`Réalisation de la séquence ${index+1} sur ${props.screens.length}…`});
    const created=await courseVideoRequest('',{text:props.sentences[index],persona:'vivienne',language:'fr',lesson,retry:true},controller.signal);
    const ready=await waitForCourseVideo(created.id,controller.signal);parts.push(ready.id);
   }
   if(valid())setState({kind:'working',progress:props.screens.length/(props.screens.length+1),label:'Assemblage du film et de sa narration…'});
   const film=await courseVideoRequest('/film',{parts},controller.signal);
   const ready=await waitForCourseVideo(film.id,controller.signal);
   if(valid()){
    try{localStorage.setItem(storageKey,JSON.stringify({id:ready.id,fingerprint}));}catch{}
    setState({kind:'ready',progress:1,...ready});
   }
  }catch(error){if(valid())setState({kind:'error',progress:0,error:error instanceof DOMException && ['TimeoutError','AbortError'].includes(error.name)?'Le moteur prend plus de temps que prévu. Réessayez pour reprendre les séquences déjà prêtes.':error instanceof Error?error.message:'La réalisation du film est indisponible.'});}
 };
 const download=async()=>{
  if(!state.id || downloading)return;setDownloading(true);
  try{
   const response=await authenticatedFetch(`/api/ai/tutor-video/${state.id}/media`,{signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw new Error('Téléchargement indisponible. Réessayez.');
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=`academia-${props.courseId}-chapitre-${props.lessonIndex+1}.mp4`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(error){setState(previous=>({...previous,error:error instanceof Error?error.message:'Téléchargement indisponible.'}));}finally{setDownloading(false);}
 };
 return <section className="course-motion-film" aria-label="Film du chapitre">
  <div className="course-motion-film__heading"><Clapperboard aria-hidden="true"/><div><h3>Le chapitre en vidéo</h3><p>Des pictogrammes en mouvement, une tutrice parlante et la narration du cours réunis dans un film.</p></div></div>
  <div className="course-motion-film__actions">
   <button type="button" className="course-motion-film__create" onClick={()=>void generate()} disabled={state.kind==='working'}>{state.kind==='working'?<LoaderCircle className="course-motion-film__spin" aria-hidden="true"/>:state.kind==='ready'?<RefreshCw aria-hidden="true"/>:<Play aria-hidden="true"/>}{state.kind==='ready'?'Retrouver le film':state.kind==='error'?'Réessayer la réalisation':'Créer le film du chapitre'}</button>
   <label><input type="checkbox" checked={music} disabled={state.kind==='working'} onChange={event=>{setMusic(event.target.checked);setState({kind:'idle',progress:0});}}/>Ambiance musicale douce</label>
   {state.kind==='working' && <button type="button" onClick={()=>{generation.current++;active.current?.abort();setState({kind:'idle',progress:0,label:'Suivi arrêté. Les séquences déjà envoyées au serveur restent réutilisables.'});}}>Arrêter le suivi</button>}
  </div>
  {state.kind==='working' && <><progress max="1" value={state.progress} aria-label="Réalisation du film"/><p role="status">{state.label} La réalisation peut prendre plusieurs minutes.</p></>}
  {state.kind==='idle' && state.label && <p role="status">{state.label}</p>}
  {state.error && <p role="alert" className="course-motion-film__error">{state.error}</p>}
  {state.kind==='ready' && state.url && <><video key={state.url} src={state.url} controls playsInline preload="metadata" onPlay={event=>{props.onPrepare();const current=event.currentTarget;current.closest('.cartoon-player')?.querySelectorAll('video').forEach(video=>{if(video!==current)video.pause();});}} aria-label={'Film : '+props.chapter}/><button type="button" onClick={()=>void download()} disabled={downloading}><Download aria-hidden="true"/>{downloading?'Préparation du téléchargement…':'Télécharger le MP4'}</button><p>Le film est conservé temporairement. Téléchargez-le pour le garder.</p></>}
 </section>;
}
