// FASE 1 · Preparación: panel de cabina, checklist, 3 fallas, DSKY, ronda GO/NO-GO
import { THREE } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, $$, h, toast, achieve, clamp } from '../../core/util.js';
import { sfx, music, voice } from '../../core/audio.js';
import { on } from '../../core/store.js';
import { makePad, H, BASE_Y } from '../../scenes/pad.js';
import { makeCabin, SW_MAP } from '../../scenes/cabin.js';
import { renderer } from '../../core/engine.js';
import { DEBUG } from '../../core/store.js';
import { objectiveCardHtml } from '../../ui/flight-hud.js';
extend({
  'prep.alarm': ['ALARMA MAESTRA', 'MASTER ALARM'], 'prep.askcc': ['¡Pregunta a Control de Misión qué hacer!', 'Ask Mission Control what to do!'],
  'prep.fixed': ['Falla resuelta', 'Fault cleared'], 'prep.wrong': ['Fuera de orden — sigue la lista', 'Out of order — follow the checklist'],
  'prep.poll': ['Toca cada estación para pedir su GO', 'Tap each station to poll for GO'], 'prep.pollcc': ['Control de Misión está haciendo la ronda…', 'Mission Control is running the poll…'],
  'prep.allgo': ['¡Todas las estaciones GO para lanzamiento!', 'All stations GO for launch!'], 'prep.purge': ['PURGA', 'PURGE'], 'prep.lamps': ['Lámparas', 'Lamps'],
  'prep.fc': ['CC', 'FC'], 'prep.cabin': ['Presión cabina', 'Cabin press'], 'prep.bus': ['BUS', 'BUS'], 'prep.mode': ['Modo', 'Mode'],
});
const GAUGE = (lab) => `<div class="gauge"><svg viewBox="0 0 84 50"><path d="M8 44 A34 34 0 0 1 76 44" fill="none" stroke="#333" stroke-width="7"/><path d="M8 44 A34 34 0 0 1 24 16" fill="none" stroke="#fc3d21" stroke-width="7"/><path d="M60 16 A34 34 0 0 1 76 44" fill="none" stroke="#3ddc84" stroke-width="7"/><line x1="42" y1="44" x2="42" y2="14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" class="needle" style="transform-origin:42px 44px;transition:transform .5s cubic-bezier(.3,1.6,.5,1)"/><circle cx="42" cy="44" r="4" fill="#ddd"/></svg><div class="lab">${lab}</div></div>`;
const SW = (id, lab, guard) => `<div class="sw" data-sw="${id}">${guard ? '<div class="guard"></div>' : ''}<div class="body"><i></i></div><div class="lab">${lab}</div><div class="st">OFF</div></div>`;
const STEPS = [
  { k: 'cl.bat', sw: ['batA', 'batB'] }, { k: 'cl.fc', sw: ['fc1', 'fc2', 'fc3'] }, { k: 'cl.o2', sw: ['o2'] }, { k: 'cl.gnc', sw: ['gnc'] },
  { k: 'cl.abort', sw: ['abort'] }, { k: 'cl.sband', sw: ['sband'] }, { k: 'cl.dsky', dsky: true }, { k: 'cl.gonogo', poll: true },
];
const STATIONS = ['booster', 'retro', 'fido', 'guidance', 'eecom', 'surgeon', 'network'];

