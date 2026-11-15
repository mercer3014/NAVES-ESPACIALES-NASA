// Superficie lunar: terreno según sim/lander.ground, rocas instanciadas, sol bajo con sombras largas, LM, penacho y polvo
import { dbg } from '../core/store.js';
import { THREE, tex, model, fit, Q, renderer, mergeByMaterial, bakeGeometry } from '../core/engine.js';
import { skySphere, twinkleStars, earth, glowSprite, tickAll, dotTex } from './space.js';
import { ground, BOULDERS, PAD } from '../sim/lander.js';
import { lunarEnv } from './astronaut.js';
import { rng } from '../core/util.js';
import { makePlume, makePuffs } from './fx.js';
import { earthshine, regolithLook } from '../render/grade.js';
// Estado previo de renderer.shadowMap.enabled: se guarda al crear la primera superficie viva y se restaura al destruir la última (dispose())
let shadowBase = null, liveScenes = 0;
export function makeMoonSurface({ seed = 7 } = {}) {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
  if (!liveScenes++) shadowBase = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = !Q.mobile || Q.high;
  scene.fog = new THREE.FogExp2(0x030407, 0.00016);
  const sunDir = new THREE.Vector3(-0.95, 0.205, 0.18).normalize(); // ~12° de elevación (Apolo 11: 10–14°) → sombras largas y duras
  scene.add(new THREE.HemisphereLight(0x9aa0b0, 0x2a2a30, 0.38));
  const sun = new THREE.DirectionalLight(0xfff4e6, 4.8); sun.position.copy(sunDir).multiplyScalar(200); scene.add(sun); scene.add(sun.target);
  const es = earthshine(); const earthFill = new THREE.DirectionalLight(new THREE.Color().setRGB(es.color[0], es.color[1], es.color[2]), es.intensity);
  earthFill.position.set(900, 1100, -2600); scene.add(earthFill);
  if (Q.high || !Q.mobile) { sun.castShadow = true; const S = sun.shadow; S.mapSize.set(Q.high ? 2048 : 1024, Q.high ? 2048 : 1024); Object.assign(S.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 600 }); S.bias = -0.0006; S.normalBias = 0.4; }
  scene.add(skySphere(4000)); scene.add(twinkleStars(undefined, 3800));
  const E = earth(46, new THREE.Vector3(-1, 0.1, 0.2).normalize()); E.position.set(900, 1100, -2600); E.rotation.z = 0.4; scene.add(E);
  // terreno
  const W = 2000, Dz = 1400, sx = Q.high ? 400 : 220, sz = Q.high ? 200 : 110;
  const geo = new THREE.PlaneGeometry(W, Dz, sx, sz); geo.rotateX(-Math.PI / 2); geo.translate(-100, 0, 0);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, ground(p.getX(i), p.getZ(i))); geo.computeVertexNormals();
  const map = tex('/tex/regolith.jpg', { repeat: 160 }), nrm = tex('/tex/regolith_n.jpg', { srgb: false, repeat: 160 });
  const terrM = new THREE.MeshStandardMaterial({ map, normalMap: nrm, normalScale: new THREE.Vector2(0.75, 0.75), roughness: 0.97, metalness: 0, color: 0xb9b6b0 });
  terrM.polygonOffset = true; terrM.polygonOffsetFactor = 2; terrM.polygonOffsetUnits = 2; // el tile del artista gana en la franja de solape
  const patchU = { value: new THREE.Vector4(0, 0, -1, 0) }; // (cx, cz, medio lado del hueco, —): el terreno procedural se recorta bajo el tile
  regolithShader(terrM, patchU, sunDir);
  const terr = new THREE.Mesh(geo, terrM);
  terr.receiveShadow = true; scene.add(terr);
  { const fm = tex('/tex/regolith.jpg?far', { repeat: 700 }); const fg = new THREE.PlaneGeometry(30000, 30000, 96, 96); fg.rotateX(-Math.PI / 2); const q = fg.attributes.position;
    for (let i = 0; i < q.count; i++) { const x = q.getX(i), z = q.getZ(i); const inside = x > -1080 && x < 880 && Math.abs(z) < 680; q.setY(i, inside ? -30 : ground(x, z) - 1.5 + 40 * Math.sin(x * 0.0011) * Math.cos(z * 0.0013) * Math.min(1, Math.hypot(x, z) / 3000)); }
    fg.computeVertexNormals(); const far = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: fm, roughness: 1, color: 0xb8b4ac })); scene.add(far); }
  // rocas
  const R = rng(seed); const rockG = new THREE.DodecahedronGeometry(1, 1); { const q = rockG.attributes.position; for (let i = 0; i < q.count; i++) { const f = 0.75 + R() * 0.5; q.setXYZ(i, q.getX(i) * f, q.getY(i) * f * 0.7, q.getZ(i) * f); } rockG.computeVertexNormals(); }
  const nField = Q.high ? 520 : 260, nScat = Q.high ? 260 : 120; const rocks = new THREE.InstancedMesh(rockG, new THREE.MeshStandardMaterial({ color: 0x8a8780, roughness: 0.95, map }), nField + nScat);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(); const rockList = [];
  for (let i = 0; i < nField + nScat; i++) {
    let x, z, s; if (i < nField) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * BOULDERS.r; x = BOULDERS.x + Math.cos(a) * r; z = Math.sin(a) * r * 0.85; s = 0.4 + R() ** 2.2 * 3.2; }
    else { let e2; do { x = -900 + R() * 1600; z = -500 + R() * 1000; e2 = ((x - PAD.x) / 160) ** 2 + (z / 75) ** 2; } while (Math.hypot(x - PAD.x, z) < PAD.r * 2.2 || (e2 < 1 && R() < 0.75 * (1 - e2 * 0.6))); s = 0.2 + R() ** 3 * 1.6; if (e2 < 1) s = Math.min(s, 0.25 + 0.45 * e2); } // elipse de alunizaje: pocas rocas y chicas
    v.set(x, ground(x, z) - s * 0.25, z); qq.setFromEuler(e.set(R() * 0.6, R() * 6.28, R() * 0.6)); sc.set(s, s, s); m4.compose(v, qq, sc); rocks.setMatrixAt(i, m4); rockList.push([x, z, s]);
  }
  rocks.castShadow = true; rocks.receiveShadow = true; scene.add(rocks); occlude(rocks.material);
  // guijarros: miles de piedras de 2–20 cm alrededor del sitio de alunizaje y del recorrido de la EVA (largas sombras con el sol bajo)
  // Se dibujan solo los que quedan a menos de PEB_R del jugador/cámara/LM (se reempaquetan cada ~0.25 s en rockCull), no los 4200 siempre.
  let peb = null; const PEB_R = 42, NP = Q.high ? 4200 : Q.mobile ? 900 : 2000; const pebM = new Float32Array(NP * 16), pebC = new Float32Array(NP * 3), pebX = new Float32Array(NP), pebZ = new Float32Array(NP), pebOn = new Uint8Array(NP).fill(1);
  { const pg = new THREE.IcosahedronGeometry(1, 1); const q = pg.attributes.position; for (let i = 0; i < q.count; i++) { const f = 0.7 + R() * 0.6; q.setXYZ(i, q.getX(i) * f, q.getY(i) * f * 0.6, q.getZ(i) * f); } pg.computeVertexNormals();
    peb = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: 0xaaa69e, roughness: 0.9, map }), NP); const col = new THREE.Color();
    for (let i = 0; i < NP; i++) { const a = R() * Math.PI * 2, r = 2 + Math.pow(R(), 0.7) * 70, x = PAD.x + Math.cos(a) * r, z = Math.sin(a) * r; const s = 0.02 + Math.pow(R(), 3.2) * 0.2;
      v.set(x, ground(x, z) - s * 0.2, z); qq.setFromEuler(e.set(R() * 0.8, R() * 6.28, R() * 0.8)); sc.set(s * (0.8 + R() * 0.5), s, s * (0.8 + R() * 0.5)); m4.compose(v, qq, sc); m4.toArray(pebM, i * 16); pebX[i] = x; pebZ[i] = z; col.setScalar(0.75 + R() * 0.4); col.toArray(pebC, i * 3); peb.setColorAt(i, col); }
    peb.count = 0; peb.frustumCulled = false; peb.castShadow = !Q.mobile; peb.receiveShadow = true; scene.add(peb); occlude(peb.material); }
  // marcador de zona segura
  const pad = new THREE.Group(); const ringM = new THREE.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(PAD.r - 1.2, PAD.r, 64), ringM); ring.rotation.x = -Math.PI / 2; pad.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 400, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); beam.position.y = 200; pad.add(beam);
  pad.position.set(PAD.x, ground(PAD.x) + 0.15, 0); pad.visible = false; scene.add(pad);
  const warn = new THREE.Mesh(new THREE.RingGeometry(BOULDERS.r - 2, BOULDERS.r, 64), new THREE.MeshBasicMaterial({ color: 0xfc3d21, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  warn.rotation.x = -Math.PI / 2; warn.position.set(BOULDERS.x, ground(BOULDERS.x) + 3, 0); warn.visible = false; scene.add(warn);
  // LM
  const lm = new THREE.Group(); scene.add(lm); const body = new THREE.Group(); lm.add(body);
  // LM-5 'Eagle' del artista (escala real 1u=1m, origen en la base, frente/escalera +Z); respaldo: modelo viejo
  const lmEnv = lunarEnv();
  const lmReady = model('apollo-lunar-module').then((o) => {
    o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; const m = c.material; if (m && 'envMap' in m) { m.envMap = lmEnv; m.envMapIntensity = /Gold|Silver|Foil/i.test(m.name) ? 1.1 : 0.55; m.needsUpdate = true; } } });
    if (Q.mobile) { const r = mergeByMaterial(o); console.info('LM merge ' + r.before + '→' + r.after); } // ~30 → ~15 draw calls
    body.add(o); return 'eagle';
  }).catch(() => model('lm').then((o) => { const f = fit(o, 7, { axis: 'y' }); f.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); body.add(f); return 'old'; })).catch(() => 'none');
  // penacho del motor de descenso (DPS): en vacío casi invisible; núcleo tenue, envolvente ancha y azulada por la expansión
  const dps = makePlume({ layout: [[0, 0]], r0: 0.72, len: 3.2, outerR: 1.1, outerLen: 9, hot: [1, 0.93, 0.8], warm: [0.75, 0.62, 0.95], intensity: 1.6, seg: Q.high ? 20 : 12 });
  dps.group.position.y = 1.05; body.add(dps.group); const plume = dps.group;
  const pg = glowSprite(0xffcc88, 7, 0); pg.position.y = 0.6; body.add(pg);
  const contactL = new THREE.PointLight(0x88aaff, 0, 20); contactL.position.y = 4; body.add(contactL);
  // polvo: sin aire no hay nubes; láminas rasantes balísticas que salen en abanico desde debajo del motor (GPU)
  const dust = makePuffs({ n: Q.high ? 2600 : 900, drag: 0.02, lit: true, fadeIn: 0.12, fadeOut: 0.75, near: 2, stretch: 0.9, soft: true, radial: true }); // láminas suaves y translúcidas, a ras del suelo, que se desvanecen con la distancia
  const RAYS = Array.from({ length: 13 }, (_, i) => (i / 13) * 6.283 + Math.sin(i * 7.3) * 0.18); let rayRot = 0;
  dust.U.uFogN.value = 1e8; dust.U.uFogF.value = 2e8; dust.U.uAmb.value.setRGB(0.32, 0.31, 0.3); dust.U.uSunC.value.setRGB(1.25, 1.2, 1.1); scene.add(dust.mesh);
  const _dp = new THREE.Vector3(), _dv = new THREE.Vector3();
  const haze = makeHaze(hAt); scene.add(haze.mesh);
  const S = { thr: 0, agl: 999, burning: false };
  function setLM(x, y, tilt, thr, burning) { lm.position.set(x, y, 0); body.rotation.z = (-tilt * Math.PI) / 180; S.thr = thr; S.burning = burning; S.agl = y - ground(x); }
  // Sombras ajustadas alrededor de un objeto (el astronauta en la EVA): frustum chico = sombras nítidas en el traje
  const F = { obj: null, snap: 0, rim: null }; const _fp = new THREE.Vector3(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 3.5, 0);
  function focus(obj, half = 20) {
    F.obj = obj; if (sun.castShadow) { const S = sun.shadow; Object.assign(S.camera, { left: -half, right: half, top: half, bottom: -half, near: 150, far: 350 }); S.camera.updateProjectionMatrix(); shHalf = half; cullDirty = true; S.mapSize.set(2048, 2048); S.bias = -0.00025; S.normalBias = 0.025; S.radius = 2; S.map?.dispose(); S.map = null; F.snap = (2 * half) / 2048; }
    if (!F.rim) { F.rim = new THREE.DirectionalLight(0xc9d6ff, 1.25); scene.add(F.rim, F.rim.target); }
  }
  function update(dt, t) {
    tickAll(scene, dt, t); const k = S.burning ? S.thr : 0;
    dps.set(k, { vac: 1, t }); pg.material.opacity = k * 0.6; dust.U.uSun.value.copy(sunDir);
    const fp = F.obj ? F.obj.position : lm.position; const sn = F.obj ? F.snap : 0;
    if (sn) { _fp.set(Math.round(fp.x / sn) * sn, Math.round(fp.y / sn) * sn, Math.round(fp.z / sn) * sn); } else _fp.copy(fp);
    sun.target.position.copy(_fp); sun.position.copy(_fp).addScaledVector(sunDir, 250);
    if (F.rim && F.obj) { // luz de contorno opuesta a la cámara (rebote del regolito / reflejo del LM)
      _v.subVectors(fp, camera.position).setY(0).normalize(); F.rim.position.copy(fp).addScaledVector(_v, 10).add(_up); F.rim.target.position.copy(fp);
    }
    // emitir polvo radial bajo 30 m
    const gy = ground(lm.position.x);
    if (S.burning && S.agl < 30 && k > 0.05) { const f = (1 - S.agl / 30) * Math.min(1, k * 2.2), Qk = Q.high ? 1 : 0.45; let n = f * 260 * Qk * dt; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
      const r0 = 1.5 + S.agl * 0.25; // el chorro golpea el suelo en una mancha que crece con la altura
      rayRot += dt * 0.35; n = Math.floor(n * 1.4);
      for (let j = 0; j < n; j++) { // el regolito sale en láminas rasantes: la mayoría a lo largo de unos rayos que giran despacio, el resto disperso
        const ray = Math.random() < 0.55, a = ray ? RAYS[(Math.random() * 13) | 0] + rayRot + (Math.random() - 0.5) * 0.16 : Math.random() * 6.283;
        const rr = Math.random() * r0, sp = (ray ? 26 : 16) + Math.random() * 34 * f; _dp.set(lm.position.x + Math.cos(a) * rr, 0, Math.sin(a) * rr); _dp.y = hAt(_dp.x, _dp.z) + 0.08 + Math.random() * 0.18;
        _dv.set(Math.cos(a) * sp, 0.05 + Math.random() * 0.35, Math.sin(a) * sp); const g = 0.38 + Math.random() * 0.08; // gris pardo
        dust.emit(_dp, _dv, 1.0 + Math.random() * 1.0, { grow: 5, life: 0.8 + Math.random() * 1.0, buoy: -1.62, col: [g, g * 0.9, g * 0.78], a: (ray ? 0.14 : 0.09) + 0.12 * f }); } }
    dust.U.uRad.value.set(lm.position.x, 0, 0, 22 + 26 * Math.min(1, k));
    haze.update(S.burning && S.agl < 30 ? (1 - S.agl / 30) ** 1.5 * Math.min(1, k * 3.6) : 0, dt, lm.position.x);
    occU.a.value.copy(camera.position); occU.b.value.copy(F.obj ? F.obj.position : lm.position).y += 1.5;
    dust.update(dt, camera, null); rockCull(dt);
  }

  // ---------- Superficie del artista: rocas (moon-rocks.glb), tile de regolito 32 m (moon-surface-tile.glb), huella (boot-print.glb) ----------
  // Rocas: cada hijo se des-cuantiza y se recentra en XZ con la base en y=0; se instancian con la misma lista (rockList) de antes.
  const rockKit = model('moon-rocks').then((o) => { o.updateMatrixWorld(true); const kit = {};
    o.traverse((c) => { if (!c.isMesh) return; const g = bakeGeometry(c); g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, 0, -(b.min.z + b.max.z) / 2);
      g.computeBoundingSphere(); occlude(c.material); kit[c.name] = { g, mat: c.material, size: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) }; });
    return kit; });
  const RT = { big: ['rock-01', 'rock-02'], mid: ['rock-02', 'rock-03', 'rock-04'], small: ['rock-03', 'rock-04', 'rock-06', 'rock-10'], tiny: ['rock-05', 'rock-07', 'rock-08', 'rock-09', 'rock-10'] };
  const R2 = rng(seed + 101); const rockPick = rockList.map(([, , s]) => { const set = s > 1.3 ? RT.big : s > 0.65 ? RT.mid : RT.small; return [set[Math.floor(R2() * set.length)], R2() * 6.283]; });
  const extra = []; // rocas chicas sobre el tile [x, z, escala, tipo, yaw]
  let artRocks = null;
  // Rendimiento: cada tipo de roca tiene 2 InstancedMesh (con y sin sombra) con capacidad para todas sus instancias; rockCull() copia a ellos solo las que
  // quedan dentro del radio de visibilidad (crece con el tamaño: los bloques grandes se ven desde lejos, las piedras chicas no) y fija .count.
  // Solo las rocas grandes (semi-tamaño >= SHADOW_MIN) proyectan sombra. La lógica de juego lee rockList (datos), no estas mallas.
  const SHADOW_MIN = 1.3, CULL_BASE = 100, CULL_K = 60; let shHalf = 70; // shHalf: semilado del frustum de la sombra (70 m en el Alunizaje; ~18 m en la EVA, ver focus)
  let cullItems = [], cullGroups = [], cullT = 1, cullAt = null; const cullPrev = new THREE.Vector3(1e9, 0, 1e9), cullPrevF = new THREE.Vector3(1e9, 0, 1e9);
  function layRocks(kit) {
    if (artRocks) { for (const m of artRocks) { m.removeFromParent(); m.dispose(); } }
    const by = {}; const add = (type, x, z, k, yaw) => (by[type] ||= []).push([x, z, k, yaw]);
    rockList.forEach(([x, z, s], i) => { if (i >= rockPick.length) return; const [type, yaw] = rockPick[i]; add(type, x, z, (2 * s) / kit[type].size, yaw); });
    for (const [x, z, k, type, yaw] of extra) add(type, x, z, k, yaw);
    artRocks = []; cullItems = []; cullGroups = []; const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0);
    for (const type in by) { const L = by[type], gr = [[], []]; // gr[0] sin sombra, gr[1] con sombra
      const its = L.map(([x, z, k, yaw]) => { const rad = (k * kit[type].size) / 2; const f = new Float32Array(16); _m.compose(_p.set(x, hAt(x, z) - 0.01 * k, z), _q.setFromAxisAngle(Y, yaw), _s.setScalar(k)).toArray(f); return { f, x, y: f[13], z, rad, big: rad >= SHADOW_MIN }; });
      const mk = (n, sh) => { if (!n) return null; const im = new THREE.InstancedMesh(kit[type].g, kit[type].mat, n); im.castShadow = sh; im.receiveShadow = true; im.frustumCulled = false; im.count = 0; im.visible = false;
        scene.add(im); artRocks.push(im); const g = { im, k: 0 }; cullGroups.push(g); return g; };
      const gNo = mk(its.length, false), gSh = mk(its.filter((o) => o.big).length, true); for (const o of its) { o.gNo = gNo; o.gSh = gSh; cullItems.push(o); } }
    rocks.visible = false; cullAt = null; rockCull(0, true);
  }
  // Reempaqueta las instancias visibles de rocas y guijarros. Distancia: cada ~0.25 s y solo si la cámara o el foco se movieron > 3 m.
  // Frustum: las rocas SIN sombra se descartan además si quedan fuera de la vista (con un margen angular de 4°), y se reempaqueta en cuanto la cámara gira > 3°.
  // Las que proyectan sombra (grandes) y los guijarros solo se descartan por distancia: pueden sombrear la vista desde fuera de ella.
  const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _mi = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _sp = new THREE.Vector3(); let cullDirty = true;
  function rockCull(dt, force) {
    cullT += dt; const rot = _cq.angleTo(camera.quaternion) > 0.05; if (!force && !rot && cullT < 0.25) return;
    const cp = camera.position, fp = F.obj ? F.obj.position : lm.position;
    if (!force && !rot && cullPrev.distanceToSquared(cp) < 9 && cullPrevF.distanceToSquared(fp) < 9 && !cullDirty) { cullT = 0; return; }
    cullT = 0; cullPrev.copy(cp); cullPrevF.copy(fp); _cq.copy(camera.quaternion); cullDirty = false;
    camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix, _mi.copy(camera.matrixWorld).invert()); _fr.setFromProjectionMatrix(_pm); const pl = _fr.planes;
    const cx = cp.x, cz = cp.z, fx = fp.x, fz = fp.z;
    for (const g of cullGroups) g.k = 0;
    for (const o of cullItems) { const R = (CULL_BASE + CULL_K * o.rad) ** 2, dc = (o.x - cx) ** 2 + (o.z - cz) ** 2, df = (o.x - fx) ** 2 + (o.z - fz) ** 2;
      const rs = shHalf + 10 + 7 * o.rad; let g; // proyecta sombra solo si es grande y está lo bastante cerca del foco como para sombrear la zona de la sombra
      if (o.big && df < rs * rs) g = o.gSh; // (sin recorte de vista: puede sombrear desde fuera de ella)
      else { if (dc > R) continue; _sp.set(o.x, o.y, o.z); const m = o.rad * 1.2 + 0.07 * Math.sqrt(dc + (o.y - cp.y) ** 2); let out = false; // dentro de la vista (esfera con margen angular)
        for (let j = 0; j < 6; j++) if (pl[j].distanceToPoint(_sp) < -m) { out = true; break; } if (out) continue; g = o.gNo; }
      const a = g.im.instanceMatrix.array, f = o.f, b = g.k++ * 16; for (let j = 0; j < 16; j++) a[b + j] = f[j]; }
    for (const g of cullGroups) { g.im.count = g.k; g.im.visible = g.k > 0; g.im.instanceMatrix.needsUpdate = true; }
    if (peb) { const a = peb.instanceMatrix.array, c = peb.instanceColor.array, R = PEB_R * PEB_R; let n = 0;
      for (let i = 0; i < NP; i++) { if (!pebOn[i]) continue; const dc = (pebX[i] - cx) ** 2 + (pebZ[i] - cz) ** 2, df = (pebX[i] - fx) ** 2 + (pebZ[i] - fz) ** 2; if (dc > R && df > R) continue;
        const b = n * 16, k = i * 16; for (let j = 0; j < 16; j++) a[b + j] = pebM[k + j]; c[n * 3] = pebC[i * 3]; c[n * 3 + 1] = pebC[i * 3 + 1]; c[n * 3 + 2] = pebC[i * 3 + 2]; n++; }
      peb.count = n; peb.visible = n > 0; peb.instanceMatrix.needsUpdate = true; peb.instanceColor.needsUpdate = true; }
  }
  const rocksReady = rockKit.then((kit) => { layRocks(kit); return kit; }).catch((e) => { console.warn('moon-rocks.glb no disponible', e); return null; });

  // Tile: se lee la grilla de alturas (145×145 vértices, 22 cm) de la propia malla → alturas en CPU para pies, rocas y huellas.
  const P = { on: false, cx: 0, cz: 0, half: 48, fade: 9, H: null, N: 144, h0: 0 };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function tileH(x, z) { // muestreo bilineal con wrap (el tile es periódico)
    const N = P.N, u = (((x + 16) / 32) % 1 + 1) % 1 * N, v = (((z + 16) / 32) % 1 + 1) % 1 * N; const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, H = P.H, r = N + 1;
    const a = H[j * r + i], b = H[j * r + i + 1], c = H[(j + 1) * r + i], d = H[(j + 1) * r + i + 1]; return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
  }
  const wAt = (x, z) => smooth(0, P.fade, P.half - Math.max(Math.abs(x - P.cx), Math.abs(z - P.cz)));
  function hAt(x, z = 0) { const g = ground(x, z); if (!P.on) return g; const w = wAt(x, z); return w > 0 ? g + w * (tileH(x - P.cx, z - P.cz) - P.h0) : g; }
  const _n = new THREE.Vector3();
  function normalAt(x, z, out = _n) { const e = 0.08; return out.set(hAt(x - e, z) - hAt(x + e, z), 2 * e, hAt(x, z - e) - hAt(x, z + e)).normalize(); }
  const tileGltf = model('moon-surface-tile');
  async function lunarPatch(cx, cz = 0) {
    let o; try { o = await tileGltf; } catch (e) { console.warn('moon-surface-tile.glb no disponible', e); return hAt; }
    let src = null; o.traverse((c) => { if (c.isMesh && !src) src = c; }); if (!src) return hAt;
    const base = bakeGeometry(src); const pos = base.attributes.position, nor = base.attributes.normal, N = P.N, r = N + 1; const H = new Float32Array(r * r);
    for (let i = 0; i < pos.count; i++) { const ix = Math.round(((pos.getX(i) + 16) / 32) * N), iz = Math.round(((pos.getZ(i) + 16) / 32) * N); if (ix >= 0 && ix <= N && iz >= 0 && iz <= N) H[iz * r + ix] = pos.getY(i); }
    Object.assign(P, { H, cx, cz, h0: 0 }); P.h0 = tileH(0, 0); P.on = true;
    const mat = src.material; for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) if (t) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const n = Math.round(P.half / 32 - 0.5); // 3×3 tiles (±48 m)
    // Presupuesto de triángulos: el tile completo son ~41k tris. En móvil los 8 vecinos van diezmados (paso 2 → ¼),
    // y en equipos muy modestos (≤4 núcleos o ≤3 GB) paso 4 en vecinos y paso 2 en el central.
    const veryLow = Q.mobile && ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3);
    const low = Q.mobile || !Q.high;
    const sCenter = veryLow ? 2 : 1, sNear = veryLow ? 4 : low ? 2 : 1;
    const vIdx = new Int32Array(r * r).fill(-1);
    for (let i = 0; i < pos.count; i++) { const ix = Math.round(((pos.getX(i) + 16) / 32) * N), iz = Math.round(((pos.getZ(i) + 16) / 32) * N); if (ix >= 0 && ix <= N && iz >= 0 && iz <= N && vIdx[iz * r + ix] < 0) vIdx[iz * r + ix] = i; }
    const uvA = base.attributes.uv, decCache = {};
    const decim = (st) => { if (st === 1) return base; if (decCache[st]) return decCache[st]; const M = Math.floor(N / st), q = M + 1;
      const P3 = new Float32Array(q * q * 3), N3 = new Float32Array(q * q * 3), U2 = new Float32Array(q * q * 2), ix = [];
      for (let b = 0; b <= M; b++) for (let a = 0; a <= M; a++) { const gx = Math.min(N, a * st), gz = Math.min(N, b * st), k = b * q + a, vi = vIdx[gz * r + gx];
        P3[k * 3] = -16 + gx / N * 32; P3[k * 3 + 1] = H[gz * r + gx]; P3[k * 3 + 2] = -16 + gz / N * 32;
        if (vi >= 0) { N3[k * 3] = nor.getX(vi); N3[k * 3 + 1] = nor.getY(vi); N3[k * 3 + 2] = nor.getZ(vi); if (uvA) { U2[k * 2] = uvA.getX(vi); U2[k * 2 + 1] = uvA.getY(vi); } } else { N3[k * 3 + 1] = 1; U2[k * 2] = gx / N; U2[k * 2 + 1] = 1 - gz / N; } }
      for (let b = 0; b < M; b++) for (let a = 0; a < M; a++) { const k = b * q + a; ix.push(k, k + q, k + 1, k + 1, k + q, k + q + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
      if (base.attributes.uv1) g.setAttribute('uv1', g.attributes.uv); g.setIndex(ix); return (decCache[st] = g); };
    let triTotal = 0;
    for (let ti = -n; ti <= n; ti++) for (let tj = -n; tj <= n; tj++) {
      const src0 = decim(ti === 0 && tj === 0 ? sCenter : sNear), nor = src0.attributes.normal;
      const g = src0.clone(), p2 = g.attributes.position, n2 = g.attributes.normal, ox = cx + ti * 32, oz = cz + tj * 32;
      triTotal += (g.index ? g.index.count : p2.count) / 3;
      for (let i = 0; i < p2.count; i++) { const lx = p2.getX(i), lz = p2.getZ(i), wx = ox + lx, wz = oz + lz, ht = p2.getY(i) - P.h0;
        const w = wAt(wx, wz), e = 0.25; p2.setY(i, ground(wx, wz) + w * ht);
        if (w < 1 || Math.abs(ground(wx + e, wz) - ground(wx - e, wz)) > 1e-3) { // pendiente nueva = w·∇h + h·∇w + ∇g (normales sin costuras entre tiles)
          const ny = Math.max(0.05, nor.getY(i)), hx = -nor.getX(i) / ny, hz = -nor.getZ(i) / ny;
          const sx = w * hx + ht * (wAt(wx + e, wz) - wAt(wx - e, wz)) / (2 * e) + (ground(wx + e, wz) - ground(wx - e, wz)) / (2 * e);
          const sz = w * hz + ht * (wAt(wx, wz + e) - wAt(wx, wz - e)) / (2 * e) + (ground(wx, wz + e) - ground(wx, wz - e)) / (2 * e);
          _n.set(-sx, 1, -sz).normalize(); n2.setXYZ(i, _n.x, _n.y, _n.z); } }
      g.translate(ox, 0, oz); g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.name = 'moon-surface-tile'; scene.add(m);
    }
    dbg('plbTileTris', Math.round(triTotal));
    patchU.value.set(cx, cz, P.half - 0.6, 0);
    // guijarros procedurales: fuera dentro del tile (ya trae guijarros en la normal map); en el borde se apoyan en la altura nueva
    if (peb) { for (let i = 0; i < NP; i++) if (Math.max(Math.abs(pebX[i] - cx), Math.abs(pebZ[i] - cz)) < P.half - 1) pebOn[i] = 0; cullDirty = true; }
    // rocas chicas del artista sobre el tile (fuera de la zona plana de 5 m del LM)
    const R3 = rng(seed + 202); const nx = Q.mobile ? 45 : 110;
    for (let i = 0; i < nx; i++) { const a = R3() * 6.283, rr = 6 + Math.pow(R3(), 0.8) * (P.half - 8), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; const big = R3() < 0.12;
      const set = big ? ['rock-03', 'rock-04', 'rock-06'] : RT.tiny; extra.push([x, z, 0.6 + R3() * 0.8, set[Math.floor(R3() * set.length)], R3() * 6.283]); if (big) rockList.push([x, z, 0.3]); }
    const kit = await rocksReady; if (kit) layRocks(kit);
    return hAt;
  }
  // Huellas de bota A7L: decal instanciado orientado a la normal del terreno (punta +Z)
  const bootKit = model('boot-print').then((o) => { let src = null; o.traverse((c) => { if (c.isMesh && !src) src = c; }); const g = bakeGeometry(src);
    const m = src.material.clone(); Object.assign(m, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); return { g, m }; });
  function dispose() { // restaura el flag global de sombras (lo encendían la superficie y la arena aunque el nivel siguiente no las use)
    if (disposed) return; disposed = true; if (!--liveScenes && shadowBase !== null) renderer.shadowMap.enabled = shadowBase;
    for (const m of artRocks || []) { m.removeFromParent(); m.dispose(); } peb?.dispose(); }
  let disposed = false;
  return { dispose, scene, camera, env: lmEnv, lm, lmReady, rocksReady, lunarPatch, hAt, normalAt, bootKit, body, plume, pad, warn, rocks, rockList, terr, sun, sunDir, contactL, setLM, update, focus, haze, dust, dustAmount: () => (S.burning && S.agl < 30 ? (1 - S.agl / 30) * S.thr : 0) };
}

