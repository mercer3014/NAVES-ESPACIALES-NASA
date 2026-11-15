// Cinemática del prólogo · Escena 0.2 — Hotel Georgetown Inn, Washington D. C., 27 de enero de 1967.
// En el guion es jugable (mover la cámara, mirar la cartera y la libreta); aquí se resuelve como cinemática con los dos objetos.
// La foto de Karen es un recuerdo privado: no se muestra ni se describe, solo se nombra.
const L = (at, who, tx, tag, sfx) => ({ at, who, tx, tag, sfx });
const NA = ['', ''];
const ring = (at) => ({ at, do: () => import('../../core/audio.js').then((a) => a.sfx('ping', { vol: 0.45, rate: 1.4 })) });

export const CINE_HOTEL = {
  'hotel-prologue': {
    id: 'hotel-prologue', make: () => import('../../scenes/cine-hotel.js').then((m) => m.makeHotel()),
    shots: [
      { d: 5, on: (w) => w.ring(true), events: [ring(0.3), ring(1.5), ring(2.7), ring(3.9)],
        cam: [{ t: 0, pos: [-1.9, 1.7, 2.05], look: [0.4, 0.8, -1.2], fov: 46 }, { t: 1, pos: [-1.55, 1.65, 1.85], look: [0.5, 0.85, -1.2], fov: 42 }],
        lines: [L(0, ['HOTEL GEORGETOWN INN · WASHINGTON D. C.', 'GEORGETOWN INN · WASHINGTON D.C.'], ['27 de enero de 1967 · noche. El teléfono suena.', 'January 27, 1967 · night. The phone rings.'])] },
      { d: 4.4, on: (w) => w.lift(true), cam: [{ t: 0, pos: [1.95, 1.25, -0.55], look: [0.62, 1.1, -0.95], fov: 34 }, { t: 1, pos: [1.8, 1.22, -0.6], look: [0.62, 1.12, -0.95], fov: 31 }],
        lines: [L(0, ['VOZ AL TELÉFONO', 'VOICE ON THE PHONE'], ['Hubo un incendio en la cabina. En la prueba.', 'There was a fire in the cabin. During the test.'], 'drama')] },
      { d: 4.6, cam: [{ t: 0, pos: [2.0, 1.32, -0.15], look: [0.75, 0.98, -1.3], fov: 40 }, { t: 1, pos: [1.9, 1.3, -0.2], look: [0.75, 0.98, -1.3], fov: 38 }],
        lines: [L(0, ['VOZ AL TELÉFONO', 'VOICE ON THE PHONE'], ['Gus, Ed y Roger… no salieron.', 'Gus, Ed and Roger… didn\'t make it out.'], 'drama')] },
      { d: 4.5, cam: [{ t: 0, pos: [-1.8, 1.4, 0.6], look: [1.5, 1.0, -0.9], fov: 40 }, { t: 1, pos: [-1.6, 1.4, 0.35], look: [1.5, 1.0, -0.9], fov: 38 }],
        lines: [L(0, NA, ['Silencio. Neil no se mueve. Solo se escucha el tráfico afuera.', 'Silence. Neil doesn\'t move. Only the traffic outside.'])] },
      { d: 4.2, cam: [{ t: 0, pos: [-1.0, 0.98, -1.4], look: [-1.3, 0.6, -1.88], fov: 30 }, { t: 1, pos: [-1.05, 0.92, -1.5], look: [-1.3, 0.6, -1.88], fov: 27 }],
        lines: [L(0, ['LA CARTERA DE NEIL', 'NEIL\'S WALLET'], ['Una foto: Karen Armstrong (1959–1962). Neil no habla de ella.', 'A photo: Karen Armstrong (1959–1962). Neil doesn\'t talk about her.'])] },
      { d: 6.4, cam: [{ t: 0, pos: [-0.85, 0.98, -1.55], look: [-1.15, 0.6, -1.98], fov: 30 }, { t: 1, pos: [-0.9, 0.92, -1.62], look: [-1.15, 0.6, -1.98], fov: 27 }],
        lines: [L(0, ['LIBRETA DE DIRECCIONES', 'ADDRESS BOOK'], ['«Ed White — El Lago, Texas».', '"Ed White — El Lago, Texas".']),
          L(2.2, ['NEIL (VOZ EN OFF)', 'NEIL (VOICE-OVER)'], ['Cuando se quemó mi casa en el 64, Ed saltó la cerca antes que nadie. Me ayudó a sacar a mi familia.', 'When my house burned in \'64, Ed was first over the fence. He helped me get my family out.'], 'drama')] },
      { d: 5.5, cam: [{ t: 0, pos: [-1.9, 1.75, 2.1], look: [0.5, 0.9, -1.1], fov: 44 }, { t: 1, pos: [-2.0, 1.85, 2.25], look: [0.5, 0.9, -1.1], fov: 46 }],
        lines: [L(0, ['BITÁCORA · APOLO 1', 'LOGBOOK · APOLLO 1'], ['Gus Grissom, Ed White y Roger Chaffee murieron en una prueba en tierra. La nave se rediseñó por completo.', 'Gus Grissom, Ed White and Roger Chaffee died in a ground test. The spacecraft was completely redesigned.'])] },
    ],
  },
};
