// Reproduce la derrota contra el Guardián: muere, pulsa «Reintentar fase» (o «Despertar») y mira si el diálogo vuelve a salir solo.
// Uso: BTN=r|q [MOBILE=1] node auditoria-claude/tools/boss-fail.mjs
import { open, sleep, BASE } from './lib.mjs';
const BTN = process.env.BTN || 'r';
const S = await open({ prefix: `boss-fail-${BTN}`, mobile: !!process.env.MOBILE, w: process.env.MOBILE ? 844 : 1280, h: process.env.MOBILE ? 390 : 720 });
const { p, log } = S;
await p.goto(BASE + '/?debug&boss=' + (process.env.PHASE || 1) + '&skip', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__boss, { timeout: 60000 }); await sleep(4000);
const st = () => p.evaluate(() => ({ mode: window.__boss.S.mode, o2: Math.round(window.__boss.S.o2), over: window.__boss.S.over, ov: document.querySelectorAll('.bd-ov').length, h2: [...document.querySelectorAll('.bd-ov h2')].map((e) => e.textContent), url: location.pathname + location.search, paused: document.body.dataset.paused || '' })).catch((e) => ({ err: e.message }));
log('antes', JSON.stringify(await st()));
// muerte real: se vacía el O₂ y se deja que el Guardián pegue (o se fuerza con la API si no llega)
await p.evaluate((how) => { const B = window.__boss; if (how === 'api') B.fail('Te quedaste sin oxígeno.'); else { B.S.o2 = 0.5; B.S.invulnT = 0; } }, process.env.HOW || 'hit');
for (let i = 0; i < 40 && (await st()).mode !== 'fail'; i++) { await p.evaluate(() => { const B = window.__boss; B.S.o2 = 0.5; B.S.idleT = 0; B.S.invulnT = 0; B.P.x = B.R.x + 2.2; B.P.z = B.R.z + 2.2; if (!(window.__k = (window.__k || 0) + 1) || window.__k % 4 === 1) { try { B.rain(); } catch {} try { B.heat(); } catch {} } }); await sleep(700); }
log('muerto', JSON.stringify(await st())); await S.shot('muerto');
// El bucle real: con el diálogo abierto, un clic fuera del botón o una tecla capturaban el ratón (cursor oculto) y Esc abría la PAUSA encima.
if (!process.env.MOBILE) {
  await p.mouse.click(60, 60); await sleep(300); await p.keyboard.press('KeyW'); await sleep(300); await p.keyboard.press('Escape'); await sleep(300); await p.keyboard.press('Escape'); await sleep(500);
  log('tras clic fuera + tecla + Esc×2', JSON.stringify({ ...(await st()), cursorOculto: await p.evaluate(() => document.body.classList.contains('look-on')), ratonCapturado: await p.evaluate(() => !!document.pointerLockElement) }));
}
for (let round = 1; round <= 3; round++) {
  const sel = `.bd-ov [data-a="${BTN}"]`;
  if (!(await p.$(sel))) { log('sin botón', sel); break; }
  if (process.env.MOBILE) await p.tap(sel); else await p.click(sel);
  for (const ms of [300, 1500, 4000, 8000]) { await sleep(ms === 300 ? 300 : ms - 300); log(`ronda ${round} +${ms}ms`, JSON.stringify(await st())); }
  await S.shot('tras-' + BTN + '-' + round);
  if ((await st()).mode !== 'fail') break;
}
await S.b.close();
