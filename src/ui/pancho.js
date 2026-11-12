// Pancho: radio vintage original que hace de Control de Misión (bot)
import { t, lang } from '../core/i18n.js';
import { dbg, on } from '../core/store.js';
import { blip, say as tts } from '../core/audio.js';
import { commsAllow, commsMode } from '../core/comms.js';
import { radioBurst } from '../net/radio.js';
const SVG = `<svg viewBox="0 0 64 72" aria-hidden="true">
 <line x1="44" y1="14" x2="56" y2="1" stroke="#bbb" stroke-width="2"/><circle cx="56" cy="2" r="2.5" fill="#fc3d21" class="ant"/>
 <rect x="4" y="14" width="56" height="50" rx="10" fill="#c8823a" stroke="#6b3d14" stroke-width="2"/>
 <rect x="9" y="19" width="46" height="24" rx="6" fill="#2a1d10"/>
 <g class="eyes"><rect x="17" y="26" width="9" height="8" rx="3" fill="#7fffb8"/><rect x="38" y="26" width="9" height="8" rx="3" fill="#7fffb8"/></g>
 <g stroke="#6b3d14" stroke-width="1.6"><line x1="10" y1="49" x2="38" y2="49"/><line x1="10" y1="53" x2="38" y2="53"/><line x1="10" y1="57" x2="38" y2="57"/></g>
 <circle cx="49" cy="53" r="6" fill="#e7d3a6" stroke="#6b3d14" stroke-width="1.5"/><line x1="49" y1="53" x2="52" y2="49" stroke="#6b3d14" stroke-width="1.5" class="dial"/>
 <rect x="10" y="64" width="8" height="5" rx="2" fill="#6b3d14"/><rect x="46" y="64" width="8" height="5" rx="2" fill="#6b3d14"/>
</svg>`;
const el = document.createElement('div'); el.className = 'pancho hidden'; el.innerHTML = SVG + '<div class="bubble"><b>PANCHO · CAPCOM</b><span></span></div>';
document.body.append(el);
const span = el.querySelector('span'), eyes = el.querySelector('.eyes');
let typing = null, hideT = null, blinkT = setInterval(() => { eyes.style.transform = 'scaleY(.1)'; eyes.style.transformOrigin = '32px 30px'; setTimeout(() => (eyes.style.transform = ''), 130); }, 3500);
export const pancho = {
  el,
  say(key, { ms = 4200, speak = true, vars, pos } = {}) {
    if (!commsAllow(key)) return;
    const text = t(key, vars); clearInterval(typing); clearTimeout(hideT);
    el.classList.remove('hidden'); el.classList.toggle('up', pos === 'up'); span.textContent = ''; let i = 0; blip(3);
    const talk = speak && commsMode() !== 'off';
    radioBurst(Math.min(4200, 500 + text.length * (talk ? 62 : 24))); // misma radio del traje: Quindar + estática
    typing = setInterval(() => { span.textContent = text.slice(0, ++i); if (i % 6 === 0) blip(1); if (i >= text.length) clearInterval(typing); }, 22);
    if (talk) tts(text.replace(/[♪()]/g, ''), lang());
    if (ms) hideT = setTimeout(() => el.classList.add('hidden'), ms + text.length * 22);
    dbg('lastPancho', key);
  },
  hide() { clearInterval(typing); el.classList.add('hidden'); },
  lift(on) { el.classList.toggle('lift', !!on); },
};
on('store:comms', (m) => { if (m === 'off') pancho.hide(); });
