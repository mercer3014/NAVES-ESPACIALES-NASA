# HOOKUP_B: cinemáticas de la Tierra (hotel 1967, MOCR, casa Armstrong)

Lo hizo el trabajador B. Todo está en **archivos nuevos**: no se tocó ningún archivo existente y no hay cambios de git.

## Archivos nuevos
| Archivo | Qué es |
|---|---|
| `src/scenes/cine-common.js` | Base de las escenas. Personajes con `modelAnim` y un mixer por actor (`play`, `walkTo`, `face`). Salas con `model()`, pantalla de TV en CanvasTexture y `propCopy` para copiar nodos de earth-props. |
| `src/scenes/cine-mocr.js` | `makeMocr({ era: '1967' \| '1969' })`. Carga mocr-room, kranz, bales, duke y garman, más 13 controladores extra sentados (civil-base, extra-man-1/2). También la hoja de Garman (earth-props › alarm-sheet), la luz ámbar de la alarma y `cheer()`. |
| `src/scenes/cine-house.js` | `makeHouse({ moment: 'farewell' \| 'landed' })`. Carga armstrong-house, con la TV en blanco y negro en tv-set › tv-screen. Personajes: jan, rick, mark y armstrong-civil. Utilería de earth-props: toy-saturn-v con el clip stages-separate, framed-photo y mission-patch. |
| `src/scenes/cine-hotel.js` | `makeHotel()`. Carga hotel-room-1967 y armstrong-civil sentado en la cama. El auricular (hotel-phone-handset) vibra al sonar y sube a la oreja. |
| `src/game/cutscenes/cine-player.js` | Reproductor de cinemáticas con escena propia. Usa `letterbox.js` y el mismo muestreo de rieles que `rails.js`. |
| `src/game/cutscenes/cine-mocr.js`, `cine-house.js`, `cine-hotel.js` | Definiciones de planos, con cámara, líneas ES/EN y eventos. |
| `src/game/cutscenes/cine-index.js` | Registro público: `playCinematic`, `playSequence`, `CINE_IDS`, `CINE_SEQUENCES`, `previewCinematic`, `stopCinematic`, `cinematicActive`. |

## Cómo funciona (importante para el cableado)
- `playCinematic(id, opts)` guarda el mundo actual (`getWorld()`) y monta la escena de la cinemática con `setWorld`. Recorre los planos y al final **devuelve el mundo anterior tal cual**. Devuelve `Promise<{ id, played, skipped }>`.
- Se puede saltar con Esc, Enter o tocando una barra negra. Saltar corta la cinemática entera.
- El listener de teclado está en fase de captura y hace `stopPropagation`, así que Esc **no** abre la pausa de la misión mientras dura la cinemática.
- Mientras se reproduce, `body[data-cine]` oculta `.screen` (HUD de fase y menús), Pancho, `.phase-stamp`, la radio y los toasts. Al terminar se vuelven a mostrar solos.
- Si se le pasa `ctx`, se corta sola si la fase muere (`ctx.dead` o `onCleanup`). También se corta si otro código cambia de mundo, por ejemplo al reiniciar o salir.
- **No pausa el motor**: los `ctx.loop` de la fase siguen corriendo. En el descenso hay que congelar la simulación (ver más abajo). No usar `setPaused(true)`, porque el reproductor avanza con `onTick` y se quedaría congelado también.
- `rails.js` no se modificó: el test `cutscenes.test.mjs`, que fija los 7 `CUE_IDS`, sigue igual.
- Los textos se muestran en ES o EN según `store.get('lang')`. El hablante aparece en el título con la etiqueta « · REAL» (frase de las transcripciones) o « · DRAMATIZADO», como en el guion.

