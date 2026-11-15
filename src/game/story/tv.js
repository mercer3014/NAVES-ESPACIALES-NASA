// Cap. 7.2 · «La última transmisión» (23 jul 1969): los tres frente a la cámara de TV dentro de Columbia, en blanco y negro.
// Fragmentos reales de NASA Day 8 Highlights (Collins, Aldrin, Armstrong), recortados a ~15–24 s cada uno; saltable.
// Mundo: cm-interior.glb + armstrong/aldrin/collins-civil flotando (clips idle/talk). Imagen de TV: filtro sobre #gl + barrido.
import { THREE, model } from '../../core/engine.js';
import { playA11 } from '../../audio/a11-voice.js';
import { runCine, character, tx } from './cine.js';
import './moon-scenes.css';

const TITLE = ['CAP. 7 · LA ÚLTIMA TRANSMISIÓN', 'CH. 7 · THE LAST BROADCAST'];
// clip → [desde (s), hasta (s)] dentro del archivo: el final de cada mensaje, donde está el fragmento del guion
const CLIPS = {
  collins: ['nasa_real/cap7_ultima_tv_collins', 122.6, 137.3],
  aldrin: ['nasa_real/cap7_ultima_tv_aldrin', 11.6, 35.6],
  armstrong: ['nasa_real/cap7_ultima_tv_armstrong', 0, 18.9],
};
const T_COL = 3, T_ALD = 18.6, T_ARM = 43.4, T_END = 63;

