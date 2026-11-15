// Cap. 7.6 · Cuarentena. Caminar hasta el vidrio y poner la mano (E).
// La cinemática sigue con lrl-room.glb. Aquí se carga la copia P3.
import { THREE, model } from '../../../core/engine.js';
import { chose } from '../../story/state.js';

const wall = (x, z, hx, hz) => ({ min: { x: x - hx, y: 0, z: z - hz }, max: { x: x + hx, y: 2.6, z: z + hz } });
const heard = chose('c1-kids') !== 'downplay';
let showHand = () => {};

export default {
  id: 'lrl',
  title: ['CAP. 7 · CUARENTENA', 'CH. 7 · QUARANTINE'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.6,
  camera: { mode: 'third', dist: 2.6, height: 1.5, pitch: 0.22 },
  player: { model: 'armstrong-civil', spawn: [2.4, 0, -0.8], yaw: 0.4, speed: 1.3 },
  npcs: [
    { id: 'jan', model: 'jan', spot: 'npc-spot-jan', yaw: -Math.PI / 2, clip: 'sit', once: true, name: ['JAN', 'JAN'], marker: '…', dialog: 'jan-1', r: 1.3 },
    { id: 'rick', model: 'rick', spot: 'npc-spot-rick', yaw: -Math.PI / 2, name: ['RICK', 'RICK'], marker: '!', dialog: 'rick-1', r: 1.3 },
    { id: 'mark', model: 'mark', spot: 'npc-spot-mark', yaw: -Math.PI / 2, name: ['MARK', 'MARK'], marker: '…', dialog: 'mark-1', r: 1.2 },
  ],
  objects: [
    {
      id: 'glass', at: [0.45, 1.2, 0], r: 1.15, objective: 'obj:glass',
      prompt: ['Poner la mano en el vidrio', 'Put a hand on the glass'],
      label: ['Poner la mano en el vidrio', 'Put a hand on the glass'],
      onOpen() { showHand(); },
      inspect: {
        title: ['La mano en el vidrio', 'A hand on the glass'],
        text: ['La palma contra el cristal. Del otro lado, la familia.', 'A palm against the glass. On the other side, the family.'],
        why: ['Veintiún días de aislamiento. Se ven y se oyen, y no se pueden tocar.', 'Twenty-one days in isolation. They can see and hear each other, and they cannot touch.'],
        fact: ['La tripulación del Apolo 11 salió de la cuarentena el 10 de agosto de 1969. No se encontró ningún organismo lunar.', 'The Apollo 11 crew left quarantine on 10 August 1969. No lunar organism was ever found.'],
        src: 'NASA · Lunar Receiving Laboratory',
        card: 'ventana-cuarentena',
      },
    },
  ],
  dialogs: {
    'jan-1': [
      { who: 'jan', whoName: ['JAN', 'JAN'], text: ['Estás aquí. Con eso me basta por ahora.', 'You are here. That is enough for now.'] },
    ],
    'rick-1': [
      heard
        ? { who: 'rick', whoName: ['RICK', 'RICK'], text: ['Te escuché aterrizar.', 'I heard you land.'] }
        : { who: 'rick', whoName: ['RICK', 'RICK'], text: ['Nos lo tendrías que haber dicho, papá.', 'You should have told us, Dad.'] },
    ],
    'mark-1': [
      { who: 'mark', whoName: ['MARK', 'MARK'], text: ['¿Trajiste una piedra?', 'Did you bring a rock?'] },
    ],
  },
  objectives: [
    { id: 'obj:glass', text: ['Pon la mano en el vidrio', 'Put your hand on the glass'], hidden: false },
  ],
  complete: (st) => st.done.has('obj:glass'),
  world: async () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd7d3c8);
    scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x8a8680, 0.85));
    const lamp = new THREE.PointLight(0xfff4e4, 3, 10, 1.4); lamp.position.set(1.2, 2.4, 0); scene.add(lamp);
    const room = await model('lrl-room-p3');
    scene.add(room);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.09), new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.7 }));
    hand.position.set(0.08, 1.28, 0.12); hand.visible = false; scene.add(hand);
    showHand = () => { hand.visible = true; };
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.08, 40);
    scene.updateMatrixWorld(true);
    return {
      scene, camera, floorY: () => 0, nodes: { hand },
      colliders: [wall(0, -3.2, 4, 0.15), wall(0, 3.2, 4, 0.15), wall(-3.4, 0, 0.15, 3.2), wall(4.2, 0, 0.15, 3.2), wall(0.02, 0, 0.04, 1.6)],
      update() {},
      resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
      dispose() {},
    };
  },
};
