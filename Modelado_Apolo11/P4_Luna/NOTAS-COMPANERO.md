# Notas para la Persona 2 (integración de la Luna, P4)

Todo lo que necesitas para meter los modelos de la Persona 4 en el juego. Los `.glb` de `glb/` ya están comprimidos (meshopt + WebP). **Cópialos tal cual a `public/models/`; no los vuelvas a optimizar.** `astronaut-a7l.glb` y `easep-props.glb` no se tocaron: sus hashes siguen siendo los de `tests/assets.test.mjs`.

## 1. Compresión (si regeneras algo)

```
gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp \
  --flatten false --join false --palette false --simplify false --prune false --instance false
```

- **guardian.glb: añade `--resample false`.** Sin esa bandera, el remuestreo con pérdida mueve 2–3 cm los pies y los puños apoyados, y se ve cómo resbalan.
- Sin las banderas `false`, gltf-transform borra los vacíos (`spawn-*`), une nodos y aplana la jerarquía: se pierden las placas colgadas de huesos.

## 2. Cráteres Little West y West Crater: parche de 2 líneas en `src/sim/lander.js`

El juego **no lee** `public/models/moon-surface-height.json` (solo trae `size_m, min_m, max_m, res`). El relieve que pisa el jugador es `ground(x, z)` de `src/sim/lander.js` más el tile del artista. Por eso:

- `moon-surface-height-a11.json` conserva las 4 claves originales idénticas y añade `a11_craters` con los datos y las 2 líneas JS. Es documentación: copiarlo no cambia nada en el juego.
- **Lo que hay que hacer:** pegar las 2 líneas de `parche/lander-craters-a11.patch.js`. El mismo cambio en formato diff está en `parche/lander-craters-a11.diff`.
  1. Justo después de `const CR = [...]` (línea 6):
     `const CR_A11 = [[PAD.x - 66, 0, 16.5, 4], [PAD.x - 406, 0, 90, 20]];`
  2. Dentro de `ground()`, justo después del `for (const [cx, cz, r, d] of CR) {...}`:
     `for (const [cx, cz, r, d] of CR_A11) { const q = Math.hypot(x - cx, z - cz) / r; if (q < 1) h += d * (q * q - 0.75); else if (q < 1.6) h += d * 0.25 * Math.cos(((q - 1) / 0.6) * Math.PI / 2) ** 2; }`
- Ejes del juego en la Luna: **+x = oeste, +z = norte, y = arriba**. El descenso avanza hacia +x, igual que el Apolo 11 real (de este a oeste).
- Little West: 33 m de diámetro y 4 m del borde al fondo (borde +1 m, fondo −3 m), centrado 60 m al **este** del LM nominal (x = 184).
- West Crater: 180 m de diámetro y 20 m del borde al fondo, centrado 400 m al **este** (x = −156).
- **West Crater va al ESTE, no al oeste como dice el plan.** Según el ALSJ y el LROC, Armstrong lo sobrevoló y se posó unos 400–500 m más allá, hacia el oeste, así que el cráter queda al este del LM. Para seguir el plan al pie de la letra, pon `WEST_SIDE = +1` en `parche/craters_a11.py` y regenera, o cambia `PAD.x - 406` por `PAD.x + 394` en la línea 1.
- La fórmula nueva es continua en el borde. La de `CR` tiene un escalón de d/4 en q = 1, que en West Crater sería una pared de 4 m. Los cráteres existentes no se tocan.
- Verificado en una copia del juego: `npm run build` compila, `tests/sim.test.mjs` pasa 14/14 y la caminata (`?phase=eva&sub=walk`) carga sin errores. El jugador baja a y = −0,90 en el centro de Little West, frente a +2,10 antes. LM, patas, bandera, cámara de TV, caja de muestras, PSEP, LRRR, SWC y herramientas tienen **Δ altura = 0,000 m**.
- Si el jugador aterriza en el borde este del pad (x = 226), el borde de Little West queda a unos 16 m del LM. No afecta a ningún prop, pero se ve cerca.
- Little West cae fuera del tile de detalle (±48 m), sobre la malla procedural, así que se ve como un cuenco suave, y se nota la costura del tile en su borde oeste. Si quieres más detalle, sube `P.half` en `lunarPatch` (cuesta más tris).

## 3. lunar-layout.json (opcional)

Posiciones **reales** de Tranquility Base respecto al LM (este/norte en metros y en ejes del juego), con fuente y nivel de confianza, junto a `game_now_rel`, que es donde las pone hoy el juego. Ejemplos:

| id | real (x, z) relativo al LM | hoy en el juego | confianza |
|---|---|---|---|
| psep | (−0,3, −28,5), 28 m al sur | (15, 6) | alta |
| lrrr | (6,4, −23,9) | (12,5, 9) | alta |
| flag | (6,5, 2,7) | (2,5, 12,5) | media |
| swc | (1,9, 4,6) | (−3, 8) | media |
| tv-camera | (7,7, 9,2) | (−7, 14) | baja |

Tú decides si mueves los pivotes. `easep.js` mueve pivotes por nombre; no toques `easep-props.glb`.

## 4. guardian.glb (No Canon)

