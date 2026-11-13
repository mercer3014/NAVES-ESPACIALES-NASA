// Pantallas de menú: intro, inicio, briefing, sala, unirse, bandera, ajustes, créditos, misiones/práctica
import { show } from './router.js';
import { t, lang, setLang, applyI18n } from '../core/i18n.js';
import { store, on, emit, isMobile, dbg, DEBUG } from '../core/store.js';
import { sfx, music, voice, unlock, setMusicVol, preloadSfx } from '../core/audio.js';
import { $, $$, h, toast, achieve, scanFx } from '../core/util.js';
import { renderFlag, renderPatch, COUNTRIES, PATTERNS, SHIELDS, SYMBOLS, PALETTE, randomFlag, defaultFlag, countryName, drawSymbol } from './flag.js';
import { pancho } from './pancho.js';
import { net, createRoom, joinRoom, leaveRoom, tx, partner } from '../net/room.js';
import { setWorld } from '../core/engine.js';
import { offerLook } from '../core/look.js';
import { setQualityPref } from './quality-pref.js';
import { makeLobby } from '../scenes/lobby.js';
import '../game/expeditions/text.js';
import '../game/expeditions/text-horizon.js';

let lobbyWorld = null;
export function lobbyBg() { if (!lobbyWorld) { lobbyWorld = makeLobby(); lobbyWorld.onSecret = () => { sfx('powerup'); toast(t('egg.galaxy'), 'info'); achieve('galaxy'); }; } setWorld(lobbyWorld); return lobbyWorld; }
export const getFlag = () => store.get('flag') || defaultFlag();
export const getName = () => store.get('name') || (lang() === 'es' ? 'Astronauta' : 'Astronaut');
const ui = (fn) => (e) => { sfx('click', { vol: 0.5 }); unlock(); fn(e); };
function hovers(el) { $$('.mbtn,.btn,.opt,.country,.seg button', el).forEach((b) => b.addEventListener('pointerenter', () => sfx('hover', { vol: 0.15 }))); }

// ---------------- INTRO ----------------
const SUBS = [[1, 8, 'intro.s1'], [12, 20, 'intro.s2'], [33, 42, 'intro.s3'], [46, 55, 'intro.s4'], [70, 78.5, 'intro.s5']];
let playedThisDocument = false;
export const introPlayed = () => playedThisDocument;
export function introScreen(done) {
  const slow = /(^|-)2g$/.test(navigator.connection?.effectiveType || '');
  const mobile = isMobile || slow, src = mobile ? '/video/intro_480.mp4' : '/video/intro_720.mp4';
  let cleanup = () => {};
  const el = show(`<div class="screen intro"><video muted playsinline preload="metadata" poster="/video/poster.jpg"><source src="${mobile ? src : '/video/intro_720.webm'}" type="${mobile ? 'video/mp4' : 'video/webm'}"><source src="${src}" type="video/mp4"></video>
    <div class="tl">APOLLO 11 · 1969 · NASA</div><div class="sub" aria-live="off"></div>
    <button class="btn-ghost sound" data-i="intro.sound"></button><button class="btn-ghost skip" data-i="intro.skip"></button></div>`, 'intro', () => cleanup());
  const v = $('video', el), sub = $('.sub', el), snd = $('.sound', el); let finished = false;
  music(null, { fade: 400 });
  const volume = () => { v.volume = Math.max(0, Math.min(1, store.get('vol').voice)); }; volume();
  const offVol = on('store:vol', volume);
  const finish = () => { if (finished) return; finished = true; playedThisDocument = true; cleanup(); done(); };
  const blocked = () => { if (finished) return; snd.hidden = false; snd.textContent = t('intro.play'); };
  const failed = () => { if (finished || !(v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || v.error)) return; toast(t('intro.failed'), 'info'); finish(); };
  const play = () => v.play().catch((err) => { if (err?.name === 'NotAllowedError') blocked(); else failed(); });
  const key = e => { if (['Escape','Enter','Space'].includes(e.code) && e.target.tagName !== 'BUTTON') { e.preventDefault(); finish(); } };
  const stall = setTimeout(() => { if (finished) return; if (v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || v.error) failed(); else if (v.paused || v.readyState < 2) blocked(); }, 4000);
  v.querySelectorAll('source').forEach((s) => s.addEventListener('error', () => queueMicrotask(failed)));
  cleanup = () => { clearTimeout(stall); v.pause(); v.onended = v.onerror = v.ontimeupdate = null; v.removeAttribute('src'); v.querySelectorAll('source').forEach(s => s.removeAttribute('src')); v.load(); offVol(); removeEventListener('keydown', key); };
  v.muted = true; play();
  snd.onclick = () => { unlock(); volume(); v.muted = false; v.play().then(() => { if (!finished) snd.hidden = true; }).catch(() => { v.muted = true; blocked(); }); };
  if (navigator.userActivation?.hasBeenActive) { v.muted = false; v.play().then(() => { if (!finished) snd.hidden = true; }).catch(() => { v.muted = true; play(); }); }
  $('.skip', el).onclick = ui(finish); v.onended = finish; addEventListener('keydown', key);
  v.ontimeupdate = () => { const s = SUBS.find(([a,b]) => v.currentTime >= a && v.currentTime < b); sub.textContent = s ? t(s[2]) : ''; sub.classList.toggle('on', !!s); };
  v.onerror = () => { if (!finished) { toast(t('intro.failed'), 'info'); finish(); } };
}

