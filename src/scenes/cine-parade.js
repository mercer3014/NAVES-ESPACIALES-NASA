// Cinemática E.1: desfile con lluvia de papel en Nueva York (parade-street.glb). El descapotable avanza por la calle;
// Collins, Armstrong y Aldrin (civiles) van en seat-1..3 con 'sit' + saludo del brazo; extras animados junto a la valla.
// El confeti del glb es estático: aquí se mueven los nodos confetti-1..6 (caen y giran en bucle).
import { THREE } from '../core/engine.js';
import { model, char, node, disposeScene, camera as mkCam } from './cine-kit.js';

const EXTRAS = ['extra-man-1', 'extra-woman-1', 'extra-man-2', 'extra-woman-2'];
const CAR_Z0 = -34, CAR_V = 2.0; // m, m/s

export async function makeCineParade() {
  const street = await model('parade-street');
  const crew = await Promise.all([char('collins-civil', 'sit'), char('armstrong-civil', 'sit', { phase: 0.4 }), char('aldrin-civil', 'sit', { phase: 0.8 })]);
  const spots = [];
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) spots.push({ side, z: -18 + i * 5.2 + (side > 0 ? 2.4 : 0) + Math.sin(i * 7.1) * 0.8, x: side * (8.0 + (i % 3) * 0.55) });
  const extras = await Promise.all(spots.map((s, i) => char(EXTRAS[i % 4], i % 3 === 1 ? 'idle' : 'wave', { phase: (i * 0.37) % 2 })));
  const scene = new THREE.Scene();
  const sky = new THREE.Color(0xc9d6e2); scene.background = sky; scene.fog = new THREE.Fog(sky, 60, 190);
  const cam = mkCam(40, 400);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x55504a, 1.3));
  const sun = new THREE.DirectionalLight(0xfff2de, 2.6); sun.position.set(-30, 60, 25); scene.add(sun);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 5, far: 160 });
  street.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  scene.add(street);
  const car = node(street, 'convertible'); car?.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // los tres en los asientos (el origen va en seat-N con el clip sit; -0,22 m para que las rodillas no atraviesen el respaldo delantero)
  crew.forEach((c, i) => { const s = node(street, 'seat-' + (i + 1)); (s || car || scene).add(c.root); c.root.position.y = -0.22; c.layer('wave-arm'); c.mixer.update(i * 0.5); });
  const [collins] = crew;
  // extras junto a las vallas, mirando a la calle
  extras.forEach((c, i) => { const s = spots[i]; c.root.position.set(s.x, 0.15, s.z); c.root.rotation.y = s.side < 0 ? Math.PI / 2 : -Math.PI / 2; c.root.rotation.y += Math.sin(i * 3.3) * 0.35; scene.add(c.root); });
  const conf = [1, 2, 3, 4, 5, 6].map((i) => node(street, 'confetti-' + i)).filter(Boolean).map((n) => ({ n, y0: n.position.y, ry: n.rotation.y }));
  const all = [...crew, ...extras];
  let collinsLook = false;
  return {
    scene, camera: cam,
    anchors: { car: car || { x: 0, y: 0, z: 0 }, collins: collins.root },
    at(T) {
      if (car) car.position.z = CAR_Z0 + T * CAR_V;
      for (const c of conf) { c.n.position.y = 2 + ((((c.y0 - 2 - T * 1.1) % 15) + 15) % 15); c.n.rotation.y = c.ry + T * 0.25; }
      // Collins deja de saludar y mira la multitud (12–19 s)
      const look = T >= 12 && T < 19;
      if (look !== collinsLook) { collinsLook = look; collins.layer(look ? null : 'wave-arm', 0.5); }
      collins.root.rotation.y = look ? -0.7 * Math.min(1, (T - 12) / 1.5) : 0;
    },
    update(dt) { all.forEach((c) => c.update(dt)); },
    act() {},
    dispose() { disposeScene(scene); },
  };
}
