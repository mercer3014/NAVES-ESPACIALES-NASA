# Informe de validación de modelos glb

- Generado: sábado, 14 de noviembre de 2026, 7:45:15 p. m. (America/La_Paz)
- Carpeta: `/workspace/apolo11/Modelado_Apolo11/P4_Luna/glb`
- Archivos: 5
- Reglas: reglas-p4 (Luna completo)

## Resumen

| Métrica | Valor |
| --- | ---: |
| Sin avisos | 5 |
| Con avisos | 0 |
| Errores de lectura | 0 |
| Con meshopt | 5 / 5 |
| Superan 1,5 MB | 0 |

## Tabla

| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `boss-arena.glb` | 11.928 | 82,999 × 13,778 × 82,999 m | 0,091 | 1 | — | — | 0 | 0 | — | sí | 0 |
| `eva-tools.glb` | 1.728 | 1,231 × 0,68 × 0,213 m | 0,027 | 9 | — | — | 0 | 0 | — | sí | 0 |
| `guardian.glb` | 5.879 | 13,188 × 16,438 × 9,587 m | 0,285 | 7 | 512×512 | 20 | 0 | 0 | idle (3,5 s), slam (2,5 s), sweep (2,5 s) | sí | 0 |
| `memorial-kit.glb` | 2.012 | 0,424 × 0,004 × 0,1 m | 0,048 | 6 | 512×512 | — | 0 | 0 | — | sí | 0 |
| `o2-hose.glb` | 920 | 0,047 × 0,049 × 2 m | 0,018 | 3 | — | 6 | 0 | 0 | flex (2 s) | sí | 0 |

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

### eva-tools.glb

- Peso: 0,027 MB (27.868 bytes)
- Triángulos: 1.728
- Caja: min [-0,11, 0, -0,1075]  max [1,121, 0,6795, 0,1055]  tamaño 1,231 × 0,68 × 0,213 m
- Altura medida (rig/nodo, no la caja cuantizada): 0,68 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (9): aluminio, acero, anodizado-azul, anodizado-rojo, grip-negro, hasselblad-plata, negro-mate, lente, cinta-beta
- Texturas: ninguna
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (11): core-tube-1-geo, core-tube-1, core-tube-2-geo, core-tube-2, geo-hammer-geo, geo-hammer, hasselblad-geo, hasselblad, lec-pulley-geo, lec-pulley, eva-tools
- Avisos: ninguno

### guardian.glb

- Peso: 0,285 MB (298.960 bytes)
- Triángulos: 5.879
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

### memorial-kit.glb

- Peso: 0,048 MB (50.680 bytes)
- Triángulos: 2.012
- Caja: min [-0,05, -0, -0,05]  max [0,374, 0,0037, 0,05]  tamaño 0,424 × 0,004 × 0,1 m
- Altura medida (rig/nodo, no la caja cuantizada): 0,004 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, EXT_texture_webp, KHR_mesh_quantization
- Materiales (6): apollo1-patch, tela-azul, oro, bronce, silicio, aluminio
- Texturas: apollo1-patch image/webp 512×512
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: ninguno
- Nodos (11): apollo1-patch-geo, apollo1-patch, medal-gagarin-geo, medal-gagarin, medal-komarov-geo, medal-komarov, olive-branch-geo, olive-branch, silicon-disc-geo, silicon-disc, memorial-kit
- Avisos: ninguno

### o2-hose.glb

- Peso: 0,018 MB (18.680 bytes)
- Triángulos: 920
- Caja: min [-0,0233, -0,0244, -1]  max [0,0233, 0,0244, 1]  tamaño 0,047 × 0,049 × 2 m
- Altura medida (rig/nodo, no la caja cuantizada): 0,049 m
- Compresión meshopt: sí
- Extensiones: EXT_meshopt_compression, KHR_mesh_quantization
- Materiales (3): manguera, conector-azul, aluminio
- Texturas: ninguna
- Skins: o2-hose (6 huesos)
- Vértices con más de 4 pesos: 0
- Vértices con pesos no normalizados: 0
- Clips: flex (2 s)
- Nodos (8): hose-5, hose-4, hose-3, hose-2, hose-1, hose-0, o2-hose-geo, o2-hose
- Avisos: ninguno
