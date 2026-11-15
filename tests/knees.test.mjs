// Las rodillas de los clips de caminar/correr/saltar se doblan hacia atrás tras fixKnees (antes iban «pata de ave»).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const run = (m) => execFileSync(process.execPath, ['tools/knee-check.mjs', `public/models/${m}.glb`], { env: { ...process.env, FIX: '1' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
for (const m of ['armstrong-civil', 'aldrin-vuelo', 'astronaut-a7l', 'jan', 'civil-base']) {
  const out = run(m);
  assert.ok(!/MAL/.test(out), `${m}: quedan rodillas al revés\n${out}`);
}
assert.match(run('armstrong-civil'), /fixed walk:Left walk:Right/, 'armstrong: walk corregido');
assert.match(run('jan'), /^fixed \n/, 'jan: su caminata ya era correcta y no se toca');
console.log('PASS knees');
