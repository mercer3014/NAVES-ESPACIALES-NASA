# HOOKUP_D — Jefe No Canon «El Guardián de Tranquilidad» (trabajador D)

Guion: escena 6.1B FASE 3 + 6.1C (sueño de Aldrin en Eagle, antes del despegue lunar; **NO CANON**).
Plan v4: MON_Guardian + ENV_Guardian_Arena (+ o2-hose, fx-meshes).

## Archivos NUEVOS (no se editó ningún archivo existente)

| archivo | qué es |
|---|---|
| `src/scenes/boss-arena.js` | Escena: boss-arena.glb, Eagle (apollo-lunar-module.glb, respaldo lm.glb) en el borde, sol bajo con sombras, cielo/Tierra, polvo, plantillas de fx-meshes.glb, `loadGuardian()` (guardian.glb clonado, materiales por instancia, orientación por el núcleo DSKY, medición del impacto del `slam`). |
| `src/game/boss/boss.js` | Lógica del combate. **Entrada única `runBoss(opts)`** + adaptador `bossPhase(ctx)` para mission.js. |
| `src/game/boss/hud.js` | HUD propio (capa fija `.bossD`, clases con prefijo `bd-` para no chocar con style.css), ES/EN por `lang()`. |
| `src/game/boss/story.js` | Interludio listo para `story/flow.js`: tarjeta «Soñar (jugar) / Saltar» → `runBoss`. |
| `src/game/boss/dev.html`, `dev.js` | Banco de pruebas aislado (solo `vite dev`, no entra en el build normal). |

Modelos usados (ya en `public/models/`): `guardian.glb`, `boss-arena.glb`, `o2-hose.glb`, `fx-meshes.glb`, más existentes `astronaut-a7l.glb` (sin modificar, vía `makeAstronaut`), `apollo-lunar-module.glb`, `boot-print.glb`.

## API

```js
import { runBoss } from './game/boss/boss.js';
const r = await runBoss({
  flag, name,            // bandera/nombre del jugador (para el parche del traje)
  diff: 'normal',        // 'easy'|'normal'|'hard'|'extreme' o los del juego: 'cadet'|'normal'|'veteran'
  startPhase: 1,         // 1..3 (depuración)
  skipIntro: false,
  restoreWorld: true,    // al terminar vuelve a setWorld(mundoAnterior)
  onWin:  (r) => {},     // r = { result: 'win',  stats }
  onLose: (r) => {},     // r = { result: 'lose', stats }  (solo si el jugador elige «Despertar (salir)»)
});
// r.result: 'win' | 'lose';  r.stats: { hits, rainHits, perfect, retries, time, diff, noRainHit, reason }
```
Se limpia solo (bucle onTick, listeners, HUD, pointer lock, `body.dataset.screen` restaurado). Mientras corre pone `document.body.dataset.screen = 'boss'` (así el Esc de mission.js no abre su pausa; el jefe tiene su propia pausa con Reanudar / Reintentar fase / Despertar). Si el O₂ llega a 0: «Aldrin despierta de golpe» → Reintentar desde el inicio de la fase (guion) o salir (`onLose`).

## Cableado recomendado (orden del guion)

El sueño ocurre **después del disyuntor (cap. 6) y antes del cap. 7**. En `src/game/story/flow.js`:

```js
// en STORY
boss: own(() => import('../boss/story.js')),
// en STORY_TITLES
boss: ['Cap. 6 · Polvo y fuego (No Canon)', 'Ch. 6 · Dust and fire (Non-canon)'],
// en SLOTS
'after:eva': ['breaker', 'boss', 'laika', 'recovery', 'lrl', 'parade'],
```
`story.js` pregunta antes (es opcional, 6–10 min) y devuelve `{ id:'boss', played, skipped, result, stats }`; nunca bloquea el guion (ganar, perder o saltar → sigue con `laika`). Desde el menú «Escenas del guion» funciona igual (`playStory('boss')`); con `playStory('boss', { force: true })` se salta la pregunta.

Alternativa (si se quiere como fase puntuable): en mission.js `import { bossPhase } from './boss/boss.js'` y llamarlo como fase; devuelve `{ score, stats, result }`.

## Atajo de depuración (añadir en `src/main.js`, dentro de `boot()`, junto a los otros `if (DEBUG && …)`)

```js
if (DEBUG && params.has('boss')) { const { runBoss } = await import('./game/boss/boss.js'); lobbyBg(); return runBoss({ startPhase: +params.get('boss') || 1, diff: params.get('diff') || undefined, skipIntro: params.has('skip'), onWin: () => location.assign('/'), onLose: () => location.assign('/') }); }
```
URL: `/?debug&boss` (con intro), `/?debug&boss=2&skip` (fase 2), `/?debug&boss=3`.
Sin tocar main.js ya funciona en `npm run dev`: `http://localhost:5173/src/game/boss/dev.html?phase=1|2|3&diff=normal&skip`.
En consola (DEBUG): `__boss.setPhase(3)`, `__boss.stun(5)`, `__boss.win()`, `__boss.attack('sweep'|'slam'|'spikes')`, `__boss.rain()`, `__boss.heat()`.

