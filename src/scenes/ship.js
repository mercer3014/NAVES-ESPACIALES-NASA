// Nave Apolo procedural (CSM + LM acoplado) y escena de crucero (Tierra, Luna, galaxias, sol)
import { THREE, model, modelAnim, fit, Q, renderer } from '../core/engine.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { skySphere, twinkleStars, galaxy, earth, moon, glowSprite, tickAll, dotTex } from './space.js';
import { makePost } from './fx.js';
import { isTouch } from '../core/store.js';
export function makeCSM() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 0.85, roughness: 0.28 });
  const white = new THREE.MeshStandardMaterial({ color: 0xeceff2, metalness: 0.3, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.6, roughness: 0.5 });
  const sm = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 4.2, 40), white); sm.position.y = -2.1; g.add(sm);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.1, 0.5), metal); const a = (i / 6) * Math.PI * 2; b.position.set(Math.cos(a) * 1.96, -2.1, Math.sin(a) * 1.96); b.rotation.y = -a; g.add(b); }
  const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.95, 2.6, 40), metal); cm.position.y = 1.3; g.add(cm);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 0.5, 16), dark); tip.position.y = 2.85; g.add(tip);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.25, 2.2, 32, 1, true), dark); bell.material.side = THREE.DoubleSide; bell.position.y = -5.3; g.add(bell);
  for (const a of [0, 1, 2, 3]) { const q = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), dark); const r = (a / 4) * Math.PI * 2 + 0.4; q.position.set(Math.cos(r) * 2.05, -0.9, Math.sin(r) * 2.05); g.add(q); }
  const dish = new THREE.Group(); dish.position.set(0, -4.2, 2.1); for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 6, 0, Math.PI * 2, 0, 1), metal); d.position.set((i % 2) * 0.7 - 0.35, -0.8 - Math.floor(i / 2) * 0.7, 0.4); d.rotation.x = -Math.PI / 2; dish.add(d); } g.add(dish);
  const fmat = new THREE.MeshBasicMaterial({ color: 0x9fc6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 24, 1, true), fmat); flame.rotation.x = Math.PI; flame.position.y = -9.4; g.add(flame);
  const fg = glowSprite(0xaaccff, 6, 0); fg.position.y = -6.6; g.add(fg);
  g.userData.burn = (k) => { fmat.opacity = k * 0.7; fg.material.opacity = k; flame.scale.set(1, 0.6 + k * 0.5 + Math.random() * 0.1 * k, 1); };
  model('apollo-lunar-module').catch(() => model('lm')).then((o) => { const lm = fit(o, 4.6, { axis: 'max', ground: false }); lm.rotation.x = Math.PI; lm.position.y = 5.6; g.add(lm); }).catch(() => {});
  return g;
}
export function makeCruise() {
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 5000);
  const sunDir = new THREE.Vector3(0.8, 0.25, 0.4).normalize();
  scene.add(new THREE.AmbientLight(0x334455, 0.35)); const sl = new THREE.DirectionalLight(0xffffff, 3.2); sl.position.copy(sunDir).multiplyScalar(100); scene.add(sl);
  const sky = skySphere(2000); scene.add(sky); const stars = twinkleStars(undefined, 1800); scene.add(stars);
  const gs = [galaxy({ seed: 5, radius: 160, c1: 0xffe2b0, c2: 0x5a7cff }), galaxy({ seed: 13, radius: 90, arms: 2, c1: 0xffc0e0, c2: 0x7a5cff, n: Q.high ? 5000 : 2000 }), galaxy({ seed: 31, radius: 70, arms: 4, c1: 0xbfefff, c2: 0x3366aa, n: Q.high ? 3000 : 1200 })];
  gs[0].position.set(-700, 300, -1200); gs[0].rotation.set(1.1, 0, 0.4); gs[1].position.set(900, -200, -900); gs[1].rotation.set(0.5, 0.3, -0.8); gs[2].position.set(200, 700, 1100); gs[2].rotation.set(1.4, 0.2, 0);
  gs.forEach((x) => scene.add(x));
  const E = earth(60, sunDir); E.rotation.z = 0.41; scene.add(E);
  const M = moon(16); scene.add(M);
  const sun = glowSprite(0xfff1d0, 220); sun.position.copy(sunDir).multiplyScalar(1500); scene.add(sun);
  const ship = makeStack(); scene.add(ship); let lastFrame = -1;
  const post = makePost(scene, camera, { strength: 0.2, radius: 0.36, threshold: 1.2, msaa: false });
  return { scene, camera, ship, E, M, sun, sunDir, stars, update(dt, t) { const fr = renderer.info.render.frame; if (fr === lastFrame) return; lastFrame = fr; tickAll(scene, dt, t); },
    render(dt) { if (post) post.render(dt); else renderer.render(scene, camera); }, resize(w, h) { post?.setSize(w, h); } };
}

