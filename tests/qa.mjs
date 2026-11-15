// QA de partida completa: node tests/qa.mjs <lang> <w> <h> <mob> <outdir> [maxMin] [path]
// Juega desde el menú (Solo con Pancho) con el piloto automático de ?debug, audita la UI cada pocos segundos:
// errores de página, textos fuera de pantalla, solapes, claves i18n sin traducir y texto del otro idioma; detecta bloqueos.
import puppeteer from 'puppeteer-core'; import fs from 'fs';
const [lang, w, hh, mob, out, maxMin = '60', path = '/?debug&nointro'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true }); const log = (...a) => { const s = a.join(' '); console.log(s); fs.appendFileSync(out + '/qa.log', s + '\n'); };
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); let runtimeErrors = 0;
p.on('pageerror', (e) => { runtimeErrors++; log('[pageerror]', e.message); }); p.on('console', (m) => { if (m.type() === 'error' && !/GPU stall|favicon|WebSocket|ERR_/.test(m.text())) { runtimeErrors++; log('[console.error]', m.text().slice(0, 300)); } });
await p.setViewport({ width: +w, height: +hh, deviceScaleFactor: Number(process.env.QA_DPR || 1), isMobile: mob === '1', hasTouch: mob === '1' });
await p.evaluateOnNewDocument((l, quality) => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, lang: l, name: 'Alex', quality })), lang, process.env.QUALITY || 'auto');
await p.goto('http://localhost:8787' + path, { waitUntil: 'domcontentloaded' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const audit = () => p.evaluate((lang) => {
  const W = innerWidth, H = innerHeight, issues = [];
  const vis = (e) => { if (!e.getClientRects().length) return false; for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } return true; };
  const scrolls = (e) => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) return x; } return null; };
  const modal = [...document.querySelectorAll('.hud > .screen,.hud .overlay')].find(e => vis(e));
  const texts = [...document.body.querySelectorAll('*')].filter((e) => !['SCRIPT', 'STYLE', 'CANVAS', 'VIDEO', 'svg'].includes(e.tagName) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1) && vis(e) && (!modal || modal.contains(e)));
  const ES = /[ñ¿¡]|\b(el|los|las|del|para|pulsa|mantén|toca|una|con)\b/i, EN = /\b(the|press|hold|tap|and|with|your|you)\b/i;
  const items = texts.map((e) => {
    const sc = scrolls(e), b = e.getBoundingClientRect(); let left = b.left, right = b.right, top = b.top, bottom = b.bottom;
    if (sc) { const c = sc.getBoundingClientRect(); left = Math.max(left, c.left); right = Math.min(right, c.right); top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); }
    const r = { left, right, top, bottom, width: Math.max(0, right-left), height: Math.max(0, bottom-top) };
    const hit = sc && r.width > 2 && r.height > 2 ? document.elementFromPoint((left+right)/2, (top+bottom)/2) : null;
    return { e, r, s: e.textContent.trim().replace(/\s+/g, ' ').slice(0,60), sc, occluded: !!hit && hit !== e && !e.contains(hit) && !hit.contains(e) };
  }).filter(it => it.r.width > 2 && it.r.height > 2 && !it.occluded);
  for (const it of items) {
    const { r, s } = it; if (r.width < 2 || r.height < 2) continue;
    if (!it.sc && (r.right > W + 2 || r.bottom > H + 2 || r.left < -2 || r.top < -2)) issues.push(`offscreen "${s}" [${r.left | 0},${r.top | 0},${r.right | 0},${r.bottom | 0}]`);
    if (/^[a-z]{1,3}\.[a-zA-Z0-9.]+$/.test(s)) issues.push(`rawkey "${s}"`);
    if (lang === 'en' && ES.test(s) && !/Pancho|Columbia|Eagle|Orinalejos/i.test(s)) issues.push(`es-in-en "${s}"`);
    if (lang === 'es' && EN.test(s)) issues.push(`en-in-es "${s}"`);
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], c = items[j]; if (a.e.contains(c.e) || c.e.contains(a.e)) continue;
    const x = Math.max(0, Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left)), y = Math.max(0, Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top));
    const ar = Math.min(a.r.width * a.r.height, c.r.width * c.r.height); if (ar > 30 && x * y > ar * 0.25) issues.push(`overlap "${a.s}" × "${c.s}"`);
  }
  return { scr: document.body.dataset.screen || '', issues: [...new Set(issues)].slice(0, 25) };
}, lang);
const seen = new Map(); let shotN = 0;
const check = async (tag, shot) => { let a; try { a = await audit(); } catch (e) { log('audit err', e.message); return {}; }
  for (const s of a.issues) { const k = a.scr + '|' + s; if (!seen.has(k)) { seen.set(k, 1); log(`[issue] ${a.scr} ${s}`); } }
  if (shot) { const f = `${out}/${String(++shotN).padStart(2, '0')}_${(tag || a.scr).replace(/[^\w-]/g, '_')}.png`; await p.screenshot({ path: f }); log('shot', f); } return a; };
