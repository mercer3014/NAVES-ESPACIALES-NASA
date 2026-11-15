// Tarea 3 de la Fase 1: «Repara la fuga».
// 1) Encuentra la válvula que silba (vapor) en la torre umbilical. 2) Aprieta la llave: 3 vueltas arrastrando en círculo.
// 3) Gira 4 piezas de tubería (toque = 90°) hasta unir ENTRADA con SALIDA.
// Dato real: 16 jul 1969, ~02:30, fuga en la válvula de reposición de LH2 a ~200 pies en la torre umbilical.
// Contrato: mountTask(el, { diff, diffName, hint(msg), sfx(name), signal }) -> Promise<{ ok, time, mistakes }>.
// La lógica pura (puzzle de tuberías y contador de vueltas) se exporta aparte para poder probarla sin DOM.

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 0=N 1=E 2=S 3=W
const opp = (d) => (d + 2) % 4;
const TAU = Math.PI * 2;

// ---------- Lógica pura: tuberías ----------
/** Conjunto de lados abiertos de una pieza: S = recta, E = codo. Devuelve máscara de 4 bits (bit d = lado d). */
export function pieceMask(type, rot) {
  const r = ((rot % 4) + 4) % 4;
  const sides = type === 'S' ? [(1 + r) % 4, (3 + r) % 4] : [r, (r + 1) % 4];
  return sides.reduce((m, d) => m | (1 << d), 0);
}
const maskOf = (sides) => sides.reduce((m, d) => m | (1 << d), 0);
const hasDir = (m, d) => (m & (1 << d)) !== 0;

/** Recorre el flujo desde la entrada. Devuelve { lit:Set<'x,y'>, done }. */
export function flowReach(pz) {
  const at = (x, y) => pz.cells.find((c) => c.x === x && c.y === y);
  const lit = new Set();
  let done = false;
  const first = at(pz.entry.x, pz.entry.y);
  if (!first || !hasDir(pieceMask(first.type, first.rot), pz.entry.dir)) return { lit, done };
  const q = [first];
  lit.add(first.x + ',' + first.y);
  while (q.length) {
    const c = q.shift();
    const m = pieceMask(c.type, c.rot);
    for (let d = 0; d < 4; d++) {
      if (!hasDir(m, d)) continue;
      const nx = c.x + DIRS[d][0], ny = c.y + DIRS[d][1];
      const n = at(nx, ny);
      if (!n) { if (c.x === pz.exit.x && c.y === pz.exit.y && d === pz.exit.dir) done = true; continue; }
      const k = nx + ',' + ny;
      if (lit.has(k) || !hasDir(pieceMask(n.type, n.rot), opp(d))) continue;
      lit.add(k); q.push(n);
    }
  }
  return { lit, done };
}

/** Genera un circuito 2x2 de 4 piezas con solución garantizada y lo desordena (nunca nace resuelto). */
export function makePuzzle(rand = Math.random) {
  const ri = (n) => Math.floor(rand() * n);
  const loops = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const start = ri(4), dirn = rand() < 0.5 ? 1 : -1;
  const path = [0, 1, 2, 3].map((i) => loops[(start + dirn * i + 8) % 4]);
  const inside = (x, y) => x >= 0 && x < 2 && y >= 0 && y < 2;
  const outsideDirs = ([x, y]) => [0, 1, 2, 3].filter((d) => !inside(x + DIRS[d][0], y + DIRS[d][1]));
  const eOpts = outsideDirs(path[0]), xOpts = outsideDirs(path[3]);
  const entryDir = eOpts[ri(eOpts.length)], exitDir = xOpts[ri(xOpts.length)];
  const dirTo = (a, b) => DIRS.findIndex((d) => a[0] + d[0] === b[0] && a[1] + d[1] === b[1]);
  const cells = path.map((p, i) => {
    const inD = i === 0 ? entryDir : dirTo(p, path[i - 1]);
    const outD = i === 3 ? exitDir : dirTo(p, path[i + 1]);
    const need = maskOf([inD, outD]);
    const type = (inD + 2) % 4 === outD ? 'S' : 'E';
    const sol = [0, 1, 2, 3].find((r) => pieceMask(type, r) === need);
    return { x: p[0], y: p[1], type, need, sol, rot: sol };
  });
  const pz = { cells, entry: { x: path[0][0], y: path[0][1], dir: entryDir }, exit: { x: path[3][0], y: path[3][1], dir: exitDir } };
  for (let tries = 0; tries < 200; tries++) {
    cells.forEach((c) => { c.rot = ri(4); });
    const wrong = cells.filter((c) => pieceMask(c.type, c.rot) !== c.need).length;
    if (wrong >= 2 && !flowReach(pz).done) break;
  }
  if (flowReach(pz).done) { cells[0].rot = (cells[0].sol + 1) % 4; cells[1].rot = (cells[1].sol + 1) % 4; }
  return pz;
}
export const puzzleSolved = (pz) => flowReach(pz).done;
export const rotateCell = (pz, i) => { pz.cells[i].rot = (pz.cells[i].rot + 1) % 4; return pz.cells[i].rot; };

