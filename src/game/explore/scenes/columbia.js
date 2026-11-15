// Cap. 3.2 · Noche en Columbia. Gravedad cero: Q baja, E sube si no hay nada que usar.
// La tripulación flota tumbada en el eje, donde el cono todavía cabe (y ≈ 1,4, radio < 0,5 m).
import { makeColumbia } from '../../story/night.js';
import { run, chose } from '../../story/state.js';
import { playSextant } from '../sextant.js';

const trust = run.trust > 60;
const kids = chose('c1-kids');
let sext = null;

const bay = (x, z) => [x, 1.42, z];

export default {
  id: 'columbia',
  title: ['CAP. 3 · NOCHE EN COLUMBIA', 'CH. 3 · NIGHT ABOARD COLUMBIA'],
  gravity: 0,
  float: true,
  jump: false,
  exitDelay: 0.5,
  camera: { mode: 'first', height: 0.02, pitch: 0.05 },
  player: { spawn: [0, 1.48, 0.55], yaw: 0, speed: 0.85 },
  npcs: [
    { id: 'aldrin', model: 'aldrin-vuelo', at: bay(-0.22, -0.85), yaw: 0.4, tilt: -Math.PI / 2, name: ['ALDRIN', 'ALDRIN'], marker: '!', dialog: 'buzz', r: 0.75, card: 'marion-moon' },
    { id: 'collins', model: 'collins-vuelo', at: bay(0.24, -1.05), yaw: -0.3, tilt: Math.PI / 2, name: ['COLLINS', 'COLLINS'], marker: '!', dialog: 'mike', r: 0.75 },
    { id: 'neil', model: 'armstrong-vuelo', at: bay(0, -0.55), yaw: 2.4, tilt: 0.5, name: ['NEIL', 'NEIL'], marker: '!', dialog: 'neil', r: 0.7, card: trust ? 'karen' : undefined },
  ],
  objects: [
    { id: 'sextant', kind: 'use', at: [0.28, 1.45, 0.05], r: 0.7, prompt: ['Usar el sextante', 'Use the sextant'], label: ['Usar el sextante', 'Use the sextant'], objective: 'obj:sextant' },
    {
      id: 'dsky', at: [-0.05, 1.4, 0.22], r: 0.6, prompt: ['Mirar el DSKY', 'Look at the DSKY'], objective: 'obj:dsky',
      inspect: {
        title: ['DSKY', 'DSKY'],
        text: ['PROG 00. La computadora espera el siguiente verbo.', 'PROG 00. The computer is waiting for the next verb.'],
        why: ['Desde aquí se alineó la plataforma y se vigilaron los encendidos. El sextante le da las estrellas.', 'The platform was aligned from here, and the burns were watched from here. The sextant feeds it the stars.'],
        fact: ['El AGC tenía unos 74 KB de memoria. El DSKY era su teclado y su pantalla: verbos y nombres de dos cifras.', 'The AGC had about 74 KB of memory. The DSKY was its keyboard and display: two-digit verbs and nouns.'],
        src: 'MIT Instrumentation Laboratory · Apollo Operations Handbook',
        card: 'agc-dsky',
      },
    },
    {
      id: 'food', at: [-0.22, 1.38, 0.35], r: 0.55, prompt: ['Mirar la comida', 'Look at the food'], objective: 'obj:food',
      inspect: {
        title: ['Bolsa de comida', 'Food bag'],
        text: ['Cóctel de camarones, deshidratado. Se rehidrata con la pistola de agua.', 'Shrimp cocktail, dehydrated. It is rehydrated with the water gun.'],
        why: ['Es lo único a bordo que sabe a comida de verdad, dice Collins.', 'It is the only thing on board that tastes like real food, Collins says.'],
        fact: ['La mayor parte de la comida del Apolo iba deshidratada. Una miga suelta podía meterse en un filtro.', 'Most Apollo food was dehydrated. A loose crumb could end up in a filter.'],
        src: 'Smithsonian National Air and Space Museum',
        card: 'comida-espacial',
      },
    },
  ],
  dialogs: {
    buzz: [
      { who: 'aldrin', whoName: ['ALDRIN', 'ALDRIN'], text: ['¿Sabes cuál era el apellido de soltera de mi madre? Moon. Marion Moon.', 'You know what my mother’s maiden name was? Moon. Marion Moon.'], vo: 'voz_en_clonada/c3_32_aldrin_marion_moon_en' },
    ],
    mike: [
      { who: 'collins', whoName: ['COLLINS', 'COLLINS'], text: ['Entonces esto es una visita familiar.', 'So this is a family visit.'], vo: 'voz_en_clonada/c3_32_collins_visita_familiar_en' },
    ],
    neil: trust ? [
      { who: 'neil', whoName: ['NEIL', 'NEIL'], text: kids === 'rocket' ? ['Le dejé a Rick el cohete de Mark.', 'I left Rick with Mark’s rocket.'] : ['Karen habría cumplido diez este año.', 'Karen would have turned ten this year.'] },
      { choice: [
        { id: 'hand', label: ['Ponerle una mano en el hombro', 'A hand on his shoulder'], trust: 15, next: 'neil-hand' },
        { id: 'mission', label: ['Volver a la misión', 'Steer back to the mission'], next: 'neil-mission' },
        { id: 'ask', label: ['Preguntar más', 'Ask more'], trust: -5, next: 'neil-ask' },
      ], decision: 'c3-night' },
    ] : [
      { who: 'neil', whoName: ['NEIL', 'NEIL'], text: ['Duerman. Mañana es largo.', 'Get some sleep. Tomorrow’s a long day.'], vo: 'voz_en_clonada/c3_32_armstrong_duerman_en' },
    ],
    'neil-hand': [{ who: 'neil', whoName: ['ALDRIN', 'ALDRIN'], text: ['(No dice nada. Le pone una mano en el hombro. Neil asiente.)', '(He says nothing. A hand on the shoulder. Neil nods.)'] }],
    'neil-mission': [{ who: 'neil', whoName: ['ALDRIN', 'ALDRIN'], text: ['Mañana a esta hora estaremos en órbita lunar.', 'This time tomorrow we’ll be in lunar orbit.'] }],
    'neil-ask': [{ who: 'neil', whoName: ['NEIL', 'NEIL'], text: ['(Se vuelve hacia la ventana y no contesta.)', '(He turns to the window and does not answer.)'] }],
  },
  objectives: [
    { id: 'talk:aldrin', text: ['Habla con Aldrin', 'Talk to Aldrin'], hidden: false },
    { id: 'talk:collins', text: ['Habla con Collins', 'Talk to Collins'], hidden: false },
    { id: 'talk:neil', text: ['Habla con Neil', 'Talk to Neil'], hidden: false },
    { id: 'obj:sextant', text: ['Alinea el sextante', 'Align the sextant'], hidden: false },
    { id: 'obj:dsky', text: ['Mira el DSKY', 'Look at the DSKY'], hidden: false },
    { id: 'obj:food', text: ['Mira la comida', 'Look at the food'], hidden: false },
  ],
  complete: (st) => ['talk:aldrin', 'talk:collins', 'talk:neil', 'obj:sextant', 'obj:dsky', 'obj:food'].every((id) => st.done.has(id)),
  onUse(item) {
    if (item.id !== 'sextant' || sext) return null;
    sext = playSextant().then((r) => { sext = r; });
    return null;
  },
  step({ body }) {
    body.y = Math.max(1.2, Math.min(1.7, body.y));
    const rad = Math.hypot(body.x, body.z);
    if (rad > 0.72) { const k = 0.72 / rad; body.x *= k; body.z *= k; }
    if (sext && typeof sext.wrong === 'number') {
      const wrong = sext.wrong; sext = null;
      return { done: 'obj:sextant', card: wrong === 0 ? 'sextante' : undefined, bark: wrong ? ['Houston pide otra pasada.', 'Houston wants another pass.'] : ['Plataforma alineada.', 'Platform aligned.'] };
    }
    return null;
  },
  world: async () => {
    const W = await makeColumbia({ light: 'night', spin: 0.04 });
    W.pilot = true;
    return {
      scene: W.scene, camera: W.camera, colliders: [], floorY: () => 1.2,
      update: (dt, t) => W.update(dt, t),
      resize: () => W.resize(),
      dispose: () => W.dispose(),
    };
  },
};
