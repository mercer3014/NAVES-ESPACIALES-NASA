// «Tu Apolo 11» · mesa de planificación (1967-1969): decisiones a la izquierda, presupuesto en barras a la derecha.
// designRoom({mode:'story'|'free'|'redesign'}) -> Promise<plan>. Guarda el plan en store 'missionPlan'.
import './design.css';
import { show } from '../../ui/router.js';
import { store, dbg } from '../../core/store.js';
import { lang } from '../../core/i18n.js';
import { sfx } from '../../core/audio.js';
import { $, $$ } from '../../core/util.js';
import { NASA_PLAN, SITES, INSTRUMENTS, INSTRUMENT_IDS, EVA_TIMES, PROFILES, FUEL_STEPS, LIMIT_KG, WINDOWS, COMMS, POWER, BUDGET_CR, computePlan, normalizePlan, diffVsNasa } from './plan.js';

const X = {
  kicker: ['1967 – 1969 · Mesa de planificación', '1967 – 1969 · Planning table'],
  title: ['Tu Apolo 11', 'Your Apollo 11'],
  sub: ['Diseña la misión. Cada elección mueve las barras de la derecha. No hay una única respuesta correcta.', 'Design the mission. Every choice moves the bars on the right. There is no single right answer.'],
  prof: ['Atajos', 'Shortcuts'],
  c1: ['Lugar de alunizaje', 'Landing site'], q1: ['¿Dónde aterriza el Eagle?', 'Where does Eagle land?'],
  c2: ['Carga científica', 'Science payload'], q2: ['Elige instrumentos. El Eagle solo admite 100 kg.', 'Pick instruments. Eagle only takes 100 kg.'],
  c3: ['Margen de combustible', 'Fuel margin'], q3: ['Más combustible pesa más: quedan menos kg para ciencia.', 'More fuel weighs more: fewer kg left for science.'],
  c4: ['Duración de la caminata', 'Moonwalk length'], q4: ['¿Cuánto tiempo fuera del Eagle?', 'How long outside Eagle?'],
  c5: ['Ventana de lanzamiento', 'Launch window'], q5: ['El Sol tiene que quedar bajo para ver las rocas.', 'The Sun has to stay low so you can see the rocks.'],
  c6: ['Comunicaciones', 'Communications'], q6: ['¿Quién ve la caminata?', 'Who watches the moonwalk?'],
  c7: ['Energía', 'Power'], q7: ['Las baterías del Eagle pesan y cuestan.', 'Eagle’s batteries weigh and they cost.'],
  who1: ['Farouk El-Baz · geología', 'Farouk El-Baz · geology'], who3: ['Ingeniero del LM · Grumman', 'LM engineer · Grumman'], who6: ['Charlie Duke · comunicaciones', 'Charlie Duke · communications'], whoK: ['Gene Kranz · presupuesto', 'Gene Kranz · budget'],
  mass: ['Masa', 'Mass'], fuel: ['Combustible', 'Fuel'], sci: ['Ciencia', 'Science'], risk: ['Riesgo', 'Risk'], eva: ['Tiempo EVA', 'EVA time'],
  budget: ['Presupuesto', 'Budget'], link: ['Señal de TV', 'TV signal'],
  low: ['BAJO', 'LOW'], mid: ['MEDIO', 'MEDIUM'], high: ['ALTO', 'HIGH'],
  margin: ['margen', 'margin'], pts: ['pts', 'pts'],
  cmp: ['Comparar con la NASA real', 'Compare with the real NASA'], cmpOn: ['Ocultar la NASA real', 'Hide the real NASA'],
  legend: ['Marca naranja = lo que eligió la NASA en 1969. Etiqueta ámbar = su opción.', 'Orange mark = what NASA chose in 1969. Amber tag = its option.'],
  nasa: ['NASA 1969', 'NASA 1969'],
  sign: ['Firmar el plan', 'Sign the plan'], save: ['Guardar plan', 'Save plan'], fly: ['Volar con este plan', 'Fly with this plan'], back: ['Volver', 'Back'],
  over: ['Te pasas {n} kg del límite: quita algo o baja el combustible.', 'You are {n} kg over the limit: drop something or lower the fuel.'],
  overCr: ['Te pasas {n} créditos. Quita una antena, una batería o un instrumento.', 'You are {n} credits over. Drop an antenna, a battery or an instrument.'],
  empty: ['Elige al menos un instrumento.', 'Pick at least one instrument.'],
  free: ['kg libres', 'kg free'], tasks: ['Instrumentos', 'Instruments'],
  fuelNote: ['Margen aprox. {s} s al aterrizar ({kg}).', 'About {s} s of margin on landing ({kg}).'],
  kgW: ['{n} kg de combustible extra', '{n} kg of extra fuel'], kgS: ['{n} kg liberados', '{n} kg freed'], kg0: ['combustible nominal', 'nominal fuel'],
  nasaReal: ['La NASA aterrizó con unos 25 s de margen.', 'NASA landed with about 25 s of margin.'],
  signed: ['Plan firmado', 'Plan signed'],
  done: ['Listo', 'Done'],
};
const FOCUS_LINE = {
  site: ['Farouk El-Baz · el sitio y la ventana. El Sol bajo, entre 5° y 14°, muestra las rocas.', 'Farouk El-Baz · the site and the window. A low Sun, between 5° and 14°, shows the rocks.'],
  fuel: ['Ingeniero del LM · cada kilo de combustible es un kilo menos de ciencia o de baterías.', 'LM engineer · every kilogram of fuel is a kilogram less of science or batteries.'],
  comms: ['Charlie Duke · más antenas, más gente ve la caminata. Parkes sostuvo la imagen.', 'Charlie Duke · more dishes, more people see the moonwalk. Parkes held the picture.'],
  budget: ['Gene Kranz · 100 créditos. Antenas, baterías y combustible extra se pagan de ahí.', 'Gene Kranz · 100 credits. Dishes, batteries and extra fuel are paid from there.'],
};
const tr = (p) => (Array.isArray(p) ? p[lang() === 'es' ? 0 : 1] : String(p ?? ''));
const L = (k, v) => { let s = tr(X[k]); if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll('{' + a + '}', b); return s; };
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
const fmtFuel = (f) => (f === 1 ? '×1,00' : '×' + f.toFixed(2).replace('.', ',')).replace(',', lang() === 'es' ? ',' : '.');
const fmtEva = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
const NASA = computePlan(NASA_PLAN);