// ---------- Lógica pura: llave (vueltas) ----------
/** Acumula el giro en sentido horario (ángulos de atan2 con eje Y hacia abajo). Girar al revés resta. */
export function createTurnTracker(target = 3) {
  let last = null, total = 0;
  const max = target * TAU;
  return {
    start(a) { last = a; },
    move(a) {
      if (last == null) { last = a; return total; }
      let d = a - last;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      last = a;
      total = Math.min(max, Math.max(0, total + d));
      return total;
    },
    end() { last = null; },
    get angle() { return total; },
    get turns() { return total / TAU; },
    get done() { return total >= max - 1e-6; },
  };
}

// ---------- Textos [es, en] ----------
const TXT = {
  fact: ['16 jul 1969, 02:30: fuga en la válvula de LH2', '16 Jul 1969, 02:30: leak at the LH2 valve'],
  s1: ['Encuentra la válvula que echa vapor', 'Find the valve that is hissing'],
  s2: ['Aprieta la llave: gira en círculo', 'Tighten the wrench: turn in circles'],
  s3: ['Gira las piezas: une ENTRADA con SALIDA', 'Turn the pipes: join IN with OUT'],
  h1: ['Toca la válvula del medio: es la que echa vapor.', 'Tap the middle valve: it is the one hissing.'],
  h2: ['Arrastra el dedo en círculo, hacia la derecha.', 'Drag in a circle, clockwise.'],
  h3: ['Toca una pieza para girarla. El tubo se pone ámbar al pasar el fluido.', 'Tap a piece to turn it. The pipe turns amber when fluid flows.'],
  tower: ['TORRE UMBILICAL', 'UMBILICAL TOWER'],
  turn: ['VUELTA', 'TURN'],
  in: ['ENTRADA', 'IN'],
  out: ['SALIDA', 'OUT'],
  sealed: ['FUGA CERRADA', 'LEAK SEALED'],
  lh2: ['LH2', 'LH2'],
};
const lng = () => (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 1 : 0);
const tx = (k) => TXT[k][lng()];

