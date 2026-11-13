// Reproduce un riel encima de la cámara de la fase y lo suelta al terminar o al saltar.
// No pausa el simulador: la misión sigue y puede completarse aunque nadie mire el plano.
import { getWorld, onTick } from '../../core/engine.js';
import { dbg, store } from '../../core/store.js';
import { getCue, createPlayback, stepPlayback, skipPlayback, sampleRail } from './rails.js';
import { mountLetterbox } from './letterbox.js';

let current = null;

function langIndex() {
  return store.get('lang') === 'en' ? 1 : 0;
}

function readAnchor(anchor) {
  try {
    const a = typeof anchor === 'function' ? anchor() : anchor;
    const p = a?.position || a;
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) return null;
    return p;
  } catch (e) { console.error(e); return null; }
}

function hookUpdate(world) {
  if (world.update?.__plb) return;
  const orig = world.update?.bind(world);
  const wrapped = function (dt, t) {
    if (orig) orig(dt, t);
    try { wrapped.__apply?.(); } catch (e) { console.error(e); wrapped.__apply = null; }
  };
  wrapped.__plb = true;
  wrapped.__apply = null;
  world.update = wrapped;
}

function applySample(cam, anchor, sample) {
  cam.up.set(0, 1, 0);
  cam.position.set(anchor.x + sample.pos[0], anchor.y + sample.pos[1], anchor.z + sample.pos[2]);
  cam.lookAt(anchor.x + sample.look[0], anchor.y + sample.look[1], anchor.z + sample.look[2]);
  if (cam.isOrthographicCamera) {
    cam.zoom = sample.zoom;
    cam.updateProjectionMatrix();
  } else if (Number.isFinite(sample.fov) && Math.abs(cam.fov - sample.fov) > 0.05) {
    cam.fov = sample.fov;
    cam.updateProjectionMatrix();
  }
}

export function stopCue() {
  current?.stop();
}

export function playCue(id, opts = {}) {
  const cue = getCue(id);
  if (!cue) return Promise.resolve({ id, played: false, skipped: false, blocksCompletion: false });
  const world = opts.world || getWorld();
  const cam = world?.camera;
  if (!cam) return Promise.resolve({ id, played: false, skipped: false, blocksCompletion: false });
  current?.stop();

  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pb = createPlayback(id);
  if (reduced) pb.duration = Math.min(pb.duration, 1.8);
  const saved = {
    fov: cam.fov, zoom: cam.zoom,
    px: cam.position.x, py: cam.position.y, pz: cam.position.z,
    qx: cam.quaternion.x, qy: cam.quaternion.y, qz: cam.quaternion.z, qw: cam.quaternion.w,
  };
  hookUpdate(world);
  const li = langIndex();
  let stopped = false;
  let hide = () => {};
  let off = () => {};
  let resolve = () => {};
  const done = new Promise((r) => { resolve = r; });
  const self = {
    id,
    get t() { return pb.t; },
    get skipped() { return pb.skipped; },
    stop() {
      if (stopped) return;
      stopped = true;
      off();
      hide();
      if (world.update?.__plb) world.update.__apply = null;
      if (getWorld() === world && world.camera === cam) {
        cam.fov = saved.fov;
        cam.zoom = saved.zoom;
        cam.updateProjectionMatrix();
        if (cue.restore) {
          cam.position.set(saved.px, saved.py, saved.pz);
          cam.quaternion.set(saved.qx, saved.qy, saved.qz, saved.qw);
        }
      }
      if (current === self) current = null;
      resolve({ id, played: true, skipped: pb.skipped, blocksCompletion: false });
    },
    skip() { skipPlayback(pb); self.stop(); },
  };
  hide = mountLetterbox({
    id,
    title: cue.title[li],
    sub: cue.sub[li],
    skipLabel: li ? 'Skip · Esc' : 'Saltar · Esc',
    onSkip: () => self.skip(),
  });
  off = onTick((dt) => {
    if (stopped || opts.ctx?.dead) { self.stop(); return; }
    stepPlayback(pb, dt);
    if (pb.done) self.stop();
  });
  world.update.__apply = () => {
    if (stopped) return;
    if (getWorld() !== world) { self.stop(); return; }
    const anchor = readAnchor(opts.anchor);
    if (!anchor) return;
    const u = pb.duration > 0 ? pb.t / pb.duration : 1;
    applySample(cam, anchor, sampleRail(id, u));
  };
  opts.ctx?.onCleanup?.(() => { if (current === self) self.stop(); });
  current = self;
  dbg('cutscene', self);
  return done;
}

addEventListener('keydown', (e) => {
  if (!current || e.repeat) return;
  if (e.code !== 'Escape' && e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
  e.preventDefault();
  e.stopPropagation();
  current.skip();
}, true);
