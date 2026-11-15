// Tirones: fotogramas largos (> 40 ms) durante una fase jugada por el piloto automático, con el n.º de programas (shaders) y texturas
// en ese momento, para saber si el corte viene de compilar shaders, subir texturas o del propio juego.
// Uso: PHASE_URL="/?nointro&phase=eva" TAG=eva SECS=45 node auditoria-claude/tools/hitch-probe.mjs
import { open, sleep, BASE } from './lib.mjs';
const URLP = process.env.PHASE_URL || '/?nointro&phase=eva', TAG = process.env.TAG || 'x', SECS = +(process.env.SECS || 45);
const S = await open({ prefix: `hitch-${TAG}`, mobile: !!process.env.MOBILE, w: +(process.env.W || 1280), h: +(process.env.H || 720), store: process.env.QUALITY ? { quality: process.env.QUALITY } : {} });
await S.p.evaluateOnNewDocument(() => { window.__auto = 1;
  window.__hit = []; let last = performance.now(); const t0 = last;
  const f = () => { const now = performance.now(), d = now - last; last = now;
    if (d > 40) { let pr = -1, tx = -1; try { const i = window.__rinfo; if (i) { pr = i.programs.length; tx = i.memory.textures; } } catch {} window.__hit.push([Math.round(now - t0), Math.round(d), pr, tx, document.body.dataset.screen || '']); }
    requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
await S.p.goto(BASE + URLP, { waitUntil: 'domcontentloaded' });
await sleep(1500);
await S.p.evaluate(async () => { const u = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\/src\/core\/engine\.js/.test(n)).pop(); const E = await import(u); window.__rinfo = E.renderer.info; });
await sleep(SECS * 1000);
const r = await S.p.evaluate(() => ({ hit: window.__hit, fps: window.__fpsLog.slice(), dpr: window.__stats?.dpr }));
const after = r.hit.filter((h) => h[0] > 3000);
S.log('HITCH', JSON.stringify({ n: after.length, totalMs: after.reduce((a, h) => a + h[1], 0), worst: Math.max(0, ...after.map((h) => h[1])), dpr: r.dpr }));
S.log('LIST [t ms, dur ms, programas, texturas, pantalla]', JSON.stringify(after));
S.log('FPSLOG', r.fps.join(' '));
await S.b.close();