// ---------- Estilos (una sola vez) ----------
const CSS = `
.pt-leak{position:relative;width:100%;height:100%;min-height:340px;display:flex;flex-direction:column;gap:8px;padding:8px;box-sizing:border-box;background:#0B0C0E;color:#F2EFE6;font-family:'Barlow Semi Condensed',system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.pt-leak-top{display:flex;flex-direction:column;gap:4px;flex:none}
.pt-leak-fact{font-family:'IBM Plex Mono',monospace;font-size:clamp(11px,1.5vw,14px);color:#FFB000;border-left:4px solid #FF4F00;padding:2px 8px;letter-spacing:.02em}
.pt-leak-step{display:flex;align-items:center;gap:10px;font-family:Jost,'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:clamp(16px,2.4vw,24px);line-height:1.15}
.pt-leak-dots{display:flex;gap:4px;flex:none}
.pt-leak-dots i{display:block;width:22px;height:8px;background:#3A3D42;border-radius:0}
.pt-leak-dots i.on{background:#FF4F00}
.pt-leak-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#15171A;border:2px solid #3A3D42;border-radius:2px}
.pt-leak-svg{width:100%;height:100%;max-height:100%;display:block;touch-action:none}
.pt-leak-hit{fill:transparent;cursor:pointer;touch-action:none}
.pt-leak-puff{fill:#F2EFE6;opacity:0;transform-box:fill-box;transform-origin:center;animation:pt-leak-puff 1.5s ease-out infinite}
@keyframes pt-leak-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:calc(.9*var(--leak,1))}100%{opacity:0;transform:translate(var(--dx,6px),-70px) scale(2.2)}}
.pt-leak-wheel{transition:none}
.pt-leak-shake{animation:pt-leak-shake .25s linear 1}
@keyframes pt-leak-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.pt-leak-cell{transition:transform .14s ease-out;transform-box:view-box}
.pt-leak-lit{animation:pt-leak-flow .9s linear infinite}
@keyframes pt-leak-flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-24}}
.pt-leak-msg{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-family:Jost,sans-serif;font-weight:700;font-size:clamp(16px,3vw,26px);color:#0B0C0E;pointer-events:none}
.pt-leak-msg b{display:inline-block;background:#FFB000;padding:6px 14px;border-radius:2px}
@media (prefers-reduced-motion:reduce){.pt-leak-puff,.pt-leak-lit{animation-duration:3s}.pt-leak-cell{transition:none}}
`;
function ensureCss() {
  if (document.getElementById('pt-leak-css')) return;
  const s = document.createElement('style');
  s.id = 'pt-leak-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------- DOM helpers ----------
const NS = 'http://www.w3.org/2000/svg';
const S = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const C = { black: '#0B0C0E', cream: '#F2EFE6', orange: '#FF4F00', gray: '#3A3D42', amber: '#FFB000', red: '#E0201B' };

function steam(parent, x, y, k = 1) {
  const g = S('g', { style: `--leak:${k}` }, parent);
  for (let i = 0; i < 5; i++) {
    const c = S('circle', { cx: x + (i % 2 ? 3 : -3), cy: y, r: 6 + (i % 3) * 2, class: 'pt-leak-puff' }, g);
    c.style.animationDelay = (i * 0.3) + 's';
    c.style.setProperty('--dx', (i - 2) * 6 + 'px');
  }
  return g;
}

export default function mountTask(el, opts = {}) {
  const { diffName = 'normal', hint = () => {}, sfx = () => {}, signal } = opts;
  ensureCss();
  const hints = diffName !== 'veteran';
  const t0 = performance.now();
  let mistakes = 0, phase = 0, finished = false, idleTimer = 0, endTimer = 0;
  const own = new AbortController();
  const on = (target, ev, fn) => target.addEventListener(ev, fn, { signal: own.signal });

  const root = document.createElement('div');
  root.className = 'pt-leak';
  root.innerHTML = `<div class="pt-leak-top"><div class="pt-leak-fact"></div><div class="pt-leak-step"><span class="pt-leak-dots"><i></i><i></i><i></i></span><span class="pt-leak-label"></span></div></div><div class="pt-leak-stage"></div>`;
  el.appendChild(root);
  root.querySelector('.pt-leak-fact').textContent = tx('fact');
  const labelEl = root.querySelector('.pt-leak-label');
  const dots = [...root.querySelectorAll('.pt-leak-dots i')];
  const stage = root.querySelector('.pt-leak-stage');

  return new Promise((resolve) => {
    const finish = (ok) => {
      if (finished) return;
      finished = true;
      clearTimeout(idleTimer); clearTimeout(endTimer);
      own.abort();
      root.remove();
      resolve({ ok, time: (performance.now() - t0) / 1000, mistakes });
    };
    if (signal) { if (signal.aborted) { finish(false); return; } signal.addEventListener('abort', () => finish(false), { once: true, signal: own.signal }); }

    const armIdle = () => {
      clearTimeout(idleTimer);
      if (!hints || finished) return;
      const k = ['h1', 'h2', 'h3'][phase];
      idleTimer = setTimeout(() => { hint(tx(k)); armIdle(); }, 10000);
    };
    const miss = () => { mistakes++; sfx('error'); stage.classList.remove('pt-leak-shake'); void stage.offsetWidth; stage.classList.add('pt-leak-shake'); armIdle(); };
    const setPhase = (n) => {
      phase = n;
      labelEl.textContent = tx(['s1', 's2', 's3'][n]);
      dots.forEach((d, i) => d.classList.toggle('on', i <= n));
      stage.innerHTML = '';
      armIdle();
    };

    // ----- Fase 1: encontrar la válvula -----
    function scene1() {
      setPhase(0);
      const svg = S('svg', { viewBox: '0 0 360 420', class: 'pt-leak-svg', preserveAspectRatio: 'xMidYMid meet' }, stage);
      S('rect', { x: 0, y: 396, width: 360, height: 24, fill: C.gray }, svg);
      // cohete
      S('path', { d: 'M40 400 V120 Q40 60 70 28 Q100 60 100 120 V400 Z', fill: C.cream }, svg);
      S('rect', { x: 40, y: 300, width: 60, height: 14, fill: C.black }, svg);
      S('rect', { x: 40, y: 200, width: 60, height: 14, fill: C.black }, svg);
      S('path', { d: 'M40 400 L16 400 L40 340 Z M100 400 L124 400 L100 340 Z', fill: C.orange }, svg);
      // torre (celosía)
      const tw = S('g', { stroke: C.gray, 'stroke-width': 5, fill: 'none' }, svg);
      S('rect', { x: 236, y: 20, width: 64, height: 380 }, tw);
      for (let y = 20; y < 392; y += 64) {
        S('line', { x1: 236, y1: y, x2: 300, y2: y + 64 }, tw);
        S('line', { x1: 300, y1: y, x2: 236, y2: y + 64 }, tw);
      }
      // brazos umbilicales
      [100, 200, 300].forEach((y) => S('rect', { x: 100, y: y - 5, width: 136, height: 10, fill: C.gray }, svg));
      const lab = S('text', { x: 4, y: 14, fill: C.gray, 'font-size': 13, 'font-family': 'IBM Plex Mono,monospace' }, svg);
      lab.textContent = tx('tower');
      // válvulas: 300 ft / 200 ft (fuga) / 100 ft
      [[100, '300 FT', false], [200, '200 FT', true], [300, '100 FT', false]].forEach(([y, ft, leak]) => {
        const g = S('g', {}, svg);
        S('rect', { x: 150, y: y - 11, width: 28, height: 22, fill: leak ? C.orange : C.gray }, g);
        S('circle', { cx: 164, cy: y, r: 9, fill: C.black, stroke: C.cream, 'stroke-width': 3 }, g);
        const tt = S('text', { x: 312, y: y + 4, fill: C.cream, 'font-size': 13, 'font-family': 'IBM Plex Mono,monospace' }, g);
        tt.textContent = ft;
        if (leak) {
          steam(g, 164, y - 14, 1);
          const t2 = S('text', { x: 140, y: y + 32, fill: C.amber, 'font-size': 13, 'font-family': 'IBM Plex Mono,monospace' }, g);
          t2.textContent = tx('lh2');
        }
        const hit = S('circle', { cx: 164, cy: y, r: 42, class: 'pt-leak-hit' }, g);
        on(hit, 'pointerdown', (e) => {
          e.preventDefault();
          if (finished) return;
          if (leak) { sfx('switch'); scene2(); } else miss();
        });
      });
    }

    // ----- Fase 2: apretar la llave -----
    function scene2() {
      setPhase(1);
      const svg = S('svg', { viewBox: '0 0 360 420', class: 'pt-leak-svg', preserveAspectRatio: 'xMidYMid meet' }, stage);
      const cx = 180, cy = 170;
      // cuerpo de la válvula + vapor
      const body = S('g', {}, svg);
      S('rect', { x: 120, y: 330, width: 120, height: 50, fill: C.gray }, body);
      S('rect', { x: 164, y: 296, width: 32, height: 40, fill: C.gray }, body);
      steam(body, 150, 322, 1); steam(body, 212, 322, 1);
      S('circle', { cx, cy, r: 138, fill: 'none', stroke: C.gray, 'stroke-width': 8 }, svg);
      const arcR = 138, circ = TAU * arcR;
      const arc = S('circle', { cx, cy, r: arcR, fill: 'none', stroke: C.amber, 'stroke-width': 8, 'stroke-dasharray': `0 ${circ}`, transform: `rotate(-90 ${cx} ${cy})` }, svg);
      const wheel = S('g', { class: 'pt-leak-wheel' }, svg);
      S('circle', { cx, cy, r: 104, fill: C.black, stroke: C.cream, 'stroke-width': 14 }, wheel);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        S('line', { x1: cx - Math.cos(a) * 100, y1: cy - Math.sin(a) * 100, x2: cx + Math.cos(a) * 100, y2: cy + Math.sin(a) * 100, stroke: C.gray, 'stroke-width': 12 }, wheel);
      }
      S('circle', { cx, cy: cy - 104, r: 15, fill: C.orange }, wheel);
      S('circle', { cx, cy, r: 24, fill: C.orange }, wheel);
      const turnTxt = S('text', { x: cx, y: cy + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: C.black, 'font-family': 'IBM Plex Mono,monospace', style: 'pointer-events:none' }, svg);
      const pips = [0, 1, 2].map((i) => S('rect', { x: 126 + i * 40, y: 398, width: 32, height: 12, fill: C.gray }, svg));
      const hit = S('rect', { x: 0, y: 0, width: 360, height: 420, class: 'pt-leak-hit' }, svg);

      const trk = createTurnTracker(3);
      let drag = null;
      const ang = (e) => {
        const r = wheel.getBoundingClientRect();
        const px = r.left + r.width / 2, py = r.top + r.height / 2;
        const dx = e.clientX - px, dy = e.clientY - py;
        return { a: Math.atan2(dy, dx), d: Math.hypot(dx, dy), r: r.width / 2 };
      };
      const render = () => {
        const frac = trk.turns % 1, whole = Math.floor(trk.turns + 1e-9);
        wheel.setAttribute('transform', `rotate(${(trk.angle * 180) / Math.PI} ${cx} ${cy})`);
        arc.setAttribute('stroke-dasharray', `${trk.done ? circ : frac * circ} ${circ}`);
        const k = Math.max(0, 1 - trk.turns / 3);
        body.querySelectorAll('g').forEach((g) => g.style.setProperty('--leak', k));
        pips.forEach((p, i) => p.setAttribute('fill', i < whole || trk.done ? C.orange : C.gray));
        turnTxt.textContent = Math.min(3, whole + 1) + '/3';
      };
      render();
      let lastTick = 0;
      on(hit, 'pointerdown', (e) => {
        if (finished || drag != null) return;
        e.preventDefault();
        const p = ang(e);
        if (p.d < 24) return;
        drag = e.pointerId;
        try { hit.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
        trk.start(p.a); armIdle();
      });
      on(hit, 'pointermove', (e) => {
        if (e.pointerId !== drag || finished) return;
        e.preventDefault();
        const p = ang(e);
        if (p.d < 24) return;
        const before = Math.floor(trk.turns);
        trk.move(p.a); render(); armIdle();
        const now = Math.floor(trk.turns);
        if (now > before && now > lastTick) { lastTick = now; sfx('switch'); }
        if (trk.done) { drag = null; sfx('ok'); endTimer = setTimeout(scene3, 450); }
      });
      const up = (e) => { if (e.pointerId === drag) { drag = null; trk.end(); } };
      on(hit, 'pointerup', up); on(hit, 'pointercancel', up);
    }

    // ----- Fase 3: tuberías -----
    function scene3() {
      setPhase(2);
      endTimer = 0;
      const pz = makePuzzle();
      const svg = S('svg', { viewBox: '0 0 440 440', class: 'pt-leak-svg', preserveAspectRatio: 'xMidYMid meet' }, stage);
      const O = 110, CS = 110, H = CS / 2;
      const cellC = (x, y) => [O + x * CS + H, O + y * CS + H];
      S('rect', { x: O, y: O, width: CS * 2, height: CS * 2, fill: '#0F1113', stroke: C.gray, 'stroke-width': 2 }, svg);
      // tubos de entrada / salida
      const stub = (pt, kind) => {
        const [cx, cy] = cellC(pt.x, pt.y);
        const [dx, dy] = DIRS[pt.dir];
        const x1 = cx + dx * H, y1 = cy + dy * H, x2 = cx + dx * (H + 30), y2 = cy + dy * (H + 30);
        const ln = S('line', { x1, y1, x2, y2, stroke: C.gray, 'stroke-width': 22 }, svg);
        const inner = S('line', { x1, y1, x2, y2, stroke: kind === 'in' ? C.amber : C.black, 'stroke-width': 10 }, svg);
        const off = H + 30 + (dx ? 35 : 14), bx = cx + dx * off, by = cy + dy * off;
        S('rect', { x: bx - 33, y: by - 11, width: 66, height: 22, fill: kind === 'in' ? C.amber : C.gray }, svg);
        const t = S('text', { x: bx, y: by + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: C.black, 'font-family': 'IBM Plex Mono,monospace' }, svg);
        t.textContent = kind === 'in' ? tx('in') : tx('out');
        if (kind === 'out') t.setAttribute('fill', C.cream);
        void ln;
        return inner;
      };
      stub(pz.entry, 'in');
      const outInner = stub(pz.exit, 'out');
      const view = pz.cells.map((c, i) => {
        const [cx, cy] = cellC(c.x, c.y);
        const g = S('g', { class: 'pt-leak-cell', style: `transform-origin:${cx}px ${cy}px` }, svg);
        const d = c.type === 'S' ? `M${cx - H} ${cy}H${cx + H}` : `M${cx} ${cy - H}V${cy}H${cx + H}`;
        S('path', { d, fill: 'none', stroke: C.gray, 'stroke-width': 22, 'stroke-linejoin': 'round', 'stroke-linecap': 'butt' }, g);
        const inner = S('path', { d, fill: 'none', stroke: C.black, 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-dasharray': '16 8' }, g);
        let acc = c.rot * 90;
        g.style.transform = `rotate(${acc}deg)`;
        const hit = S('rect', { x: cx - H + 2, y: cy - H + 2, width: CS - 4, height: CS - 4, class: 'pt-leak-hit' }, svg);
        return { g, inner, hit, i, get acc() { return acc; }, bump() { acc += 90; g.style.transform = `rotate(${acc}deg)`; } };
      });
      const refresh = () => {
        const { lit, done } = flowReach(pz);
        view.forEach((v) => {
          const c = pz.cells[v.i], on1 = lit.has(c.x + ',' + c.y);
          v.inner.setAttribute('stroke', on1 ? C.amber : C.black);
          v.inner.classList.toggle('pt-leak-lit', on1);
        });
        outInner.setAttribute('stroke', done ? C.amber : C.black);
        return done;
      };
      refresh();
      view.forEach((v) => on(v.hit, 'pointerdown', (e) => {
        e.preventDefault();
        if (finished || endTimer) return;
        const c = pz.cells[v.i];
        if (pieceMask(c.type, c.rot) === c.need) { mistakes++; } // giró una pieza que ya estaba bien
        rotateCell(pz, v.i); v.bump(); sfx('switch'); armIdle();
        if (refresh()) {
          sfx('ok');
          const m = document.createElement('div');
          m.className = 'pt-leak-msg';
          m.innerHTML = '<b></b>';
          m.firstChild.textContent = tx('sealed');
          stage.appendChild(m);
          clearTimeout(idleTimer);
          endTimer = setTimeout(() => finish(true), 1100);
        }
      }));
    }

    scene1();
  });
}
