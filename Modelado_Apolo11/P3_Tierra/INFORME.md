
## P3-3 / P3-4 (pacific-recovery, lrl-room, earth-props, hotel-room-1967, parade-street). Tamaños en ancho x alto x fondo (m, glTF con Y hacia arriba). 0 huesos en todos. Scripts: raw/p3c_lib.py, raw/<nombre>.py, raw/p3c_compress.sh (meshopt+webp sin aplanar el grafo), raw/p3c_verify.mjs
- pacific-recovery.glb | 4.952 tris | 200 x 2,2 x 200 m | 0,174 MB | clip `waves` 6,00 s en bucle (4 shape keys en `ocean` + balanceo de balsa y boyas) | nodos: ocean, life-raft (2,7 x 0,9 x 2,2), buoy-1..3 (Ø1,2), cm-spot (empty, nivel del mar)
- lrl-room.glb | 2.794 tris | 8,2 x 3,0 x 8,2 m (techo 2,8) | 0,060 MB | sin clips | nodos: quarantine-glass (4,4 x 1,3, alpha 0,18), phone-inside / phone-outside (a 1,20 m, junto al borde del vidrio, x=2,45), table, chairs (4 por lado, asiento a 0,45 m, mirando al vidrio), light-1..6. Spots (origen en el suelo, frente a +Z glTF sin rotar, extras.pose): npc-spot-neil sit (silla del lado astronautas frente a phone-inside, mira a +Z), npc-spot-jan sit (silla de la familia frente a phone-outside, mira a -Z), npc-spot-rick stand y npc-spot-mark stand (entre sillas, sin tocar muebles). extras de los sit: seat_height 0.45, target, phone. Comprobado con raw/p3c_check_spots.py
- earth-props.glb | 2.162 tris | conjunto 2,0 x 1,85 x 1,4 m | 0,086 MB | 1 textura WebP 512 | nodos: toy-saturn-v (0,40 m alto; stage-1, stage-2, stage-3, spacecraft) 780, mission-patch (Ø10 cm) 124, signed-envelopes (4 sobres) 56, framed-photo (20x25 cm) 74, notebook (15x10,6 cm) 50, alarm-sheet (carta, "1201 - 1202") 12, chalkboard (pizarra rodante 1,8x0,9, "TOUGH AND COMPETENT") 258, rotary-phone 528, ashtray (Ø12 cm) 280
- hotel-room-1967.glb (opcional) | 1.136 tris | 4,8 x 2,9 x 5,8 m (techo 2,7) | 0,036 MB | sin clips | nodos: bed, phone, window, lamp-light, light-ceiling, npc-spot-bed (extras pose sit, seat_height 0.55, sentado en el borde de la cama mirando a +Z), npc-spot-window (pose stand, target window, mira a -Z). Comprobado con raw/p3c_check_spots.py
- parade-street.glb (opcional) | 14.760 tris | 72 x 84 x 140 m | 0,155 MB | 1 textura WebP 512 (fachada, tintada por material) | clip `confetti-fall` 8,00 s (baja 12 m; el volumen se repite cada 12 m, así que el bucle no salta) | nodos: street, buildings, crowd (crowd-left, crowd-right), confetti, confetti-ground, street-furniture, parade-car (+ npc-spot-car-1..3)

## Segunda auditoría (14/11/2026, 21:00 BOT): qué cambió
1. **walk sin patinar**: lo rehice con IK numérica sobre las posiciones reales de los huesos. El apoyo tiene tres fases: talón, pie plano y despegue pivotando en la punta. La cadera baja lo justo para que la pierna llegue. El clip sigue siendo *in place*: **el juego debe mover la raíz hacia +Z del glTF a velocidad constante**. Esa velocidad va en `extras` del nodo `armature` (`walk_speed_mps`, `walk_cycle_s`, `walk_stride_m`):
   | personaje | m/s | ciclo (s) | zancada (m) | patinaje del pie apoyado, contacto ≤6 mm (cm) | ídem ≤12 mm (cm) |
   |---|---|---|---|---|---|
   | civil-base-p3, kranz, bales, duke, garman | 1,024 | 1,133 (34 f) | 1,160 | 0,24 / 0,64 / 0,48 / 0,48 / 0,47 | 0,87 / 1,05 / 0,72 / 0,91 / 0,91 |
   | jan | 0,968 | 1,100 (33 f) | 1,065 | 0,30 | 0,92 |
   | rick | 0,905 | 1,033 (31 f) | 0,935 | 0,75 | 1,39 |
   | mark | 0,772 | 0,867 (26 f) | 0,669 | 0,51 | 2,47 (el umbral de 12 mm ya incluye el inicio del vuelo en un pie de niño) |
   Lo medí en three r187 (`tools/measure.mjs`): desplazamiento horizontal en el mundo de los vértices de la suela que están en contacto durante un paso, con la raíz moviéndose a `walk_speed_mps`. Salto de bucle ≤0,1 mm en todos los clips. Suela a ras de suelo: mínimo −0,3…0 mm.
