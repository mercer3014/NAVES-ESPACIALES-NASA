// Render loop, resize, carga de assets con caché, calidad adaptativa
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { store, isMobile, dbg, DEBUG } from './store.js';
import { endFrame } from './input.js';
import { fixKnees } from './fix-knees.js';
import { afterWorldUpdate } from '../audio/runtime.js';

export const canvas = document.getElementById('gl');
// Gráficas integradas modestas (Intel HD/UHD, render por software): el MSAA les cuesta ~40 % de los fps (medido en la EVA: 37 → 51)
// y el modo «auto» acababa compensándolo bajando la resolución interna a 0,65 (imagen borrosa). En «auto» esas GPU arrancan sin MSAA
// y conservan la resolución completa: más nítido y más fluido. Con calidad «alta» el antialias se mantiene siempre.
const weakGpu = (() => { try { const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return false;
  const e = gl.getExtension('WEBGL_debug_renderer_info'); const r = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|Software|Basic Render/i.test(r) || (/Intel/i.test(r) && /(U?HD) Graphics/i.test(r) && !/Iris|Arc/i.test(r)); } catch { return false; } })();
const useMSAA = !isMobile && !(weakGpu && (store.get('quality') || 'auto') === 'auto');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: useMSAA, powerPreference: 'high-performance', preserveDrawingBuffer: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
// AgX conserva el color del foil y del penacho mejor que ACES (hombro más suave). Las sombras, si una luz las pide, son suaves.
renderer.toneMapping = THREE.AgXToneMapping; renderer.localClippingEnabled = true; renderer.toneMappingExposure = 1.02;
renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft ya no existe en three r187 (lo trataba como PCF y avisaba por consola): mismo resultado, sin aviso
export const Q = { high: !isMobile && store.get('quality') !== 'low', mobile: isMobile };
if (store.get('quality') === 'high') Q.high = true;
const maxDPR = Q.high ? 2 : 1.5;
// Resolución dinámica (solo con calidad «auto»): si los fps se quedan bajos varios segundos se reduce la resolución
// interna, y se recupera cuando sobra margen. Evita que un teléfono modesto se arrastre en las escenas pesadas.
const AUTO_RES = (store.get('quality') || 'auto') === 'auto';
let dprScale = 1, lowS = 0, highS = 0, graceS = 0, ceilS = 1, raisedAgo = 99;
// graceS: segundos tras cambiar de mundo en los que no se mide (la carga de modelos y texturas da fotogramas lentos que no dicen nada
// del rendimiento real; antes bastaban para bajar la resolución de toda la fase). ceilS: si al subir la resolución hubo que volver a
// bajarla enseguida, ese es el techo de este mundo y no se reintenta (evita el vaivén de nitidez cada pocos segundos).
function adaptRes(fps) {
  if (!AUTO_RES || document.hidden) return;
  if (graceS > 0) { graceS--; lowS = highS = 0; return; }
  raisedAgo++;
  if (fps < 45) { lowS++; highS = 0; } else if (fps > 54) { highS++; lowS = 0; } else { lowS = 0; highS = 0; }
  if (lowS >= 3 && dprScale > 0.65) { dprScale = Math.max(0.65, dprScale - 0.15); if (raisedAgo < 12) ceilS = dprScale; lowS = 0; resize(); }
  else if (highS >= 8 && dprScale < ceilS) { dprScale = Math.min(ceilS, dprScale + 0.1); highS = 0; raisedAgo = 0; resize(); }
}
let world = null; // {scene, camera, update(dt,t)}
export function setWorld(w) { const fresh = w !== world; world = w; resize(); if (fresh) { graceS = 5; ceilS = 1; warmStart(w); } }
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
  // FPS con dt real (sin recorte) para que adaptRes() vea los fotogramas lentos
  fpsAcc += rawDt; fpsN++;
  if (fpsAcc > 1) { stats.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; adaptRes(stats.fps); stats.dpr = renderer.getPixelRatio(); }
  // Mientras se compilan los shaders de un mundo recién puesto (≤ 2,5 s) no se avanza ni se dibuja: antes ese rato era un congelón
  // del hilo principal en el primer fotograma (la interfaz y el audio se quedaban colgados); ahora la página sigue respondiendo.
  if (warming) return; // (sin endFrame: una tecla pulsada en este rato no se pierde)
  if (!paused) for (const f of tickers) f(dt, t);
  if (world && !document.hidden) warmStep(world, rawDt);
  if (world) { if (!paused) world.update?.(dt, t); if (!paused) afterWorldUpdate(world, t); if (world.render) world.render(dt); else renderer.render(world.scene, world.camera); }
  endFrame();
}
requestAnimationFrame(frame);
dbg('stats', stats);

