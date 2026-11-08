import assert from 'node:assert/strict';
import { shouldPlayIntro } from '../src/ui/intro-policy.js';

assert.equal(shouldPlayIntro({}), true, 'a fresh document load plays the intro');
assert.equal(shouldPlayIntro({ played: false, introSeen: true, sessionSeen: true }), true, 'stored seen markers are not a gate');
assert.equal(shouldPlayIntro({ played: true, introSeen: false }), false, 'already played this document');
assert.equal(shouldPlayIntro({ nointro: true }), false, 'explicit skip stays available for direct entry');
assert.equal(shouldPlayIntro({ reconnect: true }), false, 'room reconnect does not replay the intro');
console.log('PASS intro policy');
