// Cinemáticas del cap. 7 y epílogo: saltables, sin bloquear la misión, rieles finitos, textos en ES/EN.
import assert from 'node:assert/strict';
import { createCinePlayback, stepCine, skipCine, sampleCine, lineAt } from '../src/game/cutscenes/cine-rails.js';
import { LAIKA } from '../src/game/cutscenes/cine-laika.js';
import { RECOVERY } from '../src/game/cutscenes/cine-recovery.js';
import { LRL, lrlDef, RICK_LINES } from '../src/game/cutscenes/cine-lrl.js';
import { PARADE } from '../src/game/cutscenes/cine-parade.js';

const DEFS = [LAIKA, RECOVERY, LRL, lrlDef(false), PARADE];
for (const d of DEFS) {
  assert.equal(d.skippable, true, d.id); assert.equal(d.blocksCompletion, false, d.id);
  assert.ok(d.duration > 5 && d.duration < 40, d.id + ' dura ' + d.duration);
  assert.equal(d.title.length, 2); assert.equal(d.sub.length, 2);
  for (const s of d.shots) {
    assert.equal(s.keys[0].t, 0); assert.equal(s.keys[s.keys.length - 1].t, 1);
    for (const l of s.lines) { assert.equal(l.text.length, 2); assert.ok(l.t + l.dur <= s.duration + 0.01, d.id + ' subtítulo dentro del plano'); }
    if (s.caption) assert.equal(s.caption.length, 2);
  }
  const pb = createCinePlayback(d);
  for (let t = 0; t < d.duration; t += 0.37) {
    stepCine(d, pb, 0.37);
    const smp = sampleCine(d, pb);
    for (const n of [...smp.pos, ...smp.look, smp.fov]) assert.ok(Number.isFinite(n), d.id);
    lineAt(d, pb);
    assert.equal(pb.blocksCompletion, false);
  }
  assert.equal(pb.done, true); assert.equal(pb.skipped, false);
  const sk = createCinePlayback(d); stepCine(d, sk, 1); skipCine(d, sk);
  assert.equal(sk.done, true); assert.equal(sk.skipped, true); assert.ok(sk.t < sk.duration, 'el salto no espera');
}
assert.equal(lrlDef(false).shots[3].lines[0].text, RICK_LINES.told);
assert.equal(LRL.shots[3].lines[0].text, RICK_LINES.heard);
console.log('PASS cine', DEFS.map((d) => d.id + ':' + d.duration + 's').join(','));
