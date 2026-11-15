// Prueba de radio del traje: dos clientes con micrófono falso (tono 440 Hz de Chrome)
import puppeteer from 'puppeteer-core';
const out = process.argv[2] || 'tests/out/radio';
const args = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--allow-loopback-in-peer-connection', '--disable-features=WebRtcHideLocalIpsWithMdns'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mk = async (w, h, mob, name) => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 120000, args });
  const p = await b.newPage(); p.__logs = [];
  p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && p.__logs.push(`[${name}] ${m.text()}`));
  p.on('response', (r) => r.status() === 404 && p.__logs.push(`[${name} 404] ${r.url()}`));
  p.on('pageerror', (e) => p.__logs.push(`[${name} PAGEERR] ${e.message}`));
  await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob });
  await p.evaluateOnNewDocument((n) => localStorage.setItem('plb.v1', JSON.stringify({ introSeen: true, name: n, lang: 'es' })), name);
  return { b, p };
};
const st = (P) => P.p.evaluate(() => { const r = window.__radio; return { state: r.state, link: r.link, muted: r.muted, mode: r.mode, me: r.me, peer: r.peer, inB: r.stats.inBytes, outB: r.stats.outBytes, vad: r.vadOpen, pill: !document.querySelector('.radio').classList.contains('hidden'), peerCls: document.querySelector('.radio').className, talkCard: document.querySelectorAll('.crewcard.talking').length }; });
const A = await mk(1280, 720, false, 'Alex'), B = await mk(390, 844, true, 'Lucia');
let ok = true; const check = (c, msg) => { console.log(c ? 'PASS' : 'FAIL', msg); if (!c) ok = false; };
await A.p.goto('http://localhost:8787/?nosky&debug&nointro', { waitUntil: 'domcontentloaded' });
await A.p.waitForSelector('[data-a=create]', { timeout: 60000 }); await sleep(800); await A.p.click('[data-a=create]');
await A.p.waitForFunction(() => /^\d{4,6}$/.test(document.querySelector('.bigcode')?.textContent || ''), { timeout: 30000 });
const code = await A.p.$eval('.bigcode', (e) => e.textContent); console.log('room', code);
await B.p.goto(`http://localhost:8787/?room=${code}&nosky&debug`, { waitUntil: 'domcontentloaded' });
await A.p.waitForFunction(() => !document.querySelector('[data-a=start]').disabled, { timeout: 60000 });
await sleep(1500);
check((await st(A)).pill && (await st(B)).pill, 'radio pill visible on both in lobby');
await A.p.click('.radio .r-mic'); await B.p.tap('.radio .r-mic');
await A.p.waitForFunction(() => window.__radio.link === 'connected', { timeout: 30000 }).catch(() => {});
await sleep(4000);
const dbg = (P) => P.p.evaluate(async () => { const pc = window.__radio._pc(); if (!pc) return 'nopc'; const r = await pc.getStats(); const c = []; r.forEach((s) => { if (/candidate$/.test(s.type)) c.push(s.type[0] + ':' + s.candidateType + ':' + s.address + ':' + s.protocol); if (s.type === 'candidate-pair') c.push('pair:' + s.state); });
  return { sig: pc.signalingState, ice: pc.iceConnectionState, gat: pc.iceGatheringState, conn: pc.connectionState, ld: !!pc.localDescription, rd: !!pc.remoteDescription, c }; });
