# Auditoría independiente — Persona 3 (Tierra)

Fecha: sábado 14/11/2026, 20:00–20:45 BOT (UTC−4). Auditor: subagente independiente (no se reutilizaron informes previos: todo se midió de nuevo).
Material: `P3_Tierra/glb` (15 glb), paquete `entrega-p3/` y zips, juego original `game/` (solo lectura) y copia `game-p3test/`.

## Resumen ejecutivo

- **Modelos: aptos.** Los 15 glb existen, cargan con three r187 GLTFLoader + MeshoptDecoder, cumplen el presupuesto (2,13 MB en total; el mayor pesa 0,174 MB) y tienen los nodos y clips que pide el plan. Los hashes protegidos siguen iguales (`astronaut-a7l` 4b772a34…, `easep-props` 6f2e942e…).
- **1 defecto visible corregido:** en `armstrong-house` el **sofá estaba girado 180°**: el respaldo daba a la TV y Rick quedaba metido dentro del respaldo. Se ve en `capturas/escena-casa.png` y `escena-casa-mark.png` del paquete anterior, y el QA previo no lo detectó.
- **Animación:** los bucles son perfectos (0 mm de salto). Pero `walk` **desliza los pies**: el pie apoyado va de 0 a 1,8 m/s dentro de la misma pisada. Con una velocidad de raíz constante es imposible que no patine.
- **Jugabilidad: el juego todavía no tiene ninguna escena de la Tierra.** `src/` solo tiene `prep, launch, cruise, descent, eva` (+ `debrief`), y nada carga `mocr-room`, `armstrong-house`, `lrl-room`, etc. El 1202 actual es un modal HTML con temporizador de **5 s** (`descent.js`). Las salas sirven como escenario, pero falta toda la integración: luces desde `extras`, poblar spots, cámaras y colisión.
- **Paquete:** funciona tal cual en una carpeta limpia (npm i + vite en visor y prueba-escena), sin errores de consola salvo el 404 del favicon. Se corrigieron 2 instrucciones confusas o erróneas de `VALIDAR.md` y del visor.

## A) Cumplimiento del plan v4 (P3)

