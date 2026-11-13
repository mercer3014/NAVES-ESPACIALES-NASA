// Pure presentation rules for Huerto rojo. The scene and the HUD both read these
// so a headless test can lock the poses and the telemetry without starting WebGL.
export const CHUTE_LIFT = 7.8;
export const MARS_GLASS_OPACITY = 0.5;

export function marsFlightVisual(land, groundY = 0) {
  const g = groundY;
  if (land?.mode === 'skycrane') {
    const start = g + 2.5;
    const k = Math.min(1, Math.max(0, land.lower || 0));
    return { roverY: start + (g - start) * k, craneY: g + 9.8, chuteLift: CHUTE_LIFT, showCrane: true, showChute: false };
  }
  const roverY = Math.max(g, (land?.alt || 0) * 0.12);
  return { roverY, craneY: roverY + 3.8, chuteLift: CHUTE_LIFT, showCrane: land?.mode !== 'chute', showChute: land?.mode === 'chute' };
}

// Flag and solar array belong to the finished garden, not the empty landing site.
export function marsDress(built) { return built > 0.2; }

export function marsHudFields(stage) {
  if (stage === 'landing') return ['alt', 'vy', 'offset', 'throttle', 'fuel'];
  if (stage === 'gather') return ['water', 'regolith', 'energy', 'found'];
  if (stage === 'build') return ['water', 'regolith', 'energy', 'progress'];
  return ['water', 'regolith', 'energy', 'sol', 'harvest', 'health'];
}

export function marsHintKey({ stage, mode, role, coop, peer }) {
  if (stage === 'landing') return 'ma.hint.' + (mode || 'chute');
  if (stage === 'grow') {
    if (coop && peer && role === 'capcom') return 'ma.hint.grow.cc';
    if (coop && peer && role === 'pilot') return 'ma.hint.grow.crew';
    return 'ma.hint.grow';
  }
  return 'ma.hint.' + stage;
}

// Sliders only do something once the garden is growing and a human agronomist is online.
export function marsClimateOpen(stage, role, coop) { return stage === 'grow' && coop && role === 'capcom'; }
