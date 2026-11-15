
## Bloque B (Grok Bot · civiles, Saturn V y público del KSC)

Finales sin compresión en `models/` (lo pedido: sin Draco ni meshopt) y la misma versión comprimida con el comando seguro de siempre en `models-meshopt/` (meshopt + webp, `--resample false`, mismos tamaños que los originales, ~1 MB por personaje). **Para el juego copia la de `models-meshopt/`** a `public/models/` (la sin comprimir pesa ~6,5 MB por personaje).

| Archivo | Qué cambió | Qué se conserva |
|---|---|---|
| `armstrong-civil.glb` | Polo azul claro de manga corta (antebrazos reales, sin mono), pantalón gris, cinturón con hebilla, sin parches/nombre/cremallera. Dedos semicerrados (flexión de la malla de la mano; no hay huesos de dedo). | Esqueleto de 22 huesos, nombres de nodos, 6 clips (`idle walk sit talk point wave`), origen y escala: comprobado idéntico al original. |
| `aldrin-civil.glb` | Polo azul marino de manga corta, pantalón caqui, cinturón. Manos relajadas. | Igual. |
| `collins-civil.glb` | Camisa a cuadros roja/azul marino de manga larga (mangas menos holgadas), cuello y puños azul marino, pantalón gris azulado. Manos relajadas. | Igual. |
| `civil-base.glb` (Slayton) | Camisa blanca de manga corta sin huecos de piel en la cintura ni en los costados, **corbata estrecha azul marino con rayas**, cinturón limpio, sin muñequeras blancas. Manos relajadas. | Igual. |
| `saturn-v.glb` | Pintura blanca a `#E8E6E0` con más contraste de paneles, rugosidad 0,62 (menos brillo quemado), anillos entre etapas en gris (`JointMetal` 0,30), juntas más oscuras. | Todos los nodos de etapas (`S1C S2 S4B IU SLA CSM LES Spacecraft`, `s2-aft-interstage`, `*-thrust-point`) con la misma posición. |
| `ksc-crowd.glb` | Público de cajas → 11 personas redondeadas low-poly (cabeza esférica, torso ovalado, brazos y piernas cilíndricos) en 6 atuendos de 1969: camisa blanca + sombrero, vestido + pamela, polo + bermudas + prismáticos, blusa + capri + peinado cardado, niño con camiseta de rayas y gorra (algunos saludan), señor sentado en silla de playa con camisa estampada. 261–298 triángulos por persona. | Nodos `crowd-a/b/c` (grupos de 3–4 personas, mismo pivote, miran a +Z), hijos `-geo` con material `crowd-cloth` + colores de vértice; coches y furgoneta sin tocar. |

**Código:** no hace falta tocar nada; `src` no tiñe materiales de estos modelos (revisé `cine-kit.js`, `story/*.js`, `pad.js`, `ksc-crowd.js`). Notas:
- `story/night.js`, `tv.js`, `reunion.js` y `collins-solo.js` usan estos mismos `*-civil.glb` **dentro de la nave**: ahora ahí salen de polo/cuadros (antes con el mono azul). Si se quiere el mono de vuelo blanco en esas escenas hace falta otro glb (`*-vuelo.glb`), no está hecho.
- El público pasa de ~200 a ~1.000 triángulos por grupo (unos 130.000 en toda la playa con los ~127 grupos de `loadKscCrowd`). Si va lento en la laptop: en `ksc-crowd.js` subir el paso de las filas lejanas de 30 a 60 m o quitar la fila `dz = -8`.
- El "blanco quemado" del Saturn V en el juego viene sobre todo de la exposición y del brillo especular, no del albedo (la textura ya era `#DDDDD8` de media). Si sigue quemado, bajar `toneMappingExposure` o `envMapIntensity` en `pad.js`.
- «UNITED STATES» sigue en el S-II y «USA» con la bandera en el S-IC, que es como estaba pintado el AS-506 real (el plan pedía las letras en el S-IC). El patrón de *roll* negro y blanco del S-IC ya existía. No añadí una franja negra al S-II porque el S-II del Apolo 11 era blanco.

