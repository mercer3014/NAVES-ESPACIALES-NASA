# PLAN DE MEJORAS · «Apolo 11: Un gran salto» · Fase 1 (auditoría jugando)

Fecha: domingo 15 nov 2026, ~01:00 (hora de Bolivia). Rama `mejoras` (sale de `unificado`, último commit `6b6936e`).
Entrega: hoy, 23:59. Corte interno propuesto: **18:00 lo imprescindible, 21:00 congelación de funciones y 22:30 build final.**

## Resumen ejecutivo (lo que más importa hoy)

1. **El reto («Space Mission Design Game») pide que el jugador DISEÑE una misión con recursos limitados y vea las consecuencias.** Hoy solo se diseña una bandera cosmética. Propuesta: la **Sala de diseño «Tu Apolo 11»** (lugar, carga científica, combustible, duración de la EVA y parche), con efectos reales en el Alunizaje, la EVA y el informe (sección e, paquete WP5).
2. **La cronología está rota:** la Fase 1 (T-15 min del lanzamiento) va antes de la despedida y de la playa («días antes»). Faltan 10 transiciones explicadas. Hay que reordenar y añadir **tarjetas puente** con fechas y frases reales (a, WP1).
3. **La Fase 1 es «botones, números y palancas»:** se sustituye por 4 tareas táctiles tipo Among Us con base real: mangueras del traje rojo/azul, llenado de LOX/LH₂, la **fuga real de la válvula de LH₂** del 16 jul 1969 y la alineación de la plataforma de guiado (b, WP2).
4. **No hay «cómo jugar»:** tarjeta de misión antes de cada fase con «qué pasó / tu misión / controles» (c, WP3).
5. **La interfaz mezcla dos estilos.** Botón verde menta, tarjetas azul marino redondeadas y 6 tipografías de «ciencia ficción gamer». Dirección: «Plan de Vuelo 1969» con negro, blanco checklist y naranja internacional, Jost/Barlow/Plex Mono y carga en cuenta regresiva (d, WP4).
6. **Rendimiento:** la EVA va a **24 fps** en GPU integrada (6,9 M triángulos por 5.091 rocas con sombra), y el contador de FPS del motor miente, así que la resolución adaptativa no actúa. Los dos arreglos cuestan unas 2 h en total (f, P0 + P1).
7. **Bugs altos:** decisión sobre la escena equivocada, cuestionario sin teclado, cabina del CM abierta al espacio y la ficha «Persecución» tapando la velocidad vertical (g).
8. **Guardián:** se puede ganar, pero la fase 2 es un encadenado de 5 pasos que un niño no resuelve, la fase 3 se gana en 30 s y la cámara se mete dentro del gólem (g, WP8).
9. **Modelos para Grok Bot:** interior del CM cerrado, interior del LM propio, ropa de los tres astronautas, LOD de las rocas y terreno del 39A verde (h).

## Cómo se auditó

- `npm run dev` (Vite 8) y **Edge headless con GPU real** (ANGLE D3D11, Intel UHD Graphics 0x9A68) a 1280×720, con `puppeteer-core`. Los scripts están en `auditoria-claude/tools/`:
  - `menus.mjs`: carga, intro, inicio, briefing, bandera, ajustes, misiones, créditos, Bitácora, crear sala y unirse. Capturas `01-menu-*`.
  - `play-full.mjs`: misión 1 completa **en solitario y con el guion activado**. Las fases las juega el piloto automático de QA (`window.__auto` como *getter*: vale 1 dentro de las fases y 0 cuando pregunta el guion). Así se reproducen las escenas y las decisiones. Cada cinemática tiene 2 capturas y luego se salta con Esc. El registro `registro-*.txt` guarda **todos los textos que aparecen en pantalla**. Hay tres tramos de capturas:
    - `02-full-*`: inicio → Viaje → briefing de Kranz. Se cortó porque el bot se atascó en el cuestionario de la 1202 (bug G3).
    - `04-desc-*`: Alunizaje → EVA, reanudado con `?phase=descent&flow`. El piloto automático no pudo plantar la bandera (G10).
    - `06-eva-*`: EVA → epílogo → informe, con `?phase=eva&flow`.

    Juntos cubren el recorrido completo.
  - `boss.mjs`: Guardián (no canon). Bot ingenuo con teclas reales, 150 s por fase en Normal; después se fuerza la victoria por la API de depuración para comprobar el cierre. Capturas `03-boss-*`.
  - `fps.mjs`: FPS reales por fase medidos con `requestAnimationFrame`, con un solo navegador abierto. Capturas `05-fps-*`.
- `npx vite build` hacia una carpeta temporal para medir pesos (el `dist/` del repo no se tocó).
- Se leyeron README, EXPEDITIONS, QA_70/80/90, HOOKUP_B/C/D, `../docs/MISIONES.md`, `../docs/PLAN.md`, `../docs/GUION_v2_CORRECCIONES.md` y el código indicado.

## El reto de NASA Space Apps 2026

La web oficial (`spaceappschallenge.org/2026/challenges`) **no carga desde esta máquina**: la red presenta un certificado raíz no confiable (`SEC_E_UNTRUSTED_ROOT`). No se desactivó la verificación TLS. El reto que encaja con «el usuario debe poder DISEÑAR algo» es **«Space Mission Design Game»**, uno de los 14 retos de 2026. Su enunciado aparece transcrito en un repositorio público de un equipo participante (`github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game`, archivo `documentation/challenge.md`; **no se ha verificado contra la página oficial**):

> «This challenge consists of creating an **interactive game** that allows participants to: design a complete space mission; manage limited resources; simulate the execution of the mission; evaluate how each choice affects the final outcome.»
>
> «Build a Space Mission Design Game in which a single player or a team (up to 4 people) can: 1. Define the mission objective and requirements 2. Design the spacecraft and scientific payload 3. Select the launch vehicle and orbit 4. Manage constraints on budget, mass, power, communications, data, and duration 5. Simulate the mission and evaluate the result»
>
> «Every decision must have explicit consequences. No single "perfect solution": different combinations can work.» · «Ability to modify the design and rerun multiple simulations.» · «Post-mission analysis explaining the reasons for success/failure.»

**Consecuencia para el plan:** hoy el juego es una muy buena *simulación narrativa* del Apolo 11, pero el jugador **no diseña nada con consecuencias**. Lo único configurable es la bandera, que es cosmética. Es la mayor brecha frente a los criterios del jurado, y la sección (e) propone cerrarla sin romper el guion.

---

## a) Mapa del flujo actual y huecos narrativos

### Flujo real observado (Misión 1, solitario, «Iniciar misión»)

```
Carga (1,5 s) → Intro de vídeo 79 s (saltable) → INICIO «Planta la bandera» → Briefing (nombre, bandera, dificultad)
 └─ PRÓLOGO  hotel-prologue (27 ene 1967, Georgetown Inn)  →  mocr-tough (Kranz, «duros y competentes»)
 └─ FASE 1 Preparación: cabina del CM a T-15 min (lista, interruptores, DSKY, ronda GO/NO-GO)        ← julio 1969, mañana del lanzamiento
 └─ CAP.1  house-farewell (casa Armstrong, «días antes») + decisión c1-kids → ksc (Slayton) + decisión → beach (atardecer)   ← ¡días ANTES!
 └─ FASE 2 Lanzamiento (cuenta atrás desde la playa con público, Saturn V, corredor, 3 separaciones, órbita)
 └─ FASE 3 Viaje: TLI → transposición y acople (minijuego de Collins) → alineación con 3 estrellas → CAP.3 night → LOI tras la Luna → foto de la Tierra → calcetín
 └─ CAP.4  mocr-briefing (Kranz cierra las puertas)
 └─ FASE 4 Alunizaje: P63 auto → 1202 (eres Steve Bales, decisión 10 s) → mocr-1202 → cuestionario → P66 manual → mocr-landed → house-landed
 └─ decisión c5-rest («El plan dice dormir antes de salir»)
 └─ FASE 5 Caminata: escalera, primer paso, muestra, bandera (3 golpes + barra), experimentos, saludo y foto, golf
 └─ CAP.6  collins-solo → boss (opcional, no canon) → breaker → liftoff → reunion (acople) → CAP.7 tei → laika → decisión → tv → reentry (minijuego) → recovery → lrl → EPÍLOGO parade → epilogue
 └─ Informe (puntaje por fase, rango, tarjeta para compartir)
```

### Transiciones donde el jugador no entiende por qué o cómo llegó ahí

