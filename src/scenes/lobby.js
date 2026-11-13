// Fondo 3D del menú: estrellas que titilan, galaxias procedurales, Tierra, Luna, LM flotando, estrella secreta
import { THREE, model, fit, Q, canvas } from '../core/engine.js';
import { store, on } from '../core/store.js';
import { skySphere, twinkleStars, galaxy, earth, moon, glowSprite, tickAll, dotTex } from './space.js';
export function makeLobby() {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
  camera.position.set(0, 2, 34);
  const sunDir = new THREE.Vector3(-0.6, 0.25, 0.75).normalize();
  scene.add(new THREE.AmbientLight(0x223344, 0.6)); const sl = new THREE.DirectionalLight(0xffffff, 2.6); sl.position.copy(sunDir).multiplyScalar(100); scene.add(sl);
  scene.add(skySphere(), twinkleStars());
  const g1 = galaxy({ seed: 3, radius: 70, c1: 0xffe2b0, c2: 0x5a7cff }); g1.position.set(-220, -120, -420); g1.rotation.set(1.1, 0, 0.4); scene.add(g1);
  const g2 = galaxy({ seed: 9, radius: 45, arms: 2, c1: 0xffc0e0, c2: 0x7a5cff, n: Q.high ? 5000 : 2000 }); g2.position.set(240, -40, -500); g2.rotation.set(0.5, 0.3, -0.8); scene.add(g2);
  const g3 = galaxy({ seed: 21, radius: 30, arms: 4, c1: 0xbfefff, c2: 0x3366aa, n: Q.high ? 3000 : 1200 }); g3.position.set(60, 160, -480); g3.rotation.set(1.4, 0.2, 0); scene.add(g3);
  const E = earth(14, sunDir); E.position.set(14, -12, -8); E.rotation.z = 0.41; scene.add(E);
  const M = moon(2.4); M.position.set(26, 14, -40); scene.add(M);
  const sun = glowSprite(0xfff1d0, 60); sun.position.copy(sunDir).multiplyScalar(500); scene.add(sun);
  // estrella secreta (7 clics)
  const secret = glowSprite(0xaee3ff, 4); secret.position.set(-30, 18, -60); scene.add(secret);
  let lm = null; model('lm').then((o) => { lm = fit(o, 3.4, { axis: 'max', ground: false }); lm.position.set(9.2, -5.4, 2); scene.add(lm); }).catch(() => {});
  // astronauta A7L flotando junto al LM, saludando con la bandera del jugador en el hombro (carga diferida)
  let ast = null, offFlag = null, disposed = false; const astT = setTimeout(() => import('./astronaut.js').then((m) => m.makeAstronaut(store.get('flag'))).then((a) => {
    if (disposed) { a.dispose?.(); return; } ast = a; a.root.position.set(12.4, -4.6, 10); a.root.rotation.set(0.15, -0.7, -0.08); scene.add(a.root); offFlag = on('flag', (f) => a.setFlag?.(f)); }).catch(() => {}), 900);
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
      if (ast) { ast.pose(dt, { act: 'wave' }); ast.root.position.y = -4.6 + Math.sin(t * 0.5 + 1) * 0.22; ast.root.rotation.z = -0.08 + Math.sin(t * 0.35) * 0.05; ast.root.rotation.y = -0.7 + Math.sin(t * 0.2) * 0.12; }
      secret.material.opacity = 0.6 + 0.4 * Math.sin(t * 3);
      if (secretGalaxy) secretGalaxy.rotation.y = Math.sin(t * 0.3) * 0.3;
    },
    dispose() { disposed = true; clearTimeout(astT); offFlag?.(); ast?.dispose(); removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onClick); },
  };
  return api;
}
// Texto escrito con estrellas (huevo de pascua)
export function textGalaxy(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '900 46px Orbitron, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 34);
  const d = x.getImageData(0, 0, 512, 64).data, pts = [], col = [];
  for (let y = 0; y < 64; y += 2) for (let i = 0; i < 512; i += 2) if (d[(y * 512 + i) * 4 + 3] > 128 && Math.random() < 0.6) { pts.push((i - 256) * 0.12 + (Math.random() - .5) * .2, (32 - y) * 0.12 + (Math.random() - .5) * .2, (Math.random() - .5) * 2); const k = Math.random(); col.push(0.7 + k * 0.3, 0.8 + k * 0.2, 1); }
  for (let i = 0; i < 1500; i++) { const r = Math.random() * 40, a = Math.random() * 7; pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.3, (Math.random() - .5) * 4); col.push(0.6, 0.5, 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}
