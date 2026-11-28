import React, {useEffect,useState} from 'react';
import {LoaderCircle, CheckCircle2, Clock3} from 'lucide-react';
import {authenticatedFetch} from '../lib/adminApi';
type Startup={ready?:boolean;enabled?:boolean;phase?:string};
export function EngineStartupNotice({userId,request=authenticatedFetch}:{userId:string;request?:typeof authenticatedFetch}){
 const [state,setState]=useState<Startup>({phase:'allocation'}),[elapsed,setElapsed]=useState(0),[dismissed,setDismissed]=useState(false),[stopped,setStopped]=useState(false);
 useEffect(()=>{
  const controller=new AbortController(),started=Date.now();let timer:ReturnType<typeof setTimeout>;
  setState({phase:'allocation'});setElapsed(0);setDismissed(false);setStopped(false);
  const tick=setInterval(()=>setElapsed(Math.floor((Date.now()-started)/1000)),1000);
  const probe=async()=>{
   try{
    const response=await request('/api/ai/tutor/wake',{method:'POST',signal:controller.signal});
    if(controller.signal.aborted)return;
    if([401,403].includes(response.status)){setStopped(true);clearInterval(tick);return;}
    const data=await response.json();
    if(response.ok && data.enabled===false){setDismissed(true);return;}
    if(response.ok || response.status===202)setState(data);
    if(data.ready===true){clearInterval(tick);return;}
   }catch{if(controller.signal.aborted)return;}
   if(Date.now()-started>=240000){setStopped(true);clearInterval(tick);return;}
   timer=setTimeout(probe,8000);
  };
  void probe();
  return()=>{controller.abort();clearInterval(tick);clearTimeout(timer);};
 },[userId,request]);
 if(dismissed)return null;
 const ready=state.ready===true;
 const label=ready?'Vos moteurs sont prêts':stopped?'Le démarrage prend plus de temps que prévu':state.phase==='media'?'Préparation de la voix et de la vidéo…':'Démarrage de votre espace IA…';
 const remaining=Math.max(0,180-elapsed);
 return <aside className="fixed bottom-6 left-4 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-blue-200 bg-white p-5 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white" aria-label="Démarrage des moteurs" role="status">
  <div className="flex items-start gap-3">{ready?<CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true"/>:<LoaderCircle className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-blue-700 motion-reduce:animate-none" aria-hidden="true"/>}<div><p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">ARMP Academia</p><h2 className="mt-1 text-base font-bold">{label}</h2></div></div>
  {!ready && <><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{stopped?'Vous pouvez continuer à consulter les cours disponibles.':elapsed<180?'Durée estimée au réveil : 1 à 3 minutes.':'L’attente dépasse l’estimation initiale ; la disponibilité dépend du serveur.'}</p><p className="mt-2 flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4" aria-hidden="true"/>Temps écoulé : {Math.floor(elapsed/60)} min {String(elapsed%60).padStart(2,'0')} s</p>{!stopped && remaining>0 && <p className="mt-1 text-xs text-slate-500">Repère indicatif : encore jusqu’à {Math.ceil(remaining/60)} min. La disponibilité est vérifiée automatiquement.</p>}</>}
  <button type="button" className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800" onClick={()=>setDismissed(true)}>{ready?'Fermer':'Continuer pendant la préparation'}</button>
 </aside>;
}
