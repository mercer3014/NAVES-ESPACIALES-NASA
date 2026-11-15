// FASE 3 · Crucero: TLI (mantener para encender), alineación con 3 estrellas, LOI tras la Luna (LOS), foto Earthrise, calcetín
import { THREE, renderer } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, $$, h, toast, achieve, clamp, damp, lerp, fmt } from '../../core/util.js';
import { sfx, music, engine, stopEngine } from '../../core/audio.js';
import { clips } from '../../audio/a11-cues.js';
import { down, bindBtn, bdown } from '../../core/input.js';
import { isTouch, shared, dbg, AUTO, AUTO1, store } from '../../core/store.js';
import { burnPrompt, objectiveCardHtml } from '../../ui/flight-hud.js';
import { paintPrompt } from '../../ui/flight-hud-mount.js';
import { makeCruise } from '../../scenes/ship.js';
import { playCue, cueActive } from '../cutscenes/play.js';
import { bindOrbitControls } from '../orbit-view.js';
import { createOrbitState, resolveOrbitPosition, stepOrbit } from '../orbit-camera.js';
import { show } from '../../ui/router.js';
import { storyInPhase, playStory } from '../story/flow.js';
import { runDocking } from '../story/docking.js';
import { record, hearHint } from '../story/state.js';
import { whatIf } from '../story/decisions.js';
import { playA11 } from '../../audio/a11-voice.js';
extend({
  'c.dv': ['Δv', 'Δv'], 'c.ok': ['¡Quemado perfecto!', 'Perfect burn!'], 'c.short': ['Un poco corto — corrección de curso', 'A bit short — course correction'], 'c.long': ['Te pasaste — corrección de curso', 'Overburn — course correction'],
  'c.cczone': ['Control de Misión ve la zona verde. ¡Escúchalo!', 'Mission Control sees the green zone. Listen!'], 'c.wrong': ['Esa no es', 'Not that one'],
  'c.alignok': ['Plataforma alineada', 'Platform aligned'], 'c.ccstars': ['Control de Misión te dirá qué estrellas', 'Mission Control will name the stars'], 'c.snap': ['FOTO', 'PHOTO'],
  'c.photoHint': ['Espera a que la Tierra salga completa y toma la foto', 'Wait for Earth to fully rise, then take the photo'], 'c.nice': ['¡Fotón!', 'Great shot!'], 'c.meh': ['Foto movida…', 'Blurry shot…'],
  'c.space': ['Mantén ESPACIO', 'Hold SPACE'], 'c.tap3': ['Toca las 3 estrellas marcadas en ámbar', 'Tap the 3 stars ringed in amber'], 'c.coast': ['Rumbo a la Luna', 'Coasting to the Moon'], 'c.retro': ['Quemado retrógrado', 'Retrograde burn'],
  'c.td': ['Transposición y acople', 'Transposition and docking'], 'c.td0': ['Separación del CSM · paneles del SLA fuera', 'CSM separation · SLA panels away'], 'c.td1': ['Giro de 180°', '180° turnaround'],
  'c.td2': ['Aproximación al LM', 'Closing on the LM'], 'c.tdc': ['¡Contacto! Pestillos cerrados', 'Contact! Latches closed'], 'c.td4': ['Extrayendo el LM', 'Extracting the LM'], 'c.td5': ['Despliegue del tren de aterrizaje del LM', 'Deploying the LM landing legs'],
  'c.vin': ['Cabina', 'Cabin'], 'c.vout': ['Exterior', 'Outside'], 'c.vkey': ['C/V: órbita, persecución o cabina', 'C/V: orbit, chase or cockpit'],
});
const NAMES = ['Sirius', 'Vega', 'Rigel', 'Canopus', 'Antares', 'Altair'];

