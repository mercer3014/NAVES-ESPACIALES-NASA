// Astronauta A7L del artista (art/export/astronaut-a7l.glb, CC0): rig de 34 huesos, LOD0/LOD1 y 11 clips in place.
// El juego mueve el root (root motion en código) y elige clips con crossfade según el estado de juego.
// Visor dorado con entorno lunar PMREM (sin seis renders extra por frame); FlagPatch = bandera del jugador (3:2, flipY=false).
import { THREE, renderer, modelAnim, getWorld, Q } from '../core/engine.js';
import { renderFlag } from '../ui/flag.js';
import { makeAstronaut as makePrim } from './astronaut_prim.js';

let envTex = null;
// Mapa de entorno lunar: cielo negro, regolito iluminado abajo, sol fuerte y la Tierra
export function lunarEnv() {
  if (envTex) return envTex;
  const s = new THREE.Scene();
  const g = new THREE.SphereGeometry(50, 64, 32); const col = []; const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; const k = y < 0.02 ? Math.min(1, (0.02 - y) * 8) : 0; const c = new THREE.Color(0x010103).lerp(new THREE.Color(0x8c8780), k); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.9).multiplyScalar(40) }));
  sun.position.set(-0.94, 0.3, 0.18).normalize().multiplyScalar(45); s.add(sun);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.55, 1).multiplyScalar(3) }));
  earth.position.set(0.33, 0.4, -0.85).normalize().multiplyScalar(45); s.add(earth);
  // módulo lunar como bloque dorado lejano para reflejos cálidos
  const lm = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.7, 0.3) })); lm.position.set(20, 2, 35); s.add(lm);
  const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(s, 0.02).texture; pm.dispose();
  return envTex;
}

function makeTool(env) {
  const m = new THREE.MeshStandardMaterial({ color: 0xc4c7cc, metalness: 1, roughness: 0.3, envMap: env });
  const tool = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.75, 20), m); handle.position.y = -0.3; tool.add(handle);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.14, 20), new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.8 })); grip.position.y = 0.02; tool.add(grip);
  const pts = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 0.5; pts.push(new THREE.Vector2(Math.sin(a) * 0.06 + 0.002, -Math.cos(a) * 0.05)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 32, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xc4c7cc, metalness: 1, roughness: 0.35, envMap: env, side: THREE.DoubleSide })); bowl.position.y = -0.68; bowl.rotation.x = Math.PI / 2; tool.add(bowl);
  tool.traverse((o) => { o.castShadow = true; }); tool.visible = false; return tool;
}


