// Explicit science-fiction / arcade approximation. NOT a GR trajectory or survival model.
// Positions are game radii; r=1 is a hard failure boundary. Story-years are a labeled narrative scale.
// Ship scale, inertia and docking tolerances are game values so a heavy crewed vehicle can mate with
// the probe's docking collar. They are not a claim about black-hole dynamics.
const G = 9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const HORIZON_RADIUS = 1, SAFE_RADIUS = 10, STORY_SECONDS_PER_YEAR = 20;
// Linear acceleration is a fraction of the old arcade thrust so a burn takes seconds, not a flick.
export const THRUST = 0.34;
export const MAX_SPEED = 2.2;
export const PROBE_SPIN = 0.18;
export const MAX_OMEGA = 0.5;
export const RCS_ALPHA = 0.38;
export const WORLD_SCALE = 9;
export const SHIP_SCALE = 6.2;
export const STATION_SCALE = 4.05;
export const SHIP_NOSE_LOCAL = 2.27;
export const SHIP_COLLAR_LOCAL = 0.23;
export const STATION_PORT_LOCAL = 2.55;
// World-unit collar radii match so the nose and the probe port can physically meet.
export const SHIP_COLLAR_R = SHIP_COLLAR_LOCAL * SHIP_SCALE;
export const STATION_COLLAR_R = SHIP_COLLAR_R;
const COLLAR_GAP = 0.55;
export const DOCK_DIST = (SHIP_NOSE_LOCAL * SHIP_SCALE + STATION_PORT_LOCAL * STATION_SCALE + COLLAR_GAP) / WORLD_SCALE;
export const TOW = (SHIP_NOSE_LOCAL * SHIP_SCALE + STATION_PORT_LOCAL * STATION_SCALE * 0.72) / WORLD_SCALE;
export const DOCK_DV = 0.65;
export const ALIGN_ANGLE = 0.46;
export const ALIGN_LATERAL = 0.48;
export const ALIGN_RATE = 0.42;
const probeAt = (t) => {
  const r = 3.8 - t * 0.015, a = -0.55 + t * PROBE_SPIN;
  return { r, x: r * Math.cos(a), y: r * Math.sin(a), vx: -0.015 * Math.cos(a) - r * PROBE_SPIN * Math.sin(a), vy: -0.015 * Math.sin(a) + r * PROBE_SPIN * Math.cos(a) };
};
export function createHorizon(seed = 1) {
  return {
    mission: 'horizon', seed, stage: 'intercept', t: 0, x: 8, y: 0, vx: -0.15, vy: 1.05, fuel: 100,
    thrust: 0, ax: 0, ay: 0, heading: 0, omega: 0, probe: probeAt(0), properTime: 0, externalTime: 0,
    factor: Math.sqrt(7 / 8), years: 0, minRadius: 8, arc: 0, turn: false, assist: false, previousRadial: -0.15,
    authorizeUntil: 0, departureUntil: 0, botWait: 0, captured: false, capturedAt: null, dockFrom: null,
    alignAngle: 0, alignLateral: 0, alignOk: false, closing: 0, score: null, fail: null, notice: null,
    radio: { key: 'ho.radio.start', at: 0, stretch: 1, seq: 0 },
  };
}
export function horizonControl(s, key, value = true) {
  if (key === 'authorize' && value === true) s.authorizeUntil = s.t + 45;
  if (key === 'departure' && value === true && s.captured) s.departureUntil = s.t + 45;
}
export function horizonRadio(s) {
  s.radio = { key: s.captured ? 'ho.radio.return' : 'ho.radio.probe', at: s.t, stretch: 1 / Math.max(0.15, s.factor), seq: s.radio.seq + 1 };
}
export function horizonAlignment(s) {
  const dx = s.probe.x - s.x, dy = s.probe.y - s.y;
  const d = Math.hypot(dx, dy);
  // Contact speed removes the probe port's orbital sweep, so a ship flying with the collar
  // can read near zero even though the centers are apart. At d=0 this is the raw relative speed.
  const dvx = s.vx - s.probe.vx - PROBE_SPIN * dy, dvy = s.vy - s.probe.vy + PROBE_SPIN * dx;
  const dv = Math.hypot(dvx, dvy);
  const omega = s.omega || 0;
  if (d < 0.05) return { d, dv, angle: 0, lateral: 0, closing: 0, along: 1, ok: dv < DOCK_DV && Math.abs(omega) <= ALIGN_RATE };
  const angle = wrap(Math.atan2(dy, dx) - (s.heading || 0));
  const pr = Math.max(0.2, Math.hypot(s.probe.x, s.probe.y));
  const ax = s.probe.x / pr, ay = s.probe.y / pr;
  const rx = s.x - s.probe.x, ry = s.y - s.probe.y;
  const along = rx * ax + ry * ay;
  const lateral = -rx * ay + ry * ax;
  const closing = -(dvx * dx + dvy * dy) / d;
  const ok = Math.abs(angle) < ALIGN_ANGLE && Math.abs(lateral) < ALIGN_LATERAL && along > -0.25 && Math.abs(omega) <= ALIGN_RATE && dv < DOCK_DV && closing > -0.35;
  return { d, dv, angle, lateral, closing, along, ok };
}
export function horizonBot(s, dt) {
  if (s.stage === 'intercept') {
    const d = Math.hypot(s.x - s.probe.x, s.y - s.probe.y);
    const dv = Math.hypot(s.vx - s.probe.vx, s.vy - s.probe.vy);
    if (d < DOCK_DIST + 1.6 && dv < 1.05) { s.botWait += dt; if (s.botWait > 0.65) horizonControl(s, 'authorize'); }
  } else if (s.stage === 'escape' && s.assist && Math.hypot(s.x, s.y) >= 5.8) horizonControl(s, 'departure');
}
function seatProbe(s, nr) {
  const c = Math.cos(s.heading || 0), n = Math.sin(s.heading || 0);
  s.probe = { x: s.x + c * TOW, y: s.y + n * TOW, vx: s.vx, vy: s.vy, r: nr };
}
export function horizonAction(s) {
  const d = Math.hypot(s.x - s.probe.x, s.y - s.probe.y), dv = Math.hypot(s.vx - s.probe.vx, s.vy - s.probe.vy);
  if (s.stage === 'intercept') {
    if (s.authorizeUntil < s.t) { s.notice = { key: 'ho.need.go', until: s.t + 3 }; return false; }
    const align = horizonAlignment(s);
    if (d < DOCK_DIST && align.dv < DOCK_DV && Math.hypot(s.x, s.y) > 1.3 && align.ok) {
      s.dockFrom = s.dockFrom || { x: s.probe.x, y: s.probe.y };
      s.capturedAt = s.t;
      s.captured = true;
      s.stage = 'escape';
      s.fuel = Math.max(0, s.fuel - 2);
      horizonRadio(s);
      return true;
    }
    s.notice = { key: align.ok ? 'ho.need.match' : 'ho.need.align', until: s.t + 3 };
  } else if (s.stage === 'escape') {
    if (s.departureUntil < s.t) { s.notice = { key: 'ho.need.departure', until: s.t + 3 }; return false; }
    if (Math.hypot(s.x, s.y) >= SAFE_RADIUS && s.assist) { s.stage = 'done'; s.score = Math.round(clamp(60 + s.fuel * 0.25 + Math.max(0, 15 - s.years * 5), 0, 100)); return true; }
    s.notice = { key: 'ho.need.assist', until: s.t + 3 };
  }
  return false;
}
export function stepHorizon(s, input, dt) {
  if (['done', 'failed'].includes(s.stage)) { s.thrust = 0; s.ax = 0; s.ay = 0; return s; }
  s.ax = s.ax || 0; s.ay = s.ay || 0; s.omega = s.omega || 0;
  const r = Math.max(0.01, Math.hypot(s.x, s.y)), oldA = Math.atan2(s.y, s.x);
  s.t += dt; s.externalTime += dt;
  s.factor = Math.sqrt(Math.max(0.02, 1 - 1 / Math.max(1.001, r)));
  s.properTime += dt * s.factor;
  s.years = (s.externalTime - s.properTime) / STORY_SECONDS_PER_YEAR;
  s.minRadius = Math.min(s.minRadius, r);
  let x = clamp(input.x || 0, -1, 1), y = clamp(input.y || 0, -1, 1);
  const n = Math.max(1, Math.hypot(x, y));
  x /= n; y /= n;
  const burn = s.fuel > 0 ? 1 : 0;
  const yaw = clamp(input.yaw || 0, -1, 1);
  const cmd = Math.hypot(x, y) * burn;
  const spool = 1 - Math.exp(-dt / 0.26);
  if (burn) { s.ax += (x * THRUST * burn - s.ax) * spool; s.ay += (y * THRUST * burn - s.ay) * spool; }
  else { s.ax = 0; s.ay = 0; }
  s.thrust = Math.min(1, Math.hypot(s.ax, s.ay) / THRUST);
  let targetOmega = 0;
  if (Math.abs(yaw) > 0.04) targetOmega = yaw * MAX_OMEGA;
  else if (cmd > 0.08) { targetOmega = clamp(wrap(Math.atan2(y, x) - s.heading) * 2.1, -MAX_OMEGA, MAX_OMEGA); }
  s.omega = clamp(s.omega + clamp(targetOmega - s.omega, -RCS_ALPHA * dt, RCS_ALPHA * dt), -MAX_OMEGA, MAX_OMEGA);
  s.heading = wrap(s.heading + s.omega * dt);
  s.vx += (-G * s.x / r ** 3 + s.ax) * dt;
  s.vy += (-G * s.y / r ** 3 + s.ay) * dt;
  const sp = Math.hypot(s.vx, s.vy);
  if (sp > MAX_SPEED) { const k = MAX_SPEED / sp; s.vx *= k; s.vy *= k; }
  s.x += s.vx * dt; s.y += s.vy * dt;
  s.fuel = Math.max(0, s.fuel - cmd * 0.85 * dt);
  const nr = Math.hypot(s.x, s.y), radial = (s.x * s.vx + s.y * s.vy) / Math.max(0.01, nr), a = Math.atan2(s.y, s.x);
  let da = a - oldA; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
  if (nr < 6.5) s.arc += Math.abs(da);
  if (s.previousRadial < 0 && radial >= 0 && nr < 6.5 && nr > 1.3) s.turn = true;
  s.previousRadial = radial;
  s.assist = s.turn && s.arc > 0.35;
  if (!s.captured) s.probe = probeAt(s.t);
  else seatProbe(s, nr);
  const align = horizonAlignment(s);
  s.alignAngle = align.angle; s.alignLateral = align.lateral; s.alignOk = align.ok; s.closing = align.closing; s.contactDv = align.dv;
  if (nr <= HORIZON_RADIUS) fail(s, 'horizon');
  else if (s.captured && Math.hypot(s.probe.x, s.probe.y) <= HORIZON_RADIUS) fail(s, 'tether');
  else if (!s.captured && s.probe.r <= 1.15) fail(s, 'probe');
  else if (s.t > 240) fail(s, s.fuel < 1 ? 'fuel' : 'time');
  else if (nr > 18 && !s.captured) fail(s, 'lost');
  if (s.notice && s.notice.until < s.t) s.notice = null;
  if (input.ping) horizonRadio(s);
  if (input.action && !s.fail) horizonAction(s);
  return s;
}
function fail(s, k) { s.stage = 'failed'; s.fail = k; return s; }
export function horizonAutoInput(s) {
  const r = Math.max(1.1, Math.hypot(s.x, s.y));
  const gx = -G * s.x / r ** 3, gy = -G * s.y / r ** 3;
  if (s.stage === 'intercept') {
    const p = s.probe, pr = Math.max(0.3, Math.hypot(p.x, p.y)), ox = p.x / pr, oy = p.y / pr;
    const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1e-4;
    const aim = d > DOCK_DIST + 0.7 ? DOCK_DIST + 0.45 : DOCK_DIST * 0.86;
    const tx = p.x + ox * aim, ty = p.y + oy * aim, txx = -oy, tyy = ox;
    const hvx = p.vx + aim * PROBE_SPIN * txx, hvy = p.vy + aim * PROBE_SPIN * tyy;
    const w2 = PROBE_SPIN * PROBE_SPIN;
    const pax = -w2 * tx, pay = -w2 * ty;
    const cx = (tx - s.x) * 0.4 + (hvx - s.vx) * 1.15 + pax - gx;
    const cy = (ty - s.y) * 0.4 + (hvy - s.vy) * 1.15 + pay - gy;
    const err = wrap(Math.atan2(dy, dx) - s.heading);
    const yaw = d < 4.5 ? clamp((PROBE_SPIN + err * 1.8) / MAX_OMEGA, -1, 1) : 0;
    const align = horizonAlignment(s);
    return { x: cx / THRUST, y: cy / THRUST, yaw, action: align.ok && d < DOCK_DIST && align.dv < 0.52 };
  }
  if (s.stage === 'escape') {
    const tx = -s.y / r, ty = s.x / r, tang = s.vx * tx + s.vy * ty, sign = tang >= 0 ? 1 : -1;
    const radial = (s.x * s.vx + s.y * s.vy) / r;
    // Partial prograde burn: a heavy ship raises the arc instead of kicking straight out.
    let x = tx * sign * 0.22, y = ty * sign * 0.22;
    if (r > 7.2 && radial > 0) { x += (s.x / r) * 0.22; y += (s.y / r) * 0.22; }
    return { x, y, yaw: 0, action: r >= SAFE_RADIUS && s.assist };
  }
  return {};
}
