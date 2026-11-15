// Compresion de los glb de P3-2 conservando nodos con nombre y empties (npc-spot-*, light-*).
// Equivale a `gltf-transform optimize --compress meshopt --texture-compress webp` pero sin flatten/join/prune
// de hojas vacias, e instancia (EXT_mesh_gpu_instancing) por padre para que console-row-N siga existiendo.
// Uso: node compress_glb.mjs in.glb out.glb [minInstancias=3]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = process.env.HOME + '/.local/lib/node_modules/@gltf-transform/cli/node_modules/';
const { NodeIO } = require(base + '@gltf-transform/core');
const { ALL_EXTENSIONS, EXTMeshGPUInstancing } = require(base + '@gltf-transform/extensions');
const { dedup, prune, textureCompress, meshopt, resample } = require(base + '@gltf-transform/functions');
const { MeshoptEncoder, MeshoptDecoder } = require(base + 'meshoptimizer');
const sharp = require(base + 'sharp');

const [,, inp, out, minArg] = process.argv;
const MIN = Number(minArg || 3);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inp);

function instancePerParent(doc, min) {
  const root = doc.getRoot();
  const ext = doc.createExtension(EXTMeshGPUInstancing);
  let batches = 0, inst = 0;
  const parents = new Set();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parents.add(n);
  for (const parent of parents) {
    const groups = new Map();
    for (const c of parent.listChildren()) {
      const m = c.getMesh();
      if (!m || c.listChildren().length || c.getSkin()) continue;
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m).push(c);
    }
    for (const [mesh, nodes] of groups) {
      if (nodes.length < min) continue;
      const buf = root.listBuffers()[0];
      const T = doc.createAccessor().setType('VEC3').setArray(new Float32Array(nodes.length * 3)).setBuffer(buf);
      const R = doc.createAccessor().setType('VEC4').setArray(new Float32Array(nodes.length * 4)).setBuffer(buf);
      const S = doc.createAccessor().setType('VEC3').setArray(new Float32Array(nodes.length * 3)).setBuffer(buf);
      nodes.forEach((n, i) => { T.setElement(i, n.getTranslation()); R.setElement(i, n.getRotation()); S.setElement(i, n.getScale()); });
      const batch = ext.createInstancedMesh().setAttribute('TRANSLATION', T).setAttribute('ROTATION', R).setAttribute('SCALE', S);
      const bn = doc.createNode(mesh.getName() + '-instances').setMesh(mesh).setExtension('EXT_mesh_gpu_instancing', batch);
      bn.setExtras({ instances: nodes.map((n) => n.getName()) });
      parent.addChild(bn);
      for (const n of nodes) n.dispose();
      batches++; inst += nodes.length;
    }
  }
  if (!batches) ext.dispose();
  console.log(`instancing: ${batches} lotes, ${inst} instancias`);
}

await doc.transform(dedup({ propertyTypes: ['Accessor', 'Texture'] }));
instancePerParent(doc, MIN);
await doc.transform(
  prune({ keepLeaves: true, keepAttributes: false, keepExtras: true }),
  resample(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512] }),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
await io.write(out, doc);
const fs = require('fs');
console.log(out, (fs.statSync(out).size / 1048576).toFixed(3), 'MB');
