// FASE 2 · Lanzamiento: cuenta regresiva, despegue, corredor de cabeceo, Max-Q, 3 separaciones
import { THREE, renderer } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, $$, h, toast, achieve, clamp, damp, fmt } from '../../core/util.js';
import { sfx, music, voice, engine, stopEngine, rumble, stopRumble } from '../../core/audio.js';
import { axis, down, pressed, bindBtn, bdown, bpressed, makeStick, makeThrottle, input } from '../../core/input.js';
import { isTouch, DEBUG, dbg, AUTO } from '../../core/store.js';
import { makePad, H, BASE_Y } from '../../scenes/pad.js';
import { trackFov, sideAxis, chaseStand, trackStand } from '../launch-camera.js';
import { playCue } from '../cutscenes/play.js';
extend({
  'l.tminus': ['T-', 'T-'], 'l.skip': ['Saltar cuenta', 'Skip countdown'], 'l.stress': ['ESTRÉS', 'STRESS'], 'l.thr': ['EMPUJE', 'THRUST'],
  'l.les': ['¡Expulsa la torre de escape!', 'Jettison the escape tower!'], 'l.waitcc': ['Esperando que Control de Misión separe…', 'Waiting for Mission Control to stage…'],
  'l.keys': ['A/D o ←/→ cabeceo · W/S empuje · ESPACIO separar · C cámara', 'A/D or ←/→ pitch · W/S thrust · SPACE stage · C camera'], 'l.corr': ['CORREDOR', 'CORRIDOR'],
  'l.ign': ['Secuencia de ignición', 'Ignition sequence'], 'l.iss': ['Inicio de la secuencia de ignición', 'Ignition sequence start'], 'l.throk': ['Todos los motores en marcha', 'All engines running'], 'l.hdr': ['Liberación de los anclajes', 'Hold-down release'], 'l.sep': ['Separación', 'Separation'], 'l.maxqok': ['Max-Q superado', 'Through Max-Q'],
});
const DUR = 72; // s de vuelo comprimido
const STG = [ // fin de cada quema (t), aceleración base
  { end: 24, a: 38, name: 'S-IC' }, { end: 52, a: 58, name: 'S-II' }, { end: DUR, a: 46, name: 'S-IVB' },
];
const target = (s) => (s < 5 ? 90 : s > DUR ? 12 : 90 - (78 * Math.pow((s - 5) / (DUR - 5), 0.8)));

