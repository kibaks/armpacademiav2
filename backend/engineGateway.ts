import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router, type RequestHandler } from 'express';
import { services } from './services.js';

const paths: Record<string, string> = { QWEN_API_URL: '/musetalk/chat', MUSETALK_API_URL: '/musetalk', PIPER_TTS_URL: '/piper/synthesize', STT_API_URL: '/stt/transcribe', ACADEMIA_STORAGE_URL: '/files-api' };
const collection = 'privateEngineConfig';
export function gatewayBase(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 200) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && /^[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(u.hostname) && !u.port && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash ? u.origin : null;
  } catch { return null; }
}
export function gatewaySignature(base: string, timestamp: number, key: string) {
  return createHmac('sha256', key).update(`academia-gateway-v1\n60042833\n${timestamp}\n${base}`).digest('hex');
}
export function applyGatewayBase(env: NodeJS.ProcessEnv, base: string) {
  if (gatewayBase(base) !== base) return;
  for (const [name, path] of Object.entries(paths)) {
    try {
      // A future manually configured permanent domain must retain priority.
      if (env[name] && new URL(env[name]!).hostname.endsWith('.trycloudflare.com')) env[name] = base + path;
    } catch { /* An invalid unrelated configuration is never repaired implicitly. */ }
  }
}
type Options = { env?: NodeJS.ProcessEnv; db?: () => any; fetcher?: typeof fetch; now?: () => number };
export function createEngineGatewayRouter(options: Options = {}) {
  const router = Router(), env = options.env || process.env, now = options.now || Date.now;
  const db = options.db || (() => services().db);
  router.post('/register', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const base = gatewayBase(req.body?.baseUrl), timestamp = req.body?.timestamp, signature = req.headers['x-academia-signature'];
    const key = env.MUSETALK_API_KEY;
    if (!base || !Number.isSafeInteger(timestamp) || Math.abs(now() - timestamp) > 300000 || typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature) || !key || key.length < 32) return void res.sendStatus(401);
    const expected = gatewaySignature(base, timestamp, key);
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return void res.sendStatus(401);
    try {
      // Verify the replacement endpoint with the existing worker credential before saving it.
      const health = await (options.fetcher || fetch)(base + '/national/capabilities', { headers: { authorization: `Bearer ${key}` }, redirect: 'error', signal: AbortSignal.timeout(12000) });
      if (!health.ok || (await health.json()).provider !== 'national-local') return void res.sendStatus(422);
      const ref = db().collection(collection).doc('active');
      const accepted = await db().runTransaction(async (tx: any) => {
        const previous = (await tx.get(ref)).data();
        if (previous?.timestamp >= timestamp) return false;
        tx.set(ref, { baseUrl: base, timestamp, instance: '60042833' }); return true;
      });
      if (!accepted) return void res.sendStatus(409);
      applyGatewayBase(env, base);
      res.json({ registered: true });
    } catch { res.status(503).json({ error: 'Gateway registration unavailable' }); }
  });
  return router;
}
export function createEngineGatewayMiddleware(options: Options = {}): RequestHandler {
  const env = options.env || process.env, now = options.now || Date.now, db = options.db || (() => services().db);
  let nextRead = 0, pending: Promise<void> | null = null;
  return async (req, _res, next) => {
    if (!req.path.startsWith('/api/')) return next();
    if (now() >= nextRead && !pending) {
      pending = (async () => {
        try {
          let timer: ReturnType<typeof setTimeout> | undefined;
          let snapshot: any;
          try { snapshot = await Promise.race([db().collection(collection).doc('active').get(), new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), 2000); })]); }
          finally { if (timer) clearTimeout(timer); }
          const record = snapshot?.data();
          const base = gatewayBase(record?.baseUrl);
          if (base && record?.instance === '60042833') applyGatewayBase(env, base);
        } catch { /* Preserve the deployment configuration if the registry is unavailable. */ }
        finally { nextRead = now() + 30000; pending = null; }
      })();
    }
    if (pending) await pending;
    next();
  };
}
