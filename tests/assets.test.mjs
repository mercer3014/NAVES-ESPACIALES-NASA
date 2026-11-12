// Read-only contracts for artist exports copied verbatim into public/models.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const exportHashes = {"public/models/astronaut-a7l.glb": "408318534ebfbfb54bc61a66c7c261a8feff8e62d894c08d207788af2356c1db", "public/models/easep-props.glb": "6f2e942e164f73845411b84ffdaf3d451f689dbc56cf5c82aa637b16c47dfb11"};
import assert from 'node:assert/strict';
const read = name => {
  const assetPath = `public/models/${name}.glb`, a = fs.readFileSync(assetPath);
  assert.equal(createHash('sha256').update(a).digest('hex'), exportHashes[assetPath], `${name}: verified artist export SHA256`);
  assert.equal(a.readUInt32LE(0), 0x46546c67); assert.equal(a.readUInt32LE(4), 2);
  return JSON.parse(a.toString('utf8', 20, 20 + a.readUInt32LE(12)).trim());
};
const a = read('astronaut-a7l'), names = new Set(a.nodes.map(n => n.name));
for (const n of ['Astronaut_LOD0', 'Astronaut_LOD1', 'CommanderStripes', 'hand-r', 'hand-l', 'camera-head', 'flag-patch']) assert(names.has(n), n);
const clips = ['idle', 'walk', 'bunny-hop', 'climb-ladder', 'first-step', 'kneel-pick-sample', 'plant-flag', 'salute', 'wave', 'fall-and-get-up', 'point'];
assert.deepEqual(a.animations.map(a => a.name).sort(), clips.sort());
for (const n of ['GoldVisor', 'ClearVisor', 'SuitPBR', 'FlagPatch']) assert(a.materials.some(m => m.name === n), n);
assert.equal(a.skins[0].joints.length, 34);
console.log('PASS A7L v2: export hash, rig, both LODs, patch/visor, 11 gameplay clips');
const e = read('easep-props'), ns = new Set(e.nodes.map(n => n.name));
for (const n of ['PSEP', 'LRRR', 'SWC', 'lm-plaque', 'Tools', 'tongs', 'tongs-grip', 'geo-hammer', 'drive-tube', 'extension-handle', ...['a', 'b', 'c', 'd'].map(n => 'boot-print-' + n)]) assert(ns.has(n), n);
for (const n of ['psep-deploy', 'swc-unroll', 'swc-rollup', 'tongs-grab']) assert(e.animations.some(a => a.name === n), n);
console.log('PASS EASEP: export hash, instruments/plaque/tools, 4 footprint variants, 4 clips');
