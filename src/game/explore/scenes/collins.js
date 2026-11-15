// Cap. 6.1 · Collins solo detrás de la Luna. Linterna, libreta y ventana.
import { THREE } from '../../../core/engine.js';
import { makeColumbia } from '../../story/night.js';

export default {
  id: 'collins',
  title: ['CAP. 6 · EL LADO SILENCIOSO', 'CH. 6 · THE SILENT SIDE'],
  gravity: 0,
  float: true,
  jump: false,
  exitDelay: 0.5,
  camera: { mode: 'first', height: 0.02, pitch: 0.04 },
  player: { spawn: [0.05, 1.46, 0.15], yaw: 0, speed: 0.8 },
  objects: [
    {
      id: 'window', at: [0.05, 1.45, 0.85], r: 0.7, prompt: ['Mirar por la ventana', 'Look out the window'], objective: 'obj:window',
      inspect: {
        title: ['La ventana trasera', 'The rear window'],
        text: ['Un cielo más lleno de estrellas que cualquiera que viera desde la Tierra. No hay radio: la Luna tapa las antenas.', 'A sky more crowded with stars than any he saw from Earth. There is no radio: the Moon blocks the antennas.'],
        why: ['Cada vuelta son unos 48 minutos sin contacto con nadie. Eagle está al otro lado.', 'Every orbit is about 48 minutes out of contact. Eagle is on the other side.'],
        fact: ['Collins describió ese silencio en Carrying the Fire: tres mil millones más dos al otro lado de la Luna, y uno de este lado.', 'Collins described that silence in Carrying the Fire: three billion plus two on the other side of the Moon, and one on this side.'],
        src: 'Michael Collins, Carrying the Fire (1974)',
        card: 'ventana-trasera',
      },
    },
    {
      id: 'book', at: [-0.28, 1.4, -0.15], r: 0.6, prompt: ['Abrir la libreta', 'Open the notebook'], objective: 'obj:book',
      inspect: {
        title: ['La libreta de Collins', 'Collins’s notebook'],
        text: ['Dieciocho variantes de encuentro, por si el ascenso de Eagle no sale según el plan.', 'Eighteen rendezvous variants, in case Eagle’s ascent does not go to plan.'],
        why: ['Si no suben, no puede bajar a buscarlos. La libreta es el plan B.', 'If they do not come up, he cannot go down to get them. The notebook is plan B.'],
        fact: ['Collins llevó anotadas las opciones de encuentro por si el Eagle despegaba en un momento o un lugar distintos.', 'Collins wrote down the rendezvous options in case Eagle lifted off at a different time or place.'],
        src: 'Apollo 11 Flight Journal · Michael Collins, Carrying the Fire',
        card: 'libreta-collins',
      },
    },
  ],
  dialogs: {
    solo: [
      { who: 'mike', whoName: ['COLLINS', 'COLLINS'], text: ['48 minutos sin radio. ¿Qué hago con el silencio?', '48 minutes without radio. What do I do with the silence?'], vo: 'voz_en_clonada/c6_61_collins_solo_vo_en' },
      { choice: [
        { id: 'work', label: ['Recalcular el encuentro', 'Recompute the rendezvous'], next: 'solo-work' },
        { id: 'look', historic: true, label: ['Mirar y escuchar', 'Look and listen'], next: 'solo-look', card: 'collins-solo' },
        { id: 'pat', label: ['Hablarle a Pat', 'Talk to Pat'], trust: 5, next: 'solo-pat', flag: 'pat-words' },
      ], decision: 'c6-collins' },
    ],
    'solo-work': [{ who: 'mike', whoName: ['COLLINS', 'COLLINS'], text: ['Dieciocho variantes. Tendré un plan B.', 'Eighteen variants. I will have a plan B.'] }],
    'solo-look': [{ who: 'mike', whoName: ['COLLINS', 'COLLINS'], text: ['(Apaga la luz del panel. Solo estrellas.)', '(He switches off the panel light. Only stars.)'] }],
    'solo-pat': [{ who: 'mike', whoName: ['COLLINS', 'COLLINS'], text: ['Pat… ojalá pudieras ver esto. Hay más estrellas que oscuridad.', 'Pat… I wish you could see this. There are more stars than dark.'] }],
  },
  npcs: [
    { id: 'mike', model: 'collins-vuelo', at: [0.12, 1.42, -0.35], yaw: 0.4, tilt: Math.PI / 2, name: ['COLLINS', 'COLLINS'], marker: '!', dialog: 'solo', r: 0.9 },
  ],
  objectives: [
    { id: 'obj:window', text: ['Mira por la ventana', 'Look out the window'], hidden: false },
    { id: 'obj:book', text: ['Abre la libreta', 'Open the notebook'], hidden: false },
    { id: 'talk:mike', text: ['Decide qué hacer con el silencio', 'Decide what to do with the silence'], hidden: false },
  ],
  complete: (st) => ['obj:window', 'obj:book', 'talk:mike'].every((id) => st.done.has(id)),
  step({ body }) {
    body.y = Math.max(1.2, Math.min(1.7, body.y));
    const rad = Math.hypot(body.x, body.z);
    if (rad > 0.72) { const k = 0.72 / rad; body.x *= k; body.z *= k; }
  },
  world: async () => {
    const W = await makeColumbia({ light: 'dark', spin: 0, withEarth: false, withMoon: true });
    W.pilot = true;
    const spot = new THREE.SpotLight(0xfff1d2, 6, 8, 0.42, 0.45, 1);
    spot.position.set(0, 1.5, 0.2); W.scene.add(spot); W.scene.add(spot.target);
    return {
      scene: W.scene, camera: W.camera, colliders: [], floorY: () => 1.2,
      update(dt, t) {
        W.update(dt, t);
        spot.position.copy(W.camera.position);
        const dir = new THREE.Vector3(); W.camera.getWorldDirection(dir);
        spot.target.position.copy(W.camera.position).add(dir);
      },
      resize: () => W.resize(),
      dispose: () => W.dispose(),
    };
  },
};