| # | Transición | Qué ve hoy | Problema |
|---|---|---|---|
| T1 | Briefing → hotel 1967 | Pulsa «Iniciar misión» y aparece un hombre en un hotel en 1967 | No sabe quién es ni por qué empieza dos años antes. Falta el marco «Antes del gran salto». |
| T2 | Kranz 1967 → cabina T-15 min | Corte directo de 1967 a la cabina del lanzamiento | Salto de dos años y medio sin rótulo. |
| **T3** | **Fase 1 (T-15 min) → casa, KSC, playa («días antes»)** | Tras la cuenta atrás de la cabina **vuelve atrás** a la despedida en casa | **Cronología rota.** Además, la decisión «¿Cómo habla Neil con sus hijos?» se dibuja **sobre la cabina del Módulo de Mando** (`02-full-13_decision.jpg`). |
| T4 | Playa (atardecer) → lanzamiento | Corte a la playa de día con público y T-17 s | Falta «16 de julio, 09:32». El rótulo de la cámara y el sello «FASE 02» se tapan (`02-full-21`). |
| T5 | Órbita → TLI | Banner «En órbita» y enseguida «Inyección translunar» | No se explica la órbita de espera ni el «GO para TLI». |
| T6 | Viaje → descenso | Kranz se pone el chaleco y el Eagle ya está bajando | Falta la separación del Eagle («The Eagle has wings») y que Collins se queda solo. |
| T7 | Alunizaje → decisión de dormir → EVA | Decisión flotando sobre el LM | Falta contar que adelantaron la salida unas 6,5 h tras alunizar. |
| T8 | EVA → Collins | Corte a Columbia | Falta «mientras tanto, a unos 110 km sobre ellos…». |
| T9 | Collins → **jefe** → disyuntor | El sueño del Guardián va **antes** de descubrir el disyuntor, pero el combate termina «cerrando el disyuntor con el rotulador» | El sueño anticipa algo que el jugador aún no vio. |
| T10 | Epílogo → Informe | Tras 20 minutos de historia aparece una tabla de puntos por fase | Se pierde el «¿cómo me fue?». No conecta con lo que el jugador decidió. |

### Tejido narrativo propuesto (fiel a la historia real)

Un **componente nuevo de «tarjeta puente»** (`src/game/story/bridge.js` + `bridge.css`): pantalla negra con la fecha y la hora en monoespaciada blanca, 1–2 líneas de texto y, opcionalmente, una cita real de radio con su orador. Avanza sola en 4–6 s o con un toque, Enter o Esc. Usa el mismo estilo que el rótulo de las cinemáticas, así que de paso **tapa la carga** de la escena siguiente (ver f). Se registra en `flow.js` como un `STORY` más (`bridge:<id>`), así que el orden se controla solo con `SLOTS`.

**Nuevo orden cronológico** (cambia `SLOTS` en `flow.js`):

```
'before:prep':   hotel-prologue, mocr-tough, bridge:design, DISEÑO (e), bridge:jul69, house-farewell, kids, ksc, beach, bridge:launch-morning
'before:launch': bridge:t-minus
'before:cruise': bridge:tli
'before:descent': bridge:undock, mocr-briefing
'before:eva':    pre-eva, bridge:hatch
'after:eva':     bridge:meanwhile, collins-solo, breaker, boss, liftoff, reunion, tei, laika, laika-talk, tv, reentry, recovery, lrl, parade, epilogue, bridge:report
```

Las decisiones sueltas (`kids`, `pre-eva`, `laika-talk`) deben pintarse sobre un fondo neutro, no sobre el último mundo 3D: `decide()` en `flow.js` debe llamar antes a `setWorld(lobby)` o a un fondo negro.

| Puente | Quién habla / qué se ve | Texto (ES) |
|---|---|---|
| `bridge:intro` (T1, antes del hotel) | Negro. Rótulo. | «ANTES DEL GRAN SALTO · Eres la tripulación del Apolo 11. Pero esta historia empieza con un incendio.» |
| `bridge:design` (T2) | Negro → pizarra de Kranz. | «1967–1969 · Tras el Apolo 1, la NASA rediseña la nave y planifica cada kilo del primer alunizaje. Ahora te toca a ti.» → Sala de diseño (e) |
| `bridge:jul69` (T3) | Casa de los Armstrong de noche. | «JULIO DE 1969 · El Lago, Texas. Faltan días para el lanzamiento.» (la escena ya dice «días antes de la cuarentena») |
| `bridge:launch-morning` (T3, antes de la Fase 1) | Plataforma 39A de madrugada (escena `pad`). | «16 DE JULIO DE 1969 · 04:15 · Desayuno de filete y huevos con Deke Slayton. Trajes puestos. Autobús a la plataforma 39A.» → tareas de la Fase 1 nueva (b) |
| `bridge:t-minus` (T4) | Voz de Jack King, Control de Lanzamiento (ya figura en la lista de verificados del guion). | «09:32 · Cerca de un millón de personas miran desde las playas.» (hoy está en el rótulo de la cámara; pasa a la tarjeta) |
| `bridge:tli` (T5) | Tierra desde la órbita. CAPCOM Bruce McCandless. | «Órbita de espera: vuelta y media a la Tierra revisando la nave.» Radio: «Apollo 11, this is Houston. You are go for TLI.» |
| `bridge:undock` (T6) | Columbia y Eagle separándose (reutilizar `ship.js`). | «20 DE JULIO · Armstrong y Aldrin pasan al Eagle. Collins se queda solo en Columbia.» Radio, Armstrong: «The Eagle has wings.» (la tarjeta `eagle-alas` ya existe) |
| `bridge:hatch` (T7) | Interior del LM. | «El plan decía descansar antes de salir. Pidieron salir ya. Unas 6 horas y media después del alunizaje, la escotilla se abre.» |
| `bridge:meanwhile` (T8) | Columbia sobre la Luna. | «Mientras tanto, a unos 110 km sobre ellos, Collins da vueltas a la Luna. Solo.» |
| reordenar T9 | — | `breaker` **antes** de `boss`: «De vuelta en el Eagle, Aldrin ve en el suelo la punta rota de un disyuntor» → «Intentan dormir. La cabina ronda los 16 °C…» (el texto del sueño ya existe en `boss/story.js`) |
| `bridge:report` (T10) | Pizarra de Houston. | «Tu Apolo 11 · Así salió la misión que diseñaste.» → Informe con la sección «Diseño vs. resultado» (e) |

Para el jurado, dos datos discutibles dentro del juego:
- La **foto del «Earthrise»** del Viaje es del **Apolo 8** (Anders, 1968). Llamarla «Foto de la Tierra desde la Luna» o citar al Apolo 8 en la tarjeta.
- El **golf** de la EVA es del **Apolo 14** (Shepard, 1971). Mantenerlo como huevo de pascua, pero etiquetado «No canon · Apolo 14».
- La alarma 1202 salta a ~780 m en el juego; en la realidad fue a ~10 km (durante P63). Es aceptable como compresión, pero conviene un «tiempo y altitud comprimidos» en la tarjeta de misión.

---

## b) Rediseño de minijuegos (Fase 1 antes del despegue)

### Qué se reemplaza (todo `src/game/phases/prep.js`)

| Hoy | Por qué sobra |
|---|---|
| Lista de 8 pasos con interruptores HTML: BAT A/B, FC 1-3, O₂ FAN, PGNS, ABORT con tapa, S-BAND | Es «presionar botones en orden». Sin pista visual, un niño no sabe qué es un «bus» o una «celda de combustible». |
| DSKY: teclear VERB 37 NOUN 01 ENTR | Es exactamente «escribir números». |
| Fallas: BUS B (BAT C), FC2 (PURGA), lámpara fundida (tocar 3 veces) | Botones con nombres técnicos. |
| Ronda GO/NO-GO: tocar 7 estaciones | Siete clics sin decisión. Pasa a cinemática corta automática. |
| Panel HTML denso tapando la cabina 3D, con el sello «FASE 01» encima (`02-full-09`) | Ilegible y genérico. |

### Fase 1 nueva: «La mañana del lanzamiento» (≈3 min, estilo Among Us)

**Estructura.** Mundo `pad.js` de madrugada con la cámara orbitando el Saturn V (ya existe como alternativa en `prep.js`). Arriba se ve una barra de tareas «TAREAS 0/4» con cuatro iconos grandes sobre el cohete. Cada uno abre una ventana de tarea a pantalla casi completa. Pancho da una pista si pasan 10 s sin progreso. Todo usa **Pointer Events**, así el mismo código sirve para ratón y táctil; los objetivos miden al menos 56 px. El teclado es opcional. El resultado devuelve el mismo `{ score, stats:{ time, mistakes, faults } }` para no tocar el informe.

