/**
 * Academia Storage API — Service centralisé pour images | vidéos | audios
 * Stockage 100% serveur 137.184.59.184 (pas S3 / Firestore)
 * Docs : https://academia.137.184.59.184.nip.io/
 */

// =============================================================================
// CONFIG
// =============================================================================
export const ACADEMIA_API_URL =
  (import.meta as any).env?.VITE_ACADEMIA_API_URL ||
  'https://academia.137.184.59.184.nip.io';

export const ACADEMIA_API_KEY =
  (import.meta as any).env?.VITE_ACADEMIA_API_KEY ||
  '741e42fe4ba17dd1e2a892b16483d4d000f6788e2f3f1a555b086975a95d73ff';

const API = `${ACADEMIA_API_URL}/api`;

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
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg'],
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wav'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm'],
};

const ALL_ALLOWED = [
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  'txt', 'csv', 'rtf', 'zip', 'rar', '7z',
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'webm', 'mkv', 'json', 'xml',
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

function headers(): Record<string, string> {
  const h: Record<string, string> = {};
  if (ACADEMIA_API_KEY) h['X-API-KEY'] = ACADEMIA_API_KEY;
  return h;
}

// =============================================================================
// CORE — UPLOAD (multipart) & BASE64 fallback
// =============================================================================

export async function uploadFile(
  file: File,
  opts: UploadOptions = {}
): Promise<AcademiaFile> {
  const {
    category = 'divers',
    visibility = inferKindFromFile(file) === 'image' ? 'public' : 'private',
    entityId,
    description,
    uploadedBy,
    onProgress,
  } = opts;

  // Validations côté client
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Limite 100 Mo.`);
  }
  if (!isExtensionAllowed(file.name)) {
    throw new Error(`Extension .${file.name.split('.').pop()} non autorisée.`);
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('category', category);
  fd.append('visibility', visibility);
  if (entityId) fd.append('entity_id', entityId);
  if (description) fd.append('description', description);
  if (uploadedBy) fd.append('uploaded_by', uploadedBy);

  // XHR pour progress (fetch ne gère pas upload progress)
  return new Promise<AcademiaFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/files`);
    Object.entries(headers()).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          const data: AcademiaFile = json.data;
          if (!data?.url) throw new Error('Réponse API invalide');
          resolve(data);
        } else {
          reject(new Error(json.message || `Upload échoué (${xhr.status})`));
        }
      } catch (e: any) {
        reject(new Error(e.message || 'Réponse API invalide'));
      }
    };
    xhr.onerror = () => reject(new Error('Erreur réseau upload Academia'));
    xhr.send(fd);
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
  const res = await fetch(`${API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers() },
    body: JSON.stringify({
      fileBase64: clean,
      fileName,
      category: opts.category || 'divers',
      visibility: opts.visibility || 'private',
      entity_id: opts.entityId,
      description: opts.description,
      uploaded_by: opts.uploadedBy,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Base64 upload échoué (${res.status})`);
  return json.data as AcademiaFile;
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
  const res = await fetch(`${API}/files?${q.toString()}`, { headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'listFiles échoué');
  return json.data as AcademiaFile[];
}

export async function getFile(id: string): Promise<AcademiaFile> {
  const res = await fetch(`${API}/files/${id}`, { headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'getFile échoué');
  return json.data as AcademiaFile;
}

export async function deleteFile(id: string): Promise<void> {
  const res = await fetch(`${API}/files/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message || 'delete échoué');
}

export async function getStorageStats(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API}/storage-stats${q}`, { headers: headers() });
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
