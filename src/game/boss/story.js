// Interludio opcional para story/flow.js (slot 'after:eva', justo después de 'breaker'): escena 6.1B/6.1C No Canon.
// Pregunta antes de empezar (es un combate de 4–6 min y NO es historia real); «Saltar» sigue con el guion.
// Devuelve { id: 'boss', played, skipped, result, stats }.
// GANCHO: o.briefing (async) se pasa a runBoss y corre tras cargar la arena, antes de la cinemática; ahí va la tarjeta de misión (src/ui/mission-card.js).
import { getFlag, getName } from '../../ui/screens.js';
import { store } from '../../core/store.js';
import { mountBossHud, L } from './hud.js';
import { runBoss } from './boss.js';

export default async function bossStory(o = {}) {
  if (!o.force) {
    const hud = mountBossHud(); hud.gameplay(false);
    const go = await new Promise((res) => {
      const ov = hud.overlay(`<div class="bd-k">${L('NO CANON · OPCIONAL', 'NON-CANON · OPTIONAL')}</div><h2>${L('Polvo y fuego · El sueño de Aldrin', 'Dust and fire · Aldrin\'s dream')}</h2>
        <p>${L('Eagle, noche lunar. La cabina ronda los 16 °C y nadie duerme bien. Aldrin cierra los ojos…', 'Eagle, lunar night. The cabin is around 16 °C and nobody sleeps well. Aldrin closes his eyes…')}</p>
        <p>${L('Combate contra «El Guardián de Tranquilidad» (4–6 min). Esto NO ocurrió: es un sueño. Al final verás qué datos eran reales.', 'Fight "The Guardian of Tranquility" (4–6 min). This did NOT happen: it is a dream. At the end you will see which facts were real.')}</p>
        <div class="bd-row"><button data-a="y">${L('Soñar (jugar)', 'Dream (play)')}</button><button class="bd-sec" data-a="n">${L('Saltar', 'Skip')}</button></div>`);
      ov.onclick = (e) => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) res(a === 'y'); };
      const onKey = (e) => { if (e.code === 'Escape') { removeEventListener('keydown', onKey, true); res(false); } };
      addEventListener('keydown', onKey, true);
    });
    hud.dispose();
    if (!go) return { id: 'boss', played: false, skipped: true };
  }
  const r = await runBoss({ flag: getFlag(), name: getName(), diff: o.diff || store.get('difficulty'), restoreWorld: !!o.ctx, briefing: o.briefing || null });
  return { id: 'boss', played: true, skipped: false, result: r.result, stats: r.stats };
}
