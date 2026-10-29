import React, { useEffect, useRef, useState } from 'react';
import { speechService } from '../utils/speechService';
import type { TutorVideoState } from '../utils/useTutorVideoReply';

export function TutorVideoPlayer({ state, onStop, onAudioOnly, onRetry, persona, active = true, showPresentation = true, children }: {
  state: TutorVideoState; onStop: () => void; onAudioOnly: () => void; onRetry?: () => void; persona: string; active?: boolean; showPresentation?: boolean; children: React.ReactNode;
}) {
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  useEffect(() => {
    setWaitingSeconds(0);
    if (state.status !== 'loading') return;
    const started = Date.now();
    const timer = setInterval(() => setWaitingSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [state.status]);
  const [mediaError, setMediaError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    setMediaError(false); setStalled(false); resumeAt.current = 0; retryPosition.current = 0;
    return clearStall;
  }, [state.url, state.status, persona]);
  useEffect(() => speechService.subscribe(value => {
    setAudioPlaying(value.isPlaying);
    if (value.isPlaying) videoRef.current?.pause();
  }), []);
  const presentation = showPresentation && state.status === 'idle' && persona !== 'henri';
  if (!active || (state.status === 'idle' && !presentation) || audioPlaying) return <>{children}</>;
  return <div className="relative flex h-full w-full min-h-48 flex-col overflow-hidden rounded-2xl bg-slate-950 text-white">
    {(state.status === 'ready' && state.url) || presentation ? <>
      <video ref={videoRef} key={presentation ? 'professional-presentation-v4-light' : state.url} src={presentation ? '/assets/tutrice-professionnelle-v4-light.mp4' : state.url}
        poster="/assets/tutrice-portrait-v1.jpg" controls autoPlay={!presentation} playsInline preload="metadata"
        className="min-h-0 flex-1 w-full object-contain" aria-label={presentation ? 'Extrait de présentation de la tutrice : comparer les offres' : 'Réponse vidéo de la tutrice avec sa voix synchronisée'}
        onPlay={() => speechService.stop()}
        onWaiting={waitForPlayback} onStalled={waitForPlayback}
        onPlaying={() => { clearStall(); setStalled(false); setMediaError(false); }}
        onTimeUpdate={event => {
          const position = event.currentTarget.currentTime;
          if (Math.abs(position - resumeAt.current) > 0.01) { clearStall(); setStalled(false); }
          resumeAt.current = position;
        }}
        onPause={clearStall}
        onLoadedMetadata={event => {
          if (retryPosition.current > 0) event.currentTarget.currentTime = Math.min(retryPosition.current, event.currentTarget.duration || retryPosition.current);
          retryPosition.current = 0;
        }}
        onEnded={() => { clearStall(); if (!presentation) onStop(); }}
        onError={() => { clearStall(); setMediaError(true); }} />
        {!presentation && state.progressive && <p className="px-3 pt-2 text-center text-xs text-blue-200">Lecture progressive · voix et visage synchronisés</p>}
        {presentation ? <p className="p-2 text-center text-xs text-slate-300">Extrait de présentation · Comparer les offres</p> : <>
          {(mediaError || stalled) && <div role="status" className="p-2 text-center text-sm">
            <p>La lecture a été interrompue.</p>
            <button type="button" className="min-h-11 px-3 underline" onClick={() => {
              if (state.progressive && onRetry) { onRetry(); return; }
              const video = videoRef.current;
              if (!video) return;
              setMediaError(false); setStalled(false);
              retryPosition.current = resumeAt.current;
              video.load(); waitForPlayback();
              void video.play().catch(() => { clearStall(); setMediaError(true); });
            }}>Reprendre la vidéo</button>
            <button type="button" onClick={onAudioOnly} className="min-h-11 px-3 underline">Écouter en audio</button>
          </div>}
          <button type="button" onClick={onStop} className="min-h-11 px-3 text-sm text-slate-200">Fermer la vidéo</button>
        </>}
    </> : <>
      <div className="min-h-0 flex-1 opacity-60">{children}</div>
      <div role="status" aria-live="polite" className="p-3 text-center text-sm">
        {state.status === 'loading' ? <>
          <div className="mb-2 flex justify-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map(index => <span key={index} className="h-1.5 w-6 rounded-full bg-blue-400 motion-safe:animate-pulse" style={{ animationDelay: `${index * 180}ms` }} />)}
          </div>
          <p className="font-medium">{state.stage === 'voice' ? 'La tutrice prépare sa voix…' : 'Le visage et la voix se synchronisent…'}</p>
          <p className="mt-1 text-xs text-slate-300" aria-live="off">{waitingSeconds > 0 ? `${waitingSeconds} s d’attente · ` : ''}La lecture démarre dès que possible.</p>
          {waitingSeconds >= 8 && <p className="mt-2 text-xs text-blue-200">Vous pouvez écouter la réponse sans attendre la vidéo.</p>}
        </> : state.error}
        <button type="button" onClick={onAudioOnly} className="block min-h-11 w-full underline underline-offset-4">Écouter sans vidéo</button>
        <button type="button" onClick={onStop} className="block min-h-11 w-full underline underline-offset-4">
          {state.status === 'loading' ? 'Annuler l’attente' : 'Revenir au tuteur'}
        </button>
      </div>
    </>}
  </div>;
}