| # | Tarea | Objetivo | Controles (ratón / táctil) | Por qué tiene sentido (dato real) | Cómo se gana | Duración |
|---|---|---|---|---|---|---|
| 1 | **Conecta el traje** (cables por color) | Unir las mangueras del traje A7L con el asiento: azul con azul, rojo con rojo y el cable de comunicaciones negro. En Veterano se suma el cable biomédico. | Arrastrar el extremo de la manguera hasta el conector del mismo color; si se suelta en uno equivocado, vuelve con un zumbido. | En la Sala Blanca los técnicos conectaban cada traje al suministro de oxígeno de la nave. Las fichas del Smithsonian de los A7-L registran **un conector rojo y uno azul** en el torso. Convención: **azul = entra oxígeno, rojo = sale** (NASA ALSJ, traje de Aldrin). *Verificado.* | 3 conexiones correctas (4 en Veterano) | 20–30 s |
| 2 | **Llena los tanques** (rellenar) | Llevar el oxígeno líquido (LOX, −183 °C) y el hidrógeno líquido (LH₂, −253 °C) de las 3 etapas hasta la franja verde. El nivel baja solo porque el líquido hierve y se ventila. | Mantener pulsado el grifo para llenar y soltar en la franja; un toque es un empujón corto. | El Saturn V se cargaba de propelente criogénico durante la cuenta atrás y había que **reponer lo que se evaporaba** hasta poco antes del despegue. Por eso el vapor blanco de las fotos. | 3 tanques en verde a la vez durante 2 s | 30–40 s |
| 3 | **Repara la fuga** (reparar una pieza) | Encontrar la válvula que silba (sale vapor) y apretarla girando la llave tres vueltas. Después, girar 4 piezas de tubería para cerrar el circuito. | Toque o clic en la válvula; arrastrar en círculo para la llave; tocar una pieza para girarla 90°. | **Real:** el 16 jul 1969, hacia las 02:30, unas 4,5 h antes del despegue, se encontró una **fuga en la válvula de reposición de hidrógeno líquido** a 200 pies de altura en la torre umbilical. El «Red Crew» subió a apretar los pernos y el control mantuvo el nivel con la válvula principal (testimonio de Stephen Coester, NASA Apollo Flight Journal). *Verificado.* | Fuga cerrada y circuito completo | 40–60 s |
| 4 | **Alinea la plataforma de guiado** | Girar tres anillos (cabeceo, alabeo, guiñada) hasta que la cruz quede centrada y en verde. | Arrastrar cada anillo; rueda del ratón opcional. Táctil: deslizar sobre el anillo. | La computadora de guiado (AGC) necesitaba su **plataforma inercial alineada** antes del despegue para saber «dónde es arriba». Enlaza con la tarjeta ya existente `agc-dsky`. | 3 anillos dentro de ±3° | 20–30 s |
| 5 (cierre) | **Cierra la escotilla** | Darle a Neil la «llave de la Luna» y girar la manivela de la escotilla. | Arrastrar el regalo hasta Neil; arrastrar en círculo la manivela. | Guenter Wendt, jefe de la Sala Blanca, le regaló a Armstrong una **llave de espuma en forma de media luna** antes de cerrar la escotilla. | Escotilla cerrada | 10–15 s |

Final de la fase: la ronda GO/NO-GO se reproduce automáticamente (7 luces que se encienden en 3 s con la voz de Control) y empieza el bloque «T-10» de la Fase 2.

**Bitácora:** `phase-cards.js` para `prep` cambia `'checklist-muslo'` por las tarjetas nuevas: `traje-a7l`, `propelente-criogenico`, `llave-de-la-luna` y se mantiene `agc-dsky`. Hay que añadirlas en `cards.js`.

**Cooperativo:** el CAPCOM ve el esquema (qué color va con cuál, qué válvula fuga) y el piloto actúa, igual que la regla de información asimétrica del diseño original. Si falta tiempo, el cooperativo de la Fase 1 sigue con Pancho dando la pista visual.

**Otros minijuegos** que se quedan, porque ya son de habilidad y no de «botones»: corredor de lanzamiento, mantener para encender la TLI, acople, alineación con 3 estrellas, descenso P66, bandera (3 golpes), reentrada y disyuntor. Solo necesitan la tarjeta de misión de (c) y que su HUD no se solape (g).

---

## c) Cómo jugar: tarjeta de misión antes de cada fase

**Componente:** `src/ui/mission-card.js` + `mission-card.css`. Es una tarjeta tipo **página del Plan de Vuelo** (papel crema, tipografía negra, cabecera `AS-506 · PLAN DE VUELO · FASE 03`; ver d). Tiene tres bloques fijos:

1. **QUÉ PASÓ** (fecha y hora real, ≤ 25 palabras).
2. **TU MISIÓN** (una frase y cómo se gana).
3. **CONTROLES**, en dos columnas con teclas dibujadas (ratón y teclado | táctil). Se detecta `isTouch` y se resalta la columna que corresponde.

Botón grande «¡VAMOS!» (Enter, Espacio o toque). Con la tarjeta abierta, el mundo está en pausa.

**Dónde aparece:**
- Al empezar cada fase en `mission.js › runPhase` (después de cargar el mundo y antes de `mod.default(ctx)`), con `await ctx.missionCard(phase)`.
- En el menú de pausa: nuevo botón **«Cómo jugar»** que la vuelve a abrir.
- En Práctica (Misiones → 1–5), igual.
- En los minijuegos del guion (acople, reentrada, disyuntor, despegue lunar, jefe), con el mismo componente y un `id`.
- Opción en Ajustes: «Tarjetas de misión: siempre / solo la primera vez». Se guarda en `store`.

**Contenido** (ES; EN en la misma tabla `[es, en]`):

| Fase | Qué pasó | Tu misión | Ratón / teclado | Táctil |
|---|---|---|---|---|
| Diseño | 1967–69: la NASA eligió el lugar, cada experimento y cada kilo del Eagle. | Diseña tu Apolo 11 sin pasarte del límite de masa. | Clic en las cartas; arrastra el control deslizante | Toca y desliza |
| 1 · Preparación | 16 jul 1969, madrugada: técnicos y tripulación preparan el Saturn V en la plataforma 39A. | Completa las 4 tareas antes de la cuenta atrás. | Arrastrar, mantener y girar con el ratón | Lo mismo con el dedo |
| 2 · Lanzamiento | 09:32. Casi 3.000 toneladas de cohete despegan del 39A. | Mantén la flecha dentro del pasillo verde y separa cada etapa cuando su tanque se vacíe, hasta llegar a la órbita. | A/D o ←/→ cabeceo · W/S empuje · Espacio separar · C/V cámara | Palanca izquierda · botón ETAPA |
| 3 · Viaje | El S-IVB enciende unos 6 minutos y os lanza a unos 39.000 km/h hacia la Luna. | Enciende el motor y suelta en la zona verde, acopla el Eagle, toca 3 estrellas y frena detrás de la Luna sin radio. | Mantén Espacio · ratón | Mantén ENCENDER · toca |
| 4 · Alunizaje | 20 jul: alarmas 1202 y un cráter lleno de rocas. Armstrong pilotó a mano con menos de un minuto de combustible. | Baja despacio: velocidad vertical en verde, sobre la zona marcada y sin rocas. | A/D inclinar · W/S empuje · R asistente | Palanca + barra de empuje |
| 5 · Caminata | 21 jul, 02:56 UTC: «Un pequeño paso…». 2 h 31 min fuera. | Baja, recoge una muestra, planta la bandera, despliega los experimentos y haz la foto antes de que se acabe el O₂. | WASD caminar · Espacio salto de canguro · E usar · P foto | Palanca · ACCIÓN · SALTO · FOTO |
| Acople / Reentrada / Disyuntor / Despegue lunar / Guardián | Una línea real cada uno (ya están en las cabeceras de `docking.js`, `reentry.js`, `breaker.js`, `liftoff.js` y `boss/story.js`). | — | Teclas de cada minijuego | — |

Tarjetas que sobran o hay que fusionar: la caja «Objetivo» de arriba a la izquierda (`objectiveCardHtml`) se queda como **recordatorio de una línea** y se plega sola a los 5 s. La línea gris de teclas (`l.keys`, `d.keysF`, `e.walkK`) desaparece del HUD porque pasa a la tarjeta.

---

## d) Limpieza de interfaz: dirección visual «Plan de Vuelo 1969»

