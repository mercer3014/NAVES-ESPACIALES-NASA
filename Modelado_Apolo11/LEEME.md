# Modelado Apolo 11 · Persona 3 (Tierra) y Persona 4 (Luna)

Solo archivos necesarios: glb finales comprimidos (meshopt + webp), JSON, scripts para regenerar (raw/), informes y notas. No incluye .blend, previews ni node_modules.

- `P3_Tierra/glb/`: salas, props y personajes de la Tierra (ver `P3_Tierra/INFORME.md`).
- `P4_Luna/glb/`: eva-tools, memorial-kit, o2-hose, guardian, boss-arena; `moon-surface-height-a11.json`, `lunar-layout.json`, parche de cráteres en `P4_Luna/raw/lander-craters-a11.*` (ver `P4_Luna/INFORME.md`).
- `_Compartido/`: reglas, contrato de esqueleto, validador (`validar_glb.mjs`).
- `_Integracion/`: auditorías de P3 y P4 con pendientes para la Persona 2.

Los glb NO están copiados a `public/models` (eso lo hace la Persona 2 al integrar, según el plan v4).
Compresión segura: `gltf-transform optimize in out --compress meshopt --texture-compress webp --flatten false --join false --palette false --simplify false --prune false --instance false` (guardian: añadir `--resample false`).
