// Acciones puras de la Sala Blanca: mantener un botón, orden azul→rojo y casillas de una checklist.

export function stepHold(prev = 0, active = false, dt = 0, secs = 3) {
  const p = active ? prev + Math.max(0, dt) : Math.max(0, prev - Math.max(0, dt) * 1.4);
  return { p, done: !!(active && secs > 0 && p >= secs), show: p > 0.02 };
}

// state: '' | 'blue' | 'done'. El rojo antes del azul es un error y no avanza.
export function nextHose(state = '', id) {
  if (id === 'blue') {
    if (state === 'done') return { state, done: true, mistake: false };
    return { state: 'blue', done: false, mistake: false };
  }
  if (id === 'red') {
    if (state === 'blue' || state === 'done') return { state: 'done', done: true, mistake: false };
    return { state, done: false, mistake: true };
  }
  return { state, done: false, mistake: false };
}

export function markCheck(n = 0, total = 0) {
  const next = Math.min(total, (n || 0) + 1);
  return { n: next, done: total > 0 && next >= total };
}

export function ready(done, requires) {
  const need = [].concat(requires || []);
  const has = done?.has ? (id) => done.has(id) : (id) => !!done?.[id];
  return need.every(has);
}