export default async function prep(ctx) {
  // Cabina 3D del artista (cabin-panels.glb) como mundo de la fase; si no carga, vista orbital de la plataforma.
  const cab = makeCabin(); ctx.world(cab); let cabOk = true;
  cab.ready.catch((e) => { console.warn('cabin-panels.glb no disponible', e); cabOk = false; const W = makePad(); ctx.world(W); const cam = W.camera; W.setThrust(0);
    let ang = 0.6; ctx.loop((dt) => { ang += dt * 0.03; cam.position.set(Math.sin(ang) * 230, BASE_Y + 32 + Math.sin(ang * 0.7) * 10, Math.cos(ang) * 230); cam.lookAt(0, BASE_Y + 52, 0); }); });
  if (DEBUG) window.__prepDbg = { cab };
  music('ambient', { vol: 0.45 });
  const coop = ctx.cc.coop, hints = ctx.diffName !== 'veteran';
  const el = ctx.hud(`${objectiveCardHtml({ kicker: `${t('ph.n')} 01 · ${t('ph.prep')}`, titleHtml: `<div class="phase-title">${t('prep.title')}</div>` })}
    <div class="cockpit"><div class="cpanel">
      <div class="cgroup checklist panel"><h3>${t('prep.cl')}</h3><ol>${STEPS.map((s, i) => `<li data-step="${i}">${t(s.k)}</li>`).join('')}</ol></div>
      <div class="cgroup"><h4>${t('prep.power')}</h4><div class="sw-row">${SW('batA', 'BAT A')}${SW('batB', 'BAT B')}${SW('batC', 'BAT C')}</div><div class="sw-row" style="margin-top:8px">${GAUGE(t('prep.bus') + ' A')}${GAUGE(t('prep.bus') + ' B')}</div></div>
      <div class="cgroup"><h4>${t('prep.fuel')}</h4><div class="sw-row">${SW('fc1', t('prep.fc') + ' 1')}${SW('fc2', t('prep.fc') + ' 2')}${SW('fc3', t('prep.fc') + ' 3')}</div><div class="sw-row" style="margin-top:8px;align-items:center">${GAUGE(t('prep.fc') + ' 2 PSI')}<button class="btn purge" style="padding:.6em 1em">${t('prep.purge')}</button></div></div>
      <div class="cgroup"><h4>${t('prep.env')} · ${t('prep.comm')}</h4><div class="sw-row">${SW('o2', 'O₂ FAN')}${SW('sband', 'S-BAND')}</div><div class="sw-row" style="margin-top:8px;align-items:center">${GAUGE(t('prep.cabin'))}<div><div class="phase-tag" style="font-size:.55rem">${t('prep.lamps')}</div><div class="lamps" style="display:grid;grid-template-columns:repeat(3,16px);gap:5px;margin-top:4px">${[0, 1, 2, 3, 4, 5].map((i) => `<span class="led-ind" data-lamp="${i}"></span>`).join('')}</div></div></div></div>
      <div class="cgroup"><h4>${t('prep.gnc')}</h4><div class="sw-row">${SW('gnc', 'PGNS')}${SW('abort', 'ABORT', true)}</div><div class="sw-row" style="margin-top:8px"><span class="barber" data-bp="1"></span><span class="barber" data-bp="2"></span><span class="barber" data-bp="3"></span></div></div>
      <div class="cgroup"><h4>DSKY</h4><div class="dsky"><div class="lamps"><span>UPLINK</span><span>NO ATT</span><span>STBY</span><span>KEY REL</span><span>OPR ERR</span><span class="w">PROG</span><span>TEMP</span><span>GIMBAL</span></div>
        <div class="disp"><small>PROG</small><span class="d-prog">00</span><small>VERB</small><span class="d-verb">--</span><small>NOUN</small><span class="d-noun">--</span></div>
        <div class="keys">${['VERB', 'NOUN', '7', '8', '9', 'CLR', '0', '4', '5', '6', 'RSET', 'ENTR', '1', '2', '3'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div></div></div>
    </div></div>
    <div class="alarmbox"></div>`);
  const S = {}; $$('.sw', el).forEach((s) => (S[s.dataset.sw] = s));
  const needles = $$('.needle', el); const NDL = ['needle-volt-a', 'needle-volt-b', null, 'needle-cabin-press']; const setG = (i, v) => { needles[i].style.transform = `rotate(${(clamp(v, 0, 1) - 0.5) * 160}deg)`; if (NDL[i]) cab.setNeedle(NDL[i], i === 3 ? v * 0.45 : v * 0.9); };
  const gv = [0.05, 0.05, 0.05, 0.5]; gv.forEach((v, i) => setG(i, v));
  let step = 0, mistakes = 0, faultsFixed = 0; const t0 = ctx.time; const faults = {}; let alarmOn = false;
  const isOn = (id) => S[id].classList.contains('on');
  const setSw = (id, v) => { cab.setSwitch(id, v); S[id].classList.toggle('on', v); $('.st', S[id]).textContent = v ? 'ON' : 'OFF'; };
  const paint = () => {
    $$('li[data-step]', el).forEach((li, i) => { li.className = i < step ? 'done' : i === step ? 'cur' : ''; });
    $$('.sw', el).forEach((s) => s.classList.remove('hint'));
    const st = STEPS[step]; if (hints && st?.sw) st.sw.forEach((id) => !isOn(id) && S[id].classList.add('hint'));
    const li = $('li.cur', el); if (li) li.parentNode.parentNode.scrollTop = li.offsetTop - 40;
    const tgt = st?.sw ? S[st.sw[0]] : st?.dsky ? $('.dsky', el) : null; if (tgt && innerWidth < 821) tgt.closest('.cgroup').scrollIntoView({ block: 'center', behavior: 'smooth' });
    ctx.cc.snap({ step, n: STEPS.length, faults: Object.keys(faults).filter((k) => !faults[k].fixed), mistakes }, true);
  };
  const alarm = (on) => { alarmOn = on; cab.alarm(on); $('.alarmbox', el).innerHTML = on ? '<div class="alarm"></div>' : ''; };
  const raise = (k) => {
    if (faults[k]) return; faults[k] = { at: ctx.time, fixed: false }; alarm(true); sfx('error'); sfx('computer', { vol: 0.6 });
    ctx.banner(t('prep.alarm'), coop && ctx.cc.remote() ? t('prep.askcc') : t('fault.' + k), 3200, '');
    if (coop && ctx.cc.remote()) ctx.cc.log('fault.' + k, null, 'fault'); else ctx.say('fault.' + k, { ms: 7000 });
    if (k === 'fc2') { gv[2] = 0.08; setG(2, 0.08); S.fc2.classList.add('flash'); cab.talkback(2, 'barber'); }
    if (k === 'busb') { gv[1] = 0.18; setG(1, 0.18); }
    if (k === 'lamp') { $$('[data-lamp]', el).forEach((l, i) => (l.className = 'led-ind ' + (i === 4 ? '' : 'g'))); }
    paint(); const g = { fc2: S.fc2, busb: S.batC, lamp: $('[data-lamp="4"]', el) }[k]; if (innerWidth < 821) g.closest('.cgroup').scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const fix = (k) => {
    const f = faults[k]; if (!f || f.fixed) return; f.fixed = true; faultsFixed++; f.dt = ctx.time - f.at; sfx('ok'); toast(t('prep.fixed'), 'info'); ctx.cc.log('prep.fixed', null, 'ok');
    if (!Object.values(faults).some((x) => !x.fixed)) alarm(false); S.fc2.classList.remove('flash'); paint();
  };
  // interruptores
  $$('.sw', el).forEach((s) => s.addEventListener('click', () => {
    const id = s.dataset.sw;
    if (s.querySelector('.guard') && !s.classList.contains('guard-open')) { s.classList.add('guard-open'); cab.openGuard(id); sfx('open', { vol: 0.5 }); return; }
    if (id === 'batC') { setSw(id, !isOn(id)); sfx('switch'); if (isOn(id) && faults.busb) { gv[1] = 0.78; setG(1, 0.78); fix('busb'); } return; }
    const st = STEPS[step]; const belongs = st?.sw?.includes(id);
    if (!belongs) { // fuera de orden: si es de un paso ya hecho y se apaga, o futuro → error
      mistakes++; sfx('error'); s.classList.add('flash'); setTimeout(() => s.classList.remove('flash'), 1500); toast(t('prep.wrong'), 'info'); return;
    }
    setSw(id, !isOn(id)); sfx('switch'); navigator.vibrate?.(10);
    s.classList.toggle('hint', hints && !isOn(id));
    if (id === 'batA' || id === 'batB') { const i = id === 'batA' ? 0 : 1; gv[i] = isOn(id) ? 0.78 : 0.05; setG(i, gv[i]); }
    if (id.startsWith('fc')) { if (id === 'fc2') { gv[2] = isOn(id) ? 0.75 : 0.05; setG(2, gv[2]); } }
    if (id === 'o2') { gv[3] = 0.72; setG(3, 0.72); }
    if (id === 'gnc') $$('.barber', el).forEach((b, i) => setTimeout(() => { b.className = 'barber on'; setTimeout(() => (b.className = 'barber ok'), 700); }, i * 250));
    if (st.sw.every(isOn)) advance();
  }));
  $('.purge', el).onclick = () => { cab.openGuard('switch-04'); cab.setSwitch('switch-04', true); setTimeout(() => cab.setSwitch('switch-04', false), 3000); sfx('thruster', { vol: 0.5 }); if (faults.fc2) { gv[2] = 0.75; setG(2, 0.75); fix('fc2'); cab.talkback(2, isOn('fc2') ? 'green' : 'gray'); } else { mistakes++; sfx('error'); } };
  let lampTaps = 0; $('[data-lamp="4"]', el).onclick = () => { if (!faults.lamp || faults.lamp.fixed) return; sfx('tick'); if (++lampTaps >= 3) { $('[data-lamp="4"]', el).className = 'led-ind g'; fix('lamp'); } };
  // DSKY: VERB 37 NOUN 01 ENTR
  let dbuf = '', dmode = null, verb = '--', noun = '--';
  const dpaint = () => { $('.d-verb', el).textContent = verb; $('.d-noun', el).textContent = noun; };
  $$('.dsky .keys button', el).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k; cab.press(/\d/.test(k) ? k : k.toLowerCase()); sfx('tick', { vol: 0.6 });
    if (k === 'VERB' || k === 'NOUN') { dmode = k; dbuf = ''; if (k === 'VERB') verb = '__'; else noun = '__'; }
    else if (/\d/.test(k) && dmode) { dbuf = (dbuf + k).slice(-2); if (dmode === 'VERB') verb = dbuf.padEnd(2, '_'); else noun = dbuf.padEnd(2, '_'); }
    else if (k === 'CLR') { verb = noun = '--'; dmode = null; }
    else if (k === 'ENTR') {
      if (STEPS[step]?.dsky && verb === '37' && noun === '01') { $('.d-prog', el).textContent = '01'; sfx('ok'); advance(); }
      else { mistakes++; sfx('error'); $$('.dsky .lamps span')[4].classList.add('on'); setTimeout(() => $$('.dsky .lamps span')[4]?.classList.remove('on'), 1600); }
    } else if (k === 'RSET') $$('.dsky .lamps span', el).forEach((l) => l.classList.remove('on'));
    dpaint();
  }));
  // clic/toque directo en la cabina 3D: el pivote tocado acciona el control HTML equivalente (misma lógica y orden)
  { const REV = Object.fromEntries(Object.entries(SW_MAP).map(([a, b]) => [b, a])); const cv = renderer.domElement;
    const onDown = (e) => { if (!cabOk) return; const n = cab.pick(e.clientX, e.clientY); if (!n) return;
      if (n.startsWith('dsky-key-')) { const k = n.slice(9).toUpperCase(); const b = $(`.dsky .keys button[data-k="${k}"]`, el); b?.click(); return; }
      const sw = n.startsWith('guard-') ? cab.N[n]?.userData.switch : n; if (sw === 'switch-04') { $('.purge', el).click(); return; } const id = REV[sw]; if (id && S[id]) S[id].click(); };
    const onMove = (e) => cab.look(-(e.clientX / innerWidth - 0.5) * 0.35, -(e.clientY / innerHeight - 0.5) * 0.2);
    cv.addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove);
    ctx.onCleanup(() => { cv.removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); cab.dispose(); }); }
  ctx.say('pa.prep', { ms: 5000 }); ctx.cc.log('pa.prep');
  // calendario de fallas: tras ciertos pasos
  const plan = { 1: 'busb', 2: 'fc2', 6: 'lamp' };
  let resolveDone; const done = new Promise((r) => (resolveDone = r));
  function advance() {
    step++; sfx('beep', { vol: 0.4 }); paint();
    const fk = plan[step]; if (fk) setTimeout(() => !ctx.dead && raise(fk), 900 + ctx.rand() * 1200);
    if (STEPS[step]?.poll) runPoll();
  }
  // ronda GO/NO-GO
  async function runPoll() {
    if (Object.values(faults).some((f) => !f.fixed)) { await ctx.until(() => !Object.values(faults).some((f) => !f.fixed)); }
    await ctx.wait(0.6);
    const ov = h(`<div class="screen" style="position:absolute;inset:0;background:#03050caa;z-index:3"><div class="panel dialog" style="text-align:center;width:min(560px,100%)"><h2>${t('gonogo.title')}</h2><p class="pp">${coop && ctx.cc.remote() ? t('prep.pollcc') : t('prep.poll')}</p>
      <div class="gonogo" style="margin:0 auto">${STATIONS.map((s) => `<div class="station" data-st="${s}"><span class="led-ind"></span>${t('st.' + s)}</div>`).join('')}</div></div></div>`);
    $('.hud', el).append(ov); const go = new Set();
    const setGo = (s) => { if (go.has(s)) return; go.add(s); const n = $(`[data-st="${s}"]`, ov); n.classList.add('go'); $('.led-ind', n).className = 'led-ind g'; sfx('ok', { vol: 0.5, rate: 1 + go.size * 0.05 }); ctx.cc.snap({ step, poll: [...go] }, true); };
    if (coop && ctx.cc.remote()) {
      const off = on('net:ev', (m) => m.k === 'poll' && setGo(m.v)); ctx.onCleanup(off);
      await ctx.cc.ask('gonogo', { stations: STATIONS }, async () => { for (const s of STATIONS) { if (!go.has(s)) { await ctx.wait(0.4); setGo(s); } } return true; });
      for (const s of STATIONS) setGo(s);
    } else {
      $$('.station', ov).forEach((n) => (n.onclick = () => { sfx('beep', { vol: 0.3 }); setTimeout(() => setGo(n.dataset.st), 250 + Math.random() * 350); }));
      await ctx.until(() => go.size === STATIONS.length);
    }
    await ctx.wait(0.5); ctx.banner(t('prep.allgo'), '', 2400); sfx('powerup'); ctx.say('pa.go', { ms: 2500 }); step++; paint(); await ctx.wait(2.2); ov.remove(); resolveDone();
  }
  paint(); dpaint();
  // pistas del bot si el jugador se atasca con una falla
  ctx.loop(() => { for (const [k, f] of Object.entries(faults)) if (!f.fixed && !f.nag && ctx.time - f.at > 12) { f.nag = true; ctx.say('fault.' + k, { ms: 6000 }); } });
  await done;
  const time = ctx.time - t0; const fixT = Object.values(faults).reduce((a, f) => a + (f.dt || 20), 0);
  const score = Math.round(clamp(100 - mistakes * 6 - Math.max(0, time - 70) * 0.4 - Math.max(0, fixT - 15) * 0.8, 10, 100));
  if (mistakes === 0) achieve('nofault');
  ctx.banner(t('prep.countdown'), '', 1500); await ctx.wait(1.2);
  return { score, stats: { time: Math.round(time), mistakes, faults: faultsFixed } };
}
