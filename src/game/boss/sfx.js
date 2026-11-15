// Audio del combate No Canon: efectos del pack Apolo 11 (public/audio/a11/sfx/nc_*, c5_54_*, c6_62_*) con tono variable
// y bucles con volumen por distancia (vibración del Guardián). Respeta el volumen de efectos del jugador.
import { Howl } from 'howler';
import { store } from '../../core/store.js';

export const BOSS_MUSIC = 'a11/music/mus_nc_guardian_combate_loop'; // 27 s en bucle (music() resuelve /audio/<ruta>.mp3)
const cache = {};
const vol = () => (store.get('vol') || { sfx: 0.8 }).sfx ?? 0.8;
const howl = (name, loop = false) => (cache[name + (loop ? ':l' : '')] ||= new Howl({ src: [`/audio/a11/sfx/${name}.mp3`], preload: true, loop }));

// efecto suelto: rate con variación aleatoria (jit) para que los golpes repetidos no suenen idénticos
export function nc(name, { vol: v = 0.7, rate = 1, jit = 0 } = {}) {
  try { const h = howl(name); const id = h.play(); h.volume(v * vol(), id); const r = rate * (1 + (Math.random() * 2 - 1) * jit); if (r !== 1) h.rate(r, id); return id; } catch { return null; }
}
export function preloadBossSfx() { for (const n of ['nc_hab_martillo_basalto', 'nc_hab_esquiva_dash', 'nc_hab_flash_hasselblad', 'c5_54_mastil_golpe_1', 'c5_54_mastil_golpe_2', 'c5_54_mastil_golpe_3', 'nc_61b_aviso_circulo_rojo', 'nc_61b_micrometeorito_impactos']) howl(n); }

// bucle continuo: set(v) fija el volumen deseado (se suaviza), stop() lo libera
export function loopSfx(name) {
  let h = null, id = null, cur = 0;
  return {
    set(v, dt = 0.016) { if (!h) { try { h = howl(name, true); id = h.play(); h.volume(0, id); } catch { return; } } cur += (v - cur) * Math.min(1, dt * 3); h.volume(Math.max(0, cur) * vol(), id); },
    stop() { if (h && id != null) { const hh = h, ii = id; hh.fade(hh.volume(ii), 0, 400, ii); setTimeout(() => hh.stop(ii), 450); } h = null; id = null; cur = 0; },
  };
}
export function disposeBossSfx() { for (const k of Object.keys(cache)) { if (k.endsWith(':l')) { cache[k].unload(); delete cache[k]; } } }
