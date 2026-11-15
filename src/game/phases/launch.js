// FASE 2 · Lanzamiento: cuenta regresiva, despegue, corredor de cabeceo, Max-Q, 3 separaciones
import { THREE, renderer } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, $$, h, toast, achieve, clamp, damp, fmt } from '../../core/util.js';
import { sfx, music, engine, stopEngine, rumble, stopRumble } from '../../core/audio.js';
import { clip, clips } from '../../audio/a11-cues.js';
import { axis, down, pressed, bindBtn, bdown, bpressed, makeStick, makeThrottle, input } from '../../core/input.js';
import { isTouch, DEBUG, dbg, AUTO } from '../../core/store.js';
import { storyInPhase } from '../story/flow.js';
import { launchPrompt, objectiveCardHtml } from '../../ui/flight-hud.js';
import { paintPrompt } from '../../ui/flight-hud-mount.js';
import { makePad, H, BASE_Y } from '../../scenes/pad.js';
import { BEACH } from '../../scenes/ksc-crowd.js';
import { trackFov, sideAxis, chaseStand, trackStand } from '../launch-camera.js';
import { playCue } from '../cutscenes/play.js';
import { bindOrbitControls } from '../orbit-view.js';
import { createOrbitState, resolveOrbitPosition, stepOrbit } from '../orbit-camera.js';
extend({
  'l.tminus': ['T-', 'T-'], 'l.skip': ['Saltar cuenta', 'Skip countdown'], 'l.stress': ['ESTRÉS', 'STRESS'], 'l.thr': ['EMPUJE', 'THRUST'],
  'l.les': ['¡Expulsa la torre de escape!', 'Jettison the escape tower!'], 'l.waitcc': ['Esperando que Control de Misión separe…', 'Waiting for Mission Control to stage…'],
  'l.keys': ['A/D o ←/→ cabeceo · W/S empuje · ESPACIO separar · C/V cámara', 'A/D or ←/→ pitch · W/S thrust · SPACE stage · C/V camera'], 'l.corr': ['CORREDOR', 'CORRIDOR'],
  'l.beach': ['Playa de Cabo Kennedy · 16 de julio de 1969', 'Cape Kennedy beach · July 16, 1969'], 'l.beachS': ['Cerca de un millón de personas miran desde las playas y carreteras', 'About a million people watch from the beaches and roads'],
  'l.ign': ['Secuencia de ignición', 'Ignition sequence'],
  'l.offWarn': ['¡FUERA DE TRAYECTORIA! Vuelve al corredor (A/D)', 'OFF COURSE! Get back in the corridor (A/D)'],
  'l.qWarn': ['¡ESTRUCTURA AL LÍMITE! Baja el empuje (S)', 'STRUCTURE AT LIMIT! Throttle down (S)'],
  'l.sepGood': ['Separación limpia', 'Clean separation'], 'l.sepBad': ['¡Fallo! Los pernos no cedieron: intenta otra vez', 'Miss! The bolts did not let go: try again'],
  'l.sepBar': ['SEPARACIÓN · pulsa ESPACIO en la zona verde', 'STAGING · press SPACE in the green zone'], 'l.sepBarT': ['SEPARACIÓN · toca SEPARAR en la zona verde', 'STAGING · tap STAGE in the green zone'],
  'l.sepNow': ['¡Separa YA!', 'Stage NOW!'], 'l.tries': ['Intentos', 'Tries'],
  'l.roll': ['PROGRAMA DE ROLIDO · gira hasta el rumbo 72° (Q / E) y sostenlo', 'ROLL PROGRAM · roll to heading 72° (Q / E) and hold it'],
  'l.rollT': ['PROGRAMA DE ROLIDO · gira hasta 72° con IZQ / DER y sostenlo', 'ROLL PROGRAM · roll to 72° with L / R and hold it'],
  'l.rollL': ['IZQ', 'L'], 'l.rollR': ['DER', 'R'],
  'l.rollOk': ['Programa de rolido completo', 'Roll program complete'], 'l.rollAuto': ['La computadora terminó el rolido por ti', 'The computer finished the roll for you'],
  'l.f.roll': ['El Saturn V nunca giró a su rumbo de vuelo y se desvió hacia la costa: el oficial de seguridad del campo lo destruyó.', 'The Saturn V never rolled to its flight heading and veered toward the coast: the Range Safety Officer destroyed it.'],
  'l.f.rollF': ['Real: a los pocos segundos de despegar, el Apolo 11 giró sobre su eje desde el rumbo de la plataforma (90°) al de vuelo, unos 72°.', 'Real: seconds after liftoff, Apollo 11 rolled from the pad heading (90°) to its flight heading, about 72°.'],
  'l.boom': ['MISIÓN PERDIDA', 'MISSION LOST'], 'l.retry': ['Reintentar despegue', 'Retry launch'], 'l.quit': ['Salir al menú', 'Quit to menu'],
  'l.f.range': ['El Saturn V se salió de su trayectoria y el oficial de seguridad del campo activó la destrucción.', 'The Saturn V left its trajectory and the Range Safety Officer triggered destruct.'],
  'l.f.rangeF': ['Real: cada Saturn V llevaba cargas de destrucción. Si se desviaba hacia zonas pobladas, el oficial de seguridad del campo (Range Safety) lo destruía.', 'Real: every Saturn V carried destruct charges. If it veered toward populated areas, the Range Safety Officer would destroy it.'],
  'l.f.maxq': ['Pasaste Max-Q con todo el empuje: la presión del aire dobló la estructura y el cohete se partió.', 'You went through Max-Q at full thrust: air pressure buckled the structure and the rocket broke apart.'],
  'l.f.maxqF': ['Real: Max-Q es el momento de máxima presión aerodinámica, poco más de un minuto después del despegue. El vuelo se planificaba para que la estructura la soportara.', 'Real: Max-Q is the moment of peak aerodynamic pressure, a little over a minute after liftoff. The flight was planned so the structure could take it.'],
  'l.f.stage': ['La etapa vacía no se separó a tiempo y chocó con la siguiente al encenderse.', 'The spent stage did not separate in time and hit the next one as it lit.'],
  'l.f.stageF': ['Real: en cada separación, pequeños cohetes alejaban la etapa vacía y asentaban el combustible de la siguiente antes de encenderla.', 'Real: at each separation, small rockets pushed the spent stage away and settled the next stage’s fuel before ignition.'], 'l.iss': ['Inicio de la secuencia de ignición', 'Ignition sequence start'], 'l.throk': ['Todos los motores en marcha', 'All engines running'], 'l.hdr': ['Liberación de los anclajes', 'Hold-down release'], 'l.sep': ['Separación', 'Separation'], 'l.maxqok': ['Max-Q superado', 'Through Max-Q'],
});
const DUR = 72; // s de vuelo comprimido
const STG = [ // fin de cada quema (t), aceleración base
  { end: 24, a: 38, name: 'S-IC' }, { end: 52, a: 58, name: 'S-II' }, { end: DUR, a: 46, name: 'S-IVB' },
];
const target = (s) => (s < 5 ? 90 : s > DUR ? 12 : 90 - (78 * Math.pow((s - 5) / (DUR - 5), 0.8)));

