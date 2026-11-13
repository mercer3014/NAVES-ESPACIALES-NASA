import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMPOSER_SAMPLES } from '../src/scenes/post-samples.js';

assert.equal(COMPOSER_SAMPLES, 0, 'half-float composer must not request MSAA');
const fx = readFileSync(new URL('../src/scenes/fx.js', import.meta.url), 'utf8');
assert.match(fx, /COMPOSER_SAMPLES/);
assert.doesNotMatch(fx, /\.samples\s*=\s*[1-9]/);
console.log('PASS composer samples', COMPOSER_SAMPLES);
