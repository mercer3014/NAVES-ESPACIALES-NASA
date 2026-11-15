// Fase 3 · Minijuego P52: realineación de la plataforma inercial (IMU) mirando por la óptica del módulo de mando.
// Como en el Apolo: la computadora pide una estrella de navegación por su número (octal), apunta el telescopio (SCT,
// campo ancho) donde CREE que está, pero la plataforma ha derivado y la estrella no está en el centro. El jugador la
// identifica con la carta estelar, cambia al sextante (SXT, aumentado), la centra en la retícula y pulsa MARK.
// Tras dos estrellas el DSKY muestra con V06 N05 la diferencia entre el ángulo medido entre ellas y el del catálogo
// (en centésimas de grado: «00002» = 0,02°). Ese error decide la anchura de la zona verde de la LOI.
import { store, isTouch, AUTO, dbg } from '../../core/store.js';
import { extend } from '../../core/i18n.js';
import { pressed, down, axis, makeStick, bindBtn, bpressed, input } from '../../core/input.js';
import { sfx } from '../../core/audio.js';
import './align.css';

extend({
  'c.align': ['Realinea la plataforma (P52)', 'Realign the platform (P52)'],
  'c.p52hint': ['P52: busca la estrella que pide la computadora y márcala', 'P52: find the star the computer asks for and mark it'],
  'c.p52.good': ['P52: plataforma bien alineada', 'P52: platform well aligned'], 'c.p52.fair': ['P52: alineación aceptable', 'P52: acceptable alignment'], 'c.p52.poor': ['P52: alineación pobre', 'P52: poor alignment'],
  'c.p52loi.good': ['Plataforma bien alineada: LOI más precisa', 'Platform well aligned: more precise LOI'],
  'c.p52loi.fair': ['Alineación aceptable: LOI normal', 'Acceptable alignment: normal LOI'],
  'c.p52loi.poor': ['Alineación pobre: la LOI será más difícil', 'Poor alignment: the LOI will be harder'],
});

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');
const RAD = Math.PI / 180;
// Campos de visión del juego (grados): telescopio ancho y sextante aumentado
const FOV_SCT = 36, FOV_SXT = 1;

