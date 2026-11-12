// Mouse look. Pointer lock is requested from a click or key that enters a 3D view.
// Until the browser grants it, the camera follows the mouse with no button held.
import { isTouch } from './store.js';
import { t, extend } from './i18n.js';
import { toast } from './util.js';

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

function noteRefused() {
  if (hintShown || document.pointerLockElement) return;
  hintShown = true;
  toast(t('look.refused'), 'info');
}

export function requestLook() {
  if (isTouch) return;
  const canvas = document.querySelector('#gl');
  if (!canvas?.requestPointerLock) { noteRefused(); return; }
  let pending;
  try { pending = canvas.requestPointerLock(); } catch { noteRefused(); return; }
  if (pending?.then) pending.then(() => {}, () => noteRefused());
}
export function offerLook(phase) { if (LOOK_PHASES.has(phase)) requestLook(); }

document.addEventListener('pointerlockerror', () => noteRefused());

export function attachLook({ onDelta }) {
  const canvas = document.querySelector('#gl');
  let edge = null, raf = 0;
  const alive = () => sessions.has(session);
  const turn = (dx, dy) => {
    if (!alive() || document.body.dataset.paused) return;
    if (!dx && !dy) return;
    dx = Math.max(-180, Math.min(180, dx));
    dy = Math.max(-180, Math.min(180, dy));
    onDelta(dx, dy);
  };
  const onMove = (e) => {
    if (!alive() || e.pointerType === 'touch') return;
    const locked = document.pointerLockElement === canvas;
    turn(e.movementX || 0, e.movementY || 0);
    if (locked) { edge = null; return; }
    const m = 28;
    const near = e.clientX < m || e.clientY < m || e.clientX > innerWidth - m || e.clientY > innerHeight - m;
    edge = near ? { x: (e.clientX - innerWidth / 2) * 0.012, y: (e.clientY - innerHeight / 2) * 0.012 } : null;
  };
  const pump = () => {
    raf = requestAnimationFrame(pump);
    if (edge && !document.pointerLockElement) turn(edge.x, edge.y);
  };
  raf = requestAnimationFrame(pump);
  const onGesture = (e) => {
    if (!alive() || document.body.dataset.paused) return;
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
  session.dispose = () => {
    sessions.delete(session);
    cancelAnimationFrame(raf);
    releaseLook();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('pointerdown', onGesture, true);
    document.removeEventListener('keydown', onGesture, true);
  };
  return session;
}
export function releaseAllLooks() { for (const s of sessions) s.release(); }
