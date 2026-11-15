// FASE 4 · Descenso: P63/P64 automático, alarma 1202, toma de control a 300 m (P66), polvo, luz de contacto
import { THREE } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, h, clamp, damp, toast, achieve, fmt } from '../../core/util.js';
import { sfx, music, engine, stopEngine } from '../../core/audio.js';
import { clip, clips } from '../../audio/a11-cues.js';
import { axis, down, pressed, bindBtn, bdown, bpressed, makeStick, makeThrottle, input } from '../../core/input.js';
import { isTouch, DEBUG, shared, AUTO, store } from '../../core/store.js';
import { activePlan, computePlan, isNasaPlan, planNotes } from '../design/plan.js';
import { objectiveCardHtml } from '../../ui/flight-hud.js';
import { makeMoonSurface } from '../../scenes/moonsurface.js';
import { create, step, guide, agl, judge, hoverThr, brakingMargin, vsCue, LM, PAD, BOULDERS, ground } from '../../sim/lander.js';
import { attachLook } from '../../core/look.js';
import { playCue } from '../cutscenes/play.js';
import { storyInPhase, playStory } from '../story/flow.js';
import { ask, quiz, whatIf } from '../story/decisions.js';
import { flagOf, unlock } from '../story/state.js';
import { a11sfx } from '../../audio/a11-score.js';
import { bindOrbitControls } from '../orbit-view.js';
import { createOrbitState, applyPointerDelta, resolveOrbitPosition, stepOrbit } from '../orbit-camera.js';
extend({
  'd.1202bales': ['Armstrong pide una lectura. En Houston, todas las miradas van a Guiado: Steve Bales, 26 años.', 'Armstrong asks for a reading. In Houston, every eye turns to Guidance: Steve Bales, age 26.'],
  'd.p63': ['PROG 63 · Frenado', 'PROG 63 · Braking'], 'd.p64': ['PROG 64 · Aproximación', 'PROG 64 · Approach'], 'd.p66': ['PROG 66 · Manual', 'PROG 66 · Manual'],
  'd.watch': ['La computadora vuela. Observa la telemetría…', 'The computer is flying. Watch the telemetry…'], 'd.pressG': ['Pulsa G o GO', 'Press G or GO'],
  'd.hard': ['Alunizaje duro', 'Hard landing'], 'd.hardD': ['Una pata se dobló, pero estáis a salvo.', 'A leg bent, but you are safe.'],
  'd.why.vs': ['VELOCIDAD VERTICAL {v} m/s (máx {m})', 'VERTICAL SPEED {v} m/s (max {m})'], 'd.why.hs': ['VELOCIDAD LATERAL {v} m/s (máx {m})', 'LATERAL SPEED {v} m/s (max {m})'],
  'd.why.tilt': ['INCLINACIÓN {v}° (máx {m}°)', 'TILT {v}° (max {m}°)'], 'd.why.slope': ['PENDIENTE {v}° (máx {m}°)', 'SLOPE {v}° (max {m}°)'], 'd.why.rocks': ['Aterrizaste en el campo de rocas', 'You landed in the boulder field'],
  'd.skip': ['Continuar (sin puntos)', 'Continue (no points)'], 'd.view': ['VISTA', 'VIEW'], 'd.rod': ['ROD', 'ROD'], 'd.toPad': ['A la zona', 'To pad'],
  'd.keysF': ['A/D inclinar · W sube empuje · S baja hasta planeo · R asistente · C/V cámara', 'A/D tilt · W more thrust · S down to coast · R assist · C/V camera'],
  'd.rise': ['SUBIENDO por inercia. S hasta 0% (planeo): la gravedad lunar frena la subida. No hay motor hacia abajo.', 'RISING on momentum. Hold S to 0% (coast): lunar gravity slows the climb. There is no downward engine.'],
  'd.fall': ['BAJANDO. W frena antes del suelo. El mínimo no es suficiente si caes muy rápido.', 'DESCENDING. W brakes before the ground. Idle thrust will not stop a fast fall.'],
  'd.hold': ['Casi quieto. Alrededor del {h}% el peso y el empuje se equilibran.', 'Nearly still. About {h}% balances weight and thrust.'],
  'd.toomuch': ['Empuje por encima del peso: sigues subiendo. Mantén S.', 'Thrust is above weight: you are still climbing. Hold S.'],
  'd.coast': ['planeo', 'coast'],
  'd.norecover': ['Con el combustible que queda no puedes frenar esta caída. Reintenta desde los 300 m.', 'The fuel left cannot stop this fall. Retry from 300 m.'],
  'd.retry300': ['Reintentar desde 300 m', 'Retry from 300 m'],
  'd.abortNo': ['Era GO: la alarma no era grave.', 'It was GO: the alarm was harmless.'],
  'd.ffw': ['Acelerar', 'Speed up'],
  'd.site.tranquility': ['Mar de la Tranquilidad', 'Sea of Tranquility'], 'd.site.sinus': ['Sinus Medii', 'Sinus Medii'], 'd.site.highlands': ['Tierras altas', 'Highlands'],
});
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);

