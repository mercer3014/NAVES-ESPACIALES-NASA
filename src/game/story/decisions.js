// Decisiones del guion (estilo Detroit): tabla única + panel. ask(id) muestra las opciones, aplica sus efectos
// (Confianza, Moral, tarjeta de Bitácora) y devuelve el id elegido. La ruta histórica se marca con una línea dorada.
// Opciones: { id, label, hint, historic, trust, morale, needTrust, card, echo }. 'timeout' = qué pasa si se acaba el tiempo.
import { store, AUTO } from '../../core/store.js';
import { record, run, unlock, setFlag } from './state.js';
import { a11sfx, stinger } from '../../audio/a11-score.js';
import './decisions.css';

const L = () => (store.get('lang') === 'en' ? 1 : 0);
const tx = (p) => (Array.isArray(p) ? p[L()] : p || '');

export const DECISIONS = {
  'c1-kids': { ch: 1, prompt: ['¿Cómo habla Neil con sus hijos?', 'How does Neil talk to his sons?'], options: [
    { id: 'truth', historic: true, label: ['Contarles la verdad', 'Tell them the truth'], hint: ['«Es peligroso, pero confío en mi equipo».', '“It’s dangerous, but I trust my team.”'], card: 'decision-hijos', echo: ['Rick escuchará el alunizaje sin miedo.', 'Rick will hear the landing without fear.'] },
    { id: 'downplay', label: ['Restarle importancia', 'Downplay it'], hint: ['«Es un viaje de trabajo, volveré pronto».', '“It’s a business trip. I’ll be back soon.”'], trust: -5, echo: ['Rick lo descubrirá por la televisión.', 'Rick will find out from the TV.'] },
    { id: 'rocket', label: ['Darle a Rick el cohete de Mark', 'Give Rick Mark’s rocket'], hint: ['Para que cuide de su hermano.', 'So he looks after his brother.'], trust: 5, echo: ['Rick cuidará de Mark durante el descenso.', 'Rick will look after Mark during the descent.'] },
  ] },
  'c1-firststep': { ch: 1, prompt: ['Aldrin y el primer paso', 'Aldrin and the first step'], options: [
    { id: 'accept', historic: true, label: ['Aceptarlo en silencio', 'Accept it quietly'], trust: 5, echo: ['Neil se lo agradecerá.', 'Neil will thank him for it.'] },
    { id: 'talk', label: ['Hablar con Neil, de frente', 'Talk to Neil, face to face'], trust: 10, card: 'fogata-playa', echo: ['Una conversación honesta en la playa.', 'An honest talk on the beach.'] },
    { id: 'complain', label: ['Quejarse con otros astronautas', 'Complain to other astronauts'], trust: -10, echo: ['El rumor llegará a Neil.', 'The rumor will reach Neil.'] },
  ] },
  'c2-docking': { ch: 2, prompt: ['Velocidad del acoplamiento', 'Docking speed'], options: [
    { id: 'slow', historic: true, label: ['Lento y preciso', 'Slow and precise'], trust: 5, echo: ['Aldrin: «Bonito, Mike».', 'Aldrin: “Beautiful, Mike.”'] },
    { id: 'fast', label: ['Rápido para ahorrar tiempo', 'Fast to save time'], morale: -5, echo: ['Houston nota el gasto de RCS.', 'Houston notices the RCS spent.'] },
  ] },
  'c3-night': { ch: 3, prompt: ['Neil acaba de nombrar a Karen. ¿Qué hace Aldrin?', 'Neil just said Karen’s name. What does Aldrin do?'], options: [
    { id: 'hand', label: ['Nada. Una mano en su hombro', 'Nothing. A hand on his shoulder'], trust: 15, echo: ['Neil lo recordará en la Luna.', 'Neil will remember it on the Moon.'] },
    { id: 'mission', label: ['Cambiar de tema hacia la misión', 'Steer back to the mission'], echo: ['Neil agradece no tener que hablar.', 'Neil is grateful not to talk.'] },
    { id: 'ask', label: ['Preguntar más', 'Ask more'], trust: -5, echo: ['Neil se cierra.', 'Neil shuts down.'] },
  ] },
  'c4-1202': { ch: 4, timer: 10, prompt: ['Flight te mira. «Guiado, ¿cómo estamos?»', 'Flight looks at you. “Guidance, how are we?”'], options: [
    { id: 'go', historic: true, label: ['«¡Seguimos, Flight! Es GO»', '“We’re go, Flight! It’s GO”'], morale: 20, card: 'steve-bales', echo: ['Duke: «Estamos GO con esa alarma».', 'Duke: “We’re go on that alarm.”'] },
    { id: 'abort', label: ['«Abortar. No podemos arriesgarnos»', '“Abort. We can’t take the risk”'], morale: -5, echo: ['¿Y si…? Eagle vuelve sin alunizar.', 'What if…? Eagle returns without landing.'] },
    { id: 'timeout', hidden: true, morale: -10, echo: ['Kranz decide por ti: «Seguimos».', 'Kranz decides for you: “We’re go.”'] },
  ] },
  'c5-rest': { ch: 5, prompt: ['El plan dice dormir antes de salir', 'The flight plan says sleep before going out'], options: [
    { id: 'early', historic: true, label: ['Pedir a Houston adelantar la caminata', 'Ask Houston to move the walk up'], echo: ['Houston acepta.', 'Houston agrees.'] },
    { id: 'sleep', label: ['Dormir según el plan', 'Sleep as planned'], echo: ['Aldrin: «Como si alguien pudiera dormir ahora».', 'Aldrin: “As if anyone could sleep now.”'] },
  ] },
  'c5-moment': { ch: 5, prompt: ['Un momento a solas en la superficie', 'A moment alone on the surface'], options: [
    { id: 'well', needTrust: 70, label: ['«Lo hiciste bien ahí abajo»', '“You did good down there”'], trust: 5, card: 'hermanos-armas', echo: ['Neil: «Lo hicimos».', 'Neil: “We did.”'] },
    { id: 'work', historic: true, label: ['Seguir con el trabajo', 'Get back to work'] },
  ] },
  'c5-patch': { ch: 5, prompt: ['¿Quién deja el parche del Apolo 1?', 'Who leaves the Apollo 1 patch?'], options: [
    { id: 'neil', label: ['Neil, pensando en Ed White', 'Neil, thinking of Ed White'], trust: 5 },
    { id: 'buzz', historic: true, label: ['Buzz, a pedido de Neil', 'Buzz, at Neil’s request'], trust: 10, echo: ['Neil: «Hazlo tú. Ed era tu amigo también».', 'Neil: “You do it. Ed was your friend too.”'] },
  ] },
  'c6-collins': { ch: 6, prompt: ['48 minutos sin radio. ¿Qué hace Collins?', '48 minutes without radio. What does Collins do?'], options: [
    { id: 'work', label: ['Trabajar: recalcular el encuentro', 'Work: recompute the rendezvous'], echo: ['Collins tendrá un plan B en el reencuentro.', 'Collins will have a plan B at the reunion.'] },
    { id: 'look', historic: true, label: ['Mirar por la ventana y escuchar el silencio', 'Look out the window and listen to the silence'], card: 'collins-solo' },
    { id: 'pat', label: ['Hablarle en voz alta a Pat', 'Talk out loud to Pat'], trust: 5, echo: ['Pat citará estas palabras en el epílogo.', 'Pat will quote these words in the epilogue.'] },
  ] },
  'c6-breaker': { ch: 6, prompt: ['¿Con qué cierras el disyuntor?', 'What do you close the breaker with?'], options: [
    { id: 'pen', historic: true, label: ['El rotulador de punta de fieltro', 'The felt-tip pen'], card: 'rotulador-aldrin' },
    { id: 'pencil', label: ['El lápiz metálico', 'The metal pencil'], echo: ['«Negativo, Eagle. Nada conductor».', '“Negative, Eagle. Nothing conductive.”'] },
  ] },
  'c6-reunion': { ch: 6, prompt: ['La escotilla se abre', 'The hatch opens'], options: [
    { id: 'hug', needTrust: 50, historic: true, label: ['Collins los abraza', 'Collins hugs them'], trust: 5, echo: ['Suena por primera vez el tema completo.', 'The main theme plays in full for the first time.'] },
    { id: 'shake', label: ['La mano, y una broma sobre el polvo', 'A handshake and a dust joke'] },
  ] },
  'c7-laika': { ch: 7, prompt: ['¿Cómo sigue la charla?', 'How does the talk go on?'], options: [
    { id: 'corporal', label: ['Aldrin: «Bienvenida a bordo, cabo Laika»', 'Aldrin: “Welcome aboard, Corporal Laika”'], trust: 5, echo: ['Collins: «La asciendo a sargento si no ladra en la reentrada».', 'Collins: “I’ll make her sergeant if she doesn’t bark during reentry.”'] },
    { id: 'belka', label: ['Armstrong cuenta lo de Belka y Strelka', 'Armstrong tells of Belka and Strelka'], card: 'belka-strelka', echo: ['Y una cachorra terminó en la Casa Blanca…', 'And a puppy ended up in the White House…'] },
    { id: 'silent', label: ['Collins se queda mirando la Tierra', 'Collins just looks at the Earth'], card: 'abrieron-camino' },
  ] },
};

