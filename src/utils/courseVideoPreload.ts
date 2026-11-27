import { publishedInitiationVideo } from './publishedInitiationVideos';
import publishedSource from '../assets/courses/init-01-chapitre-01-tutrice-v1.json';
import publishedFilm from '../assets/courses/init-01-chapitre-01-tutrice-v1.mp4';
import type { CourseModule } from '../types';

const MAX_BYTES = 64 * 1024 * 1024;
const blobs = new Map<string, {url:string; size:number}>();
let used = 0;
export function cachedCourseVideo(url: string | undefined) { return url ? blobs.get(url)?.url || url : undefined; }
export function clearCourseVideoPreload() {
  for (const item of blobs.values()) URL.revokeObjectURL(item.url);
  blobs.clear(); used = 0;
}
export function courseVideoSources(courses: CourseModule[]) {
  const urls: string[] = [];
  for (const course of courses) for (const [index,lesson] of (course.lessons || []).entries()) {
    const url = publishedInitiationVideo(course.id, index, lesson.content) || (course.id === publishedSource.courseId && index === publishedSource.lessonIndex && lesson.content === publishedSource.content ? publishedFilm : lesson.mediaUrl);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}
/** Download existing films only, sequentially; never submit GPU generation jobs. */
export async function preloadCourseVideos(courses: CourseModule[], signal: AbortSignal, userId: string) {
  let disk: Cache | undefined;
  try { disk = await caches.open(`academia-course-videos-v1:${encodeURIComponent(userId)}`); } catch { /* Storage may be disabled; retain the session cache. */ }
  for (const source of courseVideoSources(courses)) {
    if (signal.aborted || used >= MAX_BYTES) return;
    if (blobs.has(source)) continue;
    try {
      const url = new URL(source, location.origin);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
      const saved = await disk?.match(url.href);
      if (signal.aborted) return;
      const response = saved || await fetch(url, {signal:AbortSignal.any([signal,AbortSignal.timeout(60000)]), credentials:'same-origin', cache:'force-cache'});
      if (!response.ok || !response.headers.get('content-type')?.startsWith('video/') || !response.body) { await response.body?.cancel(); continue; }
      const available = MAX_BYTES - used;
      if (Number(response.headers.get('content-length')) > available) { await response.body.cancel(); continue; }
      const reader = response.body.getReader(), chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > available) { await reader.cancel(); break; }
          chunks.push(part.value);
        }
      } finally { reader.releaseLock(); }
      if (signal.aborted || !size || size > available) continue;
      if (!blobs.has(source)) {
        const blob = new Blob(chunks as BlobPart[], {type:response.headers.get('content-type')!});
        if (!saved && disk) {
          try {
            const keys = await disk.keys();
            let total = 0;
            for (const key of keys) total += Number((await disk.match(key))?.headers.get('Content-Length') || 0);
            for (const key of keys) {
              if (total + size <= MAX_BYTES) break;
              total -= Number((await disk.match(key))?.headers.get('Content-Length') || 0);
              await disk.delete(key);
            }
            await disk.put(url.href, new Response(blob, {headers:{'Content-Type':blob.type,'Content-Length':String(size)}}));
          } catch { /* Quota full: playback still works for this session. */ }
        }
        if (signal.aborted) return;
        blobs.set(source,{url:URL.createObjectURL(blob),size}); used += size;
      }
    } catch { if (signal.aborted) return; /* A film failure must not block the following courses. */ }
  }
}
