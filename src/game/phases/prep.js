// FASE 1 · «La mañana del lanzamiento»: la plataforma 39A de madrugada, 4 tareas en cualquier orden,
// la escotilla al final y la ronda GO/NO-GO automática. Cada tarea es un módulo (ver prep-tasks/index.js).
import './prep-tasks.css';
import { t, extend } from '../../core/i18n.js';
import { $, achieve, clamp } from '../../core/util.js';
import { sfx, music } from '../../core/audio.js';
import { store, dbg } from '../../core/store.js';
import { makePad, BASE_Y } from '../../scenes/pad.js';
import { TASKS } from './prep-tasks/index.js';

extend({
  'prep.alarm': ['ALARMA MAESTRA', 'MASTER ALARM'], 'prep.pollcc': ['Control de Misión está haciendo la ronda…', 'Mission Control is running the poll…'],
  'prep.allgo': ['¡Todas las estaciones GO para lanzamiento!', 'All stations GO for launch!'], 'prep.fixed': ['Falla resuelta', 'Fault cleared'],
  'prep2.title': ['La mañana del lanzamiento', 'Launch morning'], 'prep2.tasks': ['TAREAS', 'TASKS'], 'prep2.when': ['16 JUL 1969 · 04:15 · PLATAFORMA 39A', 'JUL 16 1969 · 04:15 · PAD 39A'],
  'prep2.locked': ['Termina las 4 tareas para cerrar la escotilla', 'Finish the 4 tasks to close the hatch'], 'prep2.done': ['¡TAREA LISTA!', 'TASK DONE!'],
  'prep2.fact': ['DATO REAL', 'REAL FACT'], 'prep2.close': ['Volver a la plataforma', 'Back to the pad'], 'prep2.n': ['TAREA', 'TASK'],
  'prep2.start': ['Buenos días. Toca una tarea: puedes hacerlas en cualquier orden.', 'Good morning. Tap a task: do them in any order.'],
  'prep2.hatchopen': ['¡Solo falta la escotilla!', 'Only the hatch is left!'],
  'prep2.next': ['Toca «{task}».', 'Tap "{task}".'], 'prep2.pad': ['PANCHO', 'PANCHO'],
});
const STATIONS = ['booster', 'retro', 'fido', 'guidance', 'eecom', 'surgeon', 'network'];
const L = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (pair) => pair[L()];
const X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="square" aria-hidden="true"><path d="M5 5 L19 19 M19 5 L5 19"/></svg>';
const LOCK = '<svg class="pt-lock" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 0 0-4 0z"/></svg>';
for (const k of TASKS) extend({ ['prep2.h.' + k.id]: k.hint });
const MAIN = TASKS.filter((k) => k.id !== 'hatch'), HATCH = TASKS.find((k) => k.id === 'hatch');

export default async function prep(ctx) {
  if (!ctx.practice) return storyPrep(ctx);
  return practicePrep(ctx);
}

async function storyPrep(ctx) {
  const t0 = ctx.time;
  const { runExplore } = await import('../explore/run.js');
  const { default: room } = await import('../explore/scenes/white-room.js');
  const { playA11 } = await import('../../audio/a11-voice.js');
  try { playA11('nasa_real/cap2_cuenta_regresiva_corta', { vol: 0.22 }); } catch { /* la cuenta es ambiente, no bloquea */ }
  let res = { flags: {}, skipped: false, done: false };
  try { res = await runExplore(room, { skipCard: true }); }
  catch (e) { console.error('Sala Blanca', e); }
  const mistakes = res.flags?.mistakes || 0;
  const el = ctx.hud('<div class="pt-hud"></div>');
  const ov = document.createElement('div'); ov.className = 'pt-poll';
  ov.innerHTML = `<div class="pt-poll-in"><h2>${t('gonogo.title')}</h2><p>${t('prep.pollcc')}</p>${STATIONS.map((s, i) => `<div class="pt-st" data-st="${s}"><i></i><span>${t('st.' + s)}</span><em>${String(i + 1).padStart(2, '0')}</em></div>`).join('')}</div>`;
  el.append(ov); const go = [];
  for (const s of STATIONS) { await ctx.wait(0.43); $(`[data-st="${s}"]`, ov)?.classList.add('pt-go'); go.push(s); sfx('ok', { vol: 0.5, rate: 1 + go.length * 0.05 }); ctx.cc.snap({ tasks: go.slice(), poll: go.slice(), n: 7 }, true); }
  await ctx.wait(0.5); ctx.banner(t('prep.allgo'), '', 2400); sfx('powerup'); ctx.say('pa.go', { ms: 2500 }); await ctx.wait(2.2); ov.remove();
  const time = ctx.time - t0;
  const score = Math.round(clamp(100 - mistakes * 8 - Math.max(0, time - 360) * 0.08, 10, 100));
  if (mistakes === 0 && !res.skipped) achieve('nofault');
  ctx.banner(t('prep.countdown'), '', 1500); await ctx.wait(1.2);
  return { score, stats: { time: Math.round(time), mistakes, faults: mistakes ? 1 : 0 } };
}

