# Informe de validación de modelos glb

- Generado: sábado, 14 de noviembre de 2026, 7:13:27 p. m. (America/La_Paz)
- Carpeta: `/tmp/p4val`
- Archivos: 3

## Resumen

| Métrica | Valor |
| --- | ---: |
| Sin avisos | 3 |
| Con avisos | 0 |
| Errores de lectura | 0 |
| Con meshopt | 3 / 3 |
| Superan 1,5 MB | 0 |

## Tabla

| Archivo | Tris | Caja (m) | MB | Mats | Texturas | Huesos | >4 pesos | Pesos no norm. | Clips | Meshopt | Avisos |
| --- | ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `eva-tools.glb` | 1.728 | 1,231 × 0,68 × 0,213 m | 0,027 | 9 | — | — | 0 | 0 | — | sí | 0 |
| `memorial-kit.glb` | 2.012 | 0,424 × 0,004 × 0,1 m | 0,048 | 6 | 512×512 | — | 0 | 0 | — | sí | 0 |
| `o2-hose.glb` | 920 | 0,047 × 0,049 × 2 m | 0,018 | 3 | — | 6 | 0 | 0 | flex (2 s) | sí | 0 |

## Detalle por archivo

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
