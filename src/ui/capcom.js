// Consola de CONTROL DE MISIÓN (jugador 2): telemetría en vivo, gráfica, eventos, avisos y respuestas a pedidos del piloto
import { show } from './router.js';
import { t, extend } from '../core/i18n.js';
import { on, store, shared, dbg } from '../core/store.js';
import { $, $$, h, toast, mmss, clamp } from '../core/util.js';
import { sfx, music, voice } from '../core/audio.js';
import { setPhaseBed } from '../audio/runtime.js';
import { tx, net, partner, peerOnline } from '../net/room.js';
import { lobbyBg } from './screens.js';
import { quitMission } from '../game/mission.js';
extend({
  'cx.wait': ['Esperando al piloto…', 'Waiting for the pilot…'], 'cx.prDone': ['Práctica terminada · {ph}', 'Practice complete · {ph}'], 'cx.prScore': ['{s} puntos', '{s} points'], 'cx.prWait': ['El piloto está eligiendo: reintentar, siguiente fase o menú…', 'The pilot is choosing: retry, next phase or menu…'], 'cx.link': ['Enlace', 'Link'], 'cx.req': ['Pedido del piloto', 'Pilot request'], 'cx.none': ['Sin pedidos. Vigila la telemetría y envía avisos.', 'No requests. Watch telemetry and send pings.'],
  'cx.poll': ['Ronda GO/NO-GO: toca cada consola', 'GO/NO-GO poll: tap each console'], 'cx.stage': ['¡Separa la etapa ahora!', 'Stage now!'], 'cx.1202': ['ALARMA 1202 · ¿GO o ABORT?', '1202 ALARM · GO or ABORT?'],
  'cx.1202h': ['Ejecutivo sobrecargado: la computadora reinicia y sigue. Es seguro.', 'Executive overflow: the computer restarts and keeps going. It\'s safe.'], 'cx.abort': ['ABORTAR', 'ABORT'],
  'cx.photo': ['Encuadra la cámara TV: la bandera y el astronauta', 'Frame the TV camera: the flag and the astronaut'], 'cx.shoot': ['📸 DISPARAR', '📸 SHOOT'], 'cx.left': ['◀', '◀'], 'cx.right': ['▶', '▶'], 'cx.up': ['▲', '▲'], 'cx.dn': ['▼', '▼'],
  'cx.zoomI': ['＋', '＋'], 'cx.zoomO': ['－', '－'], 'cx.map': ['Mapa del sitio', 'Site map'], 'cx.leave': ['Salir', 'Leave'], 'cx.done': ['¡Listo!', 'Done!'], 'cx.offline': ['Piloto desconectado… Pancho toma el control', 'Pilot offline… Pancho takes over'],
  'cx.k.window': ['CORTE DE MOTOR', 'ENGINE CUTOFF'], 'cx.k.targets': ['ESTRELLAS OBJETIVO', 'TARGET STARS'], 'cx.k.burn': ['QUEMADO', 'BURN'], 'cx.k.align': ['ALINEACIÓN', 'ALIGNMENT'], 'cx.k.poll': ['RONDA', 'POLL'], 'cx.k.tasks': ['TAREAS', 'TASKS'],
  'cx.k.alt': ['ALT', 'ALT'], 'cx.k.vel': ['VEL', 'VEL'], 'cx.k.vs': ['V/S', 'V/S'], 'cx.k.hs': ['H/S', 'H/S'], 'cx.k.fuel': ['COMB', 'FUEL'], 'cx.k.thr': ['ACEL', 'THR'], 'cx.k.tilt': ['INCL', 'TILT'],
  'cx.k.stress': ['ESTRÉS', 'STRESS'], 'cx.k.pitch': ['CABECEO', 'PITCH'], 'cx.k.step': ['PASO', 'STEP'], 'cx.k.o2': ['O₂', 'O₂'], 'cx.k.mode': ['MODO', 'MODE'], 'cx.k.stage': ['ETAPA', 'STAGE'], 'cx.k.faults': ['FALLAS', 'FAULTS'],
});
const PH = ['prep', 'launch', 'cruise', 'descent', 'eva'];
const safe = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;');
const STATIONS = ['booster', 'retro', 'fido', 'guidance', 'eecom', 'surgeon', 'network'];

