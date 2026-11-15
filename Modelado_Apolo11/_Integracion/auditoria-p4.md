# Auditoría independiente · Persona 4 (Luna)

Sábado 14/11/2026, 20:00–20:30 (hora de Bolivia). Todo se verificó desde cero: no usé los informes anteriores como prueba.
Material de trabajo en `/workspace/audit-p4/`: scripts, logs, respaldos y capturas. Las capturas clave están copiadas en `_Integracion/capturas-p4-auditoria/`.

## Veredicto

Los 5 glb de la P4 existen, cumplen el plan en nombres, nodos, clips, medidas y presupuestos, cargan en three.js 0.187 y pasan el validador con 0 avisos. Los hashes protegidos están intactos. El parche de cráteres se aplica limpio sobre el `lander.js` original (CRLF incluido), compila, y `npm test` da exactamente el mismo resultado que el juego sin parche. El paquete funciona desde zips limpios, sin errores de consola.

Encontré y corregí un defecto de jugabilidad: **el `sweep` del Guardián pasaba por encima de un astronauta de pie**. También corregí dos pasos rotos de `VALIDAR.md`.

Lo que falta no es de modelado. Es integración y diseño:
- la cámara de jefe;
- la luz de la arena;
- el envMap en los materiales nuevos;
- el montaje lunar en el código, que hoy solo existe como JSON;
- el código del combate.

## A) Cumplimiento del plan

| Asset (plan) | Archivo | Estado | Problemas / diferencias | Gravedad |
|---|---|---|---|---|
| ENV_Luna_Tranquilidad: Little West + borde de West Crater | `moon-surface-height-a11.json` + `raw/lander-craters-a11.patch.js/.diff` | OK (con desvío justificado) | El juego **no lee** `moon-surface-height.json` (solo trae size/min/max/res), así que el cambio real es el parche de 2 líneas en `ground()`. Little West: Ø33 m, ~3,3 m efectivos de borde a fondo (el terreno local tenía una loma de +2,1 m), 60 m al E. El tile de detalle (±48 m del LM) corta el borde oeste del cráter en x≈196, así que se ve la costura, y el resto es malla procedural de 5 m: se lee como un cuenco suave (captura `eva-borde-little-west.png`). West Crater: Ø180 m y 20 m de profundidad, a 400 m al E y z = 0. | Media (visual) |
| PROP_Herramientas | `eva-tools.glb` | OK | Nodos geo-hammer (0,41 m, 252 tris), core-tube-1/2 (0,415 m, 296), hasselblad (0,21 m, 512, pivote en el agarre), lec-pulley (0,65 m, 372). Todos dentro de 200–600 tris. Pivote = agarre, malla en `*-geo`. Las tapas azul/roja de los tubos son una licencia (los tubos reales eran de aluminio sin tapas de color llamativas). La «LEC» se lee como pinzas y no como polea con cinta (ver C). | Baja |
| PROP_Recuerdos | `memorial-kit.glb` | OK | Los 5 nodos están a escala real: parche Ø10 cm con textura WebP 512 de diseño propio («APOLLO 1 · GRISSOM WHITE CHAFFEE»), medallas de 3,5 cm, disco de silicio Ø3,8 cm con aro de aluminio y rama dorada de 11,4 cm. Las medallas son genéricas (estrella), no reproducen las soviéticas reales. Es aceptable a esta escala. | Baja |
| PROP_Manguera_O2 (No Canon) | `o2-hose.glb` | OK | 2,04 m, 6 huesos en cadena, máx. 2 pesos, clip `flex` de 2 s en bucle exacto (la punta se mueve ±0,44 m). | — |
| MON_Guardian (No Canon) | `guardian.glb` | OK tras corrección | 15,44 m de alto, 5.879 tris (rango 4–6k), 20 huesos, ≤4 pesos normalizados (0 fuera de norma), 3 clips que empiezan y terminan en idle (error 0,6 mm), pies que no deslizan (≤4 mm en idle y sweep, 12 mm en slam), impacto en 1,2333 s confirmado (las manos bajan de 21,2 m a 1,5 m justo en 1,233 s). Están los nodos de las 4 placas, `core-dsky` («1202» con V05 N09, fiel a la alarma real), `fuel-tank` y 10 jirones de Kapton. **Defecto corregido:** el `sweep` no tocaba a un jugador de 2 m (ver «Lo que corregí»). El plan dice «coloso encorvado»: está más erguido que encorvado, tipo gorila (es una opinión). | Alta → corregida |
| ENV_Guardian_Arena (No Canon) | `boss-arena.glb` | OK | Suelo Ø61 m, borde en 8 trozos (hasta Ø83, 5–13 m de alto), 5 rocas, `spawn-player` (0; 0,52; 24) y `spawn-guardian` (0; 0,03; −10). Sin malla de colisión. Con el sol del juego, el borde deja a la sombra la mayor parte del suelo y la cara del Guardián (ver D). | Media (integración) |
| FX_Meshes (opcional) | — | No entregado | `fx.js` ya genera los efectos por código. Es aceptable. | Baja |
| PROP_LRRR: nodo `lrrr-level` para el evento oculto (dueño P4) | — | **Falta** | El plan dice que «basta un nodo». Se puede crear en código sin tocar `easep-props.glb`: `const l = new THREE.Object3D(); l.name = 'lrrr-level'; node('LRRR').add(l)`. | Baja |
| ✋ Montaje lunar con la P2 (posiciones reales de LM, bandera, PSEP, LRRR y TV en el código) | `lunar-layout.json` | **Solo datos, no hay código** | Ver la tabla siguiente. Es tarea compartida con la P2 y nadie la ha implementado. | Media |

