import assert from 'node:assert/strict';
import fs from 'node:fs';
import { burnPrompt, horizonPrompt, launchPrompt, marsPrompt, objectiveCardHtml, objectiveOpenFromKey, promptVisible, showTouchChrome } from '../src/ui/flight-hud.js';

assert.equal(showTouchChrome(false), false);
assert.equal(showTouchChrome(true), true);
assert.equal(objectiveOpenFromKey(true), false);
assert.equal(objectiveOpenFromKey(false), true);

assert.equal(promptVisible(null, 'Soltar'), false);
assert.equal(promptVisible({ key: 'E' }, ''), false);
assert.equal(promptVisible({ key: 'E' }, 'Soltar paracaídas'), true);

assert.equal(launchPrompt({}), null);
assert.deepEqual(launchPrompt({ waiting: true }), { key: 'ESPACIO', labelKey: 'hud.stage' });
assert.equal(launchPrompt({ waiting: true, blocked: true }), null);
assert.deepEqual(launchPrompt({ les: true }), { key: 'ESPACIO', labelKey: 'hud.les' });
assert.equal(burnPrompt(false), null);
assert.deepEqual(burnPrompt(true), { key: 'ESPACIO', labelKey: 'hud.burn' });

const high = { stage: 'landing', land: { mode: 'chute', alt: 640, vy: -17, x: 0, vx: 0 } };
assert.equal(marsPrompt(high), null, 'parachute prompt waits until it is relevant');
assert.deepEqual(marsPrompt({ stage: 'landing', land: { mode: 'chute', alt: 180, vy: -12, x: 0, vx: 0 } }), { key: 'E', labelKey: 'hud.chute' });
assert.equal(marsPrompt({ stage: 'landing', land: { mode: 'powered', alt: 80, vy: -4, x: 0, vx: 0 } }), null);
assert.deepEqual(marsPrompt({ stage: 'landing', land: { mode: 'powered', alt: 12, vy: -1, x: 2, vx: 0.2 } }), { key: 'E', labelKey: 'hud.crane' });
assert.equal(marsPrompt({ stage: 'gather', collected: [], water: 0, regolith: 0, rover: { x: 0, z: 0 } }), null);
assert.equal(marsPrompt({ stage: 'done' }), null);

const far = { stage: 'intercept', x: 8, y: 0, vx: 0, vy: 1, probe: { x: 0, y: 0, vx: 0, vy: 0 }, assist: false };
assert.equal(horizonPrompt(far), null);
assert.deepEqual(horizonPrompt({ stage: 'intercept', x: 2, y: 0, vx: 0.1, vy: 0, probe: { x: 1.6, y: 0, vx: 0, vy: 0 } }), { key: 'E', labelKey: 'hud.dock' });
assert.equal(horizonPrompt({ stage: 'escape', x: 6, y: 0, vx: 0, vy: 0, probe: { x: 6, y: 0, vx: 0, vy: 0 }, assist: true }), null);
assert.deepEqual(horizonPrompt({ stage: 'escape', x: 11, y: 0, vx: 0, vy: 0, probe: { x: 11, y: 0, vx: 0, vy: 0 }, assist: true }), { key: 'E', labelKey: 'hud.depart' });

const card = objectiveCardHtml({ kicker: 'FASE 02', titleHtml: '<div class="phase-title">Saturno</div>' });
assert.match(card, /data-obj/);
assert.match(card, /data-obj-toggle/);
assert.match(card, /<svg/);
assert.equal(/\p{Extended_Pictographic}/u.test(card), false);

const mars = fs.readFileSync(new URL('../src/game/expeditions/text.js', import.meta.url), 'utf8');
const horizon = fs.readFileSync(new URL('../src/game/expeditions/text-horizon.js', import.meta.url), 'utf8');
const es = (src, key) => {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return src.match(new RegExp(`'${k}':\\s*\\['([^']*)'`))?.[1];
};
assert.equal(es(mars, 'ma.fuel'), 'Combustible');
assert.equal(es(horizon, 'ho.fuel'), 'Combustible');
assert.equal(/Fuel/.test(es(horizon, 'ho.fail.fuel')), false);
assert.equal(/fuel/.test(es(mars, 'ex.horizon.d') || ''), false);

console.log('flight-hud PASS');
