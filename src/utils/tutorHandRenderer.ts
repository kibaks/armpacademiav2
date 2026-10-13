import handsUrl from '../assets/images/tutor_teaching_hands.png';
import type { AvatarComputedFrame } from '../workers/avatarExpressionWorker';
let hands: HTMLImageElement | null = null;
export function renderTutorHands(canvas: HTMLCanvasElement, frame: AvatarComputedFrame) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!hands) { hands = new Image(); hands.src = handsUrl; }
  if (!hands.complete || !hands.naturalWidth) return;
  const opacity = Math.min(0.92, Math.max(0, -(frame.leftHandDy + frame.rightHandDy) / 12));
  if (opacity < 0.01) return;
  ctx.globalAlpha = opacity;
  const half = hands.naturalWidth / 2;
  for (const [index, dx, dy] of [[0, frame.leftHandDx, frame.leftHandDy], [1, frame.rightHandDx, frame.rightHandDy]]) {
    ctx.save();
    const x = index === 0 ? 50 : 340;
    ctx.translate(x + dx * 2, 80 + dy * 2);
    ctx.rotate((index === 0 ? -1 : 1) * dy * 0.002);
    ctx.drawImage(hands, index * half, 0, half, hands.naturalHeight, 0, 0, 210, 280);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
