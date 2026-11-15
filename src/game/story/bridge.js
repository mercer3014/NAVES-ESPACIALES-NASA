// Tarjeta puente entre escenas del guion: pantalla negra con fecha/hora en monoespaciada, 1-2 líneas y, a veces, una cita real
// de radio con su orador. Avanza sola en 4-6 s o con clic / toque / Enter / Espacio / Esc. Tapa la carga de la escena siguiente.
// Se registra en flow.js como STORY `bridge:<id>`; el orden se controla solo con SLOTS. Textos: [es, en].
import { store, AUTO } from '../../core/store.js';
import { show } from '../../ui/router.js';
import { clips } from '../../audio/a11-cues.js';
import './bridge.css';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');

// when: fecha/hora (mono) · text: 1-2 líneas · quote/orig/who: cita de radio (orig = inglés original, se muestra bajo la traducción)
export const BRIDGES = {
  intro: { when: ['ANTES DEL GRAN SALTO', 'BEFORE THE GIANT LEAP'],
    text: ['Eres la tripulación del Apolo 11. Pero esta historia empieza con un incendio.', 'You are the crew of Apollo 11. But this story begins with a fire.'] },
  design: { when: ['1967–1969', '1967–1969'],
    text: ['Tras el Apolo 1, la NASA rediseña la nave y planifica cada kilo del primer alunizaje. Ahora te toca a ti.', 'After Apollo 1, NASA redesigns the spacecraft and plans every kilogram of the first landing. Now it is your turn.'] },
  jul69: { when: ['JULIO DE 1969', 'JULY 1969'],
    text: ['El Lago, Texas. Faltan días para el lanzamiento.', 'El Lago, Texas. Days to go before launch.'] },
  'launch-morning': { when: ['16 DE JULIO DE 1969 · 04:15', 'JULY 16, 1969 · 04:15'],
    text: ['Desayuno de filete y huevos con Deke Slayton. Trajes puestos. Autobús a la plataforma 39A.', 'Steak and eggs with Deke Slayton. Suits on. Bus to Pad 39A.'] },
  't-minus': { when: ['09:32', '09:32'],
    text: ['Cerca de un millón de personas miran desde las playas.', 'Close to a million people watch from the beaches.'],
    quote: ['«T menos 15 segundos. El guiado es interno.»', '"T minus 15 seconds. Guidance is internal."'], orig: 'T minus 15 seconds. Guidance is internal.',
    who: ['JACK KING · CONTROL DE LANZAMIENTO', 'JACK KING · LAUNCH CONTROL'] },
  tli: { when: ['16 DE JULIO · ÓRBITA TERRESTRE', 'JULY 16 · EARTH ORBIT'],
    text: ['Órbita de espera: vuelta y media a la Tierra revisando la nave.', 'Parking orbit: one and a half laps of the Earth, checking the spacecraft.'],
    quote: ['«Apolo 11, aquí Houston. Tienen GO para la TLI.»', '"Apollo 11, this is Houston. You are go for TLI."'], orig: 'Apollo 11, this is Houston. You are go for TLI.',
    who: ['BRUCE McCANDLESS · CAPCOM', 'BRUCE McCANDLESS · CAPCOM'] },
  undock: { when: ['20 DE JULIO DE 1969', 'JULY 20, 1969'],
    text: ['Armstrong y Aldrin pasan al Eagle. Collins se queda solo en Columbia.', 'Armstrong and Aldrin move into Eagle. Collins stays alone in Columbia.'],
    quote: ['«El Eagle tiene alas.»', '"The Eagle has wings."'], orig: 'The Eagle has wings.',
    who: ['NEIL ARMSTRONG', 'NEIL ARMSTRONG'] },
  hatch: { when: ['21 DE JULIO DE 1969', 'JULY 21, 1969'],
    text: ['El plan decía descansar antes de salir. Pidieron salir ya. Unas 6 horas y media después del alunizaje, la escotilla se abre.', 'The plan said to rest before going out. They asked to go now. About six and a half hours after landing, the hatch opens.'] },
  meanwhile: { when: ['MIENTRAS TANTO', 'MEANWHILE'],
    text: ['A unos 110 km sobre ellos, Collins da vueltas a la Luna. Solo.', 'About 110 km above them, Collins circles the Moon. Alone.'] },
  report: { when: ['TU APOLO 11', 'YOUR APOLLO 11'],
    text: ['Así salió la misión que diseñaste.', 'This is how the mission you designed turned out.'] },
};
export const BRIDGE_IDS = Object.keys(BRIDGES);

