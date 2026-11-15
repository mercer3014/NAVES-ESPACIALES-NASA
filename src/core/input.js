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
// Al perder el foco (cambio de pestaña, llamada entrante, gesto del sistema) el navegador no envía keyup ni pointerup:
// sin soltar todo aquí, el personaje seguía andando solo con la última tecla o con el joystick «pegado».
const sticks = new Set();
function releaseAll() { keys.clear(); for (const b of btn.values()) b.down = false; for (const r of sticks) r(); }
addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
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
  el.style.touchAction = 'none'; el.addEventListener('contextmenu', (e) => e.preventDefault()); // pulsación larga en táctil: sin menú del navegador
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture?.(e.pointerId); } catch {} st.down = true; st.edge = true; el.classList.add('down'); navigator.vibrate?.(8); });
  const up = () => { st.down = false; el.classList.remove('down'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  return st;
}
export const bdown = (name) => btn.get(name)?.down || false;
export const bpressed = (name) => btn.get(name)?.edge || false;
export function clearBtns() { btn.clear(); sticks.clear(); input.stick.x = input.stick.y = 0; input.throttleTouch = null; }
export function makeStick(el) {
  const knob = el.querySelector('i'); let id = null, r = null;
  // touch-action:none desde el código: los joysticks del Guardián y de Expediciones no lo traían en su CSS, y sin él el navegador
  // toma el gesto como «desplazamiento» a los pocos píxeles y cancela el toque (el joystick se soltaba solo a medio movimiento).
  el.style.touchAction = 'none'; el.setAttribute('role', 'application'); if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Joystick');
  const move = (e) => {
    if (!r || !r.width) r = el.getBoundingClientRect(); const R = r.width / 2 || 1; // el rectángulo se mide una vez por gesto, no en cada movimiento
    let dx = (e.clientX - r.left - R) / R, dy = (e.clientY - r.top - R) / R; const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    input.stick.x = dx; input.stick.y = -dy; knob.style.transform = `translate(calc(-50% + ${dx * R * 0.6}px), calc(-50% + ${dy * R * 0.6}px))`;
  };
  const reset = () => { sticks.delete(reset); if (id === null) return; id = null; input.stick.x = input.stick.y = 0; knob.style.transform = 'translate(-50%,-50%)'; };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; r = el.getBoundingClientRect(); try { el.setPointerCapture(id); } catch {} sticks.add(reset); move(e); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
  const end = (e) => { if (e.pointerId === id) reset(); };
  // lostpointercapture: si el joystick se oculta o se quita con el dedo puesto, el navegador no manda pointerup y se quedaba inclinado
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
export function makeThrottle(el, onChange) {
  const fill = el.querySelector('.fill'); let id = null, lastN = -1; el.style.touchAction = 'none';
  for (let i = 1; i < 10; i++) { const n = document.createElement('div'); n.className = 'notch'; n.style.bottom = i * 10 + '%'; el.append(n); }
  const set = (e) => {
    const r = el.getBoundingClientRect(); const v = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
    input.throttleTouch = v; const n = Math.round(v * 10); if (n !== lastN) { lastN = n; navigator.vibrate?.(6); }
    onChange?.(v);
  };
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; try { el.setPointerCapture(id); } catch {} set(e); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e); });
  const up = (e) => { if (e.pointerId === id) id = null; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  return { show(v) { fill.style.height = v * 100 + '%'; } };
}
if (isTouch) document.body.classList.add('touch');
addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture: true });
addEventListener('keydown', () => document.body.classList.remove('touch'), { capture: true });
