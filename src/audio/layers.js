// Capas en bucle, una por fase. Se piden al entrar en la fase y se cargan entonces.
import { Howler } from 'howler';
import { store, on } from '../core/store.js';
import { audioCtx, connectLoop } from './lazy.js';
import { requestPhaseLayers } from './phase-layers.js';

const BASE = {
  'layer-prep': 0.22,
  'layer-ascent': 0.2,
  'layer-coast': 0.18,
  'layer-descent': 0.2,
  'layer-surface': 0.16,
  'layer-mars': 0.18,
  'layer-drift': 0.16,
  'layer-resolve': 0.2,
};
const nodes = new Map();
let phase = null;

function node(name) {
  if (!nodes.has(name)) {
    const c = audioCtx();
    if (!c) return null;
    nodes.set(name, connectLoop(`/audio/music/${name}.mp3`, Howler.masterGain || c.destination));
  }
  return nodes.get(name);
}

export function syncLayers(next) {
  phase = next || null;
  const want = new Set(requestPhaseLayers(phase));
  const music = store.get('vol')?.music ?? 0;
  for (const name of Object.keys(BASE)) {
    if (!want.has(name) && !nodes.has(name)) continue;
    const n = want.has(name) ? node(name) : nodes.get(name);
    n?.set(want.has(name) ? (BASE[name] || 0.18) * music : 0, want.has(name) ? 0.7 : 0.45);
  }
}

export function layerState() {
  const requested = requestPhaseLayers(phase);
  return {
    phase,
    requested,
    loaded: [...nodes.entries()].filter(([, n]) => n.src).map(([name]) => name),
  };
}

on('store:vol', () => syncLayers(phase));
