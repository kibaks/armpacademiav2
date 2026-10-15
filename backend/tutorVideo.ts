import { Router } from 'express';
import { createVeoTutorVideoRouter } from './veoTutorVideo.js';

// Veo replaces Sync for new tutor replies. Legacy Sync jobs are not submitted here.
export function createTutorVideoRouter() {
  return Router().use(createVeoTutorVideoRouter());
}
