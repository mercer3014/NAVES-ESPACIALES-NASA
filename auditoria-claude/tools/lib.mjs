// Utilidades compartidas de la auditoría: Edge headless con GPU, capturas numeradas, log de textos nuevos y FPS reales (rAF).
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

export const BASE = process.env.QA_URL || 'http://127.0.0.1:5173';
export const OUT = path.resolve(process.env.OUT || 'auditoria-claude');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export async function open({ prefix, lang = 'es', intro = false, mobile = false, w = 1280, h = 720, gpu = true, store = {} }) {
  fs.mkdirSync(OUT, { recursive: true });
  const logf = path.join(OUT, `${prefix}.log`); fs.writeFileSync(logf, '');
  const t0 = Date.now();
  const log = (...a) => { const s = `[${((Date.now() - t0) / 1000).toFixed(1)}s] ` + a.join(' '); console.log(s); fs.appendFileSync(logf, s + '\n'); };
  const args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
  if (gpu) args.push('--use-angle=d3d11', '--enable-webgl'); else args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || EDGE, headless: 'new', protocolTimeout: 240000, args });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => { errors.push(e.message); log('[pageerror]', e.message.slice(0, 300)); });
  p.on('console', (m) => { const tx = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|favicon|WebSocket|ws:\/\/|\[vite\]|DevTools/.test(tx)) log(`[console.${m.type()}]`, tx.slice(0, 300)); });
  p.on('requestfailed', (r) => { const u = r.url(); if (!/\/ws|favicon/.test(u)) log('[reqfail]', u.replace(BASE, ''), r.failure()?.errorText); });
  p.on('response', (r) => { if (r.status() >= 400 && !/favicon|\/qr/.test(r.url())) log('[http ' + r.status() + ']', r.url().replace(BASE, '')); });
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((l, intro, extra) => {
    localStorage.setItem('plb.v1', JSON.stringify({ introSeen: !intro, lang: l, name: 'Alex', ...extra }));
    // FPS reales por requestAnimationFrame (el contador del motor suma dt recortado y los infla)
    window.__fpsRaw = 0; window.__fpsLog = []; let n = 0, t = performance.now();
    const f = () => { n++; const now = performance.now(); if (now - t >= 1000) { window.__fpsRaw = (n * 1000) / (now - t); window.__fpsLog.push(Math.round(window.__fpsRaw)); if (window.__fpsLog.length > 600) window.__fpsLog.shift(); n = 0; t = now; } requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }, lang, intro, store);
  let shotN = 0;
  const shot = async (tag) => { const f = path.join(OUT, `${prefix}-${String(++shotN).padStart(2, '0')}_${String(tag).replace(/[^\w-]/g, '_').slice(0, 50)}.jpg`); try { await p.screenshot({ path: f }); log('SHOT', path.basename(f)); } catch (e) { log('shot err', e.message); } return f; };
  const seenText = new Set();
  // textos visibles nuevos (subtítulos, banners, tarjetas): sirve para reconstruir la narrativa que ve el jugador
  const texts = async () => {
    let lines = [];
    try { lines = await p.evaluate(() => (document.body.innerText || '').split('\n').map((s) => s.trim()).filter((s) => s.length > 2 && s.length < 400)); } catch { return; }
    const fresh = lines.filter((s) => !seenText.has(s)); fresh.forEach((s) => seenText.add(s));
    if (fresh.length) log('TEXT', fresh.slice(0, 30).join(' ¶ '));
  };
  const state = () => p.evaluate(() => ({ scr: document.body.dataset.screen || '', fps: Math.round(window.__fpsRaw), eng: Math.round(window.__stats?.fps || 0), dpr: window.__stats?.dpr, ph: window.__mission?.()?.phase || '' })).catch(() => ({ scr: '?' }));
  const gl = () => p.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c?.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; });
  return { b, p, log, shot, texts, state, gl, errors, t0 };
}
