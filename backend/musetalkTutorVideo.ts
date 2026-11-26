import { readCourseMotionStoryboard } from '../shared/courseMotionVideo.js';
import { nationalSpeechPayload, NationalLanguageError } from './nationalLanguages.js';
import { tutorLanguage, nationalVoiceAvailable, normalizeNationalSpeech } from '../shared/tutorLanguages.js';
import { readSpeechPronunciation } from './speechPronunciation.js';
import { normalizeSpeechPronunciation } from '../shared/speechPronunciation.js';
import { createHash, createHmac } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { authenticate, services } from './admin.js';
import { normalizeVideoText } from './syncTutorVideo.js';
import { synthesizePiperTutor } from './piperTutorSpeech.js';
import { synthesizeCartesiaTutor } from './cartesiaTutorSpeech.js';
import { synthesizeElevenTutor } from './elevenTutorSpeech.js';
import { isHuggingFaceVideo, huggingFaceVideoRequest, saveVideoPayload, loadVideoPayload, purgeExpiredVideoCache } from './huggingFaceTutorVideo.js';

type Deps = { env?: NodeJS.ProcessEnv; db?: () => any; authenticate?: RequestHandler; fetcher?: typeof fetch;
  synthesize?: (text: string, persona: string) => Promise<{ audioBuffer: Buffer; mimeType: string } | null> };
