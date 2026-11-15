// Sala de planificación, Houston, enero de 1969. Reutiliza mocr-room con luz de día.
// Cuatro expertos: cada charla explica el compromiso y abre su pestaña del panel.
import { THREE, model } from '../../../core/engine.js';

const TALKS = ['talk:elbaz', 'talk:engineer', 'talk:duke', 'talk:kranz'];
const SRC = 'NASA · Apollo 11 Press Kit / Mission Report MSC-00171';

function wall(x, z, hx, hz, y0 = 0) {
  return { min: { x: x - hx, y: y0, z: z - hz }, max: { x: x + hx, y: y0 + 2.4, z: z + hz } };
}

// Cuatro gradas: la trinchera (y = 0) llega hasta z ≈ 2,05; detrás sube 0,35 m por fila.
function floorAt(_x, z) {
  if (z > 2.05) return 0;
  if (z > -0.55) return 0.35;
  if (z > -3.15) return 0.7;
  return 1.05;
}

async function world() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd5e0ea);
  scene.fog = new THREE.Fog(0xd5e0ea, 16, 36);
  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.08, 80);
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0x8d7b68, 0.95));
  const sun = new THREE.DirectionalLight(0xfff3e0, 1.45); sun.position.set(6, 16, 8); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc5d6ea, 0.35); fill.position.set(-8, 6, -4); scene.add(fill);
  const room = await model('mocr-room').catch((e) => { console.warn('mocr-room.glb', e); return null; });
  if (room) {
    room.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    scene.add(room);
  } else {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 14), new THREE.MeshStandardMaterial({ color: 0x8a8e92 }));
    floor.position.y = -0.1; scene.add(floor);
  }
  const colliders = [
    wall(0, 7.55, 10.2, 0.2), wall(0, -7.45, 10.2, 0.2, 1.05),
    wall(-9.95, 0, 0.2, 7.6), wall(9.95, 0, 0.2, 7.6),
    wall(0, 3.61, 4.5, 0.52),
    wall(0, 1.01, 5.15, 0.52, 0.35),
    wall(0, -1.59, 5.15, 0.52, 0.7),
    wall(0, -4.19, 3.9, 0.52, 1.05),
  ];
  const onResize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', onResize);
  return {
    scene, camera, colliders, floorY: floorAt,
    update() {},
    resize: onResize,
    dispose() { removeEventListener('resize', onResize); },
  };
}

