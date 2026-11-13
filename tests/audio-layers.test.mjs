import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requestPhaseLayers } from '../src/audio/phase-layers.js';
import { noteEngine, noteRumble, shakeAmount } from '../src/audio/rumble-shake.js';

assert.deepEqual(requestPhaseLayers('prep'), ['layer-prep'], 'prep requests its layer');
assert.deepEqual(requestPhaseLayers('launch'), ['layer-ascent'], 'launch requests its layer');
assert.deepEqual(requestPhaseLayers('cruise'), ['layer-coast']);
assert.deepEqual(requestPhaseLayers('descent'), ['layer-descent']);
assert.deepEqual(requestPhaseLayers('eva'), ['layer-surface']);
assert.deepEqual(requestPhaseLayers('debrief'), ['layer-resolve']);
assert.deepEqual(requestPhaseLayers('mars-build'), ['layer-mars']);
assert.deepEqual(requestPhaseLayers('horizon-escape'), ['layer-drift']);
assert.deepEqual(requestPhaseLayers('horizon-dock'), [], 'Horizonte docking leaves the organ track a gap');
assert.deepEqual(requestPhaseLayers('horizon-intercept'), []);
assert.deepEqual(requestPhaseLayers('nope'), []);

const mission = fs.readFileSync('src/game/mission.js', 'utf8');
assert.match(mission, /setPhaseBed\(phase\)/, 'a mission phase requests its layer');
const horizon = fs.readFileSync('src/game/expeditions/horizon-controller.js', 'utf8');
assert.match(horizon, /setPhaseBed\(state\.stage==='intercept'\?'horizon-dock':'horizon-'\+state\.stage\)/);
assert.equal(fs.existsSync('public/audio/music/horizon-dock.mp3'), false);

const beds = [
  'public/audio/beds/cockpit-ambience.mp3',
  'public/audio/beds/engine-spatial.mp3',
  'public/audio/beds/chatter-bed.mp3',
  'public/audio/music/layer-prep.mp3',
  'public/audio/music/layer-ascent.mp3',
  'public/audio/music/layer-coast.mp3',
  'public/audio/music/layer-descent.mp3',
  'public/audio/music/layer-surface.mp3',
  'public/audio/music/layer-mars.mp3',
  'public/audio/music/layer-drift.mp3',
  'public/audio/music/layer-resolve.mp3',
];
const lic = fs.readFileSync('public/licenses.txt', 'utf8');
assert.match(lic, /No Hans Zimmer/);
assert.match(lic, /horizon-dock requests no layer/);
for (const file of beds) {
  const name = file.slice(file.lastIndexOf('/') + 1);
  const line = lic.split('\n').find((l) => l.includes(name));
  assert.ok(line, name);
  assert.match(line, /Original, CC0 1\.0/);
  const buf = fs.readFileSync(file);
  assert.ok(buf.length > 800 && buf.length < 180000, `${name} compressed size ${buf.length}`);
  assert.ok(buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33 || buf[0] === 0xff, `${name} is mp3`);
}
for (const name of ['layer-prep', 'layer-ascent', 'layer-coast', 'layer-descent', 'layer-surface', 'layer-mars', 'layer-drift', 'layer-resolve']) {
  assert.ok(beds.some((f) => f.endsWith(name + '.mp3')));
}

noteEngine(1); noteRumble(0.8);
assert.ok(shakeAmount() > 0.05 && shakeAmount() <= 0.1, 'rumble drives a capped camera shake');
noteEngine(0); noteRumble(0);
assert.equal(shakeAmount(), 0);
console.log('PASS audio layers, licenses, rumble shake');
