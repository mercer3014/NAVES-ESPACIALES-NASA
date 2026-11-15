// Cap. 3.2 · «Noche» en Columbia (18 de julio de 1969, luces atenuadas): Aldrin cuenta lo de Marion Moon y, si la
// Confianza lo permite, Neil nombra a Karen (decisión c3-night). La nave gira despacio («modo barbacoa»): la Tierra y la
// Luna se turnan en la ventana. Mundo: cm-interior.glb (cabina de 3,4 m; el panel principal ocupa y 1,0–1,9, z −0,2–0,65)
// y los civiles flotando en el hueco libre sobre las piernas de los asientos (z −1,3…−0,5, y 1,35–2,1), de costado.
import { THREE, modelAnim } from '../../core/engine.js';
import { dbg } from '../../core/store.js';
import { skySphere, twinkleStars, earth, moon, tickAll } from '../../scenes/space.js';
import { envMap } from '../../scenes/cine-kit.js';
import { runCine, character, tx } from './cine.js';
import { run, unlock, chose, flagOf } from './state.js';
import { ask } from './decisions.js';
import { playA11 } from '../../audio/a11-voice.js';

const TITLE = ['CAP. 3 · NOCHE EN COLUMBIA', 'CH. 3 · NIGHT ABOARD COLUMBIA'];
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Cabina del CM con cielo exterior en «modo barbacoa» (giro lento sobre el eje longitudinal Y del CM).
// light: 'night' (atenuada) | 'dark' (solo el panel). Devuelve el mundo y utilidades de cámara suavizada.
export async function makeColumbia({ light = 'night', spin = 0.06, withEarth = true, withMoon = true } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.02, 3000);
  scene.environment = envMap(); scene.environmentIntensity = light === 'dark' ? 0.06 : 0.14;
  const { scene: cab } = await modelAnim('cm-interior');
  cab.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; } });
  scene.add(cab);
  const night = light !== 'dark';
  scene.add(new THREE.AmbientLight(0x1c2838, night ? 0.55 : 0.25));
  const lamp = new THREE.PointLight(0xffc48a, night ? 1.6 : 0, 4.5, 2); lamp.position.set(0, 2.05, -0.45); scene.add(lamp);
  const panel = new THREE.PointLight(0x8affc4, night ? 0.7 : 0.9, 2.6, 2); panel.position.set(0, 1.55, 0.25); scene.add(panel);
  const winL = new THREE.DirectionalLight(0x9db8ff, night ? 0.35 : 0.5); winL.position.set(0, 1.2, 6); scene.add(winL);
  // exterior: estrellas, Tierra y Luna en el plano del giro (pasan por la ventana de la escotilla, +Z, y las laterales)
  const out = new THREE.Group(); out.position.set(0, 1.2, 0); scene.add(out);
  out.add(skySphere(1400)); out.add(twinkleStars(undefined, 1300));
  let E = null, M = null;
  if (withEarth) { E = earth(16, V(0.2, 0.3, -1).normalize()); E.position.set(0, 0, 300); out.add(E); }
  if (withMoon) { M = moon(9); M.position.set(Math.sin(2.4) * 300, 10, Math.cos(2.4) * 300); out.add(M); }
  // cámara suavizada: setShot({ pos, look, fov }) y la cámara se desliza hacia ese plano
  const cur = { pos: V(0, 1.98, 0.6), look: V(0, 1.65, -1), fov: 62 }, tgt = { pos: cur.pos.clone(), look: cur.look.clone(), fov: 62 };
  let ease = 1.4;
  const setShot = ({ pos, look, fov = tgt.fov }, { cut = false, speed = 1.4 } = {}) => {
    tgt.pos.set(...pos); tgt.look.set(...look); tgt.fov = fov; ease = speed;
    if (cut) { cur.pos.copy(tgt.pos); cur.look.copy(tgt.look); cur.fov = fov; }
  };
  const world = {
    scene, camera, cab, out, earth: E, moon: M,
    setShot,
    actors: [],
    update(dt, t) {
      out.rotation.y += dt * spin; tickAll(out, dt, t);
      const k = Math.min(1, dt * ease); cur.pos.lerp(tgt.pos, k); cur.look.lerp(tgt.look, k); cur.fov += (tgt.fov - cur.fov) * k;
      camera.position.copy(cur.pos); camera.up.set(0, 1, 0); camera.lookAt(cur.look);
      if (Math.abs(camera.fov - cur.fov) > 0.01) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
      for (const a of world.actors) a.tick(dt, t);
    },
    resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); },
    // solo se libera lo creado aquí (cielo, Tierra, Luna); la cabina y los personajes comparten geometría con el caché del cargador
    dispose() { out.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); scene.clear(); },
  };
  world.resize(); dbg('columbia', world);
  return world;
}

