import { auth } from '../firebase';
import { MAX_IMAGE_BYTES, imageMime, IMAGE_EXTENSIONS } from '../../shared/imageUpload';
/** Authenticated uploads go directly to the configured Vast storage service. */
export const ACADEMIA_API_URL = '';
const API = '/api/storage';

// =============================================================================
// TYPES
// =============================================================================
export interface AcademiaFile {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  url: string; // public /storage/academia/... ou /api/files/{id}/download
  disk: 'academia' | 'academia_public';
  mimeType: string;
  extension: string;
  size: number;
  category: string;
  entityId: string | null;
  description: string | null;
  visibility: 'private' | 'public';
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MediaKind = 'image' | 'video' | 'audio';
export type Visibility = 'private' | 'public';

export interface UploadOptions {
  category?: string; // ex: cours, avatars, covers, posts_images, posts_videos, studio_videos, audios
  visibility?: Visibility;
  entityId?: string;
  description?: string;
  uploadedBy?: string;
  onProgress?: (pct: number) => void;
}

// =============================================================================
// HELPERS
// =============================================================================
export const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 Mo

const EXT_BY_KIND: Record<MediaKind, string[]> = {
  image: IMAGE_EXTENSIONS,
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wav'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm'],
};

const ALL_ALLOWED = [
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  'txt', 'csv', 'rtf', 'zip', 'rar', '7z',
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'webm', 'mkv', 'json', 'xml', 'ogg', 'm4a', 'flac', 'aac',
];

export function isAlreadyAcademiaUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('academia.137.184.59.184.nip.io') || url.includes('/storage/academia/') || url.includes('/api/storage/files/');
}

export function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

export function inferKindFromFile(file: File): MediaKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (EXT_BY_KIND.image.includes(ext)) return 'image';
  if (EXT_BY_KIND.video.includes(ext)) return 'video';
  if (EXT_BY_KIND.audio.includes(ext)) return 'audio';
  return null;
}

export function isExtensionAllowed(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ALL_ALLOWED.includes(ext);
}

// =============================================================================
// CORE — UPLOAD (multipart) & BASE64 fallback
// =============================================================================

async function accessHeaders(): Promise<Record<string, string>> {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('Connectez-vous pour accéder aux fichiers.');
  return { Authorization: 'Bearer ' + await auth.currentUser.getIdToken() };
}

export async function uploadFile(file: File, opts: UploadOptions = {}): Promise<AcademiaFile> {
  const image = inferKindFromFile(file) === 'image';
  const max = image ? MAX_IMAGE_BYTES : MAX_SIZE_BYTES;
  if (!file.size || file.size > max) throw new Error(image ? 'Image vide ou trop volumineuse : maximum 3 Mo.' : 'Fichier vide ou trop volumineux : maximum 100 Mo.');
  if (!isExtensionAllowed(file.name)) throw new Error('Format de fichier non autorisé.');
  const authorization = await accessHeaders();
  const user = auth.currentUser;
  const response = await fetch(API + '/upload-ticket', {
    method:'POST', headers:{...authorization, 'Content-Type':'application/json'},
    body:JSON.stringify({name:file.name, size:file.size, category:opts.category || 'divers', visibility:opts.visibility || (image ? 'public' : 'private'), entityId:opts.entityId, description:opts.description}),
  });
  const ticket = await response.json();
  if (!response.ok) throw new Error(ticket.message || ticket.error || 'Autorisation d’upload refusée.');
  return new Promise((resolve,reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ticket.url); xhr.timeout = 300000;
    xhr.setRequestHeader('Authorization', 'Bearer ' + ticket.token);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) opts.onProgress?.(Math.min(99,Math.round(e.loaded/e.total*100))); };
    xhr.onload = () => {
      try {
        const payload=JSON.parse(xhr.responseText || '{}');
        if (auth.currentUser !== user) throw new Error('La session a changé.');
        if (xhr.status<200 || xhr.status>=300) throw new Error(payload.detail || payload.message || 'Upload refusé ('+xhr.status+').');
        if (!payload.data?.url) throw new Error('Réponse de stockage invalide.');
        opts.onProgress?.(100); resolve(payload.data);
      } catch (error) { reject(error); }
    };
    xhr.onerror=()=>reject(new Error('Connexion au serveur de fichiers interrompue. Réessayez.'));
    xhr.ontimeout=()=>reject(new Error('Délai d’upload dépassé. Réessayez.'));
    xhr.onabort=()=>reject(new Error('Upload annulé.'));
    xhr.send(file);
  });
}

// Shorthands par type média
export const uploadImage = (f: File, opts: UploadOptions = {}) =>
  uploadFile(f, { category: 'images', visibility: 'public', ...opts });

