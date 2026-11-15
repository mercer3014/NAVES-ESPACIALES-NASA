// Clips del astronauta hechos por código para los que el modelo trae vacíos.
// En astronaut-a7l.glb, «first-step» y «kneel-pick-sample» solo mueven la cadera: ninguna articulación rota, así que el
// primer paso bajaba «con las piernas juntas» y la recolección de muestras no se veía. «salute», «point» y «wave» no
// mueven nada (Aldrin no saludaba en la foto ni señalaba) y «fall-and-get-up» solo baja la cadera. Aquí se reconstruyen.
// Los ejes de bisagra se deducen de la geometría (hacia dónde se mueve el hueso hijo), no se suponen: así la rodilla
// se dobla hacia atrás y el muslo hacia adelante en este rig o en otro.
import * as THREE from 'three';

const deg = Math.PI / 180;
const strip = (n) => n.replace(/^mixamorig:?/i, '');

// Eje local de `bone` que mueve a `child` hacia `dirW` (dirección de mundo, en la pose de reposo). sign=+1: hacia dirW.
function hinge(bone, child, dirW, root) {
  root.updateMatrixWorld(true);
  const inv = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
  const dirL = dirW.clone().applyQuaternion(inv).normalize();
  const c = child.position.clone().normalize();
  let best = null;
  for (const ax of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]) {
    const moved = c.clone().applyAxisAngle(ax, 0.2).sub(c); const d = moved.dot(dirL);
    if (!best || Math.abs(d) > Math.abs(best.d)) best = { ax, d };
  }
  return best.ax.clone().multiplyScalar(Math.sign(best.d) || 1);
}

