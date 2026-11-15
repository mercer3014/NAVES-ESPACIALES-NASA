#!/bin/sh
# Reconstruye el astronauta: texturas + Blender + optimización (meshopt)
set -e; cd "$(dirname "$0")"
python3 gen_textures.py
blender -b -P build.py -- /tmp/astro.glb > /tmp/astro_build.log 2>&1
~/.local/bin/gltf-transform optimize /tmp/astro.glb ../../public/models/astronaut_a7l.glb --compress meshopt --palette false --join false --instance false --simplify false --prune-attributes false
