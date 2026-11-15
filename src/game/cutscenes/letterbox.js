import './letterbox.css';

// Barras negras y botón de salto. El centro de la pantalla sigue recibiendo el juego.
// Mientras hay letterbox, body.cine-on oculta el HUD de fase (G7).
let cineStyled = false, cineOpen = 0;
function ensureCineStyle() {
  if (cineStyled) return; cineStyled = true;
  const st = document.createElement('style');
  st.textContent = 'body.cine-on .mhud{visibility:hidden}';
  document.head.append(st);
}
export function mountLetterbox({ id, title, sub, skipLabel, onSkip }) {
  ensureCineStyle();
  cineOpen++; document.body.classList.add('cine-on');
  const root = document.createElement('div');
  root.className = 'plb-letterbox';
  root.dataset.cue = id;
  const top = document.createElement('div');
  top.className = 'plb-letterbox-bar top';
  const bottom = document.createElement('div');
  bottom.className = 'plb-letterbox-bar bottom';
  const copy = document.createElement('div');
  copy.className = 'plb-letterbox-copy';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const note = document.createElement('small');
  note.textContent = sub;
  copy.append(heading, note);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'plb-letterbox-skip';
  btn.textContent = skipLabel;
  bottom.append(copy, btn);
  root.append(top, bottom);
  const skip = (e) => { e.preventDefault(); e.stopPropagation(); onSkip(); };
  top.addEventListener('pointerdown', skip);
  bottom.addEventListener('pointerdown', skip);
  document.body.append(root);
  let closed = false;
  return () => { root.remove(); if (!closed && --cineOpen <= 0) { cineOpen = 0; document.body.classList.remove('cine-on'); } closed = true; };
}
