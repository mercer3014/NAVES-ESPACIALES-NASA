// Partida completa de Misión 1 en solitario CON guion: menú → briefing → fases + interludios → final.
// Piloto automático de las fases: window.__auto es un getter que vale 1 salvo cuando lo consulta el guion
// (storyEnabled / decisiones / reentrada / epílogo), así las escenas se reproducen y las fases se juegan solas.
// Cinemáticas: 2 capturas y luego Esc (registra todos los textos para reconstruir la narrativa).
import { open, sleep, BASE } from './lib.mjs';
const PFX = process.env.PFX || '02-full';
const S = await open({ prefix: PFX, store: { difficulty: process.env.DIFF || 'normal' } });
const { p, log, shot, texts, state } = S;
await p.evaluateOnNewDocument((bossPlay) => {
  Object.defineProperty(window, '__auto', { configurable: true, get() { if (!window.__autoOn) return undefined; const s = new Error().stack || ''; if (/storyEnabled|storyInPhase|decisions\.js|reentry\.js|epilogue\.js/.test(s)) return undefined; return 1; }, set() {} });
  window.__bossPlay = bossPlay;
}, process.env.BOSS === '1');
const START = process.env.START; // p.ej. /?nointro&phase=descent&flow
if (START) await p.evaluateOnNewDocument(() => { window.__autoOn = 1; });
await p.goto(BASE + (START || '/?nointro'), { waitUntil: 'domcontentloaded' });
await sleep(6000); await shot('start');
const click = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
if (!START) { await click('[data-a=solo]'); await sleep(2000); await shot('briefing'); await texts();
await p.evaluate(() => { window.__autoOn = 1; });
await click('[data-a=go]'); }
// ayudante de la fase 1 (igual que tests/qa.mjs): sigue las pistas del panel, purga, BAT C, lámpara, DSKY y ronda GO
await p.evaluate(() => setInterval(() => {
  if (document.body.dataset.screen !== 'phase-prep') return;
  if (document.querySelector('.alarm')) { document.querySelector('.purge')?.click(); const c = document.querySelector('[data-sw=batC]'); if (c && !c.classList.contains('on')) c.click(); document.querySelector('[data-lamp="4"]')?.click(); }
  const sw = document.querySelector('.sw.hint'); if (sw) { sw.click(); return; }
  const li = document.querySelector('li.cur');
  if (li && /DSKY|37/i.test(li.textContent) && !window.__dsk) { window.__dsk = 1; ['VERB', '3', '7', 'NOUN', '0', '1', 'ENTR'].forEach((k, i) => setTimeout(() => document.querySelector(`.dsky [data-k="${k}"]`)?.click(), i * 250)); }
  document.querySelector('.station:not(.go)')?.click();
}, 700));
const t0 = Date.now(); let last = '', lastChange = Date.now(), sceneKey = '', sceneT = 0, sceneShots = 0, fpsAcc = {}, n = 0;
const MAX = +(process.env.MAXMIN || 55) * 60000;
while (Date.now() - t0 < MAX) {
  await sleep(1000); n++;
  const st = await state(); await texts();
  const ui = await p.evaluate(() => ({
    lb: !!document.querySelector('.plb-letterbox'), dec: !!document.querySelector('.dec-overlay.on'), whatif: !!document.querySelector('.dec-overlay.whatif'),
    boss: !!document.querySelector('.bd-row [data-a=n]'), bossHud: document.body.dataset.screen === 'boss',
    choice: !!document.querySelector('.story-choice button, .story-choice'), card: document.querySelector('.dec-q')?.textContent || '',
    banner: document.querySelector('.banner')?.textContent?.slice(0, 80) || '',
  })).catch(() => ({}));
  const key = st.scr + (ui.lb ? '+lb' : '') + (ui.dec ? '+dec' : '');
  if (st.scr !== last) { log(`SCREEN ${last} -> ${st.scr} fps=${st.fps} eng=${st.eng} dpr=${st.dpr}`); last = st.scr; lastChange = Date.now(); await shot(st.scr); }
  (fpsAcc[st.scr] ||= []).push(st.fps);
  if (key !== sceneKey) { sceneKey = key; sceneT = 0; sceneShots = 0; lastChange = Date.now(); } else sceneT++;
  if (ui.dec) { await shot('decision'); log('DECISION', ui.card); await p.evaluate(() => (document.querySelector('.dec-overlay.on .dec-opt:not([disabled])') || document.querySelector('.dec-overlay.on button'))?.click()); await sleep(2500); if (ui.whatif) await click('.dec-overlay.whatif button'); continue; }
  if (ui.boss) { await shot('boss-optin'); if (process.env.BOSS === '1') { await click('.bd-row [data-a=y]'); log('BOSS: jugar'); } else { await click('.bd-row [data-a=n]'); log('BOSS: saltar'); } continue; }
  if (ui.lb || /^story-/.test(st.scr)) {
    if (sceneT === 3 || sceneT === 10) await shot(st.scr + (ui.lb ? '-cine' : ''));
    if (sceneT >= 16) { log('SKIP scene', st.scr); await p.keyboard.press('Escape'); sceneT = 0; sceneKey = ''; await sleep(800); }
    continue;
  }
  if (/^phase-/.test(st.scr) && sceneT > 0 && sceneT % 25 === 0) await shot(st.scr + '-t' + sceneT);
  // EVA: el autopiloto llega al sitio pero las rocas le impiden acercarse 0,5 m al objetivo; aquí se pulsa E como haría el jugador
  if (st.scr === 'phase-eva') { const ok = await p.evaluate(() => /E para plantar|ACCIÓN para plantar/.test(document.body.innerText)); if (ok) { await p.keyboard.down('KeyE'); await sleep(200); await p.keyboard.up('KeyE'); } }
  if (/debrief|result/.test(st.scr)) { await sleep(4000); await shot('debrief'); const r = await p.evaluate(() => window.__mission?.()?.results); log('RESULTS', JSON.stringify(r)); break; }
  if (Date.now() - lastChange > 120000) { log('SOFTLOCK? 120s sin cambios en', st.scr, ui.banner); await shot('softlock-' + st.scr); if (/^phase-/.test(st.scr)) { await p.keyboard.press('KeyE'); await p.keyboard.press('Space'); } else { await p.keyboard.press('Escape'); await sleep(500); await p.keyboard.press('Enter'); } lastChange = Date.now(); }
}
const fps = Object.fromEntries(Object.entries(fpsAcc).map(([k, v]) => { const s = v.filter((x) => x > 0).sort((a, b) => a - b); return [k, { n: s.length, p10: s[Math.floor(s.length * 0.1)] || 0, med: s[Math.floor(s.length / 2)] || 0 }]; }));
log('FPS_BY_SCREEN', JSON.stringify(fps));
log('ELAPSED_MIN', ((Date.now() - t0) / 60000).toFixed(1), 'ERRORS', S.errors.length);
await S.b.close();
