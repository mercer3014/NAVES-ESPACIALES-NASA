// Cap. 5.7 → 6.2 · «El disyuntor»: dentro del Eagle, el disyuntor de armado del motor de ascenso está roto (hecho real: lo
// golpeó una mochila). Puzle: cerrarlo sin tocarlo con los dedos ni con metal. Solución histórica: el rotulador de Aldrin.
// Mundo: cabina del artista (cabin-panels.glb, reutilizada como interior del LM según el plan) + cabin-breaker.glb + cabin-props.glb.
import { THREE, model } from '../../core/engine.js';
import { makeCabin } from '../../scenes/cabin.js';
import { sfx } from '../../core/audio.js';
import { clip } from '../../audio/a11-cues.js';
import { store } from '../../core/store.js';
import { activePlan, computePlan } from '../design/plan.js';
import { attachLook } from '../../core/look.js';
import { runCine, tx } from './cine.js';

const TITLE = ['CAP. 6 · EL DISYUNTOR', 'CH. 6 · THE CIRCUIT BREAKER'];
// pivote del panel (en el glb, relativo al ojo del piloto): (0.80, 0.10, −0.08)
const BRK = new THREE.Vector3(0.8, 0.1, -0.08);
export const PROPS_AT = { pos: [0.5, -0.3, -0.42], yaw: -0.9 }; // repisa bajo el panel derecho, al alcance de Aldrin

