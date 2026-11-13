// Carga perezosa de mp3 comprimidos y bucle con fundido para tapar el padding del encoder.
import { Howler } from 'howler';

export function audioCtx() {
  if (!Howler.ctx) Howler.volume();
  const c = Howler.ctx;
  if (c?.state === 'suspended') c.resume().catch(() => {});
  return c || null;
}

const pending = new Map();

function seamless(audioBuffer, ctx) {
  const fade = Math.min(Math.floor(audioBuffer.sampleRate * 0.06), Math.floor(audioBuffer.length / 4));
  const length = Math.max(1, audioBuffer.length - fade);
  const out = ctx.createBuffer(audioBuffer.numberOfChannels, length, audioBuffer.sampleRate);
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const src = audioBuffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src.subarray(0, length));
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      dst[i] = src[i] * k + src[Math.min(src.length - 1, src.length - fade + i)] * (1 - k);
    }
  }
  return out;
}

export function loadBuffer(url) {
  if (!pending.has(url)) {
    pending.set(url, (async () => {
      const c = audioCtx();
      if (!c) throw new Error('no audio context');
      const res = await fetch(url);
      if (!res.ok) throw new Error(url);
      const raw = await c.decodeAudioData(await res.arrayBuffer());
      return seamless(raw, c);
    })());
  }
  return pending.get(url);
}

export function connectLoop(url, destination) {
  const c = audioCtx();
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(destination);
  const api = { gain, src: null, error: null, url };
  loadBuffer(url).then((buf) => {
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);
    src.start();
    api.src = src;
  }).catch((err) => { api.error = String(err); });
  api.set = (value, seconds = 0.35) => {
    const ctx = audioCtx();
    if (!ctx) return;
    gain.gain.setTargetAtTime(Math.max(0, value), ctx.currentTime, seconds);
  };
  return api;
}
