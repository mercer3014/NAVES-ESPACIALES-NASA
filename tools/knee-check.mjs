// Uso: node tools/knee-check.mjs <glb> [clip...]  (FIX=1 aplica src/core/fix-knees.js) — ¿la rodilla se dobla hacia atrás (bien) o hacia adelante (mal)?
// Mide el ángulo de flexión firmado en el plano sagital: + = pie detrás de la línea cadera-rodilla (natural).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import fs from 'fs';
globalThis.self = globalThis;
const origWarn = console.warn; console.warn = () => {};
const f = process.argv[2]; const clips = process.argv.slice(3);
const buf = fs.readFileSync(f);
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); await MeshoptDecoder.ready;
const { fixKnees } = await import('../src/core/fix-knees.js');
L.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', (g) => {
  if (process.env.FIX) console.log('fixed', fixKnees(g.scene, g.animations).join(' '));
  const root = g.scene; const bone = (re) => { let b = null; root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
  const H = bone(/^(mixamorig:?)?Hips$/i) || bone(/hips|pelvis/i);
  const sides = ['Left', 'Right'].map((s) => ({ s, up: bone(new RegExp(s + 'UpLeg$|' + s.toLowerCase() + '_?thigh', 'i')), kn: bone(new RegExp(s + 'Leg$|' + s.toLowerCase() + '_?calf|shin', 'i')), ft: bone(new RegExp(s + 'Foot$', 'i')) }));
  const mixer = new THREE.AnimationMixer(root);
  const fwd = new THREE.Vector3();
  const measure = () => {
    root.updateMatrixWorld(true);
    // adelante del personaje: eje Z local de las caderas proyectado (glTF mira a +Z)
    const out = [];
    for (const { s, up, kn, ft } of sides) {
      if (!up || !kn || !ft) { out.push(s + ':?'); continue; }
      const a = up.getWorldPosition(new THREE.Vector3()), b = kn.getWorldPosition(new THREE.Vector3()), c = ft.getWorldPosition(new THREE.Vector3());
      fwd.set(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
      const thigh = b.clone().sub(a).normalize(), shin = c.clone().sub(b).normalize();
      const ang = Math.acos(Math.max(-1, Math.min(1, thigh.dot(shin)))) * 57.3;
      // signo: si la espinilla se va hacia adelante respecto al muslo, la rodilla está al revés
      const side = shin.clone().sub(thigh).dot(fwd);
      out.push(`${s}:${ang.toFixed(0)}°${ang > 8 ? (side > 0 ? '(ADELANTE!)' : '(atrás)') : ''}`);
    }
    return out.join(' ');
  };
  console.log('rest  ', measure());
  for (const c of g.animations) {
    if (clips.length && !clips.includes(c.name)) continue;
    const act = mixer.clipAction(c); act.play();
    let worst = { bad: 0 }; const rows = [];
    for (let i = 0; i <= 8; i++) { mixer.setTime((c.duration * i) / 8); rows.push(measure()); }
    mixer.stopAllAction(); mixer.uncacheAction(c);
    const bad = rows.filter((r) => r.includes('ADELANTE')).length;
    console.log(c.name.padEnd(10), bad ? `MAL ${bad}/9` : 'ok', '|', rows.filter((_, i) => i % 2 === 0).join(' | '));
  }
}, (e) => console.error(e));
