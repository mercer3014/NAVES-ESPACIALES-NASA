// Prueba de dos clientes: piloto (escritorio) + CAPCOM (móvil) en la misma sala
// Uso: node tests/coop.mjs [from=prep] [secs=600] [outdir]
import puppeteer from 'puppeteer-core';
const [from = 'prep', secs = '600', stop = 'none', out = 'tests/out'] = process.argv.slice(2);
const tag = from.slice(0, 2);
const args = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'];
const mk = async (w, h, mob, name) => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 180000, args });
  const p = await b.newPage(); p.__logs = [];
  p.on('console', (m) => m.type() !== 'log' || /err|warn/i.test(m.text()) ? p.__logs.push(`[${name} ${m.type()}] ${m.text()}`) : 0); p.on('close', () => console.log('PAGE CLOSED', name)); b.on('disconnected', () => console.log('BROWSER DISCONNECTED', name)); p.on('error', (e) => p.__logs.push(`[${name} CRASH] ${e.message}`)); p.on('pageerror', (e) => p.__logs.push(`[${name} pageerror] ${e.message}`));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: Number(process.env.QA_DPR || 1), isMobile: mob, hasTouch: mob });
  await p.evaluateOnNewDocument((n) => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, name: n, lang: 'es', quality: 'low', tts: false })), name);
  return { b, p };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const A = await mk(process.env.QA_MOBILE_HOST ? 640 : 960, process.env.QA_MOBILE_HOST ? 360 : 600, !!process.env.QA_MOBILE_HOST, 'Alex'), B = await mk(390, 844, true, 'Lucia');
await A.p.goto(`http://localhost:8787/?from=${from}&debug&ts=6`, { waitUntil: 'domcontentloaded' });
await A.p.waitForSelector('[data-a=create]', { timeout: 60000 }); await sleep(800); await A.p.click('[data-a=create]');
await A.p.waitForFunction(() => /^\d{4,6}$/.test(document.querySelector('.bigcode')?.textContent || ''), { timeout: 30000 });
const code = await A.p.$eval('.bigcode', (e) => e.textContent); console.log('room', code);
await sleep(1500); await A.p.screenshot({ path: `${out}/co_lobby_host.png` });
await B.p.goto(`http://localhost:8787/?room=${code}&debug&ts=6`, { waitUntil: 'domcontentloaded' });
await A.p.waitForFunction(() => !document.querySelector('[data-a=start]').disabled, { timeout: 60000 });
await sleep(800); await B.p.screenshot({ path: `${out}/co_lobby_guest.png` }); await A.p.screenshot({ path: `${out}/co_lobby_host2.png` });
await A.p.click('[data-a=start]');
// piloto automático: interruptores, fallas, DSKY + __auto del resto
await A.p.evaluate(() => { window.__auto = 1; const q = (s) => [...document.querySelectorAll(s)];
  setInterval(() => { try {
    if (document.querySelector('.alarm')) { document.querySelector('.purge')?.click(); const c = document.querySelector('[data-sw=batC]'); if (c && !c.classList.contains('on')) c.click(); for (let i = 0; i < 3; i++) document.querySelector('[data-lamp="4"]')?.click(); return; }
    const hsw = q('.sw.hint')[0]; if (hsw) return hsw.click();
    const li = document.querySelector('li.cur'); if (li && /DSKY|37/i.test(li.textContent) && !window.__dsk) { window.__dsk = 1; ['VERB', '3', '7', 'NOUN', '0', '1', 'ENTR'].forEach((k, i) => setTimeout(() => document.querySelector(`.dsky [data-k="${k}"]`)?.click(), i * 150)); }
  } catch {} }, 450); });
// CAPCOM automático
await B.p.evaluate(() => { setInterval(() => { const st = document.querySelector('.capcom .station:not(.go)'); if (st) return st.click();
  const go = document.querySelector('.capcom .reqs .btn.go.big-action, .capcom .reqs .btn.amber.big-action'); if (go && !go.__t) { go.__t = 1; setTimeout(() => go.click(), 1200); }
  if (Math.random() < 0.02) document.querySelector('.capcom [data-p=good]')?.click(); }, 500); });
let photosAsked=0, photosAnswered=0;
await B.p.evaluate(() => { const ws=window.__net.net.ws; ws.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.t==='req'&&m.k==='photo')window.__photoAsked=(window.__photoAsked||0)+1;}catch{}}); const send=ws.send.bind(ws);ws.send=d=>{try{const m=JSON.parse(d);if(m.t==='ev'&&m.k==='resp'&&m.id?.endsWith('-eva'))window.__photoAnswered=(window.__photoAnswered||0)+1;}catch{}return send(d);}; });
const t0 = Date.now(); let passed = false, n = 0, lastPh = '', lastReq = '';
while (Date.now() - t0 < +secs * 1000) {
  await sleep(4000);
  const sA = await A.p.evaluate(() => ({ scr: document.body.dataset.screen, eva: window.__eva, deb: !!window.__debrief, result: window.__mission?.()?.results })).catch((e) => ({ err: e.message.slice(0, 60) }));
  const sB = await B.p.evaluate(() => ({ scr: document.body.dataset.screen, ph: window.__ccPhase, req: window.__ccReq, logs: window.__capcom?.logs, deb: !!document.querySelector('.srow') })).catch(() => ({}));
  if (sB.ph !== lastPh || sB.req !== lastReq || n % 8 === 0) { console.log(((Date.now() - t0) / 1000) | 0, 's', JSON.stringify(sA), JSON.stringify(sB));
    await A.p.screenshot({ path: `${out}/co_${tag}A${String(n).padStart(2, '0')}.png` }).catch((e) => console.log('A shot fail', e.message)); await B.p.screenshot({ path: `${out}/co_${tag}B${String(n).padStart(2, '0')}.png` }).catch((e) => console.log('B shot fail', e.message)); }
  if (sB.ph === stop || /practice|pcard/.test(sA.scr || '')) { passed = Number.isFinite(sA.result?.[from]?.score); console.log('STOP', stop, sA.scr, 'PASS', passed); await sleep(3000); await A.p.screenshot({ path: `${out}/co_${tag}A_end.png` }).catch(() => {}); await B.p.screenshot({ path: `${out}/co_${tag}B_end.png` }).catch(() => {}); break; }
  lastPh = sB.ph; lastReq = sB.req; n++;
  if (sA.deb && sB.deb) { await sleep(5000); await A.p.screenshot({ path: `${out}/co_A_debrief.png` }); await B.p.screenshot({ path: `${out}/co_B_debrief.png` }); const results=await A.p.evaluate(()=>window.__mission?.()?.results); console.log('FINAL RESULTS',JSON.stringify(results)); const scoresOK=Object.keys(results||{}).length===5&&Object.values(results).every(r=>Number.isFinite(r.score)&&!r.stats?.error); photosAsked=await B.p.evaluate(()=>window.__photoAsked||0); photosAnswered=await B.p.evaluate(()=>window.__photoAnswered||0); passed = scoresOK && photosAsked>0 && photosAnswered>0 && ![...A.p.__logs,...B.p.__logs].some(x=>/pageerror|\[.* error\]/.test(x)); console.log('BOTH DEBRIEF', {passed,photosAsked,photosAnswered}); break; }
}
if (!passed) console.error(`FAIL co-op: no completed ${from} result within ${secs}s; last phase=${lastPh}, request=${lastReq || 'none'}`);
console.log([...A.p.__logs, ...B.p.__logs].filter((l) => !l.includes('GPU stall')).slice(0, 40).join('\n'));
await A.b.close(); await B.b.close(); process.exit(passed ? 0 : 1);