Capturas: `capturas/comparar-<nombre>.png` (antes arriba, después abajo), `capturas/trio-civiles-despues.png`, `capturas/antes/` y `capturas/despues/`. Scripts reproducibles en `work/` (`civil.py`, `build.sh`, `crowd.py`, `render_char.py`) y `Modelado_Apolo11/_Compartido/_apply.mjs`, `_sv.mjs`, `_crowd.mjs`.

## Bloque A (Grok Bot · cabina del CM, interior del LM y rocas lunares)

Finales sin compresión en `models/`; la misma versión comprimida con el comando seguro (meshopt + webp) en `models-meshopt/`. **Para el juego copia la de `models-meshopt/`** a `public/models/` (mismo nombre). Validador: 0 errores en los tres (en `cm-interior` solo quedan los avisos de kebab-case que ya traía, como `couch-CDR` y `MDC`). Khronos: 0 errores.

| Archivo → `public/models/` | Qué cambió | Triángulos antes → después | Peso comprimido |
|---|---|---|---|
| `cm-interior.glb` | Las paredes ya tenían las normales hacia dentro. El problema era que **la cámara quedaba fuera del cono**, y desde fuera la pared de una cara es invisible. Añadí el nodo `cabin-shell-outer`, hijo de `cabin-shell`: una piel exterior con normales hacia fuera, a 3,5 cm, con canto en las 5 ventanas y en la escotilla. Así el casco queda cerrado desde dentro y desde fuera, y las ventanas `win-*` y `window-glass` siguen huecas. Nuevo grupo `aft-stowage` con 3 armarios (`stowage-locker-a/b/c`) y 2 redes de carga con bolsas (`cargo-net-left/right`) en la pared baja. Todos los nodos, clips (`hatch-open`, `guard-0X-open`), origen y escala son idénticos al original (comprobado con un diff de nombres). | 53.998 → 56.968 (piel +2.262, utilería +708) | 0,97 → 1,00 MB |
| `lm-interior.glb` **(nuevo)** | Interior del Eagle de pie, con el origen en el ojo de Aldrin, igual que `cabin-panels`: la cámara está en (0,0,0) y mira hacia −Z. Lleva casco cerrado con 4 cm de grosor, 2 ventanas triangulares (material `WindowGlass`, que `cabin.js` cambia por el cielo), paneles 1 y 2 entre las ventanas, consola central con DSKY (PROG 63 / V16 N68) y escotilla delantera cuadrada de 0,81 m. A la derecha está el **panel 16**, alineado detrás de `cabin-breaker.glb`, con el nodo **`cb-engine-arm`** en la misma posición y rotación que `lm-breaker-broken`. También: panel 11 a la izquierda, repisa justo bajo `cabin-props` (superficie y = −0,30), tapa del motor de ascenso, escotilla superior, asideros y placas de pies. No hay reloj de cuenta atrás (arregla parte del bug G9). Otros nodos: `eye-lmp`, `eye-cdr`, `win-lmp`, `win-cdr`, `dsky-lm`, `light-cabin`. | 54.240 (`cabin-panels`) → 918 | 0,10 MB |
| `moon-rocks.glb` | LOD0 reducido. En el original cada roca tenía de 1.300 a 4.500 triángulos, no 620. Añadí `rock-NN-lod1` (64–120 tris) para cada tipo, con el mismo pivote y la misma base y = 0, desplazado +1,5 m en Z dentro del glb. El código lo recentra, así que no afecta. `sample-rock` sin tocar. | 27.900 → 7.183 en total (detalle abajo) | 1,46 → 1,15 MB |

Rocas, LOD0 antes → después / LOD1:

| Tipo | Uso en `RT` | LOD0 antes | LOD0 después | LOD1 |
|---|---|---|---|---|
| rock-01 | big | 4.500 | 1.500 | 119 |
| rock-02 | big, mid | 4.000 | 1.300 | 116 |
| rock-03 | mid, small | 3.200 | 500 | 100 |
| rock-04 | mid, small | 3.000 | 480 | 100 |
| rock-05 | tiny | 2.600 | 190 | 80 |
| rock-06 | small | 2.400 | 190 | 80 |
| rock-07 | tiny | 1.800 | 170 | 72 |
| rock-08 | tiny | 1.600 | 160 | 72 |
| rock-09 | tiny | 1.300 | 120 | 64 |
| rock-10 | small, tiny | 2.000 | 190 | 80 |

