// UI de la Radio del traje: píldora compacta (mic abierto / silencio, indicadores de voz, enlace),
// botón opcional de pulsar-para-hablar y llamadas rápidas (respaldo sin micrófono).
import { t, extend, lang } from '../core/i18n.js';
import { on, isTouch, store, DEBUG } from '../core/store.js';
import { net, tx, partner } from '../net/room.js';
import { radio, enableMic, setMuted, setMode, setPTT, radioBurst, radioSupported, autoMic, micLevel } from '../net/radio.js';
import { say, sfx } from '../core/audio.js';
import { renderPatch, defaultFlag } from './flag.js';
import { toast } from '../core/util.js';

extend({
  'r.title': ['Radio del traje', 'Suit radio'],
  'r.off': ['Toca para encender', 'Tap to turn on'],
  'r.asking': ['Pidiendo micrófono…', 'Requesting mic…'],
  'r.open': ['Micrófono abierto', 'Open mic'],
  'r.pttHint': [isTouch ? 'Mantén el botón para hablar' : 'Mantén V para hablar', isTouch ? 'Hold the button to talk' : 'Hold V to talk'],
  'r.muted': ['Silenciado', 'Muted'],
  'r.denied': ['Sin micrófono · usa llamadas', 'No mic · use callouts'],
  'r.unsup': ['Requiere HTTPS · usa llamadas', 'Needs HTTPS · use callouts'],
  'r.deniedT': ['No hay permiso de micrófono. Puedes seguir oyendo a tu compañero y usar las llamadas rápidas.', 'Microphone permission denied. You can still hear your partner and use quick callouts.'],
  'r.unsupT': ['El micrófono necesita una conexión segura (HTTPS). Usa las llamadas rápidas.', 'The microphone needs a secure (HTTPS) connection. Use quick callouts.'],
  'r.link.connecting': ['enlazando…', 'linking…'], 'r.link.connected': ['enlace OK', 'link OK'], 'r.link.failed': ['sin enlace de voz', 'no voice link'], 'r.link.idle': ['', ''],
  'r.calls': ['Llamadas rápidas', 'Quick callouts'],
  'r.mode': ['Modo', 'Mode'], 'r.mode.open': ['Mic abierto', 'Open mic'], 'r.mode.ptt': ['Pulsar para hablar', 'Push to talk'],
  'r.mute': ['Silenciar micrófono', 'Mute microphone'], 'r.unmute': ['Activar micrófono', 'Unmute microphone'],
  'r.ptt': ['HABLAR', 'TALK'],
  'c.did': ['¿Ya hiciste esto?', 'Did you do this already?'],
  'c.help': ['¡Ayuda!', 'Help!'],
  'c.bring': ['Trae esto', 'Bring this'],
  'c.press': ['Aprieta esto', 'Press this'],
  'c.do': ['Hazlo por mí', 'Do it for me'],
  'c.meteor': ['¡Mira, un meteorito!', 'Look, a meteor!'],
  'c.star': ['¡Una estrella fugaz!', 'A shooting star!'],
  'pc.reply.sky': ['¡Yo también lo vi! Qué espectáculo allá arriba.', 'I saw it too! What a show up there.'],
  'pc.reply.help': ['Tranquilo, aquí estoy. Sigue la lista paso a paso.', 'Easy, I am here. Follow the checklist step by step.'],
  'pc.reply.ok': ['Recibido, fuerte y claro.', 'Copy, loud and clear.'],
  'c.bh': ['¡Se formó un agujero negro!', 'A black hole just formed!'],
});
export const CALLS = [['did', '01'], ['help', '02'], ['bring', '03'], ['press', '04'], ['do', '05'], ['meteor', '06'], ['star', '07'], ['bh', '08']];
const MIC = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7" fill="none"/><line class="slash" x1="4" y1="4" x2="20" y2="20"/></svg>`;