- Origen en el suelo, entre las 4 patas, con el frente hacia +Z. Mide ~15 m de alto (13,2 × 15,4 × 12,7 m en three.js).
- 20 huesos en 1 skin: root, hips, spine-1/2/3, neck, head, core, upper-arm/forearm/hand-l/r, thigh/shin/foot-l/r. Máximo 4 pesos por vértice, normalizados.
- Clips: `idle` (3,5 s, en bucle), `sweep` (2,5 s) y `slam` (2,5 s). Todos empiezan y terminan en la pose de idle.
- **Ventanas de los ataques** (medidas en three.js): `sweep` = aviso 0–0,8 s (sube el brazo derecho por su derecha), golpe activo 0,8–1,5 s (puño a 0,8–1,2 m del suelo, a 8–9,5 m del centro del Guardián, por delante y a su derecha), vuelta 1,5–2,5 s. `slam` = aviso 0–0,97 s (brazos arriba a ~21 m), impacto 1,2333 s con los puños en (±3,7; 0; +6,6) locales, puños en el suelo hasta ~1,47 s y rodillas bajas (placas de rodilla a 1,7–4,0 m) hasta ~1,7 s: es la ventana para golpear las placas de rodilla.
- **Segundo de impacto del slam: 1,2333 s** (frame 37 a 30 fps). Úsalo para el temblor de cámara, el polvo y el daño.
- **Piezas rígidas colgadas de huesos**, sin skin: `plate-shoulder-l/r` (de `upper-arm-l/r`), `plate-knee-l/r` (de `shin-l/r`), `core-dsky` (de `core`), `fuel-tank` (de `spine-2`) y los jirones `kapton-upper-*` y `kapton-forearm-*`. Se pueden ocultar o soltar por nombre con `getObjectByName(...)`, por ejemplo al romper las placas. Para soltar una pieza sin que salte, usa `scene.attach(obj)`, que conserva la transformación mundial.
- El núcleo pulsa por la escala del hueso `core` (1,00–1,07, y 1,12 en el impacto). Para dar más brillo, anima `material.emissiveIntensity` de `core-dsky` (ejemplo en `prueba-escena/src/main.js`).
- Usa `SkeletonUtils.clone` si instancias más de uno.
- **Hay que ponerle el envMap de la Luna a todos sus materiales**, como hace `propEnv` en `eva.js` (`m.envMap = W.env; m.envMapIntensity = 0.45–0.55`). El juego no usa `scene.environment`: sin ese recorrido el lado en sombra del Guardián (y los metales de eva-tools y memorial-kit) se ve casi negro.
- **Cámara:** con la cámara de la EVA (5,2 m detrás, cabeceo 0,32, FOV 55) solo se ven las piernas del Guardián. Para la pelea usa una cámara de jefe: ~15 m detrás del jugador, cabeceo ~0,22, FOV 60, mirando a un punto entre el jugador y el núcleo.
- **Luz:** con el sol del juego (desde −x, 12°) el borde de la arena deja a la sombra casi todo el suelo y la cara del Guardián. Gira la arena −90° en Y (`arena.rotation.y = -Math.PI / 2`, y coloca Guardián y jugador con los spawns ya girados) para que el sol entre por detrás del jugador.
- QA: la cabeza se subió para que se lea desde 3/4. Los pies resbalan como máximo 5 mm y se hunden como máximo 5 mm en los 3 clips.

## 5. boss-arena.glb

- Origen en el centro del suelo, a altura 0. El suelo mide ~61 m de diámetro y el borde llega a 83 m. El borde es más bajo al sur, que es la entrada.
- Nodos: `arena-floor`, `rim-1` … `rim-8` (rim-1 al norte = −Z, en sentido horario visto desde arriba), `boulder-1` … `boulder-5`.
- **Spawns:** `spawn-player` está en (0; 0,52; 24) mirando al norte (−Z), hacia el Guardián. `spawn-guardian` está en (0; 0,03; −10) mirando al sur (+Z), hacia el jugador; su zona está aplanada en un radio de 8,5 m.
  Coloca así: `spawn.getWorldPosition(obj.position); spawn.getWorldQuaternion(obj.quaternion);`
- **No hay malla de colisión.** Para el suelo, haz un raycast hacia abajo contra `arena-floor` (o contra todo el glb) para sacar la altura del jugador. Para no salir de la arena, limita el radio a unos 29 m desde el centro. El borde es una pared de 55–70° y 5–13 m de alto. Por fuera, el borde baja hasta −1 m en r = 41,5 m y ahí termina la malla: si el jugador sube o salta por encima, vería el vacío, así que conviene limitarlo o poner la arena sobre terreno.
- Las rocas son mallas aparte: dales colisión simple de esfera o cilindro si hace falta.
- QA: no hay grietas entre el suelo y el borde. El suelo se mete por debajo del borde, comprobado con unos 460.000 rayos en three.js. La franja oscura de los renders es sombra.

## 6. eva-tools.glb, memorial-kit.glb y o2-hose.glb

- **eva-tools:** `geo-hammer`, `core-tube-1`, `core-tube-2`, `hasselblad` y `lec-pulley`. El pivote de cada nodo es el punto de agarre y la malla está en el hijo `*-geo`, así que para ponerlo en la mano del astronauta puedes hacer `hand.add(nodo)` y ajustar solo la rotación.
- **memorial-kit:** `apollo1-patch` (textura WebP de 512 px, diseño propio), `medal-gagarin`, `medal-komarov`, `silicon-disc` (3,8 cm) y `olive-branch`. Todos tienen el origen en la base y están a escala real.
- **o2-hose:** armadura `o2-hose` con 6 huesos en cadena (`hose-0` en z = 0 hasta `hose-5` en z = 1,67; la manguera mide 2,04 m) y la malla `o2-hose-geo`. Tiene el clip `flex` (2 s, en bucle). Si la quieres conducir por código, rota los huesos `hose-1` … `hose-5`; cada uno dobla todo lo que hay después de él.

## 7. Cómo se cargan (igual que el resto del juego)

`GLTFLoader` + `setMeshoptDecoder(MeshoptDecoder)`, es decir, lo mismo que hacen hoy `model('nombre')` y `modelAnim('nombre')`. La escena de `prueba-escena/` es un ejemplo mínimo que funciona con los 5 modelos.
