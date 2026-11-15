# Notas para unificar con la parte del compañero (Personas 1 y 2)

## Compresión segura (regla 7)

No uses `gltf-transform optimize` a secas: sin estas banderas aplana el grafo, une nodos y borra los empties `npc-spot-*`.

```bash
gltf-transform optimize in.glb out.glb \
  --compress meshopt \
  --texture-compress webp \
  --flatten false \
  --join false \
  --palette false \
  --simplify false \
  --prune false \
  --instance false
```

## Nombres de huesos en three.js

En el glb los huesos se llaman exactamente `mixamorig:Hips`, `mixamorig:LeftArm`, `mixamorig:HeadTop_End`, etc. (el exportador de Blender conserva los `:`).

three.js (`PropertyBinding.sanitizeNodeName`) quita los `:` al cargar, así que en runtime son `mixamorigHips`, `mixamorigLeftArm`, `mixamorigHeadTop_End`. Las pistas de los clips se sanitizan igual y se reproducen sin cambios.

Para buscar un hueso en código:

```js
root.getObjectByName('mixamorigHips')
// no: 'mixamorig:Hips'
```

Los 8 civiles de Persona 3 y `controller-extra` usan la misma jerarquía (25 huesos). El nodo padre del esqueleto se llama `armature`. Si los clips de P1 (Mixamo) no encajan directo con este rig, usa `SkeletonUtils.retargetClip`.

## Convención de npc-spot

- Origen del empty en el **suelo** (o en el piso de la grada, en el MOCR), no en el asiento.
- El frente del spot mira a **+Z en glTF** (−Y en Blender).
- `extras.pose` indica el clip:
  - `stand` → `idle`
  - `sit`, `sit-sofa`, `sit-chair` → clip `sit` (espalda recta, asiento horneado a ~0,45 m en adultos y a escala en los niños)
  - `sit-floor` → clip `sit-floor` (cadera a y≈0). No basta con `startsWith('sit')`: eso acabaría reproduciendo `sit` y Mark flotaría.
- Si el mueble no mide 0,45 m, el spot declara `extras.seat_height` (metros sobre el origen del spot). La escena de prueba desplaza la raíz así: `y += seat_height - asiento_horneado`, con asiento horneado 0,45 en adultos, 0,41 en Jan, 0,36 en Rick y 0,26 en Mark (cadera del clip `sit` menos 0,10 m a escala). Ejemplos: sillas del LRL `0.45`, borde de la cama del hotel `0.55`, sofá de la casa `0.46` (Rick).
- MOCR: cada spot está en el suelo de su grada y declara `seat_height: 0.48` (en la práctica, +3 cm sobre el clip horneado).

## Garman junto a Bales

Históricamente Garman estaba en la sala de apoyo (back room). En este modelo su `npc-spot-garman` está en la trinchera, junto a Bales, por decisión de escena (el 1202 se juega en el MOCR). No lo muevas a la back room sin hablarlo.

## Limitación conocida

Las manos son tipo manopla (el esqueleto no tiene dedos). La sonda de colisión no detecta brazos atravesando el torso ni el chaleco en ningún clip.

## Personaje que falta

No hay un modelo de Neil civil. En la escena de prueba (LRL, casa y hotel) se coloca `civil-base-p3` en `npc-spot-neil` como sustituto, para comprobar el asiento y la orientación hacia el vidrio. Cuando P1/P2 tenga a Neil (o un civil equivalente), basta con cambiar el nombre en el mapa de spots.

## Cambios de la auditoría (14/11, 20:30 BOT)

- `armstrong-house.glb`: el sofá estaba girado 180° (respaldo hacia la TV, asiento hacia la ventana) y Rick quedaba metido en el respaldo. Ahora el sofá mira a la TV, `npc-spot-rick` se adelantó a z = −2,45 y declara `seat_height: 0.46` y `target: tv-set`. Solo cambió el JSON del glb (rotación de un nodo y un empty); la geometría es idéntica byte a byte.
- `npc-spot-neil` de la casa es `sit-chair` en la cabecera del comedor; la escena de prueba lo puebla con `civil-base-p3`.

## Segunda auditoría (14/11, 21:00 BOT): lo que necesita el código del juego

### Nombre: `civil-base-p3.glb`
Nuestro civil temporal se renombró para no chocar con el `civil-base.glb` de P1. Si al unificar queda el de P1, basta con cambiar el nombre en los mapas de spots.

### walk: mover la raíz
El clip `walk` es *in place*. Para que el pie no patine, el código tiene que mover el personaje hacia su +Z local a la velocidad horneada:

```js
let v = 1.0;
root.traverse((o) => { if (o.userData?.walk_speed_mps) v = o.userData.walk_speed_mps; });
// en el update, mientras walk esté activo:
root.translateZ(v * dt);
```

Velocidades: adultos 1,024 m/s, Jan 0,968, Rick 0,905 y Mark 0,772. En los mismos `extras` están `walk_cycle_s` y `walk_stride_m`. Si el juego necesita otra velocidad, escala el clip con `action.timeScale = vDeseada / v`; no cambies solo la velocidad de la raíz.

### Relleno del MOCR: `controller-extra.glb` + `npc-spot-extra-1..16`
Cada spot lleva `extras = { pose: 'sit', seat_height: 0.48, npc: 'controller-extra', variant: 'a'|'b'|'c' }`. Los colores de camisa van en `extras.shirt_variants` del `armature` (three.js no aplica `KHR_materials_variants`, aunque también vienen así para otros visores):

```js
function setShirtVariant(root, variant) {
  let colors = null;
  root.traverse((o) => { if (o.userData?.shirt_variants) colors = o.userData.shirt_variants; });
  root.getObjectByName('shirt')?.traverse((o) => {
    if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(colors[variant] || colors.a); }
  });
}
```

Para cargarlo, `SkeletonUtils.clone` una vez por spot: son 16 clones de 1.876 tris, unos 30.000 tris en total. Desfasa el clip `sit` de cada uno (`action.time = i * 0.37`) para que no se muevan todos a la vez. Hay un ejemplo completo en `prueba-escena/src/main.js`, en `populateExtras()`.

### Casa: ventana de día o de noche
`window-backdrop` agrupa `window-day` (aterrizaje, 15:17 CDT) y `window-night` (primer paso, 21:56 CDT). Hay que mostrar solo uno. Las luces asociadas llevan `extras.variant` (`'day'` o `'night'`):

```js
const day = h === 'dia';
room.getObjectByName('window-day').visible = day;
room.getObjectByName('window-night').visible = !day;
// y al crear las luces desde extras.light, encender solo las de extras.variant === (day ? 'day' : 'night')
```

### idle y clips de gesto
`talk`, `point` y `wave` empiezan y terminan en el fotograma 0 de `idle`, así que se puede pasar de uno a otro con un crossfade corto (0,2 s) sin salto. `extras.idle_arm_deg` es el ángulo de los brazos en idle (85° en la mayoría).
