import assert from 'node:assert/strict';
import { shouldPlayIntro } from '../src/ui/intro-policy.js';

assert.equal(shouldPlayIntro({}), true, 'the first visit plays the intro');
assert.equal(shouldPlayIntro({ seen: true }), false, 'once seen, the game opens on the menu');
assert.equal(shouldPlayIntro({ played: true }), false, 'already played this document');
assert.equal(shouldPlayIntro({ nointro: true }), false, 'explicit skip stays available for direct entry');
assert.equal(shouldPlayIntro({ reconnect: true }), false, 'room reconnect does not replay the intro');
console.log('PASS intro policy');
