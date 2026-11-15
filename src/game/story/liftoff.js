// Cap. 6.3 · «Despegue de la Luna» (21 jul 1969, 17:54 UTC): un solo botón. Cuenta real de Aldrin, encendido del motor de
// ascenso, la etapa de descenso queda como plataforma y la bandera cae por el chorro (hecho real). Tras terminar el juego
// (store 'storyCompleted') se ofrece el «¿Y si…?» con el discurso que Safire escribió por si el motor no encendía.
// Mundo: superficie lunar de las fases (moonsurface.js) con el LM-5 del artista (nodo AscentStage) y flag-mast.glb.
import { dressUSFlag } from './us-flag.js';
import { THREE, model } from '../../core/engine.js';
import { store, shared, AUTO } from '../../core/store.js';
import { makeMoonSurface } from '../../scenes/moonsurface.js';
import { makePlume } from '../../scenes/fx.js';
import { ground, PAD } from '../../sim/lander.js';
import { playA11 } from '../../audio/a11-voice.js';
import { a11sfx } from '../../audio/a11-score.js';
import { unlock } from './state.js';
import { runCine, tx, L } from './cine.js';
import './moon-scenes.css';

const TITLE = ['CAP. 6 · DESPEGUE DE LA LUNA', 'CH. 6 · LUNAR LIFTOFF'];
const ACC = 1.8; // m/s² netos de la etapa de ascenso (empuje 15,6 kN, ~4,9 t, gravedad lunar 1,62)
const smooth = (u) => { const k = Math.min(1, Math.max(0, u)); return k * k * (3 - 2 * k); };