export default async function launch(ctx) {
  const W = makePad(); ctx.world(W); ctx.onCleanup(() => { W.dispose(); stopRumble(); }); const cam = W.camera; cam.far = 60000; cam.near = 1; cam.updateProjectionMatrix();
  const coop = ctx.cc.coop, D = ctx.diff, tol = 7 * D.tol;
  music('tension', { vol: 0.4 });
  const el = ctx.hud(`<div class="tl"><span class="phase-tag">${t('ph.n')} 2 · ${t('ph.launch').toUpperCase()}</span><span class="phase-title">Saturn V</span></div>
    <div class="tr" style="top:calc(66px + var(--safe-t))"><div class="tele"><div class="tele-grid">
      <div><div class="k">${t('l.alt')}</div><div class="v v-alt">0 km</div></div><div><div class="k">${t('l.vel')}</div><div class="v v-vel">0 m/s</div></div>
      <div><div class="k">${t('l.pitch')}</div><div class="v v-pitch">90°</div></div><div><div class="k">${t('l.stage')}</div><div class="v v-stage">S-IC</div></div>
      <div><div class="k">${t('l.thr')}</div><div class="meter"><i class="m-thr" style="width:0;background:var(--amber)"></i></div></div>
      <div><div class="k">${t('l.stress')}</div><div class="meter"><i class="m-str" style="width:0;background:var(--red)"></i></div></div></div></div></div>
    <div class="${isTouch ? 'tc' : 'bl'} adibox" style="opacity:0;transition:opacity .6s;${isTouch ? 'top:calc(64px + var(--safe-t))' : ''}"><svg class="adi" viewBox="-110 -110 130 130" width="${isTouch ? 110 : 170}">
      <path d="M-110 0 L-110 -110 L0 -110" fill="none"/><path d="M-100 0 A100 100 0 0 1 0 -100 L0 0Z" fill="#05080fbb"/><path d="M-100 0 A100 100 0 0 1 0 -100" fill="none" stroke="#ffffff33" stroke-width="16"/>
      <path class="corr" fill="none" stroke="#3ddc84aa" stroke-width="16"/>
      <line class="ndl" x1="0" y1="0" x2="0" y2="-104" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line class="tgt" x1="0" y1="-84" x2="0" y2="-116" stroke="#ffb000" stroke-width="3"/>
      <circle r="6" fill="#ddd"/><text x="-50" y="18" fill="#9aa" font-size="11" font-family="Mono" text-anchor="middle">${t('l.corr')}</text></svg>
      <div class="phase-tag keyshelp" style="${isTouch ? 'display:none' : ''}">${t('l.keys')}</div></div>
    <div class="cdown" style="position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none"><div class="phase-tag">${t('l.ign')}</div><div class="big" style="font-family:Orbitron;font-weight:900;font-size:clamp(48px,12vw,120px)">T-10</div></div>
    <button class="btn skipcd" style="position:absolute;right:16px;bottom:calc(16px + var(--safe-b))">${t('l.skip')} ⏭</button>
    ${isTouch ? `<div class="tc-stick"><i></i></div><div class="tc-throttle"><div class="fill"></div><div class="lab">${t('l.thr')}</div></div><div class="tc-btn big amber stagebtn" style="right:calc(110px + env(safe-area-inset-right,0px));bottom:calc(30px + var(--safe-b));display:none">${t('l.stage')}</div>` : ''}
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
  ctx.loop((dt) => { if (applyPadCam()) return; if (S.phase === 'count') { shotA += dt * 0.05; orbP.set(Math.sin(shotA + 0.9) * 290, 30 + DY, Math.cos(shotA + 0.9) * 290);
    if (S.ign) toLow = Math.min(1, toLow + dt * 0.6); const e = toLow * toLow * (3 - 2 * toLow); const push = 1 - Math.max(0, ct - (LIFT - 8.9)) * 0.012;
    cam.position.lerpVectors(orbP, LOWCAM, e); if (e > 0) { const k = 1 - (1 - push) * e; cam.position.x *= k; cam.position.z *= k; }
    const look = new THREE.Vector3(0, 62 + DY, 0).lerp(lowLook, e);
    if ([cam.position.x, cam.position.y, cam.position.z, look.x, look.y, look.z].every(Number.isFinite)) cam.lookAt(look); } });
  const S = { phase: 'count', s: 0, alt: 0, vel: 0, vx: 0, vy: 0, pitch: 90, thr: 1, stage: 0, stress: 0, inCorr: 0, samples: 0, stageDelay: [], maxQ: 0, gust: 0 };
  let skip = false; $('.skipcd', el).onclick = () => (skip = true);
  const v = voice('countdown', { vol: 0.9 }); ctx.onCleanup(() => v.stop());
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
    } else {
      await ctx.until(() => waitingStage === null || (D.assist && S.s - t0 > 6));
    }
    S.stageDelay.push(S.s - t0); waitingStage = null; $('.alarmbox', el).innerHTML = ''; doStage(i);
    S.coast = 1.0; // segundo de inercia antes de la siguiente ignición
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
    if (pressed('KeyC')) man = man + 1 >= MAN.length ? -1 : man + 1; // C: recorre los planos a mano; tras el último vuelve al automático
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
    if (maxQsaid && !S.maxqok && q < qLimit * 0.6 && S.s > 20) { S.maxqok = true; toast('✔ ' + t('l.maxqok'), 'info'); }
    // corredor
    const err = S.pitch - tg; const inC = Math.abs(err) <= tol; S.samples++; if (inC) S.inCorr++;
    // etapas
    if (!prompting && st && S.s >= st.end && waitingStage === null && S.stage < 2) { prompting = true; const i = S.stage; stagePrompt(i).then(() => { S.stage = i + 1; prompting = false; if (i === 0) setTimeout(() => !lesDone && !ctx.dead && (toast(t('l.les'), 'info'), sfx('beep')), 3000); }); }
    if (S.stage === 1 && !lesDone && S.s > STG[0].end + 9) { lesDone = true; doStage(3); } // auto si se olvida
    // visual
    const R = W.rocket; R.rotation.z = -((90 - S.pitch) * Math.PI) / 180; const vis = S.alt * Math.min(1, (S.s / 7) ** 2); // la simulación va comprimida; visualmente el despegue es lento y pesado (≈10 s en librar la torre real)
    R.position.y = (W.newModel ? BASE_Y : BASE_Y - 0.62) + vis; R.position.x += S.vx * dt * 2.4;
    W.alt = vis; W.shake = Math.max(W.shake * Math.exp(-dt * 2), thrust * (S.alt < 8000 ? 0.5 : 0.12) + S.stress * 0.8);
    W.emit(dt, thrust); rumble(thrust * (S.stage === 0 ? 1 : 0.35) * clamp(1 - S.alt / 40000, 0.15, 1), thrust * (S.stage === 0 ? 1 : 0.2));
    if (!cleared && vis > H + 20) { cleared = true; ctx.banner(t('l.clear'), '', 1400); ctx.cc.log('l.clear', null, 'ok'); }
    R.updateMatrixWorld(); director(dt, R);
    applyPadCam();
    W.update(dt, ctx.time);
    // HUD
    $('.v-alt', el).textContent = fmt(S.alt / 1000, 1) + ' km'; $('.v-vel', el).textContent = fmt(S.vel * 1.3) + ' m/s'; const vp = $('.v-pitch', el); vp.textContent = fmt(S.pitch) + '°'; vp.className = 'v v-pitch ' + (inC ? 'good' : Math.abs(err) < tol * 2 ? 'warn' : 'bad');
    $('.v-stage', el).textContent = STG[S.stage]?.name || '—'; $('.m-thr', el).style.width = thrust * 100 + '%'; $('.m-str', el).style.width = S.stress * 100 + '%'; thrUI?.show((S.thr - 0.4) / 0.6);
    adiN.setAttribute('transform', `rotate(${S.pitch - 90})`); adiT.setAttribute('transform', `rotate(${tg - 90})`); corr.setAttribute('d', arcPath(tg - tol, tg + tol));
    ctx.cc.snap({ s: S.s, alt: S.alt, vel: S.vel, pitch: S.pitch, tg, tol, q, stress: S.stress, thr: thrust, stage: S.stage, wait: waitingStage });
    if (S.s >= DUR) { S.phase = 'orbit'; res(); }
  }));
  W.setThrust(0); stopEngine(); stopRumble(); sfx('powerup'); music('cruise', { vol: 0.4 });
  ctx.banner(t('l.orbit'), `${fmt(S.alt / 1000)} km · ${fmt(S.vel * 1.3)} m/s`, 2600); ctx.cc.log('l.orbit', null, 'ok');
  let tt = 0; ctx.loop((dt) => { tt += dt; W.update(dt, ctx.time); });
  await ctx.wait(2.6);
  const corrPct = S.inCorr / Math.max(1, S.samples); const avgDelay = S.stageDelay.reduce((a, b) => a + b, 0) / Math.max(1, S.stageDelay.length);
  const score = Math.round(clamp(corrPct * 65 + (1 - S.stress) * 15 + clamp(1 - (avgDelay - 0.8) / 4, 0, 1) * 20, 5, 100));
  return { score, stats: { corridor: Math.round(corrPct * 100), stage: +avgDelay.toFixed(1), stress: Math.round(S.stress * 100) } };
}
