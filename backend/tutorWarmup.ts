import { huggingFaceVideoRequest } from './huggingFaceTutorVideo.js';
import { createHash } from 'node:crypto';
import {Router} from 'express';
import {qwenTutorConfig} from './qwenTutor.js';

/** Mounted after app authentication. One health request wakes the existing GPU. */
export function createTutorWarmupRouter(env: NodeJS.ProcessEnv = process.env, request: typeof fetch = fetch) {
  const router = Router();
  router.post('/tutor/wake', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const config = qwenTutorConfig(env);
    if (!config || !('provider' in config) || config.provider !== 'huggingface') return res.status(200).json({enabled:false});
    try {
      const response = await request(new URL('/health', config.url), {
        headers:{authorization:`Bearer ${config.key}`}, redirect:'error', signal:AbortSignal.timeout(5000),
      });
      if (response.ok) {
        if(env.MUSETALK_PROVIDER==='huggingface' && env.TUTOR_VIDEO_ENABLED==='true') {
          const endpoint=new URL(config.url),signal=AbortSignal.timeout(7000);
          const id=createHash('sha256').update('academia-login-media-probe-v1').digest('hex');
          const remote=(path:string,body?:unknown)=>huggingFaceVideoRequest(endpoint,config.key,path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{}),signal},request);
          try {
            const status=await remote('/jobs/'+id);
            if(status.ok) {
              const job=await status.json();
              if(job.status==='COMPLETED')return res.json({ready:true,phase:'ready'});
              if(job.status==='FAILED')await remote('/jobs/'+id+'/retry',{});
            } else if(status.status===404) {
              await remote('/jobs',{id,speech:{text:'Bonjour.',language:'fr',voice:'vivienne'}});
            }
            return res.status(202).json({ready:false,phase:'media'});
          } catch {return res.status(202).json({ready:false,phase:'media'});}
        }
        return res.json({ready:true,phase:'ready'});
      }
      if (response.status===503 || response.status===429) return res.status(202).json({ready:false,phase:'allocation'});
      return res.status(503).json({ready:false});
    } catch {
      // Best effort only: a cold allocation can outlast this lightweight probe.
      return res.status(202).json({ready:false,phase:'allocation'});
    }
  });
  return router;
}
