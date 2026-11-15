// «Tu Apolo 11» · datos puros del plan de misión y evaluación (sin DOM: se prueba en tests/design.test.mjs)
// Los números del juego están escalados a partir de datos reales del Apolo 11 (ALSJ, Mission Report MSC-00171).
// Un plan es: { site, payload:[ids], fuel:multiplicador, evaTime:'short'|'long', patch:null|{...} }

export const LIMIT_KG = 100; // límite de masa del Eagle para ciencia y combustible extra (kg de juego)
export const FUEL_STEPS = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3];
export const FUEL_KG_PER_UNIT = 60; // +5 % de combustible = +3 kg; -5 % libera 3 kg
export const NASA_MARGIN_S = 25; // margen real con el que Armstrong aterrizó (~25 s, ALSJ)
const SEC_BASE = 59, SEC_PER_UNIT = 116; // medido con el piloto automático del simulador (tests/design.test.mjs lo fija)

// Lugar de alunizaje: el efecto en descent.js es el ancho del campo de rocas (boulderR) y de la zona segura (padR).
// Valores por defecto del simulador: campo 95 m y zona 24 m.
export const SITES = {
  tranquility: {
    name: ['Mar de la Tranquilidad', 'Sea of Tranquility'], tag: ['Sitio 2 · el real', 'Site 2 · the real one'],
    blurb: ['Llano, cerca del ecuador, con pocas rocas. El sitio que eligió la NASA.', 'Flat, near the equator, few rocks. The site NASA chose.'],
    sample: ['Basalto del mar lunar, unos 3 700 millones de años', 'Mare basalt, about 3.7 billion years old'],
    risk: 1, sci: 10, boulderR: 95, padR: 24, rocks: 1, coords: '0,67° N · 23,47° E',
  },
  sinus: {
    name: ['Sinus Medii', 'Sinus Medii'], tag: ['Sitio 3 · de respaldo', 'Site 3 · backup'],
    blurb: ['Reserva si el lanzamiento se retrasa. Más rocas y algo más de ciencia.', 'Backup if the launch slips. More rocks and a bit more science.'],
    sample: ['Basalto mezclado con polvo de las tierras altas', 'Basalt mixed with highland dust'],
    risk: 3, sci: 14, boulderR: 115, padR: 21, rocks: 1.25, coords: '0,4° N · 1,4° E',
  },
  highlands: {
    name: ['Tierras altas', 'Highlands'], tag: ['Como el Apolo 16 en 1972', 'Like Apollo 16 in 1972'],
    blurb: ['Rocas antiguas y mucha ciencia, pero terreno duro y muchas rocas. Riesgo alto.', 'Old rocks and lots of science, but rough ground and many boulders. High risk.'],
    sample: ['Anortosita de la corteza primitiva, unos 4 200 millones de años', 'Anorthosite from the primitive crust, about 4.2 billion years old'],
    risk: 6, sci: 24, boulderR: 140, padR: 17, rocks: 1.6, coords: '9° S · 15,5° E',
  },
};

// Carga científica. task = nombre de la tarea del EASEP en eva.js (null: no tiene tarea propia, suma ciencia al recoger la muestra).
export const INSTRUMENTS = {
  seismometer: {
    name: ['Sismómetro pasivo', 'Passive seismometer'], kg: 46, sci: 25, task: 'PSEP',
    blurb: ['Paneles solares. Detectó lunamotos y hasta los pasos de los astronautas. Duró unas 3 semanas.', 'Solar panels. Felt moonquakes and even the astronauts\' footsteps. Lasted about 3 weeks.'],
  },
  lrrr: {
    name: ['Retrorreflector láser', 'Laser retroreflector'], kg: 30, sci: 20, task: 'LRRR',
    blurb: ['Sin energía. Devuelve láseres de la Tierra: se sigue usando hoy.', 'No power. Bounces lasers back to Earth: still in use today.'],
  },
  'solar-wind': {
    name: ['Colector de viento solar', 'Solar wind collector'], kg: 1, sci: 10, task: 'SWC',
    blurb: ['Una lámina de aluminio casi sin peso. Se trajo de vuelta a la Tierra.', 'A nearly weightless aluminium foil. It came back to Earth.'],
  },
  stereo: {
    name: ['Cámara estéreo de primer plano', 'Close-up stereo camera'], kg: 3, sci: 12, task: null,
    blurb: ['Ligera. Fotografió de cerca el polvo lunar en 3D.', 'Light. Took 3D close-ups of the lunar soil.'],
  },
  tools: {
    name: ['Herramientas para muestras', 'Extra sample tools'], kg: 18, sci: 18, task: null,
    blurb: ['Martillo, pinzas y bolsas: más roca para traer (el Apolo 11 trajo 21,5 kg).', 'Hammer, tongs and bags: more rock to bring home (Apollo 11 brought back 21.5 kg).'],
  },
};
export const INSTRUMENT_IDS = Object.keys(INSTRUMENTS);

// Duración de la EVA: o2 multiplica la reserva de O₂ de eva.js (O2 = 420 · D.time · o2).
export const EVA_TIMES = {
  short: { min: 150, label: ['2 h 30', '2 h 30'], o2: 1, sci: 0, risk: 0, blurb: ['La real y prudente: 2 h 31 min.', 'The real, cautious one: 2 h 31 min.'] },
  long: { min: 210, label: ['3 h 30', '3 h 30'], o2: 1.4, sci: 8, risk: 2, blurb: ['Más tiempo y más ciencia, pero más calor y menos O₂ de sobra.', 'More time and more science, but more heat and less spare O₂.'] },
};

