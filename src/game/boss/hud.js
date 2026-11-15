// HUD propio del combate No Canon (capa fija sobre el canvas; no usa el router para poder montarse dentro de cualquier fase)
import { lang } from '../../core/i18n.js';
import { isTouch } from '../../core/store.js';

export const L = (es, en) => (lang() === 'en' ? en || es : es);

const CSS = `
.bossD{position:fixed;inset:0;z-index:60;pointer-events:none;font-family:'Barlow Semi Condensed',Chakra,system-ui,sans-serif;color:#F2EFE6;user-select:none}
.bossD *{box-sizing:border-box}
.bossD .bd-grain{position:absolute;inset:0;opacity:.045;mix-blend-mode:overlay;background-size:180px 180px;animation:bossDgrain 1.2s steps(4) infinite}
.bossD .bd-hurt{position:absolute;inset:0;border:12px solid #E0201B;opacity:0;transition:opacity .35s}
.bossD .bd-whiteout{position:absolute;inset:0;background:#F2EFE6;opacity:0;transition:opacity .6s}
.bossD .bd-nocanon{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:14px;font:600 12px/1 Jost,Orbitron,sans-serif;letter-spacing:.14em;color:#FFB000;border:1px solid #FFB000;background:#0B0C0E;padding:7px 10px;border-radius:2px}
.bossD .bd-panel-b{transition:opacity .25s}
.bossD.bd-hudoff .bd-panel-b{opacity:.06}
.bossD .bd-bar{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(560px,62vw);text-align:center}
.bossD .bd-bar b{display:block;font:600 13px/1.2 Jost,Orbitron,sans-serif;letter-spacing:.18em;color:#F2EFE6}
.bossD .bd-bar small{display:block;font-size:12px;color:#F2EFE6;opacity:.7;letter-spacing:.1em;margin-bottom:5px}
.bossD .bd-hp{position:relative;height:12px;background:#0B0C0E;border:1px solid #3A3D42;border-radius:2px;overflow:hidden}
.bossD .bd-hp i{position:absolute;left:0;top:0;bottom:0;width:100%;background:#FFB000;transition:width .12s}
.bossD .bd-hp b{position:absolute;left:0;top:0;bottom:0;width:100%;background:#F2EFE6;transition:width .55s ease-in .35s}
.bossD .bd-hp.bd-hit{animation:bossDhit .28s}
.bossD .bd-hp.bd-hit i{background:#F2EFE6}
.bossD .bd-dmg{position:absolute;transform:translate(-50%,-50%);font:700 22px/1 'IBM Plex Mono',Mono,monospace;color:#FFB000;text-shadow:0 2px 0 #0B0C0E,0 0 10px #0B0C0E;pointer-events:none;animation:bossDdmg .9s ease-out forwards;white-space:nowrap}
.bossD .bd-dmg.bd-crit{font-size:32px;color:#FF4F00}
.bossD .bd-dmg.bd-plate{color:#F2EFE6}
.bossD .bd-dmg.bd-mute{font-size:15px;color:#F2EFE6;opacity:.75}
.bossD .bd-hp u{position:absolute;top:0;bottom:0;width:2px;background:#0B0C0E}
.bossD .bd-card{position:absolute;left:14px;top:calc(14px + env(safe-area-inset-top,0px));width:min(340px,42vw);background:#0B0C0Eeb;border:1px solid #3A3D42;border-radius:2px;padding:10px 12px}
.bossD .bd-card .bd-k{font:600 10px/1 Jost,Orbitron,sans-serif;letter-spacing:.16em;color:#FFB000;margin-bottom:8px}
.bossD .bd-card .bd-obj{font-size:15px;line-height:1.35}
.bossD .bd-card .bd-obj:empty{display:none}
.bossD .bd-card .bd-sub{font-size:12px;color:#F2EFE6;opacity:.7;margin-top:8px}
.bossD .bd-steps{display:flex;flex-direction:column;gap:6px}
.bossD .bd-step{display:flex;align-items:center;gap:10px;opacity:.5;font-size:14px;line-height:1.25}
.bossD .bd-step.bd-on{opacity:1}
.bossD .bd-step.bd-done{opacity:.4;text-decoration:line-through}
.bossD .bd-step kbd{flex:none;min-width:44px;height:44px;padding:0 6px;display:flex;align-items:center;justify-content:center;font:500 18px/1 'IBM Plex Mono',Mono,monospace;color:#F2EFE6;background:#3A3D42;border:2px solid #3A3D42;border-bottom-width:4px;border-radius:3px;letter-spacing:.02em}
.bossD .bd-step.bd-on kbd{background:#0B0C0E;border-color:#FF4F00;color:#FF4F00}
.bossD .bd-step.bd-done kbd{border-color:#3A3D42;color:#F2EFE6}
.bossD .bd-hint{display:none;margin-top:8px;padding:6px 8px;border-left:3px solid #FFB000;background:#3A3D42;font-size:12px;line-height:1.3}
.bossD .bd-o2{position:absolute;left:14px;bottom:calc(${isTouch ? 170 : 18}px + env(safe-area-inset-bottom,0px));width:min(320px,44vw)}
.bossD .bd-o2 .bd-lbl{font:600 11px/1 Jost,Orbitron,sans-serif;letter-spacing:.14em;margin-bottom:5px;display:flex;justify-content:space-between}
.bossD .bd-o2 .bd-lbl em{font-style:normal;color:#FFB000;font-family:'IBM Plex Mono',Mono,monospace}
.bossD .bd-o2 .bd-track{height:14px;background:#0B0C0E;border:1px solid #3A3D42;border-radius:2px;overflow:hidden}
.bossD .bd-o2 .bd-track i{display:block;height:100%;width:100%;background:#F2EFE6;transition:width .15s}
.bossD .bd-o2.bd-low .bd-track i{background:#E0201B}
.bossD .bd-tools{position:absolute;right:14px;bottom:calc(${isTouch ? 250 : 18}px + env(safe-area-inset-bottom,0px));display:flex;gap:8px}
.bossD .bd-tool{position:relative;width:78px;padding:7px 6px 6px;background:#0B0C0Eeb;border:1px solid #3A3D42;border-radius:2px;text-align:center;font-size:11px;overflow:hidden}
.bossD .bd-tool b{display:block;font:600 10px/1.1 Jost,Orbitron,sans-serif;letter-spacing:.06em;margin-bottom:3px}
.bossD .bd-tool kbd{font:11px 'IBM Plex Mono',Mono,monospace;color:#FFB000}
.bossD .bd-tool .bd-cd{position:absolute;left:0;bottom:0;height:3px;background:#FFB000;width:0}
.bossD .bd-tool.bd-off{opacity:.45}
.bossD .bd-tool.bd-ready{border-color:#FFB000}
.bossD .bd-t-hammer{width:118px}
.bossD .bd-t-hammer .bd-wsel{display:flex;gap:4px;justify-content:center;margin-top:4px}
.bossD .bd-t-hammer .bd-wsel span{font:10px 'IBM Plex Mono',Mono,monospace;padding:1px 5px;border:1px solid #3A3D42;border-radius:2px;opacity:.6}
.bossD .bd-t-hammer .bd-wsel span.bd-on{border-color:#FFB000;color:#FFB000;opacity:1}
.bossD .bd-t-hammer.bd-swap{animation:bossDswap .3s}
.bossD .bd-big{position:absolute;top:calc(68px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);font:600 40px/1 'IBM Plex Mono',Mono,monospace;letter-spacing:.04em;color:#F2EFE6;background:#0B0C0E;padding:4px 12px;border-radius:2px;display:none}
.bossD .bd-big.bd-red{color:#E0201B}
.bossD .bd-meter{position:absolute;top:calc(70px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(300px,50vw);display:none;text-align:center;font-size:12px;letter-spacing:.12em}
.bossD .bd-meter .bd-track{height:8px;margin-top:4px;background:#0B0C0E;border:1px solid #E0201B;border-radius:2px;overflow:hidden}
.bossD .bd-meter i{display:block;height:100%;width:0;background:#E0201B}
.bossD .bd-subs{position:absolute;left:50%;bottom:calc(${isTouch ? 120 : 92}px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(760px,90vw);text-align:center;font-size:clamp(15px,2.2vw,21px);line-height:1.35}
.bossD .bd-subs:not(:empty){background:#0B0C0Ed9;padding:8px 14px;border-radius:2px}
.bossD .bd-subs .bd-who{display:block;font:600 11px/1.4 Jost,Orbitron,sans-serif;letter-spacing:.16em;color:#FFB000}
.bossD .bd-subs .bd-tag{font-size:11px;color:#F2EFE6;opacity:.7;letter-spacing:.08em}
.bossD .bd-prompt{position:absolute;left:50%;bottom:calc(${isTouch ? 90 : 56}px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#0B0C0E;border:1px solid #FFB000;border-radius:2px;padding:6px 14px;font-size:15px;display:none;white-space:nowrap}
.bossD .bd-holdbar{display:block;height:3px;margin-top:5px;background:#3A3D42}.bossD .bd-holdbar i{display:block;height:100%;width:0;background:#FFB000}
.bossD .bd-help{position:absolute;left:50%;top:calc(118px + env(safe-area-inset-top,0px));transform:translateX(-50%);background:#0B0C0Eeb;border:1px solid #3A3D42;border-radius:2px;padding:8px 14px;font-size:13px;color:#F2EFE6;text-align:center;transition:opacity 1s;max-width:92vw}
.bossD .bd-toastb{position:absolute;left:50%;top:30%;transform:translateX(-50%);font:600 20px/1.2 Jost,Orbitron,sans-serif;letter-spacing:.08em;opacity:0;transition:opacity .3s;text-align:center;background:#0B0C0E;padding:6px 14px;border-radius:2px;max-width:90vw}
.bossD .bd-toastb.bd-on{opacity:1}
.bossD .bd-ov{position:absolute;inset:0;background:#0B0C0Ed9;display:flex;align-items:center;justify-content:center;pointer-events:auto}
.bossD .bd-ov .bd-box{width:min(620px,92vw);max-height:86vh;overflow:auto;background:#0B0C0E;border:1px solid #3A3D42;border-top:3px solid #FF4F00;border-radius:2px;padding:22px 24px}
.bossD .bd-ov h2{margin:0 0 6px;font:600 24px/1.2 Jost,Orbitron,sans-serif;letter-spacing:.04em}
.bossD .bd-ov .bd-k{font:600 11px/1 Jost,Orbitron,sans-serif;color:#FFB000;letter-spacing:.16em;margin-bottom:10px}
.bossD .bd-ov p{font-size:15px;line-height:1.5;color:#F2EFE6}
.bossD .bd-ov .bd-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.bossD .bd-ov button{pointer-events:auto;font:600 14px 'Barlow Semi Condensed',Chakra,sans-serif;letter-spacing:.08em;padding:10px 16px;border-radius:2px;border:1px solid #FF4F00;background:#FF4F00;color:#0B0C0E;cursor:pointer}
.bossD .bd-ov button.bd-sec{background:transparent;color:#FF4F00}
.bossD .bd-tc{pointer-events:auto}
.bossD .bd-tc-stick{position:absolute;left:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:130px;height:130px;border-radius:4px;background:#0B0C0E80;border:1px solid #3A3D42}
.bossD .bd-tc-stick i{position:absolute;left:50%;top:50%;width:54px;height:54px;border-radius:3px;background:#3A3D42;transform:translate(-50%,-50%)}
.bossD .bd-tcb{position:absolute;width:66px;height:66px;border-radius:4px;background:#0B0C0Eeb;border:1px solid #FFB000;color:#FFB000;font:600 10px Jost,Orbitron,sans-serif}
.bossD .bd-tcb.down{background:#FFB000;color:#0B0C0E}
@keyframes bossDhit{0%{transform:translate(0,0)}20%{transform:translate(-4px,1px)}45%{transform:translate(4px,-1px)}70%{transform:translate(-2px,0)}100%{transform:translate(0,0)}}
@keyframes bossDdmg{0%{opacity:0;transform:translate(-50%,-30%) scale(.6)}15%{opacity:1;transform:translate(-50%,-60%) scale(1.15)}30%{transform:translate(-50%,-70%) scale(1)}100%{opacity:0;transform:translate(-50%,-190%) scale(.95)}}
@keyframes bossDswap{0%{transform:scale(1)}40%{transform:scale(1.08);border-color:#FFB000}100%{transform:scale(1)}}
@keyframes bossDgrain{0%{background-position:0 0}25%{background-position:-40px 20px}50%{background-position:30px -30px}75%{background-position:-20px -10px}100%{background-position:0 0}}
`;

