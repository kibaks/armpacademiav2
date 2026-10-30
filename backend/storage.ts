import express, { Router, type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { authenticate } from './admin.js';
import { MAX_IMAGE_BYTES, imageMime } from '../shared/imageUpload.js';
import { storageConfig, storageToken } from './storageTokens.js';
const allowed = new Set('pdf jpg jpeg png gif webp doc docx xls xlsx ppt pptx odt ods odp txt csv rtf zip rar 7z mp3 mp4 wav avi mov webm mkv json xml ogg m4a flac aac'.split(' '));
export function createStorageRouter(dependencies: { authenticate?: RequestHandler; fetch?: typeof fetch } = {}) {
  const router = Router();
  router.use(dependencies.authenticate || authenticate);
  router.post('/upload-ticket', express.json({ limit: '8kb' }), (req: any, res) => {
    const { name, size, category = 'divers', visibility = 'private', entityId, description } = req.body || {};
    if (typeof name !== 'string' || name.length > 180 || /[\/\\\x00-\x1f]/.test(name) || !allowed.has(name.split('.').pop()?.toLowerCase() || '')) return res.status(400).json({ message: 'Nom ou format de fichier non autorisé.' });
    const limit = imageMime(name) ? MAX_IMAGE_BYTES : 100 * 1024 * 1024;
    if (!Number.isSafeInteger(size) || size <= 0 || size > limit) return res.status(413).json({ message: imageMime(name) ? 'Image trop volumineuse : maximum 3 Mo.' : 'Fichier vide ou trop volumineux : maximum 100 Mo.' });
    if (typeof category !== 'string' || !/^[a-zA-Z0-9_-]{1,60}$/.test(category) || !['public','private'].includes(visibility) || (entityId && (typeof entityId !== 'string' || entityId.length > 128)) || (description && (typeof description !== 'string' || description.length > 1000))) return res.status(400).json({ message: 'Paramètres de stockage invalides.' });
    try {
      const { url } = storageConfig();
      const token = storageToken({ scope:'upload', jti:randomUUID(), sub:req.identity.uid, name, size, category, visibility, entityId:entityId || req.identity.uid, description });
      res.set('Cache-Control','no-store').json({ url: `${url}/api/files`, token });
    } catch { res.status(503).json({ message: 'Le stockage du serveur n’est pas configuré.' }); }
  });
  const forward: RequestHandler = async (req: any, res) => {
    try {
      const { url } = storageConfig();
      const token = storageToken({ scope:'manage', sub:req.identity.uid, role:req.identity.role }, 60);
      const upstream = await (dependencies.fetch || fetch)(`${url}/api${req.originalUrl.replace(/^.*?\/api\/storage/, '')}`, { method:req.method, headers:{Authorization:`Bearer ${token}`}, redirect:'error', signal:AbortSignal.timeout(20000) });
      const data = await upstream.json().catch(()=>null);
      res.set('Cache-Control','no-store');
      if (!upstream.ok) return res.status([400,401,403,404,413,507].includes(upstream.status) ? upstream.status : 502).json({ message:data?.detail || 'Le serveur de stockage est indisponible.' });
      if (req.path.endsWith('/preview') || req.path.endsWith('/download')) {
        if (typeof data?.url !== 'string' || !data.url.startsWith(url+'/content/')) return res.status(502).json({ message:'Lien du fichier invalide.' });
        return res.redirect(307,data.url);
      }
      res.status(upstream.status).json(data);
    } catch { res.status(502).json({ message:'Serveur de stockage indisponible. Réessayez.' }); }
  };
  router.get('/files', forward);
  router.get('/storage-stats', forward);
  router.get('/files/:id', forward);
  router.get('/files/:id/preview', forward);
  router.get('/files/:id/download', forward);
  router.delete('/files/:id', forward);
  return router;
}
export const storageRouter = createStorageRouter();
