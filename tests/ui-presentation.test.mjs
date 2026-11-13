import assert from 'node:assert/strict';
import { BOOT_LINES, bootReadout, cursorMode, normalizeQuality, phaseStamp } from '../src/ui/presentation.js';

assert.equal(cursorMode({ screen: 'start' }), 'menu');
assert.equal(cursorMode({ screen: 'boot' }), 'menu');
assert.equal(cursorMode({ screen: 'missions' }), 'menu');
assert.equal(cursorMode({ screen: 'capcom' }), 'menu');
assert.equal(cursorMode({ screen: '' }), 'menu');
assert.equal(cursorMode({ screen: 'phase-prep' }), 'play');
assert.equal(cursorMode({ screen: 'phase-descent' }), 'play');
assert.equal(cursorMode({ screen: 'phase-eva' }), 'play');
assert.equal(cursorMode({ screen: 'phase-launch', paused: true }), 'menu', 'pause is a menu, even over a phase');

assert.equal(normalizeQuality('auto'), 'auto');
assert.equal(normalizeQuality('low'), 'low');
assert.equal(normalizeQuality('high'), 'high');
assert.equal(normalizeQuality('HIGH'), 'auto');
assert.equal(normalizeQuality(''), 'auto');
assert.equal(normalizeQuality(undefined), 'auto');

assert.deepEqual(bootReadout(0, 6), { pct: 0, line: BOOT_LINES[0] });
assert.equal(bootReadout(3, 6).pct, 50);
assert.equal(bootReadout(3, 6).line, BOOT_LINES[2]);
assert.deepEqual(bootReadout(9, 6), { pct: 100, line: BOOT_LINES[BOOT_LINES.length - 1] });
assert.equal(bootReadout(0, 0).pct, 0);

assert.deepEqual(phaseStamp('prep'), { n: 1, key: 'ph.prep' });
assert.deepEqual(phaseStamp('launch'), { n: 2, key: 'ph.launch' });
assert.deepEqual(phaseStamp('cruise'), { n: 3, key: 'ph.cruise' });
assert.deepEqual(phaseStamp('descent'), { n: 4, key: 'ph.descent' });
assert.deepEqual(phaseStamp('eva'), { n: 5, key: 'ph.eva' });
assert.deepEqual(phaseStamp('debrief'), { n: 0, key: '' });

console.log('PASS ui presentation');
