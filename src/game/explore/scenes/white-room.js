// Fase 1 · Sala Blanca y brazo 9, con cajas. Si llega public/models/white-room.glb,
// se puede sustituir buildBoxes() por el modelo y leer los nodos npc-spot-* / obj-* / spawn-player.
// Medidas: pasarela estrecha, sala ~3 × 4 m, escotilla al fondo, cohete con vapor debajo.
import { THREE } from '../../../core/engine.js';
import { nextHose } from '../actions.js';

const NEED = ['obj:arm', 'obj:valve', 'obj:vapor', 'obj:hoses', 'obj:check', 'talk:wendt'];
const SRC = 'Apollo Flight Journal, día del lanzamiento · NASA';

function box(w, h, d, color, x, y, z, metal = 0.05) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: metal }));
  m.position.set(x, y, z); return m;
}
function solid(x, z, hx, hz, hy = 3) {
  return { min: { x: x - hx, y: 0, z: z - hz }, max: { x: x + hx, y: hy, z: z + hz } };
}

export function buildBoxes() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10141c);
  scene.fog = new THREE.Fog(0x10141c, 14, 42);
  scene.add(new THREE.HemisphereLight(0xc5d0dc, 0x1a140e, 0.85));
  const sun = new THREE.DirectionalLight(0xfff0dc, 0.9); sun.position.set(-6, 18, 8); scene.add(sun);
  const roomL = new THREE.PointLight(0xfff6ea, 6, 9); roomL.position.set(0, 2.4, -2); scene.add(roomL);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 12.2), new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.9 }));
  deck.position.set(0, -0.06, 6); scene.add(deck);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(3, 0.12, 4.2), new THREE.MeshStandardMaterial({ color: 0xe7e2d6, roughness: 0.75 }));
  floor.position.set(0, -0.06, -2); scene.add(floor);
  scene.add(box(3.1, 2.8, 0.12, 0xf4f1ea, 0, 1.4, -4.06));
  scene.add(box(0.12, 2.8, 4.2, 0xf7f4ee, -1.5, 1.4, -2));
  scene.add(box(0.12, 2.8, 4.2, 0xf7f4ee, 1.5, 1.4, -2));
  scene.add(box(3.1, 0.12, 4.2, 0xf7f4ee, 0, 2.8, -2));
  scene.add(box(0.9, 2.6, 0.1, 0xf4f1ea, -1.15, 1.3, 0.02));
  scene.add(box(0.9, 2.6, 0.1, 0xf4f1ea, 1.15, 1.3, 0.02));
  scene.add(box(1.6, 2.4, 0.5, 0x2a2e34, 0, 1.2, 13.05));
  for (const side of [-0.88, 0.88]) {
    scene.add(box(0.06, 1.05, 11.2, 0xc5c8cc, side, 0.55, 5.6, 0.4));
  }
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xbfc3c8, metalness: 0.55, roughness: 0.35 }));
  hatch.rotation.x = Math.PI / 2; hatch.position.set(0.15, 1.15, -3.92); scene.add(hatch);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), new THREE.MeshBasicMaterial({ color: 0x07080c }));
  dark.position.set(0.15, 1.15, -3.84); scene.add(dark);

  const valve = new THREE.Group(); valve.name = 'valve'; valve.position.set(-0.62, 0, 4.35);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0xc5c1b6, metalness: 0.7, roughness: 0.3 }));
  pipe.position.y = 0.55; valve.add(pipe);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 14), new THREE.MeshStandardMaterial({ color: 0xd7d2c6, metalness: 0.6, roughness: 0.35, emissive: 0x3a1208, emissiveIntensity: 0.25 }));
  wheel.rotation.x = Math.PI / 2; wheel.position.y = 0.98; valve.add(wheel);
  scene.add(valve);
  const hiss = new THREE.Group(); valve.add(hiss);
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.45 }));
    p.userData.s = i / 7; hiss.add(p);
  }

  const stand = new THREE.Group(); stand.position.set(-1.05, 0, -2.05); scene.add(stand);
  stand.add(box(0.7, 0.75, 0.4, 0x8d9094, 0, 0.38, 0, 0.2));
  const conn = (color, emissive, x) => {
    const g = new THREE.Group(); g.position.set(x, 0.85, 0);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.45, metalness: 0.4, roughness: 0.4 }));
    c.rotation.z = Math.PI / 2; g.add(c); stand.add(g); return g;
  };
  const blue = conn(0x2f6fe0, 0x123060, -0.16);
  const red = conn(0xd64532, 0x5a140e, 0.16);

  const rocket = new THREE.Group(); rocket.position.set(8.2, -38, 3.5);
  let y = 0;
  for (const [r, h, col] of [[1.7, 16, 0xf4f1ea], [1.55, 12, 0xf7f4ee], [1.2, 9, 0xe6e1d6], [0.55, 4.5, 0xf2efe6]]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, h, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.62 }));
    m.position.y = y + h / 2; y += h; rocket.add(m);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.74, r * 0.74, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x1a1c20 }));
    band.position.y = y; rocket.add(band);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0xf7f4ee }));
  nose.position.y = y + 1.2; rocket.add(nose); scene.add(rocket);
  const steam = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.35 }));
    p.userData.s = Math.random(); steam.add(p);
  }
  steam.position.set(8.2, -36, 3.5); scene.add(steam);

  const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.08, 120);
  const colliders = [
    solid(0, 13.15, 1.2, 0.35, 2.6),
    solid(-0.88, 5.6, 0.08, 5.6, 1.1), solid(0.88, 5.6, 0.08, 5.6, 1.1),
    solid(-1.5, -2, 0.1, 2.1, 2.8), solid(1.5, -2, 0.1, 2.1, 2.8), solid(0, -4.06, 1.55, 0.1, 2.8),
    solid(-1.15, 0.02, 0.45, 0.08, 2.6), solid(1.15, 0.02, 0.45, 0.08, 2.6),
    { x: -0.62, z: 4.35, r: 0.26 },
  ];
  return {
    scene, camera, colliders, floorY: () => 0, nodes: { valve, blue, red, rocket },
    update(dt, t) {
      hiss.children.forEach((p) => { const u = (t * 0.45 + p.userData.s) % 1; p.position.set(0.05, 1 + u * 0.7, 0); p.material.opacity = 0.5 * (1 - u); });
      steam.children.forEach((p, i) => { const u = (t * 0.08 + p.userData.s) % 1; p.position.set(Math.sin(i) * 0.8, u * 10, Math.cos(i) * 0.6); p.material.opacity = 0.28 * (1 - u); });
    },
    resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
    dispose() {},
  };
}

