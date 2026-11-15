/** Fallback for browsers whose native AAC output freezes an otherwise buffered video. */
export async function connectVideoAudio(video: HTMLVideoElement, url: string, context: AudioContext, signal: AbortSignal) {
  const response=await fetch(url,{signal,credentials:'omit',redirect:'error'});
  if (!response.ok || !response.headers.get('content-type')?.includes('video/mp4')) throw new Error('Vidéo inaccessible.');
  const bytes=await response.arrayBuffer();
  if (bytes.byteLength>32*1024*1024) throw new Error('Vidéo trop volumineuse pour ce mode de lecture.');
  const audio=await context.decodeAudioData(bytes);
  if (signal.aborted) throw new DOMException('Aborted','AbortError');
  const previousMute=video.muted;
  const gain=context.createGain(); gain.connect(context.destination);
  let source:AudioBufferSourceNode|null=null;
  let disposed=false;
  const stop=()=>{
    if (!source) return;
    source.onended=null; try {source.stop();} catch {} source.disconnect(); source=null;
  };
  const sync=()=>{
    stop();
    if (disposed || signal.aborted || video.paused || video.ended) return;
    if (context.state!=='running') return;
    const position=Math.max(0,Math.min(video.currentTime,audio.duration));
    if (position>=audio.duration) return;
    const next=context.createBufferSource();next.buffer=audio;next.playbackRate.value=video.playbackRate;
    next.connect(gain);source=next;next.onended=()=>{if(source===next)source=null;};next.start(0,position);
  };
  const volume=()=>{gain.gain.value=video.volume;};
  const dispose=()=>{
    if(disposed)return;disposed=true;stop();gain.disconnect();
    video.removeEventListener('play',sync);video.removeEventListener('pause',stop);
    video.removeEventListener('seeking',stop);video.removeEventListener('seeked',sync);
    video.removeEventListener('ratechange',sync);video.removeEventListener('ended',stop);
    video.removeEventListener('volumechange',volume);signal.removeEventListener('abort',dispose);
    video.muted=previousMute;
  };
  video.addEventListener('play',sync);video.addEventListener('pause',stop);
  video.addEventListener('seeking',stop);video.addEventListener('seeked',sync);
  video.addEventListener('ratechange',sync);video.addEventListener('ended',stop);
  video.addEventListener('volumechange',volume);signal.addEventListener('abort',dispose,{once:true});
  video.muted=true;volume();
  try {await context.resume();if(context.state!=='running')throw new Error('Appuyez sur lecture pour activer le son.');await video.play();sync();} catch(error){dispose();throw error;}
  return {dispose,setMuted:(muted:boolean)=>{gain.gain.value=muted?0:video.volume;}};
}
