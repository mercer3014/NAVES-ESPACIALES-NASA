// Pure UI decisions. No DOM, audio, or renderer so tests and a future graphics module can share them.
export const PHASE_ORDER = ['prep', 'launch', 'cruise', 'descent', 'eva'];
export const BOOT_LINES = ['boot.line.bus', 'boot.line.nav', 'boot.line.comm', 'boot.line.cabin'];

export function cursorMode({ screen = '', paused = false } = {}) {
  if (paused) return 'menu';
  // Solo se esconde el cursor donde se mira con el ratón (descenso y EVA). Las fases de clic y arrastre
  // (tareas de la Fase 1, despegue, alineación de estrellas en el crucero) necesitan verlo.
  if (screen === 'phase-descent' || screen === 'phase-eva') return 'play';
  return 'menu';
}

export function normalizeQuality(q) {
  return q === 'low' || q === 'high' || q === 'auto' ? q : 'auto';
}

export function bootReadout(done, total) {
  const n = Math.max(1, total | 0);
  const d = Math.max(0, Math.min(Number(done) || 0, n));
  const pct = Math.round((d / n) * 100);
  const i = Math.min(BOOT_LINES.length - 1, Math.floor((d / n) * BOOT_LINES.length));
  return { pct, line: BOOT_LINES[i] };
}

export function phaseStamp(phase) {
  const i = PHASE_ORDER.indexOf(phase);
  if (i < 0) return { n: 0, key: '' };
  return { n: i + 1, key: 'ph.' + phase };
}