// Catálogo de estrellas brillantes reales (J2000): [nombre, AR en horas, Dec en grados, magnitud, n.º Apolo (octal) o 0, color]
// Colores: r rojiza, o anaranjada, y amarillenta, b azulada; vacío = blanca.
const CAT = [
  ['Rigel', 5.242, -8.2, 0.13, 12, 'b'], ['Betelgeuse', 5.919, 7.41, 0.5, 0, 'r'], ['Bellatrix', 5.419, 6.35, 1.64, 0, 'b'], ['Mintaka', 5.533, -0.3, 2.23, 0, 'b'],
  ['Alnilam', 5.604, -1.2, 1.69, 0, 'b'], ['Alnitak', 5.679, -1.94, 1.77, 0, 'b'], ['Saiph', 5.796, -9.67, 2.06, 0, 'b'], ['Meissa', 5.585, 9.93, 3.4, 0, 'b'],
  ['Cursa', 5.131, -5.09, 2.8, 0, ''], ['Arneb', 5.546, -17.82, 2.6, 0, ''], ['Nihal', 5.471, -20.76, 2.8, 0, 'y'],
  ['Sirius', 6.752, -16.72, -1.46, 15, 'b'], ['Mirzam', 6.378, -17.96, 1.98, 0, 'b'], ['Adhara', 6.977, -28.97, 1.5, 0, 'b'], ['Wezen', 7.14, -26.39, 1.83, 0, 'y'],
  ['Aludra', 7.402, -29.3, 2.45, 0, 'b'], ['Furud', 6.338, -30.06, 3.0, 0, 'b'], ['Procyon', 7.655, 5.22, 0.34, 16, ''], ['Gomeisa', 7.453, 8.29, 2.9, 0, 'b'],
  ['Alhena', 6.629, 16.4, 1.93, 0, ''], ['Aldebaran', 4.599, 16.51, 0.85, 11, 'o'], ['Elnath', 5.438, 28.61, 1.65, 0, 'b'],
  ['Phact', 5.661, -34.07, 2.6, 0, 'b'], ['Wazn', 5.849, -35.77, 3.1, 0, 'o'], ['Canopus', 6.399, -52.7, -0.74, 14, 'y'], ['Naos', 8.06, -40.0, 2.25, 0, 'b'],
  ['Regor', 8.159, -47.34, 1.83, 17, 'b'], ['Avior', 8.375, -59.51, 1.86, 0, 'o'], ['Tau Puppis', 6.832, -50.61, 2.9, 0, 'o'], ['Nu Puppis', 6.629, -43.2, 3.2, 0, 'b'],
  ['Miaplacidus', 9.22, -69.72, 1.67, 0, ''], ['Alpha Pictoris', 6.803, -61.94, 3.3, 0, ''], ['Beta Pictoris', 5.788, -51.07, 3.9, 0, ''], ['Achernar', 1.629, -57.24, 0.46, 4, 'b'],
  ['Suhail', 9.133, -43.43, 2.2, 0, 'o'], ['Aspidiske', 9.285, -59.28, 2.25, 0, ''], ['Delta Velorum', 8.745, -54.71, 1.96, 0, ''], ['Pi Puppis', 7.286, -37.1, 2.7, 0, 'o'], ['Acamar', 2.971, -40.3, 2.9, 6, ''],
  ['Vega', 18.616, 38.78, 0.03, 36, 'b'], ['Sheliak', 18.835, 33.36, 3.5, 0, 'b'], ['Sulafat', 18.982, 32.69, 3.25, 0, 'b'], ['Epsilon Lyrae', 18.739, 39.67, 4.6, 0, ''],
  ['Zeta Lyrae', 18.746, 37.61, 4.3, 0, ''], ['Delta Lyrae', 18.908, 36.9, 4.3, 0, 'r'], ['Deneb', 20.69, 45.28, 1.25, 43, ''], ['Sadr', 20.37, 40.26, 2.23, 0, 'y'], ['Gienah Cygni', 20.77, 33.97, 2.48, 0, 'o'],
  ['Delta Cygni', 19.75, 45.13, 2.87, 0, 'b'], ['Albireo', 19.512, 27.96, 3.05, 0, 'o'], ['Eltanin', 17.943, 51.49, 2.24, 0, 'o'], ['Rastaban', 17.507, 52.3, 2.8, 0, 'y'],
  ['Altair', 19.846, 8.87, 0.77, 40, ''], ['Tarazed', 19.771, 10.61, 2.72, 0, 'o'], ['Alshain', 19.922, 6.41, 3.7, 0, 'y'], ['Delta Aquilae', 19.425, 3.11, 3.4, 0, ''],
  ['Zeta Aquilae', 19.09, 13.86, 3.0, 0, ''], ['Lambda Aquilae', 19.104, -4.88, 3.4, 0, 'b'], ['Rasalhague', 17.582, 12.56, 2.08, 35, ''], ['Cebalrai', 17.725, 4.57, 2.8, 0, 'o'],
  ['Sabik', 17.173, -15.72, 2.4, 0, ''], ['Antares', 16.49, -26.43, 1.0, 33, 'r'], ['Al Niyat', 16.353, -25.59, 2.9, 0, 'b'], ['Tau Scorpii', 16.598, -28.22, 2.8, 0, 'b'],
  ['Dschubba', 16.006, -22.62, 2.3, 0, 'b'], ['Acrab', 16.091, -19.81, 2.6, 0, 'b'], ['Pi Scorpii', 15.981, -26.11, 2.9, 0, 'b'], ['Larawag', 16.836, -34.29, 2.3, 0, 'o'],
  ['Mu Scorpii', 16.864, -38.05, 3.0, 0, 'b'], ['Shaula', 17.56, -37.1, 1.62, 0, 'b'], ['Sargas', 17.622, -43.0, 1.86, 0, 'y'], ['Kappa Scorpii', 17.708, -39.03, 2.4, 0, 'b'],
  ['Nunki', 18.921, -26.3, 2.05, 37, 'b'], ['Kaus Australis', 18.403, -34.38, 1.85, 0, ''], ['Kaus Media', 18.35, -29.83, 2.7, 0, 'o'], ['Kaus Borealis', 18.466, -25.42, 2.8, 0, 'o'],
  ['Ascella', 19.044, -29.88, 2.6, 0, ''], ['Yed Prior', 16.239, -3.69, 2.75, 0, 'r'], ['Zeta Ophiuchi', 16.619, -10.57, 2.55, 0, 'b'], ['Dabih', 20.35, -14.78, 3.05, 41, 'y'],
  ['Alphecca', 15.578, 26.71, 2.2, 32, ''], ['Arcturus', 14.261, 19.18, -0.05, 31, 'o'], ['Kornephoros', 16.504, 21.49, 2.8, 0, 'y'], ['Enif', 21.736, 9.88, 2.4, 44, 'o'], ['Atria', 16.811, -69.03, 1.9, 34, 'o'],
];
// Las seis estrellas objetivo (todas están en la lista de 37 estrellas de navegación del Apolo). Mismos nombres que espera capcom.js.
const TGT = {
  Sirius: { con: ['Can Mayor', 'Canis Major'], tip: ['La más brillante de todo el cielo, blanca azulada. La línea del cinturón de Orión (tres estrellas seguidas) apunta hacia ella.', 'The brightest star in the whole sky, bluish white. The line of Orion’s belt (three stars in a row) points to it.'] },
  Vega: { con: ['Lira', 'Lyra'], tip: ['Blanca azulada y muy brillante, junto a un pequeño paralelogramo de estrellas débiles. Deneb, algo más débil, queda cerca.', 'Bright bluish white, next to a small parallelogram of faint stars. Slightly fainter Deneb is nearby.'] },
  Rigel: { con: ['Orión', 'Orion'], tip: ['Azulada: el pie de Orión. Cerca están las tres estrellas del cinturón en línea; Betelgeuse, rojiza, queda al otro lado.', 'Bluish: Orion’s foot. The three belt stars in a row are nearby; reddish Betelgeuse is on the other side.'] },
  Canopus: { con: ['Carina', 'Carina'], tip: ['La segunda más brillante del cielo, amarillenta, en una zona con pocas estrellas fuertes.', 'The second brightest in the sky, yellowish, in a patch with few bright stars.'] },
  Antares: { con: ['Escorpio', 'Scorpius'], tip: ['Rojiza: el corazón del Escorpión, con una estrella débil a cada lado. Shaula, la cola, es blanca.', 'Reddish: the heart of the Scorpion, with a faint star on each side. Shaula, the tail, is white.'] },
  Altair: { con: ['Águila', 'Aquila'], tip: ['Blanca y brillante, con una estrella más débil a cada lado casi en línea (Tarazed y Alshain).', 'Bright white, with a fainter star on each side almost in a line (Tarazed and Alshain).'] },
};
export const ALIGN_STARS = Object.keys(TGT);

