# Revisión independiente de Grok: rama `unificado` (lectura de código, 15 nov 2026)

Rutas relativas a `unificado/`. "L" = línea. Revisé el código y comparé con `Modelado_Apolo11` y el `game/public/models` viejo. No ejecuté el juego.

---

## 1. Flujo real del juego

Orquestador: `src/game/mission.js`, con `PHASES = ['prep','launch','cruise','descent','eva']` (L20).
- `runPhase` (L134–152) encadena las fases.
- Entre fases muestra el banner `ph.done` (L145) y luego llama a `storyGap('after:X')` + `storyGap('before:Y')` (L149).
- Los interludios salen de `SLOTS` en `src/game/story/flow.js` (L105–113).
- Solo se ven en modo solo + piloto + misión completa (`storyEnabled`, L116–118). En práctica y coop no hay historia.

| # | Momento | Contenido (orden real) | Tipo |
|---|---|---|---|
| 0 | `main.js` L34–62 | Boot (barra), video intro (`screens.js` L28), lobby `startScreen` (L60) → `briefingScreen` (L117: nombre, bandera, dificultad) | UI |
| 1 | before:prep | `hotel-prologue` (enero 1967, Apolo 1) → `mocr-tough` (Kranz «duros y competentes») | Cinemáticas P3 |
| 2 | **FASE 1 prep** | Cabina CM: 8 pasos de checklist, 3 fallas, DSKY, GO/NO-GO (ver §2) | Jugable |
| 3 | before:launch | `house-farewell` → decisión `kids` → `ksc` (Deke, «días antes») → `beach` (atardecer, «días antes») | Cine + decisión |
| 4 | **FASE 2 launch** | Cuenta T-17 (plano de la playa), despegue, corredor de cabeceo, Max-Q, 3 separaciones + torre LES | Jugable |
| 5 | (before:cruise vacío) | — | — |
| 6 | **FASE 3 cruise** | TLI (mantener) → transposición y acople (`playerDock`, L138) → alineación con 3 estrellas → `night` dentro de la fase (L192–194) → LOI tras la Luna (LOS/AOS) → foto Earthrise | Jugable + cine |
| 7 | before:descent | `mocr-briefing` (Houston: cierren las puertas) | Cine P3 |
| 8 | **FASE 4 descent** | P63/P64 automático → alarma 1202 (el jugador es Bales y dice GO, `descent.js` L215–249, con `mocr-1202`) → toma de control P66 → alunizaje → `mocr-landed` + `house-landed` (L206) | Jugable + cine |
| 9 | before:eva | Decisión `c5-rest` | Decisión |
| 10 | **FASE 5 eva** | Escalera de 9 peldaños → primer paso → muestra → bandera (3 golpes + barra) → saludo y foto → golf. Decisiones `c5-patch` y `c5-moment` | Jugable |
| 11 | after:eva | `collins-solo` → **`boss`** (opcional, No Canon) → `breaker` (puzle del rotulador) → `liftoff` → `reunion` (minijuego de acople) → `tei` → `laika` → `laika-talk` → `tv` → `reentry` (minijuego del corredor) → `recovery` → `lrl` → `parade` → `epilogue` | Cine + minijuegos |
| 12 | final | `debrief` (barras por fase, rango, tarjeta para compartir) | UI |

Además existen las expediciones Marte y Horizonte (`game/expeditions/*`), que se abren desde el lobby coop.

### Transiciones sin explicación (lo que Alex percibe)

