// Objetivos arriba a la izquierda. Los ocultos se leen «???» hasta que el jugador se acerca.
// Como mucho 4 líneas. Tab los muestra o los esconde.

const tx = (p, lang) => (Array.isArray(p) ? p[lang] ?? p[0] : p || '');

export function createObjectives(list = []) {
  return {
    items: list.map((o) => ({ ...o, revealed: !o.hidden, done: false })),
    open: true,
    flash: null,
  };
}

export function revealObjective(st, id) {
  const o = st.items.find((x) => x.id === id);
  if (!o || o.revealed) return false;
  o.revealed = true; st.flash = id;
  return true;
}

export function completeObjective(st, id) {
  const o = st.items.find((x) => x.id === id);
  if (!o || o.done) return false;
  o.revealed = true; o.done = true; st.flash = id;
  return true;
}

// `spots`: { x, z, r, reveals:[id] }. Revela al entrar en el radio (un poco de holgura).
export function revealNearby(st, player, spots, extra = 0.35) {
  const found = [];
  for (const s of spots || []) {
    if (!s?.reveals?.length) continue;
    const d = Math.hypot((s.x || 0) - player.x, (s.z || 0) - player.z);
    if (d > (s.revealR ?? (s.r ?? 1.2) + extra)) continue;
    for (const id of s.reveals) if (revealObjective(st, id)) found.push(id);
  }
  return found;
}

// Los cumplidos salen de la lista para que quepan los siguientes (máximo 4).
export function objectiveLines(st, lang = 0, max = 4) {
  const open = st.items.filter((o) => !o.done);
  const ranked = [...open.filter((o) => o.revealed), ...open.filter((o) => !o.revealed)];
  return ranked.slice(0, max).map((o) => ({
    id: o.id,
    text: o.revealed ? tx(o.text, lang) : '???',
    hidden: !o.revealed,
    done: false,
  }));
}

export function activeTarget(st) {
  return st.items.find((o) => o.revealed && !o.done) || null;
}

export function mountObjectives(root) {
  const box = document.createElement('ol');
  box.className = 'xp-obj';
  const note = document.createElement('div');
  note.className = 'xp-updated'; note.hidden = true;
  root.append(box, note);
  let hideT = 0;
  return {
    paint(st, lang, now) {
      box.hidden = !st.open;
      box.innerHTML = '';
      for (const line of objectiveLines(st, lang)) {
        const li = document.createElement('li');
        li.className = (line.done ? 'done ' : '') + (line.hidden ? 'hid' : '');
        li.textContent = line.text;
        box.append(li);
      }
      if (st.flash && now) {
        note.hidden = false;
        note.textContent = lang ? 'Objective updated' : 'Objetivo actualizado';
        hideT = now + 2.2; st.flash = null;
      } else if (hideT && now > hideT) note.hidden = true;
    },
  };
}
