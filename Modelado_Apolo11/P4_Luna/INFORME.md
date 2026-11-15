# Persona 4 (Luna) — INFORME

Reglas: `_Compartido/REGLAS.md`. Compresión (regla 7): `raw/p4_compress.sh <nombre>` = `gltf-transform optimize … --compress meshopt --texture-compress webp --flatten false --join false --palette false --simplify false --prune false --instance false --texture-size 512`.
Ejes del juego en la Luna (deducidos del código y comprobados con el Apolo 11 real): **+x = oeste, +z = norte, y arriba**; LM nominal de la EVA en x = PAD.x − 6 = 244, z = 0.

## glb (una línea por archivo)

| glb | tris | tamaño (m) | MB | huesos | clips | nodos |
|---|---|---|---|---|---|---|
| eva-tools.glb | 1.728 (martillo 252 · tubo 296 ×2 · Hasselblad 512 · LEC 372) | martillo 0,41 · tubos 0,415 · Hasselblad 0,21 (lente→respaldo) · polea+cinta 0,65 | 0,027 | — | — | geo-hammer, core-tube-1, core-tube-2, hasselblad, lec-pulley (pivote = punto de agarre, malla en `*-geo`) |
| memorial-kit.glb | 2.012 (parche 124 · Gagarin 462 · Komarov 654 · disco 428 · rama 344) | parche Ø0,10 · medallas Ø0,035 · disco Ø0,038 (+aro 0,041) · rama 0,114 | 0,048 | — | — | apollo1-patch (textura WebP 512 px, diseño propio), medal-gagarin, medal-komarov, silicon-disc, olive-branch (origen en la base) |
| o2-hose.glb | 920 | 2,04 de largo · Ø0,05 en conectores | 0,018 | 6 (hose-0…hose-5, cadena) | flex (2 s, bucle) | o2-hose (armadura), o2-hose-geo; máx. 2 pesos por vértice, normalizados |

Verificación (sáb 14/11, ~19:30 Bolivia):
- `_Compartido/validar_glb.mjs` sobre los 3 glb: 0 avisos, meshopt sí, >4 pesos 0, pesos no normalizados 0 (`raw/validar-p4.md/json`).
- Carga real con three 0.187 GLTFLoader + MeshoptDecoder en Node (`raw/p4_verify.mjs`, salida `raw/p4_verify.out.json`): todos los nodos presentes tras comprimir, tamaños dentro de rango, manguera: 6 huesos en cadena, 3 primitivas con skin, bind pose exacta (error 0 en el raw; caja en reposo comprimido vs raw 0,1 mm), el clip `flex` mueve la punta hasta 0,49 m y cierra el bucle (error 0).
- Carga en navegador (Chrome headless + visor 5190) de los glb comprimidos, incluida la textura WebP del parche: sin errores (`previews/visor-*.png`).
- Renders Blender 1024 px revisados uno por uno: `previews/eva-tools.png`, `eva-tools-hasselblad.png`, `memorial-kit.png`, `memorial-kit-medallas.png`, `memorial-kit-rama-disco.png`, `o2-hose.png`, `o2-hose-flex.png`, `o2-hose-conector.png`.
- Fuentes de forma: fotos públicas NASA (AS11-40-5873 martillo, AS11-40-5964 tubos, S69-38846 Hasselblad 500EL, AS11-40-5868 LEC). Parche del Apolo 1 dibujado por nosotros con PIL (`raw/apollo1_patch_tex.py`), sin copiar imágenes.

## Terreno: Little West y West Crater

