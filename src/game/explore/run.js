// Motor de una escena explorable. Contrato: runExplore(def) → { id, done, skipped, flags }.
// La confianza de las respuestas queda en el estado del guion (run.trust).
import './hud.css';
import { THREE, setWorld, onTick } from '../../core/engine.js';
import { store, isTouch, dbg } from '../../core/store.js';
import { axis, pressed, down, bindBtn, bpressed, bdown, makeStick } from '../../core/input.js';
import { attachLook } from '../../core/look.js';
import { show } from '../../ui/router.js';
import { sfx } from '../../core/audio.js';
import { toast } from '../../core/util.js';
import { missionCard } from '../../ui/mission-card.js';
import { character } from '../story/cine.js';
import { run as storyRun } from '../story/state.js';
import { createBody, stepBody, bodyPose, boxFootprint, moveWish } from './controller.js';
import { createExploreCamera, lookExplore, stepExploreCamera, exploreCameraPose } from './camera.js';
import { pickInteractable, interactPrompt, setHalo, makeMarker } from './interact.js';
import { createDialog, currentBeat, advanceDialog, mountDialog, applyEffects, skipPlan } from './dialog.js';
import { inspectPanel, mountInspect } from './inspect.js';
import { createObjectives, revealNearby, completeObjective, revealObjective, mountObjectives, activeTarget } from './objectives.js';
import { stepHold, ready } from './actions.js';
import { createCompanion, stepCompanion, companionBark } from './companion.js';
import { speakExplore, stopExploreVoice } from './voices.js';

const lang = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (p) => (Array.isArray(p) ? p[lang()] ?? p[0] : p || '');
const blip = () => { try { sfx('ok', { vol: 0.32 }); } catch { /* el juego sigue sin audio */ } };

function plant(root, floorY = 0) {
  root.position.y = floorY;
  root.updateWorldMatrix(true, true);
  let b = new THREE.Box3().setFromObject(root);
  const h = b.max.y - b.min.y;
  if (h > 2.8 || (h > 0.05 && h < 0.9)) root.scale.multiplyScalar(1.75 / h);
  root.updateWorldMatrix(true, true);
  b = new THREE.Box3().setFromObject(root);
  root.position.y += floorY - b.min.y;
  return root.position.y - floorY;
}
function dummy(color) {
  const root = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.15, 4, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  m.position.y = 1.0; root.add(m);
  return { root, play() { return null; }, update() {} };
}
async function actor(model, clip, at, yaw, color) {
  const a = model ? await character(model, clip || 'idle', { at: [at[0], at[1], at[2]], yaw }).catch((e) => { console.warn(model, e); return null; }) : null;
  const use = a || dummy(color);
  use.lift = plant(use.root, at[1] || 0);
  use.clip = clip || 'idle'; use.action = null;
  return use;
}
function pose(use, body, dt) {
  const p = bodyPose(body);
  if (p.clip !== use.clip) { use.action = use.play(p.clip) || null; use.clip = p.clip; }
  if (use.action) use.action.timeScale = p.timeScale;
  use.update(dt);
  use.root.position.set(body.x, body.y + (use.lift || 0), body.z);
  use.root.rotation.y = body.yaw;
}

function locate(spec, world) {
  if (spec.at) return { x: spec.at[0], y: spec.at[1] || 0, z: spec.at[2] || 0 };
  const n = spec.spot && world.scene.getObjectByName(spec.spot);
  if (!n) return { x: 0, y: 0, z: 0 };
  const p = new THREE.Vector3(); n.getWorldPosition(p); return { x: p.x, y: p.y, z: p.z };
}