let open = null;
export const decisionOpen = () => !!open;

// Muestra la decisión y resuelve el id elegido. opts.timer (s) sobrescribe el de la tabla.
export function ask(id, { timer } = {}) {
  const D = DECISIONS[id]; if (!D) return Promise.resolve(null);
  const opts = D.options.filter((o) => !o.hidden);
  const hist = opts.find((o) => o.historic) || opts[0];
  if (AUTO()) { apply(D, id, hist); return Promise.resolve(hist.id); }
  const secs = timer ?? D.timer ?? 0; const li = L();
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'dec-overlay'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', tx(D.prompt));
    el.innerHTML = `<div class="dec-card"><div class="dec-k">${li ? 'DECISION' : 'DECISIÓN'}${secs ? ` · ${secs} s` : ''}</div><h2 class="dec-q"></h2><div class="dec-opts"></div>${secs ? '<div class="dec-timer"><i></i></div>' : ''}<div class="dec-echo" aria-live="polite"></div></div>`;
    el.querySelector('.dec-q').textContent = tx(D.prompt);
    const box = el.querySelector('.dec-opts'); const btns = [];
    opts.forEach((o, i) => {
      const locked = o.needTrust && run.trust < o.needTrust;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dec-opt' + (locked ? ' locked' : '');
      b.innerHTML = `<span class="dec-n">${i + 1}</span><span class="dec-l"></span>${o.hint ? '<small></small>' : ''}${locked ? `<em>${li ? 'Requires trust' : 'Requiere confianza'} ≥ ${o.needTrust}</em>` : ''}`;
      b.querySelector('.dec-l').textContent = tx(o.label); if (o.hint) b.querySelector('small').textContent = tx(o.hint);
      b.disabled = !!locked; b.onclick = () => pick(o); box.append(b); btns.push([b, o]);
    });
    const key = (e) => { const n = +e.key; if (n >= 1 && n <= opts.length && !btns[n - 1][0].disabled) { e.preventDefault(); e.stopPropagation(); pick(opts[n - 1]); } };
    addEventListener('keydown', key, true);
    document.body.append(el); requestAnimationFrame(() => el.classList.add('on')); btns.find(([b]) => !b.disabled)?.[0].focus();
    let tmr = null; const t0 = performance.now();
    if (secs) { a11sfx('ui_c4_44_temporizador_10s', 0.6); const bar = el.querySelector('.dec-timer i');
      const tick = () => { if (!open) return; const k = 1 - (performance.now() - t0) / (secs * 1000); bar.style.transform = `scaleX(${Math.max(0, k)})`; if (k <= 0) { const to = D.options.find((o) => o.id === 'timeout'); pick(to || hist); return; } tmr = requestAnimationFrame(tick); }; tmr = requestAnimationFrame(tick); }
    open = el;
    let done = false;
    function pick(o) {
      if (done) return; done = true; cancelAnimationFrame(tmr); removeEventListener('keydown', key, true);
      btns.forEach(([b, x]) => { b.disabled = true; b.classList.toggle('chosen', x === o); b.classList.toggle('gold', !!x.historic); });
      apply(D, id, o, (performance.now() - t0) / 1000);
      const echo = el.querySelector('.dec-echo'); echo.textContent = tx(o.echo) || (o.historic ? (li ? 'Historical route.' : 'Ruta histórica.') : '');
      if (o.historic) echo.classList.add('gold');
      setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.remove(); open = null; resolve(o.id); }, 320); }, echo.textContent ? 1900 : 700);
    }
  });
}