// ---------------- START ----------------
let idleT = null; const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'KeyL', 'KeyM']; let seqI = 0;
addEventListener('keydown', (e) => { if (e.code === SEQ[seqI]) { seqI++; if (seqI === SEQ.length) { seqI = 0; const on = !document.body.classList.contains('cardboard'); document.body.classList.toggle('cardboard', on); store.set('cardboard', on); sfx('powerup'); toast(t('egg.cardboard'), 'info'); achieve('cardboard'); } } else seqI = e.code === SEQ[0] ? 1 : 0; });
if (store.get('cardboard')) document.body.classList.add('cardboard');

export function startScreen() {
  lobbyBg(); music('title', { vol: 0.55 }); preloadSfx();
  const el = show(`<div class="screen start">
    <div class="top"><div class="brand-mini">LOS ORINALEJOS · ${t('ex.brand')}</div>
      <div class="lang" role="button" aria-label="Idioma / Language"><span data-l="es">ES</span><span data-l="en">EN</span></div></div>
    <div class="center">
      <div class="logo"><svg viewBox="0 0 640 200"><text class="l1" x="2" y="78" font-size="74" data-i="title.l1"></text><text class="l2" x="0" y="180" font-size="104" data-i="title.l2"></text></svg><canvas width="120" height="90"></canvas></div>
      <div class="tagline" data-i="title.tag"></div>
      <div class="menu">
        <button class="mbtn primary" data-a="solo"><span class="led"></span><span><span data-i="menu.solo"></span><small data-i="menu.solo.s"></small></span></button>
        <div class="row2">
          <button class="mbtn" data-a="create"><span class="led"></span><span><span data-i="menu.create"></span><small data-i="menu.create.s"></small></span></button>
          <button class="mbtn" data-a="join"><span class="led"></span><span><span data-i="menu.join"></span><small data-i="menu.join.s"></small></span></button>
        </div>
        <div class="row2">
          <button class="mbtn" data-a="flag"><span class="led"></span><span data-i="menu.flag"></span></button>
          <button class="mbtn" data-a="missions"><span class="led"></span><span data-i="menu.missions"></span></button>
        </div>
        <div class="row2">
          <button class="mbtn" data-a="settings"><span class="led"></span><span data-i="menu.settings"></span></button>
          <button class="mbtn" data-a="credits"><span class="led"></span><span data-i="menu.credits"></span></button>
        </div>
      </div>
    </div>
    <div class="foot"><span data-i="foot.ver"></span><a href="#" data-a="intro" data-i="menu.intro"></a></div></div>`, 'start', () => { cancelAnimationFrame(raf); clearTimeout(idleT); });
  const langEl = $('.lang', el); const paintLang = () => $$('span', langEl).forEach((s) => s.classList.toggle('on', s.dataset.l === lang()));
  paintLang(); langEl.onclick = ui(() => { setLang(lang() === 'es' ? 'en' : 'es'); paintLang(); scanFx(); restartLogo(); });
  function restartLogo() { $$('.logo text', el).forEach((n) => { n.style.animation = 'none'; void n.getBBox(); n.style.animation = ''; }); }
  // bandera ondeando junto al logo
  const fc = $('.logo canvas', el), fx = fc.getContext('2d'), src = renderFlag(document.createElement('canvas'), getFlag(), 120, 80); let raf;
  const wave = (ts) => { raf = requestAnimationFrame(wave); fx.clearRect(0, 0, 120, 90); fx.fillStyle = '#ccc'; fx.fillRect(0, 0, 3, 90);
    for (let i = 0; i < 60; i++) { const xx = i * 2, off = Math.sin(ts / 260 - i * 0.18) * (i / 60) * 5; fx.drawImage(src, xx, 0, 2, 80, 3 + xx, 4 + off, 2.2, 80 - (i / 60) * 4); } };
  raf = requestAnimationFrame(wave);
  hovers(el);
  el.addEventListener('click', ui((e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; e.preventDefault(); ACTIONS[a]?.(); }));
  const resetIdle = () => { clearTimeout(idleT); idleT = setTimeout(() => { if (document.body.dataset.screen === 'start') { pancho.say('pa.idle', { speak: false }); sfx('jingle_pancho', { vol: 0.4 }); } }, 180000); };
  el.addEventListener('pointermove', resetIdle); resetIdle();
  setTimeout(() => $('.mbtn.primary', el)?.focus({ preventScroll: true }), 1400);
}
const ACTIONS = {
  solo: () => briefingScreen({ mode: 'solo' }), create: () => createScreen(), join: () => joinScreen(), flag: () => flagStudio(() => startScreen()),
  missions: () => missionsScreen(), settings: () => settingsScreen(), credits: () => creditsScreen(), intro: () => introScreen(() => startScreen()),
};

