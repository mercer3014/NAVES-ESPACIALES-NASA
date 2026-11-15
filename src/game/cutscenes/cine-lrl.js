// Cap. 7 · escena 7.6: Laboratorio de Recepción Lunar. Las familias ven a los astronautas a través del vidrio. Escena: src/scenes/cine-lrl.js
// La línea de Rick depende de la decisión del cap. 1 (vars.rickHeard en playCine('lrl', { vars })); aquí van las dos variantes.
import { cine, shot, line } from './cine-rails.js';

export const RICK_LINES = {
  heard: ['Te escuché aterrizar.', 'I heard you land.'],
  told: ['Nos lo tendrías que haber dicho, papá.', 'You should have told us, Dad.'],
};

export const lrlDef = (rickHeard = true) => cine('lrl', ['CUARENTENA', 'QUARANTINE'], ['Laboratorio de Recepción Lunar · Houston', 'Lunar Receiving Laboratory · Houston'], [
  // 0–5 s: plano general desde el lado de las visitas; Neil camina hasta el vidrio
  shot(5, [
    { t: 0, pos: [3.6, 1.9, 3.2], look: [-1.2, 1.2, -1.2], fov: 46 },
    { t: 1, pos: [2.6, 1.7, 2.6], look: [-1.4, 1.3, -0.6], fov: 42 },
  ], { caption: ['21 días de aislamiento · hasta el 10 de agosto', '21 days in isolation · until August 10'] }),
  // 5–9 s: Mark, desde el lado de la tripulación (a través del vidrio)
  shot(4, [
    { t: 0, pos: [-1.0, 1.25, -1.3], look: [-1.6, 0.9, 0.9], fov: 38 },
    { t: 1, pos: [-1.1, 1.2, -1.0], look: [-1.6, 0.9, 0.9], fov: 34 },
  ], { lines: [line(0.5, 'MARK', ['¿Trajiste una piedra?', 'Did you bring a rock?'], 3)] }),
  // 9–14 s: Neil
  shot(5, [
    { t: 0, pos: [-0.9, 1.55, 1.6], look: [-1.5, 1.55, -0.5], fov: 36 },
    { t: 1, pos: [-1.0, 1.6, 1.3], look: [-1.5, 1.6, -0.5], fov: 32 },
  ], { lines: [line(0.4, 'ARMSTRONG', ['Trajimos veintiún kilos. Pero no son nuestras. Son de todos.', 'We brought back twenty-one kilos. But they aren\'t ours. They belong to everyone.'], 4.4)] }),
  // 14–18 s: Rick (varía según el cap. 1)
  shot(4, [
    { t: 0, pos: [-1.9, 1.3, -1.2], look: [-1.3, 1.1, 0.9], fov: 36 },
    { t: 1, pos: [-1.95, 1.3, -1.0], look: [-1.3, 1.1, 0.9], fov: 32 },
  ], { lines: [line(0.4, 'RICK', rickHeard ? RICK_LINES.heard : RICK_LINES.told, 3.4)] }),
  // 18–24 s: las manos en el vidrio, plano de perfil
  shot(6, [
    { t: 0, pos: [0.9, 1.35, 0.05], look: [-1.5, 1.2, 0], fov: 40 },
    { t: 1, pos: [0.3, 1.3, 0.02], look: [-1.5, 1.15, 0], fov: 32 },
  ], { caption: ['No se encontró ningún organismo lunar', 'No lunar organism was ever found'] }),
], { music: 'layer-resolve' });

export const LRL = lrlDef(true);
