import assert from 'node:assert/strict';
import { CUE_IDS, getCue, createPlayback, stepPlayback, skipPlayback, sampleRail, missionCanComplete } from '../src/game/cutscenes/rails.js';

const EXPECTED = ['liftoff', 'separation', 'tli', 'eagle', 'firststep', 'skycrane', 'horizon'];
assert.deepEqual(CUE_IDS, EXPECTED);

for (const id of CUE_IDS) {
  const cue = getCue(id);
  assert.equal(cue.skippable, true, id + ' se puede saltar');
  assert.equal(cue.blocksCompletion, false, id + ' no bloquea la misión');
  assert.ok(cue.duration > 0 && cue.duration < 12, id);
  assert.equal(cue.keys[0].t, 0, id);
  assert.equal(cue.keys[cue.keys.length - 1].t, 1, id);
  assert.equal(cue.title.length, 2, id);
  const playing = createPlayback(id);
  stepPlayback(playing, 0.25);
  assert.equal(playing.done, false, id);
  assert.equal(playing.t < playing.duration, true, id);
  assert.equal(missionCanComplete(playing), true, id + ' mientras se ve');
  skipPlayback(playing);
  assert.equal(playing.skipped, true, id + ' quedó saltada');
  assert.equal(playing.done, true, id + ' el salto termina el plano');
  assert.equal(playing.t < playing.duration, true, id + ' el salto no espera al final del riel');
  assert.equal(missionCanComplete(playing), true, id + ' después de saltar');
  stepPlayback(playing, 5);
  assert.equal(playing.skipped, true, id);
  for (const u of [0, 0.37, 1]) {
    const s = sampleRail(id, u);
    for (const n of [...s.pos, ...s.look, s.fov, s.zoom]) assert.equal(Number.isFinite(n), true, id + ' muestra finita');
  }
  const start = sampleRail(id, 0);
  const end = sampleRail(id, 1);
  assert.deepEqual(start.pos, cue.keys[0].pos, id);
  assert.deepEqual(end.pos, cue.keys[cue.keys.length - 1].pos, id);
  const natural = createPlayback(id);
  stepPlayback(natural, cue.duration + 2);
  assert.equal(natural.done, true, id);
  assert.equal(natural.skipped, false, id);
  assert.equal(missionCanComplete(natural), true, id + ' al terminar sola');
}

assert.equal(getCue('nope'), null);
console.log('PASS cutscenes skip', CUE_IDS.join(','));
