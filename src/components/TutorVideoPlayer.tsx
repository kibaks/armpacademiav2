import React, { useEffect, useRef, useState } from 'react';
import { speechService } from '../utils/speechService';
import type { TutorVideoState } from '../utils/useTutorVideoReply';

export function TutorVideoPlayer({ state, onStop, onAudioOnly, persona, active = true, children }: {
  state: TutorVideoState; onStop: () => void; onAudioOnly: () => void; persona: string; active?: boolean; children: React.ReactNode;
}) {
  const [mediaError, setMediaError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => setMediaError(false), [state.url, persona]);
  useEffect(() => speechService.subscribe(value => {
    setAudioPlaying(value.isPlaying);
    if (value.isPlaying) videoRef.current?.pause();
  }), []);
  const presentation = state.status === 'idle' && persona !== 'henri';
  if (!active || (state.status === 'idle' && !presentation) || audioPlaying) return <>{children}</>;
  return <div className="relative flex h-full w-full min-h-48 flex-col overflow-hidden rounded-2xl bg-slate-950 text-white">
    {(state.status === 'ready' && state.url) || presentation ? <>
      <video ref={videoRef} key={presentation ? 'professional-presentation-v4-light' : state.url} src={presentation ? '/assets/tutrice-professionnelle-v4-light.mp4' : state.url}
        poster="/assets/tutrice-portrait-v1.jpg" controls autoPlay={!presentation} playsInline preload="metadata"
        className="min-h-0 flex-1 w-full object-contain" aria-label={presentation ? 'Extrait de présentation de la tutrice : comparer les offres' : 'Réponse vidéo de la tutrice avec sa voix synchronisée'}
        onPlay={() => speechService.stop()} onError={() => setMediaError(true)} />
        {presentation ? <p className="p-2 text-center text-xs text-slate-300">Extrait de présentation · Comparer les offres</p> : <>
          {mediaError && <button type="button" onClick={onAudioOnly} className="min-h-11 px-3 text-sm">Vidéo indisponible — écouter en audio</button>}
          <button type="button" onClick={onStop} className="min-h-11 px-3 text-sm text-slate-200">Fermer la vidéo</button>
        </>}
    </> : <>
      <div className="min-h-0 flex-1 opacity-60">{children}</div>
      <div role="status" aria-live="polite" className="p-3 text-center text-sm">
        {state.status === 'loading' ? 'Préparation de la vidéo et de sa voix…' : state.error}
        <button type="button" onClick={onAudioOnly} className="block min-h-11 w-full underline underline-offset-4">Écouter sans vidéo</button>
        <button type="button" onClick={onStop} className="block min-h-11 w-full underline underline-offset-4">
          {state.status === 'loading' ? 'Annuler l’attente' : 'Revenir au tuteur'}
        </button>
      </div>
    </>}
  </div>;
}
