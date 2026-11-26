import {setTimeout as delay} from 'node:timers/promises';

/** Relay each byte once, bound memory, and stop pulling when playback closes. */
export async function streamHuggingFaceVideo(id:string, remote:(path:string,init:RequestInit)=>Promise<Response>, write:(bytes:Buffer)=>Promise<void>, signal:AbortSignal) {
  let offset=0;
  const deadline=AbortSignal.any([signal,AbortSignal.timeout(240000)]);
  while(!deadline.aborted) {
    const response=await remote(`/jobs/${id}/chunk`,{method:'POST',body:JSON.stringify({offset}),signal:deadline});
    if(!response.ok)throw new Error('Video stream unavailable');
    const chunk=await response.json();
    if(typeof chunk.data!=='string'||chunk.data.length>349528||typeof chunk.complete!=='boolean')throw new Error('Invalid video chunk');
    const bytes=Buffer.from(chunk.data,'base64');
    if(bytes.length>262144||chunk.offset!==offset+bytes.length||chunk.offset>24000000)throw new Error('Invalid video offset');
    if(bytes.length){await write(bytes);offset=chunk.offset;}
    if(chunk.complete){if(!offset)throw new Error('Empty video');return;}
    if(!bytes.length)await delay(250,undefined,{signal:deadline});
  }
  throw new Error('Video stream interrupted');
}