1. **La cronología está invertida al inicio.** El jugador prepara la cabina en la plataforma el día del lanzamiento (prep). Esa fase termina con el banner `prep.countdown` (`prep.js` L150). Justo después el juego vuelve a la casa (la noche antes), a KSC («días antes») y a la playa («días antes»), y recién entonces despega. **Arreglo trivial:** mover `'before:prep'` a `['hotel-prologue','mocr-tough','house-farewell','kids','ksc','beach']` y dejar `'before:launch': []`. Así prep queda justo antes de launch, en el mismo día.
2. **Prep no dice dónde ni cuándo ni por qué.** `objectiveCardHtml` solo lleva el título «Cabina del Módulo de Mando» (`prep.js` L35), sin cuerpo. Falta algo como: «16 jul 1969, 6:30. Estás en Columbia, sobre 110 m de cohete. Antes de despegar, la nave tiene que pasar a energía propia y estar sellada.»
3. **De launch a cruise no hay nada** (`before:cruise: []`). En la realidad pasan 2,5 h en órbita terrestre antes de la TLI. Hace falta una tarjeta de 1 línea: «Órbita de estacionamiento · 1,5 vueltas · comprobaciones · ahora rumbo a la Luna».
4. **De cruise a descent salta a Houston** (`mocr-briefing`) y luego aparece el jugador dentro del Eagle. **Nunca se ve la separación de Columbia y Eagle** ni a Collins quedándose solo. Falta un plano de «Undocking · "The Eagle has wings"» (puede usar `csm-columbia` + `apollo-lunar-module`, que ya existen).
5. **El jefe aparece después de la EVA sin puente.** El texto del modal (`boss/story.js` L13–15) lo explica, pero tiene dos problemas:
   - El comentario de L1 dice «justo después de breaker» y `SLOTS` lo pone **antes**.
   - El jefe termina con «cierra el disyuntor con el rotulador» (`boss.js` L376 y L519) y **acto seguido** viene `breaker`, que es el mismo puzle. Se repite el clímax.
6. **El banner `ph.done` (genérico) + corte a negro** es igual en todas las fases. Debería ser una «tarjeta de capítulo» con fecha y hora MET, lugar y el objetivo siguiente (ver §4.2).
7. **No hay pantalla de «cómo jugar».** No existe ningún tutorial en `src` (grep de howto/tutorial = 0). Cada fase explica controles con un `hint` o con Pancho, pero no hay un objetivo con su porqué.

---

## 2. Tareas actuales de prep y launch

### `src/game/phases/prep.js` (152 líneas), FASE 1

- **Mundo:** `makeCabin({props:true})`, que usa `cabin-panels.glb` (L29). Si falla, cae a una vista orbital de la plataforma (L30–31).
- **HUD HTML encima:** checklist + 5 grupos de interruptores + medidores SVG + DSKY (L35–46).
- **Checklist `STEPS`** (L21–24), en este orden y obligatorio:
  1. BAT A y BAT B ON
  2. Celdas de combustible 1-3 ON
  3. Ventilador O₂ ON
  4. PGNS ON
  5. ABORT (con guarda: 1.er clic abre la guarda, 2.º acciona)
  6. S-BAND ON
  7. DSKY: escribir **VERB 3 7 NOUN 0 1 ENTR** (L95–107)
  8. Ronda GO/NO-GO: tocar 7 estaciones (`runPoll`, L125–142)
- **Fuera de orden:** sumar `mistakes++` y mostrar el toast «Fuera de orden — sigue la lista» (L80–83).
- **Fallas programadas** (`plan`, L117: pasos 1, 2 y 6), cada una con su solución:
  - `busb`: encender BAT C (L79)
  - `fc2`: botón PURGA (L92)
  - `lamp`: tocar 3 veces una lámpara (L93)
- **Pistas:** si te atascas 12 s, Pancho da una pista (L145).
- **Clic en la cabina 3D:** acciona el control HTML equivalente (L109–113, `SW_MAP` en `cabin.js` L7).
- **Puntaje:** `100 − 6·errores − 0,4·(tiempo−70) − 0,8·(tiempo de fallas−15)` (L148).
- **Bug menor:** L104 usa `$$('.dsky .lamps span')` sin `el` (sin acotar al HUD).

**Diagnóstico:** es una lista de 15+ clics sin causa ni efecto visibles. Un niño no sabe qué es FC, PGNS, BUS o V37N01. Además las «fallas» se resuelven con reglas arbitrarias (tocar 3 veces una lámpara). Esto es exactamente lo que Alex no quiere.

### `src/game/phases/launch.js` (263 líneas), FASE 2

- **Cuenta:** 17 s, saltable (L101–125). La cámara pasa de la playa a la órbita y al plano bajo (L90–99).
- **Vuelo:** dura 72 s comprimidos (`DUR`, L24), con 3 etapas (`STG`, L25–27).
- **Controles:** A/D = cabeceo, para mantener la aguja dentro de un **corredor** que baja de 90° a 12° (`target`, L28; `tol = 7·D.tol`, L62). W/S = empuje (0,4–1). Hay ráfagas de viento (`gust`).
- **Max-Q:** con `q = ½ρv²` sube el «estrés» si no bajas el empuje (L186–188).
- **Separaciones:** ESPACIO cuando aparece «STAGE» (`stagePrompt`), más la torre LES (o automática a los +9 s).
- **Puntaje:** 65 % tiempo en el corredor + 15 % estrés + 20 % prontitud al separar (L261).

