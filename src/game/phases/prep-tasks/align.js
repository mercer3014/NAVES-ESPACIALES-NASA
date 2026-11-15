// Tarea 4 de la Fase 1: «Alinea la plataforma de guiado».
// Tres anillos concéntricos (cabeceo, alabeo, guiñada) se arrastran para girar. Cuando los tres quedan
// dentro de la tolerancia (±3°), la cruz central se pone verde (luz de instrumento).
// Dato real: el AGC necesitaba su plataforma inercial alineada antes del despegue para saber «dónde es arriba».
// Contrato: mountTask(el, { diff, diffName, hint(msg), sfx(name), signal }) -> Promise<{ ok, time, mistakes }>.

const DEG = 180 / Math.PI;

// ---------- Lógica pura ----------
/** Tolerancia en grados según dificultad. */
export const tolFor = (diffName) => (diffName === 'veteran' ? 2 : diffName === 'cadet' ? 4.5 : 3);
/** Normaliza un ángulo a (-180, 180]. */
export function normAngle(a) {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  return r;
}
/** ¿Está el ángulo dentro de ±tol del cero? */
export const inTol = (a, tol) => Math.abs(normAngle(a)) <= tol;
/** ¿Están los tres anillos alineados? */
export const allAligned = (angles, tol) => angles.every((a) => inTol(a, tol));
/** Ángulos iniciales aleatorios: cada uno al menos 35° del cero, nunca resuelto. */
export function startAngles(rand = Math.random, n = 3) {
  return Array.from({ length: n }, () => {
    const mag = 35 + rand() * 130;
    return normAngle(rand() < 0.5 ? mag : -mag);
  });
}
/** Anillo (0 exterior, 1 medio, 2 interior) según distancia al centro en unidades del viewBox. */
export function ringAt(dist) {
  if (dist > 172) return -1;
  if (dist > 112) return 0;
  if (dist > 56) return 1;
  return 2;
}

// ---------- Textos [es, en] ----------
const TXT = {
  fact: ['El AGC necesita saber dónde es arriba antes de despegar.', 'The AGC must know which way is up before liftoff.'],
  step: ['Gira cada anillo: marca naranja arriba', 'Turn each ring: orange mark on top'],
  hint: ['Arrastra el dedo sobre un anillo para girarlo. Alinea las tres marcas con la flecha de arriba.', 'Drag over a ring to turn it. Line up the three marks with the arrow on top.'],
  names: [['CABECEO', 'PITCH'], ['ALABEO', 'ROLL'], ['GUIÑADA', 'YAW']],
  ok: ['PLATAFORMA ALINEADA', 'PLATFORM ALIGNED'],
};
const lng = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 1 : 0);
const tx = (k) => TXT[k][lng()];

