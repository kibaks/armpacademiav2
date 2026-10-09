import express, { Router, type RequestHandler } from 'express';
import { authenticate } from './admin.js';
import { MAX_IMAGE_BYTES, imageMime } from '../shared/imageUpload.js';

const STORAGE_ORIGIN = 'https://academia.137.184.59.184.nip.io';
const hasImageSignature = (buffer: Buffer, mime: string) => {
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (mime === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0,6).toString('ascii'));
  return mime === 'image/webp' && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WEBP';
};

export function createStorageRouter(dependencies: { authenticate?: RequestHandler; fetch?: typeof fetch } = {}) {
  const router = Router();
  router.post('/images', dependencies.authenticate || authenticate,
    express.raw({ type: 'application/octet-stream', limit: MAX_IMAGE_BYTES }), async (req: any, res) => {
      try {
        let name: string;
        try { name = decodeURIComponent(req.get('X-Upload-Filename') || ''); }
        catch { return res.status(400).json({ message: 'Nom de fichier invalide.' }); }
        const mime = imageMime(name);
        if (!mime || name.length > 180 || /[\/\\\x00-\x1f]/.test(name)) return res.status(400).json({ message: 'Image JPG, JPEG, PNG, GIF ou WebP requise.' });
        if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ message: 'Image vide ou format de requête invalide.' });
        if (!hasImageSignature(req.body, mime)) return res.status(400).json({ message: 'Le contenu du fichier ne correspond pas au format de l’image.' });
        const category = req.get('X-Upload-Category') || 'images';
        if (!/^[a-zA-Z0-9_-]{1,60}$/.test(category)) return res.status(400).json({ message: 'Catégorie invalide.' });
        const visibility = req.get('X-Upload-Visibility') || 'public';
        if (!['public','private'].includes(visibility)) return res.status(400).json({ message: 'Visibilité invalide.' });
        const entityId = req.get('X-Upload-Entity') || req.identity.uid;
        if (entityId.length > 128) return res.status(400).json({ message: 'Identifiant invalide.' });
        const form = new FormData();
        form.append('file', new Blob([new Uint8Array(req.body)], { type: mime }), name);
        form.append('category', category);
        form.append('visibility', visibility);
        form.append('uploaded_by', req.identity.uid);
        form.append('entity_id', entityId);
        const description = req.get('X-Upload-Description');
        if (description) form.append('description', decodeURIComponent(description).slice(0, 1000));
        const headers: Record<string, string> = {};
        // This key is optional on the current storage service and stays server-side.
        if (process.env.ACADEMIA_API_KEY) headers['X-API-KEY'] = process.env.ACADEMIA_API_KEY;
        const upstream = await (dependencies.fetch || fetch)(`${STORAGE_ORIGIN}/api/files`, {
          method: 'POST', body: form, headers, redirect: 'error', signal: AbortSignal.timeout(45000),
        });
        const payload = await upstream.json().catch(() => null);
        if (!upstream.ok) return res.status(upstream.status === 413 ? 413 : upstream.status === 422 ? 422 : 502).json({ message: upstream.status === 413 ? 'Le serveur de stockage refuse la taille du fichier.' : upstream.status === 422 ? 'Image refusée par le serveur de stockage. Vérifiez son format.' : 'Le serveur de stockage a refusé l’upload. Réessayez.' });
        if (!payload?.data?.url) return res.status(502).json({ message: 'Réponse du serveur de stockage invalide.' });
        const imageUrl = new URL(payload.data.url, STORAGE_ORIGIN);
        if (imageUrl.origin !== STORAGE_ORIGIN) return res.status(502).json({ message: 'URL de stockage inattendue.' });
        res.status(201).json({ data: { ...payload.data, url: imageUrl.href } });
      } catch (error: any) {
        res.status(error?.name === 'TimeoutError' ? 504 : 502).json({ message: error?.name === 'TimeoutError' ? 'Le serveur de stockage met trop de temps à répondre. Réessayez.' : 'Serveur de stockage indisponible. Réessayez.' });
      }
    });
  router.use((error: any, _req: any, res: any, _next: any) => {
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ message: error.type === 'entity.too.large' ? 'Image trop volumineuse : maximum 3 Mo. Réduisez sa taille.' : 'Requête d’upload invalide.' });
  });
  return router;
}
export const storageRouter = createStorageRouter();