const scene = {
  id: 'design-room',
  title: ['SALA DE PLANIFICACIÓN · HOUSTON, ENERO DE 1969', 'PLANNING ROOM · HOUSTON, JANUARY 1969'],
  card: 'design',
  gravity: 9.81,
  jump: false,
  exitDelay: 0.6,
  camera: { mode: 'third', dist: 1.5, height: 1.55, pitch: 0.16 },
  player: { model: 'armstrong-civil', spawn: [-1.7, 0, 5.35], yaw: 0.55, speed: 1.7 },
  npcs: [
    { id: 'elbaz', model: 'civil-base', at: [-2.6, 0, 6.55], yaw: Math.PI, name: ['FAROUK EL-BAZ', 'FAROUK EL-BAZ'], marker: '!', dialog: 'elbaz', r: 1.6, opens: 'site', block: 0.36 },
    { id: 'engineer', model: 'extra-man-1', at: [-0.85, 0, 6.55], yaw: Math.PI, name: ['INGENIERO DEL LM', 'LM ENGINEER'], marker: '!', dialog: 'engineer', r: 1.6, opens: 'fuel', block: 0.36 },
    { id: 'duke', model: 'duke', at: [0.9, 0, 6.55], yaw: Math.PI, name: ['CHARLIE DUKE', 'CHARLIE DUKE'], marker: '!', dialog: 'duke', r: 1.6, opens: 'comms', block: 0.36 },
    { id: 'kranz', model: 'kranz', at: [2.65, 0, 6.55], yaw: Math.PI, name: ['GENE KRANZ', 'GENE KRANZ'], marker: '!', dialog: 'kranz', r: 1.6, opens: 'budget', block: 0.36 },
  ],
  objects: [
    {
      id: 'go', at: [0, 0, 4.7], r: 3.1, kind: 'exit',
      label: ['Seguir a la misión', 'On to the mission'],
      locked: ['Habla con los cuatro expertos', 'Talk to all four experts'],
      requires: TALKS,
    },
  ],
  dialogs: {
    elbaz: [
      { who: 'elbaz', whoName: ['FAROUK EL-BAZ', 'FAROUK EL-BAZ'], text: ['Geología. El Sol tiene que quedar bajo, entre unos 5 y 14 grados: la sombra es lo que te deja ver una roca antes de posar una pata encima.', 'Geology. The Sun has to stay low, about 5 to 14 degrees: the shadow is what lets you see a rock before you set a foot on it.'] },
      { who: 'elbaz', whoName: ['FAROUK EL-BAZ', 'FAROUK EL-BAZ'], text: ['El 16 de julio cae en el Mar de la Tranquilidad. Dos días más y el sitio es Sinus Medii. Elige.', 'July 16 falls on the Sea of Tranquility. Two days later the site is Sinus Medii. Choose.'] },
    ],
    engineer: [
      { who: 'engineer', whoName: ['INGENIERO DEL LM', 'LM ENGINEER'], text: ['Grumman. El Eagle solo admite 100 kg de más. Cada 5 % de combustible son unos 3 kg que ya no puedes gastar en ciencia.', 'Grumman. Eagle only takes 100 extra kilograms. Every 5% of fuel is about 3 kg you can no longer spend on science.'] },
      { who: 'engineer', whoName: ['INGENIERO DEL LM', 'LM ENGINEER'], text: ['Las baterías justas aligeran la nave. En el disyuntor, la energía se acaba antes.', 'Tight batteries lighten the ship. At the breaker, the power runs out sooner.'] },
    ],
    duke: [
      { who: 'duke', whoName: ['CHARLIE DUKE', 'CHARLIE DUKE'], text: ['Comunicaciones. Solo Goldstone y hay huecos: la televisión de la caminata llega con nieve.', 'Communications. Goldstone alone and there are gaps: the moonwalk television arrives full of snow.'] },
      { who: 'duke', whoName: ['CHARLIE DUKE', 'CHARLIE DUKE'], text: ['Honeysuckle Creek cubre Australia. Parkes, el radiotelescopio de 64 m, sostuvo la imagen que vieron unos 650 millones de personas.', 'Honeysuckle Creek covers Australia. Parkes, the 64 m radio telescope, held the picture about 650 million people watched.'] },
    ],
    kranz: [
      { who: 'kranz', whoName: ['GENE KRANZ', 'GENE KRANZ'], text: ['El presupuesto de esta mesa son 100 créditos. Antenas, baterías y combustible extra se pagan de ahí. No es infinito.', 'This table’s budget is 100 credits. Dishes, batteries and extra fuel are paid from it. It is not infinite.'] },
      { who: 'kranz', whoName: ['GENE KRANZ', 'GENE KRANZ'], text: ['No hay una respuesta perfecta. Lo que hizo la NASA en 1969 es una referencia, no la única forma de llegar.', 'There is no perfect answer. What NASA did in 1969 is a reference, not the only way to get there.'] },
    ],
  },
  objectives: [
    { id: 'talk:elbaz', text: ['Habla con Farouk El-Baz', 'Talk to Farouk El-Baz'], hidden: false },
    { id: 'talk:engineer', text: ['Habla con el ingeniero del LM', 'Talk to the LM engineer'], hidden: false },
    { id: 'talk:duke', text: ['Habla con Charlie Duke', 'Talk to Charlie Duke'], hidden: false },
    { id: 'talk:kranz', text: ['Habla con Gene Kranz', 'Talk to Gene Kranz'], hidden: false },
    { id: 'enter:mission', text: ['Sigue a la misión', 'Go on to the mission'], hidden: true },
  ],
  async onTalkEnd(npc) {
    const { designRoom } = await import('../../design/design-screen.js');
    await designRoom({ mode: 'section', focus: npc.opens, overlay: true });
  },
  onUse(item) {
    if (item.id === 'go') return { done: 'enter:mission', reveal: 'enter:mission', bark: ['Plan en la mesa. Ahora hay que volarlo.', 'The plan is on the table. Now it has to be flown.'] };
    return null;
  },
  step(s) {
    if (TALKS.every((id) => s.done.has(id)) && !s.flags.exitOpen) {
      s.flags.exitOpen = true;
      return { reveal: 'enter:mission', bark: ['Ya puedes seguir a la misión.', 'You can go on to the mission.'] };
    }
    return null;
  },
  complete: (st) => st.done.has('enter:mission'),
  world,
};

export default scene;
export { SRC };
