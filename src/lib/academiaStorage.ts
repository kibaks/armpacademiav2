import { auth } from '../firebase';
import { MAX_IMAGE_BYTES, imageMime, IMAGE_EXTENSIONS } from '../../shared/imageUpload';
/**
 * Academia Storage API — Service centralisé pour images | vidéos | audios
 * Médias publics historiques : relais Academia. Fichiers privés : bucket Firebase, accès serveur contrôlé.
 * Docs : https://academia.137.184.59.184.nip.io/
 */

// =============================================================================
// CONFIG
// =============================================================================
export const ACADEMIA_API_URL =
  (import.meta as any).env?.VITE_ACADEMIA_API_URL ||
  'https://academia.137.184.59.184.nip.io';



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
export const MAX_SIZE_BYTES = 3 * 1024 * 1024; // Limite compatible avec le relais Vercel

const EXT_BY_KIND: Record<MediaKind, string[]> = {
  image: IMAGE_EXTENSIONS,
  video: ['mp4', 'webm', 'mov'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm'],
};

const ALL_ALLOWED = [
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'csv', 'zip',
  'mp3', 'mp4', 'wav', 'mov', 'webm', 'ogg', 'm4a', 'flac', 'json',
];

export function isAlreadyAcademiaUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('academia.137.184.59.184.nip.io') || url.includes('/storage/academia/');
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

async function headers(): Promise<Record<string, string>> {
  if (!auth.currentUser) throw new Error('Connexion requise.');
  return { Authorization: 'Bearer ' + await auth.currentUser.getIdToken() };
}

// =============================================================================
// CORE — UPLOAD (multipart) & BASE64 fallback
// =============================================================================

async function uploadThroughApp(file: File, opts: UploadOptions): Promise<AcademiaFile> {
  if (!isExtensionAllowed(file.name)) throw new Error('Format de fichier non pris en charge.');
  if (file.size > MAX_SIZE_BYTES) throw new Error('Fichier trop volumineux : maximum 3 Mo. Réduisez sa taille.');
  if (!file.size) throw new Error('Le fichier image est vide.');
  if (!auth.currentUser) throw new Error('Connectez-vous pour importer une image.');
  const token = await auth.currentUser.getIdToken();
  const session = await fetch(`${API}/session`, { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  if (!session.ok) throw new Error('Le stockage sécurisé est indisponible. Réessayez après reconnexion.');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', imageMime(file.name) && opts.visibility !== 'private' ? `${API}/images` : `${API}/files`);
    xhr.timeout = 60000;
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-Upload-Filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('X-Upload-Category', opts.category || 'images');
    xhr.setRequestHeader('X-Upload-Visibility', opts.visibility || (imageMime(file.name) ? 'public' : 'private'));
    if (opts.entityId) xhr.setRequestHeader('X-Upload-Entity', opts.entityId);
    if (opts.description) xhr.setRequestHeader('X-Upload-Description', encodeURIComponent(opts.description));
    xhr.upload.onprogress = e => { if (e.lengthComputable) opts.onProgress?.(Math.min(99, Math.round(e.loaded / e.total * 100))); };
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}');
        if (xhr.status < 200 || xhr.status >= 300) throw new Error(payload.message || payload.error || 'Upload refusé (' + xhr.status + ').');
        if (!payload.data?.url) throw new Error('Réponse du serveur de stockage invalide.');
        opts.onProgress?.(100); resolve(payload.data);
      } catch (error) { reject(error instanceof Error ? error : new Error('Réponse d’upload invalide.')); }
    };
    xhr.onerror = () => reject(new Error('Connexion interrompue pendant l’upload. Réessayez.'));
    xhr.ontimeout = () => reject(new Error('Délai d’upload dépassé. Réessayez.'));
    xhr.onabort = () => reject(new Error('Upload annulé.'));
    xhr.send(file);
  });
}

export async function uploadFile(
  file: File,
  opts: UploadOptions = {}
): Promise<AcademiaFile> {
  return uploadThroughApp(file, opts);
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
  const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  return uploadFile(new File([bytes], fileName, { type: imageMime(fileName) || 'application/octet-stream' }), opts);
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
  const files: AcademiaFile[] = [];
  for (let page = 0; page < 100; page++) {
    const res = await fetch(`${API}/files?${q.toString()}`, { headers: await headers() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.message || 'Lecture des fichiers refusée.');
    files.push(...json.data);
    if (!json.nextCursor) return files;
    q.set('cursor', json.nextCursor);
  }
  throw new Error('Trop de fichiers : précisez la catégorie pour poursuivre la recherche.');
}

export async function getFile(id: string): Promise<AcademiaFile> {
  const res = await fetch(`${API}/files/${id}`, { headers: await headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Lecture du fichier refusée.');
  return json.data as AcademiaFile;
}

export async function deleteFile(id: string): Promise<void> {
  const res = await fetch(`${API}/files/${id}`, {
    method: 'DELETE',
    headers: await headers(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error || (json as any).message || 'Suppression refusée.');
}

export async function getStorageStats(_category?: string): Promise<{ totalFiles: number; totalSize: number; byCategory: { category: string; count: number; size: string }[]; quota: number }> {
  throw new Error('Les statistiques exhaustives du stockage ne sont pas encore disponibles.');
}

export function downloadUrl(id: string): string {
  return `${API}/files/${encodeURIComponent(id)}/content`;
}
export function previewUrl(id: string): string {
  return `${API}/files/${encodeURIComponent(id)}/content`;
}

// =============================================================================
// UTIL — Affichage
// =============================================================================
export function fileToPreviewUrl(file: AcademiaFile): string {
  // Pour <img> / <video> / <audio> : public → url direct, private → preview
  return file.url;
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
