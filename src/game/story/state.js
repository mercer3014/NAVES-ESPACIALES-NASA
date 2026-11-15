// Estado narrativo del guion: una partida (Confianza, Moral de Control, decisiones, banderas) y la colección de la
// Bitácora, que se conserva entre partidas. La historia real nunca cambia: estas variables cambian diálogos y el tono.
import { store, emit } from '../../core/store.js';
import { CARDS } from './cards.js';

const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));
const fresh = () => ({ trust: 50, morale: 60, choices: {}, flags: {}, order: [] });

// La partida en curso vive en memoria y se guarda para poder reanudar o rejugar el epílogo
export const run = Object.assign(fresh(), store.get('storyRun') || {});
const save = () => store.set('storyRun', { trust: run.trust, morale: run.morale, choices: run.choices, flags: run.flags, order: run.order });

export function newRun() { Object.assign(run, fresh()); save(); emit('story:run', run); }

// Ajusta Confianza (trust) y/o Moral (morale). Devuelve los deltas aplicados.
export function adjust({ trust = 0, morale = 0 } = {}) {
  const t0 = run.trust, m0 = run.morale;
  run.trust = clamp100(run.trust + trust); run.morale = clamp100(run.morale + morale); save();
  const d = { trust: run.trust - t0, morale: run.morale - m0 };
  if (d.trust || d.morale) emit('story:adjust', d, run);
  return d;
}

// Registra una decisión (id del catálogo de decisions.js). info: { historic, trust, morale } ya resueltos por quien decide.
export function record(id, opt, { historic = false, trust = 0, morale = 0 } = {}) {
  if (!run.choices[id]) run.order.push(id);
  run.choices[id] = { opt, historic, t: Date.now() };
  save(); const d = adjust({ trust, morale });
  emit('story:decision', id, opt, historic, d);
  return d;
}
export const chose = (id) => run.choices[id]?.opt ?? null;
export const historicRoute = () => Object.values(run.choices).every((c) => c.historic !== false);

export function setFlag(k, v = true) { run.flags[k] = v; save(); }
export const flagOf = (k) => run.flags[k];

// Pista de un evento oculto: se guarda en cuanto un personaje la dice, antes de ganar la tarjeta.
const hinted = () => store.get('bitacoraHints') || {};
export function hearHint(id) {
  if (!CARDS[id]) return false;
  const h = hinted(); if (h[id]) return false;
  h[id] = { t: Date.now() }; store.set('bitacoraHints', h);
  return true;
}
export const hintOf = (id) => hinted()[id] || null;

// ---- Bitácora (colección global) ----
const owned = () => store.get('bitacora') || {};
export const hasCard = (id) => !!owned()[id];
export function unlock(id, { quiet = false, note = null } = {}) {
  const card = CARDS[id]; if (!card) { console.warn('Bitácora: tarjeta desconocida', id); return false; }
  const o = owned(); if (o[id]) return false;
  o[id] = { t: Date.now(), ...(note ? { note } : {}) }; store.set('bitacora', o);
  emit('bitacora:new', id, card, { quiet });
  awardBadges();
  return true;
}
export function bitacoraProgress(chapter = null) {
  const ids = Object.keys(CARDS).filter((id) => chapter == null || CARDS[id].ch === chapter);
  const o = owned(); const got = ids.filter((id) => o[id]).length;
  return { got, total: ids.length, pct: ids.length ? Math.round((got / ids.length) * 100) : 0 };
}

// Una insignia por capítulo cuando la bitácora de ese capítulo está al 100 %.
export const badgesOf = () => store.get('insignias') || {};
function awardBadges() {
  const ownedBadges = badgesOf(); let fresh = false;
  for (let ch = 0; ch < 10; ch++) {
    const p = bitacoraProgress(ch);
    if (p.total && p.got >= p.total && !ownedBadges[ch]) { ownedBadges[ch] = Date.now(); fresh = true; }
  }
  if (!fresh) return ownedBadges;
  store.set('insignias', ownedBadges);
  if (typeof window !== 'undefined') import('../../audio/a11-score.js').then((m) => m.stinger('mus_stinger_insignia_capitulo_100')).catch(() => {});
  return ownedBadges;
}
