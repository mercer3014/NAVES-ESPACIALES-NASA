// Orquestador de misión: fases en orden, puente CAPCOM (humano remoto o Pancho), pausa, puntaje
import { show, syncCursor } from '../ui/router.js';
import { t } from '../core/i18n.js';
import { phaseStamp } from '../ui/presentation.js';
import { bindUiSfx } from '../ui/ui-sfx.js';
import { store, on, emit, shared, dbg } from '../core/store.js';
import { setWorld, onTick, setPaused } from '../core/engine.js';
import { $, $$, h, sleep, toast, achieve, scanFx, rng } from '../core/util.js';
import { offerLook, requestLook, lookActive } from '../core/look.js';
import { commsReset } from '../core/comms.js';
import { sfx, music, stopEngine, stopRumble, stopVoices } from '../core/audio.js';
import { clearBtns, pressed } from '../core/input.js';
import { pancho } from '../ui/pancho.js';
import { net, tx, partner, peerOnline, leaveRoom } from '../net/room.js';
import { getFlag, getName } from '../ui/screens.js';

export const PHASES = ['prep', 'launch', 'cruise', 'descent', 'eva'];
const loaders = { prep: () => import('./phases/prep.js'), launch: () => import('./phases/launch.js'), cruise: () => import('./phases/cruise.js'), descent: () => import('./phases/descent.js'), eva: () => import('./phases/eva.js') };
const DIFF = { cadet: { fuel: 1.35, tol: 1.4, assist: true, time: 1.4 }, normal: { fuel: 1, tol: 1, assist: false, time: 1 }, veteran: { fuel: 0.85, tol: 0.8, assist: false, time: 0.8 } };
let M = null; // misión activa
export const mission = () => M;
dbg('mission', () => M && { phase: M.phase, results: M.results, mode: M.mode });

// ---------- Contexto de fase ----------
function makeCtx(phase) {
  const cleanups = []; let dead = false, gameT = 0; const waits = [];
  const ctx = {
    phase, mode: M.mode, role: M.role, seed: M.seed + PHASES.indexOf(phase), rand: rng(M.seed + 7 * PHASES.indexOf(phase) + 1), diff: DIFF[M.diff] || DIFF.normal, diffName: M.diff,
    flag: getFlag(), name: getName(), crew: M.crew, practice: M.practice,
    get dead() { return dead; }, get time() { return gameT; },
    onCleanup: (f) => cleanups.push(f),
    world(w) { setWorld(w); },
    loop(fn) { const off = onTick((dt, tt) => { if (!dead) fn(dt, tt); }); cleanups.push(off); return off; },
    wait: (s) => (dead ? new Promise(() => {}) : new Promise((r) => waits.push({ at: gameT + s, r }))),
    until: (pred) => new Promise((r) => { const off = onTick(() => { if (!dead && pred()) { off(); r(); } }); cleanups.push(off); }),
    hud(html) {
      const el = show(`<div class="screen hud-screen" style="padding:0"><div class="hud">${html}<div class="tr pausebox" style="z-index:5"><button class="icon-btn" data-pause aria-label="pause">⏸</button></div></div></div>`, 'phase-' + phase);
      bindUiSfx(el);
      showPhaseStamp(phase);
      $('[data-pause]', el).onclick = () => pauseMenu(); return el;
    },
    banner(text, sub = '', ms = 2200, cls = '') {
      document.querySelector('.hud > .banner')?.remove();
      const el = h(`<div class="banner pop ${cls}">${text}${sub ? `<small>${sub}</small>` : ''}</div>`); (document.querySelector('.hud') || document.body).append(el);
      if (ms) setTimeout(() => el.remove(), ms); return el;
    },
    cc: makeCC(phase, () => dead),
    say: (k, o) => { if (!dead) pancho.say(k, o); },
    kill() { dead = true; cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { console.error(e); } }); waits.length = 0; clearBtns(); stopEngine(); stopRumble(); stopVoices(); pancho.hide(); },
  };
  cleanups.push(onTick((dt) => { gameT += dt; for (let i = waits.length - 1; i >= 0; i--) if (gameT >= waits[i].at) waits.splice(i, 1)[0].r(); }));
  return ctx;
}