export default async function launch(ctx) {
  const W = makePad(); ctx.world(W); ctx.onCleanup(() => { W.dispose(); stopRumble(); }); const cam = W.camera; cam.far = 60000; cam.near = 1; cam.updateProjectionMatrix();
  const orbit = createOrbitState({ yaw: Math.PI / 2, pitch: 0.18, distance: 260, minDistance: 22, maxDistance: 1600, damp: 6 });
  const camRig = bindOrbitControls(orbit);
  ctx.onCleanup(() => camRig.dispose());
  const noseOf = (R, up, along) => ({ x: R.position.x + up.x * along, y: R.position.y + up.y * along, z: R.position.z + up.z * along });
  const placeLaunchOrbit = (dt, R) => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(R.quaternion);
    stepOrbit(orbit, dt);
    const mid = noseOf(R, up, 52);
    const pos = resolveOrbitPosition(mid, orbit.smoothYaw, orbit.smoothPitch, orbit.smoothDistance, {
      up: 'y', minDistance: orbit.minDistance, margin: 1.2,
      capsules: [
        { ax: R.position.x, ay: R.position.y, az: R.position.z, bx: noseOf(R, up, 106).x, by: noseOf(R, up, 106).y, bz: noseOf(R, up, 106).z, r: 12 },
        { ax: -22, ay: 0, az: 0, bx: -22, by: BASE_Y + 130, bz: 0, r: 16 },
      ],
      floorAt: (x, _y, z) => (Math.hypot(x, z) < 48 ? BASE_Y + 1.6 : 1.4),
    });
    cam.position.set(pos.x, pos.y, pos.z); cam.up.set(0, 1, 0); cam.lookAt(mid.x, mid.y, mid.z);
    if (Math.abs(cam.fov - 46) > 0.4 || cam.near !== 0.6) { cam.fov = 46; cam.near = 0.6; cam.far = 60000; cam.updateProjectionMatrix(); }
  };
  const placeLaunchCockpit = (R) => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(R.quaternion);
    const ax = sideAxis(up.x, up.y, up.z);
    const seat = noseOf(R, up, 92);
    const lateral = 16;
    cam.position.set(seat.x + ax[0] * lateral, seat.y + ax[1] * lateral, seat.z + ax[2] * lateral);
    const flank = noseOf(R, up, 46);
    cam.up.set(0, 1, 0);
    cam.lookAt(flank.x + ax[0] * 5, flank.y + ax[1] * 5, flank.z + ax[2] * 5);
    if (Math.abs(cam.fov - 50) > 0.4 || cam.near !== 0.4) { cam.fov = 50; cam.near = 0.4; cam.far = 60000; cam.updateProjectionMatrix(); }
  };
  const coop = ctx.cc.coop, D = ctx.diff, tol = 7 * D.tol;
  music(storyInPhase(ctx) ? 'a11/music/mus_c2_cuenta_regresiva_tension' : 'tension', { vol: 0.4 });
  const el = ctx.hud(`${objectiveCardHtml({ kicker: `${t('ph.n')} 02 · ${t('ph.launch')}`, titleHtml: '<div class="phase-title">Saturn V</div>', bodyHtml: `<p class="mhud-note">${t('l.hint')}</p>` })}
    <aside class="mhud-rail"><div class="tele"><div class="tele-grid">
      <div><div class="k">${t('l.alt')}</div><div class="v v-alt">0 km</div></div><div><div class="k">${t('l.vel')}</div><div class="v v-vel">0 m/s</div></div>
      <div><div class="k">${t('l.pitch')}</div><div class="v v-pitch">90°</div></div><div><div class="k">${t('l.stage')}</div><div class="v v-stage">S-IC</div></div>
      <div><div class="k">${t('l.thr')}</div><div class="meter"><i class="m-thr" style="width:0;background:var(--mhud-warn,#d4a24c)"></i></div></div>
      <div><div class="k">${t('l.stress')}</div><div class="meter"><i class="m-str" style="width:0;background:var(--mhud-bad,#d36a5c)"></i></div></div></div></div></aside>
    <div class="${isTouch ? 'tc' : 'bl'} adibox" style="opacity:0;transition:opacity .35s;${isTouch ? 'top:calc(64px + var(--safe-t))' : ''}"><svg class="adi" viewBox="-110 -110 130 130" width="${isTouch ? 96 : 132}">
      <path d="M-110 0 L-110 -110 L0 -110" fill="none"/><path d="M-100 0 A100 100 0 0 1 0 -100 L0 0Z" fill="#070c10bb"/><path d="M-100 0 A100 100 0 0 1 0 -100" fill="none" stroke="#ffffff22" stroke-width="10"/>
      <path class="corr" fill="none" stroke="#8fbf9baa" stroke-width="10"/>
      <line class="ndl" x1="0" y1="0" x2="0" y2="-104" stroke="#e6eef1" stroke-width="2" stroke-linecap="round"/>
      <line class="tgt" x1="0" y1="-84" x2="0" y2="-116" stroke="#c6a36a" stroke-width="2"/>
      <circle r="4" fill="#e6eef1"/><text x="-50" y="16" fill="#93a4ab" font-size="10" font-family="Chakra,sans-serif" text-anchor="middle">${t('l.corr')}</text></svg></div>
    <div class="cdown" style="position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none"><div class="phase-tag">${t('l.ign')}</div><div class="big" style="font-family:Chakra,sans-serif;font-weight:700;font-size:clamp(48px,12vw,96px)">T-10</div></div>
    <button class="btn skipcd" style="position:absolute;left:50%;bottom:calc(16px + var(--safe-b));transform:translateX(-50%)">${t('l.skip')}</button>
    ${isTouch ? `<div class="tc-stick"><i></i></div><div class="tc-throttle"><div class="fill"></div><div class="lab">${t('l.thr')}</div></div><div class="tc-btn big amber stagebtn" style="right:calc(110px + env(safe-area-inset-right,0px));bottom:calc(30px + var(--safe-b));display:none">${t('l.stage')}</div><div class="tc-btn mid rollL" style="right:calc(200px + env(safe-area-inset-right,0px));bottom:calc(120px + var(--safe-b));display:none">${t('l.rollL')}</div><div class="tc-btn mid rollR" style="right:calc(110px + env(safe-area-inset-right,0px));bottom:calc(120px + var(--safe-b));display:none">${t('l.rollR')}</div>` : ''}
    <div class="alarmbox"></div>`);
  let thrTouch = null; let thrUI = null;
  if (isTouch) { makeStick($('.tc-stick', el)); thrUI = makeThrottle($('.tc-throttle', el), (v) => (thrTouch = v)); bindBtn($('.stagebtn', el), 'stage'); }
  const adiN = $('.ndl', el), adiT = $('.tgt', el), corr = $('.corr', el);
  const arcPath = (a0, a1) => { const p = (a) => { const r = (a * Math.PI) / 180; return `${(-Math.cos(r) * 100).toFixed(1)} ${(-Math.sin(r) * 100).toFixed(1)}`; }; return `M${p(clamp(a0, 0, 90))} A100 100 0 0 1 ${p(clamp(a1, 0, 90))}`; };
  // ---------- cuenta regresiva ----------
  await W.ready; W.rocket.rotation.set(0, 0, 0); await Promise.race([W.envReady, ctx.wait(4)]);
  try { await W.warmShaders(); } catch (e) { console.warn('precompile', e); }
  let padCam = null; if (DEBUG) window.__padDbg = { W, cam: (p, l) => (padCam = p ? { p, l } : null), S: () => S, ct: (v) => (v == null ? ct : (ct = v)), programs: () => renderer.info.programs?.length || 0, exposure: () => renderer.toneMappingExposure };
  const applyPadCam = () => { if (!padCam) return false; const o = padCam.l ? new THREE.Vector3() : W.rocket.position; cam.position.set(...padCam.p).add(o); cam.lookAt(new THREE.Vector3(...(padCam.l || [0, 50, 0])).add(o)); return true; };
  // planos: órbita lenta durante la cuenta; desde la ignición, cámara baja a 270 m con un leve acercamiento (el plano clásico de la película de 70 mm)
  const DY = BASE_Y - 7.62, LOWCAM = new THREE.Vector3(75, W.env ? BASE_Y + 8 : 8 + DY, 262), lowLook = new THREE.Vector3(0, 52 + DY, 0), orbP = new THREE.Vector3(); let shotA = 0, toLow = 0;
  // cap. 2: primer plano de la cuenta desde la playa, detrás del público (ksc-crowd.glb), hasta T-12 o hasta saltar la cuenta
  let beachShown = false; const BEACH_END = 4.5;
  ctx.loop((dt) => {
    if (S.phase !== 'count') return; camRig.poll(); if (applyPadCam()) return;
    const owner = camRig.owner();
    if (owner === 'orbit') { placeLaunchOrbit(dt, W.rocket); return; }
    if (owner === 'cockpit') { placeLaunchCockpit(W.rocket); return; }
    if (W.crowd && ct < BEACH_END && !skip) {
      if (!beachShown) { beachShown = true; toast(t('l.beach') + ' · ' + t('l.beachS'), 'info'); } // toast: no tapa el número de la cuenta
      cam.position.set(30, BASE_Y + BEACH.y + 2.6, BEACH.z - 13); cam.lookAt(-40, BASE_Y + 24, 0); return; }
    if (S.phase === 'count') { shotA += dt * 0.05; orbP.set(Math.sin(shotA + 0.9) * 290, 30 + DY, Math.cos(shotA + 0.9) * 290);
    if (S.ign) toLow = Math.min(1, toLow + dt * 0.6); const e = toLow * toLow * (3 - 2 * toLow); const push = 1 - Math.max(0, ct - (LIFT - 8.9)) * 0.012;
    cam.position.lerpVectors(orbP, LOWCAM, e); if (e > 0) { const k = 1 - (1 - push) * e; cam.position.x *= k; cam.position.z *= k; }
    const look = new THREE.Vector3(0, 62 + DY, 0).lerp(lowLook, e);
    if ([cam.position.x, cam.position.y, cam.position.z, look.x, look.y, look.z].every(Number.isFinite)) cam.lookAt(look); } });
  const S = { phase: 'count', s: 0, alt: 0, vel: 0, vx: 0, vy: 0, pitch: 90, thr: 1, stage: 0, stress: 0, inCorr: 0, samples: 0, stageDelay: [], maxQ: 0, gust: 0 };
  let skip = false; $('.skipcd', el).onclick = () => (skip = true);
  const v = clips(['cap2_cuenta_regresiva_despegue'], { radio: true }); ctx.onCleanup(() => v?.stop?.());
  const LIFT = 17; let ct = 0;
  // ignición real: T-8.9 inicio de secuencia; motor central primero y luego los pares opuestos (1-2-2, ~300 ms); empuje pleno ~T-2; anclajes a T-0
  const T_ENG = [0, 0.3, 0.3, 0.6, 0.6], RAMP = 2.4, ks = [0, 0, 0, 0, 0]; let thrOk = false;
  await new Promise((res) => ctx.loop((dt) => {
    if (S.phase !== 'count') return; ct += dt; if (skip && ct < LIFT - 3) { ct = LIFT - 3; v.stop(); }
    const tm = Math.ceil(LIFT - ct); $('.cdown .big', el).textContent = tm > 0 ? `T-${tm}` : t('l.liftoff');
    W.arms.forEach((a, i) => { if (ct > LIFT - 8 + i * 0.6) a.rotation.y = damp(a.rotation.y, 1.4, 1.5, dt); });
    if (ct > LIFT - 7.2) W.retractArms(); // clip 'swing-arms-retract' (7 s): el CAA primero, luego 8→1
    if (ct > LIFT - 8.9 && !S.ign) { S.ign = true; sfx('boom', { vol: 0.5 }); $('.cdown .phase-tag', el).textContent = t('l.iss'); navigator.vibrate?.(40); }
    let k = 0;
    if (S.ign) { const te = ct - (LIFT - 8.9) - 1.2; // ~1.2 s de purga/encendido de la turbobomba antes del primer motor
      for (let i = 0; i < 5; i++) { const u = clamp((te - T_ENG[i]) / RAMP, 0, 1); ks[i] = u * u * (3 - 2 * u); if (u > 0 && u < 0.08 && !ks['f' + i]) { ks['f' + i] = 1; sfx('thud', { vol: 0.35, rate: 0.6 }); } }
      k = ks.slice(0, 5).reduce((a, b) => a + b, 0) / 5; W.fuelRich = clamp(1 - te / 2.6, 0, 1);
      if (k > 0.98 && !thrOk) { thrOk = true; $('.cdown .phase-tag', el).textContent = t('l.throk'); }
      W.setEngines(ks.slice(0, 5)); W.setThrust(k); W.emit(dt, k); W.shake = 0.25 + k * 1.1; engine(0.35 + k * 0.6); rumble(0.25 + k * 0.75, k * 0.8); }
    else W.emit(dt, 0);
    W.update(dt, ctx.time);
    if (ct >= LIFT) { S.phase = 'fly'; res(); }
  }));
  $('.skipcd', el).remove(); setTimeout(() => $('.cdown', el)?.remove(), 1200);
  if (isTouch) $('.stagebtn', el).style.display = ''; $('.adibox', el).style.opacity = 1;
  music('launch', { vol: 0.5 }); sfx('explosion', { vol: 0.5 }); sfx('clunk', { vol: 0.7, rate: 0.7 }); W.phase = 'fly'; W.shake = 2.2;
  ctx.banner(t('l.liftoff'), t('l.hdr'), 1800); ctx.cc.log('l.liftoff', null, 'ok'); navigator.vibrate?.([30, 30, 60]);
  playCue('liftoff', { anchor: () => W.rocket, ctx });
  // ---------- vuelo ----------
  let waitingStage = null, lesDone = false, maxQsaid = false, cleared = false;
  const pitchAxis = () => axis().x;
  const doStage = (i) => {
    if (W.parts[i]?.free) return; W.stage(i); sfx('stage'); sfx('clunk', { vol: 0.6 }); W.shake = 2.5; navigator.vibrate?.(60);
    ctx.banner(t('l.sep'), i === 3 ? 'LES' : STG[i].name, 1300); ctx.cc.log('pa.stage', null, 'ok');
    if (i === 0) playCue('separation', { anchor: () => W.rocket, ctx });
  };
  async function stagePrompt(i) {
    const t0 = S.s; waitingStage = i; ctx.banner(t('l.stageNow'), '', 1500, 'warn'); sfx('computer', { vol: 0.6 }); ctx.say('pa.stage', { ms: 2000 });
    $('.alarmbox', el).innerHTML = '<div class="alarm"></div>';
    if (coop && ctx.cc.remote()) {
      toast(t('l.waitcc'), 'info');
      await Promise.race([ctx.cc.ask('stage', { i }, async () => { await ctx.wait(0.8); return true; }, 12), ctx.until(() => waitingStage === null)]);
    } else if (canFail) {
      // Minijuego: la aguja va y viene; ESPACIO (o SEPARAR) dentro de la franja verde = separación limpia.
      // Fuera de la franja = separación brusca (+estrés). Dos bruscas o no pulsar en 3 barridos = las etapas chocan.
      const ok = await stageBar(i); if (ok === 'dead' || ctx.dead) return;
    } else {
      await ctx.until(() => waitingStage === null || (D.assist && S.s - t0 > 6));
    }
    if (S.phase !== 'fly') return;
    S.stageDelay.push(S.s - t0); waitingStage = null; $('.alarmbox', el).innerHTML = ''; doStage(i);
    S.coast = 1.0; // segundo de inercia antes de la siguiente ignición
  }
  // ---------- separación con barra de tiempo ----------
  function stageBar(i) {
    return new Promise((res) => {
      const box = $('.alarmbox', el); const w = clamp((D.assist ? 0.26 : 0.16) * D.tol, 0.1, 0.32), c = 0.25 + Math.random() * 0.5;
      const period = D.assist ? 1.9 : 1.45; // s por barrido
      box.innerHTML = `<div class="lsep"><div class="lsep-k">${t(isTouch ? 'l.sepBarT' : 'l.sepBar')} · ${STG[i].name}</div><div class="lsep-bar"><i class="lsep-zone" style="left:${((c - w / 2) * 100).toFixed(1)}%;width:${(w * 100).toFixed(1)}%"></i><b class="lsep-ndl"></b></div><div class="lsep-n"></div></div>`;
      const ndl = $('.lsep-ndl', box), nTxt = $('.lsep-n', box); let tt = 0, misses = 0, done = false, cool = 0;
      const off = ctx.loop((dt) => {
        if (done) return; if (S.phase !== 'fly') { done = true; off?.(); res('dead'); return; }
        tt += dt; cool = Math.max(0, cool - dt);
        const u = (tt / period) % 2, p = u < 1 ? u : 2 - u; ndl.style.left = (p * 100).toFixed(2) + '%';
        nTxt.textContent = (SWEEPS * period - tt < period * 1.2 ? t('l.sepNow') + ' · ' : '') + t('l.tries') + ' ' + (TRIES - misses) + '/' + TRIES;
        if (tt > SWEEPS * period) { done = true; off?.(); fail('stage'); res('dead'); return; }
        if (!cool && (pressed('Space') || bpressed('stage'))) {
          if (Math.abs(p - c) <= w / 2) { done = true; off?.(); sfx('ok', { vol: 0.6 }); ctx.banner(t('l.sepGood'), STG[i].name, 1200); waitingStage = null; res(true); return; }
          // Fuera de la franja: los pernos no ceden limpio. Sacudón, algo de estrés y se gasta un intento (cadete 3 · normal 2 · veterano 1).
          misses++; cool = 0.35; S.stress = clamp(S.stress + 0.2, 0, 1); W.shake = 3; sfx('error'); navigator.vibrate?.([40, 30, 40]);
          ctx.banner(t('l.sepBad'), '', 1300, 'warn'); tt = Math.min(tt, period); // la cuenta de barridos vuelve a empezar
          if (misses >= TRIES || S.stress >= 1) { done = true; off?.(); fail(S.stress >= 1 ? 'maxq' : 'stage'); res('dead'); return; }
        }
      });
    });
  }
  // ---------- fallo: explosión y «¿qué pasó?» ----------
  const canFail = !AUTO() && !(coop && ctx.cc.remote?.());
  // Margen por dificultad: intentos de separación, barridos de la aguja y segundos fuera del corredor antes de Range Safety
  const LV = D.tol > 1.2 ? 'cadet' : D.tol < 0.9 ? 'veteran' : 'normal';
  const LVL = { cadet: { tries: 3, sweeps: 4, offSecs: 6.5, rollBand: 9 }, normal: { tries: 2, sweeps: 3, offSecs: 4, rollBand: 6 }, veteran: { tries: 1, sweeps: 2, offSecs: 2.5, rollBand: 4 } }[LV];
  const TRIES = LVL.tries, SWEEPS = LVL.sweeps;
  // ---------- programa de rolido (minijuego 1 del ascenso) ----------
  // Al librar la torre: el rumbo arranca en 90° y hay que llevarlo a 72° con Q/E y sostenerlo 1,5 s dentro de la franja.
  const ROLL = { on: false, done: false, hdg: 90, v: 0, hold: 0, t: 0, el: null };
  if (isTouch) { bindBtn($('.rollL', el), 'rollL'); bindBtn($('.rollR', el), 'rollR'); }
  function rollStep(dt) {
    if (ROLL.done || !canFail || S.s < 3.5) return;
    if (!ROLL.on) {
      ROLL.on = true; const box = document.createElement('div'); box.className = 'lroll';
      box.innerHTML = `<div class="lsep-k">${t(isTouch ? 'l.rollT' : 'l.roll')}</div><div class="lroll-g"><i class="lroll-band"></i><span class="lroll-mk">72°</span><b class="lroll-n"></b></div><div class="lroll-v mono"></div>`;
      el.append(box); ROLL.el = box; sfx('computer', { vol: 0.6 });
      const lo = 72 - LVL.rollBand, hi = 72 + LVL.rollBand, pos = (d) => ((d - 55) / (100 - 55)) * 100;
      $('.lroll-band', box).style.cssText = `left:${pos(lo).toFixed(1)}%;width:${(pos(hi) - pos(lo)).toFixed(1)}%`; $('.lroll-mk', box).style.left = pos(72).toFixed(1) + '%';
      if (isTouch) { $('.rollL', el).style.display = ''; $('.rollR', el).style.display = ''; }
    }
    ROLL.t += dt;
    const inp = (down('KeyE') || bdown('rollR') ? 1 : 0) - (down('KeyQ') || bdown('rollL') ? 1 : 0);
    ROLL.v = damp(ROLL.v, inp * 9 + Math.sin(S.s * 1.7 + ctx.seed) * 1.6, 3, dt); ROLL.hdg = clamp(ROLL.hdg + ROLL.v * dt, 55, 100);
    const inBand = Math.abs(ROLL.hdg - 72) <= LVL.rollBand; ROLL.hold = inBand ? ROLL.hold + dt : 0;
    const n = $('.lroll-n', ROLL.el); n.style.left = (((ROLL.hdg - 55) / 45) * 100).toFixed(2) + '%'; n.className = 'lroll-n' + (inBand ? ' ok' : '');
    $('.lroll-v', ROLL.el).textContent = `${fmt(ROLL.hdg)}° → 72° · ${Math.max(0, 12 - ROLL.t).toFixed(0)} s`;
    const end = (msg) => { ROLL.done = true; ROLL.el?.remove(); if (isTouch) { $('.rollL', el).style.display = 'none'; $('.rollR', el).style.display = 'none'; } if (msg) ctx.banner(t(msg), '', 1500); };
    if (ROLL.hold >= 1.5) { sfx('ok', { vol: 0.6 }); S.rollOk = true; return end('l.rollOk'); }
    if (ROLL.t > 12) { if (LV === 'cadet') { S.rollOk = false; return end('l.rollAuto'); } end(null); return fail('roll'); }
  }
  function fail(cause) {
    if (S.phase !== 'fly') return; S.phase = 'boom'; S.fail = cause;
    paintPrompt(el, null, ''); $('.alarmbox', el).innerHTML = ''; W.setThrust(0); stopEngine(); stopRumble();
    sfx('explosion', { vol: 0.9 }); setTimeout(() => sfx('explosion', { vol: 0.6, rate: 0.7 }), 250); sfx('boom', { vol: 0.8 }); navigator.vibrate?.([120, 60, 200]);
    const R = W.rocket; R.updateMatrixWorld(); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(R.quaternion); const at = R.position.clone().addScaledVector(up, 55);
    R.visible = false;
    const g = new THREE.Group(); g.position.copy(at); W.scene.add(g); ctx.onCleanup(() => { W.scene.remove(g); g.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); });
    // Bola de fuego de partículas: sprites con un degradado radial que pasan de blanco a naranja, rojo y humo gris
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c2 = cv.getContext('2d'); const gr = c2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#ffffffcc'); gr.addColorStop(1, '#ffffff00'); c2.fillStyle = gr; c2.fillRect(0, 0, 64, 64);
    const puffTex = new THREE.CanvasTexture(cv); ctx.onCleanup(() => puffTex.dispose());
    const HOT = [new THREE.Color(0xffd36a), new THREE.Color(0xffb347), new THREE.Color(0xff5a1a), new THREE.Color(0x8a2a12)], SMK = new THREE.Color(0x24201e);
    const puffs = [];
    for (let k = 0; k < 96; k++) {
      const smoke = k >= 60; const m = new THREE.SpriteMaterial({ map: puffTex, color: smoke ? SMK : HOT[0], transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false }); // sin niebla: si no, el cielo la lava
      const sp = new THREE.Sprite(m); const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.35, Math.random() - 0.5).normalize();
      sp.userData = { v: dir.multiplyScalar((smoke ? 8 : 10) + Math.random() * (smoke ? 14 : 28)), delay: smoke ? 0.2 + Math.random() * 0.5 : Math.random() * 0.2, life: smoke ? 4.5 + Math.random() * 2 : 1.3 + Math.random() * 0.9, size: smoke ? 40 + Math.random() * 30 : 30 + Math.random() * 30, smoke, age: 0 };
      sp.position.copy(dir).multiplyScalar(Math.random() * 6); g.add(sp); puffs.push(sp);
    }
    const flash = new THREE.PointLight(0xffaa55, 0, 900, 1.6); g.add(flash);
    const bits = [];
    for (let k = 0; k < 26; k++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2 + Math.random() * 4, 1 + Math.random() * 3, 2 + Math.random() * 5), new THREE.MeshBasicMaterial({ color: k % 3 ? 0xe8e4da : 0x222222 }));
      b.userData.v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(40 + Math.random() * 60);
      b.userData.w = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(6); g.add(b); bits.push(b);
    }
    const camFrom = cam.position.clone(); let k = 0;
    ctx.loop((dt) => {
      k += dt; flash.intensity = Math.max(0, 40 * (1 - k * 1.4));
      for (const sp of puffs) {
        const u = sp.userData; if (k < u.delay) continue; u.age += dt; const a = u.age / u.life;
        if (a >= 1) { sp.visible = false; continue; }
        u.v.multiplyScalar(Math.exp(-dt * (u.smoke ? 0.8 : 2.2))); if (u.smoke) u.v.y += 3 * dt; sp.position.addScaledVector(u.v, dt);
        sp.scale.setScalar(u.size * (0.4 + Math.sqrt(a) * (u.smoke ? 2.2 : 1.6)));
        if (u.smoke) sp.material.opacity = Math.min(1, a * 6) * (1 - a) * 0.8;
        else { const seg = Math.min(2.999, a * 3), i = Math.floor(seg); sp.material.color.copy(HOT[i]).lerp(HOT[i + 1], seg - i); sp.material.opacity = (1 - a * a) * 0.95; }
      }
      for (const b of bits) { b.userData.v.y -= 9.8 * dt; b.position.addScaledVector(b.userData.v, dt); b.rotation.x += b.userData.w.x * dt; b.rotation.y += b.userData.w.y * dt; }
      W.shake = Math.max(0, 3 - k * 1.2); W.emit(dt, 0); W.update(dt, ctx.time);
      const dist = Math.max(480, camFrom.distanceTo(at)); const dir = camFrom.clone().sub(at).normalize(); cam.position.copy(at).addScaledVector(dir, dist + k * 8); cam.lookAt(at);
    });
    ctx.cc.log('l.boom', null, 'bad');
    setTimeout(() => {
      if (ctx.dead) return;
      const ov = h(`<div class="screen lboom"><div class="panel dialog lboom-card"><div class="phase-tag lboom-k">${t('l.boom')}</div><h2></h2><p class="lboom-fact"></p><div class="lboom-acts"><button class="btn go" data-a="retry">${t('l.retry')}</button><button class="btn" data-a="quit">${t('l.quit')}</button></div></div></div>`);
      $('h2', ov).textContent = t('l.f.' + cause); $('.lboom-fact', ov).textContent = t('l.f.' + cause + 'F');
      el.append(ov); document.exitPointerLock?.();
      ov.onclick = (ev) => { const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); import('../mission.js').then((m) => (a === 'retry' ? m.retryPhase() : m.quitMission())); };
      $('[data-a=retry]', ov).focus({ preventScroll: true });
    }, 2600);
  }
  // ---------- director de cámara del ascenso: plano fijo en tierra hasta librar la torre, luego persecución cercana con cortes ----------
  // chase: costado del vehículo · track: teleobjetivo al costado (el plano de tierra atraviesa la Tierra) · onboard: primer plano lateral · tail: tres cuartos trasero
  const PLAN = [[9, 'chase'], [17, 'track'], [23.5, 'chase'], [30, 'onboard'], [36, 'chase'], [44, 'tail'], [49.5, 'chase'], [58, 'onboard'], [64, 'chase']];
  const MAN = ['chase', 'track', 'onboard', 'tail']; let man = -1, shot = 'pad';
  const lookC = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3(), _r = new THREE.Vector3(), _l = new THREE.Vector3(), side = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const lens = (fov, near, far = 60000) => { if (Math.abs(cam.fov - fov) > 1e-3 || cam.near !== near || Math.abs(cam.far - far) > 1) { cam.fov = fov; cam.near = near; cam.far = far; cam.updateProjectionMatrix(); } };
  // Place the camera beside the airframe. `dist` is lateral (never down the exhaust), `along` is metres up the stack.
  const beside = (rocket, dist, along) => {
    const ax = sideAxis(_u.x, _u.y, _u.z); side.set(ax[0], ax[1], ax[2]);
    _c.copy(rocket.position).addScaledVector(_u, along);
    _r.copy(_c).addScaledVector(side, dist);
  };
  function director(dt, R) {
    camRig.poll();
    const owner = camRig.owner();
    if (owner === 'orbit') { placeLaunchOrbit(dt, R); return; }
    if (owner === 'cockpit') { placeLaunchCockpit(R); return; }
    // Persecución: el director de PR #2 (plano de torre, costado, teleobjetivo). C/V no lo reescribe.
    let want = 'pad'; for (const [t0, n] of PLAN) if (S.s >= t0) want = n;
    if (want !== 'pad' && (waitingStage !== null || S.coast > 0)) want = 'chase'; // separaciones siempre en persecución
    if (man >= 0 && want !== 'pad') want = MAN[man];
    if (want !== shot) shot = want;
    if (DEBUG && window.__padDbg) window.__padDbg.shot = man >= 0 && want !== 'pad' ? MAN[man] : shot;
    _u.set(0, 1, 0).applyQuaternion(R.quaternion); cam.up.copy(Y);
    if (shot === 'pad') { // plano fijo bajo: ve cómo libra la torre
      const gb = clamp((S.s - 4) / 5, 0, 1), ge = gb * gb * (3 - 2 * gb); cam.position.copy(LOWCAM);
      _c.copy(R.position).addScaledVector(_u, 48);
      lookC.copy(R.position).add(_l.set(0, 45 - Math.min(25, S.s * 6), 0)).lerp(_c, ge); cam.lookAt(lookC); lens(50 - ge * 12, 1); return;
    }
    if (shot === 'chase') { // el objetivo va anclado al fuselaje: un retardo en coordenadas de mundo deja el cohete fuera cuando acelera
      const stand = chaseStand(waitingStage !== null || S.coast > 0);
      beside(R, stand.lateral, stand.along);
      cam.position.copy(_r); cam.lookAt(_c); lens(stand.fov, 0.8); return;
    }
    if (shot === 'track') { // teleobjetivo al costado: el plano de tierra atraviesa la Tierra decorativa y pierde el cohete
      const stand = trackStand();
      beside(R, stand.lateral, stand.along);
      cam.position.copy(_r); cam.lookAt(_c);
      const d = cam.position.distanceTo(_c); lens(trackFov(d), Math.max(0.5, Math.min(8, d * 0.004)), Math.max(8000, d * 4)); return;
    }
    if (shot === 'onboard') { // primer plano lateral: se ve el casco, no solo el penacho
      beside(R, 46, 70);
      cam.position.copy(_r); cam.lookAt(_c); lens(50, 0.35); return;
    }
    // tail: tres cuartos trasero, al costado de la estela, con el cohete entero en cuadro
    beside(R, 170, 36); _r.addScaledVector(_u, -24);
    lookC.copy(R.position).addScaledVector(_u, 50);
    cam.position.copy(_r); cam.lookAt(lookC); lens(38, 0.8);
  }
  if (DEBUG) window.__padDbg.man = (i) => (man = i);
  let prompting = false;
  await new Promise((res) => ctx.loop((dt) => {
    if (S.phase !== 'fly') return;
    // control
    rollStep(dt); if (S.phase !== 'fly') return;
    const ax = pitchAxis(); S.gust = damp(S.gust, Math.sin(S.s * 0.7 + ctx.seed) * 2.2 + Math.sin(S.s * 1.9) * 1.4, 2, dt);
    const tg = target(S.s); let rate = -ax * 14 * (isTouch ? 1 : 1) + S.gust * (S.s > 3 ? 1 : 0) * (1 / D.tol);
    if (D.assist) rate += (tg - S.pitch) * 0.6;
    if (AUTO()) { rate = (tg - S.pitch) * 3; S.thr = S.q > 100 && S.s < 24 ? 0.6 : 1; if (waitingStage !== null && !(coop && ctx.cc.remote())) waitingStage = null; }
    dbg('launchS', S);
    S.pitch = clamp(S.pitch + rate * dt, 0, 92);
    if (thrTouch != null) S.thr = clamp(0.4 + thrTouch * 0.6, 0.4, 1);
    if (down('KeyW', 'ShiftLeft')) S.thr = clamp(S.thr + dt * 0.8, 0.4, 1); if (down('KeyS', 'ControlLeft')) S.thr = clamp(S.thr - dt * 0.8, 0.4, 1);
    if ((pressed('Space') || bpressed('stage')) && waitingStage !== null && !(coop && ctx.cc.remote())) waitingStage = null;
    else if (pressed('Space') || bpressed('stage')) { if (waitingStage === null && !lesDone && S.stage === 1 && S.s > STG[0].end + 3) { lesDone = true; doStage(3); } }
    // empuje y cinemática
    const st = STG[S.stage]; const burning = !S.coast && waitingStage === null && st && S.s < st.end;
    if (S.coast) S.coast = Math.max(0, S.coast - dt);
    const thrust = burning ? S.thr : 0; W.setThrust(thrust); engine(thrust * (S.stage === 0 ? 1 : 0.6));
    const acc = burning ? st.a * thrust : 0; const g = 9.8 * (1 - clamp(S.alt / 180000, 0, 0.6));
    const pr = (S.pitch * Math.PI) / 180;
    S.vx += acc * Math.cos(pr) * dt; S.vy += (acc * Math.sin(pr) - g * 0.55) * dt; if (S.alt <= 0 && S.vy < 0) S.vy = 0;
    S.alt = Math.max(0, S.alt + S.vy * dt * 2.4); S.vel = Math.hypot(S.vx, S.vy) * 2.1; const velD = S.vel * 1.3;
    S.s += dt;
    // Max-Q: densidad × v² — ventana ~12–22 s
    const rho = Math.exp(-S.alt / 8500); const q = 0.5 * rho * (S.vel * S.vel) / 1000; S.q = q; S.maxQ = Math.max(S.maxQ, q);
    const qLimit = 130 * D.tol; const over = q * (0.35 + S.thr * 0.65) - qLimit;
    if (q > qLimit * 0.75 && !maxQsaid) { maxQsaid = true; ctx.banner(t('l.maxq'), '', 2200, 'warn'); sfx('computer', { vol: 0.5 }); ctx.cc.log('l.maxq', null, 'warn'); }
    S.stress = clamp(S.stress + (over > 0 ? (over / qLimit) * 0.3 : -0.03) * dt, 0, 1);
    if (maxQsaid && !S.maxqok && q < qLimit * 0.6 && S.s > 20) { S.maxqok = true; toast(t('l.maxqok'), 'info'); }
    // corredor
    const err = S.pitch - tg; const inC = Math.abs(err) <= tol; S.samples++; if (inC) S.inCorr++;
    // Consecuencias: fuera del corredor demasiado tiempo → Range Safety; estrés al 100 % (Max-Q con todo el empuje) → rotura
    if (canFail && S.s > 4) {
      const far = Math.abs(err) > tol * 2.2; S.off = far ? (S.off || 0) + dt : Math.max(0, (S.off || 0) - dt * 2);
      if (far && !S.offWarned) { S.offWarned = true; ctx.banner(t('l.offWarn'), '', 2200, 'warn'); sfx('computer', { vol: 0.7 }); }
      if (!far && S.off === 0) S.offWarned = false;
      if (S.stress > 0.3 && !S.qWarned) { S.qWarned = true; ctx.banner(t('l.qWarn'), '', 2400, 'warn'); sfx('computer', { vol: 0.7 }); }
      if (S.stress < 0.12) S.qWarned = false;
      if (S.off > LVL.offSecs) return fail('range');
      if (S.stress >= 1) return fail('maxq');
    }
    // etapas
    if (!prompting && st && S.s >= st.end && waitingStage === null && S.stage < 2) { prompting = true; const i = S.stage; stagePrompt(i).then(() => { S.stage = i + 1; prompting = false; if (i === 0) setTimeout(() => !lesDone && !ctx.dead && (toast(t('l.les'), 'info'), sfx('beep')), 3000); }); }
    if (S.stage === 1 && !lesDone && S.s > STG[0].end + 9) { lesDone = true; doStage(3); } // auto si se olvida
    // visual
    const R = W.rocket; R.rotation.order = 'ZYX'; R.rotation.z = -((90 - S.pitch) * Math.PI) / 180; R.rotation.y = ((90 - ROLL.hdg) * Math.PI) / 180; // rolido sobre su eje const vis = S.alt * Math.min(1, (S.s / 7) ** 2); // la simulación va comprimida; visualmente el despegue es lento y pesado (≈10 s en librar la torre real)
    R.position.y = (W.newModel ? BASE_Y : BASE_Y - 0.62) + vis; R.position.x += S.vx * dt * 2.4;
    W.alt = vis; W.shake = Math.max(W.shake * Math.exp(-dt * 2), thrust * (S.alt < 8000 ? 0.5 : 0.12) + S.stress * 0.8);
    W.emit(dt, thrust); rumble(thrust * (S.stage === 0 ? 1 : 0.35) * clamp(1 - S.alt / 40000, 0.15, 1), thrust * (S.stage === 0 ? 1 : 0.2));
    if (!cleared && vis > H + 20) { cleared = true; ctx.banner(t('l.clear'), '', 1400); ctx.cc.log('l.clear', null, 'ok'); }
    R.updateMatrixWorld(); director(dt, R);
    applyPadCam();
    W.update(dt, ctx.time);
    // HUD
    $('.v-alt', el).textContent = fmt(S.alt / 1000, 1) + ' km'; $('.v-vel', el).textContent = fmt(S.vel * 1.3) + ' m/s'; const vp = $('.v-pitch', el); vp.textContent = fmt(S.pitch) + '°'; vp.className = 'v v-pitch ' + (inC ? 'good' : Math.abs(err) < tol * 2 ? 'warn' : 'bad');
    const cue = launchPrompt({ waiting: waitingStage !== null, les: waitingStage === null && !lesDone && S.stage === 1 && S.s > STG[0].end + 3 && S.s < STG[0].end + 9, blocked: !!(coop && ctx.cc.remote() && waitingStage !== null) });
    paintPrompt(el, cue, cue ? t(cue.labelKey) : '');
    $('.v-stage', el).textContent = STG[S.stage]?.name || '—'; $('.m-thr', el).style.width = thrust * 100 + '%'; $('.m-str', el).style.width = S.stress * 100 + '%'; thrUI?.show((S.thr - 0.4) / 0.6);
    adiN.setAttribute('transform', `rotate(${S.pitch - 90})`); adiT.setAttribute('transform', `rotate(${tg - 90})`); corr.setAttribute('d', arcPath(tg - tol, tg + tol));
    ctx.cc.snap({ s: S.s, alt: S.alt, vel: S.vel, pitch: S.pitch, tg, tol, q, stress: S.stress, thr: thrust, stage: S.stage, wait: waitingStage });
    if (S.s >= DUR) { S.phase = 'orbit'; res(); }
  }));
  paintPrompt(el, null, '');
  W.setThrust(0); stopEngine(); stopRumble(); sfx('powerup'); music('cruise', { vol: 0.4 });
  ctx.banner(t('l.orbit'), `${fmt(S.alt / 1000)} km · ${fmt(S.vel * 1.3)} m/s`, 2600); ctx.cc.log('l.orbit', null, 'ok'); clip('cap2_go_para_orbita', { radio: true });
  let tt = 0; ctx.loop((dt) => { tt += dt; W.update(dt, ctx.time); });
  await ctx.wait(2.6);
  const corrPct = S.inCorr / Math.max(1, S.samples); const avgDelay = S.stageDelay.reduce((a, b) => a + b, 0) / Math.max(1, S.stageDelay.length);
  const score = Math.round(clamp(corrPct * 65 + (1 - S.stress) * 15 + clamp(1 - (avgDelay - 0.8) / 4, 0, 1) * 20, 5, 100));
  return { score, stats: { corridor: Math.round(corrPct * 100), stage: +avgDelay.toFixed(1), stress: Math.round(S.stress * 100) } };
}
