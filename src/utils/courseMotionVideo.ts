export { courseMotionStoryboard } from './courseMotionStoryboard';
const authenticatedRequest = async (url:string,options?:RequestInit) => (await import('../lib/adminApi')).authenticatedFetch(url,options);
type Requester = (url:string, options?:RequestInit)=>Promise<Response>;
export async function courseVideoRequest(path:string, body:unknown, signal:AbortSignal, request:Requester=authenticatedRequest) {
 signal.throwIfAborted();
 const response=await request('/api/ai/tutor-video'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([signal,AbortSignal.timeout(230000)])});
 const result=await response.json().catch(()=>null);
 if (!response.ok || !result || typeof result.id!=='string' || !/^[a-f0-9]{64}$/.test(result.id)) throw new Error(result?.error || 'Le moteur vidéo est indisponible. Réessayez.');
 return result as {id:string;status?:string;videoUrl?:string};
}
export async function waitForCourseVideo(id:string, signal:AbortSignal, request:Requester=authenticatedRequest, wait=(ms:number)=>new Promise<void>((resolve,reject)=>{
 const abort=()=>{clearTimeout(timer);reject(new DOMException('Suivi interrompu','AbortError'));};
 const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
})) {
 for(let attempt=0;attempt<300;attempt++){
  signal.throwIfAborted();
  const response=await request('/api/ai/tutor-video/'+id,{signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});
  if (!response.ok) throw new Error('Le suivi de la vidéo est indisponible. Relancez le suivi pour reprendre les séquences déjà prêtes.');
  const data=await response.json().catch(()=>null);
  if(!data)throw new Error('Le suivi de la vidéo est indisponible. Réessayez.');
  if(data.status==='COMPLETED' && typeof data.videoUrl==='string' && /^https:\/\//.test(data.videoUrl))return {id,url:data.videoUrl as string};
  if(data.status==='FAILED')throw new Error(data.error || 'La réalisation de cette séquence a échoué. Vous pouvez réessayer.');
  await wait(2000);
 }
 throw new Error('La réalisation prend plus de temps que prévu. Relancez le suivi pour reprendre les séquences déjà prêtes.');
}
