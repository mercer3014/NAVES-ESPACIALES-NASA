import './letterbox.css';

// Barras negras y botón de salto. El centro de la pantalla sigue recibiendo el juego.
export function mountLetterbox({ id, title, sub, skipLabel, onSkip }) {
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
  return () => root.remove();
}
