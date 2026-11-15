// Tarea 1 · Conecta el traje: arrastra cada manguera al conector de su mismo color (4 cables en Veterano).
import { store } from '../../../core/store.js';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const DEFS = [
  { id: 'blue', col: '#2F6FE0', lab: ['ENTRA O₂', 'O₂ IN'] },
  { id: 'red', col: '#E0201B', lab: ['SALE O₂', 'O₂ OUT'] },
  { id: 'black', col: '#0B0C0E', lab: ['RADIO', 'RADIO'] },
  { id: 'amber', col: '#FFB000', lab: ['PULSO', 'PULSE'] },
];
const R = 30; // radio del enchufe: 60 px de diámetro
const SNAP = 54; // distancia máxima para acertar un conector

export default function mountTask(el, opts) {
  return new Promise((resolve) => {
    const t0 = performance.now(); let mistakes = 0, done = false, conn = 0;
    const defs = DEFS.slice(0, opts.diffName === 'veteran' ? 4 : 3);
    const n = defs.length;
    const order = defs.map((_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    if (order.every((v, i) => v === i)) order.push(order.shift()); // nunca salen ya alineados

    el.innerHTML = `<div class="pt-root pt-cables"><div class="pt-stage" style="touch-action:none">
      <svg class="pt-cab-svg" aria-hidden="true"></svg>
      <div class="pt-cab-panel pt-cab-suit"><b>${L() ? 'A7L SUIT' : 'TRAJE A7L'}</b></div>
      <div class="pt-cab-panel pt-cab-seat"><b>${L() ? 'SEAT' : 'ASIENTO'}</b></div></div></div>`;
    const stage = el.querySelector('.pt-stage'), svg = el.querySelector('.pt-cab-svg');
    const mk = (cls, d, i) => { const e = document.createElement('div'); e.className = cls; e.dataset.id = d.id; e.dataset.i = i; e.style.touchAction = 'none';
      e.innerHTML = `<span class="pt-cab-lab">${d.lab[L()]}</span>`; stage.append(e); return e; };
    const items = defs.map((d, i) => {
      const plug = mk('pt-plug', d, i); plug.style.background = d.col; plug.style.setProperty('--c', d.col);
      const sock = mk('pt-sock', d, i); sock.style.setProperty('--c', d.col);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', d.col); path.setAttribute('stroke-width', '13'); path.setAttribute('stroke-linecap', 'round');
      svg.append(path);
      return { d, plug, sock, path, base: [0, 0], rest: [0, 0], at: [0, 0], target: [0, 0], ok: false, drag: false, slot: order[i] };
    });
    let W = 0, H = 0, vert = false;
    const draw = (it) => {
      const [bx, by] = it.base, [px, py] = it.at; const dx = vert ? 0 : 1, dy = vert ? 1 : 0; const k = 70;
      it.path.setAttribute('d', `M${bx} ${by} C${bx + dx * k} ${by + dy * k + 14} ${px - dx * k} ${py - dy * k + 18} ${px} ${py}`);
      it.plug.style.transform = `translate(${px - R}px,${py - R}px)`;
    };
    const layout = () => {
      W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return; vert = W < H * 1.1;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const suit = el.querySelector('.pt-cab-suit'), seat = el.querySelector('.pt-cab-seat');
      stage.classList.toggle('pt-vert', vert);
      const span = (len) => (i) => (n === 1 ? len / 2 : len * (0.14 + 0.72 * (i / (n - 1))));
      const along = span(vert ? W : H);
      const edge = vert ? Math.max(54, H * 0.11) : Math.max(70, W * 0.12);
      items.forEach((it, i) => {
        const a = along(i), s = along(it.slot);
        if (vert) { it.base = [a, edge]; it.rest = [a, edge + 56]; it.target = [s, H - edge - 56]; }
        else { it.base = [edge, a]; it.rest = [edge + 56, a]; it.target = [W - edge - 56, s]; }
        if (!it.drag) it.at = it.ok ? it.target.slice() : it.rest.slice();
        it.sock.style.transform = `translate(${it.target[0] - R}px,${it.target[1] - R}px)`; draw(it);
      });
      void suit; void seat;
    };
    const ro = new ResizeObserver(layout); ro.observe(stage); layout();

    let raf = 0; const gliding = new Set();
    const glide = (it, to) => { const from = it.at.slice(), t1 = performance.now(); gliding.add(it); it.gl = (now) => { const k = Math.min(1, (now - t1) / 180), e = 1 - (1 - k) * (1 - k); it.at = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]; draw(it); if (k >= 1) gliding.delete(it); };
      if (!raf) { const f = (now) => { raf = 0; for (const g of [...gliding]) g.gl(now); if (gliding.size && !done) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); } };
    const local = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = (e) => {
      if (done) return; const plug = e.target.closest('.pt-plug'); if (!plug) return; const it = items[+plug.dataset.i]; if (it.ok) return;
      e.preventDefault(); it.drag = true; gliding.delete(it); plug.classList.add('pt-grab'); plug.setPointerCapture(e.pointerId); it.pid = e.pointerId; opts.sfx('tick');
      it.at = local(e); draw(it);
    };
    const move = (e) => { const it = items.find((x) => x.drag && x.pid === e.pointerId); if (!it) return; it.at = local(e); draw(it); };
    const up = (e) => {
      const it = items.find((x) => x.drag && x.pid === e.pointerId); if (!it) return; it.drag = false; it.plug.classList.remove('pt-grab');
      let best = null, bd = SNAP; for (const o of items) { if (o.ok) continue; const d = Math.hypot(o.target[0] - it.at[0], o.target[1] - it.at[1]); if (d < bd) { bd = d; best = o; } }
      if (best && best === it) { // acierto: color con color
        it.ok = true; it.plug.classList.add('pt-ok'); it.sock.classList.add('pt-ok'); glide(it, it.target); conn++; opts.sfx('ok');
        if (conn === n) setTimeout(() => finish(true), 650);
        else opts.share?.({ conn, n });
      } else {
        if (best) { mistakes++; opts.sfx('error'); best.sock.classList.add('pt-bad'); setTimeout(() => best.sock.classList.remove('pt-bad'), 450); opts.hint?.(L() ? 'That one goes with the other color.' : 'Ese va con otro color. Fíjate en el color y en el rótulo.'); }
        glide(it, it.rest);
      }
    };
    stage.addEventListener('pointerdown', down); stage.addEventListener('pointermove', move); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

    function cleanup() { cancelAnimationFrame(raf); gliding.clear(); ro.disconnect(); stage.removeEventListener('pointerdown', down); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up); }
    function finish(ok) { if (done) return; done = true; cleanup(); resolve({ ok, time: (performance.now() - t0) / 1000, mistakes }); }
    if (opts.signal?.aborted) finish(false); else opts.signal?.addEventListener('abort', () => finish(false), { once: true });
  });
}
