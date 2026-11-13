import './style.css';
import { DEBUG } from './core/store.js';
import { t, applyI18n } from './core/i18n.js';
import { show } from './ui/router.js';
import { $ } from './core/util.js';
import { unlock } from './core/audio.js';
import { bootReadout } from './ui/presentation.js';
import { sfxIfUnlocked } from './ui/ui-sfx.js';
import './core/engine.js';
import { introScreen, introPlayed, startScreen, joinScreen, lobbyBg } from './ui/screens.js';
import { shouldPlayIntro } from './ui/intro-policy.js';
import './ui/radio.js';
import './scenes/skyevents.js';

const params = new URLSearchParams(location.search);
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });

async function boot() {
  if (DEBUG && params.get('cue')) { const { previewCue } = await import('./game/cutscenes/preview.js'); return previewCue(params.get('cue')); }
  const urls = ['/tex/stars_2k.jpg', '/tex/earth_day_2k.jpg', '/tex/earth_night_2k.jpg', '/tex/earth_clouds_2k.jpg', '/tex/moon_2k.jpg', '/audio/sfx/click.mp3'];
  const total = urls.length + 1;
  const el = show(`<div class="screen boot"><div class="boot-frame">
    <div class="boot-kicker">LOS ORINALEJOS</div>
    <div class="boot-word">${t('title.l1')}<br>${t('title.l2')}</div>
    <div class="boot-status"><i></i><span class="boot-line">${t(bootReadout(0, total).line)}</span></div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    <div class="boot-pct">0%</div>
  </div></div>`, 'boot');
  const bar = $('.bar>i', el), line = $('.boot-line', el), pct = $('.boot-pct', el), prog = $('.bar', el);
  let done = 0;
  const tick = () => {
    const r = bootReadout(++done, total);
    bar.style.width = r.pct + '%'; pct.textContent = r.pct + '%'; line.textContent = t(r.line); prog.setAttribute('aria-valuenow', String(r.pct));
  };
  const fonts = Promise.all(['700 1em Chakra', '400 1em Chakra', '900 1em Orbitron', '1em Mono', '1em Exo', '1em Audiowide'].map((f) => document.fonts.load(f).catch(() => {}))).then(tick);
  await Promise.race([Promise.all([fonts, ...urls.map((u) => fetch(u).then((r) => r.blob()).catch(() => {}).then(tick))]), new Promise((r) => setTimeout(r, 12000))]);
  const fin = bootReadout(total, total);
  bar.style.width = '100%'; pct.textContent = '100%'; line.textContent = t(fin.line); prog.setAttribute('aria-valuenow', '100');
  sfxIfUnlocked('computer', { vol: 0.28 });
  lobbyBg();
  const room = params.get('room');
  if (DEBUG && ['prep','launch','cruise','descent','eva'].includes(params.get('phase'))) { const { startMission } = await import('./game/mission.js'); const flow = params.has('flow'); return startMission({ mode: 'solo', role: 'pilot', practice: flow ? null : params.get('phase'), resume: flow ? { phase: params.get('phase'), results: {} } : null }); }
  if (DEBUG && params.get('debrief')) { // vista de prueba del informe
    const { default: run } = await import('./game/phases/debrief.js'); const { getFlag, getName } = await import('./ui/screens.js');
    const R = (s, stats) => ({ score: s, stats }); return run({ results: { prep: R(86, { time: 74, mistakes: 1 }), launch: R(91, { corridor: 94, stage: 0.6 }), cruise: R(78, { tli: 88, loi: 81, photo: 70 }), descent: R(83, { result: 'good', vs: -0.9, fuel: 22 }), eva: R(94, { hits: 3, photo: 0.81 }) },
      crew: [{ name: getName(), flag: getFlag(), role: 'pilot' }, { name: 'Pancho', flag: null, role: 'capcom', bot: true }], mode: 'solo', diff: 'normal', date: Date.now() }, { menu: () => location.assign('/'), retry: () => location.assign('/?phase=prep') });
  }
  if (room) return joinScreen(room.replace(/\D/g, '').slice(0, 6));
  if (shouldPlayIntro({ played: introPlayed(), nointro: params.has('nointro'), reconnect: !!room })) return introScreen(() => startScreen());
  startScreen();
}
boot();
