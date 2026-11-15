# Informe de validación de modelos glb

- Generado: sábado, 14 de noviembre de 2026, 9:23:42 p. m. (America/La_Paz)
- Carpeta: `/workspace/apolo11/Modelado_Apolo11/P3_Tierra/glb`
- Archivos: 16
- Reglas: reglas-p3

## Resumen

| Métrica | Valor |
| --- | ---: |
| Sin avisos | 16 |
| Con avisos | 0 |
| Errores de lectura | 0 |
| Con meshopt | 16 / 16 |
| Superan 1,5 MB | 0 |

## Tabla

| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `armstrong-house.glb` | 3.088 | 9,34 × 4,4 × 8,24 m | 0,129 | 41 | 512×512 | — | 0 | 0 | — | sí | 0 |
| `bales.glb` | 4.793 | 1,969 × 2 × 0,276 m | 0,167 | 17 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,13 s), wave (2 s) | sí | 0 |
| `civil-base-p3.glb` | 4.701 | 1,965 × 2 × 0,29 m | 0,155 | 13 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,13 s), wave (2 s) | sí | 0 |
| `controller-extra.glb` | 1.876 | 2 × 2 × 0,527 m | 0,096 | 17 | — | 25+25 | 0 | 0 | idle (4 s), sit (4 s), talk (3,2 s) | sí | 0 |
| `duke.glb` | 4.793 | 1,964 × 2 × 0,288 m | 0,163 | 16 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,13 s), wave (2 s) | sí | 0 |
| `earth-props.glb` | 2.162 | 1,99 × 1,851 × 1,39 m | 0,086 | 15 | 512×512 | — | 0 | 0 | — | sí | 0 |
| `garman.glb` | 4.730 | 1,97 × 2 × 0,285 m | 0,162 | 15 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,13 s), wave (2 s) | sí | 0 |
| `hotel-room-1967.glb` | 1.136 | 4,84 × 2,9 × 5,84 m | 0,037 | 17 | — | — | 0 | 0 | — | sí | 0 |
| `jan.glb` | 4.733 | 1,889 × 2 × 0,393 m | 0,15 | 11 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,1 s), wave (2 s) | sí | 0 |
| `kranz.glb` | 4.836 | 1,999 × 2 × 0,316 m | 0,165 | 16 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,13 s), wave (2 s) | sí | 0 |
| `lrl-room.glb` | 2.794 | 8,24 × 3 × 8,24 m | 0,06 | 21 | — | — | 0 | 0 | — | sí | 0 |
| `mark.glb` | 4.780 | 1,891 × 2 × 0,347 m | 0,151 | 11 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (0,87 s), wave (2 s) | sí | 0 |
| `mocr-room.glb` | 1.412 | 20,12 × 6 × 15,05 m | 0,126 | 26 | 512×512 | — | 0 | 0 | — | sí | 0 |
| `pacific-recovery.glb` | 4.952 | 200 × 2,198 × 200 m | 0,174 | 5 | — | — | 0 | 0 | waves (6 s) | sí | 0 |
| `parade-street.glb` | 14.760 | 72,402 × 83,798 × 140,009 m | 0,155 | 22 | 512×512 | — | 0 | 0 | confetti-fall (8 s) | sí | 0 |
| `rick.glb` | 4.601 | 1,918 × 2 × 0,285 m | 0,151 | 11 | — | 25 | 0 | 0 | idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,03 s), wave (2 s) | sí | 0 |

## Detalle por archivo

### armstrong-house.glb

- Peso: 0,129 MB (135.568 bytes)
- Triángulos: 3.088
- Caja: min [-4,64, -1, -4,85]  max [4,7, 3,3997, 3,39]  tamaño 9,34 × 4,4 × 8,24 m
- Altura medida (rig/nodo, no la caja cuantizada): 2,45 m
- Compresión meshopt: sí
- Extensiones: EXT_mesh_gpu_instancing, EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (41): chair-orange, wood-teak, wood-dark, photo-frame, paper, sofa-olive, curtain, lamp-shade, ashtray-glass, door-wood, wood-trim, brass, lamp-bulb, kitchen-cabinet, counter-formica, chrome, squawk-grille, appliance-avocado, black-plastic, calendar, cardboard, packing-tape, floor-wood, floor-linoleum, floor-linoleum-dark, ceiling, wood-paneling, wall-paint, phone-beige, rug, squawk-metal, tv-screen, day-trees-near, day-sky, day-sky-haze, day-trees, day-lawn, day-house, day-roof, day-window-dark, window-view
- Texturas: house-atlas image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (43): armchair, bookshelf, ceiling-light-kitchen, ceiling-light-living, clutter, coffee-table, dining-table, door-front, door-hall, end-table, end-table-2, floor-lamp, kitchen, light-dining, light-floor-lamp, light-kitchen, light-living, light-moon-window, light-sun-window, light-tv-glow, moving-box-1, moving-box-2, moving-box-3, moving-box-4, moving-boxes, npc-spot-jan, npc-spot-mark, npc-spot-neil, npc-spot-rick, pendant-lamp, room-shell, rotary-phone, rug, sofa, squawk-box, tv-set, window-day-shrubs, window-day-view, window-day, window-night, window-backdrop, armstrong-house, dining-chair-instances
- Avisos: ninguno

