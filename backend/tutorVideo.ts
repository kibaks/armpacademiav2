import { Router } from 'express';
import { createMuseTalkTutorVideoRouter } from './musetalkTutorVideo.js';

// Self-hosted MuseTalk replaces cloud video generation for new replies.
export function createTutorVideoRouter() {
  return Router().use(createMuseTalkTutorVideoRouter());
}
