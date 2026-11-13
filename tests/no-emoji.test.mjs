// Fails if a user-facing source still contains an emoji.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const re = /\p{Extended_Pictographic}/gu;
// Legal attribution marks in the credits, not interface emoji.
const allow = new Set(['\u00A9', '\u00AE']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|css|html)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = [path.join(root, 'index.html'), ...walk(path.join(root, 'src'))].filter((f) => fs.existsSync(f));
const hits = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const ch of line.matchAll(re)) {
      if (allow.has(ch[0])) continue;
      hits.push(`${path.relative(root, file)}:${i + 1} ${ch[0]}`);
    }
  });
}
assert.deepEqual(hits, [], `emoji left in UI sources:\n${hits.join('\n')}`);
console.log('no-emoji PASS');
