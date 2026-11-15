// Desglose de triángulos de la EVA: tiles del terreno, rocas instanciadas y el resto
import { open, sleep, BASE } from './lib.mjs';
const S = await open({ prefix: '07-probe-eva' });
await S.p.evaluateOnNewDocument(() => { window.__auto = 1; });
await S.p.goto(BASE + '/?nointro&phase=eva', { waitUntil: 'domcontentloaded' }); await sleep(12000);
const r = await S.p.evaluate(async () => { const E = await import('/src/core/engine.js'); const sc = E.getWorld().scene; const by = {};
  sc.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    const k = o.isInstancedMesh ? 'rocas-instanciadas' : o.name === 'moon-surface-tile' ? 'tiles-terreno' : (o.castShadow ? 'otros-con-sombra' : 'otros'); by[k] = (by[k] || 0) + t; if (o.isInstancedMesh) by['n-instancias'] = (by['n-instancias'] || 0) + o.count; });
  for (const k in by) by[k] = Math.round(by[k]); return { by, tileTris: window.__plbTileTris }; });
S.log('EVA_TRIS', JSON.stringify(r)); await S.b.close();