### Montaje lunar: real frente a lo que hace hoy el juego

Ejes del juego en la Luna: +x = oeste, +z = norte. Lo confirmé con el descenso 2.5D, que avanza hacia +x, y con el sol, que llega desde −x (este). Las posiciones son relativas al LM, en metros, como (x oeste, z norte).

| Objeto | Real (layout) | Hoy en el juego | Comentario |
|---|---|---|---|
| PSEP | (−0,3; −28,5), 28 m al S | (15; 6) | Coincide con LROC y la fotogrametría del ALSJ (PSE a ~24–28 m al sur). El juego lo pone al ONO. |
| LRRR | (6,4; −23,9) | (12,5; 9) | Igual: real al S-SO. |
| Bandera | (6,5; 2,7), ~7 m al ONO | zona en (2,5; 12,5) | Confianza media. |
| Cámara TV | (7,7; 9,2), 12 m, confianza «baja» | (−7; 14), al ENE | **El layout se contradice con su propia fuente.** El ALSJ dice que el LRRR quedó a 40 m de la cámara y el PSEP 7,5 m más allá en casi el mismo azimut. Con la cámara a 12 m al NO, la distancia al LRRR sale 33 m. Una cámara a ~18 m al N-NO (≈ x +5, z +17) da 41 m al LRRR y 46 m al PSEP, que es coherente. Recomiendo corregir este punto. |
| Little West | 60 m al E | — | Correcto (ALSJ 60 m; LROC 50–60 m). Mide 40 m de diámetro según LROC y ~33 m según NASA. |

### West Crater al este: la decisión es **correcta**

Lo verifiqué con varias fuentes:
- **LROC**: «the LM … 500 m (1,640 feet) farther west» de West Crater.
- **Wikipedia (IAU)**: West está al este de Tranquility Base, a ~550 m.
- **Medición LROC**: el LM está 564 m al oeste y 113 m al norte del centro del cráter (≈575 m), y Little West quedó entre ambos.

El plan («~400 m al oeste») se equivoca de lado. La **distancia** de 400 m sale del registro de 1969 (Mission Report/PSR), pero la medición moderna da ~550–575 m, con el centro desplazado ~113 m al sur. La profundidad del registro es ~30 m (se usaron 20 m).

Esto queda como decisión, no como error. Con `[PAD.x − 6 − 564, −113, 90, 20]` sería más fiel, pero el cráter se aparta de la línea del descenso 2.5D (z = 0), que hoy sí lo sobrevuela, igual que Armstrong. Fuentes: lroc.im-ldi.com/images/1115, lroc.im-ldi.com/visit/exhibits/2/gallery/83, nasa.gov (LRO simulates view from LM), apollojournals.org/alsj/a11/a11LM2LWC.html.

## B) Técnico

