#!/usr/bin/env node
/**
 * Validador de .glb para el modelado de Apolo 11.
 *
 * Uso:
 *   node validar_glb.mjs <carpeta> [--reglas reglas.json] [--json salida.json] [--md salida.md]
 *
 * Imprime una tabla en stdout, escribe un JSON (y Markdown si se pide)
 * con tris, caja en metros (cuantización + transformaciones de nodos),
 * MB, materiales, texturas, huesos, pesos, clips, meshopt y avisos.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, getGLPrimitiveCount } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

const MAX_MB_DEFAULT = 1.5;
const MAX_BONES_DEFAULT = 60;
const WEIGHT_EPS = 1e-3;
const WEIGHT_NZ = 1e-6;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HIPS_CANONICAL = 'mixamorighips';

const HELP = `Validador de .glb — Apolo 11

Uso:
  node validar_glb.mjs <carpeta> [--reglas reglas.json] [--json salida.json] [--md salida.md]

  --reglas   JSON opcional con rangos, nodos, clips y huesos requeridos por archivo
  --json     Ruta del informe JSON (si se omite: <carpeta>/informe-glb.json, o stdout si la carpeta no es escribible)
  --md       Ruta del informe Markdown
  -h, --help Muestra esta ayuda
`;

function parseArgs(argv) {
  const args = { folder: null, reglas: null, json: null, md: null, help: false };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-h' || a === '--help') args.help = true;
    else if (a === '--reglas') args.reglas = rest[++i];
    else if (a === '--json') args.json = rest[++i];
    else if (a === '--md') args.md = rest[++i];
    else if (a.startsWith('--')) throw new Error(`Opción desconocida: ${a}`);
    else if (!args.folder) args.folder = a;
    else throw new Error(`Argumento inesperado: ${a}`);
  }
  return args;
}

function round(n, d = 4) {
  if (!Number.isFinite(n)) return n;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function fmtNum(n, d = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  return Number(n).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });
}

function fmtBox(size) {
  if (!size) return '—';
  return size.map((v) => fmtNum(v, 3)).join(' × ') + ' m';
}

function isKebab(name) {
  return typeof name === 'string' && KEBAB.test(name);
}

function stripColon(name) {
  return String(name || '').replace(/:/g, '');
}

function isHipsBone(name) {
  return stripColon(name).toLowerCase() === HIPS_CANONICAL;
}

function findNamedNode(document, wanted) {
  const want = stripColon(wanted).toLowerCase();
  for (const n of document.getRoot().listNodes()) {
    const name = n.getName() || '';
    if (name === wanted || stripColon(name).toLowerCase() === want) return n;
  }
  return null;
}

/** Altura en metros según reglas.heightFrom (bone:… o nodeY:…), si no, la de la caja. */
function measureHeight(document, fileRules, bbox) {
  const src = fileRules?.heightFrom;
  if (src && src.startsWith('bone:')) {
    const node = findNamedNode(document, src.slice(5));
    if (node) return node.getWorldTranslation()[1];
  }
  if (src && src.startsWith('nodeY:')) {
    const node = findNamedNode(document, src.slice(6));
    if (node) return node.getWorldTranslation()[1];
  }
  if (!src && document.getRoot().listSkins().length) {
    const node = findNamedNode(document, 'mixamorig:HeadTop_End') || findNamedNode(document, 'HeadTop_End');
    if (node) return node.getWorldTranslation()[1];
  }
  return bbox ? bbox.size[1] : null;
}


function isExemptNodeName(name, joints) {
  if (!name) return false;
  if (joints.has(name)) return true;
  if (/^mixamorig:?/i.test(name)) return true;
  return false;
}

function fileKey(filename) {
  return path.basename(filename, path.extname(filename));
}

function matchRules(rules, filename) {
  if (!rules) return null;
  const key = fileKey(filename);
  const files = rules.files || rules;
  if (files[key]) return files[key];
  if (files[filename]) return files[filename];
  if (files[`${key}.glb`]) return files[`${key}.glb`];
  return null;
}

