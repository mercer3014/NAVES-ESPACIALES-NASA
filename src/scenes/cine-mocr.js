// Sala de Control de Misión (MOCR 2, Houston) para las cinemáticas del prólogo y del capítulo 4.
// mocr-room.glb: ~20×15 m, 4 filas escalonadas; las consolas miran a las pantallas de la pared (+Z), pizarra en x≈−10.
// Personajes: kranz, bales, duke, garman + controladores extra sentados (sit). Luz fluorescente fría y algo de humo (niebla).
import { THREE } from '../core/engine.js';
import { makeCineBase, faceTo, propCopy } from './cine-common.js';

// Sillas (pivotes del glb): fila 1 = 'la trinchera' (RETRO, FIDO, GUIDO), fila 2 = CAPCOM, fila 3 = director de vuelo
const CHAIR = {
  'r1-01': [-3.84, 0, 2.65], 'r1-02': [-2.44, 0, 2.65], 'r1-03': [-1.32, 0, 2.65], 'r1-04': [0.08, 0, 2.65], 'r1-05': [1.2, 0, 2.65], 'r1-06': [2.6, 0, 2.65], 'r1-07': [3.72, 0, 2.65],
  'r2-01': [-4.47, 0.35, 0.05], 'r2-02': [-3.07, 0.35, 0.05], 'r2-03': [-1.95, 0.35, 0.05], 'r2-04': [-0.55, 0.35, 0.05], 'r2-05': [0.57, 0.35, 0.05], 'r2-06': [1.97, 0.35, 0.05], 'r2-07': [3.09, 0.35, 0.05], 'r2-08': [4.49, 0.35, 0.05],
  'r3-01': [-4.47, 0.7, -2.55], 'r3-02': [-3.07, 0.7, -2.55], 'r3-03': [-1.95, 0.7, -2.55], 'r3-04': [-0.55, 0.7, -2.55], 'r3-05': [0.57, 0.7, -2.55], 'r3-06': [1.97, 0.7, -2.55], 'r3-07': [3.09, 0.7, -2.55], 'r3-08': [4.49, 0.7, -2.55],
  'r4-01': [-3.21, 1.05, -5.15], 'r4-02': [-1.81, 1.05, -5.15], 'r4-03': [-0.69, 1.05, -5.15], 'r4-04': [0.71, 1.05, -5.15], 'r4-05': [1.83, 1.05, -5.15], 'r4-06': [3.23, 1.05, -5.15],
};
export const MOCR_SPOTS = {
  bales: CHAIR['r1-05'], duke: CHAIR['r2-02'],
  kranz: [0.0, 0.7, -2.45], // de pie entre las sillas r3-04 y r3-05 (consola del director de vuelo)
  kranzFront: [0, 0, 5.6], // 1967: de pie frente a las filas, de espaldas a las pantallas
  garman: [4.55, 1.05, -5.55], // al fondo, en la fila de apoyo (la sala de apoyo real no está modelada)
  chalkboard: [-9.97, 0, 1.5], screens: [0, 0, 7.47],
};
const EXTRAS = ['civil-base', 'extra-man-1', 'extra-man-2'];
const EXTRA_CHAIRS = ['r1-02', 'r1-03', 'r1-06', 'r2-04', 'r2-05', 'r2-07', 'r3-02', 'r3-03', 'r3-06', 'r3-07', 'r4-02', 'r4-04', 'r4-05'];

