// FPS reales (requestAnimationFrame) por fase/escena con UN solo navegador. Cada caso: 8 s de calentamiento + 20 s de muestra.
import { open, sleep, BASE } from './lib.mjs';
const S = await open({ prefix: process.env.PFX || '05-fps' });
const { p, log, shot } = S;
await p.evaluateOnNewDocument(() => { window.__auto = 1; });
const CASES = (process.env.CASES || 'menu:/?nointro,launch:/?nointro&phase=launch,cruise:/?nointro&phase=cruise,descent:/?nointro&phase=descent,eva:/?nointro&phase=eva,boss:/?boss=1&skip,night:/?story=night,reentry:/?story=reentry,parade:/?story=parade').split(',').map((c) => c.split(/:(.+)/));
const rows = [];
for (const [name, path] of CASES) {
  await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  const t0 = Date.now();
  await sleep(8000);
  await p.evaluate(() => { window.__fpsLog.length = 0; });
  await sleep(20000);
  const r = await p.evaluate(() => ({ s: window.__fpsLog.slice(), eng: Math.round(window.__stats?.fps || 0), dpr: window.__stats?.dpr, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, info: (() => { try { const i = window.__stats?.info; return i; } catch { return null; } })() }));
  const s = r.s.filter((x) => x > 0).sort((a, b) => a - b);
  const row = { name, med: s[Math.floor(s.length / 2)] || 0, p10: s[Math.floor(s.length * 0.1)] || 0, min: s[0] || 0, eng: r.eng, dpr: r.dpr, heapMB: r.mem };
  rows.push(row); log('FPS', JSON.stringify(row)); await shot(name);
}
log('TABLE', JSON.stringify(rows));
await S.b.close();
