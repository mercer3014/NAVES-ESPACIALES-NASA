import assert from 'node:assert/strict';
import {
  ORBIT_MODES, PITCH_LIMIT, wrapAngle, createOrbitState, cycleMode, radioOwnsV, wantsCycle,
  applyPointerDelta, applyWheel, stepOrbit, orbitOffset, cameraOwner, lookRoute,
  firstSphereHit, pushOutsideCapsule, resolveOrbitPosition,
} from '../src/game/orbit-camera.js';

assert.deepEqual(ORBIT_MODES, ['chase', 'orbit', 'cockpit']);
const rig = createOrbitState({ yaw: 0.4, pitch: 0.2, distance: 10, minDistance: 2, maxDistance: 40 });
assert.equal(rig.mode, 'chase', 'el despegue y la EVA siguen en persecución');
assert.equal(cycleMode(rig), 'orbit');
assert.equal(cycleMode(rig), 'cockpit');
assert.equal(cycleMode(rig), 'chase');

assert.equal(wantsCycle({ c: true }), true);
assert.equal(wantsCycle({ v: true }), true);
assert.equal(wantsCycle({ v: true, radioOwnsV: true }), false, 'V sigue siendo pulsar para hablar');
assert.equal(wantsCycle({ c: true, radioOwnsV: true }), true);
assert.equal(wantsCycle({ c: true, repeat: true }), false);
assert.equal(radioOwnsV({ visible: true, mode: 'ptt', state: 'on' }), true);
assert.equal(radioOwnsV({ visible: false, mode: 'ptt', state: 'on' }), false);
assert.equal(radioOwnsV({ visible: true, mode: 'open', state: 'on' }), false);

const look = createOrbitState({ mode: 'orbit', yaw: 0, pitch: 0, distance: 8, minDistance: 2, maxDistance: 30 });
let turned = 0;
let prev = look.yaw;
for (let i = 0; i < 80; i++) {
  applyPointerDelta(look, -40, 0);
  turned += wrapAngle(look.yaw - prev);
  prev = look.yaw;
}
assert.ok(Math.abs(turned - 80 * 40 * 0.0045) < 1e-6, 'el guiño da la vuelta completa');
assert.ok(Math.abs(look.yaw) <= Math.PI);
assert.ok(turned > Math.PI * 2, 'pasa de una vuelta');

applyPointerDelta(look, 0, -5000);
assert.equal(look.pitch, look.maxPitch);
assert.ok(look.maxPitch < Math.PI / 2 - 0.05 && look.maxPitch > 1.2, look.maxPitch);
assert.equal(look.maxPitch, PITCH_LIMIT);
applyPointerDelta(look, 0, 8000);
assert.equal(look.pitch, look.minPitch);
assert.ok(look.minPitch > -Math.PI / 2);

const parked = createOrbitState({ mode: 'chase', yaw: 1, pitch: 0.2, distance: 10 });
assert.equal(applyPointerDelta(parked, 30, -20), false);
assert.equal(parked.yaw, 1);
assert.equal(applyWheel(parked, 100), 10);
assert.equal(parked.targetDistance, 10);

const zoom = createOrbitState({ mode: 'orbit', distance: 10, minDistance: 3, maxDistance: 20 });
applyWheel(zoom, 400);
assert.ok(zoom.targetDistance > 10 && zoom.targetDistance <= 20);
applyWheel(zoom, 8000);
assert.equal(zoom.targetDistance, 20);
applyWheel(zoom, -8000);
assert.equal(zoom.targetDistance, 3);

const damp = createOrbitState({ mode: 'orbit', yaw: 3, pitch: 0, distance: 10 });
damp.smoothYaw = -3;
damp.yaw = 3;
const err0 = Math.abs(wrapAngle(damp.yaw - damp.smoothYaw));
stepOrbit(damp, 0.05);
const err1 = Math.abs(wrapAngle(damp.yaw - damp.smoothYaw));
assert.ok(err1 < err0 && err1 > 0.01, 'amortigua por el camino corto, sin salto');
for (let i = 0; i < 80; i++) stepOrbit(damp, 0.05);
assert.ok(Math.abs(wrapAngle(damp.yaw - damp.smoothYaw)) < 1e-3);

