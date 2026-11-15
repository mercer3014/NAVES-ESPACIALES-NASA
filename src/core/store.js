// Estado persistente mínimo (localStorage) + bus de eventos
const KEY = 'plb.v1';
const defaults = {
  lang: 'en', // inglés por defecto (audio original en inglés + subtítulos); ES desde el menú o con ?lang=es
  name: '', introSeen: false, quality: 'auto', vol: { music: 0.6, sfx: 0.8, voice: 1 }, tts: true, // introSeen is leftover storage; the intro is not gated by it
  flag: null, achievements: {}, best: 0, difficulty: 'normal', assist: false, cardboard: false,
  comms: 'min', // mínimas | normales | desactivadas — voz y subtítulos de Control de Misión
};
let data;
try { data = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { data = { ...defaults }; }
data.vol = { ...defaults.vol, ...(data.vol || {}) };
if (!['min', 'normal', 'off'].includes(data.comms)) data.comms = 'min';
try { const ql = new URLSearchParams(location.search).get('lang'); if (ql === 'es' || ql === 'en') data.lang = ql; } catch {}
const subs = new Map();
export const store = {
  get: (k) => data[k],
  set(k, v) { data[k] = v; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} emit('store:' + k, v); },
  all: () => data,
};
export function on(evt, fn) { if (!subs.has(evt)) subs.set(evt, new Set()); subs.get(evt).add(fn); return () => subs.get(evt).delete(fn); }
export function emit(evt, ...a) { for (const fn of subs.get(evt) || []) fn(...a); }
// Ganchos de depuración (window.__net, __radio…): solo en `vite dev` o con ?debug en la URL, nunca en producción por defecto
export const DEBUG = import.meta.env.DEV || (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && new URLSearchParams(location.search).has('debug'));
export const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
export const isMobile = isTouch && Math.min(screen.width, screen.height) < 820;
// Estado compartido entre fases (antes en window.__*)
export const shared = { landing: null, flagPhoto: null, photo: null };
// Expone un valor en window.__k solo con ?debug / vite dev
export const dbg = (k, v) => { if (DEBUG) window['__' + k] = v; };
// Piloto automático de pruebas: solo con ?debug
export const AUTO = () => DEBUG && !!window.__auto;
export const AUTO1 = () => DEBUG && window.__auto === 1;