// ---------- Puente CAPCOM ----------
function makeCC(phase, isDead) {
  const coop = M.mode === 'coop'; let lastSnap = 0, reqN = 0; const pending = new Map(); const offs = [];
  const remote = () => coop && peerOnline();
  if (coop) {
    offs.push(on('net:ev', (m) => {
      if (isDead()) return;
      if (m.k === 'resp' && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p.res(m.v); }
      if (m.k === 'ping') { sfx('ping'); const who = partner()?.name || 'CAPCOM'; toast(`📡 ${who}: ${t('p.' + m.v)}`, 'info'); cc._ping?.(m.v); emit('ping', m.v); }
    }));
    // si el compañero se cae, Pancho resuelve lo pendiente
    offs.push(on('net:peer', (m) => { if (m.ev !== 'back') for (const [id, p] of pending) { pending.delete(id); p.bot().then(p.res); } }));
  }
  const cc = {
    remote, coop,
    snap(d, force) { if (!coop) return; const n = performance.now(); if (!force && n - lastSnap < 180) return; lastSnap = n; tx({ t: 'snap', ph: phase, d }); },
    log(k, vars, kind = 'info') { if (coop) tx({ t: 'log', ph: phase, k, vars, kind }); },
    // pregunta algo a CAPCOM; bot() = respuesta de Pancho cuando no hay humano
    ask(k, data = {}, bot = async () => true, timeout = 0) {
      if (!remote()) return bot();
      const id = ++reqN + '-' + phase;
      return new Promise((res) => {
        const p = { res: (v) => { tx({ t: 'reqdone', id }); res(v); }, bot }; pending.set(id, p); tx({ t: 'req', id, k, data, ph: phase });
        if (timeout) setTimeout(() => { if (pending.has(id)) { pending.delete(id); bot().then(p.res); } }, timeout * 1000);
      });
    },
    onPing(fn) { cc._ping = fn; },
    dispose() { offs.forEach((f) => f()); pending.clear(); },
  };
  return cc;
}

// ---------- Pausa ----------
let pauseEl = null;
function showPhaseStamp(phase) {
  document.querySelector('.phase-stamp')?.remove();
  const info = phaseStamp(phase);
  if (!info.key) return;
  const el = h(`<div class="phase-stamp" aria-hidden="true"><span class="phase-stamp-k">${t('ph.n')} ${String(info.n).padStart(2, '0')}</span><b>${t(info.key)}</b></div>`);
  document.body.append(el);
  setTimeout(() => el.isConnected && el.remove(), 3200);
}
function pauseMenu() {
  if (pauseEl || !M) return; document.exitPointerLock?.(); const solo = M.mode === 'solo'; if (solo) setPaused(true); document.body.dataset.paused = '1'; syncCursor(); sfx('open', { vol: 0.5 });
  const info = phaseStamp(M.phase);
  const kicker = info.key ? `${t('ph.n')} ${String(info.n).padStart(2, '0')} · ${t(info.key)}` : '';
  pauseEl = h(`<div class="screen pause-screen"><div class="panel dialog pause-card">
    <div class="phase-tag">${kicker}</div>
    <h2 data-i="pause">${t('pause')}</h2><div class="pause-actions">
    <button class="btn go" data-a="resume">${t('resume')}</button><button class="btn" data-a="restart">${t('restartPhase')}</button><button class="btn" data-a="quit">${t('quit')}</button></div></div></div>`);
  bindUiSfx(pauseEl);
  document.body.append(pauseEl);
  pauseEl.onclick = (e) => {
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); const phase = M.phase; closePause();
    if (a === 'resume' && lookActive()) requestLook();
    if (a === 'restart') { if (M.mode === 'coop') tx({ t: 'restart', ph: phase }); runPhase(phase); }
    if (a === 'quit') quitMission();
  };
}
function closePause() { pauseEl?.remove(); pauseEl = null; setPaused(false); delete document.body.dataset.paused; syncCursor(); }
addEventListener('keydown', (e) => { if (e.code === 'Escape' && M && M.role === 'pilot' && document.body.dataset.screen?.startsWith('phase-')) pauseEl ? closePause() : pauseMenu(); });

export async function quitMission() {
  if (M) { M.ctx?.kill(); M.ctx?.cc.dispose(); M.offs.forEach((f) => f()); if (M.mode === 'coop') { tx({ t: 'quit' }); leaveRoom(); } }
  M = null; closePause(); music('title'); const s = await import('../ui/screens.js'); s.startScreen();
}