## Cómo se juega (resumen para el informe)

Controles: WASD · ratón mira · Espacio salta (baja gravedad) · Shift esquiva · E / clic martillo geológico · F / clic derecho flash Hasselblad (12 disparos por carrete, recarga lenta) · Q manguera de O₂ · Tab fija/libera la cámara en el Guardián · Esc pausa. Táctil: joystick + botones SALTO, MARTILLO, FLASH, ESQUIVA, MANGUERA.
O₂ = estamina y vida: saltar y esquivar gastan; se recupera quieto (Normal) y con cartuchos verdes del suelo (+30). Armstrong acompaña como compañero (IA).

1. **POLVO (100→70 %)**: barrido (abanico naranja que tiembla antes), golpe al suelo (anillo rojo que crece; el Guardián se abalanza), lanzas de regolito (círculos rojos), «lluvia 1202» (pitido de alarma maestra + círculos ámbar; si te toca, el HUD se apaga 4 s). Romper las 4 placas de basalto (2 golpes c/u; rodillas siempre, hombros cuando está aturdido o tras su golpe al suelo), flash para aturdir 3 s y martillo al núcleo DSKY; «Foto y golpe» (golpe < 1,5 s tras el flash) = ×2,5.
2. **COMBUSTIBLE (70→35 %)**: 3 Guardianes; los clones no proyectan sombra. Cuenta atrás en el depósito (60 s Normal; verde→rojo; ecos de Duke «Sesenta… Treinta segundos»); a 0 = onda que quita 45 de O₂. Flash al real → los clones se deshacen y Neil se coloca detrás → anillo azul → Espacio = «Salto del Águila» al lomo → mantener E (pinzas) 1,5 s → depósito arrancado.
3. **FUEGO (35→0 %)**: grietas naranjas, ondas de calor en anillo (saltarlas), se arrastra hacia Eagle; la escotilla parpadea y una barra se llena (si se cubre del todo, despiertas). Q junto a Neil = manguera compartida: O₂ al 100 % y ×2 de daño 10 s con el núcleo expuesto (si tu O₂ baja de 25 %, la manguera se recarga al instante: «Respirar juntos»). Cada golpe al núcleo lo empuja lejos de Eagle. A 0 → disyuntor roto en el núcleo → E «cierra el disyuntor con el rotulador» → cinemática (se deshace en polvo, queda una huella de bota, «Segundo… pero juntos.») → tarjeta de Bitácora No Canon (dato real del polvo lunar, qué fue sueño y qué era real, insignia, logro oculto sin golpes de la lluvia 1202) → «Despertar en Eagle» → `onWin`.

«Esquiva en cadena»: esquivar justo antes de un golpe → cámara lenta 1 s. Logros guardados en `store.achievements`: `boss_guardian`, `boss_norain` (sin toast porque no hay claves i18n `ach.*` para ellos; si se quieren con toast, añadir `ach.boss_guardian` / `ach.boss_norain` en i18n y usar `achieve()`).

## Desviaciones respecto al guion/plan
- **Sin cambio de personaje en tiempo real (party swap estilo Genshin)**: se juega con Aldrin y Armstrong es compañero IA. Los combos se mantienen como acciones de un solo jugador: «Salto del Águila» (Neil te lanza), «Foto y golpe», «Respirar juntos», «Esquiva en cadena».
- Pinzas: se usan solo para arrancar el depósito (sin gancho de escalada; los hombros se alcanzan durante el aturdimiento).
- Sin audio nuevo: voces como subtítulos; sfx/música existentes (`tension`, `ambient` como «solo piano», `jingle_win/fail`).
- Fase 2: el «escenario se reduce» no se implementó; en su lugar los Guardianes se reordenan cada 20 s.

## Verificación (trabajador D)
- `node node_modules/vite/bin/vite.js build --outDir /tmp/build-D` OK (build normal) y OK con una config temporal que añade `src/game/boss/dev.html` como entrada para compilar también el jefe (chunk `boss-*.js` ≈ 61 kB, 24 kB gzip). Nota: `npx vite` da «Permission denied» porque `node_modules/.bin/vite` no tiene bit de ejecución; usar `node node_modules/vite/bin/vite.js …` o `chmod +x node_modules/.bin/vite`.
- `node tests/no-emoji.test.mjs` PASS.
- Recorrido headless completo (swiftshader): intro → fase 1 (placas, flash + «Foto y golpe», paso a fase 2) → fase 2 (flash al real, Salto del Águila, depósito → fase 3) → fase 3 (onda de calor, manguera, núcleo, disyuntor) → cinemática → Bitácora → `onWin` con `{ result: 'win' }`. Capturas: `/workspace/integracion-screens/D-*.png`.
