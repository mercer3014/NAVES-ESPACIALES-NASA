// Audio posicional (HRTF): el oyente sigue a la cámara y el motor queda en la nave.
import { Howler } from 'howler';
import { store, on } from '../core/store.js';
import { audioCtx, connectLoop } from './lazy.js';

let bus = null, level = 0, applied = -1;

function master(c) { return Howler.masterGain || c.destination; }

function build() {
  const c = Howler.ctx;
  if (!c || bus) return bus;
  const panner = c.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'linear';
  panner.refDistance = 28;
  panner.maxDistance = 900;
  panner.rolloffFactor = 1;
  const gain = c.createGain();
  gain.gain.value = 0;
  panner.connect(gain).connect(master(c));
  const loop = connectLoop('/audio/beds/engine-spatial.mp3', panner);
  bus = { panner, gain, loop };
  return bus;
}

function apply() {
  const c = Howler.ctx;
  if (!bus || !c) return;
  const sfx = store.get('vol')?.sfx ?? 0;
  const target = level * 0.28 * sfx;
  if (Math.abs(target - applied) < 0.008) return;
  applied = target;
  bus.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
}

export function setSpatialEngine(value) {
  level = Math.max(0, Math.min(1, value || 0));
  if (level > 0.02) build();
  apply();
}

export function placeEngine(x, y, z) {
  const p = bus?.panner;
  if (!p || ![x, y, z].every(Number.isFinite)) return;
  if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
  else p.setPosition(x, y, z);
}

export function syncListener(camera) {
  const c = Howler.ctx;
  if (!c || !camera?.matrixWorld) return;
  camera.updateMatrixWorld?.();
  const e = camera.matrixWorld.elements;
  const l = c.listener;
  const px = camera.position.x, py = camera.position.y, pz = camera.position.z;
  const fx = -e[8], fy = -e[9], fz = -e[10], ux = e[4], uy = e[5], uz = e[6];
  if (l.positionX) {
    l.positionX.value = px; l.positionY.value = py; l.positionZ.value = pz;
    l.forwardX.value = fx; l.forwardY.value = fy; l.forwardZ.value = fz;
    l.upX.value = ux; l.upY.value = uy; l.upZ.value = uz;
  } else {
    l.setPosition(px, py, pz);
    l.setOrientation(fx, fy, fz, ux, uy, uz);
  }
}

export function spatialState() {
  return { level, loaded: !!bus?.loop?.src, gain: bus?.gain.gain.value ?? 0 };
}

on('store:vol', apply);
