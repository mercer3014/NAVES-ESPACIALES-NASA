// Ground travel uses the alternating walk cycle at any cruise speed. bunny-hop is the
// intentional jump only: speed previously crossed 1.05 m/s (below vmax 1.9) and every
// step also forced air, so the symmetric hop replaced the legs and the body pogoed.
export function locomotionClip({ speed = 0, jump = false } = {}) {
  if (jump) return { clip: 'bunny-hop', timeScale: 1 };
  if (speed > 0.08) return { clip: 'walk', timeScale: Math.min(1.75, Math.max(0.5, speed / 1.05)) };
  return { clip: 'idle', timeScale: 1 };
}
