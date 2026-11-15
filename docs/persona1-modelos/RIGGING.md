# Rigging v04: reglas para personajes glTF en three.js

Esto vale para `armstrong-civil`, `aldrin-civil`, `collins-civil` y `civil-base`. Cada personaje se probó con `validator/rig-test.mjs` en three.js sin navegador; la salida está en `rig-test-output.txt`.

## Reglas aplicadas
1. **Escala y ejes:** 1 unidad = 1 m. El eje +Y apunta arriba y el personaje mira hacia +Z en three.js (es el -Y de Blender). El origen está en los pies. Las transformaciones están aplicadas: escala 1 y sin rotación en los objetos.
2. **Raíz:** el nodo `Armature` está en el origen, con rotación identidad y escala 1. Debajo cuelga un solo `SkinnedMesh` llamado `Body`. three.js lo divide en `Body_1…Body_N`, uno por material. El hueso raíz es `Hips`.
3. **Esqueleto:** 22 huesos estilo Mixamo, sin prefijo `mixamorig:` y con los mismos nombres y el mismo orden en los cuatro personajes. Los nombres son: Hips, Spine, Spine1, Spine2, Neck, Head, Left/RightShoulder, Arm, ForeArm, Hand, Left/RightUpLeg, Leg, Foot, ToeBase. Son un subconjunto exacto de los huesos de `astronaut-a7l.glb`, al que solo le sobran los dedos.
4. **Pose de reposo:** el bind está en pose A, la misma pose de modelado en los cuatro personajes. No se usa la escala de los huesos.
5. **Pesos:** como máximo 4 influencias por vértice y normalizadas, sin pesos sueltos. El pelo (hair cards, la capa base del cuero cabelludo y las cejas) y los ojos son rígidos al 100 % sobre `Head`. La ropa forma parte de la misma malla y lleva los pesos de la piel del cuerpo.
6. **Cara:** no hay huesos de mandíbula ni de ojos. La boca, los párpados y las cejas se mueven con morph targets: `smile`, `mouth-open`, `viseme-a`, `viseme-o`, `viseme-m`, `blink-l`, `blink-r`, `brow-up`, `frown`, `worried`. Los morphs sobreviven la compresión meshopt (verificado).
7. **Clips:** `idle`, `walk`, `sit`, `talk`, `point` y `wave`, a 30 fps, con nombres en kebab-case. Cada clip sale de una sola acción, sin restos de NLA ni acciones duplicadas.
   - Cada clip tiene solo pistas de **rotación** de huesos más `Hips.position`. Se quitaron la escala y la traslación del resto de huesos para poder compartir clips entre personajes con proporciones distintas.
   - **Root motion:** todos los clips son **en el sitio** (in-place). `Hips.position` solo lleva un balanceo de unos pocos cm. El desplazamiento real del personaje lo hace el código del juego moviendo el `Object3D`.
   - `idle` y `talk` también animan morphs (parpadeo y visemas). `sit` baja la cadera; el asiento tiene que quedar a unos 0,45 m del suelo.
8. **Pelo:** el material `*-hair-cards` usa `alphaMode MASK` (alphaTest 0,5) y es de doble cara, sin transparencia ordenada. Así no hay problemas de orden de dibujado.
9. **Bounding box y culling:** three.js calcula la caja de un SkinnedMesh en la pose de bind, así que al animar puede recortarse el personaje cerca de los bordes de la cámara. Hay dos soluciones: `mesh.frustumCulled = false` (simple, son pocos personajes) o `mesh.computeBoundingSphere()` con un margen después de animar.
10. **LOD:** no se incluyen LODs, porque con unos 25k triángulos por personaje no hacen falta. Si se necesitan, se puede generar uno con `gltf-transform simplify` manteniendo el mismo esqueleto.

## Integración en three.js
```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.loadAsync('/models/armstrong-civil.glb');
const armstrong = gltf.scene;           // si se usa el mismo glb varias veces: SkeletonUtils.clone(gltf.scene)
armstrong.traverse(o => { if (o.isSkinnedMesh) { o.frustumCulled = false; o.castShadow = true; } });
scene.add(armstrong);

// Animación + crossFade
const mixer = new THREE.AnimationMixer(armstrong);
const clip = name => THREE.AnimationClip.findByName(gltf.animations, name);
let current = mixer.clipAction(clip('idle')).play();
function playClip(name, fade = 0.3) {
  const next = mixer.clipAction(clip(name));
  if (next === current) return;
  next.reset().setEffectiveWeight(1).play();
  current.crossFadeTo(next, fade, false);
  current = next;
}
// sentarse una sola vez:
// const a = mixer.clipAction(clip('sit')); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true;

// Morphs (expresiones): el mesh tiene varias primitivas, hay que aplicarlo a todas
const faceMeshes = [];
armstrong.traverse(o => { if (o.morphTargetDictionary) faceMeshes.push(o); });
function setExpr(name, value) {
  for (const m of faceMeshes) { const i = m.morphTargetDictionary[name]; if (i !== undefined) m.morphTargetInfluences[i] = value; }
}
setExpr('smile', 0.7);   // ojo: los clips idle/talk también escriben morphs; si querés controlarlos a mano, filtrá esas pistas

// Compartir clips entre personajes (mismo esqueleto y mismos nombres)
const aldrinGltf = await loader.loadAsync('/models/aldrin-civil.glb');
const aldrinMixer = new THREE.AnimationMixer(aldrinGltf.scene);
const shareClip = (c, root) => new THREE.AnimationClip(c.name, c.duration,
  c.tracks.filter(t => THREE.PropertyBinding.findNode(root, THREE.PropertyBinding.parseTrackName(t.name).nodeName)));
aldrinMixer.clipAction(shareClip(clip('wave'), aldrinGltf.scene)).play();   // el wave de Armstrong en Aldrin

// Clips del astronauta A7L (otro reposo, tiene dedos): retarget
// const astro = await loader.loadAsync('/models/astronaut-a7l.glb');
// const src = astro.scene.getObjectByProperty('type','SkinnedMesh');
// const dst = armstrong.getObjectByProperty('type','SkinnedMesh');
// const walkA7L = SkeletonUtils.retargetClip(dst, src, THREE.AnimationClip.findByName(astro.animations,'walk'), { hip: 'Hips', useFirstFramePosition: true });

// loop
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => { const dt = clock.getDelta(); mixer.update(dt); aldrinMixer.update(dt); renderer.render(scene, camera); });
```

## Notas
- `shareClip` filtra pistas de morph que apuntan a primitivas que el destino no tiene. Por ejemplo, `civil-base` no lleva parches, así que tiene un `Body_N` menos. Los huesos enlazan al 100 % entre los cuatro personajes.
- Los clips de `astronaut-a7l` usan otra pose de reposo y orientación de huesos. Copiarlos tal cual da poses torcidas; con `retargetClip` funcionan (probado con `walk`).

## Pelo
Ver `HAIR.md`: tarjetas de pelo con atlas horneado desde un groom de Hair Curves y material `alphaTest`/`alphaToCoverage` en three.js.
