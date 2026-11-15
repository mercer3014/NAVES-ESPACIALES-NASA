// Cap. 1.2 · «Centro Espacial Kennedy» (de día, días antes del lanzamiento): Deke Slayton le confirma a Aldrin que Neil
// saldrá primero. Decisión c1-firststep con consecuencia inmediata en el plano (Neil agradece / charla honesta / el rumor).
// Personajes: civil-base (Slayton), aldrin-civil, armstrong-civil, extra-man-2 (otro astronauta). Clips idle/walk/talk.
// Mundo: la escena de la plataforma (pad.js) sin encendido, junto al mar; el Saturn V al fondo. El público se oculta.
import { THREE } from '../../core/engine.js';
import { makePad, BASE_Y } from '../../scenes/pad.js';
import { BEACH } from '../../scenes/ksc-crowd.js';
import { runCine, character, tx } from './cine.js';
import { ask } from './decisions.js';
import { setFlag } from './state.js';
import { playA11 } from '../../audio/a11-voice.js';

const TITLE = ['CAP. 1 · CENTRO ESPACIAL KENNEDY', 'CH. 1 · KENNEDY SPACE CENTER'];
const GROUND = BASE_Y + BEACH.y; // fila llana frente al Atlántico (ver beach.js)
const X = -40, Z = BEACH.z - 8;
const VO = 'voz_en_clonada/';
const SLAYTON = ['DEKE SLAYTON', 'DEKE SLAYTON'], ALDRIN = ['ALDRIN', 'ALDRIN'], NEIL = ['ARMSTRONG', 'ARMSTRONG'], OTHER = ['ASTRONAUTA', 'ASTRONAUT'];
const P = (dx, dy, dz) => [X + dx, GROUND + dy, Z + dz];
const yawTo = (x, z, tx_, tz) => Math.atan2(tx_ - x, tz - z);

