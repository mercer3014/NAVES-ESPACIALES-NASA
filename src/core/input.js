// Input abstracto: teclado + touch (stick, throttle, botones) → acciones
import { isTouch } from './store.js';
const keys = new Set(); const edge = new Set(); const btn = new Map();
export const input = { stick: { x: 0, y: 0 }, throttleTouch: null, keys, edge };
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (!keys.has(e.code)) edge.add(e.code);
  keys.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
export const down = (...c) => c.some((k) => keys.has(k));
export const pressed = (...c) => c.some((k) => edge.has(k));
export function endFrame() { edge.clear(); for (const b of btn.values()) b.edge = false; }
export function axis() {
  let x = input.stick.x, y = input.stick.y;
  if (down('KeyA', 'ArrowLeft')) x -= 1; if (down('KeyD', 'ArrowRight')) x += 1;
  if (down('KeyW', 'ArrowUp')) y += 1; if (down('KeyS', 'ArrowDown')) y -= 1;
  return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
}
// Botón táctil/clic registrado por nombre
export function bindBtn(el, name) {
  const st = { down: false, edge: false }; btn.set(name, st);
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); st.down = true; st.edge = true; el.classList.add('down'); navigator.vibrate?.(8); });
  const up = () => { st.down = false; el.classList.remove('down'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  return st;
}
export const bdown = (name) => btn.get(name)?.down || false;
export const bpressed = (name) => btn.get(name)?.edge || false;
export function clearBtns() { btn.clear(); input.stick.x = input.stick.y = 0; input.throttleTouch = null; }
export function makeStick(el) {
  const knob = el.querySelector('i'); let id = null;
  const move = (e) => {
    const r = el.getBoundingClientRect(); const R = r.width / 2;
    let dx = (e.clientX - r.left - R) / R, dy = (e.clientY - r.top - R) / R; const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    input.stick.x = dx; input.stick.y = -dy; knob.style.transform = `translate(calc(-50% + ${dx * R * 0.6}px), calc(-50% + ${dy * R * 0.6}px))`;
  };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; el.setPointerCapture(id); move(e); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
  const end = (e) => { if (e.pointerId !== id) return; id = null; input.stick.x = input.stick.y = 0; knob.style.transform = 'translate(-50%,-50%)'; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
export function makeThrottle(el, onChange) {
  const fill = el.querySelector('.fill'); let id = null, lastN = -1;
  for (let i = 1; i < 10; i++) { const n = document.createElement('div'); n.className = 'notch'; n.style.bottom = i * 10 + '%'; el.append(n); }
  const set = (e) => {
    const r = el.getBoundingClientRect(); const v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    input.throttleTouch = v; const n = Math.round(v * 10); if (n !== lastN) { lastN = n; navigator.vibrate?.(6); }
    onChange?.(v);
  };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; el.setPointerCapture(id); set(e); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e); });
  el.addEventListener('pointerup', (e) => { if (e.pointerId === id) id = null; });
  return { show(v) { fill.style.height = v * 100 + '%'; } };
}
if (isTouch) document.body.classList.add('touch');
addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture: true });
addEventListener('keydown', () => document.body.classList.remove('touch'), { capture: true });