const CSS = `
.pt-align{position:relative;width:100%;height:100%;min-height:340px;display:flex;flex-direction:column;gap:8px;padding:8px;box-sizing:border-box;background:#0B0C0E;color:#F2EFE6;font-family:'Barlow Semi Condensed',system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.pt-align-fact{font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.5vw,14px);color:#FFB000;border-left:4px solid #FF4F00;padding:2px 8px;flex:none}
.pt-align-step{font-family:Jost,'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:clamp(16px,2.4vw,24px);line-height:1.15;flex:none}
.pt-align-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#15171A;border:2px solid #3A3D42;border-radius:2px}
.pt-align-svg{width:100%;height:100%;max-height:100%;display:block;touch-action:none;cursor:grab}
.pt-align-chips{display:flex;gap:6px;flex:none}
.pt-align-chip{flex:1;min-height:56px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#15171A;border:2px solid #3A3D42;border-radius:2px;font-size:clamp(12px,1.8vw,16px);letter-spacing:.06em}
.pt-align-chip b{font-family:'IBM Plex Mono',monospace;font-size:clamp(16px,2.6vw,22px);color:#F2EFE6}
.pt-align-chip.ok{border-color:#FFB000}
.pt-align-chip.ok b{color:#FFB000}
.pt-align-msg{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-family:Jost,sans-serif;font-weight:700;font-size:clamp(16px,3vw,26px);color:#0B0C0E;pointer-events:none}
.pt-align-msg b{display:inline-block;background:#7CFF4F;padding:6px 14px;border-radius:2px}
`;
function ensureCss() {
  if (document.getElementById('pt-align-css')) return;
  const s = document.createElement('style');
  s.id = 'pt-align-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const NS = 'http://www.w3.org/2000/svg';
const S = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const C = { black: '#0B0C0E', cream: '#F2EFE6', orange: '#FF4F00', gray: '#3A3D42', amber: '#FFB000', green: '#7CFF4F' };

export default function mountTask(el, opts = {}) {
  const { diffName = 'normal', hint = () => {}, sfx = () => {}, signal } = opts;
  ensureCss();
  const tol = tolFor(diffName);
  const hints = diffName !== 'veteran';
  const t0 = performance.now();
  let mistakes = 0, finished = false, idleTimer = 0, holdTimer = 0, endTimer = 0;
  const own = new AbortController();
  const on = (target, ev, fn, o = {}) => target.addEventListener(ev, fn, { signal: own.signal, ...o });

  const root = document.createElement('div');
  root.className = 'pt-align';
  root.innerHTML = '<div class="pt-align-fact"></div><div class="pt-align-step"></div><div class="pt-align-stage"></div><div class="pt-align-chips"></div>';
  el.appendChild(root);
  root.querySelector('.pt-align-fact').textContent = tx('fact');
  root.querySelector('.pt-align-step').textContent = tx('step');
  const stage = root.querySelector('.pt-align-stage');
  const chipsEl = root.querySelector('.pt-align-chips');

  return new Promise((resolve) => {
    const finish = (ok) => {
      if (finished) return;
      finished = true;
      clearTimeout(idleTimer); clearTimeout(holdTimer); clearTimeout(endTimer);
      own.abort();
      root.remove();
      resolve({ ok, time: (performance.now() - t0) / 1000, mistakes });
    };
    if (signal) { if (signal.aborted) { finish(false); return; } signal.addEventListener('abort', () => finish(false), { once: true, signal: own.signal }); }

    const armIdle = () => {
      clearTimeout(idleTimer);
      if (!hints || finished) return;
      idleTimer = setTimeout(() => { hint(tx('hint')); armIdle(); }, 10000);
    };

    const VB = 340, cx = VB / 2, cy = VB / 2;
    const svg = S('svg', { viewBox: `0 0 ${VB} ${VB}`, class: 'pt-align-svg', preserveAspectRatio: 'xMidYMid meet' }, stage);
    // anillos: radio central y grosor (bandas de 56 unidades: objetivo táctil >= 56 px)
    const R = [{ r: 140, w: 50 }, { r: 84, w: 50 }, { r: 40, w: 26 }];
    const angles = startAngles(Math.random);
    const g = R.map((cfg, i) => {
      S('circle', { cx, cy, r: cfg.r, fill: 'none', stroke: '#1B1D21', 'stroke-width': cfg.w + 4 }, svg);
      const grp = S('g', {}, svg);
      S('circle', { cx, cy, r: cfg.r, fill: 'none', stroke: C.gray, 'stroke-width': cfg.w }, grp);
      for (let a = 0; a < 360; a += 15) {
        const rad = (a / DEG), major = a % 90 === 0;
        const r1 = cfg.r + cfg.w / 2 - 2, r2 = r1 - (major ? 10 : 5);
        S('line', { x1: cx + Math.sin(rad) * r1, y1: cy - Math.cos(rad) * r1, x2: cx + Math.sin(rad) * r2, y2: cy - Math.cos(rad) * r2, stroke: C.cream, 'stroke-width': major ? 3 : 2, opacity: major ? 1 : 0.5 }, grp);
      }
      // marca naranja del anillo (arriba cuando está alineado)
      const mk = S('path', { d: `M${cx - 9} ${cy - cfg.r - cfg.w / 2 + 4}H${cx + 9}L${cx} ${cy - cfg.r + cfg.w / 2 - 4}Z`, fill: C.orange }, grp);
      return { grp, mk, i };
    });
    // flecha fija de referencia (arriba)
    S('path', { d: `M${cx - 11} 3H${cx + 11}L${cx} 19Z`, fill: C.cream }, svg);
    S('line', { x1: cx, y1: 19, x2: cx, y2: cy - 40 - 13, stroke: C.cream, 'stroke-width': 1, 'stroke-dasharray': '3 5', opacity: 0.35 }, svg);
    // cruz central
    S('circle', { cx, cy, r: 24, fill: C.black, stroke: C.gray, 'stroke-width': 2 }, svg);
    const cross = S('g', {}, svg);
    const crossLines = [
      S('line', { x1: cx - 20, y1: cy, x2: cx + 20, y2: cy, 'stroke-width': 4 }, cross),
      S('line', { x1: cx, y1: cy - 20, x2: cx, y2: cy + 20, 'stroke-width': 4 }, cross),
    ];
    const hit = S('rect', { x: 0, y: 0, width: VB, height: VB, fill: 'transparent' }, svg);

    const chips = R.map((_, i) => {
      const d = document.createElement('div');
      d.className = 'pt-align-chip';
      d.innerHTML = '<span></span><b></b>';
      d.firstChild.textContent = TXT.names[i][lng()];
      chipsEl.appendChild(d);
      return d;
    });

    let wasIn = angles.map((a) => inTol(a, tol));
    const locked = angles.map(() => false);
    let won = false;
    const render = () => {
      angles.forEach((a, i) => {
        g[i].grp.setAttribute('transform', `rotate(${a} ${cx} ${cy})`);
        const ok = inTol(a, tol);
        g[i].mk.setAttribute('fill', ok ? C.amber : C.orange);
        chips[i].classList.toggle('ok', ok);
        const n = normAngle(a);
        chips[i].lastChild.textContent = (n > 0 ? '+' : '') + n.toFixed(0) + '°';
      });
      const all = allAligned(angles, tol);
      // la cruz se desplaza y gira según el error: cabeceo = vertical, guiñada = horizontal, alabeo = giro
      const cl = (v) => Math.max(-1, Math.min(1, v / 45));
      const ex = all ? 0 : cl(normAngle(angles[2])) * 16, ey = all ? 0 : cl(normAngle(angles[0])) * 16, er = all ? 0 : normAngle(angles[1]);
      cross.setAttribute('transform', `translate(${ex} ${ey}) rotate(${er} ${cx} ${cy})`);
      crossLines.forEach((l) => l.setAttribute('stroke', all ? C.green : C.cream));
      return all;
    };

    const check = () => {
      const all = render();
      if (all && !won) {
        if (!holdTimer) {
          holdTimer = setTimeout(() => {
            holdTimer = 0;
            if (finished || !allAligned(angles, tol)) return;
            won = true;
            sfx('ok');
            const m = document.createElement('div');
            m.className = 'pt-align-msg';
            m.innerHTML = '<b></b>';
            m.firstChild.textContent = tx('ok');
            stage.appendChild(m);
            clearTimeout(idleTimer);
            endTimer = setTimeout(() => finish(true), 1000);
          }, 650);
        }
      } else if (!all && holdTimer) { clearTimeout(holdTimer); holdTimer = 0; }
    };

    // ----- Interacción: Pointer Events (ratón y táctil) -----
    const toLocal = (e) => {
      const r = svg.getBoundingClientRect();
      const s = Math.min(r.width, r.height) / VB;
      const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
      const dx = e.clientX - ox, dy = e.clientY - oy;
      return { a: Math.atan2(dy, dx) * DEG, d: Math.hypot(dx, dy) / s };
    };
    const drags = new Map(); // pointerId -> { ring, last }
    const bump = (i, delta) => {
      if (won) return;
      angles[i] = normAngle(angles[i] + delta);
      const now = inTol(angles[i], tol);
      if (now && !wasIn[i]) { sfx('switch'); locked[i] = true; }
      if (locked[i] && Math.abs(angles[i]) > 15) { locked[i] = false; mistakes++; } // sacó un anillo ya alineado por mucho
      wasIn[i] = now;
      check(); armIdle();
    };
    on(hit, 'pointerdown', (e) => {
      if (finished || won) return;
      e.preventDefault();
      const p = toLocal(e);
      const ring = ringAt(p.d);
      if (ring < 0 || (ring === 2 && p.d < 12)) return;
      drags.set(e.pointerId, { ring, last: p.a });
      try { hit.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
      armIdle();
    });
    on(hit, 'pointermove', (e) => {
      const d = drags.get(e.pointerId);
      if (!d || finished) return;
      e.preventDefault();
      const p = toLocal(e);
      if (p.d < 12) return;
      const delta = normAngle(p.a - d.last);
      d.last = p.a;
      bump(d.ring, delta);
    });
    const up = (e) => { drags.delete(e.pointerId); };
    on(hit, 'pointerup', up); on(hit, 'pointercancel', up);
    // rueda del ratón opcional: gira el anillo bajo el puntero
    on(hit, 'wheel', (e) => {
      const ring = ringAt(toLocal(e).d);
      if (ring < 0) return;
      e.preventDefault();
      bump(ring, (e.deltaY > 0 ? 1 : -1) * 1.5);
    }, { passive: false });

    render();
    armIdle();
  });
}
