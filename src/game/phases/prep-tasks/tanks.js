// Tarea 2 · Llena los tanques: mantén pulsado LLENAR hasta la franja verde; el líquido hierve y baja solo.
import { store } from '../../../core/store.js';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const TANKS = [
  { name: 'S-IC · LOX', temp: '-183 °C', boil: 0.04, centre: 0.74 },
  { name: 'S-II · LH₂', temp: '-253 °C', boil: 0.07, centre: 0.8 },
  { name: 'S-IVB · LH₂', temp: '-253 °C', boil: 0.07, centre: 0.76 },
];
const HOLD = 2; // segundos con los tres en verde

export default function mountTask(el, opts) {
  return new Promise((resolve) => {
    const t0 = performance.now(); let mistakes = 0, done = false;
    const tol = opts.diff?.tol || 1; const half = 0.07 * tol; const boilK = opts.diffName === 'veteran' ? 1.5 : opts.diffName === 'cadet' ? 0.6 : 1; const UP = 0.34;
    const st = TANKS.map((k) => ({ ...k, lo: k.centre - half, hi: k.centre + half, lv: 0.12 + Math.random() * 0.1, hold: false, pid: null }));
    el.innerHTML = `<div class="pt-root pt-tanks"><div class="pt-stage" style="touch-action:none">
      <div class="pt-tk-row">${st.map((k, i) => `<div class="pt-tk" data-i="${i}"><div class="pt-tk-name">${k.name}</div><div class="pt-tk-temp">${k.temp}</div>
        <div class="pt-tk-vessel"><div class="pt-tk-band" style="bottom:${(k.lo * 100).toFixed(1)}%;height:${((k.hi - k.lo) * 100).toFixed(1)}%"></div><div class="pt-tk-fill"></div><i class="pt-tk-steam"></i><i class="pt-tk-steam s2"></i></div>
        <button type="button" class="pt-tk-btn" data-i="${i}" style="touch-action:none">${L() ? 'FILL' : 'LLENAR'}</button></div>`).join('')}</div>
      <div class="pt-tk-timer"><div class="pt-tk-timer-bar"><i></i></div><span class="pt-tk-timer-t mono">0.0 / ${HOLD} s</span></div></div></div>`;
    const stage = el.querySelector('.pt-stage'), fills = [...el.querySelectorAll('.pt-tk-fill')], tks = [...el.querySelectorAll('.pt-tk')], bar = el.querySelector('.pt-tk-timer-bar i'), tt = el.querySelector('.pt-tk-timer-t');
    let green = 0, last = performance.now(), raf = 0, lastTick = 0;

    const release = (i) => { st[i].hold = false; st[i].pid = null; tks[i].classList.remove('pt-hold'); };
    const down = (e) => { const b = e.target.closest('.pt-tk-btn'); if (!b || done) return; const i = +b.dataset.i; e.preventDefault(); st[i].hold = true; st[i].pid = e.pointerId; tks[i].classList.add('pt-hold'); try { b.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
    const up = (e) => { st.forEach((k, i) => { if (k.hold && k.pid === e.pointerId) release(i); }); };
    stage.addEventListener('pointerdown', down); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up); stage.addEventListener('lostpointercapture', up);
    const kd = (e) => { const i = '123'.indexOf(e.key); if (i >= 0 && !e.repeat) { st[i].hold = true; st[i].pid = 'k'; tks[i].classList.add('pt-hold'); } };
    const ku = (e) => { const i = '123'.indexOf(e.key); if (i >= 0) release(i); };
    addEventListener('keydown', kd); addEventListener('keyup', ku);

    const frame = (now) => {
      raf = requestAnimationFrame(frame); if (done) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      let all = true;
      st.forEach((k, i) => {
        k.lv += (k.hold ? UP : 0) * dt - k.boil * boilK * dt; k.lv = Math.max(0, k.lv);
        if (k.lv > 0.97) { k.lv = 0.66; mistakes++; opts.sfx('error'); tks[i].classList.add('pt-spill'); setTimeout(() => tks[i].classList.remove('pt-spill'), 500); opts.hint?.(L() ? 'Too full! Let go sooner.' : '¡Se desbordó! Suelta antes de llegar arriba.'); }
        const inb = k.lv >= k.lo && k.lv <= k.hi; if (!inb) all = false;
        tks[i].classList.toggle('pt-in', inb); fills[i].style.height = (k.lv * 100).toFixed(1) + '%';
        if (k.hold && now - lastTick > 140) { lastTick = now; opts.sfx('tick'); }
      });
      green = all ? green + dt : 0;
      bar.style.width = Math.min(100, (green / HOLD) * 100) + '%'; tt.textContent = `${Math.min(HOLD, green).toFixed(1)} / ${HOLD} s`; stage.classList.toggle('pt-all', all);
      if (green >= HOLD) { opts.sfx('ok'); finish(true, 350); }
    };
    raf = requestAnimationFrame(frame);

    function cleanup() { cancelAnimationFrame(raf); stage.removeEventListener('pointerdown', down); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up); stage.removeEventListener('lostpointercapture', up); removeEventListener('keydown', kd); removeEventListener('keyup', ku); }
    function finish(ok, delay = 0) { if (done) return; done = true; cleanup(); const r = { ok, time: (performance.now() - t0) / 1000, mistakes }; if (delay) setTimeout(() => resolve(r), delay); else resolve(r); }
    if (opts.signal?.aborted) finish(false); else opts.signal?.addEventListener('abort', () => finish(false), { once: true });
  });
}
