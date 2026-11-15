// Pointer, wheel, and the C / V cycle. Missions still place chase and cockpit.
import { attachLook, requestLook } from '../core/look.js';
import { isTouch, dbg } from '../core/store.js';
import { t, extend } from '../core/i18n.js';
import { toast } from '../core/util.js';
import { sfx } from '../core/audio.js';
import { radio } from '../net/radio.js';
import { cueActive } from './cutscenes/play.js';
import {
  cycleMode, wantsCycle, radioOwnsV, applyPointerDelta, applyWheel, cameraOwner,
} from './orbit-camera.js';

extend({
  'cam.orbit': ['Órbita', 'Orbit'],
  'cam.chase': ['Persecución', 'Chase'],
  'cam.cockpit': ['Cabina', 'Cockpit'],
});

function readRadio() {
  const el = document.querySelector('.radio');
  return { visible: !!el && !el.classList.contains('hidden'), mode: radio.mode, state: radio.state };
}

export function bindOrbitControls(state, { allow = () => true, onMode, pointer = true, touch = true } = {}) {
  let look = null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn cam-cycle';
  btn.style.cssText = 'position:fixed;top:68px;right:max(16px, env(safe-area-inset-right));z-index:35;padding:.4em .75em;font-size:.75rem';
  const paint = () => { btn.textContent = `${t('cam.' + state.mode)} · C/V`; };
  const open = () => allow() && !cueActive();
  const syncLook = () => {
    if (!pointer) return;
    const want = state.mode === 'orbit' && !isTouch && open();
    if (want && !look) {
      look = attachLook({ onDelta: (dx, dy) => { if (!open() || state.mode !== 'orbit') return; applyPointerDelta(state, dx, dy); } });
      requestLook();
    } else if (!want && look) {
      look.dispose();
      look = null;
    }
  };
  const cycle = () => {
    if (!allow()) return;
    const mode = cycleMode(state);
    sfx('tick');
    toast(t('cam.' + mode), 'info');
    paint();
    syncLook();
    onMode?.(mode);
  };
  btn.onclick = () => cycle();
  paint();
  document.body.append(btn);
  // Keydown keeps the pointer-lock gesture. The frame edge would be a frame too late.
  const onKey = (e) => {
    if (e.repeat) return;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!allow()) return;
    if (!wantsCycle({ c: e.code === 'KeyC', v: e.code === 'KeyV', radioOwnsV: radioOwnsV(readRadio()) })) return;
    cycle();
  };
  addEventListener('keydown', onKey);
  const onWheel = (e) => {
    if (!open() || state.mode !== 'orbit') return;
    e.preventDefault();
    applyWheel(state, e.deltaY);
  };
  addEventListener('wheel', onWheel, { passive: false });
  let drag = null;
  const onDown = (e) => {
    if (!touch || e.pointerType !== 'touch') return;
    if (e.target?.closest?.('button,.tc-stick,.tc-btn,.tc-throttle,.panel,.ex-stick,.ex-actions,.ex-sliders,input,a')) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!open() || state.mode !== 'orbit') return;
    applyPointerDelta(state, dx, dy, { yaw: 0.006, pitch: 0.004 });
  };
  const onUp = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  if (touch) {
    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
  }
  dbg('orbit', state);
  return {
    state,
    cycle,
    poll() {
      paint();
      syncLook();
    },
    owner() { return cameraOwner({ mode: state.mode, cutscene: cueActive() }); },
    dispose() {
      look?.dispose();
      look = null;
      btn.remove();
      removeEventListener('keydown', onKey);
      removeEventListener('wheel', onWheel);
      if (touch) {
        removeEventListener('pointerdown', onDown);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        removeEventListener('pointercancel', onUp);
      }
    },
  };
}
