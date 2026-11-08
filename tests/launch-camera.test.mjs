import assert from 'node:assert/strict';
import { trackFov } from '../src/game/launch-camera.js';

const wide = trackFov(250);
const mid = trackFov(2000);
const far = trackFov(14140);
assert.equal(far, 10, '14 km telephoto stays wide enough to keep sky and vehicle');
assert.equal(mid, 10);
assert.ok(trackFov(700) > 10);
assert.ok(wide > 20 && wide <= 40, wide);
assert.equal(trackFov(80), 40);
console.log('PASS launch track FOV', { wide, mid, far });
