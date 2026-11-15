// Anade KHR_materials_variants (shirt-a/b/c) a controller-extra: material base shirt-white + shirt-blue + shirt-tan.
// Uso: node add_variants.mjs in.glb out.glb   (luego comprimir con la regla 7)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const base = process.env.HOME + '/.local/lib/node_modules/@gltf-transform/cli/node_modules/';
const { NodeIO } = require(base + '@gltf-transform/core');
const { ALL_EXTENSIONS, KHRMaterialsVariants } = require(base + '@gltf-transform/extensions');
const [,, inp, out] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const root = doc.getRoot();
const arm = root.listNodes().find((n) => n.getExtras()?.shirt_variants);
const cols = arm.getExtras().shirt_variants; const names = arm.getExtras().shirt_materials;
const white = root.listMaterials().find((m) => m.getName() === 'shirt-white');
const hex = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); return c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); };
const ext = doc.createExtension(KHRMaterialsVariants);
const mats = {}; const variants = {};
for (const k of Object.keys(cols)) {
  mats[k] = k === 'a' ? white : white.clone().setName(names[k]);
  mats[k].setBaseColorFactor([...hex(cols[k]), 1]);
  variants[k] = ext.createVariant('shirt-' + k);
}
let n = 0;
for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
  if (prim.getMaterial() !== white) continue;
  const mv = ext.createMappingList();
  for (const k of Object.keys(cols)) mv.addMapping(ext.createMapping().setMaterial(mats[k]).addVariant(variants[k]));
  prim.setExtension('KHR_materials_variants', mv); n++;
}
await io.write(out, doc);
console.log('variantes', Object.keys(cols).join(','), 'en', n, 'primitivas');
