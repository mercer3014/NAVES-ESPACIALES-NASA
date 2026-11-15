// Audio: Howler para archivos (unlock iOS), WebAudio para el rugido procedural del motor.
import { Howl, Howler } from 'howler';
import { store, on, dbg } from './store.js';
import { commsMode } from './comms.js';
import { noteEngine, noteRumble } from '../audio/rumble-shake.js';
import { resumeBeds } from '../audio/runtime.js';
const S = {}; const M = {}; const V = {};
const SFX = ['click','hover','switch','toggle','ok','error','glitch','open','close','tick','bong','computer','field','door','explosion','boom','thruster','clunk','hammer','step1','step2','powerup','stage','ping','beep','highup','lowdown','jingle_win','jingle_pancho','jingle_fail','achievement','thud'];
const VOICES = { countdown:'a11_countdown_liftoff', eagle:'a11_eagle_has_landed', smallstep:'a11_one_small_step', jfk:'jfk_we_choose_the_moon', houston:'a13_houston_problem', christmas:'a8_merry_christmas', roar:'sts135_launch_roar' };
let curMusic = null, curName = null, curMusicId = null, duck = 1;
const activeVoices = new Map(), activeSfx = new Map();
let engineLast = [0, 1], rumbleLast = [0, 0];
const vol = () => store.get('vol');
export function sfx(name, opts = {}) {
  if (!S[name]) S[name] = new Howl({ src: [`/audio/sfx/${name}.mp3`], volume: 1, preload: true });
  const id = S[name].play();
  const key = name + ':' + id; activeSfx.set(key, { h: S[name], id, base: opts.vol ?? 0.7 });
  S[name].once('end', () => activeSfx.delete(key), id);
  S[name].volume((opts.vol ?? 0.7) * vol().sfx, id);
  if (opts.rate) S[name].rate(opts.rate, id);
  return id;
}
export function preloadSfx() { for (const n of SFX) if (!S[n]) S[n] = new Howl({ src: [`/audio/sfx/${n}.mp3`], preload: true }); }
export function music(name, { loop = true, fade = 1500, vol: v = 0.5 } = {}) {
  if (curName === name) return;
  const old = curMusic, oldId = curMusicId, oldName = curName; curName = name;
  if (old && oldId != null) { old.fade(old.volume(oldId), 0, fade, oldId); setTimeout(() => { old.stop(oldId); if (oldName && curName !== oldName && M[oldName] === old) { old.unload(); delete M[oldName]; } }, fade + 50); } // libera la pista anterior (no se queda decodificada en RAM)
  if (!name) { curMusic = null; curMusicId = null; return; }
  if (!M[name]) M[name] = new Howl({ src: [name.includes('/') ? `/audio/${name}.mp3` : `/audio/music/${name}.mp3`], loop, html5: true, preload: true }); // html5: streaming; evita decodificar el mp3 entero a PCM (40-60 MB por pista)
  curMusic = M[name]; curMusic._base = v; curMusic.loop(loop);
  curMusicId = curMusic.play(); curMusic.volume(0, curMusicId); curMusic.fade(0, v * vol().music * duck, fade, curMusicId);
}
export function setMusicVol() { if (curMusic && curMusicId != null) curMusic.volume(curMusic._base * vol().music * duck, curMusicId); }
const MIN_VOICE = new Set(['countdown', 'eagle', 'smallstep']);
export function voice(name, { vol: v = 1, onend } = {}) {
  const mode = commsMode();
  if (mode === 'off' || (mode === 'min' && !MIN_VOICE.has(name))) return { stop() {} };
  const f = VOICES[name] || name;
  if (!V[name]) V[name] = new Howl({ src: [`/audio/voice/${f}.mp3`], preload: true });
  const h = V[name], id = h.play(), key = name + ':' + id;
  const finish = () => { if (!activeVoices.delete(key)) return; duck = activeVoices.size ? 0.35 : 1; setMusicVol(); };
  const stop = () => { h.stop(id); finish(); };
  activeVoices.set(key, { h, id, base: v, stop }); h.volume(v * vol().voice, id);
  duck = 0.35; setMusicVol();
  h.once('end', () => { finish(); onend?.(); }, id); h.once('loaderror', finish); h.once('playerror', finish, id);
  return { stop };
}
export function stopVoices() { for (const v of [...activeVoices.values()]) v.stop(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
export function preloadVoice(...names) { for (const n of names) if (!V[n]) V[n] = new Howl({ src: [`/audio/voice/${VOICES[n] || n}.mp3`], preload: true }); }

// --- TTS callouts (opcional) ---
export function say(text, lang) {
  if (commsMode() === 'off' || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'es' ? 'es-ES' : 'en-US'; u.rate = 1.1; u.pitch = 0.9; u.volume = vol().voice;
    speechSynthesis.speak(u);
  } catch {}
}

// --- Rugido procedural (ruido filtrado) con pitch/volumen ∝ throttle ---
let eng = null;
export function engine(level, { low = 1 } = {}) {
  engineLast = [level, low];
  noteEngine(level);
  const ctx = Howler.ctx; if (!ctx) return;
  if (!eng) {
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 6; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(lp).connect(g).connect(Howler.masterGain || ctx.destination); src.start();
    eng = { src, lp, g };
  }
  const t = ctx.currentTime;
  eng.g.gain.setTargetAtTime(Math.min(1, level) * 0.55 * vol().sfx, t, 0.08);
  eng.lp.frequency.setTargetAtTime(120 + 900 * level * low, t, 0.1);
  eng.src.playbackRate.setTargetAtTime(0.7 + 0.5 * level, t, 0.1);
}
export function stopEngine() { engineLast[0] = 0; noteEngine(0); if (eng) eng.g.gain.setTargetAtTime(0, Howler.ctx.currentTime, 0.2); }
export function unlock() { try { Howler.ctx && Howler.ctx.state === 'suspended' && Howler.ctx.resume(); } catch {} resumeBeds(); }
export function blip(n = 3) { for (let i = 0; i < n; i++) setTimeout(() => sfx('beep', { vol: 0.25, rate: 0.8 + Math.random() * 0.9 }), i * 70); }

// --- Retumbo de lanzamiento: sub-graves (ruido marrón < 90 Hz) + crepitar de las F-1 (impulsos dispersos filtrados) ---
let rum = null;
export function rumble(level, crackle = level) {
  rumbleLast = [level, crackle];
  noteRumble(level);
  const ctx = Howler.ctx; if (!ctx) return;
  if (!rum) {
    const sr = ctx.sampleRate, len = sr * 3;
    const b1 = ctx.createBuffer(1, len, sr), d1 = b1.getChannelData(0); let b = 0; for (let i = 0; i < len; i++) { b = 0.995 * b + 0.005 * (Math.random() * 2 - 1); d1[i] = b * 18; }
    const b2 = ctx.createBuffer(1, len, sr), d2 = b2.getChannelData(0); for (let i = 0; i < len; i++) { d2[i] = Math.random() < 260 / sr ? (Math.random() * 2 - 1) * (0.5 + Math.random()) : 0; }
    for (let i = 1; i < len; i++) d2[i] += d2[i - 1] * 0.82; // cola corta de cada chasquido
    const mk = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };
    const low = mk(b1), cr = mk(b2);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 90;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.6;
    const gL = ctx.createGain(), gC = ctx.createGain(); gL.gain.value = 0; gC.gain.value = 0;
    const out = Howler.masterGain || ctx.destination; low.connect(lp).connect(gL).connect(out); cr.connect(bp).connect(gC).connect(out);
    rum = { gL, gC };
  }
  const t = ctx.currentTime, v = vol().sfx;
  rum.gL.gain.setTargetAtTime(Math.min(1, level) * 0.9 * v, t, 0.25);
  rum.gC.gain.setTargetAtTime(Math.min(1, crackle) ** 2 * 0.45 * v, t, 0.15);
}
export function stopRumble() { rumbleLast = [0, 0]; noteRumble(0); if (rum) { const t = Howler.ctx.currentTime; rum.gL.gain.setTargetAtTime(0, t, 0.6); rum.gC.gain.setTargetAtTime(0, t, 0.3); } }

// Live sliders apply to already-playing media, not only to the next sound.
on('store:vol', () => { if (vol().music === 0) for (const h of Object.values(M)) h.volume(0); duck = activeVoices.size && vol().voice > 0 ? 0.35 : 1; setMusicVol(); for (const {h,id,base} of activeVoices.values()) h.volume(base * vol().voice, id); for (const {h,id,base} of activeSfx.values()) if (h.playing(id)) h.volume(base * vol().sfx, id); if (eng) engine(engineLast[0], {low:engineLast[1]}); if (rum) rumble(...rumbleLast); if (vol().voice === 0 && 'speechSynthesis' in window) speechSynthesis.cancel(); });
on('store:tts', enabled => { if (!enabled && 'speechSynthesis' in window) speechSynthesis.cancel(); });
on('store:comms', (m) => { if (m === 'off') stopVoices(); });
dbg('audio', { S, M, V, Howler, music, voice, sfx, engine, rumble, stopEngine, stopRumble, stopVoices, unlock, activeVoices, state: () => ({ curName, curMusicId, duck, engine: eng?.g.gain.value, rumble: rum?.gL.gain.value }) });
