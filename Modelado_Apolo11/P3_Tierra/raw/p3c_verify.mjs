// Verifica glb comprimidos de P3-3/P3-4: nodos requeridos, bbox por nodo (m, Y-up), tris, morphs, clips, texturas.
// node p3c_verify.mjs file.glb nodo1,nodo2,...
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = process.env.HOME + '/.local/lib/node_modules/@gltf-transform/cli/node_modules/';
const { NodeIO, getBounds } = require(base + '@gltf-transform/core');
const { ALL_EXTENSIONS } = require(base + '@gltf-transform/extensions');
const { MeshoptDecoder } = require(base + 'meshoptimizer');
const fs = require('fs');
await MeshoptDecoder.ready;
const [,, file, req = ''] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);
const root = doc.getRoot();
const nodes = root.listNodes();
const byName = new Map(nodes.map((n) => [n.getName(), n]));
let tris = 0, morph = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  const idx = p.getIndices(); const pos = p.getAttribute('POSITION');
  tris += (idx ? idx.getCount() : pos.getCount()) / 3; morph = Math.max(morph, p.listTargets().length);
}
const sz = fs.statSync(file).size;
const scene = root.listScenes()[0];
const b = getBounds(scene);
const d = b.max.map((v, i) => (v - b.min[i]).toFixed(2));
console.log(`FILE ${file}\n  size ${(sz/1048576).toFixed(3)} MB  tris ${tris}  bbox(XYZ, Y-up) ${d.join(' x ')} m  min[Y]=${b.min[1].toFixed(3)}`);
console.log('  extensions', root.listExtensionsUsed().map((e) => e.extensionName).join(','));
console.log('  textures', root.listTextures().map((t) => `${t.getMimeType()} ${t.getSize()}`).join('; ') || 'none');
console.log('  materials', root.listMaterials().length, ' max morph targets', morph);
for (const a of root.listAnimations()) {
  const chans = a.listChannels();
  const s = chans[0].getSampler().getInput();
  const arr = s.getArray();
  console.log(`  clip '${a.getName()}' channels=${chans.length} dur=${arr[arr.length-1].toFixed(2)}s paths=${[...new Set(chans.map((c) => c.getTargetPath()))].join(',')}`);
  for (const c of chans) {
    const out = c.getSampler().getOutput().getArray(); const n = c.getSampler().getInput().getCount();
    const w = out.length / n; let diff = 0;
    for (let i = 0; i < w; i++) diff = Math.max(diff, Math.abs(out[i] - out[out.length - w + i]));
    if (diff > 1e-3) console.log(`    WARN loop seam ${c.getTargetNode().getName()} ${c.getTargetPath()} diff=${diff.toFixed(4)}`);
  }
}
let miss = [];
for (const r of req.split(',').filter(Boolean)) {
  const n = byName.get(r);
  if (!n) { miss.push(r); continue; }
  let info = '';
  try { const bb = getBounds(n); if (isFinite(bb.min[0])) info = bb.max.map((v, i) => (v - bb.min[i]).toFixed(3)).join(' x '); } catch (e) {}
  const t = n.getWorldTranslation().map((v) => v.toFixed(2)).join(',');
  const ex = n.getExtras(); const q = n.getRotation(); const fz = [2*(q[0]*q[2]+q[3]*q[1]), 2*(q[1]*q[2]-q[3]*q[0]), 1-2*(q[0]*q[0]+q[1]*q[1])].map((v) => v.toFixed(2)).join(',');
  console.log(`  node ${r.padEnd(18)} pos(${t}) ${info ? 'size ' + info + ' m' : '(empty)'}${Object.keys(ex).length ? ' +Z->(' + fz + ') extras ' + JSON.stringify(ex) : ''}`);
}
console.log(miss.length ? `  MISSING: ${miss.join(',')}` : '  all required nodes present');
console.log(sz <= 1.5*1048576 ? '  size OK (<=1.5 MB)' : '  SIZE FAIL');