// El plan real de 1969: Mar de la Tranquilidad, EASEP completo + cámara + herramientas, combustible nominal, EVA de 2 h 30.
export const NASA_PLAN = { site: 'tranquility', payload: ['seismometer', 'lrrr', 'solar-wind', 'stereo', 'tools'], fuel: 1, evaTime: 'short', patch: null };

export const PROFILES = {
  safety: { name: ['Seguridad', 'Safety'], plan: { site: 'tranquility', payload: ['lrrr', 'solar-wind', 'stereo'], fuel: 1.25, evaTime: 'short' } },
  balance: { name: ['Equilibrio', 'Balance'], plan: { site: 'tranquility', payload: ['seismometer', 'lrrr', 'solar-wind', 'stereo'], fuel: 1.1, evaTime: 'short' } },
  science: { name: ['Ciencia', 'Science'], plan: { site: 'highlands', payload: ['seismometer', 'lrrr', 'solar-wind', 'stereo', 'tools'], fuel: 0.9, evaTime: 'long' } },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const near = (v) => FUEL_STEPS.reduce((best, s) => (Math.abs(s - v) < Math.abs(best - v) ? s : best), 1);
const RISK_MAX = 12, SCI_MAX = Object.values(INSTRUMENTS).reduce((a, i) => a + i.sci, 0) + SITES.highlands.sci + EVA_TIMES.long.sci;

// Normaliza cualquier plan (parcial, viejo o corrupto) a uno válido
export function normalizePlan(plan) {
  const p = plan && typeof plan === 'object' ? plan : {};
  return {
    site: SITES[p.site] ? p.site : NASA_PLAN.site,
    payload: Array.isArray(p.payload) ? INSTRUMENT_IDS.filter((id) => p.payload.includes(id)) : [...NASA_PLAN.payload],
    fuel: typeof p.fuel === 'number' && isFinite(p.fuel) ? near(p.fuel) : NASA_PLAN.fuel,
    evaTime: EVA_TIMES[p.evaTime] ? p.evaTime : NASA_PLAN.evaTime,
    patch: p.patch ?? null,
  };
}
export const isNasaPlan = (plan) => {
  const a = normalizePlan(plan), b = NASA_PLAN;
  return a.site === b.site && a.fuel === b.fuel && a.evaTime === b.evaTime && a.payload.join() === b.payload.join();
};

export const fuelKg = (fuel) => Math.round((fuel - 1) * FUEL_KG_PER_UNIT);
export const marginSec = (fuel) => Math.round(SEC_BASE + (fuel - 1) * SEC_PER_UNIT);

// Evalúa un plan: masa, ciencia, riesgo, tiempo y los parámetros que leen descent.js y eva.js
export function computePlan(plan) {
  const p = normalizePlan(plan), site = SITES[p.site], eva = EVA_TIMES[p.evaTime];
  const payloadKg = p.payload.reduce((a, id) => a + INSTRUMENTS[id].kg, 0);
  const fKg = fuelKg(p.fuel);
  const massKg = payloadKg + fKg;
  const over = Math.max(0, massKg - LIMIT_KG);
  const sciPts = p.payload.reduce((a, id) => a + INSTRUMENTS[id].sci, 0) + site.sci + eva.sci;
  // riesgo: lugar + poco combustible + EVA larga + pasarse de masa
  const riskPts = clamp(site.risk + (p.fuel < 1 ? (1 - p.fuel) * 20 : -(p.fuel - 1) * 6) + eva.risk + over * 0.5, 0, RISK_MAX);
  const risk = riskPts <= 3 ? 'low' : riskPts <= 6 ? 'mid' : 'high';
  const hasTools = p.payload.includes('tools');
  return {
    plan: p, ok: over === 0 && p.payload.length > 0, over, massKg, payloadKg, fuelKg: fKg, limitKg: LIMIT_KG, freeKg: LIMIT_KG - massKg,
    sciPts, sciMax: SCI_MAX, sciPct: Math.round((sciPts / SCI_MAX) * 100),
    riskPts: +riskPts.toFixed(2), risk, riskPct: Math.round((riskPts / RISK_MAX) * 100),
    evaMin: eva.min, o2Mult: eva.o2, fuelMult: p.fuel, marginSec: marginSec(p.fuel),
    rockKg: hasTools ? 21.5 : 6, // el Apolo 11 trajo 21,5 kg de roca con todas las herramientas
    tasks: p.payload.map((id) => INSTRUMENTS[id].task).filter(Boolean), // tareas del EASEP que aparecen en la EVA
    lander: { boulderR: site.boulderR, padR: site.padR },
  };
}

// Diferencias entre un plan y el real de la NASA (para «Tu plan vs. la NASA 1969»)
export function diffVsNasa(plan) {
  const a = normalizePlan(plan), b = NASA_PLAN;
  return {
    site: a.site !== b.site, fuel: a.fuel !== b.fuel, evaTime: a.evaTime !== b.evaTime,
    added: a.payload.filter((id) => !b.payload.includes(id)), dropped: b.payload.filter((id) => !a.payload.includes(id)),
  };
}

// Plan activo: el del contexto de fase (WP3) o el guardado por la sala de diseño; sin ninguno, el real de la NASA
export function activePlan(ctx, store) {
  return normalizePlan(ctx?.plan || store?.get?.('missionPlan') || NASA_PLAN);
}
