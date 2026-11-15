// Epílogo · «Un gran salto» (después del desfile):
//  E.2 epílogos de personajes (tarjetas sobre la Tierra) con variaciones según las decisiones y la Confianza,
//  y la foto final de los tres (riendo o cada uno mirando a un lado);
//  E.3 la Base Tranquilidad hoy: etapa de descenso, bandera caída y un láser desde la Tierra en el retrorreflector,
//  con la voz real de Kennedy en la Universidad Rice (1962);
//  y el diagrama de flujo final estilo Detroit: decisiones elegidas frente a la ruta histórica (línea dorada).
import { dressUSFlag } from './us-flag.js';
import { THREE, setWorld, model } from '../../core/engine.js';
import { AUTO, store } from '../../core/store.js';
import { makeMoonSurface } from '../../scenes/moonsurface.js';
import { skySphere, earth, tickAll, glowSprite } from '../../scenes/space.js';
import { PAD } from '../../sim/lander.js';
import { a11sfx, stinger } from '../../audio/a11-score.js';
import { playA11, stopVoiceLine } from '../../audio/a11-voice.js';
import { run, chose, flagOf, unlock, hasCard, bitacoraProgress } from './state.js';
import { DECISIONS } from './decisions.js';
import { CHAPTERS } from './cards.js';
import { runCine, character, tx, L } from './cine.js';
import './epilogue.css';

export default async function epilogueScene() {
  if (AUTO()) { store.set('storyCompleted', true); return { skipped: false, auto: true }; }
  let skipped = false;
  try {
    const a = await characterPages(); skipped ||= a.skipped;
    const b = await tranquilityToday(); skipped ||= !!b?.skipped;
    await flowchart();
  } catch (e) { console.error('epílogo', e); }
  store.set('storyCompleted', true);
  return { skipped, trust: run.trust, morale: run.morale, historian: hasCard('historiador') };
}

// ---------------------------------------------------------------- E.2
function spaceWorld() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2000);
  scene.add(skySphere(900)); const E = earth(10, new THREE.Vector3(-0.8, 0.3, 0.5).normalize()); E.position.set(6, -2, -34); scene.add(E);
  camera.position.set(0, 0, 0); camera.lookAt(4, -1.4, -30);
  return { scene, camera, update: (dt, t) => { tickAll(scene, dt, t); camera.position.x = Math.sin(t * 0.05) * 0.6; camera.lookAt(4, -1.4, -30); },
    resize: () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }, dispose() { scene.clear(); } };
}

// Foto final de los tres (civiles de la Persona 1): con Confianza alta ríen y se miran; si no, cada uno mira a un lado
async function photoWorld(close) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1b1813);
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a241c, 1.4)); const key = new THREE.DirectionalLight(0xfff0d8, 2.2); key.position.set(2, 4, 5); scene.add(key);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: 0x8c8a80, roughness: 0.95 })); wall.position.set(0, 2.4, -1.4); scene.add(wall);
  const crew = (await Promise.all([['collins-civil', -0.85], ['armstrong-civil', 0], ['aldrin-civil', 0.85]].map(([n, x]) =>
    character(n, close ? 'talk' : 'idle', { at: [x, 0, 0], yaw: close ? -x * 0.55 : (x === 0 ? Math.PI * 0.18 : x * 1.6) }).catch(() => null)))).filter(Boolean);
  crew.forEach((c) => scene.add(c.root));
  camera.position.set(0, 1.55, 5.2); camera.lookAt(0, 1.25, 0);
  return { scene, camera, update: (dt) => crew.forEach((c) => c.update(dt)), resize: () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); },
    dispose() { wall.geometry.dispose(); wall.material.dispose(); scene.clear(); } };
}

