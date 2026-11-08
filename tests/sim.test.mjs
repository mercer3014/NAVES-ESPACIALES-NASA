// Tests de la física del LM: node tests/sim.test.mjs
import { create, step, guide, agl, judge, PAD, BOULDERS, ground, slope, brakingMargin, vsCue, hoverThr } from '../src/sim/lander.js';
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
// 1) caída libre sin empuje acelera a g
{ const s = create({ y: 500, vy: 0, vx: 0 }); s.thr = 0.1; s.out = true; for (let i = 0; i < 60; i++) step(s, { thr: 0.1 }, 1 / 60); ok(Math.abs(s.vy + 1.62) < 0.05, `free fall 1 s → vy ${s.vy.toFixed(2)}`); }
// 2) empuje de hover ~ g
{ const s = create({ y: 500, vy: 0, vx: 0 }); const hv = ((6100 + 900) * 1.62) / 45000; s.thr = hv; for (let i = 0; i < 120; i++) step(s, { thr: hv }, 1 / 60); ok(Math.abs(s.vy) < 0.05, `hover thr ${hv.toFixed(3)} → vy ${s.vy.toFixed(3)}`); }
// 3) P64 desde 1800 m llega a ~300 m sobre la zona de rocas
{ const s = create(); let t = 0; while (agl(s) > 300 && t < 400) { step(s, guide(s, BOULDERS.x), 1 / 30); t += 1 / 30; } ok(t < 200 && Math.abs(s.x - BOULDERS.x) < 260, `P64 reaches 300 m in ${t.toFixed(0)} s at x=${s.x.toFixed(0)} vx=${s.vx.toFixed(1)}`); 
  // 4) manual (guiado al pad) con fuel 900 aterriza bien
  s.fuel = 1400; let n = 0; while (!s.landed && n < 30 * 300) { step(s, { ...guide(s, PAD.x), burnFuel: true }, 1 / 30); if (agl(s) <= 0) s.landed = true; n++; }
  const j = judge(s); ok(j.res === 'good' && j.pad < PAD.r, `autoland ${j.res} pad=${j.pad.toFixed(1)} vs=${j.vs.toFixed(2)} hs=${j.hs.toFixed(2)} tilt=${j.tilt.toFixed(1)} fuel=${s.fuel.toFixed(0)} t=${(n / 30).toFixed(0)}s`); ok(s.fuel > 300, 'fuel margin > 100 kg'); }
// 5) caer en rocas = crash; demasiado rápido = crash
{ const s = create({ x: 0, y: 0, vy: -1, vx: 0 }); ok(judge(s).res !== 'good', 'boulders never good'); const q = create({ x: PAD.x, vy: -8, vx: 0 }); ok(judge(q).res === 'crash' && judge(q).why === 'vs', 'vs 8 → crash (vs)'); }
ok(slope(PAD.x) < 5, `pad slope ${slope(PAD.x).toFixed(1)}°`); ok(Number.isFinite(ground(123)), 'ground finite');
// 6) 10% is below hover, so a climb reverses if the pilot coasts. Zero thrust is coast, not downward thrust.
{ const s = create({ y: 1080, vy: 2.7, vx: 0, fuel: 300 }); s.thr = 0.1;
  ok(hoverThr(s) > 0.18 && hoverThr(s) < 0.3, `hover ${hoverThr(s).toFixed(3)}`);
  ok(vsCue(s.vy) === 'rise', 'positive vy is rising');
  let peak = s.y;
  for (let i = 0; i < 30 * 20; i++) { step(s, { thr: 0, burnFuel: false }, 1 / 30); peak = Math.max(peak, s.y); }
  ok(s.vy < -0.5 && s.y < peak, `coast reverses climb vy ${s.vy.toFixed(2)} y ${s.y.toFixed(0)} peak ${peak.toFixed(0)}`);
  ok(brakingMargin(create({ y: 400, vy: -2, fuel: 800 })) > 0, 'low slow fall is recoverable');
  ok(brakingMargin(create({ y: 4000, vy: -40, fuel: 0 })) < 0, 'no fuel and a fast fall is not recoverable');
}
process.exit(fail ? 1 : 0);
