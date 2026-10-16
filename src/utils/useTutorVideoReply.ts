import { useCallback, useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '../lib/adminApi';
import { speechService } from './speechService';

export type TutorVideoState = { status: 'idle' | 'loading' | 'ready' | 'error'; url?: string; error?: string };
type Config = { enabled: boolean; personas: string[]; provider?: string; maxTextLength?: number };
export function useTutorVideoReply(persona: string, active = true) {
  const [state, setState] = useState<TutorVideoState>({ status: 'idle' });
  const config = useRef<Promise<Config> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const lastRequest = useRef<{ text: string; voice: string } | null>(null);
  const activeRef = useRef(active);
  const objectUrl = useRef<string | null>(null);
  const releaseMedia = () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; };
  activeRef.current = active;
  const stop = useCallback(() => {
    releaseMedia();
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setState({ status: 'idle' });
  }, []);
  useEffect(() => {
    stop();
    config.current = null;
    if (!active) return;
    const request = new AbortController();
    // Configuration is refreshed on persona/session change; no API key reaches the browser.
    config.current = authenticatedFetch('/api/ai/tutor-video/config', { signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]) })
      .then(async response => response.ok ? await response.json() as Config : { enabled: false, personas: [] })
      .catch(() => ({ enabled: false, personas: [] }));
    return () => { generation.current++; controller.current?.abort(); request.abort(); releaseMedia(); };
  }, [persona, active, stop]);
  useEffect(() => speechService.subscribe(value => {
    if (value.isPlaying) {
      generation.current++;
      controller.current?.abort();
      setState(previous => previous.status === 'idle' ? previous : { status: 'idle' });
    }
  }), []);

  const start = async (text: string, voice: string): Promise<boolean> => {
    if (!activeRef.current) return true;
    speechService.stop();
    releaseMedia();
    const run = ++generation.current;
    controller.current?.abort();
    setState({ status: 'idle' });
    const settings = await config.current;
    if (run !== generation.current) return true;
    if (!settings?.enabled || !settings.personas.includes(voice)) return false;
    // Veo is an eight-second excerpt, never silently truncate a full answer.
    if (settings.provider === 'veo' && (text.length > (settings.maxTextLength || 140) || text.trim().split(/\s+/).length > 22)) return false;
    lastRequest.current = { text, voice };
    const abort = new AbortController();
    controller.current = abort;
    const deadline = AbortSignal.timeout(10 * 60 * 1000);
    const signal = AbortSignal.any([abort.signal, deadline]);
    const current = () => !signal.aborted && run === generation.current;
    speechService.stop();
    setState({ status: 'loading' });
    try {
      const response = await authenticatedFetch('/api/ai/tutor-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, persona: voice }), signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'La vidéo est indisponible.');
      let failedPolls = 0;
      while (current()) {
        await new Promise<void>((resolve, reject) => {
          const onAbort = () => { window.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
          const timer = window.setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, 3500);
          signal.addEventListener('abort', onAbort, { once: true });
          if (signal.aborted) onAbort();
        });
        let statusResponse: Response;
        try { statusResponse = await authenticatedFetch(`/api/ai/tutor-video/${encodeURIComponent(data.id)}`, { signal }); }
        catch (error) { if (current() && ++failedPolls <= 3) continue; throw error; }
        const result = await statusResponse.json().catch(() => ({}));
        if (!current()) return true;
        if (statusResponse.status >= 500 && ++failedPolls <= 3) continue;
        if (!statusResponse.ok || result.status === 'FAILED') throw new Error(result.error || 'La vidéo est indisponible.');
        failedPolls = 0;
        if (result.status === 'COMPLETED') {
          if (typeof result.videoUrl !== 'string') throw new Error('Vidéo indisponible.');
          let url = result.videoUrl;
          if (/^\/api\/ai\/tutor-video\/[a-f0-9]{64}\/media$/.test(url)) {
            const media = await authenticatedFetch(url, { signal });
            if (!media.ok || !media.headers.get('content-type')?.includes('video/mp4')) throw new Error('Vidéo indisponible.');
            const blob = await media.blob();
            if (!current()) return true;
            objectUrl.current = URL.createObjectURL(blob);
            url = objectUrl.current;
          } else if (!url.startsWith('https://')) throw new Error('Vidéo indisponible.');
          setState({ status: 'ready', url });
          return true;
        }
      }
    } catch (error) {
      if (run === generation.current && !abort.signal.aborted) {
        setState({ status: 'error', error: deadline.aborted ? 'La vidéo prend trop de temps. Vous pouvez écouter la réponse en audio.'
          : error instanceof Error ? error.message : 'La vidéo est indisponible.' });
      }
    }
    return true;
  };
  const listenWithoutVideo = () => {
    const last = lastRequest.current;
    stop();
    if (last) void speechService.play(last.text, `video-audio-${Date.now()}`, { voice: last.voice });
  };
  return { state, start, stop, listenWithoutVideo };
}
