// Alineación del sextante: las mismas seis estrellas del crucero y tres objetivos.
// Devuelve cuántas veces se marcó una estrella que no pedía Houston.
import { sfx } from '../../core/audio.js';

const NAMES = ['Sirius', 'Vega', 'Rigel', 'Canopus', 'Antares', 'Altair'];

export function playSextant() {
  const order = [...NAMES].sort(() => Math.random() - 0.5);
  const targets = new Set(order.slice(0, 3));
  const got = new Set();
  let wrong = 0;
  const root = document.createElement('div');
  root.className = 'xp-sextant';
  root.innerHTML = '<p>Houston marca tres estrellas. Tócalas con el sextante.</p><div class="xp-stars"></div>';
  const box = root.querySelector('.xp-stars');
  document.body.append(root);
  return new Promise((resolve) => {
    const finish = () => { root.remove(); resolve({ wrong }); };
    NAMES.forEach((name) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xp-star' + (targets.has(name) ? ' tgt' : '');
      b.textContent = name;
      b.onclick = () => {
        if (got.has(name)) return;
        if (targets.has(name)) { got.add(name); b.classList.add('on'); try { sfx('ok'); } catch { /* sin audio */ } if (got.size === 3) finish(); }
        else { wrong += 1; b.classList.add('bad'); try { sfx('error'); } catch { /* sin audio */ } setTimeout(() => b.classList.remove('bad'), 500); }
      };
      box.append(b);
    });
  });
}
