// A mastered Piper voice must not receive the automatic speed/pitch boost.
export function providerRate(provider: string, speed: number) {
  const safe = Number.isFinite(speed) && speed > 0 ? speed : 1;
  return provider === 'piper' ? safe : safe * 1.02;
}
