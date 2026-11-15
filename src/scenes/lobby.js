// Fondo 3D del menú: estrellas que titilan, Tierra, Luna, LM (apollo-lunar-module) orbitando, estrella secreta. Sin galaxias ni astronauta flotante.
import { THREE, model, fit, Q } from '../core/engine.js';
import { skySphere, twinkleStars, earth, moon, glowSprite, tickAll, dotTex } from './space.js';
export function makeLobby() {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 2, 34);
  const sunDir = new THREE.Vector3(-0.6, 0.25, 0.75).normalize();
  scene.add(new THREE.AmbientLight(0x223344, 0.6)); const sl = new THREE.DirectionalLight(0xffffff, 2.6); sl.position.copy(sunDir).multiplyScalar(100); scene.add(sl);
  scene.add(skySphere(), twinkleStars());
  const E = earth(14, sunDir); E.position.set(14, -12, -8); E.rotation.z = 0.41; scene.add(E);
  const M = moon(2.4); M.position.set(26, 14, -40); scene.add(M);
  const sun = glowSprite(0xfff1d0, 60); sun.position.copy(sunDir).multiplyScalar(500); scene.add(sun);
  // estrella secreta (7 clics)
  const secret = glowSprite(0xaee3ff, 4); secret.position.set(-30, 18, -60); scene.add(secret);
  let lm = null; if (!Q.mobile) model('apollo-lunar-module').then((o) => { lm = fit(o, 3.4, { axis: 'max', ground: false }); lm.position.set(9.2, -5.4, 2); scene.add(lm); }).catch((e) => console.warn('lobby-lm', e?.message));
  let disposed = false;
  let mx = 0, my = 0; const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener('pointermove', onMove);
  // raycast para la estrella secreta
  const ray = new THREE.Raycaster(); let clicks = 0, secretGalaxy = null;
  const onClick = (e) => {
    if (e.target.closest?.('button,input,a,.panel,.lang,.tc-btn')) return;
    const v = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(v, camera);
    const p = secret.position.clone().project(camera); const dx = (p.x - v.x) * innerWidth / 2, dy = (p.y - v.y) * innerHeight / 2;
    if (Math.hypot(dx, dy) < 28) { clicks++; secret.scale.setScalar(4 + clicks * 1.4); if (clicks >= 7 && !secretGalaxy) { secretGalaxy = textGalaxy('LOS ORINALEJOS'); secretGalaxy.position.set(-30, 18, -90); scene.add(secretGalaxy); api.onSecret?.(); } }
  };
  addEventListener('pointerdown', onClick);
  const api = {
    scene, camera, onSecret: null,
    update(dt, t) {
      tickAll(scene, dt, t);
      const driftX = Math.sin(t * 0.055) * 1.5, driftY = Math.cos(t * 0.04) * 0.4;
      camera.position.x += (mx * 3 + driftX - camera.position.x) * dt * 0.45;
      camera.position.y += (1.6 + driftY - my * 2 - camera.position.y) * dt * 0.45;
      camera.lookAt(0, 0, -10);
      if (lm) { lm.rotation.y += dt * 0.15; lm.position.y = -5.4 + Math.sin(t * 0.6) * 0.35; lm.rotation.z = Math.sin(t * 0.4) * 0.08; }
      secret.material.opacity = 0.6 + 0.4 * Math.sin(t * 3);
      if (secretGalaxy) secretGalaxy.rotation.y = Math.sin(t * 0.3) * 0.3;
    },
    dispose() { disposed = true; removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onClick); },
  };
  return api;
}
// Texto escrito con estrellas (huevo de pascua)
export function textGalaxy(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '700 46px Jost, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 34);
  const d = x.getImageData(0, 0, 512, 64).data, pts = [], col = [];
  for (let y = 0; y < 64; y += 2) for (let i = 0; i < 512; i += 2) if (d[(y * 512 + i) * 4 + 3] > 128 && Math.random() < 0.6) { pts.push((i - 256) * 0.12 + (Math.random() - .5) * .2, (32 - y) * 0.12 + (Math.random() - .5) * .2, (Math.random() - .5) * 2); const k = Math.random(); col.push(0.7 + k * 0.3, 0.8 + k * 0.2, 1); }
  for (let i = 0; i < 1500; i++) { const r = Math.random() * 40, a = Math.random() * 7; pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.3, (Math.random() - .5) * 4); col.push(0.6, 0.5, 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
