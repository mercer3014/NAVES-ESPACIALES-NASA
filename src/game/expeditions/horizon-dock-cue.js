// Horizonte docking/assembly cue only. Other music layers must leave this file alone.
import { DOCK_DIST } from '../../sim/horizon.js';

export const HORIZON_DOCK_TRACK = '/audio/music/horizon-dock-assembly.mp3';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Quiet bed while far, swell as the craft closes for capture. The ring and the
// probe meet near DOCK_DIST, so the crescendo finishes at the collar rather than
// at the old point-icon range. Distance carries it; matched speed adds a small lift.
export function dockCueGain(distance, relSpeed) {
  const d = Number.isFinite(distance) ? distance : 8;
  const close = DOCK_DIST * 0.92;
  const near = clamp01((5.6 - d) / (5.6 - close));
  const shaped = near ** 1.35;
  const dv = Number.isFinite(relSpeed) ? Math.max(0, relSpeed) : 1;
  const bonus = near > 0.55 ? 0.05 * clamp01((0.7 - dv) / 0.7) : 0;
  return 0.34 + 0.46 * shaped + bonus;
}

// play through the intercept, release on a successful dock, cut on failure.
export function dockCueAction(stage) {
  if (stage === 'intercept') return 'play';
  if (stage === 'failed') return 'cut';
  return 'resolve';
}
