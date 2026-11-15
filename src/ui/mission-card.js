// Tarjeta de misión «Cómo jugar»: página del Plan de Vuelo (papel crema) con QUÉ PASÓ / TU MISIÓN / CONTROLES.
// missionCard(id) → Promise<void>: se resuelve al pulsar «¡VAMOS!» (clic, toque, Enter o Espacio).
// Los datos (CARDS) son puros: no hay DOM ni store en el nivel superior para que los tests los importen en Node.
// Cada fila de controles es [teclas[], [es, en]]; m = ratón y teclado, t = táctil.

export const CARDS = {
  design: {
    n: '00', title: ['Diseña tu misión', 'Design your mission'],
    what: ['Enero de 1969, Houston. Cuatro expertos te esperan en la sala de planificación.', 'January 1969, Houston. Four experts are waiting in the planning room.'],
    goal: ['Habla con los cuatro, cambia el sitio y el combustible, y sigue hacia la misión.', 'Talk to all four, change the site and the fuel, and go on to the mission.'],
    m: [[['W', 'A', 'S', 'D'], ['Caminar', 'Walk']], [['E'], ['Hablar', 'Talk']], [['RATÓN'], ['Mirar y elegir en el panel', 'Look and choose on the panel']]],
    t: [[['PALANCA'], ['Caminar', 'Walk']], [['ACCIÓN'], ['Hablar', 'Talk']]],
  },
  'prep-practice': {
    n: '01', title: ['Preparación', 'Preparation'], // la misión y la práctica usan las mismas 4 tareas en la plataforma
    what: ['16 jul 1969, madrugada: técnicos y tripulación preparan el Saturn V en la plataforma 39A.', 'July 16, 1969, before dawn: technicians and crew ready the Saturn V on Pad 39A.'],
    goal: ['Completa las 4 tareas antes de la cuenta atrás: arrastrar, mantener y girar con el puntero.', 'Finish the 4 tasks before the countdown: drag, hold and turn with the pointer.'],
    m: [[['ARRASTRAR'], ['Mueve piezas y cables a su sitio', 'Move parts and cables into place']], [['MANTENER'], ['Mantén pulsado hasta llenar', 'Hold down until it fills']], [['GIRAR'], ['Arrastra en círculo anillos y manivelas', 'Drag in a circle on rings and cranks']]],
    t: [[['ARRASTRA'], ['Lo mismo con el dedo', 'Same with your finger']], [['MANTÉN'], ['Deja el dedo pulsado', 'Keep your finger down']], [['GIRA'], ['Dibuja un círculo', 'Draw a circle']]],
  },
  prep: {
    n: '01', title: ['Preparación', 'Preparation'],
    what: ['16 jul 1969, madrugada: técnicos y tripulación preparan el Saturn V en la plataforma 39A.', 'July 16, 1969, before dawn: technicians and crew ready the Saturn V on Pad 39A.'],
    goal: ['Camina la pasarela del brazo 9, habla, mira y confirma. Luego entra en Columbia.', 'Walk access arm 9, talk, look and confirm. Then climb into Columbia.'],
    m: [[['W', 'A', 'S', 'D'], ['Caminar', 'Walk']], [['RATÓN'], ['Girar la cámara', 'Turn the camera']], [['E'], ['Hablar, mirar o mantener', 'Talk, look or hold']], [['1', '2'], ['Elegir respuesta', 'Choose a reply']]],
    t: [[['PALANCA'], ['Caminar', 'Walk']], [['ARRASTRAR'], ['Mirar', 'Look']], [['ACCIÓN'], ['Hablar o mantener', 'Talk or hold']]],
  },
  launch: {
    n: '02', title: ['Lanzamiento', 'Launch'],
    what: ['09:32. Casi 3.000 toneladas de cohete despegan del 39A.', '09:32. Almost 3,000 tons of rocket lift off from 39A.'],
    goal: ['Mantén la flecha dentro del pasillo verde y separa cada etapa cuando su tanque se vacíe, hasta llegar a la órbita.', 'Keep the arrow inside the green corridor and drop each stage when its tank runs dry, all the way to orbit.'],
    m: [[['A', 'D'], ['Cabeceo (también ← →)', 'Pitch (also ← →)']], [['W', 'S'], ['Empuje', 'Thrust']], [['ESPACIO'], ['Separar etapa', 'Separate stage']], [['C', 'V'], ['Cámara', 'Camera']]],
    t: [[['PALANCA'], ['Cabeceo (izquierda)', 'Pitch (left)']], [['ETAPA'], ['Separar etapa', 'Separate stage']]],
  },
  cruise: {
    n: '03', title: ['Viaje a la Luna', 'Trip to the Moon'],
    what: ['El S-IVB enciende unos 6 minutos y os lanza a unos 39.000 km/h hacia la Luna.', 'The S-IVB burns about 6 minutes and throws you toward the Moon at some 39,000 km/h.'],
    goal: ['Enciende el motor y suelta en la zona verde, acopla el Eagle, toca 3 estrellas y frena detrás de la Luna sin radio.', 'Fire the engine and release in the green zone, dock the Eagle, tap 3 stars and brake behind the Moon with no radio.'],
    m: [[['ESPACIO'], ['Mantén para encender, suelta en verde', 'Hold to fire, release in the green']], [['RATÓN'], ['Apunta y haz clic en las estrellas', 'Aim and click the stars']]],
    t: [[['ENCENDER'], ['Mantén y suelta en verde', 'Hold and release in the green']], [['TOCA'], ['Toca las estrellas', 'Tap the stars']]],
  },
  descent: {
    n: '04', title: ['Alunizaje', 'Landing'],
    what: ['20 jul: alarmas 1202 y un cráter lleno de rocas. Armstrong pilotó a mano con menos de un minuto de combustible.', 'July 20: 1202 alarms and a crater full of boulders. Armstrong flew by hand with under a minute of fuel.'],
    goal: ['Baja despacio: velocidad vertical en verde, sobre la zona marcada y sin rocas.', 'Come down slowly: vertical speed in the green, over the marked zone and clear of rocks.'],
    m: [[['A', 'D'], ['Inclinar', 'Tilt']], [['W', 'S'], ['Empuje', 'Thrust']], [['R'], ['Asistente', 'Assist']]],
    t: [[['PALANCA'], ['Inclinar', 'Tilt']], [['BARRA'], ['Empuje', 'Thrust']]],
  },
  eva: {
    n: '05', title: ['Caminata lunar', 'Moonwalk'],
    what: ['21 jul, 02:56 UTC: «Un pequeño paso…». 2 h 31 min fuera.', 'July 21, 02:56 UTC: "That\'s one small step…". 2 h 31 min outside.'],
    goal: ['Baja, recoge una muestra, planta la bandera, despliega los experimentos y haz la foto antes de que se acabe el O₂.', 'Climb down, collect a sample, plant the flag, deploy the experiments and take the photo before the O₂ runs out.'],
    m: [[['W', 'A', 'S', 'D'], ['Caminar', 'Walk']], [['ESPACIO'], ['Salto de canguro', 'Kangaroo hop']], [['E'], ['Usar', 'Use']], [['P'], ['Foto', 'Photo']]],
    t: [[['PALANCA'], ['Caminar', 'Walk']], [['ACCIÓN'], ['Usar', 'Use']], [['SALTO'], ['Salto de canguro', 'Kangaroo hop']], [['FOTO'], ['Foto', 'Photo']]],
  },
  // Cartas de minijuegos del guion (docking.js, reentry.js, breaker.js, liftoff.js, boss/story.js)
  docking: {
    n: 'ACOPLE', title: ['Acople', 'Docking'],
    what: ['16 jul 1969: tras encender hacia la Luna, Collins gira el Columbia y se acopla al Eagle.', 'July 16, 1969: after the Moon burn, Collins turns Columbia around and docks with Eagle.'],
    goal: ['Alinea la cruz y acércate despacio: contacto con poca velocidad y bien centrado.', 'Line up the cross and close in slowly: touch down gently and well centered.'],
    m: [[['W', 'A', 'S', 'D'], ['Alinear (también flechas)', 'Align (also arrows)']], [['R'], ['Acercar (o Espacio)', 'Close in (or Space)']], [['F'], ['Frenar (o Shift)', 'Brake (or Shift)']]],
    t: [[['PALANCA'], ['Alinear', 'Align']], [['ACERCAR'], ['Cierra la distancia', 'Close the gap']], [['FRENO'], ['Frena', 'Brake']]],
  },
  reentry: {
    n: 'REENTRADA', title: ['Reentrada', 'Reentry'],
    what: ['24 jul 1969, ~16:35 UTC: el Columbia entra en la atmósfera a unos 11 km/s.', 'July 24, 1969, ~16:35 UTC: Columbia hits the atmosphere at about 11 km/s.'],
    goal: ['Mantén la marca dentro del corredor verde: muy empinado quema, muy plano rebota.', 'Keep the marker inside the green corridor: too steep burns, too shallow skips off.'],
    m: [[['W', 'S'], ['Corregir el ángulo (también ↑ ↓)', 'Correct the angle (also ↑ ↓)']]],
    t: [[['FLECHAS'], ['Mantén para corregir el ángulo', 'Hold to correct the angle']]],
  },
  breaker: {
    n: 'DISYUNTOR', title: ['El disyuntor roto', 'The broken breaker'],
    what: ['20 jul 1969: en el Eagle, una mochila rompió el disyuntor de armado del motor de ascenso.', 'July 20, 1969: inside Eagle, a backpack broke the ascent engine arm breaker.'],
    goal: ['Cierra el circuito sin tocarlo con los dedos ni con metal: elige el objeto adecuado.', 'Close the circuit without touching it with fingers or metal: choose the right object.'],
    m: [[['CLIC'], ['Elige un objeto y úsalo en el disyuntor', 'Pick an object and use it on the breaker']]],
    t: [[['TOCA'], ['Elige un objeto y úsalo', 'Pick an object and use it']]],
  },
  liftoff: {
    n: 'DESPEGUE', title: ['Despegue de la Luna', 'Lunar liftoff'],
    what: ['21 jul 1969, 17:54 UTC: el motor de ascenso del Eagle no tenía respaldo; tenía que encender.', 'July 21, 1969, 17:54 UTC: Eagle\'s ascent engine had no backup; it had to fire.'],
    goal: ['Sigue la cuenta de Aldrin y enciende el motor de ascenso en el momento justo.', 'Follow Aldrin\'s countdown and fire the ascent engine at the right moment.'],
    m: [[['ESPACIO'], ['Encender el motor de ascenso', 'Fire the ascent engine']]],
    t: [[['ENCENDER'], ['Toca el botón', 'Tap the button']]],
  },
  boss: {
    n: 'NO CANON', title: ['El Guardián de Tranquilidad', 'The Guardian of Tranquility'],
    what: ['No ocurrió: es el sueño de Aldrin en la noche lunar. Los datos reales se revelan al final.', 'It never happened: it is Aldrin\'s dream on the lunar night. The real facts are revealed at the end.'],
    goal: ['Vence al Guardián con martillo y flash sin quedarte sin O₂.', 'Beat the Guardian with the hammer and flash without running out of O₂.'],
    m: [[['W', 'A', 'S', 'D'], ['Moverse (ratón para mirar)', 'Move (mouse to look)']], [['ESPACIO'], ['Saltar', 'Jump']], [['SHIFT'], ['Esquivar', 'Dodge']], [['E'], ['Martillo', 'Hammer']], [['F'], ['Flash', 'Flash']], [['Q'], ['Manguera de O₂', 'O₂ hose']]],
    t: [[['PALANCA'], ['Moverse (arrastra para mirar)', 'Move (drag to look)']], [['SALTO'], ['Saltar', 'Jump']], [['MARTILLO'], ['Golpear', 'Strike']], [['FLASH'], ['Aturdir', 'Stun']], [['ESQUIVA'], ['Esquivar', 'Dodge']]],
  },
};

