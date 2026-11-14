// Huerto rojo surface and entry stack. Terrain, chute and aeroshell load with this phase only.
import { THREE, model, fit, Q, renderer } from '../core/engine.js';
import { DEBUG } from '../core/store.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { renderFlag, defaultFlag } from '../ui/flag.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SITES, BASE } from '../sim/mars.js';
import { marsFlightVisual, marsDress, MARS_GLASS_OPACITY } from '../game/expeditions/mars-present.js';
import { resolveOrbitPosition, stepOrbit } from '../game/orbit-camera.js';
import { marsGround, MARS_SUN, MARS_HORIZON, buildTerrain, scatterRocks } from './mars-terrain.js';
import { createSky } from './mars-sky.js';
import { buildEdl, bindWheels } from './mars-edl.js';
import { loadRegolith, loadBoulder } from './mars-pbr.js';

export { marsGround };

const chuteWorld = new THREE.Vector3();

// Chase during entry is the cinematic frame. Orbit and cockpit stay available on C / V.
function frameMarsCamera(camera, rover, dt, world, greenhouse, chute, pose, t) {
  const p = rover.position;
  const mode = world.camMode || 'chase';
  const orbit = world.orbit;
  if (mode === 'orbit' && orbit) {
    stepOrbit(orbit, dt);
    const target = { x: p.x, y: p.y + 1.1, z: p.z };
    const spheres = [];
    if (greenhouse?.visible) spheres.push({ x: greenhouse.position.x, y: greenhouse.position.y + 2.2, z: greenhouse.position.z, r: 5.4 });
    if (chute?.visible) {
      chute.updateWorldMatrix(true, false);
      chute.getWorldPosition(chuteWorld);
      spheres.push({ x: chuteWorld.x, y: chuteWorld.y, z: chuteWorld.z, r: 6.4 });
    }
    const pos = resolveOrbitPosition(target, orbit.smoothYaw, orbit.smoothPitch, orbit.smoothDistance, {
      up: 'y', minDistance: orbit.minDistance, subjectRadius: 2.4, margin: 0.35, spheres,
      floorAt: (x, _y, z) => marsGround(x, z) + 0.55,
    });
    camera.position.set(pos.x, pos.y, pos.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(target.x, target.y, target.z);
    return;
  }
  if (mode === 'cockpit') {
    const fwd = new THREE.Vector3();
    rover.getWorldDirection(fwd);
    camera.position.set(p.x - fwd.x * 5.4, p.y + 2.5, p.z - fwd.z * 5.4);
    const gy = marsGround(camera.position.x, camera.position.z) + 0.5;
    if (camera.position.y < gy) camera.position.y = gy;
    camera.up.set(0, 1, 0);
    camera.lookAt(p.x + fwd.x * 9, p.y + 1.4, p.z + fwd.z * 9);
    return;
  }
  const landing = !!pose;
  const chuteUp = !!(pose && pose.chuteOpen);
  const wide = !!(pose && (chuteUp || pose.heatshield > 0.2));
  const dist = landing ? (chuteUp ? 20 : wide ? 16 : 11) : (camera.aspect < 1 ? 19 : 14);
  const wantFov = landing && wide ? 64 : 52;
  if (Math.abs(camera.fov - wantFov) > 0.4) {
    camera.fov = wantFov;
    camera.updateProjectionMatrix();
  }
  const shake = pose?.shake || 0;
  const sx = Math.sin(t * 23) * 0.16 * shake + Math.sin(t * 41) * 0.05 * shake;
  const sy = Math.cos(t * 19) * 0.1 * shake;
  if (!landing) {
    world.camWant.set(p.x + dist * 0.65 + sx, p.y + dist * 0.42 + sy, p.z + dist);
    camera.position.lerp(world.camWant, 1 - Math.exp(-dt * 3));
    camera.lookAt(p.x, p.y + 1.1, p.z);
    return;
  }
  const camLift = chuteUp ? 0.6 : wide ? 2.4 : 4.6;
  world.camWant.set(p.x + dist * 0.18 + sx, p.y + camLift + sy, p.z + dist);
  camera.position.lerp(world.camWant, 1 - Math.exp(-dt * 3.4));
  world.look.set(p.x, p.y + (chuteUp ? 0.8 : 1.3), p.z - (chuteUp ? 4 : 0));
  camera.lookAt(world.look);
}

export async function makeMarsWorld(state, flag) {
  const [roverAsset, maps, boulderGeo] = await Promise.all([
    model('rover'),
    loadRegolith(THREE, renderer),
    loadBoulder(THREE),
  ]);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(MARS_HORIZON);
  scene.fog = new THREE.FogExp2(MARS_HORIZON, 0.0042);
  const sky = createSky(THREE);
  scene.add(sky.mesh);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.15, 1400);
  const sunDir = new THREE.Vector3(MARS_SUN.x, MARS_SUN.y, MARS_SUN.z).normalize();
  const sun = new THREE.DirectionalLight(0xffe0c2, 1.85);
  sun.target = new THREE.Object3D();
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xf2b48a, 0x5a2c18, 0.42));
  const terrain = buildTerrain(THREE, Q, maps);
  scene.add(terrain.group);
  scatterRocks(THREE, scene, terrain.rockMat, boulderGeo, Q);

  const pm = new THREE.PMREMGenerator(renderer);
  let env;
  try { env = pm.fromScene(new RoomEnvironment(), 0.04).texture; }
  catch { env = null; }
  pm.dispose();
  if (env) scene.environment = env;

  const rover = new THREE.Group();
  rover.add(fit(roverAsset, 3.2, { axis: 'max', ground: true }));
  scene.add(rover);
  const setWheels = bindWheels(rover);
  const edl = buildEdl(THREE);
  scene.add(edl.root);

  const steel = new THREE.MeshStandardMaterial({ color: 0x8c969d, metalness: 0.85, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x34302d, roughness: 0.75 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x071b35, metalness: 0.2, roughness: 0.4 });
  const mesh = (g, m, parent = scene) => { const x = new THREE.Mesh(g, m); parent.add(x); return x; };
  const bar = (p, a, b, r = 0.04, mat = steel) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
    const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, p);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  };
  const crane = new THREE.Group();
  scene.add(crane);
  const deck = mesh(new THREE.BoxGeometry(2.4, 0.12, 2.4), steel, crane);
  deck.position.y = 0.35;
  for (let i = 0; i < 4; i++) {
    const x = i % 2 ? 1.5 : -1.5, z = i < 2 ? -1.5 : 1.5;
    bar(crane, [0, 0.4, 0], [x, 0, z], 0.1);
    const tank = mesh(new THREE.SphereGeometry(0.5, 20, 12), steel, crane);
    tank.position.set(x, 0, z);
    bar(crane, [x, 0, z], [x, -0.5, z], 0.18, dark);
  }
  const jets = [];
  for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) {
    const j = mesh(new THREE.ConeGeometry(0.2, 1.6, 12), new THREE.MeshBasicMaterial({ color: 0xb2d4ff, transparent: true, opacity: 0.7 }), crane);
    j.position.set(x, -1.2, z);
    jets.push(j);
  }
  const TANKS = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
  const DECK = [[-0.75, 1.15, -0.5], [0.75, 1.15, -0.5], [-0.75, 1.15, 0.5], [0.75, 1.15, 0.5]];
  const cables = TANKS.map(() => mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 6), dark));
  cables.forEach((m) => { m.visible = false; });
  const span = (m, ax, ay, az, bx, by, bz) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz) || 0.001;
    m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    m.scale.set(1, len, 1);
    m.visible = true;
  };

  const greenhouse = new THREE.Group();
  scene.add(greenhouse);
  greenhouse.position.set(0, marsGround(0, 0), 0);
  const glass = new THREE.MeshBasicMaterial({ color: 0xb7e4cc, transparent: true, opacity: MARS_GLASS_OPACITY, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const verts = [], indices = [];
  for (let j = 0; j <= 8; j++) for (let i = 0; i <= 24; i++) { const an = i / 24 * Math.PI; verts.push(Math.cos(an) * 3, Math.sin(an) * 3 + 0.15, -4 + j); }
  for (let j = 0; j < 8; j++) for (let i = 0; i < 24; i++) { const n = j * 25 + i; indices.push(n, n + 1, n + 26, n, n + 26, n + 25); }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  shell.setIndex(indices);
  shell.computeVertexNormals();
  mesh(shell, glass, greenhouse);
  for (let j = 0; j < 9; j++) {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const an = k / 24 * Math.PI; pts.push(new THREE.Vector3(3 * Math.cos(an), 3 * Math.sin(an) + 0.15, j - 4)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.045, 6, false), steel, greenhouse);
  }
  const endShape = new THREE.Shape();
  endShape.moveTo(-3, 0.15); endShape.lineTo(3, 0.15); endShape.absarc(0, 0.15, 3, 0, Math.PI, false); endShape.closePath();
  for (const z of [-4.04, 4.04]) {
    const end = mesh(new THREE.ShapeGeometry(endShape, 32), glass, greenhouse);
    end.position.z = z;
    bar(greenhouse, [-3, 0.15, z], [3, 0.15, z], 0.055);
    for (const x of [-1.8, 1.8]) bar(greenhouse, [x, 0.15, z], [x, 2.55, z], 0.035);
  }
  for (const x of [-3, 3]) for (const y of [0.2, 1.1]) bar(greenhouse, [x, y, -4], [x, y, 4], 0.045);
  for (const x of [-0.65, 0.65]) bar(greenhouse, [x, 0, 4.1], [x, 2.3, 4.1], 0.06);
  bar(greenhouse, [-0.65, 2.3, 4.1], [0.65, 2.3, 4.1], 0.06);
  const door = mesh(new THREE.PlaneGeometry(1.25, 2.2), glass, greenhouse);
  door.position.set(0, 1.12, 4.12);
  const crops = [];
  for (let row = 0; row < 3; row++) {
    const x = (row - 1) * 1.75;
    const tray = mesh(new RoundedBoxGeometry(1.25, 0.35, 6.8, 2, 0.06), steel, greenhouse);
    tray.position.set(x, 0.32, 0);
    const soil = mesh(new THREE.BoxGeometry(1.17, 0.08, 6.65), new THREE.MeshStandardMaterial({ color: 0x33271c, roughness: 1 }), greenhouse);
    soil.position.set(x, 0.53, 0);
    const plants = new THREE.Group();
    greenhouse.add(plants);
    plants.position.set(x, 0.57, 0);
    for (let n = 0; n < 12; n++) {
      const z = -3 + n * 0.53;
      for (let l = 0; l < 5; l++) {
        const leaf = mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshStandardMaterial({ color: [0x487332, 0x76a545, 0x688442][row], roughness: 0.8 }), plants);
        leaf.position.set(Math.sin(l * 1.26) * 0.12, 0.1 + (l % 2) * 0.12, z + Math.cos(l * 1.26) * 0.1);
        leaf.scale.set(0.7, 0.24, 1.6);
        leaf.rotation.set(l * 0.25, l * 1.26, 0.25);
      }
    }
    crops.push(plants);
  }
  const panel = new THREE.Group();
  scene.add(panel);
  panel.position.set(8, 0.8, -3);
  for (let j = 0; j < 3; j++) {
    const tile = new THREE.Group();
    panel.add(tile);
    tile.position.z = j * 1.7;
    tile.rotation.z = -0.22;
    mesh(new THREE.BoxGeometry(2.5, 0.06, 1.6), blue, tile);
    for (let k = 0; k < 6; k++) bar(tile, [-1.2 + k * 0.47, 0.04, -0.77], [-1.2 + k * 0.47, 0.04, 0.77], 0.008, steel);
    bar(panel, [0, -0.8, j * 1.7], [0, 0, j * 1.7], 0.06);
  }
  const fCanvas = document.createElement('canvas');
  renderFlag(fCanvas, flag || defaultFlag(), 384, 256);
  const fTex = new THREE.CanvasTexture(fCanvas);
  fTex.colorSpace = THREE.SRGBColorSpace;
  const fm = new THREE.MeshStandardMaterial({ map: fTex, side: THREE.DoubleSide, roughness: 0.75 });
  const pole = bar(scene, [-5, 0, 4], [-5, 3.6, 4], 0.035);
  const flagMesh = mesh(new THREE.PlaneGeometry(1.6, 1.05, 12, 6), fm);
  flagMesh.position.set(-4.2, 3, 4);
  pole.visible = flagMesh.visible = panel.visible = false;
  const patch = mesh(new THREE.PlaneGeometry(0.9, 0.6), fm, greenhouse);
  patch.position.set(1.7, 1.5, 4.15);
  const sites = SITES.map((p) => {
    const g = new THREE.Group();
    g.position.set(p.x, marsGround(p.x, p.z), p.z);
    const m = mesh(new THREE.DodecahedronGeometry(p.k === 'ice' ? 1.1 : 0.9, 1), new THREE.MeshStandardMaterial({ color: p.k === 'ice' ? 0xa9b3ac : 0x9f603b, roughness: 0.8 }), g);
    m.scale.y = 0.55;
    const ring = mesh(new THREE.RingGeometry(1.6, 1.8, p.k === 'ice' ? 40 : 6), new THREE.MeshBasicMaterial({ color: p.k === 'ice' ? 0x9ce6ff : 0xffb052, side: THREE.DoubleSide }), g);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    scene.add(g);
    return g;
  });
  const baseMark = mesh(new THREE.RingGeometry(0.65, 0.77, 32), new THREE.MeshBasicMaterial({ color: 0xcbdde0, side: THREE.DoubleSide }));
  baseMark.rotation.x = -Math.PI / 2;
  baseMark.position.set(BASE.x, marsGround(BASE.x, BASE.z) + 0.04, BASE.z);

  const shadowSize = Q.high ? 2048 : 1024;
  renderer.shadowMap.enabled = Q.high;
  sun.castShadow = Q.high;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.04;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.noShadow) { o.castShadow = false; o.receiveShadow = false; return; }
    if (!o.userData.noCast) o.castShadow = Q.high;
    o.receiveShadow = Q.high;
  });
  terrain.ground.castShadow = false;
  terrain.ground.receiveShadow = Q.high;

  const look = new THREE.Vector3();
  const camWant = new THREE.Vector3();
  let t = 0;
  const world = {
    scene, camera, rover, greenhouse, kind: 'mars', mapsKind: maps.kind, look, camWant,
    update(dt) {
      t += dt;
      const s = state(), l = s.land, land = s.stage === 'landing';
      const gx = land ? l.x : s.rover.x, gz = land ? 0 : s.rover.z, gy = marsGround(gx, gz);
      const pose = land ? marsFlightVisual(l, gy) : null;
      rover.position.set(gx, land ? pose.roverY : gy, gz);
      rover.rotation.y = land ? 0 : s.rover.yaw;
      setWheels(pose ? pose.wheel : 1);
      crane.visible = !!pose?.showCrane;
      if (pose) crane.position.set(gx, pose.craneY, gz);
      cables.forEach((m, i) => {
        if (!crane.visible) { m.visible = false; return; }
        const [tx, tz] = TANKS[i], [dx, dy, dz] = DECK[i];
        span(m, gx + tx, pose.craneY, gz + tz, gx + dx, pose.roverY + dy, gz + dz);
      });
      jets.forEach((j) => j.scale.setScalar(0.35 + (l?.thr || 0) * 0.7));
      edl.update(t, dt, pose, rover.position, gy);
      if (DEBUG) {
        const bag = globalThis.__mars || { frames: 0 };
        bag.frames = (bag.frames || 0) + 1;
        bag.pose = pose;
        bag.tex = maps.kind;
        bag.chute = edl.chute.visible;
        bag.shell = edl.backshell.visible;
        bag.heat = edl.heat.visible;
        bag.roverY = rover.position.y;
        globalThis.__mars = bag;
      }
      greenhouse.visible = s.built > 0;
      greenhouse.scale.y = Math.max(0.02, s.built);
      const dress = marsDress(s.built);
      pole.visible = flagMesh.visible = panel.visible = dress;
      blue.color.setHex(s.stage === 'grow' && s.event === 'panel' && !s.eventFixed ? 0x3a2218 : 0x071b35);
      sites.forEach((o, i) => { o.visible = !s.collected.includes(i); });
      crops.forEach((g, i) => g.scale.setScalar(0.4 + Math.min(1, s.kg[i] / 3) * 0.6));
      const storm = s.stage === 'grow' && s.event === 'storm';
      scene.fog.density = storm ? 0.012 : 0.0042;
      sky.setStorm(storm ? 1 : 0);
      sun.intensity = storm ? 0.7 : 1.85;
      const focus = rover.position;
      sun.position.set(focus.x + sunDir.x * 70, focus.y + sunDir.y * 70, focus.z + sunDir.z * 70);
      sun.target.position.set(focus.x, focus.y + 1, focus.z);
      sun.target.updateMatrixWorld();
      frameMarsCamera(camera, rover, dt, world, greenhouse, edl.chute, pose, t);
      if (dress) flagMesh.rotation.y = Math.sin(t * 1.4) * 0.04;
    },
    dispose() {
      env?.dispose();
      fTex.dispose();
      sky.dispose();
      edl.dispose();
      maps.albedo.dispose();
      maps.normal.dispose();
      maps.rough.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) for (const m of [].concat(o.material)) m.dispose?.();
      });
    },
  };
  return world;
}
