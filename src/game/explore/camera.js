// Cámara de exploración: tercera persona orbital o primera, y encuadre de diálogo.
// El diálogo interpola en 0,6 s a un plano sobre el hombro, sin corte (estilo God of War).
import { createOrbitState, applyPointerDelta, stepOrbit, orbitOffset } from '../orbit-camera.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createExploreCamera(opts = {}) {
  const mode = opts.mode === 'first' ? 'first' : 'third';
  const dist = mode === 'first' ? 0.12 : (opts.dist ?? 2.6);
  const orbit = createOrbitState({
    mode: 'orbit',
    yaw: opts.yaw ?? 0,
    pitch: opts.pitch ?? 0.34,
    distance: dist,
    minDistance: mode === 'first' ? 0.05 : 1.35,
    maxDistance: mode === 'first' ? 0.45 : 5.2,
    minPitch: -0.28,
    maxPitch: 1.02,
    damp: opts.damp ?? 10,
  });
  return { mode, orbit, height: opts.height ?? 1.55, dialog: 0, dialogWant: 0 };
}

// El ratón gira la órbita. Durante el diálogo el encuadre manda y el ratón no la deshace.
export function lookExplore(cam, dx, dy) {
  if (!cam || cam.dialog > 0.8) return false;
  return applyPointerDelta(cam.orbit, dx, dy, { yaw: 0.0024, pitch: 0.0018 });
}

export function stepExploreCamera(cam, dt = 0) {
  stepOrbit(cam.orbit, dt || 0);
  const want = cam.dialogWant ? 1 : 0;
  const dir = want - cam.dialog;
  if (!dir) return cam.dialog;
  const step = Math.min(Math.abs(dir), Math.max(0, dt || 0) / 0.6);
  cam.dialog = clamp(cam.dialog + Math.sign(dir) * step, 0, 1);
  return cam.dialog;
}

export function exploreCameraPose(cam, target, focus = null) {
  const yaw = cam.orbit.smoothYaw, pitch = cam.orbit.smoothPitch;
  if (cam.mode === 'first' && cam.dialog <= 0) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const eye = target.y + cam.height * 0.92;
    const fx = -Math.sin(yaw) * cp, fy = -sp, fz = -Math.cos(yaw) * cp;
    return { x: target.x, y: eye, z: target.z, look: { x: target.x + fx, y: eye + fy, z: target.z + fz }, fov: 68 };
  }
  const dist = cam.mode === 'first' ? 0.12 : cam.orbit.smoothDistance;
  const eye = target.y + cam.height * (cam.mode === 'first' ? 0.95 : 0.55);
  const look = { x: target.x, y: target.y + cam.height * 0.9, z: target.z };
  const off = orbitOffset(yaw, pitch, Math.max(dist, 0.05));
  const free = {
    x: target.x + off.x, y: eye + off.y, z: target.z + off.z, look,
    fov: cam.mode === 'first' ? 70 : 52,
  };
  if (!focus || cam.dialog <= 0) return free;
  const fx = focus.x - target.x, fz = focus.z - target.z;
  const fl = Math.hypot(fx, fz) || 1;
  const rx = -fz / fl, rz = fx / fl;
  const u = cam.dialog;
  const sx = target.x - (fx / fl) * 1.55 + rx * 0.7;
  const sy = target.y + cam.height + 0.25;
  const sz = target.z - (fz / fl) * 1.55 + rz * 0.7;
  return {
    x: free.x + (sx - free.x) * u,
    y: free.y + (sy - free.y) * u,
    z: free.z + (sz - free.z) * u,
    look: {
      x: free.look.x + (focus.x - free.look.x) * u,
      y: free.look.y + ((focus.y || 0) + 1.5 - free.look.y) * u,
      z: free.look.z + (focus.z - free.look.z) * u,
    },
    fov: free.fov + (42 - free.fov) * u,
  };
}
