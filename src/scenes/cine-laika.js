// Cinemática 7.1B: laika-plush flotando con la Tierra detrás y un inserto del Sputnik 2 (sputnik-2.glb) sobre la Tierra.
import { THREE } from '../core/engine.js';
import { model, disposeScene, camera as mkCam } from './cine-kit.js';
import { skySphere, twinkleStars, earth, moon, tickAll } from './space.js';

const own = (o) => { o.traverse((m) => { m.userData.own = true; }); return o; };

export async function makeCineLaika() {
  const [plush, sput] = await Promise.all([model('laika-plush'), model('sputnik-2')]);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const cam = mkCam(34, 4000); cam.near = 0.02; cam.updateProjectionMatrix();
  const sunDir = new THREE.Vector3(0.7, 0.35, 0.6).normalize();
  scene.add(new THREE.AmbientLight(0x1a2230, 0.7));
  const sun = new THREE.DirectionalLight(0xfff4e4, 3.0); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5f86c8, 0.5); fill.position.set(0, -1, -1); scene.add(fill); // luz azul de la Tierra
  scene.add(own(skySphere(1800)), own(twinkleStars(undefined, 1600)));
  const E = own(earth(120, sunDir)); E.position.set(0, -110, -650); E.rotation.z = 0.41; scene.add(E);
  const M = own(moon(9)); M.position.set(-260, 60, 900); scene.add(M); // la Luna se aleja detrás de la cámara
  // perrito de tela en el origen (pivote en la base: lo centramos para que gire sobre sí mismo)
  const laika = new THREE.Group(); laika.name = 'laika'; scene.add(laika);
  const box = new THREE.Box3().setFromObject(plush); const c = box.getCenter(new THREE.Vector3());
  plush.position.sub(c); laika.add(plush);
  // Sputnik 2 a ~45 m sobre la Tierra (fuera de escala, como inserto)
  sput.position.set(-20, 30, -560); sput.rotation.set(0.3, 0.8, 0.5); scene.add(sput);
  const anchors = { laika, sputnik: sput };
  return {
    scene, camera: cam, anchors,
    at(T) {
      laika.rotation.set(Math.sin(T * 0.35) * 0.25, T * 0.22, Math.sin(T * 0.27) * 0.18);
      laika.position.set(Math.sin(T * 0.2) * 0.03, Math.sin(T * 0.31) * 0.025, 0);
      sput.rotation.y = 0.8 + T * 0.05; sput.position.x = -20 + T * 0.4;
    },
    update(dt, t) { tickAll(scene, dt, t); },
    act() {},
    dispose() { disposeScene(scene); },
  };
}
