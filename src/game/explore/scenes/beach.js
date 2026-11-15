// Cap. 1.3 · Playa de Cabo Kennedy. Si Aldrin eligió hablar, Neil está aquí. La fogata tiene tres temas.
import { THREE } from '../../../core/engine.js';
import { makePad, BASE_Y } from '../../../scenes/pad.js';
import { BEACH } from '../../../scenes/ksc-crowd.js';
import { chose } from '../../story/state.js';

const GROUND = BASE_Y + BEACH.y;
const X = 60, Z = BEACH.z - 8;
const talk = chose('c1-firststep') === 'talk';
const box = (x, z, hx, hz) => ({ min: { x: x - hx, y: GROUND, z: z - hz }, max: { x: x + hx, y: GROUND + 3, z: z + hz } });

export default {
  id: 'beach',
  title: ['CAP. 1 · LA PLAYA DE CABO KENNEDY', 'CH. 1 · THE CAPE KENNEDY BEACH'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.7,
  camera: { mode: 'third', dist: 3.4, height: 1.55, pitch: 0.2 },
  player: { model: 'aldrin-civil', spawn: [X - 0.2, GROUND, Z - 3.6], yaw: 0, speed: 1.45 },
  npcs: [
    { id: 'collins', model: 'collins-civil', at: [X + 1.05, GROUND, Z + 0.15], yaw: Math.PI, clip: 'sit', once: true, name: ['MICHAEL COLLINS', 'MICHAEL COLLINS'], marker: '…', dialog: 'collins-1', r: 1.15, block: 0.4 },
    ...(talk ? [{ id: 'neil', model: 'armstrong-civil', at: [X - 1.7, GROUND, Z + 1.15], yaw: 0.8, name: ['NEIL ARMSTRONG', 'NEIL ARMSTRONG'], marker: '!', dialog: 'neil-1', r: 1.6, block: 0.4 }] : []),
  ],
  objects: [
    {
      id: 'fire', kind: 'talk', at: [X, GROUND + 0.3, Z - 0.15], r: 1.6, dialog: 'fire',
      prompt: ['Sentarte en la fogata', 'Sit by the fire'],
      label: ['Sentarte en la fogata', 'Sit by the fire'],
    },
  ],
  dialogs: {
    'collins-1': [
      { who: 'collins', whoName: ['COLLINS', 'COLLINS'], text: ['Si algo sale mal ahí abajo, el único que vuelve soy yo.', 'If something goes wrong down there, I’m the one who comes back.'], vo: 'voz_en_clonada/c1_13_collins_entrevistas_en' },
    ],
    'neil-1': [
      { who: 'neil', whoName: ['ALDRIN', 'ALDRIN'], text: ['Neil… no voy a fingir que no me importa. Me dolió.', 'Neil… I won’t pretend it doesn’t matter. It hurt.'] },
      { who: 'neil', whoName: ['NEIL', 'NEIL'], text: ['Lo sé. No lo elegí yo. Y no lo haría sin ti a medio metro detrás.', 'I know. I didn’t pick it. And I wouldn’t do it without you two feet behind me.'] },
      { who: 'neil', whoName: ['ALDRIN', 'ALDRIN'], text: ['Entonces bajemos juntos.', 'Then let’s go down together.'] },
      { who: 'neil', whoName: ['NEIL', 'NEIL'], text: ['Juntos.', 'Together.'] },
    ],
    fire: [
      { choice: [
        { id: 'mike', label: ['Collins: el único que vuelve', 'Collins: the only one who comes back'], next: 'fire-mike' },
        { id: 'covers', label: ['Los sobres firmados', 'The signed covers'], next: 'fire-covers', card: 'sobres-firmados' },
        { id: 'patch', label: ['El parche de la misión', 'The mission patch'], next: 'fire-patch', card: 'parche-mision' },
      ] },
    ],
    'fire-mike': [
      { who: 'fire', whoName: ['COLLINS', 'COLLINS'], text: ['Saben qué es lo bueno de mi trabajo, ¿no? Si algo sale mal ahí abajo, el único que vuelve soy yo.', 'You know the good part of my job? If something goes wrong down there, I’m the one who comes back.'], vo: 'voz_en_clonada/c1_13_collins_entrevistas_en' },
      { who: 'fire', whoName: ['ALDRIN', 'ALDRIN'], text: ['Qué consuelo, Mike.', 'What a comfort, Mike.'], vo: 'voz_en_clonada/c1_13_aldrin_que_consuelo_en' },
      { who: 'fire', whoName: ['COLLINS', 'COLLINS'], text: ['No es un chiste. Si no suben, no puedo bajar a buscarlos. Lo pienso cada noche.', 'It’s not a joke. If you don’t come up, I can’t go down to get you. I think about it every night.'], vo: 'voz_en_clonada/c1_13_collins_no_es_un_chiste_en' },
      { who: 'fire', whoName: ['NEIL', 'NEIL'], text: ['Vamos a subir, Mike.', 'We’ll come up, Mike.'], vo: 'voz_en_clonada/c1_13_armstrong_vamos_a_subir_en' },
      { choice: [
        { id: 'more', label: ['Otro tema', 'Another topic'], next: 'fire' },
        { id: 'stay', label: ['Quedarme con el fuego', 'Stay with the fire'] },
      ] },
    ],
    'fire-covers': [
      { who: 'fire', whoName: ['COLLINS', 'COLLINS'], text: ['Ningún seguro nos cubre a un precio razonable. Firmamos sobres. Si no volvemos, las familias pueden venderlos.', 'No insurance covers us at a fair price. We signed covers. If we don’t come back, the families can sell them.'] },
      { choice: [
        { id: 'more', label: ['Otro tema', 'Another topic'], next: 'fire' },
        { id: 'stay', label: ['Quedarme con el fuego', 'Stay with the fire'] },
      ] },
    ],
    'fire-patch': [
      { who: 'fire', whoName: ['COLLINS', 'COLLINS'], text: ['El águila la dibujé yo. La rama de olivo fue de Tom Wilson. Sin nuestros nombres: el parche es de todos.', 'I drew the eagle. The olive branch was Tom Wilson’s. No names: the patch belongs to everyone.'] },
      { choice: [
        { id: 'more', label: ['Otro tema', 'Another topic'], next: 'fire' },
        { id: 'stay', label: ['Quedarme con el fuego', 'Stay with the fire'] },
      ] },
    ],
  },
  objectives: [
    ...(talk ? [{ id: 'talk:neil', text: ['Habla con Neil', 'Talk to Neil'], hidden: false }] : []),
    { id: 'talk:fire', text: ['Siéntate en la fogata', 'Sit by the campfire'], hidden: false },
  ],
  complete: (st) => st.done.has('talk:fire') && (!talk || st.done.has('talk:neil')),
  world: async () => {
    const W = makePad({ lite: true }); W.setThrust(0);
    await Promise.race([Promise.all([W.ready, W.envReady]), new Promise((r) => setTimeout(r, 8000))]);
    W.camera.near = 0.08; W.camera.far = 60000; W.camera.updateProjectionMatrix();
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x6e5a42, roughness: 0.95 }));
    log.rotation.z = Math.PI / 2; log.position.set(X, GROUND + 0.2, Z); W.scene.add(log);
    const glow = new THREE.PointLight(0xff7a3a, 8, 9, 1.6); glow.position.set(X, GROUND + 0.6, Z - 0.2); W.scene.add(glow);
    return {
      scene: W.scene, camera: W.camera,
      colliders: [box(X, Z - 26, 22, 1.2), box(X, Z + 16, 22, 1.2), box(X - 18, Z, 1.2, 20), box(X + 18, Z, 1.2, 20)],
      floorY: () => GROUND,
      update(dt, t) { if (W.crowd) W.crowd.visible = false; W.update(dt, t); glow.intensity = 6 + Math.sin(t * 7) * 1.4; },
      resize: (w, h) => W.resize(w, h),
      dispose() { try { W.dispose(); } catch { /* la plataforma ya se fue */ } },
    };
  },
};