**Hallazgo:** `public/models/moon-surface-height.json` no lo lee ningún archivo del juego (solo trae `size_m, min_m, max_m, res` del tile de 32 m). El relieve que pisa el jugador es `ground(x,z)` de `src/sim/lander.js` (lista de cráteres `CR`) más el tile del artista (3×3 tiles = ±48 m alrededor del LM). Por eso:
- `moon-surface-height-a11.json`: las 4 claves originales **idénticas** + clave nueva `a11_craters` con los cráteres, la fórmula y las dos líneas JS.
- `raw/lander-craters-a11.patch.js` y `raw/lander-craters-a11.diff`: 2 líneas para que la P2 pegue en `src/sim/lander.js` (`const CR_A11 = [[PAD.x - 66, 0, 16.5, 4], [PAD.x - 406, 0, 90, 20]];` + un `for` dentro de `ground()`). Generado por `raw/craters_a11.py` (`--apply` solo en copias; conserva CRLF).
- Little West: Ø33 m, 4 m de borde a fondo (borde +1 m, fondo −3 m), centro a **60 m al ESTE** del LM (x = 184). West Crater: Ø180 m, 20 m de borde a fondo (borde +5 m), centro a **400 m al ESTE** (x = −156), dentro del mapa (x de −1100 a 900).
- **Corrección al plan:** el plan dice "West Crater ~400 m al oeste". Las fuentes lo ponen al **este** (en dirección contraria al avance del descenso): Armstrong lo sobrevoló y se posó ~500 m más allá, hacia el oeste. Se puso al este; para seguir el plan al pie de la letra, `WEST_SIDE = +1` en el script.
- Fórmula nueva continua en el borde (la del juego tiene un escalón de d/4 en q = 1, que en West Crater sería una pared de 4 m). Los cráteres existentes no se tocan.
- Comprobado en la copia `/workspace/apolo11/game-p4test`: sim.test 14/14, build OK. Los demás tests dan lo mismo que sin el cambio (static-root, audio-layers y horizon-dock fallan solo porque la copia del box no trae `server/`, `licenses.txt` ni el audio). Alturas antes/después en LM, patas, bandera, cámara TV, sample-box, PSEP, LRRR, SWC y Tools: **Δ = 0,000 m**. Máx. |Δ| a ≤ 20 m del LM nominal: 0; pendiente del pad igual (0,05°). Si el jugador aterriza en el borde este del pad (x = 226), el borde de Little West queda a ~16 m del LM: ningún prop cambia, pero se ve cerca.
- Imágenes: `previews/terrain-hillshade-before.png`, `terrain-hillshade-after.png`, `terrain-little-west-zoom.png` (curvas de nivel con LM, bandera, TV, PSEP y LRRR), y capturas de la EVA real del juego (copia con texturas de regolito sustitutas, porque la copia del box no trae `public/tex`): `juego-eva-little-west-antes-vs-despues.png`, `juego-eva-desde-lm-antes-vs-despues.png`.
- Para la P2: Little West cae fuera del tile de detalle (±48 m), sobre la malla procedural (5 m por celda en calidad alta, 9 m en baja). Se ve como cuenco suave y se nota la costura del tile en su borde oeste. Si se quiere más detalle: subir `P.half` en `lunarPatch` (más tris) o agregar una malla fina local.
- Fuentes: ALSJ "Little West Crater" (https://www.nasa.gov/history/alsj/a11/a11EastCraterRIP.html), ALSJ aterrizaje (https://apollojournals.org/alsj/a11/a11.landing.html), LROC "What Armstrong Saw" (https://lroc.im-ldi.com/images/1115), LROC sitio Apolo 11 (https://lroc.im-ldi.com/images/484), NASA "Magnificent Desolation" (33 m y 4 m de Little West; https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11_eva_thumbs.html).

## lunar-layout.json (opcional, hecho)

Posiciones reales relativas al LM en metros este/norte y en ejes del juego, con fuente y confianza (`raw/lunar_layout.py`): PSEP 28,5 m al S (LROC), LRRR 24,8 m al S-SO (láser), bandera 7 m al ONO, SWC 5 m al NNO, cámara TV ~12 m al NO (confianza baja), cráter doble 7 m al OSO, Little West 60 m al E, West Crater 400 m al E. Incluye `game_now_rel` (dónde los pone hoy el juego: por ejemplo, el PSEP está 15 m al oeste y 6 m al norte, cuando el real está 28 m al sur). La P2 decide si mueve los pivotes (`easep.js` mueve pivotes con nombre; `easep-props.glb` no se modifica).

## Guardián y arena

Los hace otro proceso, en este mismo folder: `guardian.glb`, `boss-arena`. Su informe va abajo.

## Guardián + arena del jefe (No Canon) — P4-3 / P4-4

| glb | tris | tamaño (m, X×Y×Z glTF) | MB | huesos | clips (s) | notas |
|---|---|---|---|---|---|---|
| guardian.glb | 5.879 | 13,19 × 15,44 × 12,71 | 0,285 | 20 (1 skin) | idle 3,500 · sweep 2,500 · slam 2,500 | **impacto del slam: 1,2333 s** (frame 37 a 30 fps) |
| boss-arena.glb | 11.928 | 83 × 13,8 × 83 (suelo Ø 61, borde hasta Ø 83) | 0,091 | — | — | 1 material regolito + color de vértice |

**guardian.glb**: origen en el suelo entre las 4 patas, frente +Z. 1 textura WebP 512 px (`dsky-1202`, base + emisiva).
- Nodos: `guardian` (armature), `guardian-body` (malla con skin, 2 materiales: regolito y `cavidad`), `plate-shoulder-l/r` (hijas del hueso `upper-arm-l/r`), `plate-knee-l/r` (hijas de `shin-l/r`), `core-dsky` (hijo del hueso `core`), `fuel-tank` (hijo de `spine-2`), jirones `kapton-upper-*`, `kapton-forearm-*` (hijos de sus huesos). Placas, núcleo, depósito y jirones son rígidos (emparentados a hueso, sin skin): el código puede ocultarlos/soltarlos por nombre.
- Huesos (20): root, hips, spine-1, spine-2, spine-3, neck, head, core, upper-arm-l/r, forearm-l/r, hand-l/r, thigh-l/r, shin-l/r, foot-l/r. ≤4 pesos, normalizados (0 vértices fuera de norma).
- Clips: `idle` (respira, núcleo pulsa por escala del hueso `core` 1,00–1,07; bucle sin salto), `sweep` (barrido con el brazo derecho de derecha a izquierda por delante, 2,5 s, empieza y termina en la pose de idle), `slam` (se alza con ambos brazos a ~22 m y golpea; impacto 1,2333 s; núcleo se hincha a 1,12 justo en el golpe).
- Pies plantados (medido en three.js tras comprimir): deslizamiento ≤ 4 mm y penetración ≤ 5 mm en idle; los puños de apoyo igual en sweep/slam.
- Sugerencia código: pulso extra del núcleo con `material.emissiveIntensity` (ver game-p4boss/boss.js).

**boss-arena.glb**: origen en el centro del suelo (altura 0). Nodos `arena-floor`, `rim-1..rim-8` (rim-1 al norte = −Z, en sentido horario visto desde arriba), `boulder-1..5`, empties `spawn-player` (0, 0,52, 24) mirando al norte y `spawn-guardian` (0, 0,03, −10) mirando al sur (+Z, hacia el jugador). Zona del guardián aplanada (r 8,5 m). El borde es más bajo al sur (entrada). Nota: la cuantización meshopt mueve el origen de cada malla al centro de su caja (normal en todos los glb).

**Compresión**: regla 7 + `--resample false` (raw/compress_guardian_arena.sh). Sin esa bandera el remuestreo con pérdida movía 2–3 cm los pies/puños plantados.

**Verificación**: validar_glb.mjs con raw/reglas-p4.json → 0 avisos (raw/informe-guardian-arena.json/.md). Carga en Node con three GLTFLoader + MeshoptDecoder (raw/check_three.mjs → raw/check-guardian.json, raw/check-boss-arena.json). La caja de validar_glb para el guardián (13,2 × 16,4 × 9,6) no coincide con la real de three.js (13,19 × 15,44 × 12,71) porque el validador no sigue bien las mallas hijas de huesos; la de three.js es la que vale.
Escena three.js real: /workspace/apolo11/game-p4boss (puerto 5194, `?clip=idle|sweep|slam&cam=ground|front|side|top|close&t=seg`), capturas en previews/guardian-three/. Renders Blender en previews/guardian-blender/ (+ previews/guardian.png, previews/boss-arena.png).
Fuentes: raw/guardian.py, raw/dsky_tex.py, raw/boss_arena.py, raw/render_guardian.py, raw/render_arena.py; blend/guardian-v01.blend, blend/boss-arena-v01.blend. Diseño 100 % original.


## QA independiente (sáb 14/11, ~19:50 hora de Bolivia)

Revisado desde cero, sin confiar en los informes anteriores. Datos en `raw/validar-p4-qa.json/.md` (validador con `raw/reglas-p4-completo.json`, que cubre los 5 glb) y `raw/three-check-qa.json` (carga en three 0.187 con GLTFLoader + MeshoptDecoder).

| glb | tris | MB | nodos pedidos | huesos | ≤4 pesos / normalizados | clips | resultado |
|---|---|---|---|---|---|---|---|
| eva-tools | 1.728 (cada pieza 252–512) | 0,027 | 5/5 | — | — | — | OK |
| memorial-kit | 2.012 (cada pieza 124–654) | 0,048 | 5/5 | — | — | — | OK |
| o2-hose | 920 | 0,018 | o2-hose, o2-hose-geo | 6 (hose-0…5) | sí / sí | flex 2,0 s | OK |
| guardian | **5.879** (antes 6.179, fuera del rango 4–6k) | 0,285 | 7/7 + rígidas colgadas de huesos | 20 | sí / sí | idle 3,5 · sweep 2,5 · slam 2,5 | OK tras corrección |
| boss-arena | 11.928 | 0,091 | 16/16 (rim-1..8, boulder-1..5, spawns) | — | — | — | OK, sin cambios |

Correcciones:
- **Guardián, cabeza:** quedaba hundida entre los hombros y desde 3/4 casi no se veía. En `raw/guardian.py` se subió y adelantó (centro de (0, −4,1, 12,3) a (0, −4,6, 13,6), algo más grande), con el cuello, la ceja, la cavidad del rostro y los huesos `neck`/`head` movidos a juego. Además, el objetivo del decimado del cuerpo bajó de 5.200 a 4.900, y el total pasó de 6.179 a 5.879 tris. Rig (20 huesos), nombres, clips y segundo de impacto (1,2333 s) iguales. Re-exportado y comprimido con regla 7 + `--resample false`. Renders nuevos en `previews/guardian.png` y `previews/guardian-blender/`; capturas three.js en `previews/guardian-three/`.
- **Arena:** el «hueco negro» entre el suelo y el borde de `previews/boss-arena.png` era **sombra**, no una grieta. Comprobado en three.js con 59.400 rayos verticales (r ≤ 41 m, 0 fallos y 0 caras al revés), 404.880 rayos desde la altura de los ojos (1,7 m) hacia abajo, en todas las direcciones y desde todo el suelo (0 rayos al vacío) y perfiles radiales cada 45°: el suelo (r ≤ 30,5 m) se mete por debajo del borde, que empieza en r = 29,2 m, 0,1–0,35 m más bajo, y sube suave. No hay escalón ni grieta. No se tocó la geometría. `previews/boss-arena.png` se re-renderizó con el sol más alto (`SUN_X=35` en `raw/render_arena.py`) para que la sombra no parezca un hueco.
- Deformaciones de sweep/slam medidas en three.js (estiramiento de aristas frente a idle t=0): sin roturas. Con los brazos arriba (slam 0,7–0,9 s) la axila se estira, y en el codo interior se pliega (normal en skinning lineal), pero visualmente no se rompe.

## Auditoría independiente (sáb 14/11, ~20:20 hora de Bolivia)

Informe completo: `Modelado_Apolo11/_Integracion/auditoria-p4.md`. Cambios hechos en esta auditoría:
- **guardian.glb, clip `sweep` más bajo.** Antes, en la fase activa (0,8–1,5 s) el brazo pasaba a 2,3–3,0 m del suelo: no tocaba a un astronauta de 2 m. Ahora el puño barre a 0,8–1,2 m entre 1,0 y 1,5 s (baja desde 2,0 m a 0,8 s). Se esquiva saltando (el salto del juego sube 1,9 m) o saliendo del arco. Solo cambiaron 3 claves de `sweep_keys` en `raw/guardian.py`; `idle` y `slam` son idénticos hueso por hueso (diferencia 0,0000 m), el impacto sigue en 1,2333 s, 5.879 tris, 20 huesos, 0 avisos del validador, nada atraviesa el suelo. Respaldo del glb anterior en `/workspace/audit-p4/backup/`.
- `VALIDAR.md`: Node 20.19+ (Vite 8 no arranca con Node 18) y la URL directa a la caminata (`?phase=eva&sub=walk`).
