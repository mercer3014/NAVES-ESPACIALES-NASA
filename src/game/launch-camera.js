// Ground telephoto. Fitting a 90 m half-height fell below 1° once the rocket was
// ~10 km up: the sky was clipped out of that cone and the frame cleared to black.
export function trackFov(distance) {
  const fit = (2 * Math.atan(90 / Math.max(1, distance)) * 180) / Math.PI;
  return Math.min(40, Math.max(10, fit));
}
