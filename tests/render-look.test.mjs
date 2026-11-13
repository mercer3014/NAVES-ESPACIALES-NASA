import assert from 'node:assert/strict';
import * as THREE from 'three';
import { STAR_POINT, starPointScale, earthshine, regolithLook, plumeBloom, machDisk } from '../src/render/grade.js';
import { patchDunes, duneCacheKey } from '../src/render/terrain.js';

assert.equal(starPointScale(0), STAR_POINT.base);
assert.ok(starPointScale(1) > starPointScale(0.2));
assert.equal(starPointScale(4), starPointScale(1), 'seeds outside 0..1 clamp');

const es = earthshine();
assert.ok(es.intensity > 0 && es.intensity < 0.6, 'earthshine fills shadows without washing the sun');
assert.equal(es.color.length, 3);
assert.ok(es.color[2] > es.color[0], 'earthshine is cooler than sunlight');

const reg = regolithLook();
for (const k of ['macroAmp', 'grainAmp', 'surge', 'normalGain']) assert.ok(reg[k] > 0 && reg[k] < 1, k);

assert.equal(plumeBloom(false), null);
const bloom = plumeBloom(true);
assert.ok(bloom.strength > 0 && bloom.strength < 1.5);
assert.ok(bloom.threshold > 0.4 && bloom.threshold < bloom.strength + 1);

assert.equal(machDisk(0, 0), 0);
assert.equal(machDisk(0.22, 1), 0, 'vacuum plume has no mach disks');
assert.ok(machDisk(0.22, 0) > 0.05);
assert.ok(machDisk(0.22, 0) > machDisk(0.9, 0), 'disks fade toward the plume tip');
assert.equal(machDisk(Number.NaN, 0), 0);

const sand = new THREE.MeshStandardMaterial({ color: 0x885533 });
patchDunes(sand);
assert.match(duneCacheKey(sand), /dunes-v1/);
assert.equal(typeof sand.onBeforeCompile, 'function');
const shader = { vertexShader: '#include <common>\n#include <worldpos_vertex>\n', fragmentShader: '#include <common>\n#include <normal_fragment_maps>\n' };
sand.onBeforeCompile(shader);
assert.match(shader.vertexShader, /vDuneW/);
assert.match(shader.fragmentShader, /dF/);

console.log('PASS render look');