**Diagnóstico:** es jugable y se entiende con el ADI. Solo le falta el porqué en pantalla:
- «Gira despacio hacia el horizonte: así ganas velocidad lateral para quedar en órbita.»
- «Separa: el tanque vacío es peso muerto.»

**No es prioridad cambiarla.** Lo que Alex odia es **prep**.

---

## 3. El reto de NASA que encaja

**Space Mission Design Game** (2026 NASA Space Apps Challenge; Games; Intermediate y Beginner/Youth), en el listado oficial https://www.spaceappschallenge.org/2026/challenges/ (la ficha propia devuelve error 500 al pedirla; mismo texto en https://nasaspaceapps.ae/challenges y en https://edeon.sonoma.edu/nasaspaceapps-26/index.html):

> "Designing a space mission requires careful consideration of competing demands, including mission objectives, spacecraft design, scientific instruments, launch vehicles, budgets, power, mass, communications, and orbital constraints. For students who rarely get to experiment with an entire mission from concept to operation, these trade-offs often remain abstract. Your challenge is to create an interactive game that allows participants to **design, manage, and simulate a complete space mission** while making engineering decisions, managing limited resources, and evaluating how each choice shapes the success of their mission."

La alternativa es «Build a Junior Astronaut Mission Trainer», que pide administrar una base lunar o marciana (soporte vital, radiación, energía, comida). Encaja menos con el Apolo 11. **Recomiendo presentar con Space Mission Design Game.**

### Cómo encaja «el usuario diseña» sin rehacer el juego

Ya existe parte del diseño:
- Estudio de bandera y parche (`screens.js` `flagStudio`, L198).
- La bandera se ve en el hombro del traje (`astronaut.js` L105).

Falta el **diseño con trade-offs**. Propuesta: una pantalla **«Planifica tu Apolo»** (1 pantalla, ~90 s) entre el briefing y el prólogo. El jugador reparte un **presupuesto de masa del LM** (barra de 100 «kg de juego»):

| Decisión | Opciones | Efecto real en el juego (variables que ya existen) |
|---|---|---|
| Sitio de alunizaje | Mar de la Tranquilidad (plano, seguro) / Cráter (más ciencia, más rocas) | Densidad de rocas en el descenso y bonus de ciencia en la EVA |
| Combustible del descenso | +/− segundos | `ctx.diff.fuel` (ya lo usa `descent.js`) |
| Carga científica | EASEP sismómetro / retrorreflector LRRR / caja de muestras extra | Qué tareas aparecen en la EVA (`easep-props`, `sample-box` ya están) y puntaje de ciencia |
| Ventana de lanzamiento | 16 jul (sol bajo, buenas sombras) / día siguiente (sol más alto) | Ángulo del sol en la Luna (visibilidad del cráter) |
| Parche y bandera | Estudio actual | Visual (traje, lobby, debrief) |

Después, el debrief **evalúa cada elección**. Por ejemplo: «Llevaste 8 s menos de combustible: aterrizaste con 3 s de margen. Armstrong aterrizó con ~25 s.» Ahí se cumplen las tres partes del reto: diseñar, simular y evaluar.

**Costo:** 1 pantalla nueva + pasar 3 o 4 parámetros por `startMission({ plan })` → `ctx.plan`. No toca modelos.

---

## 4. Ideas propuestas

### 4.1 Minijuegos estilo Among Us (1 pantalla, 1 gesto, ≤30 s, explican el porqué)

Regla común:
- Panel 2D grande sobre la cabina 3D difuminada.
- Arriba, una frase del tipo **«Por qué»**.
- Abajo, el gesto.
- Sin teclado numérico.
- Al completar: «ding», luz verde y la cabina 3D refleja el cambio. `cab.setSwitch` y `cab.setNeedle` ya existen.

**Prep nueva = 4 tareas en cualquier orden** (lista tipo Among Us a la izquierda, ya no checklist secuencial) **+ GO/NO-GO final.**

