// Armas del astronauta en el combate No Canon y sus efectos de impacto.
//  · MARTILLO GEOLÓGICO: el martillo de muestreo de las EVA Apolo (modelo «geo-hammer» de eva-tools.glb, con respaldo
//    procedural). Rápido, alcance corto, daño base. Herramienta histórica.
//  · MAZO: mazo mediano de cabeza octogonal de acero y mango de fibra (procedural). Lento, más alcance y daño, rompe
//    una placa de basalto de un golpe, pero cada golpe gasta O₂. Es parte del sueño (no se llevó a la Luna).
// El golpe es una capa procedural sobre la animación base del astronauta (hombro, codo y torso), así no hace falta
// un clip nuevo en astronaut-a7l.glb. También: estela del golpe, chispas y destello del Guardián al recibir daño.
import { THREE, model } from '../../core/engine.js';
import { lunarEnv } from '../../scenes/astronaut.js';
import { dotTex } from '../../scenes/space.js';

// dur: duración del golpe (s) · hitAt: instante del impacto · reach: alcance relativo · dmg: daño relativo
// plate: daño a placas de basalto (tienen 2) · o2: coste de O₂ por golpe · shake/stop: temblor y congelado del impacto
export const WEAPONS = [
  { id: 'hammer', es: 'MARTILLO GEOL.', en: 'GEO HAMMER', dur: 0.5, hitAt: 0.22, reach: 1, dmg: 1, plate: 1, o2: 0, shake: 0.24, stop: 0.05, up: 2.55, down: 0.8, rate: 1.15 },
  { id: 'mallet', es: 'MAZO', en: 'MALLET', dur: 0.86, hitAt: 0.46, reach: 1.25, dmg: 1.8, plate: 2, o2: 2, shake: 0.55, stop: 0.1, up: 2.85, down: 0.62, rate: 0.8 },
];

const steel = (env, rough = 0.32) => new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: rough, envMap: env, envMapIntensity: 1 });

// Martillo de respaldo (si eva-tools.glb no carga): mango de acero con empuñadura, cabeza con cara plana y pico
function procHammer(env) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.4, 16).translate(0, 0.2, 0), steel(env, 0.28));
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.14, 16).translate(0, 0.07, 0), new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.85 }));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.035).translate(0.02, 0.385, 0), steel(env, 0.36));
  const pick = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.07, 4).rotateZ(Math.PI / 2).translate(-0.065, 0.385, 0), steel(env, 0.36));
  g.add(shaft, grip, head, pick); return g;
}

// Mazo mediano: mango de fibra amarillo con empuñadura negra; cabeza octogonal con caras pulidas y cuerpo pavonado
function makeMallet(env) {
  const g = new THREE.Group();
  const fiber = new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: 0.45, metalness: 0.05, envMap: env, envMapIntensity: 0.4 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.9 });
  const body = new THREE.MeshStandardMaterial({ color: 0x3b3f45, metalness: 0.85, roughness: 0.5, envMap: env, envMapIntensity: 0.8 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.62, 18).translate(0, 0.31, 0), fiber);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.021, 0.2, 18).translate(0, 0.1, 0), rubber);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.06, 18).translate(0, 0.57, 0), rubber);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.17, 8).rotateZ(Math.PI / 2).translate(0, 0.63, 0), body);
  const faceG = new THREE.CylinderGeometry(0.046, 0.052, 0.022, 8).rotateZ(Math.PI / 2);
  const faceL = new THREE.Mesh(faceG, steel(env, 0.22)); faceL.position.set(-0.096, 0.63, 0);
  const faceR = new THREE.Mesh(faceG.clone().rotateZ(Math.PI), steel(env, 0.22)); faceR.position.set(0.096, 0.63, 0);
  g.add(shaft, grip, collar, head, faceL, faceR); return g;
}

// Envuelve el arma en un pivote: empuñadura en el origen, mango por +Y local, cabeza a lo largo de X local
function wrap(obj, scale, headY) {
  const piv = new THREE.Group(); piv.add(obj); obj.position.y -= 0.06; piv.scale.setScalar(scale);
  const head = new THREE.Object3D(); head.position.set(0, headY - 0.06, 0); piv.add(head); piv.userData.head = head;
  piv.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  return piv;
}

