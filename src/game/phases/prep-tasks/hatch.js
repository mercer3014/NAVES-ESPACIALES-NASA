// Tarea 5 · Cierra la escotilla: arrastra la llave de media luna hasta Neil y gira la manivela en círculo.
import { store } from '../../../core/store.js';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const NEIL = [200, 135], NEIL_R = 95; // zona de entrega
const WHEEL = [200, 322], WHEEL_R = 62;
const TURNS = 1.5; // vueltas necesarias
const KEY0 = [200, 322];

export default function mountTask(el, opts) {
  return new Promise((resolve) => {
    const t0 = performance.now(); let done = false, phase = 1, acc = 0, lastA = 0, turning = false, tpid = null, kpid = null;
    const ns = 'http://www.w3.org/2000/svg';
    el.innerHTML = `<div class="pt-root pt-hatch"><div class="pt-stage" style="touch-action:none">
      <svg class="pt-ht-svg" viewBox="0 -22 400 442" preserveAspectRatio="xMidYMid meet" style="touch-action:none">
        <defs><clipPath id="pt-ht-clip"><circle cx="${NEIL[0]}" cy="${NEIL[1]}" r="112"/></clipPath></defs>
        <circle cx="${NEIL[0]}" cy="${NEIL[1]}" r="118" fill="#3A3D42" stroke="#0B0C0E" stroke-width="6"/>
        <circle cx="${NEIL[0]}" cy="${NEIL[1]}" r="112" fill="#0B0C0E"/>
        <g class="pt-ht-neil">
          <rect x="140" y="150" width="120" height="86" rx="30" fill="#FFFFFF" stroke="#0B0C0E" stroke-width="5"/>
          <circle cx="200" cy="120" r="46" fill="#FFFFFF" stroke="#0B0C0E" stroke-width="5"/>
          <rect x="170" y="104" width="60" height="38" rx="16" fill="#3A3D42" stroke="#0B0C0E" stroke-width="4"/>
          <path d="M178 114 q14 -8 28 -2" stroke="#F2EFE6" stroke-width="4" fill="none" stroke-linecap="round"/>
          <rect x="176" y="198" width="22" height="14" rx="4" fill="#FF4F00"/>
        </g>
        <g clip-path="url(#pt-ht-clip)"><g class="pt-ht-door"><circle cx="${NEIL[0]}" cy="${NEIL[1]}" r="116" fill="#8A8F96" stroke="#0B0C0E" stroke-width="6"/>
          <circle cx="${NEIL[0]}" cy="${NEIL[1]}" r="86" fill="none" stroke="#3A3D42" stroke-width="5"/>
          ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="${NEIL[0] + 100 * Math.cos((a * Math.PI) / 180)}" cy="${NEIL[1] + 100 * Math.sin((a * Math.PI) / 180)}" r="5" fill="#0B0C0E"/>`).join('')}</g></g>
        <text x="200" y="2" text-anchor="middle" class="pt-ht-t">NEIL</text>
        <g class="pt-ht-key" style="cursor:grab"><circle r="52" fill="transparent"/><path d="M0 -42 A42 42 0 1 0 0 42 A24 42 0 1 1 0 -42 Z" fill="#FF4F00" stroke="#0B0C0E" stroke-width="5" stroke-linejoin="round"/></g>
        <text class="pt-ht-t pt-ht-keylab" x="200" y="400" text-anchor="middle">${L() ? 'MOON KEY' : 'LLAVE DE LA LUNA'}</text>
        <g class="pt-ht-wheel" style="display:none"><circle cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="${WHEEL_R + 14}" fill="#F2EFE6" stroke="#0B0C0E" stroke-width="4" stroke-dasharray="3 9"/>
          <path class="pt-ht-prog" d="" fill="none" stroke="#FF4F00" stroke-width="9" stroke-linecap="round"/>
          <g class="pt-ht-rot"><circle cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="${WHEEL_R - 8}" fill="none" stroke="#0B0C0E" stroke-width="12"/>
            <path d="M${WHEEL[0]} ${WHEEL[1] - WHEEL_R + 8} V${WHEEL[1] + WHEEL_R - 8} M${WHEEL[0] - WHEEL_R + 8} ${WHEEL[1]} H${WHEEL[0] + WHEEL_R - 8}" stroke="#0B0C0E" stroke-width="10" stroke-linecap="round"/>
            <circle cx="${WHEEL[0]}" cy="${WHEEL[1] - WHEEL_R + 8}" r="15" fill="#FF4F00" stroke="#0B0C0E" stroke-width="4"/><circle cx="${WHEEL[0]}" cy="${WHEEL[1]}" r="10" fill="#FF4F00"/></g></g>
      </svg></div></div>`;
    const svg = el.querySelector('.pt-ht-svg'), key = el.querySelector('.pt-ht-key'), keylab = el.querySelector('.pt-ht-keylab'), wheel = el.querySelector('.pt-ht-wheel'), rot = el.querySelector('.pt-ht-rot'), door = el.querySelector('.pt-ht-door'), prog = el.querySelector('.pt-ht-prog');
    let kpos = KEY0.slice(); const putKey = () => key.setAttribute('transform', `translate(${kpos[0]} ${kpos[1]}) rotate(-20)`); putKey();
    door.setAttribute('transform', 'translate(260 0)');
    const pt = svg.createSVGPoint();
    const svgXY = (e) => { pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM(); return m ? (({ x, y }) => [x, y])(pt.matrixTransform(m.inverse())) : [0, 0]; };

    const down = (e) => {
      if (done) return; const [x, y] = svgXY(e);
      if (phase === 1 && e.target.closest('.pt-ht-key')) { e.preventDefault(); kpid = e.pointerId; svg.setPointerCapture(e.pointerId); opts.sfx('tick'); kpos = [x, y]; putKey(); }
      else if (phase === 2 && Math.hypot(x - WHEEL[0], y - WHEEL[1]) < WHEEL_R + 30) { e.preventDefault(); turning = true; tpid = e.pointerId; svg.setPointerCapture(e.pointerId); lastA = Math.atan2(y - WHEEL[1], x - WHEEL[0]); }
    };
    const move = (e) => {
      if (done) return; const [x, y] = svgXY(e);
      if (kpid === e.pointerId) { kpos = [x, y]; putKey(); }
      else if (turning && tpid === e.pointerId) {
        const a = Math.atan2(y - WHEEL[1], x - WHEEL[0]); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; lastA = a;
        if (Math.hypot(x - WHEEL[0], y - WHEEL[1]) < 14) return; // en el centro no hay giro fiable
        acc = Math.max(0, Math.min(TURNS * 2 * Math.PI, acc + d)); paint();
        if (Math.floor(acc / 0.9) !== Math.floor((acc - d) / 0.9)) opts.sfx('tick');
        if (acc >= TURNS * 2 * Math.PI - 0.01) { turning = false; opts.sfx('ok'); setTimeout(() => finish(true), 700); }
      }
    };
    const up = (e) => {
      if (kpid === e.pointerId) {
        kpid = null;
        if (Math.hypot(kpos[0] - NEIL[0], kpos[1] - NEIL[1]) < NEIL_R) { // entregada
          phase = 2; opts.sfx('ok'); key.style.display = 'none'; keylab.style.display = 'none'; wheel.style.display = ''; paint();
          opts.hint?.(L() ? 'Thanks! Now turn the handle in a circle.' : '¡Gracias! Ahora gira la manivela en círculo.');
        } else { kpos = KEY0.slice(); putKey(); }
      }
      if (tpid === e.pointerId) { turning = false; tpid = null; }
    };
    function paint() {
      const p = acc / (TURNS * 2 * Math.PI); rot.setAttribute('transform', `rotate(${(acc * 180) / Math.PI} ${WHEEL[0]} ${WHEEL[1]})`);
      door.setAttribute('transform', `translate(${(1 - p) * 260} 0)`);
      const R2 = WHEEL_R + 14, a1 = -Math.PI / 2, a2 = a1 + Math.min(0.9999, p) * 2 * Math.PI;
      prog.setAttribute('d', p <= 0.002 ? '' : `M${WHEEL[0] + R2 * Math.cos(a1)} ${WHEEL[1] + R2 * Math.sin(a1)} A${R2} ${R2} 0 ${p > 0.5 ? 1 : 0} 1 ${WHEEL[0] + R2 * Math.cos(a2)} ${WHEEL[1] + R2 * Math.sin(a2)}`);
    }
    svg.addEventListener('pointerdown', down); svg.addEventListener('pointermove', move); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    void ns;

    function cleanup() { svg.removeEventListener('pointerdown', down); svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); }
    function finish(ok) { if (done) return; done = true; cleanup(); resolve({ ok, time: (performance.now() - t0) / 1000, mistakes: 0 }); }
    if (opts.signal?.aborted) finish(false); else opts.signal?.addEventListener('abort', () => finish(false), { once: true });
  });
}