### bales.glb

- Peso: 0,167 MB (174.632 bytes)
- Triángulos: 4.793
- Caja: min [-0,9846, -1, -0,1378]  max [0,9846, 1, 0,1378]  tamaño 1,969 × 2 × 0,276 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (17): skin, shoes, shirt, pants, belt, buckle, tie, hair, eye-white, iris, pupil, lash, mouth, lips, glasses, headset, headset-ear
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,133 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, bales, armature
- Avisos: ninguno

### civil-base-p3.glb

- Peso: 0,155 MB (162.956 bytes)
- Triángulos: 4.701
- Caja: min [-0,9824, -1, -0,145]  max [0,9824, 1, 0,145]  tamaño 1,965 × 2 × 0,29 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (13): skin, shoes, shirt, pants, belt, buckle, hair, eye-white, iris, pupil, lash, mouth, lips
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,133 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, civil-base-p3, armature
- Avisos: ninguno

### controller-extra.glb

- Peso: 0,096 MB (100.712 bytes)
- Triángulos: 1.876
- Caja: min [-1, -1, -0,2633]  max [1, 1, 0,2633]  tamaño 2 × 2 × 0,527 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_materials_variants, KHR_mesh_quantization
- Materiales (17): skin, shoes, pants, belt, buckle, tie, hair, eye-white, iris, lash, mouth, lips, headset, headset-ear, shirt-white, shirt-blue, shirt-tan
- Texturas: ninguna
- Skins: armature (25 huesos), armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), sit (4 s), talk (3,2 s)
- Nodos (28): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, controller-extra, shirt, armature
- Avisos: ninguno

### duke.glb

- Peso: 0,163 MB (170.560 bytes)
- Triángulos: 4.793
- Caja: min [-0,9818, -1, -0,1439]  max [0,9818, 1, 0,1439]  tamaño 1,964 × 2 × 0,288 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (16): skin, shoes, shirt, pants, belt, buckle, tie, hair, eye-white, iris, pupil, lash, mouth, lips, headset, headset-ear
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,133 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, duke, armature
- Avisos: ninguno

### earth-props.glb

- Peso: 0,086 MB (90.488 bytes)
- Triángulos: 2.162
- Caja: min [-0,995, -0,0006, -0,9001]  max [0,995, 1,85, 0,4895]  tamaño 1,99 × 1,851 × 1,39 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,851 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (15): props-atlas, paper, paint-black, glass-amber, metal-silver, wood-dark, wood-light, slate-green, chalk, thread-gold, book-red, paint-white, bakelite-black, paint-red, paint-gray
- Texturas: earth-props-atlas image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (26): alarm-sheet-mesh, alarm-sheet, ashtray-mesh, ashtray, chalkboard-mesh, chalkboard, framed-photo-mesh, framed-photo, mission-patch-mesh, mission-patch, notebook-mesh, notebook, rotary-phone-mesh, rotary-phone, signed-envelopes-mesh, signed-envelopes, spacecraft-mesh, spacecraft, stage-1-mesh, stage-1, stage-2-mesh, stage-2, stage-3-mesh, stage-3, toy-saturn-v, earth-props
- Avisos: ninguno

### garman.glb

- Peso: 0,162 MB (169.296 bytes)
- Triángulos: 4.730
- Caja: min [-0,9849, -1, -0,1425]  max [0,9849, 1, 0,1425]  tamaño 1,97 × 2 × 0,285 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (15): skin, shoes, shirt, pants, belt, buckle, tie, hair, eye-white, iris, pupil, lash, mouth, lips, glasses-metal
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,133 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, garman, armature
- Avisos: ninguno

### hotel-room-1967.glb

