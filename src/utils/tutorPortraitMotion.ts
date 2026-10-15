/** Shared portrait motion for Henri and the female tutor; no neural video model. */
export function sampleTutorBlink(elapsedMs: number): number {
  if (elapsedMs < 0 || elapsedMs >= 500) return 0;
  if (elapsedMs < 160) return (1 - Math.cos(Math.PI * elapsedMs / 160)) / 2;
  if (elapsedMs <= 260) return 1;
  return (1 + Math.cos(Math.PI * (elapsedMs - 260) / 240)) / 2;
}

export function projectTutorHeadPoint(
  x: number, y: number, depth: number, pivotX: number, pivotY: number,
  yawDegrees: number, pitchDegrees: number, rollDegrees: number
): [number, number] {
  const yaw = yawDegrees * Math.PI / 180;
  const pitch = pitchDegrees * Math.PI / 180;
  const roll = rollDegrees * Math.PI / 180;
  const rx = x - pivotX, ry = y - pivotY;
  const x1 = rx * Math.cos(yaw) - depth * Math.sin(yaw);
  const z1 = rx * Math.sin(yaw) + depth * Math.cos(yaw);
  const y2 = ry * Math.cos(pitch) + z1 * Math.sin(pitch);
  return [pivotX + x1 * Math.cos(roll) - y2 * Math.sin(roll),
    pivotY + x1 * Math.sin(roll) + y2 * Math.cos(roll)];
}
