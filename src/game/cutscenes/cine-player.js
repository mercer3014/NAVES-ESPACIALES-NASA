// Reproductor de cinemáticas en escena propia (MOCR, casa Armstrong, hotel 1967).
// A diferencia de play.js (un riel sobre la cámara de la fase), aquí se cambia de mundo: se guarda el mundo actual,
// se monta la escena de la cinemática, se recorren sus planos con las barras de letterbox.js y al terminar
// (o al saltar con Esc/Enter o tocando una barra) se devuelve el mundo anterior tal cual.
// No pausa el motor: la fase sigue viva; quien llama decide si congela su simulación mientras tanto.
import { getWorld, setWorld, onTick } from '../../core/engine.js';
import { dbg, store } from '../../core/store.js';
import { sfx } from '../../core/audio.js';
import { voiceLine, stopVoiceLine } from '../../audio/a11-voice.js';
import { mountLetterbox } from './letterbox.js';
import { stopCue } from './play.js';

let current = null;
const langIndex = () => (store.get('lang') === 'en' ? 1 : 0);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const TAG = { real: [' · REAL', ' · REAL'], drama: [' · DRAMATIZADO', ' · DRAMATIZED'] };

// Mismo muestreo que rails.sampleRail, pero sobre las claves de un plano
export function sampleKeys(keys, u) {
  const x = Math.min(1, Math.max(0, u)); let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const t = a === b ? 1 : smooth(Math.min(1, Math.max(0, (x - a.t) / Math.max(1e-6, b.t - a.t))));
  const mix = (p, q) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];
  return { pos: mix(a.pos, b.pos), look: mix(a.look, b.look), fov: lerp(a.fov, b.fov, t) };
}

// Duración total de una cinemática (para tests y para quien quiera reservar tiempo)
export const cineDuration = (def, o = {}) => shotsOf(def, o).reduce((s, sh) => s + sh.d, 0);
function shotsOf(def, o) { return typeof def.shots === 'function' ? def.shots(o) : def.shots; }

let styleOk = false;
function ensureStyle() {
  if (styleOk) return; styleOk = true;
  const s = document.createElement('style');
  s.textContent = 'body[data-cine] .screen,body[data-cine] .pancho,body[data-cine] .phase-stamp,body[data-cine] .radio,body[data-cine] .r-ptt,body[data-cine] #toasts{visibility:hidden!important}'
    + '.plb-cine-fade{position:fixed;inset:0;z-index:71;background:#000;pointer-events:none;opacity:1;transition:opacity .6s ease}'
    + '.plb-cine-fade.off{opacity:0}.plb-letterbox[data-cine] .plb-letterbox-copy small{font-size:1.02em;opacity:.92}';
  document.head.append(s);
}

export function stopCinematic() { current?.stop(true); }
export const cinematicActive = () => !!current;

