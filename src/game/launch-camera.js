// Ground telephoto. A 90 m half-height fell below 1° past ~10 km and clipped the sky.
// 140 m half-height plus a 12° floor keeps the vehicle readable against the sky.
export function trackFov(distance) {
  const fit = (2 * Math.atan(140 / Math.max(1, distance)) * 180) / Math.PI;
  return Math.min(42, Math.max(12, fit));
}
// Chase sits beside the stack. During staging it steps back so the falling stage stays in frame.
export function chaseStand(staging) {
  return staging ? { lateral: 520, along: 36, fov: 42 } : { lateral: 240, along: 48, fov: 42 };
}
// A pad telephoto at 100 km is either inside the decorative Earth shell or a sub-pixel stack.
// This stand is a long lens beside the vehicle: the 110 m airframe fills a readable slice of a 12° frame.
export function trackStand() {
  return { lateral: 1400, along: 48 };
}
// True when a sphere sits on the segment from the camera to the target, or the camera is inside it.
export function sphereOccludes(cx, cy, cz, tx, ty, tz, ex, ey, ez, radius) {
  const dx = tx - cx, dy = ty - cy, dz = tz - cz;
  const len2 = dx * dx + dy * dy + dz * dz;
  const vx = ex - cx, vy = ey - cy, vz = ez - cz;
  if (len2 < 1e-4) return vx * vx + vy * vy + vz * vz < radius * radius;
  let t = (vx * dx + vy * dy + vz * dz) / len2;
  t = Math.min(1, Math.max(0, t));
  const qx = cx + dx * t - ex, qy = cy + dy * t - ey, qz = cz + dz * t - ez;
  return qx * qx + qy * qy + qz * qz < radius * radius;
}
// Side axis perpendicular to rocket up. Exhaust travels along -up, so a camera on this
// axis sits beside the airframe instead of inside the plume.
export function sideAxis(ux, uy, uz) {
  let x = -uz, y = 0, z = ux;
  const len = Math.hypot(x, y, z);
  if (len < 1e-4) return [1, 0, 0];
  return [x / len, y / len, z / len];
}