| # | Tarea | Hecho real | Gesto | Dónde |
|---|---|---|---|---|
| A | **Conecta tu traje** | Cada astronauta conectaba a la nave las mangueras de O₂ (azul de entrada, roja de salida) y el cable de comunicaciones (el «Snoopy cap») | Arrastrar 3 cables de color a su enchufe (los cables de Among Us) | prep |
| B | **Pasa la nave a energía propia** | Antes del despegue el CM deja la energía de tierra y usa sus 3 celdas de combustible (H₂ + O₂ → electricidad + agua) | Girar 3 perillas hasta que cada aguja quede en verde. Una celda «se ahoga» y hay que **mantener PURGA** hasta que suba | prep (reemplaza BAT/FC/BUS/lámpara) |
| C | **Sella la escotilla** | Lección del Apolo 1: escotilla nueva que abre en 3 s; se hace una prueba de fugas | Girar la manivela 3 vueltas y ver que la presión se mantiene 5 s | prep |
| D | **Despierta la computadora** | El AGC, 2 KB de RAM, «verbo + sustantivo» | **Tocar 3 tarjetas ilustradas** (VERBO = acción, SUSTANTIVO = cosa, ENTER) que forman la frase «MOSTRAR · HORA». Se aprende la idea sin teclear códigos | prep (reemplaza V37N01) |
| E | **Alarma 1202: limpia la computadora** | El radar de encuentro saturaba al AGC; la computadora descartaba tareas y seguía | 8 «tareas» caen en una cola; arrastra al cesto las que no importan (radar) y deja guiado y motor | descent (reemplaza o complementa el GO/NO-GO de Bales, `descent.js` L215–249) |
| F | **El disyuntor roto** | Aldrin cerró el disyuntor de armado del motor de ascenso con un rotulador de punta de fieltro | Elegir herramienta (dedo, lápiz metálico, rotulador) y arrastrarla al disyuntor. El metal hace chispa y explica por qué | `breaker.js` ya es esto: solo hay que hacerlo arrastrable |
| G | **Alinea la plataforma (IMU)** | Las estrellas se marcaban con el sextante para corregir los giróscopos | Arrastrar la retícula sobre la estrella brillante hasta que el anillo se cierre | cruise ya tiene «3 estrellas»: rediseñar como gesto único |

Cierre de prep: **GO/NO-GO** se queda (es icónico). Las estaciones se iluminan solas una a una con la voz de Kranz y el jugador solo pulsa «GO» al final. **Quitar el modal de 7 clics.**

### 4.2 Tejido narrativo (tarjeta de capítulo entre fases)

Reemplazar `ph.done` + corte por una **tarjeta de capítulo** de 4 s, saltable. Incluye:
- Fecha y MET.
- Lugar, con un mini-mapa Tierra–Luna y un punto que avanza.
- **1 frase de por qué estás aquí.**
- **1 frase de qué vas a hacer.**

Se puede montar con `phaseStamp` y `presentation.js`.

| Antes de | Tarjeta (ES) |
|---|---|
| prep | «16 jul 1969 · 6:32 · Plataforma 39A. Tres hombres, 110 m de cohete. Antes de encenderlo, la nave tiene que respirar y tener energía propia.» |
| launch | «T-3 min. Todo GO. Mantén el cohete en su ruta; cada etapa vacía es peso que hay que soltar.» |
| cruise | «2 h 44 min · Órbita terrestre. Una quema de 6 min y vamos a la Luna: 3 días, 384.000 km.» |
| descent | «20 jul · 100 h · Órbita lunar. Collins se queda en Columbia. Eagle baja sola: 12 min, combustible justo.» (+ plano del desacople) |
| eva | «Base Tranquilidad. Tenemos 2 h 30 min afuera. Lo que se haga hoy es la ciencia del siglo.» |
| after:eva | «Ahora hay que volver: el motor de ascenso tiene una sola oportunidad.» |

Además:
- **El hilo emocional ya existe** (Karen, los hijos, Apolo 1). Hay que hacerlo explícito con una línea recurrente: **«Volver a casa»**. Por ejemplo, el dibujo de los hijos del cap. 1 reaparece en la cabina, en la EVA y en la reentrada.
- **Jefe:** moverlo **después** de `breaker` y cambiar su final, para que la derrota sea al guardián (sin disyuntor). O, mejor, dejar el disyuntor solo en el jefe y que `breaker` sea su epílogo de 20 s.

### 4.3 Dirección visual concreta

