import { authenticatedFetch } from './adminApi';
export async function operationsApi(path: string, body?: unknown) {
  const response=await authenticatedFetch(`/api/operations${path}`,{...(body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
  const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Opération non confirmée.'); return data;
}
export async function downloadOperation(path: string, filename: string, body?: unknown) {
  const response=await authenticatedFetch(`/api/operations${path}`,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000)});
  if(!response.ok) {const data=await response.json().catch(()=>({}));throw new Error(data.error || 'Document indisponible.');}
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