export async function runCapcom(M) {
  // carga los textos de cada fase para traducir los eventos del piloto
  await Promise.all([import('../game/phases/prep.js'), import('../game/phases/launch.js'), import('../game/phases/cruise.js'), import('../game/phases/descent.js'), import('../game/phases/eva.js')]).catch(() => {});
  lobbyBg(); music('cruise', { vol: 0.25 }); setPhaseBed('cruise');
  const C = { phase: null, snap: {}, hist: [], reqs: new Map(), t0: performance.now(), logs: 0 };
  const el = show(`<div class="screen" style="padding:0"><div class="hud">
    <div class="tl"><span class="phase-tag">${t('cc.title')}</span><span class="phase-title cph">${t('cx.wait')}</span></div>
    <div class="tr" style="flex-direction:row;align-items:center;gap:8px"><span class="chip link">● ${t('cx.link')}</span><button class="btn leave" style="min-height:38px;padding:.4em .9em">${t('cx.leave')}</button></div>
    <div class="capcom">
      <div class="panel box"><h3>${t('cc.tele')}</h3><div class="tele-grid tg" style="grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px"></div><canvas class="plot" width="600" height="300" style="margin-top:10px"></canvas></div>
      <div class="panel box act"><h3>${t('cx.req')}</h3><div class="reqs"><p class="phase-tag idle">${t('cx.none')}</p></div></div>
      <div class="panel box"><h3>${t('cc.ping')}</h3><div class="pings">${['good', 'slow', 'left', 'right', 'fuel', 'go', 'cut'].map((k) => `<button class="btn" data-p="${k}">${t('p.' + k)}</button>`).join('')}</div></div>
      <div class="panel box"><h3>${t('cc.events')}</h3><div class="log mono" style="max-height:220px;overflow:auto;font-size:.74rem;display:flex;flex-direction:column-reverse;gap:3px"></div></div>
    </div><div class="static los" style="display:none"></div></div></div>`, 'capcom');
  dbg('capcom', C);
  const plot = $('.plot', el), px = plot.getContext('2d'); const reqBox = $('.reqs', el), logBox = $('.log', el);
  $('.leave', el).onclick = () => { sfx('click'); quitMission(); };
  $$('[data-p]', el).forEach((b) => (b.onclick = () => { sfx('ping'); tx({ t: 'ev', k: 'ping', v: b.dataset.p }); b.animate([{ transform: 'scale(.92)' }, { transform: 'none' }], 200); }));
  const offs = M.offs;
  const log = (txt, kind = 'info') => { const col = { ok: 'var(--go)', warn: 'var(--amber)', bad: 'var(--red)', fault: 'var(--red)' }[kind] || 'var(--ink)'; const ts = mmss((performance.now() - C.t0) / 1000); logBox.prepend(h(`<div style="color:${col}"><span style="color:var(--dim)">${ts}</span> ${safe(txt)}</div>`)); while (logBox.children.length > 60) logBox.lastChild.remove(); if (kind === 'bad' || kind === 'fault') sfx('error', { vol: 0.4 }); };
  // práctica: al terminar una fase el piloto ve su resultado; CAPCOM ve un panel de espera (antes quedaba congelado)
  const prDone = (m) => { $('.prwait', el)?.remove(); const o = h(`<div class="prwait screen" style="position:absolute;inset:0;z-index:30;background:#05080fcc;backdrop-filter:blur(6px);display:grid;place-items:center;animation:fadeIn .4s ease both">
    <div class="panel box" style="text-align:center;max-width:min(440px,90vw);padding:26px 28px"><div class="phase-tag">${t('d.pr')}</div><h2 style="margin:.3em 0">${t('cx.prDone', { ph: t('ph.' + m.ph) })}</h2>
    <div class="phase-title" style="font-size:clamp(28px,6vw,48px);color:var(--amber)">${t('cx.prScore', { s: Math.round(m.score || 0) })}</div><p class="mono" style="color:var(--dim);font-size:.8rem;margin:14px 0 18px">${t('cx.prWait')}</p>
    <button class="btn prleave">${t('quit')}</button></div></div>`); el.append(o); $('.prleave', o).onclick = () => { sfx('click'); quitMission(); }; sfx('ok'); log(t('cx.prDone', { ph: t('ph.' + m.ph) }) + ' · ' + t('cx.prScore', { s: Math.round(m.score || 0) }), 'ok'); };
  offs.push(on('net:practice', prDone));
  offs.push(on('net:phase', (m) => { $('.prwait', el)?.remove(); C.phase = m.ph; setPhaseBed(m.ph); C.hist = []; C.snap = {}; clearReqs(); $('.cph', el).textContent = `${PH.indexOf(m.ph) + 1}/5 · ${t('ph.' + m.ph)}`; log('▶ ' + t('ph.' + m.ph), 'ok'); sfx('stage', { vol: 0.3 }); $('.los', el).style.display = 'none'; dbg('ccPhase', m.ph); }));
  offs.push(on('net:snap', (m) => { if (m.ph !== C.phase) { C.phase = m.ph; $('.cph', el).textContent = `${PH.indexOf(m.ph) + 1}/5 · ${t('ph.' + m.ph)}`; } C.snap = m.d; C.hist.push([performance.now(), m.d]); if (C.hist.length > 400) C.hist.shift(); $('.los', el).style.display = m.d.los ? '' : 'none'; paintTele(); }));
  offs.push(on('net:log', (m) => { C.logs++; log(t(m.k, m.vars || undefined), m.kind); }));
  offs.push(on('net:req', (m) => addReq(m)));
  offs.push(on('net:reqdone', (m) => dropReq(m.id)));
  offs.push(on('net:debrief', async (m) => { const { default: run } = await import('../game/phases/debrief.js'); if (m.photo) shared.flagPhoto = m.photo; run(m, { retry: () => { tx({ t: 'restart', ph: 'prep' }); runCapcom(M); }, menu: quitMission }); }));
  offs.push(on('net:peer', (m) => { if (m.ev !== 'back') { log(t('cx.offline'), 'warn'); clearReqs(); } }));
  const lt = setInterval(() => { const l = $('.link', el); if (!l) return clearInterval(lt); const ok = peerOnline(); l.style.color = ok ? 'var(--go)' : 'var(--red)'; l.textContent = `● ${t('cx.link')} ${ok ? Math.round(net.rtt) + ' ms' : '—'}`; drawPlot(); }, 500);
  offs.push(() => clearInterval(lt));
  // ---------- telemetría ----------
  function cell(k, v, cls = '') { return `<div class="tele" style="padding:6px 8px"><div class="k">${t('cx.k.' + k) !== 'cx.k.' + k ? t('cx.k.' + k) : k.toUpperCase()}</div><div class="v mono ${cls}" style="font-size:1.05rem">${v}</div></div>`; }
  function paintTele() {
    const d = C.snap, f = (n, p = 0) => (n == null ? '—' : Number(n).toFixed(p)); let html = '';
    if (C.phase === 'prep') html = cell('step', `${(d.step ?? 0) + 1}/${d.n ?? '?'}`) + cell('faults', d.faults?.length ? `<span style="color:var(--red)">${d.faults.length}</span>` : '0') + cell('poll', d.poll ? d.poll.length + '/7' : '—') + (d.faults || []).map((k) => `<div class="fault" style="grid-column:1/-1"><b>⚠</b> ${safe(t('fault.' + k))}</div>`).join('');
    else if (C.phase === 'launch') html = cell('alt', f((d.alt || 0) / 1000, 1) + ' km') + cell('vel', f(d.vel, 0) + ' m/s') + cell('pitch', f(d.pitch, 1) + '°') + cell('stress', f((d.stress || 0) * 100) + '%', d.stress > 0.7 ? 'bad' : '') + cell('stage', safe(d.stage ?? '—')) + cell('thr', f((d.thr || 0) * 100) + '%');
    else if (C.phase === 'cruise') html = cell('stage', safe(d.stage || '—')) + (d.targets ? cell('align', `${d.got?.length || 0}/${d.targets.length}`) : '') + (d.v != null ? cell('burn', f(d.v * 100) + '%') : '') + (Number.isFinite(d.z0) && Number.isFinite(d.z1) ? cell('window', `${f(d.z0*100)}–${f(d.z1*100)}%`, 'cutoff') : '') + (Array.isArray(d.targets) ? `<div style="grid-column:1/-1">${cell('targets', d.targets.filter(n => ['Sirius','Vega','Rigel','Canopus','Antares','Altair'].includes(n)).map(n => (d.got?.includes(n) ? '✓ ' : '') + n).join(' · '))}</div>` : '') + (d.los ? `<div class="fault" style="grid-column:1/-1">${t('cc.los')}</div>` : '');
    else if (C.phase === 'descent') html = cell('alt', f(d.alt) + ' m') + cell('vs', f(d.vs, 1), Math.abs(d.vs) > 3 && d.alt < 50 ? 'bad' : '') + cell('hs', f(d.hs, 1)) + cell('fuel', d.fuel == null ? 'AUTO' : f(d.fuel) + ' s', d.fuel != null && d.fuel < 20 ? 'bad' : '') + cell('thr', f((d.thr || 0) * 100) + '%') + cell('mode', (d.alarm ? '<span style="color:var(--red)">1202</span>' : '') + safe(d.mode || '—'));
    else if (C.phase === 'eva') html = cell('o2', f((d.o2 ?? 1) * 100) + '%') + cell('mode', safe(d.mode || '—')) + cell('tasks', `${d.sample ? '☑' : '☐'} ${d.flag ? '☑' : '☐'}`);
    $('.tg', el).innerHTML = html;
  }
  function drawPlot() {
    const W = plot.width, H = plot.height; px.fillStyle = '#020a06'; px.fillRect(0, 0, W, H); px.strokeStyle = '#1b3a28'; px.lineWidth = 1;
    for (let i = 1; i < 6; i++) { px.beginPath(); px.moveTo(0, (i * H) / 6); px.lineTo(W, (i * H) / 6); px.stroke(); px.beginPath(); px.moveTo((i * W) / 6, 0); px.lineTo((i * W) / 6, H); px.stroke(); }
    const hs = C.hist; px.font = '16px Mono'; px.fillStyle = '#3ddc84';
    if (!hs.length) { px.fillText(t('cc.idle'), 16, 28); return; }
    if (C.phase === 'eva') { // mapa del sitio, vista cenital
      const s = 9; px.save(); px.translate(W / 2, H / 2 - 40); px.strokeStyle = '#ffb000'; px.strokeRect(-2.3 * s, -2.3 * s, 4.6 * s, 4.6 * s); px.fillStyle = '#ffb000'; px.fillText('LM', -10, 6);
      px.strokeStyle = '#4fc3f7'; px.beginPath(); px.arc(2.5 * s, 12.5 * s, 3.2 * s, 0, 7); px.stroke(); px.fillStyle = '#4fc3f7'; px.fillText('⚑', 2.5 * s - 5, 12.5 * s + 5);
      px.strokeStyle = '#3ddc8466'; px.beginPath(); hs.forEach(([, d], i) => (i ? px.lineTo(d.x * s, d.z * s) : px.moveTo(d.x * s, d.z * s))); px.stroke();
      const d = hs[hs.length - 1][1]; px.fillStyle = '#fff'; px.beginPath(); px.arc(d.x * s, d.z * s, 5, 0, 7); px.fill(); px.restore(); return;
    }
    if (C.phase === 'prep') { const d = hs[hs.length - 1][1], n = d.n || 8, st = d.step ?? 0, bw = (W - 40) / n;
      for (let i = 0; i < n; i++) { px.fillStyle = i < st ? '#3ddc84' : i === st ? '#ffb000' : '#1b3a28'; px.fillRect(20 + i * bw + 3, H / 2 - 30, bw - 6, 60); }
      px.fillStyle = '#3ddc84'; px.fillText(`${t('prep.cl').toUpperCase()} ${Math.min(st, n)}/${n}`, 20, 40); if (d.faults?.length) { px.fillStyle = '#ff4d4d'; px.fillText('⚠ ' + d.faults.map((k) => k.toUpperCase()).join(' · '), 20, H - 30); } return; }
    const key = { launch: 'alt', descent: 'alt', cruise: 'v', prep: 'step' }[C.phase] || 'alt'; const vals = hs.map(([, d]) => d[key]).filter((v) => v != null); if (!vals.length) return;
    const mx = Math.max(...vals, 1), mn = Math.min(0, ...vals); px.strokeStyle = '#3ddc84'; px.lineWidth = 2; px.beginPath();
    vals.forEach((v, i) => { const x = (i / Math.max(1, vals.length - 1)) * W, y = H - 10 - ((v - mn) / (mx - mn || 1)) * (H - 30); i ? px.lineTo(x, y) : px.moveTo(x, y); }); px.stroke();
    px.fillText(`${key.toUpperCase()} ${Math.round(vals[vals.length - 1])}`, 12, 22);
  }
  // ---------- pedidos ----------
  function clearReqs() { for (const id of [...C.reqs.keys()]) dropReq(id); }
  function dropReq(id) { const r = C.reqs.get(id); if (!r) return; r.el.remove(); C.reqs.delete(id); $('.idle', reqBox).style.display = C.reqs.size ? 'none' : ''; }
  function respond(id, v) { if (!C.reqs.has(id)) return; tx({ t: 'ev', k: 'resp', id, v }); sfx('ok'); dropReq(id); log('✔ ' + t('cx.done'), 'ok'); }
  function addReq(m) {
    if (C.reqs.has(m.id)) return;
    sfx('computer', { vol: 0.5 }); navigator.vibrate?.(120); $('.idle', reqBox).style.display = 'none'; let box;
    if (m.k === 'gonogo') {
      const st = m.data?.stations || STATIONS; const done = new Set();
      box = h(`<div><p class="phase-tag" style="color:var(--amber)">${t('cx.poll')}</p><div class="gonogo">${st.map((s) => `<div class="station" data-st="${s}" style="cursor:pointer"><span class="led-ind"></span>${t('st.' + s)}</div>`).join('')}</div></div>`);
      $$('.station', box).forEach((n) => (n.onclick = () => { const s = n.dataset.st; if (done.has(s)) return; done.add(s); n.classList.add('go'); $('.led-ind', n).className = 'led-ind g'; sfx('ok', { rate: 1 + done.size * 0.05, vol: 0.5 }); tx({ t: 'ev', k: 'poll', v: s }); if (done.size === st.length) setTimeout(() => respond(m.id, true), 400); }));
    } else if (m.k === 'stage') {
      box = h(`<div><p class="phase-tag" style="color:var(--amber)">${t('cx.stage')}</p><button class="btn amber big-action">${t('cc.stage')}</button></div>`); $('button', box).onclick = () => respond(m.id, true);
    } else if (m.k === '1202') {
      box = h(`<div><p class="phase-tag" style="color:var(--red)">${t('cx.1202')}</p><p style="color:var(--dim);font-size:.85rem">${t('cx.1202h')}</p><div class="row2"><button class="btn go big-action">GO</button><button class="btn red big-action">${t('cx.abort')}</button></div></div>`);
      $('.go', box).onclick = () => respond(m.id, true); $('.red', box).onclick = () => respond(m.id, false); sfx('computer', { vol: 0.5 });
    } else if (m.k === 'photo') {
      const f = { yaw: 0, pitch: -0.03, zoom: 1.5 }; const send = () => tx({ t: 'ev', k: 'frame', v: { ...f } });
      box = h(`<div><p class="phase-tag" style="color:var(--amber)">${t('cx.photo')}</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:260px;margin:0 auto">
        <button class="btn" data-f="zo">${t('cx.zoomO')}</button><button class="btn" data-f="up">${t('cx.up')}</button><button class="btn" data-f="zi">${t('cx.zoomI')}</button>
        <button class="btn" data-f="l">${t('cx.left')}</button><button class="btn" data-f="dn">${t('cx.dn')}</button><button class="btn" data-f="r">${t('cx.right')}</button></div>
        <button class="btn go big-action" style="margin-top:10px">${t('cx.shoot')}</button></div>`);
      $$('[data-f]', box).forEach((b) => (b.onclick = () => { const k = b.dataset.f; if (k === 'l') f.yaw = clamp(f.yaw + 0.05, -0.5, 0.5); if (k === 'r') f.yaw = clamp(f.yaw - 0.05, -0.5, 0.5); if (k === 'up') f.pitch = clamp(f.pitch + 0.02, -0.3, 0.3); if (k === 'dn') f.pitch = clamp(f.pitch - 0.02, -0.3, 0.3); if (k === 'zi') f.zoom = clamp(f.zoom * 1.12, 1, 2.2); if (k === 'zo') f.zoom = clamp(f.zoom / 1.12, 1, 2.2); sfx('click', { vol: 0.4 }); send(); }));
      $('.go', box).onclick = () => { sfx('click'); respond(m.id, { ...f }); };
    } else { box = h(`<div><p class="phase-tag">${safe(m.k)}</p><button class="btn go big-action">GO</button></div>`); $('button', box).onclick = () => respond(m.id, true); }
    box.style.cssText += ';border-top:1px solid var(--line);padding-top:8px;margin-top:6px;animation:appear .3s'; reqBox.append(box); C.reqs.set(m.id, { el: box, k: m.k }); dbg('ccReq', m.k);
  }
  paintTele(); drawPlot(); tx({ t: 'sync' });
}
