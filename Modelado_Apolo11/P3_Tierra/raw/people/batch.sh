#!/bin/bash
# Regenera, renderiza previews y comprime todos los civiles (una instancia de Blender a la vez; lock compartido con otros procesos)
D=/workspace/apolo11/Modelado_Apolo11/P3_Tierra; cd $D
BL="flock /tmp/blender.lock $HOME/bin/blender"
OPT="--compress meshopt --texture-compress webp --flatten false --join false --palette false --simplify false --prune false --instance false --texture-size 512"
for n in ${@:-civil-base-p3 kranz bales duke garman jan rick mark controller-extra}; do
  $BL -b -P raw/people/p3_people.py -- $n 2>&1 | grep -E "\[P3\]|Error|Trace"
  T=/tmp/p3r/final/$n; rm -rf $T
  if [ $n = controller-extra ]; then
    $BL -b blend/$n-v01.blend -P raw/people/p3_render.py -- $n $T "idle:0@front,side" "rest@front-face,side-face" "sit:30@side" "talk:40@q" 2>&1 | grep -E "Error|Traceback"
    cp $T/${n}_talk-40_q.png previews/$n-talk.png
  else
    $BL -b blend/$n-v01.blend -P raw/people/p3_render.py -- $n $T "idle:0@front,side" "walk:8@q" "rest@front-face,side-face" "sit:30@side" "sit-floor:30@front-low" 2>&1 | grep -E "Error|Traceback"
    cp $T/${n}_walk-8_q.png previews/$n-walk.png
  fi
  python3 raw/people/sheet.py previews/$n.png $T/${n}_idle-0_front.png $T/${n}_idle-0_side.png
  python3 raw/people/sheet.py previews/$n-face.png $T/${n}_rest_front-z.png $T/${n}_rest_side-z.png
  IN=raw/people/out/$n-raw.glb
  if [ $n = controller-extra ]; then node raw/people/add_variants.mjs $IN /tmp/$n-var.glb; IN=/tmp/$n-var.glb; fi
  ~/.local/bin/gltf-transform optimize $IN glb/$n.glb $OPT >/dev/null
  echo "done $n"
done