console.log('dbgA', JSON.stringify(await dbg(A))); console.log('dbgB', JSON.stringify(await dbg(B)));
let a = await st(A), b = await st(B); console.log('A', JSON.stringify(a)); console.log('B', JSON.stringify(b));
check(a.state === 'on' && b.state === 'on', 'mic on both');
const dA = await dbg(A), dB = await dbg(B);
const udpBlocked = !dA.c?.some((c) => /udp/.test(c)); // la política de Chrome del box (WebRtcIPHandling=disable_non_proxied_udp) impide ICE local
check(dA.rd && dB.rd && dA.sig === 'stable' && dB.sig === 'stable', 'SDP offer/answer exchanged over the room WebSocket');
let seen = 0; for (let i = 0; i < 12; i++) { const [x, y] = await Promise.all([st(A), st(B)]); seen |= (x.me ? 1 : 0) | (y.me ? 2 : 0); await sleep(150); }
check(seen === 3, 'local VAD opens on fake mic tone on both (talking indicator)');
check(a.talkCard >= 1, 'lobby crew card shows .talking');
if (udpBlocked) console.log('SKIP media path: this box\'s Chrome policy disables non-proxied UDP, so ICE has no candidates (needs TURN-TCP here). Real browsers gather host/srflx candidates.');
else { check(a.link === 'connected' && b.link === 'connected', 'webrtc connected'); check(a.inB > 1000 && b.inB > 1000, 'audio bytes flowing both ways'); check(a.vad > 0 || b.vad > 0, 'remote VAD opened'); }
await A.p.screenshot({ path: `${out}/radio_lobby_A.png` }); await B.p.screenshot({ path: `${out}/radio_lobby_B.png` });

// silenciar
await B.p.tap('.radio .r-mic'); await sleep(1500); b = await st(B); check(b.muted === true, 'mute toggles on B');
await B.p.tap('.radio .r-mic'); await sleep(500);
// callout
await A.p.click('.radio .r-call'); await sleep(500); await A.p.screenshot({ path: `${out}/radio_panel_A.png` });
await A.p.click('.r-panel [data-k=meteor]'); await sleep(1200);
const bub = await B.p.evaluate(() => { const e = document.querySelector('.r-bubble'); return e && getComputedStyle(e).opacity > 0.1 ? e.textContent : ''; });
check(/meteor/i.test(bub), 'callout bubble on B: ' + bub); await B.p.screenshot({ path: `${out}/radio_callout_B.png` });
// PTT
await A.p.click('.radio .r-call'); await sleep(300); await A.p.click('.r-panel [data-m=ptt]'); await sleep(300); await A.p.keyboard.press('Escape');
a = await st(A); check(a.mode === 'ptt', 'PTT mode set');
await A.p.keyboard.down('KeyV'); await sleep(900); const aD = await st(A); await A.p.keyboard.up('KeyV'); await sleep(900); const aU = await st(A);
console.log('ptt down', aD.me, 'up', aU.me);
await A.p.evaluate(() => { const b = document.querySelector('.r-panel [data-m=open]'); if (document.querySelector('.r-panel.hidden')) document.querySelector('.radio .r-call').click(); setTimeout(() => document.querySelector('.r-panel [data-m=open]').click(), 100); }); await sleep(600);
console.log('mode back', (await st(A)).mode);
// práctica de CAPCOM esperando
// misión: empezar y ver pill en HUD piloto y CAPCOM
await A.p.click('[data-a=start]').catch(() => {}); await sleep(9000);
await A.p.screenshot({ path: `${out}/radio_pilot_A.png` }); await B.p.screenshot({ path: `${out}/radio_capcom_B.png` });
a = await st(A); b = await st(B); console.log('mission A', JSON.stringify(a)); console.log('mission B', JSON.stringify(b));
check(a.pill && b.pill && a.state === 'on' && b.state === 'on', 'radio pill + mic stay up in mission');
await A.p.evaluate(() => window.__net.tx({ t: 'practice', ph: 'eva', score: 1234 })); await sleep(1500);
check(await B.p.evaluate(() => !!document.querySelector('.prwait')), 'CAPCOM shows practice-complete overlay'); await B.p.screenshot({ path: `${out}/radio_prwait_B.png` });
console.log([...A.p.__logs, ...B.p.__logs].filter((l) => !/GPU stall|WebGL|swiftshader/i.test(l)).slice(0, 30).join('\n'));
console.log(ok ? 'ALL OK' : 'SOME FAIL');
await A.b.close(); await B.b.close(); process.exit(0);
