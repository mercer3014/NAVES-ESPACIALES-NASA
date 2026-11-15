// Voz de una línea de exploración. Si hay clip (`vo`), suena el pack Apolo 11.
// Si no hay clip y «Leer en voz alta» está activo, habla el sintetizador.
import { playA11, stopVoiceLine } from '../../audio/a11-voice.js';
import { say } from '../../core/audio.js';
import { store } from '../../core/store.js';

const tx = (p, lang) => (Array.isArray(p) ? p[lang] ?? p[0] : p || '');

export function speakExplore({ vo, text, lang = 0 } = {}) {
  if (vo) {
    try { playA11(vo); return 'clip'; } catch { return 'silent'; }
  }
  const line = tx(text, lang);
  if (line && store.get('tts')) {
    try { say(line, lang ? 'en' : 'es'); return 'tts'; } catch { return 'silent'; }
  }
  return 'silent';
}

export function stopExploreVoice() {
  try { stopVoiceLine(); } catch { /* sin audio no se corta nada */ }
}
