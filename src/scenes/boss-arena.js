// Arena del jefe No Canon «El Guardián de Tranquilidad» (sueño de Aldrin, escena 6.1B/6.1C del guion).
// Carga boss-arena.glb (suelo Ø60 m, rim-1..8, boulder-1..5), guardian.glb (20 huesos; idle/sweep/slam),
// fx-meshes.glb (impact-ring, heat-ring, dust-puff) y el LM «Eagle». Nodos con nombre = pivotes con hijo '<nombre>-geo'.
import { THREE, model, modelAnim, Q, renderer, fit } from '../core/engine.js';
import { skySphere, twinkleStars, earth, dotTex } from './space.js';
import { lunarEnv } from './astronaut.js';

export const ARENA = { r: 27, lm: new THREE.Vector3(0, 0, 21.5) };
// Instante (s) del clip «slam» del guardian.glb en que las manos tocan el suelo (frame 37 a 30 fps). Lo usan el aviso, el avance y el aturdimiento del jefe.
export const SLAM_HIT = 1.2333;

export async function makeBossArena() {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
  const prevShadow = renderer.shadowMap.enabled; // se restaura al salir de la arena
  renderer.shadowMap.enabled = !Q.mobile || Q.high;
  scene.fog = new THREE.FogExp2(0x05060a, 0.0035);
  const sunDir = new THREE.Vector3(-0.9, 0.3, 0.32).normalize(); // sol bajo: sombras largas, imprescindibles para distinguir el clon real
  scene.add(new THREE.HemisphereLight(0x9aa0b0, 0x23232a, 0.42));
  const sun = new THREE.DirectionalLight(0xfff4e6, 4.6); sun.position.copy(sunDir).multiplyScalar(120); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; { const S = sun.shadow; const n = Q.mobile ? 1024 : 2048; S.mapSize.set(n, n); Object.assign(S.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 320 }); S.bias = -0.0006; S.normalBias = 0.35; }
  const amber = new THREE.PointLight(0xffa040, 0, 40, 1.6); scene.add(amber); // luz ámbar de las grietas (única luz de relleno)
  scene.add(skySphere(3000)); scene.add(twinkleStars(undefined, 2800));
  const E = earth(30, new THREE.Vector3(-1, 0.1, 0.2).normalize()); E.position.set(700, 700, -1900); scene.add(E);
  const env = lunarEnv();
  const shade = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; const m = c.material; if (m && 'envMap' in m) { m.envMap = env; m.envMapIntensity = 0.4; } } });

  // ---------- arena ----------
  const arena = await model('boss-arena').catch((e) => { console.warn('boss-arena.glb no disponible', e); return null; });
  const colliders = []; // [x, z, r]
  let floor = null;
  if (arena) {
    shade(arena); scene.add(arena); arena.updateMatrixWorld(true);
    floor = arena.getObjectByName('arena-floor-geo') || arena.getObjectByName('arena-floor');
    for (let i = 1; i <= 5; i++) { const b = arena.getObjectByName('boulder-' + i); if (!b) continue; const bb = new THREE.Box3().setFromObject(b), c = new THREE.Vector3(), s = new THREE.Vector3(); bb.getCenter(c); bb.getSize(s); colliders.push([c.x, c.z, Math.max(s.x, s.z) * 0.5 + 0.35]); }
  } else {
    floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8c8780, roughness: 1 })); floor.receiveShadow = true; scene.add(floor);
  }
  // altura del suelo: rejilla muestreada una vez con rayos (el suelo del artista tiene un cuenco suave)
  const N = 64, SPAN = 70, hgt = new Float32Array((N + 1) * (N + 1)); { const rc = new THREE.Raycaster(), o = new THREE.Vector3(), d = new THREE.Vector3(0, -1, 0); const targets = floor ? [floor] : [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { o.set(-SPAN / 2 + (i / N) * SPAN, 60, -SPAN / 2 + (j / N) * SPAN); rc.set(o, d); const hit = targets.length ? rc.intersectObjects(targets, true)[0] : null; hgt[j * (N + 1) + i] = hit ? hit.point.y : 0; } }
  const ground = (x, z) => { const fx = Math.min(N - 1e-3, Math.max(0, ((x + SPAN / 2) / SPAN) * N)), fz = Math.min(N - 1e-3, Math.max(0, ((z + SPAN / 2) / SPAN) * N)); const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const a = hgt[j * (N + 1) + i], b = hgt[j * (N + 1) + i + 1], c = hgt[(j + 1) * (N + 1) + i], e = hgt[(j + 1) * (N + 1) + i + 1]; return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v; };

  // puntos de aparición desde los empties del glb (con respaldo a los valores fijos de siempre)
  const sp = arena?.getObjectByName('spawn-player'), sg = arena?.getObjectByName('spawn-guardian'); const wp = (o) => o.getWorldPosition(new THREE.Vector3());
  const spawns = { player: sp ? { x: wp(sp).x, z: wp(sp).z } : { x: 0, z: -18 }, guardian: sg ? { x: wp(sg).x, z: wp(sg).z } : { x: 0, z: 4 } };

  // ---------- Eagle en el borde (frente/escalera +Z → mira al centro) ----------
  const lm = new THREE.Group(); lm.position.set(ARENA.lm.x, ground(ARENA.lm.x, ARENA.lm.z), ARENA.lm.z); lm.rotation.y = Math.PI; scene.add(lm);
  model('apollo-lunar-module').then((o) => { shade(o); lm.add(o); }).catch(() => model('lm').then((o) => { const f = fit(o, 7); shade(f); lm.add(f); })).catch(() => {});
  colliders.push([lm.position.x, lm.position.z, 4.3]);
  const hatch = new THREE.Vector3(lm.position.x, lm.position.y + 3.3, lm.position.z - 2.47);
  const hatchGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0xff3a20, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  hatchGlow.position.copy(hatch).add(new THREE.Vector3(0, 0, -0.05)); scene.add(hatchGlow);

  // ---------- fx-meshes: plantillas ----------
  const fxSrc = await model('fx-meshes').catch(() => null);
  const fxTpl = {};
  for (const n of ['impact-ring', 'heat-ring', 'dust-puff']) {
    const p = fxSrc?.getObjectByName(n); if (p) { p.position.set(0, 0, 0); fxTpl[n] = p; continue; }
    // respaldo procedural (radio 1 m)
    const g = n === 'dust-puff' ? new THREE.IcosahedronGeometry(1, 1) : new THREE.RingGeometry(0.86, 1, 48).rotateX(-Math.PI / 2);
    const grp = new THREE.Group(); grp.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: n === 'heat-ring' ? 0xff7a20 : n === 'impact-ring' ? 0xff2a1a : 0xbdb6aa }))); fxTpl[n] = grp;
  }
  const fx = (name, { color, opacity = 0.85, additive = true } = {}) => {
    const o = fxTpl[name].clone(true);
    o.traverse((c) => { if (!c.isMesh) return; c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = opacity; c.material.depthWrite = false; if (additive) c.material.blending = THREE.AdditiveBlending; if (color != null) { c.material.color?.set(color); if (c.material.emissive) c.material.emissive.set(color); } c.castShadow = false; c.receiveShadow = false; c.renderOrder = 3; });
    o.setOpacity = (a) => o.traverse((c) => { if (c.isMesh) c.material.opacity = a; });
    o.dispose = () => o.traverse((c) => { if (c.isMesh) c.material.dispose(); });
    return o;
  };

  // ---------- polvo (partículas) ----------
  const ND = 900, dp = new Float32Array(ND * 3), dv = new Float32Array(ND * 3), dl = new Float32Array(ND); let di = 0; for (let i = 0; i < ND; i++) dp[i * 3 + 1] = -999;
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.22, map: dotTex(), color: 0xcfc6b8, transparent: true, opacity: 0.85, depthWrite: false })); dust.frustumCulled = false; scene.add(dust);
  let dustG = 1.62;
  const puff = (x, y, z, n = 20, sp = 2, up = 1.5, life = 2) => { for (let k = 0; k < n; k++) { const i = (di = (di + 1) % ND); const a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); dp[i * 3] = x; dp[i * 3 + 1] = y; dp[i * 3 + 2] = z; dv[i * 3] = Math.cos(a) * v; dv[i * 3 + 1] = up * (0.3 + Math.random()); dv[i * 3 + 2] = Math.sin(a) * v; dl[i] = life * (0.6 + Math.random() * 0.6); } };
  const updDust = (dt) => { for (let i = 0; i < ND; i++) { if (dl[i] <= 0) continue; dl[i] -= dt; dv[i * 3 + 1] -= dustG * dt; dp[i * 3] += dv[i * 3] * dt; dp[i * 3 + 1] += dv[i * 3 + 1] * dt; dp[i * 3 + 2] += dv[i * 3 + 2] * dt; if (dl[i] <= 0 || dp[i * 3 + 1] < ground(dp[i * 3], dp[i * 3 + 2]) - 0.05) { dl[i] = 0; dp[i * 3 + 1] = -999; } } dg.attributes.position.needsUpdate = true; };

  // ---------- Guardián ----------
  async function loadGuardian() {
    const g = await modelAnim('guardian');
    const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); inner.add(g.scene);
    const mats = new Map();
    g.scene.traverse((c) => { if (!c.isMesh) return; c.frustumCulled = false; c.castShadow = true; c.receiveShadow = true; if (!mats.has(c.material)) mats.set(c.material, c.material.clone()); c.material = mats.get(c.material); });
    const M = {}; for (const m of mats.values()) M[m.name] = m;
    const nodes = {}; for (const n of ['guardian', 'core-dsky', 'fuel-tank', 'plate-shoulder-l', 'plate-shoulder-r', 'plate-knee-l', 'plate-knee-r', 'hand-l', 'hand-r', 'head', 'hips']) nodes[n] = g.scene.getObjectByName(n);
    const mixer = new THREE.AnimationMixer(g.scene); const A = {};
    for (const c of g.animations) A[c.name] = mixer.clipAction(c);
    for (const n of ['sweep', 'slam']) if (A[n]) { A[n].setLoop(THREE.LoopOnce, 1); A[n].clampWhenFinished = true; }
    // orientar: el frente es donde está el núcleo DSKY → +Z del grupo exterior
    A.idle?.play(); mixer.update(0); outer.updateMatrixWorld(true);
    const cp = new THREE.Vector3(); nodes['core-dsky']?.getWorldPosition(cp); inner.rotation.y = -Math.atan2(cp.x, cp.z); outer.updateMatrixWorld(true);
    // medir dónde golpean las manos en el impacto del slam (SLAM_HIT ≈ 1,23 s) en coordenadas locales del Guardián
    const slamLocal = new THREE.Vector3(0, 0, 7);
    if (A.slam) { A.idle.stop(); A.slam.reset().play(); A.slam.time = SLAM_HIT; mixer.update(0); outer.updateMatrixWorld(true); const a = new THREE.Vector3(), b = new THREE.Vector3(); nodes['hand-l']?.getWorldPosition(a); nodes['hand-r']?.getWorldPosition(b); slamLocal.copy(a).add(b).multiplyScalar(0.5); slamLocal.y = 0; A.slam.stop(); A.idle.reset().play(); mixer.update(0); }
    const base = { crack: M['crack-amber']?.emissive?.clone(), digits: M['dsky-digits']?.emissive?.clone() };
    const bb = new THREE.Box3().setFromObject(outer), bs = new THREE.Vector3(); bb.getSize(bs); const radius = Math.max(bs.x, bs.z) * 0.5, height = bs.y; // volumen para la cámara
    const api = { root: outer, model: g.scene, radius, height, mixer, A, M, nodes, slamLocal, base, mats: [...mats.values()] };
    let cur = A.idle;
    api.play = (n, fade = 0.25) => { const a = A[n]; if (!a) return null; if (a === cur && n === 'idle') return a; a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.timeScale = 1; a.paused = false; a.play(); if (cur && cur !== a) cur.crossFadeTo(a, fade, false); cur = a; return a; };
    api.current = () => cur;
    api.handWorld = (side, out) => { const n = nodes['hand-' + side]; return n ? n.getWorldPosition(out) : out.copy(outer.position); };
    api.setShadow = (on) => g.scene.traverse((c) => { if (c.isMesh) c.castShadow = on; });
    api.setOpacity = (a) => { for (const m of api.mats) { m.transparent = a < 1; m.opacity = a; m.depthWrite = a > 0.6; } };
    api.dispose = () => { mixer.stopAllAction(); mixer.uncacheRoot(g.scene); for (const m of api.mats) m.dispose(); };
    return api;
  }

  const update = (dt) => { updDust(dt); };
  return { scene, camera, spawns, sun, sunDir, amber, ground, colliders, lm, hatch, hatchGlow, fx, puff, setDustGravity: (v) => (dustG = v), loadGuardian, update, env,
    dispose() { renderer.shadowMap.enabled = prevShadow; scene.traverse((o) => { if (o.isMesh || o.isPoints) { o.geometry?.dispose?.(); } }); dg.dispose(); } };
}