2. **Fotograma congelado (error nuevo, la auditoría no lo detectó):** todos los clips empezaban en t = 1/30 s, así que en cada vuelta había un fotograma quieto que en walk hacía patinar el pie. Ahora se hornean desde el fotograma 0.
3. **idle con los brazos relajados**: el ángulo del brazo (`extras.idle_arm_deg`) se busca por personaje con una sonda de colisión: el más cercano al cuerpo sin atravesar torso, chaleco ni muslos. Quedó en 85° en casi todos, 83° en Rick y 82° en Kranz (por el chaleco). Medido en three, el brazo pasa de 16,4° respecto de la vertical (30° en Jan) a 7,6–9,8°, y la mano queda entre 7 y 20 cm más cerca de la cadera. Brazo superior y tórax más finos, y el chaleco algo más separado. Para que empalmen sin salto, talk, point y wave empiezan y terminan exactamente en `idle(0)` (diferencia 0–0,1 mm). La sonda da 0 vértices atravesados en los 7 clips de los 8 personajes.
4. **Caras**: ojos proyectados en la superficie (blanco, iris de color por personaje, pupila y párpado superior con pestañas), cejas con grosor, arco e inclinación propios, nariz con volumen, boca curvada con labios, y mandíbula según el perfil de cada uno. Kranz tiene cejas gruesas y rectas y un flat-top rubio ceniza; Bales, lentes negros gruesos y auriculares; Duke, auriculares, cejas arqueadas y una ligera sonrisa; Garman, lentes de **metal** finos y ningún auricular. Se corrigen solos los pliegues que deja el decimado en la cara (`[P3] pliegues en la cara`). Todos los personajes tienen ≤5.000 tris.
5. **Suelas a ras de suelo**: las mallas, no los huesos, se bajan o suben entre −1 y +9 mm según el personaje, para que la suela en reposo toque y = 0.
6. **armstrong-house** se regeneró desde `raw/armstrong_house.py`, con el sofá mirando a la TV y Rick en `npc-spot-rick` (`seat_height` 0,46, `target` tv-set). `window-backdrop` es ahora un grupo con dos hijos:
   - `window-day`: tarde de julio en El Lago (cielo, arboleda, casa vecina y arbustos) para el aterrizaje a las 15:17 CDT. Va por defecto.
   - `window-night`: el fondo nocturno de antes, para el paso de las 21:56 CDT.

   Las luces llevan `extras.variant` (`light-sun-window` = day, `light-moon-window` = night). Se conservan todos los nodos anteriores.
7. **mocr-room**: tiene 16 asientos de relleno `npc-spot-extra-1..16` en las 4 filas, con la misma convención que el resto: origen en el suelo de la grada, frente a +Z, `extras.pose = sit`, `seat_height = 0.48`, `npc = controller-extra` y `variant` a/b/c. Las sillas se movieron con ellos. Los 4 spots con nombre también declaran `seat_height = 0.48`.
8. **controller-extra.glb** (nuevo): 1.876 tris, el mismo esqueleto de 25 huesos y 3 clips (idle, sit, talk). Lleva camisa de manga corta, corbata y auriculares. La camisa está en su propio nodo `shirt`, con 3 variantes de color:
   - en `KHR_materials_variants` (`shirt-a` blanca, `shirt-b` celeste, `shirt-c` beige);
   - en `extras.shirt_variants` del `armature`, en hex, porque three.js no aplica KHR_materials_variants solo. El código está en NOTAS-COMPANERO.
9. Nuestro civil pasa a llamarse **`civil-base-p3.glb`**, para no chocar con el `civil-base` de P1. Además, el nodo del esqueleto se llama `armature` (kebab-case): el validador ya no da avisos.

