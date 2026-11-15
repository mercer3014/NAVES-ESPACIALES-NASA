// node merge.mjs base.glb add.glb out.glb parentNode [replaceMeshOf=nodeName:newNodeName ...]
// Añade los nodos raíz de add.glb bajo parentNode del base; reasigna materiales por nombre a los del base.
import { createRequire } from 'module';
const require = createRequire('/home/box/.local/lib/node_modules/@gltf-transform/cli/node_modules/x.js');
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { mergeDocuments, prune, unpartition } = require('@gltf-transform/functions');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
let [,, base, add, out, parentName, ...repl] = process.argv;
const doc = await io.read(base); const src = await io.read(add);
const root = doc.getRoot(); const before = new Set(root.listNodes()); const matsBefore = new Map(root.listMaterials().map((m) => [m.getName(), m]));
const scenesBefore = new Set(root.listScenes());
mergeDocuments(doc, src);
const parent = root.listNodes().find((n) => before.has(n) && n.getName() === parentName);
const parMap = Object.fromEntries(repl.filter((s) => s.includes('@')).map((s) => s.split('@'))); repl = repl.filter((s) => !s.includes('@'));
const replMap = Object.fromEntries(repl.map((s) => s.split(':').reverse()));
for (const s of root.listScenes()) if (!scenesBefore.has(s)) {
  for (const n of s.listChildren()) {
    if (replMap[n.getName()]) { const tgt = root.listNodes().find((x) => before.has(x) && x.getName() === replMap[n.getName()]); tgt.setMesh(n.getMesh()); n.dispose(); continue; }
    const pn = parMap[n.getName()]; let par = parent;
    if (pn) { par = root.listNodes().find((x) => x.getName() === pn); if (!par) { par = doc.createNode(pn); parent.addChild(par); before.add(par); } }
    par.addChild(n);
  }
  s.dispose();
}
for (const m of root.listMaterials()) if (!matsBefore.has(m.getName()) || matsBefore.get(m.getName()) === m) continue; else {
  const o = matsBefore.get(m.getName()); for (const p of root.listMeshes().flatMap((x) => x.listPrimitives())) if (p.getMaterial() === m) p.setMaterial(o); }
await doc.transform(prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }), unpartition());
const names = root.listMaterials().map((m) => m.getName()); console.log('materials', names.length, [...new Set(names)].length === names.length ? 'unique' : 'DUP ' + names.join(','));
await io.write(out, doc); console.log('wrote', out);