### Diagnóstico (capturas `01-menu-*`, `02-full-*`)
- **Dos estilos peleados.** El inicio es negro, rojo y crema, con mosaicos numerados (está bien encaminado). Briefing, bandera, misiones, Bitácora, decisiones y pausa usan **tarjetas azul marino redondeadas** (`--r:14px`, 67 `border-radius` en `style.css`), chips azul pastel, `backdrop-filter`, sombras con brillo y un **botón principal verde menta** (`--go:#3ddc84`, «Iniciar misión», «Guardar bandera»). Es justo el aspecto «genérico de IA» que el dueño rechaza.
- **Seis tipografías:** Orbitron, Chakra Petch, Exo 2, Audiowide, Share Tech Mono y la del sistema. Las cuatro primeras son el cliché de «ciencia ficción gamer» y no tienen nada que ver con la NASA de 1969.
- **Barra de carga genérica:** degradado ámbar→blanco de 4 px, con un punto azul que late.
- El título dice **«PLANTA LA BANDERA»**, la marca del proyecto es **«Apolo 11: Un gran salto»** y el subtítulo dice **«Historia espacial y ciencia ficción»**. Para una entrega «fiel al Apolo 11» confunde. Marte y Agujero negro deberían ir bajo «Extras».

### Paleta (6 colores)

| Rol | Nombre | Hex | Uso |
|---|---|---|---|
| Fondo | Negro panel | `#0B0C0E` | Fondos, barras de cine, HUD |
| Texto y papel | Blanco checklist | `#F2EFE6` | Texto principal y fondo de tarjetas «papel» (tarjeta de misión, informe) |
| Acción | **Naranja internacional** | `#FF4F00` | Botón principal, foco, progreso, selección (el naranja de la torre y de los trajes de vuelo) |
| Estructura | Gris instrumento | `#3A3D42` | Bordes de 1–2 px, separadores, botones secundarios |
| Aviso | Ámbar de precaución | `#FFB000` | Avisos, tiempo, «NUEVO» (ya es `--amber`) |
| Peligro | Rojo MASTER ALARM | `#E0201B` | Alarmas 1202, fallo y O₂ bajo |

Se eliminan `--go:#3ddc84`, `--blue:#4fc3f7`, `#ffcf6a`, `#9aa3b2`, `#9fe8b4` y todos los `rgba(160,190,255,…)` azulados. El verde **solo** existe dentro de réplicas de instrumentos: el texto del DSKY, en `#7CFF4F`, y las luces GO de 1 px.

### Tipografía (todas OFL, servidas localmente)
- **Títulos:** *Jost* (geométrica tipo Futura) 600–700, MAYÚSCULAS, `letter-spacing:.06em`. Es la familia de los rótulos de la NASA de la época.
- **Interfaz y cuerpo:** *Barlow Semi Condensed* (inspirada en DIN) 500/600 para botones, etiquetas y texto.
- **Números y telemetría:** *IBM Plex Mono* 500 (altitud, cuenta atrás, porcentajes).
- Se instalan con `npm i @fontsource/jost @fontsource/barlow-semi-condensed @fontsource/ibm-plex-mono` o copiando sus `.woff2` a `public/fonts/`. Se quitan Orbitron, Audiowide, Exo 2 y Chakra (`style.css` líneas 1–6, `main.js › document.fonts.load`, `index.html` si hay `preload`).

### Componentes
- **Botón principal:** rectángulo con radio 2 px, fondo `#FF4F00` y texto `#0B0C0E` Barlow 600 en mayúsculas, `letter-spacing:.08em`, alto ≥ 48 px. *Hover*: invertir a borde naranja con fondo negro. *Pressed*: `translateY(1px)`. Sin degradado, sin brillo, sin *blur*.
- **Botón secundario:** transparente, borde 1,5 px `#F2EFE6` (o `#3A3D42` si está inactivo). Sin píldoras (`border-radius:999px` fuera).
- **Tarjeta oscura (HUD, diálogos):** `#0B0C0E` al 92 %, borde 1 px `#3A3D42`, radio 0–2 px, cabecera con una franja de 3 px naranja a la izquierda y una etiqueta mono pequeña tipo número de documento (`AS-506 · 3-14`).
- **Tarjeta papel** (misión, informe, Bitácora abierta): fondo `#F2EFE6`, texto `#0B0C0E`, renglones finos `#0B0C0E14`, casillas □/☑ dibujadas como en las checklists del traje.
- **Alertas:** banda diagonal negro y ámbar (*hazard stripes*) de 6 px arriba de la caja; MASTER ALARM en rojo con texto blanco.
- **Notificaciones de la Bitácora:** hoy se apilan dos o tres a la derecha y **tapan la telemetría** (`02-full-09`, `02-full-21`, `04-desc-02`). Pasan a **una sola ficha pequeña abajo a la izquierda** (encima de Pancho) que agrupa: «+2 entradas en la Bitácora · B».

### Barra de carga: «cuenta regresiva»
Fondo negro. Arriba a la izquierda, la etiqueta mono `APOLO 11 · AS-506`. En el centro, `T-00:00:12` grande en Plex Mono, que cuenta hacia abajo según el progreso real. Debajo, una **barra segmentada de 24 bloques** (cada bloque mide 8×18 px y se enciende en naranja de uno en uno) con tres marcas de etapa: `S-IC`, `S-II` y `S-IVB`. A la derecha, una lista de checklist con tres renglones que se tachan («TEXTURAS — GO», «AUDIO — GO», «FUENTES — GO»). Fuera el punto azul que late y el degradado. Archivos: `main.js` (HTML del arranque) y `style.css` (`.boot*`, `.bar`).

### Lobby / inicio
- Título: **«APOLO 11» en Jost 700 y debajo «UN GRAN SALTO»** en naranja. «Planta la bandera» pasa a ser el nombre de la Misión 1 o del modo, o desaparece.
- Menú: los mosaicos numerados actuales funcionan; se quitan los subtítulos grises de dos líneas («2 jugadores · 2 dispositivos») y se reduce a: **JUGAR · DISEÑAR MISIÓN · SALA (2 jug.) · BITÁCORA · AJUSTES**. Créditos, Extras (Marte y Horizonte) y la intro van como enlaces pequeños abajo.
- Escena 3D: se queda la Tierra con la Luna. **Se quitan** la galaxia espiral (en el inicio y en el Viaje, junto a la nave: `02-full-31`) y el astronauta flotando delante de la Tierra, que no aporta. El LM orbitando (`lobby.js`) puede quedarse.
- Banda inferior: `LOS ORINALEJOS · NASA SPACE APPS 2026` en mono pequeño.

### Archivos que cambian
`src/style.css` (variables, `.btn`, `.mbtn`, `.panel`, `.dialog`, `.seg`, `.boot*`, `.bar`, `.btn-ghost`, `.start`), `src/ui/flight-hud.css` (`.mhud-card` y telemetría), `src/game/story/decisions.css`, `epilogue.css`, `reentry.css`, `docking.css`, `moon-scenes.css`, `collins-solo.css`, `src/ui/bitacora.css`, `src/game/cutscenes/letterbox.css` y `cine.css` (fuente del subtítulo), el CSS en línea de `src/game/boss/hud.js`, `src/main.js` (arranque y carga de fuentes), `src/ui/screens.js` (títulos del inicio y del briefing), `src/scenes/lobby.js` (galaxia y astronauta), `index.html` y `public/fonts/`.

**Sobra:** galaxia del inicio y del Viaje; astronauta flotante del lobby; botón verde menta; chips azul pastel del selector de dificultad y de las pestañas de la bandera; `backdrop-filter`; sombras con brillo; píldoras; las tres pilas de avisos de la Bitácora; el sello gigante «FASE 0X» de 3 s que tapa el HUD (pasa a la tarjeta de misión); la ficha permanente «Persecución · C/V» (se muestra 2 s al cambiar de cámara).

---

## e) Elemento de DISEÑO para el usuario (según el reto)

### «Sala de diseño · Tu Apolo 11»

**Dónde:** entre el prólogo (Kranz: «duros y competentes») y la despedida en casa (`bridge:design`). Narrativamente es **1967–1969: la NASA rediseña y planifica la misión**, así que no rompe la historia. También se entra desde el inicio con «DISEÑAR MISIÓN» (modo libre) y desde el informe con **«Rediseñar y volver a volar»**, que relanza las fases afectadas en modo práctica. Eso cumple el «modify the design and rerun» del reto.

**Pantalla:** una mesa de planificación con 5 decisiones en cartas grandes y, a la derecha, el **presupuesto en barras**: MASA del Eagle (límite), COMBUSTIBLE (segundos de margen al aterrizar), CIENCIA (puntos), RIESGO (bajo/medio/alto) y TIEMPO de EVA. Cada carta cambia las barras en directo. Abajo, «Comparar con la NASA real» muestra qué eligió la NASA en 1969. No hay una única combinación correcta: hay perfiles (Seguridad, Ciencia, Equilibrio).