// Regolito: rompe el mosaico de la textura (2ª escala rotada mezclada con ruido), suaviza los bordes de los cráteres
// horneados, añade variación de albedo a gran escala y grano fino + micro-relieve cerca de la cámara.
function regolithShader(m, patchU, sunDir) {
  const look = regolithLook();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPatch = patchU;
    sh.uniforms.uSun = { value: sunDir };
    sh.uniforms.uSurge = { value: look.surge };
    sh.uniforms.uMacro = { value: look.macroAmp };
    sh.uniforms.uGrain = { value: look.grainAmp };
    sh.uniforms.uGain = { value: look.normalGain };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWP; uniform vec4 uPatch; uniform vec3 uSun; uniform float uSurge, uMacro, uGrain, uGain;
float rh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(rh(i), rh(i+vec2(1,0)), f.x), mix(rh(i+vec2(0,1)), rh(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s; }`)
      .replace('#include <map_fragment>', `
  if (max(abs(vWP.x - uPatch.x), abs(vWP.z - uPatch.y)) < uPatch.z) discard;
  vec2 wq = vWP.xz; float camD = length(vWP - cameraPosition);
  vec3 t1 = texture2D(map, vMapUv).rgb;
  vec3 t2 = texture2D(map, mat2(.8,-.6,.6,.8) * wq * 0.0291 + .37).rgb;
  vec3 tc = mix(t1, t2, smoothstep(.35, .65, vn(wq * .045)));
  tc = mix(vec3(.42), tc, .7);
  float macro = .82 + uMacro * fbm(wq * .012) + .08 * (vn(wq * .11) - .5);
  float fade = 1. - smoothstep(6., 40., camD);
  float grain = 1. + fade * (uGrain * (rh(floor(wq * 38.)) - .5) + .08 * (vn(wq * 9.) - .5));
  float surge = pow(clamp(dot(normalize(cameraPosition - vWP), uSun), 0., 1.), 6.);
  diffuseColor.rgb *= tc * macro * grain * (1. + uSurge * surge);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  { float fd = 1. - smoothstep(4., 30., length(vWP - cameraPosition)); vec2 wp = vWP.xz * 3.1;
    float e = .05, h0 = fbm(wp), hx = fbm(wp + vec2(e, 0.)), hz = fbm(wp + vec2(0., e));
    vec3 dn = vec3(-(hx - h0) / e, 0., -(hz - h0) / e) * uGain * fd;
    normal = normalize(normal + (viewMatrix * vec4(dn, 0.)).xyz); }`);
  };
  m.customProgramCacheKey = () => 'regolith4';
}

// Rocas que se interponen entre la cámara y el foco (LM o astronauta), o pegadas a la cámara: se disuelven con un tramado
const occU = { a: { value: new THREE.Vector3(0, -1e6, 0) }, b: { value: new THREE.Vector3(0, -1e6, 0) } };
function occlude(m) {
  if (!m || m.userData.occ) return; m.userData.occ = true; const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { prev?.(sh, r); sh.uniforms.uOccA = occU.a; sh.uniforms.uOccB = occU.b;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOccW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvOccW=(modelMatrix*vec4(transformed,1.)).xyz;\n#ifdef USE_INSTANCING\nvOccW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOccW; uniform vec3 uOccA,uOccB;').replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      { vec3 ab=uOccB-uOccA; float L=length(ab); vec3 d=ab/max(L,1e-3); float tt=clamp(dot(vOccW-uOccA,d),0.,max(L-2.5,0.)); float dd=distance(vOccW,uOccA+d*tt);
        float near=distance(vOccW,uOccA); float k=max(1.-smoothstep(1.2,2.6,dd)*step(0.,L-3.), 1.-smoothstep(2.5,5.,near));
        float n=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))); if(k>n) discard; }`); };
  m.needsUpdate = true;
}
// Velo de polvo a ras del suelo bajo el LM: disco polar que copia el relieve; láminas que corren hacia afuera y tapan el suelo en el contacto
function makeHaze(hAt) {
  const NR = 22, NA = 64, R = 46, pos = new Float32Array((NR + 1) * NA * 3), uv = new Float32Array((NR + 1) * NA * 2), idx = [];
  for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) { const k = i * NA + j; uv[k * 2] = i / NR; uv[k * 2 + 1] = j / NA; }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + ((j + 1) % NA), c = a + NA, d = b + NA; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const U = { uA: { value: 0 }, uT: { value: 0 }, uC: { value: new THREE.Color(0.5, 0.46, 0.4) } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uA,uT; uniform vec3 uC; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float r=vUv.x, a=vUv.y*64.; vec2 p=vec2(a, r*9.-uT*2.6);
        float s=.55*n(p*vec2(.5,1.))+.3*n(p*vec2(1.3,2.3)+3.1)+.15*n(p*vec2(3.,5.)+7.);
        float al=uA*(1.-smoothstep(.15,1.,r))*(.45+.75*s)*smoothstep(0.,.04,r+.02); gl_FragColor=vec4(uC*(.85+.3*s),clamp(al,0.,.9)); }` });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.visible = false; let cx = NaN;
  return { mesh, update(k, dt, x) { U.uT.value += dt; U.uA.value += (k * 0.85 - U.uA.value) * Math.min(1, dt * 3); mesh.visible = U.uA.value > 0.005; if (!mesh.visible) return;
    if (Math.abs(x - cx) > 0.5) { cx = x; for (let i = 0; i <= NR; i++) { const rr = (i / NR) ** 1.4 * R; for (let j = 0; j < NA; j++) { const a = (j / NA) * 6.2832, k3 = (i * NA + j) * 3, px = x + Math.cos(a) * rr, pz = Math.sin(a) * rr;
      pos[k3] = px; pos[k3 + 1] = hAt(px, pz) + 0.25 + 0.5 * (i / NR); pos[k3 + 2] = pz; } } g.attributes.position.needsUpdate = true; } } };
}
