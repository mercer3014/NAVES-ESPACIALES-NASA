// UI ticks reuse the existing short effects. Nothing new is fetched until a control is actually hovered.
import { Howler } from 'howler';
import { sfx } from '../core/audio.js';

const HOT = 'button,a,.sw,.station,.opt,.mbtn,.btn,.icon-btn';

export function bindUiSfx(root) {
  if (!root || root.dataset.uiSfx) return;
  root.dataset.uiSfx = '1';
  let last = 0;
  root.addEventListener('pointerover', (e) => {
    const el = e.target?.closest?.(HOT);
    if (!el || !root.contains(el) || (e.relatedTarget && el.contains(e.relatedTarget))) return;
    const now = performance.now();
    if (now - last < 90) return;
    last = now;
    sfx('hover', { vol: 0.12 });
  });
}

export function sfxIfUnlocked(name, opts) {
  try {
    if (Howler.ctx?.state === 'running') sfx(name, opts);
  } catch { /* autoplay still locked */ }
}
