import { huggingFaceVideoRequest, isHuggingFaceVideo } from './huggingFaceTutorVideo.js';
import type { RequestHandler, Response as ExpressResponse } from 'express';
import { qwenTutorConfig } from './qwenTutor.js';
import { tutorLanguage, type TutorLanguage } from '../shared/tutorLanguages.js';

export function nationalLanguageConfig(env: NodeJS.ProcessEnv = process.env) {
  // The new worker lives with the active dialogue gateway, which can differ from
  // an older video endpoint still configured on the project.
  if (isHuggingFaceVideo(env) && env.HF_MUSETALK_URL && env.HF_MUSETALK_TOKEN) return {url:env.HF_MUSETALK_URL,key:env.HF_MUSETALK_TOKEN,transport:'huggingface' as const};
  const dialogue = qwenTutorConfig({ ...env, TUTOR_LLM_PROVIDER: undefined });
  if (dialogue) {
    const url = new URL(dialogue.url);
    if (url.pathname.endsWith('/musetalk/chat')) {
      url.pathname = url.pathname.replace(/\/musetalk\/chat$/, '/national');
      return { url: url.href, key: dialogue.key };
    }
  }
  if (env.MUSETALK_API_URL && env.MUSETALK_API_KEY) {
    try {
      const url = new URL(env.MUSETALK_API_URL);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.replace(/\/$/, '').endsWith('/musetalk')) return null;
      url.pathname = url.pathname.replace(/\/musetalk\/?$/, '/national');
      return { url: url.href, key: env.MUSETALK_API_KEY };
    } catch { return null; }
  }
  return null;
}

