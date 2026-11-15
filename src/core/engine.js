// Render loop, resize, carga de assets con caché, calidad adaptativa
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { store, isMobile, dbg, DEBUG } from './store.js';
import { endFrame } from './input.js';
import { afterWorldUpdate } from '../audio/runtime.js';

export const canvas = document.getElementById('gl');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance', preserveDrawingBuffer: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
// AgX conserva el color del foil y del penacho mejor que ACES (hombro más suave). Las sombras, si una luz las pide, son suaves.
renderer.toneMapping = THREE.AgXToneMapping; renderer.localClippingEnabled = true; renderer.toneMappingExposure = 1.02;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const Q = { high: !isMobile && store.get('quality') !== 'low', mobile: isMobile };
if (store.get('quality') === 'high') Q.high = true;
const maxDPR = Q.high ? 2 : 1.5;
// Resolución dinámica (solo con calidad «auto»): si los fps se quedan bajos varios segundos se reduce la resolución
// interna, y se recupera cuando sobra margen. Evita que un teléfono modesto se arrastre en las escenas pesadas.
const AUTO_RES = (store.get('quality') || 'auto') === 'auto';
let dprScale = 1, lowS = 0, highS = 0;
function adaptRes(fps) {
  if (!AUTO_RES || document.hidden) return;
  if (fps < 45) { lowS++; highS = 0; } else if (fps > 57) { highS++; lowS = 0; } else { lowS = 0; highS = 0; }
  if (lowS >= 3 && dprScale > 0.65) { dprScale = Math.max(0.65, dprScale - 0.15); lowS = 0; resize(); }
  else if (highS >= 8 && dprScale < 1) { dprScale = Math.min(1, dprScale + 0.1); highS = 0; resize(); }
}
let world = null; // {scene, camera, update(dt,t)}
export function setWorld(w) { world = w; resize(); }
export function getWorld() { return world; }
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDPR) * dprScale); renderer.setSize(w, h, false);
  if (world?.camera) { world.camera.aspect = w / h; world.camera.updateProjectionMatrix(); }
  world?.resize?.(w, h);
}
addEventListener('resize', resize);
const timer = new THREE.Timer(); timer.connect?.(document); let fpsAcc = 0, fpsN = 0; export const stats = { fps: 60 };
const tickers = new Set(); export const onTick = (f) => (tickers.add(f), () => tickers.delete(f));
// QA headless (solo ?debug&ts=N): sube el tope de dt para que los fotogramas lentos de swiftshader no ralenticen el juego N veces
const DT_MAX = DEBUG ? 0.05 * Math.min(6, Math.max(1, +new URLSearchParams(location.search).get('ts') || 1)) : 0.05;
let paused = false; export const setPaused = (p) => (paused = p);
function frame() {
  requestAnimationFrame(frame);
  timer.update(); const rawDt = timer.getDelta(); const dt = Math.min(rawDt, DT_MAX) * (DEBUG && stats.slow ? stats.slow : 1), t = timer.getElapsed(); // stats.slow: congelar casi el juego en QA
  fpsAcc += rawDt; fpsN++; // FPS con dt real (sin recorte) para que adaptRes() vea los fotogramas lentos if (fpsAcc > 1) { stats.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; adaptRes(stats.fps); stats.dpr = renderer.getPixelRatio(); }
  if (!paused) for (const f of tickers) f(dt, t);
  if (world) { if (!paused) world.update?.(dt, t); if (!paused) afterWorldUpdate(world, t); if (world.render) world.render(dt); else renderer.render(world.scene, world.camera); }
  endFrame();
}
requestAnimationFrame(frame);
dbg('stats', stats);

// ---- Assets ----
const texL = new THREE.TextureLoader(); const texCache = new Map();
export function tex(url, { srgb = true, repeat = 0 } = {}) {
  if (texCache.has(url)) return texCache.get(url);
  let ok; const ready = new Promise((r) => (ok = r));
  const t = texL.load(url, ok, undefined, ok); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.userData.ready = ready;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  texCache.set(url, t); return t;
}
const gltfL = new GLTFLoader(); gltfL.setMeshoptDecoder(MeshoptDecoder); const glbCache = new Map();
const gltfCache = new Map();
function loadGltf(name) { if (!gltfCache.has(name)) gltfCache.set(name, gltfL.loadAsync(`/models/${name}.glb`)); return gltfCache.get(name); }
// Explicit retry of one failed asset; never discards unrelated cached artist models.
export function invalidateModel(name) { gltfCache.delete(name); glbCache.delete(name); }
export function model(name) {
  if (!glbCache.has(name)) glbCache.set(name, loadGltf(name).then((g) => g.scene));
  return glbCache.get(name).then((s) => skClone(s));
}
// Igual que model() pero conserva las animaciones (los clips se enlazan por nombre de nodo, así que valen para el clon)
export function modelAnim(name) { return loadGltf(name).then((g) => ({ scene: skClone(g.scene), animations: g.animations })); }
// Escala un modelo a una altura (o tamaño máximo) dada y lo centra en el suelo
export function fit(obj, size, { axis = 'y', ground = true } = {}) {
  const b = new THREE.Box3().setFromObject(obj), s = new THREE.Vector3(); b.getSize(s);
  const k = size / (axis === 'max' ? Math.max(s.x, s.y, s.z) : s[axis]); obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj), c = new THREE.Vector3(); b2.getCenter(c);
  obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= ground ? b2.min.y : c.y;
  const g = new THREE.Group(); g.add(obj); return g;
}
// Copia la geometría de una malla en Float32 (des-cuantizada) con la matriz dada aplicada (por defecto, la del mundo)
export function bakeGeometry(m, mat) {
  m.updateWorldMatrix(true, false); const g0 = m.geometry, g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'color']) { const a = g0.attributes[k]; if (!a) continue; const n = a.count, sz = a.itemSize, f = new Float32Array(n * sz);
    for (let i = 0; i < n; i++) for (let c = 0; c < sz; c++) f[i * sz + c] = a.getComponent(i, c); g.setAttribute(k, new THREE.BufferAttribute(f, sz)); }
  if (g0.index) g.setIndex(Array.from(g0.index.array)); else g.setIndex([...Array(g.attributes.position.count).keys()]);
  g.applyMatrix4(mat || m.matrixWorld); return g;
}
// Une las mallas estáticas que comparten material (menos draw calls en móvil). Des-cuantiza los atributos
// (KHR_mesh_quantization) aplicando la matriz de cada nodo. Solo para modelos que no se animan por nodos.
export function mergeByMaterial(root) {
  root.updateWorldMatrix(true, true); const inv = root.matrixWorld.clone().invert(); const groups = new Map(), drop = [];
  root.traverse((m) => {
    if (!m.isMesh || m.isSkinnedMesh || m.isInstancedMesh || Array.isArray(m.material)) return;
    const g = bakeGeometry(m, new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const key = m.material.uuid + '|' + Object.keys(g.attributes).sort().join(',');
    if (!groups.has(key)) groups.set(key, { mat: m.material, gs: [], cast: m.castShadow, recv: m.receiveShadow }); groups.get(key).gs.push(g); drop.push(m);
  });
  let before = drop.length, after = 0;
  for (const m of drop) m.removeFromParent();
  for (const { mat, gs, cast, recv } of groups.values()) { const g = gs.length > 1 ? mergeGeometries(gs, false) : gs[0]; if (!g) continue; const mm = new THREE.Mesh(g, mat); mm.castShadow = cast; mm.receiveShadow = recv; root.add(mm); after++; }
  return { before, after };
}
export const texSuffix = Q.high ? '4k' : '2k';
export { THREE };