export const uploadVideo = (f: File, opts: UploadOptions = {}) =>
  uploadFile(f, { category: 'videos', visibility: 'private', ...opts });

export const uploadAudio = (f: File, opts: UploadOptions = {}) =>
  uploadFile(f, { category: 'audios', visibility: 'private', ...opts });

// Blob (ex: enregistrement studio webm)
export async function uploadBlob(
  blob: Blob,
  fileName: string,
  opts: UploadOptions = {}
): Promise<AcademiaFile> {
  const file = new File([blob], fileName, { type: blob.type || 'video/webm' });
  const kind = inferKindFromFile(file);
  const cat = opts.category || (kind === 'image' ? 'images' : kind === 'audio' ? 'audios' : 'videos');
  return uploadFile(file, { category: cat, ...opts });
}

// Base64 (fallback)
export async function uploadBase64(
  base64: string,
  fileName: string,
  opts: UploadOptions = {}
): Promise<AcademiaFile> {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const mime = imageMime(fileName) || 'application/octet-stream';
  const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  return uploadFile(new File([bytes], fileName, { type: mime }), opts);
}

// Si l'URL est déjà une URL Academia ou http externe, on la laisse.
// Si c'est un data: (FileReader), on uploade vers Academia et on retourne l'URL distante.
export async function ensureAcademiaUrl(
  urlOrDataUrl: string,
  opts: UploadOptions & { fileName?: string } = {}
): Promise<string> {
  if (!urlOrDataUrl) return urlOrDataUrl;
  if (isAlreadyAcademiaUrl(urlOrDataUrl)) return urlOrDataUrl;
  if (urlOrDataUrl.startsWith('http')) return urlOrDataUrl; // externe (ex: sample video) — on garde
  if (!isDataUrl(urlOrDataUrl)) return urlOrDataUrl;

  // data:image/...;base64,...
  const match = urlOrDataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return urlOrDataUrl;
  const mime = match[1] || 'image/jpeg';
  const b64 = match[2];
  const ext = mime.split('/')[1]?.split(';')[0] || 'jpg';
  const fileName = opts.fileName || `media_${Date.now()}.${ext}`;
  const file = await uploadBase64(b64, fileName, opts);
  return file.url;
}

// =============================================================================
// READ / DELETE / STATS
// =============================================================================
export async function listFiles(params: {
  category?: string;
  entityId?: string;
  visibility?: Visibility;
  limit?: number;
} = {}): Promise<AcademiaFile[]> {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.entityId) q.set('entity_id', params.entityId);
  if (params.visibility) q.set('visibility', params.visibility);
  if (params.limit) q.set('limit', String(params.limit));
  const res = await fetch(`${API}/files?${q.toString()}`, { headers: await accessHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'listFiles échoué');
  return json.data as AcademiaFile[];
}

export async function getFile(id: string): Promise<AcademiaFile> {
  const res = await fetch(`${API}/files/${id}`, { headers: await accessHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'getFile échoué');
  return json.data as AcademiaFile;
}

export async function deleteFile(id: string): Promise<void> {
  const res = await fetch(`${API}/files/${id}`, {
    method: 'DELETE',
    headers: await accessHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message || 'delete échoué');
}

export async function getStorageStats(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API}/storage-stats${q}`, { headers: await accessHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'stats échoué');
  return json.data as { totalFiles: number; totalSize: number; byCategory: { category: string; count: number; size: string }[]; quota: number };
}

export function downloadUrl(id: string): string {
  return `${API}/files/${id}/download`;
}
export function previewUrl(id: string): string {
  return `${API}/files/${id}/preview`;
}

// =============================================================================
// UTIL — Affichage
// =============================================================================
export function fileToPreviewUrl(file: AcademiaFile): string {
  // Pour <img> / <video> / <audio> : public → url direct, private → preview
  if (file.visibility === 'public') return file.url;
  return previewUrl(file.id);
}

// Pour migration: remplace les anciennes URLs (assets, data:, externes temporaires) par une URL academia si besoin
export async function migrateCoverImageIfNeeded(
  coverImage: string,
  opts: UploadOptions = {}
): Promise<string> {
  // Déjà sur Academia ? on garde
  if (isAlreadyAcademiaUrl(coverImage)) return coverImage;
  // Assets locaux (import) ou http externes → on garde en l'état côté catalogue, pas de migration auto
  // Data URL (upload utilisateur) → migrer
  if (isDataUrl(coverImage)) {
    return ensureAcademiaUrl(coverImage, { category: 'covers', visibility: 'public', ...opts });
  }
  return coverImage;
}