export default async function cruise(ctx) {
  const W = makeCruise(); ctx.world(W); const { camera: cam, ship, E, M } = W; const coop = ctx.cc.coop, D = ctx.diff;
  music('cruise', { vol: 0.45 });
  const el = ctx.hud(`${objectiveCardHtml({ kicker: `${t('ph.n')} 03 · ${t('ph.cruise')}`, titleHtml: `<div class="phase-title st-title">${t('c.tli')}</div><button class="btn viewbtn" style="display:none;width:max-content;margin-top:8px;padding:.35em .7em;font-size:.75rem;pointer-events:auto"></button>`, bodyHtml: '<p class="mhud-note hint"></p>' })}
    <div class="bc burnbox" style="display:none;width:min(420px,88vw)"><div class="burnmeter" style="position:relative;width:100%;height:10px;background:rgba(7,12,16,.72);border:1px solid rgba(186,206,212,.32);overflow:hidden">
      <i class="zone" style="position:absolute;top:0;bottom:0;background:rgba(143,191,155,.35)"></i><i class="fillb" style="position:absolute;left:0;top:0;bottom:0;width:0;background:#c6a36a"></i></div>
      <div class="phase-tag dvlab" style="margin-top:4px">Δv 0 m/s</div>
      <button class="tc-btn big go burnbtn">${t('c.burn')}</button></div>
    <div class="days" style="display:none"><div class="phase-tag">${t('c.days')}</div><div class="d">1</div><button class="btn ffw" style="margin-top:6px">${t('c.skip')}</button></div>
    <div class="starlayer" style="position:absolute;inset:0;pointer-events:none"></div>
    <div class="photoframe" style="display:none;position:absolute;inset:12% 18%;border:2px solid #fff8;border-radius:6px;pointer-events:none"><span style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border:2px solid #fff8;border-radius:50%"></span></div>
    <button class="btn photobtn" style="display:none;position:absolute;right:16px;bottom:calc(18px + var(--safe-b))">${t('c.snap')}</button>
    <div class="los" style="display:none;position:absolute;inset:0;pointer-events:none"></div>`);
  const hint = (k) => { $('.hint', el).textContent = k ? t(k) : ''; };
  const title = (k) => { dbg('cr', k); $('.st-title', el).textContent = t(k); };
  bindBtn($('.burnbtn', el), 'burn');
  ship.rotation.set(0, 0, -Math.PI / 2); // nariz (+y) hacia +x
  const st = { tli: null, align: null, loi: null, photo: null, sock: false, wrong: 0 };
  let camOff = new THREE.Vector3(-22, 7, 18), camLook = new THREE.Vector3(2, 0, 0), shake = 0;
  let photoMode = false;
  // ---------- vista interior (cm-interior.glb): ojo del CDR o detrás de una ventana; las ventanas muestran la escena real ----------
  const VIEWS = { cdr: { n: 'eye-CDR', back: 0.06, fov: 74 }, win: { n: 'win-rdz-left', back: 0.2, fov: 62 }, photo: { n: 'win-side-left', back: 0.24, fov: 56, free: true } };
  let view = null, inView = 'cdr', viewLock = false, baseFov = cam.fov; const vbtn = $('.viewbtn', el);
  const paintV = () => { vbtn.style.display = 'none'; };
  const setView = (v) => { const I = ship.userData.interior; if (v && !I) v = null; if (!view && v) baseFov = cam.fov; view = v ? VIEWS[v] : null; if (v) inView = v; I?.set(!!view);
    cam.near = view ? 0.006 : 0.1; cam.fov = view ? (cam.aspect < 1 ? view.fov + 14 : view.fov) : baseFov; cam.updateProjectionMatrix(); if (photoMode) ship.visible = !!view; paintV(); };
  const lockView = (v, lock = true) => { viewLock = lock; setView(v); };
  vbtn.onclick = () => { if (!viewLock && !photoMode) camRig.cycle(); };
  const orbit = createOrbitState({ yaw: -0.89, pitch: 0.24, distance: 30, minDistance: 11, maxDistance: 90, damp: 7 });
  let orbitLens = false;
  const camRig = bindOrbitControls(orbit, {
    allow: () => !photoMode && !viewLock,
    onMode: (mode) => { if (photoMode || viewLock) return; setView(mode === 'cockpit' ? (inView || 'cdr') : null); },
  });
  ctx.onCleanup(() => camRig.dispose());
  dbg('crDbg', { cam, ship, VIEWS, setView, lockView });
  ctx.loop(() => { camRig.poll(); if (camRig.state.mode === 'cockpit' && !view && !viewLock && !photoMode && ship.userData.interior) setView(inView || 'cdr'); });
  ctx.onCleanup(() => { ship.userData.interior?.set(false); cam.near = 0.1; cam.updateProjectionMatrix(); });
  const _ws = new THREE.Vector3();
  const placeInView = () => { const n = ship.userData.interior.node(view.n); if (!n) return; n.updateWorldMatrix(true, false); n.getWorldPosition(cam.position); n.getWorldQuaternion(cam.quaternion); cam.translateZ(view.back * n.getWorldScale(_ws).x); if (view.free) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); cam.up.set(0, 1, 0); cam.lookAt(cam.position.clone().add(d)); }
    if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake * 0.05; cam.position.y += (Math.random() - 0.5) * shake * 0.05; cam.rotateZ((Math.random() - 0.5) * shake * 0.08); } };
  const fw = new THREE.Vector3(); // punto de la nave que sigue la cámara (cambia durante la transposición)
  ctx.loop((dt) => {
    const pz = !photoMode && cam.aspect < 1 ? 1.9 : 1; if (photoMode) fw.set(0, 0, 0); else { ship.updateMatrixWorld(); fw.copy(ship.userData.focus || ship.position); if (ship.userData.focus) ship.localToWorld(fw); }
    cam.position.copy(fw).addScaledVector(camOff, pz); if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; } cam.lookAt(fw.clone().add(camLook));
    const scripted = photoMode || viewLock || cueActive();
    const owner = scripted ? 'rail' : camRig.owner();
    if (owner === 'orbit') {
      stepOrbit(orbit, dt);
      const pos = resolveOrbitPosition(fw, orbit.smoothYaw, orbit.smoothPitch, orbit.smoothDistance, {
        up: 'y', minDistance: orbit.minDistance, subjectRadius: 11, margin: 0.8,
        spheres: [{ x: E.position.x, y: E.position.y, z: E.position.z, r: 62 }, { x: M.position.x, y: M.position.y, z: M.position.z, r: 18 }],
      });
      cam.position.set(pos.x, pos.y, pos.z); cam.up.set(0, 1, 0); cam.lookAt(fw);
      const fov = cam.aspect < 1 ? 64 : 50;
      if (!orbitLens || Math.abs(cam.fov - fov) > 0.5) { orbitLens = true; cam.fov = fov; cam.near = 0.15; cam.updateProjectionMatrix(); }
    } else {
      if (orbitLens && !view) { orbitLens = false; cam.fov = baseFov; cam.near = 0.1; cam.updateProjectionMatrix(); }
      if (view) placeInView();
      else if (owner === 'cockpit') { cam.position.lerp(fw, 0.62); cam.lookAt(fw); }
    }
    // Cámara del acople: en la punta de la sonda de Columbia, mirando a lo largo del eje hacia Eagle en el adaptador.
    // Así se ve con qué te acoplas; si te desalineas, Eagle se corre en la retícula.
    if (dockCam) {
      const { csm, yTgt } = dockCam; ship.updateMatrixWorld();
      const gap = csm.position.y - yTgt;
      // Lejos: en la sonda, sin entrar nunca en Eagle. En contacto (calibración): vista lateral con las dos naves unidas.
      const eye = gap > 0.4 ? ship.localToWorld(new THREE.Vector3(csm.position.x, Math.max(csm.position.y - 1.6, yTgt + 2.2), csm.position.z))
        : ship.localToWorld(new THREE.Vector3(7, yTgt + 3.5, 7));
      const at = gap > 0.4 ? ship.localToWorld(new THREE.Vector3(csm.position.x, yTgt - 2, csm.position.z)) : ship.localToWorld(new THREE.Vector3(0, yTgt + 1, 0));
      cam.up.copy(new THREE.Vector3(0, 0, 1).transformDirection(ship.matrixWorld));
      cam.position.copy(eye); cam.lookAt(at);
      const fov = cam.aspect < 1 ? 70 : 52; if (Math.abs(cam.fov - fov) > 0.5 || cam.near > 0.05) { cam.fov = fov; cam.near = 0.03; cam.updateProjectionMatrix(); }
    }
    W.update(dt, ctx.time);
  });
  let dockCam = null;
  E.position.set(-10, -78, 0); M.position.set(2600, 120, -500);

  // ---------- quemado (TLI / LOI) ----------
  async function burn(kind, showZone) {
    const box = $('.burnbox', el); box.style.display = ''; if (!isTouch) { const pr = burnPrompt(true); paintPrompt(el, pr, t(pr.labelKey)); } const w = 0.055 * D.tol; const z0 = 0.74 + (ctx.rand() - 0.5) * 0.1, z1 = z0 + w;
    const zone = $('.zone', el); zone.style.left = z0 * 100 + '%'; zone.style.width = w * 100 + '%'; zone.style.opacity = showZone ? 1 : 0;
    let v = 0, burning = false, started = false, relT = 0; const rate = 0.16 / D.time;
    await new Promise((res) => { const off = ctx.loop((dt) => {
      const hold = down('Space') || bdown('burn') || (AUTO() && v < (z0 + z1) / 2);
      if (hold) { started = true; burning = true; v = Math.min(1.08, v + rate * dt); } else burning = false;
      ship.userData.burn(burning ? 1 : 0); { const I = ship.userData.interior; if (I?.on) I.fdai(-0.314 + v * 0.06 + (burning ? (Math.random() - 0.5) * 0.012 : 0), -0.21, 0.087 + (burning ? (Math.random() - 0.5) * 0.01 : 0)); } engine(burning ? 0.35 : 0, { low: 0.5 }); shake = burning ? 0.06 : 0;
      $('.fillb', el).style.width = (v / 1.08) * 100 + '%'; $('.dvlab', el).textContent = `Δv ${fmt(v * 3150)} m/s`;
      ctx.cc.snap({ stage: kind, v, z0, z1, burning });
      if (started && !burning) { relT += dt; if (relT > 0.35) { off(); res(); } } else relT = 0;
      if (v >= 1.08) { off(); res(); }
    }); });
    ship.userData.burn(0); stopEngine(); shake = 0; box.style.display = 'none'; paintPrompt(el, null, '');
    const mid = (z0 + z1) / 2; const err = Math.abs(v - mid) / (w / 2); const score = clamp(1 - Math.max(0, err - 1) * 0.35, 0, 1);
    if (err <= 1) { sfx('ok'); ctx.banner(t('c.ok'), '', 1600); ctx.cc.log('c.ok', null, 'ok'); } else { sfx('error'); ctx.banner(t(v < mid ? 'c.short' : 'c.long'), '', 1800, 'warn'); ctx.cc.log(v < mid ? 'c.short' : 'c.long', null, 'warn'); }
    return { v, score, err };
  }
  const SUB = new URLSearchParams(location.search).get('sub'); // atajo de QA
  if (SUB !== 'photo') {
  // TLI
  ctx.banner(t('c.tli'), 'TLI', 1800); hint(coop && ctx.cc.remote() ? 'c.cczone' : 'c.hold'); ctx.say('pa.tli', { ms: 4000 }); ctx.cc.log('c.tli');
  await ctx.wait(1.2); await ctx.until(() => ship.userData.interior || ctx.time > 6); setView('cdr'); // TLI desde el asiento del CDR
  { const I = ship.userData.interior; if (I) { I.guard(4); [8, 9, 10].forEach((i) => I.sw(i, true)); } }
  st.tli = await burn('tli', !(coop && ctx.cc.remote()));
  playCue('tli', { anchor: () => ship, ctx });
  await ctx.wait(1.4);
  // ---------- transposición, acople y extracción del LM (cinemática) ----------
  if (ship.userData.transpose) {
    lockView(null); title('c.td'); hint('c.td0'); ctx.cc.log('c.td'); const co = camOff.clone(), cl = camLook.clone(); camOff.set(7, 6, 30); camLook.set(0, 0, 0); // lado del sol (+x+z)
    // modo historia: la aproximación final la vuela el jugador (Collins). La secuencia de ship.js se congela al empezar
    // la aproximación (etapa 2) y, tras el contacto del minijuego, salta al instante del acople (T≈17 s) y sigue sola.
    const story = storyInPhase(ctx); let hold = false, jump = 0, dockP = null;
    const tctx = story ? Object.assign(Object.create(ctx), { loop: (f) => ctx.loop((dt, tt) => { if (hold) return; const j = jump; jump = 0; f(dt + j, tt); }) }) : ctx;
    await ship.userData.transpose(tctx, (s) => { if (s === 'contact') { sfx('clunk', { vol: 0.8 }); shake = 0.05; setTimeout(() => (shake = 0), 250); ctx.banner(t('c.tdc'), '', 1500); ctx.cc.log('c.tdc', null, 'ok'); return; }
      if (s === 2 && story && !dockP) { hold = true; dockP = playerDock().catch((e) => console.error('acople', e)).then(() => { jump = 6.05; hold = false; }); }
      const k = ['c.td0', 'c.td1', 'c.td2', null, 'c.td4', 'c.td5'][s]; if (k) hint(k); if (s === 2) camOff.set(3, 3.5, 17); if (s === 4) camOff.set(6, 6, 27); if (s === 5) camOff.set(9, 3, 20); ctx.cc.snap({ stage: 'td', s }); });
    camOff.copy(co); camLook.copy(cl); await ctx.wait(0.6);
  }
  // Cap. 2.5: Collins vuela la aproximación final al cono de Eagle (minijuego) y la decisión del guion sale de cómo lo hizo
  async function playerDock() {
    let csm = ship.getObjectByName('CM'); while (csm && csm.parent !== ship) csm = csm.parent;
    const s4 = ship.children.find((c) => c !== csm && c.getObjectByName?.('j2-thrust-point'));
    if (!csm || !s4) return;
    const yTgt = s4.getObjectByName('lm-docking-target')?.position.y ?? 5.72, y0 = csm.position.y, range0 = Math.max(6, y0 - yTgt);
    lockView(null); viewLock = true; dockCam = { csm, yTgt }; // vista externa desde la sonda (antes: la ventanilla, sin ver a Eagle)
    title('c.td'); hint('c.td2');
    const res = await runDocking({
      loop: (f) => ctx.loop(f), onCleanup: (f) => ctx.onCleanup(f), range0, x0: 0.7, y0: -0.45,
      title: ['ACOPLE · COLUMBIA → EAGLE (EN EL SLA)', 'DOCKING · COLUMBIA → EAGLE (IN THE SLA)'],
      note: ['Eres Collins. Alinea la sonda con el cono de Eagle.', 'You are Collins. Line the probe up with Eagle’s drogue.'],
      apply: (S) => csm.position.set(S.x, yTgt + Math.max(0, S.range), S.y),
    });
    dockCam = null; cam.up.set(0, 1, 0); cam.near = 0.1; cam.fov = baseFov; cam.updateProjectionMatrix(); lockView(null); camOff.set(3, 3.5, 17);
    if (!res.ok) await whatIf({ title: ['¿Y si…? Collins falla el contacto', 'What if…? Collins misses the contact'],
      text: ['Tres contactos fallidos. En la realidad no hubo drama: Collins había ensayado esta maniobra cientos de veces en el simulador y acopló a la primera, despacio y con poco combustible. La computadora completa ahora el acople.',
        'Three failed contacts. In reality there was no drama: Collins had rehearsed this maneuver hundreds of times in the simulator and docked on the first try, slowly and with little fuel. The computer now completes the docking.'] });
    const slow = res.ok && res.closing <= 0.2 && res.rcsUsed <= 45;
    record('c2-docking', slow ? 'slow' : 'fast', { historic: slow, trust: slow ? 5 : 0, morale: slow ? 0 : -5 });
    if (slow) setTimeout(() => { if (ctx.dead) return; playA11('voz_en_clonada/c2_dec_aldrin_bonito_mike_en'); ctx.banner('ALDRIN', store.get('lang') === 'en' ? '“Beautiful, Mike!”' : '«Bonito, Mike».', 2600, 'good'); }, 1600);
  }
  viewLock = false;
  // ---------- crucero (días) + alineación + calcetín ----------
  title('c.align'); hint(''); const days = $('.days', el); days.style.display = ''; let speed = 1; $('.ffw', el).onclick = () => { speed = speed === 1 ? 3 : 1; sfx('tick'); };
  let k = 0; const E0 = E.position.clone(), E1 = new THREE.Vector3(-1100, -260, -500), M0 = M.position.clone(), M1 = new THREE.Vector3(30, -34, 0);
  const coastTick = (dt) => { const e = k * k * (3 - 2 * k); E.position.lerpVectors(E0, E1, Math.min(1, e * 1.6)); M.position.lerpVectors(M0, M1, e); $('.d', days).textContent = 1 + Math.floor(k * 3); camOff.lerp(new THREE.Vector3(-26, 9, 22), dt * 0.3); ship.rotation.x += dt * 0.05 * speed * rollK; };
  let coastOn = true, rollK = 1; ctx.loop((dt) => { if (coastOn) { k = Math.min(1, k + (dt * speed) / (34 * D.time)); coastTick(dt); } });
  // calcetín flotante
  const sock = mkSock(); W.scene.add(sock); sock.position.set(-6, 3, -14); sock.visible = false;
  setTimeout(() => !ctx.dead && (sock.visible = true), 2500);
  ctx.loop((dt, tt) => { if (!sock.visible) return; sock.position.x += dt * 1.6; sock.rotation.x += dt * 0.9; sock.rotation.z += dt * 0.6; if (sock.position.x > 30) sock.position.x = -30; });
  const onSockClick = (e) => { if (!sock.visible || st.sock) return; const p = sock.position.clone().project(cam); const sx = (p.x + 1) / 2 * innerWidth, sy = (1 - p.y) / 2 * innerHeight; if (Math.hypot(sx - e.clientX, sy - e.clientY) < 46) { st.sock = true; sock.visible = false; sfx('jingle_pancho'); ctx.say('pa.sock', { ms: 3500 }); achieve('sock'); } };
  addEventListener('pointerdown', onSockClick); ctx.onCleanup(() => removeEventListener('pointerdown', onSockClick));
  // alineación: 6 estrellas brillantes; 3 objetivo
  rollK = 0; lockView('win'); await ctx.wait(1.5); hint(coop && ctx.cc.remote() ? 'c.ccstars' : 'c.tap3'); // alineación mirando por la ventana de encuentro ctx.say('pa.align', { ms: 3500 });
  const SR = [0.2, 0.28, 0.02]; const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd); const order = [...NAMES].sort(() => ctx.rand() - 0.5); const targets = order.slice(0, 3);
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize(), upv = new THREE.Vector3().crossVectors(right, fwd).normalize();
  const sprites = NAMES.map((n, i) => { const a = (i / 6) * Math.PI * 2 + ctx.rand() * 0.5; const ndc = new THREE.Vector3(Math.cos(a) * (view ? SR[0] : 0.62), Math.sin(a) * (view ? SR[1] : 0.42) + (view ? SR[2] : -0.04), 0.5).unproject(cam); const d = ndc.sub(cam.position).normalize().multiplyScalar(1500);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.sun.material.map, color: 0xcfe6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(26); s.userData.dir = d; W.scene.add(s); return s; });
  const layer = $('.starlayer', el); const solo = !(coop && ctx.cc.remote());
  const btns = NAMES.map((n, i) => { const b = h(`<button class="starbtn ${solo && targets.includes(n) ? 'tgt' : ''}" style="position:absolute;pointer-events:auto"><i></i><span>${n}</span></button>`); layer.append(b); return b; });
  const got = new Set(); const tA = ctx.time;
  await new Promise((res) => {
    btns.forEach((b, i) => (b.onclick = () => {
      const n = NAMES[i]; if (got.has(n)) return;
      if (targets.includes(n)) { got.add(n); b.classList.add('done'); sfx('ok', { rate: 1 + got.size * 0.1 }); ctx.cc.snap({ stage: 'align', targets, got: [...got] }, true); if (got.size === 3) res(); }
      else { st.wrong++; sfx('error'); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 600); toast(t('c.wrong'), 'info'); }
    }));
    const offA = ctx.loop(() => { if (got.size === 3) return offA?.(); sprites.forEach((s, i) => { s.position.copy(cam.position).add(s.userData.dir); const p = s.position.clone().project(cam); btns[i].style.left = ((p.x + 1) / 2) * 100 + '%'; btns[i].style.top = ((1 - p.y) / 2) * 100 + '%'; btns[i].style.display = p.z < 1 ? '' : 'none'; });
      if (AUTO1() && !got.size) { targets.forEach((n) => btns[NAMES.indexOf(n)].click()); } });
    ctx.cc.snap({ stage: 'align', targets, got: [] }, true);
  });
  st.align = { time: ctx.time - tA, wrong: st.wrong }; layer.innerHTML = ''; sprites.forEach((s) => W.scene.remove(s)); ctx.banner(t('c.alignok'), '', 1500); ctx.cc.log('c.alignok', null, 'ok'); await ctx.wait(1); rollK = 1; lockView(null, false);
  // Cap. 3.2: la noche en Columbia (charla) y su decisión salieron de la misión; siguen en «Escenas del guion».
  // Su respuesta histórica se toma en PASSED (flow.js). El crucero sigue sin cortes hasta la LOI.
  // esperar a llegar a la Luna
  title('c.coast'); hint('pa.tli'); await ctx.until(() => k >= 1); coastOn = false; days.style.display = 'none';
  // ---------- LOI tras la Luna: LOS ----------
  title('c.loi'); clips(['cap3_go_loi_nos_vemos_otro_lado', 'cap3_perdida_senal_detras_luna'], { radio: true }); hearHint('h-ciegas'); ctx.banner(t('c.los'), 'LOS', 2200); ctx.say('pa.los', { ms: 3000 }); ctx.cc.log('c.los', null, 'warn'); ctx.cc.snap({ stage: 'los', los: true }, true);
  const los = $('.los', el); los.style.display = ''; los.innerHTML = '<div class="static"></div>'; sfx('glitch', { vol: 0.4 });
  W.sun.visible = false; W.scene.children.filter((o) => o.isDirectionalLight).forEach((l) => (l.intensity = 0.25)); // lado oscuro
  ship.rotation.set(0, 0, ship.userData.docked ? -Math.PI / 2 : Math.PI / 2); hint('c.retro'); // acoplado: +Y local = tobera SPS
  await ctx.wait(2.4); los.innerHTML = ''; los.style.display = 'none';
  st.loi = await burn('loi', true);
  clips(['c3_34_capcom_go_loi_en', 'c3_34_armstrong_estamos_en_orbita_en', 'c3_34_collins_yeso_viejo_en'], { radio: true });
  W.sun.visible = true; W.scene.children.filter((o) => o.isDirectionalLight).forEach((l) => (l.intensity = 3.2));
  sfx('ping'); ctx.banner(t('c.aos'), 'AOS', 1600); ctx.cc.log('c.aos', null, 'ok'); ctx.cc.snap({ stage: 'aos', los: false }, true);
  await ctx.wait(1.6);
  } else st.tli = st.loi = { score: 1 }, st.align = { time: 0, wrong: 0 };
  // ---------- Earthrise ----------
  title('c.photo'); hint('c.photoHint'); music('ambient', { vol: 0.4 });
  const R = 16; M.position.set(0, 0, 0); ship.visible = false; const eye = new THREE.Vector3(0, R + 0.9, 0); const dip = Math.acos(R / (R + 0.9));
  const camFwd = new THREE.Vector3(1, -Math.tan(dip * 0.75), 0).normalize(); camLook = eye.clone().addScaledVector(camFwd, 10); camOff = eye.clone(); photoMode = true; cam.fov = cam.aspect < 1 ? 70 : 50; cam.updateProjectionMatrix(); M.rotation.set(Math.PI / 2, 0, 0.3); M.userData.tick = null; W.sunDir.set(-0.15, 0.25, -1).normalize(); W.scene.children.filter((o) => o.isDirectionalLight).forEach((l) => l.position.copy(W.sunDir).multiplyScalar(100)); W.sun.position.copy(W.sunDir).multiplyScalar(1500); ship.position.set(0, 0, 0);
  // Earthrise por la ventana lateral izquierda (la de la escotilla queda tapada por la escotilla interior): se coloca la nave para que ese ventanuco quede en el ojo de la foto mirando a camFwd, con el eje de la nave horizontal
  await ctx.until(() => ship.userData.interior || ctx.time > 8);
  { const I = ship.userData.interior, n = I?.node(VIEWS.photo.n); if (n) { ship.position.set(0, 0, 0); ship.quaternion.identity(); ship.updateMatrixWorld(true);
      const Mn = n.matrixWorld.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, VIEWS.photo.back)), S = ship.matrixWorld.clone();
      const z = camFwd.clone().negate(), y = new THREE.Vector3(0, 0, -1).projectOnPlane(z).normalize(), x = new THREE.Vector3().crossVectors(y, z);
      const k = n.getWorldScale(new THREE.Vector3()).x, T = new THREE.Matrix4().makeBasis(x, y, z).scale(new THREE.Vector3(k, k, k)).setPosition(eye); T.multiply(Mn.invert()).multiply(S);
      const sc = new THREE.Vector3(); T.decompose(ship.position, ship.quaternion, sc); ship.updateMatrixWorld(true); }
    baseFov = cam.fov; lockView('photo', false); }
  const ED = 520; let rise = 0; const riseT = 9 * D.time;
  const pf = $('.photoframe', el), pb = $('.photobtn', el); pf.style.display = ''; pb.style.display = '';
  let shot = null; pb.onclick = () => { if (!shot) shot = { at: rise }; };
  await new Promise((res) => { const offP = ctx.loop((dt) => {
    rise = Math.min(1.25, rise + dt / riseT); const el0 = -dip - 0.05 + rise * 0.12;
    E.position.set(ED * Math.cos(el0), eye.y + ED * Math.sin(el0), -6); E.lookAt(eye);
    if (AUTO() && rise > 0.85 && !shot) shot = { at: rise };
    if (shot || rise >= 1.25) { offP(); res(); }
  }); });
  renderer.render(W.scene, cam); try { shared.photo = renderer.domElement.toDataURL('image/jpeg', 0.82); } catch {}
  sfx('click'); const flash = h('<div style="position:absolute;inset:0;background:#fff;opacity:.9;transition:opacity .6s;pointer-events:none"></div>'); el.append(flash); requestAnimationFrame(() => (flash.style.opacity = 0)); setTimeout(() => flash.remove(), 700);
  const ps = shot ? clamp(1 - Math.abs(shot.at - 0.9) / 0.35, 0, 1) : 0; st.photo = ps;
  ctx.banner(t(ps > 0.5 ? 'c.nice' : 'c.meh'), '', 1600); if (ps > 0.5) achieve('earthrise'); ctx.cc.log(ps > 0.5 ? 'c.nice' : 'c.meh', null, ps > 0.5 ? 'ok' : 'warn');
  pf.style.display = 'none'; pb.style.display = 'none';
  await ctx.wait(1.8);
  const alignS = clamp(1 - st.align.wrong * 0.15 - Math.max(0, st.align.time - 12) * 0.02, 0, 1);
  const score = Math.round(st.tli.score * 40 + alignS * 25 + st.loi.score * 25 + ps * 10);
  return { score, stats: { tli: Math.round(st.tli.score * 100), loi: Math.round(st.loi.score * 100), wrong: st.wrong, photo: Math.round(ps * 100), sock: st.sock } };
}
function mkSock() {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 1 }); const r = new THREE.MeshStandardMaterial({ color: 0xc8342a, roughness: 1 });
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 1.2, 12), m); g.add(leg);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.16, 12), r); band.position.y = 0.45; g.add(band);
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.6, 4, 10), m); foot.rotation.z = Math.PI / 2; foot.position.set(0.35, -0.6, 0); g.add(foot);
  return g;
}
