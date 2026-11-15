import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { VO_MAP } from '../src/audio/a11-voice-map.js';

const files = new Set(Object.values(VO_MAP));
const missing = [...files].filter((f) => !existsSync(new URL(`../public/audio/a11/${f}.mp3`, import.meta.url)));
assert.deepEqual(missing, [], 'voces sin archivo');
assert.ok(Object.keys(VO_MAP).length >= 50, 'tabla de voces incompleta');
console.log(`PASS a11 voice: ${Object.keys(VO_MAP).length} lines → ${files.size} files`);
