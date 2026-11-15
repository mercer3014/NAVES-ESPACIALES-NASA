// Física del LM (2.5D: X lateral + altura). Pura y determinista para tests y replays.
export const LM = { g: 1.62, dry: 6100, thrust: 45000, burn: 40, slew: 0.6, tiltMax: 30, tiltRate: 34 };
export const BOULDERS = { x: 0, r: 95 };
export const PAD = { x: 250, r: 24 };
const padH = 1.6 * Math.sin(PAD.x * 0.013) + 0.7 * Math.sin(PAD.x * 0.041) + 0.35 * Math.sin(PAD.x * 0.11);
// Cráteres reales del sitio de Apolo 11 (ALSJ / AS11-40): el LM se posó ~60 m al oeste de Little West (Ø33 m) y ~400 m al oeste
// de West Crater (Ø180 m, el del campo de rocas que Armstrong sobrevoló). El LM vuela hacia +X (oeste): el este es −X.
// Se miden desde el punto de alunizaje por defecto (PAD.x − 6).
export const A11_CRATERS = { littleWest: [PAD.x - 6 - 60, 0, 16.5, 4], west: [PAD.x - 6 - 400, 0, 90, 16] };
const CR = [[-420, 40, 60, 9], [-180, -30, 34, 5], [140, 25, 22, 3], [380, -40, 70, 10], [600, 35, 45, 6], [-650, -60, 90, 12], [60, 60, 18, 3], [-60, -70, 26, 4], A11_CRATERS.littleWest, A11_CRATERS.west];
export function ground(x, z = 0) {
  let h = 1.6 * Math.sin(x * 0.013) * Math.cos(z * 0.011) + 0.7 * Math.sin(x * 0.041 + z * 0.03) + 0.35 * Math.sin(x * 0.11 - z * 0.07);
  for (const [cx, cz, r, d] of CR) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1) h -= d * (1 - q * q); else if (q < 1.6) h += d * 0.25 * Math.cos(((q - 1) / 0.6) * Math.PI / 2) ** 2; }
  const pd = Math.hypot(x - PAD.x, z) / (PAD.r * 1.8); if (pd < 1) { const k = (1 - pd) ** 0.5; h = h * (1 - k) + padH * k; }
  return h;
}
export function slope(x) { return (Math.atan(Math.abs(ground(x + 1) - ground(x - 1)) / 2) * 180) / Math.PI; }
export function create({ x = -760, y = 1800, vx = 30, vy = -24, fuel = 900 } = {}) { return { x, y, vx, vy, tilt: 0, thr: 0.3, fuel, fuel0: fuel, t: 0, landed: false, out: false, burnOn: true }; }
// inp: { tilt (-1..1 objetivo), thr (0.1..1 objetivo), burnFuel (bool) }
export function step(s, inp, dt) {
  if (s.landed) return s;
  const tt = (inp.tilt || 0) * LM.tiltMax; const dtl = tt - s.tilt; s.tilt += Math.sign(dtl) * Math.min(Math.abs(dtl), LM.tiltRate * dt);
  const th = Math.min(1, Math.max(0, inp.thr ?? s.thr)); const d = th - s.thr; s.thr += Math.sign(d) * Math.min(Math.abs(d), LM.slew * dt);
  let thr = s.thr; if (inp.burnFuel) { s.fuel -= LM.burn * thr * dt; if (s.fuel <= 0) { s.fuel = 0; s.out = true; } }
  if (s.out) thr = 0;
  const m = LM.dry + Math.max(0, s.fuel); const a = (thr * LM.thrust) / m; const r = (s.tilt * Math.PI) / 180;
  s.vx += a * Math.sin(r) * dt; s.vy += (a * Math.cos(r) - LM.g) * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
  return s;
}
export const agl = (s) => s.y - ground(s.x);
export const hoverThr = (s) => ((LM.dry + s.fuel) * LM.g) / LM.thrust;
// How much altitude is left after a full-thrust stop from the worst fall this state can become.
// Negative means even 100% thrust cannot cancel the fall: coasting is not enough, offer a retry.
export function brakingMargin(s) {
  if (!(s.fuel > 0)) return -1;
  const hNow = Math.max(0, agl(s));
  const h = hNow + (s.vy > 0 ? (s.vy * s.vy) / (2 * LM.g) : 0);
  const m = LM.dry + Math.max(0, s.fuel);
  const aUp = LM.thrust / m - LM.g;
  if (!(aUp > 0.05) || !(h > 0)) return -1;
  const vFall = Math.sqrt((s.vy < 0 ? s.vy * s.vy : 0) + 2 * LM.g * h);
  return h - (vFall * vFall) / (2 * aUp);
}
export function vsCue(vy) {
  if (vy > 0.4) return 'rise';
  if (vy < -0.4) return 'fall';
  return 'hold';
}
// guiado simple hacia tx (usado por P64 y por el autopiloto de QA). Devuelve {tilt, thr}
export function guide(s, tx, { vyMax = 25, rod = false } = {}) {
  const h = agl(s), dx = tx - s.x;
  const vxDes = Math.sign(dx) * Math.min(14, Math.sqrt(1.1 * Math.abs(dx)), Math.abs(dx) * (h < 25 ? 0.12 : 0.35)); const tilt = Math.max(-1, Math.min(1, ((vxDes - s.vx) * 2.6) / LM.tiltMax));
  let vyDes = -Math.max(0.8, Math.min(vyMax, 0.11 * h + 0.6)); if (!rod && (Math.abs(dx) > 14 || Math.abs(s.vx) > 0.5) && h < 22) vyDes = h < 8 ? 0.3 : Math.max(vyDes, -0.3);
  const m = LM.dry + s.fuel; const aReq = (LM.g + (vyDes - s.vy) * 1.4) / Math.max(0.6, Math.cos((s.tilt * Math.PI) / 180));
  return { tilt, thr: Math.max(0.1, Math.min(1, (aReq * m) / LM.thrust)), vyDes };
}
export function judge(s, D = { tol: 1 }) {
  const vs = Math.abs(s.vy), hs = Math.abs(s.vx), tl = Math.abs(s.tilt), sl = slope(s.x), rocks = Math.abs(s.x - BOULDERS.x) < BOULDERS.r;
  const L = { vs: 3 * D.tol, hs: 1.5 * D.tol, tilt: 10 * D.tol, slope: 15 };
  const over = Math.max(vs / L.vs, hs / L.hs, tl / L.tilt, sl / L.slope);
  let res = over <= 1 ? 'good' : over <= 1.6 ? 'hard' : 'crash'; if (rocks) res = res === 'good' && vs < 1.5 ? 'hard' : 'crash';
  const why = rocks ? 'rocks' : vs / L.vs >= over - 1e-9 && vs > L.vs ? 'vs' : hs > L.hs && hs / L.hs >= over - 1e-9 ? 'hs' : tl > L.tilt ? 'tilt' : sl > L.slope ? 'slope' : '';
  const pad = Math.abs(s.x - PAD.x);
  return { res, vs, hs, tilt: tl, slope: sl, rocks, pad, over, why, L };
}
