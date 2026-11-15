// Cap. 6.4 · «El reencuentro» (21 jul 1969, 21:35 UTC, órbita lunar): Collins acopla Columbia con la etapa de ascenso de
// Eagle (minijuego docking.js) y, ya dentro, la escotilla se abre: polvo lunar, cajas de muestras y la decisión del abrazo.
// Mundos propios: órbita (csm-columbia + apollo-lunar-module sin la etapa de descenso) e interior (cm-interior + civiles).
import { THREE, model, modelAnim, setWorld } from '../../core/engine.js';
import { show } from '../../ui/router.js';
import { music } from '../../core/audio.js';
import { skySphere, twinkleStars, moon, tickAll } from '../../scenes/space.js';
import { envMap } from '../../scenes/cine-kit.js';
import { playA11 } from '../../audio/a11-voice.js';
import { runDocking } from './docking.js';
import { runCine, character, tx } from './cine.js';
import { ask } from './decisions.js';
import { chose } from './state.js';

const TITLE = ['CAP. 6 · EL REENCUENTRO', 'CH. 6 · THE REUNION'];

export default async function reunion() {
  let res = { skipped: false };
  try { res.docking = await dockPart(); } catch (e) { console.error('reencuentro: acople', e); }
  try { const r = await hatchPart(); res = { ...res, ...r }; } catch (e) { console.error('reencuentro: escotilla', e); res.skipped = true; }
  return res;
}

const metal = (o) => { const env = envMap(); o.traverse((m) => { if (m.isMesh && m.material && 'envMap' in m.material) { m.material = m.material.clone(); m.material.envMap = env; m.material.envMapIntensity = 0.55; } }); };

async function dockPart() {
  show('<div class="screen"></div>', 'story-reunion');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 30000);
  const sunDir = new THREE.Vector3(0.6, 0.45, 0.65).normalize();
  const sun = new THREE.DirectionalLight(0xfff3e2, 3.2); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun, new THREE.AmbientLight(0x1b2230, 0.5));
  const moonFill = new THREE.DirectionalLight(0x8e8a80, 0.6); moonFill.position.set(0, -1, 0); scene.add(moonFill); // luz reflejada de la Luna desde abajo
  const sky = skySphere(9000); scene.add(sky, twinkleStars(undefined, 8500));
  const M = moon(3200); M.position.set(0, -3600, -600); M.userData.tick = null; scene.add(M); // la superficie gris debajo de Eagle
  const [lmG, csm] = await Promise.all([modelAnim('apollo-lunar-module').catch(() => null), model('csm-columbia').catch(() => null)]);
  const lm = lmG?.scene || new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0xb9b2a0, metalness: 0.6, roughness: 0.5 }));
  const desc = lm.getObjectByName?.('DescentStage'); if (desc) desc.visible = false; // solo vuelve la etapa de ascenso
  metal(lm); scene.add(lm);
  const asc = lm.getObjectByName?.('AscentStage') || lm; lm.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(asc); const yTop = box.max.y - 0.15; // cono de acople sobre la escotilla superior
  let ship = csm; if (!ship) { ship = new THREE.Mesh(new THREE.ConeGeometry(1.95, 3.2, 24), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.8, roughness: 0.35 })); }
  else metal(ship);
  ship.rotation.x = Math.PI; scene.add(ship); // invertido: la sonda (+Y del CSM) apunta hacia Eagle
  const PROBE = 0.54; const look = new THREE.Vector3(0, yTop, 0);
  let roll = 0;
  const place = (S) => {
    ship.position.set(S.x, yTop + PROBE + Math.max(0, S.range), S.y);
    cam.position.set(ship.position.x + 1.25, ship.position.y - 0.25, ship.position.z + 1.05); // ventana lateral, mirando hacia abajo
    cam.up.set(0, 0, -1); cam.lookAt(look);
  };
  const world = { scene, camera: cam, update(dt, t) { roll += dt; lm.rotation.y = Math.sin(roll * 0.08) * 0.05; sky.position.copy(cam.position); tickAll(scene, dt, t); },
    resize() { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); } };
  const S0 = { range: 16, x: 1.1, y: 0.8 }; place(S0); setWorld(world);
  const planB = chose('c6-collins') === 'work';
  const r = await runDocking({
    range0: S0.range, x0: S0.x, y0: S0.y, skippable: true,
    tolClose: planB ? 0.45 : 0.3, tolLat: planB ? 0.4 : 0.25, maxAttempts: planB ? 4 : 3,
    title: ['ÓRBITA LUNAR · 21:35 UTC · COLUMBIA ← EAGLE', 'LUNAR ORBIT · 21:35 UTC · COLUMBIA ← EAGLE'],
    note: planB ? ['Recalculaste el encuentro durante el silencio: tienes un plan B y más margen.', 'You recomputed the rendezvous during the silence: you have a plan B and more margin.']
      : ['Eagle sube brillante sobre la superficie gris. Tráelos a casa, Mike.', 'Eagle rises, bright over the grey surface. Bring them home, Mike.'],
    apply: (S) => place(S),
  });
  if (!r.ok) {
    // el acople se completa igual: la historia no cambia (Collins acopló sin problemas)
    const S = { range: 0, x: 0, y: 0 }; place(S);
  }
  return r;
}