const personas = ['vivienne'];
export function createMuseTalkTutorVideoRouter(deps: Deps = {}) {
  const router = Router(), env = deps.env || process.env, request = deps.fetcher || fetch;
  const db = () => deps.db?.() || services().db;
  const hf = isHuggingFaceVideo(env);
  let endpoint: URL | null = null;
  const refreshEndpoint = () => { endpoint = null; try { const url = new URL((hf?env.HF_MUSETALK_URL:env.MUSETALK_API_URL) || ''); if (url.protocol === 'https:' && !url.username && !url.password) endpoint = url; } catch { /* not configured */ } };
  refreshEndpoint();
  const configured = () => (refreshEndpoint(), env.TUTOR_VIDEO_ENABLED === 'true' && !!endpoint && !!(hf?env.HF_MUSETALK_TOKEN:env.MUSETALK_API_KEY));
  const playbackUrl = (id: string) => {
    if(hf)return `/api/ai/tutor-video/${id}/media`;
    refreshEndpoint();
    const expires = Math.floor(Date.now() / 1000) + 15 * 60;
    const token = createHmac('sha256', env.MUSETALK_API_KEY!).update(`${id}:${expires}`).digest('hex');
    return `${endpoint!.href.replace(/\/$/, '')}/jobs/${id}/play?expires=${expires}&token=${token}`;
  };
  const playbackMedia = (id: string) => {
    const videoUrl=playbackUrl(id);
    if(hf)return {videoUrl};
    return {videoUrl,audioUrl:videoUrl.replace('/play?','/audio?')};
  };
  const remote = (suffix: string, init: RequestInit = {}) => { refreshEndpoint(); if(hf)return huggingFaceVideoRequest(endpoint!,env.HF_MUSETALK_TOKEN!,suffix,init,request); return request(`${endpoint!.href.replace(/\/$/, '')}${suffix}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${env.MUSETALK_API_KEY}` }, redirect: 'error', signal: AbortSignal.timeout(45000) }); };
  router.use(deps.authenticate || authenticate);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/config', (_req, res) => res.json({ enabled: configured(), provider: hf?'huggingface':'musetalk', personas, maxTextLength: 3000, dailyLimit: null, maxDurationSeconds: hf?120:null, automaticWakeup:hf, progressiveStreaming: !hf && env.MUSETALK_PROGRESSIVE === 'true' }));
  router.post('/', async (req: any, res) => {
    let ref: any, reserved = false, phase = 'validation';
    try {
      if (!configured()) return res.status(503).json({ error: 'La vidéo MuseTalk n’est pas encore activée.' });
      const { text: raw, persona } = req.body || {};
      if (typeof raw !== 'string' || raw.length > 6000 || !personas.includes(persona)) return res.status(400).json({ error: 'Réponse ou tutrice invalide.' });
      const lesson = req.body?.lesson === undefined ? null : readCourseMotionStoryboard(req.body.lesson);
      if (req.body?.lesson !== undefined && !lesson) return res.status(400).json({error:'Scénario de cours invalide.'});
      const language=tutorLanguage(req.body?.language);
      if (req.body?.language && req.body.language!==language) return res.status(400).json({error:'Langue invalide.'});
      if (!nationalVoiceAvailable(language,raw)) return res.status(422).json({error:'Aucune voix installée ne peut lire ce passage dans la langue demandée.'});
      phase='pronunciation';
      const text = language==='fr' ? normalizeSpeechPronunciation(normalizeVideoText(raw), await readSpeechPronunciation(false, deps.db?.())) : normalizeNationalSpeech(raw);
      if (!text || text.length > 3000) return res.status(400).json({ error: 'Le passage vocal doit contenir entre 1 et 3 000 caractères. Vous pouvez poursuivre dans une nouvelle réponse.' });
      const uid = req.identity.uid;
      const id = createHash('sha256').update(JSON.stringify([uid, text, persona, language, hf?'musetalk-hf-durable-v1':env.MUSETALK_PROGRESSIVE === 'true' ? 'musetalk-v15-mse-main31-v8-480p-low-latency' : 'musetalk-v15-realtime-fragments-v8-480p-low-latency', ...(env.TUTOR_CONSISTENT_VOICE === 'true' ? ['consistent-voice-v1'] : []), ...(['ln', 'kg', 'lua'].includes(language) ? ['omnivoice-native32-v1'] : []), ...(lesson ? ['course-motion-v2-vector',lesson] : [])])).digest('hex');
      phase='cache';
      if(hf)await purgeExpiredVideoCache(db()).catch(()=>undefined);
      ref = db().collection('musetalkTutorJobs').doc(id);
      // Self-hosted use has no daily quota. The transaction only deduplicates jobs.
      phase='reservation';
      const reservation = await db().runTransaction(async (tx: any) => {
        const existing = await tx.get(ref);
        if (existing.exists) {
          const job = existing.data();
          const fresh=typeof job?.createdAt==='number' && Date.now()-job.createdAt<86400000;
          if (fresh && job?.status === 'COMPLETED') return 'completed';
          if (fresh && (lesson || hf) && job?.status === 'FAILED' && req.body?.retry === true) return 'retry';
          if (fresh) return 'existing';
        }
        tx.set(ref, { uid, status: 'SUBMITTING', createdAt: Date.now(), ...(lesson ? {kind:'motion-scene'} : {}) }); return 'new';
      });
      if (reservation === 'completed') return res.json({ id, status: 'COMPLETED', ...playbackMedia(id) });
      if (reservation === 'existing') return res.status(202).json({ id });
      if (reservation === 'retry' && hf) {
        // The HF worker resubmits FAILED jobs through the idempotent /jobs API.
        // Persist this intent so a sleeping worker can resume it during polling.
        await ref.update({hfResubmit:true,hfLesson:lesson,...(language==='fr'?{hfSpeech:{text,voice:persona}}:{})});
      }
      if (reservation === 'retry' && !hf) {
        phase='retry';
        const retried = await remote(`/jobs/${id}/retry`, {method:'POST'});
        if (retried.ok) { await ref.update({status:'PENDING'}); return res.status(202).json({id}); }
        if (retried.status!==404) throw new Error('RETRY_FAILED');
      }
      reserved = true;
      if(hf && language==='fr'){
        await ref.update({hfSpeech:{text,voice:persona},hfLesson:lesson,status:'PENDING'});
        phase='speech';
        const voiced=await remote('/speech',{method:'POST',body:JSON.stringify({text,voice:persona,language})});
        if(voiced.status===503 || voiced.status===429)return res.status(202).json({id,status:'WARMING'});
        if(!voiced.ok)throw new Error('NO_AUDIO');
        const speech=await voiced.json();
        if(speech.mimeType!=='audio/mpeg'||typeof speech.audioData!=='string'||speech.audioData.length>5333336)throw new Error('NO_AUDIO');
        const bytes=Buffer.from(speech.audioData,'base64');
        if(bytes.length<=44 || bytes.length>4000000)throw new Error('NO_AUDIO');
        phase='audio-cache';
        await saveVideoPayload(ref,'audio',bytes);
        phase='submission';
        const submitted=await remote('/jobs',{method:'POST',body:JSON.stringify({id,audio:speech.audioData,...(lesson?{lesson}:{})})});
        if(!submitted.ok && submitted.status!==503 && submitted.status!==429)throw new Error('SUBMISSION_FAILED');
        if(submitted.ok)await ref.update({hfResubmit:false});
        return res.status(202).json({id,status:submitted.ok?'PENDING':'WARMING'});
      }
      const national = language==='fr' && env.TUTOR_CONSISTENT_VOICE !== 'true' ? null : await nationalSpeechPayload(text,language,{env,fetcher:request,voice:persona});
      const audio = national ? {audioBuffer:Buffer.from(national.audioData,'base64'),mimeType:national.mimeType} : await (deps.synthesize ? deps.synthesize(text, persona) : synthesizePiperTutor(text, persona).then(async value => value || await synthesizeCartesiaTutor(text, persona) || await synthesizeElevenTutor(text, persona)));
      if (!audio || audio.audioBuffer.length > 4_000_000 || audio.audioBuffer.length <= 44) throw new Error('NO_AUDIO');
      if(hf){
        await saveVideoPayload(ref,'audio',audio.audioBuffer);
        await ref.update({hfLesson:lesson,status:'PENDING'});
      }
      const submitted = await remote('/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, audio: audio.audioBuffer.toString('base64'), ...(lesson ? {lesson} : {}) }) });
      if(hf && (submitted.status===503 || submitted.status===429))return res.status(202).json({id,status:'WARMING'});
      if (!submitted.ok || (await submitted.json()).id !== id) throw new Error('SUBMISSION_FAILED');
      await ref.update({ status: 'PENDING',...(hf?{hfResubmit:false}:{}) });
      return res.status(202).json({ id });
    } catch (error) {
      console.warn('[Tutor video] preparation failed', {phase,provider:hf?'huggingface':'gateway',errorType:error instanceof Error?error.name:'Unknown',errorCode:error && typeof error==='object' && 'code' in error && /^(?:[A-Z_0-9]+|[0-9]+)$/i.test(String(error.code))?String(error.code):error instanceof Error && /^[A-Z_]+$/.test(error.message)?error.message:'UPSTREAM_UNAVAILABLE'});
      // Keep the reservation after an uncertain submission, avoiding duplicate GPU work.
      if (reserved) await ref.update({ status: 'FAILED' }).catch(() => undefined);
      if (error instanceof NationalLanguageError) return res.status(error.status).json({error:error.message});
      return res.status(503).json({ error: 'La vidéo n’a pas pu être préparée. Vous pouvez écouter la réponse en audio.' });
    }
  });
  router.post('/film', async (req: any, res) => {
    let ref: any;
    try {
      if (!configured()) return res.status(503).json({error:'Le moteur vidéo est indisponible.'});
      const parts=req.body?.parts;
      if (!Array.isArray(parts) || parts.length<1 || parts.length>12 || new Set(parts).size!==parts.length || !parts.every((id:unknown)=>typeof id==='string' && /^[a-f0-9]{64}$/.test(id))) return res.status(400).json({error:'Séquences invalides.'});
      const children=await Promise.all(parts.map((id:string)=>db().collection('musetalkTutorJobs').doc(id).get()));
      if (children.some((snapshot:any)=>{const job=snapshot.data();return !job || job.uid!==req.identity.uid || job.kind!=='motion-scene' || job.status!=='COMPLETED' || Date.now()-job.createdAt>=86400000;})) return res.status(404).json({error:'Une séquence du film est indisponible.'});
      const id=createHash('sha256').update(JSON.stringify([req.identity.uid,'course-film-v2-vector',parts])).digest('hex');
      ref=db().collection('musetalkTutorJobs').doc(id);
      const reservation=await db().runTransaction(async(tx:any)=>{
        const existing=await tx.get(ref),job=existing.data();
        if (job?.status==='COMPLETED' && Date.now()-job.createdAt<86400000) return 'completed';
        if (existing.exists && job?.status!=='FAILED' && Date.now()-job.createdAt<86400000) return 'pending';
        tx.set(ref,{uid:req.identity.uid,kind:'motion-film',status:'SUBMITTING',createdAt:Date.now()});return 'new';
      });
      if (reservation==='completed') return res.json({id,status:'COMPLETED',videoUrl:playbackUrl(id)});
      if (reservation==='pending') return res.status(202).json({id});
      const response=await remote('/films',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,parts})});
      if (!response.ok || (await response.json()).id!==id) throw new Error('ASSEMBLY_FAILED');
      await ref.update({status:'PENDING'});return res.status(202).json({id});
    } catch {
      if(ref) await ref.update({status:'FAILED'}).catch(()=>undefined);
      return res.status(503).json({error:'Le film n’a pas pu être assemblé. Réessayez.'});
    }
  });
  const owned = async (req: any) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id)) return null;
    const ref = db().collection('musetalkTutorJobs').doc(req.params.id), job = (await ref.get()).data();
    return job?.uid === req.identity.uid && Date.now() - job.createdAt < 86400000 ? { ref, job } : null;
  };
  router.get('/:id', async (req: any, res) => {
    try {
      const entry = await owned(req); if (!entry) return res.sendStatus(404);
      // Completed jobs are immutable: issue a fresh playback ticket without another worker round trip.
      if (entry.job.status === 'COMPLETED') return res.json({ status: 'COMPLETED', ...playbackMedia(req.params.id) });
      if (hf && entry.job.hfResubmit) {
        let audio: string;
        if (entry.job.audioParts) {
          audio=(await loadVideoPayload(entry.ref,entry.job,'audio')).toString('base64');
        } else {
          if(!entry.job.hfSpeech)throw new Error('MISSING_SPEECH');
          const voiced=await remote('/speech',{method:'POST',body:JSON.stringify({...entry.job.hfSpeech,language:'fr'})});
          if(voiced.status===503 || voiced.status===429)return res.json({status:'WARMING'});
          if(!voiced.ok)throw new Error('NO_AUDIO');
          const speech=await voiced.json();
          if(speech.mimeType!=='audio/mpeg'||typeof speech.audioData!=='string'||speech.audioData.length>5333336)throw new Error('NO_AUDIO');
          const bytes=Buffer.from(speech.audioData,'base64');
          if(bytes.length<=44||bytes.length>4000000)throw new Error('NO_AUDIO');
          await saveVideoPayload(entry.ref,'audio',bytes);audio=speech.audioData;
        }
        const submitted=await remote('/jobs',{method:'POST',body:JSON.stringify({id:req.params.id,audio,...(entry.job.hfLesson?{lesson:entry.job.hfLesson}:{})})});
        if(submitted.status===503 || submitted.status===429)return res.json({status:'WARMING'});
        if(!submitted.ok)throw new Error('SUBMISSION_FAILED');
        await entry.ref.update({status:'PENDING',hfResubmit:false});
        return res.json({status:'PENDING'});
      }
      const response = await remote(`/jobs/${req.params.id}`);
      if(hf && (response.status===503 || response.status===429))return res.json({status:'WARMING'});
      if(hf && response.status===404 && !entry.job.audioParts && entry.job.hfSpeech){
        const voiced=await remote('/speech',{method:'POST',body:JSON.stringify({...entry.job.hfSpeech,language:'fr'})});
        if(voiced.status===503 || voiced.status===429)return res.json({status:'WARMING'});
        if(!voiced.ok)throw new Error('NO_AUDIO');
        const speech=await voiced.json();
        if(speech.mimeType!=='audio/mpeg'||typeof speech.audioData!=='string'||speech.audioData.length>5333336)throw new Error('NO_AUDIO');
        const bytes=Buffer.from(speech.audioData,'base64');
        if(bytes.length<=44||bytes.length>4000000)throw new Error('NO_AUDIO');
        await saveVideoPayload(entry.ref,'audio',bytes);
        const submitted=await remote('/jobs',{method:'POST',body:JSON.stringify({id:req.params.id,audio:speech.audioData,...(entry.job.hfLesson?{lesson:entry.job.hfLesson}:{})})});
        if(submitted.ok||submitted.status===503||submitted.status===429)return res.json({status:submitted.ok?'PENDING':'WARMING'});
        throw new Error('SUBMISSION_FAILED');
      }
      if(hf && response.status===404 && entry.job.audioParts){
        const audio=await loadVideoPayload(entry.ref,entry.job,'audio');
        const submitted=await remote('/jobs',{method:'POST',body:JSON.stringify({id:req.params.id,audio:audio.toString('base64'),...(entry.job.hfLesson?{lesson:entry.job.hfLesson}:{})})});
        if(submitted.ok || submitted.status===503 || submitted.status===429)return res.json({status:submitted.ok?'PENDING':'WARMING'});
        throw new Error('SUBMISSION_FAILED');
      }
      if (response.status === 404 && entry.job.status === 'FAILED') return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' });
      if (!response.ok) return res.sendStatus(503);
      const result = await response.json();
      // A growing MP4 has no stable length/range contract. Native players may
      // treat its current end as EOF. Only opted-in MSE clients consume fragments.
      if (result.status === 'STREAMING') {
        if (env.MUSETALK_PROGRESSIVE === 'true' && req.query?.progressive === '1') return res.json({ status: 'STREAMING', ...playbackMedia(req.params.id), ...(Number.isFinite(result.durationSeconds) && result.durationSeconds > 0 ? {durationSeconds:result.durationSeconds} : {}) });
        return res.json({ status: 'PENDING' });
      }
      if (result.status === 'COMPLETED') {
        if(hf){
          const media=await remote(`/jobs/${req.params.id}/media`);
          if(!media.ok)throw new Error('MEDIA_NOT_READY');
          await saveVideoPayload(entry.ref,'video',Buffer.from(await media.arrayBuffer()));
        }
        await entry.ref.update({ status: 'COMPLETED' });
        // A short-lived read-only ticket enables native streaming and byte ranges.
        // The worker key stays private; the browser does not buffer an entire MP4.
        return res.json({ status: 'COMPLETED', ...playbackMedia(req.params.id) });
      }
      if (result.status === 'FAILED') { await entry.ref.update({ status: 'FAILED' }); return res.json({ status: 'FAILED', error: 'La vidéo a échoué. Écoutez la réponse en audio.' }); }
      return res.json({ status: 'PENDING' });
    } catch { return res.status(503).json({ error: 'Le serveur vidéo est momentanément indisponible.' }); }
  });
  router.get('/:id/media', async (req: any, res) => {
    try {
      const entry = await owned(req); if (!entry || entry.job.status !== 'COMPLETED') return res.sendStatus(404);
      const range = req.headers.range;
      if(hf){
        const bytes=await loadVideoPayload(entry.ref,entry.job,'video');
        let start=0,end=bytes.length-1;
        if(typeof range==='string'){
          const match=/^bytes=(\d*)-(\d*)$/.exec(range);
          if(!match || (!match[1]&&!match[2]))return res.set('Content-Range',`bytes */${bytes.length}`).sendStatus(416);
          if(match[1]){start=Number(match[1]);if(match[2])end=Number(match[2]);}
          else start=Math.max(0,bytes.length-Number(match[2]));
          end=Math.min(end,bytes.length-1);
          if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end)return res.set('Content-Range',`bytes */${bytes.length}`).sendStatus(416);
          res.status(206).set('Content-Range',`bytes ${start}-${end}/${bytes.length}`);
        }
        res.type('video/mp4').set('Accept-Ranges','bytes').set('Content-Length',String(end-start+1));
        res.flushHeaders();
        for(let offset=start;offset<=end;offset+=450000){
          if(res.destroyed)break;
          if(!res.write(bytes.subarray(offset,Math.min(offset+450000,end+1))))await new Promise<void>(resolve=>{const finish=()=>{res.off('drain',finish);res.off('close',finish);resolve();};res.once('drain',finish);res.once('close',finish);});
        }
        return res.end();
      }
      const response = await remote(`/jobs/${req.params.id}/media`, { headers: typeof range === 'string' ? { range } : {} });
      if (response.status === 416) {
        const contentRange = response.headers.get('content-range');
        if (contentRange) res.set('Content-Range', contentRange);
        return res.sendStatus(416);
      }
      if (!response.ok || !response.body) return res.sendStatus(503);
      res.status(response.status === 206 ? 206 : 200).type('video/mp4');
      // Preserve byte-range metadata so playback can start and seek without fetching the full file.
      for (const header of ['accept-ranges', 'content-range', 'content-length']) {
        const value = response.headers.get(header);
        if (value) res.set(header, value);
      }
      res.flushHeaders();
      const reader = response.body.getReader();
      try { while (true) { const { value, done } = await reader.read(); if (done || res.destroyed) break; if (!res.write(value)) await new Promise<void>(resolve => { const finish = () => { res.off('drain', finish); res.off('close', finish); resolve(); }; res.once('drain', finish); res.once('close', finish); }); } }
      finally { await reader.cancel().catch(() => undefined); }
      return res.end();
    } catch { if (res.headersSent) return res.destroy(); return res.sendStatus(503); }
  });
  return router;
}