// Mundo 3D neutro (negro): evita que escenas sueltas, decisiones o cargas se pinten sobre el último mundo 3D.
let blank = null;
export async function neutralWorld() {
  const { THREE, setWorld } = await import('../../core/engine.js');
  if (!blank) { const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0c0e); blank = { scene, camera: new THREE.PerspectiveCamera(50, 1, 0.1, 10), update() {} }; }
  setWorld(blank); return blank;
}

// Rótulo «NO CANON» fijo mientras dura una escena inventada (misma convención que el jefe). Devuelve la función que lo quita.
export function noCanonTag() {
  const el = document.createElement('div'); el.className = 'nocanon-tag'; el.setAttribute('role', 'note');
  el.textContent = L() ? 'NON-CANON · DRAMATIZED' : 'NO CANON · DRAMATIZADO'; document.body.append(el);
  return () => el.remove();
}

const SECS ={ min: 4, max: 6 };
export const bridgeSecs = (b) => (b.quote ? SECS.max : SECS.min + 1); // 5 s sin cita, 6 s con cita

export async function playBridge(id, opts = {}) {
  const b = BRIDGES[id]; if (!b) return { id: 'bridge:' + id, skipped: false };
  if (id === 'tli') clips(['cap2_go_tli'], { radio: true });
  if (id === 'undock') clips(['cap4_eagle_tiene_alas', 'c4_41_collins_tomenselo_con_calma_en', 'c4_41_aldrin_okay_mike_en', 'cap4_collins_todo_va_de_maravilla'], { radio: true });
  if (AUTO()) return { id: 'bridge:' + id, skipped: false };
  try { await neutralWorld(); } catch (e) { console.warn('bridge: mundo neutro no disponible', e); }
  if (!opts.ctx) show('<div class="screen"></div>', 'story-bridge-' + id); // entre fases: quita el HUD anterior
  const li = L(); const secs = bridgeSecs(b);
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'bridge'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', tx(b.when) + '. ' + tx(b.text));
    el.innerHTML = `<div class="bridge-in"><div class="bridge-when"></div><p class="bridge-text"></p>${b.quote ? '<blockquote class="bridge-quote"><span class="bridge-q"></span><span class="bridge-orig"></span><cite class="bridge-who"></cite></blockquote>' : ''}</div>`
      + `<div class="bridge-hint"></div><div class="bridge-bar"><i></i></div>`;
    el.querySelector('.bridge-when').textContent = tx(b.when);
    el.querySelector('.bridge-text').textContent = tx(b.text);
    if (b.quote) {
      el.querySelector('.bridge-q').textContent = tx(b.quote);
      const o = el.querySelector('.bridge-orig'); if (li === 0 && b.orig) o.textContent = 'Original: "' + b.orig + '"'; else o.hidden = true;
      el.querySelector('.bridge-who').textContent = tx(b.who);
    }
    el.querySelector('.bridge-hint').textContent = li ? 'Tap, click, Enter or Esc to continue' : 'Toca, haz clic o pulsa Enter / Esc para continuar';
    el.querySelector('.bridge-bar i').style.transitionDuration = secs + 's';
    let done = false, tmr = 0; const t0 = performance.now();
    const finish = (skipped) => {
      if (done) return; done = true; clearTimeout(tmr);
      removeEventListener('keydown', key, true); el.removeEventListener('pointerdown', tap);
      el.classList.remove('on'); setTimeout(() => { el.remove(); resolve({ id: 'bridge:' + id, skipped }); }, 320);
    };
    // 250 ms de guarda: la pulsación que cerró la escena anterior no debe saltar también esta tarjeta
    const ready = () => performance.now() - t0 > 250;
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (ready()) finish(true); } };
    const tap = (e) => { e.preventDefault(); if (ready()) finish(true); };
    addEventListener('keydown', key, true); el.addEventListener('pointerdown', tap);
    document.body.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('on'); el.querySelector('.bridge-bar i').style.transform = 'scaleX(0)'; }));
    tmr = setTimeout(() => finish(false), secs * 1000);
  });
}
export default playBridge;