| # | Decisión | Opciones (valores aproximados, para el juego) | Efecto **real** en el juego (consecuencia explícita) |
|---|---|---|---|
| 1 | **Lugar de alunizaje** | **Mar de la Tranquilidad (Sitio 2, el real):** llano y cerca del ecuador; riesgo bajo, ciencia media. · **Sinus Medii (Sitio 3):** sirve de respaldo si se retrasa el lanzamiento; más rocas. · **Tierras altas** (como el Apolo 16 en 1972): rocas más antiguas, ciencia alta y riesgo alto. | `descent.js`: densidad y tamaño de rocas en la zona de aterrizaje y anchura de la zona segura. `eva.js`: tipo de muestra y texto de la Bitácora. |
| 2 | **Carga científica (EASEP)** con un límite de ~100 kg | **Sismómetro pasivo** (~48 kg, paneles solares, mucha ciencia; en la realidad funcionó unas 3 semanas). · **Retrorreflector láser** (~30 kg, sin energía; **se sigue usando hoy**). · **Colector de viento solar** (lámina muy ligera, se trae de vuelta). · **Cámara estéreo de primer plano** (ligera). · **Herramientas extra para muestras** (más kg de roca; el real trajo ~21,5 kg). | `eva.js`: **solo aparecen las tareas de los instrumentos elegidos**; la ciencia suma al puntaje. El epílogo cambia: con el retrorreflector, «hoy aún medimos la distancia a la Luna con tu espejo» (la tarjeta `legado-lrrr` ya existe). |
| 3 | **Margen de combustible** (control deslizante) | Más combustible = más masa = menos kilos para ciencia. | `descent.js`: multiplica el combustible inicial (ya existe `ctx.diff.fuel`). El informe muestra «aterrizaste con N s de margen». |
| 4 | **Duración de la EVA** | 2 h 30 (real y prudente) · 3 h 30 (más ciencia y más riesgo de calor y O₂). | `eva.js`: la barra de O₂ (`O2 = 420 * D.time`) y el número de tareas opcionales. |
| 5 | **Parche de la misión** | Editor de la bandera actual en un modo nuevo, **«Parche»**: águila, rama de olivo, Luna, Tierra y lema. | Cosmético, con historia real: Collins dibujó el águila, el instructor Tom Wilson propuso la rama de olivo y la tripulación **dejó sus nombres fuera** para que el parche representara a todos (ya corregido en `GUION_v2_CORRECCIONES.md`). Se usa en el traje (`renderPatch` ya existe), la tarjeta para compartir y el informe. |

**Simulación y evaluación:** las fases son la simulación. El **informe** añade una sección «Diseño vs. resultado» con 3–4 líneas causales, por ejemplo: «Elegiste Tierras altas: más rocas en la zona (−12 s de combustible al esquivar)», «El sismómetro detectó tus pasos en la EVA (+20 ciencia)», «Margen de combustible 40 s: aterrizaste con 18 s». También muestra **«Tu plan vs. la NASA 1969»** y el botón «Rediseñar y volver a volar».

**Cooperativo (opcional):** el CAPCOM elige 2 de las 5 cartas, Ciencia y Seguridad, y las dos personas firman el plan. Encaja con «team collaboration», aunque el reto admite hasta 4 jugadores y el juego solo tiene 2.

**Implementación sin romper nada:** `src/game/design/plan.js` (datos puros y `computePlan()`, con test) + `design-screen.js` + `design.css`. El plan se guarda en `store.set('missionPlan', …)`. `mission.js › makeCtx` añade `ctx.plan` (por defecto, el plan real de la NASA). Si nadie lo lee, nada cambia. Lectores: `descent.js`, `eva.js` y `debrief.js`.

---

## f) Rendimiento

### Medidas
- **Build** (`vite build`, 0,8 s): `dist` pesa **132 MB**: audio 56 MB (323 archivos), modelos 28 MB (60 `.glb`), vídeo 25 MB, texturas 20 MB (16 de ellos solo de Marte), JS 2,5 MB.
  - `three` 902 kB (gzip 239 kB), `index` 103 kB, `state` (cartas de la Bitácora) 61 kB, `boss` 61 kB.
  - Hay 3 avisos `INEFFECTIVE_DYNAMIC_IMPORT` (`pancho.js`, `screens.js` y `bitacora.js` se importan de forma estática y dinámica a la vez).
- **Carga** (dev, localhost): arranque → intro en **1,5 s**; 67 peticiones y 11,4 MB antes del menú (en dev los módulos van sin empaquetar).
  - Intro de vídeo: `intro_720.mp4` pesa 13,8 MB (+ `webm` 7,4 MB + 480p 3,3 MB). En una red de 10 Mbit/s son ~11 s solo de vídeo.
- **Modelos:** ningún `.glb` usa compresión: sin `KHR_draco`, sin `EXT_meshopt` y sin texturas KTX2/WebP. Los más pesados son `rover` 1,9 MB, `lc39a-terrain` 1,7, `astronaut-a7l` 1,4, `moon-rocks` 1,4, `s4b-sla` 1,4 y `csm-columbia` 1,3.
  - Hay dos Saturn V (`saturn-v.glb` 0,9 MB y `saturn_v.glb` 0,2 MB, este como respaldo).
- **Audio:** música a 96–128 kbps (bien); el más grande es `music/ambient.mp3` con 3,6 MB.
- **FPS reales** (rAF, Edge con D3D11, **GPU integrada Intel UHD**, 1280×720, un solo navegador, 8 s de calentamiento + 20 s de muestra; `tools/fps.mjs`, capturas `05-fps-*`). El techo de 144 es el refresco del navegador sin vsync.

| Escena | Mediana | P10 | Mín. | Resolución adaptativa (dpr) | Comentario |
|---|---|---|---|---|---|
| Menú / lobby | 144 | 144 | 143 | 1,00 | OK |
| Lanzamiento | 67 | 55 | 42 | 1,00 | Aceptable; hay post-proceso |
| Viaje | 123 | 111 | 77 | 1,00 | OK |
| Alunizaje | 44 | 41 | 40 | **0,65** | Ya rebajó la resolución: 3,4 M triángulos por fotograma |
| **Caminata (EVA)** | **24** | **21** | **20** | **0,65** | **Cuello principal:** 6,9 M triángulos y 348 *draw calls* por fotograma |
| Guardián | 69 | 65 | 62 | 1,00 | OK |
| Noche en Columbia | 99 | 82 | 66 | 1,00 | OK |
| Reentrada / Desfile | 144 | 144 | 128 | 1,00 | OK |

  Desglose de la EVA (`tools/probe-eva.mjs`): **5.091 rocas instanciadas = 3,15 M triángulos** (unos 620 por roca, de `moon-rocks.glb`), todas con `castShadow`, así que la pasada de sombras las dibuja otra vez. Terreno 0,37 M; resto 0,36 M. Sombra direccional de 2048². En el Alunizaje pasa lo mismo a menor escala.
  En un portátil sin GPU dedicada (el hardware típico de un jurado) **la EVA, que es la escena estrella, irá a 20–25 fps**.

### Cuellos de botella y arreglo

| # | Cuello | Evidencia | Arreglo | Esfuerzo |
|---|---|---|---|---|
| P0 | **Rocas de la EVA y del Alunizaje** (6,9 M triángulos) | tabla y desglose de arriba | En `moonsurface.js › layRocks`: (1) las rocas pequeñas **sin `castShadow`** (solo las grandes la proyectan); (2) **descartar instancias a más de 120–150 m** del jugador o del LM; (3) variante *low-poly* de cada tipo para las lejanas (Grok Bot, h). Se espera pasar de 24 a 50–60 fps en la EVA. | 1,5 h |
| P1 | **El contador de FPS del motor miente** | `engine.js › frame()` suma `dt` **ya recortado** a 0,05 s: un fotograma de 200 ms cuenta como 50 ms. Medido: rAF real **5 fps**, motor **56 fps** al entrar en el Alunizaje; real 11 / motor 38 en el Lanzamiento. | `fpsAcc += timer.getDelta()` sin recortar. Así `adaptRes()` sí baja la resolución cuando hace falta. **1 línea, alto impacto.** | 10 min |
| P2 | Tirón al entrar en cada escena (5–11 fps durante 1–3 s) | `02-full.log`: `phase-launch fps=11`, `phase-descent fps=5`, `phase-eva fps=7` | `await renderer.compileAsync(scene, camera)` antes de mostrar la escena, con la **tarjeta puente o de misión** encima mientras compila. | 1 h |
| P3 | Modelos sin comprimir (28 MB) | ver arriba | `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp` sobre una copia; `MeshoptDecoder` en el `GLTFLoader` de `engine.js`. Se esperan entre −40 % y −60 %. **Coordinar con Grok Bot**: hacerlo al final, cuando no vaya a tocar más modelos, y **guardando los originales**. | 1,5 h |
| P4 | Intro de 13,8 MB | ver arriba | Por defecto, 480p (3,3 MB) y 720p solo con `effectiveType=4g` y pantalla ≥ 1280. Póster inmediato. | 20 min |
| P5 | Texturas de Marte duplicadas (KTX2 y WebP: 16 MB) | `tex/mars/*` | Elegir un solo formato (WebP: 2,3 MB). Solo afecta a Marte. | 15 min |
| P6 | Importaciones dinámicas que no parten el código | 3 avisos del build | Importación solo estática o solo dinámica. | 20 min |
| P7 | Pantallas HTML grandes encima de WebGL (`backdrop-filter`) | CSS | Se va con la limpieza visual (d). | — |

