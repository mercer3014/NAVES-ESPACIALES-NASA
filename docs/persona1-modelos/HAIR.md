# Pelo v05: técnica de hair cards para tiempo real

## Por qué esta técnica
Los juegos en tiempo real como RDR2, TLOU Part II o los MetaHumans de Unreal (en su LOD de cards) siguen todos el mismo flujo:
1. Se peina un **groom de hebras en alta resolución**.
2. Ese groom se **hornea en un atlas** de mechones con varias texturas (albedo, alpha, depth, raíz→punta, ID por hebra y normal).
3. Se colocan **tarjetas en capas** sobre el cuero cabelludo, orientadas según la dirección del peinado.
4. Debajo se pinta un **cuero cabelludo del color del pelo**, para que no se vea calvo entre tarjetas.
5. Se usa **alpha test** (en three.js `alphaTest` / glTF `MASK`) en lugar de transparencia con orden. El orden por capas de la transparencia es caro y falla con muchas tarjetas superpuestas.

## Cómo está hecho aquí (`src/atlas.py`, `src/haircards.py`)
- **Atlas:** un groom de Blender **Hair Curves** con unas 3400 hebras en 4 regiones:
  1. base densa ancha;
  2. mechón medio;
  3. mechón fino de la capa superior;
  4. pelos sueltos para la línea de nacimiento y las cejas.

  Se hornea con Cycles en ortográfica a 512×1024, una pasada por textura: `albedo` (RGBA, raíz más oscura, variación por hebra y canas en Aldrin), `normal` (espacio tangente de la tarjeta), `roottip`, `id` y `depth`. El atlas es propio de cada personaje porque lleva su color y su proporción de canas. El groom original queda en `tex/<personaje>-hair-groom.blend` (fuera de los zips).
- **Groom de guías por astronauta:** las guías nacen en la zona del pelo y siguen un campo de dirección. Cada guía se convierte en una tarjeta de 2 o 3 segmentos que sigue la curvatura del cráneo. Las guías quedan guardadas como Hair Curves en el .blend (`<personaje>-groom-guides`).
  - Los costados y la nuca tienen pelo corto completo hasta la oreja (la exclusión de la oreja solo actúa por debajo de su borde superior).
  - Hay 3 capas (base → medio → superior) con despegue creciente del cuero cabelludo. Eso da volumen y silueta.
  - En la línea de nacimiento hay menos densidad y tarjetas finas de pelos sueltos.
  - Las normales de las tarjetas son una mezcla entre la normal del cráneo y la dirección radial. Así se iluminan como un volumen y no como tarjetas planas.
- **Ajuste a las fotos (refs/):**
  - **Armstrong** (S69-31741, flight plan, LM simulator): arriba unos 5,5 cm, peinado de costado y atrás, con la raya a su derecha. Laterales y nuca rebajados de 1,5 cm, castaño claro, patilla corta.
  - **Aldrin** (S69-31743, retrato, LM simulator de espaldas): corto en todo el cráneo (1,7 cm arriba y 0,9 cm a los lados), peinado hacia atrás. Entradas muy marcadas con un mechón central, rubio ceniza con un 38 % de canas.
  - **Collins** (S69-31742): arriba unos 4,8 cm peinado hacia atrás sin raya, laterales cortos. Entradas en las sienes, castaño muy oscuro.
  - **civil-base:** raya al costado contrario de Armstrong, castaño medio.
- **Cejas:** son sólidas y van pintadas en la textura de la piel, con un color propio de cada personaje (más oscuro que el pelo, salvo en Aldrin, que en las fotos tiene las cejas claras). La forma sigue el arco de las fotos: arranca más ancha y termina afinándose. Encima van unas 60 tarjetas finas por ceja, casi pegadas a la piel, para darles volumen. En la zona de las cejas se reduce la proyección de la foto para que no las aclare.
- **Rig:** el pelo y las cejas son rígidos al hueso `Head` (100 %). Siguen los morphs `brow-up` y `frown` por mapeo a la superficie de la cara.

## Material en three.js
El glb ya trae `alphaMode: MASK`, `alphaCutoff: 0.5` y `doubleSided: true`. Ajustes recomendados al cargar:
```js
gltf.scene.traverse(o => {
  if (o.isMesh && /hair-cards/.test(o.material.name)) {
    const m = o.material;
    m.alphaTest = 0.5;            // recorte duro: sin problemas de orden
    m.transparent = false;
    m.depthWrite = true;
    m.side = THREE.DoubleSide;
    m.alphaToCoverage = true;     // con MSAA (new WebGLRenderer({ antialias: true })) suaviza los bordes de las hebras
    m.roughness = 0.45;           // brillo de pelo; el normal map del atlas da un highlight anisótropo aproximado
    m.envMapIntensity = 0.6;
    o.renderOrder = 1;            // después del cuerpo
  }
});
```
- **Calidad alta, opcional (dos pasadas):** se clona la malla del pelo. La primera copia usa `alphaTest = 0.5` (opaca, escribe profundidad). La segunda usa `transparent: true`, `alphaTest: 0.05`, `depthWrite: false` y `renderOrder: 2`. Así las puntas quedan suaves sin errores de orden visibles.
- **Sombras:** para que las tarjetas proyecten sombras recortadas, en `castShadow` usar `customDepthMaterial = new THREE.MeshDepthMaterial({ map: m.map, alphaTest: 0.5 })`.
- **Presupuesto:** unas 3000 tarjetas (unos 6000 triángulos) más el atlas de 512×1024 (albedo+alpha y normal en WebP). Cada glb queda en 1,5 MB o menos.
