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
const story = new Set([...flow.split('export const STORY =')[1].split('};')[0].matchAll(/^\s+'?([a-z0-9-]+)'?:/gm)].map((m) => m[1]));
const slots = flow.split('export const SLOTS')[1].split('};')[0];
const badSlot = [...slots.matchAll(/'([a-z0-9-]+)'(?=[,\]])/g)].map((m) => m[1]).filter((id) => !story.has(id));
assert.deepEqual(badSlot, [], 'escenas en SLOTS sin STORY');

const score = src('audio/a11-score.js');
const audio = [...score.matchAll(/M\('([a-z0-9_]+)'\)/g)].map((m) => `audio/a11/music/${m[1]}.mp3`)
  .concat([...score.matchAll(/amb: '([a-z0-9_]+)'/g)].map((m) => `audio/a11/sfx/${m[1]}.mp3`));
assert.deepEqual(audio.filter((p) => !has(p)), [], 'audio de la banda sonora que no existe');
console.log(`PASS story: ${Object.keys(CARDS).length} cards, ${story.size} scenes, ${audio.length} score files`);
