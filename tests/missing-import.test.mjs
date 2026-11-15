// Las funciones de estado del guion (story/state.js) y de decisiones se usan en muchos archivos. Si alguno las llama sin
// importarlas, el juego lanza ReferenceError en plena escena (pasó con flagOf() en decisions.js: la 1202 se congelaba).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src', import.meta.url));
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.js')) files.push(p); } };
walk(root);
const fnsOf = (rel) => [...readFileSync(join(root, rel), 'utf8').matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g)].map((m) => m[1] || m[2]);
const WATCH = new Map([['game/story/state.js', fnsOf('game/story/state.js')], ['game/story/decisions.js', fnsOf('game/story/decisions.js')]]);
const bad = [];
for (const f of files) {
  const rel = f.slice(root.length + 1).replace(/\\/g, '/');
  const s = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  for (const [owner, names] of WATCH) {
    if (rel === owner) continue;
    for (const name of names) {
      // llamadas, sin contar la definición de un método propio con el mismo nombre (`ask(k, data) {`)
      const calls = s.split('\n').filter((ln) => new RegExp(`(^|[^.\\w$])${name}\\s*\\(`).test(ln) && !new RegExp(`^\\s*(?:async\\s+)?${name}\\s*\\(.*\\)\\s*\\{\\s*$`).test(ln));
      if (!calls.length) continue;
      const ok = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from|\\{[^}]*\\b${name}\\b[^}]*\\}\\s*(?:=|\\)\\s*=>)|(?:function|const|let|var)\\s+${name}\\b`).test(s);
      if (!ok) bad.push(`${rel} usa ${name}() sin importarla de ${owner}`);
    }
  }
}
assert.deepEqual(bad, [], 'funciones del guion usadas sin importar');
console.log(`PASS missing-import: ${files.length} archivos`);