export class NationalLanguageError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
async function callNational(path: string, body?: unknown, options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}) {
  const config = nationalLanguageConfig(options.env);
  if (!config) throw new NationalLanguageError('Les moteurs des langues nationales ne sont pas disponibles.');
  const init:RequestInit={
    method:body===undefined?'GET':'POST',
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
  };
  const response = config.transport==='huggingface'
    ? await huggingFaceVideoRequest(new URL(config.url),config.key,'/national'+path,init,options.fetcher||fetch)
    : await (options.fetcher || fetch)(config.url + path, {
    method: body === undefined ? 'GET' : 'POST', redirect: 'error', signal: AbortSignal.timeout(path === '/speech' ? 180000 : 65000),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${config.key}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 422) throw new NationalLanguageError('Cette voix ne peut pas lire ce passage avec tous ses caractères. La réponse reste disponible par écrit.', 422);
  if (!response.ok) throw Object.assign(new NationalLanguageError('Le moteur de langue est momentanément indisponible. Réessayez.', response.status === 429 ? 429 : 503), { upstreamStatus: response.status });
  return response.json();
}
export async function translateTutorReply(text: string, language: TutorLanguage, options: { sourceLanguage?: TutorLanguage; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}) {
  const sourceLanguage = options.sourceLanguage || 'fr';
  if (language === sourceLanguage) return text;
  const result = await callNational('/translate', { text, sourceLanguage, language }, options);
  if (result.language !== language || typeof result.text !== 'string' || !result.text.trim() || result.text.length > 18000) throw new NationalLanguageError('La traduction reçue est incomplète. Réessayez.');
  return result.text.normalize('NFC');
}
export async function sendTutorReply(res: ExpressResponse, payload: { reply: string; [key: string]: unknown }, language: TutorLanguage) {
  try {
    const reply = await translateTutorReply(payload.reply, language);
    return res.json({ ...payload, reply, language, ...(res.locals.translatedQuestion ? { translatedQuestion: res.locals.translatedQuestion } : {}), ...(language === 'fr' ? {} : { sourceReply: payload.reply, translationProvider: 'nllb-200', reviewRequired: true }) });
  } catch (error) {
    return res.status(error instanceof NationalLanguageError ? error.status : 503).json({ error: error instanceof NationalLanguageError ? error.message : 'La traduction est momentanément indisponible.', sourceReply: payload.reply, language });
  }
}
export async function nationalSpeechPayload(text: string, language: TutorLanguage, options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch; voice?: string } = {}) {
  const env=options.env||process.env;
  if(language==='fr' && isHuggingFaceVideo(env) && env.HF_MUSETALK_URL && env.HF_MUSETALK_TOKEN){
    const response=await huggingFaceVideoRequest(new URL(env.HF_MUSETALK_URL),env.HF_MUSETALK_TOKEN,'/speech',{method:'POST',body:JSON.stringify({text,language,voice:options.voice})},options.fetcher||fetch);
    if(!response.ok)throw new NationalLanguageError(response.status===503?'Le moteur vocal se réveille. La vidéo et sa voix arriveront dès que le chargement sera terminé.':'La voix est momentanément indisponible.');
    const data=await response.json();
    if(data.mimeType!=='audio/mpeg'||typeof data.audioData!=='string'||data.audioData.length>5333336||!/^[A-Za-z0-9+/]+={0,2}$/.test(data.audioData))throw new NationalLanguageError('La voix reçue est invalide.');
    const audio=Buffer.from(data.audioData,'base64');
    if(audio.length<=44||!(audio.toString('ascii',0,3)==='ID3'||(audio[0]===0xff&&(audio[1]&0xe0)===0xe0)))throw new NationalLanguageError('La voix reçue est invalide.');
    return {audioData:data.audioData,audioBase64:data.audioData,mimeType:'audio/mpeg',provider:'huggingface-piper' as const,language,voiceId:options.voice==='henri'?'hf-piper-tom-v1':'hf-piper-siwis-v1',wordBoundaries:[]};
  }
  const consistent = (options.env || process.env).TUTOR_CONSISTENT_VOICE === 'true';
  const voice = options.voice === 'henri' ? 'male' : 'female';
  if (!['ln', 'sw', 'kg', 'lua'].includes(language) && !(consistent && language === 'fr')) throw new NationalLanguageError('Aucune voix n’est installée pour cette langue.', 422);
  const data = await callNational('/speech', { text: text.normalize('NFC'), language, ...(consistent ? { voice, voiceMode: 'consistent' } : {}) }, options);
  if (data.language !== language || data.provider !== (consistent || language !== 'sw' ? 'national-omnivoice' : 'national-vits') || (consistent && data.voiceId !== `academia-${voice}-v1`) || data.mimeType !== 'audio/mpeg' || typeof data.audioData !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(data.audioData) || data.audioData.length > 5_333_336) throw new NationalLanguageError('La voix reçue est invalide.');
  const audio = Buffer.from(data.audioData, 'base64');
  if (audio.length < 44 || !(audio.toString('ascii', 0, 3) === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0))) throw new NationalLanguageError('La voix reçue est invalide.');
  return { audioData: data.audioData, audioBase64: data.audioData, mimeType: data.mimeType, provider: data.provider as 'national-vits' | 'national-omnivoice', language, ...(consistent ? { voiceId: data.voiceId } : {}), wordBoundaries: [] };
}
export async function handleNationalSpeech(req: any, res: ExpressResponse) {
  try {
    if (typeof req.body?.text !== 'string' || !req.body.text.trim() || req.body.text.length > 3000) return res.status(400).json({ error: 'Choisissez un passage de 3000 caractères maximum.' });
    return res.json(await nationalSpeechPayload(req.body.text, tutorLanguage(req.body.language), { voice: req.body.voice }));
  } catch (error) {
    return res.status(error instanceof NationalLanguageError ? error.status : 503).json({ error: error instanceof NationalLanguageError ? error.message : 'La voix est momentanément indisponible.' });
  }
}
export async function getNationalCapabilities(_req: any, res: ExpressResponse) {
  res.set('Cache-Control', 'no-store');
  try {
    const data = await callNational('/capabilities');
    return res.json({ consistentVoice: process.env.TUTOR_CONSISTENT_VOICE === 'true', translation: Array.isArray(data.translation) ? data.translation.filter((code: unknown) => tutorLanguage(code) === code) : [], speech: Array.isArray(data.speech) ? data.speech.filter((code: unknown) => ['ln', 'sw', 'kg', 'lua'].includes(code as string)) : [], reviewRequired: true });
  } catch (error) {
    console.warn('[National languages] capability connection failed', {
      configured: Boolean(nationalLanguageConfig()),
      errorType: error instanceof Error ? error.name : 'unknown',
      upstreamStatus: error && typeof error === 'object' && 'upstreamStatus' in error ? error.upstreamStatus : undefined,
    });
    return res.json({ consistentVoice: process.env.TUTOR_CONSISTENT_VOICE === 'true', translation: [], speech: [], reviewRequired: true });
  }
}

export function createTutorLanguageInput(): RequestHandler {
  return async (req, res, next) => {
    const language = req.body?.mediaType === 'audio' ? 'fr' : tutorLanguage(req.body?.inputLanguage);
    if (language === 'fr') return next();
    try {
      if (typeof req.body?.message !== 'string' || !req.body.message.trim() || req.body.message.length > 4000) return void res.status(400).json({ error: 'Écrivez une question de 4000 caractères maximum.' });
      const question = await translateTutorReply(req.body.message, 'fr', { sourceLanguage: language });
      req.body.message = question;
      res.locals.translatedQuestion = question;
      if (Array.isArray(req.body.history)) req.body.history = req.body.history.map((item: any, index: number, list: any[]) => index === list.length - 1 && item?.sender === 'user' ? { ...item, text: question } : item);
      next();
    } catch (error) { res.status(error instanceof NationalLanguageError ? error.status : 503).json({ error: error instanceof NationalLanguageError ? error.message : 'La traduction de votre question est indisponible.' }); }
  };
}