export default async function breakerScene() {
  const cab = makeCabin({ clock: false }); const world = { scene: cab.scene, camera: cab.camera, update: (dt) => cab.update(dt), dispose: () => cab.dispose() };
  await cab.ready.catch((e) => console.warn('cabin-panels.glb no disponible', e));
  const brk = await model('cabin-breaker').catch((e) => { console.warn('cabin-breaker.glb no disponible', e); return null; });
  let broken = null, q0 = null; if (brk) { cab.scene.add(brk); broken = brk.getObjectByName('lm-breaker-broken'); q0 = broken?.quaternion.clone(); }
  const props = await model('cabin-props').catch(() => null); let pen = null, pencil = null;
  if (props) { props.position.set(...PROPS_AT.pos); props.rotation.y = PROPS_AT.yaw; cab.scene.add(props); pen = props.getObjectByName('felt-tip-pen');
    // lápiz mecánico metálico (opción incorrecta): no hay modelo, se dibuja como cilindro de aluminio junto al rotulador
    pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.9, roughness: 0.3 }));
    pencil.rotation.z = Math.PI / 2; pencil.position.set(0.12, 0.006, 0.06); props.add(pencil); }
  cab.sky('space'); cab.alarm(false);
  // la cabina mueve la cámara con look(yaw, pitch); el riel interpola esos ángulos
  const yawB = Math.atan2(-BRK.x, -BRK.z), pitchB = Math.atan2(BRK.y, Math.hypot(BRK.x, BRK.z));
  const LOOK = { panel: [0, -0.05], breaker: [yawB + 0.14, pitchB + 0.02], props: [yawB + 0.55, -0.55] }; let look = LOOK.panel.slice(), tgt = LOOK.panel, free = false, yaw = 0, pitch = -0.08;
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.07, 4, 8), new THREE.MeshStandardMaterial({ color: 0xd7c4a8, roughness: 0.7 }));
  finger.rotation.z = Math.PI / 2.4;
  if (props) { finger.position.set(-0.16, 0.02, 0.02); props.add(finger); }
  else { finger.position.set(0.42, -0.22, -0.48); cab.scene.add(finger); }
  world.update = (dt) => {
    if (!free) { look[0] += (tgt[0] - look[0]) * Math.min(1, dt * 2.2); look[1] += (tgt[1] - look[1]) * Math.min(1, dt * 2.2); cab.look(look[0], look[1] + 0.12); }
    else cab.look(yaw, pitch);
    cab.update(dt);
  };
  let penAnim = 0, fixed = false; const penHome = pen ? pen.position.clone() : null, penTo = new THREE.Vector3();
  const energy = computePlan(activePlan(null, store));
  let stopEnergy = () => {};
  if (energy.energyS > 0) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;z-index:40;top:calc(12px + var(--safe-t,0px));left:50%;transform:translateX(-50%);background:#0B0C0E;color:#FFB000;border:2px solid #FFB000;padding:8px 14px;font:700 14px/1.3 ui-monospace,monospace;letter-spacing:.08em';
    document.body.append(box);
    const t0 = performance.now(), secs = energy.energyS;
    const iv = setInterval(() => {
      const left = Math.max(0, secs - (performance.now() - t0) / 1000);
      box.textContent = (left > 0 ? 'POR TU PLAN · ENERGÍA ' + left.toFixed(0) + ' s' : 'POR TU PLAN · BATERÍAS AGOTADAS');
      if (left <= 0) { box.style.color = '#E0201B'; box.style.borderColor = '#E0201B'; clearInterval(iv); }
    }, 200);
    stopEnergy = () => { clearInterval(iv); box.remove(); };
  }
  return runCine({
    id: 'breaker', world, title: TITLE,
    step(dt) {
      if (!fixed || !pen || !broken) return;
      penAnim = Math.min(1, penAnim + dt / 1.6); const k = penAnim < 0.6 ? penAnim / 0.6 : 1;
      broken.updateWorldMatrix(true, false); broken.getWorldPosition(penTo); props.worldToLocal(penTo);
      pen.position.lerpVectors(penHome, penTo, k * k * (3 - 2 * k)); // la punta (origen del nodo) va al disyuntor
      if (penAnim > 0.6) broken.quaternion.slerpQuaternions(q0, new THREE.Quaternion(), Math.min(1, (penAnim - 0.6) / 0.3)); // entra: circuito cerrado
    },
    async interactive(S) {
      S.subtitle('', tx(['Fin de la caminata. Aldrin entra primero; detrás, las mochilas rozan el panel.', 'End of the moonwalk. Aldrin climbs in first; behind him the backpacks brush the panel.']));
      await sleep(S, 3.2); tgt = LOOK.breaker;
      S.subtitle('ALDRIN', tx(['Neil… mira esto.', 'Neil… look at this.'])); clip('c5_57_aldrin_mira_esto_en'); await sleep(S, 2.6);
      S.subtitle('ARMSTRONG', tx(['Ese es el del motor de ascenso.', "That's the ascent engine one."])); clip('c5_57_armstrong_motor_ascenso_en', { radio: true }); await sleep(S, 2.8);
      S.subtitle('', tx(['Mira la cabina. Con E eliges: rotulador, lápiz metálico o el dedo.', 'Look around the cabin. E chooses: the felt-tip, the metal pencil, or your finger.']));
      free = true; yaw = LOOK.props[0]; pitch = LOOK.props[1];
      const lookCtl = attachLook({ onDelta: (dx, dy) => { yaw -= dx * 0.0022; pitch = Math.max(-1.1, Math.min(0.6, pitch - dy * 0.0016)); } });
      const prompt = document.createElement('div'); prompt.style.cssText = 'position:absolute;left:50%;bottom:18%;transform:translateX(-50%);color:#F2EFE6;font:600 16px Barlow,sans-serif;text-shadow:0 2px 8px #000;pointer-events:none';
      const dot = document.createElement('div'); dot.style.cssText = 'position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border:2px solid #FFB000;border-radius:50%';
      S.el.append(prompt, dot);
      const place = (obj, x, y, z) => { if (obj) return obj; const o = new THREE.Object3D(); o.position.set(x, y, z); cab.scene.add(o); return o; };
      const anchors = { pen: place(pen, 0.62, -0.22, -0.5), pencil: place(pencil, 0.78, -0.2, -0.38), finger };
      const names = { pen: ['Rotulador de fieltro', 'Felt-tip pen'], pencil: ['Lápiz metálico', 'Metal pencil'], finger: ['El dedo', 'Your finger'] };
      const aimed = () => {
        let best = null, bd = 0.28;
        for (const [id, obj] of Object.entries(anchors)) {
          if (!obj) continue;
          const p = new THREE.Vector3(); obj.getWorldPosition(p); p.project(cab.camera);
          if (p.z > 1) continue;
          const d = Math.hypot(p.x, p.y); if (d < bd) { bd = d; best = id; }
        }
        return best;
      };
      let picked = null;
      const onKey = (e) => {
        if (e.code !== 'KeyE' || e.repeat || S.done || picked) return;
        const id = aimed(); if (!id) return;
        e.preventDefault(); e.stopPropagation();
        if (id === 'pencil') { sfx('error', { vol: 0.5 }); clip('c6_62_houston_nada_conductor_en', { radio: true }); S.subtitle('HOUSTON', tx(['Negativo, Eagle. Nada conductor.', 'Negative, Eagle. Nothing conductive.'])); return; }
        if (id === 'finger') { sfx('error', { vol: 0.45 }); S.subtitle('', tx(['El agujero es del tamaño de una punta de rotulador. Con el guante, el dedo no entra. Y la piel conduce.', 'The hole is the size of a felt tip. In the glove, a finger will not go in. And skin conducts.'])); return; }
        picked = 'pen';
      };
      addEventListener('keydown', onKey, true);
      while (!picked && !S.done) {
        const id = aimed();
        prompt.textContent = id ? (tx(['E · ', 'E · ']) + tx(names[id])) : tx(['Mira el rotulador, el lápiz o el dedo', 'Look at the pen, the pencil or the finger']);
        await sleep(S, 0.05);
      }
      removeEventListener('keydown', onKey, true); lookCtl.dispose(); prompt.remove(); dot.remove(); free = false;
      if (!picked || S.done) return;
      tgt = LOOK.breaker; fixed = true; sfx('switch'); S.subtitle('ALDRIN', tx(['Con la punta de fieltro… entra. Circuito cerrado.', 'With the felt tip… it goes in. Circuit closed.']));
      await sleep(S, 2.6); sfx('ok');
      S.subtitle('', tx(['Motor de ascenso: hipergólico, simple y sin respaldo. Si no encendía, no había otra forma de salir de la Luna.', 'Ascent engine: hypergolic, simple and with no backup. If it did not fire, there was no other way off the Moon.']));
      await sleep(S, 4.5);
    },
  }).finally(() => { stopEnergy(); world.dispose(); });
}
function sleep(S, s) { const t0 = S.t; return new Promise((r) => { const iv = setInterval(() => { if (S.done || S.t - t0 >= s) { clearInterval(iv); r(); } }, 50); }); }
