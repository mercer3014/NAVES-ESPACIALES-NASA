// Registro de las cinemáticas en escena propia (Tierra: hotel 1967, MOCR, casa Armstrong) y vista de depuración.
//   import { playCinematic } from './cutscenes/cine-index.js';
//   await playCinematic('mocr-1202', { ctx, answer: 'go' });
// Cada una es saltable (Esc/Enter o tocando una barra) y devuelve { id, played, skipped }.
import { runCinematic, stopCinematic, cinematicActive, cineDuration } from './cine-player.js';
import { CINE_MOCR } from './cine-mocr.js';
import { CINE_HOUSE } from './cine-house.js';
import { CINE_HOTEL } from './cine-hotel.js';

export const CINEMATICS = { ...CINE_HOTEL, ...CINE_MOCR, ...CINE_HOUSE };
export const CINE_IDS = Object.keys(CINEMATICS);
// Orden del guion: prólogo (0.2, 0.3), cap. 1 (1.1), cap. 4 (4.2, 4.4, 4.5, 4.6, 4.7)
export const CINE_SEQUENCES = {
  prologue: ['hotel-prologue', 'mocr-tough'],
  chapter1: ['house-farewell'],
  landing: ['mocr-landed', 'house-landed'],
};

export function playCinematic(id, opts = {}) {
  const def = CINEMATICS[id];
  if (!def) return Promise.resolve({ id, played: false, skipped: false });
  return runCinematic(def, opts);
}
// Encadena varias; si el jugador salta una, se salta el resto de la secuencia
export async function playSequence(ids, opts = {}) {
  const list = typeof ids === 'string' ? CINE_SEQUENCES[ids] || [] : ids; const out = [];
  for (const id of list) { const r = await playCinematic(id, opts); out.push(r); if (r.skipped || opts.ctx?.dead) break; }
  return out;
}
export { stopCinematic, cinematicActive, cineDuration };

// Vista de depuración (?debug&cine=<id>): repite la cinemática sobre un mundo vacío
export async function previewCinematic(id) {
  const { THREE, setWorld } = await import('../../core/engine.js');
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  setWorld({ scene, camera, update() {} });
  const cue = CINEMATICS[id] ? id : CINE_IDS[0];
  const run = () => playCinematic(cue, { answer: 'go' }).then(() => setTimeout(run, 400)); run();
}
