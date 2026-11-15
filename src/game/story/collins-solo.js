// Cap. 6.1 · «El lado silencioso»: Collins solo en Columbia mientras Eagle está en la superficie. Cada vuelta pasa unos
// 48 minutos sin radio detrás de la Luna. Voz en off real de sus memorias, la ventana trasera, la libreta y la decisión
// c6-collins. Evento oculto «El cartógrafo solitario»: fotografiar los 6 puntos de referencia en una sola pasada
// (clic/toque sobre la marca o F). Mundo: la cabina de night.js a oscuras y una Luna grande bajo la ventana de la escotilla.
import { THREE, tex } from '../../core/engine.js';
import { runCine, tx } from './cine.js';
import { unlock, setFlag, hearHint } from './state.js';
import { ask } from './decisions.js';
import { playA11 } from '../../audio/a11-voice.js';
import { a11sfx } from '../../audio/a11-score.js';
import { makeColumbia, floater, wait } from './night.js';
import './collins-solo.css';

const TITLE = ['CAP. 6 · EL LADO SILENCIOSO', 'CH. 6 · THE SILENT SIDE'];
// puntos de referencia de la aproximación al Mar de la Tranquilidad (Apollo 11 Flight Journal)
const MARKS = [
  ['Monte Marilyn', 'Mount Marilyn'], ['Cráter Maskelyne', 'Maskelyne crater'], ['Rima Sidewinder', 'Sidewinder rille'],
  ['Boot Hill', 'Boot Hill'], ['Cráter Moltke', 'Moltke crater'], ['Mar de la Tranquilidad', 'Sea of Tranquility'],
];
const R = 640, CEN = new THREE.Vector3(0, -600, 400); // Luna bajo la ventana: la superficie queda a ~80 m de la cámara