// era: '1967' (prólogo, discurso de Kranz al frente) o '1969' (alunizaje)
export function makeMocr({ era = '1969' } = {}) {
  const W = makeCineBase({ bg: 0x0c0f0e, fov: 38, far: 80, fog: { color: 0x26302b, density: era === '1967' ? 0.028 : 0.02 } });
  const { scene } = W;
  // Fluorescentes verdosos fríos + resplandor de las pantallas
  scene.add(new THREE.HemisphereLight(0xe8efe6, 0x2a2c2a, 0.5));
  for (const z of [-4, 0, 4]) { const l = new THREE.PointLight(0xf0f5ea, 3, 14, 1.4); l.position.set(0, 4.2, z); scene.add(l); }
  const screenGlow = new THREE.PointLight(0x7dffa0, 2.5, 12, 1.6); screenGlow.position.set(0, 2.4, 6.2); scene.add(screenGlow);
  const board = new THREE.SpotLight(0xfff4e0, 9, 9, 0.5, 0.6, 1.2); board.position.set(-6.5, 3.6, 1.5); board.target.position.set(-9.97, 1.6, 1.5); scene.add(board, board.target);

  const roomP = W.room('mocr-room');
  const props = W.room('earth-props').then((r) => { if (r) r.root.visible = false; return r; });
  W.actor('kranz', 'kranz', era === '1967' ? { pos: MOCR_SPOTS.kranzFront, rotY: Math.PI, clip: 'idle' } : { pos: MOCR_SPOTS.kranz, rotY: 0, clip: 'idle' });
  if (era !== '1967') {
    W.actor('bales', 'bales', { pos: CHAIR['r1-05'], rotY: 0, clip: 'sit' });
    W.actor('duke', 'duke', { pos: CHAIR['r2-02'], rotY: 0, clip: 'sit' });
    W.actor('garman', 'garman', { pos: MOCR_SPOTS.garman, rotY: faceTo(4.55, -5.55, 1.2, 2.65), clip: 'idle' });
  }
  // En 1967 todos los controladores están sentados mirando a Kranz; en 1969 miran las pantallas.
  const seats = era === '1967' ? [...EXTRA_CHAIRS, 'r1-05', 'r2-02', 'r3-04', 'r3-05'] : EXTRA_CHAIRS;
  seats.forEach((k, i) => W.actor('x' + i, EXTRAS[i % EXTRAS.length], { pos: CHAIR[k], rotY: 0, clip: 'sit' }));

  // Hoja de Garman (earth-props › alarm-sheet) en su mano/consola
  let sheet = null;
  Promise.all([roomP, props]).then(([, p]) => { if (!p) return; sheet = propCopy(p.N, 'alarm-sheet', scene, { pos: [4.3, 1.05 + 0.92, -4.2], rotY: -0.3 }); });

  // Luz de alarma ámbar en la consola de GUIDO (1202)
  const alarmL = new THREE.PointLight(0xffb030, 0, 3, 1.5); alarmL.position.set(1.26, 1.25, 3.3); scene.add(alarmL);
  // Pantalla de la consola de GUIDO con «1202» ámbar (CanvasTexture, emisiva: no depende de la luz de la sala)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const g = cv.getContext('2d');
  g.fillStyle = '#0b0a06'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#ffb030'; g.textAlign = 'center';
  g.font = 'bold 22px monospace'; g.fillText('PROG ALARM', 128, 40); g.font = 'bold 76px monospace'; g.fillText('1202', 128, 122);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const alarmScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.28), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  alarmScreen.position.set(0.96, 1.0465, 3.6255); alarmScreen.lookAt(0.96, 1.0465 - 0.21, 3.6255 - 0.98); alarmScreen.translateZ(0.004); /* pegada al CRT izquierdo de console-r1-05 (GUIDO, 0.42×0.32 m, cara hacia −Z, borde superior inclinado hacia el operador) */ alarmScreen.visible = false; alarmScreen.material.userData.cineOwn = true; scene.add(alarmScreen);
  let alarmOn = false, t = 0;
  W.tick((dt) => { t += dt; const blink = Math.sin(t * 10) > 0; alarmL.intensity = alarmOn ? (blink ? 6 : 0.5) : 0; alarmScreen.visible = alarmOn; alarmScreen.material.color.setScalar(blink ? 1 : 0.45); }); // parpadea atenuándose, nunca desaparece

  return {
    ...W,
    spots: MOCR_SPOTS,
    get sheet() { return sheet; },
    alarm(on) { alarmOn = on; },
    // Todos los extras se ponen de pie y saludan (alunizaje)
    cheer() { for (const [k, a] of Object.entries(W.actors)) if (/^x\d+$/.test(k)) { a.root.position.y += 0; a.play(Math.random() < 0.6 ? 'wave' : 'talk', { fade: 0.5 }); } },
  };
}
