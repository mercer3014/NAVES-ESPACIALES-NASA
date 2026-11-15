// QA: EVA completa con el piloto de QA (window.__auto) y capturas en cada etapa (escalera, primer paso, muestra, foto).
// Uso: CHROME_PATH=… node tools/play-eva.mjs [url] [salida]
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5174/?nointro';
const out = process.argv[3] || 'qa-eva';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,720'] });
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error' && !/vibrate|AudioContext|favicon/.test(m.text())) errors.push(m.text()); });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(url, { waitUntil: 'domcontentloaded' }); await w(4000);
await page.evaluate(() => import('/src/game/mission.js').then((m) => m.startMission({ mode: 'solo', role: 'pilot', resume: { phase: 'eva', results: {} } })));
await w(4000); await page.keyboard.press('Enter'); await w(1500);
await page.evaluate(() => { window.__auto = 1; });
const log = []; let last = '', shots = 0;
for (let i = 0; i < 420; i++) {
  await w(700);
  const st = await page.evaluate(() => ({ stage: window.__eva || '', act: window.__evaDbg?.P?.act || '', screen: document.body.dataset.screen, prompt: document.querySelector('.mhud-prompt')?.textContent || '', hold: document.querySelector('.hold')?.style.display, toast: document.querySelector('.toast')?.textContent || '' }));
  log.push(st);
  const key = st.stage + '|' + st.act;
  if (key !== last && shots < 40) { await page.screenshot({ path: `${out}/e${String(i).padStart(3, '0')}-` + `${st.stage}-${st.act || 'x'}`.replace(/[^\w-]/g, '_') + '.jpg', type: 'jpeg', quality: 60 }); shots++; last = key; }
  else if (i % 12 === 0 && shots < 40) { await page.screenshot({ path: `${out}/e${String(i).padStart(3, '0')}.jpg`, type: 'jpeg', quality: 60 }); shots++; }
  if (!st.screen?.startsWith('phase-eva') && i > 10) break;
}
writeFileSync(`${out}/log.json`, JSON.stringify({ log, errors }, null, 1));
console.log(JSON.stringify({ stages: [...new Set(log.map((x) => x.stage))], last: log.at(-1), errors: errors.slice(0, 6) }));
await browser.close();
