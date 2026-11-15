// Reproduce la voz de una línea de cinemática a partir de su texto en inglés (ver a11-voice-map.js).
// Una línea nueva corta la anterior, salvo que pertenezca al mismo clip (los clips reales de la NASA abarcan varias líneas).
import { Howl } from 'howler';
import { store } from '../core/store.js';
import { commsMode } from '../core/comms.js';
import { VO_MAP } from './a11-voice-map.js';

const key = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let cur = null, curFile = null;

export function voiceLine(en, { vol = 1 } = {}) {
  if (!en || commsMode() === 'off') return;
  const file = VO_MAP[key(en)]; if (!file) return;
  if (file === curFile && cur?.playing()) return;
  stopVoiceLine();
  const h = new Howl({ src: [`/audio/a11/${file}.mp3`], html5: true, volume: vol * (store.get('vol')?.voice ?? 1) });
  h.once('end', () => { if (cur === h) { h.unload(); cur = null; curFile = null; } });
  h.play(); cur = h; curFile = file;
}

// Clip concreto del pack (p. ej. 'nasa_real/cap6_despegue_lunar_cuenta'); comparte canal con las líneas de voz.
export function playA11(file, { vol = 1 } = {}) {
  if (commsMode() === 'off') return null;
  stopVoiceLine();
  const h = new Howl({ src: [`/audio/a11/${file}.mp3`], html5: true, volume: vol * (store.get('vol')?.voice ?? 1) });
  h.once('end', () => { if (cur === h) { h.unload(); cur = null; curFile = null; } });
  h.play(); cur = h; curFile = file; return h;
}

export function stopVoiceLine() {
  if (!cur) return;
  const h = cur; cur = null; curFile = null;
  h.fade(h.volume(), 0, 150); setTimeout(() => h.unload(), 180);
}

// Tonos Quindar reales (NASA). El archivo dura ~24 s: solo suena el ataque, ~280 ms.
const qHowl = {};
export function quindar(which = 'in', vol = 0.62) {
  if (typeof window === 'undefined' || commsMode() === 'off') return null;
  const file = which === 'out' ? 'nasa_real/ui_quindar_hawaii' : 'nasa_real/ui_quindar_houston';
  if (!qHowl[file]) qHowl[file] = new Howl({ src: [`/audio/a11/${file}.mp3`], sprite: { beep: [0, 280] } });
  const h = qHowl[file];
  h.volume(vol * (store.get('vol')?.voice ?? 1));
  h.play('beep');
  return h;
}