`rock-03` y `rock-04` también se usan como rocas medianas (`RT.mid`, hasta unos 2,6 m), así que las dejé en unos 500 triángulos y no en 200, para no perder la silueta de cerca.

Prueba de carga con three.js r187 headless: copié `layRocks` tal cual, con unas 5.080 rocas sintéticas (780 de campo y 4.300 guijarros) y el sol bajo con sombras. El conteo incluye la pasada de sombras:
- **glb viejo:** 21,3 M triángulos por fotograma.
- **glb nuevo, sin tocar el código:** 2,6 M.
- **glb nuevo con el LOD de abajo:** 0,69 M.

Visualmente es casi idéntico (`capturas/COMPARA-moon-rocks.png`).

### Código (lo integra Claude). Diffs en `codigo-bloqueA/` sobre la rama `unificado`; los .js del repo usan CRLF
1. **`moonsurface-lod.diff`** (`src/scenes/moonsurface.js`): `layRocks` parte cada tipo en grandes (≥ 0,5 m) y pequeñas, y cada grupo en un `InstancedMesh` LOD0 y otro LOD1.
   - `relodRocks(camera.position)` se llama en `update()` y reparte las instancias cuando la cámara se mueve más de 6 m: LOD1 a más de 40 m para las grandes y a más de 12 m para las pequeñas, con la altura de la cámara incluida.
   - Las pequeñas lejanas no proyectan sombra; las cercanas sí, para conservar las sombras largas junto al astronauta.
   - Si el glb no trae `-lod1`, funciona igual que antes. Sintaxis comprobada con `node --check`, y probado en la prueba de carga.
2. **`cabin-glb.diff`** + **`breaker-lm.diff`**: `makeCabin({ glb })`, con `'cabin-panels'` por defecto, y `breaker.js` llama a `makeCabin({ glb: 'lm-interior' })`. El resto no cambia: la cámara, los ángulos `LOOK`, `cabin-breaker.glb`, `cabin-props.glb` en `PROPS_AT` y el sombreado del cielo de `WindowGlass` (modo `space`). Es opcional poner el reloj a GET 125 en otra parte; este modelo no tiene reloj.
3. **`night-cam.diff`**, **`collins-cam.diff`** y **`reunion-cam.diff`**: **imprescindibles con el nuevo `cm-interior`**. El plano `WIDE` de *Noche* y de *Collins solo* (pos `[0.55,1.5,1.42]`) y los planos 2 y 3 del abrazo de `reunion.js` ponían la cámara **fuera del casco**: a la altura y = 1,5 el radio interior es 1,16 m y la cámara estaba a 1,52 m. Antes eso se veía como "cabina abierta con estrellas"; con la piel exterior se vería una pared gris. Los diffs los mueven dentro (`[0.42,1.5,0.92]` y `P(-0.6,0.1,0.55)` / `P(0.15,0.1,0.72)`). Comprobado en `capturas/cmi-despues-camara-wide-corregida.png` y `cmi-reunion-camara-corregida.png`.
   - **Aviso, no corregido:** en `night.js` los civiles flotantes también quedan atravesando el casco. Neil está de pie en `x -0.72, z 1.0` con la cabeza a y ≈ 2,5, donde el cono mide 0,5 m de radio, así que queda casi todo fuera (`capturas/cmi-antes-noche-con-astronautas.png`). El sitio libre real es el eje central (r < 0,5 m por encima de y = 1,9) o sentarlos en `seat-CDR/CMP/LMP` con el clip `sit`. Lo dejo a Claude porque es puesta en escena.
4. Ya no hace falta el parche `side = DoubleSide` de `CMI-Pared` y `CMI-Mamparo`, pero no estorba.

Capturas clave: `capturas/COMPARA-cm-interior.png`, `COMPARA-lm-interior.png`, `COMPARA-moon-rocks.png` (antes a la izquierda, después a la derecha). Las sueltas: `cmi-*`, `lm-*`, `rocas-*`, `eva-rocas-*`. Los renders se hicieron con three r187 headless (el mismo cargador que el juego) y las cámaras exactas del código.
Scripts reproducibles en `codigo-bloqueA/` (`build_cmi.py`, `build_lm.py`, `mktex.py`, `build_rocks.py`, `merge.mjs`, `decodeA.mjs`). La textura del LM es original (generada con PIL). Los archivos de trabajo están en `/workspace/bloqueA/`.
