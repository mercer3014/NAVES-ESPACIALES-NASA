// Triángulos y draw calls REALES por fotograma (renderer.info, incluye la pasada de sombras) + captura, para PHASE (eva|descent)
import { open, sleep, BASE } from './lib.mjs';
const PH = process.env.PHASE || 'eva', TAG = process.env.TAG || 'x';
const S = await open({ prefix: `wp7-probe-${PH}-${TAG}` });
await S.p.evaluateOnNewDocument(() => { window.__auto = 1; });
await S.p.goto(BASE + `/?nointro&phase=${PH}`, { waitUntil: 'domcontentloaded' }); await sleep(12000); // la cinemática inicial no pasa por renderer.info: se espera a que haya triángulos
// 12 muestras de 1 fotograma exacto, una por segundo; se informa mediana/mín/máx de triángulos y draw calls
const r = await S.p.evaluate(async () => { const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\/src\/core\/engine\.js/.test(n)).pop(); const E = await import(u); const R = E.renderer; R.info.autoReset = false;
  const tr = [], ca = []; for (let k = 0; k < 12; k++) { await new Promise((res) => requestAnimationFrame(() => { R.info.reset(); requestAnimationFrame(res); })); tr.push(R.info.render.triangles); ca.push(R.info.render.calls); await new Promise((r) => setTimeout(r, 1000)); }
  const by = {}; E.getWorld().scene.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); const k = o.isInstancedMesh ? 'instanciadas(' + (o.castShadow ? 'sombra' : 'sin-sombra') + ')' : o.name === 'moon-surface-tile' ? 'tiles' : 'otros'; by[k] = Math.round((by[k] || 0) + t); if (o.isInstancedMesh) by['n-inst'] = (by['n-inst'] || 0) + o.count; });
  R.info.autoReset = true; const st = (a) => { const b = [...a].sort((x, y) => x - y); return { min: b[0], med: b[b.length >> 1], max: b[b.length - 1] }; };
  return { tris: st(tr), calls: st(ca), raw: tr, by, shadow: R.shadowMap.enabled, dpr: R.getPixelRatio() }; });
S.log('FRAME', JSON.stringify(r));
await S.p.screenshot({ path: `auditoria-claude/fase2/wp7-${PH}-${TAG}.jpg`, type: 'jpeg', quality: 85 });
await S.b.close();
