// Banderas procedurales (países dibujados en canvas, sin assets con licencia) + diseñador libre + parche del traje
export const PALETTE = ['#D52B1E', '#F9E300', '#007934', '#0039A6', '#FFFFFF', '#000000', '#74ACDF', '#FF7F00', '#7B2CBF', '#00A6A6', '#C0C0C0', '#8B4513'];
const W = 600, H = 400;
// ---------- primitivas ----------
function stripes(x, dir, cols, weights) {
  const tot = (weights || cols.map(() => 1)).reduce((a, b) => a + b, 0); let o = 0;
  cols.forEach((c, i) => { const w = (weights ? weights[i] : 1) / tot; x.fillStyle = c; dir === 'h' ? x.fillRect(0, o * H, W, w * H + 1) : x.fillRect(o * W, 0, w * W + 1, H); o += w; });
}
function star(x, cx, cy, r, col, n = 5, inner = 0.4, rot = -Math.PI / 2) {
  x.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / n; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fillStyle = col; x.fill();
}
function circle(x, cx, cy, r, col) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = col; x.fill(); }
function rect(x, a, b, c, d, col) { x.fillStyle = col; x.fillRect(a, b, c, d); }
function nordic(x, bg, c1, c2) { rect(x, 0, 0, W, H, bg); const cx = W * 0.36; rect(x, cx - 40, 0, 80, H, c1); rect(x, 0, H / 2 - 40, W, 80, c1); if (c2) { rect(x, cx - 20, 0, 40, H, c2); rect(x, 0, H / 2 - 20, W, 40, c2); } }
function tri(x, col, depth = 0.4) { x.beginPath(); x.moveTo(0, 0); x.lineTo(W * depth, H / 2); x.lineTo(0, H); x.closePath(); x.fillStyle = col; x.fill(); }
function sun(x, cx, cy, r, col, rays = 16) { x.save(); x.translate(cx, cy); x.fillStyle = col; for (let i = 0; i < rays; i++) { x.rotate((Math.PI * 2) / rays); x.beginPath(); x.moveTo(-r * 0.18, 0); x.lineTo(0, -r * 1.7); x.lineTo(r * 0.18, 0); x.fill(); } x.restore(); circle(x, cx, cy, r, col); }
function crescent(x, cx, cy, r, col, bg) { circle(x, cx, cy, r, col); circle(x, cx + r * 0.28, cy, r * 0.8, bg); }
function union(x, w = W, h = H) {
  x.save(); x.scale(w / W, h / H); rect(x, 0, 0, W, H, '#012169');
  x.lineWidth = 80; x.strokeStyle = '#fff'; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke();
  x.lineWidth = 26; x.strokeStyle = '#C8102E'; x.stroke();
  rect(x, W / 2 - 66, 0, 132, H, '#fff'); rect(x, 0, H / 2 - 66, W, 132, '#fff'); rect(x, W / 2 - 40, 0, 80, H, '#C8102E'); rect(x, 0, H / 2 - 40, W, 80, '#C8102E'); x.restore();
}
function stars50(x, w, h) { for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) star(x, (c + (r % 2 ? 1 : 0.5)) * (w / 6), (r + 0.6) * (h / 9.6), h / 26, '#fff'); }
// ---------- países ----------
export const COUNTRIES = [
  ['BO', 'Bolivia', 'Bolivia', (x) => stripes(x, 'h', ['#D52B1E', '#F9E300', '#007934'])],
  ['AR', 'Argentina', 'Argentina', (x) => { stripes(x, 'h', ['#74ACDF', '#fff', '#74ACDF']); sun(x, W / 2, H / 2, 26, '#F6B40E'); }],
  ['BR', 'Brasil', 'Brazil', (x) => { rect(x, 0, 0, W, H, '#009C3B'); x.beginPath(); x.moveTo(W / 2, 34); x.lineTo(W - 50, H / 2); x.lineTo(W / 2, H - 34); x.lineTo(50, H / 2); x.closePath(); x.fillStyle = '#FFDF00'; x.fill(); circle(x, W / 2, H / 2, 92, '#002776'); x.save(); x.beginPath(); x.arc(W / 2, H / 2, 92, 0, 7); x.clip(); x.strokeStyle = '#fff'; x.lineWidth = 12; x.beginPath(); x.arc(W / 2 - 40, H / 2 + 200, 230, -2.2, -0.9); x.stroke(); x.restore(); }],
  ['CL', 'Chile', 'Chile', (x) => { stripes(x, 'h', ['#fff', '#D52B1E']); rect(x, 0, 0, H / 2, H / 2, '#0039A6'); star(x, H / 4, H / 4, 46, '#fff'); }],
  ['PE', 'Perú', 'Peru', (x) => stripes(x, 'v', ['#D91023', '#fff', '#D91023'])],
  ['CO', 'Colombia', 'Colombia', (x) => stripes(x, 'h', ['#FCD116', '#003893', '#CE1126'], [2, 1, 1])],
  ['EC', 'Ecuador', 'Ecuador', (x) => { stripes(x, 'h', ['#FFD100', '#0072CE', '#EF3340'], [2, 1, 1]); circle(x, W / 2, H / 2, 46, '#7a5a2a'); circle(x, W / 2, H / 2, 32, '#5aa0d0'); }],
  ['VE', 'Venezuela', 'Venezuela', (x) => { stripes(x, 'h', ['#FFCC00', '#00247D', '#CF142B']); for (let i = 0; i < 8; i++) { const a = Math.PI * (0.15 + (0.7 * i) / 7); star(x, W / 2 - Math.cos(a) * 110, H / 2 + 40 - Math.sin(a) * 80, 13, '#fff'); } }],
  ['UY', 'Uruguay', 'Uruguay', (x) => { stripes(x, 'h', ['#fff', '#0038A8', '#fff', '#0038A8', '#fff', '#0038A8', '#fff', '#0038A8', '#fff']); rect(x, 0, 0, 222, 222, '#fff'); sun(x, 111, 111, 34, '#FCD116'); }],
  ['PY', 'Paraguay', 'Paraguay', (x) => { stripes(x, 'h', ['#D52B1E', '#fff', '#0038A8']); circle(x, W / 2, H / 2, 40, '#2a7a3a'); circle(x, W / 2, H / 2, 30, '#fff'); star(x, W / 2, H / 2, 16, '#F9E300'); }],
  ['MX', 'México', 'Mexico', (x) => { stripes(x, 'v', ['#006847', '#fff', '#CE1126']); circle(x, W / 2, H / 2, 50, '#8B5A2B'); circle(x, W / 2, H / 2 + 18, 30, '#2d7a3a'); }],
  ['CU', 'Cuba', 'Cuba', (x) => { stripes(x, 'h', ['#002A8F', '#fff', '#002A8F', '#fff', '#002A8F']); tri(x, '#CF142B', 0.45); star(x, 90, H / 2, 40, '#fff'); }],
  ['CR', 'Costa Rica', 'Costa Rica', (x) => stripes(x, 'h', ['#002B7F', '#fff', '#CE1126', '#fff', '#002B7F'], [1, 1, 2, 1, 1])],
  ['PA', 'Panamá', 'Panama', (x) => { rect(x, 0, 0, W, H, '#fff'); rect(x, W / 2, 0, W / 2, H / 2, '#D21034'); rect(x, 0, H / 2, W / 2, H / 2, '#005293'); star(x, W / 4, H / 4, 36, '#005293'); star(x, (3 * W) / 4, (3 * H) / 4, 36, '#D21034'); }],
  ['GT', 'Guatemala', 'Guatemala', (x) => { stripes(x, 'v', ['#4997D0', '#fff', '#4997D0']); circle(x, W / 2, H / 2, 34, '#6aa84f'); }],
  ['HN', 'Honduras', 'Honduras', (x) => { stripes(x, 'h', ['#0073CF', '#fff', '#0073CF']); [[0, 0], [-60, -30], [60, -30], [-60, 30], [60, 30]].forEach(([a, b]) => star(x, W / 2 + a, H / 2 + b, 16, '#0073CF')); }],
  ['DO', 'Rep. Dominicana', 'Dominican Rep.', (x) => { rect(x, 0, 0, W, H, '#fff'); rect(x, 0, 0, W / 2 - 40, H / 2 - 40, '#002D62'); rect(x, W / 2 + 40, H / 2 + 40, W / 2, H / 2, '#002D62'); rect(x, W / 2 + 40, 0, W, H / 2 - 40, '#CE1126'); rect(x, 0, H / 2 + 40, W / 2 - 40, H, '#CE1126'); }],
  ['ES', 'España', 'Spain', (x) => stripes(x, 'h', ['#AA151B', '#F1BF00', '#AA151B'], [1, 2, 1])],
  ['US', 'Estados Unidos', 'United States', (x) => { const c = []; for (let i = 0; i < 13; i++) c.push(i % 2 ? '#fff' : '#B22234'); stripes(x, 'h', c); rect(x, 0, 0, W * 0.4, (H * 7) / 13, '#3C3B6E'); stars50(x, W * 0.4, (H * 7) / 13); }],
  ['CA', 'Canadá', 'Canada', (x) => { stripes(x, 'v', ['#D80621', '#fff', '#D80621'], [1, 2, 1]); x.save(); x.translate(W / 2, H / 2 + 10); x.fillStyle = '#D80621'; x.beginPath(); const p = [[0, -110], [18, -70], [40, -78], [32, -24], [70, -50], [62, -26], [96, -20], [80, 4], [96, 14], [42, 50], [48, 70], [6, 62], [6, 100], [-6, 100], [-6, 62], [-48, 70], [-42, 50], [-96, 14], [-80, 4], [-96, -20], [-62, -26], [-70, -50], [-32, -24], [-40, -78], [-18, -70]]; p.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.fill(); x.restore(); }],
  ['FR', 'Francia', 'France', (x) => stripes(x, 'v', ['#0055A4', '#fff', '#EF4135'])],
  ['IT', 'Italia', 'Italy', (x) => stripes(x, 'v', ['#009246', '#fff', '#CE2B37'])],
  ['DE', 'Alemania', 'Germany', (x) => stripes(x, 'h', ['#000', '#DD0000', '#FFCE00'])],
  ['GB', 'Reino Unido', 'United Kingdom', (x) => union(x)],
  ['PT', 'Portugal', 'Portugal', (x) => { stripes(x, 'v', ['#006600', '#FF0000'], [2, 3]); circle(x, W * 0.4, H / 2, 64, '#FFCC00'); circle(x, W * 0.4, H / 2, 40, '#fff'); circle(x, W * 0.4, H / 2, 30, '#FF0000'); }],
  ['NL', 'Países Bajos', 'Netherlands', (x) => stripes(x, 'h', ['#AE1C28', '#fff', '#21468B'])],
  ['BE', 'Bélgica', 'Belgium', (x) => stripes(x, 'v', ['#000', '#FDDA24', '#EF3340'])],
  ['IE', 'Irlanda', 'Ireland', (x) => stripes(x, 'v', ['#169B62', '#fff', '#FF883E'])],
  ['CH', 'Suiza', 'Switzerland', (x) => { rect(x, 0, 0, W, H, '#DA291C'); rect(x, W / 2 - 25, H / 2 - 90, 50, 180, '#fff'); rect(x, W / 2 - 90, H / 2 - 25, 180, 50, '#fff'); }],
  ['SE', 'Suecia', 'Sweden', (x) => nordic(x, '#006AA7', '#FECC00')],
  ['NO', 'Noruega', 'Norway', (x) => nordic(x, '#BA0C2F', '#fff', '#00205B')],
  ['FI', 'Finlandia', 'Finland', (x) => nordic(x, '#fff', '#002F6C')],
  ['DK', 'Dinamarca', 'Denmark', (x) => nordic(x, '#C8102E', '#fff')],
  ['GR', 'Grecia', 'Greece', (x) => { const c = []; for (let i = 0; i < 9; i++) c.push(i % 2 ? '#fff' : '#0D5EAF'); stripes(x, 'h', c); rect(x, 0, 0, (H * 5) / 9, (H * 5) / 9, '#0D5EAF'); rect(x, (H * 2) / 9, 0, H / 9, (H * 5) / 9, '#fff'); rect(x, 0, (H * 2) / 9, (H * 5) / 9, H / 9, '#fff'); }],
  ['RU', 'Rusia', 'Russia', (x) => stripes(x, 'h', ['#fff', '#0039A6', '#D52B1E'])],
  ['UA', 'Ucrania', 'Ukraine', (x) => stripes(x, 'h', ['#0057B7', '#FFD700'])],
  ['PL', 'Polonia', 'Poland', (x) => stripes(x, 'h', ['#fff', '#DC143C'])],
  ['TR', 'Turquía', 'Türkiye', (x) => { rect(x, 0, 0, W, H, '#E30A17'); crescent(x, W * 0.36, H / 2, 100, '#fff', '#E30A17'); star(x, W * 0.55, H / 2, 40, '#fff', 5, 0.4, Math.PI); }],
  ['JP', 'Japón', 'Japan', (x) => { rect(x, 0, 0, W, H, '#fff'); circle(x, W / 2, H / 2, 120, '#BC002D'); }],
  ['CN', 'China', 'China', (x) => { rect(x, 0, 0, W, H, '#DE2910'); star(x, 100, 100, 60, '#FFDE00'); [[200, 40], [240, 80], [240, 140], [200, 180]].forEach(([a, b]) => star(x, a, b, 20, '#FFDE00')); }],
  ['KR', 'Corea del Sur', 'South Korea', (x) => { rect(x, 0, 0, W, H, '#fff'); x.save(); x.translate(W / 2, H / 2); x.rotate(0.59); circle(x, 0, 0, 100, '#0047A0'); x.beginPath(); x.arc(0, 0, 100, Math.PI, 0); x.fillStyle = '#CD2E3A'; x.fill(); circle(x, -50, 0, 50, '#CD2E3A'); circle(x, 50, 0, 50, '#0047A0'); x.restore(); }],
  ['IN', 'India', 'India', (x) => { stripes(x, 'h', ['#FF9933', '#fff', '#138808']); x.strokeStyle = '#000080'; x.lineWidth = 6; x.beginPath(); x.arc(W / 2, H / 2, 50, 0, 7); x.stroke(); for (let i = 0; i < 24; i++) { const a = (i * Math.PI) / 12; x.beginPath(); x.moveTo(W / 2, H / 2); x.lineTo(W / 2 + Math.cos(a) * 50, H / 2 + Math.sin(a) * 50); x.lineWidth = 2; x.stroke(); } }],
  ['AU', 'Australia', 'Australia', (x) => { rect(x, 0, 0, W, H, '#012169'); union(x, W / 2, H / 2); star(x, W / 4, H * 0.75, 50, '#fff', 7, 0.45); [[450, 90], [380, 190], [520, 170], [450, 330], [480, 230]].forEach(([a, b], i) => star(x, a, b, i === 4 ? 12 : 24, '#fff', i === 4 ? 5 : 7, 0.45)); }],
  ['NZ', 'Nueva Zelanda', 'New Zealand', (x) => { rect(x, 0, 0, W, H, '#012169'); union(x, W / 2, H / 2); [[450, 90], [380, 190], [520, 170], [450, 330]].forEach(([a, b]) => { star(x, a, b, 28, '#fff'); star(x, a, b, 20, '#C8102E'); }); }],
  ['NG', 'Nigeria', 'Nigeria', (x) => stripes(x, 'v', ['#008751', '#fff', '#008751'])],
  ['EG', 'Egipto', 'Egypt', (x) => { stripes(x, 'h', ['#CE1126', '#fff', '#000']); circle(x, W / 2, H / 2, 36, '#C09300'); }],
  ['MA', 'Marruecos', 'Morocco', (x) => { rect(x, 0, 0, W, H, '#C1272D'); x.strokeStyle = '#006233'; x.lineWidth = 12; x.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5; x.lineTo(W / 2 + Math.cos(a) * 90, H / 2 + Math.sin(a) * 90); } x.closePath(); x.stroke(); }],
  ['ZA', 'Sudáfrica', 'South Africa', (x) => { stripes(x, 'h', ['#E03C31', '#fff', '#001489']); x.fillStyle = '#007749'; x.beginPath(); x.moveTo(0, 0); x.lineTo(W * 0.42, H / 2 - 40); x.lineTo(W, H / 2 - 40); x.lineTo(W, H / 2 + 40); x.lineTo(W * 0.42, H / 2 + 40); x.lineTo(0, H); x.closePath(); x.fill(); tri(x, '#FFB81C', 0.3); tri(x, '#000', 0.25); }],
  ['IL', 'Israel', 'Israel', (x) => { rect(x, 0, 0, W, H, '#fff'); rect(x, 0, 40, W, 50, '#0038B8'); rect(x, 0, H - 90, W, 50, '#0038B8'); x.strokeStyle = '#0038B8'; x.lineWidth = 12; for (const r of [0, Math.PI]) { x.beginPath(); for (let i = 0; i < 3; i++) { const a = r - Math.PI / 2 + (i * 2 * Math.PI) / 3; x.lineTo(W / 2 + Math.cos(a) * 70, H / 2 + Math.sin(a) * 70); } x.closePath(); x.stroke(); } }],
];
export const countryName = (code, lang) => { const c = COUNTRIES.find((k) => k[0] === code); return c ? c[lang === 'es' ? 1 : 2] : code; };
// ---------- diseño libre ----------
export const PATTERNS = ['solid', 'h2', 'h3', 'v3', 'diag', 'quarter', 'cross', 'nordic', 'saltire', 'chevron', 'rays', 'border'];
export const SHIELDS = ['none', 'heater', 'round', 'hex', 'oval', 'star'];
export const SYMBOLS = ['star', 'moon', 'rocket', 'planet', 'atom', 'bolt', 'sun', 'mountain', 'foot', 'heart', 'comet', 'none'];
function pattern(x, p, [a, b, c]) {
  rect(x, 0, 0, W, H, a);
  switch (p) {
    case 'h2': rect(x, 0, H / 2, W, H / 2, b); break;
    case 'h3': stripes(x, 'h', [a, b, c]); break;
    case 'v3': stripes(x, 'v', [a, b, c]); break;
    case 'diag': x.beginPath(); x.moveTo(W, 0); x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fillStyle = b; x.fill(); break;
    case 'quarter': rect(x, W / 2, 0, W / 2, H / 2, b); rect(x, 0, H / 2, W / 2, H / 2, b); break;
    case 'cross': rect(x, W / 2 - 40, 0, 80, H, b); rect(x, 0, H / 2 - 40, W, 80, b); break;
    case 'nordic': nordic(x, a, b, c); break;
    case 'saltire': x.strokeStyle = b; x.lineWidth = 70; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke(); break;
    case 'chevron': rect(x, 0, H / 2, W, H / 2, c); tri(x, b, 0.45); break;
    case 'rays': x.save(); x.translate(W / 2, H / 2); x.fillStyle = b; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 800, (i * Math.PI) / 6, ((i + 0.5) * Math.PI) / 6); x.fill(); } x.restore(); break;
    case 'border': rect(x, 0, 0, W, H, b); rect(x, 30, 30, W - 60, H - 60, a); break;
  }
}
function shieldPath(x, s, cx, cy, r) {
  x.beginPath();
  if (s === 'heater') { x.moveTo(cx - r, cy - r); x.lineTo(cx + r, cy - r); x.lineTo(cx + r, cy); x.quadraticCurveTo(cx + r, cy + r * 0.8, cx, cy + r * 1.2); x.quadraticCurveTo(cx - r, cy + r * 0.8, cx - r, cy); x.closePath(); }
  else if (s === 'round') x.arc(cx, cy, r, 0, 7);
  else if (s === 'hex') for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; x.lineTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1); }
  else if (s === 'oval') x.ellipse(cx, cy, r * 1.25, r * 0.95, 0, 0, 7);
  else if (s === 'star') for (let i = 0; i < 16; i++) { const rr = i % 2 ? r * 0.72 : r * 1.15, a = -Math.PI / 2 + (i * Math.PI) / 8; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath();
}
export function drawSymbol(x, s, cx, cy, r, col) {
  x.save(); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
  switch (s) {
    case 'star': star(x, cx, cy, r, col); break;
    case 'moon': { const bg = x.__bg || '#000'; x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip(); circle(x, cx, cy, r, col); x.globalCompositeOperation = 'destination-out'; circle(x, cx + r * 0.45, cy - r * 0.15, r * 0.85, '#000'); x.restore(); break; }
    case 'rocket': x.beginPath(); x.moveTo(cx, cy - r); x.quadraticCurveTo(cx + r * 0.45, cy - r * 0.4, cx + r * 0.3, cy + r * 0.5); x.lineTo(cx - r * 0.3, cy + r * 0.5); x.quadraticCurveTo(cx - r * 0.45, cy - r * 0.4, cx, cy - r); x.fill();
      x.beginPath(); x.moveTo(cx + r * 0.3, cy + r * 0.1); x.lineTo(cx + r * 0.6, cy + r * 0.75); x.lineTo(cx + r * 0.25, cy + r * 0.55); x.moveTo(cx - r * 0.3, cy + r * 0.1); x.lineTo(cx - r * 0.6, cy + r * 0.75); x.lineTo(cx - r * 0.25, cy + r * 0.55); x.fill();
      x.beginPath(); x.moveTo(cx - r * 0.18, cy + r * 0.6); x.lineTo(cx, cy + r * 1.05); x.lineTo(cx + r * 0.18, cy + r * 0.6); x.fill(); break;
    case 'planet': circle(x, cx, cy, r * 0.6, col); x.lineWidth = r * 0.12; x.beginPath(); x.ellipse(cx, cy, r * 1.05, r * 0.32, -0.35, 0, 7); x.stroke(); break;
    case 'atom': x.lineWidth = r * 0.09; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.36, (i * Math.PI) / 3, 0, 7); x.stroke(); } circle(x, cx, cy, r * 0.16, col); break;
    case 'bolt': x.beginPath(); [[0.15, -1], [-0.5, 0.1], [-0.05, 0.1], [-0.2, 1], [0.5, -0.15], [0.05, -0.15], [0.25, -1]].forEach(([a, b], i) => (i ? x.lineTo(cx + a * r, cy + b * r) : x.moveTo(cx + a * r, cy + b * r))); x.fill(); break;
    case 'sun': sun(x, cx, cy, r * 0.5, col, 14); break;
    case 'mountain': x.beginPath(); x.moveTo(cx - r * 1.2, cy + r * 0.7); x.lineTo(cx - r * 0.5, cy - r * 0.3); x.lineTo(cx - r * 0.2, cy + r * 0.05); x.lineTo(cx + r * 0.25, cy - r * 0.8); x.lineTo(cx + r * 1.2, cy + r * 0.7); x.closePath(); x.fill(); break;
    case 'foot': x.beginPath(); x.ellipse(cx, cy + r * 0.2, r * 0.38, r * 0.62, 0, 0, 7); x.fill(); for (let i = 0; i < 5; i++) circle(x, cx - r * 0.34 + i * r * 0.17, cy - r * 0.6 + Math.abs(i - 1.2) * r * 0.06, r * (0.12 - i * 0.012), col); break;
    case 'heart': x.beginPath(); x.moveTo(cx, cy + r * 0.85); x.bezierCurveTo(cx - r * 1.3, cy - r * 0.1, cx - r * 0.5, cy - r * 1.05, cx, cy - r * 0.35); x.bezierCurveTo(cx + r * 0.5, cy - r * 1.05, cx + r * 1.3, cy - r * 0.1, cx, cy + r * 0.85); x.fill(); break;
    case 'comet': circle(x, cx + r * 0.45, cy - r * 0.45, r * 0.32, col); x.globalAlpha = 0.7; x.beginPath(); x.moveTo(cx + r * 0.2, cy - r * 0.7); x.lineTo(cx - r, cy + r); x.lineTo(cx + r * 0.7, cy - r * 0.2); x.fill(); break;
  }
  x.restore();
}
export function defaultFlag() { return { mode: 'country', code: 'BO', pattern: 'h3', colors: ['#0039A6', '#FFFFFF', '#D52B1E'], shield: 'round', symbol: 'star', text: '' }; }
export function randomFlag() {
  const r = (a) => a[Math.floor(Math.random() * a.length)]; const cols = [...PALETTE].sort(() => Math.random() - 0.5).slice(0, 3);
  return { mode: 'custom', code: 'BO', pattern: r(PATTERNS), colors: cols, shield: r(SHIELDS), symbol: r(SYMBOLS.slice(0, -1)), text: '' };
}
export function renderFlag(canvas, f = defaultFlag(), w = W, h = H) {
  canvas.width = w; canvas.height = h; const x = canvas.getContext('2d'); x.save(); x.scale(w / W, h / H);
  if (f.mode === 'country') { const c = COUNTRIES.find((k) => k[0] === f.code) || COUNTRIES[0]; c[3](x); }
  else {
    pattern(x, f.pattern, f.colors);
    const cx = W / 2, cy = f.text ? H / 2 - 24 : H / 2, r = 92; const [a, b, c] = f.colors;
    if (f.shield !== 'none') { x.save(); shieldPath(x, f.shield, cx, cy, r); x.fillStyle = c === a ? b : c; x.shadowColor = '#0006'; x.shadowBlur = 16; x.fill(); x.restore(); x.lineWidth = 6; x.strokeStyle = '#ffffffcc'; shieldPath(x, f.shield, cx, cy, r); x.stroke(); }
    const symCol = f.shield !== 'none' ? (c === '#FFFFFF' ? a : '#FFFFFF') : b === a ? c : b;
    if (f.symbol !== 'none') drawSymbol(x, f.symbol, cx, cy - (f.shield === 'heater' ? 6 : 0), r * 0.62, symCol);
    if (f.text) { x.font = '700 42px Chakra, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = Math.min(W - 60, x.measureText(f.text).width + 50);
      x.fillStyle = '#0009'; x.beginPath(); x.roundRect(cx - tw / 2, H - 92, tw, 56, 28); x.fill(); x.fillStyle = '#fff'; x.fillText(f.text.toUpperCase(), cx, H - 63); }
  }
  // brillo sutil de tela
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ffffff14'); g.addColorStop(0.5, '#ffffff00'); g.addColorStop(1, '#00000018'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.restore(); return canvas;
}
export function renderPatch(canvas, f, name = '', size = 256) {
  canvas.width = canvas.height = size; const x = canvas.getContext('2d'), c = size / 2;
  const fl = renderFlag(document.createElement('canvas'), f, 300, 200);
  x.clearRect(0, 0, size, size); circle(x, c, c, c - 1, '#0b1630');
  x.save(); x.beginPath(); x.arc(c, c, c * 0.7, 0, 7); x.clip(); x.drawImage(fl, c - c * 1.05, c - c * 0.7, c * 2.1, c * 1.4); x.restore();
  x.lineWidth = size * 0.02; x.strokeStyle = '#d9b44a'; x.beginPath(); x.arc(c, c, c * 0.7, 0, 7); x.stroke(); x.beginPath(); x.arc(c, c, c - size * 0.02, 0, 7); x.stroke();
  const txt = (name || 'ASTRONAUTA').toUpperCase().slice(0, 14) + ' · PLANTA LA BANDERA · ';
  x.font = `700 ${size * 0.075}px Chakra, sans-serif`; x.fillStyle = '#f0e6c8'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const n = txt.length; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; x.save(); x.translate(c + Math.cos(a) * c * 0.85, c + Math.sin(a) * c * 0.85); x.rotate(a + Math.PI / 2); x.fillText(txt[i], 0, 0); x.restore(); }
  return canvas;
}
