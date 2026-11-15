// QA: entra al descenso (misión, modo historia) y registra qué pasa con la alarma 1202 y la decisión de Bales.
// Uso: CHROME_PATH=… node tools/play-descent.mjs [url] [salida] [respuesta: none|1|2]
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5174/?nointro';
const out = process.argv[3] || 'qa-descent'; const answer = process.argv[4] || 'none';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,720'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/vibrate|AudioContext|favicon/.test(m.text())) errors.push(m.text()); });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'domcontentloaded' }); await w(4000);
await page.evaluate(() => import('/src/game/mission.js').then((m) => m.startMission({ mode: 'solo', role: 'pilot', resume: { phase: 'descent', results: {} } })));
await w(4000); await page.keyboard.press('Enter');
const log = []; let shots = 0, answered = false;
for (let i = 0; i < 300; i++) {
  await w(1000);
  const st = await page.evaluate(() => ({
    screen: document.body.dataset.screen, dec: document.querySelector('.dec-overlay .dec-q')?.textContent || '', bar: document.querySelector('.dec-timer i')?.style.transform || '',
    cine: !!document.querySelector('.plb-letterbox'), sub: document.querySelector('.plb-letterbox small')?.textContent || '', title: document.querySelector('.phase-title, .st-title')?.textContent || '',
    look: document.body.classList.contains('look-on'), cursor: document.body.dataset.cursor, lock: !!document.pointerLockElement,
  }));
  log.push(st);
  if ((st.dec || st.cine) && shots < 16) { await page.screenshot({ path: `${out}/s${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 60 }); shots++; }
  if (st.dec && !answered && answer !== 'none' && /Guiado|Guidance/.test(st.dec)) { answered = true; await w(1500); await page.keyboard.press(answer === '1' ? 'Digit1' : 'Digit2'); }
  if (st.screen && !st.screen.startsWith('phase-descent') && i > 20 && !st.dec && !st.cine) break;
}
writeFileSync(`${out}/log.json`, JSON.stringify({ log, errors }, null, 1));
const decs = log.map((x, i) => [i, x.dec.slice(0, 40), x.bar, x.cine, x.screen, x.look]).filter((x) => x[1] || x[3]);
console.log(JSON.stringify({ decs: decs.slice(0, 30), last: log.at(-1), errors: errors.slice(0, 6) }));
await browser.close();
