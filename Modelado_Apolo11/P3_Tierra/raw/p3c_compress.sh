#!/bin/bash
# Comprime los glb de P3-3/P3-4 conservando nodos con nombre (empties incluidos) y materiales.
# Regla 7 (meshopt + webp) + flags para que no aplane/una/simplifique/paletee el grafo.
cd "$(dirname "$0")/.."
for n in "$@"; do
  ~/.local/bin/gltf-transform optimize raw/$n-raw.glb glb/$n.glb --compress meshopt --texture-compress webp \
    --flatten false --join false --palette false --simplify false --prune false --instance false --texture-size 512
done
