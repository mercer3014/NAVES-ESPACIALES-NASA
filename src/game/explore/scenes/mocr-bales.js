// Cap. 4.2 · Steve Bales en el MOCR, antes del PDI. Mundo: mocr-room-p3.glb (npc-spot).
// La cinemática sigue usando mocr-room.glb, con el encuadre de siempre.
import { THREE, model } from '../../../core/engine.js';

const wall = (x, z, hx, hz, hy = 1.2, y0 = 0) => ({ min: { x: x - hx, y: y0, z: z - hz }, max: { x: x + hx, y: y0 + hy, z: z + hz } });
const floorY = (_x, z) => (z > 1 ? 0 : z > -1.2 ? 0.4 : z > -3.6 ? 0.8 : 1.2);

export default {
  id: 'mocr-bales',
  title: ['CAP. 4 · CONTROL DE MISIÓN', 'CH. 4 · MISSION CONTROL'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.6,
  camera: { mode: 'third', dist: 1.9, height: 1.4, pitch: 0.42 },
  player: { model: 'bales', spawn: [-1.15, 0, -1.05], yaw: 2.15, speed: 1.4 },
  npcs: [
    { id: 'kranz', model: 'kranz', spot: 'npc-spot-kranz', yaw: 0, clip: 'sit', once: true, name: ['GENE KRANZ', 'GENE KRANZ'], marker: '!', dialog: 'kranz-1', r: 1.85 },
    { id: 'duke', model: 'duke', spot: 'npc-spot-duke', yaw: 0, clip: 'sit', once: true, name: ['CHARLIE DUKE', 'CHARLIE DUKE'], marker: '!', dialog: 'duke-1', r: 1.45 },
    { id: 'garman', model: 'garman', spot: 'npc-spot-garman', yaw: 0, clip: 'sit', once: true, name: ['JACK GARMAN', 'JACK GARMAN'], marker: '!', dialog: 'garman-1', r: 1.05 },
  ],
  objects: [
    {
      id: 'vest', at: [0.9, 1.15, -2.15], r: 1.2, label: ['Mirar el chaleco de Kranz', 'Look at Kranz\'s vest'], objective: 'obj:vest',
      inspect: {
        title: ['El chaleco blanco', 'The white vest'],
        text: ['El chaleco nuevo de Gene Kranz. Se lo pone el día del alunizaje.', 'Gene Kranz\'s new vest. He puts it on on landing day.'],
        why: ['Cierra las puertas de la sala. Lo que se decide aquí no sale hasta que Eagle está en la Luna, o no lo está.', 'He locks the room doors. What is decided here does not leave until Eagle is on the Moon, or it is not.'],
        fact: ['El 20 de julio de 1969, hacia las 19:50 UTC, Kranz ordenó cerrar las puertas del MOCR antes del descenso propulsado.', 'On 20 July 1969, around 19:50 UTC, Kranz ordered the MOCR doors locked before powered descent.'],
        src: 'Gene Kranz, Failure Is Not an Option · Apollo Flight Journal',
        card: 'chaleco-kranz',
      },
    },
    {
      id: 'sheet', at: [-3.2, 0.95, 2.35], r: 1.05, requires: 'talk:garman', objective: 'obj:sheet', reveals: ['obj:sheet'],
      label: ['Leer la hoja de Garman', 'Read Garman\'s sheet'],
      locked: ['Primero habla con Jack Garman', 'Talk to Jack Garman first'],
      flag: 'garmanSheet',
      inspect: {
        title: ['La hoja de Jack Garman', 'Jack Garman\'s sheet'],
        text: ['Una hoja a mano: qué alarmas de la computadora obligan a abortar y cuáles no.', 'A handwritten sheet: which computer alarms mean an abort, and which do not.'],
        why: ['Si la guardas, cuando suene la 1202 sabrás por qué se puede seguir. Sin ella, la voz te sale temblorosa.', 'If you keep it, when the 1202 sounds you will know why it is all right to continue. Without it, your voice comes out shaky.'],
        fact: ['Garman, de 24 años, anotó: «1201 y 1202: sobrecarga del ejecutivo. Si no se repiten sin parar, es GO». Esa hoja salvó el alunizaje.', 'Garman, age 24, wrote: "1201 and 1202: executive overflow. If they do not repeat continuously, it is GO." That sheet saved the landing.'],
        src: 'Apollo Flight Journal · NASA',
        card: 'hoja-garman',
      },
    },
    {
      id: 'crt', at: [-2.45, 1.05, 2.75], r: 1.0, label: ['Inspeccionar el CRT de Guiado', 'Inspect the Guidance CRT'], objective: 'obj:crt',
      inspect: {
        title: ['La consola de Guiado', 'The Guidance console'],
        text: ['El CRT de Steve Bales, en la trinchera. Desde aquí se lee la alarma de programa.', 'Steve Bales\'s CRT, in the trench. The program alarm is read from here.'],
        why: ['Tendrás unos diez segundos. Flight te mirará y preguntará cómo estáis. La hoja, si la recogiste, es la respuesta.', 'You will have about ten seconds. Flight will look at you and ask how you are. The sheet, if you picked it up, is the answer.'],
        fact: ['Bales tenía 26 años y era el oficial de Guiado. La 1202 no apagaba el guiado: la computadora tiraba las tareas menos importantes y seguía.', 'Bales was 26 and the Guidance Officer. The 1202 did not kill guidance: the computer shed the less important tasks and kept going.'],
        src: 'Apollo Flight Journal · MIT Instrumentation Laboratory',
      },
    },
  ],
  dialogs: {
    'kranz-1': [
      { who: 'kranz', whoName: ['GENE KRANZ', 'GENE KRANZ'], text: ['Hoy vamos a hacer algo que nadie ha hecho. Cierren las puertas. Lo que pase en esta sala se queda aquí.', 'Today we do something no one has done. Lock the doors. What happens in this room stays here.'] },
      { who: 'kranz', whoName: ['GENE KRANZ', 'GENE KRANZ'], text: ['Pase lo que pase, salgo con ustedes. Confío en cada uno. También en ti, Guiado.', 'Whatever happens, I leave with all of you. I trust every one of you. You too, Guidance.'] },
    ],
    'duke-1': [
      { who: 'duke', whoName: ['CHARLIE DUKE', 'CHARLIE DUKE'], text: ['Yo soy la voz que Eagle oye. Si tú dices GO, yo digo GO. No hay una segunda versión.', 'I am the voice Eagle hears. If you say GO, I say GO. There is no second draft.'] },
    ],
    'garman-1': [
      { who: 'garman', whoName: ['JACK GARMAN', 'JACK GARMAN'], text: ['Anoté las alarmas a mano. 1201 y 1202: sobrecarga del ejecutivo. Si no se repiten sin parar, es GO. La hoja está en la consola. Léela.', 'I wrote the alarms down by hand. 1201 and 1202: executive overflow. If they do not repeat continuously, it is GO. The sheet is on the console. Read it.'] },
    ],
  },
  objectives: [
    { id: 'talk:kranz', text: ['Habla con Gene Kranz', 'Talk to Gene Kranz'], hidden: false },
    { id: 'obj:vest', text: ['Mira el chaleco blanco', 'Look at the white vest'], hidden: false },
    { id: 'talk:duke', text: ['Habla con Charlie Duke', 'Talk to Charlie Duke'], hidden: false },
    { id: 'talk:garman', text: ['Habla con Jack Garman', 'Talk to Jack Garman'], hidden: false },
    { id: 'obj:sheet', text: ['Lee la hoja de Garman', 'Read Garman\'s sheet'], hidden: true },
    { id: 'obj:crt', text: ['Inspecciona el CRT de Guiado', 'Inspect the Guidance CRT'], hidden: false },
  ],
  complete: (st) => ['talk:kranz', 'obj:vest', 'talk:duke', 'talk:garman', 'obj:sheet', 'obj:crt'].every((id) => st.done.has(id)),
  world: async () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f0e);
    scene.fog = new THREE.FogExp2(0x1a221e, 0.02);
    scene.add(new THREE.HemisphereLight(0xe7eee4, 0x222422, 0.7));
    for (const z of [-4, 0, 4]) { const l = new THREE.PointLight(0xf3f6ef, 2.4, 14, 1.5); l.position.set(0, 4.2, z); scene.add(l); }
    const glow = new THREE.PointLight(0x8dffb0, 1.6, 12, 1.6); glow.position.set(0, 2.6, 6); scene.add(glow);
    const room = await model('mocr-room-p3');
    scene.add(room);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.28), new THREE.MeshStandardMaterial({ color: 0xf4f0e4, roughness: 0.9 }));
    sheet.position.set(-3.35, 1.02, 2.5); sheet.rotation.y = -0.4; scene.add(sheet);
    const crt = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), new THREE.MeshBasicMaterial({ color: 0x14301c }));
    crt.position.set(-2.45, 1.12, 2.95); scene.add(crt);
    const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.08, 80);
    const colliders = [
      wall(0, 7.6, 8, 0.2, 3, 0), wall(0, -6.2, 8, 0.2, 3, 0), wall(-8.5, 0, 0.2, 7, 3, 0), wall(6.5, 0, 0.2, 7, 3, 0),
      wall(0, 3.15, 5.2, 0.35, 1.05, 0),
    ];
    scene.updateMatrixWorld(true);
    return {
      scene, camera, colliders, floorY, nodes: { sheet, crt },
      update() {},
      resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
      dispose() {},
    };
  },
};