export const CARD_IDS = Object.keys(CARDS);
const UI = {
  what: ['QUÉ PASÓ', 'WHAT HAPPENED'], goal: ['TU MISIÓN', 'YOUR MISSION'], ctl: ['CONTROLES', 'CONTROLS'],
  mouse: ['RATÓN Y TECLADO', 'MOUSE & KEYBOARD'], touch: ['TÁCTIL', 'TOUCH'], go: ['¡VAMOS!', 'LET\'S GO!'],
  doc: ['AS-506 · PLAN DE VUELO', 'AS-506 · FLIGHT PLAN'], phase: ['FASE', 'PHASE'], none: ['Sin controles especiales', 'No special controls'],
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Una sola tarjeta a la vez; un id desconocido no bloquea el juego (se resuelve sin mostrar nada).
let open = null;

export async function missionCard(id) {
  const card = CARDS[id];
  if (!card || typeof document === 'undefined') return;
  if (open) return open.promise;
  const [{ isTouch, AUTO }, { lang }] = await Promise.all([import('../core/store.js'), import('../core/i18n.js')]);
  if (AUTO()) return; // pruebas automáticas (QA): no bloquear
  import('./mission-card.css');
  const li = lang() === 'es' ? 0 : 1; const L = (a) => a[li];
  const keysHtml = (keys) => keys.map((k) => `<kbd>${esc(k)}</kbd>`).join('<i>/</i>');
  const rows = (list) => (list.length ? list : [[[], UI.none]]).map(([k, l]) => `<li>${k.length ? `<span class="mc-keys">${keysHtml(k)}</span>` : ''}<span class="mc-lbl">${esc(L(l))}</span></li>`).join('');
  const isNum = /^\d+$/.test(card.n);
  const docTag = isNum ? `${L(UI.doc)} · ${L(UI.phase)} ${card.n}` : `${L(UI.doc)} · ${card.n}`;

  const el = document.createElement('div');
  el.className = 'mc-wrap'; el.dataset.card = id;
  el.innerHTML = `<section class="mc-card" role="dialog" aria-modal="true" aria-labelledby="mc-t">
    <div class="mc-bar"></div>
    <header class="mc-head"><span class="mc-doc">${esc(docTag)}</span><h2 id="mc-t">${esc(L(card.title))}</h2></header>
    <div class="mc-body">
      <div class="mc-blk"><h3>${L(UI.what)}</h3><p>${esc(L(card.what))}</p></div>
      <div class="mc-blk"><h3>${L(UI.goal)}</h3><p>${esc(L(card.goal))}</p></div>
      <div class="mc-blk"><h3>${L(UI.ctl)}</h3><div class="mc-cols">
        <div class="mc-col${isTouch ? '' : ' on'}"><h4>${L(UI.mouse)}</h4><ul>${rows(card.m)}</ul></div>
        <div class="mc-col${isTouch ? ' on' : ''}"><h4>${L(UI.touch)}</h4><ul>${rows(card.t)}</ul></div>
      </div></div>
    </div>
    <footer class="mc-foot"><button type="button" class="mc-go">${L(UI.go)}</button></footer>
  </section>`;

  const prevFocus = document.activeElement;
  const wasPaused = document.body.dataset.paused; document.exitPointerLock?.();
  const openedAt = performance.now();
  let done; const promise = new Promise((r) => (done = r));
  const close = () => {
    removeEventListener('keydown', onKey, true); el.remove(); open = null;
    if (!wasPaused) { delete document.body.dataset.paused; import('./router.js').then((m) => m.syncCursor()); }
    try { prevFocus?.focus?.({ preventScroll: true }); } catch {}
    done();
  };
  const onKey = (e) => {
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); return; } // la tarjeta no se cierra con Esc ni abre la pausa
    if ((e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') && !e.repeat) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (performance.now() - openedAt > 250) close();
    }
  };
  open = { promise };
  document.body.dataset.paused = '1'; import('./router.js').then((m) => m.syncCursor());
  document.body.append(el);
  const go = el.querySelector('.mc-go');
  go.onclick = (e) => { e.stopPropagation(); close(); };
  el.onpointerdown = (e) => e.stopPropagation();
  addEventListener('keydown', onKey, true);
  try { go.focus({ preventScroll: true }); } catch {}
  return promise;
}
