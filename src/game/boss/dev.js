// Banco de pruebas aislado del jefe (solo `vite dev`): /src/game/boss/dev.html?phase=1|2|3&diff=normal|hard|extreme&skip
import '../../style.css';
import '../../core/engine.js';
import { unlock } from '../../core/audio.js';
import { runBoss } from './boss.js';
addEventListener('pointerdown', unlock, { capture: true }); addEventListener('keydown', unlock, { capture: true });
const q = new URLSearchParams(location.search);
runBoss({ startPhase: +q.get('phase') || 1, diff: q.get('diff') || 'normal', skipIntro: q.has('skip'),
  onWin: (r) => console.info('BOSS WIN', r), onLose: (r) => console.info('BOSS LOSE', r) })
  .then((r) => { window.__bossResult = r; document.getElementById('ui').innerHTML = `<div style="position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:20px Chakra">${r.result.toUpperCase()}</div>`; });
