// node shot.mjs <url-query> <out.png>  (servidor estatico en :8932 con raiz /workspace/apolo11)
import { createRequire } from 'module';
const require = createRequire('/workspace/apolo11/game/package.json');
const puppeteer = require('puppeteer-core');
const [,, query, out] = process.argv;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1024,768'] });
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 768 });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text()); });
await p.goto('http://127.0.0.1:8932/Modelado_Apolo11/P3_Tierra/raw/viewer-p32/index.html?' + query);
await p.waitForFunction('window.__result', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
console.log(JSON.stringify(await p.evaluate('window.__result')));
await p.screenshot({ path: out });
await b.close();
