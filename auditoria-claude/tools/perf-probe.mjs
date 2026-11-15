// Perfil por fase: tiempo de JS por fotograma (update + render), draw calls, triángulos y qué pasa con los fps al apagar cosas.
// Uso: PHASE_URL="/?nointro&phase=eva" TAG=eva node auditoria-claude/tools/perf-probe.mjs
import { open, sleep, BASE } from './lib.mjs';
const URLP = process.env.PHASE_URL || '/?nointro&phase=eva', TAG = process.env.TAG || 'x', WAIT = +(process.env.WAIT || 14000);
const S = await open({ prefix: `perf-${TAG}`, mobile: !!process.env.MOBILE, w: +(process.env.W || 1280), h: +(process.env.H || 720), store: process.env.QUALITY ? { quality: process.env.QUALITY } : {} });
if (!process.env.NOAUTO) await S.p.evaluateOnNewDocument(() => { window.__auto = 1; });
await S.p.goto(BASE + URLP, { waitUntil: 'domcontentloaded' }); await sleep(WAIT);
S.log('GL', await S.gl());
if (process.env.SLOW) await S.p.evaluate((k) => { window.__stats.slow = k; }, +process.env.SLOW); // casi congela la lógica (la escena se sigue dibujando) para medir siempre el mismo plano
const fpsFor = async (ms) => { await S.p.evaluate(() => { window.__fpsLog.length = 0; }); await sleep(ms); const s = await S.p.evaluate(() => window.__fpsLog.slice()); s.sort((a, b) => a - b); return s[s.length >> 1] || 0; };
const info = await S.p.evaluate(async () => {
  const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\/src\/core\/engine\.js/.test(n)).pop(); const E = await import(u); window.__E = E;
  const R = E.renderer, W = E.getWorld(); R.info.autoReset = false;
  // tiempo de JS: se envuelve update y render del mundo
  const acc = { up: 0, re: 0, n: 0 }; window.__acc = acc;
  const u0 = W.update, r0 = W.render;
  if (u0) W.update = function (dt, t) { const a = performance.now(); u0.call(W, dt, t); acc.up += performance.now() - a; };
  const rr = R.render.bind(R); R.render = function (s, c) { const a = performance.now(); rr(s, c); acc.re += performance.now() - a; acc.n++; };
  await new Promise((res) => setTimeout(res, 4000));
  R.info.reset(); await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  let objs = 0, meshes = 0, vis = 0, sk = 0, lights = 0, mats = new Set(); W.scene.traverse((o) => { objs++; if (o.isMesh) { meshes++; if (o.visible) vis++; mats.add(o.material); } if (o.isSkinnedMesh) sk++; if (o.isLight) lights++; });
  return { upMs: +(acc.up / acc.n).toFixed(2), reMs: +(acc.re / acc.n).toFixed(2), rendersPerFrame: acc.n, tris: R.info.render.triangles, calls: R.info.render.calls, programs: R.info.programs?.length, geos: R.info.memory.geometries, texs: R.info.memory.textures, objs, meshes, vis, sk, lights, mats: mats.size, shadow: R.shadowMap.enabled, dpr: R.getPixelRatio(), size: [R.domElement.width, R.domElement.height], hasCustomRender: !!r0 };
});
S.log('INFO', JSON.stringify(info));
S.log('FPS base', await fpsFor(6000));
const toggles = (process.env.TOGGLES || 'shadow;;dpr05;;noupdate').split(';;');
for (const tg of toggles) {
  await S.p.evaluate((tg) => { const E = window.__E, R = E.renderer, W = E.getWorld(); window.__undo = null;
    if (tg === 'shadow') { const p = R.shadowMap.enabled; R.shadowMap.enabled = false; W.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); }); window.__undo = () => { R.shadowMap.enabled = p; W.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); }); }; }
    if (tg === 'dpr05') { const p = R.getPixelRatio(); R.setPixelRatio(0.3); R.setSize(innerWidth, innerHeight, false); window.__undo = () => { R.setPixelRatio(p); R.setSize(innerWidth, innerHeight, false); }; }
    if (tg === 'noupdate') { E.setPaused(true); window.__undo = () => E.setPaused(false); }
    if (tg.startsWith('js:')) { window.__undo = new Function('E', 'R', 'W', 'THREE', tg.slice(tg.indexOf('|') + 1))(E, R, W, E.THREE); }
    if (tg.startsWith('hide:')) { const re = new RegExp(tg.slice(5)); const hid = []; W.scene.traverse((o) => { if ((o.isMesh || o.isPoints) && o.visible && re.test(o.name + '|' + o.type + '|' + (o.material?.name || '') + '|' + (o.material?.type || ''))) { o.visible = false; hid.push(o); } }); window.__hid = hid.length; window.__undo = () => hid.forEach((o) => (o.visible = true)); }
  }, tg);
  await sleep(1500);
  S.log('FPS sin', tg, await fpsFor(5000), tg.startsWith('hide:') ? 'ocultos=' + (await S.p.evaluate(() => window.__hid)) : '');
  await S.p.evaluate(() => window.__undo?.()); await sleep(500);
}
await S.b.close();
