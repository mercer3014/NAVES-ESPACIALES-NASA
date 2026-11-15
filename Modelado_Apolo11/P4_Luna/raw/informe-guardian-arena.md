# Informe de validación de modelos glb

- Generado: sábado, 14 de noviembre de 2026, 7:24:39 p. m. (America/La_Paz)
- Carpeta: `/tmp/p4val`
- Archivos: 2
- Reglas: reglas-p4 (guardian + boss-arena)

## Resumen

| Métrica | Valor |
| --- | ---: |
| Sin avisos | 2 |
| Con avisos | 0 |
| Errores de lectura | 0 |
| Con meshopt | 2 / 2 |
| Superan 1,5 MB | 0 |

## Tabla

| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `boss-arena.glb` | 11.928 | 82,999 × 13,778 × 82,999 m | 0,091 | 1 | — | — | 0 | 0 | — | sí | 0 |
| `guardian.glb` | 6.179 | 13,188 × 16,438 × 9,587 m | 0,293 | 7 | 512×512 | 20 | 0 | 0 | idle (3,5 s), slam (2,5 s), sweep (2,5 s) | sí | 0 |

## Detalle por archivo

### boss-arena.glb

- Peso: 0,091 MB (95.884 bytes)
- Triángulos: 11.928
- Caja: min [-41,4996, -1,0005, -41,4996]  max [41,4996, 12,7775, 41,4996]  tamaño 82,999 × 13,778 × 82,999 m
- Altura medida (rig/nodo, no la caja cuantizada): 13,778 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (1): regolito
- Texturas: ninguna
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (16): arena-floor, rim-1, rim-2, rim-3, rim-4, rim-5, rim-6, rim-7, rim-8, boulder-1, boulder-2, boulder-3, boulder-4, boulder-5, spawn-player, spawn-guardian
- Avisos: ninguno

### guardian.glb

- Peso: 0,293 MB (307.228 bytes)
- Triángulos: 6.179
- Caja: min [-6,5529, -1, -4,2837]  max [6,6354, 15,4379, 5,3036]  tamaño 13,188 × 16,438 × 9,587 m
- Altura medida (rig/nodo, no la caja cuantizada): 16,438 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_materials_emissive_strength, KHR_mesh_quantization
- Materiales (7): regolito-guardian, cavidad, core-dsky, kapton, basalto, tanque, tanque-banda
- Texturas: dsky-1202 image/webp 512×512
- Skins: guardian (20 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: idle (3,5 s), slam (2,5 s), sweep (2,5 s)
- Nodos (38): head, neck, core-dsky, core, hand-l, kapton-forearm-l-1, kapton-forearm-l-2, forearm-l, kapton-upper-l-1, kapton-upper-l-2, kapton-upper-l-3, plate-shoulder-l, upper-arm-l, hand-r, kapton-forearm-r-1, kapton-forearm-r-2, forearm-r, kapton-upper-r-1, kapton-upper-r-2, kapton-upper-r-3, plate-shoulder-r, upper-arm-r, spine-3, fuel-tank, spine-2, spine-1, foot-l, plate-knee-l, shin-l, thigh-l, foot-r, plate-knee-r, shin-r, thigh-r, hips, root, guardian-body, guardian
- Avisos: ninguno