function grainURL() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c.toDataURL();
}

export function mountBossHud() {
  if (!document.getElementById('bossD-style')) { const s = document.createElement('style'); s.id = 'bossD-style'; s.textContent = CSS; document.head.append(s); }
  const el = document.createElement('div'); el.className = 'bossD';
  const tool = (id, name, key) => `<div class="bd-tool bd-t-${id}"><b>${name}</b><kbd>${isTouch ? '' : key}</kbd> <span class="bd-n"></span><i class="bd-cd"></i></div>`;
  el.innerHTML = `<div class="bd-grain"></div><div class="bd-hurt"></div><div class="bd-whiteout"></div>
    <div class="bd-nocanon">${L('NO CANON · SUEÑO', 'NON-CANON · DREAM')}</div>
    <div class="bd-panel-b">
      <div class="bd-bar"><b>${L('EL GUARDIÁN DE TRANQUILIDAD', 'THE GUARDIAN OF TRANQUILITY')}</b><small class="bd-ph"></small><div class="bd-hp"><b></b><i></i><u style="left:70%"></u><u style="left:35%"></u></div></div>
      <div class="bd-card"><div class="bd-k">${L('OBJETIVO', 'OBJECTIVE')}</div><div class="bd-obj"></div><div class="bd-steps"></div><div class="bd-sub"></div><div class="bd-hint"></div></div>
      <div class="bd-o2"><div class="bd-lbl"><span>O₂ · ALDRIN</span><em class="bd-buff"></em></div><div class="bd-track"><i></i></div></div>
      <div class="bd-tools">${tool('hammer', L('MARTILLO GEOL.', 'GEO HAMMER'), 'E / clic')}${tool('flash', 'FLASH', 'F / clic der.')}${tool('dash', L('ESQUIVA', 'DODGE'), 'Shift')}${tool('hose', L('MANGUERA', 'O₂ HOSE'), 'Q')}</div>
      <div class="bd-big"></div>
      <div class="bd-meter"><span class="bd-mt"></span><div class="bd-track"><i></i></div></div>
    </div>
    <div class="bd-subs"></div>
    <div class="bd-prompt"><span class="bd-pt"></span><span class="bd-holdbar" style="display:none"><i></i></span></div>
    <div class="bd-help">${isTouch ? L('Joystick moverse · arrastra para mirar · botones: SALTO, GOLPE, HERRAMIENTA, FLASH, ESQUIVA, MANGUERA', 'Stick to move · drag to look · buttons: JUMP, STRIKE, TOOL, FLASH, DODGE, HOSE') : L('WASD moverse · ratón mirar · Espacio saltar · Shift esquivar · E/clic golpear · 1/2 o rueda: martillo/mazo · F/clic der. flash · Q manguera · Tab fijar cámara · Esc pausa', 'WASD move · mouse look · Space jump · Shift dodge · E/click strike · 1/2 or wheel: hammer/mallet · F/right-click flash · Q hose · Tab lock camera · Esc pause')}</div>
    <div class="bd-toastb"></div>
    ${isTouch ? `<div class="bd-tc"><div class="bd-tc-stick"><i></i></div>
      <button class="bd-tcb" data-b="jump" style="right:20px;bottom:calc(24px + env(safe-area-inset-bottom,0px))">${L('SALTO', 'JUMP')}</button>
      <button class="bd-tcb" data-b="hammer" style="right:96px;bottom:calc(40px + env(safe-area-inset-bottom,0px))">${L('MARTILLO', 'HAMMER')}</button>
      <button class="bd-tcb" data-b="flash" style="right:40px;bottom:calc(100px + env(safe-area-inset-bottom,0px))">FLASH</button>
      <button class="bd-tcb" data-b="dash" style="right:170px;bottom:calc(24px + env(safe-area-inset-bottom,0px))">${L('ESQUIVA', 'DODGE')}</button>
      <button class="bd-tcb" data-b="tool" style="right:190px;bottom:calc(100px + env(safe-area-inset-bottom,0px))">${L('HERRAM.', 'TOOL')}</button>
      <button class="bd-tcb" data-b="hose" style="right:116px;bottom:calc(116px + env(safe-area-inset-bottom,0px))">${L('MANGUERA', 'HOSE')}</button></div>` : ''}`;
  { const t = el.querySelector('.bd-t-hammer'); const s = document.createElement('div'); s.className = 'bd-wsel'; s.innerHTML = `<span class="bd-on">1</span><span>2</span>`; t.insertBefore(s, t.querySelector('.bd-cd')); }
  el.querySelector('.bd-grain').style.backgroundImage = `url(${grainURL()})`;
  document.body.append(el);
  const q = (s) => el.querySelector(s);
  let subT = 0, toastT = 0, hintT = 0, objSig = '';
  const hud = {
    el, q,
    phase(text) { q('.bd-ph').textContent = text; },
    hp(v) { const w = Math.max(0, v) + '%'; const i = q('.bd-hp i'); if (i.style.width !== w) { i.style.width = w; q('.bd-hp b').style.width = w; } },
    // sacudida y destello de la barra del Guardián al recibir daño
    hpHit() { const h = q('.bd-hp'); h.classList.remove('bd-hit'); void h.offsetWidth; h.classList.add('bd-hit'); },
    // número de daño flotante en coordenadas de pantalla (px); kind: '' | 'crit' | 'plate' | 'mute'
    dmg(x, y, text, kind = '') { const d = document.createElement('div'); d.className = 'bd-dmg' + (kind ? ' bd-' + kind : ''); d.textContent = text; d.style.left = x.toFixed(0) + 'px'; d.style.top = y.toFixed(0) + 'px'; el.append(d); setTimeout(() => d.remove(), 950); },
    // herramienta activa en la tarjeta del golpe
    weapon(name, idx) { const t = q('.bd-t-hammer'); t.querySelector('b').textContent = name; t.querySelectorAll('.bd-wsel span').forEach((s, i) => s.classList.toggle('bd-on', i === idx)); t.classList.remove('bd-swap'); void t.offsetWidth; t.classList.add('bd-swap'); },
    o2(v, buff = '') { const o = q('.bd-o2'); o.querySelector('.bd-track i').style.width = Math.max(0, Math.min(100, v)) + '%'; o.classList.toggle('bd-low', v < 25); q('.bd-buff').textContent = buff; },
    // steps: [{ k: 'F', t: 'texto', on, done }] → un icono de tecla grande por paso; el paso activo se resalta
    objective(obj, sub = '', steps = []) { const sig = JSON.stringify([obj, sub, steps]); if (sig === objSig) return; objSig = sig; q('.bd-obj').textContent = obj; q('.bd-sub').textContent = sub;
      const st = q('.bd-steps'); st.textContent = ''; for (const p of steps) { const d = document.createElement('div'); d.className = 'bd-step' + (p.on ? ' bd-on' : '') + (p.done ? ' bd-done' : ''); const k = document.createElement('kbd'); k.textContent = p.k; const t = document.createElement('span'); t.textContent = p.t; d.append(k, t); st.append(d); } },
    // aviso pequeño dentro de la tarjeta de objetivo (no tapa la vista)
    hint(text, ms = 2500) { const h = q('.bd-hint'); clearTimeout(hintT); h.textContent = text || ''; h.style.display = text ? 'block' : 'none'; if (text) hintT = setTimeout(() => { h.style.display = 'none'; }, ms); },
    tool(id, { n = '', cd = 0, off = false, ready = false } = {}) { const t = q('.bd-t-' + id); t.querySelector('.bd-n').textContent = n; t.querySelector('.bd-cd').style.width = (cd * 100).toFixed(0) + '%'; t.classList.toggle('bd-off', off); t.classList.toggle('bd-ready', ready); },
    big(text, red = false) { const b = q('.bd-big'); b.style.display = text ? 'block' : 'none'; b.textContent = text; b.classList.toggle('bd-red', red); },
    meter(label, v) { const m = q('.bd-meter'); m.style.display = label ? 'block' : 'none'; if (label) { q('.bd-mt').textContent = label; m.querySelector('i').style.width = (Math.min(1, v) * 100).toFixed(0) + '%'; } },
    sub(who, text, tag = '', ms = 3200) { const s = q('.bd-subs'); s.innerHTML = text ? `${who ? `<span class="bd-who">${who}</span>` : ''}${text}${tag ? ` <span class="bd-tag">(${tag})</span>` : ''}` : ''; clearTimeout(subT); if (text && ms) subT = setTimeout(() => (s.innerHTML = ''), ms); },
    prompt(text, hold = -1) { const p = q('.bd-prompt'); p.style.display = text ? 'block' : 'none'; if (!text) return; q('.bd-pt').textContent = text; const hb = q('.bd-holdbar'); hb.style.display = hold >= 0 ? 'block' : 'none'; if (hold >= 0) hb.querySelector('i').style.width = (hold * 100).toFixed(0) + '%'; },
    toast(text, ms = 1600, color = '#fff') { const t = q('.bd-toastb'); t.textContent = text; t.style.color = color; t.classList.add('bd-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('bd-on'), ms); },
    hurt(k = 1) { const h = q('.bd-hurt'); h.style.transition = 'none'; h.style.opacity = String(Math.min(1, 0.4 + 0.6 * k)); void h.offsetWidth; h.style.transition = 'opacity .7s'; h.style.opacity = '0'; },
    white(k = 1) { const w = q('.bd-whiteout'); w.style.transition = 'none'; w.style.opacity = String(k); void w.offsetWidth; w.style.transition = 'opacity .7s'; w.style.opacity = '0'; },
    hudOff(on) { el.classList.toggle('bd-hudoff', on); },
    hideHelp() { q('.bd-help').style.opacity = '0'; },
    gameplay(on) { q('.bd-panel-b').style.display = on ? '' : 'none'; q('.bd-help').style.display = on ? '' : 'none'; if (q('.bd-tc')) q('.bd-tc').style.display = on ? '' : 'none'; },
    overlay(html) { const o = document.createElement('div'); o.className = 'bd-ov'; o.innerHTML = `<div class="bd-box">${html}</div>`; el.append(o); return o; },
    dispose() { clearTimeout(subT); clearTimeout(toastT); clearTimeout(hintT); el.remove(); },
  };
  return hud;
}
