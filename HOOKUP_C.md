# HOOKUP_C: cinemáticas del capítulo 7 y del epílogo (trabajador C)

Todo es código nuevo; no se ha editado ningún archivo existente. Para activarlo, el lead tiene que hacer los **dos cambios pequeños** de los pasos 1 y 2 (el 3 es opcional).

## Archivos nuevos
| Archivo | Qué es |
|---|---|
| `src/game/cutscenes/cine-rails.js` | Formato puro (sin DOM ni Three) de cinemáticas de varios planos: `cine()`, `shot()`, `line()`. También contiene la lógica de reproducir y saltar (`createCinePlayback`, `stepCine`, `skipCine`) y las funciones de muestreo (`sampleCine`, `lineAt`). Usa las mismas llaves `{t,pos,look,fov}` y el mismo suavizado que `rails.js`. |
| `src/game/cutscenes/cine-play.js` | Reproductor. Construye la escena, hace `setWorld`, monta las barras con `mountLetterbox` (de `letterbox.js`) y muestra subtítulos y rótulos. Se salta con **Esc, Enter o tocando las barras**. Al terminar libera la escena y restaura el mundo. Si un glb falla, devuelve `played:false` sin bloquear. Exporta `playCine(id, opts)`, `playCineSequence(ids, opts)`, `stopCine()`, `CINE_IDS` y `EPILOGUE_ORDER`. |
| `src/game/cutscenes/cine.css` | Estilos de subtítulos, rótulos y fundido. |
| `src/game/cutscenes/cine-laika.js` + `src/scenes/cine-laika.js` | Escena 7.1B «La perrita» (21 s): laika-plush flotando con la Tierra detrás, inserto del Sputnik 2 de la Bitácora (sputnik-2) y vuelta al perrito. |
| `src/game/cutscenes/cine-recovery.js` + `src/scenes/cine-recovery.js` | Escenas 7.3 a 7.5 «Volver a casa» (25 s): ver detalle en «Cinemáticas». |
| `src/game/cutscenes/cine-lrl.js` + `src/scenes/cine-lrl.js` | Escena 7.6 «Cuarentena» (24 s): ver detalle en «Cinemáticas». |
| `src/game/cutscenes/cine-parade.js` + `src/scenes/cine-parade.js` | Escena E.1 «Un gran salto» (25 s): ver detalle en «Cinemáticas». |
| `src/scenes/cine-kit.js` | Utilidades: `char()` (personaje civil con clips, más capas de brazo `wave-arm`/`point-arm` sobre `sit`/`idle`), `prop()` con pose determinista `at(clip, t)`, `envMap()` (PMREM compartido) y `disposeScene()`. |
| `tests/cine.test.mjs` | Test puro: comprueba que todas las cinemáticas se pueden saltar y no bloquean, que los rieles son finitos y que los textos tienen ES y EN. |
| `tools/cine-preview.html` | Vista solo para dev: `npm run dev` → `/tools/cine-preview.html?cine=recovery|lrl|parade|laika|all[&rick=told]`. No entra en `vite build`. |

Los textos siguen la misma convención que el resto del juego: pares `[es, en]`, elegidos con `store.get('lang')` (español por defecto si el navegador está en español). El botón dice «Saltar · Esc».

## 1. Disparo en la misión (src/game/mission.js, función `debrief()`)
En el juego no hay fase de regreso: después de `eva` va directamente `debrief`. El capítulo 7 y el epílogo encajan justo antes del informe, solo en la misión completa (no en práctica). Cambiar el principio de `debrief()` por:

```js
async function debrief() {
  M.phase = 'debrief';
  // Cap. 7 + epílogo (Laika → amerizaje/Hornet → LRL → desfile). Saltables; nunca bloquean el informe.
  if (!M.practice && M.role === 'pilot') {
    show('<div class="screen"></div>', 'cine-epilogue'); // quita el HUD de la EVA; el Esc de pausa ya no aplica
    const { playCineSequence } = await import('./cutscenes/cine-play.js');
    await playCineSequence(undefined, { vars: { rickHeard: true }, restoreTo: null }); // debrief() llama a lobbyBg()
    if (!M) return; // abandonó durante la cinemática
  }
  const { default: run } = await import('./phases/debrief.js');
  ...resto igual...
```
- `show` ya está importado en mission.js.
- Cada Esc salta **una** cinemática. Para que un solo Esc salte las cuatro, pasar `skipAll: true`.
- `vars.rickHeard`: es la decisión del cap. 1 («contarles la verdad» = true). Como el juego todavía no guarda esa decisión, de momento va `true` (es la ruta histórica).
- En coop, el CAPCOM no ve las cinemáticas: el informe le llega cuando el piloto termina o las salta. Si se prefiere no retrasarlo, condicionar a `M.mode === 'solo'`.

