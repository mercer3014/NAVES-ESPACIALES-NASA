// Mouse look. Pointer lock is requested from a click or key that enters a 3D view.
// Until the browser grants it, look uses client deltas so a button does not have to be held.
// The cursor stays hidden during EVA / descent and returns on pause, dialogs, and overlays.
// Touch drag is unchanged (no lock, no hidden cursor).
import { isTouch } from './store.js';
import { t, extend } from './i18n.js';
import { toast } from './util.js';
import { lookDelta } from './look-delta.js';

extend({
  'look.refused': ['Mueve el ratón para mirar. Esc pausa.', 'Move the mouse to look. Esc pauses.'],
});

export const LOOK_BLOCK = 'button,a,input,textarea,select,.dsky,.sw,.panel,.station,.tc-stick,.tc-throttle,.tc-btn,.dialog,.cpanel,.overlay';
export const lookBlocked = (el) => !!(el && el.closest && el.closest(LOOK_BLOCK));
export const LOOK_PHASES = new Set(['descent', 'eva']);

const sessions = new Set();
let hintShown = false;

export function releaseLook() { if (document.pointerLockElement) document.exitPointerLock?.(); }
export function lookActive() { return sessions.size > 0; }

function menuOpen() {
  if (document.body.dataset.paused) return true;
  if (document.querySelector('.overlay, .dialog')) return true;
  const radio = document.querySelector('.r-panel');
  return !!(radio && !radio.classList.contains('hidden'));
}

function syncCursor() {
  const on = sessions.size > 0 && !isTouch && !menuOpen();
  document.body.classList.toggle('look-on', on);
}

function noteRefused() {
  if (hintShown || document.pointerLockElement) return;
  hintShown = true;
  toast(t('look.refused'), 'info');
}

export function requestLook() {
  if (isTouch || menuOpen()) return;
  const canvas = document.querySelector('#gl');
  if (!canvas?.requestPointerLock) { noteRefused(); return; }
  let pending;
  try { pending = canvas.requestPointerLock(); } catch { noteRefused(); return; }
  if (pending?.then) pending.then(() => {}, () => noteRefused());
}
export function offerLook(phase) { if (LOOK_PHASES.has(phase)) requestLook(); }

document.addEventListener('pointerlockerror', () => noteRefused());
document.addEventListener('pointerlockchange', () => syncCursor());

export function attachLook({ onDelta }) {
  const canvas = document.querySelector('#gl');
  let last = null, raf = 0;
  const alive = () => sessions.has(session);
  const turn = (dx, dy) => {
    if (!alive() || menuOpen()) return;
    if (!dx && !dy) return;
    dx = Math.max(-180, Math.min(180, dx));
    dy = Math.max(-180, Math.min(180, dy));
    onDelta(dx, dy);
  };
  const onMove = (e) => {
    if (!alive() || e.pointerType === 'touch') return;
    if (menuOpen()) { last = null; return; }
    const locked = document.pointerLockElement === canvas;
    const d = lookDelta({ locked, movementX: e.movementX, movementY: e.movementY, clientX: e.clientX, clientY: e.clientY, last });
    last = d.last;
    turn(d.dx, d.dy);
  };
  const pump = () => {
    raf = requestAnimationFrame(pump);
    if (!alive()) return;
    if (menuOpen() && document.pointerLockElement) releaseLook();
    syncCursor();
  };
  raf = requestAnimationFrame(pump);
  const onGesture = (e) => {
    if (!alive() || menuOpen()) return;
    if (e.type === 'keydown' && (e.code === 'Escape' || e.repeat)) return;
    if (e.type === 'pointerdown' && (e.pointerType === 'touch' || lookBlocked(e.target))) return;
    if (document.pointerLockElement === canvas) return;
    requestLook();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('pointerdown', onGesture, true);
  document.addEventListener('keydown', onGesture, true);
  const session = { release: releaseLook, get locked() { return document.pointerLockElement === canvas; } };
  sessions.add(session);
  syncCursor();
  session.dispose = () => {
    sessions.delete(session);
    cancelAnimationFrame(raf);
    releaseLook();
    last = null;
    if (sessions.size === 0) document.body.classList.remove('look-on');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('pointerdown', onGesture, true);
    document.removeEventListener('keydown', onGesture, true);
  };
  return session;
}
export function releaseAllLooks() { for (const s of sessions) s.release(); }