async function hatchPart() {
  show('<div class="screen"></div>', 'story-reunion-hatch');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070b);
  const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.02, 200);
  const cab = await model('cm-interior').catch(() => null);
  let c = new THREE.Vector3(0, 0, 0), top = 1.4;
  if (cab) cab.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.material)) if (mat && /^CMI-(Pared|Mamparo)/.test(mat.name)) { mat.side = THREE.DoubleSide; mat.needsUpdate = true; } }); // G4
  if (cab) { metal(cab); scene.add(cab); cab.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(cab); b.getCenter(c); top = b.max.y; }
  scene.add(new THREE.AmbientLight(0x3a3a44, 1.1), new THREE.HemisphereLight(0xfff0dc, 0x202430, 0.7));
  const lamp = new THREE.PointLight(0xffe2b8, 4, 6, 1.6); lamp.position.set(c.x, c.y + 0.6, c.z + 0.4); scene.add(lamp);
  const sunBeam = new THREE.SpotLight(0xfff4e4, 6, 8, 0.35, 0.6); sunBeam.position.set(c.x + 1.2, top, c.z + 0.6); sunBeam.target.position.copy(c); scene.add(sunBeam, sunBeam.target);
  // tres hombres flotando (gravedad cero): Collins espera; Armstrong y Aldrin bajan por el túnel
  const load = (n, at, yaw) => character(n, 'idle', { at, yaw }).catch(() => null);
  const [col, arm, ald] = await Promise.all([
    load('collins-vuelo', [c.x - 0.45, c.y - 1.05, c.z - 0.15], 0.5),
    load('armstrong-vuelo', [c.x + 0.05, top + 0.6, c.z], Math.PI),
    load('aldrin-vuelo', [c.x + 0.35, top + 1.9, c.z + 0.1], Math.PI + 0.3),
  ]);
  const crew = [col, arm, ald].filter(Boolean); crew.forEach((k) => scene.add(k.root));
  const yArm = c.y - 0.85, yAld = c.y - 0.95; let hug = 0, saidThere = false;
  const world = { scene, camera: cam, update(dt) { crew.forEach((k) => k.update(dt)); }, resize() { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); } };
  const P = (dx, dy, dz) => [c.x + dx, c.y + dy, c.z + dz];
  let choice = null;
  const r = await runCine({
    id: 'reunion', world, title: TITLE, minHold: 16,
    shots: [
      { d: 6, pos: P(0.75, -0.55, 0.95), look: [c.x, top, c.z], fov: 62, to: { pos: P(0.6, -0.45, 0.8), look: [c.x, top - 0.2, c.z], fov: 56 } }, // Collins mira el túnel
      { d: 7, pos: P(-0.6, 0.1, 0.55), look: P(0, -0.2, 0), fov: 58, to: { pos: P(-0.5, 0.05, 0.5), look: P(0, -0.25, 0), fov: 52 } },
      { d: 30, pos: P(0.15, 0.1, 0.72), look: P(-0.05, -0.35, 0), fov: 50, to: { pos: P(0.12, 0.08, 0.66), look: P(-0.05, -0.35, 0), fov: 46 } },
    ],
    lines: [
      { at: 0.4, who: 'COLLINS', text: ['Ahí están. Ahí están los dos.', 'There they are! There they both are!'] },
      { at: 4.2, who: '', text: ['La escotilla se abre. Llega un olor a pólvora quemada: el polvo lunar. Detrás, las cajas de muestras.', 'The hatch opens. A smell of spent gunpowder drifts in: lunar dust. Behind it, the sample boxes.'] },
      { at: 9.5, who: 'COLLINS', text: ['Vengan acá.', 'Come here, you two.'] },
    ],
    step(dt, T) {
      if (!saidThere && T > 0.4) { saidThere = true; playA11('voz_en_clonada/c6_64_collins_ahi_estan_en'); }
      if (T > 9.5 && T - dt <= 9.5) playA11('voz_en_clonada/c6_64_collins_vengan_aca_en');
      const k = Math.min(1, Math.max(0, (T - 3.5) / 5)), e = k * k * (3 - 2 * k);
      if (arm) arm.root.position.y = top + 0.6 + (yArm - top - 0.6) * e;
      if (ald) ald.root.position.y = top + 1.9 + (yAld - top - 1.9) * Math.min(1, Math.max(0, (T - 5) / 5.5));
      crew.forEach((k2, i) => { k2.root.rotation.z = Math.sin(T * 0.6 + i * 2) * 0.06; k2.root.rotation.x = Math.sin(T * 0.45 + i) * 0.04; });
      if (hug > 0) { hug = Math.min(1, hug + dt * 0.6); const h = hug * hug * (3 - 2 * hug);
        if (col) { col.root.position.x = c.x - 0.45 + 0.25 * h; col.root.position.y = c.y - 1.05 + 0.1 * h; }
        if (arm) arm.root.position.x = c.x + 0.05 - 0.12 * h; if (ald) ald.root.position.x = c.x + 0.35 - 0.2 * h; }
    },
    async interactive(S) {
      await new Promise((r2) => { const t0 = performance.now(); const w = () => (S.done || S.t > 11.5 || performance.now() - t0 > 20000 ? r2() : requestAnimationFrame(w)); w(); });
      if (S.done) return;
      choice = await ask('c6-reunion'); if (S.done) return;
      if (choice === 'hug') {
        hug = 0.001; col?.play('wave'); music('a11/music/mus_tema_principal_completo', { vol: 0.5, fade: 1500 });
        S.subtitle('', tx(['Collins los abraza a los dos. Por primera vez en ocho días, nadie dice nada técnico.', 'Collins hugs them both. For the first time in eight days, nobody says anything technical.']));
      } else {
        arm?.play('wave');
        S.subtitle('COLLINS', tx(['Bienvenidos a bordo. Y no toquen nada: vienen cubiertos de polvo lunar.', 'Welcome aboard. And don’t touch anything: you’re covered in moon dust.']));
      }
      await new Promise((r2) => setTimeout(r2, 5200)); if (S.done) return;
      S.subtitle('', tx(['Eagle se abandona en órbita lunar. Aldrin lo mira alejarse por la ventana.', 'Eagle is cast off in lunar orbit. Aldrin watches it drift away through the window.']));
      await new Promise((r2) => setTimeout(r2, 4200));
    },
  });
  crew.forEach((k) => scene.remove(k.root)); if (cab) scene.remove(cab);
  return { skipped: !!r?.skipped, choice };
}