- **Validador** (`_Compartido/validar_glb.mjs`, reglas propias hechas desde el plan): 5 archivos, 0 avisos, meshopt sí, texturas ≤512 px, >4 pesos = 0, pesos no normalizados = 0. Reglas 1–10 cumplidas, nombres en kebab-case.
- **Carga en three.js 0.187** (GLTFLoader + MeshoptDecoder, en Node y en Chrome): todos los nodos del plan presentes. La caja del validador para el Guardián (13,2 × 16,4 × 9,6) es incorrecta porque no sigue las mallas hijas de huesos. La real es 13,19 × 15,44 × 12,71 (−6,55…6,64; 0…15,44; −5,56…7,15), con origen en el suelo entre las patas y frente hacia +Z.
- **Presupuestos:** P4 total = 0,47 MB (eva 0,027 · kit 0,048 · manguera 0,018 · guardián 0,285 · arena 0,091). Draw calls por glb: 16 · 7 · 3 · 19 · 14. Escena de jefe completa (arena + Guardián + astronauta A7L, con sombras): ~85 draw calls y ~124k tris en pantalla, de los que el A7L LOD0 es la mayor parte. EVA con eva-tools + kit: +23 draw calls y +3,7k tris. Todo holgado.
- **Hashes protegidos:** `astronaut-a7l.glb` 4b772a34… y `easep-props.glb` 6f2e942e… son idénticos a los de `tests/assets.test.mjs`, tanto en el juego como en las copias. Las 4 copias de cada glb P4 (P4_Luna, entrega, visor, prueba) eran idénticas antes y después del cambio.
- **Parche de cráteres:** `patch` sobre una copia limpia del juego aplica sin conflictos, conserva CRLF (64/64 líneas) y queda idéntico a `game-p4test`. `npm test`, archivo por archivo, en el original y en el parcheado da **resultados idénticos**: 14 PASS y 3 FAIL. Los 3 fallos son los mismos en ambos y por falta de archivos en la copia del box, no por el parche: `static-root` (falta `server/paths.js`), `audio-layers` (falta `public/licenses.txt`) y `horizon-dock-cue` (falta el mp3). `npm run build` compila. El cambio de altura es Δ = 0,000 m en LM, sitio de muestra, zona de bandera, TV, caja, golf y PSEP/LRRR (tanto en la posición actual como en la real), y es 0 en todo el radio de 30 m del LM. La pendiente del LM no cambia.
- **Riesgo menor del parche:** si el jugador aterriza en x ≈ 175–200 (≥45 m antes del pad), el LM queda dentro o en el borde de Little West, con pendiente de hasta ~26°. `judge()` lo cuenta como `slope` (hard/crash). Es coherente con la historia, pero conviene saberlo.

## C) Diseño visual y fidelidad

Las capturas son mías, en Chrome headless con la iluminación exacta de `moonsurface.js`: hemisferio 0,38, sol 4,8 desde (−0,95; 0,205; 0,18) a ~12°, earthshine 0,28, luz de contorno 1,25, AgX 1,02 y `lunarEnv()` replicado. Están en `_Integracion/capturas-p4-auditoria/`.

- **Guardián:** se lee como coloso. La cabeza parece un casco con el visor negro, que hace eco del astronauta y funciona bien. El DSKY «1202» se lee perfecto desde la cámara de jefe. Las placas de basalto oscuras contrastan y el Kapton dorado se lee bien. El facetado low-poly es visible de cerca, aceptable para el estilo. Desde 3/4, el DSKY parece una caja pegada al pecho con el borde separado (baja). **Sin envMap queda casi negro en su lado en sombra** (`guardian-34-noenv.png` frente a `guardian-34.png`): la P2 tiene que aplicar `W.env` como hace `propEnv`.
- **Herramientas:** el martillo es reconocible como martillo geológico, con cabeza de pico y cara plana. Los tubos son correctos de tamaño, con tapas de color inventadas. La Hasselblad 500EL tiene cuerpo plateado, objetivo y mango, sin el chasis/magazine diferenciado (baja). La polea LEC se lee como unas pinzas, porque le falta la cinta en lazo con gancho (baja). Los metales se ven grises oscuros sin envMap (`props-noenv.png`) y bien con él.
- **Kit de recuerdos** (`props-macro.png`): el parche es legible y original. Medallas, disco y rama son correctos de escala. En el juego miden 3–11 cm: necesitan primer plano o resaltado para verse.
- **Arena:** no encontré grietas en la unión suelo-borde, ni normales invertidas visibles, ni clipping. Con el sol del juego, el borde este proyecta sombra sobre ~60 % del suelo (`arena-top.png`, `player.png`).
- **Little West en el juego** (copia parcheada; el box no tiene `public/tex`, así que la parte procedural sale sin textura): se ve la costura del tile en x ≈ 196, que cae justo sobre el borde oeste del cráter, y el cuenco es poco legible.
- **Fidelidad del juego** (fuera de los assets P4, informativo): la pelota de golf de la EVA es un guiño del Apolo 14, no del 11. El mástil de la bandera se clava con «martillo», cuando en el Apolo 11 el martillo se usó para los tubos de núcleo.

