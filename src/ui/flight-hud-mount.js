// Engancha el HUD unificado al DOM: Tab pliega objetivos, el aviso de tecla solo aparece con acción.
import './flight-hud.css';
import { isTouch } from '../core/store.js';
import { objectiveOpenFromKey, promptVisible } from './flight-hud.js';

if (typeof document !== 'undefined' && isTouch) document.documentElement.dataset.touch = '1';

let keysOn = false;

function applyObjective(card, open) {
  card.setAttribute('data-open', open ? '1' : '0');
  card.classList.toggle('is-shut', !open);
  card.querySelector('[data-obj-toggle]')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

export function installHudKeys() {
  if (keysOn || typeof document === 'undefined') return;
  keysOn = true;
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const card = document.querySelector('#ui [data-obj]');
    if (!card?.isConnected) return;
    e.preventDefault();
    applyObjective(card, objectiveOpenFromKey(card.getAttribute('data-open') !== '0'));
  }, true);
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-obj-toggle]');
    if (!btn) return;
    const card = btn.closest('[data-obj]');
    if (!card) return;
    applyObjective(card, objectiveOpenFromKey(card.getAttribute('data-open') !== '0'));
  });
}

export function paintPrompt(root, model, label) {
  if (!root) return;
  const host = root.classList?.contains('hud') || root.classList?.contains('expedition') ? root : (root.querySelector('.hud, .expedition') || root);
  let slot = host.querySelector(':scope > .mhud-prompt');
  if (!promptVisible(model, label)) { slot?.remove(); return; }
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'mhud-prompt';
    slot.setAttribute('role', 'status');
    host.append(slot);
  }
  slot.replaceChildren();
  const kbd = document.createElement('kbd');
  kbd.textContent = model.key;
  const text = document.createElement('span');
  text.textContent = label;
  slot.append(kbd, text);
}

export function flashPhase(kicker, title) {
  document.querySelector('.phase-stamp')?.remove();
  const el = document.createElement('div');
  el.className = 'phase-stamp';
  el.setAttribute('aria-hidden', 'true');
  const k = document.createElement('span');
  k.className = 'phase-stamp-k';
  k.textContent = kicker || '';
  const b = document.createElement('b');
  b.textContent = title || '';
  el.append(k, b);
  document.body.append(el);
  setTimeout(() => { if (el.isConnected) el.remove(); }, 3200);
}