const off = orbitOffset(0.3, 0.4, 7, 'y');
assert.ok(Math.abs(Math.hypot(off.x, off.y, off.z) - 7) < 1e-6);
const zup = orbitOffset(0.3, -0.5, 4, 'z');
assert.ok(zup.z < 0 && Math.abs(Math.hypot(zup.x, zup.y, zup.z) - 4) < 1e-6);

assert.equal(cameraOwner({ mode: 'orbit', cutscene: true }), 'rail');
assert.equal(cameraOwner({ mode: 'orbit', cutscene: false }), 'orbit');
assert.equal(cameraOwner({ mode: 'cockpit', cutscene: false }), 'cockpit');
assert.equal(cameraOwner({ mode: 'chase', cutscene: false }), 'chase');
assert.equal(lookRoute({ touch: true, mode: 'orbit' }), 'drag');
assert.equal(lookRoute({ touch: false, mode: 'orbit' }), 'lock');
assert.equal(lookRoute({ touch: true, mode: 'chase' }), 'mission');

const wall = firstSphereHit(0, 0, 0, 0, 0, 1, 10, [{ x: 0, y: 0, z: 5, r: 1 }]);
assert.ok(Math.abs(wall - 4) < 1e-6, wall);
const placed = resolveOrbitPosition({ x: 0, y: 0, z: 0 }, 0, 0, 10, {
  up: 'y', minDistance: 1, spheres: [{ x: 0, y: 0, z: 5, r: 1 }], margin: 0.4,
});
assert.ok(placed.z < 4 && placed.z > 3, placed.z);
assert.ok(placed.distance < 10);

const inside = resolveOrbitPosition({ x: 0, y: 2, z: 0 }, 0.4, 0.2, 1, { subjectRadius: 4, minDistance: 0.5 });
assert.ok(inside.distance >= 3.99, inside.distance);

const cap = { ax: 0, ay: 0, az: 0, bx: 0, by: 10, bz: 0, r: 3 };
const skin = pushOutsideCapsule(0, 5, 0, cap, 0);
assert.ok(Math.hypot(skin.x, 0, skin.z) >= 2.99, Math.hypot(skin.x, 0, skin.z));
const clear = pushOutsideCapsule(8, 5, 0, cap, 0);
assert.equal(clear.x, 8);

const low = resolveOrbitPosition({ x: 0, y: 4, z: 0 }, 0.2, -1.2, 6, {
  floorAt: () => 1.5, subjectRadius: 1, minDistance: 1,
});
assert.ok(low.y >= 1.5, low.y);
for (let i = 0; i < 16; i++) {
  const yaw = (i / 16) * Math.PI * 2;
  const p = resolveOrbitPosition({ x: 0, y: 5, z: 0 }, yaw, (i % 2 ? 1 : -1) * 1.1, 9, {
    capsules: [cap], margin: 0.2, minDistance: 2,
  });
  assert.equal(Number.isFinite(p.x + p.y + p.z), true);
  const radial = Math.hypot(p.x - 0, p.z - 0);
  const along = Math.max(0, Math.min(10, p.y));
  const dist = Math.hypot(p.x, p.y - along, p.z);
  assert.ok(dist >= 3.15, dist);
}

const lander = resolveOrbitPosition({ x: -40, y: 12, z: 0 }, 1.1, -0.4, 4, {
  subjectRadius: 6.2, minDistance: 11, margin: 0.6, floorAt: () => 1.2,
});
const landerGap = Math.hypot(lander.x + 40, lander.y - 12, lander.z);
assert.ok(landerGap >= 6.2, landerGap);
assert.ok(lander.y >= 1.2, lander.y);

const canopy = { x: 0, y: 7.8, z: 0, r: 5.3 };
const underChute = resolveOrbitPosition({ x: 0, y: 1.1, z: 0 }, 0.9, PITCH_LIMIT, 12, {
  spheres: [canopy], margin: 0.35, minDistance: 4.2, subjectRadius: 2.4,
});
const canopyGap = Math.hypot(underChute.x - canopy.x, underChute.y - canopy.y, underChute.z - canopy.z);
assert.ok(canopyGap >= canopy.r + 0.3, canopyGap);

console.log('PASS orbit camera', { turned, pitch: look.pitch, wall, canopyGap });
