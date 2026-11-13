// Preference only. The renderer reads `quality` when it starts; this file does not touch WebGL.
import { store, emit } from '../core/store.js';
import { normalizeQuality } from './presentation.js';

export function setQualityPref(q) {
  const v = normalizeQuality(q);
  store.set('quality', v);
  emit('quality-pref', v);
  window.dispatchEvent(new CustomEvent('plb-quality', { detail: v }));
  return v;
}
