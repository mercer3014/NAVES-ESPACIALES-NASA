// Sonda de render: triángulos, draw calls, sombras y post-proceso de una escena (?phase=eva por defecto)
import { open, sleep, BASE } from './lib.mjs';
const S = await open({ prefix: process.env.PFX || '07-probe' });
const { p, log, shot } = S;
await p.evaluateOnNewDocument(() => { window.__auto = 1; });
for (const path of (process.env.PATHS || '/?nointro&phase=eva,/?nointro&phase=launch,/?nointro&phase=descent').split(',')) {
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded' }); await sleep(12000);
  const r = await p.evaluate(async () => { const E = await import('/src/core/engine.js'); const R = E.renderer; const i = R.info;
    let lights = 0, shadowLights = [], meshes = 0, shadowCasters = 0; const w = E.getWorld?.(); const sc = w?.scene;
    sc?.traverse((o) => { if (o.isLight) { lights++; if (o.castShadow) shadowLights.push((o.type) + ':' + (o.shadow?.mapSize?.x || '?')); } if (o.isMesh) { meshes++; if (o.castShadow) shadowCasters++; } });
    return { path: location.search, tris: i.render.triangles, calls: i.render.calls, geos: i.memory.geometries, texs: i.memory.textures, progs: i.programs?.length, pr: R.getPixelRatio(), shadowOn: R.shadowMap.enabled, shadowType: R.shadowMap.type, lights, shadowLights, meshes, shadowCasters, fps: Math.round(window.__fpsRaw), post: !!w?.render };
  }).catch((e) => ({ err: e.message }));
  log('PROBE', JSON.stringify(r)); await shot(path.replace(/\W+/g, '_'));
}
await S.b.close();
