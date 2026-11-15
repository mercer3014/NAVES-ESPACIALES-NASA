# Reglas comunes (Persona 3 / Persona 4) — juego "Apolo 11: Un gran salto"
Juego: Three.js + Vite, carga .glb desde public/models con model('nombre')/modelAnim('nombre'). Copia del juego en /workspace/apolo11/game (NO modificar sus public/models; solo leer como referencia de estilo y escala).
Plan completo: /workspace/apolo11/Modelado_Apolo11/_Compartido/plan-v4.txt
Herramientas: Blender 4.2 headless en ~/bin/blender (bpy, `blender -b -P script.py`); gltf-transform en ~/.local/bin (ya instalado). Ambos ya están instalados.
Memoria del equipo limitada (~2-3 GB libres): una sola instancia de Blender a la vez por proceso, cerrar al terminar.
1) Metros reales. Modelar Z-arriba en Blender, exportar glTF "+Y Up". Frente del modelo hacia -Y en Blender (=> +Z en glTF).
2) Origen en la base del objeto (pies en personajes, suelo en salas).
3) Transformaciones aplicadas, normales correctas, sin caras internas.
4) Nombres de archivo, nodos y clips en kebab-case sin tildes.
5) Presupuesto: personaje 3-5k tris; props 100-1000; salas 8-15k (mocr ≤15k, casa ≤12k); cada glb ≤1,5 MB tras comprimir.
6) Rig solo en personajes: esqueleto compartido de _Compartido/ESQUELETO.md, ≤4 pesos/vértice normalizados, animaciones horneadas.
7) Comprimir SIN aplanar ni borrar nodos: gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --flatten false --join false --palette false --simplify false --prune false --instance false  (ver P3_Tierra/raw/p3c_compress.sh). El comando sin esas banderas borra empties npc-spot-*, une nodos y rompe la estructura.
8) Estilo: low-poly legible con PBR simple (color base + roughness/metal, como mucho 1 textura WebP 512 px), que combine con los modelos semirrealistas actuales. Fiel a fotos públicas NASA de 1969. Nada de emojis en texturas/nombres. Nada de assets con copyright: todo hecho por nosotros o CC0.
9) Entrega por modelo en P3_Tierra/: glb/<nombre>.glb (final comprimido), blend/<nombre>-v01.blend (+ script .py generador en raw/), previews/<nombre>.png (1024 px, render de Blender o captura), y una línea en P3_Tierra/INFORME.md: tris, tamaño (m), MB, huesos, clips, nodos.
10) No tocar astronaut-a7l.glb ni easep-props.glb.
