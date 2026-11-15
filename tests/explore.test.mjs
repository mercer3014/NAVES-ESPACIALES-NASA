// Motor de exploración: movimiento, paredes, diálogo, inspección y objetivos ocultos. Sin DOM.
import assert from 'node:assert/strict';
import { createBody, stepBody, pushCircle, moveWish } from '../src/game/explore/controller.js';
import { createExploreCamera, stepExploreCamera, lookExplore } from '../src/game/explore/camera.js';
import { pickInteractable, interactPrompt } from '../src/game/explore/interact.js';
import { createDialog, advanceDialog, currentBeat, choiceEffects, skipPlan } from '../src/game/explore/dialog.js';
import { inspectPanel } from '../src/game/explore/inspect.js';
import { createObjectives, revealNearby, objectiveLines, completeObjective } from '../src/game/explore/objectives.js';
import { createCompanion, stepCompanion } from '../src/game/explore/companion.js';
import { stepHold, nextHose, markCheck, ready } from '../src/game/explore/actions.js';

const DT = 1 / 60;
const wall = { min: { x: 1, y: 0, z: -2 }, max: { x: 1.5, y: 3, z: 2 } };

// W con la cámara mirando al este (guiño −π/2) avanza en +X.
const body = createBody({ spawn: [0, 0, 0], yaw: 0, speed: 1.7, radius: 0.3 });
for (let i = 0; i < 180; i++) stepBody(body, { ax: 0, ay: 1, camYaw: -Math.PI / 2, colliders: [wall], floorY: 0, gravity: 9.81 }, DT);
assert.ok(body.x > 0.4, 'camina hacia la pared: ' + body.x);
assert.ok(body.x <= 1 - 0.3 + 0.02, 'no entra en la caja: ' + body.x);

const round = { x: 0, z: 3, r: 0.5 };
const b2 = createBody({ spawn: [0, 0, 0], radius: 0.3, speed: 1.7 });
for (let i = 0; i < 200; i++) stepBody(b2, { ax: 0, ay: 1, camYaw: Math.PI, colliders: [round], floorY: 0, gravity: 9.81 }, DT);
assert.ok(b2.z > 1, 'avanza hacia el círculo');
assert.ok(b2.z <= 3 - 0.5 - 0.3 + 0.02, 'no atraviesa el círculo: ' + b2.z);

const jumper = createBody({ spawn: [0, 0, 0], canJump: true });
stepBody(jumper, { jump: true, gravity: 9.81, floorY: 0, colliders: [] }, DT);
assert.equal(jumper.air, true);
assert.ok(jumper.y > 0, 'el salto despega');
let peak = jumper.y;
for (let i = 0; i < 180; i++) { stepBody(jumper, { gravity: 9.81, floorY: 0 }, DT); peak = Math.max(peak, jumper.y); }
assert.ok(peak > 0.35 && peak < 0.9, 'altura de salto cómoda: ' + peak);
assert.equal(jumper.air, false);
assert.ok(jumper.y < 0.001, 'vuelve al suelo');

const grounded = createBody({ spawn: [0, 0, 0], canJump: false });
stepBody(grounded, { jump: true, gravity: 9.81, floorY: 0 }, DT);
assert.equal(grounded.air, false, 'sin salto en interiores pequeños');

const wish = moveWish(0, 1, 0);
assert.ok(Math.abs(wish.x) < 1e-6 && wish.z < 0, 'adelante con guiño 0 es −Z');
const pushed = pushCircle(0.9, 0, 0.3, [wall]);
assert.ok(pushed.x <= 0.7 + 0.02, pushed.x);

const player = { x: 0, z: 0, yaw: Math.PI };
const npc = { id: 'wendt', kind: 'talk', name: ['GUENTER WENDT', 'GUENTER WENDT'], x: 0, z: -1, r: 1.6 };
const behind = { id: 'back', kind: 'talk', name: ['X', 'X'], x: 0, z: 1, r: 1.6 };
const side = { id: 'side', kind: 'inspect', label: ['Inspeccionar la válvula', 'Inspect the valve'], x: -1.2, z: -0.2, r: 2 };
const picked = pickInteractable(player, [side, behind, npc]);
assert.equal(picked.id, 'wendt');
assert.equal(pickInteractable(player, [behind]), null, 'fuera del cono frontal');
assert.equal(pickInteractable({ x: 0, z: 0, yaw: Math.PI }, [{ ...npc, z: -4, r: 1.5 }]), null, 'demasiado lejos');
assert.match(interactPrompt(npc, 0), /^E · Hablar/);
assert.match(interactPrompt(side, 0), /E · Inspeccionar/);

