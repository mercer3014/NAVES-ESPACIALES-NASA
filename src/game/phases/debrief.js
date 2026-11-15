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
import '../design/design.css';
import { NASA_PLAN, SITES, INSTRUMENTS, EVA_TIMES, NASA_MARGIN_S, COMMS, POWER, WINDOWS, BUDGET_CR, activePlan, computePlan, diffVsNasa, scoreAxes } from '../design/plan.js';
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
  'dz.title': ['Diseño vs. resultado', 'Design vs. result'], 'dz.vs': ['Tu plan vs. la NASA 1969', 'Your plan vs. NASA 1969'],
  'dz.redo': ['Rediseñar y volver a volar', 'Redesign and fly again'], 'dz.redoD': ['Cambia el plan y vuelve a volar el descenso y la caminata en modo práctica.', 'Change the plan and fly the descent and the moonwalk again in practice mode.'],
  'dz.col': ['Decisión', 'Decision'], 'dz.you': ['Tu plan', 'Your plan'], 'dz.nasa': ['NASA 1969', 'NASA 1969'],
  'dz.r.site': ['Lugar', 'Site'], 'dz.r.pay': ['Carga', 'Payload'], 'dz.r.fuel': ['Combustible', 'Fuel'], 'dz.r.eva': ['Caminata', 'Moonwalk'], 'dz.r.mass': ['Masa', 'Mass'], 'dz.none': ['ninguna', 'none'],
  'dz.l.site': ['Elegiste {site}: campo de rocas de {r} m y zona segura de {p} m. {o}', 'You chose {site}: a {r} m boulder field and a {p} m safe zone. {o}'],
  'dz.o.good': ['Aterrizaste a {d} m del centro de la zona.', 'You landed {d} m from the centre of the zone.'], 'dz.o.hard': ['Fue un alunizaje duro: las rocas y la pendiente cobran su precio.', 'It was a hard landing: rocks and slope take their toll.'],
  'dz.o.crash': ['Las rocas te hicieron fallar y hubo que reintentar.', 'The rocks made you fail and you had to retry.'], 'dz.o.crashN': ['Reintentaste {n} vez/veces por el terreno.', 'You retried {n} time(s) because of the terrain.'],
  'dz.l.fuel': ['Margen de combustible {m}: aterrizaste con {f} s de margen (Armstrong, unos {a} s).', 'Fuel margin {m}: you landed with {f} s to spare (Armstrong, about {a} s).'],
  'dz.l.fuelX': ['Ese combustible extra pesó {kg} kg y te quitó carga científica.', 'That extra fuel weighed {kg} kg and cost you science payload.'],
  'dz.l.fuelL': ['Menos combustible liberó {kg} kg para ciencia, a cambio de menos margen.', 'Less fuel freed {kg} kg for science, in exchange for less margin.'],
  'dz.l.sci': ['Desplegaste {n}: +{s} puntos de ciencia.', 'You deployed {n}: +{s} science points.'], 'dz.l.sci0': ['No desplegaste instrumentos con tarea: la ciencia vino de la muestra y la cámara.', 'You deployed no task instruments: the science came from the sample and the camera.'],
  'dz.l.psep': ['Tu sismómetro registró los pasos, como en 1969.', 'Your seismometer recorded the footsteps, as in 1969.'], 'dz.l.lrrr': ['Tu retrorreflector sigue en uso hoy.', 'Your retroreflector is still in use today.'],
  'dz.l.eva': ['Caminata de {h}: terminaste con {o}% de O₂.', 'Moonwalk of {h}: you finished with {o}% O₂.'],
  'dz.l.evaL': ['Mucho margen de O₂: podías haber hecho más ciencia.', 'Plenty of O₂ left: you could have done more science.'], 'dz.l.evaT': ['Justo de oxígeno: la caminata larga es arriesgada.', 'Tight on oxygen: the long moonwalk is risky.'],
  'dz.rocks': ['Roca traída: {k} kg', 'Rock brought back: {k} kg'], 'dz.before': ['Antes', 'Before'], 'dz.now': ['Ahora', 'Now'], 'dz.same': ['Sin cambios respecto al plan de la NASA.', 'Same as the NASA plan.'],
  'dz.r.budget': ['Presupuesto', 'Budget'], 'dz.r.power': ['Energía', 'Power'], 'dz.r.comms': ['Comunicaciones', 'Communications'], 'dz.r.window': ['Ventana', 'Window'],
  'dz.ax.success': ['Éxito', 'Success'], 'dz.ax.science': ['Ciencia', 'Science'], 'dz.ax.safety': ['Seguridad', 'Safety'], 'dz.ax.efficiency': ['Eficiencia', 'Efficiency'],
  'dz.l.budget': ['Gastaste {s} de {b} créditos y sobraron {left}. Ese sobrante es la eficiencia del plan.', 'You spent {s} of {b} credits and had {left} left. That leftover is the plan’s efficiency.'],
  'dz.l.power': ['Baterías: {name}. {why}', 'Batteries: {name}. {why}'],
  'dz.l.comms': ['Comunicaciones: {name}. {why}', 'Communications: {name}. {why}'],
  'dz.l.window': ['Ventana {name}. {why}', 'Window {name}. {why}'],
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
const pick = (pair) => pair[lang() === 'es' ? 0 : 1];
const fx = (v) => '×' + v.toFixed(2).replace('.', lang() === 'es' ? ',' : '.');
const evaH = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
// «Diseño vs. resultado»: líneas causales a partir del plan y de los resultados reales de descent y eva
export function designLines(plan, R) {
  const c = computePlan(plan), D = R?.descent?.stats, E = R?.eva?.stats, out = [];
  if (D?.site) {
    const o = D.crashes ? t('dz.o.crashN', { n: D.crashes }) : D.result === 'hard' ? t('dz.o.hard') : t('dz.o.good', { d: D.pad ?? '–' });
    out.push(t('dz.l.site', { site: pick(SITES[c.plan.site].name), r: D.rockR, p: D.padR, o }));
    out.push(t('dz.l.fuel', { m: fx(c.fuelMult), f: D.fuel ?? '–', a: NASA_MARGIN_S }) + (c.fuelKg > 0 ? ' ' + t('dz.l.fuelX', { kg: c.fuelKg }) : c.fuelKg < 0 ? ' ' + t('dz.l.fuelL', { kg: -c.fuelKg }) : ''));
  }
  if (E) {
    const names = (E.instruments || []).map((n) => pick(Object.values(INSTRUMENTS).find((i) => i.task === n).name));
    const dn = E.instruments || [];
    out.push((names.length ? t('dz.l.sci', { n: names.join(', '), s: E.sci }) : t('dz.l.sci0')) + (dn.includes('PSEP') ? ' ' + t('dz.l.psep') : dn.includes('LRRR') ? ' ' + t('dz.l.lrrr') : ''));
    out.push(t('dz.l.eva', { h: evaH(E.evaMin ?? c.evaMin), o: Math.round((E.o2Left ?? 0) * 100) }) + (c.plan.evaTime === 'long' && E.o2Left < 0.2 ? ' ' + t('dz.l.evaT') : c.plan.evaTime === 'short' && E.o2Left > 0.45 ? ' ' + t('dz.l.evaL') : ''));
  }
  const pow = POWER[c.plan.power], comm = COMMS[c.plan.comms], win = WINDOWS[c.plan.window];
  out.push(t('dz.l.budget', { s: c.spent, b: c.budget, left: c.budgetLeft }));
  out.push(t('dz.l.power', { name: pick(pow.name), why: pick(pow.blurb) }));
  out.push(t('dz.l.comms', { name: pick(comm.name), why: pick(comm.blurb) }));
  out.push(t('dz.l.window', { name: pick(win.name), why: c.windowFit ? pick(win.blurb) : (lang() === 'es' ? 'No coincide con el sitio: el Sol queda en otro ángulo y las sombras cambian.' : 'It does not match the site: the Sun sits at another angle and the shadows change.') }));
  return out.slice(0, 8);
}
const payNames = (pl) => (pl.payload.length ? pl.payload.map((id) => pick(INSTRUMENTS[id].name)).join(', ') : t('dz.none'));
export function compareHtml(plan) {
  const a = computePlan(plan), b = computePlan(NASA_PLAN), d = diffVsNasa(plan);
  const rows = [['site', pick(SITES[a.plan.site].name), pick(SITES[b.plan.site].name), d.site], ['pay', payNames(a.plan), payNames(b.plan), d.added.length || d.dropped.length],
    ['fuel', `${fx(a.fuelMult)} · ~${a.marginSec} s`, `${fx(b.fuelMult)} · ~${b.marginSec} s`, d.fuel], ['eva', evaH(a.evaMin), evaH(b.evaMin), d.evaTime], ['mass', `${a.massKg} kg`, `${b.massKg} kg`, a.massKg !== b.massKg],
    ['budget', `${a.spent}/${BUDGET_CR}`, `${b.spent}/${BUDGET_CR}`, a.spent !== b.spent], ['power', pick(POWER[a.plan.power].name), pick(POWER[b.plan.power].name), d.power],
    ['comms', pick(COMMS[a.plan.comms].name), pick(COMMS[b.plan.comms].name), d.comms], ['window', pick(WINDOWS[a.plan.window].name), pick(WINDOWS[b.plan.window].name), d.window]];
  return `<table class="dbr-cmp"><tr><th>${t('dz.col')}</th><th>${t('dz.you')}</th><th>${t('dz.nasa')}</th></tr>${rows.map(([k, y, n, df]) => `<tr><td>${t('dz.r.' + k)}</td><td class="${df ? 'diff' : ''}">${esc(y)}</td><td>${esc(n)}</td></tr>`).join('')}</table>`;
}
const designHtml = (plan, R) => {
  const lines = designLines(plan, R);
  const axes = scoreAxes(plan, R);
  const axisHtml = `<div class="dbr-axes">${axes.map((a) => `<div><span>${t('dz.ax.' + a.id)}</span><b>${a.pct}</b><i style="--w:${a.pct}%"></i></div>`).join('')}</div>`;
  return `<div class="dbr-sec"><h3>${t('dz.title')}</h3>${axisHtml}${lines.map((l, i) => `<div class="dbr-line"><i>${i + 1}</i><span>${esc(l)}</span></div>`).join('') || `<div class="dbr-line"><i>-</i><span>${t('dz.same')}</span></div>`}</div>
    <div class="dbr-sec"><h3>${t('dz.vs')}</h3>${compareHtml(plan)}</div>`;
};
// «Rediseñar y volver a volar»: abre la sala de diseño y relanza en práctica solo las fases que dependen de lo que cambió
async function redesign(plan, R, p) {
  const before = activePlan(null, store); const { designRoom } = await import('../design/design-screen.js');
  const next = await designRoom({ mode: 'redesign' });
  const same = (k) => JSON.stringify(before[k]) === JSON.stringify(next[k]);
  const phase = !same('site') || !same('fuel') || !same('window') ? 'descent' : 'eva';
  shared.redesign = { before: { plan: before, scores: { descent: R.descent?.score ?? 0, eva: R.eva?.score ?? 0 } } };
  const { startMission } = await import('../mission.js'); startMission({ mode: 'solo', role: 'pilot', practice: phase, diff: p.diff });
}
const ALL_ACH = ['first', 'mission1', 'soft', 'fuel', 'nofault', 'noassist', 'wrinkle', 'golf', 'sock', 'earthrise', 'galaxy', 'cardboard', 'coop', 'memorial'];

