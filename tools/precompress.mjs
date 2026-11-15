// Genera .br y .gz junto a los archivos de texto del build (html, js, css, json, svg, vtt) para que el servidor los
// sirva ya comprimidos. Uso: node tools/precompress.mjs <carpeta del build>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(process.argv[2] || 'dist');
const EXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.vtt']);
let n = 0, raw = 0, br = 0;
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, e.name); if (e.isDirectory()) { walk(p); continue; }
  if (!EXT.has(path.extname(p)) || /\.(br|gz)$/.test(p)) continue;
  const buf = fs.readFileSync(p); if (buf.length < 1024) continue;
  const b = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
  const g = zlib.gzipSync(buf, { level: 9 });
  if (b.length < buf.length * 0.95) fs.writeFileSync(p + '.br', b);
  if (g.length < buf.length * 0.95) fs.writeFileSync(p + '.gz', g);
  n++; raw += buf.length; br += Math.min(b.length, buf.length);
} };
walk(root);
console.log(`precompress: ${n} archivos · ${(raw / 1e6).toFixed(2)} MB → ${(br / 1e6).toFixed(2)} MB con Brotli`);
