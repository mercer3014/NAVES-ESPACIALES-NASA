// Playback for the one Horizonte docking cue. Not a general music system.
import { Howl } from 'howler';
import { dbg, store } from '../../core/store.js';
import { unlock } from '../../core/audio.js';
import { HORIZON_DOCK_TRACK, dockCueAction, dockCueGain } from './horizon-dock-cue.js';

let howl = null, playId = null, fading = null, mode = 'idle', gain = 0, failed = false;
const cueState = { track: HORIZON_DOCK_TRACK, mode, gain, playing: false };
dbg('horizonDock', cueState);

function publish() {
  cueState.mode = mode;
  cueState.gain = gain;
  cueState.playing = !!(howl && ((playId != null && howl.playing(playId)) || (fading != null && howl.playing(fading))));
}

function halt() {
  if (howl && playId != null) howl.stop(playId);
  if (howl && fading != null) howl.stop(fading);
  playId = null;
  fading = null;
}

function begin(src) {
  if (failed) return;
  unlock();
  if (!howl) {
    howl = new Howl({ src: [src || HORIZON_DOCK_TRACK], loop: true, html5: false, preload: true, volume: 0 });
    howl.once('loaderror', () => { failed = true; halt(); mode = 'idle'; publish(); });
    howl.on('playerror', () => { unlock(); if (mode === 'play') playId = howl.play(); });
  }
  halt();
  playId = howl.play();
  mode = 'play';
  howl.volume(0, playId);
  publish();
}

function apply(state) {
  const d = Math.hypot(state.x - state.probe.x, state.y - state.probe.y);
  const dv = Math.hypot(state.vx - state.probe.vx, state.vy - state.probe.vy);
  gain = dockCueGain(d, dv);
  const music = store.get('vol')?.music || 0;
  if (howl && playId != null) howl.volume(gain * music, playId);
  publish();
}

export function syncHorizonDockCue(state, src = HORIZON_DOCK_TRACK) {
  if (!state?.probe) return;
  const action = dockCueAction(state.stage);
  if (action === 'play') {
    if (mode !== 'play') begin(src);
    apply(state);
    return;
  }
  if (action === 'cut') cutHorizonDock();
  else resolveHorizonDock();
}

function cutHorizonDock() {
  if (mode === 'cut' && playId == null && fading == null) return;
  halt();
  mode = 'cut';
  publish();
}

function resolveHorizonDock() {
  if (mode === 'resolve' || mode === 'cut') return;
  if (!howl || playId == null) { mode = 'resolve'; publish(); return; }
  mode = 'resolve';
  const h = howl, sid = playId;
  playId = null;
  fading = sid;
  h.fade(h.volume(sid) || gain * (store.get('vol')?.music || 0), 0, 1500, sid);
  setTimeout(() => { try { h.stop(sid); } catch {} if (fading === sid) fading = null; publish(); }, 1600);
  publish();
}

export function stopHorizonDockCue() {
  halt();
  mode = 'idle';
  gain = 0;
  publish();
}