| Asset (plan) | Prioridad | Archivo | Estado | Problemas | Gravedad |
|---|---|---|---|---|---|
| ENV_MOCR — sala ~20×15 m, 4 filas escalonadas, pantallas emisivas verdes, pizarra "TOUGH AND COMPETENT", ≤15k tris, consolas por instancias | Imprescindible | mocr-room.glb | ✅ Cumple | 20,1×5,0×15,1 m; 9.532 tris renderizados (1.412 únicos, 120 instancias); filas a +0,0/0,4/0,8/1,2 m; consolas por posición históricamente correctas (Trench: Booster/Retro/FIDO/GUIDO; fila 2: CAPCOM; fila 3: FLIGHT). Spots kranz/bales/duke/garman bien sentados en sus sillas (asiento ≈0,45–0,5 m). **Pendientes:** (1) solo 4 de ~44 sillas ocupadas, así que la sala se ve vacía (cap. 1202); (2) consolas de 1,5 m: desde la pared de pantallas apenas se ven las cabezas; (3) escalón de 0,4 m entre filas sin peldaños ni rampa; (4) la pantalla central muestra el mapamundi de la órbita terrestre, cuando en el aterrizaje se proyectaban gráficos de descenso del LM; (5) la pizarra "Tough and Competent" es de enero de 1967 (huevo de pascua, el plan la pide). | Importante (1), menor (2–5) |
| ENV_Casa_Armstrong — sala+cocina 1969, techo 2,5 m, tv-set, squawk-box, ≤12k | Imprescindible | armstrong-house.glb | ✅ Cumple (tras arreglo) | **Sofá girado 180° (CORREGIDO).** Techo 2,5 m, puertas de 0,90 m (frente) y 0,82 m (pasillo), altura 2,03 m. 3.450 tris renderizados. El squawk box tiene la rejilla arriba y los mandos hacia la ventana (menor). La ventana es de noche con luna, lo que encaja con la caminata (21:56 CDT) pero **no con el aterrizaje (15:17 CDT, de día)**. Pose `sit-sofa`/`sit-chair`: el código tiene que mapearlas a `sit`. | Bloqueante visual (corregido); importante (ventana) |
| ENV_Oceano_LRL (a) — océano 200×200 m con olas (clip waves) y balsa | Importante | pacific-recovery.glb | ✅ Cumple | `waves` 6 s en bucle exacto (Δ=0). `cm-spot` para cm-recovery de P2. Las 3 "boyas" no son históricas: eran bolsas de enderezamiento sobre el CM y había un marcador de tinte verde fluorescente en el agua. | Menor |
| ENV_Oceano_LRL (b) — sala de cuarentena, quarantine-glass, teléfono de pared | Importante | lrl-room.glb | ✅ Cumple | Vidrio de 4,4×1,3 m transparente, `phone-inside/outside` a 1,20 m, spots con `seat_height` y `target`. Familia sentada mirando al vidrio, verificado. | — |
| PROP_Tierra — toy-saturn-v 0,4 m, mission-patch, signed-envelopes, framed-photo, notebook, alarm-sheet, chalkboard | Importante | earth-props.glb | ✅ Cumple | Todos los nodos presentes, más rotary-phone y ashtray. La pizarra mide 1,8×0,9 m y es legible. | — |
| PER_MOCR_NPC — Kranz, Bales, Duke, Garman (variantes de base civil) | Imprescindible | kranz/bales/duke/garman.glb | ✅ Cumple | 25 huesos, ≤4 pesos, 7 clips, frente +Z, pies en el origen, altura 1,81–1,82 m. Identidad legible: flat-top y chaleco de Kranz, lentes gruesos y auriculares de Bales. Caras muy simples en primer plano. Cuello de camisa con dientes de sierra en Kranz. 9–29 triángulos con normal invertida por personaje (materiales DoubleSide, sin huecos). | Importante (caras en cinemáticas), menor (resto) |
| PER_Familia — Jan 1,65, Rick 1,50, Mark 1,15 | Importante | jan/rick/mark.glb | ✅ Cumple | Alturas medidas: 1,673 / 1,515 / 1,166 m. En `idle` los brazos quedan muy separados del cuerpo (pose A), lo que da un aire de maniquí. | Importante (visual) |
| civil-base (es de P1; P3 hizo uno temporal) | — | civil-base.glb | ✅ | Choca de nombre con el `civil-base.glb` de P1 al unificar: decidir cuál queda o renombrar el de P3 a `civil-base-p3`. | Importante (integración) |
| PER_Extras | Opcional | — | ❌ No hecho | Sala MOCR y casa vacías de extras: ni controladores de relleno ni vecinos/prensa en casa. Las fuentes dicen que la casa estaba llena de gente. | Importante para la escena 1202 |
| ENV_Hotel_1967 | Opcional | hotel-room-1967.glb | ✅ | Cama, teléfono y ventana; spots con pose. | — |
| ENV_Desfile_NY | Opcional | parade-street.glb | ✅ | 14.760 tris (dentro de lo razonable para un fondo), `confetti-fall` en bucle por repetición cada 12 m. Público en siluetas planas. | Menor |
| ENV_Pad39A (P3 lo «custodia») | Imprescindible | lc39a-*.glb, launch-tower.glb | ✅ Sin tocar | Solo verificar; el juego los usa en `pad.js`. | — |
| Láminas P3-1 (frente/perfil) | — | previews/*-face.png, *.png | ✅ | Hay láminas de 1024 px. | — |
| **Apoyo a la integración (Dom 12–17): NPCs en MOCR y casa, cinemáticas del prólogo y del cap. 1** | Plan §7 | — | ❌ No hecho | No existe código de escenas de la Tierra ni rieles de cámara para el prólogo o el cap. 1. | **Bloqueante para el juego** (compartido con P2) |

Reglas (`REGLAS.md`): kebab-case ✓ (solo `Armature` en los 8 personajes, que el código no busca); metros reales ✓; origen en la base ✓; +Z frente ✓ (iris en z=+0,08…+0,09); transformaciones ✓; compresión segura (regla 7) ✓ (meshopt 15/15, nodos y empties conservados); ≤1,5 MB ✓; estilo low-poly PBR con como mucho 1 WebP de 512 px ✓; sin emojis ni assets con copyright ✓ (mapa de Natural Earth, de dominio público). La regla 9 se cumple, salvo que `blend/armstrong-house-v01.blend` quedó desactualizado tras el arreglo (el script y el glb sí están al día).

## B) Técnico (medido con three r187 en node)

- Validador (`validar_glb.mjs --reglas reglas-p3.json`): 15/15 con meshopt y 0 errores; 8 avisos, todos por `Armature`. `gltf-transform validate` de la casa corregida: 0 errores y 0 avisos.
- Skin: 1 skin de 25 huesos `mixamorig:*` (en runtime `mixamorigHips`…), ≤4 influencias normalizadas, malla dividida en 8–14 SkinnedMesh por personaje (una por material).
- Clips: idle 4,03 s · walk 1,10 s · sit 4,03 s · sit-floor 4,03 s · talk 3,23 s · point 2,03 s · wave 2,03 s. **Bucles: 0 mm de diferencia entre el primer y el último fotograma** en los 8. point/wave empiezan y terminan a 31 mm del idle (transición imperceptible con crossfade de 0,2 s). La cadera no deriva (≤18 mm en walk).
- **walk:** pie izquierdo de Kranz (Foot/ToeBase). Contacto ~54 % del ciclo y paso de 0,54 m, lo que implica una velocidad media de 0,9–1,0 m/s (Mark ~0,45 m/s). Dentro de la pisada el pie apoyado va a 0,0 → 0,2 → 1,3 → 1,8 m/s, es decir, **no es constante y habrá patinaje visible** de unos 5–10 cm por paso a cualquier velocidad de raíz. La punta del pie baja hasta −0,3 cm y la suela hasta −2,9 cm (menor).
- sit: cadera a 0,55 m en adultos (asiento ≈0,45), 0,505 en Jan, 0,444 en Rick y 0,317 en Mark. sit-floor: cadera 0,09–0,15 m. Ambos sin deriva.
- Draw calls / tris renderizados / MB por escena (sala + NPC):
  - MOCR + 4 NPC: ≈147 draws, ≈27,5k tris, 0,79 MB.
  - Casa + Jan/Rick/Mark + Neil (civil): ≈105 draws, ≈20k tris, 0,73 MB.
  - LRL + 4: ≈70 draws, ≈19k tris, 0,67 MB.

  Todo esto va holgado en escritorio. En móvil se podría bajar unir materiales por personaje (8–14 → 1 con atlas).

## C) Diseño visual y fidelidad 1969

Capturas propias en Chrome headless (swiftshader) de las 8 pestañas y de cámaras de jugador a 1,6 m, más Blender (Workbench) de la casa en planta y del MOCR en perspectiva. Están en `/workspace/audit-p3/shots/` y la selección en `/workspace/auditoria-p3-capturas/`.

- **MOCR:** fiel en la disposición: 4 filas, Trench delante, Flight en el centro de la fila 3, CAPCOM a la derecha de la fila 2, consolas gris verdoso con CRT verdes y relojes de misión sobre las pantallas. Faltan la galería de visitantes con vidrio y controladores de relleno. El texto de las CRT y de los paneles laterales es legible a 3 m.
- **Casa El Lago:** madera, alfombra de círculos, cocina con electrodomésticos verde aguacate y calendario de julio de 1969, todo verosímil. El squawk box de la NASA es correcto según el testimonio de Rick y Mark Armstrong y collectSPACE. Neil en la cabecera del comedor también tiene base histórica: la noche antes de partir llamó a sus hijos a la mesa (CNN, 2021). Ventana de noche (ver A).
- **LRL:** vidrio, teléfonos y sillas correctos para la visita de las familias.
- **Pacífico:** balsa y mar correctos. Las boyas no son históricas y falta el tinte verde (menor).
- **Desfile NYC (13/8/1969, de día):** el «cañón» de Broadway es reconocible. El cielo lo pone el código.
- **Personajes:** escala y vestuario correctos (chaleco blanco de Kranz, lentes de Bales, 12 y 6 años de Rick y Mark). Las caras son muy esquemáticas (ojos de punto, nariz de lámina) y en idle los brazos quedan abiertos. Sirven a distancia media; en primeros planos de cinemática se verán toscos.
- Sin flotantes ni atravesados tras el arreglo del sofá. No vi z-fighting en las capturas. En three.js, con hemisférica + luces de `extras`, la iluminación es correcta; **sin las luces de `extras` (que el juego aún no crea) las salas se verían casi negras**, salvo las pantallas emisivas.

## D) Jugabilidad e integración

**Estado del código:** `mission.js` tiene `PHASES = ['prep','launch','cruise','descent','eva']`. No hay escenas de Houston, la casa, el LRL ni la recuperación, y ningún `model()`/`modelAnim()` pide un asset de P3. El 1202 vive en `descent.js → alarm1202()`: es un modal con barra de **5 s**, GO/ABORT y, en coop, `cc.ask('1202', …, 8)`. El guion pide «Bales decide en 10 s» desde el MOCR, y eso no existe.

**Mapa guion → asset → código necesario:**

| Momento | Assets | Qué debe hacer el código |
|---|---|---|
| Prólogo / noche antes (mesa) | armstrong-house + jan/rick/mark + Neil civil (P1) | `modelAnim` de cada personaje; colocar en `npc-spot-*` según `extras.pose` (`stand`→idle, `sit*`→sit, `sit-floor`→sit-floor); crear luces desde `light-*`; riel de cámara (`cutscenes/rails.js` ya existe: añadir cues con el ancla en la sala) |
| Cap. aterrizaje: familia escuchando | armstrong-house (`squawk-box`, `tv-set` con material `tv-screen`) | Audio posicional en `squawk-box`; cambiar `emissiveMap` de `tv-screen`; ventana de día (pendiente) |
| Cap. 1202 «Doce minutos» | mocr-room + kranz/bales/duke/garman | Cámara sobre Bales (spot -2,63/0/2,15) mirando su CRT (material `crt-screen-guido`: poner «1202» como `emissiveMap`/CanvasTexture); `talk`/`point` en Kranz y Duke; temporizador de 10 s enlazado a `alarm1202` (hoy 5 s) |
| Splashdown | pacific-recovery (`waves`, `cm-spot`) + cm-recovery (P2) | Colocar el CM en `cm-spot`; reproducir `waves`; cielo y niebla en código |
| Cuarentena | lrl-room + familia + Neil civil | Spots ya llevan `seat_height`/`target`/`phone`; interacción «descolgar» en `phone-outside` |
| Opcionales | hotel-room-1967, parade-street | Fundidos o planos de 2–3 s |

**Nombres que el código debe buscar:**
- Salas: `npc-spot-*`, `light-*` (`extras.light` = point / rect-area / directional), `door-main`, `door-front` y `door-hall` (giran en Y desde la bisagra).
- Objetos: `tv-set` (material `tv-screen`), `squawk-box`, `rotary-phone`, `chalkboard`, `console-guido` (material `crt-screen-guido`), `console-flight`, `console-capcom`, `wall-screens` (`screen-map`, `screen-data-left`, `screen-data-right`, `mission-clocks`), `quarantine-glass`, `phone-inside`, `phone-outside`, `life-raft`, `cm-spot`.
- Huesos sin «:» (`mixamorigHead`).

**Movimiento del jugador:**
- Alturas a 1,6 m correctas en las tres salas.
- Pasillos laterales del MOCR de ~3,6 m. Entre filas hay ~0,65 m libres detrás de las sillas, con un escalón de 0,4 m: hace falta *step-up* ≥0,4 m o rampas invisibles.
- Puertas de 0,82–1,0 m (bien para una cápsula de radio 0,3).
- **No hay malla de colisión ni nodos `player-spawn`/`cam-*`.** Recomendado: colisionadores AABB generados en código desde las cajas de `room-shell`, `console-row-*`, `sofa`, `dining-table`, `kitchen` y `quarantine-glass`, más estos spawns sugeridos (glTF):
  - MOCR: (−9,0, 1,2, −6,4), junto a `door-main`, mirando a +X/+Z.
  - Casa: (−3,9, 0, 1,8), entrando por `door-front`.
  - LRL: (−1,5, 0, 3,0).
- Interactuables con nodo propio: teléfonos, TV, squawk box, puertas, pizarra y consola GUIDO. Faltan nodos separados para objetos sueltos de las mesas (`desk-clutter` y `clutter` son una sola malla).

**¿Sirven para la escena clave?**
- **1202:** sí como escenario. La cámara a la altura de Bales ve su CRT y el panel. Para que funcione como drama faltan: controladores de relleno, el 1202 en la CRT, temporizador de 10 s y animación de Kranz y Duke. Es código, ~2 h.
- **Familia escuchando:** sí, tras el arreglo del sofá (Rick ahora de frente a la TV, Mark en la alfombra, Jan junto al squawk box). Para el aterrizaje la ventana debería ser de día.

## E) Paquete (siguiendo VALIDAR.md como Alex)

Zips descomprimidos en una carpeta limpia → `npm i` (visor y prueba-escena, OK) → `vite` → Chrome headless.
- Las 8 pestañas de la escena de prueba y el visor muestran `data-ready=1`, sin errores de consola ni 404 salvo `favicon.ico`.
- El validador del paso 3 (`cd _Compartido; npm i; node validar_glb.mjs ..\glb --reglas reglas-p3.json --md ..\informe-mio.md`) funciona.
- Sin rutas de Linux en el paquete.

Problemas encontrados:
1. VALIDAR decía «Descomprime `entrega-p3.zip`», pero Alex recibió dos zips. **Corregido.**
2. VALIDAR decía «si el puerto está ocupado Vite te dará otro», pero el visor tenía `strictPort: true`, así que fallaba. **Corregido** (`strictPort: false` en el visor del paquete).
3. La pestaña Casa no colocaba a Neil y la escena de prueba usaba un asiento horneado de 0,45 m para todos (los niños se hundían). **Corregido:** `npc-spot-neil` con `civil-base` y asiento por personaje (Jan 0,41 / Rick 0,36 / Mark 0,26).
4. `?modelo=` en la URL del visor no selecciona el modelo (menor, Alex usa clics).
5. `entrega-p3.zip` (29 MB, combinado) quedó obsoleto: usar solo principal + previews.

Juego de prueba (`game-p3test`): `vite build` OK. `npm test`: A7L/EASEP (hash), locomotion y launch-camera… pasan. Fallan `static-root`, `audio-layers` y `horizon-dock-cue` porque la copia del box no tiene `server/`, `public/licenses.txt` ni el audio: es un problema de entorno, falla igual en `game/` y no tiene relación con P3.

## Lo que corregí

1. **armstrong-house.glb**, en el glb final y en `raw/armstrong-house.raw.glb`, editando solo el JSON del glb (el BIN es idéntico byte a byte, así que no hubo recompresión):
   - Nodo `sofa`: rotación 180° → identidad. Ahora mira a la TV y el respaldo da a la ventana.
   - `npc-spot-rick`: z −2,60 → −2,45, más `extras.seat_height = 0.46` y `target = tv-set`.

   Validado con `gltf-transform validate` (0/0), el validador del equipo y capturas antes y después. También corregí `raw/armstrong_house.py` (`rot_z=0`, spot nuevo) y copié el glb a `entrega-p3/glb`, `visor/modelos/p3`, `prueba-escena/public/models` y `game-p3test/public/models`.
2. `entrega-p3/prueba-escena/src/main.js` y `game-p3test/test-p3.js`: asiento horneado por personaje y Neil en la casa.
3. `entrega-p3/visor/vite.config.js`: `strictPort: false`.
4. `VALIDAR.md` (los dos zips y lo que debe verse en Casa), `NOTAS-COMPANERO.md` (fórmula de asiento y registro de cambios), `P3_Tierra/INFORME.md` y `entrega-p3/INFORME.md` (nota de auditoría), `informe-p3.json/md` regenerados.
5. Capturas `escena-casa.png` y `escena-casa-mark.png` regeneradas (paquete y `_Integracion/capturas-p3`).
6. Zips reconstruidos con python zipfile: `entrega-p3-principal.zip` (7,29 MB, 92 archivos) y `entrega-p3-previews.zip` (21,56 MB, 35). Verificados en una carpeta limpia.

Copias de seguridad de todo lo tocado en `/workspace/audit-p3/backup/`.

## Pendientes priorizados

| # | Pendiente | Gravedad | Responsable sugerido | Estimación |
|---|---|---|---|---|
| 1 | Escenas de la Tierra en el juego: cargador de sala (luces desde `extras.light` con `RectAreaLightUniformsLib`, environment `RoomEnvironment`), poblar `npc-spot-*` con el mapeo de poses y asiento por personaje, cues de cámara en `rails.js` para prólogo, aterrizaje en casa, 1202 en MOCR y LRL | **Bloqueante** (sin esto P3 no se ve en el juego) | P2 + P3 (plan: Dom 12–17) | 3–5 h |
| 2 | Escena 1202 jugable: CRT de GUIDO con «1202» (CanvasTexture en `crt-screen-guido`), temporizador de 10 s (hoy 5 s en `descent.js`), Kranz `talk`/`point`, Duke `talk` | Importante | P2 / código | 1,5–2 h |
| 3 | Controladores de relleno en el MOCR (10–15 clones de `civil-base` con camisas tintadas en código, en `swivel-chair-instances`) y 2–4 vecinos en la casa | Importante | P3 | 1 h (código) / 2 h (glb) |
| 4 | Colisión y spawns: AABB en código o nodos `player-spawn`/`cam-*`; *step-up* 0,4 m o rampas en el MOCR | Importante (si se camina) | P2 | 1–1,5 h |
| 5 | `walk` con patinaje: re-hornear la pisada a velocidad constante (o usar walk solo de lejos, a 0,95 m/s en adultos y 0,45 en Mark) | Importante | P3 / P1 | 1,5 h |
| 6 | Ventana de día para el aterrizaje (15:17 CDT): variante de `window-view` o cambiar `emissiveMap` en código | Importante (fidelidad) | P3 | 0,5 h |
| 7 | Unificar `civil-base` P3 frente a P1 (nombre, rig y clips) y conseguir Neil civil (`armstrong-civil` de P1) para casa y LRL | Importante (integración) | P1 + P3 | 0,5–1 h |
| 8 | Pulido de personajes para primeros planos: brazos de idle más cerca del cuerpo, caras (nariz y párpados), cuello de Kranz | Menor (importante si hay planos cortos) | P3 | 2 h |
| 9 | Menores: renombrar `Armature`→`armature`; voltear 9–29 tris invertidos por personaje; mandos del squawk box hacia la sala; boyas → bolsas de enderezamiento + tinte verde; mapa de descenso en la pantalla central; regenerar `armstrong-house-v01.blend`; `?modelo=` del visor; borrar `entrega-p3.zip` viejo | Menor | P3 | 1–1,5 h en total |

## Referencias consultadas
- Testimonios de Rick y Mark Armstrong sobre el squawk box y la casa llena de gente: Fox News (2019) y la película *Armstrong* (2019). La noche antes de partir, Neil habló con sus hijos en la mesa: CNN, «Generation Apollo» (2021). El estante del squawk box en la casa de El Lago: collectSPACE.
- Horarios de Apolo 11: aterrizaje 20:17:40 UTC (15:17 CDT), primer paso 02:56 UTC del 21/7 (21:56 CDT del 20/7). Disposición del MOCR 2 (edificio 30) con Trench, Flight y CAPCOM según fotos NASA S69-39601 y S69-34209.