## IDs, contenido y duración aproximada
| id | Guion | Duración | Qué muestra |
|---|---|---|---|
| `hotel-prologue` | Prólogo 0.2 | ~34 s | Hotel de noche y el teléfono suena. «Hubo un incendio en la cabina… Gus, Ed y Roger… no salieron». Silencio con la ciudad al fondo, la cartera (Karen, sin describirla), la libreta «Ed White — El Lago, Texas» con la voz en off de Neil y la nota de la bitácora sobre el Apolo 1. |
| `mocr-tough` | Prólogo 0.3 | ~31 s | Kranz en 1967 frente a las filas: el discurso «Duros y competentes» (REAL), un primer plano de la pizarra «TOUGH AND COMPETENT» y el rótulo «Dos años y medio después». |
| `house-farewell` | Cap. 1, 1.1 | ~40 s | Neil entra, Jan le habla en la cocina («…puede que no vuelvas»), Neil camina a la sala y Rick pregunta «¿Desde la Luna se ve nuestra casa?». Cierra con el Saturn V de juguete de Mark separando sus etapas. |
| `mocr-briefing` | Cap. 4, 4.2 | ~23 s | MOCR el 20/07/1969 a las 19:50 UTC: Kranz cierra las puertas y da su discurso. Plano de Bales (GUIDO) y de Garman con su hoja 1201/1202. |
| `mocr-1202` | Cap. 4, 4.4 | ~21 s | Alarma ámbar en la consola de Bales y las voces de radio de Armstrong y Aldrin. Kranz: «Guiado, ¿cómo estamos?», Garman: «…Es GO», Bales: «¡Seguimos, Flight!» y Duke: «Estamos GO con esa alarma». Con `answer: 'late'` o `'abort'`, Kranz decide por Bales («Seguimos» y «Bales se quedó congelado. Kranz lo cubrió»), como en el guion. |
| `mocr-gonogo` | Cap. 4, 4.5 | ~16 s | GO/NO GO para aterrizar: «¿RETRO?», un barrido por la trinchera con «¡GO!…» y Duke: «Tienen GO para aterrizar». Aldrin responde «3.000 pies». |
| `mocr-landed` | Cap. 4, final de 4.6 | ~19 s | La sala en silencio, «Houston, aquí Base Tranquilidad…» y Duke: «…un montón de tipos a punto de ponerse azules. Volvemos a respirar». Después la sala celebra (saludos) y aparece la nota de los ~45 s de combustible. |
| `house-landed` | Cap. 4, 4.7 | ~22 s | Jan en el sofá junto a la squawk box con la TV en vivo. Se oye a Duke por el altavoz y Jan cierra los ojos. Rick: «Mamá… lo hizo» y Jan: «Todavía no. Todavía tiene que volver». |

Secuencias: `CINE_SEQUENCES.prologue = ['hotel-prologue','mocr-tough']`, `chapter1 = ['house-farewell']` y `landing = ['mocr-landed','house-landed']`. `playSequence('prologue', opts)` corta toda la secuencia si el jugador salta una cinemática.

## Cableado propuesto (lo hace el lead)

### 1) Prólogo y cap. 1: antes de la fase `prep`, solo en la misión completa (no en práctica ni coop-capcom)
En `src/game/mission.js`, dentro de `startMission`, justo antes de la última línea `runPhase(resume?.phase || practice || 'prep');`:
```js
if (!practice && !resume && role === 'pilot') {
  const { playSequence } = await import('./cutscenes/cine-index.js');
  const r = await playSequence(['hotel-prologue', 'mocr-tough', 'house-farewell']);
  if (!M) return; // salió durante la cinemática
}
```
Opcional: mostrarlo solo la primera vez, con una marca en `store` como `store.get('cineSeen')`. Hoy no existe esa clave.
En coop, el capcom no pasa por aquí (`runCapcom`). Si el lead lo prefiere, puede reproducirlo solo en modo `solo`.

### 2) Escena 4.2: al empezar el descenso
En `src/game/phases/descent.js`, justo después de `const W = makeMoonSurface(...); ctx.world(W);` y antes del HUD:
```js
const { playCinematic } = await import('../cutscenes/cine-index.js');
if (!ctx.practice) await playCinematic('mocr-briefing', { ctx });
```
`ctx.world(W)` ya se llamó, así que al terminar vuelve al mundo lunar. Si se pone antes de `ctx.hud(...)`, el HUD aparece después de la cinemática.

