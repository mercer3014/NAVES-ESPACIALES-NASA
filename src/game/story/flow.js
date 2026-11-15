// Orden narrativo del guion alrededor de las 5 fases jugables. Solo en la misión Apolo completa en solitario:
// en práctica, cooperativo, reanudación o piloto automático de QA se saltan (las fases y su puntaje no cambian).
// Cada interludio es saltable con Esc / Enter y nunca bloquea la misión; si una escena falla, se sigue con la siguiente.
// Reproductores: story/ (escenas propias), cutscenes/cine-index.js (Tierra: hotel, MOCR, casa) y cutscenes/cine-play.js
// (cap. 7 y epílogo). Cada escena aplica su banda sonora (audio/a11-score.js) y desbloquea sus tarjetas de la Bitácora.
import { AUTO, dbg } from '../../core/store.js';
import { stopCue } from '../cutscenes/play.js';
import { show } from '../../ui/router.js';
import { score, stopAmbience } from '../../audio/a11-score.js';
import { unlock, chose, record, run, setFlag } from './state.js';
import { ask } from './decisions.js';
import { missionCard } from '../../ui/mission-card.js';

const own = (load) => async (o) => { const m = await load(); return m.default(o); };
// Escena explorable (RPG). El mapa es estático: un import('../explore/scenes/' + id) no entra en el build
// de producción y el navegador pide un .js que no existe. Ahí se quedaba colgado «Iniciar misión».
const sceneLoaders = import.meta.glob('../explore/scenes/*.js');
export const explore = (id) => async (o) => {
  const load = sceneLoaders['../explore/scenes/' + id + '.js'];
  if (!load) return { id, done: false, skipped: false, flags: {}, error: 'id' };
  const [m, d] = await Promise.all([import('../explore/run.js'), load()]);
  return m.runExplore(d.default, o);
};
// minijuegos del guion: tarjeta «Cómo jugar» (qué pasó / tu misión / controles) antes de empezar
const withCard = (cardId, load) => async (o) => { await missionCard(cardId); const m = await load(); return m.default(o); };
// cinemáticas de la Tierra: devuelven { id, played, skipped }
const earth = (id) => async (o) => { if (!o.ctx) show('<div class="screen"></div>', 'story-' + id); /* entre fases: quita el HUD anterior */ const m = await import('../cutscenes/cine-index.js'); return m.playCinematic(id, o); };
// cap. 7 + epílogo; rickHeard depende de lo que Neil les dijo a sus hijos en el cap. 1
const epi = (id) => async (o) => { if (!o.ctx) show('<div class="screen"></div>', 'story-' + id); const m = await import('../cutscenes/cine-play.js'); return m.playCine(id, { vars: { rickHeard: chose('c1-kids') !== 'downplay' }, ...o }); };
// decisión sola entre escenas: sobre fondo neutro (negro), nunca sobre el último mundo 3D (G2); quita también el HUD anterior
const decide = (id, then) => async () => {
  try { const m = await import('./bridge.js'); await m.neutralWorld(); show('<div class="screen"></div>', 'story-' + id); } catch (e) { console.warn('decisión: fondo neutro no disponible', e); }
  const opt = await ask(id); then?.(opt); return { id, opt };
};
// tarjeta puente (fecha/hora + 1-2 líneas + cita de radio opcional); ver bridge.js
const bridge = (id) => async (o) => { const m = await import('./bridge.js'); return m.playBridge(id, o); };
// Sala de diseño «Tu Apolo 11» (WP5): devuelve el plan, que designRoom guarda en store 'missionPlan'
const designScene = async (o) => {
  try {
    const walked = await explore('design-room')(o);
    if (walked && !walked.error) {
      const { activePlan } = await import('../design/plan.js');
      const { store } = await import('../../core/store.js');
      return { id: 'design', plan: activePlan(null, store), flags: walked.flags || {} };
    }
  } catch (e) { console.warn('sala de diseño caminable', e); }
  const b = await import('./bridge.js'); await b.neutralWorld(); if (!o?.ctx) show('<div class="screen"></div>', 'story-design'); const m = await import('../design/design-screen.js'); const plan = await m.designRoom({ mode: 'story' }); return { id: 'design', plan };
};
// escena No Canon con rótulo permanente (misma convención que el jefe: «NO CANON · …»)
const noCanon = (run_) => async (o) => { const m = await import('./bridge.js'); const off = m.noCanonTag(); try { return await run_(o); } finally { off(); } };

