// «Tu Apolo 11»: el plan es datos puros y su evaluación (masa, ciencia, riesgo, margen) es coherente con el simulador del Eagle.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NASA_PLAN, LIMIT_KG, FUEL_STEPS, SITES, INSTRUMENTS, EVA_TIMES, PROFILES, computePlan, normalizePlan, isNasaPlan, diffVsNasa, marginSec, activePlan } from '../src/game/design/plan.js';
import { create, step, guide, agl, judge, ground, PAD, LM, hoverThr } from '../src/sim/lander.js';
import { CARDS } from '../src/game/story/cards.js';
const src = (p) => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');

// el plan real de 1969 es válido, cabe en el límite y no cambia nada del juego actual
const N = computePlan(NASA_PLAN);
assert.ok(N.ok && N.massKg <= LIMIT_KG && N.massKg > 85, 'NASA_PLAN cabe en 100 kg');
assert.equal(N.risk, 'low'); assert.equal(N.o2Mult, 1); assert.equal(N.fuelMult, 1); assert.deepEqual(N.tasks.sort(), ['LRRR', 'PSEP', 'SWC']);
assert.deepEqual(N.lander, { boulderR: 95, padR: 24 }, 'por defecto: campo de rocas y zona segura del simulador');
assert.ok(isNasaPlan(NASA_PLAN) && isNasaPlan(undefined) && isNasaPlan({}), 'sin plan = plan de la NASA');
assert.deepEqual(diffVsNasa(NASA_PLAN), { site: false, fuel: false, evaTime: false, added: [], dropped: [] });
assert.equal(activePlan(null, { get: () => null }).site, 'tranquility'); assert.equal(activePlan({ plan: { site: 'sinus' } }, null).site, 'sinus');

// perfiles: válidos, y cada uno apuesta por algo distinto
const P = Object.fromEntries(Object.entries(PROFILES).map(([k, v]) => [k, computePlan(v.plan)]));
for (const [k, c] of Object.entries(P)) assert.ok(c.ok, `perfil ${k} dentro del límite (${c.massKg} kg)`);
assert.ok(P.safety.riskPts < P.balance.riskPts + 1 && P.safety.risk === 'low', 'Seguridad: riesgo bajo');
assert.ok(P.science.sciPts > P.balance.sciPts && P.balance.sciPts > P.safety.sciPts, 'Ciencia > Equilibrio > Seguridad');
assert.equal(P.science.risk, 'high'); assert.ok(P.safety.marginSec > P.science.marginSec, 'Seguridad deja más margen de combustible');

// tradeoffs: más combustible pesa más; todo lo del 1.º al último no cabe sin renunciar a algo
const all = INSTRUMENT_IDS_SUM();
function INSTRUMENT_IDS_SUM() { return Object.values(INSTRUMENTS).reduce((a, i) => a + i.kg, 0); }
assert.ok(all <= LIMIT_KG + 12, 'la carga completa casi llena el Eagle');
assert.ok(computePlan({ ...NASA_PLAN, fuel: 1.3 }).over > 0, 'con +30 % de combustible hay que renunciar a carga');
assert.equal(computePlan({ ...NASA_PLAN, payload: [] }).ok, false, 'sin instrumentos no se firma');
for (let i = 1; i < FUEL_STEPS.length; i++) assert.ok(computePlan({ ...NASA_PLAN, payload: ['lrrr'], fuel: FUEL_STEPS[i] }).massKg > computePlan({ ...NASA_PLAN, payload: ['lrrr'], fuel: FUEL_STEPS[i - 1] }).massKg);
// lugares: más ciencia y más riesgo hacia las tierras altas; campo de rocas más ancho y zona más estrecha
const S = ['tranquility', 'sinus', 'highlands'].map((s) => computePlan({ ...NASA_PLAN, site: s }));
assert.ok(S[0].sciPts < S[1].sciPts && S[1].sciPts < S[2].sciPts && S[0].riskPts < S[1].riskPts && S[1].riskPts < S[2].riskPts);
assert.ok(S[0].lander.boulderR < S[1].lander.boulderR && S[1].lander.boulderR < S[2].lander.boulderR && S[0].lander.padR > S[1].lander.padR && S[1].lander.padR > S[2].lander.padR);
assert.ok(SITES.highlands.boulderR + 20 < Math.abs(PAD.x) - SITES.highlands.padR, 'el campo de rocas no se come la zona de aterrizaje');
// duración de la EVA
assert.ok(computePlan({ ...NASA_PLAN, evaTime: 'long' }).o2Mult > 1 && computePlan({ ...NASA_PLAN, evaTime: 'long' }).riskPts > N.riskPts && EVA_TIMES.long.min === 210 && EVA_TIMES.short.min === 150);
// las tareas del EASEP que aparecen en la EVA son solo las de los instrumentos elegidos
assert.deepEqual(computePlan({ ...NASA_PLAN, payload: ['lrrr', 'stereo'] }).tasks, ['LRRR']);

// planes corruptos o viejos se normalizan
const z = normalizePlan({ site: 'marte', payload: ['x', 'lrrr', 'lrrr'], fuel: 'mucho', evaTime: 9 });
assert.deepEqual(z, { site: 'tranquility', payload: ['lrrr'], fuel: 1, evaTime: 'short', patch: null });
assert.equal(normalizePlan({ fuel: 1.07 }).fuel, 1.05); assert.equal(normalizePlan(null).fuel, 1);

// el margen estimado coincide con el simulador (piloto automático desde la toma de control P66, 300 m)
for (const f of [0.8, 1, 1.3]) {
  const s = create({ x: -40, y: 0, vx: 14, vy: -9, fuel: 1400 }); s.y = ground(s.x) + 299; s.fuel = s.fuel0 = 1400 * f;
  for (let n = 0; agl(s) > 0.05 && n < 20000; n++) step(s, { ...guide(s, PAD.x), burnFuel: true }, 0.05);
  assert.equal(judge(s).res, 'good'); const sec = s.fuel / (LM.burn * Math.max(0.15, hoverThr(s)));
  assert.ok(Math.abs(sec - marginSec(f)) <= 6, `margen x${f}: sim ${sec.toFixed(1)} s vs plan ${marginSec(f)} s`);
}

// los lectores del plan están enchufados (descent, eva, debrief) y las tarjetas de Bitácora pedidas existen
assert.ok(/activePlan\(ctx, store\)[\s\S]*BOULDERS\.r = PL\.lander\.boulderR[\s\S]*PL\.fuelMult/.test(src('game/phases/descent.js')), 'game/phases/descent.js');
assert.ok(/activePlan\(ctx, store\)[\s\S]*PL\.tasks[\s\S]*PL\.o2Mult/.test(src('game/phases/eva.js')), 'game/phases/eva.js');
assert.ok(/dz\.redo[\s\S]*designLines[\s\S]*designRoom\(\{ mode: 'redesign' \}\)/.test(src('game/phases/debrief.js')), 'game/phases/debrief.js');
for (const id of ['traje-a7l', 'propelente-criogenico', 'llave-de-la-luna', 'sala-de-diseno', 'elegir-el-sitio', 'legado-lrrr']) assert.ok(CARDS[id], 'tarjeta ' + id);
assert.ok(/store\.set\('missionPlan'/.test(src('game/design/design-screen.js')), 'game/design/design-screen.js');
console.log('PASS design: plan 1969 =', N.massKg, 'kg · perfiles', Object.entries(P).map(([k, c]) => `${k} ${c.massKg}kg/${c.sciPts}pts/${c.risk}`).join(' · '));
