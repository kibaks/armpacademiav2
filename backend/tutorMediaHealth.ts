import { Router, type RequestHandler } from 'express';
import { authenticate } from './admin.js';
export async function tutorMediaStatus(env: NodeJS.ProcessEnv = process.env, request: typeof fetch = fetch) {
  async function check(address: string | undefined, key: string | undefined, suffix: RegExp, engine: 'stt' | 'speech' | 'video') {
    try {
      if (!address || !key || (engine === 'video' && env.TUTOR_VIDEO_ENABLED !== 'true')) return false;
      const url = new URL(address);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !suffix.test(url.pathname)) return false;
      url.pathname = url.pathname.replace(suffix, '/health');
      const response = await request(url, {headers:{Authorization:`Bearer ${key}`},redirect:'error',signal:AbortSignal.timeout(10000)});
      if (!response.ok) return false;
      const data = await response.json();
      return engine === 'speech' ? data.status === 'ok' && data.engine === 'piper' : data.ready === true;
    } catch { return false; }
  }
  const [transcription,speech,video] = await Promise.all([
    check(env.STT_API_URL,env.STT_API_KEY,/\/transcribe\/?$/,'stt'),
    check(env.PIPER_TTS_URL,env.PIPER_TTS_API_KEY,/\/synthesize\/?$/,'speech'),
    check(env.MUSETALK_API_URL,env.MUSETALK_API_KEY,/\/?$/,'video'),
  ]);
  return {transcription,speech,video};
}
export function createTutorMediaRouter(deps: {authenticate?: RequestHandler; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch} = {}) {
  const router=Router();
  router.use(deps.authenticate || authenticate);
  router.get('/status',async (_req,res)=>res.set('Cache-Control','no-store').json(await tutorMediaStatus(deps.env,deps.fetcher)));
  return router;
}