function apply(D, id, o, secs = 0) {
  record(id, o.id, { historic: !!o.historic, trust: o.trust || 0, morale: o.morale || 0 });
  if (o.card) unlock(o.card);
  if (id === 'c4-1202') setFlag('bales-secs', Math.round(secs * 10) / 10);
  stinger(o.historic ? 'mus_stinger_ruta_historica_dorada' : 'mus_stinger_decision_tomada');
}

// Pregunta corta (no se registra como decisión). Resuelve true si se elige la correcta.
export function quiz(prompt, options, correct) {
  if (AUTO()) return Promise.resolve(true);
  const li = L();
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'dec-overlay';
    el.innerHTML = `<div class="dec-card"><div class="dec-k">${li ? 'QUESTION' : 'PREGUNTA'}</div><h2 class="dec-q"></h2><div class="dec-opts"></div><div class="dec-echo"></div></div>`;
    el.querySelector('.dec-q').textContent = tx(prompt); const box = el.querySelector('.dec-opts');
    options.forEach((o, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'dec-opt'; b.innerHTML = `<span class="dec-n">${i + 1}</span><span class="dec-l"></span>`; b.querySelector('.dec-l').textContent = tx(o.label);
      b.onclick = () => { const ok = o.id === correct; box.querySelectorAll('button').forEach((x) => (x.disabled = true)); b.classList.add('chosen'); if (ok) b.classList.add('gold');
        el.querySelector('.dec-echo').textContent = ok ? (li ? 'Correct.' : 'Correcto.') : (li ? 'Not quite.' : 'No exactamente.'); setTimeout(() => { el.classList.remove('on'); setTimeout(() => { el.remove(); resolve(ok); }, 300); }, 1300); };
      box.append(b); });
    document.body.append(el); requestAnimationFrame(() => el.classList.add('on'));
  });
}

