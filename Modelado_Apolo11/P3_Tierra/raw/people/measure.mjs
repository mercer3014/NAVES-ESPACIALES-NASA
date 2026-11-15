// Mediciones de animacion en three.js (r187 del juego): deslizamiento de pies en walk con raiz a velocidad constante,
// saltos de bucle y continuidad idle <-> talk/point/wave. Uso: node measure.mjs a.glb [b.glb ...]
import fs from 'node:fs';
const T = '/workspace/apolo11/game/node_modules/three';
const THREE = await import(T + '/build/three.module.js');
const { GLTFLoader } = await import(T + '/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import(T + '/examples/jsm/libs/meshopt_decoder.module.js');
const res = [];
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const g = await new Promise((r, j) => loader.parse(ab, '', r, j));
  const root = g.scene; const arm = root.getObjectByName('armature') || root.getObjectByName('Armature');
  let ext = {}; root.traverse(o => { if (o.userData && o.userData.walk_speed_mps) ext = o.userData; });
  const v = ext.walk_speed_mps;
  const meshes = []; root.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  const shoes = meshes.filter(m => (m.material?.name || '') === 'shoes');
  const mixer = new THREE.AnimationMixer(root);
  const clip = n => g.animations.find(c => c.name === n);
  const bones = []; root.traverse(o => { if (o.isBone) bones.push(o); });
  function poseAt(name, t) { mixer.stopAllAction(); const a = mixer.clipAction(clip(name)); a.reset().play(); mixer.setTime(t); root.updateMatrixWorld(true); }
  function bonePos() { return bones.map(b => b.getWorldPosition(new THREE.Vector3())); }
  function maxDiff(A, B) { let m = 0; for (let i = 0; i < A.length; i++) m = Math.max(m, A[i].distanceTo(B[i])); return m; }
  const r = { file: f.split('/').pop(), walk_speed_mps: v, cycle_s: ext.walk_cycle_s };
  // bucles
  r.loop_mm = {};
  for (const c of g.animations) { poseAt(c.name, 0); const a = bonePos(); poseAt(c.name, c.duration - 1e-4); const b = bonePos(); r.loop_mm[c.name] = +(maxDiff(a, b) * 1000).toFixed(1); }
  // continuidad con idle(0)
  if (clip('idle')) { poseAt('idle', 0); const i0 = bonePos(); r.vs_idle0_mm = {};
    for (const n of ['talk', 'point', 'wave']) if (clip(n)) { poseAt(n, 0); const s = bonePos(); poseAt(n, clip(n).duration - 1e-4); const e = bonePos(); r.vs_idle0_mm[n] = [+(maxDiff(i0, s) * 1000).toFixed(1), +(maxDiff(i0, e) * 1000).toFixed(1)]; } }
  // deslizamiento: vertices de zapato en contacto (y < 1,2 cm) con la raiz avanzando a v en +Z
  if (clip('walk') && v && shoes.length) {
    const W = clip('walk'); const steps = 240; const cycles = 2; const tmp = new THREE.Vector3();
    const tracks = new Map();   // key mesh:idx -> list of {t, p}
    for (let k = 0; k <= steps * cycles; k++) {
      const t = (k / steps) * W.duration; poseAt('walk', t % W.duration);
      for (const m of shoes) { const pos = m.geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 1) { m.getVertexPosition(i, tmp); tmp.applyMatrix4(m.matrixWorld); tmp.z += v * t;
          const key = m.uuid + ':' + i; if (!tracks.has(key)) tracks.set(key, []); tracks.get(key).push([t, tmp.x, tmp.y, tmp.z]); } }
    }
    const slipAt = (TH) => { let worst = 0, worstL = 0, worstR = 0;
    for (const [key, arr] of tracks) {
      let start = null;
      for (const [t, x, y, z] of arr) {
        if (y < TH) { if (!start) start = [x, z, t]; const d = Math.hypot(x - start[0], z - start[1]); if (d > worst) { worst = d; r._w = { key: key.split(':')[1], t0: +start[2].toFixed(3), t: +t.toFixed(3), y: +y.toFixed(4), dx: +(x - start[0]).toFixed(3), dz: +(z - start[1]).toFixed(3) }; } if (x > 0) worstL = Math.max(worstL, d); else worstR = Math.max(worstR, d); }
        else start = null;
      }
    }
    return { max: +(worst * 100).toFixed(2), left: +(worstL * 100).toFixed(2), right: +(worstR * 100).toFixed(2) }; };
    // pie (bone) tambien: velocidad mundial del hueso Foot cuando esta mas bajo
    const lowest = []; for (let k = 0; k <= steps; k++) { const t = k / steps * W.duration; poseAt('walk', t); let mn = 1e9; for (const m of shoes) { const pos = m.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { m.getVertexPosition(i, tmp); tmp.applyMatrix4(m.matrixWorld); mn = Math.min(mn, tmp.y); } } lowest.push(mn); }
    if (process.env.DBG) { const hist = {}; for (const [key, arr] of tracks) { let start = null; for (const [t, x, y, z] of arr) { if (y < 0.006) { if (!start) start = [x, z, t]; const d = Math.hypot(x - start[0], z - start[1]); if (d > 0.01 && x > 0) { const b = (start[2] / W.duration * 20 | 0) + '-' + (t / W.duration * 20 | 0); hist[b] = (hist[b] || 0) + 1; } } else start = null; } } console.log('hist (fase inicio-fase actual en 20avos, pie izq, >2cm):', JSON.stringify(hist)); }
    r.slip_cm_contacto_6mm = slipAt(0.006); r.slip_cm_contacto_12mm = slipAt(0.012);
    r.sole_min_cm = +(Math.min(...lowest) * 100).toFixed(2); r.sole_max_of_min_cm = +(Math.max(...lowest) * 100).toFixed(2);
  }
  res.push(r); console.log(JSON.stringify(r));
}