**Concepto:** «Hoja de plan de vuelo + panel del Apolo». Papel, tinta, gris de cabina, ámbar de alarma y verde del DSKY. Nada de vidrio esmerilado, degradados ni pasteles.

**Qué lo hace ver «genérico IA» hoy:**
- `.panel` con `border-radius:18px` + `backdrop-filter:blur(12px)` (`style.css` L106).
- `.btn{border-radius:12px}` y `.btn.go` verde neón `#3ddc84` con borde `#7fffb8` (L112–114).
- `.bar>i` con degradado ámbar→blanco (L49).
- Punto azul que late y esquinas en corchete en el boot (L37–44).
- **Seis familias tipográficas** (Orbitron, Chakra, Mono, Exo, Audiowide; L1–6).
- HUD salvia, dorado y coral pastel (`flight-hud.css` L3–10: `#8fbf9b`, `#c6a36a`, `#d36a5c`).
- Galaxias rosa y violeta en el lobby (`lobby.js` L12, `0xffc0e0`).
- Tres lenguajes visuales mezclados: menú crema/rojo, HUD salvia y botones neón.

**Paleta (6 tokens, reemplazar en `:root` y `--mhud-*`):**

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#0A0C0F` | Fondo |
| `--panel` | `#15181D` (sólido, sin blur) | Tarjetas |
| `--line` | `#2C3138` | Bordes 1 px |
| `--paper` | `#ECE6D6` | Texto principal y tarjeta de papel |
| `--dim` | `#878C93` | Secundario |
| `--signal` | `#FC3D21` (rojo NASA, ya usado) | Acción principal, foco |
| `--caution` | `#FFB000` | Alarma o aviso (ya existe) |
| `--go` | `#7CF04A` (verde electroluminiscente del DSKY), **solo** en estado OK, nunca de fondo de botón | OK |

**Tipografía (2 familias OFL, autoalojadas en `public/fonts`, funcionan offline):**
- **Barlow Condensed** 600/800 para títulos y números grandes (estilo DIN/NASA).
- **IBM Plex Mono** 400/600 para datos, MET y códigos.
- Opcional: IBM Plex Sans para párrafos.
- Retirar Orbitron, Audiowide y Exo. Chakra puede quedarse una semana, pero no suma.

**Lobby:**
- **Izquierda:** el menú como **hoja de plan de vuelo**: papel `#ECE6D6`, texto negro y numeración roja `01 02 03…`. Esto ya se insinúa en `.mbtn .idx` (`style.css` L88–98): llevarlo al extremo y quitar el resto.
- **Derecha:** el **Saturn V en la plataforma 39A al amanecer** (`pad.js` sin encendido, la misma escena de `beach.js`), con cámara lenta en órbita. Hoy hay un LM viejo (`lm.glb`) y un astronauta flotando sobre galaxias rosas.
- Botón principal: «INICIAR MISIÓN», rectángulo rojo `#FC3D21`, radio 2 px, sin sombra.
- **Tarjetas:** radio 2 px, fondo sólido, borde 1 px, franja izquierda de 3 px del color de estado, título en Barlow Condensed en mayúsculas y kicker en Plex Mono (`FASE 03 · CRUCERO · MET 002:44`).
- **Barra de carga:** cambiar a **una silueta del Saturn V en horizontal** dividida en 3 tramos (S-IC, S-II, S-IVB) que se rellenan en `--paper`. Debajo, una **cuenta regresiva real** «T-10 … T-0» en Plex Mono en lugar del porcentaje, con líneas de checklist auténticas («GUIDANCE … GO»). Sin degradado, sin brillo y sin punto que late.
- **HUD de fase:** reemplazar `--mhud-go`, `--mhud-gold` y `--mhud-bad` por `--go`, `--caution` y `--signal`. Bajar la opacidad de los paneles al 85 % sólido, sin blur.

### 4.4 «Cómo jugar»

- **Primera vez en cada fase:** overlay de 3 viñetas (qué haces, por qué, controles con iconos de tecla o toque) que se descarta con 1 clic. Se guarda en `store` como `seenHowto[phase]`.
- **En el lobby:** botón «CÓMO JUGAR» con las 5 fases en 1 línea cada una.

---

## 5. Pelea del Guardián (`src/game/boss/*`, `src/scenes/boss-arena.js`)