Alternativa: poner `laika` al final de la fase cruise o eva (`playCine('laika', { ctx })`) y dejar el resto en `debrief()` con `playCineSequence(['recovery','lrl','parade'], …)`.

## 2. Vista de depuración (src/main.js, junto a la línea de `?debug&cue=`)
```js
if (DEBUG && params.get('cine')) { const c = await import('./game/cutscenes/cine-play.js'); const id = params.get('cine'); const vars = { rickHeard: params.get('rick') !== 'told' };
  return id === 'all' ? c.playCineSequence(c.EPILOGUE_ORDER, { vars }) : c.playCine(id, { vars }); }
```
URL: `/?debug&cine=recovery` (o `laika`, `lrl`, `parade`, `all`).

## 3. (Opcional) test
Añadir `&& node tests/cine.test.mjs` al final de `"test"` en package.json. Pasa: `PASS cine laika:21s,recovery:25s,lrl:24s,lrl:24s,parade:25s`.

## Modelos que usa (todos en public/models)
csm-columbia (existente: solo el CM; el SM se oculta; clip hatch-open), cm-recovery, pacific-recovery, sea-king, hornet, mqf, lrl-room, laika-plush, sputnik-2, parade-street, armstrong-civil, aldrin-civil, collins-civil, jan, rick, mark y extra-man-1/2 y extra-woman-1/2. **No toca** astronaut-a7l.glb ni easep-props.glb.

## Cinemáticas
- **Volver a casa (25 s):**
  - Bajada bajo los tres paracaídas (clip `chutes-deploy`).
  - Amerizaje con salpicadura y espuma; la cápsula vuelca y tres boyas la enderezan.
  - Llega el Sea King (`rotor-spin`), se infla el collar (`collar-inflate`) y se abre la escotilla (`hatch-open`).
  - Plano de la MQF en la cubierta del Hornet (la altura de la cubierta se calcula con un rayo).
  - Diálogos: Armstrong («Póngase el traje, caballeros…») y Nixon («La semana más grande…»).
- **Cuarentena (24 s):**
  - lrl-room con el vidrio: Neil camina hasta él; Aldrin y Collins al fondo; Jan, Rick y Mark del lado de las visitas.
  - Diálogos: Mark («¿Trajiste una piedra?»), Neil («veintiún kilos… son de todos») y Rick (dos variantes según `rickHeard`).
  - Final: Neil y Rick levantan la mano hacia el vidrio (capa `point-arm`).
- **Un gran salto (25 s):**
  - El descapotable avanza por parade-street con los tres en `seat-1..3` (`sit` + saludo del brazo).
  - El confeti (nodos `confetti-1..6`) cae y gira; hay 18 extras animados junto a las vallas.
  - Collins deja de saludar y mira a la multitud con la voz en off «lo logramos».
  - Plano grúa final con la gira mundial de 45 días por 24 países.
- **La perrita (21 s):** diálogos Collins/Armstrong/Aldrin del guion (resumidos) y rótulo «Tarjeta Legendaria · «Laika»».

## Avisos
- ⚠️ **Los 15 personajes se ven blancos o grises en el juego** (armstrong/aldrin/collins-civil, civil-base, jan, rick, mark, kranz, bales, duke, garman y extra-man/woman-1/2):
  - Su `COLOR_0` en el glb es todo 255 (blanco). Comprobado también en `Modelos_Blender/raw/*-raw.glb`.
  - Causa: en los .blend el atributo `Col` existe, pero `active_color_name` está vacío, así que `export_vertex_color='ACTIVE'` (en `scripts/char_lib.py:628`) exporta blanco.
  - Solución: antes de exportar, poner `mesh.color_attributes.active_color = mesh.color_attributes['Col']` (o exportar con `export_vertex_color='MATERIAL'`), volver a exportar y comprimir igual que antes.
  - No lo he cambiado porque está fuera de mi alcance.
- `node_modules/.bin/vite` no es ejecutable en esta copia (`Permission denied`). Para compilar usé `node node_modules/vite/bin/vite.js build`.