## D) Jugabilidad

### Caminata lunar: dónde encaja cada asset

Hoy `eva.js` tiene: escalera → primer paso → muestra de contingencia (pinzas de `easep-props`) → bandera (3 golpes + barra) → saludo y foto (réseau) → ciencia opcional F (PSEP/SWC/LRRR). Los assets P4 aún no se usan. Propuesta, cada punto con un patrón que ya existe:

1. **Hasselblad** (`hasselblad`, pivote = agarre): en el modo foto, `ast` la lleva en el soporte del pecho (`chest.add(node)`) y el flash/réseau ya existe. Unos 20 min.
2. **Tubos de núcleo + martillo** (`core-tube-1/2`, `geo-hammer`): tarea opcional «Tubo de núcleo» junto al SWC. Reutiliza el minijuego de ritmo `hammer` y el texto `e.depth`, que ya existen. Históricamente Aldrin solo logró clavar 10–20 cm. Unos 45 min.
3. **Polea LEC** (`lec-pulley`): cierre de la EVA con «Sube las cajas de muestras»: mantener E junto a la escalera; la cinta se anima por código y la caja sube hasta `padTop`. Unos 40 min.
4. **Kit de recuerdos:** al final de la EVA, Aldrin dejó el paquete junto al LM («¿sacaste el paquete de la manga?»). Basta un prompt E en la base de la escalera que coloque `memorial-kit` en el suelo con un primer plano. Unos 30 min.
5. **Little West:** objetivo opcional «Corre a Little West», 60 m al E, ~35 s a 1,9 m/s, para hacer una foto del cráter. Hace falta el parche y, para que se vea, mover o ampliar el tile (`lunarPatch`) hacia −x. Unos 30–60 min.
6. **Montaje real:** mover los pivotes PSEP/LRRR/SWC (`easep.js`, sin tocar el glb), la zona de la bandera y `camTV` según `lunar-layout.json`, con la cámara TV corregida a ~18 m al N-NO. Unos 45 min.

### Pelea No Canon (sueño): lo que permiten los nodos y clips

Datos medidos en three.js tras el cambio:
- **Escala frente a la cámara:** con la cámara actual de la EVA (5,2 m, cabeceo 0,32, FOV 55) solo se ven las piernas, incluso desde el spawn a 34 m (`player.png`). Hace falta una **cámara de jefe**: ~15 m detrás, cabeceo ~0,22, FOV 60, apuntando a `lerp(jugador + 1,3 m; core-dsky; 0,35)`, con el yaw fijado hacia el Guardián (`boss-cam-sunrot.png`).
- **Luz:** con el sol del juego, el Guardián y el carril del jugador quedan a la sombra del borde. Girando la arena −90° en Y, el sol entra por detrás del jugador y el Guardián queda iluminado de frente (comparar `boss-cam.png` con `boss-cam-sunrot.png`).
- **Espacio:** el suelo útil tiene r ≤ 29 m. El Guardián ocupa ~13 × 13 m alrededor de (0; −10), el spawn del jugador está a 34 m y el paso es de 1,9 m/s (18 s para cruzar). Usar el `run`/`bunny-hop` del A7L o subir `vmax` a ~3 m/s en el combate.
- **Telegrafía:**
  - `slam`: brazos arriba en 0–0,97 s (hasta 21 m, muy visible) e impacto en 1,2333 s con los puños en (±3,7; 0; +6,6) locales. Los puños siguen en el suelo hasta ~1,47 s y las **rodillas bajan**: las placas de rodilla quedan a 1,7–4,0 m entre 1,23 y 1,7 s, que es la **ventana de ataque cuerpo a cuerpo**.
  - `sweep` (corregido): aviso 0–0,8 s (sube el brazo derecho por su derecha), golpe 0,8–1,5 s a 0,8–1,2 m del suelo, en un arco por delante y a la derecha a 8–9,5 m del centro (x local −7,6 → +1,4), y vuelta en 1,5–2,5 s. Se esquiva **saltando** (el salto del juego sube 1,93 m y dura 3,1 s) o pasando a su izquierda o por detrás.
- **No hay clip de caminar ni de girar:** el Guardián es una «torreta». Puede girar por código hacia el jugador solo en `idle` (≤20°/s, para que no se note el patinaje de pies).
- **Colisión:** sin malla. Hay que poner cilindros: cuerpo r 3,5 m en (0; −10), patas y puños r 1,3 m siguiendo `foot-*`/`hand-*`, rocas como esferas, y limitar a r ≤ 29 m.