async function practicePrep(ctx) {
  // mundo: plataforma de madrugada, cámara orbitando el Saturn V
  const W = makePad(); ctx.world(W); W.setThrust(0);
  W.scene.traverse((o) => { if (o.isLight) o.intensity *= 0.5; });
  const cam = W.camera; let ang = 0.6;
  ctx.loop((dt) => { ang += dt * 0.03; cam.position.set(Math.sin(ang) * 230, BASE_Y + 32 + Math.sin(ang * 0.7) * 10, Math.cos(ang) * 230); cam.lookAt(0, BASE_Y + 52, 0); });
  music('ambient', { vol: 0.45 });

  const done = {}; let mistakes = 0, faults = 0, hints = 0, openI = null, ac = null, busy = false, lastProg = 0, finished = false;
  const t0 = ctx.time;
  const el = ctx.hud(`<div class="pt-hud"><div class="pt-night"></div>
    <div class="pt-bar"><div class="pt-bar-h"><b>${t('prep2.tasks')}</b><span class="pt-n mono">0/${MAIN.length}</span></div>
      <div class="pt-icons">${TASKS.map((k) => `<button type="button" class="pt-ic" data-id="${k.id}" aria-label="${tx(k.title)}"><span class="pt-ic-g">${k.icon}</span><span class="pt-ic-l">${tx(k.short)}</span></button>`).join('')}</div></div>
    <div class="pt-hint" hidden></div>
    <div class="pt-win" hidden role="dialog" aria-modal="true"><div class="pt-win-h"><span class="pt-win-n"></span><b></b><button type="button" class="pt-x" aria-label="${t('prep2.close')}">${X_ICON}</button></div>
      <p class="pt-win-brief"></p><div class="pt-win-body"></div><div class="pt-win-hint"></div><div class="pt-win-fact"></div></div></div>`);
  const btn = (id) => $(`.pt-ic[data-id="${id}"]`, el), win = $('.pt-win', el), body = $('.pt-win-body', el), padHint = $('.pt-hint', el), winHint = $('.pt-win-hint', el);
  const nDone = () => MAIN.filter((k) => done[k.id]).length;
  const hatchReady = () => nDone() === MAIN.length;

  function paint() {
    $('.pt-n', el).textContent = `${nDone()}/${MAIN.length}`;
    for (const k of TASKS) {
      const b = btn(k.id), isH = k.id === 'hatch', lock = isH && !hatchReady() && !done.hatch;
      b.classList.toggle('pt-done', !!done[k.id]); 
      b.disabled = lock; b.querySelector('.pt-lock')?.remove(); if (lock) b.insertAdjacentHTML('beforeend', LOCK);
      b.title = lock ? t('prep2.locked') : tx(k.title);
    }
    btn('hatch').classList.toggle('pt-next', hatchReady() && !done.hatch);
    ctx.cc.snap({ tasks: Object.keys(done), cur: openI == null ? null : TASKS[openI].id, n: MAIN.length, mistakes }, true);
  }
  const showPad = (msg, ms = 6000) => { padHint.hidden = false; padHint.innerHTML = `<small>${t('prep2.pad')}</small>${msg}`; clearTimeout(showPad.tm); showPad.tm = setTimeout(() => (padHint.hidden = true), ms); };
  ctx.onCleanup(() => clearTimeout(showPad.tm));
  const progress = () => { lastProg = ctx.time; };

  function closeTask() {
    ac?.abort(); ac = null; openI = null; win.hidden = true; body.innerHTML = ''; winHint.textContent = ''; busy = false; if (done.hatch) finished = true; progress(); paint();
  }
  async function openTask(i) {
    if (busy || finished) return; const k = TASKS[i]; if (done[k.id] || (k.id === 'hatch' && !hatchReady())) return;
    busy = true; openI = i; progress(); sfx('open', { vol: 0.5 }); padHint.hidden = true;
    $('.pt-win-n', win).textContent = `${t('prep2.n')} ${k.id === 'hatch' ? 5 : MAIN.indexOf(k) + 1}/5`; $('.pt-win-h b', win).textContent = tx(k.title);
    $('.pt-win-brief', win).textContent = tx(k.brief); winHint.textContent = ''; $('.pt-win-fact', win).innerHTML = `<b>${t('prep2.fact')}</b>${tx(k.fact)}`;
    body.innerHTML = ''; win.hidden = false; paint(); $('.pt-x', win).focus({ preventScroll: true });
    const mine = (ac = new AbortController());
    const opts = { tm: 0, diff: ctx.diff, diffName: ctx.diffName, signal: mine.signal, sfx: (n) => sfx(n), hint: (m) => { if (mine.signal.aborted) return; winHint.textContent = m; progress(); clearTimeout(opts.tm); opts.tm = setTimeout(() => { if (winHint.textContent === m) winHint.textContent = ''; }, 5000); }, share: (o) => ctx.cc.snap({ tasks: Object.keys(done), cur: k.id, n: MAIN.length, task: o }, true) };
    let res;
    try { const mod = await k.load(); if (mine.signal.aborted) return; res = await mod.default(body, opts); }
    catch (e) { if (mine.signal.aborted) return; console.warn('Tarea ' + k.id + ' no disponible', e); res = { ok: true, time: 0, mistakes: 0, skipped: true }; }
    if (mine.signal.aborted || ctx.dead) return;
    mistakes += res.mistakes || 0;
    if (!res.ok) return; // cerrada sin terminar: se puede repetir
    done[k.id] = true; if (k.id === 'leak') faults++; sfx('powerup', { vol: 0.5 }); progress();
    body.insertAdjacentHTML('beforeend', `<div class="pt-ok-card"><div><h3>${t('prep2.done')}</h3><p>${tx(k.fact)}</p></div></div>`);
    ctx.cc.log('prep2.done', null, 'ok'); paint();
    const card = $('.pt-ok-card', body); await Promise.race([ctx.wait(k.id === 'hatch' ? 1.6 : 2.6), new Promise((r) => card?.addEventListener('click', r, { once: true }))]);
    if (mine.signal.aborted || ctx.dead) return;
    closeTask();
    if (k.id === 'hatch') finished = true;
    else if (hatchReady()) { sfx('beep', { vol: 0.5 }); showPad(t('prep2.hatchopen'), 7000); }
  }

  const onClick = (e) => { const b = e.target.closest('.pt-ic'); if (b && !b.disabled) openTask(TASKS.findIndex((k) => k.id === b.dataset.id)); };
  el.addEventListener('click', onClick); $('.pt-x', el).addEventListener('click', () => { sfx('click'); closeTask(); });
  const onKey = (e) => { if (e.key === 'Escape' && openI !== null) closeTask(); };
  addEventListener('keydown', onKey);
  ctx.onCleanup(() => { removeEventListener('keydown', onKey); ac?.abort(); });
  dbg('prepTasks', { open: openTask, done, TASKS, paint });

  ctx.say('prep2.start', { ms: 5000 }); ctx.cc.log('prep2.start'); showPad(t('prep2.start'), 6500);
  progress(); paint();
  // Pancho da una pista si pasan 10 s sin progreso
  ctx.loop(() => {
    if (finished || ctx.time - lastProg < 10) return; progress(); hints++;
    const k = openI == null ? null : TASKS[openI];
    if (k) { winHint.textContent = tx(k.hint); ctx.say('prep2.h.' + k.id, { ms: 5000 }); }
    else { const nx = hatchReady() ? HATCH : MAIN.find((m) => !done[m.id]); if (nx) { const m = t('prep2.next', { task: tx(nx.title) }); showPad(m, 6000); ctx.say('prep2.next', { vars: { task: tx(nx.title) }, ms: 4000 }); } }
  });

  await ctx.until(() => finished);
  await runPoll();
  const time = ctx.time - t0;
  const score = Math.round(clamp(100 - mistakes * 5 - Math.max(0, time - 210) * 0.15, 10, 100));
  if (mistakes === 0) achieve('nofault');
  ctx.banner(t('prep.countdown'), '', 1500); await ctx.wait(1.2);
  return { score, stats: { time: Math.round(time), mistakes, faults } };

  // ronda GO/NO-GO automática: 7 luces en ~3 s, sin clics
  async function runPoll() {
    const ov = document.createElement('div'); ov.className = 'pt-poll';
    ov.innerHTML = `<div class="pt-poll-in"><h2>${t('gonogo.title')}</h2><p>${t('prep.pollcc')}</p>${STATIONS.map((s, i) => `<div class="pt-st" data-st="${s}"><i></i><span>${t('st.' + s)}</span><em>${String(i + 1).padStart(2, '0')}</em></div>`).join('')}</div>`;
    $('.pt-hud', el)?.append(ov); const go = [];
    for (const s of STATIONS) { await ctx.wait(0.43); $(`[data-st="${s}"]`, ov)?.classList.add('pt-go'); go.push(s); sfx('ok', { vol: 0.5, rate: 1 + go.length * 0.05 }); ctx.cc.snap({ tasks: Object.keys(done), poll: go.slice(), n: MAIN.length }, true); }
    await ctx.wait(0.5); ctx.banner(t('prep.allgo'), '', 2400); sfx('powerup'); ctx.say('pa.go', { ms: 2500 }); await ctx.wait(2.2); ov.remove();
  }
}
