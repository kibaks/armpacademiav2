import type { TutorMotion } from '../../shared/tutorPresentation';
import femalePosturesUrl from '../assets/images/tutor_female_postures.webp';
import femaleArticulationUrl from '../assets/images/tutor_female_articulation.webp';
import maleAtlasUrl from '../assets/images/tutor_male_postures_articulation.webp';
import type { AvatarComputedFrame } from '../workers/avatarExpressionWorker';
import { selectTutorPosture, selectTutorArticulation, referenceCell, FEMALE_POSTURE_MOUTHS, FEMALE_ARTICULATION_MOUTHS, MALE_POSTURE_MOUTHS, MALE_ARTICULATION_MOUTHS, type TutorPosture } from './tutorReferenceGeometry';
const atlases = new Map<string, HTMLImageElement>();
const states = new WeakMap<HTMLCanvasElement, { pose: TutorPosture; changedAt: number; patch: HTMLCanvasElement }>();
function atlas(url: string) { let image = atlases.get(url); if (!image) { image = new Image(); image.src = url; atlases.set(url, image); } return image; }
export function renderTutorReference(canvas: HTMLCanvasElement, frame: AvatarComputedFrame, options: { male: boolean; gestures: boolean; expressions: boolean; reducedMotion: boolean; motion: TutorMotion }) {
  const poses = atlas(options.male ? maleAtlasUrl : femalePosturesUrl);
  const mouths = atlas(options.male ? maleAtlasUrl : femaleArticulationUrl);
  if (!poses.complete || !poses.naturalWidth) return false;
  const ctx = canvas.getContext('2d'); if (!ctx) return false;
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  let state = states.get(canvas);
  let candidate = selectTutorPosture(frame.isSpeaking, frame.emotion, options.gestures && !options.reducedMotion, options.expressions);
  if (options.motion === 'subtle' && frame.isSpeaking && (candidate === 0 || candidate === 5)) candidate = 4;
  if (!state) { const patch = document.createElement('canvas'); patch.width = 144; patch.height = 88; state = { pose: candidate, changedAt: frame.nowMs - 3000, patch }; states.set(canvas, state); }
  // Full-body poses change only at rest or a closed articulation, with a minimum dwell.
  if (candidate !== state.pose && (!options.gestures || !options.expressions || options.reducedMotion || ((state.pose === 1 && frame.isSpeaking) || frame.nowMs - state.changedAt > (options.motion === 'subtle' ? 3200 : 2200) && (!frame.isSpeaking || frame.viseme === 'closed')))) { state.pose = candidate; state.changedAt = frame.nowMs; }
  ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const drawPose = (pose: TutorPosture, alpha: number) => {
    const cell = referenceCell(options.male, pose);
    // Contain the complete reference pose: the crown, sleeves and hands share one frame.
    const scale = Math.min(width / cell.w, height / cell.h), x = (width - cell.w * scale) / 2, y = (height - cell.h * scale) / 2;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#6b7d89'; ctx.fillRect(0, 0, width, height);
    ctx.drawImage(poses, cell.x, cell.y, cell.w, cell.h, x, y, cell.w * scale, cell.h * scale);
    if (frame.isSpeaking && frame.mouthOpacity === '1' && mouths.complete && mouths.naturalWidth && pose !== 1) {
      const shape = selectTutorArticulation(frame.viseme, frame.open), source = referenceCell(options.male, shape, true);
      const src = (options.male ? MALE_ARTICULATION_MOUTHS : FEMALE_ARTICULATION_MOUTHS)[shape];
      const dst = (options.male ? MALE_POSTURE_MOUTHS : FEMALE_POSTURE_MOUTHS)[pose];
      const patch = state!.patch, p = patch.getContext('2d')!;
      p.clearRect(0, 0, patch.width, patch.height);
      p.globalCompositeOperation = 'source-over';
      p.drawImage(mouths, source.x + src.x - 70, source.y + src.y - 42, 140, 84, 0, 0, patch.width, patch.height);
      // A feathered skin boundary keeps the photographic lips attached to their face.
      p.globalCompositeOperation = 'destination-in';
      p.save(); p.translate(72, 44); p.scale(72, 44);
      const mask = p.createRadialGradient(0, 0, 0.88, 0, 0, 1); mask.addColorStop(0, '#fff'); mask.addColorStop(1, 'transparent');
      p.fillStyle = mask; p.fillRect(-1, -1, 2, 2); p.restore(); p.globalCompositeOperation = 'source-over';
      ctx.translate(x + dst.x * scale, y + dst.y * scale); ctx.rotate(dst.angle * Math.PI / 180);
      const mouthWidth = (options.male ? 76 : pose === 3 || pose === 4 ? 84 : 104) * scale, mouthHeight = (options.male ? 45 : pose === 3 || pose === 4 ? 46 : 62) * scale;
      ctx.drawImage(patch, -mouthWidth / 2, -mouthHeight / 2, mouthWidth, mouthHeight);
    }
    ctx.restore();
  };
  // Never blend two heads or detached arms: one complete anatomical pose per frame.
  drawPose(state.pose, 1);
  return true;
}
