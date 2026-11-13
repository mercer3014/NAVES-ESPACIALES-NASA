// FASE 6 · Informe: barras por fase, rango, logros, tarjeta para compartir (1080×1350) y pantalla de práctica
import { show } from '../../ui/router.js';
import { t, extend, lang } from '../../core/i18n.js';
import { store, shared, dbg } from '../../core/store.js';
import { $, $$, h, sleep, achieve, mmss, toast } from '../../core/util.js';
import { sfx, music, voice } from '../../core/audio.js';
import { setPhaseBed } from '../../audio/runtime.js';
import { renderFlag, renderPatch } from '../../ui/flag.js';
import { lobbyBg } from '../../ui/screens.js';
import { pancho } from '../../ui/pancho.js';
extend({
  'd.title': ['Informe de misión', 'Mission debrief'], 'd.total': ['Puntaje total', 'Total score'], 'd.share': ['Compartir', 'Share'], 'd.save': ['Descargar tarjeta', 'Download card'],
  'd.again': ['Volar otra vez', 'Fly again'], 'd.menu': ['Menú', 'Menu'], 'd.ach': ['Logros', 'Achievements'], 'd.new': ['¡nuevo!', 'new!'], 'd.best': ['Récord', 'Best'], 'd.newbest': ['¡Nuevo récord!', 'New record!'],
  'd.r4': ['COMANDANTE LUNAR', 'LUNAR COMMANDER'], 'd.r3': ['PILOTO DEL LEM', 'LM PILOT'], 'd.r2': ['CADETE ESPACIAL', 'SPACE CADET'], 'd.r1': ['APRENDIZ DE ASTRONAUTA', 'ASTRONAUT TRAINEE'],
  'd.crew': ['Tripulación', 'Crew'], 'd.rolePilot': ['PILOTO · LM', 'PILOT · LM'], 'd.roleCapcom': ['CAPCOM', 'CAPCOM'], 'd.card': ['Llegué a la Luna y planté mi bandera', 'I reached the Moon and planted my flag'], 'd.mission': ['MISIÓN 1 · BASE TRANQUILIDAD', 'MISSION 1 · TRANQUILITY BASE'],
  'd.copied': ['Imagen guardada', 'Image saved'], 'd.pr': ['Práctica', 'Practice'], 'd.retry': ['Reintentar', 'Retry'], 'd.next': ['Siguiente fase', 'Next phase'],
  'd.s.prep': ['{t} · {m} errores', '{t} · {m} mistakes'], 'd.s.launch': ['Corredor {c}% · separación {s}s', 'Corridor {c}% · staging {s}s'], 'd.s.cruise': ['TLI {a}% · LOI {b}% · foto {p}%', 'TLI {a}% · LOI {b}% · photo {p}%'],
  'd.s.descent': ['{r} · {v} m/s · {f}s de combustible', '{r} · {v} m/s · {f}s of fuel'], 'd.s.eva': ['{h}/3 golpes · foto {p}%', '{h}/3 hits · photo {p}%'],
  'd.res.good': ['Alunizaje perfecto', 'Perfect landing'], 'd.res.hard': ['Alunizaje duro', 'Hard landing'], 'd.res.crash': ['Rescatado por Pancho', 'Rescued by Pancho'], 'd.res.ok': ['Alunizado', 'Landed'],
  'd.pancho': ['¡Lo hicimos! Houston está celebrando… y yo también.', 'We did it! Houston is celebrating… and so am I.'],
});
const PH = ['prep', 'launch', 'cruise', 'descent', 'eva'];
export const rankOf = (s) => (s >= 88 ? 4 : s >= 72 ? 3 : s >= 50 ? 2 : 1);
function statLine(ph, r) {
  const s = r?.stats || {}; if (!r) return '—';
  if (ph === 'prep') return t('d.s.prep', { t: mmss(s.time || 0), m: s.mistakes ?? 0 });
  if (ph === 'launch') return t('d.s.launch', { c: s.corridor ?? 0, s: s.stage ?? '–' });
  if (ph === 'cruise') return t('d.s.cruise', { a: s.tli ?? 0, b: s.loi ?? 0, p: s.photo ?? 0 });
  if (ph === 'descent') return t('d.s.descent', { r: t('d.res.' + (s.result || 'ok')), v: s.vs != null ? Math.abs(s.vs).toFixed(1) : '–', f: s.fuel ?? 0 });
  if (ph === 'eva') return t('d.s.eva', { h: s.hits ?? 0, p: Math.round((s.photo || 0) * 100) });
  return '';
}
const ALL_ACH = ['first', 'mission1', 'soft', 'fuel', 'nofault', 'noassist', 'wrinkle', 'golf', 'sock', 'earthrise', 'galaxy', 'cardboard', 'coop'];

