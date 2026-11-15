// Jugador de exploración: gravedad, salto y colisión en planta.
// Misma idea que el bucle de caminar de la EVA (eva.js), con gravedad parametrizable.
// La EVA no importa este módulo: se migra en un paquete posterior.
import { locomotionClip } from '../locomotion.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * Math.max(0, dt)));

export function createBody(opts = {}) {
  const spawn = opts.spawn || [0, 0, 0];
  return {
    x: spawn[0] || 0, y: spawn[1] || 0, z: spawn[2] || 0,
    yaw: opts.yaw || 0, vx: 0, vy: 0, vz: 0, speed: 0,
    air: false, jump: false,
    radius: opts.radius ?? 0.32,
    moveSpeed: opts.speed ?? 1.6,
    canJump: opts.canJump !== false,
  };
}

// ax/ay del stick (y > 0 es adelante) respecto al guiño de la cámara, igual que la EVA.
export function moveWish(ax = 0, ay = 0, camYaw = 0) {
  let x = ax * Math.cos(camYaw) - ay * Math.sin(camYaw);
  let z = -ax * Math.sin(camYaw) - ay * Math.cos(camYaw);
  const mag = Math.hypot(x, z);
  if (mag > 1) { x /= mag; z /= mag; }
  return { x, z, mag: Math.min(1, mag) };
}

export function boxFootprint(c) {
  if (!c || c.r > 0) return null;
  if (c.min && c.max) return { minX: c.min.x, maxX: c.max.x, minZ: c.min.z, maxZ: c.max.z };
  if (c.hx != null && c.hz != null) return { minX: c.x - c.hx, maxX: c.x + c.hx, minZ: c.z - c.hz, maxZ: c.z + c.hz };
  return null;
}

function pushBox(x, z, r, b) {
  const px = clamp(x, b.minX, b.maxX), pz = clamp(z, b.minZ, b.maxZ);
  let dx = x - px, dz = z - pz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r - 1e-8) return null;
  if (d2 < 1e-8) {
    const left = x - b.minX, right = b.maxX - x, back = z - b.minZ, front = b.maxZ - z;
    const m = Math.min(left, right, back, front);
    if (m === left) return { x: b.minX - r, z };
    if (m === right) return { x: b.maxX + r, z };
    if (m === back) return { x, z: b.minZ - r };
    return { x, z: b.maxZ + r };
  }
  const d = Math.sqrt(d2), k = r / d;
  return { x: px + dx * k, z: pz + dz * k };
}

// Círculo del jugador contra cajas (Box3 o {min,max}) y círculos {x,z,r}. Varias pasadas por las esquinas.
export function pushCircle(x, z, r, colliders) {
  for (let n = 0; n < 4; n++) {
    let moved = false;
    for (const c of colliders || []) {
      if (!c) continue;
      if (c.r > 0 && c.x != null && !c.min && c.hx == null) {
        let dx = x - c.x, dz = z - c.z;
        const d = Math.hypot(dx, dz), lim = c.r + r;
        if (d >= lim) continue;
        if (d < 1e-5) { dx = 1; dz = 0; }
        const k = lim / (d < 1e-5 ? 1 : d);
        x = c.x + dx * k; z = c.z + dz * k; moved = true;
        continue;
      }
      const foot = boxFootprint(c);
      if (!foot) continue;
      const hit = pushBox(x, z, r, foot);
      if (!hit) continue;
      x = hit.x; z = hit.z; moved = true;
    }
    if (!moved) break;
  }
  return { x, z };
}

export function bodyPose(body) {
  return locomotionClip({ speed: body.air ? 0 : body.speed, jump: !!(body.jump && body.air) });
}

// Un paso. `input`: { ax, ay, camYaw, jump, gravity, floorY, colliders, lift }.
export function stepBody(body, input = {}, dt = 0) {
  const dt_ = Math.max(0, Math.min(dt || 0, 0.05));
  if (!dt_) return body;
  const wish = moveWish(input.ax || 0, input.ay || 0, input.camYaw || 0);
  const vmax = body.moveSpeed;
  body.vx = damp(body.vx, wish.x * vmax, body.air ? 1.2 : 6, dt_);
  body.vz = damp(body.vz, wish.z * vmax, body.air ? 1.2 : 6, dt_);
  body.speed = Math.hypot(body.vx, body.vz);
  if (wish.mag > 0.12) {
    const ty = Math.atan2(wish.x, wish.z);
    const d = Math.atan2(Math.sin(ty - body.yaw), Math.cos(ty - body.yaw));
    body.yaw += d * Math.min(1, dt_ * 8);
  }
  const dist = body.speed * dt_;
  const slices = Math.max(1, Math.ceil(dist / Math.max(0.05, body.radius * 0.45)));
  const h = dt_ / slices;
  for (let i = 0; i < slices; i++) {
    body.x += body.vx * h; body.z += body.vz * h;
    const hit = pushCircle(body.x, body.z, body.radius, input.colliders);
    if (hit.x !== body.x) body.vx = 0;
    if (hit.z !== body.z) body.vz = 0;
    body.x = hit.x; body.z = hit.z;
  }
  body.speed = Math.hypot(body.vx, body.vz);
  const gnd = typeof input.floorY === 'function' ? input.floorY(body.x, body.z) : (input.floorY ?? 0);
  const grav = input.gravity ?? 9.81;
  if (grav <= 0) {
    body.vy = damp(body.vy, input.lift || 0, 3, dt_);
    body.y += body.vy * dt_;
    body.air = true; body.jump = false;
    return body;
  }
  if (!body.air && input.jump && body.canJump) {
    body.vy = Math.sqrt(2 * grav * 0.55);
    body.air = true; body.jump = true;
  }
  if (body.air) {
    body.vy -= grav * dt_;
    body.y += body.vy * dt_;
    if (body.y <= gnd) { body.y = gnd; body.vy = 0; body.air = false; body.jump = false; }
  } else body.y = gnd;
  return body;
}
