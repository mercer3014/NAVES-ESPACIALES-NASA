// Ambiente de cabina, un poco a la derecha del piloto para que el HRTF lo separe del centro.
import { Howler } from 'howler';
import { store, on } from '../core/store.js';
import { connectLoop } from './lazy.js';

let bus = null, onBed = false;

function build() {
  const c = Howler.ctx;
  if (!c || bus) return bus;
  const panner = c.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 0.35;
  panner.maxDistance = 6;
  panner.rolloffFactor = 1;
  const gain = c.createGain();
  gain.gain.value = 0;
  panner.connect(gain).connect(Howler.masterGain || c.destination);
  const loop = connectLoop('/audio/beds/cockpit-ambience.mp3', panner);
  bus = { panner, gain, loop };
  return bus;
}

function apply() {
  const c = Howler.ctx;
  if (!bus || !c) return;
  const sfx = store.get('vol')?.sfx ?? 0;
  bus.gain.gain.setTargetAtTime(onBed ? 0.2 * sfx : 0, c.currentTime, 0.45);
}

export function setCockpit(value) {
  onBed = !!value;
  if (onBed) build();
  apply();
}

export function placeCockpit(camera) {
  const p = bus?.panner;
  if (!p || !onBed || !camera?.matrixWorld) return;
  const e = camera.matrixWorld.elements;
  const x = camera.position.x + e[0] * 0.42;
  const y = camera.position.y + e[1] * 0.42 - 0.04;
  const z = camera.position.z + e[2] * 0.42;
  if (![x, y, z].every(Number.isFinite)) return;
  if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
  else p.setPosition(x, y, z);
}

export function cockpitState() {
  return { on: onBed, loaded: !!bus?.loop?.src, gain: bus?.gain.gain.value ?? 0 };
}

on('store:vol', apply);
