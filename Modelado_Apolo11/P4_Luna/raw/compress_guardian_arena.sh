#!/bin/bash
# Regla 7 + --resample false (el remuestreo con perdida movia 2-3 cm los pies/puños plantados del guardian).
cd "$(dirname "$0")/.."
for n in guardian boss-arena; do
  ~/.local/bin/gltf-transform optimize raw/$n-raw.glb glb/$n.glb --compress meshopt --texture-compress webp \
    --flatten false --join false --palette false --simplify false --prune false --instance false --resample false
done
