import { createTutorVideoSequence, splitTutorVideoText } from './tutorVideoSequence';
import { createTutorVideoReplayCache } from './tutorVideoReplayCache';
import type {TutorVideoContext} from './tutorReplyStoryboard';
import { type TutorLanguage } from '../../shared/tutorLanguages';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '../lib/adminApi';
import { openTutorVideoStream, supportsTutorVideoStream } from './tutorVideoStream';
import { speechService } from './speechService';

export type TutorVideoState = { status: 'idle' | 'loading' | 'ready' | 'error'; url?: string; error?: string; stage?: 'voice' | 'warming' | 'render'; progressive?: boolean; manualPlayback?: boolean; durationSeconds?: number; audioUrl?: string; segmentIndex?: number; segmentCount?: number; progressOffset?: number; progressScale?: number };
type PreparedTutorVideo = Pick<TutorVideoState,'url'|'audioUrl'|'progressive'|'durationSeconds'> & {url:string};
type Config = { enabled: boolean; personas: string[]; provider?: string; maxTextLength?: number; progressiveStreaming?: boolean };
export function useTutorVideoReply(persona: string, active = true, owner = '') {
  const [state, setState] = useState<TutorVideoState>({ status: 'idle' });
  const config = useRef<Promise<Config> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const backgroundAudio = useRef(false);
  const deferPlayback = useRef(false);
  const lastRequest = useRef<{ text: string; voice: string; language: TutorLanguage; context: TutorVideoContext } | null>(null);
  const activeRef = useRef(active);
  const replay = useRef<ReturnType<typeof createTutorVideoReplayCache> | null>(null);
  if (!replay.current) replay.current = createTutorVideoReplayCache(url => URL.revokeObjectURL(url));
  const objectUrl = useRef<string | null>(null);
  const pendingUrls=useRef(new Set<string>());
  const sequence=useRef<{prefetch:()=>void;advance:()=>Promise<void>;resume:()=>Promise<void>}|null>(null);
  const clearPending=()=>{for(const url of pendingUrls.current)URL.revokeObjectURL(url);pendingUrls.current.clear();};
  const releaseMedia = () => { if (objectUrl.current && !replay.current?.owns(objectUrl.current)) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; };
  activeRef.current = active;
  const stop = useCallback(() => {
    releaseMedia(); clearPending(); sequence.current=null;
    backgroundAudio.current = false;
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setState({ status: 'idle' });
  }, []);
  useEffect(() => {
    stop();
    replay.current?.clear();
    config.current = null;
    if (!active) return;
    void speechService.refreshPronunciation();
    const request = new AbortController();
    // Configuration is refreshed on persona/session change; no API key reaches the browser.
    config.current = authenticatedFetch('/api/ai/tutor-video/config', { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) })
      .then(async response => response.ok ? await response.json() as Config : { enabled: false, personas: [] })
      .catch(() => ({ enabled: false, personas: [] }));
    return () => { generation.current++; controller.current?.abort(); request.abort(); clearPending(); sequence.current=null; releaseMedia(); replay.current?.clear(); };
  }, [persona, active, owner, stop]);
  useEffect(() => speechService.subscribe(value => {
    if (value.isPlaying && !backgroundAudio.current) {
      stop();
    }
  }), []);

  const start = async (text: string, voice: string, progressive = true, alongsideAudio = false, automaticPlayback = false, language: TutorLanguage = 'fr', context: TutorVideoContext = {}): Promise<boolean> => {
    if (!activeRef.current) return true;
    backgroundAudio.current = alongsideAudio;
    deferPlayback.current = !automaticPlayback;
    if (!alongsideAudio) speechService.stop();
    releaseMedia(); clearPending(); sequence.current=null;
    const run = ++generation.current;
    controller.current?.abort();
    setState({ status: 'idle' });
    const settings = await config.current;
    if (run !== generation.current) return true;
    if (!settings?.enabled || !settings.personas.includes(voice)) return false;
    if (settings.provider === 'veo' && (text.length > (settings.maxTextLength || 140) || text.trim().split(/\s+/).length > 22)) return false;
    lastRequest.current = { text, voice, language, context };
    const abort = new AbortController();controller.current = abort;
    const deadline = AbortSignal.timeout(10 * 60 * 1000);
    const signal = AbortSignal.any([abort.signal, deadline]);
    const current = () => !signal.aborted && run === generation.current;
    const parts = settings.provider === 'veo' ? [text] : splitTutorVideoText(text);
    const weights=parts.map(part=>part.trim().split(/\s+/).length),totalWeight=weights.reduce((a,b)=>a+b,0);
    const key=(index:number)=>JSON.stringify([owner,text,voice,language,context,index]);
    const fail=(error:unknown)=>{
      if(run===generation.current && !abort.signal.aborted) setState({status:'error',error:deadline.aborted?'La vidéo prend trop de temps. Vous pouvez écouter la réponse en audio.':error instanceof Error?error.message:'La vidéo est indisponible.'});
    };
    const stage=(value:'voice'|'warming'|'render',index:number)=>{
      if(current() && index===queue.index) setState(previous=>previous.status==='ready'?previous:{status:'loading',stage:value,segmentIndex:index,segmentCount:parts.length});
    };
    const stream=progressive && settings.progressiveStreaming && supportsTutorVideoStream();
    const prepare=async(part:string,index:number):Promise<PreparedTutorVideo>=>{
      const cached=owner?replay.current?.get(key(index)):undefined;
      if(cached)return {url:cached};
      stage('voice',index);
      const response=await authenticatedFetch('/api/ai/tutor-video',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:part,persona:voice,language,retry:true}),signal,
      });
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'La vidéo est indisponible.');
      let result=data,failedPolls=0;const pollingStarted=Date.now();
      while(current()) {
        stage(result.status==='WARMING'?'warming':'render',index);
        if(result.status==='FAILED')throw Error(result.error||'La vidéo est indisponible.');
        if(result.status==='COMPLETED'||result.status==='STREAMING') {
          if(typeof result.videoUrl!=='string')throw Error('Vidéo indisponible.');
          if(result.status==='STREAMING'&&stream) {
            const url=openTutorVideoStream(result.videoUrl,signal,()=>{if(current())void start(text,voice,false,alongsideAudio,automaticPlayback,language,context);}, result.videoUrl.startsWith('/api/') ? authenticatedFetch : fetch);
            pendingUrls.current.add(url);
            return {url,progressive:true,audioUrl:result.audioUrl,durationSeconds:result.durationSeconds};
          }
          let url=result.videoUrl;
          if(/^\/api\/ai\/tutor-video\/[a-f0-9]{64}\/media$/.test(url)) {
            const media=await authenticatedFetch(url,{signal});
            if(!media.ok||!media.headers.get('content-type')?.includes('video/mp4'))throw Error('Vidéo indisponible.');
            const blob=await media.blob();
            if(blob.size>24_000_000)throw Error('Vidéo trop volumineuse.');
            if(!current())throw new DOMException('Aborted','AbortError');
            url=URL.createObjectURL(blob);pendingUrls.current.add(url);
          } else if(!url.startsWith('https://'))throw Error('Vidéo indisponible.');
          return {url,audioUrl:result.audioUrl,durationSeconds:result.durationSeconds};
        }
        if(result!==data||failedPolls>0)await new Promise<void>((resolve,reject)=>{
          const onAbort=()=>{window.clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};
          const interval=result.status==='WARMING'?5000:settings.provider==='musetalk'?(Date.now()-pollingStarted<10000?400:1500):settings.provider==='huggingface'?1500:3500;
          const timer=window.setTimeout(()=>{signal.removeEventListener('abort',onAbort);resolve();},interval);
          signal.addEventListener('abort',onAbort,{once:true});if(signal.aborted)onAbort();
        });
        let statusResponse:Response;
        try {statusResponse=await authenticatedFetch(`/api/ai/tutor-video/${encodeURIComponent(data.id)}${stream?'?progressive=1':''}`,{signal});}
        catch(error){if(current()&&++failedPolls<=3)continue;throw error;}
        result=await statusResponse.json().catch(()=>({}));
        if(statusResponse.status>=500&&++failedPolls<=3){result={};continue;}
        if(!statusResponse.ok)throw Error(result.error||'La vidéo est indisponible.');
        failedPolls=0;
      }
      throw new DOMException('Aborted','AbortError');
    };
    const queue=createTutorVideoSequence(parts,prepare);
    const show=(media:PreparedTutorVideo)=>{
      if(!current())return;
      releaseMedia();pendingUrls.current.delete(media.url);
      if(owner&&!media.progressive)replay.current?.remember(key(queue.index),media.url);
      objectUrl.current=media.url;
      setState({status:'ready',...media,manualPlayback:alongsideAudio&&deferPlayback.current,segmentIndex:queue.index,segmentCount:parts.length,
        progressOffset:weights.slice(0,queue.index).reduce((a,b)=>a+b,0)/totalWeight,progressScale:weights[queue.index]/totalWeight});
    };
    sequence.current={
      prefetch:()=>{if(current())queue.prefetch();},
      resume:async()=>{try{show(await queue.load());}catch(error){fail(error);}},
      advance:async()=>{
        if(!current())return;
        if(queue.index+1>=queue.total){stop();return;}
        if(!queue.isReady(queue.index+1))setState({status:'loading',stage:'render',segmentIndex:queue.index+1,segmentCount:queue.total});
        try {const next=queue.advance();if(next)show(await next);}catch(error){fail(error);}
      },
    };
    setState({status:'loading',stage:'voice',segmentIndex:0,segmentCount:parts.length});
    try {show(await queue.load());return true;}catch(error){fail(error);return abort.signal.aborted;}
  };
  const listenWithoutVideo = () => {
    const last = lastRequest.current;
    stop();
    if (last) void speechService.play(last.text, `video-audio-${Date.now()}`, { voice: last.voice, language: last.language });
  };
  const retry = () => { const request=lastRequest.current;if(state.progressive&&request){void start(request.text,request.voice,false,false,false,request.language,request.context);return;} if(sequence.current){void sequence.current.resume();return;} const last = lastRequest.current; if (last) void start(last.text, last.voice, false, false, false, last.language, last.context); };
  const deferAutomaticPlayback = () => {
    deferPlayback.current = true;
    setState(previous => previous.status === 'ready' ? {...previous,manualPlayback:true} : previous);
  };
  const handleAutoplayBlocked = () => {
    backgroundAudio.current=false;
    deferAutomaticPlayback();
    // Browser autoplay restrictions require a click on the synchronized player.
    // Do not replace the video's soundtrack with an automatic audio-only reply.
  };
  return { state, start, stop, prefetchNext:()=>sequence.current?.prefetch(), advance:()=>void sequence.current?.advance(), listenWithoutVideo, retry, deferAutomaticPlayback, handleAutoplayBlocked };
}
