// Prólogo 0.2 · Hotel Georgetown Inn, 27 de enero de 1967. Primera persona, sin salto.
// El cuarto de la cinemática sigue siendo hotel-room-1967.glb. Aquí se carga la copia P3.
import { THREE, model } from '../../../core/engine.js';
import { Howl } from 'howler';
import { playA11 } from '../../../audio/a11-voice.js';
import { ambience } from '../../../audio/a11-score.js';

const wall = (x, z, hx, hz) => ({ min: { x: x - hx, y: 0, z: z - hz }, max: { x: x + hx, y: 2.6, z: z + hz } });
let stopRing = () => {};

export default {
  id: 'hotel',
  title: ['PRÓLOGO · GEORGETOWN INN', 'PROLOGUE · GEORGETOWN INN'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.5,
  camera: { mode: 'first', height: 1.62, pitch: 0.08 },
  player: { spawn: [0.35, 0, 0.15], yaw: Math.PI, speed: 1.25 },
  objects: [
    {
      id: 'phone', kind: 'talk', at: [-1.9, 0.7, 0.9], r: 0.75, dialog: 'phone',
      prompt: ['Contestar el teléfono', 'Answer the phone'],
      label: ['Contestar el teléfono', 'Answer the phone'],
    },
    {
      id: 'wallet', at: [-1.15, 0.7, 0.2], r: 0.55, objective: 'obj:wallet',
      label: ['Abrir la cartera', 'Open the wallet'],
      inspect: { title: ['Karen', 'Karen'], quiet: true, card: 'foto-karen' },
    },
    {
      id: 'book', at: [-1.75, 0.7, -0.75], r: 0.75, objective: 'obj:book',
      label: ['Leer la libreta', 'Read the address book'],
      onOpen: () => { try { playA11('voz_en_clonada/p_obj_armstrong_recuerdo_ed_white_en', { vol: 0.9 }); } catch { /* sin audio se lee igual */ } },
      inspect: {
        title: ['Libreta de direcciones', 'Address book'],
        text: ['«Ed White — El Lago, Texas».', '"Ed White — El Lago, Texas".'],
        why: ['Cuando se quemó la casa en el 64, Ed saltó la cerca antes que nadie. Ayudó a sacar a la familia.', 'When the house burned in ’64, Ed was first over the fence. He helped get the family out.'],
        fact: ['Ed White, vecino en El Lago, moriría el 27 de enero de 1967 en la prueba del Apolo 1, la misma noche de esta llamada.', 'Ed White, a neighbor at El Lago, would die on 27 January 1967 in the Apollo 1 test, the same night as this call.'],
        src: 'James R. Hansen, First Man · NASA, Apollo 204 Review Board',
        card: 'libreta-ed-white',
      },
    },
    {
      id: 'window', at: [0.15, 1.2, -2.05], r: 1.35, objective: 'obj:window',
      label: ['Mirar por la ventana', 'Look out the window'],
      inspect: {
        title: ['La ventana', 'The window'],
        text: ['Washington de noche. Solo se oye el tráfico.', 'Washington at night. Only the traffic.'],
        why: ['Neil no se mueve. La llamada ya dijo lo que había que decir.', 'Neil does not move. The call already said what had to be said.'],
        fact: ['El incendio del Apolo 1 fue el 27 de enero de 1967, durante una prueba en la plataforma 34 de Cabo Kennedy. La tripulación no pudo abrir la escotilla.', 'The Apollo 1 fire was on 27 January 1967, during a test on Cape Kennedy’s Pad 34. The crew could not open the hatch.'],
        src: 'NASA, Apollo 204 Review Board',
      },
    },
  ],
  dialogs: {
    phone: [
      { who: 'phone', whoName: ['VOZ AL TELÉFONO', 'VOICE ON THE PHONE'], text: ['Hubo un incendio en la cabina. En la prueba.', 'There was a fire in the cabin. During the test.'], vo: 'voz_en_clonada/p_02_voz_telefono_incendio_en' },
      { who: 'phone', whoName: ['VOZ AL TELÉFONO', 'VOICE ON THE PHONE'], text: ['Gus, Ed y Roger… no salieron.', 'Gus, Ed and Roger… didn’t make it out.'] },
    ],
  },
  objectives: [
    { id: 'talk:phone', text: ['Contesta el teléfono', 'Answer the phone'], hidden: false },
    { id: 'obj:wallet', text: ['Mira la cartera', 'Look at the wallet'], hidden: false },
    { id: 'obj:book', text: ['Lee la libreta', 'Read the address book'], hidden: false },
    { id: 'obj:window', text: ['Mira por la ventana', 'Look out the window'], hidden: false },
  ],
  complete: (st) => ['talk:phone', 'obj:wallet', 'obj:book', 'obj:window'].every((id) => st.done.has(id)),
  world: async () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080c);
    scene.add(new THREE.HemisphereLight(0xc8b8a0, 0x1a1410, 0.45));
    const lamp = new THREE.PointLight(0xffd29a, 6, 7, 1.6); lamp.position.set(-1.7, 1.15, -0.4); scene.add(lamp);
    const fill = new THREE.PointLight(0x8f9cc0, 1.4, 8, 1.6); fill.position.set(0.4, 1.6, -2.2); scene.add(fill);
    const room = await model('hotel-room-1967-p3');
    scene.add(room);
    const props = await model('earth-props').catch(() => null);
    let book = null, wallet = null;
    if (props) {
      const note = props.getObjectByName('notebook');
      const frame = props.getObjectByName('framed-photo');
      if (note) { book = note.clone(true); book.position.set(-1.75, 0.62, -0.75); book.rotation.y = 0.5; book.scale.setScalar(1.2); scene.add(book); }
      if (frame) { wallet = frame.clone(true); wallet.position.set(-1.15, 0.64, 0.2); wallet.rotation.y = -0.4; wallet.scale.setScalar(0.35); scene.add(wallet); }
    }
    ambience('p_02_amb_trafico_noche_ventana', 0.28);
    const ring = new Howl({ src: ['/audio/a11/sfx/p_02_telefono_hotel_timbre.mp3'], loop: true, volume: 0.35 });
    ring.play();
    stopRing = () => { try { ring.stop(); } catch { /* sin audio */ } };
    const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 40);
    const colliders = [
      wall(0, -2.65, 2.4, 0.12), wall(0, 2.65, 2.4, 0.12), wall(-2.25, 0, 0.12, 2.7), wall(2.25, 0, 0.12, 2.7),
      wall(-1.95, -0.15, 0.28, 0.85),
    ];
    scene.updateMatrixWorld(true);
    return {
      scene, camera, colliders, floorY: () => 0, nodes: { book, wallet },
      update() {},
      resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
      dispose() { stopRing(); try { ring.unload(); } catch { /* ya se fue */ } },
    };
  },
  step({ done }) { if (done.has('talk:phone')) stopRing(); },
};