**Estructura** (`boss.js`, 536 líneas):
- **Fase 1 (Polvo):** romper 4 placas (2 golpes c/u) con el martillo (E o clic), aturdir con el flash (F o clic derecho) y golpear el núcleo. La vida tiene un piso de 71 mientras quedan placas.
- **Fase 2 (Combustible):** clones sin sombra; el flash revela al real → Neil te lanza («Salto del Águila») al depósito.
- **Fase 3 (Fuego):** manguera con Neil (Q) para abrir el núcleo → 35 HP → `breakerOpen` → cerrar el disyuntor con E → victoria.
- Solo se pierde por O₂ (`fail`). Cada fase se puede reintentar (`restartPhase`).
- **¿Se puede ganar?** Por lógica sí: todas las fases tienen una salida y hay reintento por fase. No hay piso de vida que impida bajar a 0 en la fase 3 (`damage`, L214–219). **Sin ejecutarlo no lo confirmo.** Prueba rápida en localhost: `/?debug&boss=1`, `&boss=3` (`main.js` L21). La API de depuración `window` tiene `win()` y `setPhase()` (L527).

**¿Usa nuestro guardian.glb? No.**
- `public/models/guardian.glb` pesa **369.356 B** y el nuestro (`Modelado_Apolo11/P4_Luna/glb/guardian.glb`) pesa **298.976 B**.
- `boss-arena.glb`: público **365.468 B**, nuestro **95.884 B**.
- El código espera materiales `crack-amber` y `dsky-digits` (`boss.js` L80–81, `boss-arena.js` L91). **Nuestro guardián tiene** `regolito-guardian, cavidad, core-dsky, kapton, basalto, tanque, tanque-banda`, **sin esos nombres**.
- **Sí coinciden:** clips `idle/sweep/slam`, nodos `core-dsky`, `fuel-tank`, `plate-*`, `hand-l/r`, `head`, `hips`. Cambiar al nuestro es casi directo.

**Bugs y riesgos probables:**
1. **Instante del golpe del slam fijo en 1,42 s** (`boss-arena.js` L90 `A.slam.time = 1.42`; `boss.js` L150 `dur: e.teleDur + 1.42`; L186 `R.st > 1.4`). Nuestro clip impacta a **1,2333 s**: con nuestro glb, el daño y la onda llegan unos 0,19 s después de que el puño toca el suelo. Medirlo como se hace con el sweep (L73–75) o fijarlo en 1.2333.
2. Si se cambia al nuestro, **el núcleo no parpadea ni brilla** porque los nombres de material no coinciden. Hay que mapear `crack-amber`→`cavidad` y `dsky-digits`→`core-dsky`.
3. **No se usan los empties** `spawn-player` / `spawn-guardian` de nuestra arena. Las posiciones están fijas en el código (`P.z=-18`, `place(R,0,4)`), así que con nuestra arena el jugador puede aparecer en el borde. Leer los empties.
4. **El guardián no se rota −90° ni se ajusta la cámara de jefe a unos 15 m.** El código orienta el guardián con `core-dsky` (L87, eso sí funciona), pero el sol está fijo en `(-0.9,0.3,0.32)` (L14). Con nuestro guardián (15,4 m de alto) hay que **verificar la cámara**: si está pensada para uno más bajo, el jefe queda fuera del cuadro.
5. **Salto del jefe:** `P.vy = 3.6` con g = 1,62 da unos **4 m de alto y 4,4 s en el aire** (L368). Es muy flotante: el jugador queda sin control mientras el sweep vuelve. En la EVA el salto es `2,5` (unos 1,9 m). Sugiero 2,6–2,8.
6. **`renderer.shadowMap.enabled` se activa y nunca se restaura** (`boss-arena.js` L12; también `pad.js` L70 y `moonsurface.js` L12). Es estado global pegajoso.
7. **El clímax se repite con `breaker`** (ver §1.5).
8. **Usabilidad:** 7 acciones (WASD, ratón, E, F/clic derecho, Shift, Q, Espacio). Para un niño es demasiado. Proponer modo «Cadete»: flash y martillo automáticos cerca del objetivo.

---

## 6. Rendimiento

**Peso de `public/` (de `public-list.txt`):** 423 archivos, **133,5 MB**:
- mp3: 323 archivos, 57,6 MB
- glb: 60 archivos, 28,8 MB
- mp4: 17,9 MB
- ktx2: 14,0 MB (Marte)
- webm: 7,7 MB
- webp: 3,9 MB
- jpg: 3,2 MB

