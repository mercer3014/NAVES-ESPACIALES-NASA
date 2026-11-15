// Recorrido de menús: carga (con intro), intro, inicio, briefing, bandera, ajustes, misiones, créditos, bitácora. Mide carga.
import { open, sleep, BASE } from './lib.mjs';
const S = await open({ prefix: process.env.PFX || '01-menu', intro: true, mobile: process.env.MOBILE === '1', w: +(process.env.W || 1280), h: +(process.env.H || 720) });
const { p, log, shot, texts, state } = S;
log('GL', await S.gl().catch(() => '?'));
const tNav = Date.now();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await sleep(400); await shot('boot-early'); await texts();
// tiempo hasta salir de la pantalla de carga
let bootMs = 0; for (let i = 0; i < 200; i++) { const s = await state(); if (s.scr && s.scr !== 'boot') { bootMs = Date.now() - tNav; break; } await sleep(100); }
log('BOOT_TO_NEXT_MS', bootMs, (await state()).scr);
const perf = await p.evaluate(() => { const r = performance.getEntriesByType('resource'); const sum = r.reduce((a, x) => a + (x.transferSize || x.encodedBodySize || 0), 0); return { n: r.length, mb: +(sum / 1048576).toFixed(1), dcl: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0) }; });
log('RES_AT_BOOT', JSON.stringify(perf));
await shot('after-boot'); await texts();
await sleep(5000); await shot('intro-5s'); await texts();
await p.keyboard.press('Escape'); await sleep(2500);
log('STATE', JSON.stringify(await state())); await shot('start'); await texts();
await sleep(3000); log('FPS start', JSON.stringify(await state()));
const click = async (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
const back = async () => { await p.keyboard.press('Escape'); await sleep(300); const ok = await click('[data-a=back],.back,[data-back]'); await sleep(1200); return ok; };
for (const [a, tag] of [['solo', 'briefing-solo'], ['flag', 'flag-studio'], ['settings', 'settings'], ['missions', 'missions'], ['credits', 'credits'], ['bitacora', 'bitacora'], ['create', 'create-room'], ['join', 'join']]) {
  const ok = await click(`[data-a=${a}]`); await sleep(2200); log('OPEN', a, ok, JSON.stringify(await state())); await shot(tag); await texts();
  if (a === 'flag') { await click('[data-a=rand]'); await sleep(600); await shot('flag-random'); }
  if (a === 'missions') { const n = await p.evaluate(() => document.querySelectorAll('button').length); log('missions buttons', n); }
  await back(); await p.evaluate(async () => { const s = await import('/src/ui/screens.js'); if (document.body.dataset.screen !== 'start') s.startScreen(); }); await sleep(1000);
}
const html = await p.evaluate(() => document.querySelector('.screen')?.outerHTML.slice(0, 3000));
log('START_HTML', html.replace(/\s+/g, ' '));
log('ERRORS', S.errors.length);
await S.b.close();
