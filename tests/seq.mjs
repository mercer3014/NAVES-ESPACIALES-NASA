// Uso: node tests/seq.mjs <path> <w> <h> <mobile> '<json steps>'  steps: [[waitMs, js|null, outPng|null], ...]
import puppeteer from 'puppeteer-core';
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, +(process.env.TMO || 240000)).unref?.();
const [path, w, hh, mob, steps] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 120000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); const logs = [];
p.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`)); p.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await p.setViewport({ width: +w, height: +hh, deviceScaleFactor: 1, isMobile: mob === '1', hasTouch: mob === '1' });
await p.evaluateOnNewDocument(() => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, ...(JSON.parse(localStorage.getItem('plb.v1') || '{}')) })));
await p.goto('http://localhost:8787' + path, { waitUntil: 'domcontentloaded' });
for (const [ms, js, out] of JSON.parse(steps)) {
  await new Promise((r) => setTimeout(r, ms));
  if (js) { try { const r = await p.evaluate(js); if (r !== undefined) console.log('>', JSON.stringify(r)); } catch (e) { console.log('eval err', e.message); } }
  if (out) { await p.screenshot({ path: out }); console.log('shot', out); }
}
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 40).join('\n'));
await b.close();
