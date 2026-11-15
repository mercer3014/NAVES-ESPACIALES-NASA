// Cinemática 7.4–7.5: paracaídas, amerizaje de Columbia, helicóptero del Hornet, collar de flotación y la MQF en la cubierta.
// Modelos: csm-columbia (solo el CM) + cm-recovery (mismo origen), pacific-recovery (clip waves; el CM va en el origen),
// sea-king (rotor-spin), hornet, mqf. La escena es determinista: at(T) la pone en el segundo T de la cinemática.
import { THREE } from '../core/engine.js';
import { model, prop, node, shadowAll, disposeScene, camera as mkCam, smooth, envMap } from './cine-kit.js';

const CM_BASE = 3.23; // en csm-columbia el nodo CM está 3,23 m bajo el origen del CSM (el origen del CM es su base)
const SPLASH = 7.2;   // segundo del amerizaje
export const RECOVERY_T = { SPLASH, HELI_IN: 11, COLLAR: 14.4, HATCH: 16.6, DECK: 18 };

export async function makeCineRecovery() {
  const [csm, rec, sea, heli, hornet, mqf] = await Promise.all([
    prop('csm-columbia'), prop('cm-recovery'), prop('pacific-recovery'), prop('sea-king'), model('hornet'), model('mqf'),
  ]);
  const scene = new THREE.Scene();
  const sky = new THREE.Color(0xa7b6c2);
  scene.background = sky; scene.fog = new THREE.Fog(sky, 300, 2600);
  const cam = mkCam(40, 6000);
  scene.environment = envMap(); scene.environmentIntensity = 0.45;
  scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x2b3a44, 1.25));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4); sun.position.set(-160, 120, 200); scene.add(sun);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 600 });

  // ---- océano: el glb de 200 m (olas) + un plano grande del mismo color hasta el horizonte ----
  scene.add(sea.root);
  const oceanMesh = node(sea.root, 'ocean'); oceanMesh?.traverse?.((o) => { if (o.isMesh) o.receiveShadow = true; });
  let oceanCol = new THREE.Color(0x30506a);
  oceanMesh?.traverse?.((o) => { if (o.isMesh && o.material?.color) oceanCol = o.material.color.clone(); });
  const farSea = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: oceanCol, roughness: 0.55, metalness: 0.05 }));
  farSea.userData.own = true; farSea.rotation.x = -Math.PI / 2; farSea.position.y = -0.25; scene.add(farSea);

  // ---- Columbia: solo el CM, con el material quemado que ya trae; el collar y los paracaídas van en el mismo origen ----
  const rig = new THREE.Group(); rig.name = 'cm-rig'; scene.add(rig);
  const tilt = new THREE.Group(); tilt.position.y = 1.2; rig.add(tilt); // pivote del vuelco ~ centro de masas
  const cmRoot = new THREE.Group(); cmRoot.position.y = CM_BASE - 1.2; tilt.add(cmRoot);
  const sm = node(csm.root, 'SM'); if (sm) sm.visible = false;
  cmRoot.add(shadowAll(csm.root), shadowAll(rec.root, true, false));
  const anchorChutes = node(rec.root, 'chute-anchor');
  // boyas de enderezamiento (tres globos blancos en el ápice)
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.7 });
  const bags = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), bagMat); m.userData.own = true; const a = i * 2.094; m.position.set(Math.cos(a) * 0.45, -0.1, Math.sin(a) * 0.45); m.scale.setScalar(0.01); cmRoot.add(m); return m; });

  // ---- salpicadura: partículas de espuma ----
  const N = 260, sp = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 0.8, up = 4 + Math.random() * 9; vel.push([Math.cos(a) * (2 + Math.random() * 5), up, Math.sin(a) * (2 + Math.random() * 5), Math.cos(a) * r, Math.sin(a) * r]); }
  const spG = new THREE.BufferGeometry(); spG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const spray = new THREE.Points(spG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.9, depthWrite: false }));
  spray.userData.own = true; spray.frustumCulled = false; scene.add(spray);
  const foam = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  foam.userData.own = true; foam.rotation.x = -Math.PI / 2; foam.position.y = 0.12; scene.add(foam);

  // ---- helicóptero ----
  heli.root.scale.setScalar(1); shadowAll(heli.root, true, false); scene.add(heli.root);
  const heliFrom = new THREE.Vector3(-420, 70, -620), heliTo = new THREE.Vector3(-24, 19, -30);

  // ---- USS Hornet a ~1 km, con la MQF en la cubierta ----
  shadowAll(hornet, false, true); scene.add(hornet);
  hornet.position.set(-520, -9.5, -980); hornet.rotation.y = 0.55;
  scene.add(shadowAll(mqf));
  hornet.updateMatrixWorld(true);
  // la MQF va en el centro de la cubierta de vuelo, a popa, alineada con el buque (altura por rayo; la isla queda a estribor)
  const ray = new THREE.Raycaster(); const box = new THREE.Box3().setFromObject(hornet);
  const deckAt = (lx, lz) => { const p = new THREE.Vector3(lx, 0, lz).applyMatrix4(hornet.matrixWorld); p.y = box.max.y + 50; ray.set(p, new THREE.Vector3(0, -1, 0)); const h = ray.intersectObject(hornet, true)[0]; return h ? h.point : null; };
  const deck = deckAt(2, -70) || new THREE.Vector3(0, 16.5, -70).applyMatrix4(hornet.matrixWorld);
  mqf.position.copy(deck); mqf.rotation.y = hornet.rotation.y;
  const anchors = { cm: rig, heli: heli.root, mqf, hornet, origin: { x: 0, y: 0, z: 0 } };
  const tmpV = new THREE.Vector3();

  function at(T) {
    sea.at('waves', T, true);
    // descenso con paracaídas hasta el amerizaje; luego cabeceo con las olas
    const y = T < SPLASH ? 220 * (1 - T / SPLASH) : 0;
    const bob = T < SPLASH ? 0 : Math.sin(T * 1.05) * 0.22 + Math.sin(T * 0.63 + 1) * 0.12;
    rig.position.set(0, y - (T >= SPLASH ? 0.9 : 0) + bob, 0);
    rig.rotation.y = 0.4 + T * 0.02;
    // vuelco (queda de lado tras el golpe) y enderezamiento con las boyas
    const roll = T < SPLASH ? Math.sin(T * 0.9) * 0.05 : 1.15 * smooth((T - SPLASH) / 1.1) * (1 - smooth((T - 9.6) / 1.6)) + Math.sin(T * 0.8) * 0.05;
    tilt.rotation.z = roll;
    const bagS = smooth((T - 8.6) / 1.0); bags.forEach((b) => b.scale.setScalar(Math.max(0.01, bagS)));
    if (anchorChutes) anchorChutes.visible = T < SPLASH + 0.25;
    rec.at('chutes-deploy', T * 1.4, false);
    rec.at('collar-inflate', T - RECOVERY_T.COLLAR, false);
    csm.at('hatch-open', T - RECOVERY_T.HATCH, false);
    rec.apply(); csm.apply(); sea.apply();
    // salpicadura
    const st = T - SPLASH;
    spray.visible = st > 0 && st < 2.6;
    if (spray.visible) {
      for (let i = 0; i < N; i++) { const v = vel[i]; sp[i * 3] = v[3] + v[0] * st; sp[i * 3 + 1] = Math.max(0, v[1] * st - 4.9 * st * st); sp[i * 3 + 2] = v[4] + v[2] * st; }
      spG.attributes.position.needsUpdate = true; spray.material.opacity = 0.9 * (1 - st / 2.6);
    }
    foam.material.opacity = st > 0 ? Math.max(0, 0.7 * (1 - st / 6)) : 0; foam.scale.setScalar(st > 0 ? 1 + st * 0.6 : 1);
    // helicóptero: entra, frena y se queda en estacionario junto a la cápsula
    const h = smooth((T - RECOVERY_T.HELI_IN) / 5.2);
    heli.root.visible = T > RECOVERY_T.HELI_IN - 0.5;
    tmpV.lerpVectors(heliFrom, heliTo, h); heli.root.position.copy(tmpV); heli.root.position.y += Math.sin(T * 1.7) * 0.3 * h;
    heli.root.lookAt(heliTo.x + (heliTo.x - heliFrom.x), heli.root.position.y, heliTo.z + (heliTo.z - heliFrom.z));
    heli.root.rotateX(0.18 * (1 - h)); // morro abajo mientras vuela
    heli.at('rotor-spin', T * 4.5, true); heli.apply();
  }
  at(0);
  return {
    scene, camera: cam, anchors, at,
    update() {},
    act() {},
    dispose() { disposeScene(scene); },
  };
}