// def: { id, make(o) → mundo de cine-common, shots | shots(o) } · opts: { ctx, variant, ...lo que use la definición }
export async function runCinematic(def, opts = {}) {
  const id = def.id; const o = { ...opts };
  if (opts.ctx?.dead) return { id, played: false, skipped: false };
  current?.stop(true); stopCue(); ensureStyle();
  const li = langIndex(); const prev = getWorld();
  const fade = document.createElement('div'); fade.className = 'plb-cine-fade'; document.body.append(fade);
  document.body.dataset.cine = id;
  let stopped = false, skipped = false, resolve = () => {}, hide = () => {}, off = () => {};
  let w = null, world = null;
  const done = new Promise((r) => { resolve = r; });
  const self = {
    id,
    stop(skip = false) {
      if (stopped) return; stopped = true; skipped = skip; off(); hide(); stopVoiceLine();
      if (getWorld() === world) setWorld(prev);
      try { w?.dispose?.(); } catch (e) { console.error(e); }
      delete document.body.dataset.cine; fade.classList.remove('off');
      setTimeout(() => { fade.classList.add('off'); setTimeout(() => fade.remove(), 650); }, 30);
      if (current === self) current = null;
      resolve({ id, played: true, skipped });
    },
  };
  current = self; dbg('cine', self);
  opts.ctx?.onCleanup?.(() => self.stop(true));

  try { w = await def.make(o); await w.ready(9000); } catch (e) { console.error('cine', id, e); }
  if (stopped) return done;
  if (!w) { self.stop(); return done; }
  const shots = shotsOf(def, o); let si = 0, st = 0, fired = new Set();
  const cam = w.camera;
  const anchorOf = (sh) => { const a = sh.anchor && (typeof sh.anchor === 'function' ? sh.anchor(w) : w.actors?.[sh.anchor]?.root.position); return a || { x: 0, y: 0, z: 0 }; };
  const apply = () => {
    const sh = shots[si]; if (!sh) return; const s = sampleKeys(sh.cam, sh.d > 0 ? st / sh.d : 1); const a = anchorOf(sh);
    cam.position.set(a.x + s.pos[0], a.y + s.pos[1], a.z + s.pos[2]); cam.up.set(0, 1, 0);
    cam.lookAt(a.x + s.look[0], a.y + s.look[1], a.z + s.look[2]);
    if (Math.abs(cam.fov - s.fov) > 0.05) { cam.fov = s.fov; cam.updateProjectionMatrix(); }
  };
  world = { scene: w.scene, camera: cam, update(dt, t) { w.update(dt, t); apply(); }, resize() { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); } };

  hide = mountLetterbox({ id, title: '', sub: '', skipLabel: li ? 'Skip · Esc' : 'Saltar · Esc', onSkip: () => self.stop(true) });
  const lb = document.querySelector(`.plb-letterbox[data-cue="${id}"]`); lb?.setAttribute('data-cine', '');
  const head = lb?.querySelector('.plb-letterbox-copy strong'), note = lb?.querySelector('.plb-letterbox-copy small');
  const say = (ln) => {
    if (head) head.textContent = (ln.who ? ln.who[li] : '') + (ln.tag && TAG[ln.tag] ? TAG[ln.tag][li] : '');
    if (note) note.textContent = ln.tx ? ln.tx[li] : '';
    if (ln.sfx) sfx(ln.sfx, { vol: ln.vol ?? 0.5 });
    if (ln.tx) voiceLine(ln.tx[1]);
  };
  const enter = (i) => { si = i; st = 0; fired = new Set(); const sh = shots[i]; try { sh.on?.(w, o); } catch (e) { console.error(e); } apply(); };
  // QA: salta a un plano y a un instante (solo se expone en ?debug como window.__cine)
  self.jump = (i, at = 0) => { if (!shots[i]) return; enter(i); st = at; };
  self.shots = shots.length;
  enter(0); setWorld(world); requestAnimationFrame(() => fade.classList.add('off'));
  off = onTick((dt) => {
    if (stopped) return; if (opts.ctx?.dead) { self.stop(true); return; }
    if (getWorld() !== world) { self.stop(true); return; } // alguien cambió de mundo (reinicio, salir)
    st += dt; const sh = shots[si];
    for (const [k, ln] of (sh.lines || []).entries()) if (!fired.has(k) && st >= (ln.at || 0)) { fired.add(k); say(ln); }
    for (const [k, ev] of (sh.events || []).entries()) if (!fired.has('e' + k) && st >= ev.at) { fired.add('e' + k); try { ev.do(w, o); } catch (e) { console.error(e); } }
    if (st >= sh.d) { if (si + 1 < shots.length) enter(si + 1); else self.stop(false); }
  });
  return done;
}

addEventListener('keydown', (e) => {
  if (!current || e.repeat) return;
  if (e.code !== 'Escape' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
  e.preventDefault(); e.stopPropagation(); current.stop(true);
}, true);