const el = document.createElement('div'); el.className = 'radio hidden'; el.setAttribute('role', 'group');
el.innerHTML = `<button class="r-mic">${MIC}</button>
  <div class="r-lab"><b></b><small></small></div>
  <span class="r-me" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
  <span class="r-peer" aria-hidden="true"><canvas width="56" height="56"></canvas><i class="ring"></i></span>
  <button class="r-call" aria-haspopup="true" aria-label="callouts"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4zm11.2 2.5a3.4 3.4 0 0 0-1.7-3v6a3.4 3.4 0 0 0 1.7-3z"/></svg></button>`;
const panel = document.createElement('div'); panel.className = 'r-panel hidden';
const ptt = document.createElement('button'); ptt.className = 'r-ptt hidden';
const bubble = document.createElement('div'); bubble.className = 'r-bubble';
document.body.append(el, panel, ptt, bubble);
const $ = (s) => el.querySelector(s);

function paintPanel() {
  panel.innerHTML = `<div class="r-ph">${t('r.calls')}</div><div class="r-grid">${CALLS.map(([k, e]) => `<button data-k="${k}"><span>${e}</span>${t('c.' + k)}</button>`).join('')}</div>
    <div class="r-mode"><span>${t('r.mode')}</span><div class="seg"><button data-m="open" class="${radio.mode === 'open' ? 'on' : ''}">${t('r.mode.open')}</button><button data-m="ptt" class="${radio.mode === 'ptt' ? 'on' : ''}">${t('r.mode.ptt')}</button></div></div>`;
  panel.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { sendCall(b.dataset.k); togglePanel(false); }));
  panel.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { setMode(b.dataset.m); paintPanel(); paint(); }));
}
function togglePanel(v = panel.classList.contains('hidden')) { if (v) paintPanel(); panel.classList.toggle('hidden', !v); $('.r-call').classList.toggle('on', v); }
function paint() {
  const st = radio.state, live = st === 'on';
  $('.r-lab b').textContent = t('r.title').toUpperCase();
  const sub = st === 'off' ? t('r.off') : st === 'asking' ? t('r.asking') : st === 'denied' ? t('r.denied') : st === 'unsupported' ? t('r.unsup')
    : radio.muted ? t('r.muted') : radio.mode === 'ptt' ? t('r.pttHint') : t('r.open');
  const link = t('r.link.' + radio.link);
  $('.r-lab small').textContent = sub + (link && live ? ' · ' + link : '');
  el.dataset.st = live ? (radio.muted ? 'muted' : 'on') : st;
  el.classList.toggle('me', radio.me); el.classList.toggle('peer', radio.peer);
  $('.r-mic').setAttribute('aria-label', live && !radio.muted ? t('r.mute') : t('r.unmute'));
  $('.r-call').setAttribute('aria-label', t('r.calls'));
  ptt.textContent = t('r.ptt'); ptt.classList.toggle('hidden', !(visible && live && radio.mode === 'ptt' && isTouch));
}
$('.r-mic').onclick = async () => {
  sfx('toggle', { vol: 0.5 });
  if (radio.state === 'on') return setMuted(!radio.muted);
  if (radio.state === 'denied' || radio.state === 'unsupported') { toast(t(radio.state === 'denied' ? 'r.deniedT' : 'r.unsupT'), 'info'); togglePanel(true); return; }
  const ok = await enableMic(); if (!ok) { toast(t(radio.state === 'denied' ? 'r.deniedT' : 'r.unsupT'), 'info'); togglePanel(true); }
};
$('.r-call').onclick = () => { sfx('click', { vol: 0.4 }); togglePanel(); };
// pulsar-para-hablar: V en teclado, botón grande en táctil
const down = (v) => { if (radio.mode === 'ptt' && radio.state === 'on') { setPTT(v); ptt.classList.toggle('on', v); } };
addEventListener('keydown', (e) => { if (e.code === 'KeyV' && !e.repeat && visible && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) down(true); });
addEventListener('keyup', (e) => { if (e.code === 'KeyV') down(false); });
ptt.addEventListener('pointerdown', (e) => { e.preventDefault(); ptt.setPointerCapture?.(e.pointerId); down(true); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => ptt.addEventListener(ev, () => down(false)));

// llamadas rápidas
let bubT = 0;
function showBubble(who, text, mine) {
  bubble.innerHTML = `<b>${who.replace(/</g, '')}</b><span>${text}</span>`; bubble.classList.toggle('mine', !!mine);
  bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
  clearTimeout(bubT); bubT = setTimeout(() => bubble.classList.remove('show'), 3600);
}
export function sendCall(k) {
  tx({ t: 'radio', k }); radioBurst(450); showBubble(lang() === 'es' ? 'Tú' : 'You', t('c.' + k), true);
  if (net.solo) import('./pancho.js').then(({ pancho }) => setTimeout(() => pancho.say('pc.reply.' + (k === 'meteor' || k === 'star' || k === 'bh' ? 'sky' : k === 'help' ? 'help' : 'ok')), 900));
}
on('net:radio', (m) => {
  const p = partner(); const text = t('c.' + m.k); if (!text || text === 'c.' + m.k) return;
  radioBurst(Math.min(2400, 500 + text.length * 55)); showBubble(p?.name || 'CAPCOM', text);
  setTimeout(() => say(text, lang()), 260);
  flashTalk(m.from, 1800);
});

// indicadores: propio (barras) y del compañero (anillo en su parche + tarjetas del lobby)
function flashTalk(id, ms) { markAvatar(id, true); setTimeout(() => markAvatar(id, radio.peer), ms); }
function markAvatar(id, v) { if (!id) return; document.querySelectorAll(`[data-f="${id}"]`).forEach((c) => (c.closest('.crewcard') || c.parentElement)?.classList.toggle('talking', v)); if (id === partner()?.id) el.classList.toggle('peer', v || radio.peer); }
on('radio:talk', (who, v) => { if (who === 'peer') markAvatar(partner()?.id, v); else markAvatar(net.id, v); paint(); });
on('radio:state', paint); on('lang', () => { paint(); if (!panel.classList.contains('hidden')) paintPanel(); });
let raf = 0;
const bars = [...el.querySelectorAll('.r-me i')];
function meter() { raf = requestAnimationFrame(meter); const lv = micLevel(), on = radio.state === 'on' && !radio.muted; bars.forEach((b, i) => (b.style.transform = `scaleY(${on ? Math.max(0.15, Math.min(1, lv * 28 - i * 0.12 + Math.random() * 0.05)) : 0.15})`)); }

// visible en cualquier sala de 2 jugadores (lobby + misión, piloto y CAPCOM)
let visible = false;
function paintPeer() { const p = partner(), c = $('.r-peer canvas'); if (p) { renderPatch(c, p.flag || defaultFlag(), '', 56); c.dataset.f = p.id; } $('.r-peer').classList.toggle('none', !p); }
export function showRadio(v) {
  visible = v && !net.solo && !!net.code; el.classList.toggle('hidden', !visible); if (!visible) { togglePanel(false); bubble.classList.remove('show'); }
  document.body.classList.toggle('has-radio', visible);
  cancelAnimationFrame(raf); if (visible) { paintPeer(); paint(); meter(); autoMic(); } else ptt.classList.add('hidden');
}
on('net:joined', () => showRadio(true)); on('net:roster', () => { if (net.code) showRadio(true); }); on('net:left', () => showRadio(false));
document.addEventListener('pointerdown', (e) => { if (!panel.classList.contains('hidden') && !panel.contains(e.target) && !el.contains(e.target)) togglePanel(false); });
if (!radioSupported()) radio.state = 'unsupported';
if (DEBUG) window.__radioUI = { sendCall, showRadio, togglePanel };
