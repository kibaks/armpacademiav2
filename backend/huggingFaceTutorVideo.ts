import { preparePrivateSpace, PRIVATE_SPACE_HOST, transientHuggingFaceError } from './huggingFaceSpace.js';
import { trustedHuggingFaceEndpoint } from './huggingFaceEndpoint.js';
/** Private HF JSON transport and durable, owner-checked cache used by MuseTalk routes. */
const PART_BYTES = 450_000;
const MAX_BYTES = 24_000_000;
export const isHuggingFaceVideo = (env: NodeJS.ProcessEnv) => env.MUSETALK_PROVIDER === 'huggingface';

export async function huggingFaceVideoRequest(endpoint: URL, key: string, path: string, init: RequestInit, request: typeof fetch): Promise<Response> {
  if (!trustedHuggingFaceEndpoint(endpoint)) throw new Error('Invalid private HF endpoint');
  if (endpoint.hostname===PRIVATE_SPACE_HOST && !await preparePrivateSpace(key,request,init.signal)) return Response.json({error:'Private Space warming'}, {status:503});
  let response: Response;
  try { response = await request(endpoint.href, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ inputs: { operation: path, method: init.method || 'GET', ...(init.body ? {body: JSON.parse(String(init.body))} : {}) } }),
    redirect: 'error', signal: AbortSignal.any([AbortSignal.timeout(path==='/national/speech'?175000:path==='/national/translate'?65000:40000), ...(init.signal ? [init.signal] : [])]),
  }); } catch (error) {
    // A timed-out POST may already have reached the idempotent worker job.
    // Keep the reservation and poll the same ID instead of marking it failed.
    if (!init.signal?.aborted && transientHuggingFaceError(error)) return Response.json({error:'Engine connection pending'},{status:503});
    throw error;
  }
  if ([502,504].includes(response.status)) return Response.json({error:'Engine connection pending'},{status:503});
  // 503 is returned while HF allocates a GPU/loads the model. No control-plane key is needed.
  if (!response.ok) return response;
  const result = await response.json();
  const status = result.statusCode;
  if (!Number.isInteger(status) || status < 200 || status > 599) throw new Error('Invalid HF worker response');
  if (result.videoData !== undefined) {
    if (typeof result.videoData !== 'string' || result.videoData.length > Math.ceil(MAX_BYTES * 4 / 3)) throw new Error('Video response too large');
    const binary = Buffer.from(result.videoData, 'base64');
    if (!binary.length || binary.length > MAX_BYTES) throw new Error('Invalid video response');
    return new Response(binary, {status, headers:{'content-type':'video/mp4'}});
  }
  return Response.json(result.body || {}, {status});
}

export async function saveVideoPayload(ref: any, kind: 'audio' | 'video', bytes: Buffer) {
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Payload size exceeded');
  const count = Math.ceil(bytes.length / PART_BYTES);
  // Each document remains well below Firestore's 1 MiB document limit.
  for (let i=0; i<count; i++) await ref.collection('hfPayload').doc(`${kind}-${i}`).set({data:bytes.subarray(i*PART_BYTES,(i+1)*PART_BYTES).toString('base64')});
  await ref.update({[`${kind}Parts`]:count,[`${kind}Bytes`]:bytes.length,hfCacheExpiresAt:Date.now()+86400000});
}

export async function loadVideoPayload(ref: any, job: any, kind: 'audio' | 'video') {
  const count=job[`${kind}Parts`], size=job[`${kind}Bytes`];
  if (!Number.isInteger(count) || count<1 || count>54 || !Number.isInteger(size) || size<1 || size>MAX_BYTES) throw new Error('Invalid cached media');
  const parts: Buffer[]=[];
  for (let i=0;i<count;i++) {
    const data=(await ref.collection('hfPayload').doc(`${kind}-${i}`).get()).data()?.data;
    if (typeof data!=='string' || data.length>600000) throw new Error('Missing cached media');
    parts.push(Buffer.from(data,'base64'));
  }
  const bytes=Buffer.concat(parts);
  if(bytes.length!==size)throw new Error('Incomplete cached media');
  return bytes;
}

export async function purgeExpiredVideoCache(db: any) {
  // Bounded application cleanup avoids accumulating expired binary documents.
  const expired=await db.collection('musetalkTutorJobs').where('hfCacheExpiresAt','<',Date.now()).limit(1).get();
  for(const entry of expired.docs){
    const job=entry.data();
    for(const kind of ['audio','video']) {
      const count=job[`${kind}Parts`];
      if(Number.isInteger(count) && count>0 && count<=54)
        for(let i=0;i<count;i++)await entry.ref.collection('hfPayload').doc(`${kind}-${i}`).delete();
    }
    await entry.ref.delete();
  }
}
