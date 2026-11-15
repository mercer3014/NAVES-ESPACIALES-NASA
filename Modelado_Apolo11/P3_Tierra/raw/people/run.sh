#!/bin/bash
# uso: run.sh nombre [shots...]
N=$1; shift; D=/workspace/apolo11/Modelado_Apolo11/P3_Tierra; R=$D/raw/people; T=/tmp/p3r/$N; mkdir -p $T
~/bin/blender -b -P $R/p3_people.py -- $N 2>&1 | grep -E "P3|Error|Traceback|line [0-9]|Heat|failed"
SH=${@:-"rest" "rest@front-face,side-face,q-face" "walk:9@front,side" "idle:30@front"}
~/bin/blender -b $D/blend/$N-v01.blend -P $R/p3_render.py -- $N $T "$@" 2>&1 | grep -E "Error|Traceback"
