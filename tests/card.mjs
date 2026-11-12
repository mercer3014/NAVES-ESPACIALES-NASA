import puppeteer from 'puppeteer-core'; import fs from 'fs';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
await p.evaluateOnNewDocument(() => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, lang: 'es', name: 'Alex' })));
await p.goto('http://localhost:8787/?debrief=1&debug'); await p.waitForFunction(() => window.__plbCard, { timeout: 60000 });
const u = await p.evaluate(() => window.__plbCard); fs.writeFileSync('tests/out/q_card.jpg', Buffer.from(u.split(',')[1], 'base64')); await b.close();
