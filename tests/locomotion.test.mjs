import assert from 'node:assert/strict';
import { locomotionClip } from '../src/game/locomotion.js';

const name = (s) => locomotionClip(s).clip;
assert.equal(name({ speed: 0 }), 'idle');
assert.equal(name({ speed: 0.05 }), 'idle');
assert.equal(name({ speed: 0.4 }), 'walk', 'slow walk stays on the alternating cycle');
assert.equal(name({ speed: 1.2 }), 'walk', 'above the old 1.05 m/s cutoff');
assert.equal(name({ speed: 1.9 }), 'walk', 'full stick must not select the symmetric hop');
assert.equal(name({ speed: 1.4, jump: true }), 'bunny-hop', 'intentional jump');
assert.equal(name({ speed: 0, jump: true }), 'bunny-hop');
const cruise = locomotionClip({ speed: 1.6 });
assert.ok(cruise.timeScale > 1 && cruise.timeScale <= 1.75, cruise.timeScale);
console.log('PASS locomotion: walk at cruise speed, bunny-hop only while jumping');
