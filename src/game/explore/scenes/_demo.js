// Sala de prueba del motor de exploración. No es una escena del guion:
// sirve para ?debug&explore=_demo (caminar, hablar, inspeccionar, objetivo oculto).
import { THREE } from '../../../core/engine.js';

const H = 2.7;
function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.04 }));
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m;
}
function solid(x, z, hx, hz, hy = H) {
  return { min: { x: x - hx, y: 0, z: z - hz }, max: { x: x + hx, y: hy, z: z + hz } };
}

export default {
  id: '_demo',
  title: ['DEMO · SALA DE EXPLORACIÓN', 'DEMO · EXPLORATION ROOM'],
  gravity: 9.81,
  jump: true,
  camera: { mode: 'third', dist: 2.15, height: 1.55 },
  player: { model: 'armstrong-civil', spawn: [0, 0, 1.35], yaw: Math.PI, speed: 1.7 },
  companion: { model: 'aldrin-civil', follow: 1.5, at: [0.45, 0, 2.9] },
  npcs: [{
    id: 'wendt', model: 'civil-base', at: [0, 0, -0.7], yaw: 0, clip: 'idle',
    name: ['GUENTER WENDT', 'GUENTER WENDT'], marker: '!', dialog: 'wendt-1', r: 1.55,
  }],
  objects: [{
    id: 'valve', node: 'valve', at: [2.15, 0, 0.15], r: 1.5,
    label: ['Inspeccionar la válvula', 'Inspect the valve'],
    reveals: ['obj:valve'],
    inspect: {
      title: ['Válvula de reposición de LH2', 'LH2 replenish valve'],
      text: ['La válvula por la que se vuelve a llenar el hidrógeno líquido de la segunda etapa mientras el cohete espera en la torre.', 'The valve that tops up the second stage\'s liquid hydrogen while the rocket waits on the tower.'],
      why: ['Si pierde, los tanques no llegan llenos al despegue. La tripulación no la repara: la mira, entiende el silbido y confirma que el equipo la apretó.', 'If it leaks, the tanks are not full at liftoff. The crew does not fix it: they hear the hiss, understand it, and confirm the team tightened it.'],
      fact: ['El 16 de julio de 1969, de madrugada, se halló una fuga en esa válvula. El hidrógeno líquido está a −253 °C.', 'Before dawn on July 16, 1969, a leak was found in that valve. Liquid hydrogen sits at −253 °C.'],
      src: 'Apollo Flight Journal, día del lanzamiento · NASA',
      card: 'propelente-criogenico',
    },
  }],
  dialogs: {
    'wendt-1': [
      { who: 'wendt', whoName: ['GUENTER WENDT', 'GUENTER WENDT'], text: ['Neil. La Sala Blanca está en orden. ¿Una broma antes de la escotilla, o vamos al grano?', 'Neil. The White Room is in order. A joke before the hatch, or straight to work?'] },
      { choice: [
        { id: 'joke', label: ['Bromear con la llave de la Luna', 'Joke about the key to the Moon'], trust: 8, next: 'wendt-joke' },
        { id: 'thanks', label: ['Agradecer y seguir', 'Thank him and move on'], trust: -4, next: null },
      ] },
    ],
    'wendt-joke': [
      { who: 'wendt', whoName: ['GUENTER WENDT', 'GUENTER WENDT'], text: ['Entonces guarda esta media luna. No abre la escotilla: abre la conversación.', 'Then keep this crescent. It does not open the hatch. It opens the conversation.'] },
    ],
  },
  objectives: [
    { id: 'talk:wendt', text: ['Habla con Guenter Wendt', 'Talk to Guenter Wendt'], hidden: false },
    { id: 'obj:valve', text: ['Encuentra la válvula que silba', 'Find the hissing valve'], hidden: true },
  ],
  complete: (st) => st.done.has('talk:wendt') && st.done.has('obj:valve'),
  world: async () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c0e);
    scene.fog = new THREE.Fog(0x0b0c0e, 10, 22);
    scene.add(new THREE.HemisphereLight(0xf2efe6, 0x1a140f, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4e4, 1.25); sun.position.set(5, 9, 4); scene.add(sun);
    const lamp = new THREE.PointLight(0xff4f00, 3.5, 7); lamp.position.set(2.15, 2.3, 0.15); scene.add(lamp);
    scene.add(box(9.2, 0.12, 9.2, 0x2a261f, 0, -0.06, 0));
    const grid = new THREE.GridHelper(8, 8, 0x5a5348, 0x3a342c); grid.position.y = 0.005; scene.add(grid);
    // muros: la cara interior queda en ±4
    scene.add(box(8.8, H, 0.4, 0x15171a, 0, H / 2, -4.2));
    scene.add(box(8.8, H, 0.4, 0x15171a, 0, H / 2, 4.2));
    scene.add(box(0.4, H, 8.8, 0x15171a, -4.2, H / 2, 0));
    scene.add(box(0.4, H, 8.8, 0x15171a, 4.2, H / 2, 0));
    scene.add(box(0.9, 0.7, 0.9, 0x3a3d42, -1.55, 0.35, 0.35));
    const valve = new THREE.Group(); valve.name = 'valve'; valve.position.set(2.15, 0, 0.15);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xc5c1b6, metalness: 0.65, roughness: 0.32 }));
    body.position.y = 0.7; valve.add(body);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16), new THREE.MeshStandardMaterial({ color: 0xff4f00, metalness: 0.4, roughness: 0.4, emissive: 0x3a1208, emissiveIntensity: 0.4 }));
    wheel.rotation.x = Math.PI / 2; wheel.position.y = 1.12; valve.add(wheel);
    scene.add(valve);
    const steam = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.35 }));
      p.userData.s = Math.random(); steam.add(p);
    }
    valve.add(steam);
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.08, 80);
    const colliders = [
      solid(0, -4.2, 4.4, 0.2), solid(0, 4.2, 4.4, 0.2), solid(-4.2, 0, 0.2, 4.4), solid(4.2, 0, 0.2, 4.4),
      solid(-1.55, 0.35, 0.45, 0.45, 0.7),
      { x: 2.15, z: 0.15, r: 0.28 },
    ];
    return {
      scene, camera, colliders, floorY: () => 0, nodes: { valve },
      update(dt, t) {
        steam.children.forEach((p) => {
          const u = ((t * 0.35 + p.userData.s) % 1);
          p.position.set(Math.sin(u * 6) * 0.05, 1.15 + u * 0.8, 0.08);
          p.material.opacity = 0.4 * (1 - u); p.scale.setScalar(0.6 + u);
        });
      },
      resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
      dispose() {},
    };
  },
};
