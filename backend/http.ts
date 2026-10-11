import type { RequestHandler, ErrorRequestHandler } from 'express';
export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'REQUEST_FAILED') { super(message); }
}
export const safeAsync = (fn: (...args: any[]) => any): RequestHandler => (req, res, next) => {
  try { Promise.resolve(fn(req, res, next)).catch(next); } catch (error) { next(error); }
};
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof HttpError ? error.status : error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 503;
  if (status >= 500) console.error('[API]', error.code || error.name || 'unavailable');
  res.status(status).json({ error: error instanceof HttpError ? error.message : status === 413 ? 'Requête trop volumineuse.' : status === 400 ? 'Requête JSON invalide.' : 'Service temporairement indisponible.', code: error instanceof HttpError ? error.code : 'SERVICE_UNAVAILABLE' });
};
export const validId = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{1,128}$/.test(value);