// Astronauta civil flotando casi de pie en la bahía inferior (x, y = pies, z), con inclinación leve y vaivén.
// a.head es la posición de mundo del hueso de la cabeza (se actualiza cada fotograma) para encuadrar primeros planos.
export async function floater(world, name, { x = 0, y = 0.95, z = -1, yaw = 0, tilt = 0, phase = 0 } = {}) {
  const c = await character(name, 'idle', { at: [x, y, z], yaw }).catch((e) => { console.warn(name + '.glb no disponible', e); return null; });
  if (!c) return null;
  const base = c.root.position.clone(); c.root.rotation.z = tilt; world.scene.add(c.root);
  let bone = null; c.root.traverse((o) => { if (!bone && o.isBone && /Head$/.test(o.name)) bone = o; });
  const head = V(x, y + 1.62, z);
  const a = {
    ...c, head,
    say(on = true) { c.play(on ? 'talk' : 'idle', { fade: 0.35 }); },
    tick(dt, t) {
      c.update(dt); c.root.position.y = base.y + Math.sin(t * 0.55 + phase) * 0.03;
      c.root.rotation.x = Math.sin(t * 0.3 + phase) * 0.04; c.root.rotation.z = tilt + Math.sin(t * 0.21 + phase) * 0.03;
      if (bone) { c.root.updateMatrixWorld(true); bone.getWorldPosition(head); }
    },
  };
  world.actors.push(a); return a;
}

// espera en tiempo de escena (se corta si el jugador salta)
export const wait = (S, s) => { const t0 = S.t; return new Promise((r) => { const iv = setInterval(() => { if (S.done || S.t - t0 >= s) { clearInterval(iv); r(); } }, 50); }); };

