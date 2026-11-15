// JEFE NO CANON · «El Guardián de Tranquilidad» (guion, escenas 6.1B FASE 3 y 6.1C). Sueño de Aldrin en Eagle.
// Entrada única: runBoss({ flag, name, diff, onWin, onLose }) → Promise<{ result: 'win'|'lose', stats }>.
// Autocontenido: crea su mundo (setWorld), su bucle (onTick), su HUD y lo limpia todo al terminar
// (por defecto restaura el mundo anterior). No toca el resto del juego.
//
// Fases (ficha del Guardián):
//  1 · POLVO (100–70 %): barrido (abanico en el suelo), golpe (anillo rojo), lanzas de regolito (círculos), «lluvia 1202»
//      (esferas ámbar; si te tocan, el HUD se apaga 4 s). Romper las 4 placas de basalto con el martillo; flash para
//      aturdir y golpear el núcleo DSKY («Foto y golpe» ×2,5).
//  2 · COMBUSTIBLE (70–35 %): 3 Guardianes; los clones NO proyectan sombra. Cuenta atrás 60 s en el depósito (si llega a 0,
//      onda que vacía O₂). 3 pasos: flash al real (lo revela y lo aturde 8 s) → ir a su espalda → mantener E junto al depósito.
//  3 · FUEGO (35–0 %): grietas naranjas, ondas de calor en anillo (saltarlas), se arrastra hacia Eagle para tapar la
//      escotilla. Manguera de O₂ compartida (Q junto a Neil): recarga O₂ y deja el núcleo expuesto 10 s (ya no duplica el daño).
//      Al llegar a 0: disyuntor roto en el núcleo → E (rotulador) → victoria.
// Herramientas (weapons.js): martillo geológico (rápido) y mazo (lento, más alcance y daño, gasta O₂); 1/2 o rueda.
// Impactos: chispas, polvo, estela, congelado breve, temblor, destello y retroceso del Guardián, números de daño.
import { THREE, setWorld, getWorld, onTick, setPaused, model, modelAnim } from '../../core/engine.js';
import { axis, pressed, down, bindBtn, bdown, bpressed, makeStick, clearBtns } from '../../core/input.js';
import { attachLook } from '../../core/look.js';
import { sfx, music, stopVoices } from '../../core/audio.js';
import { isTouch, DEBUG, dbg, store } from '../../core/store.js';
import { clamp, damp } from '../../core/util.js';
import { makeAstronaut } from '../../scenes/astronaut.js';
import { makeBossArena, ARENA, SLAM_HIT } from '../../scenes/boss-arena.js';
import { mountLetterbox } from '../cutscenes/letterbox.js';
import { mountBossHud, L } from './hud.js';
import { voiceLine, stopVoiceLine } from '../../audio/a11-voice.js';
import { clips } from '../../audio/a11-cues.js';
import { stinger } from '../../audio/a11-score.js';
import { makeWeapons, swingPose, makeTrail, makeSparks, makeHitFlash } from './weapons.js';
import { nc, loopSfx, preloadBossSfx, disposeBossSfx, BOSS_MUSIC } from './sfx.js';

const G = 1.62; // gravedad lunar
const CAM_MIN = 6; // distancia mínima de la cámara al Guardián (mide ~16 m)
// o2k: factor del gasto de O₂ (golpes, salto, esquiva): Normal −30 %, Cadete −50 %.
const TXT_PT = 'apolo11-boss-pt'; // tiempo acumulado por fase (sobrevive a recargas de depuración)
const DIFFS = {
  easy: { tel: 1.3, regen: 6, dmg: 0.7, o2k: 0.5, fuel: 75, crawl: 0.28, hatch: 32, cd: 1.25 },
  normal: { tel: 1, regen: 4.5, dmg: 1, o2k: 0.7, fuel: 60, crawl: 0.35, hatch: 26, cd: 1 },
  hard: { tel: 0.8, regen: 2.2, dmg: 1.25, o2k: 1, fuel: 50, crawl: 0.42, hatch: 22, cd: 0.85 },
  extreme: { tel: 0.5, regen: 0, dmg: 1.4, o2k: 1, fuel: 45, crawl: 0.48, hatch: 20, cd: 0.75 }, // «Duros y competentes»: el O₂ no se recupera solo, avisos a la mitad
};
const DIFF_ALIAS = { cadet: 'easy', normal: 'normal', veteran: 'hard', dificil: 'hard', duros: 'extreme' };
const PLATES = ['plate-shoulder-l', 'plate-shoulder-r', 'plate-knee-l', 'plate-knee-r'];
const PHASE_HP = { 1: 100, 2: 70, 3: 35 };

