// Bitácora del Apolo 11: álbum de tarjetas por capítulo ([B] o botón) y aviso «Nueva entrada» al desbloquear.
import { store, on } from '../core/store.js';
import { setPaused } from '../core/engine.js';
import { extend } from '../core/i18n.js';
import { CARDS, CHAPTERS, RARITY, HIDDEN_EVENTS } from '../game/story/cards.js';
import { bitacoraProgress, hasCard, hintOf, badgesOf } from '../game/story/state.js';
import { a11sfx } from '../audio/a11-score.js';
import { CARD_AUDIO, clips } from '../audio/a11-cues.js';
import './bitacora.css';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
extend({ 'menu.bitacora': ['Bitácora del Apolo 11', 'Apollo 11 log'] });
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');
const CAT = { moment: ['Momento', 'Moment'], object: ['Objeto', 'Object'], person: ['Persona', 'Person'], place: ['Lugar', 'Place'], science: ['Ciencia', 'Science'], decision: ['Decisión', 'Decision'] };
const SFX = { common: 'comun', rare: 'rara', epic: 'epica', legendary: 'legendaria', hidden: 'oculta' };

// ---- aviso al desbloquear: UNA sola ficha abajo a la izquierda que agrupa las entradas nuevas ----
// Colores de rareza del plan de vuelo (la paleta antigua de cards.js era azul y violeta pastel)
const RC = { common: '#A8A59C', rare: '#FF4F00', epic: '#E0201B', legendary: '#FFB000', hidden: '#F2EFE6' };
const RC_PAPER = { common: '#3A3D42', rare: '#FF4F00', epic: '#E0201B', legendary: '#FFB000', hidden: '#0B0C0E' };
let stack = null, pend = 0, lastId = null, lastCard = null, hideT = null, goneT = null;
function paintToast() {
  if (!stack) return; const n = stack.firstChild; n.style.setProperty('--rc', RC[lastCard.rar] || '#FF4F00'); n.classList.remove('out');
  n.querySelector('b').textContent = L() ? `+${pend} log ${pend === 1 ? 'entry' : 'entries'} · B` : `+${pend} ${pend === 1 ? 'entrada' : 'entradas'} en la Bitácora · B`;
  n.querySelector('span').textContent = pend === 1 ? tx(lastCard.title) : '';
}
function hideToast() { if (!stack) return; const n = stack.firstChild; n.classList.add('out'); clearTimeout(goneT); goneT = setTimeout(() => { stack?.remove(); stack = null; pend = 0; }, 450); }
on('bitacora:new', (id, card, { quiet } = {}) => {
  if (quiet) return;
  a11sfx('ui_bitacora_nueva_entrada_' + SFX[card.rar], 0.55);
  clearTimeout(goneT); pend++; lastId = id; lastCard = card;
  if (!stack) { stack = document.createElement('div'); stack.className = 'bit-toasts'; const n = document.createElement('div'); n.className = 'bit-toast'; n.innerHTML = '<b></b><span></span>'; n.onclick = () => { const f = lastId; hideToast(); openBitacora(f); }; stack.append(n); document.body.append(stack); }
  paintToast(); clearTimeout(hideT); hideT = setTimeout(hideToast, 4800);
});

const GALLERY = [
  { file: 'as11-40-5903.jpg', title: ['Aldrin en el Mar de la Tranquilidad', 'Aldrin in the Sea of Tranquility'], cap: 'AS11-40-5903' },
  { file: 'as11-40-5874.jpg', title: ['La bandera y Buzz Aldrin', 'The flag and Buzz Aldrin'], cap: 'AS11-40-5874' },
  { file: 'as11-40-5868.jpg', title: ['Bajando por la escalerilla del Eagle', 'Climbing down Eagle’s ladder'], cap: 'AS11-40-5868' },
  { file: 'as11-40-5878.jpg', title: ['La huella en el regolito', 'The bootprint in the regolith'], cap: 'AS11-40-5878' },
  { file: 'as11-44-6552.jpg', title: ['La Tierra sobre el horizonte lunar', 'Earth over the lunar horizon'], cap: 'AS11-44-6552' },
  { file: 'S69-39961.jpg', title: ['El Saturn V deja la plataforma 39A', 'The Saturn V leaves Pad 39A'], cap: 'S69-39961' },
];
const MODES = [['chapters', ['Capítulos', 'Chapters']], ['badges', ['Insignias', 'Badges']], ['hidden', ['Eventos ocultos', 'Hidden events']], ['gallery', ['Galería', 'Gallery']]];

