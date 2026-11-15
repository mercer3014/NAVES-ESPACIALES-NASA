// Carga en Node con three GLTFLoader + MeshoptDecoder y verifica nodos, skin, pesos, clips, pies y alturas.
// node check_three.mjs guardian.glb | boss-arena.glb
import fs from 'node:fs';
const G = '/workspace/apolo11/game/node_modules/three/';
globalThis.self = globalThis;
if (!globalThis.createImageBitmap) globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
const THREE = await import(G + 'build/three.module.js');
const { GLTFLoader } = await import(G + 'examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import(G + 'examples/jsm/libs/meshopt_decoder.module.js');
const file = process.argv[2];
const buf = fs.readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const origWarn = console.warn; console.warn = (...a) => { if (!String(a[0]).includes('texture')) origWarn(...a); };
const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
const root = gltf.scene; root.updateMatrixWorld(true);
const out = { file, sizeMB: +(buf.length / 1048576).toFixed(3) };
const names = []; root.traverse((o) => names.push(o.name));
let tris = 0; const skinned = []; const skeletons = new Set();
root.traverse((o) => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; }
  if (o.isSkinnedMesh) { skinned.push(o); skeletons.add(o.skeleton); } });
out.tris = tris;
const box = new THREE.Box3().setFromObject(root); const sz = box.getSize(new THREE.Vector3());
out.bbox = { size: sz.toArray().map((v) => +v.toFixed(2)), min: box.min.toArray().map((v) => +v.toFixed(3)), max: box.max.toArray().map((v) => +v.toFixed(3)) };
out.clips = gltf.animations.map((a) => ({ name: a.name, dur: +a.duration.toFixed(4), tracks: a.tracks.length }));
const want = process.argv[3] ? process.argv[3].split(',') : [];
out.missing = want.filter((n) => !names.includes(n));
out.skins = skeletons.size; out.skinnedMeshes = skinned.map((m) => m.name);
if (skinned.length) {
  const sk = skinned[0].skeleton; out.bones = sk.bones.length; out.boneNames = sk.bones.map((b) => b.name);
  const sw = skinned[0].geometry.attributes.skinWeight; let bad = 0, maxDev = 0;
  for (let i = 0; i < sw.count; i++) { const s = sw.getX(i) + sw.getY(i) + sw.getZ(i) + sw.getW(i); maxDev = Math.max(maxDev, Math.abs(1 - s)); if (Math.abs(1 - s) > 0.01) bad++; }
  out.weights = { verts: sw.count, perVertex: sw.itemSize, notNormalized: bad, maxDev: +maxDev.toFixed(4) };
  // parentesco de piezas rigidas
  out.rigid = {};
  for (const n of ['plate-shoulder-l', 'plate-shoulder-r', 'plate-knee-l', 'plate-knee-r', 'core-dsky', 'fuel-tank']) {
    const o = root.getObjectByName(n); out.rigid[n] = o ? (o.parent?.isBone ? 'bone:' + o.parent.name : 'parent:' + o.parent?.name) : 'FALTA';
  }
  // simulacion de clips
  const mesh = skinned[0]; const mixer = new THREE.AnimationMixer(root);
  const v = new THREE.Vector3(); const B = (n) => root.getObjectByName(n);
  const pts = ['hand-l', 'hand-r', 'foot-l', 'foot-r'];
  out.sim = {};
  // vertices de contacto en reposo (y < 0.05) por hueso dominante
  const pos = mesh.geometry.attributes.position, si = mesh.geometry.attributes.skinIndex;
  const contact = { 'hand-l': [], 'hand-r': [], 'foot-l': [], 'foot-r': [] };
  root.updateMatrixWorld(true);
  for (let i = 0; i < pos.count; i++) {
    mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld);
    if (v.y < 0.06) { const b = sk.bones[si.getX(i)].name; if (contact[b]) contact[b].push(i); }
  }
  out.contactVerts = Object.fromEntries(Object.entries(contact).map(([k, a]) => [k, a.length]));
  for (const clip of gltf.animations) {
    mixer.stopAllAction(); const act = mixer.clipAction(clip); act.reset().play();
    const N = Math.round(clip.duration * 30);
    const start = {}; const slide = {}; let minY = 1e9, minYt = 0; const handY = []; const coreS = [];
    for (let f = 0; f <= N; f++) {
      mixer.setTime(f / 30); root.updateMatrixWorld(true);
      let fmin = 1e9;
      for (let i = 0; i < pos.count; i += 1) { mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld); if (v.y < fmin) fmin = v.y; }
      if (fmin < minY) { minY = fmin; minYt = f / 30; }
      for (const k of pts) {
        const ids = contact[k]; if (!ids.length) continue;
        const c = new THREE.Vector3(); let lo = 1e9;
        for (const i of ids) { mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld); c.add(v); lo = Math.min(lo, v.y); }
        c.divideScalar(ids.length);
        if (!start[k]) start[k] = c.clone();
        slide[k] = slide[k] || { maxXZ: 0, maxY: 0, minY: 1e9 };
        slide[k].maxXZ = Math.max(slide[k].maxXZ, Math.hypot(c.x - start[k].x, c.z - start[k].z));
        slide[k].maxY = Math.max(slide[k].maxY, lo); slide[k].minY = Math.min(slide[k].minY, lo);
        if (k.startsWith('hand')) handY.push([f, k, lo]);
      }
      const core = B('core'); if (core) coreS.push(core.scale.x);
    }
    const r = { frames: N + 1, minVertexY: +minY.toFixed(3), minAt: +minYt.toFixed(3), contacts: {} };
    for (const k in slide) r.contacts[k] = { slideXZ: +slide[k].maxXZ.toFixed(3), lowestY_min: +slide[k].minY.toFixed(3), lowestY_max: +slide[k].maxY.toFixed(3) };
    if (clip.name === 'slam') {
      // impacto: primer frame tras el pico en que ambas manos tocan el suelo (y<0.1)
      const byF = {}; for (const [f, k, y] of handY) (byF[f] = byF[f] || {})[k] = y;
      let peak = 0, peakF = 0; for (const f in byF) { const m = Math.min(byF[f]['hand-l'], byF[f]['hand-r']); if (m > peak) { peak = m; peakF = +f; } }
      let imp = null; for (const f in byF) { if (+f > peakF && Math.max(byF[f]['hand-l'], byF[f]['hand-r']) < 0.15) { imp = +f; break; } }
      r.handPeakY = +peak.toFixed(2); r.handPeakAt = +(peakF / 30).toFixed(3); r.impactFrame = imp; r.impactSec = imp != null ? +(imp / 30).toFixed(4) : null;
      r.handYAround = Object.entries(byF).filter(([f]) => Math.abs(f - (imp ?? 37)) <= 3).map(([f, o]) => [+f, +o['hand-l'].toFixed(2), +o['hand-r'].toFixed(2)]);
    }
    if (coreS.length) r.coreScale = [+Math.min(...coreS).toFixed(3), +Math.max(...coreS).toFixed(3)];
    out.sim[clip.name] = r;
  }
}
// nodos vacios / posiciones
out.nodes = {};
for (const n of want) { const o = root.getObjectByName(n); if (o) { const p = new THREE.Vector3(); o.getWorldPosition(p); out.nodes[n] = p.toArray().map((x) => +x.toFixed(2)); } }
console.log(JSON.stringify(out, null, 1));
