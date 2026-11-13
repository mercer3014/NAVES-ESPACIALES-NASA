import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveStaticRoot } from '../server/paths.js';

const spaced = pathToFileURL(path.join('/tmp/Cerezo Alex/app/server', 'index.js'));
const root = resolveStaticRoot(spaced, 'dist');
assert.equal(root, path.resolve('/tmp/Cerezo Alex/app/dist'));
assert.equal(root.includes('%20'), false);
assert.equal(root.includes('%2520'), false);

const winLike = new URL('file:///C:/Users/Cerezo%20Alex/app/server/index.js');
const decoded = resolveStaticRoot(winLike, 'dist-expeditions');
assert.equal(decoded.includes('%20'), false, decoded);
assert.equal(decoded.includes('Cerezo Alex'), true, decoded);
assert.equal(decoded.endsWith(`${path.sep}dist-expeditions`) || decoded.endsWith('/dist-expeditions'), true, decoded);

const broken = path.resolve(path.dirname(winLike.pathname), '..', 'dist-expeditions');
assert.equal(broken.includes('%20'), true, 'pathname alone leaves the space encoded');
console.log('PASS static root', { root, decoded });
