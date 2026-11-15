// Verifica un glb comprimido: nodos requeridos, bbox (m), tris (contando instancias), materiales, texturas, extensiones.
// Uso: node verify_glb.mjs file.glb nodo1,nodo2,...
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = process.env.HOME + '/.local/lib/node_modules/@gltf-transform/cli/node_modules/';
const { NodeIO, getBounds } = require(base + '@gltf-transform/core');
const { ALL_EXTENSIONS } = require(base + '@gltf-transform/extensions');
const { MeshoptDecoder } = require(base + 'meshoptimizer');
const fs = require('fs');
await MeshoptDecoder.ready;
const [,, file, req] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);
const root = doc.getRoot();
const names = new Set(root.listNodes().map((n) => n.getName()));
let tris = 0, trisUnique = 0;
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  const inst = n.getExtension('EXT_mesh_gpu_instancing');
  const k = inst ? inst.getAttribute('TRANSLATION').getCount() : 1;
  for (const p of m.listPrimitives()) { const t = (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3; tris += t * k; }
}
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) trisUnique += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const b = getBounds(root.listScenes()[0]);
const size = b.max.map((v, i) => +(v - b.min[i]).toFixed(2));
const missing = (req || '').split(',').filter(Boolean).filter((r) => !names.has(r));
const out = {
  file, MB: +(fs.statSync(file).size / 1048576).toFixed(3),
  trisRendered: tris, trisUnique, sizeXYZ_m: size, min: b.min.map((v) => +v.toFixed(2)), max: b.max.map((v) => +v.toFixed(2)),
  nodes: names.size, meshes: root.listMeshes().length, materials: root.listMaterials().map((m) => m.getName()),
  textures: root.listTextures().map((t) => `${t.getMimeType()} ${t.getSize()}`),
  extensions: root.listExtensionsUsed().map((e) => e.extensionName),
  missing,
};
console.log(JSON.stringify(out, null, 1));
if (missing.length) process.exit(2);
