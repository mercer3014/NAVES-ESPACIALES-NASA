// Cinemáticas largas (capítulo 7 y epílogo): secuencias de planos con riel de cámara, subtítulos y eventos.
// Puro: sin DOM ni Three, para poder probar el salto igual que rails.js. Cada plano usa el mismo formato de llaves que rails.js
// ({ t: 0..1, pos, look, fov }) en el espacio local de un ancla de la escena (anchor: nombre; sin ancla = origen del mundo).

export const shot = (duration, keys, extra = {}) => ({ duration, keys, anchor: null, lines: [], events: [], caption: null, ...extra });

// line(seg, quién, [es, en], duración): subtítulo dentro del plano (segundos desde el inicio del plano)
export const line = (t, who, text, dur = 3.2) => ({ t, who, text, dur });
// ev(seg, acción): llama a world.act(acción) una sola vez al llegar a ese segundo del plano
export const ev = (t, a) => ({ t, a });

export const cine = (id, title, sub, shots, extra = {}) => ({
  id, title, sub, shots,
  duration: shots.reduce((s, x) => s + x.duration, 0),
  skippable: true,
  blocksCompletion: false,
  music: null,
  ...extra,
});

export function createCinePlayback(def) {
  return { id: def.id, t: 0, duration: def.duration, shot: 0, shotT: 0, fired: new Set(), skipped: false, done: false, blocksCompletion: false };
}

// Devuelve los eventos que tocan en este paso (para que el reproductor los dispare).
export function stepCine(def, pb, dt) {
  const due = [];
  if (pb.done) return due;
  pb.t = Math.min(pb.duration, pb.t + Math.max(0, Number(dt) || 0));
  let acc = 0, i = 0;
  while (i < def.shots.length - 1 && pb.t >= acc + def.shots[i].duration) { acc += def.shots[i].duration; i++; }
  // dispara también los eventos de los planos que un dt grande se haya saltado
  for (let k = 0, a = 0; k <= i; a += def.shots[k].duration, k++) {
    for (const e of def.shots[k].events) {
      const key = k + ':' + e.a + ':' + e.t;
      if (!pb.fired.has(key) && pb.t >= a + e.t) { pb.fired.add(key); due.push(e.a); }
    }
  }
  pb.shot = i; pb.shotT = pb.t - acc;
  if (pb.t >= pb.duration) pb.done = true;
  pb.blocksCompletion = false;
  return due;
}

// El salto cierra toda la secuencia al instante y nunca impide seguir con la misión.
export function skipCine(def, pb) {
  if (!def.skippable) return pb;
  pb.skipped = true; pb.done = true; pb.blocksCompletion = false;
  return pb;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { return t * t * (3 - 2 * t); }

export function sampleKeys(keys, u) {
  const x = Math.min(1, Math.max(0, u));
  let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-6, b.t - a.t);
  const t = a === b ? 1 : smooth(Math.min(1, Math.max(0, (x - a.t) / span)));
  const mix = (p, q) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
  return { pos: mix(a.pos, b.pos), look: mix(a.look, b.look), fov: lerp(a.fov, b.fov, t) };
}

export function sampleCine(def, pb) {
  const s = def.shots[pb.shot];
  return { shot: s, index: pb.shot, ...sampleKeys(s.keys, s.duration > 0 ? pb.shotT / s.duration : 1) };
}

// Subtítulo visible en este instante (o null)
export function lineAt(def, pb) {
  const s = def.shots[pb.shot];
  for (const l of s.lines) if (pb.shotT >= l.t && pb.shotT < l.t + l.dur) return l;
  return null;
}