---

## g) Bugs encontrados (con captura) y estado del Guardián

Errores de JavaScript en todo el recorrido: **ninguno** (0 `pageerror` y 0 `console.error`; solo 2 descargas abortadas a propósito al saltar la intro o una escena). Los problemas son de flujo, de solapes y de 3D.

| ID | Gravedad | Dónde | Qué pasa | Captura | Arreglo |
|---|---|---|---|---|---|
| G1 | **Alta** | Orden del guion | La Fase 1 (cabina a T-15 min, el día del lanzamiento) va **antes** de la despedida en casa, el KSC y la playa («días antes»). | `02-full-09` → `02-full-10` | Reordenar `SLOTS` (a). |
| G2 | **Alta** | `flow.js › decide()` | Las decisiones sueltas se pintan sobre el último mundo 3D: la de los hijos de Neil aparece **sobre la cabina del CM**. | `02-full-13` | Fondo neutro antes de `ask()`. |
| G3 | **Alta** | `decisions.js › quiz()` | El cuestionario de la 1202 **no acepta teclado**: muestra «1, 2, 3» pero solo funciona con clic. El bot quedó atascado 70 s. Un jugador con teclado y mando también se atasca. | `02-full-55…58` | Copiar el `keydown` de `ask()` a `quiz()` y `whatIf()`. 10 min. |
| G4 | **Alta** | `cm-interior.glb` (noche y Collins solo) | **Cabina abierta al espacio**: no se ven las paredes y se ven estrellas dentro. `cabin-shell` usa el material `CMI-Pared` de una sola cara con las normales hacia fuera. | `02-full-28`, `06-eva-07` | Ya: `side = DoubleSide` en `CMI-Pared` y `CMI-Mamparo` al cargar. Bien: Grok Bot invierte las normales (h). |
| G5 | **Alta** | Telemetría de Lanzamiento, Viaje y Alunizaje | La ficha permanente **«Persecución · C/V» tapa el valor V/S**, el dato clave para aterrizar, y el «Día» del Viaje. | `04-desc-07`, `02-full-23`, `02-full-31` | Mostrarla 2 s al cambiar de cámara o moverla debajo de la telemetría. |
| G6 | Media | Inicio de cada fase | El sello «FASE 0X» (3,2 s) y **2–3 avisos de la Bitácora** tapan la lista, la cuenta atrás «T-17» y la telemetría. | `02-full-09`, `02-full-21`, `04-desc-02` | Sello dentro de la tarjeta de misión (c); avisos agrupados abajo a la izquierda (d). |
| G7 | Media | Cinemáticas dentro de fase (TLI, ¡Despegue!, Eagle alunizó) | El **HUD de la fase asoma por encima de las barras negras** (tarjeta de objetivo y telemetría). | `02-full-22`, `02-full-25`, `04-desc-08` | `body.cine .mhud{visibility:hidden}` mientras haya `.plb-letterbox`. |
| G8 | Media | `engine.js › frame()` | El **contador de FPS suma `dt` recortado**, así que la resolución adaptativa no actúa cuando el juego va a 5–11 fps. | log `02-full`: real 5 / motor 56 | Ver P1. |
| G9 | Media | Disyuntor (`cabin-panels.glb` usado como LM) | El interior del Eagle es la cabina del CM (paneles «GUIDANCE & NAVIGATION», «ENVIRONMENTAL CONTROL»), sin paredes, y el **reloj marca «-00:14:59»**, la cuenta atrás del lanzamiento, en la Luna. | `06-eva-10` | Reloj a GET 125:xx o apagado (código); interior del LM propio (h). |
| G10 | Media | EVA, sitio de la bandera | El marcador rojo del sitio sugerido queda **junto a rocas** que bloquean al astronauta, aunque el texto pide «sin rocas». El piloto automático no pudo plantar. | `04-desc-16` | Elegir el punto sugerido lejos de las rocas (radio de exclusión). |
| G11 | Media | Viaje y lobby | **Galaxia espiral** gigante junto a la nave y en el lobby: falsea la escala y parece ciencia ficción. | `02-full-31`, `01-menu-04` | Quitarla (el *easter egg* `egg.galaxy` puede quedarse oculto en el lobby). |
| G12 | Media | Descenso P63/P64 | La superficie a 1.200 m es un **plano liso** sin cráteres; no se percibe altura. | `02-full-36` | Textura con cráteres para la vista lejana o *fog* más denso; alternativa: empezar en P64 con la cámara más alta. |
| G13 | Baja | Informe | Las insignias «Misión 1 completa» y «Sin ayuda» **tapan el título**; la imagen de la tarjeta para compartir muestra su texto `alt` («share card») hasta que carga. | `06-eva-52` | Insignias en cola abajo; `img` oculta hasta `onload`. |
| G14 | Baja | Lanzamiento | Pancho tapa el indicador del corredor abajo a la izquierda. | `02-full-23` | Pancho a la derecha en las fases con medidor a la izquierda. |
| G15 | Baja | Jefe, final | El resumen dice «Tiempo 0:28», pero es solo la última fase, no el combate entero. | `03-boss-29` | Acumular `S.t` entre fases. |
| G16 | Baja | Tierra en el Viaje y en Laika | El borde de la atmósfera se ve como un **anillo marrón o anaranjado**. | `02-full-25`, `06-eva-27` | Revisar el color del *shader* del limbo (azul `#6fa8ff`). |
| G17 | Info | Datos | «Earthrise» es del Apolo 8; el golf es del Apolo 14; **Laika es una escena inventada** etiquetada «dramatizado» dentro del cap. 7 canónico. | `06-eva-27` | Etiquetar «No canon» como el jefe, o quitarla del recorrido principal y dejarla en Extras. |

### Estado de la pelea con el Guardián (no canon)

- **¿Se puede ganar?** Sí, técnicamente. La victoria por la API pasa a «cierra el disyuntor (E)» y a la tarjeta final de la Bitácora sin bloquearse (`03-boss-29…32`). Con un bot ingenuo en Normal (avanzar, martillo, flash y saltos al azar):
  - **Fase 1 (Polvo):** rompió 3 de 4 placas en 60 s, pero **se quedó sin O₂ dos veces**. El O₂ se gasta muy rápido cerca del Guardián.
  - **Fase 2 (Combustible): no la superó en 150 s.** Hay que encadenar flash al Guardián real (el que tiene sombra) → Neil se coloca detrás → correr al anillo azul → Espacio → mantener E sobre el depósito. Son **5 pasos encadenados con una cuenta atrás de 60 s y dos clones**. Un adulto atento lo saca; un niño no.
  - **Fase 3 (Fuego):** el bot la **ganó en unos 30 s** (manguera Q + martillo). Está desequilibrada respecto a la fase 2.
- **¿Se entiende?** A medias. La tarjeta de objetivo es clara («Rompe las placas… Rodillas: siempre. Hombros: cuando está aturdido»), pero hay **8 controles** (WASD, ratón, Espacio, Shift, E, F, Q, Tab) presentados en una sola línea gris que desaparece. El aviso «El polvo absorbe el golpe: busca el depósito de la espalda» se repite y tapa la vista.
- **¿Se ve bien?** De lejos, sí: el gólem de basalto con el núcleo «1202» tiene personalidad (`03-boss-02`, `03-boss-28`). **De cerca, la cámara se mete dentro de las piernas** y la pantalla queda cubierta de polígonos marrones (`03-boss-04`, `03-boss-21`). El grano de película es demasiado fuerte.
- **Arreglos propuestos (paquete WP8):**
  1. La cámara retrocede y sube cuando la distancia al Guardián es menor de 6 m, y el Guardián se vuelve semitransparente si la cámara entra en su volumen.
  2. Fase 2 en 3 pasos: el flash revela al real y lo aturde 8 s; luego basta con «E junto a su espalda». Quitar el salto obligatorio.
  3. O₂ un 30 % más lento en Normal y un 50 % en Cadete.
  4. Fase 3: la manguera ya no duplica el daño; hacen falta 6–8 golpes.
  5. Objetivo con **un icono de tecla grande** por paso.
  6. Duración objetivo: 4–6 min.
  7. Usar la misma tarjeta de misión (c) antes de empezar.
