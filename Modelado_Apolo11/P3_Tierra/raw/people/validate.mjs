// Valida glb de civiles: node validate.mjs archivo.glb [...]
import fs from 'node:fs';
const T = '/workspace/apolo11/game/node_modules/three';
const THREE = await import(T + '/build/three.module.js');
const { GLTFLoader } = await import(T + '/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import(T + '/examples/jsm/libs/meshopt_decoder.module.js');
const BONES_JSON = ['Hips','Spine','Spine1','Spine2','Neck','Head','HeadTop_End','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','LeftToe_End','RightUpLeg','RightLeg','RightFoot','RightToeBase','RightToe_End'].map(b => 'mixamorig:' + b);
// three.js (PropertyBinding.sanitizeNodeName) quita ':' de los nombres al cargar: 'mixamorig:Hips' -> 'mixamorigHips'
const BONES = BONES_JSON.map(b => THREE.PropertyBinding.sanitizeNodeName(b));
const CLIPS_ALL = ['idle','walk','sit','sit-floor','talk','point','wave'];
const CLIPS_EXTRA = ['idle','sit','talk'];   // controller-extra (relleno del MOCR)
const out = [];
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const g = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
  const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.subarray(20, 20 + jl).toString());
  const jnames = new Set(json.nodes.map(n => n.name)); const jmiss = BONES_JSON.filter(b => !jnames.has(b));
  const errs = jmiss.length ? ['JSON sin huesos: ' + jmiss.join(',')] : []; let tris = 0, maxInf = 0, badSum = 0, skinned = null; const bones = new Set();
  g.scene.traverse(o => {
    if (o.isBone) bones.add(o.name);
    if (o.isMesh) {
      const gg = o.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3;
      if (!o.isSkinnedMesh) errs.push('malla sin skin: ' + o.name); else skinned = o;
      const w = gg.attributes.skinWeight;
      if (w) for (let i = 0; i < w.count; i++) { let n = 0, s = 0; for (let k = 0; k < 4; k++) { const v = w.getComponent(i, k); if (v > 1e-4) n++; s += v; } maxInf = Math.max(maxInf, n); if (Math.abs(s - 1) > 0.02) badSum++; }
      if (gg.attributes.skinIndex && !gg.attributes.skinIndex2 === false) errs.push('mas de 4 influencias');
    }
  });
  const miss = BONES.filter(b => !bones.has(b)); if (miss.length) errs.push('faltan huesos: ' + miss.join(','));
  const extra = [...bones].filter(b => !BONES.includes(b)); if (extra.length) errs.push('huesos extra: ' + extra.join(','));
  const clips = Object.fromEntries(g.animations.map(c => [c.name, c.duration]));
  const CLIPS = f.includes('controller-extra') ? CLIPS_EXTRA : CLIPS_ALL;
  for (const c of CLIPS) if (!(clips[c] > 0)) errs.push('clip ausente o vacio: ' + c);
  if (badSum) errs.push(`pesos no normalizados: ${badSum}`);
  // tamaño en reposo y prueba de movimiento real: pie izquierdo en walk
  g.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g.scene);
  const mixer = new THREE.AnimationMixer(g.scene); const foot = g.scene.getObjectByName(BONES[17]);
  const ys = []; const walk = g.animations.find(c => c.name === 'walk');
  if (walk && foot) { const a = mixer.clipAction(walk); a.play(); for (let i = 0; i < 8; i++) { mixer.setTime(walk.duration * i / 8); g.scene.updateMatrixWorld(true); const p = new THREE.Vector3(); foot.getWorldPosition(p); ys.push(+p.y.toFixed(3)); } }
  const footSpread = ys.length ? (Math.max(...ys) - Math.min(...ys)).toFixed(3) : 'n/a';
  if (ys.length && Math.max(...ys) - Math.min(...ys) < 0.05) errs.push('walk no mueve el pie');
  const r = { file: f.split('/').pop(), MB: +(buf.length / 1048576).toFixed(3), tris, height: +(box.max.y - box.min.y).toFixed(3), minY: +box.min.y.toFixed(3),
    bones: bones.size, jsonBoneName: BONES_JSON[0], skins: json.skins.length, jointsInSkin: json.skins[0].joints.length, maxInfluences: maxInf, clips: Object.fromEntries(Object.entries(clips).map(([k, v]) => [k, +v.toFixed(2)])), walkFootZRange: footSpread, ok: errs.length === 0, errs };
  out.push(r); console.log(JSON.stringify(r));
}
