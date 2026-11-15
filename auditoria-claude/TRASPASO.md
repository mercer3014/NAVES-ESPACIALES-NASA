# TRASPASO: cómo continuar "Apolo 11: Un gran salto"
Escrito el 15-nov-2026 a las 02:40 (hora de Bolivia), para que cualquiera pueda seguir el trabajo desde aquí.

**Entrega:** NASA Space Apps 2026, reto **Space Mission Design Game**. Fecha límite: **domingo 15-nov 23:59 (Bolivia, UTC-4)**.
**Repositorio:** https://github.com/mercer3014/NAVES-ESPACIALES-NASA

## 1. Estado de las ramas
| Rama | Qué tiene | Estado |
|---|---|---|
| `main` | La versión que se entregó antes | No tocar sin permiso de Alex |
| `unificado` (6b6936e) | La base de la que salen las mejoras | Estable |
| `mejoras` (e2a3f55) | Base de trabajo recomendada; contenido en la tabla de commits de abajo | Estable; `npm test` pasa con WP6 y WP8 |
| `mejoras-wip` (7711507) | `mejoras` más trabajo a medias de WP2a, WP4, WP5 y WP7 | **Sin terminar ni probar**. Puede romper el build |

Commits en `mejoras`:
- d5e3982: auditoría y plan (`auditoria-claude/PLAN-MEJORAS.md`).
- 6b6ec25 (WP6): teclado del cuestionario, FPS reales, HUD bajo el letterbox, cabina del CM cerrada, reloj del LM.
- 427c0d3: modelos nuevos guardian, boss-arena, o2-hose y memorial-kit. Los originales están en `art/glb-originales`.
- c2d26df (WP3): tarjetas de misión "Cómo jugar" antes de cada fase y botón en la pausa.
- c4cc1fe (WP1): cronología corregida, 10 tarjetas puente, Laika "No canon" y arreglo del contador de FPS en `engine.js`.
- 33d485c (WP2b): tareas "repara la fuga de LH2" y "alinea la plataforma".
- dd54c19 (WP8): Guardián. La cámara ya no entra en el gólem; la fase 2 tiene 3 pasos, la fase 3 es más larga y el O2 dura más.
- e2a3f55: tarjetas de misión en los minijuegos (disyuntor, despegue lunar, acople, reentrada, jefe).

Para jugar en local: `npm install` y luego `npm run dev`, y abre http://localhost:5173. Con `?debug&boss=1` vas directo al jefe.

## 2. Archivos que quedaron a medias en `mejoras-wip`
- `src/game/phases/prep-tasks/` (`index.js`, `cables.js`, `hatch.js`, `tanks.js`) y `prep-tasks.css`: WP2a, marco de tareas de la Fase 1. **Alex rechazó este enfoque** (ver la sección 3).
- `src/game/design/` y `tests/design.test.mjs`: WP5, "sala de diseño" de la misión (masa, combustible, etc.). Es la pieza que pide el reto; hay que terminarla.
- Interfaz 1969 (WP4):
  - fuentes nuevas Barlow Semi Condensed, IBM Plex Mono y Jost en `public/fonts`;
  - se borraron audiowide, orbitron, chakra, exo2 y mono;
  - archivos tocados: `style.css`, `screens.js`, `lobby.js`, `bitacora.css`, `flight-hud.css`, los css de `story/*` y `cutscenes/*`.
- Rocas de la EVA (WP7): `src/scenes/moonsurface.js` y `eva.js`, con capturas en `auditoria-claude/fase2/wp7-*`.
- `src/core/audio.js`, `main.js`, `prep.js`, `descent.js`, `debrief.js`, `cards.js`, `phase-cards.js`, `capcom.js`, `index.html` y `package.json` tienen cambios de varios paquetes.

Todavía **no están integrados** los modelos de Grok Bot de `auditoria-claude/modelos-grok/`; cada bloque trae su COPIAR.md y sus diffs.
- **Bloque A:**
  - `cm-interior.glb`, con los diffs `night-cam`, `collins-cam` y `reunion-cam`;
  - `lm-interior.glb`, con los diffs `cabin-glb` y `breaker-lm`;
  - `moon-rocks.glb` con LOD, con el diff `moonsurface-lod` (baja de 21,3 M a 0,69 M triángulos por cuadro).
  - Pendiente: en `night.js` los astronautas flotantes atraviesan el casco.
