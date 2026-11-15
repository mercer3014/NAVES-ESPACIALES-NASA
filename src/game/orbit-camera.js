// Free orbit around the ship or astronaut. Chase and cockpit stay with each mission.
// Yaw wraps a full turn. Pitch stops short of ±90° so look-at does not flip.
export const ORBIT_MODES = ['chase', 'orbit', 'cockpit'];
export const PITCH_LIMIT = Math.PI / 2 - 0.12;

export function wrapAngle(a) {
  if (!Number.isFinite(a)) return 0;
  let x = a % (Math.PI * 2);
  if (x > Math.PI) x -= Math.PI * 2;
  if (x <= -Math.PI) x += Math.PI * 2;
  return x;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createOrbitState(opts = {}) {
  const minPitch = opts.minPitch ?? -PITCH_LIMIT;
  const maxPitch = opts.maxPitch ?? PITCH_LIMIT;
  const yaw = wrapAngle(opts.yaw ?? 0.7);
  const pitch = clamp(opts.pitch ?? 0.32, minPitch, maxPitch);
  const distance = clamp(opts.distance ?? 12, opts.minDistance ?? 1.5, opts.maxDistance ?? 80);
  return {
    mode: ORBIT_MODES.includes(opts.mode) ? opts.mode : 'chase',
    yaw, pitch, distance,
    targetDistance: distance,
    smoothYaw: yaw,
    smoothPitch: pitch,
    smoothDistance: distance,
    minDistance: opts.minDistance ?? 1.5,
    maxDistance: opts.maxDistance ?? 80,
    minPitch, maxPitch,
    damp: opts.damp ?? 7,
    up: opts.up === 'z' ? 'z' : 'y',
  };
}

export function cycleMode(state) {
  const i = ORBIT_MODES.indexOf(state.mode);
  state.mode = ORBIT_MODES[(i + 1) % ORBIT_MODES.length];
  return state.mode;
}

// V stays push-to-talk when the suit radio is live in that mode. C always cycles.
export function radioOwnsV({ visible = false, mode = 'open', state = 'off' } = {}) {
  return !!(visible && mode === 'ptt' && state === 'on');
}

export function wantsCycle({ c = false, v = false, repeat = false, radioOwnsV: ownsV = false } = {}) {
  if (repeat) return false;
  if (c) return true;
  return !!(v && !ownsV);
}

// Pointer-lock deltas. Touch calls the same math; it never requests a lock.
export function applyPointerDelta(state, dx, dy, sens = {}) {
  if (state.mode !== 'orbit') return false;
  if (!dx && !dy) return false;
  const yawS = sens.yaw ?? 0.0045;
  const pitchS = sens.pitch ?? 0.0032;
  state.yaw = wrapAngle(state.yaw - dx * yawS);
  state.pitch = clamp(state.pitch - dy * pitchS, state.minPitch, state.maxPitch);
  return true;
}

export function applyWheel(state, deltaY, sens = 0.00115) {
  if (state.mode !== 'orbit' || !deltaY) return state.targetDistance;
  const next = state.targetDistance * Math.exp(deltaY * sens);
  state.targetDistance = clamp(next, state.minDistance, state.maxDistance);
  return state.targetDistance;
}

export function stepOrbit(state, dt) {
  const k = 1 - Math.exp(-(state.damp || 0) * Math.max(0, dt || 0));
  state.smoothYaw = wrapAngle(state.smoothYaw + wrapAngle(state.yaw - state.smoothYaw) * k);
  state.smoothPitch += (state.pitch - state.smoothPitch) * k;
  state.smoothDistance += (state.targetDistance - state.smoothDistance) * k;
  return state;
}

export function orbitOffset(yaw, pitch, distance, up = 'y') {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const d = distance;
  if (up === 'z') return { x: sy * cp * d, y: cy * cp * d, z: sp * d };
  return { x: sy * cp * d, y: sp * d, z: cy * cp * d };
}

// Rails own the camera while a cutscene is playing. Orbit does not rewrite them.
export function cameraOwner({ mode = 'chase', cutscene = false } = {}) {
  if (cutscene) return 'rail';
  if (mode === 'orbit') return 'orbit';
  if (mode === 'cockpit') return 'cockpit';
  return 'chase';
}

export function lookRoute({ touch = false, mode = 'chase' } = {}) {
  if (mode !== 'orbit') return 'mission';
  return touch ? 'drag' : 'lock';
}

function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const lx = ox - cx, ly = oy - cy, lz = oz - cz;
  const b = lx * dx + ly * dy + lz * dz;
  const c = lx * lx + ly * ly + lz * lz - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t0 = -b - s;
  const t1 = -b + s;
  if (t0 > 1e-3) return t0;
  if (t1 > 1e-3) return t1;
  return null;
}

