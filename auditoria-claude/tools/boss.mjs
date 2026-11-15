// Guardián (no canon), flujo actual: `?debug&boss=N&skip` entra en juego (runBoss skipIntro).
// La API vive en window.__boss: S.mode play|cine|breaker|outro|fail, setPhase, skip, win.
// Teclas de la pelea: W acercarse, E martillo, F flash, Espacio salto, Q manguera (fase 3).
import { open, sleep, BASE } from './lib.mjs';
const PFX = process.env.PFX || '03-boss', SEC = +(process.env.SEC || 40), DIFF = process.env.DIFF || 'normal';
const S = await open({ prefix: PFX });
const { p, log, shot, texts } = S;
const snap = () => p.evaluate(() => {
  const B = window.__boss; if (!B) return null; const { S, P, R } = B;
  return { mode: S.mode, phase: S.phase, hp: +S.hp.toFixed(1), o2: +S.o2.toFixed(1), t: +S.t.toFixed(0), d: +Math.hypot(P.x - R.x, P.z - R.z).toFixed(1), stun: +(R.stunT || 0).toFixed(1), over: S.over };
}).catch(() => null);
const key = (code, ms = 60) => p.evaluate((c, ms) => { dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true })); setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { code: c, key: c, bubbles: true })), ms); }, code, ms);
const hold = (code, on) => p.evaluate((c, on) => dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code: c, key: c, bubbles: true })), code, on);
async function enter(phase) {
  await p.goto(`${BASE}/?debug&boss=${phase}&diff=${DIFF}&skip`, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 20; i++) {
    const s = await snap();
    if (s?.mode === 'play') return s;
    await p.evaluate(() => { window.__boss?.skip?.(); document.querySelector('.plb-letterbox button, .bd-ov button')?.click(); });
    await key('Enter'); await sleep(700);
  }
  return snap();
}
async function play(phase) {
  const start = await enter(phase); await shot(`p${phase}-play`); log('START', JSON.stringify(start));
  const t0 = Date.now(); let w = false;
  while (Date.now() - t0 < SEC * 1000) {
    const s = await snap(); if (!s) { await sleep(400); continue; }
    if (s.over || s.mode === 'fail' || s.mode === 'outro') { log('STOP', JSON.stringify(s)); break; }
    if (s.mode === 'cine') { await p.evaluate(() => window.__boss?.skip?.()); await sleep(400); continue; }
    if (s.mode === 'breaker') { await key('KeyE'); await sleep(400); continue; }
    const near = s.d < 4;
    if (!near && !w) { await hold('KeyW', true); w = true; } else if (near && w) { await hold('KeyW', false); w = false; }
    if (near) await key('KeyE');
    if (s.phase >= 2 && Math.random() < 0.25) await key('KeyF');
    if (s.phase === 3 && Math.random() < 0.2) await key('KeyQ');
    await sleep(220);
  }
  if (w) await hold('KeyW', false);
  await shot(`p${phase}-end`);
}
const only = process.env.PHASES || '1';
for (const ph of only.split(',').map(Number)) await play(ph);
await enter(3);
await p.evaluate(() => window.__boss?.setPhase?.(2)); await sleep(1500);
log('PHASE', JSON.stringify(await snap()));
await p.evaluate(() => window.__boss?.setPhase?.(3)); await sleep(1500);
log('PHASE', JSON.stringify(await snap()));
await p.evaluate(() => window.__boss?.win?.()); await sleep(2500);
log('WIN', JSON.stringify(await snap())); await shot('api-win'); await texts();
log('ERRORS', S.errors.length);
await S.b.close();
