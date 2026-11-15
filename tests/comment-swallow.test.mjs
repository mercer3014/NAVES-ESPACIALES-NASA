// Detecta código «tragado» por un comentario de fin de línea: `x(); // nota const vis = …;`
// Ya pasó dos veces (cruise.js perdió su `if (ctx.dead) return`; launch.js perdió `const vis` y el cohete se congeló).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src', import.meta.url));
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.js')) files.push(p); } };
walk(root);
const bad = [];
// también una llamada «a.b.c(…);» al final del comentario (eva.js perdió así su ctx.cc.log('e.quote'))
const re = /\/\/[^'"`\n]*\b(?:const|let) [A-Za-z_$][\w$]* = [^;\n]+;|\/\/[^'"`\n]*\bif \(ctx\.dead\) return|[;}]\s*\/\/[^\n]*\s[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+\([^\n]*\)\s*;\s*$/;
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return; // comentario de línea completa: puede citar código
    if (re.test(line)) bad.push(`${f.slice(root.length + 1)}:${i + 1}`);
  });
}
assert.deepEqual(bad, [], 'código dentro de un comentario de fin de línea');
console.log(`PASS comment-swallow: ${files.length} archivos`);
