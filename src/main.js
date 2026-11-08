import './style.css';
import { store, DEBUG } from './core/store.js';
import { t, applyI18n } from './core/i18n.js';
import { show } from './ui/router.js';
import { $ } from './core/util.js';
import { unlock } from './core/audio.js';
import './core/engine.js';
import { introScreen, startScreen, joinScreen, lobbyBg } from './ui/screens.js';
import './ui/radio.js';
import './scenes/skyevents.js';

const params = new URLSearchParams(location.search);
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });

async function boot() {
  const el = show(`<div class="screen boot"><div class="dot"></div><div class="txt" data-i="boot.loading"></div><div class="bar"><i></i></div></div>`, 'boot');
  const bar = $('.bar>i', el);
  const urls = ['/tex/stars_2k.jpg', '/tex/earth_day_2k.jpg', '/tex/earth_night_2k.jpg', '/tex/earth_clouds_2k.jpg', '/tex/moon_2k.jpg', '/audio/sfx/click.mp3'];
  let done = 0; const tick = () => (bar.style.width = (++done / (urls.length + 1)) * 100 + '%');
  const fonts = Promise.all(['700 1em Chakra', '400 1em Chakra', '900 1em Orbitron', '1em Mono', '1em Exo'].map((f) => document.fonts.load(f).catch(() => {}))).then(tick);
  await Promise.race([Promise.all([fonts, ...urls.map((u) => fetch(u).then((r) => r.blob()).catch(() => {}).then(tick))]), new Promise((r) => setTimeout(r, 12000))]);
  lobbyBg();
  const room = params.get('room');
  if (DEBUG && ['prep','launch','cruise','descent','eva'].includes(params.get('phase'))) { const { startMission } = await import('./game/mission.js'); return startMission({ mode: 'solo', role: 'pilot', practice: params.get('phase') }); }
  if (DEBUG && params.get('debrief')) { // vista de prueba del informe
    const { default: run } = await import('./game/phases/debrief.js'); const { getFlag, getName } = await import('./ui/screens.js');
    const R = (s, stats) => ({ score: s, stats }); return run({ results: { prep: R(86, { time: 74, mistakes: 1 }), launch: R(91, { corridor: 94, stage: 0.6 }), cruise: R(78, { tli: 88, loi: 81, photo: 70 }), descent: R(83, { result: 'good', vs: -0.9, fuel: 22 }), eva: R(94, { hits: 3, photo: 0.81 }) },
      crew: [{ name: getName(), flag: getFlag(), role: 'pilot' }, { name: 'Pancho', flag: null, role: 'capcom', bot: true }], mode: 'solo', diff: 'normal', date: Date.now() }, { menu: () => location.assign('/'), retry: () => location.assign('/?phase=prep') });
  }
  if (room) return joinScreen(room.replace(/\D/g, '').slice(0, 6));
  if (!store.get('introSeen') && !params.has('nointro')) return introScreen(() => startScreen());
  startScreen();
}
boot();
