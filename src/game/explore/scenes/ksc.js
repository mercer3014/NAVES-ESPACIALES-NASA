// Cap. 1.2 · Aldrin con Deke en la explanada del KSC. La decisión c1-firststep va dentro del diálogo.
// Mundo: la plataforma (pad.js), la misma de la escena anterior, sin encender el cohete.
import { makePad, BASE_Y } from '../../../scenes/pad.js';
import { BEACH } from '../../../scenes/ksc-crowd.js';

const GROUND = BASE_Y + BEACH.y;
const X = -40, Z = BEACH.z - 8;
const box = (x, z, hx, hz) => ({ min: { x: x - hx, y: GROUND, z: z - hz }, max: { x: x + hx, y: GROUND + 3, z: z + hz } });

export default {
  id: 'ksc',
  title: ['CAP. 1 · CENTRO ESPACIAL KENNEDY', 'CH. 1 · KENNEDY SPACE CENTER'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.6,
  camera: { mode: 'third', dist: 3.3, height: 1.6, pitch: 0.22 },
  player: { model: 'aldrin-civil', spawn: [X + 2.4, GROUND, Z - 2.6], yaw: 0, speed: 1.45 },
  npcs: [
    {
      id: 'deke', model: 'civil-base', at: [X - 0.7, GROUND, Z], yaw: 0.4,
      name: ['DEKE SLAYTON', 'DEKE SLAYTON'], marker: '!', dialog: 'deke-1', r: 1.7, block: 0.4, card: 'deke-slayton',
    },
  ],
  dialogs: {
    'deke-1': [
      { who: 'deke', whoName: ['DEKE SLAYTON', 'DEKE SLAYTON'], text: ['Buzz, ya está decidido. Neil sale primero. Es el comandante y la escotilla abre hacia su lado.', 'Buzz, it’s decided. Neil goes out first. He’s the commander, and the hatch opens on his side.'], vo: 'voz_en_clonada/c1_12_slayton_neil_sale_primero_en' },
      { who: 'deke', whoName: ['ALDRIN', 'ALDRIN'], text: ['En Gemini salía el piloto, no el comandante. Solo digo que hay precedente.', 'On Gemini the pilot went out, not the commander. I’m just saying there’s precedent.'], vo: 'voz_en_clonada/c1_12_aldrin_precedente_gemini_en' },
      { who: 'deke', whoName: ['DEKE SLAYTON', 'DEKE SLAYTON'], text: ['Y yo solo digo que está decidido.', 'And I’m just saying it’s decided.'], vo: 'voz_en_clonada/c1_12_slayton_esta_decidido_en' },
      { choice: [
        { id: 'accept', historic: true, label: ['Aceptarlo en silencio', 'Accept it quietly'], trust: 5, next: 'ksc-accept', card: 'primer-paso-quien' },
        { id: 'talk', label: ['Hablar con Neil, de frente', 'Talk to Neil, face to face'], trust: 10, next: 'ksc-talk', card: 'fogata-playa' },
        { id: 'complain', label: ['Quejarse con otros astronautas', 'Complain to other astronauts'], trust: -10, next: 'ksc-rumor', flag: 'rumor' },
      ], decision: 'c1-firststep' },
    ],
    'ksc-accept': [
      { who: 'deke', whoName: ['ALDRIN', 'ALDRIN'], text: ['(Asiente. Neil se lo agradecerá más tarde, en la misma explanada.)', '(He nods. Neil will thank him later, on the same lawn.)'] },
    ],
    'ksc-talk': [
      { who: 'deke', whoName: ['ALDRIN', 'ALDRIN'], text: ['No voy a fingir que no me importa. Se lo diré en la playa, de frente.', 'I won’t pretend it doesn’t matter. I’ll tell him on the beach, face to face.'] },
    ],
    'ksc-rumor': [
      { who: 'deke', whoName: ['ALDRIN', 'ALDRIN'], text: ['Solo digo que esto lo decidieron por la foto. El rumor llegará a Neil antes del lanzamiento.', 'All I’m saying is this was about the photo. The rumor will reach Neil before launch.'] },
    ],
  },
  objectives: [
    { id: 'talk:deke', text: ['Habla con Deke Slayton', 'Talk to Deke Slayton'], hidden: false },
  ],
  complete: (st) => st.done.has('talk:deke'),
  world: async () => {
    const W = makePad({ lite: true }); W.setThrust(0);
    await Promise.race([Promise.all([W.ready, W.envReady]), new Promise((r) => setTimeout(r, 8000))]);
    W.camera.near = 0.08; W.camera.far = 60000; W.camera.updateProjectionMatrix();
    return {
      scene: W.scene, camera: W.camera,
      colliders: [box(X, Z - 30, 28, 1.2), box(X, Z + 18, 28, 1.2), box(X - 24, Z, 1.2, 24), box(X + 24, Z, 1.2, 24)],
      floorY: () => GROUND,
      update(dt, t) { if (W.crowd) W.crowd.visible = false; W.update(dt, t); },
      resize: (w, h) => W.resize(w, h),
      dispose() { try { W.dispose(); } catch { /* la plataforma ya se fue */ } },
    };
  },
};
