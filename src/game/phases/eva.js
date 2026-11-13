// FASE 5 · EVA: escalera (9 peldaños), primer paso, caminata en baja gravedad, muestra, bandera (3 golpes + barra), saludo y foto
import { THREE, renderer } from '../../core/engine.js';
import { t, extend } from '../../core/i18n.js';
import { $, h, clamp, damp, achieve } from '../../core/util.js';
import { sfx, music, voice } from '../../core/audio.js';
import { axis, pressed, down, bindBtn, bdown, bpressed, makeStick } from '../../core/input.js';
import { attachLook } from '../../core/look.js';
import { commsMode } from '../../core/comms.js';
import { isTouch, on, DEBUG, shared, dbg, AUTO } from '../../core/store.js';
import { makeMoonSurface } from '../../scenes/moonsurface.js';
import { makeEASEP } from '../../scenes/easep.js';
import { makeAstronaut } from '../../scenes/astronaut.js';
import { renderFlag } from '../../ui/flag.js';
import { model, modelAnim } from '../../core/engine.js';
import { ground, PAD } from '../../sim/lander.js';
import { dotTex } from '../../scenes/space.js';
extend({
  'e.ladder': ['Baja la escalera', 'Climb down the ladder'], 'e.ladderK': ['Pulsa S / ↓ en cada peldaño', 'Press S / ↓ for each rung'], 'e.ladderT': ['Toca ↓ en cada peldaño', 'Tap ↓ for each rung'],
  'e.rung': ['Peldaño {n} / 9', 'Rung {n} / 9'], 'e.step': ['Da el primer paso', 'Take the first step'], 'e.stepK': ['Pulsa E', 'Press E'], 'e.stepT': ['Toca PASO', 'Tap STEP'],
  'e.quote': ['«Es un pequeño paso para el hombre, un gran salto para la humanidad.»', '"That\'s one small step for man, one giant leap for mankind."'],
  'e.walk': ['Explora', 'Explore'], 'e.walkK': ['WASD moverse · el ratón mira · Espacio saltar · E acción · Esc pausa', 'WASD move · mouse looks · Space jump · E action · Esc pauses'],
  'e.walkT': ['Joystick para moverte · arrastra la pantalla para girar', 'Stick to move · drag the screen to look around'],
  'e.t.sample': ['Recoger muestra de contingencia', 'Collect the contingency sample'], 'e.t.flag': ['Plantar la bandera en la zona de la cámara', 'Plant the flag in the TV camera zone'], 'e.t.photo': ['Saludo y foto', 'Salute and photo'],
  'e.hold': ['Mantén E para recoger', 'Hold E to collect'], 'e.holdT': ['Mantén ACCIÓN para recoger', 'Hold ACTION to collect'], 'e.gotSample': ['Muestra a bordo', 'Sample stowed'],
  'e.site': ['Elige el sitio: sin rocas, plano, dentro de la zona', 'Pick the spot: no rocks, flat, inside the zone'], 'e.siteOk': ['Sitio válido · E para plantar', 'Good spot · E to plant'], 'e.siteOkT': ['Sitio válido · ACCIÓN para plantar', 'Good spot · ACTION to plant'],
  'e.siteRock': ['Hay rocas aquí', 'Rocks here'], 'e.siteSlope': ['Demasiada pendiente', 'Too steep'], 'e.siteOut': ['Fuera del encuadre de la cámara TV', 'Outside the TV camera frame'],
  'e.hammer': ['Clava el mástil: golpea en la zona verde (3)', 'Drive the pole: hit in the green zone (3)'], 'e.hit': ['¡Buen golpe!', 'Good hit!'], 'e.miss': ['Rebotó… el regolito es duro', 'It bounced… the regolith is hard'],
  'e.bar': ['Extiende la barra: mantén y suelta', 'Extend the crossbar: hold and release'], 'e.wrinkle': ['La barra se trabó a medias… igual que en 1969', 'The bar jammed halfway… just like in 1969'],
  'e.salute': ['Saluda a la bandera', 'Salute the flag'], 'e.photo': ['Encuadra la bandera y pulsa FOTO', 'Frame the flag and press PHOTO'], 'e.photoC': ['CAPCOM encuadra la cámara TV…', 'CAPCOM is framing the TV camera…'],
  'e.done': ['Bandera plantada', 'Flag planted'], 'e.swing': ['E: ¡swing!', 'E: swing!'], 'e.swingT': ['ACCIÓN: ¡swing!', 'ACTION: swing!'], 'e.golf': ['Millas y millas y millas…', 'Miles and miles and miles…'],
  'e.act': ['ACCIÓN', 'ACTION'], 'e.jump': ['SALTO', 'JUMP'], 'e.down': ['↓', '↓'], 'e.stepB': ['PASO', 'STEP'], 'e.photoB': ['FOTO', 'PHOTO'], 'e.o2': ['O₂ EVA', 'EVA O₂'],
  'e.science': ['Ciencia opcional', 'Optional science'],
  'e.PSEP': ['Desplegar el sismómetro', 'Deploy the seismometer'], 'e.SWC': ['Extender la lámina solar', 'Unroll the solar wind foil'], 'e.LRRR': ['Verificar el reflector láser', 'Check the laser reflector'],
  'e.scienceDone': ['Instrumento listo', 'Instrument ready'], 'e.scienceHint': ['F · {task}', 'F · {task}'],
  'e.depth': ['Profundidad {d} cm', 'Depth {d} cm'], 'e.crooked': ['Quedó torcida… ¡pero es tuya!', 'It\'s crooked… but it\'s yours!'],
});

