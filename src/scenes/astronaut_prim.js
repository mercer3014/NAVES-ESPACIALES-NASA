// Astronauta procedural (traje A7L estilizado): articulado para caminar, saltar, recoger, golpear y saludar.
// La bandera del jugador va como parche en el hombro izquierdo.
import { THREE } from '../core/engine.js';
import { renderPatch } from '../ui/flag.js';

export function makeAstronaut(flag, name = '') {
  const suit = new THREE.MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.88 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a4d55, roughness: 0.7, metalness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.35, metalness: 0.8 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x3a6fd8, roughness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd52b1e, roughness: 0.6 });
  const visorM = new THREE.MeshStandardMaterial({ color: 0xe8b44a, roughness: 0.08, metalness: 1, envMapIntensity: 1.4 });
  const cap = (r, l, m) => { const g = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m); g.castShadow = true; return g; };
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  // pelvis / torso
  const hips = new THREE.Group(); hips.position.y = 0.96; body.add(hips);
  const pelvis = cap(0.2, 0.08, suit); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 1.25, 0.9); hips.add(pelvis);
  const chest = new THREE.Group(); chest.position.y = 0.08; hips.add(chest);
  const torso = cap(0.25, 0.32, suit); torso.position.y = 0.32; torso.scale.set(1.08, 1, 0.82); chest.add(torso);
  const rcu = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.15, 0.1), dark); rcu.position.set(0, 0.36, 0.22); chest.add(rcu);
  for (const [x, m] of [[-0.07, red], [0, blue], [0.07, metal]]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), m); k.rotation.x = Math.PI / 2; k.position.set(x, 0.38, 0.28); chest.add(k); }
  const hoseL = cap(0.025, 0.2, blue); hoseL.position.set(-0.12, 0.2, 0.2); hoseL.rotation.z = 0.5; chest.add(hoseL);
  const hoseR = cap(0.025, 0.2, red); hoseR.position.set(0.12, 0.2, 0.2); hoseR.rotation.z = -0.5; chest.add(hoseR);
  // mochila PLSS + OPS
  const plss = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.24), suit); plss.position.set(0, 0.36, -0.3); plss.castShadow = true; chest.add(plss);
  const ops = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.2), suit); ops.position.set(0, 0.76, -0.28); chest.add(ops);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5), metal); ant.position.set(0.18, 1.02, -0.32); chest.add(ant);
  // casco
  const head = new THREE.Group(); head.position.y = 0.74; chest.add(head);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 20), metal); ring.rotation.x = Math.PI / 2; head.add(ring);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.35 })); helmet.position.y = 0.16; helmet.castShadow = true; head.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.205, 24, 16, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.22, Math.PI * 0.42), visorM); visor.position.y = 0.16; visor.rotation.y = Math.PI / 2; visor.rotation.y = 0; head.add(visor);
  // los brazos
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.32, 0.5, 0); chest.add(sh);
    const up = cap(0.085, 0.22, suit); up.position.y = -0.17; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.36; sh.add(el);
    const fo = cap(0.075, 0.2, suit); fo.position.y = -0.15; el.add(fo);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), dark); glove.scale.set(1, 1.2, 0.8); glove.position.y = -0.34; el.add(glove);
    return { sh, el, up };
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // parche con la bandera
  const pc = renderPatch(document.createElement('canvas'), flag, name, 256); const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
  const patch = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshStandardMaterial({ map: pt, roughness: 0.7, transparent: true })); patch.position.set(-0.087, -0.12, 0); patch.rotation.y = -Math.PI / 2; armL.sh.add(patch);
  // bandera pequeña también en el pecho, como el traje real
  // piernas
  const mkLeg = (side) => {
    const hp = new THREE.Group(); hp.position.set(side * 0.12, -0.04, 0); hips.add(hp);
    const th = cap(0.105, 0.28, suit); th.position.y = -0.2; hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
    const sh = cap(0.095, 0.26, suit); sh.position.y = -0.18; kn.add(sh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0xdedbd2, roughness: 0.9 })); boot.position.set(0, -0.42, 0.04); boot.castShadow = true; kn.add(boot);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.31), dark); sole.position.set(0, -0.49, 0.04); kn.add(sole);
    return { hp, kn };
  };
  const legL = mkLeg(-1), legR = mkLeg(1);
  // herramienta (pala / martillo) en la mano derecha, oculta
  const tool = new THREE.Group(); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7), metal); handle.position.y = -0.3; tool.add(handle);
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.12), metal); scoop.position.y = -0.66; tool.add(scoop); tool.position.y = -0.34; tool.visible = false; armR.el.add(tool);

  let ph = 0; const P = { walk: 0, air: 0, act: null, actT: 0, climb: 0 };
  // pose: {speed m/s, air (bool), act: 'scoop'|'hammer'|'salute'|'climb'|'swing'|null, k 0..1}
  function pose(dt, { speed = 0, air = false, act = null, k = 0 } = {}) {
    ph += dt * (1.6 + speed * 1.2);
    const w = Math.min(1, speed / 1.6); const s = Math.sin(ph * 2), c = Math.cos(ph * 2);
    let hipL = s * 0.5 * w, hipR = -s * 0.5 * w, knL = Math.max(0, -c) * 0.7 * w + 0.1, knR = Math.max(0, c) * 0.7 * w + 0.1;
    if (air) { hipL = hipR = -0.35; knL = knR = 0.55; }
    let aL = -s * 0.35 * w, aR = s * 0.35 * w, eL = -0.35, eR = -0.35, aLz = 0.18, aRz = -0.18, lean = 0.12 * w, crouch = 0;
    tool.visible = false;
    if (act === 'climb') { const q = Math.sin(k * Math.PI); aL = -2.4 + q * 0.4; aR = -2.4 - q * 0.4 + 0.4; eL = eR = -0.6; hipL = -0.6 * q - 0.2; hipR = -0.2; knL = 0.9 * q + 0.3; knR = 0.3; lean = -0.05; }
    if (act === 'scoop') { const q = Math.sin(k * Math.PI * 3) * 0.5 + 0.5; aR = -0.6 - q * 0.6; eR = -0.3; tool.visible = true; crouch = 0.15; lean = 0.35; knL = knR = 0.5; hipL = hipR = -0.4; }
    if (act === 'hammer') { const q = k < 0.6 ? k / 0.6 : 1 - (k - 0.6) / 0.4; aR = -2.6 * q - 0.3; aL = -2.6 * q - 0.3; eR = eL = -0.4; aLz = 0.05; aRz = -0.05; }
    if (act === 'salute') { aR = -1.9; aRz = -0.9; eR = -2.2; aL = 0; }
    if (act === 'hold') { aR = -1.2; eR = -0.4; aL = -1.2; eL = -0.4; aLz = 0.05; aRz = -0.05; }
    if (act === 'swing') { const q = Math.sin(k * Math.PI); aR = -0.8 + q * 1.8; aL = -0.8 + q * 1.8; eR = eL = -0.2; tool.visible = true; lean = 0.3; }
    const L = (o, x, z = 0) => { o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, x, Math.min(1, dt * 14)); o.rotation.z = THREE.MathUtils.lerp(o.rotation.z, z, Math.min(1, dt * 14)); };
    L(legL.hp, hipL); L(legR.hp, hipR); L(legL.kn, knL); L(legR.kn, knR); L(armL.sh, aL, aLz); L(armR.sh, aR, aRz); L(armL.el, eL); L(armR.el, eR); L(chest, lean);
    hips.position.y = 0.96 - crouch - (air ? 0.05 : 0) - Math.abs(c) * 0.03 * w;
  }
  return { root, body, pose, patch, tool };
}
