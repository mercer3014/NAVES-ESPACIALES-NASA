// Cinemáticas del Control de Misión (Houston). Guion: prólogo 0.3 y capítulo 4 (escenas 4.2, 4.4, 4.5 y el final de 4.6).
// Coordenadas de cámara en metros de mocr-room.glb (las pantallas de pared están en +Z, la pizarra en x≈−10).
// tag 'real' = frase de las transcripciones (Apollo Flight Journal); 'drama' = dramatizado según el guion.
const mocr = (era) => () => import('../../scenes/cine-mocr.js').then((m) => m.makeMocr({ era }));
const L = (at, who, tx, tag, sfx) => ({ at, who, tx, tag, sfx });
const K = ['KRANZ', 'KRANZ'], DUKE = ['CAPCOM · CHARLIE DUKE', 'CAPCOM · CHARLIE DUKE'], NA = ['', ''];
const ARM = ['ARMSTRONG (RADIO)', 'ARMSTRONG (RADIO)'], ALD = ['ALDRIN (RADIO)', 'ALDRIN (RADIO)'];
const act = (key, clip, once = false) => (w) => w.actors[key]?.play(clip, { once });

// Kranz en el frente (1967) mira a −Z; en 1969 está en la fila 3 (0, 0.7, −2.45) mirando a +Z.
const KRANZ_1969 = [{ t: 0, pos: [1.1, 2.4, -0.7], look: [-0.2, 2.05, -2.45], fov: 36 }, { t: 1, pos: [0.95, 2.38, -0.85], look: [-0.2, 2.05, -2.45], fov: 34 }];
const BALES = [{ t: 0, pos: [2.9, 1.6, 3.5], look: [1.1, 1.05, 2.6], fov: 36 }, { t: 1, pos: [2.75, 1.55, 3.35], look: [1.1, 1.05, 2.6], fov: 34 }];
const GARMAN = [{ t: 0, pos: [3.3, 2.75, -3.6], look: [4.5, 2.5, -5.5], fov: 32 }, { t: 1, pos: [3.5, 2.7, -3.85], look: [4.5, 2.5, -5.5], fov: 29 }];
const DUKE_CAM = [{ t: 0, pos: [-1.4, 1.8, 1.4], look: [-3.07, 1.35, 0.1], fov: 36 }, { t: 1, pos: [-1.55, 1.78, 1.25], look: [-3.07, 1.35, 0.1], fov: 34 }];
const WIDE_BACK = [{ t: 0, pos: [5.5, 3.6, -6.6], look: [0, 1.3, 4], fov: 46 }, { t: 1, pos: [2.5, 3.4, -6.8], look: [0, 1.2, 4.5], fov: 44 }];

