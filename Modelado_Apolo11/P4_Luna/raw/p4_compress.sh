#!/bin/bash
# Comprime los glb de P4 (raw/<n>-raw.glb -> glb/<n>.glb) con la regla 7: meshopt + webp SIN aplanar/unir/podar.
cd "$(dirname "$0")/.."
for n in "$@"; do
  ~/.local/bin/gltf-transform optimize raw/$n-raw.glb glb/$n.glb --compress meshopt --texture-compress webp \
    --flatten false --join false --palette false --simplify false --prune false --instance false --texture-size 512
done