export async function makeWeapons(ast) {
  const env = lunarEnv();
  let ham = null;
  try {
    const src = await model('eva-tools'); const o = src.getObjectByName('geo-hammer');
    if (o) { ham = o.clone(true); ham.position.set(0, 0, 0); ham.rotation.set(0, 0, 0); ham.traverse((c) => { if (c.isMesh) { c.material = c.material.clone(); if ('envMap' in c.material) { c.material.envMap = env; c.material.envMapIntensity = 0.9; } } }); }
  } catch (e) { console.warn('eva-tools.glb sin martillo; uso el procedural', e); }
  const list = [wrap(ham || procHammer(env), 1.55, 0.385), wrap(makeMallet(env), 1.3, 0.63)];
  // montaje en la mano derecha: el mango apunta al frente del cuerpo y la cabeza queda vertical (golpe de arriba abajo)
  const hand = ast.handR; ast.root.updateMatrixWorld(true);
  const qBody = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI / 2, 'ZXY'));
  for (const w of list) {
    w.visible = false;
    if (hand) { const hp = hand.getWorldPosition(new THREE.Vector3()); ast.root.worldToLocal(hp); ast.root.add(w); w.position.copy(hp); w.quaternion.copy(qBody); hand.attach(w); }
    else { ast.root.add(w); w.position.set(-0.36, 0.83, 0.12); w.quaternion.copy(qBody); }
  }
  let cur = 0; list[0].visible = true; let pop = 1;
  const api = {
    list, get index() { return cur; }, get def() { return WEAPONS[cur]; }, get obj() { return list[cur]; },
    set(i) { i = ((i % list.length) + list.length) % list.length; if (i === cur) return false; list[cur].visible = false; cur = i; list[cur].visible = true; pop = 0; return true; },
    headWorld(out) { return list[cur].userData.head.getWorldPosition(out); },
    // «pop» al cambiar de herramienta (la saca de la cadera)
    update(dt) { if (pop < 1) { pop = Math.min(1, pop + dt * 5); const s = 0.35 + 0.65 * (1 - Math.pow(1 - pop, 3)) + Math.sin(pop * Math.PI) * 0.12; list[cur].scale.setScalar((cur === 0 ? 1.55 : 1.3) * s); } },
    show(on) { for (let i = 0; i < list.length; i++) list[i].visible = on && i === cur; },
    dispose() { for (const w of list) { w.removeFromParent(); w.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); } },
  };
  return api;
}

// ---------- capa de golpe sobre los huesos ----------
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), va = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
// rota un hueso alrededor de un eje expresado en el espacio del cuerpo (root del astronauta)
function rotBody(root, bone, axis, ang) {
  if (!bone || !bone.parent || !ang) return;
  root.getWorldQuaternion(qa); va.copy(axis).applyQuaternion(qa);
  bone.parent.getWorldQuaternion(qb); va.applyQuaternion(qb.invert());
  qa.setFromAxisAngle(va.normalize(), ang); bone.quaternion.premultiply(qa);
}
const ease = { out: (x) => 1 - (1 - x) * (1 - x), in: (x) => x * x * x, io: (x) => x * x * (3 - 2 * x) };
// k: progreso del golpe 0..1. Fases: carga (brazo atrás y arriba, torso girado), golpe seco, recuperación.
export function swingPose(ast, k, w) {
  const B = ast.bones; const hk = w.hitAt / w.dur, wk = hk * 0.68;
  let arm, elbow, twist, lean;
  if (k < wk) { const e = ease.out(k / wk); arm = w.up * e; elbow = 1.25 * e; twist = -0.42 * e; lean = -0.1 * e; }
  else if (k < hk) { const e = ease.in((k - wk) / (hk - wk)); arm = w.up + (w.down - w.up) * e; elbow = 1.25 - 1.15 * e; twist = -0.42 + 0.7 * e; lean = -0.1 + 0.3 * e; }
  else { const e = ease.io(Math.min(1, (k - hk) / (1 - hk))); arm = w.down * (1 - e); elbow = 0.1 * (1 - e); twist = 0.28 * (1 - e); lean = 0.2 * (1 - e); }
  ast.root.updateMatrixWorld(true);
  rotBody(ast.root, B.Spine1, AY, twist * 0.6); rotBody(ast.root, B.Spine2, AY, twist * 0.4);
  rotBody(ast.root, B.Spine1, AX, lean);
  rotBody(ast.root, B.RightArm, AX, -arm);
  rotBody(ast.root, B.RightForeArm, AX, -elbow);
  rotBody(ast.root, B.LeftArm, AX, -arm * 0.25);
}