// ---------- geometría: vectores unitarios en la esfera celeste ----------
const vecOf = (raH, dec) => { const a = raH * 15 * RAD, d = dec * RAD; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const angDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) / RAD;
// base local en el centro de la vista: este (AR creciente) y norte
const basisAt = (c) => { const e = unit([-c[1], c[0], 0]); return { c, e, n: cross(c, e) }; };
// proyección gnomónica → píxeles desde el centro (x a la derecha, y hacia abajo); el este queda a la izquierda, como en el cielo
function project(B, s, k, roll) {
  const w = dot(s, B.c); if (w < 0.25) return null;
  const u = -dot(s, B.e) / w, v = dot(s, B.n) / w, cr = Math.cos(roll), sr = Math.sin(roll);
  return [(u * cr - v * sr) * k, -(u * sr + v * cr) * k];
}
const STARS = CAT.map(([name, ra, dec, mag, code, col]) => ({ name, mag, code, col, v: vecOf(ra, dec) }));
// estrellas débiles de fondo (más débiles que la carta, mag > 4,3), siempre iguales
const BG = (() => { let s = 0x5a17 >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = []; for (let i = 0; i < 1500; i++) { const z = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - z * z); out.push({ name: '', mag: 5.8 - 1.5 * r() * r(), code: 0, col: '', v: [q * Math.cos(a), q * Math.sin(a), z] }); } return out; })();
const ALL = STARS.concat(BG);
const COL = { r: '#ffb08a', o: '#ffd2a0', y: '#fff0c8', b: '#cfe0ff', '': '#f4f6ff' };
const pad5 = (n) => String(Math.min(99999, Math.max(0, Math.round(n)))).padStart(5, '0');
const oct2 = (n) => String(n).padStart(2, '0');