export default async function debrief(p, { retry, menu } = {}) {
  lobbyBg(); setPhaseBed('debrief'); music('victory', { vol: 0.5, loop: false });
  const R = p.results || {}; const scores = PH.map((k) => R[k]?.score ?? 0); const total = Math.round(scores.reduce((a, b) => a + b, 0) / PH.length);
  const rank = rankOf(total); const best = store.get('bestTotal') || 0; const newBest = total > best; if (newBest) store.set('bestTotal', total);
  const t0 = Date.now() - 1000; achieve('mission1'); if (p.diff !== 'cadet') achieve('noassist');
  const el = show(`<div class="screen debrief" style="overflow:auto;justify-content:flex-start;padding-top:calc(24px + var(--safe-t))"><div class="panel dialog" style="margin:auto">
    <div class="phase-tag" style="text-align:center">${t('d.mission')}</div><h2 style="text-align:center;margin:.3em 0 .2em">${t('d.title')}</h2>
    <div class="scores">${PH.map((k, i) => `<div class="srow"><span>${t('ph.' + k)}<br><small style="color:var(--dim);font-family:Mono;font-size:.68rem">${statLine(k, R[k])}</small></span><div class="track"><i data-w="${scores[i]}"></i></div><span class="num" data-n="${scores[i]}">0</span></div>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--line);padding-top:10px;font-family:Chakra"><span>${t('d.total')}</span><b class="mono tot" style="font-size:2rem;color:var(--go)">0</b></div>
    <div class="rank" style="opacity:0;transition:opacity .6s,transform .6s;transform:scale(1.4)">${t('d.r' + rank)}</div><div class="nb" style="text-align:center;color:var(--amber);font-family:Chakra;min-height:1.2em">${newBest ? '★ ' + t('d.newbest') : `${t('d.best')}: ${best}`}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:14px;margin-top:10px;align-items:start">
      <div><img class="card-prev" alt="share card"></div>
      <div><div class="phase-tag" style="margin-bottom:6px">${t('d.ach')}</div><div class="achs" style="display:flex;flex-wrap:wrap;gap:6px"></div>
        <div class="phase-tag" style="margin:12px 0 6px">${t('d.crew')}</div><div class="crewl" style="display:grid;gap:6px"></div></div></div>
    <div class="btns"><button class="btn go" data-a="share">${t('d.share')}</button><button class="btn" data-a="save">${t('d.save')}</button><button class="btn" data-a="again">${t('d.again')}</button><button class="btn" data-a="menu">${t('d.menu')}</button></div>
  </div></div>`, 'debrief');
  dbg('debrief', { total, rank, scores });
  // tripulación
  const cl = $('.crewl', el); for (const m of p.crew || []) { const c = document.createElement('canvas'); c.width = c.height = 96; m.flag ? renderPatch(c, m.flag, m.name, 96) : drawPancho(c); c.style.cssText = 'width:40px;height:40px;border-radius:50%'; const row = h(`<div style="display:flex;gap:10px;align-items:center;font-family:Chakra"><span class="ic"></span><span><b>${esc(m.name)}</b><br><small style="color:var(--dim)">${m.role === 'capcom' ? 'CAPCOM' : t('role.pilot')}</small></span></div>`); row.querySelector('.ic').append(c); cl.append(row); }
  // animación de barras y números
  await sleep(300);
  for (let i = 0; i < PH.length; i++) { const row = $$('.srow', el)[i]; const bar = $('.track i', row), num = $('.num', row); bar.style.width = scores[i] + '%'; countUp(num, scores[i], 900); sfx('beep', { vol: 0.3, rate: 0.9 + i * 0.1 }); await sleep(320); }
  countUp($('.tot', el), total, 1200); await sleep(1250); const rk = $('.rank', el); rk.style.opacity = 1; rk.style.transform = 'none'; sfx('jingle_win'); if (newBest) sfx('powerup');
  pancho.say('d.pancho', { ms: 4200 });
  // logros
  const a = store.get('achievements'); const ab = $('.achs', el);
  for (const k of ALL_ACH) { const got = a[k], fresh = got && got >= t0 - 3 * 3600e3 && got >= (p.date || 0) - 3 * 3600e3; ab.append(h(`<span class="chip" title="${t('ach.' + k)}" style="${got ? (fresh ? 'border-color:var(--amber);color:var(--amber)' : '') : 'opacity:.35'}">${t('ach.' + k)}${fresh ? ` <small>${t('d.new')}</small>` : ''}</span>`)); }
  // tarjeta
  const card = await makeCard(p, total, rank); const url = card.toDataURL('image/jpeg', 0.9); $('.card-prev', el).src = url; dbg('plbCard', url);
  el.onclick = async (e) => {
    const act = e.target.closest('[data-a]')?.dataset.a; if (!act) return; sfx('click');
    if (act === 'share') { try { const blob = await new Promise((r) => card.toBlob(r, 'image/jpeg', 0.9)); const file = new File([blob], 'planta-la-bandera.jpg', { type: 'image/jpeg' }); if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Planta la Bandera', text: t('d.card') + ' · ' + total + '/100' }); else download(url); } catch (err) { if (err?.name !== 'AbortError') download(url); } }
    if (act === 'save') download(url);
    if (act === 'again') retry?.();
    if (act === 'menu') menu?.();
  };
}
function download(url) { const a = document.createElement('a'); a.href = url; a.download = 'planta-la-bandera.jpg'; document.body.append(a); a.click(); a.remove(); toast(t('d.copied'), 'info'); }
const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
function countUp(el, to, ms) { const s = performance.now(); const f = (n) => { const k = Math.min(1, (n - s) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function drawPancho(c) { const x = c.getContext('2d'), s = c.width; x.fillStyle = '#1a2234'; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, 7); x.fill(); x.fillStyle = '#d7dde8'; x.beginPath(); x.arc(s / 2, s * 0.42, s * 0.18, 0, 7); x.fill(); x.fillStyle = '#8fd0ff'; x.beginPath(); x.arc(s / 2, s * 0.4, s * 0.1, 0, 7); x.fill(); x.fillStyle = '#3a455c'; x.fillRect(s * 0.28, s * 0.62, s * 0.44, s * 0.14); }
const loadImg = (src) => new Promise((r) => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

export async function makeCard(p, total, rank) {
  try { await Promise.all(['900 60px Orbitron', '700 30px Chakra', '24px Mono'].map((f) => document.fonts.load(f))); } catch {}
  const W = 1080, H = 1350; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070a14'); g.addColorStop(1, '#020308'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.7})`; const r = Math.random() * 1.6; x.fillRect(Math.random() * W, Math.random() * H, r, r); }
  // foto
  const ph = await loadImg(shared.flagPhoto || shared.photo); const px = 60, py = 166, pw = W - 120, phh = 744;
  x.save(); roundRect(x, px, py, pw, phh, 26); x.clip();
  if (ph) { const s = Math.max(pw / ph.width, phh / ph.height); x.drawImage(ph, px + (pw - ph.width * s) / 2, py + (phh - ph.height * s) / 2, ph.width * s, ph.height * s); }
  else { x.fillStyle = '#2a2a2e'; x.fillRect(px, py, pw, phh); const f = document.createElement('canvas'); renderFlag(f, p.crew?.[0]?.flag, 600, 380); x.drawImage(f, px + pw / 2 - 300, py + phh / 2 - 190); }
  const vg = x.createLinearGradient(0, py + phh - 260, 0, py + phh); vg.addColorStop(0, '#0000'); vg.addColorStop(1, '#000d'); x.fillStyle = vg; x.fillRect(px, py, pw, phh); x.restore();
  x.strokeStyle = '#ffffff30'; x.lineWidth = 2; roundRect(x, px, py, pw, phh, 26); x.stroke();
  // cabecera
  x.textAlign = 'left'; x.fillStyle = '#e8eef8'; x.font = '900 54px Orbitron'; x.fillText('PLANTA LA BANDERA', 60, 100); x.fillStyle = '#ffb000'; x.font = '24px Mono'; x.fillText(t('d.mission'), 62, 138);
  // sello sobre la foto
  x.save(); x.translate(W - 210, py + 120); x.rotate(-0.18); x.strokeStyle = '#ffb000'; x.fillStyle = '#ffb000'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 110, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 96, 0, 7); x.stroke();
  x.textAlign = 'center'; x.font = '900 30px Orbitron'; x.fillText('20·VII·1969', 0, -8); x.font = '700 22px Chakra'; x.fillText('TRANQUILITY BASE', 0, 26); x.font = '18px Mono'; x.fillText(new Date(p.date || Date.now()).toLocaleDateString(lang() === 'es' ? 'es' : 'en'), 0, 56); x.restore();
  // texto en foto
  x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = '700 40px Chakra'; wrap(x, t('d.card'), px + 40, py + phh - 70, pw - 80, 46);
  // puntaje
  const by = py + phh + 50; x.fillStyle = '#8d97a8'; x.font = '24px Mono'; x.fillText(t('d.total').toUpperCase(), 60, by + 20); x.fillStyle = '#3ddc84'; x.font = '900 120px Orbitron'; x.fillText(String(total), 54, by + 140);
  x.fillStyle = '#ffb000'; x.font = '900 34px Orbitron'; x.fillText(t('d.r' + rank), 60, by + 200);
  // barras mini
  const R = p.results || {}; PH.forEach((k, i) => { const yy = by + 6 + i * 44, xx = 430; x.fillStyle = '#8d97a8'; x.font = '20px Mono'; x.fillText(t('ph.' + k).toUpperCase(), xx, yy + 18); x.fillStyle = '#1a2030'; roundRect(x, xx + 190, yy + 2, 360, 18, 9); x.fill(); const gg = x.createLinearGradient(xx + 190, 0, xx + 550, 0); gg.addColorStop(0, '#4fc3f7'); gg.addColorStop(1, '#3ddc84'); x.fillStyle = gg; roundRect(x, xx + 190, yy + 2, Math.max(18, 3.6 * (R[k]?.score ?? 0)), 18, 9); x.fill(); });
  // tripulación
  const cy = H - 110; x.fillStyle = '#ffffff12'; x.fillRect(0, cy - 40, W, 150); let cx = 60;
  for (const m of p.crew || []) { const pc = document.createElement('canvas'); pc.width = pc.height = 128; m.flag ? renderPatch(pc, m.flag, m.name, 128) : drawPancho(pc); x.drawImage(pc, cx, cy - 22, 84, 84); x.fillStyle = '#fff'; x.font = '700 30px Chakra'; x.textAlign = 'left'; x.fillText(String(m.name).slice(0, 16), cx + 100, cy + 18); x.fillStyle = '#8d97a8'; x.font = '20px Mono'; x.fillText(t(m.role === 'capcom' ? 'd.roleCapcom' : 'd.rolePilot'), cx + 100, cy + 50); cx += 470; }
  return c;
}
function roundRect(x, a, b, w, hh, r) { x.beginPath(); x.roundRect(a, b, w, hh, r); }
function wrap(x, s, a, b, w, lh) { const words = s.split(' '); let line = '', lines = []; for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (x.measureText(tt).width > w && line) { lines.push(line); line = wd; } else line = tt; } lines.push(line); lines.forEach((l, i) => x.fillText(l, a, b - (lines.length - 1 - i) * lh)); }

export function practiceScreen(phase, r, { retry, next, menu } = {}) {
  lobbyBg(); const best = (store.get('best') || {})[phase] || 0; const sc = r?.score ?? 0;
  const el = show(`<div class="screen"><div class="panel dialog" style="text-align:center;width:min(440px,100%)">
    <div class="phase-tag">${t('d.pr')} · ${t('ph.' + phase)}</div><div class="mono" style="font-size:clamp(56px,14vw,92px);color:var(--go);line-height:1.1;margin:.2em 0" data-n="${sc}">0</div>
    <div style="color:var(--dim);font-family:Mono;font-size:.8rem">${statLine(phase, r)}</div><div style="margin-top:8px;font-family:Chakra;color:var(--amber)">${sc >= best ? '★ ' + t('d.newbest') : t('d.best') + ': ' + best}</div>
    <div class="btns"><button class="btn" data-a="retry">↻ ${t('d.retry')}</button><button class="btn" data-a="menu">${t('d.menu')}</button></div></div></div>`, 'practice');
  countUp($('[data-n]', el), sc, 900); sfx(sc >= 60 ? 'jingle_win' : 'beep');
  el.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); ({ retry, next, menu })[a]?.(); };
}
