// El empuje y el retumbo mueven la cámara. El desplazamiento es pequeño y se suma al shake de cada fase.
let engine = 0, rumble = 0;

const clamp01 = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
export function noteEngine(level) { engine = clamp01(level); }
export function noteRumble(level) { rumble = clamp01(level); }
export function shakeAmount() { return Math.min(0.1, engine * 0.045 + rumble * 0.07); }
export function engineLevels() { return { engine, rumble, shake: shakeAmount() }; }

export function applyCameraShake(camera, t) {
  const a = shakeAmount();
  if (!camera || a < 0.004) return 0;
  const wobble = (f, p = 0) => Math.sin(t * f + p);
  camera.position.x += a * (wobble(47.2) * 0.55 + wobble(83.7, 0.4) * 0.45);
  camera.position.y += a * (wobble(53.1, 1.2) * 0.55 + wobble(71.4, 0.7) * 0.45);
  camera.rotateZ?.(a * 0.012 * wobble(37.5));
  return a;
}
