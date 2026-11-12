// Artist-owned EASEP pack; move named pivots, never quantized *-geo children.
import { THREE, modelAnim, bakeGeometry } from '../core/engine.js';
export async function makeEASEP(W, lx, ground, ast) {
  const { scene: root, animations } = await modelAnim('easep-props');
  root.position.x = lx; W.scene.add(root);
  root.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true;
    if (o.material && 'envMap' in o.material) { o.material.envMap = W.env; o.material.envMapIntensity = 0.6; } });
  const node = n => root.getObjectByName(n);
  const mixer = new THREE.AnimationMixer(root), actions = {};
  for (const clip of animations) { const a = mixer.clipAction(clip); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; actions[clip.name] = a; }
  const hold = n => { const a = actions[n]; if (a) { a.play(); a.paused = true; a.time = 0; } };
  hold('psep-deploy'); hold('swc-unroll'); hold('tongs-grab'); mixer.update(0);
  const sites = ['PSEP', 'SWC', 'LRRR'].map((name, i) => {
    const o = node(name); o.position.y = ground(lx + o.position.x, o.position.z);
    const p = new THREE.Vector3(); o.getWorldPosition(p);
    return { name, o, p, clip: ['psep-deploy', 'swc-unroll', null][i], duration: [2, 3, 1.6][i], done: false };
  });
  const tools = node('Tools'); if (tools) tools.position.y = ground(lx + tools.position.x, tools.position.z);
  const plaque = node('lm-plaque'), leg = W.body.getObjectByName('leg-fwd');
  if (plaque && leg && plaque.userData.attach_local_position) { leg.add(plaque); plaque.position.fromArray(plaque.userData.attach_local_position); plaque.quaternion.fromArray(plaque.userData.attach_local_quaternion_xyzw); }
  else if (plaque) plaque.visible = false; // old LM fallback: don't leave a floating plaque
  const boots = node('BootPrints'), variants = [];
  if (boots) {
    root.updateMatrixWorld(true);
    for (const name of ['a', 'b', 'c', 'd']) {
      const p = node('boot-print-' + name); if (!p) continue;
      let mesh; p.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) continue;
      const rel = new THREE.Matrix4().copy(p.matrixWorld).invert().multiply(mesh.matrixWorld);
      const g = bakeGeometry(mesh, rel), m = mesh.material.clone();
      Object.assign(m, { depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      variants.push({ g, m });
    }
    boots.visible = false; // no pre-baked example trail: footsteps come from actual player movement
  }
  // Ground tools remain near the ladder; sampling borrows the artist's tongs.
  const tongs = node('tongs'), grip = node('tongs-grip');
  const home = tongs ? { parent: tongs.parent, p: tongs.position.clone(), q: tongs.quaternion.clone(), s: tongs.scale.clone() } : null;
  let sampling = false, grabStarted = false;
  const sample = (active, k = 0) => {
    if (!tongs || !ast.handR) return;
    if (active && !sampling) { grip.updateMatrix(); const inv = grip.matrix.clone().invert(); ast.handR.add(tongs); inv.decompose(tongs.position, tongs.quaternion, tongs.scale); grabStarted = false; }
    if (!active && sampling) { home.parent.add(tongs); tongs.position.copy(home.p); tongs.quaternion.copy(home.q); tongs.scale.copy(home.s); }
    sampling = active;
    if (active) { ast.tool.visible = false; if (k > 0.3 && !grabStarted) { grabStarted = true; const a = actions['tongs-grab']; if (a) { a.reset(); a.paused = false; a.play(); } } }
  };
  return { root, sites, variants, sample, actions,
    start(site) { if (site.done) return false; site.done = true; const a = actions[site.clip]; if (a) { a.reset(); a.paused = false; a.play(); } return true; },
    update(dt) { mixer.update(dt); },
    dispose() { sample(false); mixer.stopAllAction(); mixer.uncacheRoot(root); plaque?.removeFromParent(); root.removeFromParent(); for (const { g, m } of variants) { g.dispose(); m.dispose(); } },
  };
}