**Más pesados:**
- `video/intro_720.mp4` 14,5 MB, `intro_720.webm` 7,7 MB (con `preload="metadata"`, bien).
- `tex/mars/regolith_*.ktx2` 5,3 + 4,6 + 4,1 MB (solo Marte).
- `audio/music/ambient.mp3` **3,75 MB** (suena en prep), `title.mp3` 2,2 MB.
- `models/rover.glb` **2,0 MB y 183.037 triángulos** (Marte).
- `lc39a-terrain.glb` 1,8 MB / 94 k triángulos.
- `astronaut-a7l.glb` 1,5 MB / 55 k.
- `moon-rocks` 1,46 MB.
- `s4b-sla` 1,45 MB.
- `csm-columbia` 1,37 MB.

**Lo que está bien:**
- Carga diferida por fase (`import()` en `mission.js` L21).
- Caché de glb.
- Resolución dinámica según fps (`engine.js` L20–29).
- DPR limitado a 2 / 1,5.
- Sin antialias en móvil.
- El boot solo carga 5 texturas y 1 sfx (`main.js` L31–48).

**Riesgos:**
1. **Música con `html5:false`** (`core/audio.js` L29): cada pista se descarga y se decodifica entera a PCM (un mp3 de 3,7 MB ocupa unos 40–60 MB de RAM), y la caché `M[name]` nunca se libera. En móviles y Chromebooks es el mayor riesgo de cuelgue. **Arreglo:** `html5:true` para la música o `unload()` de la pista anterior.
2. **`glbCache` nunca se vacía** (`engine.js` `model()`). Al llegar al epílogo están en memoria todas las escenas: pad, cabina, CM, LM, superficie, arena y Tierra.
3. **Duplicados y modelos muertos en `public/models`:**
   - `saturn_v.glb` (fallback, 237 KB)
   - `lm.glb` (738 KB y **86 k triángulos**, solo para el lobby y fallbacks)
   - `astronaut.glb` / `astronaut_a7l.glb` (en `game/` viejo)
   - `civil-base.glb` 1 MB (se usa en `ksc.js` L28; existe nuestro `civil-base-p3.glb` de 163 KB)

   **El lobby carga `lm.glb` (86 k triángulos) en lugar de `apollo-lunar-module` (46 k)**, que además ya se usa después (`lobby.js` L19).
4. **Sombras PCFSoft 2048** en la plataforma, la superficie y la arena. Bien en el nivel alto, pero el flag global queda encendido (ver §5.6).
5. **Bloom con EffectComposer** en el lanzamiento (`scenes/fx.js` L213–228): costo extra a pantalla completa.
6. **Polvo con 900 partículas** actualizadas en JS en cada fotograma (arena y EVA). Bien.

**Recomendación para hoy:**
- Música en `html5:true`.
- Lobby con `apollo-lunar-module`.
- Restaurar `shadowMap.enabled=false` en cada `dispose`.
- Revisar `Q.mobile` para quitar bloom.
- Solo es necesario medir con `stats.fps` (que ya existe).

---

## 7. Modelos para mejorar en Blender (mayor impacto visual)

**Hallazgo importante:** `public/models` tiene **versiones viejas, a mitad de corrección, de nuestros modelos P3 y P4**. Comparación por tamaño:

| Modelo | public | nuestro final |
|---|---|---|
| armstrong-house | 90.568 | 135.568 (con `window-day` / `window-night`) |
| mocr-room | 87.448 | 132.372 (`npc-spot-extra-*`) |
| pacific-recovery | 57.024 | 182.856 |
| parade-street | 87.244 | 162.116 |
| lrl-room | 42.172 | 63.352 |
| hotel-room-1967 | 45.868 | 38.240 |
| earth-props | 73.232 | 90.488 |
| eva-tools | 37.504 | 27.868 |
| memorial-kit | 55.504 | 50.680 |
| o2-hose | 17.308 | 18.680 |
| guardian, boss-arena | (ver §5) | (ver §5) |

Los personajes (kranz, bales, duke, garman, jan, rick, mark, controller-extra) sí coinciden.

Además, el código **no lee** `walk_speed_mps` (por eso los pies patinan al caminar), ni `window-day/night`, ni `npc-spot-extra` (grep = 0). **Copiar los finales es la mejora visual más barata.** Le toca a P2, que es quien copia a `public/models`.

