// Capturas del visor (three.js real en Chrome headless) de los glb COMPRIMIDOS de P4: comprueba meshopt + WebP en navegador.
import { createRequire } from 'node:module'; const puppeteer = createRequire('/workspace/apolo11/game/package.json')('puppeteer-core');
const out = '/workspace/apolo11/Modelado_Apolo11/P4_Luna/previews/';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--hide-scrollbars'],
  defaultViewport: { width: 1280, height: 800 } });
for (const m of process.argv.slice(2)) {
  const page = await browser.newPage(); const logs = [];
  page.on('console', (c) => { if (['error', 'warning'].includes(c.type())) logs.push(c.text()); }); page.on('pageerror', (e) => logs.push('pageerror ' + e.message));
  await page.goto(`http://127.0.0.1:5190/?modelo=p4/${m}.glb`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready === '1' || document.body.dataset.ready === 'error', { timeout: 60000 }).catch(() => logs.push('timeout ready'));
  await page.click('#toggle-maniqui'); await page.click('#toggle-ejes');
  const zoom = { 'memorial-kit': 14, 'eva-tools': 3, 'o2-hose': 2 }[m] || 0;
  const cv = await page.$('canvas'); const bb = await cv.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  for (let i = 0; i < zoom; i++) { await page.mouse.wheel({ deltaY: -120 }); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 2500));
  const st = await page.evaluate(() => ({ ready: document.body.dataset.ready, status: document.querySelector('#status')?.textContent || '' }));
  await page.screenshot({ path: out + `visor-${m}.png` });
  console.log(m, JSON.stringify(st), logs.length ? 'LOGS: ' + logs.join(' | ').slice(0, 400) : 'sin errores');
  await page.close();
}
await browser.close();
