// Interludios narrativos del guion v4 (escenas sin fase jugable): reutilizan las barras letterbox de las cinemáticas.
// Cada escena es saltable (Esc / Enter / botón) y nunca bloquea la misión. Textos bilingües [es, en] como rails.js.
import { THREE, setWorld, onTick, modelAnim } from '../../core/engine.js';
import { store, dbg } from '../../core/store.js';
import { show } from '../../ui/router.js';
import { mountLetterbox } from '../cutscenes/letterbox.js';
import './story.css';

export const L = () => (store.get('lang') === 'en' ? 1 : 0);
export const tx = (pair) => (Array.isArray(pair) ? pair[L()] : pair);
const smooth = (u) => u * u * (3 - 2 * u);
const lerp3 = (a, b, u, out) => out.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);

// Personaje civil (esqueleto Mixamo de 25 huesos, clips idle/walk/sit/talk/point/wave). Solo se mueve la raíz del clon.
export async function character(name, clip = 'idle', { at = [0, 0, 0], yaw = 0 } = {}) {
  const { scene: root, animations } = await modelAnim(name);
  root.position.set(...at); root.rotation.y = yaw;
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(root); let cur = null;
  const play = (c, { once = false, fade = 0.25 } = {}) => { const clipObj = THREE.AnimationClip.findByName(animations, c); if (!clipObj) return null;
    const a = mixer.clipAction(clipObj); a.reset(); if (once) { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat);
    if (cur && cur !== a) { a.crossFadeFrom(cur, fade, false); } a.play(); cur = a; return a; };
  play(clip); mixer.update(Math.random() * 2); // desfase para que no se muevan al unísono
  return { root, mixer, play, update: (dt) => mixer.update(dt) };
}

// Reproduce una escena: shots = [{ d, pos, look, fov, to: { pos, look, fov } }] en coordenadas de mundo; lines = [{ at, who, text: [es,en] }].
// step(dt, t) anima la escena; choice(...) muestra opciones y devuelve una promesa con la elegida. Resuelve { skipped }.
export function runCine({ id, world, title, shots = [], lines = [], step, interactive = null, minHold = 0 }) {
  const cam = world.camera; setWorld(world);
  const el = show('<div class="screen story-screen" aria-live="polite"></div>', 'story-' + id);
  let done = false, skipped = false, T = 0, resolve; const finished = new Promise((r) => (resolve = r));
  const finish = (sk) => { if (done) return; done = true; skipped = !!sk; off(); hide(); removeEventListener('keydown', key, true); resolve({ id, skipped }); };
  const hide = mountLetterbox({ id, title: tx(title), sub: '', skipLabel: L() ? 'Skip · Esc' : 'Saltar · Esc', onSkip: () => finish(true) });
  const lb = document.querySelector(`.plb-letterbox[data-cue="${id}"]`); lb?.classList.add('story');
  const sub = lb?.querySelector('small'); const subtitle = (who, text) => { if (sub) sub.textContent = text ? (who ? who + ': ' : '') + text : ''; };
  const key = (e) => { if (done || e.repeat) return; if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'NumpadEnter') { if (e.target?.closest?.('.story-choice')) return; e.preventDefault(); e.stopPropagation(); finish(true); } };
  addEventListener('keydown', key, true);
  const total = shots.reduce((s, x) => s + x.d, 0); const P = new THREE.Vector3(), Q = new THREE.Vector3();
  let li = -1; let hold = interactive ? 1 : 0; // con una decisión abierta la escena no termina sola
  const off = onTick((dt) => {
    if (done) return; T += dt;
    let acc = 0, s = shots[shots.length - 1], u = 1;
    for (const x of shots) { if (T < acc + x.d) { s = x; u = (T - acc) / x.d; break; } acc += x.d; }
    if (s) { const to = s.to || s; const k = smooth(Math.min(1, Math.max(0, u))); lerp3(s.pos, to.pos, k, P); lerp3(s.look, to.look || s.look, k, Q);
      cam.position.copy(P); cam.up.set(0, 1, 0); cam.lookAt(Q); const f = (s.fov ?? 45) + ((to.fov ?? s.fov ?? 45) - (s.fov ?? 45)) * k; if (Math.abs(cam.fov - f) > 0.01) { cam.fov = f; cam.updateProjectionMatrix(); } }
    let n = -1; for (let i = 0; i < lines.length; i++) if (T >= lines[i].at) n = i; if (n !== li) { li = n; const ln = lines[n]; subtitle(ln && tx(ln.who), ln && tx(ln.text)); }
    try { step?.(dt, T); } catch (e) { console.error(e); }
    if (!hold && T >= Math.max(total, minHold, (lines.at(-1)?.at ?? 0) + 3.2)) finish(false);
  });
  const api = { el, subtitle, get t() { return T; }, get done() { return done; }, finish, release: () => { hold = 0; }, restart: () => { T = 0; li = -1; },
    // botones de decisión en el centro inferior; devuelve el id elegido
    choice(opts, prompt) { return new Promise((res) => { const box = document.createElement('div'); box.className = 'story-choice';
      if (prompt) { const p = document.createElement('p'); p.textContent = tx(prompt); box.append(p); }
      for (const o of opts) { const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = tx(o.label); b.onclick = (e) => { e.stopPropagation(); box.remove(); res(o.id); }; box.append(b); }
      el.append(box); finished.then(() => { box.remove(); res(null); }); }); },
  };
  dbg('story', api);
  if (interactive) Promise.resolve().then(() => interactive(api)).catch((e) => console.error(e)).finally(() => { hold = 0; });
  return finished;
}