- **Bloque B:**
  - ropa civil: `armstrong-civil`, `aldrin-civil`, `collins-civil` y `civil-base` (Deke);
  - `saturn-v` nuevo y `ksc-crowd` (público de KSC);
  - trajes de vuelo `*-vuelo`, más `codigo-bloqueB/vuelo-a-bordo.diff` para `night.js`, `tv.js`, `collins-solo.js` y `reunion.js`.

## 3. Lo que Alex pidió y FALTA (prioridad alta)
Su feedback textual: las tareas son clics sin propósito, no se aprende nada; debe ser un **RPG**.

1. **Exploración tipo RPG en todas las fases.**
   - Controles: WASD o joystick, salto, cámara en tercera persona y "E para interactuar".
   - Personajes con los que se habla, con diálogo corto y con ramas. Por ejemplo, Guenter Wendt en la White Room, técnicos, la familia y el CAPCOM.
   - Objetos que se inspeccionan (🔍) y dan un dato real que explica **por qué** importa cada paso.
   - Se puede reutilizar `src/game/locomotion.js`, `src/core/input.js`, `eva.js` (en la Luna ya se camina), los NPC de P3 (`npc-spot`, clip `walk`) y el esqueleto Mixamo.
2. **Rehacer las tareas de la Fase 1 como exploración.** Llenar tanques con el ratón no tiene sentido. El jugador camina por la plataforma o la White Room, habla, inspecciona, entiende y entonces actúa.
3. **Cinemáticas interactivas** al estilo de su guion: decisiones ⚖️, momentos jugables 🎮 dentro de las escenas, exploración y curiosidad.
4. **La Bitácora como manual** que guarda logros, objetos encontrados 📘 y eventos ocultos. Ya existen `src/ui/bitacora.js` y `src/game/story/cards.js`.
5. **Completar el audio** de las escenas que no lo tienen. Mapas en `src/audio/*voice-map*`; se pueden usar audios de NASA de dominio público.
6. **Seguir el guion oficial**: está en `auditoria-claude/GUION-DISENO.txt`.
   - Capítulos: Prólogo, "Fuego en la plataforma" · Cap. 1, "La última cena en la Tierra" · Cap. 2, "Fuego y trueno" · Cap. 3, "Tres hombres en una lata" · Cap. 4, "Doce minutos" · Cap. 5, "Magnífica desolación" · Cap. 6, "El lado silencioso" · Cap. 7, "Volver a casa" · Epílogo, "Un gran salto".
   - Personajes jugables: Armstrong, Aldrin, Collins y Bales.
   - Además: desafíos difíciles y finales "¿Y si…?".
   - Inspiración: RDR2 (campamento y charlas), TLOU (notas y caminar hablando), God of War 2018 (cámara continua y codex), Detroit (objetivos visibles, investigación y diagrama de decisiones) y A Plague Tale (caminar con un acompañante).
7. **Requisito del reto.** El jugador debe **diseñar, gestionar y simular** la misión, tomando decisiones de ingeniería con recursos limitados (masa, combustible, energía, comunicaciones, presupuesto, instrumentos) y viendo cómo cada decisión afecta al resultado. Hay que terminar WP5 (`src/game/design/`) y conectar sus efectos con las fases.
8. **Pendientes técnicos.**
   - Verificar en el navegador cuánto dura el Guardián (4 a 6 min) y la cámara.
   - Actualizar `tools/boss.mjs` al flujo nuevo.
   - Optimización: la EVA corre a 24 fps en Intel UHD; las rocas LOD del bloque A lo arreglan.
   - El build pesa 132 MB.

## 4. Reglas del equipo
- No hacer merge a `main` ni desplegar en el VPS sin el OK de Alex.
- Solo usar assets originales o CC0.
- No modificar `public/models/astronaut-a7l.glb` ni `easep-props.glb`; los tests fijan su hash.
- No borrar audios ni modelos. Verificar cada cambio con `npm test` y en el navegador.
- Claude Pro: usar Opus solo para pensar o diseñar, Sonnet para implementar y Haiku para tareas mecánicas. Al llegar al 90 % de uso, hacer commit de todo. El límite de 5 horas se reinicia a las 06:20.
- Documentos útiles: `auditoria-claude/PLAN-MEJORAS.md` (auditoría con bugs G1 a G17), `REVISION-GROK.md` (paleta `#0A0C0F #15181D #2C3138 #ECE6D6 #FC3D21 #FFB000 #7CF04A`) y `PROGRESO.md`.
- En curso (Grok Bot): un plan detallado de guion contra juego y del rediseño RPG, que se guardará como `auditoria-claude/PLAN-RPG.md`.
