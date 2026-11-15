// Cap. 7 · escena 7.1B «La perrita» (versión cinemática corta): el perrito de tela flota con la Tierra detrás
// y un inserto de la Bitácora con el Sputnik 2. Escena: src/scenes/cine-laika.js
import { cine, shot, line } from './cine-rails.js';

export const LAIKA = cine('laika', ['LA PERRITA', 'THE LITTLE DOG'], ['Columbia · camino a casa · dramatizado', 'Columbia · homeward bound · dramatized'], [
  // 0–7 s: el perrito de tela flota; la Tierra detrás
  shot(7, [
    { t: 0, pos: [0.22, 0.1, 0.8], look: [0, -0.03, 0], fov: 36 },
    { t: 1, pos: [0.12, 0.06, 0.6], look: [0, -0.02, 0], fov: 32 },
  ], {
    anchor: 'laika',
    caption: ['22 de julio de 1969 · tras la inyección transterrestre', 'July 22, 1969 · after trans-Earth injection'],
    lines: [
      line(0.4, 'COLLINS', ['Es una tripulante no oficial. Pasajera de honor. Se llama Laika.', 'She\'s an unofficial crew member. Guest of honour. Her name is Laika.'], 3.6),
      line(4.2, 'ARMSTRONG', ['La primera perra en órbita.', 'The first dog in orbit.'], 2.6),
    ],
  }),
  // 7–14 s: inserto de la Bitácora: Sputnik 2 sobre la Tierra
  shot(7, [
    { t: 0, pos: [9, 3, 11], look: [0, 1.5, 0], fov: 40 },
    { t: 1, pos: [5, 0.8, 7.5], look: [0, 1.8, 0], fov: 36 },
  ], {
    anchor: 'sputnik',
    caption: ['Bitácora · Sputnik 2 · 3 de noviembre de 1957', 'Logbook · Sputnik 2 · November 3, 1957'],
    lines: [line(0.4, 'COLLINS', ['Noviembre del 57. Sputnik 2. Una perrita callejera de Moscú. Antes de nosotros, antes de Gagarin… ella dio la vuelta a la Tierra.', 'November \'57. Sputnik 2. A stray from Moscow. Before us, before Gagarin… she went around the Earth.'], 6.2)],
  }),
  // 14–21 s: de vuelta al perrito, que gira despacio frente a la Tierra
  shot(7, [
    { t: 0, pos: [-0.2, 0.1, 0.65], look: [0, -0.03, 0], fov: 34 },
    { t: 1, pos: [-0.3, 0.16, 1.2], look: [0, -0.06, -0.3], fov: 38 },
  ], {
    anchor: 'laika',
    caption: ['Tarjeta Legendaria · «Laika»', 'Legendary card · "Laika"'],
    lines: [
      line(0.3, 'ALDRIN', ['Y no volvió.', 'And she never came back.'], 2),
      line(2.4, 'COLLINS', ['No. Sabían que no volvería. Por eso la traje. Para que alguien de los que abrieron el camino haga el viaje completo, aunque sea de tela.', 'No. They knew she wouldn\'t. That\'s why I brought her. So one of those who opened the way makes the whole trip, even if she\'s made of cloth.'], 4.6),
    ],
  }),
], { music: 'layer-drift' });