// Pantalla «¿Y si…?» de un final alternativo. Resuelve cuando el jugador vuelve a la ruta histórica.
export function whatIf({ title, text, back = ['Volver a la ruta histórica', 'Back to the historical route'] }) {
  stinger('mus_stinger_final_y_si_alternativo');
  if (AUTO()) return Promise.resolve();
  return new Promise((resolve) => {
    const el = document.createElement('div'); el.className = 'dec-overlay whatif';
    el.innerHTML = `<div class="dec-card"><div class="dec-k">${L() ? 'WHAT IF…?' : '¿Y SI…?'}</div><h2 class="dec-q"></h2><p class="whatif-t"></p><div class="dec-opts"><button type="button" class="dec-opt gold"><span class="dec-n">&lt;</span><span class="dec-l"></span></button></div></div>`;
    el.querySelector('.dec-q').textContent = tx(title); el.querySelector('.whatif-t').textContent = tx(text); el.querySelector('.dec-l').textContent = tx(back);
    const b = el.querySelector('button'); b.onclick = () => { stinger('mus_stinger_ruta_historica_dorada'); el.classList.remove('on'); setTimeout(() => { el.remove(); resolve(); }, 300); };
    document.body.append(el); requestAnimationFrame(() => { el.classList.add('on'); b.focus(); });
  });
}
