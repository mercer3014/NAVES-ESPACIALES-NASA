// Pure presentation rules for Huerto rojo. The scene and the HUD both read these
// so a headless test can lock the poses and the telemetry without starting WebGL.
export const CHUTE_LIFT = 7.8;
export const MARS_GLASS_OPACITY = 0.5;
// Canopy origin sits this far above the bridle ring. Lines end there, on the backshell.
export const BRIDLE_DROP = 4.9;
export const CHUTE_OPEN_ALT = 540;

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Compress the real altitude into a camera-readable height. Skycrane uses its own pose.
export function visualAlt(alt) {
  const a = Math.max(0, alt || 0);
  return Math.pow(a / 650, 0.78) * 24;
}

// Visual-only entry phases. The sim modes stay chute, powered, skycrane.
export function marsEdl(land) {
  const alt = Number(land?.alt) || 0;
  const mode = land?.mode || 'chute';
  const heatshield = mode === 'chute' ? clamp01((alt - 380) / 90) : 0;
  const chuteOpen = mode === 'chute' ? alt < CHUTE_OPEN_ALT : mode === 'powered' && alt > 185;
  const backshellSep = mode === 'skycrane' ? 1 : mode === 'powered' ? clamp01((255 - alt) / 75) : 0;
  const wheel = mode === 'chute' ? 0 : mode === 'skycrane' ? 1 : clamp01((235 - alt) / 55);
  const near = mode === 'skycrane' ? 0.45 + 0.55 * clamp01(land?.lower || 0) : clamp01(1 - alt / 90);
  const dust = mode === 'chute' ? 0 : near * (0.3 + Math.min(1, land?.thr || 0.4));
  const shake = mode === 'chute' && alt < 430 && alt > 370 ? 0.65
    : mode === 'powered' ? dust * 0.9
    : mode === 'skycrane' ? 0.18 + 0.16 * clamp01(land?.lower || 0)
    : 0;
  return { mode, heatshield, chuteOpen, backshellSep, wheel, dust, shake, lines: 'bridle' };
}

export function marsFlightVisual(land, groundY = 0) {
  const g = groundY;
  const edl = marsEdl(land);
  if (land?.mode === 'skycrane') {
    const start = g + 2.5;
    const k = Math.min(1, Math.max(0, land.lower || 0));
    return {
      ...edl,
      roverY: start + (g - start) * k,
      craneY: g + 9.8,
      chuteLift: CHUTE_LIFT,
      showCrane: true,
      showChute: false,
    };
  }
  const roverY = Math.max(g, visualAlt(land?.alt || 0));
  return {
    ...edl,
    roverY,
    craneY: roverY + 3.8,
    chuteLift: CHUTE_LIFT,
    showCrane: land?.mode !== 'chute',
    showChute: edl.chuteOpen,
  };
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
