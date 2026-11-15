// Integridad del guion jugable: tarjetas de la Bitácora, decisiones, escenas y banda sonora apuntan a cosas que existen.
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { CARDS, CHAPTERS, RARITY } from '../src/game/story/cards.js';

const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const has = (p) => existsSync(new URL('../public/' + p, import.meta.url));

for (const [id, c] of Object.entries(CARDS)) {
  assert.ok(CHAPTERS[c.ch], `${id}: capítulo ${c.ch}`); assert.ok(RARITY[c.rar], `${id}: rareza ${c.rar}`);
  assert.ok(c.fact?.[0] && c.fact?.[1], `${id}: sin dato`); assert.ok(c.src, `${id}: sin fuente`);
}
const cardRefs = [...src('game/story/decisions.js').matchAll(/card: '([a-z0-9-]+)'/g), ...[...src('game/story/phase-cards.js').matchAll(/give\(([^)]*)\)/g)].flatMap((g) => [...g[1].matchAll(/'([a-z0-9-]+)'/g)])].map((m) => m[1])
  .concat([...src('game/story/flow.js').matchAll(/unlock\('([a-z0-9-]+)'\)/g)].map((m) => m[1]));
const sceneCards = src('game/story/flow.js').split('export const SCENE_CARDS')[1].split('};')[0];
for (const m of sceneCards.matchAll(/'([a-z0-9-]+)'(?=[,\]])/g)) cardRefs.push(m[1]);
const phases = new Set(['prep', 'launch', 'cruise', 'descent', 'eva']);
const missing = [...new Set(cardRefs)].filter((id) => !phases.has(id) && !CARDS[id]);
assert.deepEqual(missing, [], 'tarjetas referenciadas que no existen');

const flow = src('game/story/flow.js');
const story = new Set([...flow.split('export const STORY =')[1].split('};')[0].matchAll(/^\s+'?([a-z0-9:-]+)'?:/gm)].map((m) => m[1]));
const slots = flow.split('export const SLOTS')[1].split('};')[0];
const slotIds = [...slots.matchAll(/'([a-z0-9:-]+)'(?=[,\]])/g)].map((m) => m[1]);
const badSlot = slotIds.filter((id) => !story.has(id));
assert.deepEqual(badSlot, [], 'escenas en SLOTS sin STORY');

// Cronología (G1/T9): sin duplicados; el diseño y la casa/KSC/playa van antes de la Fase 1 (prep); el disyuntor antes del jefe;
// la decisión de Laika después de la escena; los puentes ocupan los huecos del plan.
const slotOf = Object.fromEntries([...slots.matchAll(/'(before|after):([a-z]+)': \[([^\]]*)\]/g)].map((m) => [m[1] + ':' + m[2], [...m[3].matchAll(/'([a-z0-9:-]+)'/g)].map((x) => x[1])]));
assert.equal(new Set(slotIds).size, slotIds.length, 'ids repetidos en SLOTS');
assert.deepEqual(slotOf['before:prep'], ['bridge:intro', 'hotel-prologue', 'mocr-tough', 'bridge:design', 'design', 'bridge:jul69', 'house-farewell', 'ksc', 'beach', 'bridge:launch-morning'], 'orden de before:prep');
for (const id of ['house-farewell', 'kids', 'ksc', 'beach', 'design']) assert.ok(!slotOf['before:launch'].includes(id), `${id} debe ir antes de la Fase 1`);
assert.deepEqual(slotOf['before:launch'], ['bridge:t-minus']);
assert.deepEqual(slotOf['before:cruise'], ['bridge:tli']);
assert.deepEqual(slotOf['before:descent'], ['bridge:undock', 'mocr-briefing']);
assert.deepEqual(slotOf['before:eva'], ['pre-eva', 'bridge:hatch']);
const after = slotOf['after:eva']; const at = (id) => after.indexOf(id);
assert.ok(at('breaker') > -1 && at('breaker') < at('boss'), 'el disyuntor va antes del jefe');
assert.ok(at('collins-solo') < at('breaker') && at('boss') < at('liftoff'), 'collins → disyuntor → jefe → despegue');
assert.ok(at('laika') > -1 && at('laika') < at('laika-talk'), 'Laika antes de su decisión');
assert.equal(after[0], 'bridge:meanwhile'); assert.equal(after.at(-1), 'bridge:report'); assert.equal(after.at(-2), 'epilogue');

