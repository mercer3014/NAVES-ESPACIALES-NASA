// Cap. 1.3 · «La playa de Cabo Kennedy» (atardecer, días antes del lanzamiento): Armstrong, Collins y Aldrin, de civil,
// sentados frente al Saturn V en la plataforma 39A. Personajes: armstrong/collins/aldrin-civil.glb (clip 'sit').
// Mundo: la escena de la plataforma (pad.js) sin encendido; el público de ksc-crowd es del día del lanzamiento y aquí se oculta.
import { THREE } from '../../core/engine.js';
import { makePad, BASE_Y } from '../../scenes/pad.js';
import { BEACH } from '../../scenes/ksc-crowd.js';
import { runCine, character } from './cine.js';

const TITLE = ['CAP. 1 · LA PLAYA DE CABO KENNEDY', 'CH. 1 · THE CAPE KENNEDY BEACH'];
const SAND = BASE_Y + BEACH.y; // y de mundo de la arena (≈ −0,48)
const X = 60, Z = BEACH.z - 8; // un poco al norte del punto de público del día del lanzamiento
const SEAT = 0.42; // tronco de deriva; con 'sit' el origen va a la altura del asiento − 0,46 m

export default async function beachScene() {
  const W = makePad(); W.setThrust(0);
  await Promise.race([Promise.all([W.ready, W.envReady]), new Promise((r) => setTimeout(r, 8000))]);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 2.8, 10), new THREE.MeshStandardMaterial({ color: 0x8a7a66, roughness: 0.95 }));
  log.rotation.z = Math.PI / 2; log.position.set(X, SAND + 0.2, Z); W.scene.add(log);
  const crew = (await Promise.all([['armstrong-civil', -0.85], ['collins-civil', 0], ['aldrin-civil', 0.85]].map(([n, dx]) =>
    character(n, 'sit', { at: [X + dx, SAND + SEAT - 0.46, Z], yaw: 0 }).catch((e) => { console.warn(n + '.glb no disponible', e); return null; })))).filter(Boolean);
  crew.forEach((c) => W.scene.add(c.root));
  const world = { scene: W.scene, camera: W.camera, update: (dt, t) => { if (W.crowd) W.crowd.visible = false; crew.forEach((c) => c.update(dt)); W.update(dt, t); }, render: (dt) => W.render(dt), resize: (w, h) => W.resize(w, h), dispose: () => W.dispose() };
  W.camera.near = 0.1; W.camera.far = 60000; W.camera.updateProjectionMatrix();
  const P = (dx, dy, dz) => [X + dx, SAND + dy, Z + dz];
  return runCine({
    id: 'beach', world, title: TITLE,
    shots: [
      { d: 6, pos: P(-1.2, 1.3, -4.2), look: [0, BASE_Y + 50, 0], fov: 38, to: { pos: P(0.6, 1.15, -3.4), look: [0, BASE_Y + 45, 0], fov: 32 } }, // de espaldas: el cohete al fondo
      { d: 9, pos: P(0.4, 0.95, 3.0), look: P(0, 0.85, 0), fov: 40, to: { pos: P(-0.3, 0.9, 2.4), look: P(0, 0.85, 0), fov: 36 } }, // de frente, el mar detrás
      { d: 7, pos: P(6, 1.6, -9), look: [0, BASE_Y + 40, 0], fov: 30, to: { pos: P(3, 1.4, -7), look: [0, BASE_Y + 50, 0], fov: 26 } },
    ],
    lines: [
      { at: 0.6, who: 'COLLINS', text: ['Saben qué es lo bueno de mi trabajo, ¿no? Si algo sale mal ahí abajo, el único que vuelve soy yo.', 'You know the good part of my job? If something goes wrong down there, I\'m the one who comes back.'] },
      { at: 5.4, who: 'ALDRIN', text: ['Qué consuelo, Mike.', 'What a comfort, Mike.'] },
      { at: 8, who: 'COLLINS', text: ['No es un chiste. Si no suben, no puedo bajar a buscarlos. Lo pienso cada noche.', 'It\'s not a joke. If you don\'t come up, I can\'t go down to get you. I think about it every night.'] },
      { at: 14, who: '', text: ['(Silencio. Las olas.)', '(Silence. The waves.)'] },
      { at: 16.5, who: 'ARMSTRONG', text: ['Vamos a subir, Mike.', 'We\'ll come up, Mike.'] },
    ],
  }).finally(() => world.dispose());
}
