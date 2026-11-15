// HUD propio del combate No Canon (capa fija sobre el canvas; no usa el router para poder montarse dentro de cualquier fase)
import { lang } from '../../core/i18n.js';
import { isTouch } from '../../core/store.js';

export const L = (es, en) => (lang() === 'en' ? en || es : es);

const CSS = `
.bossD{position:fixed;inset:0;z-index:60;pointer-events:none;font-family:Chakra,system-ui,sans-serif;color:#eef2f6;user-select:none}
.bossD *{box-sizing:border-box}
.bossD .bd-grain{position:absolute;inset:0;opacity:.13;mix-blend-mode:overlay;background-size:180px 180px;animation:bossDgrain .5s steps(4) infinite}
.bossD .bd-vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55) 100%)}
.bossD .bd-hurt{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(200,20,10,.65) 100%);opacity:0;transition:opacity .35s}
.bossD .bd-whiteout{position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .6s}
.bossD .bd-nocanon{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:14px;font:700 12px/1 Orbitron,Chakra,sans-serif;letter-spacing:.14em;color:#ffcf6a;border:1px solid #ffcf6a88;background:#0009;padding:7px 10px;border-radius:4px}
.bossD .bd-panel-b{transition:opacity .25s,filter .25s}
.bossD.bd-hudoff .bd-panel-b{opacity:.06;filter:blur(2px)}
.bossD .bd-bar{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(560px,62vw);text-align:center}
.bossD .bd-bar b{display:block;font:700 13px/1.2 Orbitron,Chakra,sans-serif;letter-spacing:.18em;text-shadow:0 1px 6px #000}
.bossD .bd-bar small{display:block;font-size:11px;color:#c9d2db;letter-spacing:.1em;margin-bottom:5px}
.bossD .bd-hp{position:relative;height:12px;background:#000a;border:1px solid #ffffff40;border-radius:3px;overflow:hidden}
.bossD .bd-hp i{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,#b8862e,#ffcf6a);transition:width .25s}
.bossD .bd-hp u{position:absolute;top:0;bottom:0;width:2px;background:#000c}
.bossD .bd-card{position:absolute;left:14px;top:calc(14px + env(safe-area-inset-top,0px));width:min(310px,40vw);background:#05080ecc;border:1px solid #ffffff22;border-radius:6px;padding:10px 12px}
.bossD .bd-card .bd-k{font:700 10px/1 Orbitron,sans-serif;letter-spacing:.16em;color:#ffcf6a;margin-bottom:6px}
.bossD .bd-card .bd-obj{font-size:14px;line-height:1.35}
.bossD .bd-card .bd-sub{font-size:12px;color:#aeb8c2;margin-top:6px}
.bossD .bd-o2{position:absolute;left:14px;bottom:calc(${isTouch ? 170 : 18}px + env(safe-area-inset-bottom,0px));width:min(320px,44vw)}
.bossD .bd-o2 .bd-lbl{font:700 11px/1 Orbitron,sans-serif;letter-spacing:.14em;margin-bottom:5px;display:flex;justify-content:space-between}
.bossD .bd-o2 .bd-lbl em{font-style:normal;color:#7fe0ff}
.bossD .bd-o2 .bd-track{height:14px;background:#000a;border:1px solid #ffffff40;border-radius:3px;overflow:hidden}
.bossD .bd-o2 .bd-track i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3f8f6a,#8fe3b0);transition:width .15s}
.bossD .bd-o2.bd-low .bd-track i{background:linear-gradient(90deg,#a3261b,#ff6a4a)}
.bossD .bd-tools{position:absolute;right:14px;bottom:calc(${isTouch ? 250 : 18}px + env(safe-area-inset-bottom,0px));display:flex;gap:8px}
.bossD .bd-tool{position:relative;width:78px;padding:7px 6px 6px;background:#05080ecc;border:1px solid #ffffff2a;border-radius:6px;text-align:center;font-size:11px;overflow:hidden}
.bossD .bd-tool b{display:block;font:700 10px/1.1 Orbitron,sans-serif;letter-spacing:.06em;margin-bottom:3px}
.bossD .bd-tool kbd{font:11px Mono,monospace;color:#ffcf6a}
.bossD .bd-tool .bd-cd{position:absolute;left:0;bottom:0;height:3px;background:#ffcf6a;width:0}
.bossD .bd-tool.bd-off{opacity:.45}
.bossD .bd-tool.bd-ready{border-color:#8fe3b0;box-shadow:0 0 12px #8fe3b055}
.bossD .bd-big{position:absolute;top:calc(68px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);font:900 40px/1 Orbitron,sans-serif;letter-spacing:.06em;text-shadow:0 0 18px #000;display:none}
.bossD .bd-big.bd-red{color:#ff5a3c}
.bossD .bd-meter{position:absolute;top:calc(70px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(300px,50vw);display:none;text-align:center;font-size:11px;letter-spacing:.12em}
.bossD .bd-meter .bd-track{height:8px;margin-top:4px;background:#000a;border:1px solid #ff6a4a88;border-radius:3px;overflow:hidden}
.bossD .bd-meter i{display:block;height:100%;width:0;background:#ff5a3c}
.bossD .bd-subs{position:absolute;left:50%;bottom:calc(${isTouch ? 120 : 92}px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(760px,90vw);text-align:center;font-size:clamp(15px,2.2vw,21px);line-height:1.35;text-shadow:0 2px 10px #000,0 0 3px #000}
.bossD .bd-subs .bd-who{display:block;font:700 11px/1.4 Orbitron,sans-serif;letter-spacing:.16em;color:#ffcf6a}
.bossD .bd-subs .bd-tag{font-size:11px;color:#c9d2db;letter-spacing:.08em}
.bossD .bd-prompt{position:absolute;left:50%;bottom:calc(${isTouch ? 90 : 56}px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#000b;border:1px solid #ffcf6a88;border-radius:20px;padding:6px 14px;font-size:14px;display:none;white-space:nowrap}
.bossD .bd-holdbar{display:block;height:3px;margin-top:5px;background:#ffffff22}.bossD .bd-holdbar i{display:block;height:100%;width:0;background:#ffcf6a}
.bossD .bd-help{position:absolute;left:50%;top:calc(118px + env(safe-area-inset-top,0px));transform:translateX(-50%);background:#000a;border-radius:6px;padding:8px 14px;font-size:13px;color:#d7dee5;text-align:center;transition:opacity 1s;max-width:92vw}
.bossD .bd-toastb{position:absolute;left:50%;top:38%;transform:translateX(-50%);font:700 20px/1.2 Orbitron,Chakra,sans-serif;letter-spacing:.08em;text-shadow:0 0 14px #000;opacity:0;transition:opacity .3s;text-align:center}
.bossD .bd-toastb.bd-on{opacity:1}
.bossD .bd-ov{position:absolute;inset:0;background:#000c;display:flex;align-items:center;justify-content:center;pointer-events:auto}
.bossD .bd-ov .bd-box{width:min(620px,92vw);max-height:86vh;overflow:auto;background:#0a0e15;border:1px solid #ffcf6a66;border-radius:8px;padding:22px 24px}
.bossD .bd-ov h2{margin:0 0 6px;font:900 22px/1.2 Orbitron,sans-serif;letter-spacing:.06em}
.bossD .bd-ov .bd-k{font:700 11px/1 Orbitron,sans-serif;color:#ffcf6a;letter-spacing:.16em;margin-bottom:10px}
.bossD .bd-ov p{font-size:14px;line-height:1.5;color:#d7dee5}
.bossD .bd-ov .bd-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.bossD .bd-ov button{pointer-events:auto;font:700 13px Orbitron,Chakra,sans-serif;letter-spacing:.08em;padding:10px 16px;border-radius:5px;border:1px solid #ffcf6a;background:#ffcf6a;color:#111;cursor:pointer}
.bossD .bd-ov button.bd-sec{background:transparent;color:#ffcf6a}
.bossD .bd-tc{pointer-events:auto}
.bossD .bd-tc-stick{position:absolute;left:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:130px;height:130px;border-radius:50%;background:#ffffff14;border:1px solid #ffffff33}
.bossD .bd-tc-stick i{position:absolute;left:50%;top:50%;width:54px;height:54px;border-radius:50%;background:#ffffff40;transform:translate(-50%,-50%)}
.bossD .bd-tcb{position:absolute;width:66px;height:66px;border-radius:50%;background:#05080ecc;border:1px solid #ffcf6a88;color:#ffcf6a;font:700 10px Orbitron,sans-serif}
.bossD .bd-tcb.down{background:#ffcf6a;color:#111}
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
  el.innerHTML = `<div class="bd-grain"></div><div class="bd-vig"></div><div class="bd-hurt"></div><div class="bd-whiteout"></div>
    <div class="bd-nocanon">${L('NO CANON · SUEÑO', 'NON-CANON · DREAM')}</div>
    <div class="bd-panel-b">
      <div class="bd-bar"><b>${L('EL GUARDIÁN DE TRANQUILIDAD', 'THE GUARDIAN OF TRANQUILITY')}</b><small class="bd-ph"></small><div class="bd-hp"><i></i><u style="left:70%"></u><u style="left:35%"></u></div></div>
      <div class="bd-card"><div class="bd-k">${L('OBJETIVO', 'OBJECTIVE')}</div><div class="bd-obj"></div><div class="bd-sub"></div></div>
      <div class="bd-o2"><div class="bd-lbl"><span>O₂ · ALDRIN</span><em class="bd-buff"></em></div><div class="bd-track"><i></i></div></div>
      <div class="bd-tools">${tool('hammer', L('MARTILLO', 'HAMMER'), 'E / clic')}${tool('flash', 'FLASH', 'F / clic der.')}${tool('dash', L('ESQUIVA', 'DODGE'), 'Shift')}${tool('hose', L('MANGUERA', 'O₂ HOSE'), 'Q')}</div>
      <div class="bd-big"></div>
      <div class="bd-meter"><span class="bd-mt"></span><div class="bd-track"><i></i></div></div>
    </div>
    <div class="bd-subs"></div>
    <div class="bd-prompt"><span class="bd-pt"></span><span class="bd-holdbar" style="display:none"><i></i></span></div>
    <div class="bd-help">${isTouch ? L('Joystick moverse · arrastra para mirar · botones: SALTO, MARTILLO, FLASH, ESQUIVA, MANGUERA', 'Stick to move · drag to look · buttons: JUMP, HAMMER, FLASH, DODGE, HOSE') : L('WASD moverse · ratón mirar · Espacio saltar · Shift esquivar · E/clic martillo · F/clic der. flash · Q manguera · Tab fijar cámara · Esc pausa', 'WASD move · mouse look · Space jump · Shift dodge · E/click hammer · F/right-click flash · Q hose · Tab lock camera · Esc pause')}</div>
    <div class="bd-toastb"></div>
    ${isTouch ? `<div class="bd-tc"><div class="bd-tc-stick"><i></i></div>
      <button class="bd-tcb" data-b="jump" style="right:20px;bottom:calc(24px + env(safe-area-inset-bottom,0px))">${L('SALTO', 'JUMP')}</button>
      <button class="bd-tcb" data-b="hammer" style="right:96px;bottom:calc(40px + env(safe-area-inset-bottom,0px))">${L('MARTILLO', 'HAMMER')}</button>
      <button class="bd-tcb" data-b="flash" style="right:40px;bottom:calc(100px + env(safe-area-inset-bottom,0px))">FLASH</button>
      <button class="bd-tcb" data-b="dash" style="right:170px;bottom:calc(24px + env(safe-area-inset-bottom,0px))">${L('ESQUIVA', 'DODGE')}</button>
      <button class="bd-tcb" data-b="hose" style="right:116px;bottom:calc(116px + env(safe-area-inset-bottom,0px))">${L('MANGUERA', 'HOSE')}</button></div>` : ''}`;
  el.querySelector('.bd-grain').style.backgroundImage = `url(${grainURL()})`;
  document.body.append(el);
  const q = (s) => el.querySelector(s);
  let subT = 0, toastT = 0;
  const hud = {
    el, q,
    phase(text) { q('.bd-ph').textContent = text; },
    hp(v) { q('.bd-hp i').style.width = Math.max(0, v) + '%'; },
    o2(v, buff = '') { const o = q('.bd-o2'); o.querySelector('.bd-track i').style.width = Math.max(0, Math.min(100, v)) + '%'; o.classList.toggle('bd-low', v < 25); q('.bd-buff').textContent = buff; },
    objective(obj, sub = '') { if (q('.bd-obj').textContent !== obj) q('.bd-obj').textContent = obj; if (q('.bd-sub').textContent !== sub) q('.bd-sub').textContent = sub; },
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
    dispose() { clearTimeout(subT); clearTimeout(toastT); el.remove(); },
  };
  return hud;
}
