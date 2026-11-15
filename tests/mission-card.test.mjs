// Cada fase de PHASES (mission.js) y cada minijuego con tarjeta tiene su «Cómo jugar» completo en ES y EN.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CARDS, CARD_IDS, missionCard } from '../src/ui/mission-card.js';

const src = fs.readFileSync(new URL('../src/game/mission.js', import.meta.url), 'utf8');
const phases = [...src.match(/export const PHASES = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.ok(phases.length >= 5, 'PHASES se leyó de mission.js');

const need = ['design', ...phases, 'docking', 'reentry', 'breaker', 'liftoff', 'boss'];
for (const id of need) assert.ok(CARDS[id], 'falta tarjeta: ' + id);
assert.deepEqual(CARD_IDS.filter((i) => !need.includes(i)), [], 'tarjetas sin usar');

const pair = (v, w, strict = true) => { assert.ok(Array.isArray(v) && v.length === 2, w + ' debe ser [es, en]'); for (const s of v) assert.ok(typeof s === 'string' && s.trim().length > 1, w + ' vacío'); if (strict) assert.notEqual(v[0], v[1], w + ' sin traducir'); };
const words = (s) => s.trim().split(/\s+/).length;
for (const [id, c] of Object.entries(CARDS)) {
  assert.ok(typeof c.n === 'string' && c.n, id + ' n');
  for (const k of ['title', 'what', 'goal']) pair(c[k], id + '.' + k);
  assert.ok(words(c.what[0]) <= 25 && words(c.what[1]) <= 25, id + ': QUÉ PASÓ ≤ 25 palabras');
  for (const col of ['m', 't']) {
    assert.ok(Array.isArray(c[col]) && c[col].length > 0, id + '.' + col + ' vacío');
    for (const [keys, lbl] of c[col]) { assert.ok(Array.isArray(keys) && keys.length > 0 && keys.every((k) => typeof k === 'string' && k), id + ' teclas'); pair(lbl, id + '.' + col, false); }
  }
}
assert.equal(typeof missionCard, 'function');
assert.equal(await missionCard('inexistente'), undefined, 'id desconocido no bloquea');
console.log('mission-card ok (' + Object.keys(CARDS).length + ' tarjetas)');
