// Cap. 7.3 · «Reentrada» (24 jul 1969, ~16:35 UTC): separación del módulo de servicio y entrada a ~11 km/s (~40.000 km/h).
// Minijuego: mantener el ángulo de trayectoria dentro de un corredor estrecho. Muy empinado = calor y g excesivos;
// muy plano = la cápsula rebota en la atmósfera. Plasma naranja y apagón de radio; al final, tres paracaídas.
// Licencia de juego: en la realidad la computadora guió la reentrada (P61–P67); aquí el jugador supervisa y corrige.
// Modelos: csm-columbia (el SM se separa), cm-recovery (clip chutes-deploy). Escena propia, sin fase.
import { THREE } from '../../core/engine.js';
import { AUTO, store, isTouch } from '../../core/store.js';
import { down, bindBtn, bdown } from '../../core/input.js';
import { prop, node, disposeScene, envMap } from '../../scenes/cine-kit.js';
import { skySphere, earth, tickAll } from '../../scenes/space.js';
import { a11sfx } from '../../audio/a11-score.js';
import { playA11 } from '../../audio/a11-voice.js';
import { unlock, setFlag } from './state.js';
import { whatIf } from './decisions.js';
import { runCine, tx, L } from './cine.js';
import './reentry.css';

const TITLE = ['CAP. 7 · REENTRADA', 'CH. 7 · REENTRY'];
const CM_BASE = 3.23; // en csm-columbia la base del CM está 3,23 m bajo el origen del CSM
const SEP = 4.2; // s de la separación del SM
const DUR = 48; // s de entrada jugable
const CHUTES = 9; // s de paracaídas
const own = (o) => { o.userData.own = true; return o; };