- **Encaje narrativo:** moverlo después del disyuntor (T9) y mantener la pregunta «Soñar / Saltar».

---

## h) Cambios de MODELOS 3D para Grok Bot

Prioridad: **A** = se ve en el recorrido principal y resta mucho; **B** = mejora clara; **C** = si sobra tiempo. Se mantienen los nombres de nodos que usa el código (entre comillas) y el origen y la escala actuales, salvo que se indique otra cosa. Exportar `.glb` sin Draco: la compresión se aplica al final en el paquete P3.

| Prio | Archivo | Problema visible (captura) | Cambio exacto |
|---|---|---|---|
| **A** | `public/models/cm-interior.glb` | Cabina abierta: se ven estrellas dentro y la cámara ve los muñecos atravesados (`02-full-28`, `06-eva-07`). | `cabin-shell` (material `CMI-Pared`) y el mamparo (`CMI-Mamparo`): **invertir normales hacia dentro**, o duplicar la cara interna, y cerrar el cono completo detrás de los asientos. Las 5 ventanas (`win-*`) siguen siendo huecos con `window-glass`. Añadir 2–3 armarios y redes en la pared de popa para que el plano medio no esté vacío. |
| **A** | `public/models/cabin-panels.glb`, o **nuevo** `lm-interior.glb` | El interior del Eagle del disyuntor es la cabina del CM, sin paredes y con el reloj de la cuenta atrás (`06-eva-10`). | Interior del LM simplificado y **de pie** (sin asientos): 2 **ventanas triangulares** delanteras, panel central con el DSKY del LM, **panel 16 de disyuntores a la derecha** (nodo `cb-engine-arm`, el disyuntor roto real), tapa del motor de ascenso en el suelo (*doghouse*) y escotilla delantera cuadrada. Paredes cerradas, normales hacia dentro. Si no da tiempo: solo cerrar paredes en `cabin-panels.glb` y quitar los rótulos «GUIDANCE & NAVIGATION». |
| **A** | `armstrong-civil.glb`, `aldrin-civil.glb`, `collins-civil.glb` | En la playa y el KSC, los tres con el **mismo mono azul** y manos abiertas en garra (`02-full-19`, `02-full-15`). En la TV en blanco y negro, el mono claro se confunde con piel (`06-eva-31`). | Variar la ropa: Armstrong con polo claro y pantalón gris, Aldrin con polo azul oscuro, Collins con camisa a cuadros (ropa civil de 1969). En vuelo, mono de vuelo **blanco o beige** con bolsillos y cremallera marcados. Relajar los dedos del *rig* (pose de reposo semicerrada) en los clips `idle`, `talk` y `sit`. |
| **A** | `civil-base.glb` (Deke Slayton en el KSC) | Camiseta con hueco en la cintura (se ve piel) y brazos en garra (`02-full-15`). | Cerrar la malla entre camiseta y pantalón, camisa de manga corta con corbata o polo de NASA de 1969 y manos relajadas. |
| **B** | `ksc-crowd.glb` | Público hecho de **cajas** (estilo bloques) en la playa del lanzamiento (`02-full-21`). | Siluetas *low-poly* redondeadas (cabeza esférica, torso cónico), 6 variantes de ropa de 1969, sombreros, prismáticos y algunos sentados en sillas de playa; máximo 300 triángulos por persona. |
| **B** | `lc39a-terrain.glb` | El terreno del 39A es un **desierto marrón con montículos** (`02-full-22`); Florida es marisma verde. | Verde y oliva, canales de agua, vegetación baja, el camino de las orugas en grava blanca y la playa a lo lejos. |
| **B** | `saturn-v.glb` | El S-IVB y el S-IC salen **blancos quemados** sin detalle en la TLI y el lanzamiento (`02-full-25`). | Albedo `#E8E6E0`, no blanco puro; **patrón de *roll* negro y blanco** del S-IC; letras «UNITED STATES» verticales y bandera en el S-IC; franja negra del S-II; anillos de unión entre etapas en gris. Mantener los nodos de separación de etapas. |
| **B** | `guardian.glb` | De cerca, polígonos marrones grandes que llenan la pantalla (`03-boss-04`, `03-boss-21`). | Bajar la altura un 15 %; las grietas emisivas naranjas más visibles (*emissive* 2,0); el núcleo `core-dsky` con «1202» más grande y emisivo; materiales de roca con 2 rugosidades distintas. Mantener los nodos `plate-*`, `fuel-tank`, `core-dsky`, `hand-*` y `head`. |
| **B** | `mocr-room.glb` + `controller-extra.glb` | Consolas como cajas con pantallas verde pastel lisas y controladores que solo asoman la cabeza (`02-full-34`). | Pantallas oscuras `#0E1A12` con líneas de texto verde fósforo como textura emisiva; botoneras con teclas blancas y ámbar; filas escalonadas (las «trincheras» FIDO, RETRO, GUIDO delante); controladores con camisa blanca y corbata, visibles hasta la cintura. |
| **A** | `moon-rocks.glb` | Cada roca tiene unos 620 triángulos y hay más de 5.000 instancias en la EVA: es la mitad del coste de la escena estrella. | Para cada tipo de roca (`RT.big`, `RT.mid`, `RT.small`), añadir **una variante LOD1 de 60–120 triángulos** con el mismo nombre más el sufijo `-lod1`, y bajar las pequeñas a ≤ 200 triángulos en LOD0. Mantener el tamaño de referencia (`kit[type].size`). |
| **C** | `astronaut-a7l.glb` | Correcto en la EVA (`04-desc-13`). | Solo añadir el **parche de la misión como nodo `patch-left`**: plano circular de 8 cm en el pecho izquierdo con UV propio, para que el código pinte ahí el parche diseñado (e). |
| **C** | `hotel-room-1967.glb` | Válido (`02-full-04`). | — |
| **C** | `armstrong-house.glb` | Hay un objeto que parece un **microondas** sobre la mesita (`02-full-11`). | Sustituirlo por una radio o un televisor de tubo de 1969. |
| **C** | `laika-plush.glb` | Pelaje con ruido o aliasing (`06-eva-27`). | Bajar la intensidad del *normal map* o quitar el pelaje de cáscaras. |

---

## i) Plan de implementación por paquetes de trabajo

Reglas para que los subagentes no se pisen: **cada archivo tiene un solo dueño**. Si un paquete necesita algo de un archivo ajeno, lo pide como «gancho» (una línea) al dueño. Todos trabajan sobre `mejoras` en *worktrees* separados y el líder integra en este orden: WP6 → WP1 → WP3 → WP2 → WP5 → WP4 → WP8 → WP7. Cada paquete debe pasar `npm test`, `npm run build` y su recorrido de `auditoria-claude/tools/` antes de entregar.

