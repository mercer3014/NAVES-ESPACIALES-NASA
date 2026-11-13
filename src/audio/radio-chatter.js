// Filtro de radio Apollo sobre una cama de estática original (sin habla): 300–3200 Hz, pico y saturación suave.
import { Howler } from 'howler';
import { store, on, dbg } from '../core/store.js';
import { audioCtx, connectLoop } from './lazy.js';

let graph = null, bed = false, pulseUntil = 0;

function softClip(k = 2.4) {
  const n = 1024, cv = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; cv[i] = Math.tanh(k * x) / Math.tanh(k); }
  return cv;
}
function biquad(c, type, freq, q = 0.707, gain = 0) {
  const b = c.createBiquadFilter();
  b.type = type; b.frequency.value = freq; b.Q.value = q; b.gain.value = gain;
  return b;
}
function build() {
  const c = Howler.ctx || audioCtx();
  if (!c || graph) return graph;
  const hp = biquad(c, 'highpass', 300);
  const pk = biquad(c, 'peaking', 1800, 0.9, 5);
  const ws = c.createWaveShaper(); ws.curve = softClip(); ws.oversample = '2x';
  const lp = biquad(c, 'lowpass', 3200);
  const gain = c.createGain(); gain.gain.value = 0;
  hp.connect(pk).connect(ws).connect(lp).connect(gain).connect(Howler.masterGain || c.destination);
  const loop = connectLoop('/audio/beds/chatter-bed.mp3', hp);
  graph = { hp, lp, pk, gain, loop };
  return graph;
}
function apply() {
  if (!graph) return;
  const c = audioCtx();
  if (!c) return;
  const voice = store.get('vol')?.voice ?? 0;
  const pulsed = pulseUntil > c.currentTime;
  const target = ((bed ? 0.05 : 0) + (pulsed ? 0.14 : 0)) * voice;
  graph.gain.gain.setTargetAtTime(target, c.currentTime, pulsed ? 0.03 : 0.12);
}

export function setChatter(on) {
  bed = !!on;
  if (bed) build();
  apply();
}
export function chatterPulse(ms = 1300) {
  build();
  const c = audioCtx();
  pulseUntil = (c?.currentTime || 0) + ms / 1000;
  apply();
  setTimeout(apply, ms + 50);
}
export function chatterState() {
  const c = Howler.ctx;
  return {
    on: bed,
    loaded: !!graph?.loop?.src,
    gain: graph?.gain.gain.value ?? 0,
    highpass: graph?.hp.frequency.value ?? 0,
    lowpass: graph?.lp.frequency.value ?? 0,
    pulsing: !!(c && pulseUntil > c.currentTime),
  };
}
on('store:vol', apply);
dbg('chatter', { pulse: chatterPulse, state: chatterState });
