// Cinemáticas de la casa de los Armstrong (El Lago, Texas). Guion: escena 1.1 (despedida) y escena 4.7 (alunizaje por la squawk box).
// Coordenadas de cámara en metros de armstrong-house.glb (sala en x<0, cocina en x>0, TV en z≈+3, sofá en z≈−1,85).
// La decisión de la escena 1.1 (cómo habla Neil con sus hijos) no se juega aquí: se muestra la ruta histórica.
const house = (moment) => () => import('../../scenes/cine-house.js').then((m) => m.makeHouse({ moment }));
const L = (at, who, tx, tag, sfx) => ({ at, who, tx, tag, sfx });
const NA = ['', ''], JAN = ['JAN', 'JAN'], NEIL = ['NEIL', 'NEIL'], RICK = ['RICK', 'RICK'];
const act = (key, clip, once = false) => (w) => w.actors[key]?.play(clip, { once });

export const CINE_HOUSE = {
  // Cap. 1 · Escena 1.1 — «La última cena en la Tierra»
  'house-farewell': {
    id: 'house-farewell', make: house('farewell'),
    shots: [
      { d: 5.5, on: (w) => { w.actors.neil?.walkTo(2.75, 0.3).then(() => w.actors.neil?.face(2.1, -0.65)); },
        cam: [{ t: 0, pos: [-4.2, 1.85, 2.5], look: [1.6, 1.0, -0.2], fov: 46 }, { t: 1, pos: [-3.6, 1.75, 2.3], look: [2.0, 1.1, -0.2], fov: 42 }],
        lines: [L(0, ['CASA DE LOS ARMSTRONG · EL LAGO, TEXAS', 'THE ARMSTRONG HOUSE · EL LAGO, TEXAS'], ['Julio de 1969. Noche, días antes de la cuarentena.', 'July 1969. Night, days before quarantine.'], null, 'door')] },
      { d: 7, on: (w) => { w.actors.neil?.root.position.set(2.75, 0, 0.3); w.actors.neil?.face(2.1, -0.65); w.actors.neil?.play('idle'); w.actors.jan?.face(2.75, 0.3).play('talk'); },
        cam: [{ t: 0, pos: [0.2, 1.6, 1.35], look: [2.43, 1.35, -0.18], fov: 42 }, { t: 1, pos: [0.35, 1.6, 1.2], look: [2.43, 1.35, -0.18], fov: 40 }],
        lines: [L(0, JAN, ['Neil. Antes de irte tienes que hablar con los niños.', 'Neil. Before you go, you have to talk to the boys.'], 'drama'), L(3.4, JAN, ['Explícales que puede que no vuelvas.', 'Explain to them that you might not come back.'], 'drama')] },
      { d: 3.6, on: (w) => { w.actors.jan?.play('idle'); w.actors.neil?.play('talk'); },
        cam: [{ t: 0, pos: [1.0, 1.6, -0.55], look: [2.75, 1.4, 0.3], fov: 44 }, { t: 1, pos: [1.1, 1.6, -0.5], look: [2.75, 1.4, 0.3], fov: 42 }],
        lines: [L(0, NEIL, ['Jan, las probabilidades son buenas.', 'Jan, the odds are good.'], 'drama')] },
      { d: 3.6, on: (w) => { w.actors.neil?.play('idle'); w.actors.jan?.play('talk'); },
        cam: [{ t: 0, pos: [3.75, 1.6, -0.35], look: [2.1, 1.35, -0.65], fov: 42 }, { t: 1, pos: [3.65, 1.6, -0.35], look: [2.1, 1.35, -0.65], fov: 40 }],
        lines: [L(0, JAN, ['Entonces no te costará decírselo.', 'Then it won\'t be hard for you to tell them.'], 'drama')] },
      { d: 5.5, on: (w) => { w.actors.jan?.play('idle'); w.actors.neil?.walkTo(-1.1, 0.15, { speed: 1.0 }).then(() => w.actors.neil?.face(-2.75, -1.75)); },
        cam: [{ t: 0, pos: [-3.4, 1.7, 2.6], look: [1.5, 1.1, 0.2], fov: 44 }, { t: 1, pos: [-3.4, 1.6, 2.6], look: [-1.0, 1.0, 0.0], fov: 42 }],
        lines: [L(0, NA, ['Neil se queda en silencio. Luego camina hacia la sala.', 'Neil goes quiet. Then he walks to the living room.'])] },
      { d: 4, on: (w) => { const n = w.actors.neil; if (n) { n.root.position.set(-1.1, 0, 0.15); n.face(-2.75, -1.75); n.play('idle'); } },
        cam: [{ t: 0, pos: [-2.2, 1.15, 0.9], look: [-2.75, 0.95, -1.75], fov: 34 }, { t: 1, pos: [-2.3, 1.1, 0.75], look: [-2.75, 0.95, -1.75], fov: 31 }],
        lines: [L(0, RICK, ['¿Desde la Luna se ve nuestra casa?', 'Can you see our house from the Moon?'], 'drama')] },
      { d: 6.2, on: act('neil', 'talk'),
        cam: [{ t: 0, pos: [-2.35, 1.35, -0.95], look: [-1.1, 1.55, 0.15], fov: 32 }, { t: 1, pos: [-2.3, 1.35, -0.8], look: [-1.1, 1.55, 0.15], fov: 29 }],
        lines: [L(0, NEIL, ['No. Pero se ve la Tierra entera.', 'No. But you can see the whole Earth.'], 'drama'), L(2.8, NEIL, ['Y tú estás en ella. Con eso me alcanza.', 'And you\'re on it. That\'s enough for me.'], 'drama')] },
      { d: 4.5, on: (w) => { w.actors.neil?.play('idle'); w.separateStages(); },
        cam: [{ t: 0, pos: [-0.4, 1.1, 2.2], look: [-1.7, 0.55, 0.6], fov: 44 }, { t: 1, pos: [-0.5, 1.05, 2.05], look: [-1.7, 0.5, 0.6], fov: 42 }],
        lines: [L(0, ['EL COHETE DE MARK', 'MARK\'S ROCKET'], ['Un Saturn V de juguete. Al girarlo se separan las etapas.', 'A toy Saturn V. Twist it and the stages come apart.'])] },
    ],
  },

  // Cap. 4 · Escena 4.7 — mismo momento del alunizaje, en la casa
  'house-landed': {
    id: 'house-landed', make: house('landed'),
    shots: [
      { d: 4.5, cam: [{ t: 0, pos: [-2.3, 1.65, 2.35], look: [-1.8, 0.85, -1.6], fov: 46 }, { t: 1, pos: [-2.0, 1.55, 2.1], look: [-1.8, 0.85, -1.6], fov: 42 }],
        lines: [L(0, ['CASA DE LOS ARMSTRONG · EL LAGO', 'THE ARMSTRONG HOUSE · EL LAGO'], ['20 de julio de 1969 · en el mismo momento', 'July 20, 1969 · at the same moment'])] },
      { d: 5.5, cam: [{ t: 0, pos: [1.2, 1.4, 0.6], look: [-1.1, 0.85, -1.8], fov: 36 }, { t: 1, pos: [1.05, 1.38, 0.45], look: [-1.1, 0.85, -1.8], fov: 34 }],
        lines: [L(0, ['SQUAWK BOX · DUKE', 'SQUAWK BOX · DUKE'], ['…Tienen a un montón de tipos a punto de ponerse azules. Volvemos a respirar.', '…You got a bunch of guys about to turn blue. We\'re breathing again.'], 'real', 'beep')] },
      { d: 4, cam: [{ t: 0, pos: [-0.55, 1.25, -0.2], look: [-1.55, 0.95, -1.75], fov: 36 }, { t: 1, pos: [-0.65, 1.22, -0.3], look: [-1.55, 0.95, -1.75], fov: 34 }],
        lines: [L(0, NA, ['Jan cierra los ojos y suelta el aire.', 'Jan closes her eyes and breathes out.'])] },
      { d: 3.6, on: act('rick', 'talk'), cam: [{ t: 0, pos: [-1.0, 1.45, 1.6], look: [-2.45, 1.15, -0.55], fov: 44 }, { t: 1, pos: [-1.1, 1.45, 1.5], look: [-2.45, 1.15, -0.55], fov: 42 }],
        lines: [L(0, RICK, ['Mamá… lo hizo.', 'Mom… he did it.'], 'drama')] },
      { d: 4.6, on: act('rick', 'idle'), cam: [{ t: 0, pos: [-0.65, 1.22, -0.3], look: [-1.55, 0.95, -1.75], fov: 34 }, { t: 1, pos: [-0.7, 1.22, -0.35], look: [-1.55, 0.95, -1.75], fov: 33 }],
        lines: [L(0, JAN, ['Todavía no. Todavía tiene que volver.', 'Not yet. He still has to come home.'], 'drama')] },
    ],
  },
};