export default async function liftoffScene() {
  let W;
  try { W = makeMoonSurface({ seed: 11 }); } catch (e) { console.error('liftoff: superficie', e); return { played: false, skipped: true }; }
  const lx = shared.landing?.x ?? PAD.x - 6, ly = ground(lx); W.setLM(lx, ly, 0, 0, false);
  await Promise.race([W.lmReady, new Promise((r) => setTimeout(r, 7000))]);
  const cam = W.camera; cam.fov = 40; cam.near = 0.1; cam.updateProjectionMatrix();

  // etapa de ascenso: el nodo del artista; con el modelo viejo de respaldo se mueve todo el LM
  const asc = W.body.getObjectByName('AscentStage') || W.body; const asc0 = asc.position.clone();
  const plume = makePlume({ layout: [[0, 0]], r0: 0.32, len: 2.4, outerR: 0.9, outerLen: 7, hot: [1, 0.92, 0.78], warm: [0.82, 0.62, 0.95], intensity: 1.5, seg: 12 });
  plume.group.position.y = asc === W.body ? 2.4 : 0.05; asc.add(plume.group);

  // bandera a ~9 m, en primer plano de la cámara (lado del sol)
  const flagP = new THREE.Vector3(lx - 8.5, 0, 3.2); flagP.y = W.hAt ? W.hAt(flagP.x, flagP.z) : ground(flagP.x, flagP.z);
  const flag = await model('flag-mast').catch((e) => { console.warn('flag-mast.glb no disponible', e); return null; });
  if (flag) { dressUSFlag(flag); flag.position.copy(flagP); flag.rotation.y = -0.6; flag.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); W.scene.add(flag); }

  // jirones de Kapton dorado que salen despedidos al encender (300 partículas, caída a 1/6 g sin aire)
  const N = 300, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const shards = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: 0xffd27a, size: 0.12, transparent: true, opacity: 0, depthWrite: false }));
  shards.frustumCulled = false; W.scene.add(shards);
  const burst = () => {
    const base = new THREE.Vector3(); asc.getWorldPosition(base);
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, s = 4 + Math.random() * 9;
      pos.set([base.x + Math.cos(a) * 1.6, base.y + Math.random() * 0.6, base.z + Math.sin(a) * 1.6], i * 3);
      vel.set([Math.cos(a) * s, 1.5 + Math.random() * 6, Math.sin(a) * s], i * 3); }
    shards.geometry.attributes.position.needsUpdate = true; shards.material.opacity = 1;
  };

  // estado de la escena (la cámara la lleva step(): la escena espera al botón, así que no hay riel fijo)
  const lmC = new THREE.Vector3(lx, ly + 3.4, 0);
  const C0 = new THREE.Vector3(lx - 15.5, flagP.y + 1.55, 6.4), look = lmC.clone(), lookTo = new THREE.Vector3(), ascW = new THREE.Vector3();
  let ign = -1, fall = 0, safire = false, shake = 0;
  cam.position.copy(C0); cam.lookAt(look);

  const step = (dt) => {
    if (ign >= 0) {
      const t = (ign += dt);
      { const up = 0.5 * ACC * t * t, side = t > 9 ? 0.5 * 1.1 * (t - 9) ** 2 : 0; asc.position.set(asc0.x + side, asc0.y + up, asc0.z); asc.rotation.z = -Math.min(0.9, Math.max(0, t - 8) * 0.12); }
      plume.set(1, { vac: 1, t }); shake = Math.max(0, 0.06 - t * 0.012);
      if (t > 0.55) fall = Math.min(1, fall + dt / 1.15);
      for (let i = 0; i < N; i++) { vel[i * 3 + 1] -= 1.62 * dt; for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt; if (pos[i * 3 + 1] < ly) { pos[i * 3 + 1] = ly; vel[i * 3] *= 0.6; vel[i * 3 + 2] *= 0.6; vel[i * 3 + 1] = 0; } }
      shards.geometry.attributes.position.needsUpdate = true; shards.material.opacity = Math.max(0, 1 - t / 9);
      asc.getWorldPosition(ascW); lookTo.copy(ascW); lookTo.y += asc === W.body ? 3 : 1.2;
      look.lerp(lookTo, Math.min(1, dt * 3));
      cam.position.lerp(new THREE.Vector3(C0.x - Math.min(20, t * 1.2), C0.y + Math.min(9, t * 0.7), C0.z + Math.min(12, t * 0.8)), Math.min(1, dt * 0.8));
    } else if (!safire) { look.lerp(lmC, Math.min(1, dt * 2)); }
    if (flag) { const k = smooth(fall); flag.rotation.z = k * 1.42 + (k > 0.98 ? Math.sin(performance.now() / 90) * 0.004 : 0); }
    cam.lookAt(look); if (shake > 0) { cam.position.x += (Math.random() - 0.5) * shake; cam.position.y += (Math.random() - 0.5) * shake; }
  };
  const world = { scene: W.scene, camera: cam, update: (dt, t) => W.update(dt, t), resize: () => {} };

  try {
    const r = await runCine({
      id: 'liftoff', world, title: TITLE, step, minHold: 1,
      async interactive(S) {
        const sleep = (s) => new Promise((res) => { const t0 = S.t; const iv = setInterval(() => { if (S.done || S.t - t0 >= s) { clearInterval(iv); res(); } }, 50); });
        S.subtitle('', tx(['21 de julio de 1969 · 17:54 UTC · Base Tranquilidad. La música se apaga.', 'July 21, 1969 · 17:54 UTC · Tranquility Base. The music stops.']));
        await sleep(2.6); if (S.done) return;
        playA11('nasa_real/cap6_despegue_lunar_cuenta');
        S.subtitle('ALDRIN', '9, 8, 7, 6, 5…'); await sleep(4.2); if (S.done) return;
        S.subtitle('ALDRIN', tx(['Separación de aborto. Motor armado.', 'Abort stage. Engine arm.'])); await sleep(2.4); if (S.done) return;
        S.subtitle('ALDRIN', tx(['Ascenso. Proceder.', 'Ascent. Proceed.'])); await sleep(1.4); if (S.done) return;
        // un solo botón: encender el motor de ascenso
        await new Promise((res) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'ign-btn';
          b.innerHTML = `${tx(['ENCENDER<br>ASCENSO', 'ASCENT<br>ENGINE ON'])}<small>${L() ? 'SPACE' : 'ESPACIO'}</small>`;
          const go = () => { removeEventListener('keydown', key, true); clearInterval(iv); b.remove(); res(); };
          const key = (e) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); e.stopPropagation(); go(); } };
          b.onclick = go; S.el.append(b); b.focus(); addEventListener('keydown', key, true);
          const iv = setInterval(() => { if (S.done) go(); }, 100);
          if (AUTO()) setTimeout(go, 300);
        });
        if (S.done) return;
        ign = 0; burst(); a11sfx('c6_63_despegue_lunar_ascenso', 0.85);
        S.subtitle('', tx(['Encendido. La etapa de descenso se queda como plataforma de lanzamiento.', 'Ignition. The descent stage stays behind as a launch pad.']));
        await sleep(2.4); if (S.done) return;
        playA11('nasa_real/cap6_despegue_lunar_bonito');
        S.subtitle('ALDRIN', tx(['Precioso. 26, 36 pies por segundo, subiendo.', 'That was beautiful. 26, 36 feet per second up.'])); await sleep(4.6); if (S.done) return;
        S.subtitle('', tx(['Por la ventana, Aldrin ve caer la bandera con el chorro del motor.', 'Through the window, Aldrin sees the flag blown over by the exhaust.'])); await sleep(4.2); if (S.done) return;
        S.subtitle('', tx(['Habían pasado 21 horas y 36 minutos en la superficie.', 'They had spent 21 hours and 36 minutes on the surface.'])); await sleep(4.4); if (S.done) return;
        if (!store.get('storyCompleted')) return;
        const pick = await S.choice([
          { id: 'safire', label: ['¿Y si el motor no encendía?', 'What if the engine had failed?'] },
          { id: 'go', label: ['Continuar', 'Continue'] },
        ], ['¿Y si…? · desbloqueado', 'What if…? · unlocked']);
        if (pick !== 'safire' || S.done) return;
        // ---- ¿Y si…? En caso de desastre lunar (blanco y negro) ----
        safire = true; ign = -1; fall = 0; asc.position.copy(asc0); asc.rotation.z = 0; plume.set(0); shards.material.opacity = 0;
        document.body.classList.add('safire-bw'); unlock('discurso-safire');
        cam.position.set(lx - 22, ly + 2.2, 9); look.copy(lmC);
        playA11('voz_en_clonada/c6_dec_safire_discurso_desastre_en');
        const NIX = tx(['NIXON · LECTURA DRAMATIZADA', 'NIXON · DRAMATIZED READING']);
        S.subtitle(NIX, tx(['El destino ha querido que los hombres que fueron a la Luna a explorar en paz se queden en la Luna para descansar en paz.', 'Fate has ordained that the men who went to the Moon to explore in peace will stay on the Moon to rest in peace.'])); await sleep(8.6); if (S.done) return;
        S.subtitle(NIX, tx(['Estos valientes, Neil Armstrong y Edwin Aldrin, saben que no hay esperanza de rescatarlos. Pero también saben que hay esperanza para la humanidad en su sacrificio.', 'These brave men, Neil Armstrong and Edwin Aldrin, know that there is no hope for their recovery. But they also know that there is hope for mankind in their sacrifice.'])); await sleep(7.5); if (S.done) return;
        S.subtitle(NIX, tx(['Todo ser humano que mire la Luna en las noches por venir sabrá que hay un rincón de otro mundo que es, para siempre, humanidad.', 'For every human being who looks up at the Moon in the nights to come will know that there is some corner of another world that is forever mankind.'])); await sleep(7.5); if (S.done) return;
        S.subtitle('', tx(['William Safire lo escribió el 18 de julio de 1969, por si ocurría un desastre.', 'William Safire wrote it on July 18, 1969, in case of disaster.'])); await sleep(4.2); if (S.done) return;
        S.subtitle('', tx(['Este discurso nunca tuvo que leerse.', 'This speech never had to be read.'])); await sleep(4);
      },
    });
    return { ...r, safire };
  } catch (e) { console.error('liftoff', e); return { played: false, skipped: true }; }
  finally { document.body.classList.remove('safire-bw'); shards.geometry.dispose(); shards.material.dispose(); }
}