// ---------------- BRIEFING (solo) ----------------
function nameAndFlagBlock() {
  return `<div style="display:flex;gap:14px;align-items:center;margin:12px 0"><canvas class="patch-prev"></canvas>
    <div style="flex:1;display:grid;gap:8px"><input class="txt" maxlength="16" data-iph="name.ph" value="${(store.get('name') || '').replace(/"/g, '')}">
    <button class="btn" data-a="editflag"><span data-i="menu.flag"></span></button></div></div>`;
}
function wireNameFlag(el, back) {
  const pc = $('.patch-prev', el), inp = $('input.txt', el); const paint = () => renderPatch(pc, getFlag(), inp.value || getName(), 192); paint();
  inp.oninput = () => { store.set('name', inp.value.trim()); paint(); };
  $('[data-a=editflag]', el).onclick = ui(() => flagStudio(back));
}
export function briefingScreen({ mode }) {
  lobbyBg();
  const diff = store.get('difficulty');
  const el = show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog">
    <h2 data-i="m1"></h2><p data-i="m1.d"></p>${nameAndFlagBlock()}
    <h3 class="chakra" style="font-size:.75rem;letter-spacing:.2em;color:var(--dim)" data-i="set.diff"></h3>
    <div class="seg diff">${['cadet', 'normal', 'veteran'].map((d) => `<button data-d="${d}" class="${d === diff ? 'on' : ''}" data-i="d.${d}"></button>`).join('')}</div><p class="diffhint" data-i="d.hint"></p>
    <div class="btns"><button class="btn go big-action" data-a="go" data-i="lobby.start"></button></div></div></div>`, 'briefing');
  wireNameFlag(el, () => briefingScreen({ mode }));
  $$('.diff button', el).forEach((b) => (b.onclick = ui(() => { store.set('difficulty', b.dataset.d); $$('.diff button', el).forEach((x) => x.classList.toggle('on', x === b)); })));
  $('.back', el).onclick = ui(startScreen);
  $('[data-a=go]', el).onclick = (e) => { offerLook('prep'); ui(async () => { const { startMission } = await import('../game/mission.js'); startMission({ mode: 'solo', role: 'pilot' }); })(e); };
  hovers(el); pancho.say('pa.hi', { ms: 5000 });
}

// ---------------- CREATE / LOBBY ----------------
export async function createScreen(role = 'pilot', mission = 'apollo') {
  lobbyBg();
  const el = show(`<div class="screen lobby"><button class="back" data-i="back"></button><div class="panel dialog" style="width:min(720px,100%)">
    <h2 data-i="lobby.title"></h2>
    <div class="lobby-fit"><div class="grid"><div class="qr"><div style="display:grid;place-items:center;height:100%" class="mono">···</div></div>
      <div><div class="phase-tag" data-i="lobby.code"></div><div class="bigcode">····</div><p style="margin:.5em 0 0;font-size:.85rem"><span data-i="lobby.scan"></span><br><span class="mono joinurl" style="color:var(--blue);font-size:.75rem;word-break:break-all"></span></p></div></div>
    <div class="lobby-rest"><label class="phase-tag" for="room-mission" data-i="ex.select"></label><select id="room-mission" class="txt" style="width:100%;min-height:44px;margin:8px 0">${['apollo','mars','horizon'].map(m=>`<option value="${m}">${t('ex.'+m)}</option>`).join('')}</select><div class="crew"></div>
    <div class="phase-tag" data-i="lobby.role"></div><div class="seg role" style="margin:6px 0"><button data-r="pilot" data-i="role.pilot"></button><button data-r="capcom" data-i="role.capcom"></button></div>
    <p class="roled" style="margin:.3em 0 0;font-size:.85rem"></p>${nameAndFlagBlock()}
    <div class="btns"><button class="btn go" data-a="start" disabled data-i="lobby.start"></button><button class="btn" data-a="bot" data-i="lobby.bot"></button></div></div></div></div></div>`, 'lobby', () => offs.forEach((f) => f()));
  const offs = [];
  wireNameFlag(el, () => lobbyScreenAgain());
  $('.back', el).onclick = ui(() => { leaveRoom(); startScreen(); });
  $('[data-a=bot]', el).onclick = ui(() => { const chosen=net.mission; leaveRoom(); if(chosen==='apollo') briefingScreen({mode:'solo'}); else import('../game/expeditions/index.js').then(m=>m.expeditionBriefing(chosen)); });
  try { if (!net.code) await createRoom(role, { name: getName(), flag: getFlag(), mission }); }
  catch { toast(t('lobby.offline'), 'info'); $('.bigcode', el).textContent = '—'; return; }
  wireLobby(el, offs);
}
function lobbyScreenAgain() { if (net.code) { createScreen(); } else startScreen(); }
function wireLobby(el, offs) {
  $('.bigcode', el).textContent = net.code;
  fetch(`/qr?code=${net.code}`).then(async (r) => { const u = r.headers.get('x-join-url'); $('.joinurl', el).textContent = u || ''; const svg = await r.text(); $('.qr', el).innerHTML = `<img alt="QR" src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}">`; dbg('joinUrl', u); });
  const sel=$('#room-mission',el); sel.value=net.mission; sel.disabled=!net.host; sel.onchange=()=>{if(net.host){net.mission=sel.value;tx({t:'selection',mission:sel.value});paintRole();}};
  const paintRole = () => { $$('.role button', el).forEach((b) => b.classList.toggle('on', b.dataset.r === net.role)); $('.roled', el).textContent = t(net.mission==='apollo'?`role.${net.role}.d`:`ex.role.${net.mission}.${net.role}`); };
  const paintCrew = () => {
    const me = net.members.find((m) => m.id === net.id), p = partner();
    const card = (m, label) => m ? `<div class="crewcard ready"><canvas data-f="${m.id}"></canvas><div><b>${(m.name || '—').replace(/</g, '')}</b><span>${label} · ${t('role.' + m.role)}${m.online ? '' : ' · ...'}</span></div></div>`
      : `<div class="crewcard empty"><canvas></canvas><div><b data-i="lobby.waiting">${t('lobby.waiting')}</b><span>${t('lobby.partner')}</span></div></div>`;
    $('.crew', el).innerHTML = card(me, t('lobby.you')) + card(p, t('lobby.partner'));
    $$('canvas[data-f]', el).forEach((c) => { const m = net.members.find((x) => x.id === c.dataset.f); renderPatch(c, m.flag || defaultFlag(), m.name, 88); });
    const startBtn = $('[data-a=start]', el); startBtn.disabled = !(p && p.online); startBtn.classList.toggle('hide', !net.host);
    if (!net.host) $('.btns', el).insertAdjacentHTML('afterbegin', $('.waithost', el) ? '' : `<p class="waithost mono" style="width:100%;text-align:center" data-i="lobby.waitHost">${t('lobby.waitHost')}</p>`);
    $$('.role button', el).forEach((b) => (b.disabled = !net.host));
  };
  paintRole(); paintCrew();
  $$('.role button', el).forEach((b) => (b.onclick = ui(() => { if (b.dataset.r !== net.role) tx({ t: 'swap' }); })));
  $('input.txt', el).addEventListener('change', () => tx({ t: 'profile', name: getName(), flag: getFlag() }));
  offs.push(on('net:roster', (ms) => { sel.value=net.mission; sel.disabled=!net.host; const before = el.__n || 1; el.__n = ms.length; if (ms.length > before) { sfx('ok'); scanFx(); } paintRole(); paintCrew(); }));
  offs.push(on('net:role', paintRole));
  offs.push(on('net:start', async (m) => { const { startCoop } = await import('../game/mission.js'); startCoop(m); }));
  $('[data-a=start]', el).onclick = (e) => { const from = (DEBUG && new URLSearchParams(location.search).get('from')) || 'prep'; offerLook(from); ui(async () => { $('[data-a=start]', el).disabled = true; const m = { t: 'start', mission: net.mission, seed: (Math.random() * 1e9) | 0, from, diff: store.get('difficulty') }; tx(m); const { startCoop } = await import('../game/mission.js'); startCoop(m); })(e); };
}

