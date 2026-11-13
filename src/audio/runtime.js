// Une capas, cabina, radio, motor espacial y el temblor de cámara. El acople de Horizonte queda en silencio.
import { Howler } from 'howler';
import { dbg } from '../core/store.js';
import { audioCtx } from './lazy.js';
import { requestPhaseLayers } from './phase-layers.js';
import { syncLayers, layerState } from './layers.js';
import { setCockpit, placeCockpit, cockpitState } from './cockpit.js';
import { setChatter, chatterState } from './radio-chatter.js';
import { setSpatialEngine, placeEngine, syncListener, spatialState } from './spatial.js';
import { applyCameraShake, engineLevels } from './rumble-shake.js';

const COCKPIT = new Set(['prep', 'cruise', 'descent', 'mars-landing', 'horizon-escape']);
const CHATTER = new Set(['prep', 'cruise', 'descent', 'eva', 'debrief', 'mars-gather', 'mars-build', 'mars-grow', 'mars-done']);
const QUIET = new Set(['horizon-dock', 'horizon-intercept']);
let phase = null;

function bedPhase(next) {
  if (next === 'horizon-intercept') return 'horizon-dock';
  return next || null;
}

export function setPhaseBed(next) {
  audioCtx();
  phase = bedPhase(next);
  const quiet = QUIET.has(phase);
  syncLayers(phase);
  setCockpit(!quiet && COCKPIT.has(phase));
  setChatter(!quiet && CHATTER.has(phase));
  if (quiet) setSpatialEngine(0);
}

export function resumeBeds() {
  try { if (Howler.ctx?.state === 'suspended') Howler.ctx.resume(); } catch {}
  if (phase) setPhaseBed(phase);
}

export function afterWorldUpdate(world, t) {
  const cam = world?.camera;
  if (!cam) return;
  syncListener(cam);
  placeCockpit(cam);
  const quiet = QUIET.has(phase);
  if (quiet) { setSpatialEngine(0); return; }
  const { engine, rumble } = engineLevels();
  const anchor = world.rocket || world.ship || world.lm || world.body;
  if (anchor?.matrixWorld && Math.max(engine, rumble) > 0.02) {
    anchor.updateMatrixWorld?.(true);
    const e = anchor.matrixWorld.elements;
    placeEngine(e[12], e[13], e[14]);
    setSpatialEngine(Math.max(engine, rumble));
  } else setSpatialEngine(0);
  applyCameraShake(cam, t || 0);
}

export function soundState() {
  return {
    phase,
    layers: requestPhaseLayers(phase),
    ...engineLevels(),
    cockpit: cockpitState(),
    chatter: chatterState(),
    spatial: spatialState(),
    layer: layerState(),
  };
}

dbg('sound', { state: soundState, setPhaseBed });
