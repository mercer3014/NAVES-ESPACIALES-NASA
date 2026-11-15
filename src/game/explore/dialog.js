// Diálogo con ramas. La lógica es pura (tests en Node); el cuadro y los efectos viven en el navegador.
// Una opción con `decision` llama a record(); si no, adjust() con la confianza. También unlock y setFlag.

const tx = (p, lang) => (Array.isArray(p) ? p[lang] ?? p[0] : p || '');

export function createDialog(dialogs, startId) {
  return { dialogs: dialogs || {}, id: startId, i: 0, done: false };
}

export function currentBeat(st) {
  const lines = st?.dialogs?.[st.id] || [];
  return lines[st.i] || null;
}

export function choiceEffects(beat, choice) {
  if (!beat || !choice) return [];
  const effects = [];
  if (beat.decision) effects.push({ type: 'record', id: beat.decision, opt: choice.id, trust: choice.trust || 0, morale: choice.morale || 0, historic: !!choice.historic });
  else if (choice.trust || choice.morale) effects.push({ type: 'adjust', trust: choice.trust || 0, morale: choice.morale || 0 });
  if (choice.flag) effects.push({ type: 'flag', key: choice.flag, value: choice.value ?? true });
  if (choice.card) effects.push({ type: 'unlock', id: choice.card });
  return effects;
}

// Avanza una línea, o aplica la opción `choiceId` si el latido actual es una elección.
export function advanceDialog(st, choiceId = null) {
  const beat = currentBeat(st);
  if (!beat || st.done) { st.done = true; return { done: true, effects: [] }; }
  if (beat.choice) {
    const choice = beat.choice.find((c) => c.id === choiceId);
    if (!choice) return { needChoice: true, choices: beat.choice, effects: [] };
    const effects = choiceEffects(beat, choice);
    if (choice.next) { st.id = choice.next; st.i = 0; }
    else st.done = true;
    return { done: st.done, effects, choice };
  }
  st.i += 1;
  if (!currentBeat(st)) st.done = true;
  return { done: st.done, effects: [] };
}

// Al saltar la escena: ruta histórica (opción marcada, o la última) y ninguna tarjeta de objeto.
export function skipPlan(def) {
  const records = [];
  for (const lines of Object.values(def?.dialogs || {})) {
    for (const beat of lines || []) {
      if (!beat.choice || !beat.decision) continue;
      const h = beat.choice.find((c) => c.historic) || beat.choice[beat.choice.length - 1];
      if (h) records.push({ id: beat.decision, opt: h.id });
    }
  }
  return { records, moments: def?.moments || [] };
}

export async function applyEffects(effects) {
  if (!effects?.length) return;
  const { record, adjust, unlock, setFlag } = await import('../story/state.js');
  for (const e of effects) {
    if (e.type === 'record') record(e.id, e.opt, { historic: !!e.historic, trust: e.trust || 0, morale: e.morale || 0 });
    else if (e.type === 'adjust') adjust({ trust: e.trust || 0, morale: e.morale || 0 });
    else if (e.type === 'unlock') unlock(e.id);
    else if (e.type === 'flag') setFlag(e.key, e.value);
  }
}

export function mountDialog(root) {
  const box = document.createElement('div');
  box.className = 'xp-dialog'; box.hidden = true;
  box.innerHTML = '<b class="xp-who"></b><p class="xp-line"></p><div class="xp-choices"></div>';
  root.append(box);
  const who = box.querySelector('.xp-who'), line = box.querySelector('.xp-line'), choices = box.querySelector('.xp-choices');
  let full = '', shown = 0, choosing = false;
  const paint = () => { line.textContent = full.slice(0, shown); };
  return {
    get choosing() { return choosing; },
    get typing() { return shown < full.length; },
    showLine(beat, lang) {
      choosing = false; box.hidden = false; box.classList.add('dialog');
      who.textContent = tx(beat.whoName || beat.who, lang);
      full = tx(beat.text, lang); shown = 0; choices.innerHTML = ''; paint();
    },
    showChoices(list, lang, onPick) {
      choosing = true; box.hidden = false; box.classList.add('dialog');
      full = ''; shown = 0; line.textContent = ''; choices.innerHTML = '';
      list.forEach((c, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'xp-choice';
        b.dataset.choice = c.id;
        b.textContent = `${i + 1}  ${tx(c.label, lang)}`;
        b.onclick = (e) => { e.stopPropagation(); onPick(c.id); };
        choices.append(b);
      });
    },
    tick(dt) { if (!choosing && shown < full.length) { shown = Math.min(full.length, shown + dt * 42); paint(); } },
    finish() { shown = full.length; paint(); },
    hide() { box.hidden = true; box.classList.remove('dialog'); choosing = false; choices.innerHTML = ''; },
  };
}