### Diseño de combate propuesto («Guardián de Tranquilidad», ~2–3 min)

Usa exactamente `idle`, `sweep`, `slam`, `plate-knee-l/r`, `plate-shoulder-l/r`, `core-dsky`, `fuel-tank` y `kapton-*`.

- **Temporizador = combustible.** El brillo de la banda de `fuel-tank` marca el tiempo de la pelea (p. ej. 150 s). CAPCOM avisa «60 segundos» y «30 segundos», como en el descenso real. Si llega a 0, el jugador «despierta» con un fallo suave.
- **Fase 1 · Rodillas** (2 placas, 3 golpes cada una): ciclo IA `idle` (1,5–3 s) → `slam` o `sweep`. Tras el impacto del `slam`, entre 1,27 y 1,7 s, el jugador golpea con el **martillo** (`geo-hammer` en `ast.handR`) la placa de rodilla más cercana (≤2,5 m del centro de la placa). Al tercer golpe, `scene.attach(placa)`, la placa cae con g = 1,62 y se levanta polvo con `puff`. Daño del slam: anillo de choque desde cada puño, radio 0→7 m en 0,4 s, que solo daña al jugador si está en el suelo. Daño del sweep: cápsula `forearm-r`→`hand-r` de radio 1,2 m, activa de 0,8 a 1,5 s.
- **Fase 2 · Hombros** (inalcanzables, a 10–14 m): se rompen con **fotos**. Se reutiliza la puntuación de encuadre de `takePhoto()` (proyección del centro de la placa, `|p| < 0,35` y distancia < 25 m): dos fotos buenas por placa, con el flash de la **Hasselblad**. Al romperse cada placa caen también sus `kapton-upper-*`. El Guardián alterna `sweep` más seguido.
- **Fase 3 · Núcleo «1202»:** sin placas, cada `slam` deja `core-dsky` a 5,9–9 m durante ~0,5 s. El remate es la decisión de Bales: aparece «1202 — ¿GO / ABORT?» con 10 s de cuenta atrás (como el MOCR real). Si eligen GO justo en la ventana del núcleo bajo, `emissiveIntensity` → 0, la textura cambia a «GO» si se agrega, y el Guardián se disuelve con partículas. ABORT reinicia la fase. Opcional: plantar la bandera en el cráter como remate visual.
- **Manguera O2:** atadura visual del PLSS al LM en la entrada de la arena. Si te alcanza el `sweep`, reproduce `flex` y el O2 baja más rápido.

### Qué debe escribir la P2 (estimación)

| Tarea | Est. |
|---|---|
| Escena `boss.js`: cargar arena girada −90°, Guardián y A7L en los spawns, envMap en todos los materiales, sombras | 45 min |
| Cámara de jefe (lock-on, distancia/FOV) + límite r ≤ 29 m + raycast de suelo contra `arena-floor` + colisiones de cilindro | 60 min |
| IA por ciclos (idle → sweep/slam), giro en idle, hitboxes con las ventanas de arriba, anillo de choque, temblor de cámara en 1,2333 s | 75 min |
| Fases: daño de placas, desprendimiento (`scene.attach` + caída), fotos a hombros (reutilizar `takePhoto`), QTE GO/ABORT y temporizador del `fuel-tank` | 90 min |
| Integración en la caminata: Hasselblad, tubos + martillo, LEC, kit de recuerdos, montaje según el layout, objetivo Little West | 2–3 h (recortable) |

## E) Paquete

Descomprimí los dos zips en una carpeta limpia (71 + 40 archivos, CRC OK). Corrí `npm i` en `visor` (36 paquetes) y en `prueba-escena` (16), y levanté ambos con Vite: tuve que usar los puertos 5210/5211, porque el auditor de la P3 usaba otros; los de Alex son 5190/5194. En Chrome headless hice clic en los 17 botones de la arena, los 16 de props y los 7 del visor: **0 errores de consola, 0 respuestas 4xx/5xx**, 0 textos en `#err`, y el visor muestra los 5 glb «Sin avisos». El validador por línea de comandos de `_Compartido` también da 5 archivos y 0 avisos.