export default async function nightScene() {
  let W = null;
  try {
    W = await makeColumbia({ light: 'night', spin: 0.06 });
    const [buzz, mike, neil] = await Promise.all([
      // Aldrin y Collins flotan acostados sobre el panel principal (el único hueco libre de la cabina); Neil, de pie junto a la ventana lateral
      floater(W, 'aldrin-civil', { x: -0.9, y: 2.12, z: 0.15, tilt: -Math.PI / 2, phase: 0.3 }),
      floater(W, 'collins-civil', { x: 0.9, y: 2.48, z: -0.15, tilt: Math.PI / 2, phase: 1.4 }),
      floater(W, 'armstrong-civil', { x: -0.72, y: 0.9, z: 1.0, yaw: -2.25, phase: 2.2 }),
    ]);
    // primer plano: los acostados miran a +Z (hacia la escotilla); a Neil se lo toma de perfil contra la ventana
    const near = (a, side = 1) => (!a ? null : a === neil
      ? { pos: [a.head.x + 0.55, a.head.y - 0.05, a.head.z + 0.3], look: [a.head.x - 0.2, a.head.y - 0.02, a.head.z - 0.15], fov: 44 }
      : { pos: [a.head.x + side * 0.18, a.head.y - 0.32, a.head.z + 0.78], look: [a.head.x, a.head.y, a.head.z], fov: 42 });
    const WIDE = { pos: [0.55, 1.5, 1.42], look: [-0.15, 2.0, -0.1], fov: 72 };
    const WINDOW = { pos: [0, 1.2, 1.22], look: [0, 1.2, 3.2], fov: 52 };
    W.setShot(WIDE, { cut: true });
    const line = (S, who, text, actor, clip) => { S.subtitle(who, tx(text)); if (clip) playA11('voz_en_clonada/' + clip); if (actor) { actor.say(true); setTimeout(() => actor.say(false), 2600); } };
    const r = await runCine({
      id: 'night', world: W, title: TITLE,
      async interactive(S) {
        S.subtitle('', tx(['18 de julio de 1969. «Noche» a bordo: luces atenuadas. La nave gira despacio para repartir el calor del Sol.', 'July 18, 1969. “Night” aboard: lights dimmed. The ship turns slowly to spread the Sun’s heat.']));
        await wait(S, 4.2); if (S.done) return;
        W.setShot(WINDOW, { speed: 0.8 }); S.subtitle('', tx(['Por la ventana, la Tierra y la Luna se turnan. «Modo barbacoa».', 'Through the window, the Earth and the Moon take turns. “Barbecue mode.”']));
        await wait(S, 4.5); if (S.done) return;
        W.setShot(WIDE, { speed: 0.9 });
        if (flagOf('rumor')) {
          S.subtitle('', tx(['(Un silencio incómodo. El rumor sobre el primer paso llegó a Neil antes del despegue.)', '(An awkward silence. The rumor about the first step reached Neil before launch.)']));
          await wait(S, 3.6); if (S.done) return;
        }
        if (buzz) W.setShot(near(buzz, 1));
        line(S, 'ALDRIN', ['¿Sabes cuál era el apellido de soltera de mi madre? Moon. Marion Moon.', 'You know what my mother’s maiden name was? Moon. Marion Moon.'], buzz, 'c3_32_aldrin_marion_moon_en');
        unlock('marion-moon'); await wait(S, 5.2); if (S.done) return;
        if (mike) W.setShot(near(mike, -1));
        line(S, 'COLLINS', ['Entonces esto es una visita familiar.', 'So this is a family visit.'], mike, 'c3_32_collins_visita_familiar_en');
        await wait(S, 3.6); if (S.done) return;
        // objeto opcional: la comida espacial
        const look = await S.choice([{ id: 'food', label: ['Mirar la bolsa de comida', 'Look at the food bag'] }, { id: 'on', label: ['Seguir', 'Go on'] }]);
        if (look === null || S.done) return;
        if (look === 'food') {
          line(S, 'COLLINS', ['El cóctel de camarones es lo único que se parece a comida de verdad.', 'The shrimp cocktail is the only thing up here that tastes like real food.'], mike, 'c3_obj_collins_coctel_camarones_en');
          unlock('comida-espacial'); await wait(S, 3.8); if (S.done) return;
          S.subtitle('', tx(['Comida deshidratada: se rehidrataba con la pistola de agua y se comía con cuchara o directo de la bolsa.', 'Dehydrated food: rehydrated with the water gun and eaten with a spoon or straight from the bag.']));
          await wait(S, 4.2); if (S.done) return;
        }
        if (neil) W.setShot(near(neil, 1), { speed: 0.9 });
        const kids = chose('c1-kids');
        if (kids === 'truth' || kids === 'rocket') {
          line(S, 'ARMSTRONG', kids === 'rocket' ? ['Le dejé a Rick el cohete de Mark. Para que cuide de su hermano.', 'I left Rick with Mark’s rocket. So he’d look after his brother.'] : ['Rick me preguntó si desde aquí se ve nuestra casa.', 'Rick asked me if you can see our house from up here.'], neil);
          await wait(S, 4); if (S.done) return;
        }
        if (run.trust > 60) {
          S.subtitle('', tx(['(Neil mira por la ventana un largo rato.)', '(Neil looks out the window for a long while.)'])); await wait(S, 3); if (S.done) return;
          line(S, 'ARMSTRONG', ['Karen habría cumplido diez este año.', 'Karen would have turned ten this year.'], neil);
          unlock('karen'); await wait(S, 3.2); if (S.done) return;
          S.subtitle('', tx(['(Silencio. Es la única vez que Neil dice su nombre en voz alta.)', '(Silence. It is the only time Neil says her name out loud.)'])); await wait(S, 2.6); if (S.done) return;
          const opt = await ask('c3-night'); if (S.done) return;
          if (opt === 'hand') { if (buzz) W.setShot(near(buzz, 1), { speed: 0.7 }); S.subtitle('', tx(['(Aldrin no dice nada. Le pone una mano en el hombro. Neil asiente.)', '(Aldrin says nothing. He puts a hand on his shoulder. Neil nods.)'])); await wait(S, 4); }
          else if (opt === 'mission') { line(S, 'ALDRIN', ['Mañana a esta hora estaremos en órbita lunar.', 'This time tomorrow we’ll be in lunar orbit.'], buzz); await wait(S, 3.4); if (S.done) return; line(S, 'ARMSTRONG', ['…Sí. Duerman. Mañana es largo.', '…Yes. Get some sleep. Tomorrow’s a long day.'], neil); await wait(S, 3.4); }
          else { line(S, 'ALDRIN', ['¿Cómo era ella?', 'What was she like?'], buzz); await wait(S, 2.8); if (S.done) return; S.subtitle('', tx(['(Neil se vuelve hacia la ventana y no contesta.)', '(Neil turns to the window and does not answer.)'])); await wait(S, 3.6); }
        } else {
          S.subtitle('', tx(['(Neil mira por la ventana.)', '(Neil looks out the window.)'])); await wait(S, 2.4); if (S.done) return;
          line(S, 'ARMSTRONG', ['Duerman. Mañana es largo.', 'Get some sleep. Tomorrow’s a long day.'], neil, 'c3_32_armstrong_duerman_en');
          await wait(S, 3.4);
        }
        if (S.done) return;
        W.setShot(WINDOW, { speed: 0.5 }); S.subtitle('', tx(['(La Luna crece en la ventana. Faltan unas horas para pasar detrás de ella.)', '(The Moon grows in the window. A few hours until they pass behind it.)']));
        await wait(S, 4);
      },
    });
    return r;
  } catch (e) { console.error('night', e); return { id: 'night', skipped: true, error: String(e) }; }
  finally { W?.dispose(); }
}