export default async function tvScene() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050608);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.03, 40);
  scene.add(new THREE.AmbientLight(0xbfc6d0, 0.55));
  const flood = new THREE.PointLight(0xfff1dc, 2.4, 6, 1.4); flood.position.set(0.2, 1.9, 0.9); scene.add(flood);
  const fill = new THREE.PointLight(0xdfe8ff, 1.1, 5, 1.6); fill.position.set(-0.9, 1.0, 1.2); scene.add(fill);
  const cab = await model('cm-interior').catch((e) => { console.warn('cm-interior.glb no disponible', e); return null; });
  if (cab) cab.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.material)) if (mat && /^CMI-(Pared|Mamparo)/.test(mat.name)) { mat.side = THREE.DoubleSide; mat.needsUpdate = true; } }); // G4
  if (cab) { cab.traverse((c) => { if (c.isMesh) c.frustumCulled = false; }); scene.add(cab); }
  // de izquierda a derecha en la imagen: Collins, Armstrong, Aldrin; ingrávidos sobre los asientos, frente a la cámara (+Z)
  const SPOTS = { collins: [-0.5, -0.56, -0.18, 0.18], armstrong: [0.02, -0.5, -0.42, 0], aldrin: [0.52, -0.6, -0.22, -0.16] };
  const crew = {};
  await Promise.all(Object.entries(SPOTS).map(async ([k, [x, y, z, yaw]]) => {
    const c = await character(k + '-vuelo', 'idle', { at: [x, y, z], yaw }).catch((e) => { console.warn(k + '-vuelo.glb no disponible', e); return null; });
    if (c) { crew[k] = { ...c, y0: y, ph: Math.random() * 6 }; scene.add(c.root); }
  }));
  const speak = (who) => { for (const [k, c] of Object.entries(crew)) c.play(k === who ? 'talk' : 'idle', { fade: 0.4 }); };
  let clip = null; const stopClip = () => { clip?.stop(); clip = null; };
  const play = (k) => {
    const [file, from, to] = CLIPS[k]; stopClip(); speak(k);
    const h = playA11(file); if (!h) return; clip = h;
    const seek = () => { if (from > 0 && h.seek() < from - 0.5) h.seek(from); };
    if (h.state() === 'loaded') seek(); else h.once('load', seek); h.once('play', seek);
    const me = h; setTimeout(() => { if (clip === me) stopClip(); }, (to - from + 0.4) * 1000);
  };
  const fired = new Set(); const at = (T, k, f) => { if (T >= k && !fired.has(k)) { fired.add(k); f(); } };
  const world = {
    scene, camera,
    update(dt, t) { for (const c of Object.values(crew)) { c.update(dt); c.root.position.y = c.y0 + Math.sin(t * 0.7 + c.ph) * 0.025; c.root.rotation.z = Math.sin(t * 0.45 + c.ph) * 0.03; } },
    resize: () => {},
  };
  const step = (dt, T) => { at(T, T_COL, () => play('collins')); at(T, T_ALD, () => play('aldrin')); at(T, T_ARM, () => play('armstrong')); at(T, T_END - 1, () => speak(null)); };

  // imagen de televisión de 1969: blanco y negro, líneas de barrido y rótulo
  const fx = document.createElement('div'); fx.className = 'tvfx'; fx.innerHTML = '<b></b>';
  fx.querySelector('b').textContent = tx(['EN VIVO · APOLO 11 · 23 JUL 1969', 'LIVE · APOLLO 11 · JUL 23, 1969']);
  document.body.append(fx); document.body.classList.add('tv-bw');
  const wide = { pos: [0, 1.12, 1.25], look: [0, 1.05, -0.35], fov: 54 };
  const on = (x) => ({ pos: [x * 0.55, 1.14, 0.75], look: [x, 1.12, -0.3], fov: 40 });
  try {
    return await runCine({
      id: 'tv', world, title: TITLE, step, minHold: T_END,
      shots: [
        { d: T_COL, ...wide, to: { ...wide, fov: 52 } },
        { d: T_ALD - T_COL, ...on(-0.5), to: { ...on(-0.5), fov: 37 } },
        { d: T_ARM - T_ALD, ...on(0.52), to: { ...on(0.52), fov: 37 } },
        { d: T_END - 6 - T_ARM, ...on(0.02), to: { ...on(0.02), fov: 37 } },
        { d: 6, ...wide, to: { ...wide, pos: [0, 1.15, 1.45], fov: 56 } },
      ],
      lines: [
        { at: 0.3, who: '', text: ['23 de julio de 1969. Última transmisión de televisión desde Columbia, la víspera del amerizaje.', 'July 23, 1969. The last television broadcast from Columbia, the eve of splashdown.'] },
        { at: T_COL, who: 'COLLINS', text: ['…Todo lo que ven somos nosotros tres, pero bajo la superficie hay miles y miles de personas más…', '…All you see is the three of us, but beneath the surface are thousands and thousands of others…'] },
        { at: T_COL + 7.3, who: 'COLLINS', text: ['…y a todas ellas me gustaría decirles: muchas gracias.', '…and to all of those, I would like to say, thank you very much.'] },
        { at: T_ALD, who: 'ALDRIN', text: ['…más, incluso, que el esfuerzo de un gobierno y de la industria; más aún que el de una nación.', '…more, still, than the efforts of a government and industry team; more, even, than the efforts of one nation.'] },
        { at: T_ALD + 11, who: 'ALDRIN', text: ['Creemos que es un símbolo de la curiosidad insaciable de toda la humanidad por explorar lo desconocido.', 'We feel that this stands as a symbol of the insatiable curiosity of all mankind to explore the unknown.'] },
        { at: T_ARM, who: 'ARMSTRONG', text: ['…A esas personas, esta noche, les damos un agradecimiento especial…', '…To those people tonight, we give a special thank you…'] },
        { at: T_ARM + 8.5, who: 'ARMSTRONG', text: ['…y a todas las demás que nos escuchan y nos ven: Dios los bendiga. Buenas noches desde el Apolo 11.', '…and to all the other people that are listening and watching tonight, God bless you. Good night from Apollo 11.'] },
      ],
    });
  } catch (e) { console.error('tv', e); return { played: false, skipped: true }; }
  finally { stopClip(); fx.remove(); document.body.classList.remove('tv-bw'); }
}
