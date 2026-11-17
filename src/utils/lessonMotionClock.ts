/** Decorative motion follows active viewing time and freezes while paused. */
export type LessonMotionClock = { seconds: number; previous: number | null };
export function advanceLessonMotion(clock: LessonMotionClock, timestamp: number, active: boolean) {
  if (!active || !Number.isFinite(timestamp)) {
    clock.previous = null;
    return clock.seconds;
  }
  if (clock.previous !== null) clock.seconds += Math.max(0, Math.min(0.1, (timestamp - clock.previous) / 1000));
  clock.previous = timestamp;
  return clock.seconds;
}