## P3-2 · Salas (mocr-room, armstrong-house)
| glb | tris | tamaño (m, X x alto x Z) | MB | huesos | clips | nodos clave |
|---|---|---|---|---|---|---|
| mocr-room.glb | 9532 renderizados (1412 únicos; 120 instancias EXT_mesh_gpu_instancing) | 20.1 x 6.0 x 15.1 | 0.126 | 0 | 0 | console-row-1..4, console-fido, console-guido, console-capcom, console-flight, wall-screens (screen-map, screen-data-left, screen-data-right, mission-clocks), chalkboard, door-main (origen en bisagra), npc-spot-kranz/bales/duke/garman, **npc-spot-extra-1..16**, light-ceiling-01..16, light-screens-glow, room-shell, desk-clutter |
| armstrong-house.glb | 3622 renderizados (3088 únicos) | interior 9.0 x 2.5 x 6.5; bbox con fondos 9.3 x 4.4 x 8.2 | 0.129 | 0 | 0 | tv-set (tv-screen emisivo), squawk-box, rotary-phone, sofa, armchair, floor-lamp, coffee-table, dining-table, dining-chair-1..6, kitchen, bookshelf, moving-boxes, rug, door-front, door-hall, **window-backdrop > window-day (window-day-view, window-day-shrubs) / window-night**, npc-spot-jan/rick/mark/neil, light-living/dining/kitchen/floor-lamp/tv-glow/moon-window(night)/**sun-window(day)** |

Notas P3-2:
- Origen en el suelo. En el MOCR es el suelo de la fila 1 (la trinchera); las filas 2, 3 y 4 suben 0,4, 0,8 y 1,2 m. Las pantallas están en +Z del glTF y los npc-spot miran a +Z, hacia su consola. Cada spot lleva `extras.pose` (sit, stand, sit-sofa, sit-floor, sit-chair).
- Las luces no se exportan como luces: son empties `light-*` con `extras {light, color, intensity, distance/width/height, variant?}`, y el código crea la luz.
- Una sola textura WebP de 512 px por glb. Todo procedural, sin assets externos (el mapa del mundo es de Natural Earth, dominio público).
- Compresión con `raw/compress_glb.mjs` (meshopt + webp + instancing, sin flatten ni join). No quedan nodos sin nombre.
- Garman estaba en realidad en la back room; su spot va junto a Bales en la trinchera por decisión de escena.
- Scripts: `raw/mocr_room.py` y `raw/armstrong_house.py` (+ `raw/p3common.py`, `raw/make_textures.py`). Los blend están regenerados: `blend/mocr-room-v01.blend` y `blend/armstrong-house-v01.blend`.

## P3-1 · Civiles con rig
| glb | tris | alto (m) | MB | huesos | clips | notas |
|---|---|---|---|---|---|---|
| civil-base-p3.glb | 4701 | 1,816 | 0,156 | 25 | 7 | camisa de manga corta y pantalón (temporal hasta el civil de P1) |
| kranz.glb | 4836 | 1,812 | 0,165 | 25 | 7 | cara cuadrada, flat-top rubio ceniza, cejas gruesas, chaleco marfil con 4 botones, corbata negra fina, manga larga |
| bales.glb | 4793 | 1,814 | 0,167 | 25 | 7 | joven y delgado, lentes de pasta negros gruesos, auriculares |
| duke.glb | 4793 | 1,817 | 0,163 | 25 | 7 | cara larga, pelo oscuro de lado, auriculares de CAPCOM, sonrisa leve |
| garman.glb | 4730 | 1,813 | 0,162 | 25 | 7 | cara redonda, lentes de metal finos, camisa celeste, corbata marrón, sin auriculares |
| jan.glb | 4733 | 1,669 | 0,145 | 25 | 7 | vestido celeste de 1969 con faja, pelo bob, ojos verdes |
| rick.glb | 4601 | 1,507 | 0,150 | 25 | 7 | 12 años, camiseta roja, pantalón corto |
| mark.glb | 4780 | 1,162 | 0,150 | 25 | 7 | 6 años, camiseta clara, pelo rubio |
| controller-extra.glb | 1876 | 1,816 | 0,096 | 25 | 3 | relleno del MOCR: nodo `shirt` con 3 variantes |

Clips (s): idle 4,03 · walk según la tabla de arriba · sit 4,03 · sit-floor 4,03 · talk 3,23 · point 2,03 · wave 2,03.

Notas P3-1:
- Una malla con skin por personaje: materiales PBR simples sin texturas, 1 skin de 25 joints, ≤4 pesos por vértice normalizados, frente a +Z, pies en el origen y reposo en T-pose. controller-extra tiene 2 mallas (cuerpo y `shirt`), cada una con su skin sobre los mismos 25 huesos.
- Los huesos se llaman `mixamorig:Hips` en el JSON y `mixamorigHips` en three.js (`sanitizeNodeName`). El nodo raíz del esqueleto es `armature`.
- `extras` del nodo `armature`: `walk_speed_mps`, `walk_cycle_s`, `walk_stride_m`, `idle_arm_deg`, y en controller-extra `shirt_variants`/`shirt_materials`.
- **sit**: espalda recta, muslos horizontales y asiento horneado a 0,45 m en adultos (Jan 0,41, Rick 0,36, Mark 0,26). **sit-floor**: cadera a y≈0.
- Compresión con la regla 7 más `--texture-size 512`. Verificado en three r187: 25 huesos, ≤4 influencias, todos los clips presentes, y la malla deformada difiere ≤1,4 mm entre el crudo y el comprimido (`raw/people/validate-report.jsonl`, `skincmp-report.txt`).
- Scripts: `raw/people/p3_people.py` (`blender -b -P p3_people.py -- <nombre>`; `--debug-probe` saca la sonda de colisión), `p3_render.py`, `sheet.py`, `add_variants.mjs`, y `batch.sh` (genera, renderiza y comprime los 9). Mediciones: `raw/people/measure.mjs`.
- Previews: `previews/<nombre>.png` (idle de frente y de perfil), `<nombre>-walk.png` y `<nombre>-face.png`; `controller-extra-talk.png`.
- Limitaciones: manos tipo manopla (el esqueleto no tiene dedos), caras low-poly sin textura y sin LOD. El clip walk es *in place*.
