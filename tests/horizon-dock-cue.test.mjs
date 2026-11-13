import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHorizon, stepHorizon, horizonBot, horizonAutoInput } from '../src/sim/horizon.js';
import { HORIZON_DOCK_TRACK, dockCueAction, dockCueGain } from '../src/game/expeditions/horizon-dock-cue.js';

const file = 'public/audio/music/horizon-dock-assembly.mp3';
assert.equal(HORIZON_DOCK_TRACK, '/audio/music/horizon-dock-assembly.mp3');
const audio = fs.readFileSync(file);
assert.ok(audio.length > 20000 && audio.length < 400000, `dock cue size ${audio.length}`);
const id3 = audio.subarray(0, 3).toString() === 'ID3';
const frame = audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
assert.ok(id3 || frame, 'dock cue is an mp3');

const licenses = fs.readFileSync('public/licenses.txt', 'utf8');
const at = licenses.indexOf('horizon-dock-assembly.mp3');
assert.ok(at > 0, 'licenses.txt names the docking cue');
const note = licenses.slice(Math.max(0, at - 180), at + 420);
assert.match(note, /CC0 1\.0/);
assert.match(note, /pipe organ/i);
assert.match(note, /clock/i);

const phase = fs.readFileSync('src/game/expeditions/horizon-controller.js', 'utf8');
assert.match(phase, /\/audio\/music\/horizon-dock-assembly\.mp3/);
assert.match(phase, /syncHorizonDockCue\(s,HORIZON_DOCK_TRACK\)/);
assert.match(phase, /syncHorizonDockCue\(state,HORIZON_DOCK_TRACK\)/);
assert.match(phase, /stage==='intercept'\?null/);
assert.match(phase, /stopHorizonDockCue\(\)/);

assert.equal(dockCueAction('intercept'), 'play');
assert.equal(dockCueAction('failed'), 'cut');
assert.equal(dockCueAction('escape'), 'resolve');
assert.equal(dockCueAction('done'), 'resolve');

const s = createHorizon();
const start = dockCueGain(Math.hypot(s.x - s.probe.x, s.y - s.probe.y), Math.hypot(s.vx - s.probe.vx, s.vy - s.probe.vy));
let prev = start, dipped = 0;
while (s.stage === 'intercept' && s.t < 30) {
  horizonBot(s, 1 / 30);
  stepHorizon(s, horizonAutoInput(s), 1 / 30);
  const g = dockCueGain(Math.hypot(s.x - s.probe.x, s.y - s.probe.y), Math.hypot(s.vx - s.probe.vx, s.vy - s.probe.vy));
  if (g + 1e-6 < prev) dipped++;
  prev = g;
}
assert.equal(s.stage, 'escape');
assert.equal(dockCueAction(s.stage), 'resolve');
assert.ok(prev > start + 0.35, `swell ${start.toFixed(3)} -> ${prev.toFixed(3)}`);
assert.ok(dipped < 3, `approach swell dipped ${dipped} steps`);
assert.ok(dockCueGain(0.5, 0.2) > dockCueGain(4.5, 0.2));
console.log('PASS Horizonte dock cue: licensed, requested by intercept, swells into capture');