// ---------------- JOIN ----------------
export function joinScreen(prefill = '') {
  lobbyBg();
  const el = show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog" style="text-align:center">
    <h2 data-i="join.title"></h2><p data-i="join.hint"></p>
    <input class="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" value="${prefill}" aria-label="code">
    ${nameAndFlagBlock()}<p class="err" style="color:var(--red);min-height:1.4em;margin:.2em 0"></p>
    <button class="btn go big-action" data-a="join" data-i="join.btn"></button></div></div>`, 'join');
  wireNameFlag(el, () => joinScreen($('input.code', el)?.value || prefill));
  const inp = $('input.code', el); inp.oninput = () => (inp.value = inp.value.replace(/\D/g, '').slice(0, 6));
  $('.back', el).onclick = ui(startScreen);
  const go = async () => {
    if (inp.value.length < 4) { sfx('error'); inp.focus(); return; }
    try { const joined = await joinRoom(inp.value, { name: getName(), flag: getFlag() }); sfx('ok'); if (joined.session) { const { startCoop } = await import('../game/mission.js'); startCoop(joined.session); } else joinedLobby(); }
    catch (e) { sfx('error'); $('.err', el).textContent = e.message === 'NO_ROOM' ? t('join.noroom') : e.message === 'FULL' ? t('join.full') : t('lobby.offline'); }
  };
  $('[data-a=join]', el).onclick = ui(go); inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
  if (prefill.length >= 4) setTimeout(go, 300); else setTimeout(() => inp.focus(), 300);
}
function joinedLobby() { createScreen(); }

// ---------------- FLAG STUDIO ----------------
export function flagStudio(back) {
  lobbyBg(); let f = { ...getFlag(), colors: [...getFlag().colors] };
  const el = show(`<div class="screen studio"><button class="back" data-i="back"></button>
    <div class="preview"><canvas class="flag"></canvas><div style="display:flex;align-items:center;gap:12px"><canvas class="patch-prev"></canvas><span class="chakra" style="color:var(--dim);font-size:.85rem" data-i="flag.patch"></span></div></div>
    <div class="panel tools"><div class="seg mode"><button data-m="country" data-i="flag.country"></button><button data-m="custom" data-i="flag.custom"></button></div>
      <div class="pane-country"><input class="txt search" data-iph="flag.search" style="margin-bottom:8px"><div class="countries"></div></div>
      <div class="pane-custom">
        <div><h3 data-i="flag.pattern"></h3><div class="opts pat"></div></div>
        <div><h3 data-i="flag.colors"></h3><div class="cols" style="display:grid;gap:6px"></div></div>
        <div><h3 data-i="flag.shield"></h3><div class="opts shi"></div></div>
        <div><h3 data-i="flag.symbol"></h3><div class="opts sym"></div></div>
        <div><h3 data-i="flag.text"></h3><input class="txt motto" maxlength="12"></div>
        <button class="btn" data-a="rand" data-i="flag.random"></button>
      </div>
      <button class="btn go" data-a="save" data-i="flag.save"></button></div></div>`, 'flag');
  const big = $('canvas.flag', el), patch = $('.patch-prev', el);
  const paint = () => { renderFlag(big, f, 600, 400); renderPatch(patch, f, getName(), 192); $$('.mode button', el).forEach((b) => b.classList.toggle('on', b.dataset.m === f.mode)); $('.pane-country', el).classList.toggle('hide', f.mode !== 'country'); $('.pane-custom', el).classList.toggle('hide', f.mode !== 'custom'); sync(); };
  const mini = (opts) => { const c = document.createElement('canvas'); renderFlag(c, { ...f, ...opts }, 60, 40); return c; };
  // países
  const list = $('.countries', el);
  const fillCountries = (q = '') => { list.innerHTML = ''; COUNTRIES.filter((c) => (c[1] + ' ' + c[2]).toLowerCase().includes(q.toLowerCase())).forEach(([code]) => {
    const b = h(`<button class="country" data-c="${code}"></button>`); const c = document.createElement('canvas'); renderFlag(c, { mode: 'country', code }, 90, 60); b.append(c, document.createTextNode(countryName(code, lang()))); b.onclick = () => { sfx('switch', { vol: 0.4 }); f.mode = 'country'; f.code = code; paint(); }; list.append(b); }); sync(); };
  $('.search', el).oninput = (e) => fillCountries(e.target.value);
  const sync = () => {
    $$('.country', el).forEach((b) => b.classList.toggle('on', f.mode === 'country' && b.dataset.c === f.code));
    $$('.pat .opt', el).forEach((b) => b.classList.toggle('on', b.dataset.v === f.pattern)); $$('.shi .opt', el).forEach((b) => b.classList.toggle('on', b.dataset.v === f.shield)); $$('.sym .opt', el).forEach((b) => b.classList.toggle('on', b.dataset.v === f.symbol));
    $$('.cols .swatch', el).forEach((s) => s.classList.toggle('on', f.colors[s.dataset.i] === s.dataset.c)); $('.motto', el).value = f.text || '';
  };
  const buildCustom = () => {
    const pat = $('.pat', el); pat.innerHTML = ''; PATTERNS.forEach((p) => { const b = h(`<button class="opt" data-v="${p}" aria-label="${p}"></button>`); b.append(mini({ mode: 'custom', pattern: p, shield: 'none', symbol: 'none', text: '' })); b.onclick = () => { sfx('switch', { vol: 0.4 }); f.mode = 'custom'; f.pattern = p; paint(); }; pat.append(b); });
    const shi = $('.shi', el); shi.innerHTML = ''; SHIELDS.forEach((s) => { const b = h(`<button class="opt" data-v="${s}" aria-label="${s}"></button>`); b.append(mini({ mode: 'custom', pattern: 'solid', colors: ['#1a2234', '#fff', '#888'], shield: s, symbol: 'none', text: '' })); b.onclick = () => { sfx('switch', { vol: 0.4 }); f.mode = 'custom'; f.shield = s; paint(); }; shi.append(b); });
    const sym = $('.sym', el); sym.innerHTML = ''; SYMBOLS.forEach((s) => { const b = h(`<button class="opt" data-v="${s}" aria-label="${s}"></button>`); const c = document.createElement('canvas'); c.width = c.height = 40; if (s !== 'none') drawSymbol(c.getContext('2d'), s, 20, 20, 15, '#fff'); else { const x = c.getContext('2d'); x.strokeStyle = '#fff6'; x.beginPath(); x.moveTo(8, 32); x.lineTo(32, 8); x.stroke(); } b.append(c); b.onclick = () => { sfx('switch', { vol: 0.4 }); f.mode = 'custom'; f.symbol = s; paint(); }; sym.append(b); });
    const cols = $('.cols', el); cols.innerHTML = ''; [0, 1, 2].forEach((i) => { const row = h('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>'); PALETTE.forEach((c) => { const s = h(`<button class="swatch" data-i="${i}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`); s.onclick = () => { sfx('toggle', { vol: 0.4 }); f.mode = 'custom'; f.colors[i] = c; paint(); buildCustom(); }; row.append(s); }); cols.append(row); });
    sync();
  };
  $('.motto', el).oninput = (e) => { f.mode = 'custom'; f.text = e.target.value.slice(0, 12); paint(); };
  $$('.mode button', el).forEach((b) => (b.onclick = ui(() => { f.mode = b.dataset.m; paint(); })));
  $('[data-a=rand]', el).onclick = ui(() => { f = randomFlag(); buildCustom(); paint(); });
  $('[data-a=save]', el).onclick = ui(() => { store.set('flag', f); sfx('ok'); scanFx(); emit('flag', f); if (net.code) tx({ t: 'profile', name: getName(), flag: f }); back(); });
  $('.back', el).onclick = ui(back);
  fillCountries(); buildCustom(); paint(); hovers(el);
}

