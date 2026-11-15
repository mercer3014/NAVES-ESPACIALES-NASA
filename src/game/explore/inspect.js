// Inspección: el movimiento se pausa y un panel explica el objeto.
// Qué es · Por qué importa · Dato real · Fuente. Al cerrar, quien llama desbloquea la tarjeta.

const tx = (p, lang) => (Array.isArray(p) ? p[lang] ?? p[0] : (p || ''));

export function inspectPanel(spec = {}, lang = 0) {
  return {
    title: tx(spec.title, lang),
    what: tx(spec.text || spec.what, lang),
    why: tx(spec.why, lang),
    fact: tx(spec.fact, lang),
    src: tx(spec.src, lang),
    card: spec.card || null,
    checks: (spec.checks || []).map((c) => tx(c, lang)),
  };
}

const LABELS = {
  what: ['Qué es', 'What it is'],
  why: ['Por qué importa', 'Why it matters'],
  fact: ['Dato real', 'Real fact'],
  src: ['Fuente', 'Source'],
  close: ['Cerrar', 'Close'],
};

export function mountInspect(root) {
  const box = document.createElement('div');
  box.className = 'xp-inspect'; box.hidden = true; box.setAttribute('role', 'dialog');
  box.innerHTML = `<div class="xp-inspect-card">
      <h3></h3>
      <h4 data-k="what"></h4><p data-v="what"></p>
      <h4 data-k="why"></h4><p data-v="why"></p>
      <h4 data-k="fact"></h4><p data-v="fact"></p>
      <p class="xp-src"><b data-k="src"></b> <span data-v="src"></span></p>
      <ol class="xp-checks"></ol>
      <button type="button" class="xp-close"></button>
    </div>`;
  root.append(box);
  let onClose = null, total = 0, marked = 0;
  const list = () => [...box.querySelectorAll('.xp-checks li')];
  box.querySelector('.xp-close').onclick = () => onClose?.();
  return {
    get open() { return !box.hidden; },
    hasChecks() { return total > 0; },
    // Marca la siguiente casilla. Devuelve true cuando ya están todas (o no había ninguna).
    mark() {
      if (!total || marked >= total) return true;
      list()[marked]?.classList.add('on');
      marked += 1;
      return marked >= total;
    },
    show(panel, lang, close) {
      onClose = close; box.hidden = false; box.classList.add('overlay');
      box.querySelector('h3').textContent = panel.title;
      for (const k of ['what', 'why', 'fact']) {
        box.querySelector(`[data-k="${k}"]`).textContent = LABELS[k][lang] || LABELS[k][0];
        box.querySelector(`[data-v="${k}"]`).textContent = panel[k];
      }
      box.querySelector('[data-k="src"]').textContent = LABELS.src[lang] || LABELS.src[0];
      box.querySelector('[data-v="src"]').textContent = panel.src;
      const ol = box.querySelector('.xp-checks'); ol.innerHTML = '';
      (panel.checks || []).forEach((c) => { const li = document.createElement('li'); li.textContent = c; ol.append(li); });
      total = panel.checks?.length || 0; marked = 0;
      box.querySelector('.xp-close').textContent = total ? (lang ? 'Mark with E' : 'Tachar con E') : (LABELS.close[lang] || LABELS.close[0]);
    },
    hide() { box.hidden = true; box.classList.remove('overlay'); onClose = null; total = 0; marked = 0; },
  };
}
