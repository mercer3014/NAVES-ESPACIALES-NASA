// QA: entra al crucero (misión, modo historia), hace la TLI y vuela el acople con un piloto simple. Capturas + registro.
// Uso: CHROME_PATH=… node tools/play-dock.mjs [url] [salida]
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5174/?nointro';
const out = process.argv[3] || 'qa-dock';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,720'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/vibrate|AudioContext|favicon/.test(m.text())) errors.push(m.text()); });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'domcontentloaded' }); await w(4000);
await page.evaluate(() => import('/src/game/mission.js').then((m) => m.startMission({ mode: 'solo', role: 'pilot', resume: { phase: 'cruise', results: {} } })));
await w(4000); await page.keyboard.press('Enter'); await w(1500);
// TLI: mantener ESPACIO hasta el centro de la zona
await page.evaluate(() => {
  const kd = (c) => dispatchEvent(new KeyboardEvent('keydown', { code: c })), ku = (c) => dispatchEvent(new KeyboardEvent('keyup', { code: c }));
  window.__tli = setInterval(() => { const f = document.querySelector('.fillb'), z = document.querySelector('.zone'); if (!f || !z || z.parentElement?.closest('.burnbox')?.style.display === 'none') return;
    const fw = parseFloat(f.style.width) / 100 * 1.08, z0 = parseFloat(z.style.left) / 100, zw = parseFloat(z.style.width) / 100; if (fw < z0 + zw / 2) kd('Space'); else { ku('Space'); clearInterval(window.__tli); } }, 30);
});
const log = []; let shots = 0;
for (let i = 0; i < 480; i++) {
  await w(1000);
  const st = await page.evaluate(() => ({ dock: !!document.querySelector('.dock'), cal: !!document.querySelector('.dock-cal:not([hidden])'), hint: document.querySelector('.dock-hint')?.textContent || '', r: document.querySelector('.dock .r')?.textContent, o: document.querySelector('.dock .o')?.textContent, f: document.querySelector('.dock .f')?.textContent, title: document.querySelector('.st-title')?.textContent }));
  log.push(st);
  if (st.dock && !log.at(-2)?.dock) await page.evaluate(() => { // piloto del acople: centra la cruz (A/D, W/S) y en la calibración mantiene la aguja
    const kd = (c) => dispatchEvent(new KeyboardEvent('keydown', { code: c })), ku = (c) => dispatchEvent(new KeyboardEvent('keyup', { code: c }));
    window.__dp = setInterval(() => {
      const n = document.querySelector('.dock-cal:not([hidden]) .dock-cal-n');
      if (n) { const p = parseFloat(n.style.left); if (p > 54) { kd('KeyA'); ku('KeyD'); } else if (p < 46) { kd('KeyD'); ku('KeyA'); } else { ku('KeyA'); ku('KeyD'); } return; }
      const g = document.querySelector('.dock .tgt'); if (!g) return; const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform') || ''); if (!m) return;
      const x = +m[1], y = +m[2]; // + y en pantalla = abajo
      if (x > 4) { kd('KeyA'); ku('KeyD'); } else if (x < -4) { kd('KeyD'); ku('KeyA'); } else { ku('KeyA'); ku('KeyD'); }
      if (y > 4) { kd('KeyW'); ku('KeyS'); } else if (y < -4) { kd('KeyS'); ku('KeyW'); } else { ku('KeyW'); ku('KeyS'); }
    }, 120);
  });
  if ((st.dock && shots < 14 && i % 2 === 0) || (st.cal && shots < 18)) { await page.screenshot({ path: `${out}/d${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 60 }); shots++; }
  if (log.length > 3 && log.at(-2)?.dock && !st.dock) { await w(2500); await page.screenshot({ path: `${out}/after.jpg`, type: 'jpeg', quality: 60 }); break; }
}
writeFileSync(`${out}/log.json`, JSON.stringify({ log, errors }, null, 1));
console.log(JSON.stringify({ last: log.at(-1), docked: log.some((x) => x.cal), errors: errors.slice(0, 6) }));
await browser.close();