export const CINE_MOCR = {
  // Prólogo · Escena 0.3 — «Duros y competentes» (enero de 1967)
  'mocr-tough': {
    id: 'mocr-tough', make: mocr('1967'),
    shots: [
      { d: 5, cam: WIDE_BACK, lines: [L(0, ['CONTROL DE MISIÓN · HOUSTON', 'MISSION CONTROL · HOUSTON'], ['Enero de 1967. Días después del incendio del Apolo 1.', 'January 1967. Days after the Apollo 1 fire.'])] },
      { d: 6, on: act('kranz', 'talk'), cam: [{ t: 0, pos: [0.9, 1.62, 3.5], look: [0, 1.55, 5.6], fov: 30 }, { t: 1, pos: [0.6, 1.62, 3.9], look: [0, 1.55, 5.6], fov: 28 }],
        lines: [L(0, K, ['El espacio no tolera el descuido, la incapacidad ni la negligencia.', 'Space is not tolerant of carelessness, incapacity, or neglect.'], 'real')] },
      { d: 5, cam: [{ t: 0, pos: [-0.7, 1.85, 6.7], look: [0, 0.9, 0], fov: 40 }, { t: 1, pos: [0.7, 1.85, 6.7], look: [0, 0.9, 0], fov: 38 }],
        lines: [L(0, K, ['En algún lugar, de alguna manera, metimos la pata.', 'Somewhere, somehow, we screwed up.'], 'real')] },
      { d: 6.5, on: act('kranz', 'point', true), cam: [{ t: 0, pos: [-0.9, 1.65, 3.7], look: [0.25, 1.4, 5.6], fov: 34 }, { t: 1, pos: [-0.8, 1.65, 3.85], look: [0.25, 1.4, 5.6], fov: 32 }],
        lines: [L(0, K, ['A partir de hoy, Control de Vuelo será conocido por dos palabras: duros y competentes.', 'From this day forward, Flight Control will be known by two words: tough and competent.'], 'real')] },
      { d: 5.5, cam: [{ t: 0, pos: [-5.4, 1.8, 3.2], look: [-9.97, 1.55, 1.5], fov: 40 }, { t: 1, pos: [-6.0, 1.75, 2.6], look: [-9.97, 1.55, 1.5], fov: 38 }],
        lines: [L(0, K, ['Escríbanlas en sus pizarras. Y no las borren nunca.', 'Write them on your blackboards. And never erase them.'], 'real')] },
      { d: 3.5, cam: [{ t: 0, pos: [-6.0, 1.75, 2.6], look: [-9.97, 1.55, 1.5], fov: 38 }, { t: 1, pos: [-6.2, 1.75, 2.5], look: [-9.97, 1.55, 1.5], fov: 38 }],
        lines: [L(0, NA, ['Dos años y medio después.', 'Two and a half years later.'])] },
    ],
  },

  // Cap. 4 · Escena 4.2 — Kranz cierra las puertas; Bales y la hoja de Garman (20 jul 1969, 19:50 UTC)
  'mocr-briefing': {
    id: 'mocr-briefing', make: mocr('1969'),
    shots: [
      { d: 5.5, cam: WIDE_BACK.map((k) => ({ ...k, pos: [-k.pos[0], k.pos[1], k.pos[2]] })),
        lines: [L(0, ['CONTROL DE MISIÓN · HOUSTON', 'MISSION CONTROL · HOUSTON'], ['20 de julio de 1969 · 19:50 UTC', 'July 20, 1969 · 19:50 UTC']),
          L(2.6, NA, ['Kranz se pone su chaleco blanco nuevo y ordena cerrar las puertas de la sala.', 'Kranz puts on his new white vest and orders the room doors locked.'], null, 'door')] },
      { d: 8, on: act('kranz', 'talk'), cam: KRANZ_1969,
        lines: [L(0, K, ['Hoy vamos a hacer algo que nadie ha hecho. Vamos a aterrizar en la Luna.', 'Today we do something no one has done. We are going to land on the Moon.'], 'drama'),
          L(4, K, ['Pase lo que pase, salgo de esta sala con ustedes. Confío en cada uno de los que están aquí.', 'Whatever happens, I leave this room with all of you. I trust every one of you.'], 'drama')] },
      { d: 4.5, cam: BALES, lines: [L(0, ['STEVE BALES, 26 · GUIADO', 'STEVE BALES, 26 · GUIDANCE'], ['Tendrá diez segundos para decidir si la misión sigue o se aborta.', 'He will have ten seconds to decide whether the mission goes on or aborts.'])] },
      { d: 5.5, on: act('garman', 'talk'), cam: GARMAN,
        lines: [L(0, ['JACK GARMAN, 24 · SALA DE APOYO', 'JACK GARMAN, 24 · BACK ROOM'], ['Su hoja a mano: «1201 – 1202: sobrecarga del ejecutivo. Si no se repiten continuamente → GO».', 'His handwritten sheet: "1201 – 1202: executive overflow. If not continuous → GO".'])] },
    ],
  },

  // Cap. 4 · Escena 4.4 — «Es una 1202». opts.answer: 'go' (respondió a tiempo) | 'late' (tardó o no respondió) | 'abort'
  'mocr-1202': {
    id: 'mocr-1202', make: mocr('1969'),
    shots: (o) => [
      { d: 3.6, on: (w) => w.alarm(true), cam: [{ t: 0, pos: [0.2, 1.75, 1.7], look: [1.3, 1.0, 3.4], fov: 40 }, { t: 1, pos: [0.3, 1.7, 1.85], look: [1.3, 1.0, 3.4], fov: 36 }],
        lines: [L(0, ARM, ['Alarma de programa. Es una 1202.', 'Program alarm. It\'s a 1202.'], 'real', 'beep'), L(2, ALD, ['1202.', '1202.'], 'real', 'beep')] },
      { d: 3.4, cam: [{ t: 0, pos: [0, 3.3, -6.6], look: [0, 1.0, 3], fov: 44 }, { t: 1, pos: [0, 3.2, -6.2], look: [0, 1.0, 3], fov: 40 }],
        lines: [L(0, ARM, ['Danos una lectura sobre la alarma 1202.', 'Give us a reading on the 1202 program alarm.'], 'real', 'beep')] },
      { d: 3, on: act('kranz', 'point', true), cam: KRANZ_1969, lines: [L(0, K, ['Guiado, ¿cómo estamos?', 'Guidance, how are we?'], 'drama')] },
      { d: 4.2, on: act('garman', 'talk'), cam: GARMAN, lines: [L(0, ['GARMAN', 'GARMAN'], ['Mientras no se repita sin parar, estamos bien. Es GO.', 'As long as it doesn\'t recur continuously, we\'re fine. It\'s GO.'], 'drama')] },
      o.answer === 'go' || !o.answer
        ? { d: 3, cam: BALES, lines: [L(0, ['BALES', 'BALES'], ['¡Seguimos, Flight! Es GO.', 'We\'re go, Flight! It\'s GO.'], 'real')] }
        : { d: 3.4, on: act('kranz', 'talk'), cam: KRANZ_1969, lines: [L(0, K, ['Seguimos.', 'We\'re go.'], 'drama'), L(1.6, NA, ['Bales se quedó congelado. Kranz lo cubrió.', 'Bales froze. Kranz covered for him.'])] },
      { d: 4, events: [{ at: 1.2, do: (w) => w.alarm(false) }], cam: DUKE_CAM,
        lines: [L(0, DUKE, ['Entendido. Estamos GO con esa alarma.', 'Roger. We\'re go on that alarm.'], 'real', 'ok')] },
    ],
  },

  // Cap. 4 · Escena 4.5 — GO/NO GO para aterrizar
  'mocr-gonogo': {
    id: 'mocr-gonogo', make: mocr('1969'),
    shots: [
      { d: 4.2, on: act('kranz', 'talk'), cam: KRANZ_1969, lines: [L(0, K, ['Muy bien, todos los controladores: GO/NO GO para aterrizaje. ¿RETRO?', 'OK, all flight controllers: GO/NO GO for landing. RETRO?'], 'real')] },
      { d: 4, cam: [{ t: 0, pos: [-4.6, 1.75, 5.0], look: [-3, 1.0, 2.6], fov: 38 }, { t: 1, pos: [4.6, 1.75, 5.0], look: [3, 1.0, 2.6], fov: 38 }],
        lines: [L(0, ['CONTROLADORES', 'CONTROLLERS'], ['¡GO!', 'GO!'], 'real', 'tick'), L(1.2, ['CONTROLADORES', 'CONTROLLERS'], ['¡GO! … ¡GO!', 'GO! … GO!'], 'real', 'tick'), L(2.4, ['CONTROLADORES', 'CONTROLLERS'], ['¡GO! … ¡GO! … ¡GO!', 'GO! … GO! … GO!'], 'real', 'tick')] },
      { d: 3, cam: KRANZ_1969, lines: [L(0, K, ['CAPCOM, tenemos GO para aterrizar.', 'CAPCOM, we\'re GO for landing.'], 'real')] },
      { d: 4.4, cam: DUKE_CAM, lines: [L(0, DUKE, ['Eagle, Houston. Tienen GO para aterrizar.', 'Eagle, Houston. You\'re GO for landing.'], 'real'), L(2.4, ALD, ['Entendido. GO para aterrizar. 3.000 pies.', 'Roger. Understand. GO for landing. 3000 feet.'], 'real')] },
    ],
  },

  // Cap. 4 · final de 4.6 — «Tranquility Base here» y «a bunch of guys about to turn blue»
  'mocr-landed': {
    id: 'mocr-landed', make: mocr('1969'),
    shots: [
      { d: 3, cam: [{ t: 0, pos: [0, 3.3, -6.6], look: [0, 1.0, 3], fov: 42 }, { t: 1, pos: [0, 3.3, -6.3], look: [0, 1.0, 3], fov: 40 }],
        lines: [L(0, ['CONTROL DE MISIÓN · 20:17:40 UTC', 'MISSION CONTROL · 20:17:40 UTC'], ['Silencio absoluto en la sala.', 'Total silence in the room.'])] },
      { d: 4.4, cam: DUKE_CAM, lines: [L(0, ARM, ['Houston, aquí Base Tranquilidad. El Águila ha aterrizado.', 'Houston, Tranquility Base here. The Eagle has landed.'], 'real')] },
      { d: 6.6, cam: [{ t: 0, pos: [-1.6, 1.7, 1.25], look: [-3.07, 1.35, 0.1], fov: 34 }, { t: 1, pos: [-1.75, 1.7, 1.1], look: [-3.07, 1.35, 0.1], fov: 32 }],
        lines: [L(0, DUKE, ['Entendido, Tranquilidad. Los copiamos en tierra. Tienen a un montón de tipos a punto de ponerse azules.', 'Roger, Tranquility. We copy you on the ground. You got a bunch of guys about to turn blue.'], 'real'),
          L(3.8, DUKE, ['Volvemos a respirar. Muchas gracias.', 'We\'re breathing again. Thanks a lot.'], 'real')] },
      { d: 5, on: (w) => { w.cheer(); w.actors.kranz?.play('wave'); w.actors.garman?.play('wave'); }, cam: [{ t: 0, pos: [-5.5, 3.5, -6.5], look: [0, 1.2, 3], fov: 46 }, { t: 1, pos: [-1.5, 3.2, -6.9], look: [0, 1.2, 3], fov: 42 }],
        lines: [L(0, NA, ['La sala estalla. Quedaban unos 45 segundos de combustible utilizable.', 'The room erupts. About 45 seconds of usable fuel were left.'], null, 'jingle_win')] },
    ],
  },
};