### 3) Escena 4.4: alarma 1202 (en `alarm1202()` de descent.js)
Después de calcular `st.alarmOk` y de `box.style.display = 'none'`, antes de los `ctx.banner`, hay que **congelar la simulación**. El bucle principal no da pasos si `mode` no es `'auto'` ni `'manual'`:
```js
const pm = mode; mode = 'hold';
await playCinematic('mocr-1202', { ctx, answer: ans === 'go' ? (st.alarmT <= 5 ? 'go' : 'late') : 'abort' });
mode = pm;
```
Con `mode = 'hold'` el bucle principal llega al `else break` y no avanza `s`, pero `W.setLM`, `camUpdate` y `drawHud` siguen llamándose sin problema. Esto lo verificó B leyendo el código de descent.js, no ejecutando la fase. Mientras dura la cinemática el mundo visible es el MOCR, así que no se ve el descenso congelado.

### 4) Escena 4.5: GO/NO GO (opcional)
Justo antes de `await handover();` (la primera vez, después de `await ctx.until(() => agl(s) < 300)`):
```js
{ const pm = mode; mode = 'hold'; await playCinematic('mocr-gonogo', { ctx }); mode = pm; }
```
Si son demasiadas interrupciones en el descenso, quitar esta. Es la menos importante.

### 5) Escenas 4.6 y 4.7: alunizaje
En descent.js, después de `await ctx.wait(3.5);` (la órbita lenta sobre el LM) y antes de calcular el puntaje:
```js
if (st.result === 'good' && !ctx.practice) { const { playSequence } = await import('../cutscenes/cine-index.js'); await playSequence('landing', { ctx }); }
```
Va después de la cue `eagle` (riel sobre el LM): si siguiera activa, el reproductor llama a `stopCue()` al empezar.

### 6) Depuración (opcional)
En `src/main.js`, junto a `?debug&cue=`:
```js
if (DEBUG && params.get('cine')) { const { previewCinematic } = await import('./game/cutscenes/cine-index.js'); return previewCinematic(params.get('cine')); }
```
Con eso, `/?debug&cine=mocr-1202` repite la cinemática en bucle. En `?debug`, `window.__cine.jump(i)` salta al plano `i`.

## Dependencias
Los glb que hay que tener en `public/models`:
- mocr-room, kranz, bales, duke, garman, civil-base, extra-man-1, extra-man-2
- armstrong-house, jan, rick, mark, armstrong-civil, earth-props
- hotel-room-1967

Todos ya están copiados. Si falta uno, la cinemática sigue sin él (aviso en la consola) y nunca se bloquea más de 9 s cargando.
Sonidos usados (todos existen en `public/audio/sfx`): beep, ok, tick, door, ping y jingle_win.

## Desviaciones del guion o del plan
- **0.2 (hotel)** es jugable en el guion (mover la cámara y mirar la cartera y la libreta). Aquí es una cinemática que muestra los dos objetos. La foto de Karen solo se nombra, no se muestra, respetando el guion («recuerdo privado»).
- **1.1 (casa)**: la decisión «¿Cómo habla Neil con sus hijos?» no se juega. Se muestra la ruta histórica, con el diálogo de Rick y Neil y el cohete de Mark. En 4.7 tampoco hay abrazo: el esqueleto no tiene clip de abrazo, así que Rick está de pie detrás de Mark.
- **Garman** está al fondo de la fila 4 del MOCR, porque la sala de apoyo real no está modelada.
- **4.4**: la decisión de Bales sigue siendo el panel 1202 del juego (GO/ABORT). La cinemática solo muestra la reacción de Houston según la respuesta. El aborto real a órbita («¿Y si…?») no está implementado: el juego ya muestra «Era GO».
- Los personajes sentados no usan el clip `talk`, porque es de cuerpo entero y los pondría de pie. Hablan sentados sin gesto.
- No hay audio de voz nuevo, solo subtítulos y efectos. `voice('eagle')` ya suena en descent.js al alunizar.