// ---------- estela del golpe (cinta aditiva entre la cabeza y el mango) ----------
export function makeTrail(scene) {
  const N = 14, pos = new Float32Array(N * 2 * 3), col = new Float32Array(N * 2 * 3), idx = [];
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 4; m.visible = false; scene.add(m);
  const hist = []; let alpha = 0;
  return {
    // a: punta (cabeza del arma), b: punto del mango; on: si el golpe está en la fase rápida
    push(a, b, on, dt) {
      alpha = on ? 1 : Math.max(0, alpha - dt * 6); if (alpha <= 0) { m.visible = false; hist.length = 0; return; }
      hist.unshift([a.x, a.y, a.z, b.x, b.y, b.z]); if (hist.length > N) hist.length = N; m.visible = hist.length > 1;
      for (let i = 0; i < N; i++) { const h = hist[Math.min(i, hist.length - 1)]; pos.set(h, i * 6); const f = alpha * Math.max(0, 1 - i / (hist.length || 1)); col.set([f * 1, f * 0.86, f * 0.62, f * 0.15, f * 0.13, f * 0.1], i * 6); }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    },
    dispose() { m.removeFromParent(); g.dispose(); m.material.dispose(); },
  };
}

// ---------- chispas (puntos aditivos con gravedad lunar) ----------
export function makeSparks(scene, ground) {
  const N = 260, p = new Float32Array(N * 3), v = new Float32Array(N * 3), c = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N); let k = 0;
  for (let i = 0; i < N; i++) p[i * 3 + 1] = -999;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts);
  const tint = new THREE.Color();
  return {
    // n chispas desde (x,y,z); sp: velocidad; hue: 'amber' (metal contra basalto) | 'white' (destello) | 'blue'
    burst(x, y, z, n = 24, sp = 6, hue = 'amber') {
      for (let j = 0; j < n; j++) { const i = (k = (k + 1) % N); const a = Math.random() * 6.283, el = Math.random() * 1.2 - 0.15, s = sp * (0.35 + Math.random() * 0.75);
        p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; v[i * 3] = Math.cos(a) * Math.cos(el) * s; v[i * 3 + 1] = Math.sin(el) * s + 1.5; v[i * 3 + 2] = Math.sin(a) * Math.cos(el) * s;
        life[i] = max[i] = 0.35 + Math.random() * 0.55;
        if (hue === 'white') tint.setRGB(1, 0.97, 0.9); else if (hue === 'blue') tint.setRGB(0.55, 0.85, 1); else tint.setRGB(1, 0.55 + Math.random() * 0.35, 0.15 + Math.random() * 0.15);
        c[i * 3] = tint.r; c[i * 3 + 1] = tint.g; c[i * 3 + 2] = tint.b; }
    },
    update(dt) {
      for (let i = 0; i < N; i++) { if (life[i] <= 0) continue; life[i] -= dt; const f = Math.max(0, life[i] / max[i]);
        v[i * 3 + 1] -= 1.62 * 2.5 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
        const gy = ground(p[i * 3], p[i * 3 + 2]); if (p[i * 3 + 1] < gy) { p[i * 3 + 1] = gy; v[i * 3 + 1] *= -0.35; v[i * 3] *= 0.6; v[i * 3 + 2] *= 0.6; }
        if (life[i] <= 0) p[i * 3 + 1] = -999; else { c[i * 3] *= 0.6 + 0.4 * f; c[i * 3 + 1] *= 0.55 + 0.45 * f; c[i * 3 + 2] *= 0.5 + 0.5 * f; } }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    },
    dispose() { pts.removeFromParent(); g.dispose(); pts.material.dispose(); },
  };
}

// ---------- destello del Guardián al recibir daño (emisivo de todos sus materiales salvo los «vivos») ----------
const LIVE = new Set(['crack-amber', 'dsky-digits', 'fuel-gauge']);
export function makeHitFlash(g) {
  const mats = (g.mats || []).filter((m) => m.emissive && !LIVE.has(m.name)).map((m) => ({ m, e: m.emissive.clone(), i: m.emissiveIntensity ?? 1 }));
  const hot = new THREE.Color(1, 0.78, 0.45); let t = 0, last = -1;
  return {
    hit(k = 1) { t = Math.max(t, k); },
    update(dt) { if (t <= 0 && last === 0) return; t = Math.max(0, t - dt * 5); const f = t * t; last = f;
      for (const o of mats) { o.m.emissive.copy(o.e).lerp(hot, Math.min(1, f)); o.m.emissiveIntensity = o.i + f * 1.6; } },
  };
}
