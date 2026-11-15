// Orden narrativo del guion v4 alrededor de las 5 fases jugables. Solo en la misión Apolo completa en solitario:
// en práctica, cooperativo, reanudación o piloto automático de QA se saltan (las fases y su puntaje no cambian).
// Cada interludio es saltable con Esc / Enter y nunca bloquea la misión; si una escena falla, se sigue con la siguiente.
// Reúne tres reproductores: story/ (playa, disyuntor), cutscenes/cine-index.js (Tierra: hotel, MOCR, casa)
// y cutscenes/cine-play.js (cap. 7 y epílogo: Laika, amerizaje, LRL, desfile).
import { AUTO, dbg } from '../../core/store.js';
import { stopCue } from '../cutscenes/play.js';
import { show } from '../../ui/router.js';

const own = (load) => async (o) => { const m = await load(); return m.default(o); };
// cinemáticas de la Tierra (trabajador B): devuelven { id, played, skipped }
const earth = (id) => async (o) => { if (!o.ctx) show('<div class="screen"></div>', 'story-' + id); /* entre fases: quita el HUD anterior */ const m = await import('../cutscenes/cine-index.js'); return m.playCinematic(id, o); };
// cap. 7 + epílogo (trabajador C); rickHeard = ruta histórica del cap. 1 (Neil les dice la verdad)
const epi = (id) => async (o) => { if (!o.ctx) show('<div class="screen"></div>', 'story-' + id); /* entre fases: quita el HUD anterior */ const m = await import('../cutscenes/cine-play.js'); return m.playCine(id, { vars: { rickHeard: true }, ...o }); };

// id → función async (opts) => resultado
export const STORY = {
  'hotel-prologue': earth('hotel-prologue'),
  'mocr-tough': earth('mocr-tough'),
  'house-farewell': earth('house-farewell'),
  beach: own(() => import('./beach.js')),
  'mocr-briefing': earth('mocr-briefing'),
  'mocr-1202': earth('mocr-1202'),
  'mocr-gonogo': earth('mocr-gonogo'),
  'mocr-landed': earth('mocr-landed'),
  'house-landed': earth('house-landed'),
  breaker: own(() => import('./breaker.js')),
  boss: own(() => import('../boss/story.js')), // No Canon, opcional: pregunta «Soñar / Saltar» antes (trabajador D)
  laika: epi('laika'),
  recovery: epi('recovery'),
  lrl: epi('lrl'),
  parade: epi('parade'),
};
// títulos para el menú «Escenas del guion» (orden del guion)
export const STORY_TITLES = {
  'hotel-prologue': ['Prólogo · Enero de 1967', 'Prologue · January 1967'],
  'mocr-tough': ['Prólogo · Duros y competentes', 'Prologue · Tough and competent'],
  'house-farewell': ['Cap. 1 · La despedida', 'Ch. 1 · The farewell'],
  beach: ['Cap. 1 · La playa de Cabo Kennedy', 'Ch. 1 · The Cape Kennedy beach'],
  'mocr-briefing': ['Cap. 4 · Cierren las puertas', 'Ch. 4 · Lock the doors'],
  'mocr-1202': ['Cap. 4 · Alarma 1202 en Houston', 'Ch. 4 · 1202 alarm in Houston'],
  'mocr-gonogo': ['Cap. 4 · GO / NO GO', 'Ch. 4 · GO / NO GO'],
  'mocr-landed': ['Cap. 4 · Base Tranquilidad', 'Ch. 4 · Tranquility Base'],
  'house-landed': ['Cap. 4 · En casa de los Armstrong', 'Ch. 4 · At the Armstrong home'],
  breaker: ['Cap. 6 · El disyuntor', 'Ch. 6 · The circuit breaker'],
  boss: ['Cap. 6 · Polvo y fuego (No Canon)', 'Ch. 6 · Dust and fire (Non-canon)'],
  laika: ['Cap. 7 · La perrita', 'Ch. 7 · The little dog'],
  recovery: ['Cap. 7 · Volver a casa', 'Ch. 7 · Coming home'],
  lrl: ['Cap. 7 · Cuarentena', 'Ch. 7 · Quarantine'],
  parade: ['Epílogo · Un gran salto', 'Epilogue · One giant leap'],
};
// momento → ids en orden del guion. La alarma 1202 (cap. 4.4) y el alunizaje (4.6–4.7) se lanzan desde descent.js.
export const SLOTS = {
  'before:prep': ['hotel-prologue', 'mocr-tough'],
  'before:launch': ['house-farewell', 'beach'],
  'before:cruise': [],
  'before:descent': ['mocr-briefing'],
  'after:descent': [],
  'after:eva': ['breaker', 'boss', 'laika', 'recovery', 'lrl', 'parade'],
};
export const STORY_IDS = Object.keys(STORY);
const params = new URLSearchParams(location.search);
export const storyEnabled = () => !AUTO() && !params.has('nostory');
// dentro de una fase: misma regla que los interludios (misión completa, solitario, piloto)
export const storyInPhase = (ctx) => storyEnabled() && !ctx.practice && ctx.mode === 'solo' && ctx.role === 'pilot';

export async function playStory(id, opts = {}) {
  const run = STORY[id]; if (!run) return { id, played: false };
  stopCue();
  try { const r = await run(opts); dbg('storyDone', id); return { id, played: true, ...(r || {}) }; }
  catch (e) { console.error('interludio ' + id, e); return { id, played: false, error: String(e) }; }
}
// alive(): false si la misión se abandonó a mitad de un interludio
export async function interlude(slot, { alive = () => true } = {}) {
  if (!storyEnabled()) return;
  for (const id of SLOTS[slot] || []) { if (!alive()) return; await playStory(id); }
}
