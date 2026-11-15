# Persona 1 · v05 (cráneo corregido, pelo con hair cards, rig listo para three.js)
Archivos .glb (meshopt + WebP, sin Draco) — cargar con `MeshoptDecoder`. 1 u = 1 m, +Y arriba, frente hacia -Z glTF (-Y Blender), origen en la base.
Personajes: 1 SkinnedMesh, esqueleto 22 huesos estilo Mixamo SIN prefijo (Hips, Spine, Spine1, Spine2, Neck, Head, Left/Right Shoulder/Arm/ForeArm/Hand, UpLeg/Leg/Foot/ToeBase) igual que astronaut-a7l.glb; ≤4 pesos normalizados.
Clips: idle, walk, sit, talk, point, wave (30 fps). idle y talk animan morphs (parpadeo, visemas).
Morph targets (mesh.morphTargetDictionary): smile, mouth-open, viseme-a, viseme-o, viseme-m, blink-l, blink-r, brow-up, frown, worried (neutral = todos en 0).
cabin-props.glb: nodos sextant, checklist, food-bag-1..4, felt-tip-pen (origen en la punta, cuerpo +Y), tape-roll.
laika-plush.glb: peluche ~0.28 m de largo, sin rig.
.blend en blend/, previews 1024 px en previews/, renders de revisión en renders/.

## Cambios v03
- Coveralls: prenda holgada simulada con tela de Blender (cloth sim, 40 frames, gravedad) sobre un colisionador del cuerpo en pose A, con holgura extra en mangas/piernas y torso; la prenda reemplaza la superficie del cuerpo bajo la ropa (no hay caras ocultas ni clipping), pesos de piel del cuerpo, pliegues y costuras horneados en normal map 1024. Color azul claro de los coveralls de vuelo según fotos.
- Botas: suavizadas/infladas (sin dedos marcados en silueta lateral).
- Caras: proyección frontal de los retratos oficiales NASA 1969 (dominio público) en ojos/cejas/nariz/mejillas, alineada por 3 puntos (ojos+boca); labios procedurales para que los morphs no muestren dientes de la foto.
- Collins sin bigote (como en 1969), orejas más prominentes, entradas; Armstrong con raya a su derecha; Aldrin pelo corto claro con entradas altas; ojos azul grisáceo / marrón realista; línea de pelo suavizada.
- Comparación: renders/compare-v03-photo-vs-model.png; poses: renders/contact-v03-poses.png.

## Cambios v05
- **Cráneo:** frente más corta e inclinada hacia atrás, arco superciliar marcado, sienes, parte trasera de la cabeza con más volumen y menos altura. Ya no tiene forma de huevo (targets MakeHuman forehead/head aplicados a todos).
- **Pelo:** malla separada de hair cards (unas 850–900 tarjetas de 4 segmentos en capas, levantadas del cuero cabelludo) con textura alpha de mechones (WebP, alphaMode MASK, doble cara), rígida al hueso Head. Debajo hay una capa de color de cuero cabelludo.
  - Peinados: Armstrong con raya a su derecha, castaño claro; Aldrin corto peinado hacia atrás, claro con canas; Collins oscuro peinado hacia atrás con entradas; civil-base con raya a la izquierda.
- **Cejas:** geometría propia, una capa fina con algo de volumen.
- **Rig y clips:** normalizados para three.js (ver RIGGING.md). Test en `rig-test-output.txt`.
- **Comparación:** `renders/compare-v05-photo-vs-model.png`. Poses: `renders/contact-v05-poses.png`.

## Cambios v05 (pelo fiel a fotos)
- Pelo nuevo: groom de guías (Blender Hair Curves) → hair cards en 3 capas + línea de nacimiento rala; atlas horneado desde groom de alta resolución (albedo+alpha, normal; root-tip/ID/depth en tex/). Ver HAIR.md.
- Ajuste a fotos NASA 1969 (refs/, + armstrong-aldrin-lm-sim.jpg de perfil/espalda): largos arriba/costados/nuca, raya, entradas, color y canas (Aldrin 38 %), patillas cortas.
- Costados y nuca con pelo corto completo hasta la oreja (sin franja calva). Cráneo acortado de adelante hacia atrás (targets MakeHuman head-scale-depth-decr / head-back-scale-depth-decr).
- Cejas sólidas y más oscuras: textura de piel con ceja pintada (color propio por personaje) + tarjetas finas encima.
- Armstrong: línea de nacimiento más baja (frente menos alta). Aldrin: pelo corto plano, sin lado "frizz".
- body-normal reducido a 1024 para hacer lugar al atlas de pelo; todos los glb ≤1,5 MB.