export function firstSphereHit(ox, oy, oz, dx, dy, dz, dist, spheres) {
  let best = null;
  for (const s of spheres || []) {
    if (!s || !(s.r > 0)) continue;
    const t = raySphere(ox, oy, oz, dx, dy, dz, s.x || 0, s.y || 0, s.z || 0, s.r);
    if (t != null && t < dist && (best == null || t < best)) best = t;
  }
  return best;
}

function pushOutsideSpheres(x, y, z, spheres, margin) {
  for (let n = 0; n < 3; n++) {
    let moved = false;
    for (const s of spheres || []) {
      if (!s || !(s.r > 0)) continue;
      let dx = x - (s.x || 0), dy = y - (s.y || 0), dz = z - (s.z || 0);
      const d = Math.hypot(dx, dy, dz);
      const lim = s.r + margin;
      if (d >= lim) continue;
      if (d < 1e-5) { dx = 0; dy = 1; dz = 0; }
      const k = lim / (d < 1e-5 ? 1 : d);
      x = (s.x || 0) + dx * k;
      y = (s.y || 0) + dy * k;
      z = (s.z || 0) + dz * k;
      moved = true;
    }
    if (!moved) break;
  }
  return { x, y, z };
}

// Capsule along a segment. Keeps the camera off a long hull (the Saturn stack).
export function pushOutsideCapsule(x, y, z, cap, margin = 0) {
  const ax = cap.ax, ay = cap.ay, az = cap.az;
  const bx = cap.bx, by = cap.by, bz = cap.bz;
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const len2 = abx * abx + aby * aby + abz * abz;
  let t = 0;
  if (len2 > 1e-8) t = clamp(((x - ax) * abx + (y - ay) * aby + (z - az) * abz) / len2, 0, 1);
  const cx = ax + abx * t, cy = ay + aby * t, cz = az + abz * t;
  let dx = x - cx, dy = y - cy, dz = z - cz;
  const d = Math.hypot(dx, dy, dz);
  const lim = cap.r + margin;
  if (d >= lim) return { x, y, z };
  if (d < 1e-5) {
    let px = -abz, py = 0, pz = abx;
    let pl = Math.hypot(px, py, pz);
    if (pl < 1e-4) { px = 0; py = abz; pz = -aby; pl = Math.hypot(px, py, pz) || 1; }
    dx = px / pl; dy = py / pl; dz = pz / pl;
    return { x: cx + dx * lim, y: cy + dy * lim, z: cz + dz * lim };
  }
  const k = lim / d;
  return { x: cx + dx * k, y: cy + dy * k, z: cz + dz * k };
}

export function resolveOrbitPosition(target, yaw, pitch, distance, opts = {}) {
  const up = opts.up || 'y';
  const margin = opts.margin ?? 0.45;
  const minD = opts.minDistance ?? 0;
  const dir = orbitOffset(yaw, pitch, 1, up);
  let dist = Math.max(minD, distance);
  const hit = opts.hit != null ? opts.hit : firstSphereHit(target.x, target.y, target.z, dir.x, dir.y, dir.z, dist, opts.spheres);
  if (hit != null && hit < dist) dist = Math.max(0.35, hit - margin);
  let x = target.x + dir.x * dist;
  let y = target.y + dir.y * dist;
  let z = target.z + dir.z * dist;
  if (opts.subjectRadius > 0) {
    const pushed = pushOutsideSpheres(x, y, z, [{ x: target.x, y: target.y, z: target.z, r: opts.subjectRadius }], 0);
    x = pushed.x; y = pushed.y; z = pushed.z;
  }
  for (const cap of opts.capsules || []) {
    const pushed = pushOutsideCapsule(x, y, z, cap, margin);
    x = pushed.x; y = pushed.y; z = pushed.z;
  }
  const blocked = pushOutsideSpheres(x, y, z, opts.spheres, margin);
  x = blocked.x; y = blocked.y; z = blocked.z;
  if (typeof opts.floorAt === 'function') {
    const fy = opts.floorAt(x, y, z);
    if (Number.isFinite(fy) && (up === 'z' ? z < fy : y < fy)) {
      if (up === 'z') z = fy;
      else y = fy;
    }
  }
  return { x, y, z, distance: Math.hypot(x - target.x, y - target.y, z - target.z) };
}
