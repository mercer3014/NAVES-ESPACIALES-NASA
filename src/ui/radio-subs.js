// Subtítulos de las líneas de radio del pack Apolo 11 (Houston, Armstrong, Aldrin…) durante las misiones.
// El audio es en inglés; el subtítulo sale en el idioma del juego (EN: lo que se oye · ES: traducción).
// Las cinemáticas con banda negra (.plb-letterbox.story) ya ponen sus propios subtítulos: ahí no se duplica.
import { SUBS } from '../audio/a11-subs.js';
import { store } from '../core/store.js';

let el = null, hideT = 0, curH = null;
function box() {
  if (el?.isConnected) return el;
  el = document.createElement('div'); el.className = 'radio-sub'; el.setAttribute('aria-live', 'polite'); el.setAttribute('role', 'status');
  el.innerHTML = '<b></b><span></span>'; document.body.append(el); return el;
}
export function hideRadioSub() { clearTimeout(hideT); if (el) el.classList.remove('on'); curH = null; }
// file: ruta del pack ('nasa_real/cap2_go_para_orbita') · h: Howl que suena (se oculta al terminar)
export function showRadioSub(file, h) {
  const s = SUBS[file]; if (!s) return;
  if (document.querySelector('.plb-letterbox.story')) return;
  const en = store.get('lang') === 'en', who = en ? s[1] : s[0], text = en ? s[2] : s[3];
  const b = box(); b.querySelector('b').textContent = who; b.querySelector('span').textContent = text;
  clearTimeout(hideT); b.classList.add('on'); curH = h;
  // tiempo mínimo de lectura por si el audio no carga; si suena, se oculta al terminar
  const minMs = Math.max(2200, text.length * 55);
  hideT = setTimeout(() => { if (curH === h) hideRadioSub(); }, minMs + 600);
  if (h?.once) {
    const done = () => { if (curH !== h) return; clearTimeout(hideT); hideT = setTimeout(() => { if (curH === h) hideRadioSub(); }, 700); };
    h.once('end', done); h.once('stop', done); h.once('loaderror', done);
    h.once('play', () => { const d = (h.duration?.() || 0) * 1000; if (d > minMs) { clearTimeout(hideT); hideT = setTimeout(() => { if (curH === h) hideRadioSub(); }, d + 1500); } });
  }
}
