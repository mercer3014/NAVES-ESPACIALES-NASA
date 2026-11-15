// Casa de los Armstrong (El Lago, Texas, 1969) para las cinemáticas del cap. 1 (despedida) y del cap. 4 (alunizaje por la squawk box).
// armstrong-house.glb: sala a la izquierda (x<0) y cocina/comedor a la derecha (x>0). La TV (tv-set › tv-screen) está en z≈+3 mirando a −Z;
// el sofá en z≈−1,85 mirando a la TV; la squawk box sobre la mesita lateral derecha del sofá (side-table-2).
import { THREE, modelAnim } from '../core/engine.js';
import { makeCineBase, faceTo, tvTexture, screenMaterial, propCopy } from './cine-common.js';

export const HOUSE_SPOTS = {
  sofaL: [-2.75, 0, -1.75], sofaC: [-2.2, 0, -1.75], sofaR: [-1.55, 0, -1.75],
  squawk: [-0.85, 0.58, -1.9], tv: [-2.2, 0, 2.95], kitchen: [2.6, 0, -0.55], door: [3.4, 0, 2.2],
  rug: [-2.2, 0, 0.6],
};

// moment: 'farewell' (cap. 1, noche antes de la cuarentena) o 'landed' (cap. 4, 20 jul 1969, 15:17 hora de Houston)
export function makeHouse({ moment = 'farewell' } = {}) {
  const W = makeCineBase({ bg: 0x15100c, fov: 40, far: 60 });
  const { scene } = W;
  const night = moment === 'farewell';
  scene.add(new THREE.HemisphereLight(0xffe7c8, 0x3a2c20, night ? 0.35 : 0.55));
  const lamp = new THREE.PointLight(0xffc98a, night ? 4 : 2, 8, 1.4); lamp.position.set(-4.45, 1.55, -2.7); scene.add(lamp);
  const pend = new THREE.PointLight(0xffd9a0, night ? 3 : 1.5, 7, 1.5); pend.position.set(2.6, 2.0, 0.7); scene.add(pend);
  if (!night) { const sun = new THREE.DirectionalLight(0xfff0d8, 1.0); sun.position.set(-1, 4, -6); scene.add(sun); }
  const tvGlow = new THREE.PointLight(0xcfd8ff, 1.2, 5, 1.5); tvGlow.position.set(-2.2, 0.8, 2.4); scene.add(tvGlow);

  const tv = tvTexture(night ? ['CBS NEWS', 'APOLO 11', 'CUENTA REGRESIVA'] : ['EN VIVO', 'HOUSTON', 'TRANQUILITY BASE']);
  W.tick((dt) => { tv.update(dt); tvGlow.intensity = 1.0 + Math.random() * 0.4; });
  const roomP = W.room('armstrong-house').then((r) => { if (r) screenMaterial(r.N['tv-screen'], tv.tex, 1.25); return r; });
  const props = W.room('earth-props').then((r) => { if (r) r.root.visible = false; return r; });
  let rocket = null, rocketMixer = null;

  Promise.all([roomP, props]).then(([, p]) => {
    if (!p) return;
    // Foto enmarcada y parche de la misión sobre el aparador (credenza)
    propCopy(p.N, 'framed-photo', scene, { pos: [-4.72 + 0.55, 0.78, 1.6], rotY: Math.PI / 2 });
    if (!night) propCopy(p.N, 'mission-patch', scene, { pos: [-2.2 + 0.55, 0.43, -0.25], rotY: 0.4 });
    // Cohete de juguete de Mark (toy-saturn-v con sus etapas); en el cap. 1 está en la alfombra
    rocket = propCopy(p.N, 'toy-saturn-v', scene, { pos: night ? [-1.85, 0, 0.75] : [-2.0, 0.43, -0.2], rotY: 0.3 });
    if (rocket) {
      rocketMixer = new THREE.AnimationMixer(rocket);
    }
  });
  // El clip stages-separate anima los nodos sv-stage-* por nombre, así que vale para la copia
  const animsP = modelAnim('earth-props').then((g) => g.animations).catch(() => []);
  W.tick((dt) => rocketMixer?.update(dt));

  if (night) {
    W.actor('jan', 'jan', { pos: [2.1, 0, -0.65], rotY: faceTo(2.1, -0.65, 3.4, 2.2), clip: 'idle' });
    W.actor('neil', 'armstrong-civil', { pos: HOUSE_SPOTS.door, rotY: faceTo(3.4, 2.2, 2.1, -0.65), clip: 'idle' });
    W.actor('rick', 'rick', { pos: HOUSE_SPOTS.sofaL, rotY: 0, clip: 'sit' });
    W.actor('mark', 'mark', { pos: [-1.55, 0, 0.45], rotY: faceTo(-1.55, 0.45, -1.85, 0.75), clip: 'idle' });
  } else {
    W.actor('jan', 'jan', { pos: HOUSE_SPOTS.sofaR, rotY: 0, clip: 'sit' });
    W.actor('rick', 'rick', { pos: [-2.45, 0, -0.75], rotY: 0, clip: 'idle' });
    W.actor('mark', 'mark', { pos: [-2.45, 0, -0.38], rotY: 0, clip: 'idle' });
  }

  return {
    ...W,
    spots: HOUSE_SPOTS,
    tv,
    // Mark gira el cohete y se separan las etapas
    async separateStages() {
      const anims = await animsP; const c = THREE.AnimationClip.findByName(anims, 'stages-separate');
      if (!c || !rocketMixer) return; const a = rocketMixer.clipAction(c); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.reset().play();
    },
  };
}
