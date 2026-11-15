// Pelea con el Guardián (no canon): bot ingenuo con teclas reales (W hacia el Guardián con cámara fijada, E martillo,
// F flash, Espacio salto, Q manguera, Shift esquiva). Cada fase se juega SEC segundos; registra HP/O2/fallos.
// Después usa la API de depuración para comprobar que las fases 2→3→victoria encadenan sin bloquearse.
import { open, sleep, BASE } from './lib.mjs';
const PFX = process.env.PFX || '03-boss', SEC = +(process.env.SEC || 150), DIFF = process.env.DIFF || 'normal';
const S = await open({ prefix: PFX });
const { p, log, shot, texts } = S;
const snap = () => p.evaluate(() => { const B = window.__boss; if (!B) return null; const { S, P, R } = B; return { mode: S.mode, phase: S.phase, hp: +S.hp.toFixed(1), o2: +S.o2.toFixed(1), t: +S.t.toFixed(0), fuel: S.fuel && +S.fuel.toFixed(0), hatch: S.hatch && +S.hatch.toFixed(2), plates: R.plates && Object.values(R.plates).join(','), d: +Math.hypot(P.x - R.x, P.z - R.z).toFixed(1), stun: +(R.stunT || 0).toFixed(1), over: S.over, stats: S.stats }; }).catch(() => null);
const key = (code, ms = 60) => p.evaluate((c, ms) => { dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true })); setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { code: c, key: c, bubbles: true })), ms); }, code, ms);
const hold = (code, on) => p.evaluate((c, on) => dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code: c, key: c, bubbles: true })), code, on);
async function play(phase) {
  await p.goto(`${BASE}/?boss=${phase}&diff=${DIFF}`, { waitUntil: 'domcontentloaded' });
  await sleep(9000); await shot(`p${phase}-intro`); await texts();
  // cinemática de entrada / tarjetas: avanzar
  for (let i = 0; i < 12; i++) { const s = await snap(); if (s?.mode === 'play') break; await p.evaluate(() => document.querySelector('.bd-ov button,.plb-letterbox-skip')?.click()); await key('Enter'); await sleep(1500); }
  await texts(); await shot(`p${phase}-play-start`);
  const t0 = Date.now(); let fails = 0, lastShot = 0, w = false, startPh = phase, maxPh = phase;
  while (Date.now() - t0 < SEC * 1000) {
    const s = await snap(); if (!s) { await sleep(500); continue; }
    if (s.over) { log('OVER', JSON.stringify(s)); break; }
    maxPh = Math.max(maxPh, s.phase);
    const failOv = await p.evaluate(() => !!document.querySelector('.bd-ov [data-a=r]') && /despierta|jolts/i.test(document.body.innerText));
    if (failOv) { fails++; log('FAIL #' + fails, JSON.stringify(s)); await shot(`p${phase}-fail${fails}`); await p.evaluate(() => document.querySelector('.bd-ov [data-a=r]')?.click()); await sleep(3000); continue; }
    if (s.mode !== 'play') { await key('Enter'); await sleep(700); continue; }
    const near = s.d < 3.6;
    if (!near && !w) { await hold('KeyW', true); w = true; } else if (near && w) { await hold('KeyW', false); w = false; }
    if (near) await key('KeyE');
    if (Math.random() < 0.18) await key('KeyF');
    if (Math.random() < 0.12) await key('Space');
    if (s.phase === 3 && Math.random() < 0.2) await key('KeyQ');
    if (s.phase === 2 && s.stun > 0) { await key('Space'); await hold('KeyE', true); await sleep(1500); await hold('KeyE', false); }
    if (Date.now() - lastShot > 20000) { lastShot = Date.now(); await shot(`p${phase}-t${((Date.now() - t0) / 1000) | 0}`); log('STATE', JSON.stringify(s)); await texts(); }
    await sleep(250);
  }
  if (w) await hold('KeyW', false);
  const s = await snap(); log(`RESULT fase ${startPh}: llegó a fase ${maxPh}, fallos ${fails}, estado ${JSON.stringify(s)}`); await shot(`p${phase}-end`);
}
for (const ph of (process.env.PHASES || '1,2,3').split(',').map(Number)) await play(ph);
// encadenado por API: fase 3 → victoria → pantalla final (comprueba que no se bloquea)
await p.goto(`${BASE}/?boss=3&diff=${DIFF}`, { waitUntil: 'domcontentloaded' }); await sleep(9000);
for (let i = 0; i < 12; i++) { const s = await snap(); if (s?.mode === 'play') break; await p.evaluate(() => document.querySelector('.bd-ov button,.plb-letterbox-skip')?.click()); await key('Enter'); await sleep(1500); }
await p.evaluate(() => window.__boss.win()); await sleep(3000); await shot('api-win-1'); await texts();
for (let i = 0; i < 10; i++) { await sleep(3000); await texts(); const s = await snap(); log('AFTER_WIN', JSON.stringify(s), await p.evaluate(() => location.pathname + location.search)); if (i === 1 || i === 5) await shot('api-win-' + i); const b = await p.evaluate(() => { const x = document.querySelector('.bd-ov button,[data-a]'); if (x) x.click(); return x?.textContent; }); if (b) log('CLICK', b); }
log('ERRORS', S.errors.length);
await S.b.close();
