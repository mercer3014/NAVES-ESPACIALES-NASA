// Rieles de cámara en espacio local del ancla. Puro: sin DOM ni Three, para poder probar el salto.
// Cada cue es saltable y nunca bloquea el cierre de la misión.

const cue = (id, duration, title, sub, keys, extra = {}) => ({
  id, duration, title, sub, keys,
  skippable: true,
  blocksCompletion: false,
  restore: false,
  ...extra,
});

export const CUES = {
  liftoff: cue('liftoff', 4, ['¡DESPEGUE!', 'LIFTOFF!'], ['Se sueltan los anclajes', 'Hold-down release'], [
    { t: 0, pos: [86, 14, 168], look: [0, 48, 0], fov: 34 },
    { t: 0.42, pos: [128, 36, 210], look: [0, 78, 0], fov: 30 },
    { t: 1, pos: [54, 62, 132], look: [0, 28, 0], fov: 38 },
  ]),
  separation: cue('separation', 3.6, ['SEPARACIÓN', 'STAGING'], ['La primera etapa se aleja', 'The first stage falls away'], [
    { t: 0, pos: [210, 18, 250], look: [0, 8, 0], fov: 40 },
    { t: 0.5, pos: [280, 46, 310], look: [0, -6, 0], fov: 36 },
    { t: 1, pos: [160, 70, 220], look: [0, 24, 0], fov: 42 },
  ]),
  tli: cue('tli', 4, ['INYECCIÓN TRANSLUNAR', 'TRANS-LUNAR INJECTION'], ['Rumbo a la Luna', 'Bound for the Moon'], [
    { t: 0, pos: [28, 7, 22], look: [0, 0, 0], fov: 42 },
    { t: 0.55, pos: [-16, 14, 34], look: [2, 1, 0], fov: 34 },
    { t: 1, pos: [18, 6, 26], look: [0, 0, 0], fov: 38 },
  ]),
  eagle: cue('eagle', 4.5, ['EL EAGLE HA ALUNIZADO', 'THE EAGLE HAS LANDED'], ['Base Tranquilidad', 'Tranquility Base'], [
    { t: 0, pos: [18, 5, 14], look: [0, 2, 0], fov: 42 },
    { t: 0.5, pos: [-10, 9, 22], look: [0, 3, 0], fov: 34 },
    { t: 1, pos: [16, 4, 18], look: [0, 2, 0], fov: 38 },
  ]),
  firststep: cue('firststep', 4, ['EL PRIMER PASO', 'THE FIRST STEP'], ['Un pequeño paso', 'One small step'], [
    { t: 0, pos: [2.2, 1.15, 2.4], look: [0, 0.85, 0.15], fov: 40 },
    { t: 0.6, pos: [0.9, 0.55, 2.6], look: [0, 0.28, 0.35], fov: 32 },
    { t: 1, pos: [2.6, 1.25, 1.5], look: [0, 0.8, 0], fov: 36 },
  ]),
  skycrane: cue('skycrane', 4.5, ['GRÚA CELESTE', 'SKY CRANE'], ['El rover baja por los cables', 'The rover rides the cables down'], [
    { t: 0, pos: [7, 4.5, 8], look: [0, 3, 0], fov: 42 },
    { t: 0.55, pos: [3.5, 7.5, 5.5], look: [0, 5, 0], fov: 34 },
    { t: 1, pos: [8, 3.5, 7], look: [0, 2, 0], fov: 40 },
  ]),
  // La cámara ortográfica se abre desde la nave hasta el disco. restore devuelve el encuadre de juego.
  horizon: cue('horizon', 5, ['EL HORIZONTE', 'THE HORIZON'], ['Ficción: un agujero negro curva la luz', 'Fiction: a black hole bends the light'], [
    { t: 0, pos: [74, 8, 280], look: [70, 0, 0], fov: 50, zoom: 2.5 },
    { t: 0.55, pos: [34, 16, 300], look: [18, 0, 0], fov: 50, zoom: 1.35 },
    { t: 1, pos: [0, 6, 320], look: [0, 0, 0], fov: 50, zoom: 0.82 },
  ], { restore: true }),
};

export const CUE_IDS = Object.keys(CUES);

export function getCue(id) {
  return CUES[id] || null;
}

export function createPlayback(id) {
  const c = getCue(id);
  if (!c) throw new Error('unknown cutscene ' + id);
  return { id, t: 0, duration: c.duration, skipped: false, done: false, blocksCompletion: false };
}

export function stepPlayback(pb, dt) {
  if (pb.done) return pb;
  pb.t += Math.max(0, Number(dt) || 0);
  if (pb.t >= pb.duration) { pb.t = pb.duration; pb.done = true; }
  pb.blocksCompletion = false;
  return pb;
}

// El salto cierra el plano al instante. No espera al final del riel y no impide terminar la misión.
export function skipPlayback(pb) {
  const c = getCue(pb.id);
  if (!c?.skippable) return pb;
  pb.skipped = true;
  pb.done = true;
  pb.blocksCompletion = false;
  return pb;
}

export function missionCanComplete(pb) {
  return pb.blocksCompletion === false;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { return t * t * (3 - 2 * t); }

export function sampleRail(id, u) {
  const keys = getCue(id).keys;
  const x = Math.min(1, Math.max(0, u));
  let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-6, b.t - a.t);
  const t = a === b ? 1 : smooth(Math.min(1, Math.max(0, (x - a.t) / span)));
  const mix = (p, q) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
  return { pos: mix(a.pos, b.pos), look: mix(a.look, b.look), fov: lerp(a.fov, b.fov, t), zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, t) };
}
