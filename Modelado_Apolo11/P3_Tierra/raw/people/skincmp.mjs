// compara la malla deformada (skin) entre glb sin comprimir y comprimido en varios clips
import fs from 'node:fs';
const T = '/workspace/apolo11/game/node_modules/three';
const THREE = await import(T + '/build/three.module.js');
const { GLTFLoader } = await import(T + '/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import(T + '/examples/jsm/libs/meshopt_decoder.module.js');
async function load(f) { const b = fs.readFileSync(f); const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder); return new Promise((r, j) => l.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length), '', r, j)); }
function sample(g, clip, t) {
  const m = new THREE.AnimationMixer(g.scene); const c = g.animations.find(a => a.name === clip); m.clipAction(c).play(); m.setTime(t); g.scene.updateMatrixWorld(true);
  const box = new THREE.Box3(); const v = new THREE.Vector3();
  g.scene.traverse(sk => { if (!sk.isSkinnedMesh) return; sk.skeleton.update(); const n = sk.geometry.attributes.position.count;
    for (let i = 0; i < n; i++) { sk.getVertexPosition(i, v); v.applyMatrix4(sk.matrixWorld); box.expandByPoint(v); } });
  return box;
}
for (const name of process.argv.slice(2)) {
  const a = await load(`out/${name}-raw.glb`), b = await load(`../../glb/${name}.glb`); const rows = [];
  for (const [clip, t] of [['idle', 1], ['walk', 0.3], ['sit', 1], ['sit-floor', 1], ['point', 1], ['wave', 0.6], ['talk', 1.5]]) {
    if (!a.animations.some(c => c.name === clip)) continue;
    const A = sample(a, clip, t), B = sample(b, clip, t);
    const d = Math.max(A.min.distanceTo(B.min), A.max.distanceTo(B.max));
    rows.push(`${clip}: alto ${(A.max.y - A.min.y).toFixed(3)} dif ${(d * 1000).toFixed(1)}mm`);
  }
  console.log(name, '|', rows.join(' | '));
}