Pasos rotos o confusos que encontré siguiendo `VALIDAR.md` al pie de la letra:
1. **«Node.js 18 o superior»:** Vite 8.3.5 exige Node ^20.19 o ≥22.12, así que con Node 18 `npm run dev` no arranca. **Corregido** en la P4. La guía de la **P3** dice lo mismo y hay que corregirla igual (no la toqué).
2. **«entra a la caminata»** no decía cómo. **Corregido:** `http://localhost:5173/?phase=eva&sub=walk` (solo con `npm run dev`).
3. Avisos menores: la P3 y la P4 usan el mismo puerto 5190 (está avisado). `juego-eva-desde-lm-antes-vs-despues.png`, que el paso 3 cita, está en el zip de previews (`previews-completas/`), no en `previews/`. Las capturas de `previews-completas/guardian-three/` muestran el sweep anterior.

## Lo que corregí

1. **guardian.glb, clip `sweep` bajo.** En `raw/guardian.py` cambiaron 3 alturas Z de `sweep_keys` (4,2→3,4; 3,4→2,0; 4,2→2,3).
   - **Antes:** el punto más bajo del brazo en la fase activa estaba a 2,25–3,0 m (`sweep-side.png`, `sweep-34-original.png`).
   - **Ahora:** está a 0,8–1,2 m entre 1,0 y 1,5 s (`sweep-34-nuevo.png`, `pkg-sweep-nuevo-lado.png`).
   - **Verificación:** antes de cambiar nada recompilé el script original y reproduce el glb entregado (huesos idénticos, 0,0000 m). Con el cambio, `idle` y `slam` siguen idénticos hueso por hueso, el impacto queda en 1,2333 s, son 5.879 tris y 20 huesos, nada atraviesa el suelo (mínimo −4 mm, igual que antes), el bucle cierra (0,6 mm), el validador da 0 avisos y la escena de prueba del paquete corre sin errores.
   - **Compresión:** regla 7 + `--resample false`.
   - **Dónde se copió:** `P4_Luna/glb`, `raw/guardian-raw.glb`, `raw/guardian.py`, `blend/guardian-v01.blend`, `entrega-p4/glb`, `visor/modelos/p4`, `prueba-escena/public/models` y `game-p4boss/public/models`.
   - **Respaldo de lo anterior:** `/workspace/audit-p4/backup/`.
2. `entrega-p4/VALIDAR.md`: versión de Node, URL de la caminata y el texto del sweep.
3. `entrega-p4/NOTAS-COMPANERO.md`: ventanas de ataque medidas, envMap obligatorio (la nota anterior decía `scene.environment`, que el juego no usa), cámara de jefe y giro de la arena.
4. `INFORME.md` (P4_Luna y entrega): sección de la auditoría. `capturas/06-sweep.png` se reemplazó por el sweep nuevo.
5. Reconstruí `entrega-p4-principal.zip` (72 archivos, 15,7 MB, ahora con `AUDITORIA.md`). `entrega-p4-previews.zip` no cambió (14,5 MB).

No toqué el juego original, `astronaut-a7l.glb`, `easep-props.glb` ni nada de P3_Tierra. Por un descuido mío, mientras probaba se crearon las cachés `node_modules/.vite` y `.vite-temp` dentro de `game/` (por un enlace simbólico). Ya las borré: el juego quedó como estaba.

## Pendientes priorizados

| # | Pendiente | Quién | Est. |
|---|---|---|---|
| 1 | Cámara de jefe + envMap en materiales nuevos + arena girada −90° (sin esto la pelea no se lee) | P2 | 1,5 h |
| 2 | Código del combate (IA, hitboxes, fases, QTE 1202) según el diseño de arriba | P2 (+P4 apoyo) | 3–4 h |
| 3 | Montaje lunar en código según `lunar-layout.json`; antes, corregir la cámara TV a ~18 m al N-NO | P2 + P4 | 1 h |
| 4 | Usar eva-tools / memorial-kit en la caminata (Hasselblad en el pecho, kit al final, LEC, tubos) | P2 | 2–3 h (recortable) |
| 5 | Little West legible: ampliar/desplazar el tile hacia −x o malla fina local; sin eso, la costura cae sobre el borde | P2 | 30–60 min |
| 6 | Nodo `lrrr-level` (en código) para el evento oculto | P2 | 10 min |
| 7 | Decidir la distancia de West Crater (400 m del registro de 1969 frente a ~575 m medidos por LROC, 113 m al S) | Equipo | 5 min |
| 8 | Corregir «Node 18» en el `VALIDAR.md` de la P3 | Quien mantenga la P3 | 2 min |
| 9 | Cosméticos: LEC con cinta en lazo, tapas de los tubos sin color, separación del DSKY desde 3/4 | P4 | 30–45 min |
