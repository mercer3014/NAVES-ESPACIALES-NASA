// Compara ground() del juego original vs la copia con crateres (game-p4test) en posiciones clave y exporta grillas.
import { writeFileSync } from 'fs';
const A = await import('/workspace/apolo11/game/src/sim/lander.js');
const B = await import('/workspace/apolo11/game-p4test/src/sim/lander.js');
const lx = A.PAD.x - 6;
const pts = { 'LM centro': [lx, 0], 'LM pata +x (escalera)': [lx + 4.1, 0], 'LM pata -x': [lx - 4.1, 0], 'LM pata +z': [lx, 4.1], 'LM pata -z': [lx, -4.1],
  'bandera (site eva.js)': [lx + 2.5, 12.5], 'camara TV (eva.js)': [lx - 7, 14], 'sample-box (eva.js)': [lx - 2.2, 3.4], 'muestra (eva.js)': [lx - 5.5, 7.5],
  'PSEP (easep)': [lx + 15, 6], 'LRRR (easep)': [lx + 12.5, 9], 'SWC (easep)': [lx - 3, 8], 'Tools (easep)': [lx + 1.7, 3.3], 'PAD centro': [A.PAD.x, 0],
  'Little West centro': [lx - 60, 0], 'Little West borde E': [lx - 60 - 16.5, 0], 'Little West borde W': [lx - 60 + 16.5, 0], 'West Crater centro': [lx - 400, 0], 'West Crater borde W': [lx - 310, 0] };
const rows = [];
for (const [k, [x, z]] of Object.entries(pts)) { const a = A.ground(x, z), b = B.ground(x, z); rows.push({ k, x, z, a: +a.toFixed(3), b: +b.toFixed(3), d: +(b - a).toFixed(4) }); }
console.table(rows);
// maximo cambio en el radio de 30 m del LM para cualquier aterrizaje dentro del pad (|x-PAD.x|<=PAD.r)
let worst = 0, wpos = null; for (let L = A.PAD.x - A.PAD.r; L <= A.PAD.x + A.PAD.r; L += 2) for (let x = -30; x <= 30; x += 0.5) for (let z = -30; z <= 30; z += 0.5) { if (Math.hypot(x, z) > 30) continue; const d = Math.abs(B.ground(L + x, z) - A.ground(L + x, z)); if (d > worst) { worst = d; wpos = [L, x, z]; } }
console.log('max |dh| a <=30 m del LM, aterrizando en cualquier punto del pad:', worst.toFixed(4), 'm en', wpos);
let w2 = 0; for (let x = -20; x <= 20; x += 0.25) for (let z = -20; z <= 20; z += 0.25) w2 = Math.max(w2, Math.abs(B.ground(lx + x, z) - A.ground(lx + x, z)));
console.log('max |dh| a <=20 m del LM nominal:', w2.toFixed(5));
console.log('pendiente PAD antes/despues', A.slope(A.PAD.x).toFixed(2), B.slope(A.PAD.x).toFixed(2));
// grillas: x in [-400, 400] (rel. world), z in [-220, 220], 1 m
const x0 = -380, x1 = 420, z0 = -220, z1 = 220, nx = x1 - x0 + 1, nz = z1 - z0 + 1;
for (const [tag, M] of [['before', A], ['after', B]]) { const f = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) f[j * nx + i] = M.ground(x0 + i, z0 + j); writeFileSync(`/tmp/ground-${tag}.f32`, Buffer.from(f.buffer)); }
writeFileSync('/tmp/ground-grid.json', JSON.stringify({ x0, x1, z0, z1, nx, nz, lx }));
writeFileSync('/workspace/apolo11/Modelado_Apolo11/P4_Luna/raw/craters_check.out.json', JSON.stringify({ rows, worst, wpos, w2 }, null, 1));