// ---------- Fases ----------
async function runPhase(phase) {
  if (M.ctx) { M.ctx.kill(); M.ctx.cc.dispose(); }
  M.phase = phase; dbg('phase', phase); if (M.mode === 'coop') tx({ t: 'phase', ph: phase, results: M.results });
  commsReset(); sfx('stage', { vol: 0.35 }); scanFx(); offerLook(phase);
  const mod = await loaders[phase](); const ctx = makeCtx(phase); M.ctx = ctx; const myCtx = ctx;
  let res;
  try { res = await mod.default(ctx); } catch (e) { console.error(e); res = { score: 0, stats: { error: String(e) } }; }
  if (myCtx !== M?.ctx) return; // reiniciada o abandonada
  M.results[phase] = res; store.set('best', { ...store.get('best'), [phase]: Math.max(res.score, store.get('best')[phase] || 0) });
  const i = PHASES.indexOf(phase); const chained = !M.practice && i >= 0 && i < PHASES.length - 1;
  if (chained) { ctx.banner(t('ph.done'), '', 2400); await sleep(2500); if (myCtx !== M?.ctx || !M) return; }
  ctx.kill(); ctx.cc.dispose(); M.ctx = null;
  if (!M) return;
  if (M.practice) return practiceResult();
  if (chained) return runPhase(PHASES[i + 1]);
  debrief();
}
async function practiceResult() {
  const r = M.results[M.phase]; const { practiceScreen } = await import('./phases/debrief.js');
  if (M.mode === 'coop') tx({ t: 'practice', ph: M.phase, score: r?.score || 0 });
  practiceScreen(M.phase, r, { retry: () => runPhase(M.phase), next: () => { const i = PHASES.indexOf(M.phase); if (i < 4) { M.practice = PHASES[i + 1]; runPhase(M.practice); } else quitMission(); }, menu: quitMission });
}
async function debrief() {
  M.phase = 'debrief'; const { default: run } = await import('./phases/debrief.js');
  const payload = { results: M.results, crew: M.crew, mode: M.mode, diff: M.diff, date: Date.now() };
  if (M.mode === 'coop') { tx({ t: 'debrief', ...payload, photo: await smallPhoto() }); achieve('coop'); }
  run(payload, { retry: () => restartMission(), menu: quitMission });
}
async function smallPhoto() { // foto reducida (~40 KB) para la tarjeta del compañero
  const src = shared.flagPhoto || shared.photo; if (!src) return null;
  return new Promise((r) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 520; c.getContext('2d').drawImage(i, 0, 0, 520, 520); r(c.toDataURL('image/jpeg', 0.7)); }; i.onerror = () => r(null); i.src = src; });
}
function restartMission() { M.results = {}; if (M.mode === 'coop') tx({ t: 'restart', ph: 'prep' }); runPhase('prep'); }

function crewList() {
  if (M.mode !== 'coop') return [{ name: getName(), flag: getFlag(), role: 'pilot' }, { name: 'Pancho', flag: null, role: 'capcom', bot: true }];
  return net.members.map((m) => ({ name: m.name, flag: m.flag, role: m.role }));
}

export async function startMission({ mode = 'solo', role = 'pilot', practice = null, seed, diff, resume = null } = {}) {
  if (M) { M.ctx?.kill(); M.offs.forEach((f) => f()); }
  M = { mode, role, practice, seed: seed ?? ((Math.random() * 1e9) | 0), diff: diff || store.get('difficulty'), results: resume?.results || {}, offs: [], phase: null };
  M.crew = crewList(); music(null, { fade: 800 });
  if (mode === 'coop') {
    M.offs.push(on('net:restart', (m) => { if (M.role !== 'pilot') return; if (m.ph === 'prep') M.results = {}; runPhase(m.ph); }));
    M.offs.push(on('net:quit', () => { toast(t('net.left'), 'info'); quitMission(); }));
    M.offs.push(on('net:peer', (m) => { if (m.ev === 'away' || m.ev === 'left') toast(t('net.left'), 'info'); else toast(t('net.back'), 'info'); }));
  }
  if (role === 'capcom') { const { runCapcom } = await import('../ui/capcom.js'); return runCapcom(M); }
  if (resume) toast(t('net.resume'), 'info');
  runPhase(resume?.phase || practice || 'prep');
}
// el host recibió/envió {t:'start'}: cada uno arranca con su rol
export function startCoop(m) { if(['mars','horizon'].includes(m.mission)){ import('./expeditions/index.js').then(x=>x.startExpedition({...m,mode:'coop',role:net.role}));return; } startMission({ mode: 'coop', role: net.role, seed: m.seed, diff: m.diff, practice: m.from && m.from !== 'prep' ? m.from : null, resume: m.resume }); }