function pages() {
  const kids = chose('c1-kids'), b1202 = chose('c4-1202'), first = chose('c1-firststep'), night = chose('c3-night');
  const P = [];
  P.push({ name: 'NEIL ARMSTRONG', text: ['Dejó la NASA en 1971 y enseñó ingeniería aeroespacial en la Universidad de Cincinnati. Evitó la fama toda su vida. Falleció en 2012.', 'He left NASA in 1971 and taught aerospace engineering at the University of Cincinnati. He avoided fame all his life. He died in 2012.'],
    quote: night === 'hand' ? ['Nunca habló en público de Karen. Pero aquella noche, en Columbia, alguien le puso una mano en el hombro.', 'He never spoke of Karen in public. But that night aboard Columbia, someone put a hand on his shoulder.'] : null });
  P.push({ name: 'BUZZ ALDRIN', text: ['Habló públicamente de su lucha contra la depresión tras la misión, algo poco común en su época, y se convirtió en un gran defensor de la exploración espacial.', 'He spoke publicly about his struggle with depression after the mission, rare for his time, and became a great champion of space exploration.'],
    quote: first === 'talk' ? ['Antes del vuelo, él y Neil hablaron de frente sobre el primer paso. Nunca volvió a ser un tema entre ellos.', 'Before the flight he and Neil talked face to face about the first step. It never came between them again.']
      : first === 'complain' ? ['Le llevó años hacer las paces con ser «el segundo».', 'It took him years to make peace with being “the second.”'] : null });
  P.push({ name: 'MICHAEL COLLINS', text: ['Dirigió el Museo Nacional del Aire y el Espacio del Smithsonian y escribió «Carrying the Fire» (1974), uno de los mejores libros escritos por un astronauta. Falleció en 2021.', 'He directed the Smithsonian’s National Air and Space Museum and wrote “Carrying the Fire” (1974), one of the best books ever written by an astronaut. He died in 2021.'],
    quote: flagOf('pat-words') ? ['Pat Collins: «Me contó que, detrás de la Luna, me habló en voz alta. Que así no estuvo tan solo».', 'Pat Collins: “He told me that behind the Moon he talked to me out loud. That it made him less alone.”'] : null, drama: !!flagOf('pat-words') });
  P.push({ name: L() ? 'STEVE BALES AND MISSION CONTROL' : 'STEVE BALES Y EL CONTROL DE MISIÓN', text: ['Steve Bales recibió la Medalla Presidencial de la Libertad en nombre del equipo de operaciones de la misión.', 'Steve Bales accepted the Presidential Medal of Freedom on behalf of the mission operations team.'],
    quote: b1202 === 'timeout' ? ['Bales: «Me quedé congelado. Gene me cubrió».', 'Bales: “I froze. Gene covered for me.”']
      : b1202 === 'abort' ? ['En la versión que viviste, Bales pidió abortar. En la real dijo GO, y tenía razón.', 'In the version you played, Bales called abort. In reality he said GO, and he was right.']
        : run.morale >= 60 ? ['Bales: «Teníamos diez segundos. Teníamos a Garman. Teníamos un equipo».', 'Bales: “We had ten seconds. We had Garman. We had a team.”'] : null, drama: true });
  P.push({ name: L() ? 'THE ARMSTRONG FAMILY' : 'LA FAMILIA ARMSTRONG', text: ['Jan escuchó todo el descenso por la squawk box que la NASA instaló en la casa. Rick tenía 12 años; Mark, 6.', 'Jan heard the whole descent on the squawk box NASA installed in the house. Rick was 12; Mark was 6.'],
    quote: kids === 'downplay' ? ['Rick: «Nos lo tendrías que haber dicho, papá».', 'Rick: “You should have told us, Dad.”']
      : kids === 'rocket' ? ['Durante el descenso, Rick no soltó a Mark. Ni el cohete de plástico.', 'During the descent Rick never let go of Mark. Or the plastic rocket.']
        : ['Rick: «Papá dijo que confiaba en ellos».', 'Rick: “Dad said he trusted them.”'], drama: true });
  const close = run.trust >= 60;
  P.push({ name: L() ? 'THE LAST PHOTO' : 'LA FOTO FINAL', photo: close,
    text: close ? ['Una foto de los tres riendo en la cuarentena.', 'A photo of the three of them laughing in quarantine.'] : ['La misma foto. Pero cada uno mira hacia un lado distinto.', 'The same photo. But each of them is looking a different way.'],
    quote: ['La historia no cambia. Cambia cómo la recordaron.', 'History does not change. How they remembered it does.'] });
  return P;
}