export async function runExplore(def, opts = {}) {
  if (def.card && !opts.skipCard) await missionCard(def.card);
  const world = await def.world();
  setWorld(world);
  const L = lang();
  const el = show('<div class="xp"></div>', 'explore-' + def.id);
  el.insertAdjacentHTML('afterbegin', `<div class="xp-title"><small>APOLO 11</small><b></b></div>`);
  el.querySelector('.xp-title b').textContent = tx(def.title);
  const prompt = document.createElement('div'); prompt.className = 'xp-prompt'; prompt.hidden = true;
  prompt.innerHTML = '<kbd>E</kbd><span></span>'; el.append(prompt);
  const actionBar = document.createElement('div'); actionBar.className = 'xp-act'; actionBar.hidden = true; actionBar.innerHTML = '<i></i>'; el.append(actionBar);
  const bark = document.createElement('div'); bark.className = 'xp-bark'; bark.hidden = true; el.append(bark);
  const dialogUi = mountDialog(el), inspectUi = mountInspect(el), objUi = mountObjectives(el);
  if (isTouch) {
    el.insertAdjacentHTML('beforeend', `<div class="tc-stick"><i></i></div><button class="tc-btn big actbtn" type="button">${L ? 'ACT' : 'ACCIÓN'}</button><button class="tc-btn mid jumpbtn" type="button">${L ? 'JUMP' : 'SALTO'}</button>`);
    makeStick(el.querySelector('.tc-stick')); bindBtn(el.querySelector('.actbtn'), 'act'); bindBtn(el.querySelector('.jumpbtn'), 'jump');
    el.querySelector('.jumpbtn').style.cssText = 'right:calc(124px + env(safe-area-inset-right,0px));bottom:calc(40px + var(--safe-b))';
    el.querySelector('.actbtn').style.cssText = 'right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(30px + var(--safe-b))';
  }
  const skipEl = document.createElement('div'); skipEl.className = 'xp-skip'; skipEl.hidden = true;
  skipEl.innerHTML = `<div><b>${L ? 'Skip scene?' : '¿Saltar escena?'}</b><div class="xp-hold"><i></i></div></div>`; el.append(skipEl);

  const spawn = def.player?.spawn || [0, 0, 0];
  const body = createBody({ spawn, yaw: def.player?.yaw || 0, speed: def.player?.speed ?? 1.6, canJump: def.jump !== false });
  const cam = createExploreCamera({ ...(def.camera || {}), yaw: body.yaw + Math.PI });
  const objs = createObjectives(def.objectives || []);
  const done = new Set(); const flags = { ...(def.flags || {}) };
  const player = await actor(def.player?.model, 'idle', spawn, body.yaw, 0xf2efe6);
  if (def.camera?.mode === 'first') player.root.visible = false;
  world.scene.add(player.root);
  const items = [];
  for (const n of def.npcs || []) {
    const at = locate(n, world);
    const use = await actor(n.model, n.clip || 'idle', [at.x, at.y, at.z], n.yaw || 0, 0xffb000);
    if (n.once) { use.play?.(n.clip || 'idle', { once: true }); use.update?.(4); }
    world.scene.add(use.root);
    const marker = makeMarker(THREE, n.marker || '!'); use.root.add(marker);
    items.push({ ...n, ...at, kind: 'talk', root: use.root, actor: use, marker, r: n.r ?? 1.5, label: n.label });
    world.colliders = world.colliders || [];
    world.colliders.push({ x: at.x, z: at.z, r: n.block ?? 0.42 });
  }
  for (const o of def.objects || []) {
    const at = locate(o, world);
    const root = (o.node && (world.nodes?.[o.node] || world.scene.getObjectByName(o.node))) || null;
    items.push({ ...o, ...at, kind: o.kind || 'inspect', root, r: o.r ?? 1.2 });
  }
  let mate = null, mateBody = null, said = new Set();
  if (def.companion) {
    const c = def.companion;
    mateBody = createCompanion({ at: c.at || [spawn[0], spawn[1], spawn[2] + (c.follow || 1.5)], yaw: body.yaw, follow: c.follow ?? 1.5 });
    mate = await actor(c.model, 'idle', [mateBody.x, mateBody.y, mateBody.z], mateBody.yaw, 0xc5c1b6);
    world.scene.add(mate.root);
  }
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 0.85, 0xff4f00);
  arrow.visible = false; world.scene.add(arrow);

  let talk = null, focused = null, holding = null, paused = false, hold = 0, holdP = 0, ended = false, leaveAt = 0, now = 0;
  const look = attachLook({ onDelta: (dx, dy) => { if (paused || holding || talk) return; lookExplore(cam, dx, dy); } });
  let drag = null;
  const onDown = (e) => { if (e.pointerType !== 'touch' || e.target.closest?.('button,.tc-stick,.tc-btn,.xp-dialog,.xp-inspect')) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  const onMove = (e) => {
    if (holding?.root && e.pointerType !== 'touch') { holding.root.rotation.y += e.movementX * 0.01; return; }
    if (!drag || e.pointerId !== drag.id) return;
    lookExplore(cam, (e.clientX - drag.x) * 2.4, (e.clientY - drag.y) * 2.4); drag.x = e.clientX; drag.y = e.clientY;
  };
  const onUp = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);

  const noteTrust = (effects) => { const d = (effects || []).reduce((s, e) => s + (e.trust || 0), 0); if (d) toast((L ? 'Trust ' : 'Confianza ') + (d > 0 ? '+' : '') + d, 'info'); };
  const changed = (id) => { if (completeObjective(objs, id)) blip(); done.add(id); };
  function endTalk() {
    const id = talk?.npc?.id; dialogUi.hide(); stopExploreVoice(); cam.dialogWant = 0; talk = null;
    if (id) changed('talk:' + id);
    const spec = (def.npcs || []).find((n) => n.id === id);
    if (spec?.card) import('../story/state.js').then(({ unlock }) => unlock(spec.card));
    if (spec?.once && spec.clip) items.find((i) => i.id === id)?.actor?.play?.(spec.clip, { once: true });
  }
  function present() {
    const beat = currentBeat(talk.st);
    if (!beat) return endTalk();
    if (beat.choice) dialogUi.showChoices(beat.choice, L, pick);
    else { dialogUi.showLine({ ...beat, who: beat.whoName || beat.who }, L); speakExplore({ vo: beat.vo, text: beat.text, lang: L }); }
  }
  function pick(id) {
    if (!talk) return;
    const r = advanceDialog(talk.st, id); noteTrust(r.effects); applyEffects(r.effects);
    if (r.effects) for (const e of r.effects) if (e.type === 'flag') flags[e.key] = e.value;
    if (talk.st.done) endTalk(); else present();
  }
  function advanceLine() {
    if (!talk || dialogUi.choosing) return;
    if (dialogUi.typing) { dialogUi.finish(); return; }
    advanceDialog(talk.st); if (talk.st.done) endTalk(); else present();
  }
  function openInspect(item) { item.onOpen?.(); holding = item; inspectUi.show(inspectPanel(item.inspect, L), L, () => advanceInspect()); }
  function advanceInspect() {
    if (!holding) return;
    if (inspectUi.hasChecks() && !inspectUi.mark()) return;
    closeInspect();
  }
  function closeInspect() {
    const item = holding; holding = null; inspectUi.hide(); if (!item) return;
    if (item.thenHold && !item._held) { item.kind = 'hold'; item.hold = item.thenHold; item.label = item.holdLabel || item.label; item._held = true; return; }
    if (item.inspect?.card) import('../story/state.js').then(({ unlock }) => unlock(item.inspect.card));
    if (item.flag) { flags[item.flag] = item.flagValue ?? true; import('../story/state.js').then(({ setFlag }) => setFlag(item.flag, item.flagValue ?? true)); }
    if (item.objective) changed(item.objective); else changed('obj:' + item.id);
  }
  function grant(res) {
    if (!res) return;
    if (res.bark) { bark.hidden = false; bark.textContent = tx(res.bark); clearTimeout(bark._t); bark._t = setTimeout(() => { bark.hidden = true; }, 4200); }
    if (res.mistake) flags.mistakes = (flags.mistakes || 0) + 1;
    if (res.card) import('../story/state.js').then(({ unlock }) => unlock(res.card));
    if (res.done) changed(res.done);
    if (res.reveal) revealObjective(objs, res.reveal);
    if (res.flag) flags[res.flag] = res.value ?? true;
  }
  function goalOf(id) { return items.find((i) => i.id === id || 'talk:' + i.id === id || 'obj:' + i.id === id); }

  let resolve = () => {};
  const finished = new Promise((r) => { resolve = r; });
  const off = onTick((dt, t) => {
    if (ended) return;
    now = t; dialogUi.tick(dt);
    const lock = !!(talk || holding || paused);
    const a = lock ? { x: 0, y: 0 } : axis();
    stepBody(body, { ax: a.x, ay: a.y, camYaw: cam.orbit.yaw, jump: !lock && (pressed('Space') || bpressed('jump')), gravity: def.gravity ?? 9.81, floorY: world.floorY ?? 0, colliders: world.colliders }, dt);
    pose(player, body, dt);
    for (const it of items) { if (it.actor) { it.actor.update(dt); if (it.marker) it.marker.position.y = 2.05 + Math.sin(t * 3 + it.x) * 0.04; } }
    if (mate && mateBody) { stepCompanion(mateBody, body, dt); pose(mate, { ...mateBody, air: false, jump: false }, dt); }
    const near = revealNearby(objs, body, items.filter((i) => i.reveals));
    if (near.length) blip();
    if (def.companion?.barks) { const b = companionBark(def.companion.barks, body, said); if (b) { bark.hidden = false; bark.textContent = tx(b.text); clearTimeout(bark._t); bark._t = setTimeout(() => { bark.hidden = true; }, 3200); speakExplore({ vo: b.vo, text: b.text, lang: L }); } }
    if (holding?.root && !paused) { if (down('KeyA')) holding.root.rotation.y += dt * 1.4; if (down('KeyD')) holding.root.rotation.y -= dt * 1.4; }
    stepExploreCamera(cam, dt);
    const focus = talk?.npc || null;
    const poseCam = exploreCameraPose(cam, body, focus);
    let shot = poseCam;
    if (holding?.aim) {
      shot = { x: holding.x + (holding.aimFrom?.[0] || 0), y: (holding.y || 0) + (holding.aimFrom?.[1] ?? 1.6), z: holding.z + (holding.aimFrom?.[2] || 0.4), look: { x: holding.aim[0], y: holding.aim[1], z: holding.aim[2] }, fov: holding.aimFov || 30 };
    } else {
      if (holding) { const p = holding; shot = { x: p.x + 1.25, y: (p.y || 0) + 1.65, z: p.z + 1.55, look: { x: p.x, y: (p.y || 0) + 0.85, z: p.z }, fov: 36 }; }
      for (let n = 0; n < 4; n++) for (const c of world.colliders || []) {
        const b = boxFootprint(c); if (!b) continue;
        if (shot.x > b.minX && shot.x < b.maxX && shot.z > b.minZ && shot.z < b.maxZ) {
          const dx = body.x - shot.x, dz = body.z - shot.z, len = Math.hypot(dx, dz) || 1;
          shot = { ...shot, x: shot.x + dx / len * 0.35, z: shot.z + dz / len * 0.35 };
        }
      }
    }
    world.camera.position.set(shot.x, shot.y, shot.z); world.camera.up.set(0, 1, 0); world.camera.lookAt(shot.look.x, shot.look.y, shot.look.z);
    if (Math.abs(world.camera.fov - shot.fov) > 0.2) { world.camera.fov = shot.fov; world.camera.updateProjectionMatrix(); }
    const fwd = moveWish(0, 1, cam.orbit.yaw);
    const hit = lock ? null : pickInteractable({ ...body, lookYaw: Math.atan2(fwd.x, fwd.z) }, items);
    if (hit !== focused) { setHalo(focused?.root, false); setHalo(hit?.root, true); focused = hit; }
    prompt.hidden = !hit;
    if (hit) prompt.querySelector('span').textContent = (!ready(done, hit.requires) && hit.locked ? tx(hit.locked) : interactPrompt(hit, L)).replace(/^E · /, '');
    objUi.paint(objs, L, t);
    const cadet = store.get('difficulty') === 'cadet';
    const goal = cadet && !lock ? goalOf(activeTarget(objs)?.id) : null;
    arrow.visible = !!goal;
    if (goal) {
      const dir = new THREE.Vector3(goal.x - body.x, 0, goal.z - body.z);
      if (dir.lengthSq() > 1e-4) { arrow.position.set(body.x, body.y + 0.08, body.z); arrow.setDirection(dir.normalize()); }
      else arrow.visible = false;
    }
    const useE = pressed('KeyE') || bpressed('act');
    const holdKey = down('KeyE') || bdown('act');
    const ateEsc = !!(holding && pressed('Escape'));
    const canHold = !lock && focused?.kind === 'hold' && ready(done, focused.requires);
    const held = stepHold(holdP, canHold && holdKey, dt, focused?.hold || 3);
    holdP = held.done ? 0 : held.p;
    actionBar.hidden = !held.show; if (held.show) actionBar.querySelector('i').style.width = Math.min(100, (holdP / (focused?.hold || 3)) * 100) + '%';
    if (canHold && holdKey && focused.root) focused.root.rotation.y += dt;
    if (held.done && focused) { focused.disabled = true; grant(def.onUse?.(focused, { done, flags, body }) || { done: focused.objective, card: focused.card }); }
    if (holding && ateEsc) { if (inspectUi.hasChecks()) { holding = null; inspectUi.hide(); } else advanceInspect(); }
    else if (holding && (useE || pressed('Enter'))) advanceInspect();
    else if (!lock && useE && focused && focused.kind !== 'hold') {
      if (!ready(done, focused.requires)) grant({ bark: focused.locked || (L ? ['Not yet.', 'Not yet.'] : ['Aún no.', 'Not yet.']) });
      else if (focused.kind === 'talk') { talk = { npc: focused, st: createDialog(def.dialogs, focused.dialog) }; cam.dialogWant = 1; focused.actor?.play?.('talk'); present(); }
      else if (focused.kind === 'use' || focused.kind === 'exit') grant(def.onUse?.(focused, { done, flags, body }));
      else openInspect(focused);
    }
    else if (talk && (useE || pressed('Space') || pressed('Enter'))) advanceLine();
    const stepped = def.step?.({ dt, t, body, done, flags, focused });
    if (stepped) grant(stepped);
    if (talk?.st && dialogUi.choosing) { const n = [null, 'Digit1', 'Digit2', 'Digit3'].findIndex((c) => c && pressed(c)); if (n > 0) { const c = currentBeat(talk.st)?.choice?.[n - 1]; if (c) pick(c.id); } }
    if (pressed('Tab')) objs.open = !objs.open;
    if (!ateEsc && down('Escape') && !talk && !holding) { hold += dt; skipEl.hidden = false; skipEl.querySelector('i').style.width = Math.min(100, hold * 100) + '%'; if (hold >= 1) skip(); }
    else { if (!ateEsc && hold > 0 && hold < 0.4) paused = !paused; hold = 0; skipEl.hidden = true; }
    if (!leaveAt && def.complete?.({ done, flags, trust: storyRun.trust })) leaveAt = t + (def.exitDelay ?? 8);
    if (leaveAt && t >= leaveAt) finish(false);
  });
  const onKey = (e) => { if (e.code === 'Tab') e.preventDefault(); };
  addEventListener('keydown', onKey, true);
  async function finish(skipped) {
    if (ended) return; ended = true; off(); look.dispose(); stopExploreVoice();
    removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('keydown', onKey, true);
    if (skipped) { const plan = skipPlan(def); const { record, unlock } = await import('../story/state.js'); for (const r of plan.records) record(r.id, r.opt, { historic: true }); for (const id of plan.moments) unlock(id, { quiet: true }); }
    try { world.dispose?.(); } catch { /* la escena ya se fue */ }
    el.remove(); resolve({ id: def.id, done: !skipped, skipped: !!skipped, flags });
  }
  function skip() { finish(true); }
  const api = { body, cam, world, items, done, flags, objectives: objs, get trust() { return storyRun.trust; }, get hold() { return holdP; }, get focusId() { return focused?.id || ''; }, get prompt() { return prompt.hidden ? '' : 'E · ' + prompt.querySelector('span').textContent; } };
  dbg('explore', api);
  return finished;
}