const dialogs = {
  'wendt-1': [
    { who: 'wendt', text: ['¿Broma o trabajo?', 'Joke or work?'] },
    { choice: [
      { id: 'joke', label: ['Bromear', 'Joke'], trust: 8, next: 'wendt-joke' },
      { id: 'thanks', label: ['Agradecer', 'Thanks'], trust: -4, next: null },
    ], decision: 'demo-wendt' },
  ],
  'wendt-joke': [{ who: 'wendt', text: ['Toma la media luna.', 'Take the crescent.'] }],
};
const st = createDialog(dialogs, 'wendt-1');
assert.equal(advanceDialog(st).done, false);
assert.ok(currentBeat(st).choice);
const refused = advanceDialog(st, 'nope');
assert.equal(refused.needChoice, true);
const chosen = advanceDialog(st, 'joke');
assert.equal(chosen.effects[0].type, 'record');
assert.equal(chosen.effects[0].trust, 8);
assert.equal(chosen.effects[0].opt, 'joke');
assert.equal(currentBeat(st).text[0], 'Toma la media luna.');
const bare = createDialog({ a: [{ choice: [{ id: 'joke', trust: 5, next: null }, { id: 'ok', trust: -3 }] }] }, 'a');
const fx = advanceDialog(bare, 'joke');
assert.equal(fx.effects[0].type, 'adjust');
assert.equal(fx.effects[0].trust, 5);
assert.equal(bare.done, true);
assert.deepEqual(choiceEffects(currentBeat(createDialog({ a: [{ choice: [{ id: 'ok', trust: 1 }] }] }, 'a')), { id: 'ok', trust: 1 })[0].trust, 1);
const plan = skipPlan({ dialogs, moments: ['despegue'] });
assert.equal(plan.records[0].id, 'demo-wendt');
assert.equal(plan.records[0].opt, 'thanks', 'sin historic, la ruta de salto usa la última opción');
assert.deepEqual(plan.moments, ['despegue']);

const panel = inspectPanel({
  title: ['Válvula de reposición de LH2', 'LH2 valve'],
  text: ['Una válvula de la segunda etapa.', 'A second-stage valve.'],
  why: ['Si pierde, el cohete no despega lleno.', 'A leak means a short tank.'],
  fact: ['El LH2 está a −253 °C.', 'LH2 sits at −253 °C.'],
  src: 'Apollo Flight Journal · NASA',
  card: 'propelente-criogenico',
}, 0);
assert.equal(panel.title.includes('Válvula'), true);
assert.ok(panel.what && panel.why && panel.fact && panel.src);
assert.equal(panel.card, 'propelente-criogenico');

const goals = createObjectives([
  { id: 'talk:wendt', text: ['Habla con Guenter Wendt', 'Talk to Guenter Wendt'], hidden: false },
  { id: 'obj:valve', text: ['Encuentra la válvula que silba', 'Find the hissing valve'], hidden: true },
]);
assert.equal(objectiveLines(goals, 0)[1].text, '???');
assert.deepEqual(revealNearby(goals, { x: 0, z: 0 }, [{ x: 3, z: 0, r: 1.2, reveals: ['obj:valve'] }]), []);
assert.equal(objectiveLines(goals, 0)[1].text, '???', 'lejos sigue oculto');
assert.deepEqual(revealNearby(goals, { x: 2.2, z: 0 }, [{ x: 2.4, z: 0, r: 1.2, reveals: ['obj:valve'] }]), ['obj:valve']);
assert.match(objectiveLines(goals, 0)[1].text, /válvula/);
assert.equal(completeObjective(goals, 'obj:valve'), true);
assert.equal(objectiveLines(goals, 0).some((l) => l.id === 'obj:valve'), false, 'el cumplido deja sitio al siguiente');
assert.equal(objectiveLines(goals, 0)[0].id, 'talk:wendt');
assert.equal(completeObjective(goals, 'obj:valve'), false);

const flo = createBody({ spawn: [0, 1.4, 0], canJump: false });
for (let i = 0; i < 50; i++) stepBody(flo, { gravity: 0, lift: 0.8, floorY: 0 }, DT);
assert.ok(flo.y > 1.55, 'sin gravedad, Q/E lo sube: ' + flo.y);
assert.equal(flo.air, true);

const hold0 = stepHold(0, true, 1, 3);
assert.equal(hold0.done, false);
const hold1 = stepHold(hold0.p, true, 2, 3);
assert.equal(hold1.done, true);
assert.equal(stepHold(1, false, 1, 3).p < 1, true);
assert.deepEqual(nextHose('', 'red'), { state: '', done: false, mistake: true });
assert.equal(nextHose('', 'blue').state, 'blue');
assert.equal(nextHose('blue', 'red').done, true);
assert.equal(markCheck(2, 3).done, true);
assert.equal(ready(new Set(['talk:tech']), 'talk:tech'), true);
assert.equal(ready(new Set(), ['talk:tech', 'obj:valve']), false);

const cam = createExploreCamera({ yaw: 0.4, pitch: 0.3, dist: 2.6 });
assert.equal(lookExplore(cam, 30, 0), true);
assert.notEqual(cam.orbit.yaw, 0.4);
cam.dialogWant = 1;
for (let i = 0; i < 12; i++) stepExploreCamera(cam, 0.05);
assert.ok(Math.abs(cam.dialog - 1) < 1e-6, 'el plano de diálogo llega en 0,6 s');
assert.equal(lookExplore(cam, 10, 0), false, 'en diálogo el ratón no gira');

const mate = createCompanion({ at: [0, 0, 5], follow: 1.5 });
const hero = { x: 0, y: 0, z: 0, yaw: 0, speed: 1.6 };
for (let i = 0; i < 240; i++) stepCompanion(mate, hero, DT);
const gap = Math.hypot(mate.x - hero.x, mate.z - hero.z);
assert.ok(Math.abs(gap - 1.5) < 0.08, 'sigue a 1,5 m: ' + gap);

console.log('PASS explore: paredes, salto, diálogo, inspección, objetivo oculto, cámara');
