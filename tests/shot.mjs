// Uso: node tests/shot.mjs <url-path> <out.png> [w h mobile] [waitMs] [js-to-eval]
import puppeteer from 'puppeteer-core';
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 70000).unref?.();
const [path = '/', out = 'tests/out/shot.png', w = '1280', hh = '800', mob = '0', wait = '3000', js = ''] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 60000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); const logs = [];
p.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`)); p.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await p.setViewport({ width: +w, height: +hh, deviceScaleFactor: 1, isMobile: mob === '1', hasTouch: mob === '1' });
await p.evaluateOnNewDocument(() => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, ...(JSON.parse(localStorage.getItem('plb.v1') || '{}')) })));
await p.goto('http://localhost:8787' + path, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, +wait));
if (js) { await p.evaluate(js); await new Promise((r) => setTimeout(r, 1500)); }
await p.screenshot({ path: out });
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 30).join('\n'));
const fps = await p.evaluate(() => window.__stats?.fps); console.log('fps', fps?.toFixed?.(1), 'screen', await p.evaluate(() => window.__screen));
await b.close();
