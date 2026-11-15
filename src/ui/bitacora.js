// Bitácora del Apolo 11: álbum de tarjetas por capítulo ([B] o botón) y aviso «Nueva entrada» al desbloquear.
import { store, on } from '../core/store.js';
import { setPaused } from '../core/engine.js';
import { extend } from '../core/i18n.js';
import { CARDS, CHAPTERS, RARITY } from '../game/story/cards.js';
import { bitacoraProgress, hasCard } from '../game/story/state.js';
import { a11sfx } from '../audio/a11-score.js';
import './bitacora.css';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
extend({ 'menu.bitacora': ['Bitácora del Apolo 11', 'Apollo 11 log'] });
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');
const CAT = { moment: ['Momento', 'Moment'], object: ['Objeto', 'Object'], person: ['Persona', 'Person'], place: ['Lugar', 'Place'], science: ['Ciencia', 'Science'], decision: ['Decisión', 'Decision'] };
const SFX = { common: 'comun', rare: 'rara', epic: 'epica', legendary: 'legendaria', hidden: 'oculta' };

// ---- aviso al desbloquear ----
let stack = null;
on('bitacora:new', (id, card, { quiet } = {}) => {
  if (quiet) return;
  a11sfx('ui_bitacora_nueva_entrada_' + SFX[card.rar], 0.55);
  if (!stack) { stack = document.createElement('div'); stack.className = 'bit-toasts'; document.body.append(stack); }
  const r = RARITY[card.rar]; const n = document.createElement('div'); n.className = 'bit-toast'; n.style.setProperty('--rc', r.color);
  n.innerHTML = `<b></b><span></span>`; n.querySelector('b').textContent = `${L() ? 'New log entry' : 'Nueva entrada en la Bitácora'} · ${tx(r.label)}`;
  n.querySelector('span').textContent = tx(card.title) + (L() ? '  ·  [B] open' : '  ·  [B] abrir');
  n.onclick = () => openBitacora(id); stack.append(n);
  setTimeout(() => n.classList.add('out'), 4200); setTimeout(() => n.remove(), 4700);
});

// ---- álbum ----
let el = null, wasPaused = false;
export const bitacoraOpen = () => !!el;
export function openBitacora(focus = null) {
  if (el) return; a11sfx('ui_bitacora_abrir_pagina', 0.5);
  el = document.createElement('div'); el.className = 'bit'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', L() ? 'Apollo 11 log' : 'Bitácora del Apolo 11');
  const all = bitacoraProgress();
  el.innerHTML = `<div class="bit-panel"><header><div><div class="bit-k">${L() ? 'APOLLO 11 · LOG' : 'APOLO 11 · BITÁCORA'}</div><h2>${all.got}/${all.total} · ${all.pct}%</h2></div><button class="bit-x" type="button" aria-label="${L() ? 'Close' : 'Cerrar'}">×</button></header>
    <nav class="bit-tabs"></nav><div class="bit-body"><div class="bit-grid"></div><article class="bit-det"></article></div></div>`;
  const tabs = el.querySelector('.bit-tabs'), grid = el.querySelector('.bit-grid'), det = el.querySelector('.bit-det');
  const startCh = focus && CARDS[focus] ? CARDS[focus].ch : 0;
  CHAPTERS.forEach((name, ch) => {
    const p = bitacoraProgress(ch); const b = document.createElement('button'); b.type = 'button'; b.className = 'bit-tab';
    b.innerHTML = `<span></span><i>${p.pct}%</i>`; b.querySelector('span').textContent = tx(name).split(' · ')[0]; b.title = tx(name);
    b.onclick = () => showCh(ch, b); tabs.append(b); if (ch === startCh) setTimeout(() => showCh(ch, b, focus));
  });
  function showCh(ch, btn, sel = null) {
    tabs.querySelectorAll('.bit-tab').forEach((x) => x.classList.toggle('on', x === btn));
    grid.innerHTML = ''; const ids = Object.keys(CARDS).filter((id) => CARDS[id].ch === ch);
    const head = document.createElement('div'); head.className = 'bit-chh'; head.textContent = tx(CHAPTERS[ch]); grid.append(head);
    ids.forEach((id) => {
      const c = CARDS[id], got = hasCard(id), r = RARITY[c.rar]; const b = document.createElement('button'); b.type = 'button';
      b.className = 'bit-card' + (got ? '' : ' locked'); b.style.setProperty('--rc', r.color);
      b.innerHTML = `<i></i><b></b><small></small>`; b.querySelector('b').textContent = got ? tx(c.title) : '???';
      b.querySelector('small').textContent = got ? `${tx(CAT[c.cat])} · ${tx(r.label)}` : tx(r.label);
      b.onclick = () => detail(id, b); grid.append(b); if (id === sel || (!sel && got && !det.dataset.id)) detail(id, b);
    });
    if (!ids.some((id) => hasCard(id))) det.innerHTML = `<p class="bit-empty">${L() ? 'Play this chapter to fill these pages.' : 'Juega este capítulo para llenar estas páginas.'}</p>`;
  }
  function detail(id, btn) {
    grid.querySelectorAll('.bit-card').forEach((x) => x.classList.toggle('sel', x === btn)); det.dataset.id = id;
    const c = CARDS[id], r = RARITY[c.rar];
    if (!hasCard(id)) { det.innerHTML = `<div class="bit-k" style="color:${r.color}">${tx(r.label)}</div><h3>???</h3><p class="bit-empty">${c.rar === 'hidden' ? (L() ? 'A hidden event. Only hinted at by the characters.' : 'Un evento oculto. Solo lo insinúan los personajes.') : (L() ? 'Still undiscovered.' : 'Todavía sin descubrir.')}</p>`; return; }
    det.innerHTML = `<div class="bit-k" style="color:${r.color}"></div><h3></h3><div class="bit-date"></div><p class="bit-fact"></p><p class="bit-img"></p><div class="bit-src"></div>`;
    det.querySelector('.bit-k').textContent = `${tx(CAT[c.cat])} · ${tx(r.label)}`;
    det.querySelector('h3').textContent = tx(c.title);
    det.querySelector('.bit-date').textContent = c.date || '';
    det.querySelector('.bit-fact').textContent = tx(c.fact) || '';
    det.querySelector('.bit-img').textContent = c.img ? (L() ? 'Image: ' : 'Imagen: ') + tx(c.img) : '';
    det.querySelector('.bit-src').textContent = c.src ? (L() ? 'Source: ' : 'Fuente: ') + c.src : '';
  }
  el.querySelector('.bit-x').onclick = closeBitacora;
  el.addEventListener('click', (e) => { if (e.target === el) closeBitacora(); });
  document.body.append(el); requestAnimationFrame(() => el.classList.add('on'));
  wasPaused = false; if (!document.body.dataset.paused) { setPaused(true); wasPaused = true; }
  el.querySelector('.bit-x').focus();
}
export function closeBitacora() {
  if (!el) return; const x = el; el = null; x.classList.remove('on'); setTimeout(() => x.remove(), 250);
  if (wasPaused) setPaused(false);
}
addEventListener('keydown', (e) => {
  if (e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
  if (e.code === 'KeyB' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); el ? closeBitacora() : openBitacora(); }
  else if (el && e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); closeBitacora(); }
}, true);
