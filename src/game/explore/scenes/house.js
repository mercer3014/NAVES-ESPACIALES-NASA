// Cap. 1.1 · Casa Armstrong en El Lago. Mundo: armstrong-house-p3.glb (con npc-spot).
// La casa de la cinemática sigue siendo armstrong-house.glb: el encuadre no cambia.
import { THREE, model, modelAnim } from '../../../core/engine.js';

const wall = (x, z, hx, hz, hy = 2.4) => ({ min: { x: x - hx, y: 0, z: z - hz }, max: { x: x + hx, y: hy, z: z + hz } });
let playStages = () => {};

export default {
  id: 'house',
  title: ['CAP. 1 · LA CASA DE EL LAGO', 'CH. 1 · THE HOUSE AT EL LAGO'],
  gravity: 9.81,
  jump: false,
  exitDelay: 0.6,
  camera: { mode: 'third', dist: 2.5, height: 1.45, pitch: 0.28 },
  player: { model: 'armstrong-civil', spawn: [0.35, 0, 1.35], yaw: 2.2, speed: 1.35 },
  npcs: [
    { id: 'jan', model: 'jan', at: [2.7, 0, 0.9], yaw: -2.4, name: ['JAN', 'JAN'], marker: '!', dialog: 'jan-1', r: 1.55 },
    { id: 'rick', model: 'rick', spot: 'npc-spot-rick', yaw: 0, clip: 'sit', once: true, name: ['RICK', 'RICK'], marker: '!', dialog: 'rick-1', r: 1.45, block: 0.34 },
    { id: 'mark', model: 'mark', spot: 'npc-spot-mark', yaw: 1.1, clip: 'sit-floor', once: true, name: ['MARK', 'MARK'], marker: '…', dialog: 'mark-1', r: 1.3, block: 0.28 },
  ],
  objects: [
    {
      id: 'boxes', at: [0.45, 0.4, 2.35], r: 1.35, label: ['Mirar las cajas', 'Look at the boxes'], objective: 'obj:boxes',
      inspect: {
        title: ['Cajas de la reconstrucción', 'Boxes from the rebuild'],
        text: ['Cajas de mudanza todavía cerradas. La casa se volvió a levantar después del incendio.', 'Moving boxes still sealed. The house was rebuilt after the fire.'],
        why: ['En abril de 1964 la casa de los Armstrong ardió. Lo que no se quemó viajó con ellos. Ed White, vecino y amigo, no vería el lanzamiento: murió en el Apolo 1.', 'In April 1964 the Armstrong house burned. What survived moved with them. Ed White, a neighbor and friend, would not see the launch: he died in Apollo 1.'],
        fact: ['El incendio de la casa fue el 24 de abril de 1964. El del Apolo 1, el 27 de enero de 1967, mató a Grissom, White y Chaffee.', 'The house fire was on 24 April 1964. The Apollo 1 fire, on 27 January 1967, killed Grissom, White and Chaffee.'],
        src: 'James R. Hansen, First Man · NASA, Apollo 204 Review Board',
      },
    },
    {
      id: 'rocket', node: 'rocket', at: [-1.15, 0, 0.85], r: 1.25, label: ['Inspeccionar el cohete de Mark', 'Inspect Mark\'s rocket'], objective: 'obj:rocket',
      onOpen: () => playStages(),
      inspect: {
        title: ['El cohete de Mark', 'Mark\'s rocket'],
        text: ['Un Saturn V de plástico. Si lo giras, las etapas se separan.', 'A plastic Saturn V. Twist it and the stages come apart.'],
        why: ['Mark tiene seis años y todavía juega con las etapas. Neil se las puede explicar antes de irse, o dejar que Rick cuide de su hermano.', 'Mark is six and still plays with the stages. Neil can explain them before he leaves, or let Rick look after his brother.'],
        fact: ['El Saturn V medía unos 110 m y pesaba unas 2.900 toneladas al despegar. S-IC: cinco F-1. S-II: cinco J-2. S-IVB: un J-2 que se reencendía hacia la Luna.', 'The Saturn V stood about 110 m and weighed some 2,900 tonnes at liftoff. S-IC: five F-1s. S-II: five J-2s. S-IVB: one J-2 that restarted toward the Moon.'],
        src: 'NASA · Apollo by the Numbers (SP-2000-4029)',
        card: 'saturn-v',
      },
    },
    {
      id: 'photo', node: 'photo', at: [-0.55, 0.7, -2.55], r: 1.15, label: ['Mirar la foto familiar', 'Look at the family photo'], objective: 'obj:photo',
      inspect: {
        title: ['La foto de la mesita', 'The photo on the side table'],
        text: ['Jan, Neil y los dos niños, en la casa de El Lago.', 'Jan, Neil and the two boys, in the house at El Lago.'],
        why: ['Son los últimos días antes de la cuarentena. Lo que Neil les diga esta noche es lo que Rick recordará cuando oiga el alunizaje.', 'These are the last days before quarantine. What Neil tells them tonight is what Rick will remember when he hears the landing.'],
        fact: ['Rick tenía 12 años y Mark 6. Jan escucharía todo el descenso por la squawk box que la NASA instaló en esta casa.', 'Rick was 12 and Mark was 6. Jan would hear the whole descent on the squawk box NASA installed in this house.'],
        src: 'James R. Hansen, First Man (2005)',
      },
    },
  ],
  dialogs: {
    'jan-1': [
      { who: 'jan', whoName: ['JAN', 'JAN'], text: ['Neil. Antes de irte tienes que hablar con los niños. Explícales que puede que no vuelvas.', 'Neil. Before you go, you have to talk to the boys. Explain to them that you might not come back.'] },
      { who: 'jan', whoName: ['JAN', 'JAN'], text: ['Las probabilidades son buenas, dirás. Entonces no te costará decírselo. Rick está en el sofá.', 'The odds are good, you will say. Then it will not be hard to tell them. Rick is on the sofa.'] },
    ],
    'mark-1': [
      { who: 'mark', whoName: ['MARK', 'MARK'], text: ['Es un Saturn V. Si lo giras, se separan las etapas.', 'It\'s a Saturn V. If you twist it, the stages come apart.'] },
    ],
    'rick-1': [
      { who: 'rick', whoName: ['RICK', 'RICK'], text: ['¿Desde la Luna se ve nuestra casa?', 'Can you see our house from the Moon?'] },
      { who: 'rick', whoName: ['NEIL', 'NEIL'], text: ['No. Pero se ve la Tierra entera. Y tú estás en ella. ¿Qué les digo de verdad?', 'No. But you can see the whole Earth. And you are on it. What do I really tell them?'] },
      { choice: [
        { id: 'truth', historic: true, label: ['Contarles la verdad', 'Tell them the truth'], next: 'rick-truth', card: 'decision-hijos' },
        { id: 'downplay', label: ['Restarle importancia', 'Downplay it'], trust: -5, next: 'rick-down' },
        { id: 'rocket', label: ['Darle a Rick el cohete de Mark', 'Give Rick Mark\'s rocket'], trust: 5, next: 'rick-rocket' },
      ], decision: 'c1-kids' },
    ],
    'rick-truth': [
      { who: 'rick', whoName: ['NEIL', 'NEIL'], text: ['Es peligroso. Pero confío en mi equipo. Por eso voy.', 'It is dangerous. But I trust my team. That is why I am going.'] },
    ],
    'rick-down': [
      { who: 'rick', whoName: ['NEIL', 'NEIL'], text: ['Es un viaje de trabajo. Volveré pronto.', 'It is a business trip. I will be back soon.'] },
    ],
    'rick-rocket': [
      { who: 'rick', whoName: ['NEIL', 'NEIL'], text: ['Cuida de Mark. Y del cohete. Las etapas se separan si lo giras despacio.', 'Look after Mark. And the rocket. The stages come apart if you twist it slowly.'] },
    ],
  },
  objectives: [
    { id: 'talk:jan', text: ['Habla con Jan en la cocina', 'Talk to Jan in the kitchen'], hidden: false },
    { id: 'obj:boxes', text: ['Mira las cajas de la mudanza', 'Look at the moving boxes'], hidden: false },
    { id: 'obj:rocket', text: ['Inspecciona el cohete de Mark', 'Inspect Mark\'s rocket'], hidden: false },
    { id: 'talk:rick', text: ['Siéntate a hablar con Rick', 'Sit and talk with Rick'], hidden: false },
    { id: 'obj:photo', text: ['Mira la foto familiar', 'Look at the family photo'], hidden: false },
  ],
  moments: ['decision-hijos'],
  complete: (st) => ['talk:jan', 'obj:boxes', 'obj:rocket', 'talk:rick', 'obj:photo'].every((id) => st.done.has(id)),
  world: async () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120e0c);
    scene.fog = new THREE.Fog(0x120e0c, 8, 18);
    scene.add(new THREE.HemisphereLight(0xffe6c4, 0x2a2118, 0.55));
    const lamp = new THREE.PointLight(0xffc98a, 4, 8, 1.4); lamp.position.set(-4.2, 1.6, -2.4); scene.add(lamp);
    const pend = new THREE.PointLight(0xffd9a0, 3.2, 7, 1.4); pend.position.set(2.6, 2.1, 0.4); scene.add(pend);
    const house = await model('armstrong-house-p3');
    scene.add(house);
    const props = await model('earth-props').catch(() => null);
    let rocket = null, photo = null, mixer = null, anims = [];
    if (props) {
      const toy = props.getObjectByName('toy-saturn-v');
      const frame = props.getObjectByName('framed-photo');
      if (toy) { rocket = toy.clone(true); rocket.position.set(-1.15, 0, 0.85); rocket.rotation.y = 0.6; rocket.scale.setScalar(2.6); scene.add(rocket); }
      if (frame) { photo = frame.clone(true); photo.position.set(-0.55, 0.62, -2.55); photo.rotation.y = 0.6; scene.add(photo); }
      anims = await modelAnim('earth-props').then((g) => g.animations).catch(() => []);
      if (rocket) mixer = new THREE.AnimationMixer(rocket);
    }
    playStages = () => {
      const clip = THREE.AnimationClip.findByName(anims, 'stages-separate');
      if (!clip || !mixer) return;
      const a = mixer.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.reset().play();
    };
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.08, 40);
    const colliders = [
      wall(0, -3.35, 4.6, 0.12), wall(0, 3.55, 4.6, 0.12), wall(-4.55, 0.2, 0.12, 3.4), wall(4.15, 0, 0.12, 3.4),
      wall(-2.0, -2.55, 1.15, 0.4, 0.7), wall(3.3, -0.4, 1.15, 0.7, 1.05), wall(2.0, -0.35, 0.7, 0.4, 0.85),
      wall(-2.0, 2.85, 0.45, 0.2, 1.3),
    ];
    scene.updateMatrixWorld(true);
    const api = {
      scene, camera, colliders, floorY: () => 0, nodes: { rocket, photo },
      update(dt) { mixer?.update(dt); },
      resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
      dispose() {},
    };
    return api;
  },
};
