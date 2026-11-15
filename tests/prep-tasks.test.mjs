// Lógica pura de las tareas de Fase 1 (leak.js y align.js): sin DOM.
import assert from 'node:assert/strict';
import { makePuzzle, puzzleSolved, flowReach, rotateCell, pieceMask, createTurnTracker } from '../src/game/phases/prep-tasks/leak.js';
import { normAngle, inTol, allAligned, startAngles, tolFor, ringAt } from '../src/game/phases/prep-tasks/align.js';

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Tuberías: 300 semillas, siempre con solución garantizada y nunca resuelto de inicio.
for (let seed = 1; seed <= 300; seed++) {
  const pz = makePuzzle(rng(seed));
  assert.equal(pz.cells.length, 4);
  assert.equal(puzzleSolved(pz), false, `semilla ${seed} nace resuelta`);
  assert.ok(pz.cells.filter((c) => pieceMask(c.type, c.rot) !== c.need).length >= 2);
  // girando cada pieza hasta su solución se resuelve (como mucho 3 toques por pieza)
  let taps = 0;
  pz.cells.forEach((c, i) => { while (pieceMask(c.type, c.rot) !== c.need) { rotateCell(pz, i); taps++; } });
  assert.ok(taps <= 12);
  assert.equal(puzzleSolved(pz), true, `semilla ${seed} sin solución`);
  assert.equal(flowReach(pz).lit.size >= 1, true);
}
// Las máscaras: recta = 2 lados opuestos, codo = 2 adyacentes
assert.equal(pieceMask('S', 0), 0b1010); assert.equal(pieceMask('S', 1), 0b0101); assert.equal(pieceMask('S', 2), 0b1010);
assert.equal(pieceMask('E', 0), 0b0011); assert.equal(pieceMask('E', 3), 0b1001);

// Llave: 3 vueltas horarias; al revés resta; no baja de 0.
const trk = createTurnTracker(3);
trk.start(0);
for (let a = 0.2; a <= Math.PI * 2 * 3 + 0.2; a += 0.2) trk.move(((a + Math.PI) % (Math.PI * 2)) - Math.PI);
assert.equal(trk.done, true);
const back = createTurnTracker(3); back.start(0);
for (let a = -0.2; a >= -3; a -= 0.2) back.move(a);
assert.equal(back.angle, 0);
const half = createTurnTracker(3); half.start(0);
for (let a = 0.2; a <= Math.PI; a += 0.2) half.move(a);
assert.ok(half.turns > 0.45 && half.turns < 0.55 && !half.done);

// Alineación: tolerancia, normalización y arranque nunca resuelto.
assert.equal(normAngle(190), -170); assert.equal(normAngle(-181), 179); assert.equal(normAngle(360), 0);
assert.equal(inTol(2.9, 3), true); assert.equal(inTol(-3.1, 3), false); assert.equal(inTol(358, 3), true);
assert.ok(tolFor('veteran') < tolFor('normal') && tolFor('normal') === 3 && tolFor('cadet') > 3);
assert.equal(allAligned([0, 1, -2], 3), true); assert.equal(allAligned([0, 1, 4], 3), false);
for (let seed = 1; seed <= 100; seed++) { const a = startAngles(rng(seed)); assert.equal(a.length, 3); assert.ok(a.every((v) => Math.abs(v) >= 35)); }
assert.equal(ringAt(150), 0); assert.equal(ringAt(80), 1); assert.equal(ringAt(30), 2); assert.equal(ringAt(200), -1);

console.log('prep-tasks tests ok');