export default async function debrief(p, { retry, menu } = {}) {
  lobbyBg(); setPhaseBed('debrief'); music('victory', { vol: 0.5, loop: false });
  const R = p.results || {}; const plan = activePlan(p, store); const scores = PH.map((k) => R[k]?.score ?? 0); const total = Math.round(scores.reduce((a, b) => a + b, 0) / PH.length);
  const rank = rankOf(total); const best = store.get('bestTotal') || 0; const newBest = total > best; if (newBest) store.set('bestTotal', total);
  shared.redesign = null; const t0 = Date.now() - 1000; achieve('mission1'); if (p.diff !== 'cadet') achieve('noassist');
  const el = show(`<div class="screen debrief" style="overflow:auto;justify-content:flex-start;padding-top:calc(24px + var(--safe-t))"><div class="panel dialog" style="margin:auto">
    <div class="phase-tag" style="text-align:center">${t('d.mission')}</div><h2 style="text-align:center;margin:.3em 0 .2em">${t('d.title')}</h2>
    <div class="scores">${PH.map((k, i) => `<div class="srow"><span>${t('ph.' + k)}<br><small style="color:var(--dim);font-family:Mono;font-size:.68rem">${statLine(k, R[k])}</small></span><div class="track"><i data-w="${scores[i]}"></i></div><span class="num" data-n="${scores[i]}">0</span></div>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--line);padding-top:10px;font-family:Chakra"><span>${t('d.total')}</span><b class="mono tot" style="font-size:2rem;color:var(--go)">0</b></div>
    <div class="rank" style="opacity:0;transition:opacity .6s,transform .6s;transform:scale(1.4)">${t('d.r' + rank)}</div><div class="nb" style="text-align:center;color:var(--amber);font-family:Chakra;min-height:1.2em">${newBest ? `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path fill="currentColor" d="M12 2.8l2.4 6.6h6.8l-5.5 4.2 2.1 6.6L12 16.2 6.2 20.2l2.1-6.6L2.8 9.4h6.8z"/></svg>${t('d.newbest')}` : `${t('d.best')}: ${best}`}</div>
    ${designHtml(plan, R)}
    ${p.mode === 'coop' ? '' : `<div class="dbr-redo"><button class="btn" data-a="redesign">${t('dz.redo')}</button><small>${t('dz.redoD')}</small></div>`}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:14px;margin-top:10px;align-items:start">
      <div><img class="card-prev" alt="share card" style="width:100%;aspect-ratio:4/5;object-fit:cover;background:#131417;opacity:0;transition:opacity .3s"></div>
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
  const card = await makeCard(p, total, rank); const url = card.toDataURL('image/jpeg', 0.9); const prev = $('.card-prev', el); prev.onload = () => { prev.style.opacity = 1; }; prev.src = url; dbg('plbCard', url);
  el.onclick = async (e) => {
    const act = e.target.closest('[data-a]')?.dataset.a; if (!act) return; sfx('click');
    if (act === 'share') { try { const blob = await new Promise((r) => card.toBlob(r, 'image/jpeg', 0.9)); const file = new File([blob], 'planta-la-bandera.jpg', { type: 'image/jpeg' }); if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Planta la Bandera', text: t('d.card') + ' · ' + total + '/100' }); else download(url); } catch (err) { if (err?.name !== 'AbortError') download(url); } }
    if (act === 'save') download(url);
    if (act === 'redesign') redesign(plan, R, p);
    if (act === 'again') retry?.();
    if (act === 'menu') menu?.();
  };
}
function download(url) { const a = document.createElement('a'); a.href = url; a.download = 'planta-la-bandera.jpg'; document.body.append(a); a.click(); a.remove(); toast(t('d.copied'), 'info'); }
const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
function countUp(el, to, ms) { const s = performance.now(); const f = (n) => { const k = Math.min(1, (n - s) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function drawPancho(c) { const x = c.getContext('2d'), s = c.width; x.fillStyle = '#1a2234'; x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, 7); x.fill(); x.strokeStyle = '#c6a36a'; x.lineWidth = Math.max(2, s * 0.05); x.beginPath(); x.arc(s / 2, s * 0.46, s * 0.22, Math.PI, 0); x.stroke(); x.fillStyle = '#c6a36a'; x.fillRect(s * 0.28, s * 0.44, s * 0.44, s * 0.08); x.beginPath(); x.arc(s / 2, s * 0.66, s * 0.14, 0, 7); x.fill(); }
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

// Tras «Rediseñar y volver a volar»: puntaje de antes frente al de ahora para la fase practicada
function redoBlock(phase, sc) {
  const rd = shared.redesign; if (!rd) return '';
  const was = rd.before.scores[phase] ?? 0, pl = computePlan(activePlan(null, store)).plan, d = sc - was;
  return `<div class="dbr-sec" style="text-align:left"><h3>${t('dz.title')}</h3><div class="dbr-line"><i>-</i><span>${t('dz.before')}: <b>${was}</b> → ${t('dz.now')}: <b>${sc}</b> (${d >= 0 ? '+' : ''}${d})</span></div>
    <div class="dbr-line"><i>-</i><span>${esc(pick(SITES[pl.site].name))} · ${fx(pl.fuel)} · ${evaH(EVA_TIMES[pl.evaTime].min)} · ${esc(payNames(pl))}</span></div></div>`;
}
export function practiceScreen(phase, r, { retry, next, menu } = {}) {
  lobbyBg(); const best = (store.get('best') || {})[phase] || 0; const sc = r?.score ?? 0;
  const el = show(`<div class="screen"><div class="panel dialog" style="text-align:center;width:min(440px,100%)">
    <div class="phase-tag">${t('d.pr')} · ${t('ph.' + phase)}</div><div class="mono" style="font-size:clamp(56px,14vw,92px);color:var(--go);line-height:1.1;margin:.2em 0" data-n="${sc}">0</div>
    <div style="color:var(--dim);font-family:Mono;font-size:.8rem">${statLine(phase, r)}</div>${redoBlock(phase, sc)}<div style="margin-top:8px;font-family:Chakra;color:var(--amber)">${sc >= best ? `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path fill="currentColor" d="M12 2.8l2.4 6.6h6.8l-5.5 4.2 2.1 6.6L12 16.2 6.2 20.2l2.1-6.6L2.8 9.4h6.8z"/></svg>${t('d.newbest')}` : t('d.best') + ': ' + best}</div>
    <div class="btns"><button class="btn" data-a="retry">↻ ${t('d.retry')}</button>${shared.redesign && phase !== 'eva' ? `<button class="btn go" data-a="next">${t('d.next')}</button>` : ''}<button class="btn" data-a="menu">${t('d.menu')}</button></div></div></div>`, 'practice');
  countUp($('[data-n]', el), sc, 900); sfx(sc >= 60 ? 'jingle_win' : 'beep');
  el.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return; sfx('click'); ({ retry, next, menu })[a]?.(); };
}