// opts: { root, loop(fn) → off, onCleanup(fn), rand, D, cadet, veteran, solo, snap(data, force) }
// Devuelve { wrong, time, n05, quality: 'good'|'fair'|'poor', zf, redo }
export function runAlign(o = {}) {
  const rand = o.rand || Math.random, D = o.D || { tol: 1 }, tol = D.tol || 1, solo = o.solo !== false;
  const lvl = o.veteran ? 2 : o.cadet ? 0 : 1;
  const OFF = [[3, 5], [5, 8], [7, 10]][lvl], ROLL = [0, 12, 26][lvl], HELP = [12, 35, 70][lvl];
  const DRIFT = 0.03 / tol, GOOD = 0.04 * tol, FAIR = 0.12 * tol;
  // estrellas: dos de las seis, bien separadas (el P52 usa estrellas alejadas para fijar bien los tres ejes)
  const pool = [...ALIGN_STARS].sort(() => rand() - 0.5); const sv = (n) => STARS.find((s) => s.name === n);
  let pair = [pool[0], pool.slice(1).find((n) => { const a = angDeg(sv(pool[0]).v, sv(n).v); return a > 25 && a < 120; }) || pool[1]];
  const el = document.createElement('div'); el.className = 'p52';
  el.innerHTML = `<div class="p52-eye"><canvas class="p52-cv"></canvas><div class="p52-mode"></div><div class="p52-msg"></div></div>
    <aside class="p52-side">
      <div class="p52-k">P52 · ${tx(['REALINEACIÓN DE LA IMU', 'IMU REALIGNMENT'])}</div>
      <div class="p52-dsky"><div class="p52-lt"><i class="act">COMP ACTY</i><i class="opr">OPR ERR</i></div>
        <div class="p52-rw"><span>PROG</span><b class="prog">52</b></div>
        <div class="p52-rw"><span>VERB</span><b class="verb">01</b><span>NOUN</span><b class="noun">70</b></div>
        <div class="p52-reg r1">+00000</div><div class="p52-reg r2"></div></div>
      <div class="p52-star"><b></b><small></small></div>
      <div class="p52-chartw"><canvas class="p52-chart"></canvas><span class="p52-ck">${tx(['CARTA ESTELAR', 'STAR CHART'])}</span></div>
      <p class="p52-tip"></p>
      <div class="p52-marks"><i></i><i></i></div>
      <div class="p52-ctl">${isTouch ? '<div class="p52-stick"><i></i></div>' : ''}<div class="p52-bs"><button type="button" class="p52-b zoom">ZOOM</button><button type="button" class="p52-b mark">MARK</button></div></div>
      <div class="p52-help"></div>
    </aside>
    <div class="p52-brief" hidden></div>`;
  (o.root || document.body).append(el);
  const q = (s) => el.querySelector(s);
  const cv = q('.p52-cv'), g = cv.getContext('2d'), ch = q('.p52-chart'), gc = ch.getContext('2d'), eye = q('.p52-eye');
  if (isTouch) makeStick(q('.p52-stick'));
  bindBtn(q('.zoom'), 'p52-zoom'); bindBtn(q('.mark'), 'p52-mark');
  q('.p52-help').textContent = isTouch ? tx(['Palanca: mover la mira · ZOOM: telescopio / sextante · MARK: marcar', 'Stick: move the sight · ZOOM: telescope / sextant · MARK: mark'])
    : tx(['WASD / flechas: mover la mira · Z: telescopio / sextante · ESPACIO: MARK', 'WASD / arrows: move the sight · Z: telescope / sextant · SPACE: MARK']);
  if (!solo) { q('.p52-chartw').classList.add('cc'); }
  let off = null, ended = false;
  o.onCleanup?.(() => { off?.(); off = null; el.remove(); input.stick.x = input.stick.y = 0; });

  // ---------- estado ----------
  const S = { mode: 'brief', idx: 0, c: [1, 0, 0], fov: FOV_SCT, sxt: false, roll: 0, phi: 0, hold: 0, seekT: 0, time: 0, msgT: 0, marks: [], wrong: 0, redo: 0, blink: 0 };
  const msg = (m, cls = '') => { const n = q('.p52-msg'); n.textContent = tx(m); n.className = 'p52-msg on ' + cls; S.msgT = 2.6; };
  const snap = (force) => o.snap?.({ targets: pair, got: S.marks.map((m) => m.star), cur: pair[S.idx], code: sv(pair[S.idx])?.code }, force);
  function startStar(i) {
    S.idx = i; S.mode = 'seek'; S.seekT = 0; S.sxt = false; S.fov = FOV_SCT; S.hold = 0;
    const s = sv(pair[i]), B = basisAt(s.v), a = rand() * Math.PI * 2, d = Math.tan((OFF[0] + rand() * (OFF[1] - OFF[0])) * RAD);
    S.c = unit([s.v[0] + d * (Math.cos(a) * B.e[0] + Math.sin(a) * B.n[0]), s.v[1] + d * (Math.cos(a) * B.e[1] + Math.sin(a) * B.n[1]), s.v[2] + d * (Math.cos(a) * B.e[2] + Math.sin(a) * B.n[2])]);
    S.roll = (rand() * 2 - 1) * ROLL * RAD; S.phi = rand() * Math.PI * 2;
    const T = TGT[s.name]; q('.p52-star b').textContent = `${tx(['ESTRELLA', 'STAR'])} ${oct2(s.code)} · ${s.name.toUpperCase()}`;
    q('.p52-star small').textContent = solo ? tx(T.con) : tx(['Control de Misión tiene la carta: pregúntale cómo es', 'Mission Control has the chart: ask what it looks like']);
    q('.p52-tip').textContent = solo ? tx(T.tip) : ''; drawChart(s);
    dsky('01', '70', '+000' + oct2(s.code), ''); paintMarks(); snap(true);
    sfx('computer', { vol: 0.35 });
  }
  function dsky(verb, noun, r1, r2) { q('.verb').textContent = verb; q('.noun').textContent = noun; q('.r1').textContent = r1; q('.r2').textContent = r2; }
  function paintMarks() { el.querySelectorAll('.p52-marks i').forEach((n, i) => { n.className = i < S.marks.length ? 'on' : i === S.idx && S.mode === 'seek' ? 'cur' : ''; n.textContent = `MARK ${i + 1}`; }); }

  // ---------- carta estelar: la zona de la estrella, norte arriba (la vista real puede estar girada) ----------
  function drawChart(s) {
    const dpr = Math.min(2, devicePixelRatio || 1), sz = Math.max(80, ch.clientWidth || 160); ch.width = ch.height = Math.round(sz * dpr);
    gc.setTransform(dpr, 0, 0, dpr, 0, 0); gc.fillStyle = '#e9e4d4'; gc.fillRect(0, 0, sz, sz);
    const B = basisAt(s.v), k = sz / 2 / Math.tan(21 * RAD);
    gc.strokeStyle = '#b9b2a0'; gc.lineWidth = 0.6; for (let i = 1; i < 4; i++) { gc.beginPath(); gc.moveTo((i * sz) / 4, 0); gc.lineTo((i * sz) / 4, sz); gc.moveTo(0, (i * sz) / 4); gc.lineTo(sz, (i * sz) / 4); gc.stroke(); }
    for (const t of STARS) { const p = project(B, t.v, k, 0); if (!p) continue; const x = sz / 2 + p[0], y = sz / 2 + p[1]; if (x < -4 || y < -4 || x > sz + 4 || y > sz + 4) continue;
      gc.fillStyle = '#1b1d22'; gc.beginPath(); gc.arc(x, y, Math.max(0.9, 3.6 - 0.62 * t.mag), 0, Math.PI * 2); gc.fill(); }
    gc.strokeStyle = '#c23a10'; gc.lineWidth = 1.6; gc.beginPath(); gc.arc(sz / 2, sz / 2, 9, 0, Math.PI * 2); gc.stroke();
    gc.fillStyle = '#c23a10'; gc.font = '600 11px ui-monospace, monospace'; gc.fillText(`${oct2(s.code)} ${s.name}`, sz / 2 + 12, sz / 2 - 10);
    gc.fillStyle = '#5b5750'; gc.font = '500 10px ui-monospace, monospace'; gc.fillText('N', sz / 2 - 3, 11); gc.fillText(tx(['E', 'E']), 4, sz / 2 + 3);
  }

  // ---------- ocular: telescopio o sextante ----------
  function draw() {
    const dpr = Math.min(2, devicePixelRatio || 1), sz = eye.clientWidth || 300, px = Math.round(sz * dpr);
    if (cv.width !== px) { cv.width = cv.height = px; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); const R = sz / 2; g.clearRect(0, 0, sz, sz);
    g.save(); g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#03060b'; g.fillRect(0, 0, sz, sz);
    const B = basisAt(S.c), k = R / Math.tan((S.fov / 2) * RAD), zt = Math.log(FOV_SCT / S.fov) / Math.log(FOV_SCT / FOV_SXT);
    const tgt = sv(pair[S.idx]); let tp = null;
    for (const t of ALL) {
      const p = project(B, t.v, k, S.roll); if (!p || Math.abs(p[0]) > R + 8 || Math.abs(p[1]) > R + 8) continue;
      const x = R + p[0], y = R + p[1], r = Math.max(0.55, 2.9 - 0.55 * t.mag) * (1 + zt * 1.4) * Math.max(0.8, sz / 520);
      const a = Math.min(1, Math.max(0.25, 1.25 - t.mag * 0.17 + zt * 0.3));
      if (t.mag < 1.9) { g.globalAlpha = 0.2 * a; g.fillStyle = COL[t.col]; g.beginPath(); g.arc(x, y, r * 3.2, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = a; g.fillStyle = COL[t.col]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      if (t === tgt) tp = [x, y];
      if (o.cadet && t.code && !S.sxt && S.mode === 'seek') { g.fillStyle = '#9fb3a6'; g.font = `500 ${Math.max(10, sz / 50)}px ui-monospace, monospace`; g.fillText(`${oct2(t.code)} ${t.name}`, x + r + 5, y - r - 2); }
    }
    // ayuda tras un rato buscando (antes en cadete; en veterano casi nunca)
    if (tp && S.mode === 'seek' && S.seekT > HELP) { g.strokeStyle = '#FFB000'; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.arc(tp[0], tp[1], S.sxt ? R * 0.18 : 16, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
    // retícula
    g.strokeStyle = 'rgba(124,255,79,.75)'; g.lineWidth = 1.2;
    const gap = S.sxt ? R * 0.14 : R * 0.08;
    g.beginPath(); g.moveTo(R - R, R); g.lineTo(R - gap, R); g.moveTo(R + gap, R); g.lineTo(R + R, R); g.moveTo(R, R - R); g.lineTo(R, R - gap); g.moveTo(R, R + gap); g.lineTo(R, R + R); g.stroke();
    if (S.sxt) {
      const rIn = Math.tan((GOOD / 2) * RAD) * k, rOut = Math.tan((FAIR / 2) * RAD) * k;
      g.beginPath(); g.arc(R, R, rIn, 0, Math.PI * 2); g.stroke(); g.setLineDash([4, 5]); g.beginPath(); g.arc(R, R, rOut, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      for (let i = 1; i <= 4; i++) { const d = (i * R) / 5; g.beginPath(); g.moveTo(R + d, R - 5); g.lineTo(R + d, R + 5); g.moveTo(R - d, R - 5); g.lineTo(R - d, R + 5); g.moveTo(R - 5, R + d); g.lineTo(R + 5, R + d); g.moveTo(R - 5, R - d); g.lineTo(R + 5, R - d); g.stroke(); }
    } else { const rS = Math.tan((FOV_SXT / 2) * RAD) * k; g.beginPath(); g.arc(R, R, Math.max(6, rS), 0, Math.PI * 2); g.stroke(); }
    g.restore();
    // QA (?debug): posición de la estrella pedida y de la brillante más cercana, en radios del ocular (x derecha, y arriba)
    if (S.mode === 'seek') { const at = (t) => { const p = project(B, t.v, k, S.roll); return p ? [p[0] / R, -p[1] / R] : [9, 9]; };
      const dec = STARS.filter((t) => t !== tgt && t.mag < 3).sort((a, b) => angDeg(a.v, tgt.v) - angDeg(b.v, tgt.v))[0];
      dbg('p52', { tgt: at(tgt), decoy: at(dec), decoyName: dec.name, sxt: S.sxt && S.fov < FOV_SXT * 1.2 }); }
    q('.p52-mode').textContent = S.sxt ? tx(['SEXTANTE · SXT ×28', 'SEXTANT · SXT ×28']) : tx(['TELESCOPIO · SCT ×1', 'TELESCOPE · SCT ×1']);
  }

  // ---------- marca ----------
  function mark() {
    if (!S.sxt) { msg(['Primero cambia al sextante (ZOOM) para marcar con precisión', 'Switch to the sextant (ZOOM) first to mark precisely'], 'warn'); sfx('error', { vol: 0.35 }); q('.opr').classList.add('on'); setTimeout(() => q('.opr').classList.remove('on'), 900); return; }
    const s = sv(pair[S.idx]), err = angDeg(S.c, s.v), near = ALL.reduce((b, t) => (t.mag < 4.4 && angDeg(t.v, S.c) < angDeg(b.v, S.c) ? t : b), s);
    const ok = err <= FOV_SXT / 2; if (!ok) S.wrong++;
    S.marks.push({ c: S.c.slice(), err, ok, star: ok ? s.name : near.name || '?' });
    sfx('beep', { vol: 0.5, rate: 1.1 }); q('.act').classList.add('on'); setTimeout(() => q('.act').classList.remove('on'), 600); snap(true);
    if (S.idx === 0) { S.mode = 'wait'; paintMarks(); setTimeout(() => { if (!ended) startStar(1); }, 900); } else { S.mode = 'wait'; paintMarks(); setTimeout(() => { if (!ended) result(); }, 900); }
  }
  // ---------- resultado: V06 N05 = |ángulo medido − ángulo del catálogo| ----------
  let resolveP = null;
  function result() {
    const [m1, m2] = S.marks, s1 = sv(pair[0]).v, s2 = sv(pair[1]).v;
    const n05 = Math.abs(angDeg(m1.c, m2.c) - angDeg(s1, s2)), bad = S.marks.some((m) => !m.ok);
    const quality = bad || n05 > FAIR ? 'poor' : n05 > GOOD ? 'fair' : 'good';
    dsky('06', '05', '+' + pad5(n05 * 100), ''); q('.verb').classList.remove('flash'); S.mode = 'result'; S.res = { n05, quality };
    sfx(quality === 'poor' ? 'error' : 'ok', { vol: 0.5 });
    const val = (n05).toFixed(2).replace('.', L() ? '.' : ','), canRedo = quality === 'poor' && S.redo < 1 && !AUTO();
    const head = { good: ['ALINEACIÓN EXCELENTE', 'EXCELLENT ALIGNMENT'], fair: ['ALINEACIÓN ACEPTABLE', 'ACCEPTABLE ALIGNMENT'], poor: ['ALINEACIÓN POBRE', 'POOR ALIGNMENT'] }[quality];
    const body = { good: ['La plataforma está fina. La computadora sabrá exactamente hacia dónde apunta el motor: la LOI será más precisa (zona verde más ancha).', 'The platform is spot on. The computer will know exactly where the engine points: the LOI will be more precise (wider green zone).'],
      fair: ['La plataforma sirve, con algo de error. La LOI será normal.', 'The platform is usable, with some error. The LOI will be normal.'],
      poor: ['La plataforma sigue desviada: la computadora apuntará el motor con error y la LOI será más difícil (zona verde más estrecha).', 'The platform is still off: the computer will point the engine with error and the LOI will be harder (narrower green zone).'] }[quality];
    const which = S.marks.map((m, i) => (m.ok ? '' : tx([`La marca ${i + 1} no era ${pair[i]}${m.star && m.star !== '?' ? ` (marcaste cerca de ${m.star})` : ''}.`, `Mark ${i + 1} was not ${pair[i]}${m.star && m.star !== '?' ? ` (you marked near ${m.star})` : ''}.`]))).filter(Boolean).join(' ');
    const br = q('.p52-brief'); br.hidden = false; br.className = 'p52-brief ' + quality;
    br.innerHTML = `<div class="p52-bk">V06 N05 · <b>${pad5(n05 * 100)}</b> = ${val}°</div><h3>${tx(head)}</h3><p>${tx(body)}</p>${which ? `<p class="bad">${which}</p>` : ''}
      <p class="dim">${tx(['Real: en el Apolo 11 Collins y Aldrin lograban errores de 0,01° (00001).', 'Real: on Apollo 11 Collins and Aldrin got errors of 0.01° (00001).'])}</p>
      <div class="p52-bb">${canRedo ? `<button type="button" class="p52-b go redo">${tx(['REPETIR · V32', 'REDO · V32'])}</button>` : ''}<button type="button" class="p52-b ${canRedo ? '' : 'go'} acc">${tx(canRedo ? ['ACEPTAR · PRO', 'ACCEPT · PRO'] : ['CONTINUAR · PRO', 'CONTINUE · PRO'])}</button></div>`;
    const accept = () => finish(); br.querySelector('.acc').onclick = accept;
    const redo = br.querySelector('.redo'); if (redo) redo.onclick = () => { S.redo++; br.hidden = true; S.marks = []; startStar(0); };
    S.accept = accept; S.canRedo = !!redo; S.resT = 0;
  }
  function finish() {
    if (ended) return; ended = true; off?.(); off = null; input.stick.x = input.stick.y = 0;
    const { n05, quality } = S.res; el.classList.add('out'); setTimeout(() => el.remove(), 400);
    const r = { wrong: S.wrong, time: S.time, n05: +n05.toFixed(3), quality, zf: { good: 1.3, fair: 1, poor: 0.6 }[quality], redo: S.redo };
    dbg('p52res', r); resolveP(r);
  }
  // ---------- briefing inicial ----------
  function brief() {
    const br = q('.p52-brief'); br.hidden = false;
    br.innerHTML = `<div class="p52-bk">P52 · ${tx(['REALINEACIÓN DE LA PLATAFORMA', 'PLATFORM REALIGNMENT'])}</div>
      <p>${tx(['Los giróscopos de la plataforma inercial (IMU) se desvían con las horas. Si no se corrige, la computadora calcula mal hacia dónde empujar en la inserción en órbita lunar (LOI).', 'The inertial platform (IMU) gyros drift over the hours. Uncorrected, the computer misjudges where to thrust for lunar orbit insertion (LOI).'])}</p>
      <ol><li>${tx(['La computadora pide una estrella por su número y apunta el telescopio donde cree que está. Pero la plataforma está desviada: búscala con la carta.', 'The computer calls a star by its number and points the telescope where it thinks it is. But the platform is off: find it with the chart.'])}</li>
      <li>${tx(['Llévala al círculo pequeño, cambia al sextante (ZOOM), céntrala en la cruz y pulsa MARK. La nave deriva: corrige sin parar.', 'Bring it into the small circle, switch to the sextant (ZOOM), center it on the cross and press MARK. The ship drifts: keep correcting.'])}</li>
      <li>${tx(['Tras dos estrellas, el DSKY muestra el error (N05). Cuanto más pequeño, mejor.', 'After two stars, the DSKY shows the error (N05). The smaller, the better.'])}</li></ol>
      <div class="p52-bb"><button type="button" class="p52-b go start">${tx(['EMPEZAR P52', 'START P52'])}</button></div>`;
    br.querySelector('.start').onclick = () => { if (S.mode !== 'brief') return; br.hidden = true; startStar(0); };
  }

  return new Promise((resolve) => {
    resolveP = resolve; brief(); dsky('50', '25', '+00052', '');
    off = o.loop((dt) => {
      S.blink += dt; if (S.msgT > 0 && (S.msgT -= dt) <= 0) q('.p52-msg').className = 'p52-msg';
      if (S.mode === 'brief') { if (AUTO() || pressed('Enter', 'Space') || bpressed('p52-mark')) q('.start').click(); draw(); return; }
      if (S.mode === 'result') { S.resT += dt; if (AUTO() && S.resT > 0.8) S.accept(); else if (pressed('Enter', 'Space') || bpressed('p52-mark')) S.accept(); else if (S.canRedo && pressed('KeyR')) q('.redo')?.click(); return; }
      if (S.mode === 'seek') {
        S.seekT += dt; S.time += dt;
        q('.verb').classList.toggle('flash', Math.floor(S.blink * 2.5) % 2 === 0); if (q('.verb').textContent !== '51') q('.verb').textContent = '51';
        if (pressed('KeyZ') || bpressed('p52-zoom')) { S.sxt = !S.sxt; sfx('switch', { vol: 0.4 }); }
        // mando: el teclado acelera si se mantiene; la palanca es proporcional (control fino)
        const ax = axis(), keys = down('KeyA', 'KeyD', 'KeyW', 'KeyS', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'), m = Math.min(1, Math.hypot(ax.x, ax.y));
        S.hold = m > 0.05 ? S.hold + dt : 0;
        const vmax = S.sxt ? 0.2 : 6, gain = keys ? 0.12 + 0.88 * Math.min(1, (S.hold / 1.1) ** 2) : m ** 1.6;
        let mx = m > 0.05 ? (ax.x / Math.max(1, m)) * gain * vmax : 0, my = m > 0.05 ? (ax.y / Math.max(1, m)) * gain * vmax : 0;
        const tgt = sv(pair[S.idx]);
        if (AUTO()) { // piloto de QA: va derecho a la estrella, cambia al sextante y marca
          const e = angDeg(S.c, tgt.v); if (e < 0.05) S.c = tgt.v.slice(); else S.c = unit(S.c.map((x, i) => x + (tgt.v[i] - x) * Math.min(1, dt * 3)));
          if (e < 1.5 && !S.sxt) S.sxt = true; mx = my = 0; if (e < 0.05 && S.fov < FOV_SXT * 1.2) { mark(); draw(); return; }
        }
        const cr = Math.cos(S.roll), sr = Math.sin(S.roll), u = mx * cr + my * sr, v = -mx * sr + my * cr, B = basisAt(S.c);
        S.phi += dt * 0.25 * Math.sin(S.blink * 0.37); const dx = AUTO() ? 0 : DRIFT * Math.cos(S.phi), dy = AUTO() ? 0 : DRIFT * Math.sin(S.phi);
        const ku = (-u + dx) * dt * RAD, kv = (v + dy) * dt * RAD;
        S.c = unit([S.c[0] + ku * B.e[0] + kv * B.n[0], S.c[1] + ku * B.e[1] + kv * B.n[1], S.c[2] + ku * B.e[2] + kv * B.n[2]]);
        const fT = S.sxt ? FOV_SXT : FOV_SCT; S.fov = Math.exp(Math.log(S.fov) + (Math.log(fT) - Math.log(S.fov)) * Math.min(1, dt * 7));
        if (S.fov !== fT && Math.abs(Math.log(S.fov / fT)) < 0.01) S.fov = fT;
        if (pressed('Space', 'KeyM') || bpressed('p52-mark')) { if (S.fov < FOV_SXT * 1.5 || !S.sxt) mark(); }
        if (S.seekT > HELP && S.seekT - dt <= HELP) msg(['Pista: la estrella está marcada en ámbar', 'Hint: the star is ringed in amber'], 'warn');
      }
      draw();
    });
  });
}
