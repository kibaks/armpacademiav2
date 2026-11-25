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
      if (response.ok) return res.json({ready:true});
      if (response.status===503 || response.status===429) return res.status(202).json({ready:false});
      return res.status(503).json({ready:false});
    } catch {
      // Best effort only: a cold allocation can outlast this lightweight probe.
      return res.status(202).json({ready:false});
    }
  });
  return router;
}