// ---- álbum ----
let el = null, wasPaused = false;
export const bitacoraOpen = () => !!el;
export function openBitacora(focus = null) {
  if (el) return; a11sfx('ui_bitacora_abrir_pagina', 0.5);
  el = document.createElement('div'); el.className = 'bit'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', L() ? 'Apollo 11 log' : 'Bitácora del Apolo 11');
  const all = bitacoraProgress();
  el.innerHTML = `<div class="bit-panel"><header><div><div class="bit-k">${L() ? 'APOLLO 11 · LOG' : 'APOLO 11 · BITÁCORA'}</div><h2>${all.got}/${all.total} · ${all.pct}%</h2></div><button class="bit-x" type="button" aria-label="${L() ? 'Close' : 'Cerrar'}">×</button></header>
    <nav class="bit-modes"></nav><nav class="bit-tabs"></nav><div class="bit-body"><div class="bit-grid"></div><article class="bit-det"></article></div></div>`;
  const modes = el.querySelector('.bit-modes'), tabs = el.querySelector('.bit-tabs'), grid = el.querySelector('.bit-grid'), det = el.querySelector('.bit-det');
  const startMode = focus && HIDDEN_EVENTS.includes(focus) ? 'hidden' : 'chapters';
  MODES.forEach(([id, name]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'bit-mode'; b.textContent = tx(name);
    b.onclick = () => showMode(id, b); modes.append(b);
    if (id === startMode) setTimeout(() => showMode(id, b, focus));
  });
  function showMode(id, btn, sel = null) {
    modes.querySelectorAll('.bit-mode').forEach((x) => x.classList.toggle('on', x === btn));
    tabs.hidden = id !== 'chapters'; grid.innerHTML = ''; det.innerHTML = ''; delete det.dataset.id;
    if (id === 'chapters') paintChapters(sel);
    else if (id === 'badges') paintBadges();
    else if (id === 'hidden') paintHidden(sel);
    else paintGallery();
  }
  function paintChapters(sel) {
    tabs.innerHTML = '';
    const startCh = sel && CARDS[sel] ? CARDS[sel].ch : 0;
    CHAPTERS.forEach((name, ch) => {
      const p = bitacoraProgress(ch); const b = document.createElement('button'); b.type = 'button'; b.className = 'bit-tab';
      b.innerHTML = `<span></span><i>${p.pct}%</i>`; b.querySelector('span').textContent = tx(name).split(' · ')[0]; b.title = tx(name);
      b.onclick = () => showCh(ch, b); tabs.append(b); if (ch === startCh) showCh(ch, b, sel);
    });
  }
  function showCh(ch, btn, sel = null) {
    tabs.querySelectorAll('.bit-tab').forEach((x) => x.classList.toggle('on', x === btn));
    grid.innerHTML = ''; const ids = Object.keys(CARDS).filter((id) => CARDS[id].ch === ch);
    const head = document.createElement('div'); head.className = 'bit-chh'; head.textContent = tx(CHAPTERS[ch]); grid.append(head);
    ids.forEach((id) => cardButton(id, sel));
    if (!ids.some((id) => hasCard(id))) det.innerHTML = `<p class="bit-empty">${L() ? 'Play this chapter to fill these pages.' : 'Juega este capítulo para llenar estas páginas.'}</p>`;
  }
  function cardButton(id, sel) {
    const c = CARDS[id], got = hasCard(id), r = RARITY[c.rar]; const b = document.createElement('button'); b.type = 'button';
    const secret = c.rar === 'hidden' && !got;
    b.className = 'bit-card' + (got ? '' : ' locked') + (secret ? ' secret' : ''); b.style.setProperty('--rc', secret ? '#0B0C0E' : (RC_PAPER[c.rar] || '#3A3D42'));
    b.innerHTML = `<i></i><b></b><small></small>`; b.querySelector('b').textContent = got ? tx(c.title) : '???';
    b.querySelector('small').textContent = got ? `${tx(CAT[c.cat])} · ${tx(r.label)}` : (secret && hintOf(id) ? (L() ? 'Hint' : 'Pista') : tx(r.label));
    b.onclick = () => detail(id, b); grid.append(b); if (id === sel || (!sel && got && !det.dataset.id)) detail(id, b);
    return b;
  }
  function paintHidden(sel) {
    const head = document.createElement('div'); head.className = 'bit-chh'; head.textContent = L() ? 'Eight hidden events. A hint appears when someone mentions it.' : 'Ocho eventos ocultos. La pista aparece cuando alguien la menciona.'; grid.append(head);
    HIDDEN_EVENTS.forEach((id) => cardButton(id, sel));
    if (!HIDDEN_EVENTS.some((id) => hasCard(id) || hintOf(id))) det.innerHTML = `<p class="bit-empty">${L() ? 'The crew has not hinted at these yet.' : 'La tripulación todavía no ha dejado pistas.'}</p>`;
  }
  function paintBadges() {
    const got = badgesOf();
    CHAPTERS.forEach((name, ch) => {
      const p = bitacoraProgress(ch); const on = !!got[ch] || (p.total && p.got >= p.total);
      const b = document.createElement('div'); b.className = 'bit-badge' + (on ? ' on' : '');
      b.innerHTML = `<b></b><small></small><i></i>`;
      b.querySelector('b').textContent = tx(name).split(' · ')[0];
      b.querySelector('small').textContent = on ? (L() ? 'Earned' : 'Conseguida') : `${p.pct}%`;
      b.querySelector('i').textContent = on ? '100' : String(p.got);
      grid.append(b);
    });
    det.innerHTML = `<div class="bit-k">${L() ? 'BADGE' : 'INSIGNIA'}</div><h3>${L() ? 'One per chapter, at 100%' : 'Una por capítulo, al 100 %'}</h3><p class="bit-fact">${L() ? 'Fill every page of a chapter. The stamp sounds when you earn it.' : 'Llena todas las páginas de un capítulo. El sello suena cuando lo ganas.'}</p>`;
  }
  function paintGallery() {
    GALLERY.forEach((g, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bit-shot';
      b.innerHTML = `<img alt=""><b></b>`; b.querySelector('img').src = '/img/gallery/' + g.file; b.querySelector('img').alt = tx(g.title);
      b.querySelector('b').textContent = g.cap; b.onclick = () => shot(g, b); grid.append(b); if (i === 0) shot(g, b);
    });
  }
  function shot(g, btn) {
    grid.querySelectorAll('.bit-shot').forEach((x) => x.classList.toggle('sel', x === btn));
    det.innerHTML = `<img class="bit-photo" alt=""><h3></h3><p class="bit-fact"></p><div class="bit-src"></div>`;
    const img = det.querySelector('img'); img.src = '/img/gallery/' + g.file; img.alt = tx(g.title);
    det.querySelector('h3').textContent = tx(g.title);
    det.querySelector('.bit-fact').textContent = g.cap;
    det.querySelector('.bit-src').textContent = (L() ? 'Source: NASA, public domain · images.nasa.gov · ' : 'Fuente: NASA, dominio público · images.nasa.gov · ') + g.cap;
  }
  function detail(id, btn) {
    grid.querySelectorAll('.bit-card').forEach((x) => x.classList.toggle('sel', x === btn)); det.dataset.id = id;
    const c = CARDS[id], r = RARITY[c.rar], got = hasCard(id), hinted = hintOf(id);
    if (!got) {
      det.innerHTML = `<div class="bit-k">${tx(r.label)}</div><h3>???</h3><p class="bit-empty"></p>`;
      det.querySelector('.bit-empty').textContent = c.rar === 'hidden'
        ? (hinted && c.hint ? tx(c.hint) : (L() ? 'A hidden event. Only hinted at by the characters.' : 'Un evento oculto. Solo lo insinúan los personajes.'))
        : (L() ? 'Still undiscovered.' : 'Todavía sin descubrir.');
      return;
    }
    det.innerHTML = `<div class="bit-k"></div><h3></h3><div class="bit-date"></div><p class="bit-fact"></p><p class="bit-why" hidden></p><p class="bit-img"></p><div class="bit-src"></div>`;
    det.querySelector('.bit-k').textContent = `${tx(CAT[c.cat])} · ${tx(r.label)}`;
    det.querySelector('h3').textContent = tx(c.title);
    det.querySelector('.bit-date').textContent = c.date || '';
    det.querySelector('.bit-fact').textContent = tx(c.fact) || '';
    if (c.why) { const w = det.querySelector('.bit-why'); w.hidden = false; w.textContent = (L() ? 'Why it matters. ' : 'Por qué importa. ') + tx(c.why); }
    det.querySelector('.bit-img').textContent = c.img ? (L() ? 'Image: ' : 'Imagen: ') + tx(c.img) : '';
    det.querySelector('.bit-src').textContent = c.src ? (L() ? 'Source: ' : 'Fuente: ') + c.src : '';
    if (CARD_AUDIO[id]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'bit-listen'; b.textContent = L() ? 'Listen' : 'Escuchar';
      b.onclick = () => clips(CARD_AUDIO[id], { radio: true }); det.append(b);
    }
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