let quiet = 0, toldEnter = false, runBody = null;

const scene = {
  id: 'white-room',
  title: ['CAP. 2 · LA MAÑANA DEL LANZAMIENTO', 'CH. 2 · LAUNCH MORNING'],
  gravity: 9.81,
  jump: false,
  exitDelay: 1.3,
  camera: { mode: 'third', dist: 3.1, height: 1.45, pitch: 0.22 },
  player: { model: 'astronaut-a7l', spawn: [0, 0, 9.2], yaw: Math.PI, speed: 1.45 },
  npcs: [
    { id: 'tech', model: 'extra-man-1', at: [-0.15, 0, 5.15], yaw: -1.1, name: ['TÉCNICO DEL RED CREW', 'RED CREW TECH'], marker: '!', dialog: 'tech-1', r: 1.45, card: 'red-crew', block: 0.38 },
    { id: 'schmitt', model: 'extra-man-2', at: [-0.85, 0, -1.15], yaw: 0.5, name: ['JOE SCHMITT', 'JOE SCHMITT'], marker: '!', dialog: 'schmitt-1', r: 1.35, block: 0.36 },
    { id: 'haise', model: 'aldrin-civil', at: [0.45, 0, -2.45], yaw: 0.4, name: ['FRED HAISE', 'FRED HAISE'], marker: '!', dialog: 'haise-1', r: 1.15, block: 0.34 },
    { id: 'wendt', model: 'civil-base', at: [0.05, 0, -1.85], yaw: 0.1, name: ['GUENTER WENDT', 'GUENTER WENDT'], marker: '!', dialog: 'wendt-1', r: 1.4, block: 0.38 },
  ],
  objects: [
    {
      id: 'valve', node: 'valve', at: [-0.62, 0, 4.35], r: 1.25, requires: 'talk:tech',
      reveals: ['obj:valve'],
      locked: ['Habla antes con el técnico', 'Talk to the technician first'],
      label: ['Inspeccionar la válvula', 'Inspect the valve'],
      thenHold: 3, holdLabel: ['Apretar con el técnico', 'Tighten with the technician'],
      objective: 'obj:valve',
      inspect: {
        title: ['Válvula de reposición de LH2', 'LH2 replenish valve'],
        text: ['La válvula por la que se vuelve a llenar el hidrógeno líquido de la segunda etapa, con el cohete ya cargado.', 'The valve that tops up the second stage\'s liquid hydrogen, with the rocket already fueled.'],
        why: ['Si pierde, los tanques no llegan llenos al despegue. La tripulación no la repara: mira y confirma que el red crew apretó los pernos.', 'If it leaks, the tanks are not full at liftoff. The crew does not repair it: they watch and confirm that the red crew tightened the bolts.'],
        fact: ['El 16 de julio de 1969, de madrugada, se halló esa fuga. El hidrógeno líquido está a −253 °C.', 'Before dawn on July 16, 1969, that leak was found. Liquid hydrogen sits at −253 °C.'],
        src: SRC,
      },
    },
    {
      id: 'overlook', at: [0.72, 0, 7.6], r: 1.15, objective: 'obj:vapor',
      label: ['Mirar el vapor', 'Look at the vapor'],
      aim: [8.2, -12, 3.5], aimFrom: [-0.15, 1.65, -0.35], aimFov: 26,
      inspect: {
        title: ['El cohete que humea', 'The venting rocket'],
        text: ['El vapor blanco sale de las etapas. No es humo: son los líquidos que hierven dentro de los tanques.', 'The white vapor comes off the stages. It is not smoke: it is the liquids boiling inside the tanks.'],
        why: ['Por eso se reponían hasta minutos antes del despegue. «Llenar los tanques» era acompañar esa ebullición, no un grifo.', 'That is why they were topped up until minutes before liftoff. “Filling the tanks” meant keeping up with that boil-off, not turning a tap.'],
        fact: ['El oxígeno líquido está a −183 °C y el hidrógeno líquido a −253 °C. Hierven sin parar.', 'Liquid oxygen sits at −183 °C and liquid hydrogen at −253 °C. They boil the whole time.'],
        src: 'NASA · Saturn V Flight Manual',
        card: 'propelente-criogenico',
      },
    },
    {
      id: 'conn-blue', at: [-1.21, 0.85, -2.05], r: 0.72, kind: 'use', requires: 'talk:schmitt',
      label: ['Conector azul', 'Blue connector'],
      locked: ['Joe Schmitt te explica el orden', 'Joe Schmitt explains the order'],
    },
    {
      id: 'conn-red', at: [-0.89, 0.85, -2.05], r: 0.72, kind: 'use', requires: 'talk:schmitt',
      label: ['Conector rojo', 'Red connector'],
      locked: ['Joe Schmitt te explica el orden', 'Joe Schmitt explains the order'],
    },
    {
      id: 'check', at: [1.15, 1.0, -3.45], r: 0.9, requires: 'talk:haise', objective: 'obj:check',
      label: ['Checklist del muslo', 'Cuff checklist'],
      locked: ['Primero habla con Fred Haise', 'Talk to Fred Haise first'],
      inspect: {
        title: ['Checklist del muslo', 'Cuff checklist'],
        text: ['La libreta sujeta al traje. Cada paso del lanzamiento está escrito: aquí no se improvisa.', 'The booklet strapped to the suit. Every launch step is written down: nothing here is improvised.'],
        why: ['Haise, de la tripulación de reserva, revisó los interruptores de la cabina antes de que entrara la tripulación.', 'Haise, from the backup crew, checked the cabin switches before the crew climbed in.'],
        fact: ['Tres casillas de esa mañana: abortar abajo, ventilador de cabina encendido, escotilla lista.', 'Three boxes from that morning: abort down, cabin fan on, hatch ready.'],
        src: 'Apollo Flight Journal · Smithsonian',
        card: 'checklist-muslo',
        checks: [
          ['Abortar: abajo', 'Abort: down'],
          ['Ventilador de cabina: encendido', 'Cabin fan: on'],
          ['Escotilla: lista para cerrar', 'Hatch: ready to close'],
        ],
      },
    },
    {
      id: 'hatch', at: [0.15, 1.1, -3.7], r: 1.15, kind: 'exit',
      label: ['Entrar en Columbia', 'Enter Columbia'],
      locked: ['Termina la Sala Blanca', 'Finish the White Room'],
      requires: NEED,
    },
  ],
  dialogs: {
    'tech-1': [
      { who: 'tech', whoName: ['TÉCNICO DEL RED CREW', 'RED CREW TECH'], text: ['¿Oyes el silbido? Es la reposición de hidrógeno. Nosotros apretamos los pernos; tú miras y confirmas. Mantén E cuando estés listo.', 'Hear the hiss? That is the hydrogen top-off. We tighten the bolts; you watch and confirm. Hold E when you are ready.'] },
    ],
    'schmitt-1': [
      { who: 'schmitt', whoName: ['JOE SCHMITT', 'JOE SCHMITT'], text: ['Desde que te pones el traje respiras oxígeno puro. Azul entra, rojo sale. En ese orden, hasta la nave.', 'From the moment the suit is on you breathe pure oxygen. Blue in, red out. In that order, all the way to the spacecraft.'] },
    ],
    'haise-1': [
      { who: 'haise', whoName: ['FRED HAISE', 'FRED HAISE'], text: ['Revisé los interruptores antes de que entrarais. Tacha la checklist del muslo: tres casillas, con E.', 'I checked the switches before you came in. Tick the cuff checklist: three boxes, with E.'] },
      { who: 'haise', whoName: ['FRED HAISE', 'FRED HAISE'], hint: 'h-45s', text: ['Dicen que Neil podría posar ese bicho con 20 segundos de combustible…', 'They say Neil could set that thing down with 20 seconds of fuel left…'] },
    ],
    'wendt-1': [
      { who: 'wendt', whoName: ['GUENTER WENDT', 'GUENTER WENDT'], text: ['Neil. Antes de la escotilla: la llave de la Luna. ¿Una broma, o las gracias?', 'Neil. Before the hatch: the key to the Moon. A joke, or a thank-you?'] },
      { choice: [
        { id: 'joke', label: ['Bromear', 'Joke'], trust: 6, next: 'wendt-key', card: 'llave-de-la-luna' },
        { id: 'thanks', label: ['Agradecer', 'Thank him'], trust: -4, next: 'wendt-key', card: 'llave-de-la-luna' },
      ] },
    ],
    'wendt-key': [
      { who: 'wendt', whoName: ['GUENTER WENDT', 'GUENTER WENDT'], hint: 'h-hamilton', text: ['La media luna no abre nada: es suerte. Si ves a Garman en Houston, pregúntale por su hojita.', 'The crescent opens nothing: it is luck. If you see Garman in Houston, ask him about his little sheet.'] },
    ],
  },
  objectives: [
    { id: 'obj:arm', text: ['Sal del ascensor y cruza el brazo 9', 'Leave the elevator and cross arm 9'], hidden: false },
    { id: 'obj:valve', text: ['Algo silba: averigua qué es', 'Something is hissing: find out what'], hidden: true },
    { id: 'obj:vapor', text: ['Mira el vapor blanco de las etapas', 'Look at the white vapor from the stages'], hidden: false },
    { id: 'obj:hoses', text: ['Conecta el traje: azul y luego rojo', 'Hook up the suit: blue, then red'], hidden: false },
    { id: 'obj:check', text: ['Tacha la checklist con Fred Haise', 'Tick the checklist with Fred Haise'], hidden: false },
    { id: 'talk:wendt', text: ['Despídete de Guenter Wendt', 'Say goodbye to Guenter Wendt'], hidden: false },
    { id: 'enter:hatch', text: ['Entra en Columbia', 'Enter Columbia'], hidden: true },
  ],
  onUse(item, api) {
    if (item.id === 'conn-blue' || item.id === 'conn-red') {
      const r = nextHose(api.flags.hose || '', item.id === 'conn-blue' ? 'blue' : 'red');
      api.flags.hose = r.state;
      if (r.mistake) return { mistake: true, bark: ['Schmitt: primero el azul, el que mete el oxígeno. Luego el rojo.', 'Schmitt: blue first, the one that brings the oxygen in. Then red.'] };
      if (item.id === 'conn-blue') return { bark: ['Azul conectado. Ahora el rojo, el que sale.', 'Blue is on. Now the red one, the outlet.'] };
      if (api.done.has('obj:hoses')) return null;
      item.disabled = true;
      return { done: 'obj:hoses', card: 'traje-a7l', bark: ['El traje respira. Azul entra, rojo sale.', 'The suit is breathing. Blue in, red out.'] };
    }
    if (item.id === 'valve') return { done: 'obj:valve', card: 'propelente-criogenico', bark: ['La válvula deja de silbar. El red crew baja.', 'The valve stops hissing. The red crew climbs down.'] };
    if (item.id === 'hatch') return { done: 'enter:hatch', bark: ['Armstrong a la izquierda, Collins a la derecha, Aldrin al centro.', 'Armstrong on the left, Collins on the right, Aldrin in the center.'] };
    return null;
  },
  step(s) {
    if (runBody !== s.body) { runBody = s.body; quiet = 0; toldEnter = false; }
    const out = {};
    if (!s.done.has('obj:arm') && s.body.z < 1.2) {
      out.done = 'obj:arm'; out.card = 'torre-lanzamiento';
      out.bark = ['Brazo de acceso 9: une la torre con la nave a unos 98 m.', 'Access arm 9: it joins the tower to the spacecraft about 98 m up.'];
    }
    const open = NEED.every((id) => s.done.has(id) || out.done === id);
    if (open && !toldEnter) { toldEnter = true; out.reveal = 'enter:hatch'; if (!out.bark) out.bark = ['Ya puedes entrar en Columbia.', 'You can enter Columbia now.']; }
    if (out.done) quiet = 0; else quiet += s.dt;
    if (quiet > 40) {
      quiet = 0;
      out.bark = out.bark || ['Si te pierdes: el silbido está en la pasarela y la escotilla, al fondo de la sala.', 'If you are lost: the hiss is on the walkway, and the hatch is at the back of the room.'];
    }
    return out.done || out.card || out.bark || out.reveal ? out : null;
  },
  complete: (st) => st.done.has('enter:hatch'),
  world: async () => buildBoxes(),
};

export default scene;