// keys: { bone: [[t, grados], ...] } → QuaternionKeyframeTrack respecto al reposo, sobre el eje de bisagra de cada hueso
function build(name, duration, B, axes, keys, hips) {
  const tracks = [];
  for (const [bn, frames] of Object.entries(keys)) {
    const bone = B[bn], ax = axes[bn]; if (!bone || !ax) continue;
    const times = [], vals = []; const q = new THREE.Quaternion(), d = new THREE.Quaternion();
    // [t, a] gira sobre el eje principal; [t, a, b] además sobre el segundo eje del hueso (axes['Hueso.out'], p. ej. abrir el brazo)
    const ax2 = axes[bn + '.out'], d2 = new THREE.Quaternion();
    for (const [t, a, b = 0] of frames) { d.setFromAxisAngle(ax, a * deg); q.copy(bone.quaternion).multiply(d); if (b && ax2) q.multiply(d2.setFromAxisAngle(ax2, b * deg)); times.push(t); vals.push(q.x, q.y, q.z, q.w); }
    tracks.push(new THREE.QuaternionKeyframeTrack(bone.name + '.quaternion', times, vals));
  }
  if (hips && B.Hips) {
    const p = B.Hips.position; const times = [], vals = [];
    for (const [t, dy, dz = 0] of hips) { times.push(t); vals.push(p.x, p.y + dy, p.z + dz); }
    tracks.push(new THREE.VectorKeyframeTrack(B.Hips.name + '.position', times, vals));
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

// ¿El clip está vacío? (las piernas no rotan más de 2°)
function legsStatic(clip, B) {
  for (const t of clip.tracks) {
    const [node, prop] = t.name.split('.'); if (prop !== 'quaternion' || !/UpLeg|Leg$/.test(strip(node))) continue;
    const bone = B[strip(node)]; if (!bone) continue; const q = new THREE.Quaternion();
    for (let i = 0; i < t.values.length; i += 4) { q.fromArray(t.values, i); if (q.angleTo(bone.quaternion) > 2 * deg) return false; }
  }
  return true;
}

// ¿Ningún hueso rota más de 2° en todo el clip? (salute, point y wave vienen así en astronaut-a7l.glb)
function allStatic(clip, B) {
  const q = new THREE.Quaternion(), q0 = new THREE.Quaternion();
  for (const t of clip.tracks) {
    const [node, prop] = t.name.split('.'); if (prop !== 'quaternion') continue;
    q0.fromArray(t.values, 0); for (let i = 4; i < t.values.length; i += 4) { q.fromArray(t.values, i); if (q.angleTo(q0) > 2 * deg) return false; }
  }
  return true;
}

// Reemplaza en `animations` los clips vacíos por versiones hechas a mano. Devuelve los nombres reemplazados.
export function rebuildAstronautClips(root, animations) {
  const B = {}; root.traverse((o) => { if (o.isBone) B[strip(o.name)] = o; });
  if (!B.Hips || !B.LeftUpLeg || !B.LeftLeg || !B.LeftFoot) return [];
  root.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())); // el modelo mira a +Z
  const down = new THREE.Vector3(0, -1, 0);
  const axes = {};
  for (const s of ['Left', 'Right']) {
    axes[s + 'UpLeg'] = hinge(B[s + 'UpLeg'], B[s + 'Leg'], fwd, root);           // + = muslo adelante
    axes[s + 'Leg'] = hinge(B[s + 'Leg'], B[s + 'Foot'], fwd.clone().negate(), root); // + = rodilla dobla (pie atrás)
    axes[s + 'Foot'] = B[s + 'ToeBase'] ? hinge(B[s + 'Foot'], B[s + 'ToeBase'], down, root) : null; // + = punta abajo
    if (B[s + 'Arm'] && B[s + 'ForeArm']) axes[s + 'Arm'] = hinge(B[s + 'Arm'], B[s + 'ForeArm'], fwd, root); // + = brazo adelante
    if (B[s + 'ForeArm'] && B[s + 'Hand']) axes[s + 'ForeArm'] = hinge(B[s + 'ForeArm'], B[s + 'Hand'], fwd, root); // + = codo flexiona
    const outW = new THREE.Vector3(s === 'Left' ? 1 : -1, 0, 0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion())); // hacia fuera del cuerpo
    if (B[s + 'Arm'] && B[s + 'ForeArm']) axes[s + 'Arm.out'] = hinge(B[s + 'Arm'], B[s + 'ForeArm'], outW, root); // + = abrir el brazo
    if (B[s + 'ForeArm'] && B[s + 'Hand']) axes[s + 'ForeArm.out'] = hinge(B[s + 'ForeArm'], B[s + 'Hand'], outW, root); // + = antebrazo hacia fuera
  }
  if (B.Spine && B.Spine1) axes.Spine = hinge(B.Spine, B.Spine1, fwd, root); // + = inclinarse adelante
  if (B.Spine1 && B.Spine2) axes.Spine1 = hinge(B.Spine1, B.Spine2, fwd, root);
  if (B.Neck && B.Head) axes.Neck = hinge(B.Neck, B.Head, fwd, root);

  const out = [];
  const replace = (name, clip, test = legsStatic) => { const i = animations.findIndex((c) => c.name === name); if (i < 0 || !test(animations[i], B)) return; animations[i] = clip; out.push(name); };

  // Primer paso (4 s). La raíz la mueve eva.js (del plato al suelo entre 1,25 y 2,2 s); aquí solo el cuerpo:
  // 0–0,8 mira abajo · 0,8–1,3 flexiona la pierna de apoyo (derecha) y levanta la izquierda · 1,3–2,2 la izquierda baja
  // estirada hasta el regolito y carga el peso · 2,7–3,5 la derecha se suelta del plato y se junta. Brazos en contrafase.
  replace('first-step', build('first-step', 4, B, axes, {
    LeftUpLeg: [[0, 0], [0.8, 8], [1.3, 46], [1.8, 30], [2.2, 10], [2.6, 4], [3.2, 2], [4, 0]],
    LeftLeg: [[0, 4], [0.8, 14], [1.3, 66], [1.8, 24], [2.2, 14], [2.6, 8], [4, 4]],
    LeftFoot: [[0, 0], [1.3, 22], [1.8, -4], [2.2, -6], [2.6, 0], [4, 0]],
    RightUpLeg: [[0, 0], [0.8, 10], [1.3, 26], [1.8, 30], [2.2, -4], [2.7, -12], [3.1, 36], [3.5, 10], [4, 0]],
    RightLeg: [[0, 4], [0.8, 18], [1.3, 42], [1.8, 48], [2.2, 22], [2.7, 30], [3.1, 62], [3.5, 16], [4, 4]],
    RightFoot: [[0, 0], [1.3, -14], [1.8, -18], [2.2, 10], [2.7, 24], [3.1, 10], [3.5, -2], [4, 0]],
    RightArm: [[0, -22], [0.8, -26], [1.3, -30], [2.0, 30], [2.6, 12], [3.1, -14], [3.6, 8], [4, 4]],
    RightForeArm: [[0, 30], [1.3, 34], [2.0, 48], [2.6, 30], [3.2, 24], [4, 14]],
    LeftArm: [[0, 12], [0.8, 18], [1.3, 34], [2.0, -20], [2.6, -8], [3.1, 22], [3.6, 6], [4, 6]],
    LeftForeArm: [[0, 18], [1.3, 42], [2.0, 26], [2.6, 20], [3.1, 38], [4, 14]],
    Spine: [[0, 2], [0.8, 8], [1.3, 14], [2.0, 10], [2.4, 6], [3.1, 8], [4, 2]],
    Spine1: [[0, 0], [1.3, 6], [2.0, 4], [4, 0]],
    Neck: [[0, 14], [0.8, 28], [1.6, 30], [2.2, 22], [3.0, 10], [4, 4]],
  }, [[0, 0], [0.8, -0.03], [1.3, -0.1], [1.8, -0.12], [2.2, -0.08], [2.7, -0.03], [3.1, -0.06], [3.5, -0.01], [4, 0]]));

  // Recoger muestra (4 s): se agacha con las rodillas, inclina el torso, baja la pala con el brazo derecho, raspa y se levanta.
  replace('kneel-pick-sample', build('kneel-pick-sample', 4, B, axes, {
    LeftUpLeg: [[0, 0], [1.0, 62], [2.6, 64], [3.6, 10], [4, 0]],
    LeftLeg: [[0, 3], [1.0, 95], [2.6, 98], [3.6, 15], [4, 3]],
    LeftFoot: [[0, 0], [1.0, -28], [2.6, -30], [3.6, -4], [4, 0]],
    RightUpLeg: [[0, 0], [1.0, 48], [2.6, 50], [3.6, 8], [4, 0]],
    RightLeg: [[0, 3], [1.0, 78], [2.6, 80], [3.6, 12], [4, 3]],
    RightFoot: [[0, 0], [1.0, -22], [2.6, -24], [3.6, -3], [4, 0]],
    Spine: [[0, 0], [1.0, 22], [1.8, 28], [2.6, 24], [3.6, 6], [4, 0]],
    Spine1: [[0, 0], [1.0, 12], [2.6, 12], [4, 0]],
    RightArm: [[0, 10], [1.0, 55], [1.5, 70], [1.9, 58], [2.3, 72], [2.6, 60], [3.3, 40], [4, 25]],
    RightForeArm: [[0, 10], [1.0, 20], [1.5, 8], [1.9, 30], [2.3, 10], [2.6, 35], [3.3, 60], [4, 45]],
    LeftArm: [[0, 8], [1.0, 35], [2.6, 38], [3.6, 12], [4, 8]],
    LeftForeArm: [[0, 10], [1.0, 40], [2.6, 42], [4, 12]],
    Neck: [[0, 0], [1.0, 25], [2.6, 25], [3.6, 8], [4, 0]],
  }, [[0, 0], [1.0, -0.34, -0.04], [2.6, -0.36, -0.05], [3.6, -0.05], [4, 0]]));

  // Saludo militar (2 s). Termina EN el saludo: el juego lo usa con clampWhenFinished para posar (foto de Aldrin, final).
  // Brazo derecho abierto y algo adelante, codo muy flexionado para llevar la mano a la sien del casco; pecho fuera.
  replace('salute', build('salute', 2, B, axes, {
    RightArm: [[0, 0, 0], [0.35, 30, 40], [0.6, 26, 78], [0.75, 24, 74], [2, 24, 74]],
    RightForeArm: [[0, 4], [0.35, 60], [0.6, 128], [0.75, 122], [2, 122]],
    LeftArm: [[0, 2, 0], [0.6, -4, 6], [2, -4, 6]], LeftForeArm: [[0, 6], [0.6, 4], [2, 4]],
    Spine: [[0, 0], [0.6, -4], [2, -4]], Neck: [[0, 0], [0.6, -3], [2, -3]],
    LeftUpLeg: [[0, 0], [2, 0]], RightUpLeg: [[0, 0], [2, 0]], LeftLeg: [[0, 3], [2, 2]], RightLeg: [[0, 3], [2, 2]],
  }, [[0, 0], [0.6, 0.015], [2, 0.015]]), allStatic);

  // Señalar (2 s): brazo derecho estirado hacia delante y algo arriba, mira hacia donde señala; baja al final.
  replace('point', build('point', 2, B, axes, {
    RightArm: [[0, 0, 0], [0.4, 70, 12], [0.55, 84, 10], [1.4, 82, 10], [2, 8, 2]],
    RightForeArm: [[0, 4], [0.4, 30], [0.55, 6], [1.4, 8], [2, 10]],
    LeftArm: [[0, 0, 0], [0.55, -8, 8], [1.4, -6, 8], [2, 0, 0]], LeftForeArm: [[0, 6], [0.55, 18], [2, 8]],
    Spine: [[0, 0], [0.55, 6], [1.4, 5], [2, 0]], Neck: [[0, 0], [0.55, -8], [1.4, -6], [2, 0]],
  }), allStatic);

  // Saludar con la mano (2 s, en bucle): brazo arriba y el antebrazo va y viene.
  replace('wave', build('wave', 2, B, axes, {
    RightArm: [[0, 20, 100], [0.5, 22, 104], [1, 20, 100], [1.5, 22, 104], [2, 20, 100]],
    RightForeArm: [[0, 40, -25], [0.5, 44, 25], [1, 40, -25], [1.5, 44, 25], [2, 40, -25]],
    LeftArm: [[0, 4, 4], [1, 6, 6], [2, 4, 4]], LeftForeArm: [[0, 10], [1, 14], [2, 10]],
    Spine: [[0, -2], [1, -3], [2, -2]], Neck: [[0, -4], [1, -2], [2, -4]],
  }), allStatic);

  // Tropezar y levantarse (5 s): el traje rígido hace caer de rodillas y apoyar las manos; se empuja hacia arriba.
  replace('fall-and-get-up', build('fall-and-get-up', 5, B, axes, {
    LeftUpLeg: [[0, 0], [0.5, 18], [1.1, 78], [2.6, 80], [3.5, 46], [4.3, 8], [5, 0]],
    LeftLeg: [[0, 3], [0.5, 30], [1.1, 112], [2.6, 114], [3.5, 70], [4.3, 12], [5, 3]],
    LeftFoot: [[0, 0], [1.1, -30], [2.6, -30], [3.5, -14], [5, 0]],
    RightUpLeg: [[0, 0], [0.5, -10], [1.1, 70], [2.6, 72], [3.5, 30], [4.3, 6], [5, 0]],
    RightLeg: [[0, 3], [0.5, 12], [1.1, 106], [2.6, 108], [3.5, 60], [4.3, 10], [5, 3]],
    RightFoot: [[0, 0], [1.1, -28], [2.6, -28], [3.5, -10], [5, 0]],
    Spine: [[0, 0], [0.5, 22], [1.1, 46], [2.6, 44], [3.5, 30], [4.3, 8], [5, 0]],
    Spine1: [[0, 0], [1.1, 14], [2.6, 14], [4.3, 2], [5, 0]],
    RightArm: [[0, 0, 0], [0.5, 50, 24], [1.1, 72, 18], [2.6, 70, 18], [3.5, 40, 12], [4.3, 6, 4], [5, 0, 0]],
    LeftArm: [[0, 0, 0], [0.5, 50, 24], [1.1, 72, 18], [2.6, 70, 18], [3.5, 40, 12], [4.3, 6, 4], [5, 0, 0]],
    RightForeArm: [[0, 4], [0.5, 30], [1.1, 10], [2.6, 12], [3.5, 30], [5, 6]], LeftForeArm: [[0, 4], [0.5, 30], [1.1, 10], [2.6, 12], [3.5, 30], [5, 6]],
    Neck: [[0, 0], [1.1, -24], [2.6, -20], [4.3, -4], [5, 0]],
  }, [[0, 0], [0.5, -0.08, 0.05], [1.1, -0.5, 0.12], [2.6, -0.5, 0.12], [3.5, -0.24, 0.06], [4.3, -0.03], [5, 0]]), (c) => { const hx = c.tracks.filter((t) => !/Hips/.test(t.name)); return allStatic({ tracks: hx }, B); });
  return out;
}