export function designRoom({ mode = 'story', focus = null, overlay = false } = {}) {
  return new Promise((resolve) => {
    let plan = normalizePlan(mode === 'story' ? NASA_PLAN : store.get('missionPlan') || NASA_PLAN);
    let msg = null, cmp = false, done = false;
    const siteBtn = (id) => { const s = SITES[id], rk = s.risk <= 1 ? 'low' : s.risk <= 3 ? 'mid' : 'high'; return `<button class="dsg-opt${id === NASA_PLAN.site ? ' nasa' : ''}" data-site="${id}" aria-pressed="false"><span class="o-name">${esc(tr(s.name))}</span><span class="o-meta">${esc(tr(s.tag))}</span><span class="o-num">+${s.sci} ${L('pts')}<small>${L('risk').toUpperCase()} ${L(rk)}</small></span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const instBtn = (id) => { const i = INSTRUMENTS[id]; return `<button class="dsg-opt sm${NASA_PLAN.payload.includes(id) ? ' nasa' : ''}" data-inst="${id}" aria-pressed="false" title="${esc(tr(i.blurb))}"><span class="o-name">${esc(tr(i.name))}</span><span class="o-num">${i.kg} kg<small>+${i.sci} ${L('pts')}</small></span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const evaBtn = (id) => { const e = EVA_TIMES[id]; return `<button class="dsg-opt${id === NASA_PLAN.evaTime ? ' nasa' : ''}" data-eva="${id}" aria-pressed="false"><span class="o-name">${fmtEva(e.min)}</span><span class="o-meta">${esc(tr(e.blurb))}</span><span class="o-num">${e.sci ? '+' + e.sci + ' ' + L('pts') : ''}<small>${e.risk ? L('risk').toUpperCase() + ' +' : ''}</small></span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const winBtn = (id) => { const w = WINDOWS[id]; return `<button class="dsg-opt${id === NASA_PLAN.window ? ' nasa' : ''}" data-win="${id}" aria-pressed="false"><span class="o-name">${esc(tr(w.name))}</span><span class="o-meta">${esc(tr(w.blurb))}</span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const commBtn = (id) => { const w = COMMS[id]; return `<button class="dsg-opt${id === NASA_PLAN.comms ? ' nasa' : ''}" data-comm="${id}" aria-pressed="false"><span class="o-name">${esc(tr(w.name))}</span><span class="o-meta">${esc(tr(w.blurb))}</span><span class="o-num">${w.cost} cr</span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const powBtn = (id) => { const w = POWER[id]; return `<button class="dsg-opt${id === NASA_PLAN.power ? ' nasa' : ''}" data-pow="${id}" aria-pressed="false"><span class="o-name">${esc(tr(w.name))}</span><span class="o-meta">${esc(tr(w.blurb))}</span><span class="o-num">${w.cost} cr</span><i class="nasa-tag">${L('nasa')}</i></button>`; };
    const bar = (k) => `<div class="db" data-bar="${k}"><div class="db-h"><b>${L(k)}</b><span></span></div><div class="db-t"><i></i><em></em></div></div>`;
    const subLine = focus && FOCUS_LINE[focus] ? esc(tr(FOCUS_LINE[focus])) : L('sub');
    const markup = `<div class="screen dsg${mode === 'section' ? ' section' : ''}${focus ? ' focus-' + focus : ''}">
      <header class="dsg-top"><div><div class="dsg-k">${L('kicker')}</div><h1>${L('title')}</h1><p class="dsg-sub">${subLine}</p></div>
        <div class="dsg-prof"><span>${L('prof')}</span>${Object.entries(PROFILES).map(([k, p]) => `<button class="dsg-btn" data-prof="${k}">${esc(tr(p.name))}</button>`).join('')}</div></header>
      <main class="dsg-main">
        <section class="dsg-cards">
          <article class="dsg-card" data-part="site"><p class="dsg-who">${L('who1')}</p><h2><span class="dsg-n">1</span>${L('c1')}</h2><p class="dsg-q">${L('q1')}</p><div class="dsg-opts">${Object.keys(SITES).map(siteBtn).join('')}</div><p class="dsg-q">${L('q5')}</p><div class="dsg-opts">${Object.keys(WINDOWS).map(winBtn).join('')}</div></article>
          <article class="dsg-card" data-part="payload"><h2><span class="dsg-n">2</span>${L('c2')}</h2><p class="dsg-q">${L('q2')}</p><div class="dsg-opts">${INSTRUMENT_IDS.map(instBtn).join('')}</div></article>
          <article class="dsg-card" data-part="fuel"><p class="dsg-who">${L('who3')}</p><h2><span class="dsg-n">3</span>${L('c3')}</h2><p class="dsg-q">${L('q3')}</p>
            <div class="dsg-fuel"><div class="big"><span class="f-val"></span><small class="f-sub"></small></div>
              <input class="dsg-range" type="range" min="0" max="${FUEL_STEPS.length - 1}" step="1" aria-label="${esc(L('c3'))}">
              <div class="dsg-ticks"><span>${fmtFuel(FUEL_STEPS[0])}</span><span>${fmtFuel(1)}</span><span>${fmtFuel(FUEL_STEPS.at(-1))}</span></div></div>
            <p class="dsg-q">${L('q7')}</p><div class="dsg-opts">${Object.keys(POWER).map(powBtn).join('')}</div></article>
          <article class="dsg-card" data-part="eva"><h2><span class="dsg-n">4</span>${L('c4')}</h2><p class="dsg-q">${L('q4')}</p><div class="dsg-opts">${Object.keys(EVA_TIMES).map(evaBtn).join('')}</div></article>
          <article class="dsg-card" data-part="comms"><p class="dsg-who">${L('who6')}</p><h2><span class="dsg-n">5</span>${L('c6')}</h2><p class="dsg-q">${L('q6')}</p><div class="dsg-opts">${Object.keys(COMMS).map(commBtn).join('')}</div></article>
        </section>
        <aside class="dsg-bars"><p class="dsg-who">${L('whoK')}</p><h3>${tr(['Presupuesto de la misión', 'Mission budget'])}</h3>
          ${['mass', 'fuel', 'budget', 'link', 'sci', 'risk', 'eva'].map(bar).join('')}
          <div class="dsg-note" role="status" aria-live="polite"></div><div class="dsg-legend">${L('legend')}</div></aside>
      </main>
      <footer class="dsg-foot"><div class="grp">${mode === 'story' ? '' : `<button class="dsg-btn" data-a="back">${L('back')}</button>`}<button class="dsg-btn" data-a="cmp" aria-pressed="false">${L('cmp')}</button></div>
        <div class="grp"><button class="dsg-btn go" data-a="sign">${L(mode === 'story' ? 'sign' : mode === 'section' ? 'done' : mode === 'redesign' ? 'fly' : 'save')}</button></div></footer></div>`;
    let host = null, el;
    if (overlay) {
      host = document.createElement('div'); host.className = 'dsg-host';
      host.style.cssText = 'position:fixed;inset:0;z-index:90;overflow:auto;background:#0B0C0Ef2';
      host.innerHTML = markup; el = host.querySelector('.dsg'); document.body.append(host);
    } else el = show(markup, 'design');

    const setBar = (k, pct, text, cls, nasaPct) => {
      const b = $(`[data-bar="${k}"]`, el); b.className = 'db ' + (cls || ''); $('span', b).textContent = text; $('i', b).style.width = Math.max(0, Math.min(100, pct)) + '%'; $('em', b).style.left = Math.max(0, Math.min(100, nasaPct)) + '%';
    };
    function paint() {
      const c = computePlan(plan); plan = c.plan;
      $$('[data-site]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.site === plan.site)));
      $$('[data-inst]', el).forEach((b) => b.setAttribute('aria-pressed', String(plan.payload.includes(b.dataset.inst))));
      $$('[data-eva]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.eva === plan.evaTime)));
      $$('[data-win]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.win === plan.window)));
      $$('[data-comm]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.comm === plan.comms)));
      $$('[data-pow]', el).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pow === plan.power)));
      const rg = $('.dsg-range', el); rg.value = String(FUEL_STEPS.indexOf(plan.fuel));
      $('.f-val', el).textContent = fmtFuel(plan.fuel); $('.f-sub', el).textContent = c.fuelKg === 0 ? L('kg0') : c.fuelKg > 0 ? L('kgW', { n: c.fuelKg }) : L('kgS', { n: -c.fuelKg });
      setBar('mass', (c.massKg / LIMIT_KG) * 100, `${c.massKg} / ${LIMIT_KG} kg`, c.over ? 'bad' : c.massKg > 90 ? 'warn' : '', (NASA.massKg / LIMIT_KG) * 100);
      setBar('fuel', (c.marginSec / 100) * 100, `${L('margin')} ~${c.marginSec} s`, c.marginSec < 40 ? 'warn' : '', (NASA.marginSec / 100) * 100);
      setBar('sci', c.sciPct, `${c.sciPts} ${L('pts')}`, '', NASA.sciPct);
      setBar('risk', c.riskPct, L(c.risk), c.risk === 'high' ? 'bad' : c.risk === 'mid' ? 'warn' : '', NASA.riskPct);
      setBar('eva', (c.evaMin / 210) * 100, fmtEva(c.evaMin), '', (NASA.evaMin / 210) * 100);
      setBar('budget', (c.spent / BUDGET_CR) * 100, `${c.spent} / ${BUDGET_CR}`, c.budgetLeft < 0 ? 'bad' : c.budgetLeft < 15 ? 'warn' : '', (NASA.spent / BUDGET_CR) * 100);
      setBar('link', c.tv === 'good' ? 100 : c.tv === 'fair' ? 62 : 28, c.tv === 'good' ? 'Parkes' : c.tv === 'fair' ? 'Honeysuckle' : 'Goldstone', c.tv === 'poor' ? 'bad' : c.tv === 'fair' ? 'warn' : '', 100);
      const note = $('.dsg-note', el);
      note.textContent = c.over ? L('over', { n: c.over }) : c.budgetLeft < 0 ? L('overCr', { n: -c.budgetLeft }) : !plan.payload.length ? L('empty') : msg || tr(SITES[plan.site].blurb); note.classList.toggle('bad', !c.ok);
      $('[data-a=sign]', el).disabled = !c.ok;
      $('[data-a=cmp]', el).setAttribute('aria-pressed', String(cmp)); $('[data-a=cmp]', el).textContent = cmp ? L('cmpOn') : L('cmp');
      el.classList.toggle('cmp', cmp);
      dbg('designState', { plan, c });
    }
    const finish = (saved) => {
      if (done) return; done = true; sfx(saved ? 'ok' : 'click');
      const out = saved ? computePlan(plan).plan : normalizePlan(store.get('missionPlan') || NASA_PLAN);
      if (saved) { store.set('missionPlan', out); void import('../story/state.js').then((s) => { s.unlock('sala-de-diseno', { quiet: mode !== 'story' }); if (diffVsNasa(out).site) s.unlock('elegir-el-sitio', { quiet: true }); }).catch(() => {}); }
      if (host) host.remove();
      if (mode === 'free') import('../../ui/screens.js').then((m) => m.startScreen());
      resolve(out);
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || done) return;
      if (b.dataset.site) { plan.site = b.dataset.site; msg = tr(SITES[plan.site].blurb) + ' ' + tr(SITES[plan.site].sample); sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.inst) { const id = b.dataset.inst; plan.payload = plan.payload.includes(id) ? plan.payload.filter((x) => x !== id) : [...plan.payload, id]; msg = `${tr(INSTRUMENTS[id].name)}: ${tr(INSTRUMENTS[id].blurb)}`; sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.eva) { plan.evaTime = b.dataset.eva; msg = tr(EVA_TIMES[plan.evaTime].blurb); sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.win) { plan.window = b.dataset.win; msg = tr(WINDOWS[plan.window].blurb); sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.comm) { plan.comms = b.dataset.comm; msg = tr(COMMS[plan.comms].blurb); sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.pow) { plan.power = b.dataset.pow; msg = tr(POWER[plan.power].blurb); sfx('switch', { vol: 0.5 }); }
      else if (b.dataset.prof) { plan = normalizePlan(PROFILES[b.dataset.prof].plan); msg = tr(PROFILES[b.dataset.prof].name) + ': ' + (b.dataset.prof === 'safety' ? tr(['sitio llano, mucho combustible, poca carga.', 'flat site, lots of fuel, light payload.']) : b.dataset.prof === 'science' ? tr(['tierras altas, toda la carga, poco combustible: ¡arriesgado!', 'highlands, full payload, little fuel: risky!']) : tr(['sitio real, casi toda la carga y algo de margen.', 'the real site, most of the payload and some margin.'])); sfx('powerup', { vol: 0.4 }); }
      else if (b.dataset.a === 'cmp') { cmp = !cmp; sfx('click'); }
      else if (b.dataset.a === 'back') return finish(false);
      else if (b.dataset.a === 'sign') { if (computePlan(plan).ok) return finish(true); sfx('error'); }
      paint();
    });
    $('.dsg-range', el).addEventListener('input', (e) => { plan.fuel = FUEL_STEPS[+e.target.value] ?? 1; const c = computePlan(plan); msg = L('fuelNote', { s: c.marginSec, kg: c.fuelKg === 0 ? L('kg0') : c.fuelKg > 0 ? L('kgW', { n: c.fuelKg }) : L('kgS', { n: -c.fuelKg }) }) + ' ' + L('nasaReal'); sfx('tick', { vol: 0.3 }); paint(); });
    paint();
  });
}
