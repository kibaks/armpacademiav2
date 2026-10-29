import { authenticatedFetch } from '../lib/adminApi';
export async function synthesizeVoiceNote(text:string) {
  if(!text.trim() || text.length>3000) throw new Error('Saisissez un texte de 3 000 caractères maximum.');
  const response=await authenticatedFetch('/api/ai/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:'vivienne'}),signal:AbortSignal.timeout(45000)});
  const data=await response.json();
  const encoded=data.audioBase64 || data.audioContent;
  if(!response.ok || typeof encoded!=='string' || !encoded) throw new Error(data.error || 'La synthèse vocale est indisponible. Aucun audio n’a été créé.');
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  return new Blob([bytes],{type:data.mimeType || 'audio/wav'});
}