- Peso: 0,037 MB (38.240 bytes)
- Triángulos: 1.136
- Caja: min [-2,4199, -0,0998, -2,92]  max [2,4199, 2,7998, 2,92]  tamaño 4,84 × 2,9 × 5,84 m
- Altura medida (rig/nodo, no la caja cuantizada): 2,9 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (17): walnut, bedspread-gold, sheet-white, lampshade, brass, armchair-teal, frame-gold, painting-landscape, door-walnut, mirror, trim-white, bakelite-black, wallpaper-olive, carpet-rust, ceiling-plaster, curtain-green, window-dusk
- Texturas: ninguna
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (15): bed-mesh, bed, ceiling-fixture, furniture, lamp-light, light-ceiling, nightstands, npc-spot-bed, npc-spot-window, phone-mesh, phone, room-shell, window-mesh, window, hotel-room-1967
- Avisos: ninguno

### jan.glb

- Peso: 0,15 MB (157.168 bytes)
- Triángulos: 4.733
- Caja: min [-0,9445, -1, -0,1964]  max [0,9445, 1, 0,1964]  tamaño 1,889 × 2 × 0,393 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,65 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (11): skin, shoes, dress, hair, eye-white, iris, pupil, lash, mouth, lips, sash
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,1 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, jan, armature
- Avisos: ninguno

### kranz.glb

- Peso: 0,165 MB (172.672 bytes)
- Triángulos: 4.836
- Caja: min [-0,9995, -1, -0,1581]  max [0,9995, 1, 0,1581]  tamaño 1,999 × 2 × 0,316 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,8 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (16): skin, shoes, shirt, pants, belt, buckle, vest, button, tie, hair, eye-white, iris, pupil, lash, mouth, lips
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,133 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, kranz, armature
- Avisos: ninguno

### lrl-room.glb

- Peso: 0,06 MB (63.352 bytes)
- Triángulos: 2.794
- Caja: min [-4,12, -0,0999, -4,12]  max [4,12, 2,8999, 4,12]  tamaño 8,24 × 3 × 8,24 m
- Altura medida (rig/nodo, no la caja cuantizada): 3 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (21): aluminum-frame, wood-formica, steel-dark, chair-vinyl-orange, plant-green, pot-brown, fluorescent, phone-black, quarantine-glass, wall-cream, wall-green, floor-vinyl-beige, floor-vinyl-gray, ceiling-tile, door-gray, sign-red, wainscot-tan, wainscot-green, floor-tile-dark, cork-board, paper-white
- Texturas: ninguna
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (22): chairs, decor, fluorescent-fixtures, light-1, light-2, light-3, light-4, light-5, light-6, npc-spot-jan, npc-spot-mark, npc-spot-neil, npc-spot-rick, phone-inside-mesh, phone-inside, phone-outside-mesh, phone-outside, quarantine-glass, room-shell, table, wall-clock, lrl-room
- Avisos: ninguno

### mark.glb