function clipDuration(anim) {
  let duration = 0;
  const tmp = [0];
  for (const sampler of anim.listSamplers()) {
    const input = sampler.getInput();
    if (!input || input.getCount() === 0) continue;
    // getMax exige un array destino; si el accessor no tiene max, se recorre la lista.
    try {
      tmp[0] = 0;
      input.getMax(tmp);
      if (Number.isFinite(tmp[0])) {
        duration = Math.max(duration, tmp[0]);
        continue;
      }
    } catch {
      // seguir con el array
    }
    const arr = input.getArray();
    if (!arr || arr.length === 0) continue;
    let last = Number(arr[arr.length - 1]);
    for (let i = 0; i < arr.length; i++) {
      const v = Number(arr[i]);
      if (v > last) last = v;
    }
    if (Number.isFinite(last)) duration = Math.max(duration, last);
  }
  return duration;
}

function analyzeWeights(document) {
  let verticesOverFourWeights = 0;
  let verticesUnnormalizedWeights = 0;
  let skinnedVertices = 0;
  let maxInfluences = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const w0 = prim.getAttribute('WEIGHTS_0');
      if (!w0) continue;
      const w1 = prim.getAttribute('WEIGHTS_1');
      const n = w0.getCount();
      const el0 = [0, 0, 0, 0];
      const el1 = [0, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        skinnedVertices++;
        w0.getElement(i, el0);
        let nz = 0;
        let sum = 0;
        for (const w of el0) {
          sum += w;
          if (Math.abs(w) > WEIGHT_NZ) nz++;
        }
        if (w1) {
          w1.getElement(i, el1);
          for (const w of el1) {
            sum += w;
            if (Math.abs(w) > WEIGHT_NZ) nz++;
          }
        }
        if (nz > maxInfluences) maxInfluences = nz;
        if (nz > 4) verticesOverFourWeights++;
        if (sum > WEIGHT_NZ && Math.abs(sum - 1) > WEIGHT_EPS) {
          verticesUnnormalizedWeights++;
        }
      }
    }
  }
  return { verticesOverFourWeights, verticesUnnormalizedWeights, skinnedVertices, maxInfluences };
}

function checkSizeRange(bbox, fileRules, warnings, heightMeasured = null) {
  if (!fileRules || !bbox) return;
  const [sx, sy, sz] = bbox.size;
  const sizeSpec = fileRules.bboxSize || {};
  for (const axis of ['x', 'y', 'z']) {
    const range = sizeSpec[axis];
    if (!range || range.length < 2) continue;
    const value = axis === 'x' ? sx : axis === 'y' ? sy : sz;
    if (value < range[0] || value > range[1]) {
      warnings.push({
        code: 'size-out-of-range',
        message: `Eje ${axis.toUpperCase()} = ${fmtNum(value, 3)} m, esperado ${range[0]}–${range[1]} m`,
      });
    }
  }
  if (fileRules.heightMeters) {
    const [lo, hi] = fileRules.heightMeters;
    const useRig = heightMeasured != null && Number.isFinite(heightMeasured);
    const value = useRig ? heightMeasured : sy;
    const label = useRig ? (fileRules.heightFrom || 'altura de rig/nodo') : 'Altura de caja Y';
    if (value < lo || value > hi) {
      warnings.push({
        code: 'size-out-of-range',
        message: `${label} = ${fmtNum(value, 3)} m, esperado ${lo}–${hi} m`,
      });
    }
  }
  if (fileRules.footprint) {
    const width = fileRules.footprint.width;
    const depth = fileRules.footprint.depth;
    const tol = fileRules.footprint.tolerance ?? Math.max(width, depth) * 0.1;
    const expected = [width, depth].sort((a, b) => a - b);
    const actual = [sx, sz].sort((a, b) => a - b);
    const ok =
      Math.abs(actual[0] - expected[0]) <= tol && Math.abs(actual[1] - expected[1]) <= tol;
    if (!ok) {
      warnings.push({
        code: 'size-out-of-range',
        message: `Huella XZ = ${fmtNum(sx, 3)} × ${fmtNum(sz, 3)} m, esperado ~${width} × ${depth} m (±${fmtNum(tol, 2)} m)`,
      });
    }
  }
}

