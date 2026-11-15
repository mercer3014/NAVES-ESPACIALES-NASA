// ¿Suena la música? Abre el juego SIN permiso de autoplay (como un navegador real), hace clics de verdad y
// lista cada <audio> que crea Howler: pista, si avanza, volumen y errores de play().
// Uso: QA_URL=https://nasa.nickzar.online node auditoria-claude/tools/music-probe.mjs   (PATHQ=/?nointro  CLICKS=3)
import puppeteer from 'puppeteer-core';
const BASE = process.env.QA_URL || 'http://127.0.0.1:5173', PATHQ = process.env.PATHQ || '/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox', '--mute-audio', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
p.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 240)); });
p.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 240)));
p.on('response', (r) => { if (r.status() >= 400) console.log('[http ' + r.status() + ']', r.url()); });
await p.evaluateOnNewDocument((store) => {
  if (store) localStorage.setItem('plb.v1', store);
  window.__au = []; window.__auLog = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!window.__au.includes(this)) window.__au.push(this);
    const src = (this.src || '').split('/').slice(-2).join('/').slice(0, 60), pr = play.apply(this, arguments);
    pr?.then(() => window.__auLog.push('ok ' + src), (e) => window.__auLog.push('RECHAZADO ' + src + ' · ' + e.name));
    return pr;
  };
}, process.env.STORE || '');
const dump = async (tag) => {
  const r = await p.evaluate(() => ({ scr: document.body.dataset.screen, ctx: window.__dbg?.audio?.Howler?.ctx?.state, st: window.__dbg?.audio?.state?.(), log: window.__auLog.splice(0),
    au: window.__au.filter((a) => a.src && !a.src.startsWith('data:')).map((a) => `${a.src.split('/').slice(-2).join('/')} ${a.paused ? 'PAUSADO' : 'suena'} t=${a.currentTime.toFixed(1)} vol=${a.volume.toFixed(2)}${a.muted ? ' MUTE' : ''}${a.error ? ' ERR' + a.error.code : ''}`) }));
  console.log(`== ${tag} · pantalla=${r.scr} ctx=${r.ctx} ${r.st ? JSON.stringify(r.st) : ''}`); r.log.forEach((l) => console.log('   play():', l)); r.au.forEach((l) => console.log('   audio:', l));
};
await p.goto(BASE + PATHQ, { waitUntil: 'domcontentloaded' }); await sleep(7000); await dump('sin tocar nada');
for (let i = 0; i < +(process.env.CLICKS || 3); i++) { await p.mouse.click(640, 360 + i * 40); await sleep(4000); await dump('tras clic ' + (i + 1)); }
await p.keyboard.press('Enter'); await sleep(4000); await dump('tras Enter');
await b.close();
