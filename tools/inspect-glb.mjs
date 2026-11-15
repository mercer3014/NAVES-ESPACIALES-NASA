import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import fs from 'fs';
const f = process.argv[2]; const buf = fs.readFileSync(f);
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); await MeshoptDecoder.ready;
globalThis.self = globalThis;
L.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', (g) => {
  g.scene.updateMatrixWorld(true);
  g.scene.traverse((o) => { const p = new THREE.Vector3(); o.getWorldPosition(p);
    let extra=''; if (o.isMesh) { const b = new THREE.Box3().setFromObject(o); extra = ` bbox ${b.min.toArray().map(v=>v.toFixed(2))} .. ${b.max.toArray().map(v=>v.toFixed(2))} tris ${(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3}`; }
    if (process.argv[3]==='all' || !o.isMesh || /engine|f1|j2|ullage|retro|interstage/.test(o.name)) console.log(o.name, o.type, p.toArray().map(v=>v.toFixed(2)).join(','), extra); });
  if (process.argv[4]) { const m = g.scene.getObjectByName(process.argv[4]); const pos = m.geometry.attributes.position; const v = new THREE.Vector3(); const pts=[];
    for (let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld); if (v.y < 0.3) pts.push([v.x,v.z]); }
    // cluster
    const cl=[]; for (const [x,z] of pts){ let c=cl.find(c=>Math.hypot(c.x/c.n-x,c.z/c.n-z)<2); if(!c){c={x:0,z:0,n:0,r:0};cl.push(c);} c.x+=x;c.z+=z;c.n++; }
    console.log(cl.map(c=>[ (c.x/c.n).toFixed(2), (c.z/c.n).toFixed(2), c.n]));
  }
}, (e) => console.error(e));