// Pila real del artista para TLI → transposición, acople y extracción: S-IVB/IU/SLA (s4b-sla.glb) + CSM Columbia + LM.
// Marco local = el del S-IVB (+Y proa, m reales); el grupo se escala a SC para que encaje con la cámara de crucero.
// Si los glb fallan, cae al CSM procedural. userData: burn(k), focus (punto local que sigue la cámara), transpose(ctx) (secuencia), docked.
const SC = 0.4;
function flameCone(color, r, L) { // cono con el ápice en el origen y abierto hacia +Z local (= dirección del chorro en los empties del artista)
  const gm = new THREE.ConeGeometry(r, L, 28, 1, true); gm.translate(0, -L / 2, 0); gm.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 3; return m;
}
export function makeStack() {
  const g = new THREE.Group(); g.scale.setScalar(SC); g.userData.focus = new THREE.Vector3(0, 0, 0); g.userData.docked = false;
  let fb = null; const setFb = () => { if (fb) return; fb = makeCSM(); fb.scale.setScalar(1 / SC); g.add(fb); g.userData.burn = fb.userData.burn; };
  g.userData.burn = () => {};
  const mixers = []; g.userData.tick = (dt) => mixers.forEach((m) => m.update(dt));
  Promise.all([modelAnim('s4b-sla'), modelAnim('csm-columbia'), modelAnim('apollo-lunar-module').catch(() => null), modelAnim('cm-interior').catch(() => null)]).then(([S4, C, L, CI]) => {
    const lm = L?.scene || null;
    const s4 = S4.scene, csm = C.scene; g.add(s4); g.add(csm);
    // metales del artista (metallic ≈ 0.8): envMap propio solo en la pila, para no iluminar la cara nocturna de la Luna/Tierra
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    for (const o of [s4, csm, lm]) o?.traverse((m) => { if (m.isMesh && m.material && 'envMap' in m.material) { m.material = m.material.clone(); m.material.envMap = env; m.material.envMapIntensity = 0.5; } });
    const mS = new THREE.AnimationMixer(s4), mC = new THREE.AnimationMixer(csm); mixers.push(mS, mC);
    const act = (m, clips, n) => { const c = THREE.AnimationClip.findByName(clips, n); if (!c) return null; const a = m.clipAction(c); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; return a; };
    const N = (n) => s4.getObjectByName(n), NC = (n) => csm.getObjectByName(n);
    const yDock = N('csm-dock-launch')?.position.y ?? 8.52, yTgt = N('lm-docking-target')?.position.y ?? 5.72, yStow = N('lm-stow')?.position.y ?? -0.55;
    csm.position.set(0, yDock + 6.91, 0); // lanzamiento/TLI: popa del SM sobre el tope del SLA
    let legs = null; // LM v3: tren plegado (legs-stow, último cuadro) dentro del SLA, a 0.98 para no rozar los soportes; legs-deploy tras la extracción
    if (lm) { lm.position.set(0, yStow, 0); lm.scale.setScalar(0.98); g.add(lm); const mL = new THREE.AnimationMixer(lm); mixers.push(mL);
      const stow = act(mL, L.animations, 'legs-stow'), dep = act(mL, L.animations, 'legs-deploy'); if (stow) { stow.play(); mL.update(10); }
      legs = { deploy: () => { if (!dep) return; stow?.stop(); dep.reset().play(); } }; }
    // interior del CM (cm-interior.glb): mismo origen que el nodo CM, transform identidad. Oculto hasta que se entra; dentro se ocultan CM-shell y la escotilla exterior (tapaba su ventanuco).
    const cmN = NC('CM'), shell = NC('CM-shell'), hatchX = NC('CM-hatch');
    if (CI && cmN) { const cab = CI.scene; cab.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.material)) if (mat && /^CMI-(Pared|Mamparo)/.test(mat.name)) { mat.side = THREE.DoubleSide; mat.needsUpdate = true; } }); cab.visible = false; cmN.add(cab); const mI = new THREE.AnimationMixer(cab); mixers.push(mI);
      cab.traverse((m) => { if (m.isMesh && m.material && 'envMap' in m.material) { m.material = m.material.clone(); m.material.envMap = env; m.material.envMapIntensity = 0.5; } });
      if (isTouch) ['wall-stringers', 'suit-hoses', 'cb-5', 'cb-8'].forEach((n) => { const o = cab.getObjectByName(n); if (o) o.visible = false; }); // recorte móvil (−14.8k tris)
      // focos: siempre en la escena (intensidad 0 fuera) para no recompilar shaders al entrar/salir
      const LI = [0.12, 0.06], lights = [cab.getObjectByName('cabin-center'), cab.getObjectByName('light-flood-2')].map((e, i) => { const l = new THREE.PointLight(0xfff0dc, 0, 0, 2); if (e) l.position.copy(e.position); cmN.add(l); return l; });
      const nd = (n) => cab.getObjectByName(n), pad = (i) => String(i).padStart(2, '0'), guards = {};
      g.userData.interior = { node: nd, get on() { return cab.visible; },
        set(on) { cab.visible = on; if (shell) shell.visible = !on; if (hatchX) hatchX.visible = !on; lights.forEach((l, i) => (l.intensity = on ? LI[i] : 0)); },
        sw(i, on) { const o = nd('switch-' + pad(i)); if (o) o.rotation.x = on ? -0.35 : 0.35; }, // reposo = OFF (+0.35); ON = −0.35
        guard(i, open = true) { const a = guards[i] ?? (guards[i] = act(mI, CI.animations, `guard-${pad(i)}-open`)); if (!a) return; if (open) { if (!a.isRunning() && a.time === 0) a.reset().play(); } else { a.stop(); a.reset(); } },
        fdai(p, y, r) { for (const n of ['fdai-1-ball', 'fdai-2-ball']) nd(n)?.rotation.set(p, y, r); } };
    }
    // llamas: J-2 del S-IVB y SPS del SM
    const j2 = flameCone(0xbfd8ff, 1.3, 14), sps = flameCone(0xc8dcff, 1.05, 9); N('j2-thrust-point')?.add(j2); NC('sps-thrust-point')?.add(sps);
    const jg = glowSprite(0xaaccff, 7, 0), sg = glowSprite(0xaaccff, 5, 0); N('j2-thrust-point')?.add(jg); NC('sps-thrust-point')?.add(sg);
    g.userData.burn = (k) => { const sp = g.userData.docked, f = sp ? sps : j2, gl = sp ? sg : jg; (sp ? j2 : sps).material.opacity = 0; (sp ? jg : sg).material.opacity = 0;
      f.material.opacity = k * 0.4; f.scale.set(1, 1, 0.55 + k * 0.5 + Math.random() * 0.08 * k); gl.material.opacity = k; };
    // RCS: destellos breves en las toberas del SM (+Z local = chorro)
    const rcs = []; csm.traverse((o) => { if (/^SM-RCS-[A-D]-(up|down)$/.test(o.name)) { const p = glowSprite(0xffffff, 0.9, 0); o.add(p); rcs.push({ o, p, dir: /up$/.test(o.name) ? 1 : -1 }); } });
    const puff = (dir, k) => rcs.forEach((r) => (r.p.material.opacity = r.dir === dir ? k * (0.6 + Math.random() * 0.4) : 0));
    const sla = act(mS, S4.animations, 'sla-jettison'), probe = act(mC, C.animations, 'probe-retract');
    const cg = new THREE.Vector3(0, NC('cg')?.position.y ?? -4.91, 0);
    const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    // Secuencia cinemática (~22 s): separación + paneles SLA, alejarse, giro de 180° en X sobre el CG, aproximación, acople (probe-retract), extracción del LM.
    g.userData.transpose = (ctx, onStep = () => {}) => new Promise((res) => {
      const P0 = csm.position.clone(), qF = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI), q0 = new THREE.Quaternion(), q = new THREE.Quaternion();
      const Ysep = P0.y + 14, cgW = new THREE.Vector3(); let T = 0, step = -1, docked = false, legsOut = false; sla?.reset().play();
      const yAfter = Ysep + cg.y - (-cg.y); // y del origen del CSM tras girar sobre el CG
      const off = ctx.loop((dt) => { T += dt; const st = T < 6 ? 0 : T < 11 ? 1 : T < 17 ? 2 : T < 18.5 ? 3 : T < 24 ? 4 : 5; if (st !== step) { step = st; onStep(st); }
        if (T < 6) { csm.position.y = P0.y + (Ysep - P0.y) * ease(T / 6); puff(1, T < 1.2 ? 1 : 0); g.userData.focus.set(0, 10 + 6 * ease(T / 6), 0); }
        else if (T < 11) { const k = ease((T - 6) / 5); q.slerpQuaternions(q0, qF, k); cgW.set(0, Ysep + cg.y, 0); csm.quaternion.copy(q); csm.position.copy(cgW).sub(cg.clone().applyQuaternion(q)); puff(k < 0.15 || k > 0.85 ? 1 : 0, k < 0.15 || k > 0.85 ? 1 : 0); }
        else if (T < 17) { const k = ease((T - 11) / 6), d = (yAfter - yTgt) * (1 - k); csm.quaternion.copy(qF); csm.position.set(0, yTgt + d, 0); puff(-1, T > 15.6 ? 1 : 0); g.userData.focus.set(0, yTgt + 2 + d * 0.5, 0); }
        else if (T < 18.5) { if (!docked) { docked = true; csm.position.set(0, yTgt, 0); probe?.reset().play(); onStep('contact'); } puff(0, 0); }
        else { if (lm && lm.parent !== csm) csm.attach(lm); const k = ease(Math.min(1, (T - 18.5) / 5)); csm.position.y = yTgt + 16 * k; puff(1, T < 19.3 ? 1 : 0); g.userData.focus.set(0, yTgt + 16 * k - 3, 0);
          if (T > 24 && !legsOut) { legsOut = true; legs?.deploy(); } // ya lejos del S-IVB: se abre el tren (2.5 s)
          if (T > 27.2) { off(); puff(0, 0); s4.visible = false; g.userData.docked = true;
            // recentrar: la pareja CSM+LM pasa a ser "la nave"; +Y local sigue apuntando hacia la tobera SPS (el CSM va girado)
            g.userData.focus.set(0, csm.position.y - 4, 0); res(); } }
      });
    });
  }).catch((e) => { console.warn('pila del artista no disponible, uso el CSM procedural', e); setFb(); });
  return g;
}