export default async function descent(ctx) {
  const D = ctx.diff, coop = ctx.cc.coop;
  // «Tu Apolo 11»: el lugar elegido ensancha el campo de rocas y estrecha la zona segura; BOULDERS/PAD son los del simulador y se restauran al salir
  const PL = computePlan(activePlan(ctx, store)); const rock0 = BOULDERS.r, pad0 = PAD.r;
  BOULDERS.r = PL.lander.boulderR; PAD.r = PL.lander.padR; ctx.onCleanup(() => { BOULDERS.r = rock0; PAD.r = pad0; });
  const W = makeMoonSurface({ seed: ctx.seed }); ctx.world(W); const cam = W.camera;
  const elSun = (PL.sunDeg || 11) * Math.PI / 180; W.sunDir.set(-Math.cos(elSun), Math.sin(elSun), 0.22).normalize();
  const tense = storyInPhase(ctx) ? 'a11/music/mus_c4_descenso_tension_pulso_loop' : 'tension';
  music(tense, { vol: 0.35 });
  const el = ctx.hud(`${objectiveCardHtml({ kicker: `${t('ph.n')} 04 · ${t('ph.descent')}`, titleHtml: `<div class="phase-title prog">${t('d.p63')}</div>`, bodyHtml: `<p class="mhud-note hint">${t('d.watch')}</p>` })}
    <aside class="mhud-rail"><div class="tele dtele"><div class="tele-grid">
      <div><div class="k">${t('d.alt')}</div><div class="v alt">—</div></div><div><div class="k">${t('d.vs')}</div><div class="v vs">—</div></div>
      <div><div class="k">${t('d.hs')}</div><div class="v hs">—</div></div><div><div class="k">${t('d.tilt')}</div><div class="v tlt">—</div></div>
      <div><div class="k">${t('d.thr')}</div><div class="v th">—</div></div><div><div class="k">${t('d.fuel')}</div><div class="v fu">—</div></div></div>
      <div class="vscue"> </div>
      <div class="fuelbar" style="height:4px;background:rgba(186,206,212,.18);margin-top:6px;overflow:hidden"><i style="display:block;height:100%;width:100%;background:var(--mhud-go,#8fbf9b)"></i></div>
      <div class="lamps"><span class="lampx l-prog">PROG</span><span class="lampx l-cont">CONTACT</span><span class="lampx l-rod">ROD</span></div>
      <div class="plan-chip" style="display:none;margin-top:8px;padding:6px 8px;background:#FFB000;color:#0B0C0E;font:700 12px/1.2 ui-monospace,monospace;letter-spacing:.08em">TU PLAN</div></div>
      <button class="btn ffw">${t('d.ffw')}</button></aside>
    <div class="bc lpd" style="display:none;width:min(420px,${isTouch ? 86 : 70}vw);${isTouch ? 'top:calc(168px + var(--safe-t));bottom:auto' : 'bottom:calc(18px + var(--safe-b))'}"><div class="strip" style="position:relative;height:8px;width:100%;background:rgba(7,12,16,.72);border:1px solid rgba(186,206,212,.32);overflow:hidden">
      <i class="rk" style="position:absolute;top:0;bottom:0;background:repeating-linear-gradient(45deg,rgba(211,106,92,.45) 0 6px,#0000 6px 12px)"></i><i class="pd" style="position:absolute;top:0;bottom:0;background:rgba(143,191,155,.4)"></i>
      <i class="me" style="position:absolute;top:0;width:8px;height:8px;margin-left:-4px;background:#e6eef1"></i></div><div class="phase-tag topad" style="margin-top:4px"></div></div>
    ${isTouch ? `<div class="tc-stick" style="display:none"><i></i></div><div class="tc-throttle" style="display:none"><div class="fill"></div><div class="lab">${t('d.thr')}</div></div>
      <button class="tc-btn mid rodbtn" style="display:none;right:calc(110px + env(safe-area-inset-right,0px));bottom:calc(150px + var(--safe-b))">${t('d.rod')}</button>` : ''}
    <button class="tc-btn mid viewbtn" style="display:none;right:calc(${isTouch ? 110 : 24}px + env(safe-area-inset-right,0px));bottom:calc(${isTouch ? 60 : 24}px + var(--safe-b))">${t('d.view')}</button>
    <div class="lpdret" style="display:none;position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,#0000 55%,#000c 80%)"><svg viewBox="-50 -50 100 100" style="position:absolute;left:50%;top:50%;width:min(60vw,60vh);transform:translate(-50%,-50%);opacity:.6"><g stroke="#ffb000" stroke-width=".4" fill="none"><line x1="-45" y1="0" x2="45" y2="0"/><line x1="0" y1="-45" x2="0" y2="45"/>${[-40, -30, -20, -10, 10, 20, 30, 40].map((y) => `<line x1="-3" y1="${y}" x2="3" y2="${y}"/>`).join('')}</g></svg></div>
    <div class="dustveil" style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 90% 45% at 50% 85%,#6e6456 0,#0000 75%);opacity:0"></div>
    <div class="alarm" style="display:none"></div>`);
  const hint = (k, v) => { $('.hint', el).textContent = v ?? t(k); }; const prog = (k) => { $('.prog', el).textContent = t(k); };
  const tele = $('.dtele', el); const V = (c) => $('.' + c, tele);
  let s = create({ x: -520, y: 1250, vx: 26, vy: -26, fuel: 1400 }); const fuel0 = 1400 * (D.fuel || 1) * PL.fuelMult; let mode = 'auto', view = 'ext', rod = false, rodUsed = false, frozen = false, thrTarget = 0.3, thrTouch = null, ffw = 1, chaseYaw = 0.9, fuelWarn = false;
  const orbitState = createOrbitState({ yaw: chaseYaw, pitch: 0.25, distance: 36, minDistance: 11, maxDistance: 120, damp: 6 });
  const camRig = bindOrbitControls(orbitState, { pointer: false, touch: true, allow: () => !frozen });
  ctx.onCleanup(() => camRig.dispose());
  const st = { alarmT: null, alarmOk: null, crashes: 0, hard: false, result: null };
  let thrUI = null; if (isTouch) { makeStick($('.tc-stick', el)); thrUI = makeThrottle($('.tc-throttle', el), (v) => (thrTouch = v)); bindBtn($('.rodbtn', el), 'rod'); }
  const pointerLook = attachLook({ onDelta: (dx, dy) => {
    if (orbitState.mode === 'orbit') { applyPointerDelta(orbitState, dx, dy); return; }
    if (mode === 'manual' && orbitState.mode === 'chase') chaseYaw -= dx * 0.004;
  } });
  ctx.onCleanup(() => pointerLook.dispose());
  bindBtn($('.viewbtn', el), 'view'); $('.ffw', el).onclick = () => { ffw = ffw === 1 ? 3 : 1; sfx('tick'); $('.ffw', el).classList.toggle('on', ffw > 1); };
  // cámara
  const camPos = new THREE.Vector3(-520, 1270, 120), look = new THREE.Vector3(); let shake = 0;
  if (DEBUG) window.__descDbg = { W, s: () => s, set: (o) => Object.assign(s, o), ground, snap: () => { for (let i = 0; i < 60; i++) camUpdate(0.1); } };
  const placeDescentOrbit = (dt) => {
    const p = W.lm.position;
    stepOrbit(orbitState, dt);
    const target = { x: p.x, y: p.y + 3.4, z: p.z };
    const pos = resolveOrbitPosition(target, orbitState.smoothYaw, orbitState.smoothPitch, orbitState.smoothDistance, {
      up: 'y', minDistance: orbitState.minDistance, subjectRadius: 6.2, margin: 0.6,
      floorAt: (x, _y, z) => ground(x, z) + 1.2,
    });
    cam.position.set(pos.x, pos.y, pos.z); cam.up.set(0, 1, 0); cam.lookAt(target.x, target.y, target.z); cam.fov = 50;
  };
  function camUpdate(dt) {
    camRig.poll();
    const owner = camRig.owner();
    view = owner === 'cockpit' ? 'win' : 'ext';
    $('.lpdret', el).style.display = owner === 'cockpit' ? '' : 'none';
    const p = W.lm.position, a = Math.max(0, agl(s));
    if (owner === 'orbit') placeDescentOrbit(dt);
    else if (owner === 'cockpit') { cam.position.set(p.x + 1.2, p.y + 4.2, 0.6); look.set(p.x + 30 + s.vx * 2, p.y - 12 - a * 0.35, 0); cam.lookAt(look); cam.fov = 62; }
    else {
      const dist = clamp(26 + Math.sqrt(Math.max(a, 0)) * 1.35, 24, 72) * (cam.aspect < 1 ? 1.35 : 1);
      const tgt = new THREE.Vector3(p.x + Math.sin(chaseYaw) * dist, p.y + 6 + Math.min(a * 0.015, 10), p.z + Math.cos(chaseYaw) * dist);
      // bajo 35 m la cámara baja a ras del suelo y se abre de lado: el polvo radial se lee como láminas contra el horizonte
      const w = clamp(1 - a / 35, 0, 1), wl = w * w * (3 - 2 * w), gy = p.y - a; tgt.y += (gy + 3.6 - tgt.y) * wl; tgt.x += 9 * wl; tgt.z += (34 - dist) * wl;
      camPos.x = damp(camPos.x, tgt.x, 3, dt); camPos.y = damp(camPos.y, tgt.y, 3, dt); camPos.z = damp(camPos.z, tgt.z, 2, dt); camPos.y = Math.max(camPos.y, ground(camPos.x) + 2.4); cam.position.copy(camPos);
      look.set(p.x, p.y + 2.2, 0); look.y += (gy + 2.2 - look.y) * wl * 0.35; cam.lookAt(look); cam.fov = 50 - 6 * wl;
    }
    if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; shake = Math.max(0, shake - dt * 2); }
    cam.updateProjectionMatrix();
  }
  // HUD
  const sec = () => s.fuel / (LM.burn * Math.max(0.15, hoverThr(s)));
  function drawHud() {
    if (frozen) return; const a = Math.max(0, agl(s));
    V('alt').textContent = a > 100 ? fmt(a) + ' m' : a.toFixed(1) + ' m';
    const cue = vsCue(s.vy);
    V('vs').textContent = (s.vy > 0 ? '+' : '') + s.vy.toFixed(1);
    const cueEl = $('.vscue', tele); if (cueEl) { cueEl.className = 'vscue ' + cue; const hv = Math.round(hoverThr(s) * 100); cueEl.textContent = cue === 'rise' ? (s.thr > hoverThr(s) + 0.05 ? t('d.toomuch') : t('d.rise')) : cue === 'fall' ? t('d.fall') : t('d.hold', { h: hv }); }
    V('hs').textContent = (s.vx > 0 ? '+' : '') + s.vx.toFixed(1); V('tlt').textContent = s.tilt.toFixed(0) + '°'; V('th').textContent = Math.round(s.thr * 100) + '%' + (s.thr < 0.02 ? ' · ' + t('d.coast') : '');
    const live = mode === 'manual'; V('fu').textContent = live ? Math.round(sec()) + ' s' : 'AUTO';
    V('vs').className = 'v vs ' + (a < 60 ? (Math.abs(s.vy) > 3 * D.tol ? 'bad' : Math.abs(s.vy) > 1.8 ? 'warn' : 'good') : ''); V('hs').className = 'v hs ' + (a < 60 ? (Math.abs(s.vx) > 1.5 * D.tol ? 'warn' : 'good') : '');
    V('fu').className = 'v fu ' + (live && sec() < 30 ? 'bad' : live && sec() < 60 ? 'warn' : '');
    const fb = $('.fuelbar i', tele); fb.style.width = (live ? (s.fuel / s.fuel0) * 100 : 100) + '%'; fb.style.background = live && sec() < 30 ? 'var(--red)' : live && sec() < 60 ? 'var(--amber)' : 'var(--go)';
    $('.l-rod', tele).classList.toggle('on', rod);
    if (mode === 'manual') { const span = 700, x0 = PAD.x - 450; const pc = (x) => clamp(((x - x0) / span) * 100, 0, 100);
      $('.me', el).style.left = pc(s.x) + '%'; const pd = $('.pd', el); pd.style.left = pc(PAD.x - PAD.r) + '%'; pd.style.width = pc(PAD.x + PAD.r) - pc(PAD.x - PAD.r) + '%';
      const rk = $('.rk', el); rk.style.left = pc(BOULDERS.x - BOULDERS.r) + '%'; rk.style.width = pc(BOULDERS.x + BOULDERS.r) - pc(BOULDERS.x - BOULDERS.r) + '%';
      const dx = PAD.x - s.x; $('.topad', el).textContent = `${t('d.toPad')}: ${dx > 0 ? '→' : '←'} ${Math.abs(dx).toFixed(0)} m`; }
    if (isTouch && thrUI) thrUI.show(s.thr);
    const chip = $('.plan-chip', el); if (chip) { const show = mode === 'manual'; chip.style.display = show ? '' : 'none'; if (show) chip.textContent = (store.get('lang') === 'en' ? 'YOUR PLAN' : 'TU PLAN') + ' · ~' + PL.marginSec + ' s'; }
    if (mode === 'manual' && !fuelWarn && brakingMargin(s) < 0 && a > 40) {
      fuelWarn = true;
      const o = h(`<div class="overlay"><div class="panel" style="max-width:460px;text-align:center"><h2>${t('d.norecover')}</h2><p class="mono">${t('d.fall')}</p><button class="btn primary">${t('d.retry300')}</button></div></div>`);
      el.append(o);
      $('button', o).onclick = () => { o.remove(); fuelWarn = false; s = Object.assign(create(), JSON.parse(ckpt)); handover(); };
    }
  }
  let landedCb = null, callouts = {};
  // bucle principal
  ctx.loop((dt0) => {
    const steps = mode === 'auto' || AUTO() ? ffw : 1; const dt = dt0;
    for (let k = 0; k < steps; k++) {
      let inp;
      if (mode === 'auto') inp = guide(s, BOULDERS.x);
      else if (mode === 'manual') {
        const ax = isTouch ? input.stick.x : axis().x; let tilt = clamp(ax, -1, 1);
        if (pressed('KeyR') || bpressed('rod')) { rod = !rod; if (rod) rodUsed = true; sfx('switch'); }
        if (down('KeyW', 'ArrowUp')) thrTarget += 0.7 * dt; if (down('KeyS', 'ArrowDown')) thrTarget -= 0.7 * dt; if (thrTouch != null) { thrTarget = thrTouch; thrTouch = null; } thrTarget = clamp(thrTarget, 0, 1);
        let thr = thrTarget; if (rod) { thr = guide(s, s.x, { rod: true, vyMax: 6 }).thr; thrTarget = thr; }
        if (AUTO()) { const g = guide(s, PAD.x); tilt = g.tilt; thr = g.thr; thrTarget = thr; }
        inp = { tilt, thr, burnFuel: true };
      } else break;
      step(s, inp, dt);
      if (mode !== 'done' && agl(s) <= 0.05) { s.y = ground(s.x); s.landed = true; landedCb?.(); break; }
    }
    W.setLM(s.x, s.y, s.tilt, s.thr, !s.landed && !s.out); engine(s.landed ? 0 : 0.25 + s.thr * 0.5, { low: 0.6 });
    const a = agl(s); $('.dustveil', el).style.opacity = clamp(W.dustAmount() * 0.45, 0, 0.38); if (a < 30 && !s.landed) shake = Math.max(shake, 0.05 * s.thr);
    camUpdate(dt0); drawHud();
    if (bpressed('view')) camRig.cycle();
    if (mode === 'manual') { const sc = sec(); for (const c of [60, 30]) if (sc < c && !callouts[c]) { callouts[c] = 1; ctx.banner(t('d.' + c), '', 1500, c === 30 ? 'warn' : ''); sfx('beep'); clip(c === 60 ? 'cap4_60_segundos' : 'cap4_30_segundos', { radio: true }); if (c === 60) ctx.say('pa.fuel', { ms: 3000 }); ctx.cc.log('d.' + c, null, 'warn'); }
      if (a < 15 && !s.landed && !callouts.dust) { callouts.dust = 1; clip('cap4_aldrin_polvo_40_pies', { radio: true }); }
      if (a < 1.6 && !s.landed && !callouts.c) { callouts.c = 1; $('.l-cont', tele).classList.add('on', 'blue'); W.contactL.intensity = 6; sfx('beep', { rate: 1.6 }); ctx.banner(t('d.contact'), '', 1200); clip('cap4_luz_de_contacto_apagado', { radio: true }); } }
    ctx.cc.snap({ alt: a, vs: s.vy, hs: s.vx, tilt: s.tilt, thr: s.thr, fuel: mode === 'manual' ? sec() : null, x: s.x, pad: PAD.x, mode, alarm: frozen });
  });
  // ---- 1) P63/P64 automático + alarma 1202 ----
  const sub = new URLSearchParams(location.search).get('sub');
  if (sub === 'p66') { Object.assign(s, { x: -40, vx: 14, vy: -9 }); s.y = ground(s.x) + 299; st.alarmOk = true; st.alarmT = 0; }
  else {
    ctx.banner(t('d.p63'), isNasaPlan(PL.plan) ? 'Eagle' : 'Eagle · ' + t('d.site.' + PL.plan.site), 2000); ctx.cc.log('d.p63');
    clips(['cap4_go_pdi', 'c4_42_collins_relevo_go_descenso_en'], { radio: true });
    await ctx.until(() => agl(s) < 1000); prog('d.p64'); ctx.cc.log('d.p64'); clip('c4_43_armstrong_vamos_largos_en', { radio: true });
    await ctx.until(() => agl(s) < 780);
    await alarm1202();
  }
  // ---- 2) toma de control ----
  await ctx.until(() => agl(s) < 300); ffw = AUTO() ? 3 : 1; $('.ffw', el).style.display = 'none';
  const ckpt = JSON.stringify(s);
  W.warn.visible = true; W.pad.visible = true; sfx('beep'); sfx('beep', { rate: 0.7 });
  async function handover() {
    mode = 'manual'; s.fuel = s.fuel0 = fuel0; thrTarget = hoverThr(s); rod = !!D.assist && ctx.diffName === 'cadet'; if (rod) rodUsed = true; callouts = {};
    prog('d.p66'); ctx.banner(t('d.control'), '', 2600, 'warn'); ctx.say('pa.control', { ms: 4000 }); ctx.cc.log('d.control', null, 'warn'); hint(null, isTouch ? '' : '');
    const note = planNotes(PL.plan)[0]; if (note && !isNasaPlan(PL.plan)) setTimeout(() => !ctx.dead && ctx.banner(note[store.get('lang') === 'en' ? 1 : 0], '', 3200, 'warn'), 2700);
    $('.lpd', el).style.display = ''; $('.viewbtn', el).style.display = ''; if (isTouch) ['.tc-stick', '.tc-throttle', '.rodbtn'].forEach((q) => ($(q, el).style.display = ''));
    $('.l-cont', tele).classList.remove('on', 'blue'); W.contactL.intensity = 0;
  }
  await handover(); music(tense, { vol: 0.5 });
  // ---- 3) alunizaje / reintentos ----
  let J;
  for (;;) {
    await new Promise((res) => { landedCb = res; const off = ctx.loop(() => { if (s.out && agl(s) < 0.1) res(); }); ctx.onCleanup(off); });
    landedCb = null; mode = 'done'; stopEngine(); J = judge(s, D); st.result = J.res; W.setLM(s.x, s.y, s.tilt, 0, false);
    if (s.out && J.res === 'good') J.res = 'hard';
    if (J.res === 'good') { sfx('thud'); clip('cap4_base_tranquilidad_eagle_aterrizado', { radio: true }); ctx.banner(t('d.landed'), 'Tranquility Base', 3200, 'good'); ctx.say('pa.landed', { ms: 3500 }); ctx.cc.log('d.landed', null, 'ok'); playCue('eagle', { anchor: () => W.lm, ctx }); if (J.vs < 1 && J.pad < PAD.r) achieve('soft'); if (!rodUsed) achieve('noassist'); if (sec() > 60) achieve('fuel'); break; }
    if (J.res === 'hard') { sfx('thud'); sfx('clunk'); shake = 0.8; st.hard = true; W.body.rotation.x = 0.08; ctx.banner(t('d.hard'), t('d.hardD'), 2800, 'warn'); ctx.cc.log('d.hard', null, 'warn'); break; }
    // crash
    st.crashes++; sfx('explosion'); shake = 2.2; W.body.visible = false; const why = J.why ? fill(t('d.why.' + J.why), { v: (J.why === 'vs' ? J.vs : J.why === 'hs' ? J.hs : J.why === 'tilt' ? J.tilt : J.slope).toFixed(1), m: J.L[J.why] && (+J.L[J.why]).toFixed(1) }) : t(s.out ? 'd.fuelout' : 'd.crashD');
    if (st.crashes === 1 && (s.out || J.why === 'rocks')) await whatIf({ title: s.out ? ['¿Y si…? Combustible cero', 'What if…? Zero fuel'] : ['¿Y si…? Una pata en una roca', 'What if…? A foot on a rock'], text: s.out ? ['Sin combustible el Eagle no frena. En 1969 el aviso de bajo nivel sonó con unos 45 segundos de margen, y Armstrong posó antes.', 'With no fuel Eagle cannot brake. In 1969 the low-level light came on with about 45 seconds left, and Armstrong set it down first.'] : ['Una pata sobre una roca inclina el módulo. El sitio llano de la Tranquilidad se eligió para que eso no pasara.', 'A foot on a rock tips the module. Tranquility’s flat site was chosen so that would not happen.'] });
    ctx.cc.log('d.crash', { why }, 'bad');
    const choice = await new Promise((res) => { const o = h(`<div class="overlay crashbox"><div class="panel" style="max-width:440px;text-align:center"><h2 style="color:var(--red)">${t(s.out ? 'd.fuelout' : 'd.crash')}</h2><p class="mono">${why}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px"><button class="btn primary r">${t('d.retry')}</button>${st.crashes >= 1 ? `<button class="btn s">${t('d.skip')}</button>` : ''}</div></div></div>`); el.append(o);
      $('.r', o).onclick = () => { o.remove(); res('retry'); }; $('.s', o) && ($('.s', o).onclick = () => { o.remove(); res('skip'); }); if (AUTO()) setTimeout(() => { o.remove(); res('retry'); }, 500); });
    if (choice === 'skip') { st.result = 'skip'; break; }
    s = Object.assign(create(), JSON.parse(ckpt)); W.body.visible = true; W.body.rotation.x = 0; await handover();
  }
  $('.lpd', el).style.display = 'none'; if (isTouch) ['.tc-stick', '.tc-throttle', '.rodbtn'].forEach((q) => ($(q, el).style.display = 'none'));
  W.pad.visible = false; W.warn.visible = false; $('.viewbtn', el).style.display = 'none';
  // plano lento sobre el LM posado; la órbita libre y la cabina lo sustituyen, y el raíl de la cinemática sigue ganando
  let ang = 0; ctx.loop((dt) => {
    if (camRig.owner() !== 'chase') return;
    ang += dt * 0.25; const p = W.lm.position; cam.position.set(p.x + Math.sin(ang) * 26, p.y + 7, Math.cos(ang) * 26); cam.lookAt(p.x, p.y + 3, 0);
  });
  await ctx.wait(3.5);
  // cap. 4.6–4.7: Houston respira y la familia Armstrong lo oye por la squawk box (solo alunizaje limpio)
  if (st.result === 'good' && storyInPhase(ctx)) { for (const id of ['mocr-landed', 'house-landed']) { if (ctx.dead) break; const r = await playStory(id, { ctx }); if (r.skipped) break; } }
  let score = 0; if (st.result === 'good' || st.result === 'hard') {
    const q = clamp(1 - J.over * 0.6, 0, 1); const fuelS = clamp(s.fuel / s.fuel0 / 0.4, 0, 1); const padS = clamp(1 - J.pad / (PAD.r * 3), 0, 1);
    score = (st.result === 'good' ? 40 + q * 15 : 22) + fuelS * 15 + (st.alarmOk ? 15 : 5) + padS * 15 - st.crashes * 10; if (rodUsed) score *= 0.7; score = Math.round(clamp(score, 5, 100));
  }
  shared.landing = { x: s.x, res: st.result };
  return { score, stats: { site: PL.plan.site, rockR: PL.lander.boulderR, padR: PL.lander.padR, fuelMult: PL.fuelMult, result: st.result, vs: J ? +J.vs.toFixed(2) : null, hs: J ? +J.hs.toFixed(2) : null, fuel: Math.round(sec()), pad: J ? Math.round(J.pad) : null, alarm: st.alarmT, crashes: st.crashes, rod: rodUsed } };

  // Cap. 4.4 en el modo historia: Armstrong informa y la decisión es de Houston. El jugador pasa a ser Steve Bales (10 s).
  async function alarmAsBales(box) {
    box.innerHTML = `<div class="panel alarmpanel" style="text-align:center;border-color:var(--red)"><div class="mono" style="color:var(--red);font-size:clamp(34px,8vw,64px);letter-spacing:.1em">1202</div><h3>${t('d.1202')}</h3><p>${t('d.1202bales')}</p></div>`;
    ctx.cc.log('d.1202', null, 'bad'); a11sfx('c4_44_alarma_programa_tono_casco', 0.7);
    const pm = mode; mode = 'hold'; await ctx.wait(2.4); box.style.display = 'none'; if (ctx.dead) return;
    const opt = await ask('c4-1202'); if (ctx.dead) return;
    st.alarmT = flagOf('bales-secs') ?? 10; st.alarmOk = opt === 'go' && st.alarmT <= 5;
    if (opt === 'abort') await whatIf({ title: ['¿Y si…? Aborto a órbita', 'What if…? Abort to orbit'],
      text: ['Eagle separa la etapa de descenso y vuelve con Collins. El mundo espera. En la historia real el primer alunizaje se habría retrasado: el Apolo 12 estaba previsto para noviembre de 1969. Pero Bales dijo GO.', 'Eagle stages and returns to Collins. The world waits. In real history the first landing would have slipped: Apollo 12 was planned for November 1969. But Bales said GO.'] });
    if (ctx.dead) return;
    await playStory('mocr-1202', { ctx, answer: opt === 'timeout' ? 'late' : 'go' }); if (ctx.dead) return;
    if (opt === 'go' && st.alarmT < 3 && await quiz(['¿Por qué era seguro seguir con la alarma 1202?', 'Why was it safe to continue with the 1202 alarm?'], [
      { id: 'a', label: ['La computadora se sobrecargaba, pero priorizaba las tareas críticas y se reiniciaba sin perder el guiado', 'The computer was overloaded, but it prioritized critical tasks and restarted without losing guidance'] },
      { id: 'b', label: ['La alarma era un fallo del radar de aterrizaje que se arregló solo', 'The alarm was a landing radar fault that fixed itself'] },
      { id: 'c', label: ['Houston podía pilotar el Eagle a distancia', 'Houston could fly Eagle remotely'] }], 'a')) unlock('h-hamilton');
    if (ctx.dead) return;
    sfx('ok'); ctx.banner('GO', '', 1200, 'good'); ctx.cc.log('pa.go', null, 'ok');
    frozen = false; tele.classList.remove('frozen'); el.classList.remove('frozen'); $('.l-prog', tele).classList.remove('on', 'red'); mode = pm;
  }

  async function alarm1202() {
    frozen = true; tele.classList.add('frozen'); el.classList.add('frozen'); $('.l-prog', tele).classList.add('on', 'red');
    const box = $('.alarm', el); box.style.display = ''; box.className = 'alarm overlay'; const remote = coop && ctx.cc.remote();
    if (!remote && storyInPhase(ctx)) return alarmAsBales(box);
    box.innerHTML = `<div class="panel alarmpanel" style="text-align:center;border-color:var(--red)"><div class="mono" style="color:var(--red);font-size:clamp(34px,8vw,64px);letter-spacing:.1em" >1202</div><h3>${t('d.1202')}</h3><p>${t('d.1202d')}</p>
      ${remote ? `<p class="mono">${t('d.waitCapcom')}</p>` : `<div style="display:flex;gap:10px;justify-content:center"><button class="btn primary go">${t('d.go')}</button><button class="btn ab">${t('d.abort')}</button></div><p class="phase-tag" style="margin-top:8px">${t('d.pressG')}</p>`}<div class="atimer" style="height:4px;background:var(--red);margin-top:10px;transform-origin:left"></div></div>`;
    ctx.cc.log('d.1202', null, 'bad'); const t0 = ctx.time; let beepT = 0; const offB = ctx.loop((dt) => { beepT -= dt; if (beepT <= 0) { beepT = 0.7; sfx('beep', { rate: 1.3, vol: 0.5 }); } $('.atimer', box).style.transform = `scaleX(${clamp(1 - (ctx.time - t0) / 5, 0, 1)})`; });
    if (!remote) setTimeout(() => !ctx.dead && ctx.say('pa.1202', { ms: 4000 }), 1600);
    const ans = await new Promise((res) => {
      if (remote) ctx.cc.ask('1202', {}, async () => true, 8).then((v) => res(v === false ? 'abort' : 'go'));
      else { $('.go', box).onclick = () => res('go'); $('.ab', box).onclick = () => res('abort'); const off = ctx.loop(() => { if (pressed('KeyG') || AUTO()) { off(); res('go'); } }); }
    });
    offB(); st.alarmT = +(ctx.time - t0).toFixed(1); st.alarmOk = ans === 'go' && st.alarmT <= 5; box.style.display = 'none';
    if (ans === 'go') { sfx('ok'); ctx.banner('GO', st.alarmT <= 5 ? '' : '+5 s', 1200, 'good'); ctx.cc.log('pa.go', null, 'ok'); } else { sfx('error'); ctx.banner(t('d.abortNo'), '', 2400, 'warn'); }
    // cap. 4.4: la reacción de Houston a tu respuesta (simulación congelada mientras dura)
    if (storyInPhase(ctx)) { const pm = mode; mode = 'hold'; await playStory('mocr-1202', { ctx, answer: ans === 'go' ? (st.alarmT <= 5 ? 'go' : 'late') : 'abort' }); if (ctx.dead) return; mode = pm; }
    if (!st.alarmOk) await ctx.wait(3);
    frozen = false; tele.classList.remove('frozen'); el.classList.remove('frozen'); $('.l-prog', tele).classList.remove('on', 'red');
  }
}
