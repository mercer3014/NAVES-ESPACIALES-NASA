// Capa de «vida» procedural sobre los clips del astronauta (astronaut-a7l.glb).
// Los clips de caminar y trotar mueven bien las piernas, pero los brazos cuelgan quietos y el torso va rígido.
// Esta capa se aplica DESPUÉS de mixer.update y se deshace ANTES del siguiente, así nunca acumula error:
//  · caminar/trotar: brazos en contrafase con las piernas (la fase se mide en los muslos del propio clip, no se supone),
//    codos algo doblados y brazos un poco abiertos (el traje A7L presurizado no deja pegarlos al cuerpo), giro de
//    hombros contra caderas e inclinación hacia delante según la velocidad.
//  · en el aire: abre los brazos para equilibrarse.
//  · quieto: respira (el pecho sube y baja) y mira alrededor de vez en cuando.
// Durante acciones (escalera, primer paso, recoger muestra, bandera, saludo…) se apaga con un fundido.
import * as THREE from 'three';

const deg = Math.PI / 180;
// Eje local de `bone` que mueve a `child` hacia `dirW` (dirección de mundo en la pose de reposo).
function hinge(bone, child, dirW) {
  const inv = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
  const dirL = dirW.clone().applyQuaternion(inv).normalize(), c = child.position.clone().normalize();
  let best = null;
  for (const ax of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) {
    const d = c.clone().applyAxisAngle(ax, 0.2).sub(c).dot(dirL);
    if (!best || Math.abs(d) > Math.abs(best.d)) best = { ax, d };
  }
  return best.ax.clone().multiplyScalar(Math.sign(best.d) || 1);
}
// Eje local de `bone` que apunta a la vertical del mundo (para girar alrededor de la columna o del cuello).
const localUp = (bone) => new THREE.Vector3(0, 1, 0).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();

// Se llama con el modelo en pose de reposo (antes de reproducir ningún clip).
export function makeLife(root, B) {
  if (!B.Hips || !B.LeftArm || !B.RightArm || !B.LeftUpLeg || !B.Spine) return null;
  root.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())), left = new THREE.Vector3(1, 0, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  const ax = {};
  for (const s of ['Left', 'Right']) {
    const out = s === 'Left' ? left : left.clone().negate();
    ax[s + 'Swing'] = hinge(B[s + 'Arm'], B[s + 'ForeArm'], fwd);          // + = brazo adelante
    ax[s + 'Out'] = hinge(B[s + 'Arm'], B[s + 'ForeArm'], out);            // + = brazo hacia fuera
    ax[s + 'Elbow'] = B[s + 'Hand'] ? hinge(B[s + 'ForeArm'], B[s + 'Hand'], fwd) : null; // + = codo flexiona
  }
  ax.SpineLean = B.Spine1 ? hinge(B.Spine, B.Spine1, fwd) : null;
  ax.SpineTwist = localUp(B.Spine); ax.ChestTwist = B.Spine2 ? localUp(B.Spine2) : null;
  ax.ChestLean = B.Spine1 && B.Spine2 ? hinge(B.Spine1, B.Spine2, fwd) : null;
  ax.NeckYaw = B.Neck ? localUp(B.Neck) : null; ax.NeckPitch = B.Neck && B.Head ? hinge(B.Neck, B.Head, fwd) : null;

  const touched = new Map(); // hueso → cuaternión antes de la capa (para deshacerla)
  const q = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3(), f = new THREE.Vector3(), rq = new THREE.Quaternion();
  const add = (bone, axis, d) => {
    if (!bone || !axis || Math.abs(d) < 0.01) return;
    if (!touched.has(bone)) touched.set(bone, bone.quaternion.clone());
    bone.quaternion.multiply(q.setFromAxisAngle(axis, d * deg));
  };
  const thigh = (s) => { B[s + 'UpLeg'].getWorldPosition(a); B[s + 'Leg'].getWorldPosition(b); return b.sub(a).normalize().dot(f); };
  const S = { w: 0, walk: 0, air: 0, swing: 0, t: Math.random() * 10, look: 0, lookP: 0, lookT: 2 + Math.random() * 3, lookTo: 0, lookToP: 0, idle: 0 };
  const sm = (cur, to, rate, dt) => cur + (to - cur) * Math.min(1, dt * rate);

  return {
    // antes de mixer.update: devuelve los huesos a como los dejó el clip
    undo() { for (const [bone, q0] of touched) bone.quaternion.copy(q0); touched.clear(); },
    // después de mixer.update
    apply(dt, { speed = 0, act = null, air = false } = {}) {
      S.t += dt; touched.clear();
      const free = !act; S.w = sm(S.w, free ? 1 : 0, 6, dt); if (S.w < 0.01) return;
      const moving = speed > 0.15; S.walk = sm(S.walk, moving ? Math.min(1, speed / 1.4) : 0, 5, dt); S.air = sm(S.air, air ? 1 : 0, air ? 7 : 4, dt);
      S.idle = sm(S.idle, !moving && !air ? 1 : 0, 2, dt);
      // fase de las piernas, medida en el clip: >0 = pierna derecha adelante
      let diff = 0;
      if (S.walk > 0.02) { root.updateMatrixWorld(true); f.set(0, 0, 1).applyQuaternion(root.getWorldQuaternion(rq)); diff = thigh('Right') - thigh('Left'); }
      S.swing = sm(S.swing, diff, 14, dt);
      const W = S.w, wk = S.walk * W, ai = S.air * W, id = S.idle * W;
      const sw = THREE.MathUtils.clamp(S.swing, -0.9, 0.9) * 46 * wk; // grados de balanceo
      for (const s of ['Left', 'Right']) {
        const sign = s === 'Left' ? 1 : -1; // el brazo izquierdo va con la pierna derecha
        add(B[s + 'Arm'], ax[s + 'Swing'], sign * sw * (1 - S.air) + 10 * wk - 14 * ai + 2.5 * id * Math.sin(S.t * 0.9 + (s === 'Left' ? 0 : 1.7)));
        add(B[s + 'Arm'], ax[s + 'Out'], 9 * wk + 30 * ai + 3 * id);
        add(B[s + 'ForeArm'], ax[s + 'Elbow'], 16 * wk + Math.max(0, sign * sw) * 0.5 + 26 * ai + 6 * id);
      }
      // torso: hombros en contrafase con las caderas, algo inclinado al trotar; rebote al pisar
      add(B.Spine, ax.SpineTwist, -S.swing * 9 * wk);
      add(B.Spine, ax.SpineLean, 7 * wk * Math.min(1, speed / 1.9) + 4 * ai);
      // respiración (el pecho sube y baja) y mirada
      add(B.Spine1, ax.ChestLean, 1.6 * id * Math.sin(S.t * 1.7));
      if (id > 0.5) { S.lookT -= dt; if (S.lookT <= 0) { S.lookT = 2.5 + Math.random() * 4; const r = Math.random(); S.lookTo = r < 0.35 ? 0 : (Math.random() * 2 - 1) * 38; S.lookToP = r < 0.2 ? 12 : (Math.random() * 2 - 1) * 8; } }
      else { S.lookTo = 0; S.lookToP = 0; }
      S.look = sm(S.look, S.lookTo, 1.6, dt); S.lookP = sm(S.lookP, S.lookToP, 1.6, dt);
      add(B.Neck, ax.NeckYaw, S.look * W + S.swing * 4 * wk);
      add(B.Neck, ax.NeckPitch, S.lookP * W - 4 * wk);
    },
  };
}