// Tarjetas puente: las 10 del plan, con fecha y texto ES/EN, sin emojis y con registro STORY `bridge:<id>`
const bridgeSrc = src('game/story/bridge.js');
const bridgeIds = ['intro', 'design', 'jul69', 'launch-morning', 't-minus', 'tli', 'undock', 'hatch', 'meanwhile', 'report'];
const body = bridgeSrc.split('export const BRIDGES = {')[1].split('\n};')[0];
for (const id of bridgeIds) {
  assert.ok(new RegExp(`(^|\\n)  '?${id}'?: \\{ when: \\[`).test(body), `bridge ${id}: sin definición con fecha`);
  assert.ok(story.has('bridge:' + id), `bridge:${id} sin STORY`);
  assert.ok(slotIds.includes('bridge:' + id), `bridge:${id} no está en SLOTS`);
}
assert.equal([...body.matchAll(/(^|\n)  '?[a-z0-9-]+'?: \{ when:/g)].length, bridgeIds.length, 'número de tarjetas puente');
for (const m of body.matchAll(/(when|text|quote|who): \[('(?:[^'\\]|\\.)*'), ('(?:[^'\\]|\\.)*')\]/g)) assert.ok(m[2].length > 2 && m[3].length > 2, `bridge: par [es, en] vacío en ${m[1]}`);

// G2: las decisiones sueltas se pintan sobre un fondo neutro, no sobre el último mundo 3D
assert.match(flow.split('const decide =')[1].split('\n};')[0], /neutralWorld\(\)[\s\S]*await ask\(id\)/, 'decide() debe poner el fondo neutro antes de ask()');
// G17: Laika etiquetada «No canon» (escena y título del menú)
assert.match(flow, /laika: noCanon\(/, 'laika debe ir envuelta en noCanon()');
assert.match(flow, /laika: \['[^']*No Canon\)', '[^']*Non-canon\)'\]/, 'título de Laika sin «No Canon»');
assert.match(flow, /design: designScene/, 'STORY design');
assert.match(flow, /import\('\.\.\/design\/design-screen\.js'\)/, 'design importa design-screen.js');
assert.match(flow, /designRoom\(\{ mode: 'story' \}\)/, "design llama designRoom({mode:'story'})");

// WP-C: la casa y el MOCR se exploran; la decisión de los hijos y la hoja de Garman salen de esas escenas.
assert.match(flow, /explore\('house'\)/, 'house-farewell explora la casa');
assert.match(flow, /explore\('mocr-bales'\)/, 'mocr-briefing explora el MOCR');
assert.match(flow, /'house-farewell': \['la-despedida'\]/, 'la casa solo entrega la tarjeta de momento');
assert.match(flow, /'mocr-briefing': \[\]/, 'el chaleco y la hoja se ganan al inspeccionar');
assert.match(src('game/explore/scenes/house.js'), /decision: 'c1-kids'/, 'c1-kids vive en el diálogo de Rick');
assert.match(src('game/explore/scenes/house.js'), /stages-separate/, 'el cohete de Mark se separa');
assert.match(src('game/explore/scenes/mocr-bales.js'), /flag: 'garmanSheet'/, 'la hoja deja garmanSheet');
const descent = src('game/phases/descent.js');
assert.match(descent, /flagOf\('garmanSheet'\)/, 'la 1202 mira la hoja');
assert.match(descent, /c4_dec_bales_seguimos_go_tembloroso_en/, 'sin la hoja, la voz tiembla');
assert.ok(has('audio/a11/voz_en_clonada/c4_dec_bales_seguimos_go_tembloroso_en.mp3'), 'falta el audio tembloroso');
assert.ok(has('audio/a11/voz_en_clonada/c4_dec_bales_seguimos_go_en.mp3'), 'falta la voz firme');
assert.ok(has('models/armstrong-house-p3.glb') && has('models/mocr-room-p3.glb'), 'faltan los mundos P3');
assert.match(flow, /explore\('hotel'\)/, 'el hotel de 1967 se explora');
assert.match(flow, /'hotel-prologue': \['tratado-1967', 'apolo-1'\]/, 'la cartera y la libreta no se regalan');
assert.match(src('game/explore/scenes/hotel.js'), /p_obj_armstrong_recuerdo_ed_white_en/, 'la libreta tiene la voz de Ed White');
assert.ok(has('models/hotel-room-1967-p3.glb'), 'falta el hotel P3');
assert.match(flow, /ksc: explore\('ksc'\)/, 'el KSC se camina');
assert.match(flow, /beach: explore\('beach'\)/, 'la playa se camina');
assert.match(flow, /beach: \[\]/, 'el parche y los sobres salen de la fogata');
assert.match(src('game/explore/scenes/ksc.js'), /decision: 'c1-firststep'/, 'c1-firststep vive con Deke');

const score = src('audio/a11-score.js');
const audio = [...score.matchAll(/M\('([a-z0-9_]+)'\)/g)].map((m) => `audio/a11/music/${m[1]}.mp3`)
  .concat([...score.matchAll(/amb: '([a-z0-9_]+)'/g)].map((m) => `audio/a11/sfx/${m[1]}.mp3`));
assert.deepEqual(audio.filter((p) => !has(p)), [], 'audio de la banda sonora que no existe');
console.log(`PASS story: ${Object.keys(CARDS).length} cards, ${story.size} scenes, ${audio.length} score files`);
