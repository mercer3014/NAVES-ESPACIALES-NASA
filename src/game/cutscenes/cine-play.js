// Reproductor de cinemáticas largas (cap. 7 y epílogo). Construye una escena propia, la pone como mundo,
// recorre los planos con barras de cine (mountLetterbox) y devuelve el mundo anterior al terminar o saltar.
// Saltable con Esc / Enter o tocando las barras. Nunca bloquea la misión: si un modelo falla, resuelve sin reproducir.
import { getWorld, setWorld, onTick } from '../../core/engine.js';
import { store, dbg } from '../../core/store.js';
import { music } from '../../core/audio.js';
import { mountLetterbox } from './letterbox.js';
import { createCinePlayback, stepCine, skipCine, sampleCine, lineAt } from './cine-rails.js';
import './cine.css';

// id → [definición (pura), constructor de escena]
const REG = {
  laika: () => Promise.all([import('./cine-laika.js'), import('../../scenes/cine-laika.js')]).then(([d, s]) => [d.LAIKA, s.makeCineLaika]),
  recovery: () => Promise.all([import('./cine-recovery.js'), import('../../scenes/cine-recovery.js')]).then(([d, s]) => [d.RECOVERY, s.makeCineRecovery]),
  lrl: () => Promise.all([import('./cine-lrl.js'), import('../../scenes/cine-lrl.js')]).then(([d, s]) => [(v) => d.lrlDef(v.rickHeard !== false), s.makeCineLrl]),
  parade: () => Promise.all([import('./cine-parade.js'), import('../../scenes/cine-parade.js')]).then(([d, s]) => [d.PARADE, s.makeCineParade]),
};
export const CINE_IDS = Object.keys(REG);
// Orden del guion: 7.1B Laika (TEI) · 7.4 amerizaje + 7.5 MQF · 7.6 LRL · E.1 desfile
export const EPILOGUE_ORDER = ['laika', 'recovery', 'lrl', 'parade'];

let current = null;
const li = () => (store.get('lang') === 'en' ? 1 : 0);

export function stopCine() { current?.skip(); }

// opts: { ctx (contexto de fase, para morir con ella), restore (true: vuelve al mundo anterior), vars (p. ej. { rickHeard: false }) }
export async function playCine(id, opts = {}) {
  const none = { id, played: false, skipped: false, blocksCompletion: false };
  if (!REG[id]) return none;
  current?.skip();
  let def, build, W;
  try { [def, build] = await REG[id](); if (typeof def === 'function') def = def(opts.vars || {}); W = await build(opts.vars || {}); } catch (e) { console.error('[cine]', id, e); return none; }
  if (opts.ctx?.dead) { W.dispose?.(); return none; }
  const prev = getWorld();
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rate = reduced ? Math.max(1, def.duration / 8) : 1; // con movimiento reducido, todo dura ~8 s
  const pb = createCinePlayback(def);
  const L = li();
  const cam = W.camera;
  const sub = document.createElement('div'); sub.className = 'plb-cine-sub';
  const cap = document.createElement('div'); cap.className = 'plb-cine-cap';
  const fade = document.createElement('div'); fade.className = 'plb-cine-fade';
  document.body.append(fade, sub, cap);
  if (def.music) music(def.music, { vol: 0.45 });
  let stopped = false, resolve, lastLine = null, lastShot = -1, off = () => {}, hide = () => {};
  const done = new Promise((r) => { resolve = r; });
  const tmp = { x: 0, y: 0, z: 0 };
  const anchorPos = (name) => {
    const a = name && W.anchors?.[name];
    if (!a) return { x: 0, y: 0, z: 0 };
    if (a.isObject3D) { a.updateWorldMatrix(true, false); tmp.x = a.matrixWorld.elements[12]; tmp.y = a.matrixWorld.elements[13]; tmp.z = a.matrixWorld.elements[14]; return tmp; }
    return a;
  };
  const place = () => {
    try { W.at?.(pb.t); } catch (e) { console.error(e); } // la escena se pone en el instante pb.t (determinista: el salto/seek funciona igual)
    const s = sampleCine(def, pb);
    const a = anchorPos(s.shot.anchor);
    cam.up.set(0, 1, 0);
    cam.position.set(a.x + s.pos[0], a.y + s.pos[1], a.z + s.pos[2]);
    cam.lookAt(a.x + s.look[0], a.y + s.look[1], a.z + s.look[2]);
    if (Math.abs(cam.fov - s.fov) > 0.05) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
    // fundido corto entre planos
    const into = pb.shotT, left = s.shot.duration - pb.shotT;
    fade.style.opacity = String(Math.max(0, 1 - Math.min(into, left) / 0.35) * (s.shot.fade === false ? 0 : 1));
    if (s.index !== lastShot) { lastShot = s.index; cap.textContent = s.shot.caption ? s.shot.caption[L] : ''; }
    const l = lineAt(def, pb);
    if (l !== lastLine) {
      lastLine = l;
      sub.innerHTML = '';
      if (l) { if (l.who) { const b = document.createElement('b'); b.textContent = l.who; sub.append(b); } sub.append(document.createTextNode(l.text[L])); }
    }
  };
  const self = {
    id, pb, world: W,
    seek(t) { const due = stepCine(def, pb, Math.max(0, t - pb.t)); due.forEach((a) => W.act?.(a, true)); W.update?.(0, 0); place(); }, // solo QA
    stop() {
      if (stopped) return; stopped = true;
      off(); hide(); sub.remove(); cap.remove(); fade.remove();
      if (opts.restore !== false && prev && getWorld() === W) setWorld(prev);
      try { W.dispose?.(); } catch (e) { console.error(e); }
      if (current === self) current = null;
      resolve({ id, played: true, skipped: pb.skipped, blocksCompletion: false });
    },
    skip() { skipCine(def, pb); self.stop(); },
  };
  hide = mountLetterbox({ id: 'cine-' + id, title: def.title[L], sub: def.sub[L], skipLabel: L ? 'Skip · Esc' : 'Saltar · Esc', onSkip: () => self.skip() });
  const baseUpdate = W.update?.bind(W);
  W.update = (dt, t) => { baseUpdate?.(dt, t); if (!stopped) place(); };
  setWorld(W);
  place();
  off = onTick((dt) => {
    if (stopped) return;
    if (opts.ctx?.dead || getWorld() !== W) { self.skip(); return; }
    const due = stepCine(def, pb, dt / rate);
    for (const a of due) { try { W.act?.(a); } catch (e) { console.error(e); } }
    if (pb.done) self.stop();
  });
  opts.ctx?.onCleanup?.(() => self.skip());
  current = self;
  dbg('cine', self);
  return done;
}

// Encadena varias cinemáticas (por defecto todo el cap. 7 + desfile). Un salto cierra solo la actual
// (skipAll: true para que cierre toda la secuencia). Al final vuelve al mundo que había (o a restoreTo; null = no tocar).
export async function playCineSequence(ids = EPILOGUE_ORDER, opts = {}) {
  const out = [], back = opts.restoreTo === undefined ? getWorld() : opts.restoreTo;
  for (const id of ids) {
    if (opts.ctx?.dead) break;
    const r = await playCine(id, { ...opts, restore: false });
    out.push(r);
    if (r.skipped && opts.skipAll) break;
  }
  if (back) setWorld(back);
  return out;
}

addEventListener('keydown', (e) => {
  if (!current || e.repeat) return;
  if (e.code !== 'Escape' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
  e.preventDefault(); e.stopPropagation();
  current.skip();
}, true);
