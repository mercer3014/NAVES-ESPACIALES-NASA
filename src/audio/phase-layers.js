// Capas musicales por fase. El acople de Horizonte (órgano, pulso, crescendo)
// lo lleva otro hilo: horizon-dock no pide ninguna capa para dejar ese hueco.
export const PHASE_LAYERS = {
  prep: ['layer-prep'],
  launch: ['layer-ascent'],
  cruise: ['layer-coast'],
  descent: ['layer-descent'],
  eva: ['layer-surface'],
  debrief: ['layer-resolve'],
  'mars-landing': ['layer-descent'],
  'mars-gather': ['layer-surface'],
  'mars-build': ['layer-mars'],
  'mars-grow': ['layer-coast'],
  'mars-done': ['layer-resolve'],
  'mars-failed': [],
  'horizon-dock': [],
  'horizon-intercept': [],
  'horizon-escape': ['layer-drift'],
  'horizon-done': ['layer-resolve'],
  'horizon-failed': [],
};

export function requestPhaseLayers(phase) {
  if (!phase || !Object.prototype.hasOwnProperty.call(PHASE_LAYERS, phase)) return [];
  return PHASE_LAYERS[phase].slice();
}
