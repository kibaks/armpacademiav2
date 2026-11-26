import { connectVideoAudio } from '../utils/videoAudioCompatibility';
import './TutorVideoPlayer.css';
import { Maximize2, Minimize2, Volume2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { speechService } from '../utils/speechService';
import type { TutorVideoState } from '../utils/useTutorVideoReply';

export function TutorVideoPlayer({ state, onStop, onAudioOnly, onRetry, persona, active = true, showPresentation = true, onProgress, onAutoplayBlocked, onSegmentEnd, onPlaybackStart, children }: {
  state: TutorVideoState; onStop: () => void; onAudioOnly: () => void; onRetry?: () => void; persona: string; active?: boolean; showPresentation?: boolean; children: React.ReactNode; onProgress?: (progress: number | undefined) => void; onAutoplayBlocked?: () => void; onSegmentEnd?: () => void; onPlaybackStart?: () => void;
}) {
  // Calls show the complete portrait; the framing button remains available.
  const [fillFrame, setFillFrame] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  useEffect(() => {
    setWaitingSeconds(0);
    if (state.status !== 'loading') return;
    const started = Date.now();
    const timer = setInterval(() => setWaitingSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [state.status]);
  const [mediaError, setMediaError] = useState(false);
  const [videoStarted,setVideoStarted]=useState(false);
  const [compatibility,setCompatibility]=useState(false);
  const [compatMuted,setCompatMuted]=useState(false);
  const compatibilityAudio=useRef<Awaited<ReturnType<typeof connectVideoAudio>>|null>(null);
  const compatibilityController=useRef<AbortController|null>(null);
  const progressTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const clearProgressCheck=()=>{if(progressTimer.current)clearTimeout(progressTimer.current);progressTimer.current=null;};
  useEffect(()=>{
    setCompatibility(false);setCompatMuted(false);
    return ()=>{clearProgressCheck();compatibilityController.current?.abort();compatibilityAudio.current?.dispose();compatibilityAudio.current=null;compatibilityController.current=null;};
  },[state.url,active]);
  const startCompatiblePlayback = async () => {
    const video=videoRef.current;
    if(!video || !state.url || compatibilityController.current)return;
    speechService.unlockAudio();
    const context=speechService.getAudioContext();
    if(!context){setMediaError(true);return;}
    const controller=new AbortController();compatibilityController.current=controller;
    video.pause();
    if(video.error)video.load();
    try {
      const audio=await connectVideoAudio(video,state.audioUrl || state.url,context,controller.signal);
      if(controller.signal.aborted){audio.dispose();return;}
      compatibilityAudio.current=audio;setCompatibility(true);setMediaError(false);setStalled(false);
    } catch {
      if(!controller.signal.aborted){compatibilityController.current=null;setMediaError(true);blockedCallback.current?.();}
    }
  };
  const checkVideoProgress=()=>{
    clearProgressCheck();
    const video=videoRef.current;
    if(!video || state.status!=='ready')return;
    const position=video.currentTime;
    progressTimer.current=setTimeout(()=>{
      if(video.paused || video.ended || video.currentTime>position+0.1 || compatibilityController.current)return;
      if(state.progressive){onRetry?.();return;}
      void startCompatiblePlayback();
    },3000);
  };
  const [audioPlaying, setAudioPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blockedCallback = useRef(onAutoplayBlocked);
  blockedCallback.current = onAutoplayBlocked;
  useEffect(()=>{
    const video=videoRef.current;
    if (!active || state.status!=='ready' || state.manualPlayback || !video) return;
    if(state.audioUrl){void startCompatiblePlayback();return;}
    let cancelled=false;
    void video.play().catch(()=>{
      if (cancelled) return;
      setMediaError(true);
      blockedCallback.current?.();
    });
    return ()=>{cancelled=true;};
  },[active,state.status,state.url,state.manualPlayback,state.audioUrl]);
  const [stalled, setStalled] = useState(false);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeAt = useRef(0);
  const retryPosition = useRef(0);
  const clearStall = () => { if (stallTimer.current) clearTimeout(stallTimer.current); stallTimer.current = null; };
  const waitForPlayback = () => {
    clearStall();
    stallTimer.current = setTimeout(() => setStalled(true), 12000);
  };
  useEffect(() => {
    setVideoStarted(false); setMediaError(false); setStalled(false); resumeAt.current = 0; retryPosition.current = 0;
    return clearStall;
  }, [state.url, state.status, persona]);
  useEffect(() => speechService.subscribe(value => {
    setAudioPlaying(value.isPlaying);
    if (value.isPlaying) videoRef.current?.pause();
  }), []);
  const presentation = showPresentation && state.status === 'idle' && persona !== 'henri';
  if (!active || (state.status === 'idle' && !presentation) || (audioPlaying && state.status !== 'ready')) return <>{children}</>;
  return <div className="tutor-video-player relative flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl bg-slate-950 text-white">
    {(state.status === 'ready' && state.url) || presentation ? <>
      <video ref={videoRef} key={presentation ? 'professional-presentation-v4-light' : state.url} src={presentation ? '/assets/tutrice-professionnelle-v4-light.mp4' : state.url}
        poster="/assets/tutrice-portrait-v1.jpg" muted={Boolean(state.audioUrl)} controls playsInline preload={presentation ? 'metadata' : 'auto'}
        className="absolute inset-0 h-full w-full" style={{ objectFit: fillFrame ? 'cover' : 'contain', objectPosition: fillFrame ? '50% 28%' : '50% 50%' }} aria-label={presentation ? 'Extrait de présentation de la tutrice : comparer les offres' : 'Réponse vidéo de la tutrice avec sa voix synchronisée'}
        onPlay={() => { if(!presentation)onPlaybackStart?.(); speechService.stop(); if (!presentation) {onProgress?.(state.progressOffset||0);checkVideoProgress();} }}
        onWaiting={waitForPlayback} onStalled={waitForPlayback}
        onPlaying={() => { setVideoStarted(true); clearStall(); setStalled(false); setMediaError(false); }}
        onTimeUpdate={event => {
          const position = event.currentTarget.currentTime;
          const duration = state.durationSeconds || event.currentTarget.duration;
          if (!presentation && Number.isFinite(duration) && duration>0) onProgress?.((state.progressOffset||0)+Math.min(1,position/duration)*(state.progressScale??1));
          if (Math.abs(position - resumeAt.current) > 0.01) { clearStall(); setStalled(false); }
          resumeAt.current = position;
        }}
        onPause={()=>{clearStall();clearProgressCheck();}}
        onLoadedMetadata={event => {
          if (!presentation) onProgress?.(state.progressOffset||0);
          if (retryPosition.current > 0) event.currentTarget.currentTime = Math.min(retryPosition.current, event.currentTarget.duration || retryPosition.current);
          retryPosition.current = 0;
        }}
        onEnded={() => { clearProgressCheck(); clearStall(); if (!presentation) { onProgress?.((state.progressOffset||0)+(state.progressScale??1)); (onSegmentEnd||onStop)(); } }}
        onError={() => { clearStall();clearProgressCheck();videoRef.current?.pause();compatibilityController.current?.abort();compatibilityController.current=null;compatibilityAudio.current?.dispose();compatibilityAudio.current=null;setCompatibility(false);setMediaError(true); }} />
        {compatibility && <button type="button" className="absolute bottom-14 right-3 z-30 rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-white" onClick={()=>{const muted=!compatMuted;setCompatMuted(muted);compatibilityAudio.current?.setMuted(muted);}}>{compatMuted?'Activer le son':'Couper le son'}</button>}
        <button type="button" onClick={() => setFillFrame(value => !value)} title={fillFrame ? 'Voir le cadre entier' : 'Remplir la zone vidéo'} aria-label={fillFrame ? 'Voir le cadre entier' : 'Remplir la zone vidéo'} className="absolute left-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/65 text-white">{fillFrame ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        {!presentation && state.manualPlayback && !videoStarted && !mediaError && <button type="button" className="absolute inset-x-4 top-1/2 z-30 -translate-y-1/2 rounded-xl bg-blue-700 px-4 py-4 text-sm font-bold text-white shadow-lg" onClick={()=>{if(state.audioUrl){void startCompatiblePlayback();return;}void videoRef.current?.play().catch(()=>setMediaError(true));}}>Lancer la vidéo avec le son</button>}
        {!presentation && (state.segmentCount||0)>1 && <p className="pointer-events-none absolute bottom-14 left-2 z-10 rounded-lg bg-slate-950/75 px-2 py-1 text-xs">Séquence {(state.segmentIndex||0)+1} / {state.segmentCount}</p>}
        {!presentation && state.progressive && <p className="tutor-video-label pointer-events-none absolute left-14 right-14 top-3 z-10 rounded-lg bg-slate-950/65 px-2 py-1 text-center text-[10px] text-blue-100">Lecture progressive · voix et visage synchronisés</p>}
        {presentation ? <p className="tutor-video-label pointer-events-none absolute left-14 right-3 top-3 z-10 rounded-lg bg-slate-950/65 p-1 text-center text-[10px] text-slate-100">Extrait de présentation · Comparer les offres</p> : <>
          {(mediaError || stalled) && <div role="status" className="absolute inset-2 z-30 flex flex-col items-center justify-center rounded-xl bg-slate-950/90 p-2 text-center text-sm">
            <p>La lecture a été interrompue.</p>
            <button type="button" className="min-h-11 px-3 underline" onClick={() => {
              if (state.progressive && onRetry) { onRetry(); return; }
              if(state.audioUrl){void startCompatiblePlayback();return;}
              const video = videoRef.current;
              if (!video) return;
              setMediaError(false); setStalled(false);
              retryPosition.current = resumeAt.current;
              video.load(); waitForPlayback();
              void video.play().catch(() => { clearStall(); setMediaError(true); });
            }}>Lancer la vidéo avec le son</button>
            <button type="button" onClick={onAudioOnly} className="min-h-11 px-3 underline">Écouter en audio</button>
          </div>}
          <button type="button" onClick={()=>{onProgress?.(undefined);onStop();}} title="Fermer la vidéo" aria-label="Fermer la vidéo" className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/65 text-white"><X size={16} /></button>
        </>}
    </> : <>
      <div className="absolute inset-0 opacity-60">{children}</div>
      <div role="status" aria-live="polite" className="relative z-10 mt-auto bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-3 text-center text-sm">
        {state.status === 'loading' ? <>
          <span className="tutor-video-compact text-[10px]">Préparation…</span>
          <div className="mb-2 flex justify-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map(index => <span key={index} className="h-1.5 w-6 rounded-full bg-blue-400 motion-safe:animate-pulse" style={{ animationDelay: `${index * 180}ms` }} />)}
          </div>
          <p className="tutor-video-loading-detail font-medium">{state.stage === 'voice' ? 'La tutrice prépare sa voix…' : state.stage === 'warming' ? 'Le moteur vidéo se réveille…' : 'La tutrice prépare sa vidéo…'}</p>
          <p className="tutor-video-loading-detail mt-1 text-xs text-slate-300" aria-live="off">{waitingSeconds > 0 ? `${waitingSeconds} s d’attente · ` : ''}La lecture démarre dès que possible.</p>
          {waitingSeconds >= 8 && <p className="tutor-video-loading-detail mt-2 text-xs text-blue-200">Vous pouvez écouter la réponse sans attendre la vidéo.</p>}
        </> : <><p>{state.error}</p>{onRetry && <button type="button" onClick={onRetry} className="min-h-11 px-3 underline">Réessayer la vidéo</button>}</>}
        <button type="button" onClick={onAudioOnly} title="Écouter sans vidéo" aria-label="Écouter sans vidéo" className="inline-flex min-h-10 items-center gap-2 px-2 underline underline-offset-4"><Volume2 size={16} /><span className="tutor-video-action-label">Écouter sans vidéo</span></button>
        <button type="button" onClick={onStop} aria-label={state.status === 'loading' ? 'Annuler l’attente' : 'Revenir au tuteur'} title="Fermer" className="inline-flex min-h-10 items-center gap-2 px-2 underline underline-offset-4"><X size={16} /><span className="tutor-video-action-label">{state.status === 'loading' ? 'Annuler l’attente' : 'Revenir au tuteur'}</span></button>
      </div>
    </>}
  </div>;
}
