// Build-machine packer (gltf-transform + meshopt). Not a production dependency.
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, quantize } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});

const [src, dst, texDir] = process.argv.slice(2);
const doc = await io.read(src);
if (texDir) {
  for (const tex of doc.getRoot().listTextures()) {
    const file = `${texDir}/${tex.getName()}.webp`;
    if (fs.existsSync(file)) {
      tex.setImage(fs.readFileSync(file));
      tex.setMimeType('image/webp');
      console.log('replaced', tex.getName(), fs.statSync(file).size);
    }
  }
}
await doc.transform(
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(dst, doc);
console.log('wrote', dst, fs.statSync(dst).size);