async function analyzeDocument(document, { bytes, filename, fileRules, defaults }) {
  const root = document.getRoot();
  const used = root.listExtensionsUsed().map((e) => e.extensionName);
  const meshopt = used.includes('EXT_meshopt_compression');

  await document.transform(dequantize());

  const scenes = root.listScenes();
  let bbox = null;
  if (scenes.length > 0) {
    const { min, max } = getBounds(scenes[0]);
    bbox = {
      min: min.map((v) => round(v, 5)),
      max: max.map((v) => round(v, 5)),
      size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((v) => round(v, 5)),
    };
  }

  let tris = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      tris += getGLPrimitiveCount(prim);
    }
  }

  const materials = root.listMaterials().map((m) => ({
    name: m.getName() || '(sin-nombre)',
  }));

  const textures = root.listTextures().map((t) => {
    const size = t.getSize();
    return {
      name: t.getName() || path.basename(t.getURI() || '') || '(sin-nombre)',
      mime: t.getMimeType() || '',
      width: size ? size[0] : null,
      height: size ? size[1] : null,
    };
  });

  const skins = root.listSkins().map((s) => ({
    name: s.getName() || '(sin-nombre)',
    bones: s.listJoints().length,
    joints: s.listJoints().map((j) => j.getName() || '(sin-nombre)'),
  }));

  const jointNames = new Set(skins.flatMap((s) => s.joints));
  const weights = analyzeWeights(document);

  const clips = root.listAnimations().map((a) => ({
    name: a.getName() || '(sin-nombre)',
    duration: round(clipDuration(a), 3),
  }));

  const nodes = root.listNodes().map((n) => n.getName() || '(sin-nombre)');

  const mb = bytes / (1024 * 1024);
  const maxMB = defaults.maxMB ?? MAX_MB_DEFAULT;
  const maxBones = defaults.maxBones ?? MAX_BONES_DEFAULT;

  const warnings = [];
  const base = fileKey(filename);
  if (!isKebab(base)) {
    warnings.push({
      code: 'not-kebab-case',
      message: `Nombre de archivo no es kebab-case: ${filename}`,
    });
  }

  const seenNodeWarn = new Set();
  for (const name of nodes) {
    if (name === '(sin-nombre)') {
      if (!seenNodeWarn.has(name)) {
        warnings.push({ code: 'not-kebab-case', message: 'Hay nodos sin nombre' });
        seenNodeWarn.add(name);
      }
      continue;
    }
    if (isExemptNodeName(name, jointNames)) continue;
    if (!isKebab(name) && !seenNodeWarn.has(name)) {
      warnings.push({
        code: 'not-kebab-case',
        message: `Nodo no es kebab-case: ${name}`,
      });
      seenNodeWarn.add(name);
    }
  }

  for (const clip of clips) {
    if (clip.name === '(sin-nombre)' || !isKebab(clip.name)) {
      warnings.push({
        code: 'not-kebab-case',
        message: `Clip no es kebab-case: ${clip.name}`,
      });
    }
  }

  if (mb > maxMB) {
    warnings.push({
      code: 'over-1.5mb',
      message: `${fmtNum(mb, 3)} MB supera el límite de ${maxMB} MB`,
    });
  }

  for (const skin of skins) {
    if (skin.bones > maxBones) {
      warnings.push({
        code: 'over-60-bones',
        message: `Skin «${skin.name}» tiene ${skin.bones} huesos (máximo ${maxBones})`,
      });
    }
  }

  if (weights.verticesOverFourWeights > 0) {
    warnings.push({
      code: 'over-four-weights',
      message: `${weights.verticesOverFourWeights} vértice(s) con más de 4 pesos`,
    });
  }
  if (weights.verticesUnnormalizedWeights > 0) {
    warnings.push({
      code: 'unnormalized-weights',
      message: `${weights.verticesUnnormalizedWeights} vértice(s) con pesos no normalizados`,
    });
  }

  const heightMeasured = measureHeight(document, fileRules, bbox);
  checkSizeRange(bbox, fileRules, warnings, heightMeasured);

  if (fileRules?.requiredNodes) {
    const set = new Set(nodes);
    for (const required of fileRules.requiredNodes) {
      if (!set.has(required)) {
        warnings.push({
          code: 'missing-node',
          message: `Falta el nodo requerido «${required}»`,
        });
      }
    }
  }

  if (fileRules?.maxTris && tris > fileRules.maxTris) {
    warnings.push({ code: 'over-tris', message: `${tris} triángulos supera el máximo de ${fileRules.maxTris}` });
  }

  if (fileRules?.requiredClips) {
    const set = new Set(clips.map((c) => c.name));
    for (const required of fileRules.requiredClips) {
      if (!set.has(required)) {
        warnings.push({
          code: 'missing-clip',
          message: `Falta el clip requerido «${required}»`,
        });
      }
    }
  }

  if (fileRules?.requiredBones) {
    const present = skins.flatMap((s) => s.joints);
    for (const required of fileRules.requiredBones) {
      const ok = present.some((name) => {
        if (name === required) return true;
        if (stripColon(name) === stripColon(required)) return true;
        if (isHipsBone(required) && isHipsBone(name)) return true;
        return false;
      });
      if (!ok) {
        warnings.push({
          code: 'missing-bone',
          message: `Falta el hueso requerido «${required}» (se acepta la variante sin ':')`,
        });
      }
    }
  }

  return {
    file: filename,
    mb: round(mb, 4),
    bytes,
    tris,
    bbox,
    heightMeasured: heightMeasured != null && Number.isFinite(heightMeasured) ? round(heightMeasured, 4) : null,
    materials,
    textures,
    skins: skins.map(({ name, bones }) => ({ name, bones })),
    bonesMax: skins.reduce((m, s) => Math.max(m, s.bones), 0),
    verticesOverFourWeights: weights.verticesOverFourWeights,
    verticesUnnormalizedWeights: weights.verticesUnnormalizedWeights,
    clips,
    meshopt,
    nodes,
    extensions: used,
    warnings,
  };
}

