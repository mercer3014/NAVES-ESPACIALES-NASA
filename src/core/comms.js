// Mission-control lines: one gate for speech and the subtitle bubble.
import { store } from './store.js';

const ESSENTIAL = new Set([
  'pa.go', 'pa.stage', 'pa.1202', 'pa.control', 'pa.fuel', 'pa.landed',
  'pa.align', 'pa.tli', 'pa.los', 'pa.eva', 'e.crooked', 'd.pancho',
  'fault.fc2', 'fault.busb', 'fault.lamp',
]);
const SAME = 22000;
const BETWEEN = 5000;
const ESSENTIAL_GAP = 1200;
const saidAt = new Map();
let lastAt = 0;

export function commsMode() {
  const m = store.get('comms');
  return m === 'normal' || m === 'off' ? m : 'min';
}
export function commsReset() { saidAt.clear(); lastAt = 0; }

export function commsAllow(key) {
  const mode = commsMode();
  if (mode === 'off') return false;
  const essential = ESSENTIAL.has(key);
  if (mode === 'min' && !essential) return false;
  const now = performance.now();
  if (now - (saidAt.get(key) || 0) < SAME) return false;
  const gap = essential ? ESSENTIAL_GAP : BETWEEN;
  if (lastAt && now - lastAt < gap) return false;
  saidAt.set(key, now); lastAt = now;
  return true;
}