function characterPages() {
  const li = L(); const list = pages(); const sky = spaceWorld(); setWorld(sky);
  let photo = null;
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'epi'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<div class="epi-card" aria-live="polite"><div class="epi-k"></div><h2></h2><p class="epi-t"></p><blockquote></blockquote><div class="epi-nav"><span class="epi-n"></span><button type="button" class="epi-next"></button></div></div>`;
    document.body.append(el); requestAnimationFrame(() => el.classList.add('on'));
    let i = -1, timer = null, done = false;
    const next = async () => {
      clearTimeout(timer); i++;
      if (i >= list.length) return end(false);
      const p = list[i];
      if (p.photo !== undefined && !photo) { photo = await photoWorld(p.photo).catch(() => null); if (done) return; if (photo) { setWorld(photo); el.classList.add('photo', p.photo ? 'warm' : 'cold'); } }
      el.querySelector('.epi-k').textContent = (li ? 'EPILOGUE' : 'EPÍLOGO') + ' · ' + (li ? '1969 – TODAY' : '1969 – HOY');
      el.querySelector('h2').textContent = p.name; el.querySelector('.epi-t').textContent = tx(p.text);
      const q = el.querySelector('blockquote'); q.textContent = p.quote ? tx(p.quote) + (p.drama ? (li ? '  (dramatized)' : '  (dramatizado)') : '') : ''; q.hidden = !p.quote;
      el.querySelector('.epi-n').textContent = `${i + 1} / ${list.length}`;
      const b = el.querySelector('.epi-next'); b.textContent = i === list.length - 1 ? (li ? 'Continue' : 'Continuar') : (li ? 'Next' : 'Siguiente'); b.focus();
      el.querySelector('.epi-card').classList.remove('in'); void el.offsetWidth; el.querySelector('.epi-card').classList.add('in');
      timer = setTimeout(next, 11000);
    };
    const key = (e) => { if (e.repeat) return; if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); end(true); } else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); next(); } };
    addEventListener('keydown', key, true);
    el.querySelector('.epi-next').onclick = () => next();
    function end(sk) {
      if (done) return; done = true; clearTimeout(timer); removeEventListener('keydown', key, true);
      el.classList.remove('on'); setTimeout(() => { el.remove(); sky.dispose(); photo?.dispose(); }, 350);
      resolve({ skipped: sk });
    }
    next();
  });
}

// ---------------------------------------------------------------- E.3
async function tranquilityToday() {
  const W = makeMoonSurface({ seed: 7 });
  const x0 = PAD.x - 6, gy = (x, z) => W.hAt(x, z);
  W.setLM(x0, gy(x0, 0), 0, 0, false); W.lm.visible = false; if (W.pad) W.pad.visible = false; if (W.warn) W.warn.visible = false;
  const extra = [];
  // etapa de descenso de Eagle (la de ascenso despegó el 21 de julio de 1969)
  const lm = await model('apollo-lunar-module').catch(() => null);
  if (lm) { const asc = lm.getObjectByName('AscentStage'); if (asc) asc.visible = false; lm.position.set(x0, gy(x0, 0), 0); lm.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); W.scene.add(lm); extra.push(lm); }
  // bandera derribada por el chorro del motor de ascenso (Aldrin la vio caer)
  const flag = await model('flag-mast').catch(() => null);
  if (flag) { dressUSFlag(flag); flag.position.set(x0 + 7.5, gy(x0 + 7.5, 6) + 0.06, 6); flag.rotation.set(-Math.PI / 2 + 0.08, 0.6, 0); W.scene.add(flag); extra.push(flag); }
  // EASEP: sismómetro y retrorreflector (la lámina solar se recogió; las herramientas, fuera)
  const ea = await model('easep-props').catch(() => null); let lrrr = null;
  if (ea) {
    ea.position.x = x0; W.scene.add(ea); extra.push(ea);
    for (const n of ['SWC', 'Tools', 'BootPrints', 'lm-plaque', 'tongs']) { const o = ea.getObjectByName(n); if (o) o.visible = false; }
    for (const n of ['PSEP', 'LRRR']) { const o = ea.getObjectByName(n); if (o) o.position.y = gy(x0 + o.position.x, o.position.z); }
    lrrr = ea.getObjectByName('LRRR');
  }
  const target = new THREE.Vector3(x0 + 12, gy(x0 + 12, -8) + 0.3, -8);
  if (lrrr) { ea.updateMatrixWorld(true); lrrr.getWorldPosition(target); target.y += 0.25; }
  // láser verde desde la Tierra (en moonsurface la Tierra está en 900, 1100, −2600)
  const dir = new THREE.Vector3(900, 1100, -2600).sub(target).normalize(); const LEN = 700;
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x3dff6a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const haloMat = beamMat.clone(); haloMat.color.set(0x1a8f3a);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8, 1, true), beamMat);
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 12, 1, true), haloMat);
  const grp = new THREE.Group(); grp.add(beam, halo); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); grp.position.copy(target); W.scene.add(grp);
  const spark = glowSprite(0x7dff9a, 3, 0); spark.position.copy(target); W.scene.add(spark);
  const setBeam = (from, to, op) => { const a = Math.min(from, to), b = Math.max(from, to); const len = Math.max(0.01, (b - a) * LEN); beam.scale.y = halo.scale.y = len; beam.position.y = halo.position.y = (a * LEN) + len / 2; beamMat.opacity = op; haloMat.opacity = op * 0.25; };
  setBeam(0, 0, 0);
  const world = { scene: W.scene, camera: W.camera, update: (dt, t) => W.update(dt, t), resize: () => { W.camera.aspect = innerWidth / innerHeight; W.camera.updateProjectionMatrix(); } };
  W.camera.near = 0.1; W.camera.far = 6000; W.camera.updateProjectionMatrix();
  const P = (dx, y, z) => [x0 + dx, gy(x0 + dx, z) + y, z];
  let saidK = false, laserSfx = false;
  const KTXT = ['Elegimos ir a la Luna en esta década y hacer las otras cosas, no porque sean fáciles, sino porque son difíciles.', 'We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.'];
  const r = await runCine({
    id: 'epilogue-today', world, title: ['EPÍLOGO · MAR DE LA TRANQUILIDAD, HOY', 'EPILOGUE · SEA OF TRANQUILITY, TODAY'],
    shots: [
      { d: 9, pos: P(-14, 2.2, 10), look: P(0, 2, 0), fov: 40, to: { pos: P(-8, 1.6, 12), look: P(2, 1.6, 0), fov: 36 } }, // la etapa de descenso, sola
      { d: 7, pos: P(9, 1.1, 10), look: P(7.5, 0.2, 6), fov: 34, to: { pos: P(10, 0.9, 8.5), look: P(7.5, 0.1, 6), fov: 30 } }, // la bandera caída
      { d: 11, pos: [target.x - 6, target.y + 2.2, target.z + 7], look: [target.x, target.y, target.z], fov: 38, to: { pos: [target.x - 4, target.y + 1.6, target.z + 5], look: [target.x, target.y + 1.5, target.z], fov: 42 } }, // el láser
      { d: 16, pos: P(-20, 3, 18), look: [900, 1100, -2600], fov: 30, to: { pos: P(-22, 3.5, 20), look: [900, 1100, -2600], fov: 18 } }, // la Tierra
    ],
    lines: [
      { at: 1.5, who: L() ? 'JOHN F. KENNEDY · RICE UNIVERSITY, 1962 · REAL' : 'JOHN F. KENNEDY · UNIVERSIDAD RICE, 1962 · REAL', text: KTXT },
      { at: 26, who: '', text: ['Seis misiones Apolo alunizaron entre 1969 y 1972. Doce personas caminaron sobre la Luna.', 'Six Apollo missions landed between 1969 and 1972. Twelve people walked on the Moon.'] },
      { at: 32, who: '', text: ['Unas 400.000 personas hicieron posible el programa.', 'Some 400,000 people made the program possible.'] },
      { at: 37, who: '', text: ['Hoy, el programa Artemis prepara el regreso.', 'Today, the Artemis program is preparing the return.'] },
    ],
    step(dt, T) {
      if (!saidK && T > 1.2) { saidK = true; playA11('nasa_real/epi_kennedy_rice_elegimos_ir_luna', { vol: 0.9 }); }
      // el pulso: baja de la Tierra (16→18 s), destello en el reflector, vuelve (19→21 s); luego pulsos tenues
      const lt = T - 16;
      if (lt > 0 && !laserSfx) { laserSfx = true; a11sfx('e_e3_laser_retrorreflector', 0.7); }
      if (lt < 0) setBeam(0, 0, 0);
      else if (lt < 2) { const k = lt / 2; setBeam(1 - k, 1, 0.9); }
      else if (lt < 3) { setBeam(0, 1, 0.9); spark.material.opacity = 1 - (lt - 2); spark.scale.setScalar(3 + (lt - 2) * 6); }
      else if (lt < 5) { const k = (lt - 3) / 2; setBeam(k, 1, 0.9 * (1 - k * 0.5)); spark.material.opacity = 0; }
      else { const pulse = 0.25 + 0.2 * Math.sin(T * 3); setBeam(0, 1, Math.max(0, pulse) * Math.max(0, 1 - (lt - 5) / 18)); }
    },
  });
  stopVoiceLine();
  for (const o of extra) o.removeFromParent();
  for (const m of [beam, halo]) m.geometry.dispose(); beamMat.dispose(); haloMat.dispose(); spark.material.dispose();
  return r;
}

// ---------------------------------------------------------------- diagrama de flujo
function flowchart() {
  const li = L();
  let p = bitacoraProgress();
  if (!hasCard('historiador') && p.got >= p.total - 1) { unlock('historiador'); p = bitacoraProgress(); }
  const historian = hasCard('historiador');
  stinger(historian ? 'mus_stinger_insignia_capitulo_100' : 'mus_stinger_ruta_historica_dorada');
  const sky = spaceWorld(); setWorld(sky);
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'epi epi-flow-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', li ? 'Mission flowchart' : 'Diagrama de la misión');
    const ids = Object.keys(DECISIONS); const lived = ids.filter((id) => run.choices[id]); const onRoute = lived.filter((id) => run.choices[id].historic).length;
    el.innerHTML = `<div class="epi-flow"><header><div class="epi-k">${li ? 'APOLLO 11 · MISSION FLOWCHART' : 'APOLO 11 · DIAGRAMA DE LA MISIÓN'}</div>
      <h2>${li ? 'Your route' : 'Tu ruta'}</h2>
      <p class="epi-legend"><i class="g"></i>${li ? 'Historical route' : 'Ruta histórica'} <i class="c"></i>${li ? 'Your choice' : 'Tu elección'} <i class="n"></i>${li ? 'Not taken' : 'No tomada'}</p>
      <div class="epi-stats"></div>${historian ? `<div class="epi-hist">${li ? 'APOLLO HISTORIAN' : 'HISTORIADOR DEL APOLO'}</div>` : ''}</header>
      <div class="epi-chs"></div><div class="epi-foot"><button type="button" class="epi-next">${li ? 'Continue' : 'Continuar'}</button></div></div>`;
    const stats = el.querySelector('.epi-stats');
    const bar = (label, v) => { const d = document.createElement('div'); d.className = 'epi-bar'; d.innerHTML = `<span></span><p><i></i></p><b></b>`; d.querySelector('span').textContent = label; d.querySelector('i').style.width = v + '%'; d.querySelector('b').textContent = v + (label.includes('%') ? '' : ''); return d; };
    stats.append(bar(li ? 'Crew trust' : 'Confianza de la tripulación', run.trust), bar(li ? 'Mission Control morale' : 'Moral del Control de Misión', run.morale), bar(li ? 'Log complete (%)' : 'Bitácora completa (%)', p.pct));
    const sum = document.createElement('p'); sum.className = 'epi-sum';
    sum.textContent = li ? `${onRoute} of ${lived.length} decisions on the historical route.` : `${onRoute} de ${lived.length} decisiones en la ruta histórica.`; stats.append(sum);
    const chs = el.querySelector('.epi-chs');
    const byCh = {}; for (const id of ids) (byCh[DECISIONS[id].ch] ||= []).push(id);
    for (const ch of Object.keys(byCh).map(Number).sort((a, b) => a - b)) {
      const sec = document.createElement('section'); sec.className = 'epi-ch'; const h = document.createElement('h3'); h.textContent = tx(CHAPTERS[ch]); sec.append(h);
      for (const id of byCh[ch]) {
        const D = DECISIONS[id], c = run.choices[id];
        const node = document.createElement('div'); node.className = 'epi-node' + (c ? (c.historic ? ' on-route' : ' off-route') : ' unlived');
        const q = document.createElement('div'); q.className = 'epi-q'; q.textContent = tx(D.prompt); node.append(q);
        const row = document.createElement('div'); row.className = 'epi-opts';
        const opts = D.options.filter((o) => !o.hidden || (c && c.opt === o.id));
        for (const o of opts) {
          const s = document.createElement('span'); s.className = 'epi-opt' + (o.historic ? ' hist' : '') + (c && c.opt === o.id ? ' chosen' : '');
          s.textContent = o.label ? tx(o.label) : (o.id === 'timeout' ? (li ? 'No answer (Kranz decided)' : 'Sin respuesta (decidió Kranz)') : o.id);
          row.append(s);
        }
        node.append(row);
        if (!c) { const u = document.createElement('small'); u.textContent = li ? 'Not lived in this playthrough' : 'No vivida en esta partida'; node.append(u); }
        sec.append(node);
      }
      chs.append(sec);
    }
    document.body.append(el); requestAnimationFrame(() => el.classList.add('on'));
    const btn = el.querySelector('.epi-next'); btn.focus();
    const key = (e) => { if (e.repeat) return; if (e.code === 'Escape' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
    addEventListener('keydown', key, true); btn.onclick = close;
    let closed = false;
    function close() { if (closed) return; closed = true; removeEventListener('keydown', key, true); el.classList.remove('on'); setTimeout(() => { el.remove(); sky.dispose(); }, 350); resolve(); }
  });
}
