// QA: juega el despegue (práctica) en un Chrome sin interfaz con un piloto que sigue el corredor, baja el empuje en
// Max-Q, hace el rolido y pulsa ESPACIO en la franja verde. Guarda capturas y el registro del vuelo.
// Uso: CHROME_PATH=… node tools/play-launch.mjs [url] [salida] [modo]  · modo: good (por defecto) | idle (no toca nada)
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5174/?nostory';
const out = process.argv[3] || 'qa-launch'; const mode = process.argv[4] || 'good';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/vibrate|AudioContext|favicon/.test(m.text())) errors.push(m.text()); });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'domcontentloaded' }); await w(4000);
await page.evaluate(() => document.querySelector('[data-a=missions]')?.click()); await w(1000);
await page.evaluate(() => document.querySelector('[data-p=launch]')?.click()); await w(3500);
await page.screenshot({ path: `${out}/a-card.jpg`, type: 'jpeg', quality: 60 });
await page.keyboard.press('Enter'); await w(2500);
await page.screenshot({ path: `${out}/b-count.jpg`, type: 'jpeg', quality: 60 });
await page.evaluate(() => document.querySelector('.skipcd')?.click());
if (mode === 'good') await page.evaluate(() => {
  const kd = (c) => dispatchEvent(new KeyboardEvent('keydown', { code: c })), ku = (c) => dispatchEvent(new KeyboardEvent('keyup', { code: c }));
  const target = (s) => (s < 5 ? 90 : s > 72 ? 12 : 90 - (78 * Math.pow((s - 5) / 67, 0.8)));
  window.__pilot = setInterval(() => {
    const S = window.__launchS; if (!S) return; if (S.phase !== 'fly') { ['KeyA', 'KeyD', 'KeyS', 'KeyW', 'KeyQ', 'KeyE'].forEach(ku); return; }
    const err = S.pitch - target(S.s); if (err > 1.5) { kd('KeyD'); ku('KeyA'); } else if (err < -1.5) { kd('KeyA'); ku('KeyD'); } else { ku('KeyA'); ku('KeyD'); }
    if (S.stress > 0.05 || ((S.q || 0) > 95 && S.s < 24)) { kd('KeyS'); ku('KeyW'); } else { ku('KeyS'); kd('KeyW'); }
    const rv = document.querySelector('.lroll-v'); if (rv) { const h = parseFloat(rv.textContent); if (h > 74) { kd('KeyQ'); ku('KeyE'); } else if (h < 70) { kd('KeyE'); ku('KeyQ'); } else { ku('KeyQ'); ku('KeyE'); } } else { ku('KeyQ'); ku('KeyE'); }
    const n = document.querySelector('.lsep-ndl'), z = document.querySelector('.lsep-zone');
    if (n && z && !window.__pressed) { const nl = parseFloat(n.style.left), zl = parseFloat(z.style.left), zw = parseFloat(z.style.width); if (nl > zl + zw * 0.3 && nl < zl + zw * 0.7) { window.__pressed = 1; kd('Space'); setTimeout(() => { ku('Space'); window.__pressed = 0; }, 120); } }
  }, 25);
});
const log = []; let shot = 0;
for (let i = 0; i < 300; i++) {
  await w(1000);
  const st = await page.evaluate(() => { const S = window.__launchS; return S ? { s: +S.s.toFixed(1), phase: S.phase, alt: Math.round(S.alt), pitch: Math.round(S.pitch), stress: +S.stress.toFixed(2), stage: S.stage, fail: S.fail || null, roll: !!document.querySelector('.lroll'), bar: !!document.querySelector('.lsep'), boom: !!document.querySelector('.lboom'), hudAlt: document.querySelector('.v-alt')?.textContent } : null; });
  log.push(st);
  if (st && (i % 4 === 0 || st.roll || st.bar) && shot < 30) await page.screenshot({ path: `${out}/t${String(i).padStart(3, '0')}.jpg`, quality: 60, type: 'jpeg' }), shot++;
  if (st && (st.phase === 'orbit' || st.boom)) { await w(1500); await page.screenshot({ path: `${out}/end.jpg`, quality: 70, type: 'jpeg' }); break; }
}
writeFileSync(`${out}/log.json`, JSON.stringify({ log, errors }, null, 1));
console.log(JSON.stringify({ last: log.at(-1), errors: errors.slice(0, 8) }));
await browser.close();
