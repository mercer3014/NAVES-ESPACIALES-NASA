import './style.css';
import { DEBUG } from './core/store.js';
import { t, lang } from './core/i18n.js';
import { show } from './ui/router.js';
import { $ } from './core/util.js';
import { unlock } from './core/audio.js';
import { bootReadout } from './ui/presentation.js';
import { sfxIfUnlocked } from './ui/ui-sfx.js';
import { tex, Q } from './core/engine.js';
import { introScreen, introPlayed, startScreen, joinScreen, lobbyBg } from './ui/screens.js';
import { shouldPlayIntro } from './ui/intro-policy.js';
import './ui/radio.js';
import './ui/bitacora.js';
import './scenes/skyevents.js';

const params = new URLSearchParams(location.search);
// G5: la ficha de cámara («Persecución · C/V», creada en orbit-view.js) se muestra 2 s al cambiar de modo y luego se atenúa
const flashCam = (b) => { b.classList.add('flash'); clearTimeout(b.__fl); b.__fl = setTimeout(() => b.classList.remove('flash'), 2000); };
new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.classList?.contains('cam-cycle')) { flashCam(n); new MutationObserver(() => flashCam(n)).observe(n, { childList: true, characterData: true, subtree: true }); } }).observe(document.body, { childList: true });
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });

async function boot() {
  if (DEBUG && params.has('boss')) { const { runBoss } = await import('./game/boss/boss.js'); lobbyBg(); return runBoss({ startPhase: +params.get('boss') || 1, diff: params.get('diff') || undefined, skipIntro: params.has('skip'), onWin: () => location.assign('/'), onLose: () => location.assign('/') }); }
  if (DEBUG && params.get('cine')) { // vista previa de cinemáticas: B (hotel/MOCR/casa, en bucle) o C (cap. 7 / epílogo; all = las cuatro)
    const id = params.get('cine'); const b = await import('./game/cutscenes/cine-index.js');
    if (b.CINE_IDS.includes(id)) return b.previewCinematic(id);
    const c = await import('./game/cutscenes/cine-play.js'); const vars = { rickHeard: params.get('rick') !== 'told' };
    return id === 'all' ? c.playCineSequence(c.EPILOGUE_ORDER, { vars }) : c.playCine(id, { vars });
  }
  if (DEBUG && params.get('story')) { const { playStory } = await import('./game/story/flow.js'); const id = params.get('story'); lobbyBg(); return playStory(id).then((r) => { window.__storyResult = r; }); }
  if (DEBUG && params.get('cue')) { const { previewCue } = await import('./game/cutscenes/preview.js'); return previewCue(params.get('cue')); }
  // Texturas del lobby por el mismo caché que usan las escenas (antes se pedían dos veces) y en la resolución que usará este equipo
  const texs = [[`/tex/stars_${Q.high ? '4k' : '2k'}.jpg`], [`/tex/earth_day_${Q.high ? '4k' : '2k'}.jpg`], ['/tex/earth_night_2k.jpg'], ['/tex/earth_clouds_2k.jpg', { srgb: false }], ['/tex/moon_2k.jpg']];
  const urls = ['/audio/sfx/click.mp3'];
  const total = urls.length + texs.length + 1;
  // Pantalla de carga «cuenta regresiva»: T-00:00:12 baja con el progreso real; 24 bloques naranja; checklist TEXTURAS / AUDIO / FUENTES
  const es = lang() === 'es', BLOCKS = 24, T0 = 12;
  const need = { tex: texs.length, audio: urls.length, fonts: 1 }, got = { tex: 0, audio: 0, fonts: 0 };
  const el = show(`<div class="screen boot">
    <div class="boot-k">APOLO 11 · AS-506</div>
    <div class="boot-body">
      <div class="boot-main">
        <div class="boot-t"><small>LOS ORINALEJOS</small><span class="boot-clock">T-00:00:${String(T0).padStart(2, '0')}</span></div>
        <div class="boot-bar bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${es ? 'Carga' : 'Loading'}">
          <div class="boot-seg">${'<i></i>'.repeat(BLOCKS)}</div>
          <div class="boot-marks"><span>S-IC</span><span>S-II</span><span>S-IVB</span></div>
        </div>
        <div class="boot-status"><span class="boot-line">${t(bootReadout(0, total).line)}</span><span class="boot-pct">0%</span></div>
      </div>
      <ul class="boot-check">
        <li data-k="tex"><i></i><span>${es ? 'TEXTURAS' : 'TEXTURES'}</span><em>···</em></li>
        <li data-k="audio"><i></i><span>AUDIO</span><em>···</em></li>
        <li data-k="fonts"><i></i><span>${es ? 'FUENTES' : 'FONTS'}</span><em>···</em></li>
      </ul>
    </div></div>`, 'boot');
  const blocks = [...el.querySelectorAll('.boot-seg i')], marks = [...el.querySelectorAll('.boot-marks span')];
  const clock = $('.boot-clock', el), line = $('.boot-line', el), pct = $('.boot-pct', el), prog = $('.bar', el);
  const paint = (r) => {
    const lit = Math.floor((r.pct / 100) * BLOCKS);
    blocks.forEach((b, i) => b.classList.toggle('on', i < lit));
    marks.forEach((m, i) => m.classList.toggle('on', lit > i * (BLOCKS / 3)));
    clock.textContent = 'T-00:00:' + String(Math.ceil(T0 * (1 - r.pct / 100))).padStart(2, '0');
    pct.textContent = r.pct + '%'; line.textContent = t(r.line); prog.setAttribute('aria-valuenow', String(r.pct));
  };
  const check = (k) => { if (++got[k] < need[k]) return; const li = $(`.boot-check [data-k="${k}"]`, el); li.classList.add('ok'); $('em', li).textContent = '— GO'; };
  let done = 0;
  const tick = (k) => { paint(bootReadout(++done, total)); if (k) check(k); };
  const fonts = Promise.all(['600 1em Jost', '700 1em Jost', '500 1em Barlow', '600 1em Barlow', '500 1em Plex', '700 1em Orbitron', '500 1em Chakra', '600 1em Chakra', '1em Mono', '1em Exo', '1em Audiowide'].map((f) => document.fonts.load(f).catch(() => {}))).then(() => tick('fonts'));
  await Promise.race([Promise.all([fonts, ...urls.map((u) => fetch(u).then((r) => r.blob()).catch(() => {}).then(() => tick('audio'))), ...texs.map(([u, o]) => tex(u, o).userData.ready.then(() => tick('tex')))]), new Promise((r) => setTimeout(r, 12000))]);
  paint(bootReadout(total, total));
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
