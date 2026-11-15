// Carga real con three.js GLTFLoader + MeshoptDecoder (como el juego) y comprueba nodos, tamanos, skin y clips de P4.
// node p4_verify.mjs   (lee ../glb/*.glb propios de P4; ignora guardian/boss-arena del otro proceso)
import fs from 'node:fs';
globalThis.self = globalThis; // GLTFLoader usa self.URL; la imagen falla sin DOM (esperado) y se informa como aviso
const T = '/workspace/apolo11/game/node_modules/three';
const THREE = await import(T + '/build/three.module.js');
const { GLTFLoader } = await import(T + '/examples/jsm/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import(T + '/examples/jsm/libs/meshopt_decoder.module.js');
const DIR = new URL('../glb/', import.meta.url).pathname;
const SPEC = {
  'eva-tools': { nodes: ['geo-hammer', 'core-tube-1', 'core-tube-2', 'hasselblad', 'lec-pulley'], size: { 'geo-hammer': [0.38, 0.44], hasselblad: [0.18, 0.23] } },
  'memorial-kit': { nodes: ['apollo1-patch', 'medal-gagarin', 'medal-komarov', 'silicon-disc', 'olive-branch'], size: { 'silicon-disc': [0.037, 0.042], 'olive-branch': [0.09, 0.13], 'apollo1-patch': [0.095, 0.105] } },
  'o2-hose': { nodes: ['o2-hose', 'o2-hose-geo', 'hose-0', 'hose-1', 'hose-2', 'hose-3', 'hose-4', 'hose-5'], size: { 'o2-hose-geo': [1.9, 2.15] }, skin: { bones: 6 }, clips: ['flex'] },
};
const errSave = console.error; const texErr = []; console.error = (...a) => texErr.push(a.join(' '));
const results = []; let fails = 0;
for (const [name, spec] of Object.entries(SPEC)) {
  const f = DIR + name + '.glb'; const buf = fs.readFileSync(f); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const g = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
  const errs = []; const S = g.scene; S.updateMatrixWorld(true);
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString());
  let tris = 0; S.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  const info = { file: name + '.glb', MB: +(buf.length / 1048576).toFixed(3), tris, nodes: {}, ext: json.extensionsUsed, images: (json.images || []).map((i) => i.mimeType) };
  for (const n of spec.nodes) {
    const o = S.getObjectByName(n); if (!o) { errs.push('falta nodo ' + n); continue; }
    const b = new THREE.Box3().setFromObject(o, true); const sz = b.isEmpty() ? null : b.getSize(new THREE.Vector3());
    const p = o.getWorldPosition(new THREE.Vector3());
    info.nodes[n] = { pos: p.toArray().map((v) => +v.toFixed(3)), size: sz ? sz.toArray().map((v) => +v.toFixed(3)) : null };
    const lim = spec.size?.[n]; if (lim && sz) { const m = Math.max(sz.x, sz.y, sz.z); if (m < lim[0] || m > lim[1]) errs.push(`${n} mide ${m.toFixed(3)} m (esperado ${lim})`); }
    if (lim && !sz) errs.push(`${n} sin malla`);
  }
  const all = new THREE.Box3().setFromObject(S, true); info.minY = +all.min.y.toFixed(4); info.bbox = all.getSize(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3));
  // materiales: base color con textura donde aplica
  info.materials = []; S.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) info.materials.push(m.name + (m.map ? '[map]' : '')); });
  info.materials = [...new Set(info.materials)];
  if (spec.skin) {
    const sks = []; S.traverse((o) => { if (o.isSkinnedMesh) sks.push(o); });
    if (!sks.length) errs.push('sin SkinnedMesh');
    else {
      const sk0 = sks[0]; const bones = sk0.skeleton.bones.map((b) => b.name); info.bones = bones; info.skinnedPrimitives = sks.length;
      if (bones.length !== spec.skin.bones) errs.push('huesos ' + bones.length);
      for (let i = 0; i < 6; i++) if (bones[i] !== 'hose-' + i) errs.push('orden/nombre hueso ' + bones[i]);
      for (let i = 1; i < 6; i++) if (sk0.skeleton.bones[i].parent?.name !== 'hose-' + (i - 1)) errs.push('cadena rota en hose-' + i);
      let maxInf = 0, bad = 0, far = -1e9, fsk = null, fi = 0, bindErr = 0;
      const v = new THREE.Vector3(), r = new THREE.Vector3();
      for (const sk of sks) {
        if (sk.skeleton.bones.length !== 6) errs.push('primitiva con otro esqueleto');
        const w = sk.geometry.attributes.skinWeight, pos = sk.geometry.attributes.position;
        sk.skeleton.update();
        for (let i = 0; i < w.count; i++) { let n = 0, s = 0; for (let k = 0; k < 4; k++) { const x = w.getComponent(i, k); if (x > 1e-4) n++; s += x; } maxInf = Math.max(maxInf, n); if (Math.abs(s - 1) > 0.01) bad++;
          v.fromBufferAttribute(pos, i); r.copy(v).applyMatrix4(sk.matrixWorld); sk.applyBoneTransform(i, v); v.applyMatrix4(sk.matrixWorld); bindErr = Math.max(bindErr, v.distanceTo(r));
          if (r.z > far) { far = r.z; fsk = sk; fi = i; } }
      }
      info.maxInfluences = maxInf; info.badWeightSums = bad; info.bindPoseMaxErr = +bindErr.toFixed(5);
      if (bad) errs.push('pesos no normalizados ' + bad); if (maxInf > 4) errs.push('>4 influencias'); if (maxInf < 2) errs.push('sin mezcla de pesos entre huesos');
      // En el glb comprimido (KHR_mesh_quantization) la descuantizacion va en las inverseBindMatrices, asi que la malla
      // cruda no es comparable: se valida el reposo contra el glb SIN comprimir (raw), donde si debe coincidir exacto.
      const rb = fs.readFileSync(new URL(name + '-raw.glb', import.meta.url)); const rg = await new Promise((res, rej) => new GLTFLoader().parse(rb.buffer.slice(rb.byteOffset, rb.byteOffset + rb.byteLength), '', res, rej));
      rg.scene.updateMatrixWorld(true); let rawBind = 0; rg.scene.traverse((o) => { if (!o.isSkinnedMesh) return; o.skeleton.update(); const P = o.geometry.attributes.position;
        for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); r.copy(v).applyMatrix4(o.matrixWorld); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); rawBind = Math.max(rawBind, v.distanceTo(r)); } });
      const bc = new THREE.Box3().setFromObject(S, true), br = new THREE.Box3().setFromObject(rg.scene, true);
      info.rawBindPoseErr = +rawBind.toFixed(6); info.restBoxDiffVsRaw = +Math.max(bc.min.distanceTo(br.min), bc.max.distanceTo(br.max)).toFixed(4);
      if (rawBind > 1e-4) errs.push('raw: bind pose no coincide con la malla ' + rawBind.toFixed(4));
      if (info.restBoxDiffVsRaw > 0.003) errs.push('reposo comprimido != raw ' + info.restBoxDiffVsRaw);
      delete info.bindPoseMaxErr;
      const pos = fsk.geometry.attributes.position;
      const skinned = () => { S.updateMatrixWorld(true); fsk.skeleton.update(); v.fromBufferAttribute(pos, fi); fsk.applyBoneTransform(fi, v); return v.clone().applyMatrix4(fsk.matrixWorld); };
      const rest = skinned(); info.tipRest = rest.toArray().map((x) => +x.toFixed(3));
      const mixer = new THREE.AnimationMixer(S); const clip = g.animations.find((c) => c.name === 'flex');
      if (clip) { mixer.clipAction(clip).play(); let mx = 0, minY = 1e9; for (let k = 1; k <= 16; k++) { mixer.setTime(clip.duration * k / 16); const q = skinned(); mx = Math.max(mx, q.distanceTo(rest)); }
        mixer.setTime(clip.duration); info.tipLoopErr = +skinned().distanceTo((mixer.setTime(0), skinned())).toFixed(4);
        info.tipMaxMove = +mx.toFixed(3); if (mx < 0.05) errs.push('flex no mueve la punta'); }
    }
  }
  info.clips = Object.fromEntries(g.animations.map((c) => [c.name, +c.duration.toFixed(2)]));
  for (const c of spec.clips || []) if (!info.clips[c]) errs.push('falta clip ' + c);
  info.ok = errs.length === 0; info.errs = errs; if (!info.ok) fails++;
  results.push(info); console.log(JSON.stringify(info));
}
console.error = errSave; if (texErr.length) console.log('avisos de textura (Node sin DOM, esperado):', texErr.length, texErr[0]?.slice(0, 120));
fs.writeFileSync(new URL('p4_verify.out.json', import.meta.url), JSON.stringify(results, null, 1));
console.log(fails ? `FALLAN ${fails}` : 'TODO OK'); process.exit(fails ? 1 : 0);