export async function runBoss(opts = {}) {
  const { flag = null, name = '', onWin, onLose, restoreWorld = true, skipIntro = false, briefing = null } = opts; // briefing: GANCHO async para la tarjeta de misión (mission-card) antes de empezar
  const dk = DIFF_ALIAS[opts.diff] || (DIFFS[opts.diff] ? opts.diff : 'normal'); const D = DIFFS[dk];
  const cleanups = []; let dead = false; let resolveRun;
  const done = new Promise((r) => (resolveRun = r));
  const prevWorld = getWorld(); const prevScreen = document.body.dataset.screen;
  document.body.dataset.screen = 'boss';
  const hud = mountBossHud(); cleanups.push(() => hud.dispose(), stopVoiceLine);
  hud.gameplay(false); const loading = hud.overlay(`<div class="bd-k">${L('NO CANON · SUEÑO DE ALDRIN', 'NON-CANON · ALDRIN\'S DREAM')}</div><h2>${L('Polvo y fuego', 'Dust and fire')}</h2><p>${L('Cargando el sueño…', 'Loading the dream…')}</p>`);

  // ---------- mundo ----------
  const W = await makeBossArena(); const { scene, camera: cam, ground } = W;
  setWorld({ scene, camera: cam }); cleanups.push(() => W.dispose());
  const [ast, neil, real, fakeA, fakeB, hoseG, bootP] = await Promise.all([
    makeAstronaut(flag, name), makeAstronaut(null, 'Armstrong'), W.loadGuardian(), W.loadGuardian().catch(() => null), W.loadGuardian().catch(() => null),
    modelAnim('o2-hose').catch(() => null), model('boot-print').catch(() => null)]);
  loading.remove();
  if (briefing) { try { await briefing(); } catch (e) { console.warn('boss briefing', e); } }
  scene.add(ast.root, neil.root); cleanups.push(() => { ast.dispose?.(); neil.dispose?.(); });
  // herramientas en la mano de Aldrin + efectos de impacto
  const WP = await makeWeapons(ast); const trail = makeTrail(scene); const sparks = makeSparks(scene, ground); const hum = loopSfx('nc_61c_guardian_vibracion_loop');
  cleanups.push(() => { WP.dispose(); trail.dispose(); sparks.dispose(); hum.stop(); disposeBossSfx(); }); preloadBossSfx();

  // ---------- estado ----------
  const S = { phase: 1, hp: 100, o2: 100, t: 0, ts: 1, slowT: 0, shake: 0, hudOffT: 0, invulnT: 0, lastDash: -9, dashT: 0, dashCd: 0, idleT: 0,
    flash: { shots: 12, cd: 0, reload: 0, last: -9 }, buffT: 0, hoseCd: 0, hoseK: -1, hatch: 0, fuel: D.fuel, fuelSaid: 0, revealT: 0, riding: false, tearK: 0,
    leapT: -1, hitStop: 0, absorbSaid: 0, hintT: 0, rt: 0, pt: { 1: 0, 2: 0, 3: 0 }, mode: 'cine', rainT: 9, heatT: 6, whisperT: 12, shuffleT: 22, stats: { hits: 0, rainHits: 0, time: 0, perfect: 0, retries: 0 }, over: false };
  const SP = W.spawns; // empties spawn-player / spawn-guardian de la arena
  const P = { x: SP.player.x, z: SP.player.z, y: 0, vy: 0, vx: 0, vz: 0, yaw: 0, speed: 0, air: false, act: null, actT: 0, actDur: 0, hitDone: true };
  P.y = ground(P.x, P.z);
  const ents = []; // Guardianes
  const mkEnt = (g, fake) => { if (!g) return null; scene.add(g.root); const e = { g, fake, fan: null, x: 0, z: 0, yaw: 0, state: 'idle', st: 0, cd: 2.5, atk: null, alive: true, op: 1, respawn: 0, stunT: 0, plates: {}, lunge: null, hf: makeHitFlash(g), recoil: 0, inner: g.root.children[0], ph: Math.random() * 6 }; ents.push(e); g.setShadow(!fake); if (fake) { g.root.visible = false; e.alive = false; } return e; };
  const R = mkEnt(real, false); const fakes = [mkEnt(fakeA, true), mkEnt(fakeB, true)].filter(Boolean);
  cleanups.push(() => ents.forEach((e) => e.g.dispose()));
  const applyOp = (e) => e.g.setOpacity(Math.min(e.op, e.camOp ?? 1)); // fundido del jefe y semitransparencia cuando la cámara entra en su volumen
  const place = (e, x, z) => { e.x = x; e.z = z; e.g.root.position.set(x, ground(x, z), z); };
  place(R, SP.guardian.x, SP.guardian.z);

  // medir el instante del barrido (manos más bajas) y su alcance → el abanico de aviso coincide con el golpe
  const SW = { t: 1.2, r: 12, half: 1.25 };
  { const g = R.g, a = g.A.sweep; if (a) { const v = new THREE.Vector3(), w = new THREE.Vector3(); let best = 1e9; g.A.idle.stop(); a.reset().play(); const dur = a.getClip().duration;
    for (let i = 4; i < 26; i++) { a.time = (i / 30) * dur; g.mixer.update(0); g.root.updateMatrixWorld(true); g.handWorld('l', v); g.handWorld('r', w); const lo = Math.min(v.y, w.y); if (lo < best) { best = lo; SW.t = a.time; const hz = Math.max(Math.hypot(v.x - g.root.position.x, v.z - g.root.position.z), Math.hypot(w.x - g.root.position.x, w.z - g.root.position.z)); SW.r = clamp(hz + 3, 9, 16); } }
    a.stop(); g.A.idle.reset().play(); g.mixer.update(0); } }

  // ---------- materiales vivos del Guardián ----------
  const crackCol = new THREE.Color(0xffa030), fireCol = new THREE.Color(0xff4a10);
  const paintGuardian = (e, tt) => { const M = e.g.M; const stun = e.stunT > 0;
    if (M['crack-amber']) { const blink = 0.55 + 0.45 * (Math.sin(tt * (S.phase === 3 ? 7 : 3.2)) > 0 ? 1 : 0.35); M['crack-amber'].emissive.copy(S.phase === 3 ? fireCol : crackCol); M['crack-amber'].emissiveIntensity = (S.phase === 3 ? 4 : 2.2) * blink; }
    if (M['dsky-digits']) M['dsky-digits'].emissiveIntensity = stun || (S.phase === 3 && S.buffT > 0) ? 6 + Math.sin(tt * 30) * 2 : 1.6;
    if (M['fuel-gauge'] && S.phase === 2) { const k = clamp(S.fuel / D.fuel, 0, 1); M['fuel-gauge'].emissive?.setRGB(1 - k, k, 0.05); M['fuel-gauge'].emissiveIntensity = 3; M['fuel-gauge'].color?.setRGB(1 - k, k, 0.05); } };

  // ---------- Neil, manguera, cartuchos, peligros ----------
  const N = { x: SP.player.x + 4, z: SP.player.z - 2, yaw: 0, speed: 0, mode: 'follow', tx: 0, tz: 0 };
  let hose = null, hoseMixer = null; if (hoseG) { hose = hoseG.scene; hose.visible = false; scene.add(hose); hoseMixer = new THREE.AnimationMixer(hose); const c = hoseG.animations.find((a) => a.name === 'bend'); if (c) hoseMixer.clipAction(c).play(); }
  const ringJump = W.fx('impact-ring', { color: 0x7fe0ff, opacity: 0.9 }); ringJump.scale.setScalar(1.6); ringJump.visible = false; scene.add(ringJump);
  const cartM = new THREE.MeshStandardMaterial({ color: 0x9ad9b0, emissive: 0x2bd17a, emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.35 });
  const carts = [[-14, -6], [15, -9], [-9, 14], [12, 12]].map(([x, z]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 14), cartM); m.position.set(x, ground(x, z) + 0.45, z); m.castShadow = true; scene.add(m); return { m, x, z, cd: 0 }; });
  const hazards = []; // { kind, t, dur, ... }
  const makeFan = () => { const geo = new THREE.CircleGeometry(1, 40, -Math.PI / 2 - SW.half, SW.half * 2).rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff7a30, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.renderOrder = 3; return m; };
  for (const e of ents) e.fan = makeFan();
  const spikeG = new THREE.ConeGeometry(0.45, 3.2, 6).translate(0, 1.6, 0), spikeM = new THREE.MeshStandardMaterial({ color: 0x8f877c, roughness: 1 });
  const orbG = new THREE.SphereGeometry(0.4, 14, 10), orbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.6, 0.15).multiplyScalar(3) });
  const breaker = (() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.5, roughness: 0.4 })); const lev = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), new THREE.MeshStandardMaterial({ color: 0xff3a20, emissive: 0xff2a10, emissiveIntensity: 2 })); lev.position.set(0, 0.1, 0.2); lev.rotation.x = 0.7; g.add(b, lev); g.lev = lev; g.visible = false; g.scale.setScalar(2.2); return g; })();
  scene.add(breaker);
  cleanups.push(() => { spikeG.dispose(); spikeM.dispose(); orbG.dispose(); orbM.dispose(); cartM.dispose(); ringJump.dispose(); });

  // ---------- entrada ----------
  const ACT = () => pressed('KeyE', 'Enter') || bpressed('hammer') || mouseHit; const ACTD = () => down('KeyE', 'Enter') || bdown('hammer') || mouseDown;
  let mouseHit = false, mouseDown = false, mouseFlash = false, lock = true;
  let camYaw = Math.PI, camPitch = 0.22, camDist = 12, manualYaw = 0; const camP = new THREE.Vector3(0, 6, -28), look = new THREE.Vector3(), lookS = new THREE.Vector3(0, 4, 0);
  const pl = attachLook({ onDelta: (dx, dy) => { if (S.mode !== 'play') return; if (lock) manualYaw = clamp(manualYaw - dx * 0.002, -0.9, 0.9); else camYaw -= dx * 0.0022; camPitch = clamp(camPitch + dy * 0.0016, 0.02, 0.9); } });
  cleanups.push(() => pl.dispose());
  const onMD = (e) => { if (S.mode !== 'play' || e.target.closest?.('.bd-ov,button')) return; if (e.button === 0) { mouseHit = true; mouseDown = true; } if (e.button === 2) mouseFlash = true; };
  const onMU = (e) => { if (e.button === 0) mouseDown = false; };
  let wheelT = 0; const onWheel = (e) => { if (S.mode !== 'play' || performance.now() - wheelT < 220 || Math.abs(e.deltaY) < 4) return; wheelT = performance.now(); setWeapon(WP.index + (e.deltaY > 0 ? 1 : -1)); };
  addEventListener('wheel', onWheel, { passive: true }); cleanups.push(() => removeEventListener('wheel', onWheel));
  const onCM = (e) => { if (S.mode === 'play') e.preventDefault(); };
  let drag = null; const onPD = (e) => { if (e.pointerType !== 'touch' || e.target.closest('button,.bd-tc-stick')) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  const onPM = (e) => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; if (lock) manualYaw = clamp(manualYaw - dx * 0.005, -0.9, 0.9); else camYaw -= dx * 0.006; camPitch = clamp(camPitch + dy * 0.004, 0.02, 0.9); };
  const onPU = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  addEventListener('mousedown', onMD); addEventListener('mouseup', onMU); addEventListener('contextmenu', onCM); addEventListener('pointerdown', onPD); addEventListener('pointermove', onPM); addEventListener('pointerup', onPU);
  cleanups.push(() => { removeEventListener('mousedown', onMD); removeEventListener('mouseup', onMU); removeEventListener('contextmenu', onCM); removeEventListener('pointerdown', onPD); removeEventListener('pointermove', onPM); removeEventListener('pointerup', onPU); });
  if (isTouch) { makeStick(hud.q('.bd-tc-stick')); for (const b of hud.el.querySelectorAll('.bd-tcb')) bindBtn(b, b.dataset.b); }
  cleanups.push(() => clearBtns());
  // pausa propia
  let pauseEl = null, failEl = null; // failEl: diálogo de derrota abierto (no se apila con la pausa)
  const pause = () => { if (pauseEl || failEl || S.over || S.mode === 'cine' || S.mode === 'fail' || S.mode === 'end') return; setPaused(true); document.exitPointerLock?.(); document.body.dataset.paused = '1';
    pauseEl = hud.overlay(`<div class="bd-k">${L('PAUSA', 'PAUSED')}</div><h2>${L('El Guardián de Tranquilidad', 'The Guardian of Tranquility')}</h2><div class="bd-row"><button data-a="r">${L('Reanudar', 'Resume')}</button><button class="bd-sec" data-a="p">${L('Reintentar fase', 'Retry phase')}</button><button class="bd-sec" data-a="q">${L('Despertar (salir)', 'Wake up (quit)')}</button></div>`);
    pauseEl.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); pauseEl.remove(); pauseEl = null; setPaused(false); delete document.body.dataset.paused; if (a === 'p') restartPhase(); if (a === 'q') finish('lose', 'quit'); }; };
  const onKey = (e) => { if (e.code === 'Escape') { e.stopImmediatePropagation(); pause(); } if (e.code === 'Tab' && S.mode === 'play') { e.preventDefault(); lock = !lock; manualYaw = 0; hud.toast(lock ? L('Cámara fijada en el Guardián', 'Camera locked on the Guardian') : L('Cámara libre', 'Free camera'), 1000); } };
  addEventListener('keydown', onKey, true); cleanups.push(() => removeEventListener('keydown', onKey, true));

  // ---------- utilidades ----------
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), vT = new THREE.Vector3();
  const hdist = (x, z, a, b) => Math.hypot(x - a, z - b);
  const grounded = (lim = 0.6) => P.y - ground(P.x, P.z) < lim;
  const say = (who, es, en, tag = '', ms) => { voiceLine(en); return hud.sub(who, L(es, en), tag, ms); };
  const later = (s, f) => hazards.push({ kind: 'timer', t: 0, dur: s, f });
  const nodePos = (e, n, out) => { const o = e.g.nodes[n]; return o ? o.getWorldPosition(out) : out.copy(e.g.root.position); };
  function hurt(amount, src, kind = '') {
    if (S.over || S.mode !== 'play' || S.riding) return false;
    if (S.invulnT > 0) { if (S.t - S.lastDash < 0.4 && S.slowT <= 0) { S.slowT = 1; S.stats.perfect++; hud.toast(L('¡ESQUIVA EN CADENA!', 'CHAIN DODGE!'), 1200, '#F2EFE6'); } return false; }
    S.o2 -= amount * D.dmg * D.o2k; S.invulnT = 1.1; S.idleT = 0; S.stats.hits++; S.shake = Math.max(S.shake, 0.5 + amount / 40); hud.hurt(amount / 30); sfx('thud', { vol: 0.8 });
    if (src) { const dx = P.x - src.x, dz = P.z - src.z, d = Math.hypot(dx, dz) || 1; P.vx = (dx / d) * 6; P.vz = (dz / d) * 6; P.vy = 2.2; P.air = true; }
    if (amount >= 20) { P.act = 'fall'; P.actT = 0; P.actDur = 1.1; }
    if (S.o2 <= 0) { S.o2 = 0; fail(kind === 'fuel' ? L('La onda del depósito vació tu O₂.', 'The tank blast emptied your O₂.') : L('Te quedaste sin oxígeno.', 'You ran out of oxygen.')); }
    return true;
  }
  const useO2 = (n) => { n *= D.o2k; if (S.o2 <= n + 1) { hud.toast(L('O₂ insuficiente', 'Not enough O₂'), 900, '#FF4F00'); return false; } S.o2 -= n; S.idleT = 0; return true; };

  // ---------- ataques ----------
  function startAttack(e, kind) {
    e.state = 'tele'; e.st = 0; e.atk = kind; const tel = D.tel;
    if (kind === 'sweep') { e.teleDur = 1.1 * tel; e.g.root.add(e.fan); e.fan.scale.setScalar(SW.r); e.fan.position.y = 0.12; e.fan.material.opacity = 0; }
    if (kind === 'slam') {
      e.teleDur = 0.45 * tel; const tgt = new THREE.Vector3(P.x, 0, P.z); const fwd = v1.set(Math.sin(e.yaw), 0, Math.cos(e.yaw)); const reach = Math.hypot(e.g.slamLocal.x, e.g.slamLocal.z);
      const d = hdist(P.x, P.z, e.x, e.z); const lungeLen = clamp(d - reach, -3, 8); e.lunge = { sx: e.x, sz: e.z, ex: e.x + fwd.x * lungeLen, ez: e.z + fwd.z * lungeLen };
      const ex = e.lunge.ex + fwd.x * reach, ez = e.lunge.ez + fwd.z * reach; tgt.set(ex, ground(ex, ez) + 0.08, ez);
      const ring = W.fx('impact-ring', { color: 0xff3020 }); ring.position.copy(tgt); ring.scale.setScalar(0.1); scene.add(ring); nc('nc_61b_aviso_circulo_rojo', { vol: 0.55 });
      hazards.push({ kind: 'slamRing', e, ring, t: 0, dur: e.teleDur + SLAM_HIT, pos: tgt, r: 4.6 });
    }
    if (kind === 'spikes') { e.teleDur = 0.3; const n = S.phase === 1 ? 3 : 4; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = i === 0 ? 0 : 2 + Math.random() * 2.5; const x = P.x + P.vx * 0.6 + Math.cos(a) * r, z = P.z + P.vz * 0.6 + Math.sin(a) * r; spawnSpike(x, z, 1.3 * D.tel + i * 0.12, e.fake ? 0.5 : 1); } sfx('glitch', { vol: 0.35, rate: 0.6 }); }
  }
  function spawnSpike(x, z, tel, k) {
    const ring = W.fx('impact-ring', { color: 0xff3020 }); ring.position.set(x, ground(x, z) + 0.08, z); ring.scale.setScalar(1.7); scene.add(ring);
    const m = new THREE.Mesh(spikeG, spikeM); m.position.set(x, ground(x, z) - 0.2, z); m.scale.set(1, 0.001, 1); m.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * 6, (Math.random() - 0.5) * 0.3); m.castShadow = true; m.visible = false; scene.add(m);
    hazards.push({ kind: 'spike', ring, m, x, z, t: 0, tel, dur: tel + 1.4, hit: false, k });
  }
  function rain1202() {
    nc('nc_61c_pitido_alarma_maestra_lluvia1202', { vol: 0.6 }); later(1.5, () => nc('nc_61b_micrometeorito_impactos', { vol: 0.55 }));
    say('', 'ALARMA MAESTRA · 1202', 'MASTER ALARM · 1202', '', 1800);
    for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, r = i === 0 ? 0 : 2.5 + Math.random() * 6; const x = clamp(P.x + Math.cos(a) * r, -26, 26), z = clamp(P.z + Math.sin(a) * r, -26, 26); const gy = ground(x, z);
      const ring = W.fx('impact-ring', { color: 0xffa020 }); ring.position.set(x, gy + 0.08, z); ring.scale.setScalar(1.4); scene.add(ring);
      const orb = new THREE.Mesh(orbG, orbM); orb.position.set(x, gy + 26, z); scene.add(orb);
      hazards.push({ kind: 'orb', ring, orb, x, z, gy, t: 0, dur: (1.7 + i * 0.12) * Math.max(0.7, D.tel), hit: false }); }
  }
  function heatWave(e) {
    const tele = W.fx('heat-ring', { color: 0xff6a20 }); tele.position.set(e.x, ground(e.x, e.z) + 0.1, e.z); tele.scale.setScalar(3); scene.add(tele);
    hazards.push({ kind: 'heatTele', ring: tele, e, t: 0, dur: 1.3 * D.tel });
  }
  function fuelBlast() {
    S.shake = 1.2; sfx('explosion', { vol: 0.8 }); W.puff(R.x, ground(R.x, R.z) + 2, R.z, 120, 9, 2, 2.5);
    const ring = W.fx('impact-ring', { color: 0xff3020 }); ring.position.set(R.x, ground(R.x, R.z) + 0.1, R.z); scene.add(ring); hazards.push({ kind: 'fx', ring, t: 0, dur: 0.9, grow: 32 });
    say('DUKE (ECO)', '…Cero.', '…Zero.', 'NO CANON'); hurt(45, null, 'fuel'); S.fuel = D.fuel; S.fuelSaid = 0;
  }

  // ---------- jugador: herramientas ----------
  function setWeapon(i) {
    if (P.act === 'swing' || !WP.set(i)) return; const w = WP.def; hud.weapon(L(w.es, w.en), WP.index); sfx('toggle', { vol: 0.5, rate: w.id === 'mallet' ? 0.8 : 1.2 });
    if (!S.wpSaid) { S.wpSaid = 1; hud.hint(w.id === 'mallet' ? L('Mazo: lento, más alcance y daño; rompe una placa de un golpe pero gasta O₂', 'Mallet: slow, more reach and damage; breaks a plate in one blow but costs O₂') : L('Martillo geológico: rápido y sin gasto de O₂', 'Geology hammer: fast and costs no O₂'), 3200); }
  }
  function hammer() {
    const w = WP.def;
    if (P.act && P.act !== 'swing') return; if (P.act === 'swing' && P.actT < w.dur * 0.8) return;
    if (w.o2 && !useO2(w.o2)) return;
    P.act = 'swing'; P.actT = 0; P.actDur = w.dur; P.hitDone = false; P.whoosh = false;
    // encarar el objetivo cercano: el golpe se orienta al Guardián (o al clon) si está a tiro
    let tgt = null, td = 9 * w.reach; for (const e of ents) { if (!e.alive || e.op < 0.5) continue; const d = hdist(P.x, P.z, e.x, e.z); if (d < td) { td = d; tgt = e; } }
    if (tgt) P.yaw = Math.atan2(tgt.x - P.x, tgt.z - P.z);
  }
  // número flotante sobre un punto del mundo
  const vP = new THREE.Vector3();
  function popNum(pos, text, kind = '') { vP.copy(pos).project(cam); if (vP.z > 1 || Math.abs(vP.x) > 1.2 || Math.abs(vP.y) > 1.2) return; hud.dmg((vP.x + 1) / 2 * innerWidth + (Math.random() - 0.5) * 40, (1 - vP.y) / 2 * innerHeight - 20, text, kind); }
  // impacto del arma: chispas, polvo, anillo, temblor, congelado y sonido según lo golpeado (plate | core | body | miss)
  function impact(kind, pos) {
    const w = WP.def, heavy = w.id === 'mallet';
    if (kind === 'miss') { W.puff(pos.x, ground(pos.x, pos.z) + 0.1, pos.z, heavy ? 22 : 10, heavy ? 2.2 : 1.2, 0.8, 1.2); sfx('thud', { vol: heavy ? 0.5 : 0.3, rate: heavy ? 0.8 : 1.3 }); S.shake = Math.max(S.shake, heavy ? 0.2 : 0.08); return; }
    S.hitStop = Math.max(S.hitStop, w.stop); S.shake = Math.max(S.shake, w.shake);
    sparks.burst(pos.x, pos.y, pos.z, kind === 'core' ? 40 : heavy ? 34 : 22, heavy ? 7 : 5.5, kind === 'core' ? 'blue' : 'amber');
    W.puff(pos.x, pos.y, pos.z, heavy ? 30 : 16, heavy ? 3.4 : 2.4, 1.4, 1.4);
    const ring = W.fx('impact-ring', { color: kind === 'core' ? 0x9fdcff : 0xffc070, opacity: 0.9 }); ring.position.copy(pos); ring.lookAt(cam.position); ring.rotateX(Math.PI / 2); ring.scale.setScalar(0.3); scene.add(ring); hazards.push({ kind: 'fx', ring, t: 0, dur: 0.32, grow: heavy ? 3.2 : 2.2 });
    if (kind === 'plate') nc('nc_hab_martillo_basalto', { vol: heavy ? 0.95 : 0.8, rate: heavy ? 0.82 : 1.05, jit: 0.06 });
    else if (kind === 'core') { nc('c5_54_mastil_golpe_' + (1 + Math.floor(Math.random() * 3)), { vol: 0.9, rate: heavy ? 0.75 : 1.1, jit: 0.05 }); sfx('hammer', { vol: 0.6, rate: heavy ? 0.7 : 1.1 }); }
    else nc('c5_54_mastil_golpe_' + (1 + Math.floor(Math.random() * 3)), { vol: 0.55, rate: heavy ? 0.7 : 0.95, jit: 0.08 });
    if (heavy) sfx('boom', { vol: 0.35, rate: 1.6 });
  }
  function resolveHammer() {
    const w = WP.def, rk = w.reach; const head = WP.headWorld(new THREE.Vector3());
    const fotoGolpe = S.t - S.flash.last < 1.6, mult = (fotoGolpe ? (S.phase === 3 ? 1.4 : 2.5) : 1) * w.dmg; // la manguera ya no multiplica el daño
    // clones
    for (const f of fakes) if (f.alive && f.op > 0.5 && hdist(P.x, P.z, f.x, f.z) < 6 * rk) { const at = v2.set(f.x, ground(f.x, f.z) + 2.5, f.z); impact('body', head); f.hf.hit(1); popNum(at, L('POLVO', 'DUST'), 'mute'); poofFake(f); hud.toast(L('Era un clon de polvo', 'It was a dust clone'), 1200); return; }
    if (!R.alive) { impact('miss', head); return; }
    if (resolveHit(rk, mult, fotoGolpe, head) === 'miss') impact('miss', head);
  }
  function resolveHit(rk, mult, fotoGolpe, head) {
    const w = WP.def;
    const stun = R.stunT > 0 || (R.atk === 'slam' && R.state === 'atk' && R.st > SLAM_HIT);
    const core = nodePos(R, 'core-dsky', v1); const dCore = hdist(P.x, P.z, core.x, core.z);
    const coreOpen = (S.phase === 1 && R.stunT > 0) || (S.phase === 3 && (R.stunT > 0 || S.buffT > 0));
    // placa al alcance primero (el núcleo abierto no debe «robar» el golpe a una placa que tienes delante)
    let best = null, bd = 1e9; if (S.phase === 1) for (const n of PLATES) { if (R.plates[n] <= 0) continue; const p = nodePos(R, n, v2); const d = hdist(P.x, P.z, p.x, p.z); const vOk = stun || p.y - P.y < 5.2 + (rk - 1) * 3; if (d < 4.5 * rk && vOk && d < bd && !(coreOpen && dCore < 5.5 * rk && d > 2.8)) { bd = d; best = n; } }
    if (coreOpen && dCore < 5.5 * rk && !best) {
      const dmg = (S.phase === 1 ? 3 : 5) * mult; impact('core', core); popNum(core, '-' + Math.round(dmg), fotoGolpe || w.id === 'mallet' ? 'crit' : ''); damage(dmg, core); if (fotoGolpe) hud.toast(S.phase === 3 ? L('¡FOTO Y GOLPE! ×1,4', 'PHOTO STRIKE! ×1.4') : L('¡FOTO Y GOLPE! ×2,5', 'PHOTO STRIKE! ×2.5'), 1200, '#FFB000');
      if (S.phase === 3) { const kb = w.id === 'mallet' ? 4.5 : 3; const dx = R.x - ARENA.lm.x, dz = R.z - ARENA.lm.z, d = Math.hypot(dx, dz) || 1; R.x += (dx / d) * kb; R.z += (dz / d) * kb; S.hatch = Math.max(0, S.hatch - 0.12); }
      return 'core';
    }
    if (S.phase === 1) {
      if (best) { R.plates[best] = Math.max(0, R.plates[best] - w.plate); const p = nodePos(R, best, v2).clone(); impact('plate', p); W.puff(p.x, p.y, p.z, 18, 2.5, 1, 1.2); popNum(p, R.plates[best] <= 0 ? L('ROTA', 'BROKEN') : L('GRIETA', 'CRACK'), 'plate'); damage(3 * mult, p, true);
        if (R.plates[best] <= 0) breakPlate(best); else hud.toast(L('¡Grieta en la placa!', 'The plate cracks!'), 900); return 'plate'; }
      const anyHigh = PLATES.some((n) => R.plates[n] > 0 && n.includes('shoulder')); const nearR = hdist(P.x, P.z, R.x, R.z) < 7 * rk;
      if (nearR) { hud.hint(anyHigh && PLATES.every((n) => n.includes('shoulder') || R.plates[n] <= 0) ? L('Placas altas: aturde con el flash o golpea tras su golpe al suelo', 'High plates: stun with the flash or hit after its ground slam') : L('El polvo se recompone', 'The dust reforms'), 2200); bodyHit(head); return 'body'; }
      return 'miss';
    }
    // fase 2: el aviso sale una sola vez por fase, sin tapar la vista
    if (S.phase === 2 && hdist(P.x, P.z, R.x, R.z) < 7 * rk) { bodyHit(head); if (S.absorbSaid !== 2) { S.absorbSaid = 2; hud.hint(L('El polvo absorbe el golpe: busca el depósito de la espalda', 'The dust absorbs it: go for the tank on its back'), 3500); } return 'body'; }
    if (S.phase === 3 && dCore < 7 * rk) { bodyHit(head); hud.hint(L('Núcleo protegido: conéctate con Neil (Q) o usa el flash', 'Core shielded: connect with Neil (Q) or use the flash'), 2200); return 'body'; }
    return 'miss';
  }
  // golpe que el polvo absorbe: hay contacto (chispas, polvo, destello tenue) pero sin daño
  function bodyHit(head) { impact('body', head); R.hf.hit(0.45); R.recoil = Math.max(R.recoil, WP.def.id === 'mallet' ? 0.5 : 0.25); popNum(head, L('ABSORBIDO', 'ABSORBED'), 'mute'); }
  function breakPlate(n) {
    const o = R.g.nodes[n]; if (!o) return; const wp = o.getWorldPosition(new THREE.Vector3()); const wq = o.getWorldQuaternion(new THREE.Quaternion()); const ws = o.getWorldScale(new THREE.Vector3());
    scene.attach(o); o.position.copy(wp); o.quaternion.copy(wq); o.scale.copy(ws);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 4, 3, (Math.random() - 0.5) * 4); hazards.push({ kind: 'debris', o, vel, spin: new THREE.Vector3(Math.random() * 3, Math.random() * 3, 0), t: 0, dur: 6 });
    sfx('explosion', { vol: 0.6 }); S.shake = 0.6; hud.toast(L('¡Placa de basalto rota!', 'Basalt plate shattered!'), 1300, '#FFB000'); W.puff(wp.x, wp.y, wp.z, 40, 4, 2, 2);
    const left = PLATES.filter((p) => R.plates[p] > 0).length; if (left === 0) say('ARMSTRONG', 'Sin armadura. Flash y al núcleo, Buzz.', 'No armor left. Flash it and hit the core, Buzz.', 'NO CANON');
    else if (left === 3) say('ARMSTRONG', 'Tiene placas en los hombros. Rómpelas. Yo lo distraigo.', 'There are plates on its shoulders. Break them. I\'ll distract it.', 'NO CANON');
  }
  function damage(n, at, silent) {
    const floor = S.phase === 1 ? 70 : S.phase === 2 ? 35 : 0; const platesLeft = PLATES.some((p) => R.plates[p] > 0);
    S.hp = Math.max(S.phase === 1 && platesLeft ? 71 : floor, S.hp - n); if (at) W.puff(at.x, at.y, at.z, 14, 3, 1.5, 1);
    if (n > 0) { hud.hpHit(); R.hf.hit(1); R.recoil = Math.min(1.4, R.recoil + (WP.def.id === 'mallet' ? 1 : 0.6)); }
    if (!silent) S.shake = Math.max(S.shake, 0.3);
    if (S.phase === 1 && S.hp <= 70) phase2();
    else if (S.phase === 3 && S.hp <= 0) breakerOpen();
  }
  function flash() {
    const F = S.flash; if (F.reload > 0 || F.cd > 0) return; if (F.shots <= 0) { F.reload = 4; hud.toast(L('Cambiando carrete…', 'Changing film magazine…'), 1500); return; }
    F.shots--; F.cd = 5 / Math.max(0.8, D.cd); F.last = S.t; hud.white(0.85); nc('nc_hab_flash_hasselblad', { vol: 0.85, jit: 0.04 }); if (F.shots === 0) F.reload = 4;
    P.act = 'point'; P.actT = 0; P.actDur = 0.5;
    const fwd = v1.set(0, 0, -1).applyQuaternion(cam.quaternion); fwd.y = 0; fwd.normalize(); let best = null, ba = 0.5;
    for (const e of ents) { if (!e.alive || e.op < 0.5) continue; const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz); if (d > 45) continue; const a = Math.acos(clamp((dx * fwd.x + dz * fwd.z) / (d || 1), -1, 1)); if (a < ba + (d < 8 ? 0.6 : 0)) { ba = a; best = e; } }
    if (!best) { hud.toast(L('El flash no alcanzó al Guardián', 'The flash missed the Guardian'), 1000); return; }
    { const c = nodePos(best, 'core-dsky', v2); sparks.burst(c.x, c.y, c.z, 30, 4, 'white'); best.hf.hit(0.8); }
    if (best.fake) { poofFake(best); hud.toast(L('Clon sin sombra: era polvo', 'Shadowless clone: just dust'), 1400, '#F2EFE6'); return; }
    say('ALDRIN', '¡Sonríe!', 'Smile!', 'NO CANON', 1500);
    if (S.phase === 2) { reveal(); return; }
    stun(R, 3); if (S.phase === 1 && !S.saidBales) { S.saidBales = true; later(1, () => say('BALES (ECO)', '…Es GO. Es GO con esa alarma…', '…We\'re GO. GO on that alarm…', 'NO CANON')); }
  }
  function stun(e, s) { e.stunT = Math.max(e.stunT, s); e.state = 'stun'; e.st = 0; const a = e.g.current(); if (a) a.paused = true; e.fan.removeFromParent(); for (const h of hazards) if (h.kind === 'slamRing' && h.e === e) h.dur = 0; }
  function poofFake(f) { f.alive = false; f.respawn = 6; W.puff(f.x, ground(f.x, f.z) + 4, f.z, 90, 5, 2, 2.5); sfx('glitch', { vol: 0.4 }); f.fan.removeFromParent(); }
  function reveal() {
    for (const f of fakes) if (f.alive) poofFake(f), (f.respawn = 11);
    stun(R, 8); S.revealT = 8; hud.toast(L('¡ESE ES EL REAL! TIENE SOMBRA', 'THAT\'S THE REAL ONE! IT HAS A SHADOW'), 1600, '#FFB000');
    later(0.8, () => say('ARMSTRONG', 'Está aturdido, Buzz. Ve a su espalda y arranca el depósito.', "It's stunned, Buzz. Get behind it and rip off the tank.", 'NO CANON', 3500));
  }
  function connectHose() {
    if (S.phase !== 3 || S.hoseK >= 0 || S.hoseCd > 0 || S.riding) return; if (hdist(P.x, P.z, N.x, N.z) > 5.5) { hud.toast(L('Acércate a Neil para conectar la manguera', 'Get close to Neil to connect the hose'), 1200); return; }
    S.hoseK = 0; P.act = 'point'; P.actT = 0; P.actDur = 1.1; nc('nc_hab_manguera_o2_recarga', { vol: 0.75 });
    if (!S.saidHose) { S.saidHose = true; say('ARMSTRONG', 'No le hagas caso. Conéctate. Respiramos juntos.', 'Don\'t listen. Hook up. We breathe together.', 'NO CANON', 3500); }
  }

  // ---------- fases ----------
  function setPhaseLabel() { hud.phase([L('FASE 1 · POLVO', 'PHASE 1 · DUST'), L('FASE 2 · COMBUSTIBLE', 'PHASE 2 · FUEL'), L('FASE 3 · FUEGO', 'PHASE 3 · FIRE')][S.phase - 1]); }
  function phase2() {
    S.phase = 2; S.hp = 70; S.absorbSaid = 0; S.tearK = 0; setPhaseLabel(); stun(R, 2.5); S.fuel = D.fuel; S.fuelSaid = 0; S.shuffleT = 22; hud.toast(L('FASE 2 · COMBUSTIBLE', 'PHASE 2 · FUEL'), 2000, '#FFB000'); sfx('stage', { vol: 0.6 }); roar(R, 0.8);
    later(0.6, () => { shuffle(true); say('DUKE (ECO)', 'Sesenta segundos…', 'Sixty seconds…', 'NO CANON · eco de la frase real'); });
    later(5, () => say('ARMSTRONG', 'Mira las sombras. El de verdad tiene sombra.', 'Watch the shadows. The real one casts a shadow.', 'NO CANON', 4000));
  }
  function shuffle(first) {
    const base = Math.random() * 6.28, spots = [0, 1, 2].map((i) => [Math.cos(base + i * 2.094) * 13, Math.sin(base + i * 2.094) * 13]); spots.sort(() => Math.random() - 0.5);
    const all = [R, ...fakes]; all.forEach((e, i) => { W.puff(e.x, ground(e.x, e.z) + 3, e.z, 50, 4, 1.5, 2); place(e, spots[i][0], spots[i][1]); e.alive = true; e.op = first ? 0 : 0.2; e.g.root.visible = true; e.state = 'idle'; e.cd = 1.5 + i * 0.9; e.respawn = 0; W.puff(e.x, ground(e.x, e.z) + 3, e.z, 50, 4, 1.5, 2); });
  }
  function phase3() {
    S.phase = 3; S.hp = 35; S.tearK = 0; setPhaseLabel(); S.riding = false; R.stunT = 0; R.state = 'idle'; for (const f of fakes) { f.alive = false; f.respawn = 1e9; f.g.root.visible = false; }
    music(BOSS_MUSIC, { vol: 0.38 }); roar(R, 1); nc('nc_61b_grieta_suelo_se_abre', { vol: 0.6 }); W.amber.color.set(0xff5a20); hud.toast(L('FASE 3 · FUEGO', 'PHASE 3 · FIRE'), 2000, '#FF4F00'); sfx('stage', { vol: 0.6 }); N.mode = 'follow';
    later(2, () => say('SUSURRO (VOZ DE ALDRIN, INVERTIDA)', 'Siempre serás el segundo… nunca volverás…', 'You\'ll always be second… you\'ll never go home…', 'NO CANON', 3800));
  }
  function breakerOpen() {
    S.mode = 'breaker'; R.state = 'dead'; const a = R.g.current(); if (a) a.paused = true; clearHazards();
    say('', 'El núcleo se abre: dentro hay un disyuntor roto.', 'The core opens: inside there is a broken circuit breaker.', '', 4000); later(1.2, () => say('ALDRIN', 'Ya sé cómo arreglar esto.', 'I know how to fix this.', 'NO CANON · saca el rotulador', 4000));
    breaker.visible = true; music(null); hum.stop(); nc('c6_62_chispa_cortocircuito', { vol: 0.8 }); { const c = nodePos(R, 'core-dsky', v1); sparks.burst(c.x, c.y, c.z, 60, 5, 'blue'); }
  }
  function clearHazards() { for (const h of hazards.splice(0)) disposeHazard(h); for (const e of ents) e.fan.removeFromParent(); }
  function disposeHazard(h) { for (const k of ['ring', 'm', 'orb']) if (h[k]) { h[k].removeFromParent(); h[k].dispose?.(); } if (h.kind === 'debris') h.o.removeFromParent(); }

  // ---------- tiempo total acumulado entre fases (G15) ----------
  const totalTime = () => S.pt[1] + S.pt[2] + S.pt[3];
  const savePT = () => { S.ptSave = 0; try { sessionStorage.setItem(TXT_PT, JSON.stringify(S.pt)); } catch {} };
  const fmtT = (t) => Math.floor(t / 60) + ':' + String(Math.round(t % 60)).padStart(2, '0');
  try { if (opts.startPhase > 1) { const o = JSON.parse(sessionStorage.getItem(TXT_PT) || 'null'); if (o) for (const k of [1, 2, 3]) S.pt[k] = +o[k] || 0; } else sessionStorage.removeItem(TXT_PT); } catch {}
  cleanups.push(() => { try { sessionStorage.removeItem(TXT_PT); } catch {} });

  // ---------- reintento / final ----------
  function resetPhase(ph) {
    clearHazards(); S.phase = ph; S.hp = PHASE_HP[ph]; S.o2 = 100; S.invulnT = 2; S.hudOffT = 0; S.hatch = 0; S.fuel = D.fuel; S.fuelSaid = 0; S.riding = false; S.leapT = -1; S.tearK = 0; savePT(); S.buffT = 0; S.hoseCd = 0; S.hoseK = -1; S.revealT = 0; S.slowT = 0;
    S.flash.cd = 0; S.flash.reload = 0; if (S.flash.shots < 4) S.flash.shots = 12; hud.hudOff(false);
    if (ph === 1) { for (const n of PLATES) { R.plates[n] = 2; const o = R.g.nodes[n]; if (o && o.userData.home) { o.userData.home.parent.add(o); o.position.copy(o.userData.home.p); o.quaternion.copy(o.userData.home.q); o.scale.copy(o.userData.home.s); o.visible = true; } } }
    place(R, SP.guardian.x, ph === 3 ? 0 : SP.guardian.z); R.yaw = Math.PI; R.state = 'idle'; R.stunT = 0; R.cd = 2.5; R.alive = true; R.op = 1; R.g.root.visible = true; R.g.setOpacity(1); R.g.play('idle', 0.1);
    const tank = R.g.nodes['fuel-tank']; if (tank) tank.visible = true;
    for (const f of fakes) { f.alive = false; f.g.root.visible = false; f.respawn = 1e9; }
    P.x = SP.player.x; P.z = SP.player.z; P.y = ground(P.x, P.z); P.vx = P.vz = P.vy = 0; P.act = null; P.air = false; N.x = P.x + 4; N.z = P.z - 2; N.mode = 'follow'; S.absorbSaid = 0; S.hintT = 0; hud.hint('');
    W.amber.color.set(ph === 3 ? 0xff5a20 : 0xffa040); setPhaseLabel(); S.mode = 'play';
    if (ph === 2) { shuffle(true); }
    if (ph === 3) { for (const f of fakes) f.respawn = 1e9; if (tank) tank.visible = false; }
  }
  function restartPhase() { failEl?.remove(); failEl = null; S.stats.retries++; resetPhase(S.phase); hud.toast(L('Reintento desde el inicio de la fase', 'Retrying from the start of the phase'), 1500); }
  function fail(reason) {
    if (S.over || S.mode === 'fail') return; S.mode = 'fail'; nc('nc_61c_despertar_sobresalto', { vol: 0.85 }); sfx('jingle_fail', { vol: 0.35 }); hum.stop(); document.exitPointerLock?.(); hud.white(1);
    clips(['c6_61c_armstrong_tampoco_dormir_en', 'c6_61c_aldrin_sone_polvo_en', 'c6_61c_armstrong_duerme_buzz_en']);
    failEl?.remove(); const o = failEl = hud.overlay(`<div class="bd-k">${L('NO CANON · SUEÑO', 'NON-CANON · DREAM')}</div><h2>${L('Aldrin despierta de golpe', 'Aldrin jolts awake')}</h2><p>${reason}</p><p>${L('Respira. Vuelve a cerrar los ojos: el sueño continúa desde el inicio de la fase.', 'Breathe. Close your eyes again: the dream resumes from the start of the phase.')}</p><div class="bd-row"><button data-a="r">${L('Reintentar fase', 'Retry phase')}</button><button class="bd-sec" data-a="q">${L('Despertar (salir)', 'Wake up (quit)')}</button></div>`);
    o.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); o.remove(); if (failEl === o) failEl = null; if (a === 'r') restartPhase(); else finish('lose', 'o2'); };
  }
  function finish(result, reason = '') {
    if (S.over) return; S.over = true; dead = true;
    const stats = { ...S.stats, time: Math.round(totalTime()), phaseTimes: { 1: Math.round(S.pt[1]), 2: Math.round(S.pt[2]), 3: Math.round(S.pt[3]) }, diff: dk, noRainHit: S.stats.rainHits === 0, reason };
    for (const f of cleanups.splice(0).reverse()) { try { f(); } catch (e) { console.error(e); } }
    stopVoices(); delete document.body.dataset.paused; setPaused(false);
    if (prevScreen) document.body.dataset.screen = prevScreen; else delete document.body.dataset.screen;
    if (restoreWorld && prevWorld) setWorld(prevWorld);
    const out = { result, stats };
    try { (result === 'win' ? onWin : onLose)?.(out); } catch (e) { console.error(e); }
    resolveRun(out);
  }

  // ---------- cinemáticas ----------
  let cine = null; // { t, dur, cam(t), lines:[[t,who,es,en,tag]], onEnd, lb }
  function playCine(c) { S.mode = 'cine'; hud.gameplay(false); c.t = 0; c.said = 0; c.lb = mountLetterbox({ id: 'boss-' + c.id, title: L('NO CANON · Sueño de Aldrin', 'NON-CANON · Aldrin\'s dream'), sub: c.sub, skipLabel: L('Saltar', 'Skip'), onSkip: () => endCine() }); cine = c; }
  function endCine() { if (!cine) return; const c = cine; cine = null; c.lb?.(); hud.sub('', ''); hud.gameplay(true); c.onEnd?.(); }
  const introCine = () => ({ id: 'intro', dur: 11, sub: L('Cráter Oeste', 'West Crater'),
    lines: [[0.5, '', 'El polvo se eleva sin viento, en espiral, en total silencio.', 'Dust rises without wind, spiralling, in total silence.', ''], [5.2, 'ALDRIN', '…Eso no está en el plan de vuelo.', '…That\'s not in the flight plan.', 'NO CANON'], [7.4, 'ARMSTRONG (POR RADIO, LEJOS)', 'Buzz, ¿qué ves?', 'Buzz, what do you see?', 'NO CANON'], [9.2, 'ALDRIN', 'Polvo, Neil. Polvo que se mueve.', 'Dust, Neil. Moving dust.', 'NO CANON']],
    step(t, dt) { const k = clamp(t / 6, 0, 1); const gy = ground(R.x, R.z); R.g.root.position.y = gy - 16 * (1 - k * k * (3 - 2 * k)); if (t < 6.5) W.puff(R.x + (Math.random() - 0.5) * 8, gy + Math.random() * 3, R.z + (Math.random() - 0.5) * 8, 4, 3, 3, 2.5);
      const a = -2.4 + t * 0.12; cam.position.set(R.x + Math.sin(a) * 26, gy + 4 + t * 0.5, R.z + Math.cos(a) * 26); cam.lookAt(R.x, gy + 6 + k * 3, R.z); if (!this.formed) { this.formed = true; nc('nc_61c_guardian_se_forma', { vol: 0.8 }); } if (t > 5 && !this.lit) { this.lit = true; sfx('beep', { vol: 0.5, rate: 0.7 }); } },
    onEnd() { R.g.root.position.y = ground(R.x, R.z); S.mode = 'play'; music(BOSS_MUSIC, { vol: 0.3 }); setTimeout(() => !dead && hud.hideHelp(), 9000); } });
  const outroCine = () => ({ id: 'outro', dur: 12, sub: L('Segundo… pero juntos', 'Second… but together'),
    lines: [[0.3, '', 'Aldrin empuja el disyuntor con la punta del rotulador. Clic.', 'Aldrin pushes the breaker in with the tip of his felt-tip pen. Click.', ''], [3, '', 'El Guardián se detiene, se deshace en polvo y cae lentamente, como nieve gris.', 'The Guardian stops, crumbles to dust and falls slowly, like grey snow.', ''], [8.2, 'ALDRIN', 'Segundo… pero juntos.', 'Second… but together.', 'NO CANON · en voz baja']],
    step(t) { if (t > 2.6 && !this.snow) { this.snow = true; nc('nc_61c_polvo_cae_como_nieve', { vol: 0.7 }); } const k = clamp((t - 1.5) / 6, 0, 1); R.g.setOpacity(1 - k); R.g.root.position.y = ground(R.x, R.z) - k * 4; if (t > 1.5 && t < 8) for (let i = 0; i < 6; i++) W.puff(R.x + (Math.random() - 0.5) * 12, ground(R.x, R.z) + 4 + Math.random() * 12, R.z + (Math.random() - 0.5) * 12, 1, 0.3, 0.1, 6);
      if (t > 7.6 && bootP && !bootP.parent) { bootP.position.set(R.x, ground(R.x, R.z) + 0.01, R.z); bootP.scale.setScalar(3); scene.add(bootP); }
      const gy = ground(R.x, R.z); if (this.dir == null) { this.dir = Math.atan2(P.x - R.x, P.z - R.z); } const a = this.dir + t * 0.03, rr = 20 + t * 0.5; cam.position.set(R.x + Math.sin(a) * rr, gy + 4 + t * 0.35, R.z + Math.cos(a) * rr); cam.lookAt(R.x, gy + Math.max(0.5, 7 - t * 0.6), R.z); },
    onEnd() { winCard(); } });
  function winCard() {
    S.mode = 'end'; stinger('mus_stinger_insignia_capitulo_100', 0.6); sfx('jingle_win', { vol: 0.3 }); document.exitPointerLock?.(); hud.gameplay(false);
    try { const a = store.get('achievements') || {}; let ch = false; if (!a.boss_guardian) { a.boss_guardian = Date.now(); ch = true; } if (S.stats.rainHits === 0 && !a.boss_norain) { a.boss_norain = Date.now(); ch = true; } if (ch) store.set('achievements', a); } catch {}
    const o = hud.overlay(`<div class="bd-k">${L('BITÁCORA · NO CANON · RAREZA OCULTA', 'LOGBOOK · NON-CANON · HIDDEN RARITY')}</div><h2>${L('El Guardián de Tranquilidad', 'The Guardian of Tranquility')}</h2>
      <p><b>${L('Esta criatura nunca existió; fue un sueño.', 'This creature never existed; it was a dream.')}</b></p>
      <p>${L('DATO REAL: el polvo lunar (regolito) sí es un enemigo real. Sus granos son afilados como vidrio roto porque no hay viento ni agua que los desgaste; se pega a todo por carga electrostática, rayó visores y dañó cierres y sellos de los trajes, y dentro del módulo olía «a pólvora quemada». Contiene diminutas esférulas de vidrio formadas por impactos de meteoritos. Fuente: NASA, Apollo Lunar Surface Journal.', 'REAL FACT: lunar dust (regolith) is a real enemy. Its grains are sharp as broken glass because no wind or water wears them down; it clings to everything through static charge, scratched visors, damaged suit seals, and inside the module it smelled "like spent gunpowder". It contains tiny glass spherules made by meteorite impacts. Source: NASA, Apollo Lunar Surface Journal.')}</p>
      <p>${L('Qué fue sueño y qué era real: el O₂ limitado, la gravedad de 1/6 y los micrometeoritos eran riesgos reales; el monstruo, las grietas y los clones, no.', 'What was dream and what was real: limited O₂, 1/6 gravity and micrometeorites were real risks; the monster, the chasms and the clones were not.')}</p>
      <p>${L('Insignia: «Segundo, pero juntos»', 'Badge: "Second, but together"')}${S.stats.rainHits === 0 ? ' · ' + L('Logro oculto: sin golpes de la «lluvia 1202»', 'Hidden achievement: no hits from the "1202 rain"') : ''}<br>${L('Tiempo total', 'Total time')} ${fmtT(totalTime())} (${L('F', 'P')}1 ${fmtT(S.pt[1])} · ${L('F', 'P')}2 ${fmtT(S.pt[2])} · ${L('F', 'P')}3 ${fmtT(S.pt[3])}) · ${L('golpes recibidos', 'hits taken')} ${S.stats.hits} · ${L('esquivas en cadena', 'chain dodges')} ${S.stats.perfect}</p>
      <div class="bd-row"><button data-a="c">${L('Despertar en Eagle', 'Wake up in Eagle')}</button></div>`);
    o.onclick = (e) => { if (e.target.closest('[data-a]')) { sfx('click'); finish('win'); } };
  }

  // ---------- inicio ----------
  for (const n of PLATES) { R.plates[n] = 2; const o = R.g.nodes[n]; if (o) o.userData.home = { parent: o.parent, p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }; }
  R.yaw = Math.PI; setPhaseLabel(); music(null);
  const startPh = clamp(+opts.startPhase || 1, 1, 3);
  if (startPh > 1 || skipIntro) { resetPhase(startPh); hud.gameplay(true); music(BOSS_MUSIC, { vol: S.phase === 3 ? 0.38 : 0.3 }); setTimeout(() => !dead && hud.hideHelp(), 9000); }
  else { R.g.root.position.y = -16; playCine(introCine()); }

  // ---------- bucle ----------
  const off = onTick((rdt, tt) => { if (dead) return; try { tick(rdt, tt); } catch (e) { console.error('boss tick', e); } mouseHit = false; mouseFlash = false; });
  cleanups.push(off);
  const fwdV = new THREE.Vector3();
  function tick(rdt, tt) {
    // tiempo (cámara lenta de «esquiva en cadena»)
    // congelado breve del impacto (hit-stop): el mundo casi se detiene 50-100 ms
    if (S.slowT > 0) S.slowT -= rdt; const stopK = S.hitStop > 0 ? 0.06 : 1; if (S.hitStop > 0) S.hitStop -= rdt; const dt = rdt * (S.slowT > 0 ? 0.35 : 1) * stopK; S.t += dt;
    W.update(dt); for (const e of ents) if (e.g.root.visible) { e.g.mixer.update(dt); paintGuardian(e, tt); e.hf.update(rdt); }
    sparks.update(rdt); WP.update(rdt); guardianLife(rdt, tt);
    W.amber.position.set(R.x, ground(R.x, R.z) + 6, R.z); W.amber.intensity = R.alive && S.mode !== 'end' ? (S.phase === 3 ? 32 : 22) * (0.6 + 0.4 * Math.sin(tt * 5)) : 0;
    if (cine) { cine.t += rdt; while (cine.lines && cine.said < cine.lines.length && cine.t >= cine.lines[cine.said][0]) { const l = cine.lines[cine.said++]; voiceLine(l[3]); hud.sub(l[1], L(l[2], l[3]), l[4], 0); } cine.step?.call(cine, cine.t, rdt); poseActors(dt); if (cine && cine.t >= cine.dur) endCine(); return; }
    if (S.mode === 'end' || S.mode === 'fail') { poseActors(dt); camFollow(dt); return; }
    S.stats.time = totalTime(); S.rt += rdt; S.pt[S.phase] += rdt; if ((S.ptSave = (S.ptSave || 0) + rdt) > 3) savePT();
    // ---------- jugador ----------
    const busy = P.act === 'fall' || S.hoseK >= 0 || S.riding || S.leapT >= 0 || S.mode === 'breaker';
    let a = busy ? { x: 0, y: 0 } : axis();
    const mx = a.x * Math.cos(camYaw) - a.y * Math.sin(camYaw), mz = -a.x * Math.sin(camYaw) - a.y * Math.cos(camYaw); const mag = Math.min(1, Math.hypot(mx, mz));
    if (S.leapT >= 0) { // «Salto del Águila»: arco hasta el lomo
      S.leapT += dt; const k = clamp(S.leapT / 1.3, 0, 1); const tank = nodePos(R, 'fuel-tank', v1); P.x = damp(P.x, tank.x, 4, dt) + (tank.x - P.x) * k * 0.1; P.z = damp(P.z, tank.z, 4, dt) + (tank.z - P.z) * k * 0.1; P.y = ground(P.x, P.z) + (tank.y - ground(P.x, P.z) + 0.6) * Math.sin(k * Math.PI * 0.5) + Math.sin(k * Math.PI) * 4;
      if (k >= 1) { S.leapT = -1; S.riding = true; S.tearK = 0; R.stunT = Math.max(R.stunT, 30); }
    } else if (S.riding) {
      const tank = nodePos(R, 'fuel-tank', v1); P.x = tank.x; P.z = tank.z; P.y = tank.y + 0.4; P.air = false;
      if (ACTD()) { S.tearK += dt / 1.5; if (Math.random() < 0.3) W.puff(tank.x, tank.y, tank.z, 3, 1.5, 1, 0.8); } else S.tearK = Math.max(0, S.tearK - dt);
      if (S.tearK >= 1) tearTank();
    } else {
      const vmax = 3.4; const accel = P.air ? 0.8 : 4;
      if (S.dashT > 0) { S.dashT -= dt; } else { P.vx = damp(P.vx, mx * vmax, accel, dt); P.vz = damp(P.vz, mz * vmax, accel, dt); }
      P.speed = Math.hypot(P.vx, P.vz);
      if (mag > 0.15 && S.dashT <= 0) { const ty = Math.atan2(mx, mz); let d = ty - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 8); }
      P.x += P.vx * dt; P.z += P.vz * dt;
      // salto / esquiva
      const jumpP = pressed('Space') || bpressed('jump');
      if (jumpP && !P.air && !P.act && useO2(2)) { P.vy = 2.7; P.air = true; P.jump = true; sfx('switch', { vol: 0.3, rate: 0.6 }); }
      S.dashCd -= dt; if ((pressed('ShiftLeft', 'ShiftRight') || bpressed('dash')) && S.dashCd <= 0 && P.act !== 'fall' && useO2(6)) { const dx = mag > 0.15 ? mx / mag : Math.sin(P.yaw), dz = mag > 0.15 ? mz / mag : Math.cos(P.yaw); P.vx = dx * 10; P.vz = dz * 10; S.dashT = 0.24; S.dashCd = 0.65; S.invulnT = Math.max(S.invulnT, 0.32); S.lastDash = S.t; W.puff(P.x, ground(P.x, P.z) + 0.1, P.z, 14, 1.5, 0.6, 0.8); nc('nc_hab_esquiva_dash', { vol: 0.6, jit: 0.08 }); }
      const g = ground(P.x, P.z);
      if (P.air) { P.vy -= G * dt; P.y += P.vy * dt; if (P.y <= g) { P.y = g; P.air = false; P.jump = false; W.puff(P.x, g + 0.05, P.z, 10, 1, 0.5, 1); sfx('step1', { vol: 0.35 }); } } else P.y = g;
      collide();
    }
    // fase 2, paso 3: con el Guardián aturdido basta mantener E junto a su espalda para arrancar el depósito (sin salto)
    const tankP = S.phase === 2 && R.alive ? nodePos(R, 'fuel-tank', vT) : null;
    const tearNear = !!tankP && S.mode === 'play' && R.stunT > 0 && !busy && hdist(P.x, P.z, tankP.x, tankP.z) < 5.5;
    if (tearNear && ACTD()) { S.tearK += dt / 1.2; R.stunT = Math.max(R.stunT, 1); if (Math.random() < 0.3) W.puff(tankP.x, tankP.y, tankP.z, 3, 1.5, 1, 0.8); }
    else if (S.phase === 2 && !S.riding) S.tearK = Math.max(0, S.tearK - dt);
    if (S.phase === 2 && S.tearK >= 1 && !S.riding) tearTank();
    // acciones
    if (!busy || S.mode === 'breaker') {
      if (S.mode === 'breaker') { hud.prompt(isTouch ? L('MARTILLO: cierra el disyuntor con el rotulador', 'HAMMER: close the breaker with the pen') : L('E · cierra el disyuntor con el rotulador', 'E · close the breaker with the pen')); if (ACT()) { hud.prompt(''); breaker.lev.rotation.x = -0.7; nc('nc_61c_disyuntor_clic_final', { vol: 0.9 }); S.mode = 'outro'; later(0.6, () => playCine(outroCine())); } }
      else {
        if (pressed('Digit1', 'Numpad1')) setWeapon(0); if (pressed('Digit2', 'Numpad2')) setWeapon(1); if (bpressed('tool')) setWeapon(WP.index + 1);
        if (ACT() && !tearNear) hammer();
        if (pressed('KeyF') || bpressed('flash') || mouseFlash) flash();
        if (pressed('KeyQ') || bpressed('hose')) connectHose();
      }
    }
    if (P.act) { P.actT += dt; if (P.act === 'swing') { const w = WP.def; if (!P.whoosh && P.actT > w.hitAt * 0.62) { P.whoosh = true; nc('nc_hab_esquiva_dash', { vol: w.id === 'mallet' ? 0.45 : 0.3, rate: w.id === 'mallet' ? 0.75 : 1.35, jit: 0.06 }); } if (!P.hitDone && P.actT > w.hitAt) { P.hitDone = true; resolveHammer(); } } if (P.actT >= P.actDur) P.act = null; }
    // O₂: recuperación al quedarse quieto (Normal), cartuchos
    S.invulnT -= dt; if (S.hudOffT > 0) { S.hudOffT -= dt; if (S.hudOffT <= 0) hud.hudOff(false); }
    if (P.speed < 0.3 && !P.air && !P.act) S.idleT += dt; else S.idleT = 0;
    if (S.idleT > 1.2 && D.regen > 0) S.o2 = Math.min(100, S.o2 + D.regen * dt);
    for (const c of carts) { if (c.cd > 0) { c.cd -= dt; c.m.visible = c.cd <= 0; continue; } c.m.rotation.y += dt * 2; c.m.position.y = ground(c.x, c.z) + 0.45 + Math.sin(tt * 3) * 0.08; if (hdist(P.x, P.z, c.x, c.z) < 1.3 && P.y - ground(c.x, c.z) < 1.5) { S.o2 = Math.min(100, S.o2 + 30); c.cd = 14; c.m.visible = false; sfx('ok', { vol: 0.6 }); hud.toast('+30 O₂', 900, '#F2EFE6'); } }
    // manguera
    if (S.hoseK >= 0) { S.hoseK += dt; if (S.hoseK >= 1) { S.hoseK = -1; S.o2 = 100; S.buffT = 10; S.hoseCd = 20; hud.white(0.35); hud.toast(L('RESPIRAMOS JUNTOS · NÚCLEO EXPUESTO', 'BREATHING TOGETHER · CORE EXPOSED'), 1600, '#F2EFE6'); if (!S.piano) { S.piano = true; music('ambient', { vol: 0.35 }); } } }
    if (S.piano && S.buffT <= 0 && S.hoseK < 0 && S.mode === 'play') { S.piano = false; music(BOSS_MUSIC, { vol: 0.38 }); }
    if (S.buffT > 0) S.buffT -= dt; if (S.hoseCd > 0) { S.hoseCd -= dt; if (S.o2 < 25) { S.hoseCd = 0; hud.toast(L('RESPIRAR JUNTOS: manguera lista', 'BREATHE TOGETHER: hose ready'), 1200, '#F2EFE6'); } }
    if (hose) { const show = S.phase === 3 && (S.hoseK >= 0 || S.buffT > 0); hose.visible = show; if (show) { const ax = P.x, az = P.z, bx = N.x, bz = N.z; const d = Math.max(0.5, Math.hypot(bx - ax, bz - az)); hose.position.set(ax, P.y + 1.1, az); hose.rotation.set(0, Math.atan2(-(bz - az), bx - ax), 0); hose.scale.set(d / 2.05, 1, 1); hoseMixer.update(dt); } }
    // flash
    const F = S.flash; if (F.cd > 0) F.cd -= dt; if (F.reload > 0) { F.reload -= dt; if (F.reload <= 0) { F.shots = 12; hud.toast(L('Carrete nuevo: 12 disparos', 'New magazine: 12 shots'), 900); } }
    // ---------- Guardianes ----------
    for (const e of ents) entTick(e, dt, tt);
    // fase 2: cuenta atrás del depósito y barajado de clones
    if (S.phase === 2 && S.mode === 'play') {
      if (!S.riding && S.leapT < 0) S.fuel -= dt;
      if (S.fuel <= 30 && S.fuelSaid < 1) { S.fuelSaid = 1; say('DUKE (ECO)', 'Treinta segundos…', 'Thirty seconds…', 'NO CANON'); }
      if (S.fuel <= 0) fuelBlast();
      if (S.revealT > 0) S.revealT -= dt; else if (N.mode === 'pad' && R.stunT <= 0) { N.mode = 'follow'; }
      S.shuffleT -= dt; if (S.shuffleT <= 0 && S.revealT <= 0 && !S.riding && S.leapT < 0) { S.shuffleT = 20; shuffle(false); hud.toast(L('Los Guardianes se reordenan', 'The Guardians reshuffle'), 1100); }
    }
    // fase 1: lluvia 1202
    if (S.phase === 1 && S.mode === 'play') { S.rainT -= dt; if (S.rainT <= 0) { S.rainT = 15 + Math.random() * 5; rain1202(); } }
    // fase 3: ondas de calor, escotilla, susurros
    if (S.phase === 3 && S.mode === 'play') {
      S.heatT -= dt; if (S.heatT <= 0 && R.stunT <= 0) { S.heatT = 7 + Math.random() * 2; heatWave(R); }
      const tgt = { x: ARENA.lm.x, z: ARENA.lm.z - 9 }; const near = hdist(R.x, R.z, tgt.x, tgt.z) < 2;
      if (near && R.stunT <= 0) { S.hatch += dt / D.hatch; if (Math.random() < 0.2) W.puff(W.hatch.x + (Math.random() - 0.5) * 2, W.hatch.y - 1, W.hatch.z, 4, 1.5, 1.5, 1.5); }
      W.hatchGlow.material.opacity = S.hatch > 0.02 ? (Math.sin(tt * 8) > 0 ? 0.9 : 0.15) : 0;
      if (S.hatch >= 1) fail(L('El Guardián selló la escotilla de Eagle con polvo.', 'The Guardian sealed Eagle\'s hatch with dust.'));
      S.whisperT -= dt; if (S.whisperT <= 0) { S.whisperT = 18; say('SUSURRO', 'Siempre serás el segundo…', 'You\'ll always be second…', 'NO CANON', 2600); }
    } else W.hatchGlow.material.opacity = 0;
    hazardsTick(dt);
    neilTick(dt);
    poseActors(dt);
    camFollow(dt);
    hudTick();
    if (DEBUG) dbg('boss', API);
  }
  // capa procedural sobre el Guardián (grupo interior): respiración, retroceso al recibir golpes, anticipación de ataques
  // y temblor de pasos; además el zumbido grave que sube al acercarse
  function guardianLife(dt, tt) {
    for (const e of ents) { const inn = e.inner; if (!inn) continue; if (!e.g.root.visible) continue;
      e.recoil = Math.max(0, e.recoil - dt * 3.2);
      const tele = e.state === 'tele' ? Math.min(1, e.st / (e.teleDur || 0.3)) : 0;
      const breathe = Math.sin(tt * 1.4 + e.ph);
      const lean = -e.recoil * 0.09 - (e.atk === 'slam' ? 0.07 : 0.03) * tele * tele;
      inn.rotation.x = lean + breathe * 0.006; inn.rotation.z = Math.sin(tt * 0.9 + e.ph) * 0.012 + Math.sin(tt * 47) * e.recoil * 0.02;
      inn.position.set(Math.sin(tt * 53) * e.recoil * 0.06, breathe * 0.07 + tele * 0.25, -e.recoil * 0.45);
      if (e.stunT > 0) inn.rotation.z += Math.sin(tt * 9) * 0.02; }
    const want = S.mode === 'play' && R.alive && R.g.root.visible ? clamp(0.5 - hdist(P.x, P.z, R.x, R.z) / 60, 0.06, 0.4) * (R.stunT > 0 ? 0.5 : 1) : 0;
    hum.set(want, dt);
  }
  // rugido: temblor, anillo de polvo y zumbido (cambios de fase)
  function roar(e, k = 1) { S.shake = Math.max(S.shake, 0.9 * k); e.recoil = 1.2; e.hf.hit(0.6); const gy = ground(e.x, e.z);
    W.puff(e.x, gy + 0.3, e.z, 120, 9, 0.8, 2.2); const ring = W.fx('dust-puff', { color: 0xcfc6b8, opacity: 0.45, additive: false }); ring.position.set(e.x, gy + 0.2, e.z); scene.add(ring); hazards.push({ kind: 'fx', ring, t: 0, dur: 1.1, grow: 14 });
    nc('nc_61c_guardian_se_forma', { vol: 0.55 * k, rate: 1.15 }); }
  function tearTank() {
    S.riding = false; S.tearK = 0; const tank = R.g.nodes['fuel-tank']; const p = nodePos(R, 'fuel-tank', new THREE.Vector3()); if (tank) tank.visible = false;
    sfx('explosion', { vol: 0.9 }); S.shake = 1; W.puff(p.x, p.y, p.z, 100, 6, 2, 2.5); hud.toast(L('¡DEPÓSITO ARRANCADO!', 'TANK RIPPED OFF!'), 1600, '#FFB000');
    const back = v1.set(-Math.sin(R.yaw), 0, -Math.cos(R.yaw)); P.vx = back.x * 4; P.vz = back.z * 4; P.vy = 2; P.air = true; S.invulnT = 2;
    R.stunT = 2; S.hp = 35; phase3();
  }
  function collide() {
    const push = (x, z, m) => { const dx = P.x - x, dz = P.z - z, d = Math.hypot(dx, dz); if (d < m && d > 1e-3) { P.x = x + (dx / d) * m; P.z = z + (dz / d) * m; } };
    for (const [x, z, r] of W.colliders) push(x, z, r + 0.35);
    for (const e of ents) if (e.alive && e.op > 0.5 && e.state !== 'dead') push(e.x, e.z, 2.7);
    const r = Math.hypot(P.x, P.z); if (r > ARENA.r) { P.x *= ARENA.r / r; P.z *= ARENA.r / r; }
  }
  function entTick(e, dt, tt) {
    const root = e.g.root;
    if (e.fake) { if (!e.alive) { if (e.op > 0) { e.op = Math.max(0, e.op - dt * 2); applyOp(e); if (e.op <= 0) root.visible = false; } if (S.phase === 2 && e.respawn < 1e8) { e.respawn -= dt; if (e.respawn <= 0 && S.revealT <= 0) { const a = Math.random() * 6.28; place(e, Math.cos(a) * 10, Math.sin(a) * 10); e.alive = true; e.op = 0.01; root.visible = true; e.state = 'idle'; e.cd = 2; W.puff(e.x, ground(e.x, e.z) + 3, e.z, 50, 4, 1.5, 2); } } return; } }
    if (e.alive && e.op < 1) { e.op = Math.min(1, e.op + dt * 1.5); applyOp(e); }
    if (!e.alive || e.state === 'dead' || S.mode !== 'play') { if (S.mode === 'breaker') { const c = nodePos(R, 'core-dsky', v1); const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || 1; breaker.position.set(c.x + (dx / d) * 1.3, c.y, c.z + (dz / d) * 1.3); breaker.lookAt(P.x, c.y, P.z); } return; }
    const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz); const want = Math.atan2(dx, dz);
    if (e.stunT > 0) { e.stunT -= dt; root.rotation.x = damp(root.rotation.x, 0.1, 4, dt); if (Math.random() < 0.15) W.puff(e.x + (Math.random() - 0.5) * 6, ground(e.x, e.z) + 1 + Math.random() * 6, e.z + (Math.random() - 0.5) * 6, 2, 1, 0.5, 1.5);
      if (e.stunT <= 0) { e.state = 'idle'; e.cd = 1.2 * D.cd; root.rotation.x = 0; e.g.play('idle', 0.3); } return; }
    root.rotation.x = damp(root.rotation.x, 0, 4, dt);
    e.st += dt;
    if (e.state === 'idle') {
      let turn = want - e.yaw; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); e.yaw += clamp(turn, -1.1 * dt, 1.1 * dt);
      let walk = 0;
      if (S.phase === 3 && !e.fake) { const tx = ARENA.lm.x, tz = ARENA.lm.z - 9, d = hdist(e.x, e.z, tx, tz); if (d > 1.5) { const sp = D.crawl; e.x += ((tx - e.x) / d) * sp * dt; e.z += ((tz - e.z) / d) * sp * dt; walk = 1; } }
      else if (dist > 15 && S.phase === 1) { const sp = 1.3; e.x += (dx / dist) * sp * dt; e.z += (dz / dist) * sp * dt; walk = 1; }
      const ia = e.g.A.idle; if (ia) ia.timeScale = walk ? 1.7 : 1;
      if (walk && Math.random() < dt * 1.5) { W.puff(e.x + (Math.random() - 0.5) * 6, ground(e.x, e.z) + 0.2, e.z + (Math.random() - 0.5) * 6, 10, 2, 0.6, 1.5); if (!e.fake && dist < 22) { S.shake = Math.max(S.shake, 0.12); sfx('thud', { vol: 0.25, rate: 0.55 }); } }
      e.cd -= dt;
      if (e.cd <= 0 && Math.abs(turn) < 0.5) {
        let k; if (S.phase === 3) k = dist < 13 ? (Math.random() < 0.6 ? 'sweep' : 'slam') : null;
        else if (dist < 12.5) k = Math.random() < 0.55 ? 'sweep' : 'slam'; else if (dist < 20) k = 'slam'; else k = 'spikes';
        if (k) startAttack(e, k); e.cd = (S.phase === 1 ? 2.3 : S.phase === 2 ? 3.2 : 4.5) * D.cd + Math.random();
      }
    } else if (e.state === 'tele') {
      if (e.atk === 'sweep') { e.fan.material.opacity = 0.4 + 0.4 * Math.abs(Math.sin(e.st * 9)); if (Math.random() < 0.6) { const a = e.yaw + (Math.random() - 0.5) * SW.half * 2, r = 2 + Math.random() * SW.r; W.puff(e.x + Math.sin(a) * r, ground(e.x, e.z) + 0.05, e.z + Math.cos(a) * r, 2, 0.4, 1.2, 0.5); } }
      if (e.st >= (e.teleDur || 0.3)) { e.state = 'atk'; e.st = 0; e.hit = false; if (e.atk === 'spikes') { e.state = 'idle'; } else e.g.play(e.atk, 0.15); }
    } else if (e.state === 'atk') {
      if (e.atk === 'slam' && e.lunge) { const k = clamp(e.st / SLAM_HIT, 0, 1), s = k * k * (3 - 2 * k); e.x = e.lunge.sx + (e.lunge.ex - e.lunge.sx) * s; e.z = e.lunge.sz + (e.lunge.ez - e.lunge.sz) * s; }
      if (e.atk === 'sweep') { e.fan.material.opacity = Math.max(0, e.fan.material.opacity - dt * 1.5);
        if (!e.hit && e.st >= SW.t) { e.hit = true; sfx('boom', { vol: 0.5, rate: 1.3 }); S.shake = Math.max(S.shake, 0.35);
          const lx = Math.cos(-e.yaw) * dx - Math.sin(-e.yaw) * dz; const lz = Math.sin(-e.yaw) * dx + Math.cos(-e.yaw) * dz; const ang = Math.abs(Math.atan2(lx, lz));
          for (let i = 0; i < 16; i++) { const a = e.yaw + (i / 15 - 0.5) * SW.half * 2; W.puff(e.x + Math.sin(a) * SW.r * 0.7, ground(e.x, e.z) + 0.2, e.z + Math.cos(a) * SW.r * 0.7, 3, 2, 1, 1); }
          if (dist < SW.r && ang < SW.half && P.y - ground(P.x, P.z) < 1.4) hurt(e.fake ? 12 : 24, { x: e.x, z: e.z }); }
        if (e.st > 0.4 + SW.t) e.fan.removeFromParent(); }
      const dur = e.g.A[e.atk]?.getClip().duration || 2.5; if (e.st >= dur) { e.state = 'idle'; e.st = 0; e.lunge = null; e.g.play('idle', 0.35); e.fan.removeFromParent(); }
    }
    place(e, e.x, e.z); root.rotation.y = e.yaw;
  }
  function hazardsTick(dt) {
    for (let i = hazards.length - 1; i >= 0; i--) { const h = hazards[i]; h.t += dt; const k = h.dur ? h.t / h.dur : 1;
      if (h.kind === 'timer') { if (h.t >= h.dur) { hazards.splice(i, 1); h.f(); } continue; }
      if (h.kind === 'slamRing') { h.ring.scale.setScalar(Math.max(0.1, h.r * Math.min(1, k * 1.15))); h.ring.setOpacity(0.5 + 0.4 * Math.abs(Math.sin(h.t * 10)));
        if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); if (h.e.state === 'atk' && h.e.atk === 'slam' && h.e.stunT <= 0) { sfx('boom', { vol: 0.9 }); S.shake = Math.max(S.shake, 0.9); W.puff(h.pos.x, h.pos.y + 0.3, h.pos.z, 70, 6, 1.6, 1.8);
          const ring = W.fx('dust-puff', { color: 0xcfc6b8, opacity: 0.5, additive: false }); ring.position.copy(h.pos); scene.add(ring); hazards.push({ kind: 'fx', ring, t: 0, dur: 0.8, grow: 6 });
          if (hdist(P.x, P.z, h.pos.x, h.pos.z) < h.r && P.y - ground(P.x, P.z) < 1.6) hurt(h.e.fake ? 14 : 28, h.pos); } } continue; }
      if (h.kind === 'spike') { if (h.t < h.tel) { h.ring.setOpacity(0.4 + 0.5 * Math.abs(Math.sin(h.t * 12))); } else { h.ring.visible = false; h.m.visible = true; const u = h.t - h.tel; h.m.scale.y = u < 0.15 ? Math.max(0.001, u / 0.15) : u > 1 ? Math.max(0.001, 1 - (u - 1) / 0.4) : 1; if (!h.hit) { h.hit = true; sfx('thud', { vol: 0.5, rate: 1.4 }); W.puff(h.x, ground(h.x, h.z) + 0.2, h.z, 12, 2, 2, 1); if (hdist(P.x, P.z, h.x, h.z) < 1.7 && P.y - ground(P.x, P.z) < 1.8) hurt(15 * h.k, { x: h.x, z: h.z }); } } if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); } continue; }
      if (h.kind === 'orb') { h.orb.position.y = h.gy + 26 * (1 - k) + 0.4; h.ring.setOpacity(0.35 + 0.5 * Math.abs(Math.sin(h.t * 10))); if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); W.puff(h.x, h.gy + 0.2, h.z, 16, 2, 1.5, 1); sfx('glitch', { vol: 0.3, rate: 1.3 });
          if (hdist(P.x, P.z, h.x, h.z) < 1.5 && P.y - h.gy < 2) { if (hurt(6, { x: h.x, z: h.z })) { S.stats.rainHits++; S.hudOffT = 4; hud.hudOff(true); hud.toast(L('1202 · HUD APAGADO', '1202 · HUD OFFLINE'), 1500, '#FFB000'); } } } continue; }
      if (h.kind === 'heatTele') { h.ring.scale.setScalar(3 + Math.sin(h.t * 14) * 0.4); h.ring.setOpacity(0.4 + 0.5 * Math.abs(Math.sin(h.t * 9))); if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); const ring = W.fx('heat-ring', { color: 0xff5a10 }); ring.position.set(h.e.x, ground(h.e.x, h.e.z) + 0.1, h.e.z); scene.add(ring); hazards.push({ kind: 'heat', ring, cx: h.e.x, cz: h.e.z, t: 0, dur: 32 / 7, hit: false }); sfx('boom', { vol: 0.4, rate: 0.7 }); nc('nc_61c_ondas_calor_fase3_loop', { vol: 0.5 }); } continue; }
      if (h.kind === 'heat') { const r = 2 + h.t * 7; h.ring.scale.setScalar(r); h.ring.position.y = ground(h.cx, h.cz) + 0.1; h.ring.setOpacity(0.9 * (1 - k * 0.6)); const d = hdist(P.x, P.z, h.cx, h.cz); if (!h.hit && Math.abs(d - r) < 0.9 && P.y - ground(P.x, P.z) < 0.5) { h.hit = true; hurt(18, { x: h.cx, z: h.cz }); } if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); } continue; }
      if (h.kind === 'fx') { h.ring.scale.setScalar(1 + h.grow * k); h.ring.setOpacity(0.8 * (1 - k)); if (h.t >= h.dur) { hazards.splice(i, 1); disposeHazard(h); } continue; }
      if (h.kind === 'debris') { h.vel.y -= G * dt; h.o.position.addScaledVector(h.vel, dt); h.o.rotation.x += h.spin.x * dt; h.o.rotation.y += h.spin.y * dt; if (h.o.position.y < ground(h.o.position.x, h.o.position.z)) { h.o.position.y = ground(h.o.position.x, h.o.position.z); h.vel.set(0, 0, 0); h.spin.set(0, 0, 0); } if (h.t >= h.dur) { hazards.splice(i, 1); h.o.visible = false; } continue; }
    }
  }
  function neilTick(dt) {
    let tx, tz; if (N.mode === 'pad') { tx = N.tx; tz = N.tz; } else { const back = Math.atan2(P.x - R.x, P.z - R.z); tx = P.x + Math.sin(back + 1.75) * 4; tz = P.z + Math.cos(back + 1.75) * 4; }
    const d = hdist(N.x, N.z, tx, tz); const sp = N.mode === 'pad' ? 9 : d > 1 ? Math.min(3.6, d * 1.2) : 0; if (d > 0.05) { N.x += ((tx - N.x) / d) * Math.min(d, sp * dt); N.z += ((tz - N.z) / d) * Math.min(d, sp * dt); N.yaw = Math.atan2(tx - N.x, tz - N.z); }
    const r = Math.hypot(N.x, N.z); if (r > ARENA.r) { N.x *= ARENA.r / r; N.z *= ARENA.r / r; }
    N.speed = sp > 0.3 && d > 0.3 ? Math.min(3.6, sp) : 0; if (d < 0.5) N.yaw = Math.atan2(R.x - N.x, R.z - N.z);
    const padOn = S.phase === 2 && N.mode === 'pad' && R.stunT > 0 && d < 0.6 && !S.riding && S.leapT < 0; ringJump.visible = padOn; if (padOn) { ringJump.position.set(N.x, ground(N.x, N.z) + 0.1, N.z); ringJump.setOpacity(0.5 + 0.4 * Math.abs(Math.sin(S.t * 6))); }
  }
  function poseActors(dt) {
    ast.root.position.set(P.x, P.y, P.z); ast.root.rotation.y = P.yaw; ast.pose(dt, { speed: S.riding || S.leapT >= 0 ? 0 : P.speed, jump: !!(P.jump && P.air), act: P.act === 'swing' ? null : P.act });
    // golpe con el arma: capa procedural sobre hombro/codo/torso; estela solo en la fase rápida del golpe
    const w = WP.def; let fast = false;
    if (P.act === 'swing') { const k = clamp(P.actT / P.actDur, 0, 1); swingPose(ast, k, w); const hk = w.hitAt / w.dur; fast = k > hk * 0.6 && k < hk + 0.12; }
    ast.root.updateMatrixWorld(true); WP.headWorld(vT); WP.obj.getWorldPosition(v2); v2.lerp(vT, 0.45); trail.push(vT, v2, fast, dt || 0.016);
    neil.root.position.set(N.x, ground(N.x, N.z), N.z); neil.root.rotation.y = N.yaw; neil.pose(dt, { speed: N.speed, act: S.hoseK >= 0 ? 'point' : (S.phase === 2 && N.mode === 'pad' && R.stunT > 0 ? 'point' : null) });
  }
  function camFollow(dt) {
    if (S.mode === 'outro' || cine) return;
    let tx = P.x, tz = P.z, ty = P.y + 1.4;
    if (lock && R.alive) { const want = Math.atan2(P.x - R.x, P.z - R.z) + manualYaw; let d = want - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); camYaw += d * Math.min(1, dt * 4); }
    const dist = S.riding ? 14 : camDist; const pitch = S.riding ? 0.5 : camPitch;
    let cx = tx + Math.sin(camYaw) * Math.cos(pitch) * dist, cz = tz + Math.cos(camYaw) * Math.cos(pitch) * dist; let cy = ty + Math.sin(pitch) * dist + 1;
    // la cámara no puede meterse en el gólem: a menos de 6 m de un Guardián retrocede (sin cruzarlo) y sube
    for (const e of ents) { if (!e.alive || !e.g.root.visible || e.op < 0.3) continue; const dx = cx - e.x, dz = cz - e.z, d = Math.hypot(dx, dz);
      if (d < CAM_MIN) { if (d > 1e-3) { cx = e.x + (dx / d) * CAM_MIN; cz = e.z + (dz / d) * CAM_MIN; } else cz = e.z - CAM_MIN; cy += (CAM_MIN - d) * 0.9; } }
    cy = Math.max(cy, ground(cx, cz) + 0.8);
    camP.x = damp(camP.x, cx, 6, dt); camP.y = damp(camP.y, cy, 6, dt); camP.z = damp(camP.z, cz, 6, dt); cam.position.copy(camP);
    // semitransparente si la cámara (ya suavizada) entra en su volumen
    for (const e of ents) { const g = e.g; const inside = e.alive && g.root.visible && hdist(camP.x, camP.z, e.x, e.z) < (g.radius || 4) * 0.55 && camP.y < ground(e.x, e.z) + (g.height || 16) + 1; const want = inside ? 0.3 : 1; const o = e.camOp ?? 1; const n = damp(o, want, 8, dt); e.camOp = Math.abs(n - 1) < 0.01 ? 1 : n; if (e.camOp !== o && e.op >= 1) applyOp(e); }
    if (S.shake > 0) { S.shake = Math.max(0, S.shake - dt * 1.6); cam.position.x += (Math.random() - 0.5) * S.shake * 0.5; cam.position.y += (Math.random() - 0.5) * S.shake * 0.5; }
    if (lock && R.alive) { const core = nodePos(R, 'core-dsky', v2); look.set(tx + (core.x - tx) * 0.35, ty + (Math.min(core.y, ty + 8) - ty) * 0.45, tz + (core.z - tz) * 0.35); } else look.set(tx, ty, tz);
    lookS.x = damp(lookS.x, look.x, 8, dt); lookS.y = damp(lookS.y, look.y, 8, dt); lookS.z = damp(lookS.z, look.z, 8, dt); cam.lookAt(lookS); cam.fov = cam.aspect < 1 ? 72 : 60; cam.updateProjectionMatrix();
  }
  function hudTick() {
    hud.hp(S.hp); hud.o2(S.o2, S.buffT > 0 ? L('NÚCLEO · ', 'CORE · ') + Math.ceil(S.buffT) + ' s' : '');
    const F = S.flash; hud.tool('flash', { n: F.reload > 0 ? '…' : String(F.shots), cd: F.reload > 0 ? 1 - F.reload / 4 : F.cd > 0 ? 1 - F.cd / (5 / Math.max(0.8, D.cd)) : 0, off: F.reload > 0 || F.cd > 0, ready: F.cd <= 0 && F.reload <= 0 });
    hud.tool('hammer', { ready: P.act !== 'swing', cd: P.act === 'swing' ? clamp(P.actT / P.actDur, 0, 1) : 0, n: WP.def.o2 ? '-' + WP.def.o2 + ' O₂' : '' }); hud.tool('dash', { off: S.dashCd > 0, cd: S.dashCd > 0 ? 1 - S.dashCd / 0.65 : 0 });
    hud.tool('hose', { off: S.phase !== 3 || S.hoseCd > 0, ready: S.phase === 3 && S.hoseCd <= 0 && hdist(P.x, P.z, N.x, N.z) < 5.5, cd: S.hoseCd > 0 ? 1 - S.hoseCd / 20 : 0 });
    if (S.phase === 2) hud.big(Math.ceil(Math.max(0, S.fuel)) + ' s', S.fuel < 30); else hud.big('');
    hud.meter(S.phase === 3 ? L('ESCOTILLA DE EAGLE CUBIERTA', 'EAGLE HATCH COVERED') : '', S.hatch);
    // objetivo: un icono de tecla grande por paso (el paso activo se resalta)
    const kk = (k) => (isTouch ? { E: L('MART.', 'HAM.'), F: 'FLASH', Q: L('MANG.', 'HOSE'), M: L('MOVER', 'MOVE') }[k] : k === 'M' ? 'WASD' : k);
    let sub = '', steps = [];
    const stunned = R.alive && R.stunT > 0;
    const tankP = S.phase === 2 && R.alive ? nodePos(R, 'fuel-tank', vT) : null;
    if (S.mode === 'breaker') steps = [{ k: kk('E'), t: L('Cierra el disyuntor roto del núcleo', 'Close the broken breaker in the core'), on: true }];
    else if (S.phase === 1) { const left = PLATES.filter((n) => R.plates[n] > 0).length;
      steps = [{ k: kk('E'), t: L(`Rompe las placas de basalto (${4 - left}/4)`, `Break the basalt plates (${4 - left}/4)`), on: left > 0, done: left === 0 }, { k: kk('F'), t: L('Flash: aturde al Guardián', 'Flash: stun the Guardian'), on: left === 0 && !stunned }, { k: kk('E'), t: L('Martillo al núcleo DSKY', 'Hammer the DSKY core'), on: left === 0 && stunned }];
      sub = left ? L('Rodillas: siempre. Hombros: cuando está aturdido (flash) o tras su golpe al suelo.', 'Knees: anytime. Shoulders: while stunned (flash) or after its ground slam.') : L('Flash + golpe en menos de 1,5 s = «Foto y golpe» ×2,5', 'Flash + hit within 1.5 s = "Photo strike" ×2.5'); }
    else if (S.phase === 2) { const near = !!tankP && hdist(P.x, P.z, tankP.x, tankP.z) < 5.5;
      steps = [{ k: kk('F'), t: L('Flash al Guardián que proyecta sombra (lo aturde 8 s)', 'Flash the Guardian that casts a shadow (stuns it 8 s)'), on: !stunned, done: stunned }, { k: kk('M'), t: L('Ve a su espalda', 'Get behind it'), on: stunned && !near, done: stunned && near }, { k: kk('E'), t: L('Mantén E junto al depósito', 'Hold E next to the tank'), on: stunned && near }];
      sub = L('Los clones de polvo no tienen sombra. Si la cuenta llega a 0, la onda vacía tu O₂.', 'Dust clones have no shadow. If the countdown hits 0, the blast drains your O₂.'); }
    else { const open = S.buffT > 0 || stunned;
      steps = [{ k: kk('Q'), t: L('Conecta la manguera con Neil: expone el núcleo', 'Hook up the hose with Neil: exposes the core'), on: !open, done: open }, { k: kk('E'), t: L('Golpea el núcleo (martillo 6-8 golpes · mazo 4)', 'Hit the core (hammer 6-8 hits · mallet 4)'), on: open }];
      sub = L('Salta los anillos de calor. No dejes que tape la escotilla de Eagle.', "Jump the heat rings. Don't let it cover Eagle's hatch."); }
    hud.objective('', sub, steps);
    if (S.mode !== 'breaker') { if (S.riding) hud.prompt(isTouch ? L('Mantén MARTILLO', 'Hold HAMMER') : L('Mantén E · pinzas', 'Hold E · tongs'), S.tearK); else if (S.phase === 2 && stunned && tankP && hdist(P.x, P.z, tankP.x, tankP.z) < 5.5) hud.prompt(isTouch ? L('Mantén MARTILLO · arranca el depósito', 'Hold HAMMER · rip off the tank') : L('Mantén E · arranca el depósito', 'Hold E · rip off the tank'), S.tearK); else if (S.phase === 3 && S.hoseCd <= 0 && S.hoseK < 0 && hdist(P.x, P.z, N.x, N.z) < 5.5) hud.prompt(isTouch ? L('MANGUERA · respirar juntos', 'HOSE · breathe together') : L('Q · conectar la manguera de O₂', 'Q · connect the O₂ hose')); else hud.prompt(''); }
  }

  const API = { S, P, R, N, ents, setPhase: (n) => resetPhase(n), setHp: (v) => { S.hp = v; damage(0); }, stun: (s = 3) => stun(R, s), reveal: () => reveal(), win: () => { S.hp = 0.1; damage(1); }, fail: () => fail('debug'), finish, attack: (k) => startAttack(R, k), rain: () => rain1202(), heat: () => heatWave(R), skip: () => endCine(), cam, scene, setWeapon: (i) => setWeapon(i), WP };
  dbg('boss', API);
  return done;
}

// Adaptador para usarlo como fase del orquestador (mission.js): devuelve un resultado con puntaje.
export async function bossPhase(ctx) {
  const r = await runBoss({ flag: ctx.flag, name: ctx.name, diff: ctx.diffName, restoreWorld: false });
  return { score: r.result === 'win' ? Math.max(40, 100 - r.stats.hits * 4 - r.stats.retries * 10) : 0, stats: r.stats, result: r.result };
}
