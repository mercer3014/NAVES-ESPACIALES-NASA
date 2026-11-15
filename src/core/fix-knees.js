// Corrige clips con las rodillas al revés («pata de ave»): algunos clips de caminar, correr, saltar y la escalera
// se exportaron con la flexión de la rodilla en el signo contrario, y el cuerpo se dobla hacia adelante.
// Para cada pierna medimos hacia dónde se mueve el pie al doblar la rodilla, en el espacio de reposo del hueso.
// Si la mayoría de los fotogramas doblados van hacia adelante, invertimos el giro de rodilla y pie respecto
// al reposo (q' = reposo · Δ⁻¹). Así el pie sigue plano y la pierna se dobla hacia atrás. Los clips buenos
// (sentarse, la caminata de Jan) no se tocan.
import * as THREE from 'three';

const SIDES = ['Left', 'Right'];
const strip = (n) => n.replace(/^mixamorig:?/i, '');
const BENT = 10 * Math.PI / 180;

function boneMap(root) {
  const m = {};
  root.traverse((o) => { if (o.isBone) m[strip(o.name)] = o; });
  return m;
}

// Dirección «adelante» del personaje (+Z del modelo) expresada en el espacio local de reposo del hueso.
function forwardIn(bone, root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Quaternion();
  bone.getWorldQuaternion(inv).invert();
  const rootQ = root.getWorldQuaternion(new THREE.Quaternion());
  return new THREE.Vector3(0, 0, 1).applyQuaternion(rootQ).applyQuaternion(inv);
}

function trackOf(clip, bone, prop) {
  return clip.tracks.find((t) => { const i = t.name.lastIndexOf('.'); return t.name.slice(i + 1) === prop && strip(t.name.slice(0, i)) === strip(bone.name); });
}

// Mitad de los fotogramas doblados van hacia adelante → la rodilla está al revés en este clip.
function kneeForward(track, knee, foot, fwd) {
  const shin = foot.position.clone().normalize();
  const rest = knee.quaternion; const inv = rest.clone().invert();
  const q = new THREE.Quaternion(), d = new THREE.Quaternion(), v = new THREE.Vector3();
  let bent = 0, fwdN = 0;
  for (let i = 0; i < track.values.length; i += 4) {
    q.fromArray(track.values, i);
    d.copy(inv).multiply(q);
    const ang = 2 * Math.acos(Math.min(1, Math.abs(d.w)));
    if (ang < BENT) continue;
    bent++;
    v.copy(shin).applyQuaternion(d).sub(shin);
    if (v.dot(fwd) > 0) fwdN++;
  }
  return bent > 0 && fwdN * 2 > bent;
}

function invertDelta(track, bone) {
  const rest = bone.quaternion; const inv = rest.clone().invert();
  const q = new THREE.Quaternion(), d = new THREE.Quaternion();
  for (let i = 0; i < track.values.length; i += 4) {
    q.fromArray(track.values, i);
    d.copy(inv).multiply(q).invert();
    q.copy(rest).multiply(d).normalize();
    q.toArray(track.values, i);
  }
}

// Devuelve la lista de «clip:lado» corregidos. Modifica los clips en sitio (una vez por glTF cacheado).
export function fixKnees(root, animations = []) {
  const fixed = [];
  if (!animations.length) return fixed;
  const b = boneMap(root);
  for (const s of SIDES) {
    const knee = b[s + 'Leg'], foot = b[s + 'Foot'];
    if (!knee || !foot) continue;
    const fwd = forwardIn(knee, root);
    for (const clip of animations) {
      const kt = trackOf(clip, knee, 'quaternion');
      if (!kt || !kneeForward(kt, knee, foot, fwd)) continue;
      invertDelta(kt, knee);
      const ft = trackOf(clip, foot, 'quaternion');
      if (ft) invertDelta(ft, foot);
      fixed.push(clip.name + ':' + s);
    }
  }
  return fixed;
}
