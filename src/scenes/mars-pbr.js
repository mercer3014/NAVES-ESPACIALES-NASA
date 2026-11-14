// Regolith maps load only with the Mars phase. KTX2 is the GPU path; WebP is the fallback.
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const REPEAT = 64;

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

export async function loadRegolith(THREE, renderer) {
  const names = [['albedo', true], ['normal', false], ['rough', false]];
  try {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js');
    const loader = new KTX2Loader().setTranscoderPath('/tex/basis/');
    loader.detectSupport(renderer);
    const maps = await withTimeout(Promise.all(names.map(([name, srgb]) => new Promise((resolve, reject) => {
      loader.load('/tex/mars/regolith_' + name + '.ktx2', (texture) => {
        texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.repeat.set(REPEAT, REPEAT);
        resolve(texture);
      }, undefined, reject);
    }))), 12000, 'KTX2 transcoder timed out');
    loader.dispose();
    return { albedo: maps[0], normal: maps[1], rough: maps[2], kind: 'ktx2' };
  } catch (error) {
    console.warn('Regolith KTX2 unavailable, using WebP', error);
    const loader = new THREE.TextureLoader();
    const maps = await Promise.all(names.map(([name, srgb]) => new Promise((resolve, reject) => {
      loader.load('/tex/mars/regolith_' + name + '.webp', (texture) => {
        texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.repeat.set(REPEAT, REPEAT);
        resolve(texture);
      }, undefined, reject);
    })));
    return { albedo: maps[0], normal: maps[1], rough: maps[2], kind: 'webp' };
  }
}

// The boulder is a phase asset: meshopt, decoded with the same loader the rover uses.
export async function loadBoulder(THREE) {
  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync('/models/mars-boulder.glb');
    let geo = null;
    gltf.scene.traverse((o) => { if (!geo && o.isMesh) geo = o.geometry; });
    if (!geo) throw new Error('boulder has no mesh');
    geo.computeVertexNormals();
    return geo;
  } catch (error) {
    console.warn('Meshopt boulder unavailable, using a generated rock', error);
    return new THREE.IcosahedronGeometry(1, 2);
  }
}
