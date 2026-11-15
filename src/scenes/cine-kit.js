// Utilidades compartidas por las escenas de cinemática (cap. 7 y epílogo): personajes civiles con clips,
// clips de brazo (saludar sentado), mixers de props y limpieza.
import { THREE, model, modelAnim, renderer } from '../core/engine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Entorno PMREM compartido (se crea una vez y no se libera): da reflejos al metal (CM, MQF, descapotable)
let _env = null;
export function envMap() {
  if (!_env) { const pm = new THREE.PMREMGenerator(renderer); _env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  return _env;
}

// Los rigs de Mixamo (Persona 3) llegan como «mixamorigRightArm»: GLTFLoader quita los «:» de «mixamorig:RightArm»
const ARM_R = /^(?:mixamorig)?(RightShoulder|RightArm|RightForeArm|RightHand)\./;
const UPPER = /^(?:mixamorig)?(Spine|Spine1|Spine2|Neck|Head|LeftShoulder|LeftArm|LeftForeArm|LeftHand|RightShoulder|RightArm|RightForeArm|RightHand)\./;
// Copia de un clip con solo las pistas que pasan el filtro (p. ej. el brazo derecho de 'wave' encima de 'sit')
export function subClip(clip, re, name) {
  return new THREE.AnimationClip(name || clip.name + '-part', clip.duration, clip.tracks.filter((t) => re.test(t.name)));
}

// Personaje civil (esqueleto compartido de 25 huesos; clips idle/walk/sit/talk/point/wave).
// El origen está en los pies (con 'sit', el origen va en el asiento: seat-1..3 del descapotable).
export async function char(name, clip = 'idle', { phase = 0 } = {}) {
  const { scene: root, animations } = await modelAnim(name);
  root.name = name;
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(root);
  const clips = Object.fromEntries(animations.map((c) => [c.name, c]));
  clips['wave-arm'] = clips.wave && subClip(clips.wave, ARM_R, 'wave-arm');
  clips['point-arm'] = clips.point && subClip(clips.point, ARM_R, 'point-arm');
  clips['talk-upper'] = clips.talk && subClip(clips.talk, UPPER, 'talk-upper');
  // variantes sin las pistas de la capa: con pesos 1 + 1 el mezclador promediaría y el brazo quedaría a medias
  for (const c of animations) { clips[c.name + '~arm'] = subClip(c, { test: (n) => !ARM_R.test(n) }, c.name + '~arm'); clips[c.name + '~upper'] = subClip(c, { test: (n) => !UPPER.test(n) }, c.name + '~upper'); }
  let base = null, baseName = clip, layer = null, cut = '';
  const run = (n, fade) => {
    const c = clips[n]; if (!c) return;
    const a = mixer.clipAction(c); if (base === a) return; a.reset().setEffectiveWeight(1).play();
    if (base) base.crossFadeTo(a, fade, false); base = a;
  };
  const api = {
    root, mixer, clips,
    // clip base de cuerpo entero (cruzado); respeta la capa activa
    play(n, fade = 0.3) { if (!clips[n]) return api; baseName = n; run(n + cut, fade); return api; },
    // capa encima del clip base (solo algunas pistas): 'wave-arm', 'point-arm', 'talk-upper' o null para quitarla
    layer(n, fade = 0.3) {
      if (layer) { layer.fadeOut(fade); layer = null; }
      const c = n && clips[n];
      cut = c ? (n.endsWith('-arm') ? '~arm' : '~upper') : '';
      run(baseName + cut, fade);
      if (!c) return api;
      layer = mixer.clipAction(c); layer.reset().setEffectiveWeight(1).fadeIn(fade).play(); return api;
    },
    update(dt) { mixer.update(dt); },
  };
  api.play(clip, 0);
  if (phase) mixer.update(phase);
  return api;
}

// Prop con sus clips (los clips se enlazan por nombre de nodo)
export async function prop(name) {
  const { scene: root, animations } = await modelAnim(name);
  const mixer = new THREE.AnimationMixer(root);
  const clips = Object.fromEntries(animations.map((c) => [c.name, c]));
  return {
    root, mixer, clips,
    play(n, { loop = true, speed = 1 } = {}) {
      const c = clips[n]; if (!c) return null;
      const a = mixer.clipAction(c); a.reset(); a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !loop; a.timeScale = speed; a.play(); return a;
    },
    // pose determinista: deja el clip n en el segundo t (loop: repite; si no, se queda en el último fotograma)
    at(n, t, loop = false) {
      const c = clips[n]; if (!c) return;
      const a = mixer.clipAction(c); if (!a.isRunning() && !a.paused) { a.play(); }
      a.paused = true; a.enabled = true; a.setEffectiveWeight(1);
      a.time = loop ? ((t % c.duration) + c.duration) % c.duration : Math.min(c.duration, Math.max(0, t));
    },
    apply() { mixer.update(0); },
    update(dt) { mixer.update(dt); },
  };
}
export { model };

export const node = (root, n) => root.getObjectByName(n);

export function shadowAll(root, cast = true, recv = true) {
  root.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recv; } });
  return root;
}

// Libera geometrías y materiales propios de la escena (los glb vienen de la caché del motor: solo se sueltan las copias).
export function disposeScene(scene) {
  scene.traverse((o) => {
    if (o.isMesh || o.isPoints || o.isSprite) {
      if (o.userData.own) { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.()); }
    }
  });
  scene.clear();
}

export function camera(fov = 40, far = 6000) {
  return new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.05, far);
}

export const smooth = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
