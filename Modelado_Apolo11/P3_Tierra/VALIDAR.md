# Cómo validar los modelos de Persona 3 en tu laptop (Windows)

Necesitas **Node.js 20.19 o superior** (Vite 8 no arranca con Node 18; compruébalo con `node -v`) y un navegador. Descomprime `entrega-p3-principal.zip` y `entrega-p3-previews.zip` en la **misma** carpeta (por ejemplo el Escritorio): los dos crean la carpeta `entrega-p3`. Si solo tienes el principal, todo funciona igual; el de previews solo añade imágenes.

## 1. Abrir el visor de modelos

En PowerShell:

```powershell
cd ruta\a\entrega-p3\visor
npm i
npm run dev
```

Abre http://localhost:5190

Si el puerto está ocupado, Vite te dará otro; usa esa dirección.

### Qué deberías ver

A la izquierda, el grupo «Persona 3 · Tierra» con 16 archivos `.glb`. En el centro, el modelo con una cuadrícula de 1 m y un maniquí naranja de 1,80 m. A la derecha, las métricas del validador, los clips y la lista de nodos.

### Qué comprobar en cada modelo

**Personajes** (`civil-base-p3`, `kranz`, `bales`, `duke`, `garman`, `jan`, `rick`, `mark`; y `controller-extra`, el relleno del MOCR):

1. Elige el modelo. Debe aparecer de pie, con los pies en el origen (el cruce de los ejes).
2. Compara con el maniquí: los cinco adultos llegan ~1,80 m; Jan un poco más baja (~1,65); Rick ~1,50; Mark ~1,15, con la cabeza un poco más grande.
3. En «Clips», prueba los 7: `idle`, `walk`, `sit`, `sit-floor`, `talk`, `point` y `wave`.
   - `walk` mueve los pies en el sitio (es *in place*). Para ver que no patina, usa la pestaña **Caminar** de la escena de prueba: allí cada personaje avanza a su `walk_speed_mps`.
   - `idle`: brazos relajados, cerca del cuerpo, sin atravesar camisa ni chaleco. `talk`, `point` y `wave` arrancan y terminan en idle sin salto.
   - `sit` deja la espalda recta, los muslos horizontales y las rodillas a 90°. El asiento queda a unos 0,45 m en los adultos (a escala en Jan, Rick y Mark).
   - `sit-floor` sienta al personaje en el suelo (cadera a y≈0), con las piernas abiertas o cruzadas. Sirve para el `extras.pose = "sit-floor"` de Mark en la casa.
4. En nodos debe existir `mixamorig:Hips` o `mixamorigHips` (three.js quita los `:`) y el nodo `armature`.
   - `controller-extra` solo tiene los clips `idle`, `sit` y `talk`, y un nodo `shirt` (el visor la muestra blanca; las variantes celeste y beige se ven en la escena de prueba).
5. Identidad: Kranz con chaleco blanco/marfil y corbata negra; Bales con lentes de pasta y auriculares; Duke con auriculares; Garman con lentes finos y camisa clara, sin auriculares; Jan con vestido celeste; Rick con camiseta roja; Mark con camiseta clara y pantalón corto.

**mocr-room:** sala de ~20 × 15 m, 4 filas de consolas, pantallas, pizarra «TOUGH AND COMPETENT», nodos `console-guido`, `console-flight`, `console-capcom`, `wall-screens`, `npc-spot-kranz` (y bales/duke/garman) y `npc-spot-extra-1` … `npc-spot-extra-16` (asientos de relleno). Si el visor te muestra la sala por debajo, órbita hacia dentro: el suelo es de una sola cara.

**armstrong-house:** salón y cocina de 1969, techo a ~2,5 m (no uses la caja completa, que incluye el cielo de las ventanas). Nodos `tv-set`, `squawk-box`, `npc-spot-jan/rick/mark/neil` y `window-backdrop` con `window-day` y `window-night` (en el visor se ven las dos superpuestas; la escena de prueba muestra una cada vez). El sofá mira a la TV. El de Mark tiene `extras.pose = "sit-floor"`; el de Rick, `sit-sofa`.

**lrl-room y hotel-room-1967:** desde fuera se ven como una caja. Entra con la órbita o, más fácil, míralos en la escena de prueba (paso 2). Dentro: cristal de cuarentena, sillas mirando al vidrio y dos teléfonos (LRL); cama, teléfono de disco y ventana (hotel). Los spots de asiento llevan `extras.pose` (`sit` o `stand`) y, si corresponde, `extras.seat_height` (0,45 m en las sillas, 0,55 m en la cama).

**pacific-recovery:** océano de 200 × 200 m. Acerca la cámara; reproduce el clip `waves`. Debe haber `life-raft` y `cm-spot`.