const click = async (sel) => { const h = await p.$(sel); if (!h) return false; try { mob === '1' ? await h.tap() : await h.click(); return true; } catch { return p.evaluate((s) => { const e = document.querySelector(s); e?.click(); return !!e; }, sel); } };
await sleep(9000); await check('start', true);
if (!(await click('[data-a=solo]'))) log('[issue] no solo button'); await sleep(2500); await check('briefing', true);
if (!(await click('[data-a=go]'))) log('[issue] no go button'); await sleep(1000);
await p.evaluate(() => {
  window.__auto = 1;
  setInterval(() => {
    if (document.body.dataset.screen !== 'phase-prep') return;
    const alarm = document.querySelector('.alarm');
    if (alarm) { document.querySelector('.purge')?.click(); const c = document.querySelector('[data-sw=batC]'); if (c && !c.classList.contains('on')) c.click(); document.querySelector('[data-lamp="4"]')?.click(); }
    const sw = document.querySelector('.sw.hint'); if (sw) { sw.click(); return; }
    const li = document.querySelector('li.cur');
    if (li && /DSKY|37/i.test(li.textContent) && !window.__dsk) { window.__dsk = 1; ['VERB', '3', '7', 'NOUN', '0', '1', 'ENTR'].forEach((k, i) => setTimeout(() => document.querySelector(`.dsky [data-k="${k}"]`)?.click(), i * 250)); }
    document.querySelector('.station:not(.go)')?.click();
  }, 650);
});
let completed = false; const t0 = Date.now(); let last = '', progress = '', pulse = 0, lastT = Date.now(), lastHint = '';
while (Date.now() - t0 < maxMin * 60000) {
  await sleep(6000);
  const st = await p.evaluate(() => ({ scr: document.body.dataset.screen || '', progress: window.__launchS?.s?.toFixed(0) + ':' + window.__evaDbg?.P.mode + ':' + window.__evaDbg?.P.x?.toFixed(1) + ':' + window.__evaDbg?.P.z?.toFixed(1), hint: [...document.querySelectorAll('.hint,.prompt,.title,.phase-title,h1,h2')].map((e) => e.textContent.trim()).filter(Boolean).join(' | ').slice(0, 160) })).catch(() => ({ scr: 'ERR' }));
  const changed = st.scr !== last; const hintCh = st.hint !== lastHint;
  if (changed || hintCh || st.progress !== progress) lastT = Date.now();
  await check(st.scr, changed); if (changed) log(`[t+${((Date.now() - t0) / 1000) | 0}s] screen ${st.scr} :: ${st.hint}`);
  if (++pulse % 5 === 0) log('[progress]', st.scr, st.progress, st.hint); progress = st.progress; last = st.scr; lastHint = st.hint;
  if (/debrief|result/.test(st.scr)) { await sleep(5000); await check('debrief_end', true); const results = await p.evaluate(() => window.__mission?.()?.results); log('[results]', JSON.stringify(results)); if (!results || Object.values(results).some(r => !Number.isFinite(r.score) || r.stats?.error)) runtimeErrors++; log('[done] reached', st.scr); completed = true; break; }
  if (Date.now() - lastT > 240000) { log(`[issue] SOFTLOCK? no change for 240s on ${st.scr} :: ${st.hint}`); await check('softlock', true); lastT = Date.now(); }
}
log('[end] elapsed', ((Date.now() - t0) / 60000).toFixed(1), 'min'); await b.close(); if (!completed || runtimeErrors) { log('[FAIL] completed:', completed, 'runtimeErrors:', runtimeErrors); process.exitCode = 1; }