export default async function eva(ctx) {
  const D = ctx.diff, coop = ctx.cc.coop; const W = makeMoonSurface({ seed: ctx.seed + 3 }); ctx.world(W); const cam = W.camera;
  const L0 = shared.landing || { x: PAD.x - 6, res: 'good' }; const lx = L0.x;
  const ground = await W.lunarPatch(lx, 0); const boot = await W.bootKit.catch(() => null), kit = await W.rocksReady; // superficie del artista (tile 32 m ×3×3) centrada en el LM
  const ly = ground(lx); W.setLM(lx, ly, 0, 0, false);
  const lmYaw = Math.PI / 2; W.body.rotation.y = lmYaw; if (L0.res === 'hard') W.body.rotation.x = 0.06;
  W.scene.fog.density = 0.0009; music('eva', { vol: 0.35 });
  const ast = await makeAstronaut(ctx.flag, ctx.name); W.scene.add(ast.root); ctx.onCleanup(() => ast.dispose?.()); W.focus(ast.root, 18);
  const st = { step: false, sample: false, flag: false, depth: 0, lean: 0, bar: 0, photo: 0, golf: false, hits: [], t0: 0 };
  // ---------- HUD ----------
  const el = ctx.hud(`<div class="tl"><span class="phase-tag">${t('ph.n')} 5 · ${t('ph.eva').toUpperCase()}</span><span class="phase-title etitle" style="white-space:normal;max-width:62vw">${t('e.ladder')}</span></div>
    <div class="tr" style="top:calc(66px + var(--safe-t))"><div class="tele etasks" style="min-width:220px">
      <div class="k">${t('e.o2')}</div><div class="fuelbar o2" style="height:5px;border-radius:3px;background:#ffffff18;margin:4px 0 8px;overflow:hidden"><i style="display:block;height:100%;width:100%;background:var(--go)"></i></div>
      ${['sample', 'flag', 'photo'].map((k) => `<div class="task t-${k}" style="display:flex;gap:8px;align-items:center;font-size:.78rem;margin:3px 0"><b class="box">--</b><span>${t('e.t.' + k)}</span></div>`).join('')}</div></div>
    <div class="bc eprompt" style="bottom:calc(${isTouch ? 210 : 26}px + var(--safe-b));text-align:center;pointer-events:none"><div class="phase-tag ph1" style="font-size:.85rem;color:var(--ink);letter-spacing:.1em"></div><div class="phase-tag ph2" style="margin-top:4px"></div>
      <div class="hold" style="display:none;width:180px;height:6px;border-radius:3px;background:#ffffff22;margin:8px auto 0;overflow:hidden"><i style="display:block;height:100%;width:0;background:var(--amber)"></i></div></div>
    <div class="bc rhythm" style="display:none;bottom:calc(${isTouch ? 240 : 90}px + var(--safe-b));width:min(460px,86vw)"><div style="position:relative;width:100%;height:30px;border-radius:15px;background:#0a0f1acc;border:1px solid var(--line);overflow:hidden">
      <i class="zone" style="position:absolute;top:0;bottom:0;background:#3ddc8455;border-left:2px solid var(--go);border-right:2px solid var(--go)"></i><i class="cur" style="position:absolute;top:2px;bottom:2px;width:6px;margin-left:-3px;border-radius:3px;background:#fff;box-shadow:0 0 10px #fff"></i></div>
      <div class="phase-tag rtxt" style="text-align:center;margin-top:6px"></div></div>
    <div class="reseau" style="display:none;position:absolute;inset:0;pointer-events:none"></div>
    <div class="flash" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .5s"></div>
    <div class="quote" style="display:none;position:absolute;left:50%;bottom:22%;transform:translateX(-50%);width:min(720px,90vw);text-align:center;font-family:Chakra;font-size:clamp(16px,2.6vw,26px);color:#fff;text-shadow:0 2px 12px #000"></div>
    ${isTouch ? `<div class="tc-stick" style="display:none"><i></i></div><button class="tc-btn mid jumpbtn" style="display:none;right:calc(124px + env(safe-area-inset-right,0px));bottom:calc(40px + var(--safe-b))">${t('e.jump')}</button>` : ''}
    <button class="tc-btn big actbtn amber" style="display:${isTouch ? '' : 'none'};right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(30px + var(--safe-b))">${t('e.down')}</button>
    <button class="btn sciencebtn" style="display:none;position:absolute;right:12px;bottom:calc(175px + var(--safe-b));max-width:44vw;font-size:.72rem"></button>
    <button class="btn primary photobtn" style="display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:calc(${isTouch ? 150 : 40}px + var(--safe-b));pointer-events:auto">${t('e.photoB')}</button>`);
  const title = (k) => { $('.etitle', el).textContent = t(k); dbg('eva', k); };
  const prompt = (a = '', b = '') => { $('.ph1', el).textContent = a; $('.ph2', el).textContent = b; };
  const tick = (k) => { const r = $('.t-' + k, el); r.querySelector('.box').textContent = 'OK'; r.style.color = 'var(--go)'; sfx('ok'); };
  const actBtn = $('.actbtn', el); const actLabel = (k) => (actBtn.textContent = t(k));
  bindBtn(actBtn, 'act'); if (isTouch) { makeStick($('.tc-stick', el)); bindBtn($('.jumpbtn', el), 'jump'); }
  const ACT = () => pressed('KeyE', 'Enter') || bpressed('act'); const ACTD = () => down('KeyE', 'Enter') || bdown('act');
  
  // ---------- mundo: escalera, cámara TV, zona, muestra, golf ----------
  const out = new THREE.Vector3(Math.sin(lmYaw - Math.PI / 2), 0, Math.cos(lmYaw - Math.PI / 2)); // dirección de la escalera (hacia +z)
  out.set(0, 0, 1);
  const lad = new THREE.Group(); W.scene.add(lad); const alu = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 0.7, roughness: 0.35 });
  const lmKind = await W.lmReady; const eagle = lmKind === 'eagle'; // el LM del artista trae su escalera real (frente +Z)
  if (eagle) W.body.rotation.y = 0;
  const science = await makeEASEP(W, lx, ground, ast).catch(e => { console.warn('EASEP unavailable; primary EVA remains playable', e); return null; });
  if (science) { ctx.loop(dt => science.update(dt)); ctx.onCleanup(() => science.dispose()); }
  const top = eagle ? new THREE.Vector3(lx, ly + 3.3, 2.47) : new THREE.Vector3(lx, ly + 2.9, 2.35), bot = eagle ? new THREE.Vector3(lx, ly + 1.09, 3.98) : new THREE.Vector3(lx, ly + 0.75, 3.55);
  const ladDir = bot.clone().sub(top); const ladLen = ladDir.length(); ladDir.normalize();
  for (const sx of [-0.28, 0.28]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, ladLen), alu); r.position.copy(top).add(bot).multiplyScalar(0.5); r.position.x += sx; r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ladDir.clone().negate()); r.castShadow = true; lad.add(r); }
  const rungs = []; for (let i = 0; i < 9; i++) { const p = top.clone().addScaledVector(ladDir, (ladLen * (i + 0.5)) / 9); rungs.push(p); const g = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.56), alu); g.rotation.z = Math.PI / 2; g.position.copy(p); lad.add(g); }
  const porch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), alu); porch.position.copy(top).add(new THREE.Vector3(0, 0.12, -0.3)); lad.add(porch);
  const padTop = eagle ? new THREE.Vector3(lx, ly + 0.3, 4.3) : new THREE.Vector3(lx, ly + 0.28, 3.95);
  lad.visible = !eagle;
  // cámara TV en trípode
  let tvProc = null;
  const camTV = new THREE.Vector3(lx - 7, ground(lx - 7, 14) + 1.4, 14); const site = new THREE.Vector3(lx + 2.5, 0, 12.5); site.y = ground(site.x, site.z); const siteR = 3.2;
  { const g = new THREE.Group(); g.position.set(camTV.x, camTV.y - 1.4, camTV.z); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.45), alu); l.position.set(Math.cos(a) * 0.25, 0.7, Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18); g.add(l); }
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.3), new THREE.MeshStandardMaterial({ color: 0x2b2e35, roughness: 0.5 })); box.position.y = 1.45; box.lookAt(site.x - camTV.x, 1.45, site.z - camTV.z); g.add(box); W.scene.add(g); tvProc = g; }
  const zoneM = new THREE.MeshBasicMaterial({ color: 0x5ab0ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const zone = new THREE.Mesh(new THREE.RingGeometry(siteR - 0.08, siteR, 64, 1), zoneM); zone.rotation.x = -Math.PI / 2; zone.position.set(site.x, site.y + 0.05, site.z); zone.visible = false; W.scene.add(zone);
  const R = ctx.rand; const siteRocks = []; const rockM = new THREE.MeshStandardMaterial({ color: 0x8a8780, roughness: 0.95 });
  for (let i = 0; i < 4; i++) { const a = R() * 6.28, r = 1 + R() * 1.8, s = 0.18 + R() * 0.22; const x = site.x + Math.cos(a) * r, z = site.z + Math.sin(a) * r; const kt = kit && kit[['rock-06', 'rock-07', 'rock-08', 'rock-10'][i]]; const m = kt ? new THREE.Mesh(kt.g, kt.mat) : new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM); if (kt) { m.scale.setScalar((2 * s) / kt.size); m.rotation.y = R() * 6.28; } m.position.set(x, ground(x, z), z); m.receiveShadow = true; m.castShadow = true; W.scene.add(m); siteRocks.push([x, z, s]); }
  const sampleP = new THREE.Vector3(lx - 5.5, 0, 7.5); sampleP.y = ground(sampleP.x, sampleP.z);
  const sampleRock = kit?.['sample-rock'] ? new THREE.Mesh(kit['sample-rock'].g, kit['sample-rock'].mat.clone()) : new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.9 }));
  if (kit) { sampleRock.scale.setScalar(1.6); sampleRock.material.emissive = new THREE.Color(0x2a1c00); } else sampleRock.position.y = 0.08; // la muestra de contingencia (tamaño puño), un poco agrandada para verla
  sampleRock.position.add(sampleP); sampleRock.castShadow = true; W.scene.add(sampleRock);
  const mark = (c) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; W.scene.add(m); return m; };
  const sMark = mark(0xffb000); sMark.position.copy(sampleP).add(new THREE.Vector3(0, 0.04, 0));
  const golfP = new THREE.Vector3(lx + 50, 0, 3); golfP.y = ground(golfP.x, golfP.z) + 0.04; const golf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x222222 })); golf.position.copy(golfP); W.scene.add(golf);
  // huellas (InstancedMesh)
  const fpC = document.createElement('canvas'); fpC.width = 64; fpC.height = 128; { const x = fpC.getContext('2d'); x.fillStyle = '#000'; x.beginPath(); x.roundRect(10, 6, 44, 116, 20); x.globalAlpha = 0.5; x.fill(); x.globalAlpha = 0.85; for (let i = 0; i < 9; i++) { x.fillRect(12, 14 + i * 12, 40, 5); } }
  const fpT = new THREE.CanvasTexture(fpC); const NF = 400; const fpG = new THREE.PlaneGeometry(0.16, 0.32); fpG.rotateX(-Math.PI / 2);
  // boot-print.glb del artista (decal 0.20×0.40 m, punta +Z): +Y local = normal del terreno, giro según el rumbo; sin sombra propia
  const fpVariants = science?.variants.length === 4 ? science.variants : boot ? [boot] : [{ g: fpG, m: new THREE.MeshBasicMaterial({ map: fpT, transparent: true, opacity: 0.55, depthWrite: false, color: 0x1a1814, polygonOffset: true, polygonOffsetFactor: -2 }) }];
  const fpSlots = Math.floor(NF / (fpVariants.length * 2)), fpCounts = [];
  const fps = fpVariants.flatMap(({ g, m }) => [1, -1].map(sign => {
    const geo = g.clone(); if (sign < 0) { geo.scale(-1, 1, 1); if (geo.index) { const ix = geo.index.array; for (let j = 0; j < ix.length; j += 3) [ix[j + 1], ix[j + 2]] = [ix[j + 2], ix[j + 1]]; } }
    const im = new THREE.InstancedMesh(geo, m, fpSlots); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; im.renderOrder = 1; W.scene.add(im); fpCounts.push(0); return im;
  }));
  ctx.onCleanup(() => { fps.forEach(m => { m.geometry.dispose(); m.dispose(); }); fpT.dispose(); });
  let fpN = 0; const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), qn = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), nn = new THREE.Vector3();
  const footprint = (x, z, yaw, big = false) => {
    const side = fpN++ % 2, variant = fpVariants.length === 4 ? (big ? 3 : fpN % 7 === 0 ? 2 : fpN % 3 === 0 ? 1 : 0) : 0;
    const idx = variant * 2 + side, im = fps[idx], i = fpCounts[idx]++ % fpSlots;
    W.normalAt(x, z, nn); qn.setFromUnitVectors(up, nn); q4.setFromAxisAngle(up, yaw + (R() - 0.5) * 0.08).premultiply(qn); const k = big ? 1.05 : 0.96 + R() * 0.08;
    m4.compose(new THREE.Vector3(x, ground(x, z), z).addScaledVector(nn, 0.005), q4, new THREE.Vector3(k, 1, k)); im.setMatrixAt(i, m4); im.count = Math.min(fpSlots, fpCounts[idx]); im.instanceMatrix.needsUpdate = true;
  };
  // polvo de pasos
  const ND = 240; const dp = new Float32Array(ND * 3), dv = new Float32Array(ND * 3), dl = new Float32Array(ND); let di = 0; for (let i = 0; i < ND; i++) dp[i * 3 + 1] = -999;
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.07, map: dotTex(), color: 0xcfc6b8, transparent: true, opacity: 0.8, depthWrite: false })); dust.frustumCulled = false; W.scene.add(dust);
  const puff = (x, z, n = 14, sp = 1.2) => { for (let j = 0; j < n; j++) { const i = (di = (di + 1) % ND); const a = Math.random() * 6.28, v = sp * (0.4 + Math.random()); dp[i * 3] = x; dp[i * 3 + 1] = ground(x, z) + 0.05; dp[i * 3 + 2] = z; dv[i * 3] = Math.cos(a) * v; dv[i * 3 + 1] = 0.6 + Math.random() * 1.4; dv[i * 3 + 2] = Math.sin(a) * v; dl[i] = 1.5 + Math.random(); } };
  // bandera
  const flagC = renderFlag(document.createElement('canvas'), ctx.flag, 512, 320); const flagT = new THREE.CanvasTexture(flagC); flagT.colorSpace = THREE.SRGBColorSpace; flagT.anisotropy = 4;
  const FW = 1.5, FH = 0.95; const flagG = new THREE.PlaneGeometry(FW, FH, 24, 12); flagG.translate(FW / 2, -FH / 2, 0); const flagBase = flagG.attributes.position.array.slice();
  const flag = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5), alu); pole.position.y = 1.25 - 0.3; pole.castShadow = true; flag.add(pole);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1), alu); bar.rotation.z = Math.PI / 2; bar.position.y = 2.15; flag.add(bar);
  const cloth = new THREE.Mesh(flagG, new THREE.MeshStandardMaterial({ map: flagT, side: THREE.DoubleSide, roughness: 0.8 })); cloth.position.y = 2.15; cloth.castShadow = true; flag.add(cloth); flag.visible = false; W.scene.add(flag);
  const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4), new THREE.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.5 })); ghost.visible = false; W.scene.add(ghost);
  // ---------- Props del artista (flag-mast, tv-camera, sample-box): pivotes con nombre, malla en hijos *-geo ----------
  const propEnv = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; const m = c.material; if (m && 'envMap' in m) { m.envMap = W.env || null; m.envMapIntensity = 0.45; m.needsUpdate = true; } } });
  const mixers = []; ctx.loop((dt) => { for (const m of mixers) m.update(dt); });
  const M = { mast: null, cross: null, inner: null, unfold: 0 };
  modelAnim('flag-mast').then(({ scene: o }) => { propEnv(o); M.mast = o; M.cross = o.getObjectByName('crossbar'); M.inner = o.getObjectByName('crossbar-inner');
    const fc = o.getObjectByName('flag-cloth'); if (fc) fc.visible = false; // la tela es la nuestra (bandera del jugador), anclada al travesaño
    if (M.cross) M.cross.rotation.z = -Math.PI / 2; // plegado
    pole.visible = false; bar.visible = false; cloth.position.set(0.024, 2.205, 0); flag.add(o); if (flag.visible && st.bar === 0 && !st.flag) cloth.visible = false;
  }).catch((e) => console.warn('flag-mast.glb no disponible', e));
  model('tv-camera').then((o) => { propEnv(o); o.position.set(camTV.x, camTV.y - 1.4, camTV.z); const pan = o.getObjectByName('pan'), tilt = o.getObjectByName('tilt');
    if (pan) pan.rotation.y = Math.atan2(site.x - camTV.x, site.z - camTV.z); if (tilt) tilt.rotation.x = -0.06;
    W.scene.add(o); if (tvProc) tvProc.visible = false; camTV.y = o.position.y + 1.09; // eje óptico real (~1.09 m)
  }).catch((e) => console.warn('tv-camera.glb no disponible', e));
  const boxP = new THREE.Vector3(lx - 2.2, 0, 3.4); boxP.y = ground(boxP.x, boxP.z); let lidOpen = null;
  modelAnim('sample-box').then(({ scene: o, animations }) => { propEnv(o); o.position.copy(boxP); o.rotation.y = Math.atan2(sampleP.x - boxP.x, sampleP.z - boxP.z); const cs = o.getObjectByName('ContingencySampler'); if (cs) cs.visible = false;
    W.scene.add(o); const mx = new THREE.AnimationMixer(o); mixers.push(mx); const clip = THREE.AnimationClip.findByName(animations, 'lid-open');
    if (clip) lidOpen = () => { const a = mx.clipAction(clip); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.reset().play(); };
    if (st.sample) lidOpen?.();
  }).catch((e) => console.warn('sample-box.glb no disponible', e));
  function setFlag(ext, wave = 0, tt = 0) { // ext 0..1 barra; arruga si < 1
    if (M.inner) M.inner.position.x = 0.03 + 0.72 * ext; if (M.cross) M.cross.rotation.z = -Math.PI / 2 * (1 - M.unfold);
    const w = 0.35 + 0.65 * ext; bar.scale.y = FW * w; bar.position.x = (FW * w) / 2; const p = flagG.attributes.position;
    for (let i = 0; i < p.count; i++) { const bx = flagBase[i * 3], by = flagBase[i * 3 + 1]; const u = bx / FW, v = -by / FH; // v: 0 arriba
      const x = bx * (w + (1 - w) * v * 0.35); const amp = (1 - w) * 0.16 * (1 - v * 0.3) + 0.015; const z = Math.sin(u * Math.PI * 5 + v * 0.6) * amp * u + Math.sin(tt * 2 + u * 6) * wave * u * 0.05;
      p.setXYZ(i, x, by - v * v * 0.06 * (1 - w), z); }
    p.needsUpdate = true; flagG.computeVertexNormals();
  }
  setFlag(1);
  // ---------- jugador ----------
  const P = { x: lx, z: eagle ? 2.35 : 2.2, y: ly + (eagle ? 3.38 : 3), vy: 0, yaw: Math.PI, speed: 0, vx: 0, vz: 0, air: false, act: null, actK: 0, mode: 'ladder' };
  let camYaw = 0.35, camPitch = 0.32, camDist = 5.2; const camP = new THREE.Vector3(lx + 2, ly + 4, 10), look = new THREE.Vector3();
  // arrastrar para girar
  const pointerLook = attachLook({ onDelta: (dx, dy) => { if (viewMode !== 'follow') return; camYaw -= dx * 0.0022; camPitch = clamp(camPitch + dy * 0.0016, 0.05, 1.1); } });
  ctx.onCleanup(() => pointerLook.dispose());
  let drag = null; const onDown = (e) => { if (e.pointerType !== 'touch' || document.pointerLockElement || e.target.closest('button,.tc-stick,.tc-btn,.panel')) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  const onMove = (e) => { if (document.pointerLockElement || !drag || e.pointerId !== drag.id) return; camYaw -= (e.clientX - drag.x) * 0.006; camPitch = clamp(camPitch + (e.clientY - drag.y) * 0.004, 0.05, 1.1); drag.x = e.clientX; drag.y = e.clientY; };
  const onUp = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); ctx.onCleanup(() => { removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); });
  let stepSide = 0, autoTarget = null, viewMode = 'follow', tvLook = { yaw: 0, pitch: 0, zoom: 1 };
  const O2 = 420 * (D.time || 1); let tEva = 0;
  function collide() {
    const dx = P.x - lx, dz = P.z; const r = Math.hypot(dx, dz); if (r > 1e-4 && r < 2.3 && P.mode === 'walk') { P.x = lx + (dx / r) * 2.3; P.z = (dz / r) * 2.3; }
    const push = (x, z, m) => { const ddx = P.x - x, ddz = P.z - z, d = Math.hypot(ddx, ddz); if (d < m && d > 1e-3) { P.x = x + (ddx / d) * m; P.z = z + (ddz / d) * m; } };
    for (const [x, z, s] of siteRocks) push(x, z, s + 0.25);
    for (const [x, z, s] of W.rockList) if (s > 0.5 && Math.abs(x - P.x) < 4 && Math.abs(z - P.z) < 4) push(x, z, s * 0.9 + 0.25);
  }
  const _hr = new THREE.Vector3();
  ctx.loop((dt, tt) => {
    tEva += dt; $('.o2 i', el).style.width = clamp(100 - (tEva / O2) * 100, 0, 100) + '%';
    if (P.mode === 'walk') {
      let a = P.act === 'fall' || P.act === 'scoop' ? { x: 0, y: 0 } : axis(); if (AUTO() && autoTarget && P.act !== 'scoop' && P.act !== 'fall') { const dx = autoTarget.x - P.x, dz = autoTarget.z - P.z; const d = Math.hypot(dx, dz); const fw = new THREE.Vector2(-Math.sin(camYaw), -Math.cos(camYaw)), rt = new THREE.Vector2(Math.cos(camYaw), -Math.sin(camYaw)); a = d > 0.25 ? { x: clamp((dx * rt.x + dz * rt.y) / d, -1, 1), y: clamp((dx * fw.x + dz * fw.y) / d, -1, 1) } : { x: 0, y: 0 }; if (d < 1.2) { a.x *= d / 1.2; a.y *= d / 1.2; } }
      const mx = a.x * Math.cos(camYaw) - a.y * Math.sin(camYaw), mz = -a.x * Math.sin(camYaw) - a.y * Math.cos(camYaw); const mag = Math.min(1, Math.hypot(mx, mz));
      const vmax = 1.9; P.vx = damp(P.vx, mx * vmax, P.air ? 0.6 : 3, dt); P.vz = damp(P.vz, mz * vmax, P.air ? 0.6 : 3, dt); P.speed = Math.hypot(P.vx, P.vz);
      if (mag > 0.15) { const ty = Math.atan2(mx, mz); let d = ty - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 6); if (!drag && !AUTO()) camYaw += Math.atan2(Math.sin(P.yaw + Math.PI - camYaw), Math.cos(P.yaw + Math.PI - camYaw)) * dt * 0.25; }
      P.x += P.vx * dt; P.z += P.vz * dt; collide();
      const g = ground(P.x, P.z);
      if (!P.air && !P.act && (pressed('Space') || bpressed('jump'))) { P.vy = 2.5; P.air = true; P.jump = true; sfx('switch', { vol: 0.3, rate: 0.6 }); }
      if (P.air) { P.vy -= 1.62 * dt; P.y += P.vy * dt; if (P.y <= g) { P.y = g; P.air = false; P.jump = false; const big = P.vy < -1.5; if (big && P.speed > 1.5 && !AUTO() && !P.act && Math.random() < 0.3) { P.act = 'fall'; P.vx *= 0.2; P.vz *= 0.2; let k = 0; const off = ctx.loop((dt) => { k += dt; if (k > 5.2) { off(); if (P.act === 'fall') P.act = null; } }); } P.vy = 0; const px = Math.cos(P.yaw) * 0.09, pz = -Math.sin(P.yaw) * 0.09; if (big || P.speed < 0.9) { footprint(P.x + px, P.z + pz, P.yaw, big); footprint(P.x - px, P.z - pz, P.yaw, big); } else { const sd = stepSide ? 1 : -1; footprint(P.x + px * sd, P.z + pz * sd, P.yaw + sd * 0.05); } puff(P.x, P.z, big ? 30 : 10, big ? 2 : 1); sfx((stepSide ^= 1) ? 'step1' : 'step2', { vol: big ? 0.6 : 0.35 }); } }
      else P.y = g;
    }
    ast.root.position.set(P.x, P.y, P.z); ast.root.rotation.y = P.yaw; ast.pose(dt, { speed: P.mode === 'walk' ? P.speed : 0, air: P.air && P.mode === 'walk', jump: !!(P.jump && P.mode === 'walk'), act: P.dbgAct !== undefined ? P.dbgAct : P.act, k: P.dbgAct !== undefined ? P.dbgK : P.actK });
    science?.sample(P.act === 'scoop', P.actK);
    if ((P.act === 'hammer' || P.act === 'hold') && ast.handR && flag.visible) { ast.handR.getWorldPosition(_hr); flag.position.x = damp(flag.position.x, _hr.x, 12, dt); flag.position.z = damp(flag.position.z, _hr.z, 12, dt); } // mástil enganchado a hand-r
    for (let i = 0; i < ND; i++) { if (dl[i] <= 0) continue; dl[i] -= dt; dv[i * 3 + 1] -= 1.62 * dt; dp[i * 3] += dv[i * 3] * dt; dp[i * 3 + 1] += dv[i * 3 + 1] * dt; dp[i * 3 + 2] += dv[i * 3 + 2] * dt; if (dp[i * 3 + 1] < ground(dp[i * 3], dp[i * 3 + 2]) || dl[i] <= 0) { dl[i] = 0; dp[i * 3 + 1] = -999; } }
    dg.attributes.position.needsUpdate = true;
    sMark.visible = !st.sample && P.mode === 'walk'; sMark.material.opacity = 0.5 + Math.sin(tt * 4) * 0.3; zone.visible = st.sample && !st.flag && P.mode === 'walk'; golf.rotation.y += dt;
    if (flag.visible) setFlag(st.bar, 0, tt);
    // cámara
    if (viewMode === 'follow') {
      const ty = P.y + 1.3; const cx = P.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist, cz = P.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist; let cy = ty + Math.sin(camPitch) * camDist; cy = Math.max(cy, ground(cx, cz) + 0.5);
      camP.x = damp(camP.x, cx, 5, dt); camP.y = damp(camP.y, cy, 5, dt); camP.z = damp(camP.z, cz, 5, dt); cam.position.copy(camP); look.set(P.x, ty, P.z); cam.lookAt(look); cam.fov = cam.aspect < 1 ? 70 : 55; cam.updateProjectionMatrix();
    } else if (viewMode === 'tv') {
      const base = Math.atan2(site.x - camTV.x, site.z - camTV.z); const yy = base + tvLook.yaw; cam.position.set(camTV.x + Math.sin(base) * 0.45, camTV.y, camTV.z + Math.cos(base) * 0.45); look.set(camTV.x + Math.sin(yy) * 10, camTV.y + 0.3 + tvLook.pitch * 10, camTV.z + Math.cos(yy) * 10); cam.lookAt(look); cam.fov = (cam.aspect < 1 ? 62 : 44) / tvLook.zoom; cam.updateProjectionMatrix();
    }
    ctx.cc.snap({ x: P.x - lx, z: P.z, mode: P.mode, sample: st.sample, flag: st.flag, o2: 1 - tEva / O2 });
  });
  // Optional proximity actions never gate sample/flag/photo; F / separate touch button avoids stealing E.
  const sb = $('.sciencebtn', el); let nearby = null, scienceBusy = false;
  const deployScience = async () => {
    if (!nearby || scienceBusy || P.mode !== 'walk' || P.act || !science.start(nearby)) return;
    const task = nearby; scienceBusy = true; sb.style.display = 'none'; P.mode = 'science'; P.vx = P.vz = P.speed = 0; P.air = false; P.y = ground(P.x, P.z);
    P.yaw = Math.atan2(task.p.x - P.x, task.p.z - P.z); P.act = 'point';
    await ctx.wait(task.duration); P.act = null; P.mode = 'walk'; scienceBusy = false;
    sfx('ok'); ctx.banner(t('e.scienceDone'), t('e.' + task.name), 1600, 'good'); ctx.cc.log('e.' + task.name, null, 'ok');
  };
  sb.onclick = deployScience; ctx.onCleanup(() => { sb.onclick = null; });
  ctx.loop(() => {
    nearby = science?.sites.find(s => !s.done && Math.hypot(s.p.x - P.x, s.p.z - P.z) < 1.8) || null;
    const show = nearby && P.mode === 'walk' && !P.act && !scienceBusy;
    sb.style.display = show ? '' : 'none';
    if (show) { sb.textContent = t('e.science') + ' · ' + (isTouch ? t('e.' + nearby.name) : t('e.scienceHint', { task: t('e.' + nearby.name) })); if (pressed('KeyF')) deployScience(); }
  });
  // ganchos de depuración para capturas (cámara y pose)
  if (DEBUG) window.__evaDbg = { ast, science, W, ground, sampleP, site, cam: (y, p, d) => { camYaw = y; camPitch = p; camDist = d; }, fps, footprint, act: (a, k = 0.5) => { P.dbgAct = a; P.dbgK = k; }, P, M, st, flag, cloth, setFlag };
  const sub = new URLSearchParams(location.search).get('sub');
  const LAD = { y: 0, z: 0 }; if (DEBUG) window.__evaDbg.LAD = LAD;
  // ---------- 1) escalera ----------
  if (sub !== 'walk' && sub !== 'flag') {
    title('e.ladder'); prompt(t(isTouch ? 'e.ladderT' : 'e.ladderK')); actLabel('e.down'); P.mode = 'ladder'; P.yaw = Math.PI; camYaw = 0.5; camPitch = 0.15; camDist = 4.2;
    P.x = top.x; P.y = top.y - 0.36 + LAD.y; P.z = top.z - 0.2 + LAD.z; if (rungs.length > 1) ast.ladderStep = Math.abs(rungs[0].y - rungs[1].y) || 0.25; ast.root.position.set(P.x, P.y, P.z);
    ctx.cc.log('e.ladder');
    for (let i = 0; i < 9; i++) {
      prompt(t('e.rung', { n: i }), t(isTouch ? 'e.ladderT' : 'e.ladderK'));
      await ctx.until(() => AUTO() || ACT() || pressed('KeyS', 'ArrowDown', 'Space'));
      const from = new THREE.Vector3(P.x, P.y, P.z), to = rungs[i].clone().add(new THREE.Vector3(0, -0.36 + LAD.y, (eagle ? 0.42 : -0.12) + LAD.z)); P.act = 'climb'; sfx('clunk', { vol: 0.35, rate: 1 + i * 0.03 });
      await new Promise((res) => { let k = 0; const off = ctx.loop((dt) => { k = Math.min(1, k + dt / 0.38); P.actK = k; P.x = from.x + (to.x - from.x) * k; P.y = from.y + (to.y - from.y) * k; P.z = from.z + (to.z - from.z) * k; if (k >= 1) { off(); res(); } }); });
      ctx.cc.log('e.rung', { n: i + 1 });
    }
    // salto a la pata
    P.act = null; { const from = new THREE.Vector3(P.x, P.y, P.z); await new Promise((res) => { let k = 0; const off = ctx.loop((dt) => { k = Math.min(1, k + dt / 1.1); P.x = from.x + (padTop.x - from.x) * k; P.z = from.z + (padTop.z - from.z) * k; P.y = from.y + (padTop.y - from.y) * k + Math.sin(k * Math.PI) * 0.25; if (k >= 1) { off(); res(); } }); }); }
    sfx('thud', { vol: 0.5 }); puff(P.x, P.z + 0.3, 8, 0.6);
    // ---------- 2) primer paso ----------
    title('e.step'); prompt(t('e.step'), t(isTouch ? 'e.stepT' : 'e.stepK')); actLabel('e.stepB'); P.yaw = 0; camYaw = 0.9; camPitch = 0.12; camDist = 3.6;
    ctx.cc.log('e.step', null, 'warn');
    await ctx.until(() => AUTO() || ACT());
    const fl = $('.flash', el); fl.style.transition = 'opacity .2s'; fl.style.opacity = 1; await ctx.wait(0.2); fl.style.transition = 'opacity 1.4s'; fl.style.opacity = 0;
    { const tz = padTop.z + 0.38; P.z = tz; P.y = ground(P.x, tz); P.act = 'step'; P.actK = 0; await new Promise((res) => { let k = 0; const off = ctx.loop((dt) => { k = Math.min(1, k + dt / 4); P.actK = k; if (k >= 1) { off(); res(); } }); }); P.act = null; }
    footprint(P.x - 0.1, P.z + 0.05, 0, true); puff(P.x, P.z, 18, 0.8); sfx('step1'); st.step = true; achieve('first'); ctx.cc.log('e.quote', null, 'ok');
    const spoken = commsMode() !== 'off'; const qq = $('.quote', el);
    if (spoken) { voice('smallstep'); qq.textContent = t('e.quote'); qq.style.display = ''; }
    prompt('');
    await ctx.wait(AUTO() ? 1.5 : spoken ? 4 : 1.2); qq.style.display = 'none'; ctx.say('pa.eva', { ms: 2200 });
  } else { P.x = lx + 0.2; P.z = padTop.z + 1.3; P.y = ground(P.x, P.z); st.step = true; }
  // ---------- 3) caminar + tareas ----------
  P.mode = 'walk'; P.act = null; camDist = 5.2; camPitch = 0.3; camYaw = 0.25; title('e.walk'); actLabel('e.act');
  { P.act = 'point'; let k = 0; const off = ctx.loop((dt) => { k += dt; if (P.act === 'point' && (k > 2.4 || P.speed > 0.25)) P.act = null; if (P.act !== 'point') off(); }); }
  if (isTouch) { $('.tc-stick', el).style.display = ''; $('.jumpbtn', el).style.display = ''; }
  prompt(t('e.t.sample'), t(isTouch ? 'e.walkT' : 'e.walkK')); st.t0 = tEva;
  // 3a muestra
  if (sub !== 'flag') {
    autoTarget = sampleP.clone().add(new THREE.Vector3(0, 0, 0.6)); let hold = 0; const hb = $('.hold', el);
    await new Promise((res) => { const off = ctx.loop((dt) => {
      const d = Math.hypot(P.x - sampleP.x, P.z - sampleP.z);
      if (P.mode !== 'walk') return;
      if (d < 0.85) { prompt(t(isTouch ? 'e.holdT' : 'e.hold')); hb.style.display = ''; if (ACTD() || AUTO()) { if (!hold) { P.air = false; P.vy = 0; P.y = ground(P.x, P.z); } hold += dt; P.act = 'scoop'; P.yaw = Math.atan2(sampleP.x - P.x, sampleP.z - P.z); P.vx = P.vz = 0; P.actK = hold / 4; if (Math.random() < dt * 3) puff(sampleP.x, sampleP.z, 3, 0.4); } else { hold = Math.max(0, hold - dt); P.act = null; } $('.hold i', el).style.width = (hold / 4) * 100 + '%'; if (hold >= 4) { off(); res(); } }
      else { hb.style.display = 'none'; if (hold) hold = 0; P.act = null; prompt(t('e.t.sample'), t(isTouch ? 'e.walkT' : 'e.walkK')); }
    }); });
    P.act = null; hb.style.display = 'none'; sampleRock.visible = false; st.sample = true; lidOpen?.(); tick('sample'); sfx('powerup'); ctx.banner(t('e.gotSample'), '', 1600, 'good'); ctx.cc.log('e.gotSample', null, 'ok');
  } else { st.sample = true; tick('sample'); P.x = site.x - 1; P.z = site.z - 2; }
  // 3b bandera: elegir sitio
  title('e.t.flag'); prompt(t('e.site')); autoTarget = new THREE.Vector3(site.x + 0.4, 0, site.z + 0.3);
  for (const [x, z] of siteRocks) if (Math.hypot(autoTarget.x - x, autoTarget.z - z) < 0.9) { autoTarget.x += 1.2; }
  let spot = null; const golfLoop = ctx.loop(() => golfCheck());
  await new Promise((res) => { const off = ctx.loop(() => {
    if (P.mode !== 'walk') return;
    const fx = P.x + Math.sin(P.yaw) * 0.8, fz = P.z + Math.cos(P.yaw) * 0.8; const v = validSite(fx, fz); ghost.visible = true; ghost.position.set(fx, ground(fx, fz) + 1.2, fz); ghost.material.color.set(v === 'ok' ? 0x3ddc84 : 0xfc3d21);
    prompt(v === 'ok' ? t(isTouch ? 'e.siteOkT' : 'e.siteOk') : t('e.site'), v === 'ok' ? '' : t('e.site' + v[0].toUpperCase() + v.slice(1)));
    const autoOk = AUTO() && Math.hypot(P.x - autoTarget.x, P.z - autoTarget.z) < 0.5;
    if (v === 'ok' && (ACT() || autoOk)) { spot = new THREE.Vector3(fx, ground(fx, fz), fz); off(); res(); }
  }); });
  ghost.visible = false; autoTarget = null; P.vx = P.vz = 0; P.speed = 0; P.mode = 'task'; sfx('clunk');
  P.yaw = Math.atan2(spot.x - P.x, spot.z - P.z); P.x = spot.x - Math.sin(P.yaw) * 0.39; P.z = spot.z - Math.cos(P.yaw) * 0.39; P.y = ground(P.x, P.z); P.act = 'hold';
  flag.visible = true; flag.position.copy(spot); flag.position.y += 0.6; flag.rotation.y = Math.atan2(camTV.x - spot.x, camTV.z - spot.z) - Math.PI / 2 - 0.4; st.bar = 0; M.unfold = M.mast ? 0 : 1; cloth.visible = !M.mast; flag.position.y = spot.y + (M.mast ? 0.2 : 0.6); setFlag(0);
  camYaw = P.yaw + Math.PI / 2 + 0.35; camPitch = 0.2; camDist = 5;
  // 3c golpes rítmicos
  title('e.hammer'); prompt(''); const rh = $('.rhythm', el); rh.style.display = ''; const zw = 0.16 * (D.tol || 1); $('.zone', rh).style.left = (0.5 - zw / 2) * 100 + '%'; $('.zone', rh).style.width = zw * 100 + '%'; actLabel('e.act');
  ctx.cc.log('e.hammer');
  for (let n = 0; n < 3; n++) {
    $('.rtxt', rh).textContent = `${t('e.hammer')} · ${n + 1}/3`; let ph = Math.random(), cur = 0, hit = null; const spd = 0.9 + n * 0.25;
    await new Promise((res) => { const off = ctx.loop((dt) => { ph += dt * spd; cur = 1 - Math.abs(((ph % 2) + 2) % 2 - 1); $('.cur', rh).style.left = cur * 100 + '%'; const inZ = Math.abs(cur - 0.5) < zw / 2;
      if (ACT() || pressed('Space') || (AUTO() && inZ && Math.abs(cur - 0.5) < zw / 4)) { hit = inZ; off(); res(); } }); });
    P.act = 'hammer'; await new Promise((res) => { let k = 0; const off = ctx.loop((dt) => { k = Math.min(1, k + dt / 0.45); P.actK = k; if (k >= 1) { off(); res(); } }); });
    P.act = 'hold'; sfx('hammer'); st.hits.push(hit); puff(spot.x, spot.z, hit ? 10 : 4, 0.5);
    if (hit) { st.depth += 0.075 + Math.random() * 0.02; ctx.banner(t('e.hit'), t('e.depth', { d: Math.round(st.depth * 100) }), 900, 'good'); } else { st.depth += 0.02; st.lean += (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4); ctx.banner(t('e.miss'), '', 900, 'warn'); sfx('error', { vol: 0.3 }); }
    flag.position.y = M.mast ? spot.y + 0.2 - Math.min(0.2, st.depth * 0.8) : spot.y + 0.6 - st.depth * 2.2; flag.rotation.z = (st.lean * Math.PI) / 180; ctx.cc.log(hit ? 'e.hit' : 'e.miss', null, hit ? 'ok' : 'warn');
  }
  P.act = null; rh.style.display = 'none'; if (Math.abs(st.lean) > 6) ctx.say('e.crooked', { ms: 2600 });
  // 3d extender barra
  if (M.mast && M.unfold < 1) { sfx('clunk', { vol: 0.4 }); await new Promise((res) => { const off = ctx.loop((dt) => { M.unfold = Math.min(1, M.unfold + dt / 0.8); const k = M.unfold; setFlag(0); if (k >= 1) { off(); res(); } }); }); }
  cloth.visible = true; setFlag(0);
  title('e.bar'); prompt(t('e.bar')); const hb = $('.hold', el); hb.style.display = ''; let e = 0, holding = false;
  await new Promise((res) => { const off = ctx.loop((dt) => { const d = ACTD() || down('Space') || (AUTO() && e < 0.6); if (d) { holding = true; e = Math.min(1, e + dt / 2.2); st.bar = e; $('.hold i', el).style.width = e * 100 + '%'; if (Math.random() < dt * 8) sfx('tick', { vol: 0.2 }); } if ((holding && !d) || e >= 1) { off(); res(); } }); });
  hb.style.display = 'none'; st.bar = e; sfx('clunk'); if (e > 0.3 && e < 0.85) { achieve('wrinkle'); ctx.banner(t('e.wrinkle'), '', 2600); } st.flag = true; tick('flag'); ctx.cc.log('e.done', null, 'ok');
  // 3e saludo y foto
  title('e.t.photo'); prompt(t('e.salute'));
  { // colócate al lado de la bandera, mirando a la cámara TV
    const side = new THREE.Vector3(Math.cos(flag.rotation.y), 0, -Math.sin(flag.rotation.y)); const px = spot.x - side.x * 0.9, pz = spot.z - side.z * 0.9; P.x = px; P.z = pz; P.y = ground(px, pz); P.yaw = Math.atan2(spot.x - px, spot.z - pz) ; }
  P.act = 'salute'; sfx('ok', { vol: 0.3 }); await ctx.wait(1.4);
  viewMode = 'tv'; $('.reseau', el).style.display = ''; $('.reseau', el).innerHTML = reseau(); tvLook = { yaw: 0, pitch: -0.03, zoom: 1.5 }; prompt(t(coop && ctx.cc.remote() ? 'e.photoC' : 'e.photo'));
  let framing;
  if (coop && ctx.cc.remote()) { const offF = on('net:ev', (m) => { if (m.k === 'frame' && m.v) tvLook = { ...tvLook, ...m.v }; }); ctx.onCleanup(offF); }
  if (coop && ctx.cc.remote()) framing = await ctx.cc.ask('photo', { site: [site.x - lx, site.z] }, async () => ({ yaw: 0, pitch: -0.03, zoom: 1.5 }), 30);
  else {
    const pb = $('.photobtn', el); pb.style.display = ''; actBtn.style.display = 'none';
    framing = await new Promise((res) => { pb.onclick = () => res(tvLook); const off = ctx.loop((dt) => { const a = axis(); tvLook.yaw = clamp(tvLook.yaw - a.x * dt * 0.4, -0.5, 0.5); tvLook.pitch = clamp(tvLook.pitch + a.y * dt * 0.25, -0.3, 0.3); if (down('KeyQ')) tvLook.zoom = clamp(tvLook.zoom * (1 + dt), 1, 2.2); if (down('KeyZ')) tvLook.zoom = clamp(tvLook.zoom / (1 + dt), 1, 2.2);
      if (pressed('KeyP', 'KeyE', 'Enter') || (AUTO() && ctx.time > 0)) { off(); res(tvLook); } }); ctx.onCleanup(() => (pb.onclick = null)); });
    pb.style.display = 'none';
  }
  tvLook = framing || tvLook; await ctx.wait(0.05);
  st.photo = takePhoto(); sfx('click'); const fl2 = $('.flash', el); fl2.style.transition = 'opacity .05s'; fl2.style.opacity = 0.9; setTimeout(() => { fl2.style.transition = 'opacity .6s'; fl2.style.opacity = 0; }, 60);
  tick('photo'); ctx.cc.log('e.t.photo', null, 'ok'); await ctx.wait(1.2); $('.reseau', el).style.display = 'none';
  // final: cámara gira alrededor de la escena
  viewMode = 'outro'; if (isTouch) { $('.tc-stick', el).style.display = 'none'; $('.jumpbtn', el).style.display = 'none'; } actBtn.style.display = 'none'; P.act = 'salute'; title('e.done'); prompt(''); music('victory', { vol: 0.5 }); ctx.banner(t('e.done'), 'Tranquility Base · 20·VII·1969', 3200, 'good');
  let ang = 0; const c0 = new THREE.Vector3(spot.x, spot.y, spot.z); ctx.loop((dt) => { ang += dt * 0.22; cam.position.set(c0.x + Math.sin(ang) * 7, c0.y + 2.2, c0.z + Math.cos(ang) * 7); cam.lookAt(c0.x, c0.y + 1.2, c0.z); cam.fov = cam.aspect < 1 ? 68 : 50; cam.updateProjectionMatrix(); });
  await ctx.wait(AUTO() ? 2 : 2.4); P.act = 'wave'; await ctx.wait(AUTO() ? 0.2 : 2.6); golfLoop();
  // puntaje
  const goodHits = st.hits.filter(Boolean).length; const timeS = clamp(1 - (tEva - st.t0 - 60) / (O2 - 60), 0, 1);
  const score = Math.round(clamp((st.step ? 10 : 0) + (st.sample ? 15 : 0) + goodHits * 7 + (Math.abs(st.lean) < 6 ? 6 : 2) + 3 + st.photo * 30 + timeS * 15, 0, 100));
  dbg('plbEva', { score, hits: goodHits, bar: +st.bar.toFixed(2), photo: +st.photo.toFixed(2) });
  return { score, stats: { hits: goodHits, depth: Math.round(st.depth * 100), lean: Math.round(st.lean), bar: +st.bar.toFixed(2), photo: +st.photo.toFixed(2), golf: st.golf, time: Math.round(tEva) } };

  function validSite(x, z) {
    if (Math.hypot(x - site.x, z - site.z) > siteR) return 'out';
    for (const [rx, rz, s] of siteRocks) if (Math.hypot(x - rx, z - rz) < s + 0.35) return 'rock';
    for (const [rx, rz, s] of W.rockList) if (Math.abs(rx - x) < 4 && Math.hypot(x - rx, z - rz) < s + 0.35) return 'rock';
    const e = 0.4, gx = (ground(x + e, z) - ground(x - e, z)) / (2 * e), gz = (ground(x, z + e) - ground(x, z - e)) / (2 * e); if ((Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI > 10) return 'slope';
    return 'ok';
  }
  function golfCheck() {
    if (st.golf || P.mode !== 'walk') return; const d = Math.hypot(P.x - golfP.x, P.z - golfP.z); if (d > 1.5) return;
    prompt(t(isTouch ? 'e.swingT' : 'e.swing'));
    if (ACT()) { st.golf = true; P.act = 'swing'; let k = 0; const v = new THREE.Vector3(Math.sin(P.yaw) * 26, 15, Math.cos(P.yaw) * 26); const off = ctx.loop((dt) => { k += dt; P.actK = Math.min(1, k / 0.5); if (k > 0.5) { P.act = null; } if (k > 0.25) { v.y -= 1.62 * dt; golf.position.addScaledVector(v, dt); } if (k > 12) off(); });
      sfx('hammer', { rate: 1.6 }); sfx('jingle_pancho'); achieve('golf'); ctx.say('pa.golf', { ms: 3500 }); ctx.banner(t('e.golf'), '', 2400); ctx.cc.log('e.golf', null, 'ok'); }
  }
  function reseau() { let s = '<svg width="100%" height="100%" style="position:absolute;inset:0"><g stroke="#000" stroke-width="1.4" opacity=".75">'; for (let i = 1; i < 5; i++) for (let j = 1; j < 5; j++) { const x = (i / 5) * 100, y = (j / 5) * 100; s += `<line x1="calc(${x}% - 9px)" y1="${y}%" x2="calc(${x}% + 9px)" y2="${y}%"/><line x1="${x}%" y1="calc(${y}% - 9px)" x2="${x}%" y2="calc(${y}% + 9px)"/>`; } return s + '</g></svg><div style="position:absolute;inset:0;box-shadow:inset 0 0 160px #000c"></div>'; }
  function takePhoto() {
    renderer.render(W.scene, cam); const src = renderer.domElement; const S = 1080; const c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d');
    const sw = Math.min(src.width, src.height); x.drawImage(src, (src.width - sw) / 2, (src.height - sw) / 2, sw, sw, 0, 0, S, S);
    // grano + viñeta + réseau (Hasselblad)
    const id = x.getImageData(0, 0, S, S), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
    const g = x.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75); g.addColorStop(0, '#0000'); g.addColorStop(1, '#000a'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.strokeStyle = '#000c'; x.lineWidth = 3; for (let i = 1; i < 5; i++) for (let j = 1; j < 5; j++) { const px = (i / 5) * S, py = (j / 5) * S; x.beginPath(); x.moveTo(px - 14, py); x.lineTo(px + 14, py); x.moveTo(px, py - 14); x.lineTo(px, py + 14); x.stroke(); }
    try { shared.flagPhoto = c.toDataURL('image/jpeg', 0.85); } catch {}
    // calidad del encuadre: bandera y astronauta en pantalla y centrados
    const sc = (v) => { const p = v.clone().project(cam); return p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 ? 1 - Math.min(1, Math.hypot(p.x, p.y) * 0.7) : 0; };
    const fq = sc(flag.position.clone().add(new THREE.Vector3(0, 1.8, 0))), aq = sc(ast.root.position.clone().add(new THREE.Vector3(0, 1, 0)));
    return clamp(fq * 0.6 + aq * 0.4 + 0.15, 0, 1);
  }
}