function flagTex(flag) { const c = document.createElement('canvas'); renderFlag(c, flag || undefined, 768, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 4; return t; }

// estados de juego -> clips. pose(dt, { speed m/s, air, act, k }) con act: climb|step|scoop|hammer|hold|salute|swing|wave|point|fall|null
export async function makeAstronaut(flag, name = '', { commander = false } = {}) {
  flag = flag || undefined;
  const fallback = () => { const a = makePrim(flag, name); a.model = 'fallback'; a.dispose = () => a.root.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); return a; };
  if (new URLSearchParams(location.search).get('astro') === 'prim') return fallback(); // comparación / respaldo
  let g; try { g = await modelAnim('astronaut-a7l'); } catch (e) { console.warn('astronaut-a7l.glb failed, fallback', e); return fallback(); }
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); const src = g.scene; body.add(src);
  const env = lunarEnv(); const fTex = flagTex(flag); let visorM = null; const B = {}, materials = new Map();
  src.traverse((o) => {
    if (o.isBone) B[o.name] = o;
    if (!o.isMesh) return; o.frustumCulled = false;
    // Skeleton clones share materials: isolate patches/reflections and disposal per astronaut.
    if (!materials.has(o.material)) materials.set(o.material, o.material.clone());
    o.material = materials.get(o.material); const nm = o.material?.name;
    if (o.material && 'envMap' in o.material) { o.material.envMap = env; o.material.envMapIntensity = nm === 'GoldVisor' ? 1.8 : 0.6; }
    if (nm === 'GoldVisor') visorM = o.material;
    if (nm === 'FlagPatch') { o.material.map = fTex; o.material.needsUpdate = true; }
    if (nm === 'ClearVisor') o.renderOrder = 2;
    o.castShadow = nm !== 'ClearVisor' && nm !== 'GoldVisor'; o.receiveShadow = nm !== 'ClearVisor';
  });
  const N = (n) => src.getObjectByName(n);
  // Apolo 11 no llevaba franjas de comandante (llegaron con el Apolo 13): solo si se pide explícitamente
  const stripes = N('CommanderStripes'); if (stripes) stripes.visible = !!commander;
  const L0 = N('Astronaut_LOD0'), L1 = N('Astronaut_LOD1');
  let lodHi = null; const setLod = (hi) => { if (hi === lodHi) return; lodHi = hi; if (L0) L0.visible = hi; if (L1) L1.visible = !hi; };
  setLod(!Q.mobile);
  const handR = N('hand-r'), head = N('camera-head');
  // herramienta (cuchara de muestras) en hand-r: el mango corre por −Z local (el eje del mástil es +Z)
  const tool = makeTool(env); if (handR) { tool.rotation.x = Math.PI / 2; tool.position.set(0, 0, 0); handR.add(tool); }
  // clips
  const mixer = new THREE.AnimationMixer(src); const A = {};
  for (const c of g.animations) A[c.name] = mixer.clipAction(c);
  const once = ['first-step', 'kneel-pick-sample', 'plant-flag', 'salute', 'fall-and-get-up', 'point'];
  for (const n of once) if (A[n]) { A[n].setLoop(THREE.LoopOnce, 1); A[n].clampWhenFinished = true; }
  let cur = null, curName = '';
  const play = (n, fade = 0.25, restart = true) => { const a = A[n]; if (!a) return null; if (curName === n) return a; if (restart) a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.play(); if (cur) cur.crossFadeTo(a, fade, false); cur = a; curName = n; return a; };
  play('idle', 0);
  let lastAct = null, stroke = -1, idleT = 0, climbT = 0, lastK = 0; const hp = new THREE.Vector3(), cp = new THREE.Vector3();
  const api = { root, body, tool, bones: B, head, handR, model: 'a7l-v2', ladderStep: 0.25, A, mixer };
  api.pose = (dt, { speed = 0, air = false, act = null, k = 0 } = {}) => {
    dt = Math.min(dt, 0.1); let ts = 1;
    if (act !== lastAct) { if (act === 'hammer') stroke = (stroke + 1) % 3; lastK = 0; }
    tool.visible = act === 'scoop';
    if (act === 'climb') { // escalera: la mano/pie avanza 0.5 m por ciclo de 2 s; bajar = tiempo hacia atrás
      const a = play('climb-ladder', 0.2); if (k < lastK) lastK = 0; const dk = Math.max(0, k - (lastAct === 'climb' ? lastK : 0)); climbT -= dk * (api.ladderStep / 0.5) * a.getClip().duration; const d = a.getClip().duration; a.time = ((climbT % d) + d) % d; a.paused = true; lastK = k; }
    else if (act === 'step') { const a = play('first-step', 0.15); a.paused = true; a.time = Math.min(1, k) * a.getClip().duration; }
    else if (act === 'scoop') { const a = play('kneel-pick-sample', 0.25); a.paused = true; a.time = Math.min(1, k) * a.getClip().duration; }
    else if (act === 'hammer' || act === 'hold') { const a = play('plant-flag', 0.2, curName !== 'plant-flag'); a.paused = true; a.time = stroke < 0 ? 0 : (stroke * 30 + (act === 'hammer' ? Math.min(1, k) * 17 : 22)) / 30; }
    else if (act === 'salute') play('salute', 0.3);
    else if (act === 'wave') play('wave', 0.3);
    else if (act === 'point' || act === 'swing') { const a = play('point', 0.2); ts = act === 'swing' ? 2.2 : 1; if (a) a.paused = false; }
    else if (act === 'fall') play('fall-and-get-up', 0.15);
    else if (air || speed > 1.05) { const a = play('bunny-hop', 0.25, false); a.paused = false; ts = Math.max(0.6, speed / 0.75); }
    else if (speed > 0.08) { const a = play('walk', 0.25, false); a.paused = false; ts = Math.max(0.4, speed / 0.77); }
    else { idleT += dt; if (curName === 'wave' && cur && !act && cur.time > 1.9) { play('idle', 0.4); idleT = 0; } else if (curName !== 'wave') { if (idleT > 9 && lastAct === null) { play('wave', 0.35); } else play('idle', 0.35, false); } }
    if (speed > 0.08 || act) idleT = 0; lastAct = act;
    if (cur && !cur.paused) cur.timeScale = ts; mixer.update(dt);
    // LOD por distancia (LOD1 en móvil o a más de 12 m)
    const camW = getWorld()?.camera; if (camW && !Q.mobile) { root.getWorldPosition(hp); setLod(camW.getWorldPosition(cp).distanceTo(hp) < 12); }
  };
  api.pose(0.016, {});
  // Static lunar PMREM keeps the gold visor reflective without recursively rendering the entire terrain.
  api.setFlag = (f) => { const c = fTex.image; renderFlag(c, f || undefined, 768, 512); fTex.needsUpdate = true; };
  api.dispose = () => { mixer.stopAllAction(); mixer.uncacheRoot(src); fTex.dispose(); for (const m of materials.values()) m.dispose(); tool.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); };
  return api;
}