// ---------------- SETTINGS ----------------
export function settingsScreen() {
  lobbyBg(); const v = store.get('vol');
  const sl = (k) => `<label style="display:grid;grid-template-columns:110px 1fr;align-items:center;gap:10px;margin:8px 0"><span class="chakra" data-i="set.${k}"></span><input type="range" min="0" max="1" step="0.05" value="${v[k]}" data-k="${k}"></label>`;
  const el = show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog"><h2 data-i="set.title"></h2>
    ${sl('music')}${sl('sfx')}${sl('voice')}
    <h3 class="phase-tag" data-i="set.comms"></h3><div class="seg comms">${['min', 'normal', 'off'].map((c) => `<button data-c="${c}" class="${(store.get('comms') || 'min') === c ? 'on' : ''}" data-i="set.comms.${c}"></button>`).join('')}</div>
    <h3 class="phase-tag" data-i="set.quality"></h3><div class="seg q">${['auto', 'low', 'high'].map((q) => `<button data-q="${q}" class="${store.get('quality') === q ? 'on' : ''}" data-i="set.q.${q}"></button>`).join('')}</div><p style="font-size:.8rem" data-i="set.reload"></p>
    <h3 class="phase-tag" data-i="set.diff"></h3><div class="seg diff">${['cadet', 'normal', 'veteran'].map((d) => `<button data-d="${d}" class="${store.get('difficulty') === d ? 'on' : ''}" data-i="d.${d}"></button>`).join('')}</div>
    <h3 class="phase-tag" style="margin-top:16px" data-i="set.ach"></h3><div class="ach" style="display:flex;flex-wrap:wrap;gap:6px"></div></div></div>`, 'settings');
  $$('input[type=range]', el).forEach((r) => (r.oninput = () => { const vv = store.get('vol'); vv[r.dataset.k] = +r.value; store.set('vol', vv); setMusicVol(); }));
  $$('input[type=range]', el).forEach((r) => (r.onchange = () => sfx('tick')));
  $$('.comms button', el).forEach((b) => (b.onclick = ui(() => { store.set('comms', b.dataset.c); store.set('tts', b.dataset.c !== 'off'); $$('.comms button', el).forEach((x) => x.classList.toggle('on', x === b)); })));
  $$('.q button', el).forEach((b) => (b.onclick = ui(() => { setQualityPref(b.dataset.q); $$('.q button', el).forEach((x) => x.classList.toggle('on', x === b)); })));
  $$('.diff button', el).forEach((b) => (b.onclick = ui(() => { store.set('difficulty', b.dataset.d); $$('.diff button', el).forEach((x) => x.classList.toggle('on', x === b)); })));
  const A = store.get('achievements'); $('.ach', el).innerHTML = ['first', 'nofault', 'soft', 'fuel', 'noassist', 'earthrise', 'sock', 'golf', 'wrinkle', 'galaxy', 'cardboard', 'coop', 'mission1'].map((k) => `<span class="chip" style="${A[k] ? 'border-color:var(--amber)' : 'opacity:.4'}">${t('ach.' + k)}</span>`).join('');
  $('.back', el).onclick = ui(startScreen);
}

// ---------------- CREDITS ----------------
export function creditsScreen() {
  lobbyBg();
  const es = lang() === 'es';
  const el = show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog" style="width:min(640px,100%)"><h2 data-i="cred.title"></h2>
    <p><b style="color:var(--ink)">Los Orinalejos</b> — ${es ? 'diseño, código y arte original CC0 (A7L, Eagle, Saturn V, LC-39A, Columbia, EASEP y sus animaciones)' : 'design, code and original CC0 art (A7L, Eagle, Saturn V, LC-39A, Columbia, EASEP and their animations)'}.</p>
    <p><b style="color:var(--ink)">NASA</b> — ${es ? 'video y audio históricos de Apolo 8, 11 y 13; fotografías; modelos 3D (NASA-3D-Resources); texturas de la Tierra y la Luna. Dominio público. NASA no respalda este proyecto.' : 'historical Apollo 8, 11 and 13 video and audio; photographs; 3D models (NASA-3D-Resources); Earth and Moon textures. Public domain. NASA does not endorse this project.'}</p>
    <p>${t('ex.art.mars')}</p><p>${t('ho.art')}</p>
    <p><b style="color:var(--ink)">Solar System Scope</b> — Planet textures © Solar System Scope (solarsystemscope.com), CC BY 4.0.</p>
    <p><b style="color:var(--ink)">${es ? 'Música' : 'Music'}</b> — SRG774 (Dark Sci-Fi Audio Pack), TinyWorlds (Space Graveyard), cinameng / James Gargette (Persistence), Umplix (Floating in Space) — CC0 · OpenGameArt.</p>
    <p><b style="color:var(--ink)">${es ? 'Efectos de sonido' : 'Sound effects'}</b> — Kenney (kenney.nl), CC0.</p>
    <p><b style="color:var(--ink)">${es ? 'Tipografías' : 'Fonts'}</b> — Orbitron, Chakra Petch, Share Tech Mono, Exo 2, Audiowide — SIL Open Font License 1.1.</p>
    <p><b style="color:var(--ink)">${es ? 'Tecnología' : 'Tech'}</b> — three.js, Vite, Howler.js, ws, qrcode (MIT).</p>
    <p style="font-size:.8rem">${es ? 'Pancho y todos los personajes y easter eggs son originales.' : 'Pancho and all characters and easter eggs are original.'}</p>
    <p><a href="/licenses.txt" target="_blank" rel="noopener">${es ? 'Fuentes y licencias completas' : 'Full sources and licenses'}</a></p><p style="font-size:.8rem;font-style:italic">"We choose to go to the Moon…" — J. F. Kennedy, 1962</p></div></div>`, 'credits');
  $('.back', el).onclick = ui(startScreen);
}