export default async function reentryScene() {
  if (AUTO()) { unlock('h-angulo'); return { skipped: false, auto: true, clean: true }; }
  const diff = store.get('difficulty');
  const WIDE = diff === 'cadet' ? 1.45 : diff === 'veteran' ? 0.8 : 1.05; // media anchura del corredor (grados)
  const DRIFT = diff === 'cadet' ? 0.65 : diff === 'veteran' ? 1.25 : 1;

  // ---------- mundo ----------
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 4000);
  scene.environment = envMap(); scene.environmentIntensity = 0.35;
  const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(-40, 30, 60); scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x9fb6d8, 0x101418, 0.5); scene.add(hemi);
  const sky = new THREE.Group(); scene.add(sky);
  sky.add(skySphere(900));
  const E = earth(520, new THREE.Vector3(-0.6, 0.5, 0.6).normalize()); E.position.set(0, -548, -40); sky.add(E);
  const [csm, rec] = await Promise.all([prop('csm-columbia').catch(() => null), prop('cm-recovery').catch(() => null)]);
  // la cápsula: base (escudo) hacia la velocidad (−X), con el ángulo de ataque de ~20° del CM real
  const cap = new THREE.Group(); scene.add(cap);
  const body = new THREE.Group(); body.position.y = 0; cap.add(body);
  let sm = null;
  if (csm) { csm.root.position.y = CM_BASE - 1.6; body.add(csm.root); sm = node(csm.root, 'SM'); }
  if (rec) { rec.root.position.y = CM_BASE - 1.6; body.add(rec.root); for (const n of ['flotation-collar']) { const o = node(rec.root, n); if (o) o.visible = false; } rec.root.visible = false; }
  const AOA = 0.35; cap.rotation.z = -Math.PI / 2 - AOA;
  const smHome = sm ? sm.position.clone() : null;
  // plasma: casquete frente al escudo + estela de partículas + luz naranja
  const shellMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const shell = own(new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), shellMat));
  shell.rotation.z = Math.PI / 2; shell.position.x = -0.9; shell.scale.set(1, 0.55, 1); scene.add(shell);
  const N = 420, tp = new Float32Array(N * 3), tv = new Float32Array(N);
  const seed = (i) => { const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 1.4; tp[i * 3] = -1.2 + Math.random() * 2; tp[i * 3 + 1] = Math.cos(a) * r; tp[i * 3 + 2] = Math.sin(a) * r; tv[i] = 25 + Math.random() * 45; };
  for (let i = 0; i < N; i++) { seed(i); tp[i * 3] += Math.random() * 60; }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const trail = own(new THREE.Points(tg, new THREE.PointsMaterial({ color: 0xffa040, size: 0.22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
  trail.frustumCulled = false; scene.add(trail);
  const glow = new THREE.PointLight(0xff7a2a, 0, 40, 1.4); glow.position.set(-3, 0, 0); scene.add(glow);
  const skyCol = new THREE.Color(0x6f8fb0), black = new THREE.Color(0x000000);
  let camShake = 0;
  const world = { scene, camera, update: (dt, t) => { tickAll(scene, dt, t); csm?.update(dt); rec?.update(dt); }, resize: () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }, dispose: () => disposeScene(scene) };

  // ---------- estado ----------
  const S = { stage: 'sep', t: 0, gam: -6.5, heat: 0, skip: 0, out: false, fails: 0, input: 0, done: false, failWhy: null, plasma: 0, blackout: false, lastIn: true };
  const center = (t) => -6.5 + 0.9 * Math.sin(t * 0.19 + 0.4) + 0.35 * Math.sin(t * 0.53);
  const drift = (t) => DRIFT * (0.75 * Math.sin(t * 0.37 + 1) + 0.5 * Math.sin(t * 0.83 + 2.1) + 0.3 * Math.sin(t * 1.7));
  const plasmaAt = (t) => t < 6 ? 0 : t < 16 ? (t - 6) / 10 : t < 34 ? 1 : t < 44 ? 1 - (t - 34) / 10 : 0;
  let resolveDone; const allDone = new Promise((r) => (resolveDone = r));
  let hud = null, API = null;
  const sub = (text) => API?.subtitle('', text);

  const li = L();
  return runCine({
    id: 'reentry', world, title: TITLE,
    shots: [{ d: 1, pos: [0, 1.5, 14], look: [0, 0, 0], fov: 46 }],
    step(dt) {
      if (S.done || !hud) return;
      S.t += dt; const t = S.t;
      // ---- cámara ----
      if (S.stage === 'sep') { const k = Math.min(1, t / SEP); camera.position.set(-2 + k * 4, 1.6 + k * 1.2, 13 - k * 3); camera.lookAt(-k, 0, 0); }
      else if (S.stage === 'entry' || S.stage === 'paused') { camera.position.set(9.5, 3.4, 7.8); camera.lookAt(-2.2, -0.4, 0); }
      else { const k = Math.min(1, t / 3); camera.position.set(3 - k * 2, -9 - k * 4, 12); camera.lookAt(0, 6 + k * 10, 0); }
      if (camShake > 0) { camera.position.x += (Math.random() - 0.5) * camShake; camera.position.y += (Math.random() - 0.5) * camShake; }
      // ---- separación ----
      if (S.stage === 'sep') {
        if (sm) { const k = Math.max(0, t - 0.8); sm.position.copy(smHome); sm.position.y -= k * k * 0.9; sm.rotation.x = k * 0.25; sm.visible = k < 3.4; }
        if (t > SEP) { if (sm) sm.visible = false; startEntry(); }
        return;
      }
      if (S.stage === 'entry') {
        const te = t;
        S.input = (down('KeyW', 'ArrowUp') || bdown('reUp') ? 1 : 0) - (down('KeyS', 'ArrowDown') || bdown('reDn') ? 1 : 0);
        S.gam += (S.input * 1.25 + drift(te)) * dt; S.gam = Math.max(-11, Math.min(-2, S.gam));
        const c = center(te), lo = c - WIDE, hi = c + WIDE; const p = plasmaAt(te); S.plasma = p;
        const steep = Math.max(0, lo - S.gam), shallow = Math.max(0, S.gam - hi); const inC = !steep && !shallow;
        if (!inC && te > 1.2) S.out = true;
        if (steep) S.heat += steep * (0.08 + 0.22 * p) * dt; else S.heat = Math.max(0, S.heat - 0.05 * dt);
        if (shallow) S.skip += shallow * 0.16 * dt; else S.skip = Math.max(0, S.skip - 0.07 * dt);
        if (inC !== S.lastIn) { S.lastIn = inC; if (!inC) a11sfx('ui_interruptor_toggle_c', 0.35); }
        // radio
        if (!S.blackout && te > 10 && te < 33) { S.blackout = true; a11sfx('c7_73_radio_apagon_plasma', 0.6); }
        if (S.blackout && te >= 33) { S.blackout = false; a11sfx('c3_34_radio_vuelve_aos', 0.5); }
        if (!S.plasmaSfx && te > 7) { S.plasmaSfx = true; a11sfx('c7_73_reentrada_plasma', 0.55); }
        // efectos
        const vel = 11.03 - 10.7 * smoothstep(4, DUR - 2, te); const alt = 122 - 115 * smoothstep(0, DUR, te);
        const g = 1 + 5.4 * p * (0.6 + 0.4 * Math.sin(Math.min(1, te / 34) * Math.PI)) + steep * 1.6;
        const temp = Math.round(320 + 2380 * p + steep * 180);
        camShake = 0.04 + p * 0.12 + steep * 0.06;
        shellMat.opacity = p * 0.85; trail.material.opacity = p * 0.9; trail.material.size = 0.15 + p * 0.2; glow.intensity = p * 9;
        cap.rotation.z = -Math.PI / 2 - AOA + (S.gam + 6.5) * 0.035; sky.rotation.z = (S.gam - c) * 0.035; E.position.y = -548 + smoothstep(0, DUR, te) * 22;
        hud.paint({ vel, alt, g, temp, gam: S.gam, lo, hi, inC, steep, shallow, heat: S.heat, skip: S.skip, p, blackout: S.blackout });
        if (S.heat >= 1) return fail('heat');
        if (S.skip >= 1) return fail('skip');
        if (te >= DUR) return startChutes();
      }
      // estela del plasma (también se desvanece al abrir paracaídas)
      if (trail.material.opacity > 0.01) { for (let i = 0; i < N; i++) { tp[i * 3] += tv[i] * dt; if (tp[i * 3] > 60) seed(i); } tg.attributes.position.needsUpdate = true; }
      if (S.stage === 'chutes') {
        const k = Math.min(1, t / 2.5); scene.background.copy(black).lerp(skyCol, k); E.visible = k < 0.6; sky.children[0].visible = k < 0.4;
        shellMat.opacity *= 0.9; trail.material.opacity *= 0.9; glow.intensity *= 0.9; camShake = Math.max(0, 0.05 - t * 0.02);
        cap.rotation.z += (0 - cap.rotation.z) * Math.min(1, dt * 1.2); // cuelga vertical bajo los paracaídas
        if (rec) rec.at('chutes-deploy', Math.max(0, t - 0.8) * 1.4, false), rec.apply();
        if (t > CHUTES) finishAll();
      }
    },
    async interactive(api) {
      API = api; hud = makeHud(api.el, li);
      if (isTouch) { bindBtn(hud.up, 'reUp'); bindBtn(hud.dn, 'reDn'); }
      sub(tx(['Columbia suelta el módulo de servicio. Solo queda la cápsula y su escudo térmico.', 'Columbia jettisons the service module. Only the capsule and its heat shield remain.']));
      a11sfx('c7_73_separacion_modulo_servicio', 0.7);
      const r = await allDone;
      api.finish(false);
      return r;
    },
  }).then((res) => {
    world.dispose();
    document.querySelectorAll('.dec-overlay.whatif').forEach((x) => x.remove());
    return { ...res, clean: !S.out, fails: S.fails };
  });

  function startEntry() {
    S.stage = 'entry'; S.t = 0; S.gam = -6.5; S.heat = 0; S.skip = 0; S.blackout = false; S.plasmaSfx = false; S.lastIn = true;
    hud.show(true);
    sub(tx(['Interfaz de entrada: 122 km de altura, ~40.000 km/h. Mantén el ángulo dentro del corredor.', 'Entry interface: 122 km up, ~40,000 km/h. Keep the angle inside the corridor.']));
  }
  async function fail(why) {
    S.stage = 'paused'; S.fails++; S.out = true; camShake = 0; a11sfx('c6_62_chispa_cortocircuito', 0.4);
    const heat = why === 'heat';
    await whatIf({
      title: heat ? ['¿Y si…? Demasiado empinado', 'What if…? Too steep'] : ['¿Y si…? Demasiado plano', 'What if…? Too shallow'],
      text: heat
        ? ['Con un ángulo demasiado empinado, la desaceleración y el calor superan lo que la tripulación y el escudo ablativo (~2.700 °C) pueden soportar. El corredor real de Apolo era de apenas unos dos grados de ancho.', 'Too steep an angle and the deceleration and heat exceed what the crew and the ablative shield (~2,700 °C) can take. Apollo’s real corridor was only about two degrees wide.']
        : ['Con un ángulo demasiado plano, la cápsula rebota en la atmósfera como una piedra en el agua y sale de nuevo al espacio. El corredor real de Apolo era de apenas unos dos grados de ancho.', 'Too shallow an angle and the capsule skips off the atmosphere like a stone on water, back into space. Apollo’s real corridor was only about two degrees wide.'],
      back: ['Entendido', 'Understood'],
    });
    if (S.done) return;
    const opt = await new Promise((res) => {
      const box = document.createElement('div'); box.className = 'story-choice re-choice';
      const p = document.createElement('p'); p.textContent = tx(['En la realidad la computadora guió la reentrada (programas P61–P67).', 'In reality the computer flew the entry (programs P61–P67).']); box.append(p);
      for (const [id, lab] of [['retry', ['Reintentar', 'Retry']], ['go', ['Continuar con la ruta real', 'Continue on the real route']]]) { const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = tx(lab); b.onclick = (e) => { e.stopPropagation(); box.remove(); res(id); }; box.append(b); }
      API.el.append(box);
    });
    if (S.done) return;
    if (opt === 'retry') { setFlag('reentry-retry', S.fails); startEntry(); } else { setFlag('reentry-auto', true); startChutes(); }
  }
  function startChutes() {
    S.stage = 'chutes'; S.t = 0; hud.show(false); camShake = 0.05;
    if (rec) rec.root.visible = true;
    if (!S.out) unlock('h-angulo');
    setTimeout(() => !S.done && a11sfx('c7_73_paracaidas_apertura', 0.75), 800);
    setTimeout(() => !S.done && playA11('nasa_real/cap7_hornet_area_amerizaje', { vol: 0.8 }), 3200);
    sub(tx(['Tres paracaídas principales se abren. Silencio. Solo el viento.', 'Three main parachutes open. Silence. Only the wind.']));
  }
  function finishAll() { if (S.done) return; S.done = true; resolveDone({ clean: !S.out }); }
}

function smoothstep(a, b, x) { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); }

// HUD: telemetría a la izquierda, indicador del corredor a la derecha, botones táctiles ≥ 56 px
function makeHud(parent, li) {
  const root = document.createElement('div'); root.className = 're-hud';
  const arrow = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  root.innerHTML = `<div class="re-tint"></div>
    <div class="re-tele" hidden><div><span>VEL</span><b class="v-vel">0</b><i>km/h</i></div><div><span>${li ? 'ALT' : 'ALT'}</span><b class="v-alt">0</b><i>km</i></div>
      <div><span>G</span><b class="v-g">1.0</b><i>g</i></div><div><span>${li ? 'SHIELD' : 'ESCUDO'}</span><b class="v-t">0</b><i>°C</i></div>
      <div class="re-bars"><label>${li ? 'HEAT' : 'CALOR'}</label><p><i class="b-heat"></i></p><label>${li ? 'SKIP' : 'REBOTE'}</label><p><i class="b-skip"></i></p></div></div>
    <div class="re-gauge" hidden><div class="re-band"></div><div class="re-mark"></div><small class="re-gl">γ</small></div>
    <div class="re-flag" hidden>${li ? 'NO CONTACT · PLASMA' : 'SIN CONTACTO · PLASMA'}</div>
    <div class="re-warn" aria-live="assertive"></div>
    <div class="re-hint" hidden>${isTouch ? (li ? 'Hold the arrows to fix the angle' : 'Mantén las flechas para corregir el ángulo') : (li ? 'W/S or ↑/↓ · keep the marker inside the green corridor' : 'W/S o ↑/↓ · mantén la marca dentro del corredor verde')}</div>
    <button type="button" class="re-btn up" aria-label="${li ? 'Shallower' : 'Menos empinado'}" hidden>${arrow('M5 15l7-7 7 7')}</button>
    <button type="button" class="re-btn dn" aria-label="${li ? 'Steeper' : 'Más empinado'}" hidden>${arrow('M5 9l7 7 7-7')}</button>`;
  parent.append(root);
  const $ = (s) => root.querySelector(s);
  const up = $('.re-btn.up'), dn = $('.re-btn.dn');
  const G0 = -11, G1 = -2; const y = (g) => (1 - (g - G0) / (G1 - G0)) * 100;
  return {
    root, up, dn,
    show(on) { for (const s of ['.re-tele', '.re-gauge', '.re-hint']) $(s).hidden = !on; up.hidden = dn.hidden = !(on && isTouch); if (!on) { $('.re-flag').hidden = true; $('.re-warn').textContent = ''; } },
    paint(s) {
      $('.v-vel').textContent = Math.round(s.vel * 3600).toLocaleString(li ? 'en' : 'es');
      $('.v-alt').textContent = s.alt.toFixed(0); $('.v-g').textContent = s.g.toFixed(1); $('.v-t').textContent = s.temp.toLocaleString(li ? 'en' : 'es');
      $('.b-heat').style.transform = `scaleX(${Math.min(1, s.heat)})`; $('.b-skip').style.transform = `scaleX(${Math.min(1, s.skip)})`;
      const band = $('.re-band'); band.style.top = y(s.hi) + '%'; band.style.height = (y(s.lo) - y(s.hi)) + '%';
      const mk = $('.re-mark'); mk.style.top = y(s.gam) + '%'; mk.classList.toggle('bad', !s.inC);
      $('.re-flag').hidden = !s.blackout;
      $('.re-tint').style.opacity = (s.p * 0.55 + s.steep * 0.08).toFixed(3);
      $('.re-warn').textContent = s.steep ? (li ? 'TOO STEEP · heat and g rising' : 'DEMASIADO EMPINADO · suben el calor y la g') : s.shallow ? (li ? 'TOO SHALLOW · risk of skipping out' : 'DEMASIADO PLANO · riesgo de rebote') : '';
    },
  };
}
