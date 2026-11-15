// Height, tiled regolith and the distant rim. The landing ellipse stays gentle so the garden still sits on the ground.
import { patchDunes } from '../render/terrain.js';

export const MARS_SUN = { x: -0.62, y: 0.5, z: 0.32 };
export const MARS_HORIZON = 0xc9844a;

const CRATERS = [
  { x: 78, z: -46, r: 22, d: 2.6 },
  { x: -96, z: 58, r: 30, d: 3.4 },
  { x: 36, z: 118, r: 18, d: 2.1 },
  { x: -64, z: -112, r: 16, d: 1.8 },
  { x: 150, z: 36, r: 42, d: 4.8 },
  { x: -168, z: -24, r: 36, d: 4.2 },
  { x: 18, z: -86, r: 12, d: 1.4 },
  { x: -28, z: 96, r: 14, d: 1.5 },
];

const MESAS = [
  { x: 250, z: -80, r: 38, h: 28 },
  { x: -270, z: 60, r: 46, h: 34 },
  { x: 80, z: 290, r: 32, h: 22 },
  { x: -40, z: -300, r: 40, h: 30 },
  { x: 210, z: 220, r: 28, h: 18 },
  { x: -220, z: -210, r: 34, h: 26 },
  { x: 300, z: 40, r: 22, h: 16 },
];

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

export function marsGround(x, z) {
  let y = 0.25 * Math.sin(x * 0.18) * Math.cos(z * 0.15) + 0.12 * Math.sin(x * 0.49 + z * 0.26);
  const dist = Math.hypot(x, z);
  const far = clamp01((dist - 65) / 40);
  y += Math.sin(x * 0.024 + Math.sin(z * 0.03)) * Math.cos(z * 0.019) * 5 * far;
  y += Math.sin(x * 0.011 + 1.7) * Math.cos(z * 0.009) * 1.6 * far;
  for (const c of CRATERS) {
    const rr = Math.hypot(x - c.x, z - c.z) / c.r;
    if (rr >= 1.2) continue;
    const bowl = Math.exp(-rr * rr * 3.1);
    const rim = Math.exp(-(rr - 0.92) * (rr - 0.92) * 42) * 0.38;
    y += (-c.d * bowl + c.d * rim) * (0.25 + 0.75 * far);
  }
  return y;
}

function mesaGeometry(THREE, radius, height) {
  const geo = new THREE.CylinderGeometry(radius * 0.86, radius, height, 12, 5, false);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 0.31 + z * 0.22) * Math.cos(z * 0.17 + y * 0.05);
    const top = y > height * 0.28 ? 1 : 0.25;
    p.setXYZ(i, x * (1 + n * 0.05), y + n * 0.7 * top, z * (1 + n * 0.05));
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildTerrain(THREE, Q, maps) {
  const group = new THREE.Group();
  const span = 820;
  const seg = Q.high ? 180 : 96;
  const sand = new THREE.PlaneGeometry(span, span, seg, seg);
  sand.rotateX(-Math.PI / 2);
  const a = sand.attributes.position;
  const color = new Float32Array(a.count * 3);
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), z = a.getZ(i);
    const h = marsGround(x, z);
    a.setY(i, h);
    let shade = 0.92 + 0.08 * Math.sin(x * 0.07) * Math.sin(z * 0.06);
    for (const c of CRATERS) {
      const rr = Math.hypot(x - c.x, z - c.z) / c.r;
      if (rr < 0.85) shade *= 0.72 + 0.2 * rr;
    }
    color[i * 3] = color[i * 3 + 1] = color[i * 3 + 2] = shade;
  }
  sand.setAttribute('color', new THREE.BufferAttribute(color, 3));
  sand.computeVertexNormals();
  const mat = patchDunes(new THREE.MeshStandardMaterial({
    map: maps.albedo,
    normalMap: maps.normal,
    roughnessMap: maps.rough,
    vertexColors: true,
    roughness: 0.96,
    metalness: 0,
  }));
  const ground = new THREE.Mesh(sand, mat);
  ground.receiveShadow = true;
  ground.castShadow = false;
  ground.userData.noCast = true;
  group.add(ground);

  const rockMat = new THREE.MeshStandardMaterial({
    map: maps.albedo,
    normalMap: maps.normal,
    roughnessMap: maps.rough,
    roughness: 0.94,
    metalness: 0,
    color: 0xd7c2b2,
  });
  return { group, ground, rockMat, sand, mat };
}

export function scatterRocks(THREE, parent, rockMat, boulderGeo, Q) {
  const bouldersN = Q.high ? 56 : 22;
  const pebblesN = Q.high ? 160 : 70;
  const dummy = new THREE.Object3D();
  const place = (mesh, n, scaleOf, minR) => {
    let kept = 0;
    for (let i = 0; i < n * 3 && kept < n; i++) {
      const ang = i * 2.39996;
      const r = minR + ((i * 19.7) % (340 - minR));
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      if (Math.hypot(x, z) < 7) continue;
      const s = scaleOf(kept);
      dummy.position.set(x, marsGround(x, z) - s * 0.18, z);
      dummy.scale.set(s * (0.8 + (kept % 5) * 0.08), s * (0.45 + (kept % 4) * 0.1), s * (0.75 + (kept % 6) * 0.07));
      dummy.rotation.set(kept * 0.7, kept * 1.3, 0.1 * (kept % 3));
      dummy.updateMatrix();
      mesh.setMatrixAt(kept, dummy.matrix);
      kept++;
    }
    mesh.count = kept;
    mesh.instanceMatrix.needsUpdate = true;
  };
  const boulders = new THREE.InstancedMesh(boulderGeo, rockMat, bouldersN);
  boulders.castShadow = !!Q.high;
  boulders.receiveShadow = !!Q.high;
  place(boulders, bouldersN, (i) => 0.7 + (i % 6) * 0.28, 14);
  const pebbles = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), rockMat, pebblesN);
  pebbles.castShadow = false;
  pebbles.receiveShadow = !!Q.high;
  pebbles.userData.noCast = true;
  place(pebbles, pebblesN, (i) => 0.18 + (i % 5) * 0.07, 8);
  parent.add(boulders, pebbles);

  const cliffMat = rockMat.clone();
  cliffMat.color = new THREE.Color(0xe4c2a4);
  const mesas = MESAS.map((m) => {
    const mesh = new THREE.Mesh(mesaGeometry(THREE, m.r, m.h), cliffMat);
    const y = marsGround(m.x, m.z);
    mesh.position.set(m.x, y + m.h * 0.32, m.z);
    mesh.rotation.y = m.x * 0.01;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.noShadow = true;
    parent.add(mesh);
    return mesh;
  });
  return { boulders, pebbles, mesas, cliffMat };
}