| WP | Paquete | Archivos (dueño exclusivo) | Contenido | Estimación | Antes de las 18:00 |
|---|---|---|---|---|---|
| **WP6** | Bugs rápidos | `src/core/engine.js`, `src/game/story/decisions.js`, `src/game/cutscenes/letterbox.js`, `src/scenes/cabin.js`, `src/game/story/night.js`, `collins-solo.js`, `breaker.js` | G3 (teclado en `quiz` y `whatIf`), G8/P1 (FPS reales), G7 (ocultar HUD con letterbox: clase en `body`), G4 rápido (`DoubleSide` en `CMI-Pared` y `CMI-Mamparo`), G9 (reloj del LM), G10 (sitio de la bandera: **pedir gancho a WP5**, que es dueño de `eva.js`) | 2 h | **Imprescindible** |
| **WP1** | Tejido narrativo | `src/game/story/flow.js`, **nuevo** `src/game/story/bridge.js` + `bridge.css` | Nuevo orden de `SLOTS` (G1), las 10 tarjetas puente ES/EN de (a), fondo neutro en `decide()` (G2), `breaker` antes de `boss` (T9), Laika etiquetada «No canon» (G17). Actualizar `tests/story.test.mjs`. | 2,5 h | **Imprescindible** |
| **WP3** | Tarjetas de misión «Cómo jugar» | **nuevo** `src/ui/mission-card.js` + `mission-card.css`, `src/game/mission.js` | Componente, `ctx.missionCard()` en `runPhase`, botón «Cómo jugar» en la pausa y contenido de (c). En `mission.js` se añade también `ctx.plan` (gancho de WP5) y se retira el `showPhaseStamp`. | 2 h | **Imprescindible** |
| **WP2** | Fase 1 nueva (tareas tipo Among Us) | `src/game/phases/prep.js` (reescribir), **nuevo** `src/game/phases/prep-tasks/{index,cables,tanks,leak,align,hatch}.js` + `prep-tasks.css`, `src/game/story/phase-cards.js`, `src/ui/capcom.js` (solo la parte de `prep`) | Las 5 tareas de (b) con Pointer Events, ganchos de Pancho y CAPCOM, y el mismo `return` de puntaje. Se puede **partir en 2 agentes**: (2a) marco + cables + tanques + escotilla y (2b) fuga + alinear, que comparten solo la interfaz `mountTask(el, opts) → Promise<{ ok, time, mistakes }>`, definida primero por 2a. | 4–5 h (2 agentes: 3 h) | **Imprescindible** |
| **WP5** | Sala de diseño (reto) | **nuevo** `src/game/design/{plan.js,design-screen.js,design.css}`, `src/game/phases/descent.js`, `src/game/phases/eva.js`, `src/game/phases/debrief.js`, `src/game/story/cards.js` (tarjetas nuevas), **nuevo** `tests/design.test.mjs` | (e) completo: 5 decisiones, barras, «comparar con la NASA», efectos en el combustible, las rocas, las tareas de la EVA y el O₂, y el informe «Diseño vs. resultado» con «Rediseñar y volver a volar». La entrada desde el guion la registra WP1 (`STORY.design`); la entrada desde el menú, WP4. | 5–6 h | **Imprescindible (núcleo: decisiones 1–4 + informe).** El parche (decisión 5) y el cooperativo son opcionales. |
| **WP4** | Dirección visual 1969 | `src/style.css`, `src/ui/flight-hud.css`, `src/ui/bitacora.css`, `src/ui/bitacora.js` (avisos agrupados), `src/game/story/*.css` (salvo `bridge.css`), `src/game/cutscenes/*.css`, `src/main.js`, `src/ui/screens.js`, `src/scenes/lobby.js`, `index.html`, `public/fonts/`, `src/ui/pancho.js` (posición) | Paleta y fuentes, botones y tarjetas, barra de carga en cuenta regresiva, inicio («APOLO 11 · UN GRAN SALTO», menú reducido, entrada «Diseñar misión»), avisos de la Bitácora, ficha de cámara (G5, G6, G13, G14) y sin galaxia (G11). | 4 h (núcleo 2,5 h) | **Núcleo imprescindible** (variables, fuentes, botones, carga, inicio, G5 y G6); el resto es opcional. |
| **WP8** | Guardián | `src/game/boss/boss.js`, `src/game/boss/hud.js` (incluido su CSS en línea con la paleta nueva), `src/scenes/boss-arena.js` | Cámara, fase 2 simplificada, O₂, equilibrio de la fase 3, objetivos con tecla grande, tiempo total (G15) y tarjeta de misión (usa el componente de WP3). | 2,5 h | Opcional (es no canon), pero **muy visible en la demo**: hacer como mínimo la cámara y el O₂ (1 h). |
| **WP7** | Rendimiento | `src/scenes/moonsurface.js` (**P0, hacerlo pronto: es lo que más FPS da**), `vite.config.js`, `src/core/engine.js` (**solo después de WP6**), `public/models/*.glb` (**solo después de Grok Bot**), `public/video/`, `public/tex/mars/` | **P0 (rocas: sin sombra en las pequeñas + descarte por distancia), imprescindible, 1,5 h**; P2 (`compileAsync` tras la tarjeta), P3 (meshopt + WebP **guardando los originales** en `art/glb-originales/`), P4 (intro a 480p por defecto), P5 y P6. | 4,5 h | **P0 imprescindible antes de las 18:00**; P2 y P4 recomendables. P3 solo a partir de las 20:00, cuando Grok Bot cierre los modelos. |
| **WP9** | Modelos (Grok Bot) | `public/models/*.glb` de la tabla (h) | Prioridad A antes de las 16:00; B antes de las 20:00. | — | A: imprescindible |
| **WP10** | QA final y entrega | — | Recorrido completo con `play-full.mjs` en ES y EN, teléfono 390×844, `npm test`, `npm run build`, revisión de textos y créditos. | 1,5 h | 21:00–22:30 |

### Calendario sugerido (hoy, hora de Bolivia)

| Hora | Trabajo |
|---|---|
| 08:00–10:00 | WP6 + WP1 + WP3 + WP4-núcleo en paralelo. Grok Bot con A. |
| 10:00–15:00 | WP2 (2 agentes) + WP5 en paralelo. Grok Bot termina A y empieza B. |
| 15:00–18:00 | Integración WP2/WP5 + WP8 mínimo + resto de WP4. **18:00: todo lo imprescindible integrado y jugado de principio a fin.** |
| 18:00–21:00 | Opcionales: parche (e5), WP8 completo, WP7 (P2 y P4), modelos B integrados, P3 al final. |
| 21:00–22:30 | WP10: QA, build y textos. Congelación. |
| 22:30–23:59 | Entrega (vídeo o enlace) con margen. |

### Riesgos
- **Reescribir la Fase 1 es lo más grande.** Si a las 15:00 no está, se entrega la Fase 1 actual con la tarjeta de misión y con solo **2 tareas nuevas** (cables + tanques) delante de la ronda GO, quitando el DSKY.
- La **sala de diseño** no debe tocar la física de las fases más allá de multiplicadores que ya existen (`ctx.diff.fuel`, `D.time`, densidad de rocas). Si un efecto da problemas, se muestra solo en el informe.
- **Compresión de modelos:** hacerla solo con los modelos finales de Grok Bot y con copia de los originales («no borrar modelos»).
- Los dos datos nuevos de (b) se verificaron en esta auditoría (fuentes en «Fuentes»). Cualquier dato nuevo que se añada sigue la misma regla: sin fuente, texto genérico.

---

## Índice de capturas (`auditoria-claude/*.jpg`)

- `01-menu-*`: carga, intro, inicio, briefing, bandera (país y diseño), ajustes, misiones, créditos, Bitácora, crear sala y unirse.
- `02-full-*`: misión completa con guion, del inicio al briefing de Kranz (prólogo, Fase 1, cap. 1, lanzamiento, viaje y noche en Columbia). Del 55 al 58: el cuestionario atascado (G3).
- `03-boss-*`: Guardián, fases 1–3 con el bot, fallos por O₂, victoria por API y tarjeta final.
- `04-desc-*`: alunizaje (1202 como Bales, P66, Eagle alunizó) y EVA (sitio de la bandera junto a rocas, G10).
- `05-fps-*`: una captura por escena medida.
- `06-eva-*`: desde la EVA hasta el final (Collins, opción del jefe, disyuntor, despegue, reencuentro, TEI, Laika, TV, reentrada, recuperación, LRL, desfile, epílogo e informe).
- `07-probe-*`: sondas de render.
- Registros con todos los textos que aparecieron en pantalla: `registro-*.txt`. Scripts reutilizables: `tools/*.mjs` (`QA_URL`, `PFX`, `START`, `DIFF`, `BOSS=1` para jugar el jefe dentro del flujo).

## Fuentes

- Enunciado del reto (transcripción de un equipo; la web oficial no cargó por TLS): https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game (`documentation/challenge.md`).
- Lista de retos de 2026 (secundaria): https://zilesinopti.ro/?p=892787 · Página oficial: https://www.spaceappschallenge.org/2026/
- Fuga de LH₂ en la cuenta atrás del Apolo 11: NASA Apollo Flight Journal, testimonio de Stephen Coester: https://www.nasa.gov/wp-content/uploads/static/history/afj/ap11fj/pdf/stephen-coester-apollo11-lh2-leak.pdf · https://usna63.org/tradition/memories/Apollo11LH2Leak.html
- Conectores rojo y azul del A7-L: Smithsonian NASM (fichas de trajes A7-L) https://si.edu/object/pressure-suit-a7-l-conrad-apollo-12-flown%3Anasm_A19711835000 · NASA ALSJ, traje de Aldrin: https://nasa.gov/wp-content/uploads/static/history/alsj/a11/A11BA-Flown-Suit.html
- El resto de los datos históricos citados ya están en el guion verificado del equipo: `../docs/GUION_v2_CORRECCIONES.md` (incluye el parche y Tom Wilson, desayuno 04:15, Jack King, 1202, Bales, Garman, disyuntor y rotulador, LRRR y Laika/Belka/Strelka).
