// Epílogo · escena E.1: desfile con lluvia de papel en Nueva York. Escena: src/scenes/cine-parade.js
import { cine, shot, line } from './cine-rails.js';

export const PARADE = cine('parade', ['UN GRAN SALTO', 'ONE GIANT LEAP'], ['Nueva York · 13 de agosto de 1969', 'New York · August 13, 1969'], [
  // 0–6 s: plano grúa sobre la calle; el descapotable avanza entre el confeti
  shot(6, [
    { t: 0, pos: [12, 24, 42], look: [0, 3, 0], fov: 44 },
    { t: 1, pos: [8, 9, 26], look: [0, 2, 0], fov: 40 },
  ], { anchor: 'car', caption: ['Desfile con lluvia de papel · Broadway', 'Ticker-tape parade · Broadway'] }),
  // 6–12 s: los tres saludan
  shot(6, [
    { t: 0, pos: [2.6, 2.3, 5.2], look: [0, 1.5, -1.6], fov: 38 },
    { t: 1, pos: [-2.2, 2.1, 4.6], look: [0, 1.5, -1.6], fov: 36 },
  ], { anchor: 'car' }),
  // 12–19 s: Collins mira la multitud (voz en off)
  shot(7, [
    { t: 0, pos: [-1.9, 1.75, 1.1], look: [-0.6, 1.5, -1.65], fov: 34 },
    { t: 1, pos: [-2.2, 1.85, 0.6], look: [-0.6, 1.5, -1.65], fov: 30 },
  ], {
    anchor: 'car',
    lines: [line(0.5, 'COLLINS (VOZ EN OFF)', ['En todas partes la gente no decía «ustedes lo lograron». Decía «lo logramos». Eso era lo correcto.', 'Everywhere, people didn\'t say "you did it". They said "we did it". And that was right.'], 6.2)],
  }),
  // 19–25 s: la cámara sube sobre Broadway; la gira mundial
  shot(6, [
    { t: 0, pos: [6, 5, 16], look: [0, 2, 0], fov: 40 },
    { t: 1, pos: [12, 42, 34], look: [0, 6, -24], fov: 46 },
  ], { anchor: 'car', caption: ['Después: gira mundial de 45 días por 24 países', 'Then: a 45-day world tour of 24 countries'] }),
], { music: 'victory' });
