import { getElevenLabsTutorVoice } from '../shared/tutorVoices.js';
import { voiceBudgets, type VoiceBudgets } from './voiceBudgets.js';
export async function synthesizeElevenTutor(text: string, persona: string, options: { env?: Record<string,string|undefined>; fetcher?: typeof fetch; budgets?: VoiceBudgets } = {}) {
  const env = options.env || process.env, apiKey = env.ELEVENLABS_API_KEY;
  const voiceId = getElevenLabsTutorVoice(persona, env);
  const budgets = options.budgets || voiceBudgets, fetcher = options.fetcher || fetch;
  if (!apiKey || !voiceId || !budgets.available('elevenlabs')) return null;
  await budgets.readElevenQuota(apiKey, fetcher);
  if (!budgets.reserveEleven(text.length)) return null;
  let success = false;
  try {
    const response = await fetcher(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`, {
      method:'POST', headers:{'content-type':'application/json','xi-api-key':apiKey},
      body:JSON.stringify({text, model_id:'eleven_multilingual_v2',language_code:'fr',voice_settings:{stability:0.65,similarity_boost:0.8,style:0.35,speed:0.94}}),signal:AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      let detail='';try {const data=await response.json();detail=data.detail?.status || '';}catch{}
      budgets.fail('elevenlabs',response.status,response.headers.get('retry-after'),detail);return null;
    }
    const data=await response.json();
    if(typeof data.audio_base64!=='string')return null;
    const audioBuffer=Buffer.from(data.audio_base64,'base64');if(audioBuffer.length<256)return null;
    const alignment=data.normalized_alignment || data.alignment;
    const words: Array<{text:string;offsetMs:number;durationMs:number;charIndex:number}> = [];
    if(Array.isArray(alignment?.characters)&&Array.isArray(alignment.character_start_times_seconds)&&Array.isArray(alignment.character_end_times_seconds)){
      let word='',start=0,index=0,end=0;
      const flush=()=>{if(word)words.push({text:word,offsetMs:Math.round(start*1000),durationMs:Math.max(45,Math.round((end-start)*1000)),charIndex:index});word='';};
      alignment.characters.forEach((char:string,i:number)=>{if(/\s/.test(char)){flush();return;}if(!word){start=Number(alignment.character_start_times_seconds[i])||0;index=i;}word+=char;end=Number(alignment.character_end_times_seconds[i])||start;});flush();
    }
    success=true;return {audioBuffer,mimeType:'audio/mpeg',provider:'elevenlabs-v2' as const,wordBoundaries:words};
  }catch{budgets.fail('elevenlabs',503);return null;}
  finally{budgets.releaseEleven(text.length,success);}
}