async function createIO() {
  await MeshoptDecoder.ready;
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
}

export async function validateFolder(folder, { rules = null, onProgress = null } = {}) {
  const abs = path.resolve(folder);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.glb'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  const defaults = {
    maxMB: rules?.defaults?.maxMB ?? MAX_MB_DEFAULT,
    maxBones: rules?.defaults?.maxBones ?? MAX_BONES_DEFAULT,
  };

  const io = await createIO();
  const models = [];
  for (const name of files) {
    const full = path.join(abs, name);
    const stat = await fs.stat(full);
    try {
      const document = await io.read(full);
      const fileRules = matchRules(rules, name);
      const report = await analyzeDocument(document, {
        bytes: stat.size,
        filename: name,
        fileRules,
        defaults,
      });
      report.path = full;
      models.push(report);
    } catch (err) {
      models.push({
        file: name,
        path: full,
        bytes: stat.size,
        mb: round(stat.size / (1024 * 1024), 4),
        error: err?.message || String(err),
        warnings: [{ code: 'read-error', message: err?.message || String(err) }],
      });
    }
    if (onProgress) onProgress(name, models[models.length - 1]);
  }

  return {
    generatedAt: new Date().toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      dateStyle: 'full',
      timeStyle: 'medium',
    }),
    timeZone: 'America/La_Paz',
    folder: abs,
    rules: rules?.name || null,
    count: models.length,
    models,
  };
}

function pad(str, n, right = false) {
  const s = String(str);
  if (s.length >= n) return s;
  const sp = ' '.repeat(n - s.length);
  return right ? s + sp : sp + s;
}