export default async function kscScene() {
  let W = null, decision = null, decisionP = null;
  try {
    W = makePad(); W.setThrust(0);
    await Promise.race([Promise.all([W.ready, W.envReady]), new Promise((r) => setTimeout(r, 8000))]);
    const load = (n, at, yaw, clip = 'idle') => character(n, clip, { at: P(...at), yaw }).catch((e) => { console.warn(n + '.glb no disponible', e); return null; });
    const [slay, buzz, neil, other] = await Promise.all([
      load('civil-base', [-0.6, 0, 0], yawTo(-0.6, 0, 0.6, 0), 'talk'),
      load('aldrin-civil', [0.6, 0, 0], yawTo(0.6, 0, -0.6, 0)),
      load('armstrong-civil', [-6, 0, 2.5], 0),
      load('extra-man-2', [5.2, 0, 1.4], yawTo(5.2, 1.4, 0.6, 0)),
    ]);
    const cast = [slay, buzz, neil, other].filter(Boolean);
    cast.forEach((c) => W.scene.add(c.root));
    if (neil) neil.root.visible = false; if (other) other.root.visible = false;

    // desplazamientos simples: el personaje camina en línea recta hasta un punto y vuelve a un clip de reposo
    const moves = [];
    const walkTo = (c, dx, dz, dur, then = 'idle') => { if (!c) return; const from = c.root.position.clone(), to = new THREE.Vector3(X + dx, GROUND, Z + dz);
      c.root.rotation.y = yawTo(from.x, from.z, to.x, to.z); c.play('walk'); moves.push({ c, from, to, t: 0, dur, then }); };
    const face = (c, dx, dz) => { if (c) c.root.rotation.y = yawTo(c.root.position.x, c.root.position.z, X + dx, Z + dz); };

    const world = {
      scene: W.scene, camera: W.camera,
      update: (dt, t) => { if (W.crowd) W.crowd.visible = false;
        for (let i = moves.length - 1; i >= 0; i--) { const m = moves[i]; m.t += dt; const k = Math.min(1, m.t / m.dur); m.c.root.position.lerpVectors(m.from, m.to, k); if (k >= 1) { m.c.play(m.then); moves.splice(i, 1); } }
        cast.forEach((c) => c.update(dt)); W.update(dt, t); },
      render: (dt) => W.render(dt), resize: (w, h) => W.resize(w, h), dispose: () => {},
    };
    W.camera.near = 0.1; W.camera.far = 60000; W.camera.updateProjectionMatrix();

    const r = await runCine({
      id: 'ksc', world, title: TITLE,
      shots: [
        { d: 5, pos: P(-3.2, 1.7, -5.5), look: [0, BASE_Y + 55, 0], fov: 34, to: { pos: P(-1.8, 1.65, -4), look: [0, BASE_Y + 50, 0], fov: 30 } }, // de espaldas: el Saturn V al fondo
        { d: 6, pos: P(0.2, 1.55, -3.4), look: P(0, 1.45, 0), fov: 38, to: { pos: P(0, 1.55, -2.9), look: P(0, 1.45, 0), fov: 36 } }, // los dos de perfil
        { d: 8, pos: P(-1.5, 1.68, -0.55), look: P(0.6, 1.55, 0), fov: 32, to: { pos: P(-1.35, 1.66, -0.45), look: P(0.6, 1.55, 0), fov: 30 } }, // por encima de Slayton: Aldrin
        { d: 5, pos: P(1.5, 1.68, -0.55), look: P(-0.6, 1.55, 0), fov: 32 }, // por encima de Aldrin: Slayton
        { d: 60, pos: P(4.5, 2.3, -7.5), look: P(0, 1.3, 0.5), fov: 42, to: { pos: P(2.8, 2.0, -5.8), look: P(0, 1.3, 1), fov: 40 } }, // plano abierto: decisión y consecuencia
      ],
      async interactive(S) {
        const until = (t) => new Promise((res) => { const f = () => (S.done || S.t >= t ? res() : requestAnimationFrame(f)); f(); });
        const wait = (s) => until(S.t + s);
        const say = async (who, text, vo, secs) => { if (S.done) return; S.subtitle(tx(who), tx(text)); if (vo) playA11(VO + vo); await wait(secs); };

        await until(1);
        await say(SLAYTON, ['Buzz, ya está decidido. Neil sale primero. Es el comandante y la escotilla abre hacia su lado.', 'Buzz, it’s decided. Neil goes out first. He’s the commander, and the hatch opens on his side.'], 'c1_12_slayton_neil_sale_primero_en', 7.6);
        slay?.play('idle'); buzz?.play('talk');
        await until(11.4);
        await say(ALDRIN, ['En Gemini salía el piloto, no el comandante. Solo digo que hay precedente.', 'On Gemini the pilot went out, not the commander. I’m just saying there’s precedent.'], 'c1_12_aldrin_precedente_gemini_en', 8);
        buzz?.play('idle'); slay?.play('point', { once: true });
        await say(SLAYTON, ['Y yo solo digo que está decidido.', 'And I’m just saying it’s decided.'], 'c1_12_slayton_esta_decidido_en', 2.8);
        S.subtitle('', tx(['(Slayton se va. Aldrin se queda mirando el cohete.)', '(Slayton walks off. Aldrin stays, looking at the rocket.)']));
        walkTo(slay, -5, -6, 5); face(buzz, 0, 60);
        await wait(2.2); if (S.done) return;

        S.subtitle('', ''); decisionP = ask('c1-firststep'); decision = await decisionP; if (S.done) return;

        if (decision === 'accept') {
          S.subtitle('', tx(['(Más tarde, en la misma explanada.)', '(Later, on the same lawn.)']));
          if (neil) { neil.root.visible = true; walkTo(neil, -0.4, 0.4, 4.2); } await wait(4.4);
          face(buzz, -0.4, 0.4); face(neil, 0.6, 0); neil?.play('talk');
          await say(NEIL, ['Gracias, Buzz. No era fácil.', 'Thanks, Buzz. That wasn’t easy.'], 'c1_dec_armstrong_gracias_buzz_en', 3.4);
          neil?.play('idle'); buzz?.play('wave', { once: true });
          await say(ALDRIN, ['(Asiente.) Nos vemos allá arriba, Neil.', '(Nods.) See you up there, Neil.'], null, 3);
        } else if (decision === 'talk') {
          if (neil) { neil.root.visible = true; neil.root.position.set(...P(-3.5, 0, 1.8)); face(neil, 0.6, 0); }
          walkTo(buzz, -2.3, 1.2, 2.6); await wait(2.8); face(buzz, -3.5, 1.8); buzz?.play('talk');
          await say(ALDRIN, ['Neil… no voy a fingir que no me importa. Me dolió.', 'Neil… I won’t pretend it doesn’t matter. It hurt.'], null, 4.2);
          buzz?.play('idle'); neil?.play('talk');
          await say(NEIL, ['Lo sé. No lo elegí yo, Buzz. Y no lo haría sin ti a medio metro detrás.', 'I know. I didn’t pick it, Buzz. And I wouldn’t do it without you two feet behind me.'], null, 5);
          neil?.play('idle'); buzz?.play('talk');
          await say(ALDRIN, ['Entonces bajemos juntos.', 'Then let’s go down together.'], null, 2.6);
          buzz?.play('idle'); neil?.play('point', { once: true });
          await say(NEIL, ['Juntos.', 'Together.'], null, 2.4);
        } else if (decision === 'complain') {
          if (other) { other.root.visible = true; face(other, 3.6, 0.9); }
          walkTo(buzz, 3.6, 0.9, 2.6); await wait(2.8); face(buzz, 5.2, 1.4); buzz?.play('talk');
          await say(ALDRIN, ['Solo digo que en Gemini salía el piloto. Ya verán que esto lo decidieron por la foto.', 'All I’m saying is on Gemini the pilot went out. You’ll see this was about the photo.'], null, 5);
          buzz?.play('idle'); other?.play('talk');
          await say(OTHER, ['Cuidado, Buzz. Estas paredes oyen.', 'Careful, Buzz. These walls have ears.'], null, 3.2);
          other?.play('idle'); setFlag('rumor', true);
          await say(['', ''], ['(El rumor llegará a Neil antes del lanzamiento.)', '(The rumor will reach Neil before launch.)'], null, 3.2);
        }
        S.subtitle('', ''); await wait(0.8); S.finish(false);
      },
    });
    // si se saltó la escena antes de decidir, la decisión se toma igual (sin la escena de consecuencia)
    if (!decisionP) decision = await ask('c1-firststep'); else if (!decision) decision = await decisionP;
    return { ...r, choice: decision };
  } catch (e) {
    console.error('ksc', e);
    return { id: 'ksc', skipped: true, error: String(e) };
  } finally { try { W?.dispose(); } catch {} }
}
