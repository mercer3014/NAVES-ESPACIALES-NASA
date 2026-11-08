// Pointer lock for mouse-look. A click on the view captures the cursor; Escape releases it.
// Buttons, DSKY, switches and menus are never captured. Touch keeps drag and sticks.
import { isTouch } from './store.js';
import { t, extend } from './i18n.js';

extend({
  'look.ask': ['Clic en la vista para mirar · Esc suelta el cursor', 'Click the view to look · Esc releases the cursor'],
});

export const LOOK_BLOCK = 'button,a,input,textarea,select,.dsky,.sw,.panel,.station,.tc-stick,.tc-throttle,.tc-btn,.look-chip,.dialog,.cpanel,.overlay';
export const lookBlocked = (el) => !!(el && el.closest && el.closest(LOOK_BLOCK));

const sessions = new Set();
export function releaseLook() { if (document.pointerLockElement) document.exitPointerLock?.(); }

export function attachLook({ onDelta }) {
  const canvas = document.querySelector('#gl');
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'look-chip';
  chip.textContent = t('look.ask');
  document.body.append(chip);
  let locked = false;
  const supported = !isTouch && !!canvas?.requestPointerLock;
  const paint = () => { chip.hidden = !supported || locked || document.body.classList.contains('touch') || !document.body.dataset.screen?.startsWith('phase-'); };
  const onLock = () => { locked = document.pointerLockElement === canvas; paint(); };
  const onMove = (e) => { if (document.pointerLockElement === canvas) onDelta(e.movementX || 0, e.movementY || 0); };
  const request = (fromChip) => { if (!supported || (!fromChip && lookBlocked(document.activeElement))) return; canvas.requestPointerLock?.(); };
  const onDown = (e) => {
    if (!supported || e.pointerType === 'touch' || e.button !== 0) return;
    if (lookBlocked(e.target)) return;
    if (e.target !== canvas) return;
    request(false);
  };
  const onKey = (e) => { if (e.code === 'Escape') releaseLook(); };
  const onBlur = () => releaseLook();
  chip.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); request(true); });
  canvas?.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerlockchange', onLock);
  document.addEventListener('mousemove', onMove);
  addEventListener('keydown', onKey);
  addEventListener('blur', onBlur);
  const session = { release: releaseLook, get locked() { return locked; } };
  sessions.add(session);
  paint();
  session.dispose = () => {
    sessions.delete(session);
    releaseLook();
    chip.remove();
    canvas?.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerlockchange', onLock);
    document.removeEventListener('mousemove', onMove);
    removeEventListener('keydown', onKey);
    removeEventListener('blur', onBlur);
  };
  return session;
}
export function releaseAllLooks() { for (const s of sessions) s.release(); }
