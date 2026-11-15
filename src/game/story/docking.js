// Minijuego de acople (Collins): traslación lateral + cierre con RCS limitado, mirando por el COAS (retícula).
// Reutilizable: el llamador coloca la nave con apply(state) en cada fotograma. El estado está en metros en el marco
// del acople: range (distancia a contacto), x/y (desalineación lateral), vr (velocidad de cierre, + = acercándose).
// Contacto válido: cierre ≤ tolClose y desalineación ≤ tolLat; uno malo rebota y cuenta un intento.
import { onTick } from '../../core/engine.js';
import { store, isTouch, AUTO } from '../../core/store.js';
import { down, makeStick, bindBtn, bdown, input } from '../../core/input.js';
import { sfx } from '../../core/audio.js';
import { a11sfx } from '../../audio/a11-score.js';
import './docking.css';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');

// opts: { range0, tolClose, tolLat, maxAttempts, title, note, apply(state, dt), loop(fn) → off, wide }
export function runDocking(opts = {}) {
  // Dificultad: cadete tiene un intento más y una franja de calibración más ancha; veterano, uno menos y más deriva
  const LVL = { cadet: { extra: 1, band: 0.28, need: 2.6, drift: 0.8 }, normal: { extra: 0, band: 0.2, need: 3.2, drift: 1 }, veteran: { extra: -1, band: 0.13, need: 3.8, drift: 1.3 } }[store.get('difficulty')] || { extra: 0, band: 0.2, need: 3.2, drift: 1 };
  const tolClose = opts.tolClose ?? 0.3, tolLat = opts.tolLat ?? 0.25, maxAttempts = Math.max(1, (opts.maxAttempts ?? 3) + LVL.extra);
  const S = { range: opts.range0 ?? 14, x: opts.x0 ?? 0.9, y: opts.y0 ?? -0.6, vr: 0, vx: 0, vy: 0, rcs: 100, rcsUsed: 0, attempts: 0, secs: 0, pitch: 0, yaw: 0, closingAtContact: 0, contact: false };
  const loop = opts.loop || onTick; const apply = opts.apply || (() => {});
  const el = document.createElement('div'); el.className = 'dock';
  el.innerHTML = `<div class="dock-top"><div class="dock-k"></div><div class="dock-note"></div></div>
    <svg class="dock-coas" viewBox="-100 -100 200 200" aria-hidden="true"><circle r="70" class="ring"/><line x1="-90" y1="0" x2="-20" y2="0"/><line x1="20" y1="0" x2="90" y2="0"/><line x1="0" y1="-90" x2="0" y2="-20"/><line x1="0" y1="20" x2="0" y2="90"/><g class="tgt"><circle r="12"/><line x1="-26" y1="0" x2="26" y2="0"/><line x1="0" y1="-26" x2="0" y2="26"/></g></svg>
    <div class="dock-tele"><div><span>${L() ? 'RANGE' : 'RANGO'}</span><b class="r"></b></div><div><span>${L() ? 'CLOSING' : 'CIERRE'}</span><b class="v"></b></div><div><span>${L() ? 'OFFSET' : 'DESALIN.'}</span><b class="o"></b></div><div><span>RCS</span><b class="f"></b><i class="fb"><i></i></i></div><div><span>${L() ? 'TRIES' : 'INTENTOS'}</span><b class="a"></b></div></div>
    <div class="dock-dist" aria-hidden="true"><span>DIST</span><div class="dock-distbar"><i></i></div><b></b></div>
    <div class="dock-cal" hidden><div class="dock-cal-k">${L() ? 'SOFT CAPTURE · CALIBRATE ROLL' : 'CAPTURA · CALIBRA EL ROLIDO'}</div>
      <div class="dock-cal-g"><i class="dock-cal-band"></i><b class="dock-cal-n"></b></div>
      <div class="dock-cal-p"><i></i></div><div class="dock-cal-t"></div></div>
    <div class="dock-hint"></div>${opts.skippable ? `<button type="button" class="dock-skip">${L() ? 'Skip · Esc' : 'Saltar · Esc'}</button>` : ''}
    ${isTouch ? `<div class="dock-stick"><i></i></div><div class="dock-btns"><button type="button" class="dock-b fwd">${L() ? 'CLOSE IN' : 'ACERCAR'}</button><button type="button" class="dock-b brk">${L() ? 'BRAKE' : 'FRENAR'}</button></div>` : ''}`;
  el.querySelector('.dock-k').textContent = tx(opts.title || ['ACOPLE · COLUMBIA → EAGLE', 'DOCKING · COLUMBIA → EAGLE']);
  el.querySelector('.dock-note').textContent = tx(opts.note || '');
  const hint = el.querySelector('.dock-hint');
  hint.textContent = isTouch ? tx(['Stick: alinea la cruz · ACERCAR / FRENAR: velocidad de cierre ≤ ' + tolClose.toFixed(1) + ' m/s', 'Stick: align the cross · CLOSE IN / BRAKE: closing speed ≤ ' + tolClose.toFixed(1) + ' m/s'])
    : tx(['WASD / flechas: alinear · R acercar · F frenar · cierre ≤ ' + tolClose.toFixed(1) + ' m/s', 'WASD / arrows: align · R close in · F brake · closing ≤ ' + tolClose.toFixed(1) + ' m/s']);
  document.body.append(el);
  if (isTouch) { makeStick(el.querySelector('.dock-stick')); bindBtn(el.querySelector('.fwd'), 'dock-fwd'); bindBtn(el.querySelector('.brk'), 'dock-brk'); }
  const q = (s) => el.querySelector(s); const tgt = q('.tgt');
  let pulseT = 0, msgT = 0, off = null;
  const say = (m, cls = '') => { hint.textContent = tx(m); hint.className = 'dock-hint ' + cls; msgT = 2.4; };
  opts.onCleanup?.(() => { off?.(); off = null; el.remove(); }); // la fase murió (salir, reiniciar)
  return new Promise((resolve) => {
    let ended = false;
    const finish = (ok, skipped = false) => {
      if (ended) return; ended = true; removeEventListener('keydown', esc, true);
      off?.(); el.classList.add('out'); setTimeout(() => el.remove(), 400); input.stick.x = input.stick.y = 0;
      resolve({ ok, skipped, attempts: S.attempts, rcsUsed: Math.round(S.rcsUsed), closing: +S.closingAtContact.toFixed(2), secs: Math.round(S.secs), lateral: +Math.hypot(S.x, S.y).toFixed(2) });
    };
    const esc = (e) => { if (opts.skippable && e.code === 'Escape' && !e.repeat) { e.preventDefault(); e.stopPropagation(); finish(true, true); } };
    addEventListener('keydown', esc, true); const sk = el.querySelector('.dock-skip'); if (sk) sk.onclick = () => finish(true, true);
    // Tras el contacto (captura suave) Collins retraía la sonda y se cerraban los 12 pestillos del túnel (acople firme).
    // Minijuego: la aguja de rolido se desvía sola; A/D (o la palanca) la mantienen en la franja verde. Dentro de la franja
    // se van cerrando pestillos; fuera, se pierde algo de progreso. 12/12 = acople firme.
    function calibrate() {
      S.range = 0; S.contact = true; apply(S, 0); a11sfx('c2_25_acople_captura_pestillos', 0.6);
      if (AUTO()) { setTimeout(() => finish(true), 900); return; }
      const cal = q('.dock-cal'), ndl = q('.dock-cal-n'), bar = q('.dock-cal-p i'), txt = q('.dock-cal-t'); cal.hidden = false;
      q('.dock-coas').classList.add('dim'); msgT = 0;
      hint.textContent = isTouch ? tx(['Mueve la palanca para mantener la aguja en verde', 'Move the stick to keep the needle in the green'])
        : tx(['A / D: mantén la aguja de rolido en la franja verde para cerrar los pestillos', 'A / D: keep the roll needle in the green band to close the latches']);
      hint.className = 'dock-hint go';
      let ang = (Math.random() < 0.5 ? -1 : 1) * 0.55, prog = 0, latches = 0, tt = 0; const BAND = LVL.band, NEED = LVL.need; // NEED: s dentro de la franja
      const bandEl = q('.dock-cal-band'); bandEl.style.left = ((1 - BAND) * 50).toFixed(1) + '%'; bandEl.style.width = (BAND * 100).toFixed(1) + '%';
      const seed = Math.random() * 6;
      off = loop((dt) => {
        if (!dt) return; tt += dt; S.secs += dt;
        const inp = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0) + input.stick.x;
        const drift = Math.sin(tt * 1.25 + seed) * 0.55 + Math.sin(tt * 0.42 + seed * 2) * 0.45;
        ang = Math.max(-1, Math.min(1, ang + (drift * 0.42 * LVL.drift + Math.max(-1, Math.min(1, inp)) * 0.95) * dt));
        const inBand = Math.abs(ang) <= BAND;
        prog = Math.max(0, Math.min(1, prog + (inBand ? dt / NEED : -dt / (NEED * 2.5))));
        const n = Math.floor(prog * 12 + 1e-6);
        if (n > latches) { latches = n; sfx('switch', { vol: 0.35, rate: 0.9 + n * 0.03 }); }
        latches = n;
        ndl.style.left = ((ang + 1) * 50).toFixed(2) + '%'; ndl.className = 'dock-cal-n' + (inBand ? ' ok' : '');
        bar.style.width = (prog * 100).toFixed(1) + '%'; txt.textContent = (L() ? 'Latches ' : 'Pestillos ') + latches + ' / 12';
        if (prog >= 1) {
          off?.(); off = null; a11sfx('c2_25_acople_captura_pestillos', 0.9); S.calSecs = Math.round(tt);
          hint.textContent = tx(['¡Acople firme! Los 12 pestillos cerrados.', 'Hard dock! All 12 latches closed.']); hint.className = 'dock-hint ok';
          setTimeout(() => finish(true), 1100);
        }
      });
    }
    off = loop((dt) => {
      if (!dt) return; S.secs += dt;
      let ax = 0, ay = 0, ar = 0;
      if (AUTO()) { ax = -S.x * 0.8 - S.vx; ay = -S.y * 0.8 - S.vy; ar = (S.range > 1.5 ? 0.25 : 0.12) - S.vr; ar = Math.max(-1, Math.min(1, ar * 4)); dt *= 4; }
      else {
        ax = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0) + input.stick.x;
        ay = (down('KeyW', 'ArrowUp') ? 1 : 0) - (down('KeyS', 'ArrowDown') ? 1 : 0) + input.stick.y;
        ar = (down('KeyR', 'Space') || bdown('dock-fwd') ? 1 : 0) - (down('KeyF', 'ShiftLeft', 'ShiftRight') || bdown('dock-brk') ? 1 : 0);
        ax = Math.max(-1, Math.min(1, ax)); ay = Math.max(-1, Math.min(1, ay));
        // Asistente (idea del equipo): con la cruz en verde la nave avanza sola, despacio. Si te desalineas, frena y espera.
        // R / F siguen mandando: acelerar o frenar a mano.
        const aligned = Math.hypot(S.x, S.y) <= tolLat;
        S.auto = ar === 0 && S.rcs > 0;
        if (S.auto && aligned) { const want = Math.min(0.14, tolClose * 0.55); S.vr += Math.max(-0.05, Math.min(0.05, want - S.vr)) * dt * 2.5; }
        else if (S.auto && S.vr > 0) S.vr *= Math.exp(-dt * 0.9);
      }
      const thrusting = S.rcs > 0 && (Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15 || ar !== 0);
      if (S.rcs <= 0) { ax = ay = ar = 0; }
      S.vx += ax * 0.16 * dt; S.vy += ay * 0.16 * dt; S.vr += ar * 0.07 * dt;
      // deriva leve (actitud mantenida por la computadora, pero no perfecta)
      S.pitch += (Math.sin(S.secs * 0.7) * 0.02 - S.pitch * 0.5) * dt; S.yaw += (Math.cos(S.secs * 0.5) * 0.02 - S.yaw * 0.5) * dt;
      S.vx += S.yaw * 0.01 * dt; S.vy += S.pitch * 0.01 * dt;
      if (thrusting) { const use = (Math.min(1, Math.abs(ax)) + Math.min(1, Math.abs(ay)) + Math.abs(ar)) * 1.6 * dt; S.rcs = Math.max(0, S.rcs - use); S.rcsUsed += use;
        pulseT -= dt; if (pulseT <= 0) { pulseT = 0.28; a11sfx('c2_25_rcs_propulsor_pulso', 0.35); } }
      S.x += S.vx * dt; S.y += S.vy * dt; S.range -= S.vr * dt;
      S.range = Math.min(S.range, (opts.range0 ?? 14) + 8);
      if (S.range <= 0) {
        const lat = Math.hypot(S.x, S.y); S.closingAtContact = S.vr;
        if (S.vr <= tolClose && lat <= tolLat) {
          off?.(); off = null; calibrate(); return;
        }
        S.attempts++; sfx('clunk', { vol: 0.7 }); S.range = 1.4; S.vr = -0.12; S.vx *= -0.3; S.vy *= -0.3;
        say(S.vr > tolClose || S.closingAtContact > tolClose ? ['Demasiado rápido: la sonda rebota.', 'Too fast: the probe bounces off.'] : ['Desalineado: la sonda no entra en el cono.', 'Misaligned: the probe misses the drogue.'], 'bad');
        if (S.attempts >= maxAttempts) { off?.(); off = null; setTimeout(() => finish(false), 600); return; }
      }
      apply(S, dt);
      // HUD
      const k = 60 / Math.max(0.6, tolLat * 4); tgt.setAttribute('transform', `translate(${(S.x * k).toFixed(1)} ${(-S.y * k).toFixed(1)})`);
      const latOk = Math.hypot(S.x, S.y) <= tolLat, vOk = S.vr <= tolClose && S.vr > 0;
      tgt.classList.toggle('ok', latOk); q('.r').textContent = S.range.toFixed(1) + ' m';
      const vb = q('.v'); vb.textContent = S.vr < -0.01 ? (L() ? 'away ' : 'aleja ') + (-S.vr).toFixed(2) : S.vr.toFixed(2) + ' m/s'; vb.className = 'v ' + (S.range < 4 ? (vOk ? 'ok' : S.vr > tolClose ? 'bad' : '') : '');
      q('.o').textContent = Math.round(Math.hypot(S.x, S.y) * 100) + ' cm'; q('.o').className = 'o ' + (latOk ? 'ok' : '');
      const r0 = (opts.range0 ?? 14); q('.dock-distbar i').style.height = Math.max(0, Math.min(100, (1 - S.range / r0) * 100)).toFixed(1) + '%'; q('.dock-dist b').textContent = Math.max(0, S.range).toFixed(1) + ' m';
      q('.f').textContent = Math.round(S.rcs) + '%'; q('.fb i').style.width = S.rcs + '%'; q('.a').textContent = `${S.attempts}/${maxAttempts}`;
      // Pista guiada: dice siempre el siguiente paso (alinear → acercar con R → frenar), no solo los controles.
      // Antes, con la cruz en verde «no pasaba nada»: faltaba acercarse con R y nadie lo decía.
      if (msgT > 0) { msgT -= dt; if (msgT <= 0) hint.className = 'dock-hint'; }
      else {
        const R = isTouch ? (L() ? 'CLOSE IN' : 'ACERCAR') : 'R', F = isTouch ? (L() ? 'BRAKE' : 'FRENAR') : 'F', MOVE = isTouch ? (L() ? 'the stick' : 'la palanca') : 'WASD';
        let m, cls = '';
        if (S.rcs <= 0) { m = ['RCS agotado: deriva hasta el contacto', 'RCS empty: drifting to contact']; cls = 'warn'; }
        else if (S.range < 3 && S.vr > tolClose) { m = [`¡Demasiado rápido! Mantén ${F} para frenar`, `Too fast! Hold ${F} to brake`]; cls = 'warn'; }
        else if (!latOk) { m = [`1 · Lleva la cruz al centro con ${MOVE} hasta que se ponga verde`, `1 · Bring the cross to the centre with ${MOVE} until it turns green`]; }
        else if (S.auto) { m = [`2 · ¡Alineado! Acercándote solo… mantén la cruz en verde (${R} más rápido · ${F} frenar)`, `2 · Aligned! Closing in on your own… keep the cross green (${R} faster · ${F} brake)`]; cls = 'go'; }
        else if (S.vr <= 0.03) { m = [`2 · ¡Alineado! Mantén ${R} para acercarte a Eagle`, `2 · Aligned! Hold ${R} to close in on Eagle`]; cls = 'go'; }
        else if (S.vr > tolClose * 0.8) { m = [`Suelta ${R}: vas rápido. Contacto con cierre ≤ ${tolClose.toFixed(1)} m/s`, `Let go of ${R}: you are fast. Contact at ≤ ${tolClose.toFixed(1)} m/s closing`]; cls = 'warn'; }
        else { m = [`3 · Bien: te acercas despacio. Mantén la cruz en verde · ${S.range.toFixed(1)} m`, `3 · Good: closing slowly. Keep the cross green · ${S.range.toFixed(1)} m`]; cls = 'ok'; }
        hint.textContent = tx(m); hint.className = 'dock-hint ' + cls;
      }
    });
  });
}
