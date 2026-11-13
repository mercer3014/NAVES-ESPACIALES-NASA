import assert from 'node:assert/strict';
import { SKY_CLIP_Z, skyVertexShader } from '../src/scenes/sky-clip.js';

assert.ok(SKY_CLIP_Z > 0 && SKY_CLIP_Z < 1, 'sky clip z must sit inside both GL [-1,1] and D3D [0,1]');
const src = skyVertexShader();
assert.match(src, /gl_Position=vec4\(position\.xy,0\.5,1\.\)/);
assert.match(src, /invProj\*vec4\(position\.xy,1\.,1\.\)/, 'view ray still comes from the unprojection, not from the raster z');
assert.doesNotMatch(src, /gl_Position=vec4\(position\.xy,0(?:\.0*)?\s*,/, 'z = 0 is the D3D near plane');
console.log('PASS sky clip z', SKY_CLIP_Z);