**Prioridad Blender (impacto ÷ esfuerzo):**

| # | Archivo | Qué se ve mal o falta (según el código o la inspección) | Cambio propuesto |
|---|---|---|---|
| 1 | **Lobby (nuevo `lobby-pad-dawn.glb` o reuso)** | El lobby usa `lm.glb` viejo (86 k triángulos, clips basura `group13 …Action`) + astronauta flotando + galaxias rosas | Componer en Blender una escena «39A al amanecer» de bajo costo: Saturn V (`saturn-v.glb`, 53 k) + torre (`launch-tower`) + silueta del terreno, con iluminación horneada. **Exportar como un único glb ≤ 1,5 MB**, o reusar `makePad()` sin motores. Mucho más «NASA» que el espacio genérico |
| 2 | **Cabina de prep para minijuegos** (`cabin-panels.glb`, 37,6 k triángulos, 26 materiales) | Las nuevas tareas necesitan objetos tocables: 3 enchufes umbilicales de color, manivela de la escotilla, 3 perillas de celda de combustible | Añadir nodos con nombre (`umb-o2-in`, `umb-o2-out`, `umb-comm`, `hatch-crank`, `fc-knob-1..3`) con pivotes, en un glb complementario `prep-tasks.glb` (sin tocar el existente). Cables con hueso o curva simple para animar la conexión |
| 3 | **Traje (`astronaut-a7l.glb`)** | **No se puede modificar** (los tests fijan su hash: `tests/assets.test.mjs` L4). Solo se puede tocar por código: visor dorado (`astronaut.js` L56) y bandera (L105) | Hacer accesorios aparte: `suit-umbilicals.glb` (las 3 mangueras para la tarea A de prep) y un parche de misión como decal (textura generada por `renderPatch`). Así el «diseño del usuario» se ve en el traje |
| 4 | **Cohete (`saturn-v.glb`, 53 k triángulos, 15 materiales, sin clips)** | Es el protagonista del lanzamiento y del lobby. Revisar: banda negra y blanca de los rodillos (roll pattern), letras «USA» y bandera, escarcha de LOX en S-II/S-IVB (hoy son partículas `ice` en `pad.js` L206), toberas F-1 | Si las texturas son de 512 px, subir a 1–2 k WebP solo en el S-IC y el CSM. Añadir anillo de escarcha como malla con alpha. Añadir empties `stage-1-sep` y `stage-2-sep` si `W.stage(i)` hoy separa por cajas |
| 5 | **guardian.glb + boss-arena.glb (nuestros)** | Ver §5: el público es otra versión, con materiales `crack-amber` / `dsky-digits` | Opción rápida: en Blender **renombrar** nuestros materiales `cavidad`→`crack-amber` y `core-dsky`→`dsky-digits` (emisivos), re-exportar con la regla 7 + `--resample false`, y entregar a P2 con la nota del impacto a 1,2333 s |
| 6 | **Interior del CM** (`cm-interior.glb`, 52 k triángulos) | Sale en `night`, `collins-solo`, `reunion` y cruise | Revisar solo la iluminación (emisivos de panel); bajo esfuerzo |
| 7 | **`civil-base.glb` (1 MB)** | Slayton en `ksc.js` | Reemplazar por nuestro `civil-base-p3.glb` (163 KB, mismo esqueleto Mixamo) para ahorrar 840 KB |

**No tocar:** `astronaut-a7l.glb` y `easep-props.glb` (hash fijado).

---

## Resumen de prioridades para hoy (≤ 23:59)

1. **Orden de `SLOTS`** (cronología) + tarjetas de capítulo con el porqué: 1 h, solo código.
2. **Prep → 4 minijuegos** (A–D) + GO automático: 3–4 h, Claude en código y yo en Blender con `prep-tasks.glb`.
3. **Re-tematizar CSS** (6 tokens, 2 fuentes, sin blur ni degradados) + lobby en papel + barra Saturn V: 2 h.
4. **«Planifica tu Apolo»** (diseño con trade-offs para el reto): 2 h.
5. **Rendimiento:** música `html5:true`, lobby con `apollo-lunar-module`, restaurar sombras: 30 min.
6. **Copiar los glb finales de P3 y P4** + ajustes del guardián (1,2333 s y nombres de material): 1 h.
