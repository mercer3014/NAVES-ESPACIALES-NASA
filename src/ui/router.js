import { h } from '../core/util.js';
import { dbg } from '../core/store.js';
import { applyI18n } from '../core/i18n.js';
import { cursorMode } from './presentation.js';
const ui = document.getElementById('ui'); let cur = null, curName = '';
export function syncCursor() {
  document.body.dataset.cursor = cursorMode({
    screen: document.body.dataset.screen || '',
    paused: document.body.dataset.paused === '1',
  });
}
export function show(html, name = '', onLeave) {
  const el = typeof html === 'string' ? h(html) : html;
  if (cur) { const old = cur; old.__leave?.(); old.classList.add('out'); setTimeout(() => old.remove(), 200); }
  el.__leave = onLeave; cur = el; curName = name; ui.append(el); applyI18n(el); document.body.dataset.screen = name; syncCursor(); dbg('screen', name); return el;
}
export const current = () => curName;
