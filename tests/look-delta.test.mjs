import assert from 'node:assert/strict';
import { lookDelta } from '../src/core/look-delta.js';

const first = lookDelta({ locked: false, movementX: 0, movementY: 0, clientX: 10, clientY: 20, last: null });
assert.deepEqual(first, { dx: 0, dy: 0, last: { x: 10, y: 20 } });
const moved = lookDelta({ locked: false, movementX: 0, movementY: 0, clientX: 18, clientY: 12, last: first.last });
assert.equal(moved.dx, 8);
assert.equal(moved.dy, -8, 'unlocked look follows the cursor with no button held');
const locked = lookDelta({ locked: true, movementX: 3, movementY: -2, clientX: 400, clientY: 300, last: { x: 1, y: 1 } });
assert.equal(locked.dx, 3);
assert.equal(locked.dy, -2);
assert.equal(locked.last, null, 'pointer lock ignores the frozen client position');
console.log('PASS look delta');
