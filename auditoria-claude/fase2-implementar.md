FASE 2: IMPLEMENTAR el plan `auditoria-claude/PLAN-MEJORAS.md` (tu propio plan), complementado con la revisión de Grok Bot en `auditoria-claude/REVISION-GROK.md`. Estás en la rama `mejoras`. Entrega final hoy 23:59 Bolivia; todo lo imprescindible integrado y jugado de principio a fin antes de las 18:00.

PRESUPUESTO (importante, plan Pro): tú, el líder, corres en Sonnet. Orquesta subagentes en paralelo pero con modelos baratos: crea definiciones en `.claude/agents/` con `model: sonnet` para paquetes de lógica/UI (WP1, WP2, WP3, WP4, WP5, WP8) y `model: haiku` para tareas mecánicas (WP6 bugs de una línea, cambios de CSS repetitivos, correr tests, WP10 parcial). No uses Opus. Prompts de subagentes cortos y precisos, con los archivos que son de su propiedad exclusiva (tabla de la sección i). Evita releer archivos enormes enteros; usa grep.

ORDEN Y REGLAS
1. Respeta "un archivo, un dueño" de la sección i. Paralelo en worktrees separados (git worktree add ../wt-wpN mejoras-wpN) o en la misma carpeta si los archivos no se cruzan; integra en el orden WP6 → WP1 → WP3 → WP2 → WP5 → WP4 → WP8 → WP7.
2. Commit en `mejoras` después de integrar CADA paquete (mensajes en español), para no perder trabajo si se corta el plan. Sin push, sin merge a main.
3. Cada paquete pasa `npm test` y `npm run build` antes de integrarse. Actualiza tests que cambien por diseño (story.test.mjs, etc.), sin borrar tests que protegen hashes de `astronaut-a7l.glb` y `easep-props.glb` (prohibido tocar esos dos glb).
4. No borres audios ni modelos. Fuentes tipográficas OFL autoalojadas en public/fonts.
5. Deja el servidor Vite del puerto 5173 como esté; usa otro puerto para tus pruebas (5180+).

DECISIONES DE DISEÑO YA TOMADAS (combinan ambos planes)
- Fase 1 "La mañana del lanzamiento": 4-5 tareas estilo Among Us, en cualquier orden, con controles de puntero (ratón y táctil) y un niño debe entenderlas sin leer mucho: conectar mangueras del traje por color, llenar tanques, reparar la fuga de hidrógeno (dato real 16 jul 1969), alinear la plataforma con una estrella, sellar la escotilla. Fuera el DSKY con VERB/NOUN, las palancas y los números.
- Tarjeta de misión antes de cada fase: qué pasó de verdad (fecha, lugar), tu misión, controles con iconos/teclas. Botón "Cómo jugar" en pausa.
- Tarjetas puente entre escenas para que se entienda por qué y cómo llegamos (orden cronológico corregido).
- Sala de diseño "Tu Apolo 11" (reto Space Mission Design Game): núcleo decisiones 1-4 + informe "diseño vs resultado" + "rediseñar y volver a volar".
- Interfaz "Plan de vuelo 1969": sin pasteles, sin glassmorphism/blur, sin degradados neón, sin galaxias rosas. Paleta negro/crema/naranja internacional de tu plan. Lobby limpio, menú reducido, barra de carga en cuenta regresiva. Tarjetas planas con borde fino, esquinas 2-4 px, tipografía condensada.
- Guardián (WP8): usa los modelos nuevos de Grok Bot. Descomprime `auditoria-claude/para-public.zip`: copia `para-public/models/{guardian,boss-arena,o2-hose,memorial-kit}.glb` a `public/models/` (guarda los originales en `art/glb-originales/`) y aplica los cambios de código de `para-public/COPIAR.md` §3 (golpe del slam a 1.2333 s con constante SLAM_HIT) y §5 recomendados (cámara del jefe ~12 m, spawns desde la arena, restaurar sombras). Luego cámara que no se meta en el gólem, fase 2 más simple, fase 3 más larga, O₂ claro.
- Rendimiento WP7 P0 y P1 son imprescindibles (rocas sin sombra pequeñas + descarte por distancia; contador de FPS real). Compresión meshopt de modelos solo al final (a partir de las 20:00), guardando originales.
- Modelos 3D (WP9) los hace Grok Bot en paralelo y los dejará en `auditoria-claude/modelos-grok/` con un COPIAR.md; no edites glb a mano salvo flags de material en código (por ejemplo DoubleSide de G4 como arreglo rápido).

AL TERMINAR CADA HITO escribe una línea en `auditoria-claude/PROGRESO.md` (hora, paquete, commit, estado). Al final: recorrido completo con tus herramientas de `auditoria-claude/tools/`, capturas nuevas en `auditoria-claude/fase2/` (lobby, carga, cada tarjeta de misión, las tareas nuevas, sala de diseño, guardián, EVA con FPS) y un resumen de 20 líneas con lo hecho, lo pendiente y los FPS de la EVA antes/después.