- Peso: 0,151 MB (157.860 bytes)
- Triángulos: 4.780
- Caja: min [-0,9453, -1, -0,1736]  max [0,9453, 1, 0,1736]  tamaño 1,891 × 2 × 0,347 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,15 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (11): skin, shoes, tshirt, shorts, hair, eye-white, iris, pupil, lash, mouth, lips
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (0,867 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, mark, armature
- Avisos: ninguno

### mocr-room.glb

- Peso: 0,126 MB (132.372 bytes)
- Triángulos: 1.412
- Caja: min [-10,06, -1, -7,55]  max [10,06, 5,0003, 7,5002]  tamaño 20,12 × 6 × 15,05 m
- Altura medida (rig/nodo, no la caja cuantizada): 6 m
- Compresión meshopt: sí
- Extensiones: EXT_mesh_gpu_instancing, EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (26): wood-trim, chalkboard, chair-chrome, chair-vinyl, console-dark, console-body, console-desk, console-keys, crt-bezel, crt-screen, crt-screen-guido, headset-plastic, paper, ashtray-glass, cup, screen-frame, door, viewing-glass, floor-carpet, riser-fascia, wall-panel, wall-pilaster, wall-front, ceiling, ceiling-lamp, wall-screen
- Texturas: mocr-atlas image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (76): chalkboard, console-endcap-r1-l, console-endcap-r1-r, console-fido, console-guido, console-row-1, console-capcom, console-endcap-r2-l, console-endcap-r2-r, console-row-2, console-endcap-r3-l, console-endcap-r3-r, console-flight, console-row-3, console-endcap-r4-l, console-endcap-r4-r, console-row-4, desk-clutter, door-frame, door-main, light-ceiling-01, light-ceiling-02, light-ceiling-03, light-ceiling-04, light-ceiling-05, light-ceiling-06, light-ceiling-07, light-ceiling-08, light-ceiling-09, light-ceiling-10, light-ceiling-11, light-ceiling-12, light-ceiling-13, light-ceiling-14, light-ceiling-15, light-ceiling-16, light-screens-glow, npc-spot-bales, npc-spot-duke, npc-spot-extra-1, npc-spot-extra-10, npc-spot-extra-11, npc-spot-extra-12, npc-spot-extra-13, npc-spot-extra-14, npc-spot-extra-15, npc-spot-extra-16, npc-spot-extra-2, npc-spot-extra-3, npc-spot-extra-4, npc-spot-extra-5, npc-spot-extra-6, npc-spot-extra-7, npc-spot-extra-8, npc-spot-extra-9, npc-spot-garman, npc-spot-kranz, room-shell, mission-clocks, screen-data-left, screen-data-right, screen-map, wall-screens, mocr-room, swivel-chair-instances, console-bay-instances, headset-instances, swivel-chair-instances, console-bay-instances, headset-instances, swivel-chair-instances, console-bay-instances, headset-instances, swivel-chair-instances, console-bay-instances, headset-instances
- Avisos: ninguno

### pacific-recovery.glb

- Peso: 0,174 MB (182.856 bytes)
- Triángulos: 4.952
- Caja: min [-100, 0, -100]  max [100, 2,1978, 100]  tamaño 200 × 2,198 × 200 m
- Altura medida (rig/nodo, no la caja cuantizada): 2,198 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (5): buoy-white, raft-orange, raft-gray, raft-rope, sea-pacific
- Texturas: ninguna
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: waves (6 s)
- Nodos (11): buoy-1-mesh, buoy-1, buoy-2-mesh, buoy-2, buoy-3-mesh, buoy-3, cm-spot, life-raft-mesh, life-raft, ocean, pacific-recovery
- Avisos: ninguno

### parade-street.glb

- Peso: 0,155 MB (162.116 bytes)
- Triángulos: 14.760
- Caja: min [-36,2012, -0,1995, -70,0089]  max [36,2012, 83,5988, 70]  tamaño 72,402 × 83,798 × 140,009 m
- Altura medida (rig/nodo, no la caja cuantizada): 83,798 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (22): facade-0, facade-1, facade-2, facade-3, facade-4, facade-5, curb, roof-tar, confetti-white, confetti-paper, confetti-blue, crowd-dark, crowd-mid, crowd-light, car-black, chrome, car-seat-red, asphalt, sidewalk, road-line, lamp-green, flag-white
- Texturas: parade-facade image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: confetti-fall (8 s)
- Nodos (15): buildings, confetti-mesh, confetti, confetti-ground, crowd-left, crowd-right, crowd, npc-spot-car-1, npc-spot-car-2, npc-spot-car-3, parade-car-mesh, parade-car, street, street-furniture, parade-street
- Avisos: ninguno

### rick.glb

- Peso: 0,151 MB (157.816 bytes)
- Triángulos: 4.601
- Caja: min [-0,9592, -1, -0,1427]  max [0,9592, 1, 0,1427]  tamaño 1,918 × 2 × 0,285 m
- Altura medida (rig/nodo, no la caja cuantizada): 1,5 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (11): skin, shoes, tshirt, shorts, hair, eye-white, iris, pupil, lash, mouth, lips
- Texturas: ninguna
- Skins: armature (25 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (4 s), point (2 s), sit (4 s), sit-floor (4 s), talk (3,2 s), walk (1,033 s), wave (2 s)
- Nodos (27): mixamorig:HeadTop_End, mixamorig:Head, mixamorig:Neck, mixamorig:LeftHand, mixamorig:LeftForeArm, mixamorig:LeftArm, mixamorig:LeftShoulder, mixamorig:RightHand, mixamorig:RightForeArm, mixamorig:RightArm, mixamorig:RightShoulder, mixamorig:Spine2, mixamorig:Spine1, mixamorig:Spine, mixamorig:LeftToe_End, mixamorig:LeftToeBase, mixamorig:LeftFoot, mixamorig:LeftLeg, mixamorig:LeftUpLeg, mixamorig:RightToe_End, mixamorig:RightToeBase, mixamorig:RightFoot, mixamorig:RightLeg, mixamorig:RightUpLeg, mixamorig:Hips, rick, armature
- Avisos: ninguno
