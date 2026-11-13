import assert from 'node:assert/strict';
import { ladderWantsDown } from '../src/game/ladder-input.js';

assert.equal(ladderWantsDown({}), false);
assert.equal(ladderWantsDown({ tapped: true }), true, 'a tap still drops one rung');
assert.equal(ladderWantsDown({ held: true }), true, 'holding the key keeps descending');
assert.equal(ladderWantsDown({ act: true }), true, 'action button, including a hold, descends');
assert.equal(ladderWantsDown({ auto: true }), true);
console.log('PASS ladder hold');