// ---- Precalentado de shaders y texturas ----
// Los «cortes» en plena partida venían de compilar un shader o subir una textura a la GPU la primera vez que algo aparecía en
// pantalla (100–200 ms cada vez; > 1 s al entrar en una fase). Aquí se adelanta ese trabajo: los programas se compilan en paralelo
// (KHR_parallel_shader_compile) en cuanto el objeto entra en la escena, aunque todavía esté oculto o fuera de cámara, y las
// texturas se suben de una en una, un fotograma cada una. No cambia nada de lo que se ve.
let warming = false, warmTok = 0, warmT = 0;
const warmSeen = new WeakSet(), texSeen = new WeakSet(); let texQ = [];
const drawable = (o) => o.isMesh || o.isPoints || o.isLine || o.isSprite;
function warmStart(w) {
  texQ = []; warmT = 0; warming = false;
  if (!w?.scene || !w.camera || w.render) return; // con post-proceso propio (despegue) los programas dependen de su render target: lo gestiona esa escena
  const tok = ++warmTok; let p;
  try { w.scene.traverse((o) => { if (drawable(o)) warmSeen.add(o); }); p = renderer.compileAsync(w.scene, w.camera); } catch (e) { if (DEBUG) console.warn('warm', e); return; }
  warming = true; const done = () => { if (tok === warmTok) warming = false; };
  p.then(done, done); setTimeout(done, 2500);
}
function queueTex(o) {
  for (const m of Array.isArray(o.material) ? o.material : [o.material]) { if (!m) continue;
    const add = (t) => { if (t && t.isTexture && !t.isRenderTargetTexture && !t.isVideoTexture && !t.isCubeTexture && !texSeen.has(t)) { texSeen.add(t); texQ.push(t); } };
    if (m.uniforms) for (const k in m.uniforms) add(m.uniforms[k]?.value);
    for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'lightMap', 'specularMap']) add(m[k]); }
}
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
function warmStep(w, dt) {
  if (!w.scene || !w.camera) return;
  if ((warmT -= dt) <= 0) { warmT = 0.35; const fresh = [];
    w.scene.traverse((o) => { if (!drawable(o) || !o.material) return; if (!warmSeen.has(o)) { warmSeen.add(o); fresh.push(o); }
      if (!Q.mobile || shown(o)) queueTex(o); }); // en móvil solo lo visible: no se gasta memoria de vídeo en lo que quizá no llegue a verse
    if (fresh.length && !w.render) { try { if (fresh.length > 8) renderer.compile(w.scene, w.camera); else for (const o of fresh) renderer.compile(o, w.camera, w.scene); } catch (e) { if (DEBUG) console.warn('warm', e); } } }
  // una textura por fotograma, y solo cuando su imagen ya está descargada y decodificada
  for (let i = 0; i < texQ.length; i++) { const t = texQ[i], im = t.image; if (!im || im.complete === false || !(im.width || im.videoWidth || im.data || t.mipmaps?.length)) continue;
    texQ.splice(i, 1); try { renderer.initTexture(t); } catch (e) { if (DEBUG) console.warn('warm tex', e); } break; }
  if (texQ.length > 400) texQ.length = 0;
}

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
// fixKnees: algunos clips (caminar, correr, saltar, escalera) traen la rodilla doblada hacia adelante; se corrigen al cargar
function loadGltf(name) { if (!gltfCache.has(name)) gltfCache.set(name, gltfL.loadAsync(`/models/${name}.glb`).then((g) => { if (g.animations?.length) { const f = fixKnees(g.scene, g.animations); if (f.length && DEBUG) console.info('rodillas corregidas', name, f.join(' ')); } return g; })); return gltfCache.get(name); }
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