export function formatTable(report) {
  const rows = report.models.map((m) => {
    if (m.error) {
      return {
        file: m.file,
        tris: 'ERROR',
        box: m.error.slice(0, 40),
        mb: fmtNum(m.mb, 3),
        mats: '—',
        tex: '—',
        bones: '—',
        w4: '—',
        wn: '—',
        clips: '—',
        meshopt: '—',
        avisos: 1,
      };
    }
    const texs = m.textures || [];
    let tex = '—';
    if (texs.length) {
      let maxA = 0;
      let maxLabel = '';
      for (const t of texs) {
        const a = (t.width || 0) * (t.height || 0);
        if (a >= maxA && t.width && t.height) {
          maxA = a;
          maxLabel = `${t.width}×${t.height}`;
        }
      }
      tex = maxLabel ? `${texs.length} · máx ${maxLabel}` : String(texs.length);
    }
    return {
      file: m.file,
      tris: fmtNum(m.tris, 0),
      box: fmtBox(m.bbox?.size),
      mb: fmtNum(m.mb, 3),
      mats: String((m.materials || []).length),
      tex: tex || '—',
      bones: m.skins && m.skins.length ? m.skins.map((s) => s.bones).join('+') : '—',
      w4: String(m.verticesOverFourWeights ?? 0),
      wn: String(m.verticesUnnormalizedWeights ?? 0),
      clips: m.clips && m.clips.length ? String(m.clips.length) : '—',
      meshopt: m.meshopt ? 'sí' : 'no',
      avisos: (m.warnings || []).length,
    };
  });

  const cols = [
    ['Archivo', 'file', true],
    ['Tris', 'tris', false],
    ['Caja (m)', 'box', true],
    ['MB', 'mb', false],
    ['Mats', 'mats', false],
    ['Texturas', 'tex', true],
    ['Huesos', 'bones', false],
    ['>4p', 'w4', false],
    ['!norm', 'wn', false],
    ['Clips', 'clips', false],
    ['Meshopt', 'meshopt', false],
    ['Avisos', 'avisos', false],
  ];
  const widths = cols.map(([title, key]) =>
    Math.max(title.length, ...rows.map((r) => String(r[key]).length)),
  );

  const line = (cells) =>
    cells.map((c, i) => pad(c, widths[i], cols[i][2])).join('  ');
  const sep = widths.map((w) => '─'.repeat(w)).join('──');
  const out = [
    line(cols.map((c) => c[0])),
    sep,
    ...rows.map((r) => line(cols.map((c) => r[c[1]]))),
    sep,
    `${report.count} archivo(s) .glb en ${report.folder}`,
  ];
  return out.join('\n');
}

