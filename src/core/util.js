import { t } from './i18n.js';
import { sfx } from './audio.js';
import { store } from './store.js';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function toast(text, kind = 'ach') {
  const el = h(`<div class="toast ${kind}">${kind === 'ach' ? '🏅' : 'ℹ️'} <span>${text}</span></div>`);
  document.getElementById('toasts').append(el); setTimeout(() => el.remove(), 3800);
}
export function achieve(id) {
  const a = store.get('achievements'); if (a[id]) return false;
  a[id] = Date.now(); store.set('achievements', a); sfx('achievement'); toast(t('ach.' + id)); return true;
}
export function scanFx() { const s = document.getElementById('fx-scan'); s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); }
export function fmt(n, d = 0) { return Number(n).toFixed(d); }
export function mmss(s) { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
