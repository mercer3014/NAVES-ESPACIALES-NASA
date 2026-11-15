// Lista los clips de voz del Apolo 11 que ningún archivo de src/ nombra.
// Cubre el inventario del plan (nasa_real, voz recreada y public/audio/voice).
// Los efectos sueltos de a11/sfx se disparan por a11sfx() con el nombre armado en código.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const voices = [];
for (const dir of ['public/audio/a11/nasa_real', 'public/audio/a11/voz_en_clonada', 'public/audio/voice']) {
  for (const name of readdirSync(join(root, dir))) {
    if (name.endsWith('.mp3')) voices.push(name.slice(0, -4));
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'public') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|css|html|json)$/.test(name)) out.push(readFileSync(p, 'utf8'));
  }
  return out;
}
const blob = walk(join(root, 'src')).join('\n');

const JUSTIFIED = {
  c3_32_armstrong_karen_nueve_en: 'Error histórico: Karen Armstrong habría cumplido diez (nació en abril de 1959). El juego no usa esa frase.',
};

const unused = voices.filter((id) => !blob.includes(id));
console.log(`audio-unused: ${unused.length} sin usar de ${voices.length}`);
for (const id of unused) console.log(`- ${id}${JUSTIFIED[id] ? ' — ' + JUSTIFIED[id] : ''}`);
const bare = unused.filter((id) => !JUSTIFIED[id]);
if (unused.length > 10) {
  console.error('demasiados clips sin usar');
  process.exit(1);
}
if (bare.length) {
  console.error('hay clips sin usar y sin justificación');
  process.exit(1);
}