export function formatMarkdown(report) {
  const lines = [];
  lines.push('# Informe de validación de modelos glb');
  lines.push('');
  lines.push(`- Generado: ${report.generatedAt} (${report.timeZone})`);
  lines.push(`- Carpeta: \`${report.folder}\``);
  lines.push(`- Archivos: ${report.count}`);
  if (report.rules) lines.push(`- Reglas: ${report.rules}`);
  lines.push('');

  const ok = report.models.filter((m) => !m.error && !(m.warnings || []).length).length;
  const withWarn = report.models.filter((m) => !m.error && (m.warnings || []).length).length;
  const errs = report.models.filter((m) => m.error).length;
  const meshopt = report.models.filter((m) => m.meshopt).length;
  const oversize = report.models.filter((m) =>
    (m.warnings || []).some((w) => w.code === 'over-1.5mb'),
  ).length;
  lines.push('## Resumen');
  lines.push('');
  lines.push(`| Métrica | Valor |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| Sin avisos | ${ok} |`);
  lines.push(`| Con avisos | ${withWarn} |`);
  lines.push(`| Errores de lectura | ${errs} |`);
  lines.push(`| Con meshopt | ${meshopt} / ${report.count} |`);
  lines.push(`| Superan 1,5 MB | ${oversize} |`);
  lines.push('');

  lines.push('## Tabla');
  lines.push('');
  lines.push(
    '| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |',
  );
  lines.push('| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |');
  for (const m of report.models) {
    if (m.error) {
      lines.push(
        `| \`${m.file}\` | — | ERROR | ${fmtNum(m.mb, 3)} | — | — | — | — | — | — | — | ${m.error.replace(/\|/g, '/')} |`,
      );
      continue;
    }
    const tex = (m.textures || [])
      .map((t) => (t.width && t.height ? `${t.width}×${t.height}` : t.name))
      .join(', ') || '—';
    const bones = m.skins && m.skins.length ? m.skins.map((s) => s.bones).join('+') : '—';
    const clips = m.clips && m.clips.length
      ? m.clips.map((c) => `${c.name} (${fmtNum(c.duration, 2)} s)`).join(', ')
      : '—';
    const warn = (m.warnings || []).length;
    lines.push(
      `| \`${m.file}\` | ${fmtNum(m.tris, 0)} | ${fmtBox(m.bbox?.size)} | ${fmtNum(m.mb, 3)} | ${(m.materials || []).length} | ${tex} | ${bones} | ${m.verticesOverFourWeights ?? 0} | ${m.verticesUnnormalizedWeights ?? 0} | ${clips} | ${m.meshopt ? 'sí' : 'no'} | ${warn} |`,
    );
  }
  lines.push('');

  lines.push('## Detalle por archivo');
  lines.push('');
  for (const m of report.models) {
    lines.push(`### ${m.file}`);
    lines.push('');
    if (m.error) {
      lines.push(`Error al leer: ${m.error}`);
      lines.push('');
      continue;
    }
    lines.push(`- Peso: ${fmtNum(m.mb, 3)} MB (${m.bytes.toLocaleString('es-BO')} bytes)`);
    lines.push(`- Triángulos: ${fmtNum(m.tris, 0)}`);
    if (m.bbox) {
      lines.push(
        `- Caja: min [${m.bbox.min.map((v) => fmtNum(v, 4)).join(', ')}]  max [${m.bbox.max.map((v) => fmtNum(v, 4)).join(', ')}]  tamaño ${fmtBox(m.bbox.size)}`,
      );
    }
    if (m.heightMeasured != null) {
      lines.push(`- Altura medida (rig/nodo, no la caja cuantizada): ${fmtNum(m.heightMeasured, 3)} m`);
    }
    lines.push(`- Compresión meshopt: ${m.meshopt ? 'sí' : 'no'}`);
    if (m.extensions?.length) lines.push(`- Extensiones: ${m.extensions.join(', ')}`);
    if (m.materials?.length) {
      lines.push(`- Materiales (${m.materials.length}): ${m.materials.map((x) => x.name).join(', ')}`);
    } else lines.push('- Materiales: ninguno');
    if (m.textures?.length) {
      lines.push(
        `- Texturas: ${m.textures.map((t) => `${t.name} ${t.mime} ${t.width || '?'}×${t.height || '?'}`).join('; ')}`,
      );
    } else lines.push('- Texturas: ninguna');
    if (m.skins?.length) {
      lines.push(`- Skins: ${m.skins.map((s) => `${s.name} (${s.bones} huesos)`).join(', ')}`);
    }
    lines.push(`- Vértices con más de 4 pesos: ${m.verticesOverFourWeights}`);
    lines.push(`- Vértices con pesos no normalizados: ${m.verticesUnnormalizedWeights}`);
    if (m.clips?.length) {
      lines.push(
        `- Clips: ${m.clips.map((c) => `${c.name} (${fmtNum(c.duration, 3)} s)`).join(', ')}`,
      );
    } else lines.push('- Clips: ninguno');
    lines.push(`- Nodos (${m.nodes.length}): ${m.nodes.join(', ')}`);
    if (m.warnings?.length) {
      lines.push('- Avisos:');
      for (const w of m.warnings) lines.push(`  - \`[${w.code}]\` ${w.message}`);
    } else {
      lines.push('- Avisos: ninguno');
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function loadRules(rulesPath) {
  if (!rulesPath) return null;
  const abs = path.resolve(rulesPath);
  const raw = JSON.parse(await fs.readFile(abs, 'utf8'));
  if (!raw.name) raw.name = path.basename(abs);
  return raw;
}

async function writeOutput(dest, text) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, text, 'utf8');
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (err) {
    console.error(err.message);
    console.error(HELP);
    process.exitCode = 1;
    return;
  }
  if (args.help || !args.folder) {
    console.log(HELP);
    process.exitCode = args.help ? 0 : 1;
    return;
  }

  const rules = await loadRules(args.reglas);
  const report = await validateFolder(args.folder, { rules });
  console.log(formatTable(report));

  const warningCount = report.models.reduce((n, m) => n + (m.warnings || []).length, 0);
  if (warningCount) {
    console.log(`\nAvisos (${warningCount}):`);
    for (const m of report.models) {
      for (const w of m.warnings || []) {
        console.log(`  - ${m.file}: [${w.code}] ${w.message}`);
      }
    }
  }

  const jsonPath = args.json || path.resolve('informe-glb.json');
  await writeOutput(jsonPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nJSON escrito en ${jsonPath}`);

  if (args.md) {
    await writeOutput(args.md, formatMarkdown(report));
    console.log(`Markdown escrito en ${args.md}`);
  }
}

const isDirect = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
