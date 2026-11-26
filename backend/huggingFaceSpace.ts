import {createHash} from 'node:crypto';
export const PRIVATE_SPACE_HOST = 'kibaks-academia-engine-build.hf.space';
export const transientHuggingFaceError = (error: unknown) => error instanceof Error && ['TypeError','TimeoutError','AbortError'].includes(error.name);
const readiness = new WeakMap<typeof fetch, Map<string, number>>();

/** Check control-plane state before a proxy POST can hang through a cold start. */
export async function preparePrivateSpace(key: string, request: typeof fetch, signal?: AbortSignal | null) {
  const cacheKey=createHash('sha256').update(key).digest('hex');
  let cache=readiness.get(request);
  if (!cache) {cache=new Map();readiness.set(request,cache);}
  if (Date.now()-(cache.get(cacheKey) || 0)<2000) return true;
  let metadata: Response;
  try { metadata=await request('https://huggingface.co/api/spaces/kibaks/academia-engine-build', {
    headers:{authorization:`Bearer ${key}`}, redirect:'error',
    signal:AbortSignal.any([AbortSignal.timeout(3000),...(signal?[signal]:[])]),
  }); } catch (error) {
    if (!signal?.aborted && transientHuggingFaceError(error)) return false;
    throw error;
  }
  if ([429,502,503,504].includes(metadata.status)) return false;
  if (!metadata.ok) throw new Error('Private Space status unavailable');
  const data=await metadata.json();
  const stage=data.runtime?.stage;
  if (stage==='RUNNING' || stage==='RUNNING_BUILDING') {cache.set(cacheKey,Date.now());return true;}
  if (!['SLEEPING','STOPPED','BUILDING','APP_STARTING','RUNNING_APP_STARTING','STARTING'].includes(stage)) throw new Error('Private Space unavailable');
  if (stage==='SLEEPING' || stage==='STOPPED') {
    // One short authenticated visit initiates wakeup; it never keeps the GPU alive.
    await request(`https://${PRIVATE_SPACE_HOST}/health`, {
      headers:{authorization:`Bearer ${key}`},redirect:'error',
      signal:AbortSignal.any([AbortSignal.timeout(1000),...(signal?[signal]:[])]),
    }).catch(()=>{});
  }
  return false;
}