function labelSprite(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  x.strokeStyle = '#ffcf6a'; x.lineWidth = 6; x.beginPath(); x.arc(80, 80, 52, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#ffcf6a'; x.font = '600 44px Chakra, sans-serif'; x.textBaseline = 'middle'; x.fillText(text, 150, 82);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, opacity: 0 }));
  s.scale.set(26, 8.1, 1); s.center.set(0.16, 0.5); s.renderOrder = 5; return s;
}

export default async function collinsSolo() {
  let W = null; const cleanup = [];
  try {
    W = await makeColumbia({ light: 'dark', spin: 0, withEarth: false, withMoon: false });
    const mike = await floater(W, 'collins-vuelo', { x: 0.15, y: 1.45, z: -0.35, tilt: Math.PI / 2, phase: 0.8 });
    // Luna grande con brillo propio (la cabina sigue a oscuras) y sus marcas
    const lunaMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xd8d2c6, emissiveMap: tex('/tex/moon_2k.jpg'), emissiveIntensity: 0.85, roughness: 1 });
    const luna = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), lunaMat); luna.position.copy(CEN); W.scene.add(luna);
    const d0 = new THREE.Vector3(0, 1.2, 1.2).sub(CEN).normalize(); // dirección del centro hacia la ventana
    const PHI = MARKS.map((_, i) => 0.35 + i * 0.2), marks = MARKS.map((name, i) => {
      const s = labelSprite(tx(name)); const p = d0.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -PHI[i]).multiplyScalar(R + 1.5);
      p.x += (i % 2 ? -1 : 1) * (6 + (i % 3) * 5); s.position.copy(p); luna.add(s); return { s, name, shot: false, phi: PHI[i] };
    });
    let sweep = null; // { r } mientras pasan las marcas
    const view = (a) => (a ? { pos: [a.head.x + 0.18, a.head.y - 0.32, a.head.z + 0.78], look: [a.head.x, a.head.y, a.head.z], fov: 42 } : null);
    const WIDE = { pos: [0.42, 1.5, 0.92], look: [-0.15, 2.0, -0.1], fov: 72 };
    const HATCH = { pos: [0, 1.2, 1.22], look: [0, 0.55, 3.2], fov: 54 };
    const STARS = { pos: [-0.82, 1.24, 0.45], look: [-3.2, 1.6, 1.4], fov: 56 };
    W.setShot(WIDE, { cut: true });
    const baseUpdate = W.update;
    W.update = (dt, t) => {
      if (sweep) { if (sweep.v) sweep.r = Math.min(sweep.end, sweep.r + dt * sweep.v); luna.rotation.x = sweep.r; }
      baseUpdate(dt, t);
      if (sweep) for (const m of marks) { const d = Math.abs(sweep.r - m.phi); m.s.material.opacity = m.shot ? 0.25 : Math.max(0, 1 - d / 0.4); }
    };
    const line = (S, who, text, clip) => { S.subtitle(who, tx(text)); if (clip) playA11('voz_en_clonada/' + clip); };
    const r = await runCine({
      id: 'collins-solo', world: W, title: TITLE,
      async interactive(S) {
        hearHint('h-cartografo');
        S.subtitle('', tx(['Órbita lunar, 21 de julio de 1969. Eagle está en la superficie. Columbia pasa detrás de la Luna en cada vuelta.', 'Lunar orbit, July 21, 1969. Eagle is on the surface. Columbia passes behind the Moon every orbit.']));
        await wait(S, 4.2); if (S.done) return;
        a11sfx('c3_34_radio_corte_los', 0.8);
        S.subtitle('', tx(['PÉRDIDA DE SEÑAL. Unos 48 minutos sin contacto con nadie.', 'LOSS OF SIGNAL. About 48 minutes out of contact with anyone.']));
        await wait(S, 3.4); if (S.done) return;
        if (mike) W.setShot(view(mike), { speed: 0.6 });
        line(S, 'COLLINS', ['Ahora estoy solo, verdaderamente solo, y absolutamente aislado de cualquier vida conocida. Lo soy. Si se hiciera un recuento: tres mil millones más dos al otro lado de la Luna, y uno más, solo Dios sabe qué, de este lado.', 'I am alone now, truly alone, and absolutely isolated from any known life. I am it. If a count were taken, the score would be three billion plus two over on the other side of the Moon, and one plus God knows what on this side.'], 'c6_61_collins_solo_vo_en');
        await wait(S, 13.5); if (S.done) return;
        // objetos de la cabina, en el orden que elija el jugador
        const left = new Set(['window', 'notebook']);
        while (left.size && !S.done) {
          const opts = [];
          if (left.has('window')) opts.push({ id: 'window', label: ['Mirar por la ventana trasera', 'Look out the rear window'] });
          if (left.has('notebook')) opts.push({ id: 'notebook', label: ['Abrir la libreta', 'Open the notebook'] });
          opts.push({ id: 'on', label: ['Seguir', 'Go on'] });
          const pick = await S.choice(opts); if (pick === null || S.done) return;
          if (pick === 'on') break; left.delete(pick);
          if (pick === 'window') { W.setShot(STARS, { speed: 0.8 }); S.subtitle('', tx(['Un cielo cubierto de estrellas, más denso que el que nunca vio desde la Tierra. Detrás de la Luna no hay radio: la Luna misma tapa las antenas de la Tierra.', 'A sky crowded with stars, denser than any he ever saw from Earth. Behind the Moon there is no radio: the Moon itself blocks Earth’s antennas.'])); unlock('ventana-trasera'); await wait(S, 5.5); }
          else { if (mike) W.setShot(view(mike), { speed: 0.8 }); line(S, 'COLLINS', ['Mi miedo secreto de los últimos seis meses ha sido dejarlos en la Luna y volver solo a la Tierra.', 'My secret terror for the last six months has been leaving them on the Moon and returning to Earth alone.'], 'c6_obj_collins_libreta_en'); unlock('libreta-collins'); await wait(S, 6.6); }
        }
        if (S.done) return;
        // evento oculto: la pasada de los puntos de referencia
        W.setShot(HATCH, { speed: 0.7 });
        S.subtitle('', tx(['Pasa la superficie. Collins busca a Eagle con el sextante, sin verlo. Puede fotografiar los puntos de referencia (clic, toque o F).', 'The surface slides by. Collins searches for Eagle with the sextant, without seeing it. He can photograph the landmarks (click, tap or F).']));
        const flash = document.createElement('div'); flash.className = 'cs-flash'; document.body.append(flash); cleanup.push(() => flash.remove());
        const count = document.createElement('div'); count.className = 'cs-count'; document.body.append(count); cleanup.push(() => count.remove());
        let got = 0; const paint = () => { count.textContent = `${tx(['Puntos de referencia', 'Landmarks'])} ${got}/${marks.length}`; }; paint();
        const pos = new THREE.Vector3();
        const visible = () => marks.filter((m) => !m.shot && m.s.material.opacity > 0.35).map((m) => { m.s.getWorldPosition(pos); pos.project(W.camera); return { m, x: (pos.x + 1) / 2 * innerWidth, y: (1 - pos.y) / 2 * innerHeight, z: pos.z }; }).filter((v) => v.z < 1 && v.x > 0 && v.x < innerWidth && v.y > 0 && v.y < innerHeight);
        const snap = (px, py, radius) => {
          a11sfx('c5_56_hasselblad_disparo', 0.7); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
          const hit = visible().map((v) => ({ ...v, d: Math.hypot(v.x - px, v.y - py) })).filter((v) => v.d < radius).sort((a, b) => a.d - b.d)[0];
          if (!hit) return; hit.m.shot = true; got++; paint(); S.subtitle('COLLINS', `${tx(hit.m.name)} · ${got}/${marks.length}`);
        };
        const onDown = (e) => { if (e.target?.closest?.('button, .plb-letterbox, .dec-overlay, .bit')) return; snap(e.clientX, e.clientY, 70); };
        const onKey = (e) => { if (e.code === 'KeyF' && !e.repeat) { e.preventDefault(); snap(innerWidth / 2, innerHeight / 2, Math.min(innerWidth, innerHeight) * 0.35); } };
        addEventListener('pointerdown', onDown); addEventListener('keydown', onKey);
        cleanup.push(() => { removeEventListener('pointerdown', onDown); removeEventListener('keydown', onKey); });
        const r0 = PHI[0] - 0.45, r1 = PHI[PHI.length - 1] + 0.45; sweep = { r: r0, end: r1, v: (r1 - r0) / 30 }; // unos 30 s de pasada
        await new Promise((res) => { const iv = setInterval(() => { if (S.done || sweep.r >= r1 || got === marks.length) { clearInterval(iv); res(); } }, 100); });
        sweep.v = 0;
        cleanup.splice(0).forEach((f) => f());
        if (S.done) return;
        if (got === marks.length) { unlock('h-cartografo'); S.subtitle('', tx(['Los seis puntos de referencia en una sola pasada. Servían para navegar; Eagle, en cambio, nunca apareció en el visor.', 'All six landmarks in a single pass. They were used to navigate; Eagle, however, never showed up in the eyepiece.'])); }
        else S.subtitle('', tx(['Collins nunca logró ver a Eagle desde la órbita (hecho real).', 'Collins never managed to spot Eagle from orbit (true story).']));
        await wait(S, 4.2); if (S.done) return;
        W.setShot(WIDE, { speed: 0.6 });
        const opt = await ask('c6-collins'); if (S.done) return;
        if (opt === 'work') { if (mike) W.setShot(view(mike), { speed: 0.8 }); S.subtitle('', tx(['Collins repasa su libreta: dieciocho variantes de encuentro por si el ascenso de Eagle no sale según el plan. Tendrá un plan B.', 'Collins goes over his notebook: eighteen rendezvous variants in case Eagle’s ascent does not go to plan. He will have a plan B.'])); await wait(S, 5.2); }
        else if (opt === 'look') { W.setShot(STARS, { speed: 0.4 }); S.subtitle('', tx(['(Apaga la luz del panel. Solo estrellas. Y silencio.)', '(He switches off the panel light. Only stars. And silence.)'])); await wait(S, 6.5); }
        else if (opt === 'pat') { setFlag('pat-words', true); if (mike) W.setShot(view(mike), { speed: 0.8 }); line(S, 'COLLINS', ['Pat… ojalá pudieras ver esto. Hay más estrellas que oscuridad. Y aquí arriba pienso en ti más de lo que pensé.', 'Pat… I wish you could see this. There are more stars than dark. And up here I think about you more than I thought I would.']); await wait(S, 5.5); }
        if (S.done) return;
        a11sfx('c3_34_radio_vuelve_aos', 0.8);
        S.subtitle('HOUSTON', tx(['…Columbia, aquí Houston. Los recibimos de nuevo.', '…Columbia, this is Houston. We have you again.']));
        await wait(S, 3.4);
      },
    });
    return r;
  } catch (e) { console.error('collins-solo', e); return { id: 'collins-solo', skipped: true, error: String(e) }; }
  finally { cleanup.forEach((f) => { try { f(); } catch {} }); W?.dispose(); }
}
