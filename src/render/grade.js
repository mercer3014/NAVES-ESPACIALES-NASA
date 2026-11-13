// Constantes de look compartidas por shaders y luces. No es un menú de calidad:
// los presets, la resolución adaptativa y el fallback móvil viven en otro hilo.
// El GLSL del penacho (mach disks) debe usar la misma curva que machDisk().

export const STAR_POINT = { base: 1.05, gain: 2.35 };

export function starPointScale(seed) {
  const s = clamp01(seed);
  return STAR_POINT.base + STAR_POINT.gain * s * s;
}

// Luz fría que llena las sombras lunares (brillo de la Tierra), sin competir con el sol.
export function earthshine() {
  return { color: [0.62, 0.74, 1], intensity: 0.28 };
}

// Variación del regolito: amplitud del albedo, grano y oleada de oposición.
export function regolithLook() {
  return { macroAmp: 0.34, grainAmp: 0.14, surge: 0.2, normalGain: 0.32 };
}

// Bloom del penacho en calidad alta. null = sin post (el hilo de presets decide Q.high).
export function plumeBloom(high) {
  if (!high) return null;
  return { strength: 0.48, radius: 0.4, threshold: 1.15 };
}

// Discos de Mach a lo largo del chorro. En vacío (vac→1) se apagan: el penacho se expande liso.
export function machDisk(s, vac) {
  const x = clamp01(s);
  const v = clamp01(vac);
  const frac = x * 6.5 - Math.floor(x * 6.5);
  const band = Math.exp(-((frac - 0.22) ** 2) * 28);
  const gate = smoothstep(0.06, 0.2, x) * (1 - x);
  return band * (1 - v) * gate;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
}
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