**earth-props:** pizarra «TOUGH AND COMPETENT» a escala de persona, cohete de juguete, parche, sobres, foto, libreta y hoja de alarmas, todos en el suelo junto al maniquí.

**parade-street:** edificios, público en las aceras, un coche y confeti (clip `confetti-fall`). Mejor a pie de calle en la escena de prueba.

### Criterio de aprobado en el visor

- Escala coherente con el maniquí o con las medidas de arriba.
- Nada atravesado de forma grave (un poco de solapamiento en sillas es menor).
- Los 7 clips de los personajes se reproducen, incluido `sit-floor`.
- Nodos requeridos aparecen en la lista.
- Avisos del validador: no se espera ninguno. Si falta un clip, un hueso o un nodo, si la altura se sale de rango o si un personaje supera su máximo de triángulos, no apruebes.

## 2. Abrir la escena con personajes en las salas

En otra ventana de PowerShell:

```powershell
cd ruta\a\entrega-p3\prueba-escena
npm i
npm run dev
```

Abre http://localhost:5191 (si el puerto está ocupado, Vite usa el siguiente; mira la consola).

Esta escena usa el mismo mecanismo de carga del juego (GLTFLoader + MeshoptDecoder). Arriba a la izquierda puedes cambiar de sala. Orbitas con el ratón; rueda para acercarte.

| Pestaña | Qué deberías ver | Qué mirar |
| --- | --- | --- |
| MOCR | Sala de control, 4 controladores con nombre y **16 de relleno** con camisas blancas, celestes y beige | Botones: «Vista Bales» (la inicial: Bales y Garman sentados rectos en la trinchera), «Jugador (pasillo trasero)» y «Jugador (centro)» (de pie en la fila 4, ojos a 1,6 m: la sala debe verse poblada), «Vista general». Nadie atraviesa las sillas ni flota. |
| Casa | Salón y cocina, familia Armstrong | Botones **Día 15:17** (lo inicial: ventanal con cielo, árboles y casa vecina) y **Noche 21:56** (fondo nocturno; se cambia también la luz que entra por la ventana). Rick sentado en el sofá **mirando a la TV** («Vista lateral» muestra sofá y TV juntos). Mark en la alfombra con `sit-floor`, sin flotar. Jan de pie. `civil-base-p3` hace de Neil en la cabecera del comedor. |
| LRL | Cristal de cuarentena y sillas | Jan sentada frente al teléfono; Mark y Rick de pie; `civil-base-p3` hace de Neil al otro lado del vidrio. |
| Pacífico | Mar, balsa y boyas | Las olas se mueven. |
| Props | Pizarra y objetos junto al maniquí | La pizarra mide ~1,80 m. |
| Hotel 1967 | Cama, teléfono y ventana | Un civil sentado en el borde de la cama (0,55 m) y Jan junto a la ventana. |
| Desfile | Calle, coche, público, confeti | El confeti cae. |
| Personajes | Los 8 civiles + 3 controller-extra (camisa a, b, c) en idle | Escala: 5 adultos ≈1,80 m, Jan, Rick y Mark más bajos. Brazos relajados junto al cuerpo, sin atravesar la ropa. |
| Caminar | Los 8 caminando en carriles, cada uno a su velocidad | **El pie apoyado no debe resbalar sobre la rejilla.** Botones «Pies» (cámara baja) y «Pausa». La velocidad de cada uno sale en el panel. |
| Caras | Las 8 cabezas a la misma altura | «Kranz y Bales», «Duke y Garman», «Familia»: se distinguen ojos (iris de color, párpado), cejas, nariz, boca y lentes. Bales lleva lentes negros gruesos y Garman lentes de metal finos. |

### Criterio de aprobado en la escena

- Los personajes aparecen en sus `npc-spot` (no fuera de la sala ni bajo el suelo).
- `sit` deja la espalda recta; `sit-floor` deja a Mark en el suelo, sin flotar.
- Si el spot declara `seat_height`, el personaje se asienta a esa altura (silla 0,45 m, cama 0,55 m).
- Las alturas relativas se mantienen (Mark < Rick < Jan < adultos).
- No hay errores en la consola del navegador (F12), aparte de un posible 404 de favicon.

## 3. (Opcional) Validador en terminal

```powershell
cd ruta\a\entrega-p3\_Compartido
npm i
node validar_glb.mjs ..\glb --reglas reglas-p3.json --md ..\informe-mio.md
```

Debe listar 16 archivos, todos con meshopt y **0 avisos**.

## Si algo no carga

- ¿Corriste `npm i` dentro de `visor` y de `prueba-escena`, no en la carpeta de arriba?
- ¿Node.js es 20.19 o superior? (`node -v`; con Node 18 Vite 8 falla al arrancar).
- Si un modelo sale rosa o no aparece, mira F12 → Consola y pestaña Red, por si un `.glb` no se sirvió.