// ---------------- MISSIONS / PRACTICE ----------------
export function missionsScreen() {
  lobbyBg();
  const phases = ['prep', 'launch', 'cruise', 'descent', 'eva'];
  const el = show(`<div class="screen"><button class="back" data-i="back"></button><div class="panel dialog" style="width:min(680px,100%)"><h2 data-i="missions.title"></h2>
    <div style="display:grid;gap:10px">
      <button class="mbtn primary" data-a="m1"><span class="led"></span><span><span data-i="m1"></span><small data-i="m1.d"></small></span></button>
      <button class="mbtn" data-exp="mars"><span class="led"></span><span><span data-i="m2"></span><small data-i="ex.mars"></small></span></button>
      <button class="mbtn" data-exp="horizon"><span class="led"></span><span><span data-i="m3"></span><small data-i="ex.horizon"></small></span></button>
    </div>
    <h3 class="phase-tag" style="margin-top:18px" data-i="prac.title"></h3><p style="margin:.2em 0 .6em;font-size:.85rem" data-i="prac.d"></p>
    <div class="prac">${phases.map((p, i) => `<button class="btn" data-p="${p}">${i + 1}. <span data-i="ph.${p}"></span></button>`).join('')}</div></div></div>`, 'missions');
  $('.back', el).onclick = ui(startScreen);
  $('[data-a=m1]', el).onclick = ui(() => briefingScreen({ mode: 'solo' }));
  $$('[data-exp]',el).forEach(b=>b.onclick=ui(async()=>{const m=await import('../game/expeditions/index.js');m.expeditionBriefing(b.dataset.exp);}));
  $$('[data-p]', el).forEach((b) => (b.onclick = (e) => { offerLook(b.dataset.p); ui(async () => { const { startMission } = await import('../game/mission.js'); startMission({ mode: 'solo', role: 'pilot', practice: b.dataset.p }); })(e); }));
  hovers(el);
}