// id → función async (opts) => resultado
export const STORY = {
  'bridge:intro': bridge('intro'),
  'bridge:design': bridge('design'),
  design: designScene,
  'bridge:jul69': bridge('jul69'),
  'bridge:launch-morning': bridge('launch-morning'),
  'bridge:t-minus': bridge('t-minus'),
  'bridge:tli': bridge('tli'),
  'bridge:undock': bridge('undock'),
  'bridge:hatch': bridge('hatch'),
  'bridge:meanwhile': bridge('meanwhile'),
  'bridge:report': bridge('report'),
  'hotel-prologue': explore('hotel'),
  'mocr-tough': earth('mocr-tough'),
  // La casa y el MOCR se caminan; el cierre es un plano corto de la cinemática.
  // Object.assign: story.test corta el objeto STORY en el primer cierre con punto y coma.
  'house-farewell': async (o) => {
    const exp = await explore('house')(o);
    if (exp?.skipped && !chose('c1-kids')) record('c1-kids', 'truth', { historic: true });
    if (exp?.skipped) return Object.assign({}, exp, { id: 'house-farewell' });
    const { runCinematic } = await import('../cutscenes/cine-player.js');
    const { CINE_HOUSE } = await import('../cutscenes/cine-house.js');
    const full = CINE_HOUSE['house-farewell'];
    const shots = full.shots.slice(5, 7).map((s, i) => (i === 1 ? { ...s, d: 3 } : s));
    const cine = await runCinematic({ ...full, shots }, o);
    return Object.assign({}, exp, { id: 'house-farewell', cine });
  },
  kids: decide('c1-kids'),
  // KSC sin caminar: la decisión de Aldrin sobre el primer paso queda como elección rápida (el rumor llega a la noche en Columbia)
  firststep: decide('c1-firststep', (o) => { if (o === 'complain') setFlag('rumor', true); }),
  // Sin la noche en Columbia ni Collins solo: sus decisiones quedan como elección rápida (mismas consecuencias en el epílogo)
  'night-choice': decide('c3-night'),
  'collins-choice': decide('c6-collins', (o) => { if (o === 'pat') setFlag('pat-words', true); }),
  ksc: explore('ksc'),
  beach: explore('beach'),
  night: explore('columbia'),
  'mocr-briefing': async (o) => {
    const exp = await explore('mocr-bales')(o);
    if (exp?.skipped) return Object.assign({}, exp, { id: 'mocr-briefing' });
    const { runCinematic } = await import('../cutscenes/cine-player.js');
    const { CINE_MOCR } = await import('../cutscenes/cine-mocr.js');
    const full = CINE_MOCR['mocr-briefing'];
    const cine = await runCinematic({ ...full, shots: [{ ...full.shots[1], d: 7 }] }, o);
    return Object.assign({}, exp, { id: 'mocr-briefing', cine });
  },
  'mocr-1202': earth('mocr-1202'),
  'mocr-gonogo': earth('mocr-gonogo'),
  'mocr-landed': earth('mocr-landed'),
  'house-landed': earth('house-landed'),
  'pre-eva': decide('c5-rest'),
  'collins-solo': explore('collins'),
  boss: async (o) => { const m = await import('../boss/story.js'); return m.default({ ...o, briefing: () => missionCard('boss') }); }, // No Canon, opcional: pregunta «Soñar / Saltar» antes
  breaker: withCard('breaker', () => import('./breaker.js')),
  liftoff: withCard('liftoff', () => import('./liftoff.js')),
  reunion: withCard('docking', () => import('./reunion.js')),
  tei: own(() => import('./tei.js')),
  laika: noCanon(epi('laika')), // escena inventada (no ocurrió en el Apolo 11): No Canon (G17)
  'laika-talk': decide('c7-laika', (o) => { if (o === 'belka') unlock('pushinka'); }),
  tv: own(() => import('./tv.js')),
  reentry: withCard('reentry', () => import('./reentry.js')),
  recovery: epi('recovery'),
  lrl: explore('lrl'),
  'white-room': explore('white-room'), // Fase 1 a pie (extra del menú)
  parade: epi('parade'),
  epilogue: own(() => import('./epilogue.js')),
};
// títulos para el menú «Escenas del guion» (orden del guion); las decisiones sueltas no aparecen
export const STORY_TITLES = {
  'hotel-prologue': ['Prólogo · Enero de 1967', 'Prologue · January 1967'],
  'mocr-tough': ['Prólogo · Duros y competentes', 'Prologue · Tough and competent'],
  design: ['Prólogo · Sala de diseño: Tu Apolo 11', 'Prologue · Design room: Your Apollo 11'],
  'white-room': ['Cap. 2 · La Sala Blanca', 'Ch. 2 · The White Room'],
  'house-farewell': ['Cap. 1 · La despedida', 'Ch. 1 · The farewell'],
  ksc: ['Cap. 1 · Centro Espacial Kennedy', 'Ch. 1 · Kennedy Space Center'],
  beach: ['Cap. 1 · La playa de Cabo Kennedy', 'Ch. 1 · The Cape Kennedy beach'],
  night: ['Cap. 3 · Noche en Columbia', 'Ch. 3 · Night aboard Columbia'],
  'mocr-briefing': ['Cap. 4 · Cierren las puertas', 'Ch. 4 · Lock the doors'],
  'mocr-1202': ['Cap. 4 · Alarma 1202 en Houston', 'Ch. 4 · 1202 alarm in Houston'],
  'mocr-gonogo': ['Cap. 4 · GO / NO GO', 'Ch. 4 · GO / NO GO'],
  'mocr-landed': ['Cap. 4 · Base Tranquilidad', 'Ch. 4 · Tranquility Base'],
  'house-landed': ['Cap. 4 · En casa de los Armstrong', 'Ch. 4 · At the Armstrong home'],
  'collins-solo': ['Cap. 6 · El lado silencioso', 'Ch. 6 · The silent side'],
  breaker: ['Cap. 6 · El disyuntor', 'Ch. 6 · The circuit breaker'],
  boss: ['Cap. 6 · Polvo y fuego (No Canon)', 'Ch. 6 · Dust and fire (Non-canon)'],
  liftoff: ['Cap. 6 · Despegue de la Luna', 'Ch. 6 · Lunar liftoff'],
  reunion: ['Cap. 6 · El reencuentro', 'Ch. 6 · The reunion'],
  tei: ['Cap. 7 · Rumbo a casa', 'Ch. 7 · Homeward bound'],
  laika: ['Cap. 7 · La perrita (No Canon)', 'Ch. 7 · The little dog (Non-canon)'],
  tv: ['Cap. 7 · La última transmisión', 'Ch. 7 · The last broadcast'],
  reentry: ['Cap. 7 · Reentrada', 'Ch. 7 · Reentry'],
  recovery: ['Cap. 7 · Volver a casa', 'Ch. 7 · Coming home'],
  lrl: ['Cap. 7 · Cuarentena', 'Ch. 7 · Quarantine'],
  parade: ['Epílogo · Un gran salto', 'Epilogue · One giant leap'],
  epilogue: ['Epílogo · Lo que quedó', 'Epilogue · What remained'],
};
// tarjetas de «Momento» y objetos que se ganan al ver cada escena (aunque se salte)
export const SCENE_CARDS = {
  'hotel-prologue': ['tratado-1967', 'apolo-1'],
  'mocr-tough': ['duros-competentes', 'pizarra-kranz'],
  'house-farewell': ['la-despedida'],
  ksc: ['deke-slayton', 'primer-paso-quien'],
  beach: [],
  'mocr-briefing': [],
  'mocr-1202': ['alarmas-1202'],
  'mocr-gonogo': ['go-aterrizar'],
  'mocr-landed': ['eagle-aterrizo'],
  'house-landed': ['squawk-box'],
  'collins-solo': [],
  breaker: ['motor-ascenso'],
  liftoff: ['despegue-lunar'],
  reunion: ['reencuentro'],
  tei: ['tei'],
  laika: ['laika'],
  tv: ['ultima-transmision'],
  reentry: ['escudo-termico'],
  recovery: ['amerizaje'],
  lrl: ['cuarentena'],
  parade: ['desfile'],
  epilogue: ['legado-lrrr', 'artemis'],
};
// momento → ids en orden del guion. La alarma 1202 (cap. 4.4) y el alunizaje (4.6–4.7) se lanzan desde descent.js;
// la noche en Columbia (cap. 3.2) desde cruise.js, entre la alineación y la LOI.
// Orden cronológico (G1): prólogo 1967 → sala de diseño → julio de 1969 (casa, KSC, playa) → mañana del 16 jul (Fase 1) → lanzamiento…
// El disyuntor se descubre ANTES del sueño del Guardián (T9). Las tarjetas puente `bridge:*` van en los huecos entre escenas.
export const SLOTS = {
  // Intro corta: las escenas de charla (hotel 1967, discurso de Kranz, casa del lago, KSC y playa) salieron de la misión
  // y siguen en «Escenas del guion». Sus dos decisiones se conservan como elección rápida para no perder consecuencias.
  // Lo importante es el despegue: antes de la Fase 1 solo quedan las dos decisiones del cap. 1 (10 s cada una) y la tarjeta
  // de la mañana del lanzamiento. La sala de diseño sigue en el menú y en el informe final («Rediseñar»); sin ella vale el plan de 1969.
  'before:prep': ['bridge:jul69', 'kids', 'firststep', 'bridge:launch-morning'],
  'before:launch': ['bridge:t-minus'],
  'before:cruise': ['bridge:tli'],
  'before:descent': ['bridge:undock'],
  'after:descent': [],
  'before:eva': ['pre-eva', 'bridge:hatch'],
  // Laika (No Canon), el rescate y el desfile son cinemáticas de charla: quedan como extras en «Escenas del guion».
  // Tras la EVA solo quedan los minijuegos (disyuntor, jefe opcional, despegue, acople, reentrada) y el epílogo.
  // Collins solo, TEI, la última transmisión y la cuarentena son charlas: extras del menú.
  'after:eva': ['bridge:meanwhile', 'collins-choice', 'breaker', 'boss', 'liftoff', 'reunion', 'reentry', 'epilogue', 'bridge:report'],
};
// Escenas de charla que salieron de la misión: sus tarjetas de «Momento» se ganan igual (son hechos que ocurrieron),
// en silencio y en el punto donde iban. Los objetos que había que inspeccionar se siguen ganando desde el menú.
export const PASSED = {
  'before:prep': ['hotel-prologue', 'mocr-tough', 'house-farewell', 'ksc'],
  'before:descent': ['mocr-briefing'],
  'after:eva': ['collins-solo', 'tei', 'tv', 'lrl', 'recovery', 'parade'],
};
export function passScene(id) {
  for (const c of SCENE_CARDS[id] || []) unlock(c, { quiet: true });
  // la hoja de Garman era del MOCR de Bales: sin esa escena, Bales tiene la hoja (como en 1969) y su «GO» suena firme
  if (id === 'mocr-briefing') setFlag('garmanSheet', true);
}
export const STORY_IDS = Object.keys(STORY);
const params = new URLSearchParams(location.search);
export const storyEnabled = () => !AUTO() && !params.has('nostory');
// dentro de una fase: misma regla que los interludios (misión completa, solitario, piloto)
export const storyInPhase = (ctx) => storyEnabled() && !ctx.practice && ctx.mode === 'solo' && ctx.role === 'pilot';

export async function playStory(id, opts = {}) {
  const run_ = STORY[id]; if (!run_) return { id, played: false };
  stopCue(); score(id);
  try {
    const r = await run_(opts); dbg('storyDone', id);
    for (const c of SCENE_CARDS[id] || []) unlock(c);
    if (id === 'breaker' && !r?.skipped) record('c6-breaker', 'pen', { historic: true });
    return { id, played: true, ...(r || {}) };
  } catch (e) { console.error('interludio ' + id, e); return { id, played: false, error: String(e) }; }
  finally { stopAmbience(); }
}
// alive(): false si la misión se abandonó a mitad de un interludio
export async function interlude(slot, { alive = () => true } = {}) {
  if (!storyEnabled()) return;
  for (const id of PASSED[slot] || []) passScene(id);
  for (const id of SLOTS[slot] || []) { if (!alive()) return; await playStory(id); }
}
dbg('storyRun', run);
