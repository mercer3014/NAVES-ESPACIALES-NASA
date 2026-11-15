// Cap. 7 · escenas 7.3 (final) – 7.5: paracaídas, amerizaje, rescate y la MQF del Hornet. Escena: src/scenes/cine-recovery.js
import { cine, shot, line } from './cine-rails.js';

export const RECOVERY = cine('recovery', ['VOLVER A CASA', 'COMING HOME'], ['Océano Pacífico · 24 de julio de 1969', 'Pacific Ocean · July 24, 1969'], [
  // 0–6 s: bajo los tres paracaídas (la cámara cae con la cápsula)
  shot(6, [
    { t: 0, pos: [26, -12, 34], look: [0, 16, 0], fov: 48 },
    { t: 1, pos: [16, -3, 24], look: [0, 8, 0], fov: 40 },
  ], { anchor: 'cm', caption: ['16:47 UTC · Tres paracaídas principales', '16:47 UTC · Three main chutes'] }),
  // 6–11 s: amerizaje (s. 7,2), vuelco y boyas que la enderezan
  shot(5, [
    { t: 0, pos: [22, 2.4, 26], look: [0, 3, 0], fov: 38 },
    { t: 1, pos: [15, 2.0, 18], look: [0, 1.4, 0], fov: 34 },
  ], { caption: ['16:50:35 UTC · Amerizaje', '16:50:35 UTC · Splashdown'] }),
  // 11–18 s: llega el Sea King del Hornet, se infla el collar, se abre la escotilla
  shot(7, [
    { t: 0, pos: [42, 9, 34], look: [-30, 10, -20], fov: 38 },
    { t: 1, pos: [24, 4, 20], look: [-8, 6.5, -8], fov: 40 },
  ], {
    caption: ['Helicóptero del USS Hornet · trajes de aislamiento', 'USS Hornet helicopter · isolation suits'],
    lines: [line(4.4, 'ARMSTRONG', ['Póngase el traje, caballeros. Todavía no estamos en casa.', 'Suit up, gentlemen. We\'re not home yet.'], 2.6)],
  }),
  // 18–25 s: la Instalación Móvil de Cuarentena en la cubierta del Hornet
  shot(7, [
    { t: 0, pos: [3, 14, -37], look: [0, 2, 0], fov: 38 },
    { t: 1, pos: [1.8, 3, -19.9], look: [0, 1.8, 0], fov: 36 },
  ], {
    anchor: 'mqf',
    caption: ['USS Hornet · Instalación Móvil de Cuarentena', 'USS Hornet · Mobile Quarantine Facility'],
    lines: [line(1.6, 'NIXON', ['Esta es la semana más grande en la historia del mundo desde la Creación.', 'This is the greatest week in the history of the world since the Creation.'], 4.6)],
  }),
], { music: 'ambient' });
