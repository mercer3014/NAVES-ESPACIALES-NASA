// Captura de la EVA REAL del juego (copia game-p4test con el parche de crateres) mirando al este (-x) hacia Little West.
import { createRequire } from 'node:module'; const puppeteer = createRequire('/workspace/apolo11/game/package.json')('puppeteer-core');
const [port = '5193', tag = 'despues'] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, protocolTimeout: 240000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage'] });
const p = await b.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.setViewport({ width: 1280, height: 720 });
await p.evaluateOnNewDocument(() => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, lang: 'es', name: 'Alex', flag: { code: 'BO', mode: 'country' } })));
await p.goto(`http://127.0.0.1:${port}/?phase=eva&sub=walk&debug&ts=6`, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__evaDbg?.P?.mode === 'walk', { timeout: 200000 });
const info = await p.evaluate(() => { const d = window.__evaDbg; return { keys: Object.keys(d), P: { x: d.P.x, z: d.P.z, y: d.P.y } }; });
console.log(JSON.stringify(info));
// jugador al borde oeste de Little West, mirando al este (-x)
const shots = [['lw-centro', -60, 0.0, 0.85, 34], ['lw-desde-lm', -12, -3.0, 0.20, 7]];
for (const [name, dx, dz, pitch, dist] of shots) {
  await p.evaluate((dx, dz, pitch, dist) => { const d = window.__evaDbg; d.P.x = d.P.x + dx; d.P.z = dz; d.P.yaw = -Math.PI / 2; if (d.cam) d.cam(Math.PI / 2 + 0.2, pitch, dist); }, dx, dz, pitch, dist);
  await new Promise((r) => setTimeout(r, 3000));
  await p.screenshot({ path: `/workspace/apolo11/Modelado_Apolo11/P4_Luna/previews/juego-eva-${name}-${tag}.png` });
  await p.evaluate((dx) => { const d = window.__evaDbg; d.P.x -= dx; }, dx);
}
console.log('errores:', errs.length, errs.slice(0, 4).join(' | ').slice(0, 500));
await b.close();
